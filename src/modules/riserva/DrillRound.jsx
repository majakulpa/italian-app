import React, { useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Grid3x3 } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import Verdict from "../../shared/Verdict.jsx";
import { judge, reveal, announce, answered, ATTEMPTS } from "../../shared/locatedFeedback.js";
import { lexiconQuestion } from "./drill.js";

// La Riserva's drill: the reservoir, one word at a time.
//
// Every cell on the grid used to be a picture. This is the verb — a *fascia*
// opens onto a typed production round over the entries it holds, gloss →
// Italian, and the answers go through reviewItem() like every other graded
// answer in the app, so a word met here is in the Leitner queue and in the
// coverage figure by the same write.
//
// ── What is reused and what is not ──────────────────────────────────────
// The judging is shared/locatedFeedback.js — the same judge La Piazza uses,
// moved out of modules/review when this became its second caller — and the
// verdict card is shared/Verdict.jsx, because two screens rendering one
// verdict shape from one judge should not hold two copies of the markup.
// What is *not* shared is this screen: benches compose their own, the way
// Mappatura delle parole, Gli Articoli and Falsi Amici all do.
//
// ── Both glosses ────────────────────────────────────────────────────────
// English and Polish, every sense, verbatim. modules/riserva/drill.js carries
// the argument; the short version is that the file cannot say which Polish
// sense is primary and that in this direction a split is extra evidence for
// one Italian answer rather than ambiguity between two.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// `...rest` is load-bearing rather than tidiness. Two of the callers below
// pass `lang="it"`, and a signature of ({ children, style }) drops it on the
// floor: the JSX says the string is Italian, the DOM says nothing, and
// nothing goes red — axe cannot tell what language a string is in. That is
// exactly what shipped, and a11y.test.jsx now asserts the tag arrives.
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

function BackLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: TOKENS.inkSoft,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SANS,
        fontSize: 14,
        padding: "6px 2px",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

function PrimaryButton({ children, onClick, type = "button", style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
        borderRadius: CITY_RULES.radius,
        boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
        background: CITY_ACCENTS.pistachio.fill,
        color: CITY_ACCENTS.pistachio.ink,
        padding: "13px 18px",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// The quieter twin, for "Show me" — a deliberate second choice in the design,
// drawn as one here the same way La Piazza draws it.
function SecondaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      {children}
    </button>
  );
}

// The Italian heading for a band. Built here rather than read off the fascia
// because the fascia's own `label` is English — it has to be, since La Piazza
// prints it in a line of English prose that marks no spans. This screen can
// carry `lang="it"`, so it says it in Italian — and every caller of this has
// to hand the tag to an element that actually renders it, which is what the
// `...rest` on <Eyebrow> above is for and what a11y.test.jsx checks.
export function fasciaLabel(fascia) {
  return `Fascia ${fascia.ordinal} · posti ${fascia.from}–${fascia.to}`;
}

// ── One item ─────────────────────────────────────────────────────────────

export default function DrillRound({ fascia, queue, onGrade, onDone, onBack }) {
  const inputId = useId();
  const verdictId = useId();
  const inputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const entry = queue[index];
  const q = lexiconQuestion(entry);
  // A wrong first attempt is not the end of the item: the learner keeps the
  // located feedback and the input. Only a right answer, a spent second
  // attempt or "Show me" closes it.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  const settle = (promoted) => {
    onGrade(entry, promoted);
    setResults((r) => [...r, { entry, promoted }]);
  };

  const advance = () => {
    if (index + 1 >= queue.length) {
      onDone(results);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setAttempt(1);
    setVerdict(null);
  };

  // One button whatever state the item is in, for the reason La Piazza gives:
  // swapping a "Check" for a separate "Next" unmounts the element the learner
  // just pressed and drops focus to the body.
  const submit = (event) => {
    event.preventDefault();
    if (settled) {
      advance();
      return;
    }

    const next = judge(q, input, attempt);
    setVerdict(next);

    if (next.correct || next.last) {
      // Only right first time promotes — the same bar La Piazza sets. A
      // correct second attempt came after the app said where to look.
      settle(next.correct && attempt === 1);
    } else {
      if (next.spent) setAttempt(attempt + 1);
      inputRef.current.focus();
    }
  };

  const showMe = () => {
    setVerdict(reveal(q));
    settle(false);
  };

  const buttonLabel = () => {
    if (settled) return index + 1 >= queue.length ? "See how it went" : "Next";
    return attempt === 1 ? "Check" : "Check again";
  };

  return (
    <>
      <BackLink label={<span lang="it">La Riserva</span>} onClick={onBack} />

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 10px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }} lang="it">
          {fasciaLabel(fascia)}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {queue.length}
        </Eyebrow>
      </div>

      <div style={{ ...citySurface("pistachio"), padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <Eyebrow style={{ opacity: 0.9 }} lang="it">
            posto {q.rank}
          </Eyebrow>
          <Eyebrow style={{ opacity: 0.9 }}>
            Attempt {attempt} of {ATTEMPTS}
          </Eyebrow>
        </div>

        <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.25 }}>{q.gloss}</p>
        <p lang="pl" style={{ fontFamily: SANS, fontSize: 16, margin: "8px 0 0", lineHeight: 1.5, opacity: 0.92 }}>
          {q.glossPl}
        </p>

        {/* Where Polish divides the word, said rather than hidden — and said
            as the reassurance it is in this direction. WordDetail's pink card
            makes the same point at length ("going this way you choose, and
            coming back you do not"); here it only has to stop two Polish
            words reading as two questions. */}
        {q.splits && (
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "8px 0 0", lineHeight: 1.5, opacity: 0.9 }}>
            Polish uses more than one word here. They all point at the same Italian one.
          </p>
        )}
      </div>

      <form onSubmit={submit}>
        <label
          htmlFor={inputId}
          style={{ display: "block", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "14px 0 6px" }}
        >
          Write it in Italian
        </label>
        {/* aria-invalid marks something the learner wrote that is wrong, so it
            follows answered() rather than "not correct": a blank box and a
            reveal are verdicts about an empty field. aria-describedby hangs
            the verdict card off the field, so returning to the input after a
            wrong answer reads back *where* it went. */}
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
            fontSize: 20,
            fontWeight: 600,
            color: TOKENS.ink,
            background: TOKENS.card,
            border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
            borderRadius: CITY_RULES.radius,
            padding: "12px 14px",
          }}
        />

        {verdict && <Verdict id={verdictId} context={q.context} verdict={verdict} />}

        <PrimaryButton type="submit" style={{ marginTop: 14 }}>
          {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </form>

      {!settled && <SecondaryButton onClick={showMe}>Show me</SecondaryButton>}
    </>
  );
}

// ── The end of a round ───────────────────────────────────────────────────

// No percentage, per PLAN.md's settled decision about this screen: counts and
// what the band is worth, never a share drawn as progress. What the round
// *did* change is stated as the thing it is — words that landed first time
// and words that are coming back.
export function DrillSummary({ fascia, results, onBack }) {
  const landed = results.filter((r) => r.promoted);
  const again = results.filter((r) => !r.promoted);

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Grid3x3 size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          That&rsquo;s the round
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0" }} lang="it">
          {fasciaLabel(fascia)}
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{landed.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>right first time</Eyebrow>
        </div>
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{again.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>coming back</Eyebrow>
        </div>
      </div>

      {again.length > 0 && (
        <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 20 }}>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>Worth another look</Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {again.map(({ entry }) => (
              <li key={entry.rank} style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.45 }}>
                <b lang="it">{entry.it}</b>
                <span style={{ color: TOKENS.inkSoft }}> &middot; {entry.en}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 18 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>Where they went</Eyebrow>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>
          Every one of these is in the queue now. <span lang="it">La Piazza</span> is what brings them back — this bench
          only ever meets a word for the first time.
        </p>
      </div>

      <PrimaryButton onClick={onBack}>
        <span>
          Back to <span lang="it">La Riserva</span>
        </span>
      </PrimaryButton>
    </>
  );
}
