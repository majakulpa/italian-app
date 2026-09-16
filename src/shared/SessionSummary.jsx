import React, { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface, tint } from "./theme.js";

// End-of-session results screen shared by every drill-style module (vocab
// quiz, grammar drill, ...). `missed` items are rendered as
// "<strong>primary</strong> — secondary" (e.g. the Italian word/answer and
// its translation/explanation).
//
// La Città: the same end-of-session shape La Riserva's and La Piazza's
// summaries already draw — a pistachio tally for what landed, a lemon one for
// what is coming back, a neutral city surface for the list, and a pistachio
// primary button — so a session ends the same way in every district.
//
// The tallies used to be painted in TOKENS.malachite and TOKENS.corallo as
// *text* on the card. Those are fill accents, and theme.js's rule is never to
// pair text with one: in dark mode both came to 2.50:1 on the card, under the
// 3:1 even 30px text needs. On a city fill they take the fill's own ink, the
// pairing theme.test.js holds at 4.5:1, and every text node inside sets that
// ink explicitly rather than inheriting it — see the La Riserva legend note
// in README.md for why an inherited colour is not trusted here.
const TALLY = { padding: "14px 16px", flex: 1, minWidth: 0 };
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
  // One optional sentence under the tallies, for a session with an outcome
  // neither tally is for — the grammar drill's items above the learner's
  // stage, which were neither right nor to review.
  note,
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
    <div className="citta" style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: tint(level.accent, 16),
            border: `${CITY_RULES.border}px solid ${level.accentDeep}`,
            boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: level.accentDeep,
          }}
        >
          <Trophy size={28} aria-hidden="true" />
        </div>
      </div>
      <h2
        ref={titleRef}
        tabIndex={-1}
        style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "0 0 22px" }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: note ? 14 : 28 }}>
        <div style={{ ...citySurface("pistachio"), ...TALLY }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: CITY_ACCENTS.pistachio.ink, margin: 0 }}>{primary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: CITY_ACCENTS.pistachio.ink, margin: "4px 0 0" }}>{primaryLabel}</p>
        </div>
        <div style={{ ...citySurface("lemon"), ...TALLY }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: CITY_ACCENTS.lemon.ink, margin: 0 }}>{secondary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: CITY_ACCENTS.lemon.ink, margin: "4px 0 0" }}>{secondaryLabel}</p>
        </div>
      </div>

      {note && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 28px", lineHeight: 1.5 }}>
          {note}
        </p>
      )}

      {missed && missed.length > 0 && (
        <div style={{ ...citySurface(), textAlign: "left", padding: "16px 20px", marginBottom: 28 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: TOKENS.inkSoft, margin: "0 0 10px", letterSpacing: 1.6, textTransform: "uppercase" }}>
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
          border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
          boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
          background: CITY_ACCENTS.pistachio.fill,
          color: CITY_ACCENTS.pistachio.ink,
          borderRadius: CITY_RULES.radius,
          padding: "13px 26px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {backLabel}
      </button>
    </div>
  );
}
