import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { loadProgress, saveProgress, todayISO } from "../../shared/storage.js";
import { dueItems, dueCount, reviewItem } from "../../shared/srs.js";
import { DISTRICTS, districtById } from "../../shared/districts.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import { toQuestion } from "./question.js";
import { judge, reveal, announce, LOCATED, ATTEMPTS } from "./feedback.js";
import { solidThisWeek, WEEK_DAYS } from "./week.js";

// La Piazza — the review district, and design screen 18.
//
// The design calls this "the most important interaction in the app: a wrong
// answer gets *located*, never solved". Until now it was the opposite of
// that: four buttons, a red cross, and the answer handed over on the spot —
// the weakest feedback shape available, and the stated reason Le Mappe and
// Gli Articoli both stayed outside the queue rather than be answered that
// way. So this screen is rebuilt around two changes.
//
// **Production, not recognition.** Every item is typed. A grammar item
// already carries a gapped sentence and one answer, so the gap is the
// question and its authored `options` are never drawn — they become a
// feedback signal instead. A vocabulary item is asked by its English gloss,
// with its own example sentence gapped underneath as disambiguating context.
// question.js builds both.
//
// **Located, not solved.** feedback.js judges the typed answer and says where
// it went rather than what it is, the learner gets a second attempt, and only
// a spent attempt or "Show me" reveals anything.
//
// Grading stays exactly as binary as srs.js is — no ease factors, no sixth
// box. What changed is the bar: **only a first-attempt correct answer
// promotes.** A right answer on the second go came after the app told the
// learner where to look, which is scaffolding rather than retrieval, and
// "Show me" is wrong by definition. An accent left off still counts as
// correct — that is a spelling slip, not a failed recall, and typedAnswer.js
// exists to say so.
//
// Built in the La Città design system, like Le Mappe, the L'Officina hub and
// Gli Articoli. PLAN.md's open question 3 is the seam between that and the
// four older module interiors, and its answer is that a screen migrates when
// it is rebuilt, never in a blanket pass — so this screen moves and nothing
// else does.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// One spelling of the name and one copy of the blurb, taken from the tile on
// the map — a district and the door to it should not drift apart.
const PIAZZA = districtById("piazza");

// Which district an item came from, for the colour on its card. Derived from
// districts.js rather than a second table here, so a district that changes
// its accent changes this too. Every scheduled module has exactly one
// district; ReviewModule.test.jsx pins that, which is why there is no
// "no district" branch to cover.
const SOURCE = Object.fromEntries(
  DISTRICTS.filter((district) => district.module).map((district) => [district.module, district]),
);

const MODULE_LABEL = { vocab: "Vocabulary", grammar: "Grammar" };

function Eyebrow({ children, style }) {
  return (
    <span
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

function Screen({ children }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      {children}
    </div>
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
        fontSize: 13,
        padding: "6px 6px 6px 0",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
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

// "Fammelo vedere" is a deliberate second choice in the design, so it is
// drawn as one: the same shape in a quieter voice, no accent fill and no
// shadow, sitting under the primary rather than beside it.
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

// ── The landing (design screen 18) ───────────────────────────────────────

// Screen 18 is a place rather than a jump straight into a session, so La
// Piazza gets a door: what is waiting, what the district is for, and one
// derived fact about the week. The card that fact goes in is *not* the
// design's warning card — see week.js for why that sentence would be false
// here and what replaced it.
function PiazzaHome({ progress, due, onStart, onExit }) {
  const solid = solidThisWeek(progress);

  return (
    <Screen>
      <BackLink label={<span lang="it">La Citt&agrave;</span>} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The review district
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {PIAZZA.name}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55 }}>
          {PIAZZA.blurb}
        </p>
      </div>

      <div style={{ ...citySurface("pistachio"), padding: "16px", marginBottom: 14, textAlign: "center" }}>
        <p style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 600, margin: 0, lineHeight: 1 }}>{due}</p>
        <Eyebrow style={{ opacity: 0.9 }}>{due === 1 ? "item waiting" : "items waiting"}</Eyebrow>
      </div>

      {solid > 0 && (
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", marginBottom: 14 }}>
          <Eyebrow style={{ opacity: 0.85 }}>The week ahead</Eyebrow>
          <p style={{ fontFamily: SANS, fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>
            <b>
              {solid} solid {solid === 1 ? "word comes" : "words come"} back
            </b>{" "}
            in the next {WEEK_DAYS} days — the ones on their longest gap.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.9 }}>
            Nothing falls out of solid for being answered late. It is just their turn.
          </p>
        </div>
      )}

      <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 18 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>Produce &mdash; don&rsquo;t recognise</Eyebrow>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>
          You write the Italian rather than picking it out of a line-up. Get one wrong and the app says{" "}
          <i>where</i> it went, then gives it back to you — you get {ATTEMPTS} goes before it tells you anything.
        </p>
      </div>

      <PrimaryButton onClick={onStart}>
        Start the round <ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>
    </Screen>
  );
}

// Reachable from a stale map, or by finishing a round and coming back.
function NothingDue({ onExit }) {
  return (
    <Screen>
      <BackLink label={<span lang="it">La Citt&agrave;</span>} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The review district
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {PIAZZA.name}
        </h1>
      </div>

      <div style={{ ...citySurface(), padding: "18px 16px", marginBottom: 18 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>Nothing due</Eyebrow>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "8px 0 0", lineHeight: 1.55 }}>
          Everything you have studied is scheduled for a later day. Answer something in{" "}
          <span lang="it">L&rsquo;Officina</span> or <span lang="it">Il Cantiere</span> and the first ones come back
          tomorrow.
        </p>
      </div>

      <PrimaryButton onClick={onExit}>Back to the city</PrimaryButton>
    </Screen>
  );
}

// ── The item (design screen 18, the lower half) ──────────────────────────

// Every visible sentence of the verdict, as markup. The plain-text twin that
// goes to the live region is `announce()` in feedback.js — the two say the
// same things, and the module test checks a screen reader isn't told less
// than the screen shows.
function Verdict({ question, verdict }) {
  const blank = verdict.kind === "blank";
  const accent = verdict.correct ? "pistachio" : blank ? undefined : "lemon";
  const heading = verdict.correct ? "Right" : blank ? "Nothing written" : verdict.kind === "revealed" ? "Here it is" : "Not there yet";
  // The tick/cross marks something the learner wrote. An empty box and a
  // reveal are neither: AnswerMark's hidden text says "your answer,
  // incorrect", and in both of those cases there is no answer of hers to call
  // incorrect. The heading carries the state in words instead, so nothing
  // here is left to colour alone (WCAG 1.4.1).
  const marked = !blank && verdict.kind !== "revealed";

  return (
    <div style={{ ...citySurface(accent), padding: "14px 16px", marginTop: 16 }}>
      <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6, color: blank ? TOKENS.inkSoft : undefined }}>
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
              <span>
                {verdict.correct ? "Italian writes it " : "The answer is "}
                <b lang="it">{verdict.answer}</b>.
              </span>
              <SpeakButton text={verdict.answer} size={16} />
            </p>
            <p style={{ margin: 0, opacity: 0.9 }}>
              <span lang="it">{question.context.it}</span> &mdash; {question.context.en}
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

function Round({ queue, onGrade, onDone, onBack }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const { unit, q } = queue[index];
  const district = SOURCE[unit.moduleId];
  // A wrong first attempt is not the end of the item: the learner keeps the
  // located feedback and the input. Only a right answer, a spent second
  // attempt or "Show me" closes it.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  // The single grading point, and the reason the item can't be graded twice:
  // it is only ever called from a branch that also settles the item, and a
  // settled item's button advances rather than re-checking.
  const settle = (promoted) => {
    onGrade(unit.key, promoted);
    setResults((r) => [...r, { key: unit.key, promoted, recap: q.recap }]);
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

  // One button, whatever state the item is in — swapping a "Check" button for
  // a separate "Next" one would unmount the element the learner just pressed
  // and drop focus to the body, which is a keyboard user losing their place
  // every single answer.
  const submit = (event) => {
    event.preventDefault();
    if (settled) {
      advance();
      return;
    }

    const next = judge(q, input, attempt);
    setVerdict(next);

    if (next.correct || next.last) {
      // Only right first time promotes. A second-attempt correct answer came
      // after the app said where to look, and that is scaffolding.
      settle(next.correct && attempt === 1);
    } else {
      if (next.spent) setAttempt(attempt + 1);
      // Straight back into the field: the point of the second attempt is to
      // fix the word that is still sitting in it.
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
    <Screen>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <BackLink label={<span lang="it">{PIAZZA.name}</span>} onClick={onBack} />
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: TOKENS.inkSoft, margin: 0 }}>
          {unit.level.label} · {MODULE_LABEL[unit.moduleId]}
        </p>
      </div>

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {queue.length}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Attempt {attempt} of {ATTEMPTS}
        </Eyebrow>
      </div>

      <div style={{ ...citySurface(district.accent), padding: "14px 16px", marginBottom: 14 }}>
        <Eyebrow style={{ opacity: 0.85 }}>
          <span lang="it">{district.name}</span>
        </Eyebrow>

        {/* Vocabulary is asked by its English gloss; the example sentence
            underneath, with the word cut out of it, is what tells "well"
            from "good". Twelve of the 120 words can't be gapped without
            lemmatising them, and those get the gloss on its own rather than
            a wrong span cut out — see question.js. */}
        {q.gloss && (
          <p style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.25 }}>{q.gloss}</p>
        )}
        {q.cloze && (
          <p lang="it" style={{ fontFamily: SANS, fontSize: 15, margin: "10px 0 0", lineHeight: 1.5, opacity: 0.92 }}>
            {q.cloze}
          </p>
        )}

        {q.prompt && (
          <p lang="it" style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.3 }}>
            {q.prompt}
          </p>
        )}
        {q.hint && (
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.5, opacity: 0.92 }}>{q.hint}</p>
        )}
      </div>

      <form onSubmit={submit}>
        <label htmlFor={inputId} style={{ display: "block", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, marginBottom: 6 }}>
          Write it in Italian
        </label>
        <input
          id={inputId}
          ref={inputRef}
          lang="it"
          value={input}
          readOnly={settled}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={verdict !== null && !verdict.correct ? "true" : undefined}
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

        {verdict && <Verdict question={q} verdict={verdict} />}

        <PrimaryButton type="submit" style={{ marginTop: 14 }}>
          {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </form>

      {!settled && <SecondaryButton onClick={showMe}>Show me</SecondaryButton>}
    </Screen>
  );
}

// ── The end of a round ───────────────────────────────────────────────────

function Summary({ results, onBack }) {
  const promoted = results.filter((r) => r.promoted);
  const again = results.filter((r) => !r.promoted);

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <RefreshCw size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          That&rsquo;s the round
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{promoted.length}</p>
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
            {again.map(({ key, recap }) => (
              <li key={key} style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.45 }}>
                <b lang="it">{recap.primary}</b>
                <span style={{ color: TOKENS.inkSoft }}> &middot; {recap.secondary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* One flex child, not two: the button lays its children out with a
          gap, so "Back to" and the name would come out two spaces apart. */}
      <PrimaryButton onClick={onBack}>
        <span>
          Back to <span lang="it">{PIAZZA.name}</span>
        </span>
      </PrimaryButton>
    </Screen>
  );
}

// onExit returns to the city map (see src/App.jsx). Review is a route rather
// than a MODULES entry: it has no content and no progress of its own, it
// replays other districts'.
export default function ReviewModule({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const [round, setRound] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Built once, when the round starts, from storage as it is at that moment —
  // answering must not reshuffle the queue underneath you, and the landing
  // screen may have been open a while.
  const start = () => {
    setResults(null);
    setRound(dueItems(loadProgress(), todayISO()).map((unit) => ({ unit, q: toQuestion(unit) })));
  };

  const backToHome = () => {
    setRound(null);
    setResults(null);
  };

  if (results !== null) {
    return <Summary results={results} onBack={backToHome} />;
  }

  if (round !== null) {
    return (
      <Round
        queue={round}
        onBack={backToHome}
        onGrade={(key, correct) => setProgress((p) => reviewItem(p, key, correct))}
        onDone={setResults}
      />
    );
  }

  const due = dueCount(progress);
  if (due === 0) return <NothingDue onExit={onExit} />;

  return <PiazzaHome progress={progress} due={due} onStart={start} onExit={onExit} />;
}
