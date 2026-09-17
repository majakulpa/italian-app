import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TOKENS } from "./theme.js";

// English is hidden by default — tap to reveal it, matching the
// tap-to-flip/tap-to-reveal pattern used elsewhere in the app (flashcards,
// listening quiz). Used by conversation bubbles/options and by story
// paragraphs. stopPropagation matters where this sits inside a larger
// clickable element (an option card).
//
// ── Why `color` is a prop ───────────────────────────────────────────────
// It used to be `TOKENS.inkSoft` unconditionally, which is a colour chosen to
// sit on paper or on a card. Le Scene's model dialogue puts this toggle on a
// *filled* city surface, and there it measured 3.92:1 against the pistachio
// bubble in the browser — an SC 1.4.3 failure at 12px. The lemon bubble was
// fine at 4.98:1, which is exactly why this had to be measured rather than
// reasoned about.
//
// So a caller on a coloured surface passes `"inherit"` and gets that surface's
// own ink, which is the pairing shared/theme.test.js already holds above 4.5:1
// for every accent. The default is unchanged, so every existing caller renders
// exactly as it did.
export default function TranslationToggle({ en, align = "left", color = TOKENS.inkSoft }) {
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
          color,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
        }}
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
        {revealed ? "Hide translation" : "Show translation"}
      </button>
      {revealed && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color, margin: "4px 0 0", textAlign: align }}>
          {en}
        </p>
      )}
    </div>
  );
}
