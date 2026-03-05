/**
 * StatusBar — one-line description of what's happening right now
 */
const messages = {
  idle:       "Initializing…",
  listening:  "Listening — speak naturally",
  processing: "Jhurema is thinking…",
  speaking:   "Jhurema is speaking…",
};

export default function StatusBar({ status, error }) {
  if (error) {
    return <div className="status-bar status-bar--error">⚠ {error}</div>;
  }
  return (
    <div className={`status-bar status-bar--${status}`}>
      {messages[status] ?? ""}
    </div>
  );
}
