import React, { useId, useRef, useState } from "react";
import { ArrowRight, Sprout } from "lucide-react";
import { TOKENS, CITY_RULES, citySurface } from "../../shared/theme.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import Verdict from "../../shared/Verdict.jsx";
import Microphone from "../../shared/Microphone.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import { judge, reveal, announce, answered, ATTEMPTS } from "../../shared/locatedFeedback.js";
import { PHASES, rehearsalQuestion } from "./scene.js";
import { Card, Eyebrow, PhaseHeading, PhaseMeter, PrimaryButton, SANS, SERIF } from "./chrome.jsx";

// Phase 3 — Prova (design/02-la-citta.html, screen 04).
//
// The grammar slice, the Polish card where the scene has one, and then "Dillo
// tu": an English prompt, and the learner says or types the Italian. Nothing
// on this screen needs a network or a key — which is the point of it being
// phase 3 rather than part of the task.
//
// ── The Polish card is conditional, and that is the design's own rule ───
// Screen 04's caption: the pink card "appears only where Polish gives you a
// real hook". Scene 2 is `polish: null` on purpose (see data/scenes.js), so
// this screen renders two cards there and three elsewhere. Drawing an empty
// pink card, or filling it with `mogę + bezokolicznik`, would both break the
// promise the card makes by existing.
//
// ── How an answer is judged (plan S5) ───────────────────────────────────
// Three things, all of them fixes for the same class of unfairness — the app
// marking right Italian wrong:
//
//   the transcript is editable   The microphone writes into the same box the
//                                learner types in, and nothing is judged
//                                until she presses Check. A recognition
//                                error is therefore never her mistake; she
//                                can see it and fix it first.
//   the nearest answer wins      `judge` takes one answer and a rehearsal
//                                item has a set of accepted forms. The one
//                                nearest what she wrote is chosen first, so
//                                "cento grammi di formaggio" is exact rather
//                                than a located error against "un etto".
//   no "different entry"         The `neighbour` verdict is suppressed here.
//                                See rehearsalQuestion in scene.js.
//
// ── What this screen does not write ─────────────────────────────────────
// Nothing. The scene's words were banked when Ascolta finished, and a
// rehearsal item is not a unit any MODULE_STATS entry enumerates — so there
// is no key to grade it against, and inventing one would put a figure on the
// dashboard that nothing else in the app can read back. Whether producing an
// item here should promote the word it contains is plan question A, still
// open; it is a change to what `scene:` keys mean, not a change to this
// screen.

function Examples({ grammar }) {
  return (
    <Card eyebrow="Lo schema" eyebrowLang="it" accent="azzurro">
      <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.6 }}>
        {grammar.title}
      </p>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
        {grammar.examples.map((example) => (
          <li key={example.it} style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <b lang="it">{example.it}</b>
              <SpeakButton text={example.it} size={15} />
            </span>
            <span style={{ opacity: 0.9 }}>{example.en}</span>
          </li>
        ))}
      </ul>
      <p lang="it" style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
        {grammar.note}
      </p>
    </Card>
  );
}

// The design's pink card. `transfers` and `differs` are separate fields
// because the card's whole claim is that it says which half carries over —
// a single paragraph would let the two blur, which is how a "Polish helps
// here" card turns into a "Polish is similar" card.
function PolishCard({ polish }) {
  return (
    <Card eyebrow="Lo sai già" eyebrowLang="it" accent="bubble">
      <p lang="it" style={{ fontFamily: SANS, fontSize: 14, margin: "8px 0 0", lineHeight: 1.6 }}>
        {polish.it}
      </p>
      <p lang="pl" style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, margin: "8px 0 0" }}>
        {polish.pl}
      </p>
      <p lang="it" style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
        {polish.transfers}
      </p>
      <p lang="it" style={{ fontFamily: SANS, fontSize: 13, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
        {polish.differs}
      </p>
    </Card>
  );
}

export default function SceneRehearse({ scene, banked, headingRef, onDone }) {
  const inputId = useId();
  const verdictId = useId();
  const inputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [verdict, setVerdict] = useState(null);

  const item = scene.rehearsal[index];
  const question = rehearsalQuestion(item, input);
  const settled = verdict !== null && (verdict.correct || verdict.last);
  const last = index + 1 >= scene.rehearsal.length;

  const submit = (event) => {
    event.preventDefault();

    if (settled) {
      if (last) {
        onDone();
        return;
      }
      setIndex(index + 1);
      setInput("");
      setAttempt(1);
      setVerdict(null);
      return;
    }

    const next = judge(question, input, attempt);
    setVerdict(next);
    if (!next.correct && !next.last) {
      if (next.spent) setAttempt(attempt + 1);
      // One button whatever state the item is in — the same rule La Riserva's
      // round states: swapping Check for a separate Next would unmount the
      // element just pressed and drop focus to the body. So the only focus
      // move needed is back into the box after a wrong answer, where the
      // learner's next keystroke belongs.
      inputRef.current.focus();
    }
  };

  const buttonLabel = () => {
    if (settled) return last ? "Sono pronta" : "Avanti";
    return attempt === 1 ? "Check" : "Check again";
  };

  return (
    <>
      <PhaseMeter phase={PHASES[2]} />
      <PhaseHeading headingRef={headingRef} it="Prova" en="Take the pieces apart, then say them back." />

      {/* What finishing Ascolta actually banked. Rendered only when something
          was written, and counting the keys the write returned rather than the
          words on the screen — a scene replayed banks nothing, and a banner
          reading "+6 parole" on the second run would be the design's drawn
          figure by another route. */}
      {banked.length > 0 && (
        <div style={{ ...citySurface("pistachio"), padding: "11px 14px", display: "flex", gap: 8, marginBottom: 14 }}>
          <Sprout size={17} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: SANS, fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
            <b>
              +{banked.length} <span lang="it">parole</span>
            </b>{" "}
            went into <span lang="it">La Piazza</span>. They come back tomorrow.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        <Examples grammar={scene.grammar} />
        {scene.grammar.polish && <PolishCard polish={scene.grammar.polish} />}
      </div>

      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ ...citySurface(), padding: "14px 16px 16px", marginTop: 18 }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <Eyebrow lang="it" style={{ color: TOKENS.inkSoft }}>
            Dillo tu
          </Eyebrow>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>
            {index + 1} / {scene.rehearsal.length} &middot; attempt {attempt} of {ATTEMPTS}
          </Eyebrow>
        </span>

        <form onSubmit={submit}>
          <label
            htmlFor={inputId}
            style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: TOKENS.ink, margin: "10px 0 10px", lineHeight: 1.3 }}
          >
            {/* The English prompt *is* the label, so the box is named by the
                thing it is asking for rather than by a generic instruction. */}
            &ldquo;{item.en}&rdquo;
          </label>
          <input
            id={inputId}
            ref={inputRef}
            lang="it"
            value={input}
            readOnly={settled}
            onChange={(e) => setInput(e.target.value)}
            aria-invalid={verdict !== null && !verdict.correct && answered(verdict) ? "true" : undefined}
            aria-describedby={verdict !== null ? verdictId : undefined}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontFamily: SERIF,
              fontSize: 19,
              fontWeight: 600,
              color: TOKENS.ink,
              background: TOKENS.card,
              border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
              borderRadius: CITY_RULES.radius,
              padding: "12px 14px",
            }}
          />

          {/* The microphone writes here and nowhere else, which is what makes
              the transcript editable: it is the same box, and nothing is
              judged until Check. Switched off once the item is settled, so a
              held button cannot overwrite an answer that has been marked. */}
          <Microphone onTranscript={setInput} disabled={settled} />

          {verdict && <Verdict id={verdictId} context={question.context} verdict={verdict} />}

          <PrimaryButton type="submit" accent="lemon" style={{ marginTop: 14 }}>
            {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
          </PrimaryButton>
        </form>

        {!settled && (
          <button
            type="button"
            onClick={() => setVerdict(reveal(question))}
            style={{
              border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
              borderRadius: CITY_RULES.radius,
              background: "transparent",
              color: TOKENS.ink,
              padding: "11px 18px",
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "block",
              width: "100%",
              marginTop: 10,
            }}
          >
            Show me
          </button>
        )}
      </div>
    </>
  );
}
