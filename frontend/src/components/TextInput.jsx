import { useState, useRef, useCallback } from "react";

export default function TextInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    textareaRef.current?.focus();
  }, [value, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="text-input">
      <textarea
        ref={textareaRef}
        className="text-input__area"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Enter to send)"
        rows={2}
        disabled={disabled}
      />
      <button
        className="text-input__send"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send"
      >
        ↑
      </button>
    </div>
  );
}
