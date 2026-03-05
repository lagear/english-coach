/**
 * useCoach — core logic hook
 * VAD is loaded from CDN as window.vad (avoids Vite/ONNX bundling issues)
 * States: idle | listening | processing | speaking
 */
import { useState, useRef, useCallback, useEffect } from "react";

export function useCoach() {
  const [status, setStatus]         = useState("idle");
  const [transcript, setTranscript] = useState([]);
  const [error, setError]           = useState(null);
  const audioQueueRef   = useRef([]);
  const isPlayingRef    = useRef(false);
  const currentAudioRef = useRef(null); // tracks the currently playing Audio element
  const vadRef          = useRef(null);
  const statusRef       = useRef(status);
  const processingRef   = useRef(false); // guard against concurrent VAD triggers

  // Keep statusRef in sync so VAD callbacks can read latest value
  useEffect(() => { statusRef.current = status; }, [status]);

  // ---------- Audio playback queue ----------
  const playNext = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentAudioRef.current = null;
      setStatus("listening");
      return;
    }
    isPlayingRef.current = true;
    setStatus("speaking");
    const blob = audioQueueRef.current.shift();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      playNext();
    };
    audio.play().catch(console.error);
  }, []);

  const enqueueAudio = useCallback((base64str) => {
    const bytes = Uint8Array.from(atob(base64str), (c) => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "audio/wav" });
    audioQueueRef.current.push(blob);
    if (!isPlayingRef.current) playNext();
  }, [playNext]);

  // ---------- Stop speaking ----------
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.onended = null; // prevent playNext from firing
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current  = false;
    setStatus("listening");
  }, []);

  // ---------- Send audio to backend ----------
  const processAudio = useCallback(async (float32Audio) => {
    // Drop the call if a request is already in flight
    if (processingRef.current) return;
    processingRef.current = true;
    setStatus("processing");
    setError(null);

    try {
      const wav = float32ToWav(float32Audio, 16000);
      const form = new FormData();
      form.append("audio", new Blob([wav], { type: "audio/wav" }), "speech.wav");

      const res = await fetch("/process", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "transcript") {
            setTranscript((prev) => [...prev, { role: "user", text: event.text }]);
          }
          if (event.type === "tts_chunk") {
            enqueueAudio(event.audio);
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", text: last.text + " " + event.text }];
              }
              return [...prev, { role: "assistant", text: event.text }];
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus("listening");
    } finally {
      processingRef.current = false;
    }
  }, [enqueueAudio]);

  // ---------- Init VAD from CDN global window.vad ----------
  useEffect(() => {
    let cancelled = false;

    async function initVAD() {
      let attempts = 0;
      while (!window.vad && attempts < 20) {
        await new Promise((r) => setTimeout(r, 200));
        attempts++;
      }
      if (!window.vad) {
        setError("VAD failed to load from CDN. Check your internet connection.");
        return;
      }
      if (cancelled) return;

      try {
        const micVAD = await window.vad.MicVAD.new({
          baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
          onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
          onSpeechStart: () => {
            if (statusRef.current !== "speaking") setStatus("listening");
          },
          onSpeechEnd: (audio) => {
            if (statusRef.current === "speaking") return;
            processAudio(audio);
          },
          positiveSpeechThreshold: 0.6,
          negativeSpeechThreshold: 0.35,
          minSpeechFrames: 4,
          redemptionFrames: 10,
        });

        if (cancelled) return;
        vadRef.current = micVAD;
        micVAD.start();
        setStatus("listening");
      } catch (err) {
        console.error("VAD init error:", err);
        setError("Microphone access denied or VAD failed to start.");
      }
    }

    initVAD();
    return () => {
      cancelled = true;
      vadRef.current?.pause();
    };
  }, [processAudio]);

  // ---------- Reset ----------
  const reset = useCallback(async () => {
    stopSpeaking();
    processingRef.current = false;
    setTranscript([]);
    setError(null);
    setStatus("listening");
    await fetch("/reset", { method: "POST" });
  }, [stopSpeaking]);

  return { status, transcript, error, reset, stopSpeaking };
}

// ---------- WAV encoder (PCM 16-bit mono) ----------
function float32ToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view   = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
