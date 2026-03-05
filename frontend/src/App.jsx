import { useCoach } from "./hooks/useCoach";
import VoiceOrb   from "./components/VoiceOrb";
import Transcript  from "./components/Transcript";
import StatusBar   from "./components/StatusBar";

export default function App() {
  const { status, transcript, error, reset, stopSpeaking } = useCoach();

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
        {status === "speaking" && (
          <button className="btn-stop" onClick={stopSpeaking}>
            ■ Stop
          </button>
        )}
        <button className="btn-reset" onClick={reset}>
          New conversation
        </button>
      </footer>
    </div>
  );
}
