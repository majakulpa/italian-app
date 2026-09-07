import React from "react";
import { TOKENS, citySurface } from "./theme.js";
import AnswerMark from "./AnswerMark.jsx";
import SpeakButton from "./SpeakButton.jsx";
import { LOCATED, fullStopAfter, answered } from "./locatedFeedback.js";

// The card that renders one verdict from shared/locatedFeedback.js.
//
// It is here rather than inside a screen because two screens now render the
// same verdict data through the same judge: La Piazza's review round and La
// Riserva's fascia drill. The other three benches — Mappatura delle parole,
// Gli Articoli, Falsi Amici — keep their own markup, and that is not an
// inconsistency: each of those judges against something else (a suffix rule,
// two categorical dimensions, a trap) and produces verdict fields this card
// knows nothing about. What is shared here is exactly what shares a judge.
//
// The verdicts stay data rather than sentences, for the reason
// locatedFeedback.js gives: these messages put Italian fragments inside
// English prose and one string can only claim one language (WCAG 3.1.2). The
// exception is LOCATED, which is pure English and is therefore rendered
// verbatim rather than copied into JSX where it could drift from the twin
// that announce() speaks.

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'Inter', sans-serif";

// The third copy of this component, and it takes `...rest` for the same
// reason the two in modules/riserva do: nothing here passes `lang` today, and
// a signature that silently eats one is a trap the next caller falls into
// without a single test going red.
function Eyebrow({ children, style, ...rest }) {
  return (
    <span
      {...rest}
      style={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// `context` is what the answer arrives inside once the item is settled: the
// sentence with its gap closed for a grammar or vocabulary item, and for a
// lexicon word — which has no sentence anywhere in the file — where it sits in
// the reservoir. Both are `{ it, en }`, and the Italian half carries the tag.
export default function Verdict({ id, context, verdict }) {
  const blank = verdict.kind === "blank";
  const accent = verdict.correct ? "pistachio" : blank ? undefined : "lemon";
  const heading = verdict.correct
    ? "Right"
    : blank
      ? "Nothing written"
      : verdict.kind === "revealed"
        ? "Here it is"
        : "Not there yet";
  // AnswerMark's hidden text says "your answer, incorrect", so it is drawn
  // only where there is an answer of hers to call that — see answered(). The
  // heading carries the state in words instead, so nothing here is left to
  // colour alone (WCAG 1.4.1).
  const marked = answered(verdict);

  return (
    <div id={id} style={{ ...citySurface(accent), padding: "14px 16px", marginTop: 16 }}>
      <Eyebrow
        style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6, color: blank ? TOKENS.inkSoft : undefined }}
      >
        {marked && <AnswerMark state={verdict.correct ? "correct" : "incorrect"} size={14} />}
        {heading}
      </Eyebrow>

      <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, display: "grid", gap: 6, marginTop: 8 }}>
        {/* The located sentence, rendered from the very strings announce()
            speaks. Correct answers and the reveal have nothing to locate. */}
        {LOCATED[verdict.kind] && <p style={{ margin: 0 }}>{LOCATED[verdict.kind]}</p>}

        {verdict.shared && (
          <p style={{ margin: 0 }}>
            You have <b lang="it">{verdict.shared}</b> right.
          </p>
        )}

        {verdict.tail && (
          <p style={{ margin: 0 }}>
            Both end <b lang="it">{verdict.tail}</b>.
          </p>
        )}

        {verdict.correct && !verdict.answer && <p style={{ margin: 0 }}>That is the one.</p>}

        {verdict.answer && (
          <>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {/* The full stop is conditional because an answer can bring its
                  own: `come stai?` is a vocabulary entry, and "The answer is
                  come stai?." reads as a typo. fullStopAfter is shared with
                  announce() so the card and the live region agree. */}
              <span>
                {verdict.correct ? "Italian writes it " : "The answer is "}
                <b lang="it">{verdict.answer}</b>
                {fullStopAfter(verdict.answer)}
              </span>
              <SpeakButton text={verdict.answer} size={16} />
            </p>
            <p style={{ margin: 0, opacity: 0.9 }}>
              <span lang="it">{context.it}</span> &mdash; {context.en}
            </p>
          </>
        )}

        {!verdict.correct && !verdict.last && !blank && (
          <p style={{ margin: 0 }}>Have another go &mdash; you get one more.</p>
        )}
      </div>
    </div>
  );
}
