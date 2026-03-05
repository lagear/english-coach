import { useCoach } from "./hooks/useCoach";
import VoiceOrb   from "./components/VoiceOrb";
import Transcript  from "./components/Transcript";
import StatusBar   from "./components/StatusBar";
import TextInput   from "./components/TextInput";

export default function App() {
  const { status, transcript, error, reset, stopSpeaking, sendText } = useCoach();
  const busy = status === "processing" || status === "speaking";

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">English Coach</h1>
        <p className="app__subtitle">Speak naturally. Jhurema will respond.</p>
      </header>

      <main className="app__main">
        <VoiceOrb status={status} />
        <StatusBar status={status} error={error} />
        <Transcript turns={transcript} />
      </main>

      <footer className="app__footer">
        <TextInput onSend={sendText} disabled={busy} />
        <div className="app__footer-actions">
          {status === "speaking" && (
            <button className="btn-stop" onClick={stopSpeaking}>
              &#9632; Stop
            </button>
          )}
          <button className="btn-reset" onClick={reset}>
            New conversation
          </button>
        </div>
      </footer>
    </div>
  );
}
