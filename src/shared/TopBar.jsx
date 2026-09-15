import React from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS } from "./theme.js";

// Back button + level/label header used at the top of a study session
// (flashcards, quiz, grammar lesson/drill, ...). Jumping to a different
// module or back to the module menu from here is handled by the global
// NavMenu (see App.jsx), not this component.
//
// `label` is a node, not a string. It used to be `label.toUpperCase()`, which
// made the signature string-only and blocked the one thing a session header
// most needs: marking an Italian topic or story title `lang="it"` (WCAG
// 3.1.2). A previous change had to leave Italian unmarked here for exactly
// that reason. The uppercase treatment is CSS now, so a plain string still
// renders precisely as it did — and a screen reader gets the authored case
// rather than a shouted string, which some voices spell out letter by letter.
//
// `.citta` is for the focus ring in CITY_STYLE: the back arrow is the one
// control this bar owns, and it should be ringed in grape like every other
// control in the city.
export default function TopBar({ level, label, onBack }) {
  return (
    <div className="citta" style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={onBack}
        aria-label="Back"
        style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.ink, display: "flex", padding: 6, flexShrink: 0 }}
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </button>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: level.accentDeep,
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {level.label} · {label}
      </p>
    </div>
  );
}
