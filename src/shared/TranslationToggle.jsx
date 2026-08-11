import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TOKENS } from "./theme.js";

// English is hidden by default — tap to reveal it, matching the
// tap-to-flip/tap-to-reveal pattern used elsewhere in the app (flashcards,
// listening quiz). Used by conversation bubbles/options and by story
// paragraphs. stopPropagation matters where this sits inside a larger
// clickable element (an option card).
export default function TranslationToggle({ en, align = "left" }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setRevealed((r) => !r);
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: TOKENS.inkSoft,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
        }}
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
        {revealed ? "Hide translation" : "Show translation"}
      </button>
      {revealed && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0", textAlign: align }}>
          {en}
        </p>
      )}
    </div>
  );
}
