/**
 * VoiceOrb — animated circle that reflects the current conversation state
 * idle → dim pulse | listening → green glow | processing → spinning | speaking → wave
 */
export default function VoiceOrb({ status }) {
  const states = {
    idle:       { label: "●",  color: "#334155", glow: "none" },
    listening:  { label: "◉",  color: "#00e5a0", glow: "0 0 32px #00e5a044" },
    processing: { label: "◌",  color: "#3b82f6", glow: "0 0 32px #3b82f644" },
    speaking:   { label: "◎",  color: "#f59e0b", glow: "0 0 48px #f59e0b66" },
  };

  const s = states[status] ?? states.idle;

  return (
    <div
      className={`orb orb--${status}`}
      style={{ "--orb-color": s.color, "--orb-glow": s.glow }}
    >
      <span className="orb__icon">{s.label}</span>
    </div>
  );
}
