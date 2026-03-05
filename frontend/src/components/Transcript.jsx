/**
 * Transcript — scrollable conversation history
 */
import { useEffect, useRef } from "react";

export default function Transcript({ turns }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="transcript transcript--empty">
        <p>Your conversation with Jhurema will appear here.</p>
      </div>
    );
  }

  return (
    <div className="transcript">
      {turns.map((turn, i) => (
        <div key={i} className={`turn turn--${turn.role}`}>
          <span className="turn__label">{turn.role === "user" ? "You" : "Jhurema"}</span>
          <p className="turn__text">{turn.text}</p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
