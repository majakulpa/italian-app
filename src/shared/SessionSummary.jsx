import React, { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { TOKENS, tint } from "./theme.js";

// End-of-session results screen shared by every drill-style module (vocab
// quiz, grammar drill, ...). `missed` items are rendered as
// "<strong>primary</strong> — secondary" (e.g. the Italian word/answer and
// its translation/explanation).
export default function SessionSummary({
  level,
  title,
  primary,
  primaryLabel,
  secondary,
  secondaryLabel,
  missed,
  // The bold half of each missed row is Italian in every session that has
  // one today — a vocab word, a filled-in grammar sentence, a dialogue reply,
  // a story's comprehension answer (those are Italian at every level,
  // A1 included; this comment used to claim otherwise and the stories module
  // shipped its rows unmarked on the strength of it). It stays a prop rather
  // than becoming `lang="it"` here because a summary of English rows is a
  // thing a future caller can legitimately want, and mislabelling English as
  // Italian is the same defect in the other direction (WCAG 3.1.2).
  missedLang,
  missedHeading = "TO REVIEW",
  backLabel = "Back",
  onBack,
}) {
  const titleRef = useRef(null);

  // Every module reaches this screen by pressing a button that this screen
  // then unmounts, which drops focus to <body> — the learner is at the top
  // of the document with no idea the session ended. Focus goes to the title,
  // the one node that says what happened. Mount-only: nothing on this screen
  // changes afterwards.
  useEffect(() => {
    titleRef.current.focus();
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: tint(level.accent, 16),
            border: `1.5px solid ${level.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: level.accentDeep,
          }}
        >
          <Trophy size={28} />
        </div>
      </div>
      <h2
        ref={titleRef}
        tabIndex={-1}
        style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "0 0 22px" }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 22px", minWidth: 120 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: TOKENS.malachite, margin: 0 }}>{primary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>{primaryLabel}</p>
        </div>
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 22px", minWidth: 120 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: TOKENS.corallo, margin: 0 }}>{secondary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>{secondaryLabel}</p>
        </div>
      </div>

      {missed && missed.length > 0 && (
        <div style={{ textAlign: "left", background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: TOKENS.inkSoft, margin: "0 0 10px", letterSpacing: 1 }}>
            {missedHeading}
          </p>
          {missed.map((item) => (
            <p key={item.id} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.ink, margin: "0 0 6px" }}>
              <strong lang={missedLang}>{item.primary}</strong> — {item.secondary}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        style={{
          border: "none",
          background: TOKENS.ink,
          color: TOKENS.paper,
          borderRadius: 10,
          padding: "13px 26px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {backLabel}
      </button>
    </div>
  );
}
