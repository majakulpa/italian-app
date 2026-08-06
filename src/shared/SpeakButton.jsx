import React, { useState } from "react";
import { Volume2 } from "lucide-react";
import { isSpeechSupported, speakItalian } from "./speech.js";

// Small speaker button that reads Italian text aloud. Drop it next to any
// Italian word or sentence. Safe to render even where speech isn't
// supported — it just renders nothing.
export default function SpeakButton({ text, size = 17, color = "currentColor", style }) {
  const [speaking, setSpeaking] = useState(false);

  if (!isSpeechSupported()) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    speakItalian(text);
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Pronounce "${text}"`}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        opacity: speaking ? 1 : 0.75,
        transform: speaking ? "scale(1.15)" : "scale(1)",
        transition: "transform 0.15s, opacity 0.15s",
        flexShrink: 0,
        ...style,
      }}
    >
      <Volume2 size={size} />
    </button>
  );
}
