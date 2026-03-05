# 🎙 English Coach

A local voice-based English coaching app powered by open-source AI.
No cloud. No subscriptions. Runs 100% on your Mac.

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| STT      | faster-whisper (large-v3)         |
| LLM      | Ollama + llama3.1:70b             |
| TTS      | Kokoro neural TTS (kokoro-onnx)   |
| VAD      | @ricky0123/vad-web (Silero)       |
| Backend  | FastAPI + Python                  |
| Frontend | React + Vite                      |

## Prerequisites

- macOS (Apple Silicon recommended, 64GB RAM)
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) installed

## Setup

### 1. Start Ollama manually
```bash
ollama serve
# In another tab:
ollama pull llama3.1:70b
```

### 2. Backend

> **Note:** Python 3.12+ on macOS blocks global `pip install` with an `externally-managed-environment` error. Use a virtual environment instead:

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (prompt will show (venv) prefix)
pip install -r requirements.txt

# Start the server
uvicorn app:app --reload --port 8000
```

⚠️ Every time you open a new terminal for the backend, activate the venv first:
```bash
cd ~/Desktop/english-coach/backend
source venv/bin/activate
uvicorn app:app --reload --port 8000
```

To deactivate when done: `deactivate`

### 3. Kokoro TTS model files

Download the model files once into the `backend/` folder (~300MB total):

```bash
cd ~/Desktop/english-coach/backend
curl -L "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx" -o kokoro-v1.0.onnx
curl -L "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin" -o voices-v1.0.bin
```

Also install the system dependency for phonemization:
```bash
brew install espeak-ng
```

Available American English voices: `af_heart`, `af_bella`, `af_nicole`, `af_sarah`, `af_sky`.
Change via `TTS_VOICE=` in `.env`.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in Chrome or Safari.

## Usage

1. Allow microphone access when prompted
2. Just speak naturally — VAD detects your voice automatically
3. Jhurema (your English coach) responds with voice + transcript
4. Grammar corrections and vocabulary tips appear inline

## Configuration

All settings live in `backend/.env`:

| Variable            | Current value         | Description                           | RAM needed  |
|---------------------|-----------------------|---------------------------------------|-------------|
| `OLLAMA_MODEL`      | `llama3.1:70b`        | Any model available in Ollama         | ~40 GB      |
| `WHISPER_MODEL`     | `large-v3`            | Whisper model size                    | ~3 GB       |
| `WHISPER_DEVICE`    | `cpu`                 | `cpu` or `cuda`                       | —           |
| `TTS_ENGINE`        | `kokoro`              | `kokoro` or `macos`                   | ~300 MB     |
| `TTS_VOICE`         | `af_heart`            | Kokoro voice name                     | —           |
| `HISTORY_TURNS`     | `10`                  | Conversation turns to keep in context | —           |
| `PROMPT_FILE`       | `./prompt.txt`        | Path to system prompt file            | —           |

**RAM reference by Ollama model size:**

| Model              | RAM needed | Recommended for           |
|--------------------|------------|---------------------------|
| `llama3.1:8b`      | ~6 GB      | 16 GB Mac                 |
| `llama3.1:70b`     | ~40 GB     | 64 GB Mac ✅ (current)    |
| `qwen2.5:72b`      | ~42 GB     | 64 GB Mac (alternative)   |
| `llama3.1:405b`    | ~230 GB    | Mac Studio (192 GB+)      |

**RAM reference by Whisper model:**

| Model          | RAM needed | Notes                          |
|----------------|------------|--------------------------------|
| `tiny.en`      | ~150 MB    | Fast, lower accuracy           |
| `base.en`      | ~300 MB    | Good for quiet environments    |
| `medium.en`    | ~1.5 GB    | Good balance                   |
| `large-v3`     | ~3 GB      | Best accuracy ✅ (current)     |

To customize Jhurema's behavior, edit `backend/prompt.txt` and restart the backend.

## Troubleshooting

### `externally-managed-environment` when running `pip install`

Python 3.12+ on macOS blocks global pip installs. Use a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### `pkg-config is required for building PyAV` when running `pip install`

`faster-whisper` depends on `PyAV` which requires `ffmpeg` and `pkg-config` to build. Install them via Homebrew:

```bash
brew install pkg-config ffmpeg
```

Then retry:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### `no member named 'nb_side_data' in 'struct AVStream'` build error

`PyAV 12.x` is incompatible with `ffmpeg 7.x` (the default Homebrew version). Fix by explicitly installing `av>=13.0` first, then retrying:

```bash
pip install "av>=13.0"
pip install -r requirements.txt
```

`requirements.txt` already pins `av>=13.0` to prevent this on fresh installs.

### Kokoro: `RuntimeError: espeak not installed on your system`

Install espeak-ng via Homebrew:

```bash
brew install espeak-ng
```

### Kokoro: model files not found on startup

The backend will log `Kokoro model files not found — falling back to macOS 'say'` and use the built-in voice instead. Run the download commands in the **Setup › Kokoro TTS model files** section above.

---

## Frontend Troubleshooting

### `Dynamic require of "onnxruntime-web/wasm" is not supported`

**Root cause:** `@ricky0123/vad-react` (the npm package) uses CommonJS `require()` internally, which Vite cannot transform when bundling `onnxruntime-web`. This is a fundamental incompatibility between the VAD npm package and Vite's ES module pipeline.

**Fix:** Do not install `@ricky0123/vad-react` or `@ricky0123/vad-web` via npm. Instead, load the VAD bundle via a local `<script>` tag, which exposes `window.vad` as a global. The ONNX/WASM assets are then fetched from the CDN at runtime using `baseAssetPath` and `onnxWASMBasePath` options.

`index.html`:
```html
<!-- ONNX runtime must load before VAD bundle -->
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.wasm.min.js"></script>
<!-- VAD bundle served locally -->
<script src="/bundle.min.js"></script>
```

Download `bundle.min.js` into `frontend/public/`:
```bash
cd ~/Desktop/english-coach/frontend/public
curl -L "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/bundle.min.js" -o bundle.min.js
curl -L "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/vad.worklet.bundle.min.js" -o vad.worklet.bundle.min.js
```

`package.json` should only contain React and Vite — no VAD packages:
```json
"dependencies": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

In `useCoach.js`, call `window.vad.MicVAD.new()` with explicit CDN paths:
```js
const micVAD = await window.vad.MicVAD.new({
  baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
  onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
  // ...callbacks
});
```

---

### `Failed to load url /ort-wasm-simd-threaded.mjs` (Vite pre-transform error)

**Root cause:** Vite tried to pre-bundle the `.mjs` WASM file as a regular JS module, which it cannot do — WASM files must be served as static assets.

**Fix:** Do not add WASM or `.mjs` files to `index.html` as `<script>` tags. Only load `ort.wasm.min.js` (the full runtime) and `bundle.min.js` (the VAD bundle). The WASM runtime resolves its own internal `.mjs` files at runtime via the `onnxWASMBasePath` CDN path — they never need to be served locally or referenced in HTML.

---

### `protobuf parsing failed` / `Can't create a session ERROR_CODE: 7`

**Root cause:** The ONNX model file was downloaded with the wrong filename. Version `0.0.29` of `@ricky0123/vad-web` expects two model files: `silero_vad_v5.onnx` and `silero_vad_legacy.onnx`. Downloading the file as `silero_vad.onnx` causes a parse failure because the bundle looks for the versioned filenames.

**Fix:** Do not download ONNX files locally. Set `baseAssetPath` to the CDN URL so the bundle fetches the correct filenames automatically:
```js
baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
```

If you previously downloaded incorrect files into `public/`, remove them:
```bash
cd ~/Desktop/english-coach/frontend/public
rm -f *.onnx *.wasm *.mjs
```

Only these two files are needed locally in `public/`:
- `bundle.min.js` — the VAD script loaded via `<script>` tag
- `vad.worklet.bundle.min.js` — the audio worklet loaded internally by the bundle

All other assets (ONNX models, WASM files) are fetched from the CDN at runtime.

---

## Project Structure

```
english-coach/
├── backend/
│   ├── app.py              # FastAPI server (STT + LLM + TTS + injection defense)
│   ├── requirements.txt    # Python dependencies
│   ├── prompt.txt          # System prompt — edit to customize Jhurema
│   └── .env                # Environment variables (gitignored)
└── frontend/
    ├── src/
    │   ├── App.jsx                    # Root component + state machine
    │   ├── main.jsx                   # Entry point
    │   ├── index.css                  # Global styles
    │   ├── hooks/
    │   │   └── useCoach.js            # VAD → API → audio playback
    │   └── components/
    │       ├── VoiceOrb.jsx           # Animated mic visualizer
    │       ├── Transcript.jsx         # Conversation history
    │       └── StatusBar.jsx          # Current state indicator
    ├── index.html
    ├── vite.config.js      # Proxy /process → :8000
    └── package.json
```
