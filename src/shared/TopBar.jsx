import React from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS } from "./theme.js";

// Back button + level/label header used at the top of a study session
// (flashcards, quiz, grammar lesson/drill, ...).
export default function TopBar({ level, label, onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={onBack}
        aria-label="Back"
        style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.ink, display: "flex", padding: 6 }}
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: level.accentDeep, margin: 0, letterSpacing: 1 }}>
          {level.label} · {label.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
