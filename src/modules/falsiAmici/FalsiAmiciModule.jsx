import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { TRAP_SETS, FALSI_AMICI } from "../../data/falsiAmici.js";
import { LANG_LABELS } from "../../data/mappe.js";
import {
  loadProgress,
  saveProgress,
  markWord,
  trapKey,
  trapCaughtKey,
  isTrapCaught,
  trapsCaughtCount,
} from "../../shared/storage.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import { judge, announce, ATTEMPTS } from "./feedback.js";

// Falsi Amici — the last of L'Officina's workbenches, and the one that had
// nothing behind it until now. Le Mappe has returned a `kind: "trap"` verdict
// since the day it shipped and drawn a card for it; nothing anywhere wrote it
// down. This bench is that write, plus the collection it writes into.
//
// ── Why the whole collection is on screen from day one ──────────────────
// A bench that is empty until you make a mistake teaches nothing on the day
// you most need it, and these are worth reading *before* they catch you —
// which is the entire argument for having a false-friends list at all. So
// every trap the app knows about is here, with the ones that have caught you
// marked. Only the caught ones are counted: PLAN.md's rule is that a bench
// derives its figure from storage or says what it is waiting on, and the
// design's own card reads `12 presi` — taken, not available.
//
// ── The drill ───────────────────────────────────────────────────────────
// Prompt from the lookalike, produce the Italian, and the false friend is
// the tempting wrong answer. That is PLAN.md's retrieval rule (produce
// first, reveal last) and it is also Le Mappe's own trap-drill shape, which
// matters more than it sounds: typing the false friend here is the same
// event as typing it there, so it goes through the same key in storage.js
// and the bench cannot end up with two ideas of what has caught you.
//
// Built in the La Città design system, like Le Mappe, the hub and Gli
// Articoli. Colour carries meaning and never carries it alone: a caught trap
// is red *and* says "caught you", the same rule the drill's AnswerMark obeys.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// The document is English, so marking English text lang="en" would be noise
// on every second span. Polish and Italian have to say so (WCAG 3.1.2) —
// this screen puts all three in one sentence, twice per card.
function langAttr(lang) {
  return lang === "en" ? undefined : lang;
}

// Pink is Polish everywhere in L'Officina — the Polish road in Le Mappe, the
// anchor card in Gli Articoli — and blue is English.
const LOOKALIKE_ACCENT = { pl: "bubble", en: "azzurro" };

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

function Screen({ children }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      {children}
    </div>
  );
}

// The pair itself, in the one order that says what a false friend is: the
// Italian word, what it means, and the word it is not. Used on the
// collection card and again in the drill's verdict, so the two cannot
// disagree about which way round the meanings go.
function Pair({ trap }) {
  return (
    <>
      <b lang="it">{trap.it}</b> means {trap.means} — not{" "}
      <b lang={langAttr(trap.lookalikeLang)}>{trap.lookalike}</b>, which is {trap.lookalikeMeans}.
    </>
  );
}

// ── The collection ───────────────────────────────────────────────────────

// One trap, read rather than pressed: a card carrying the pair, why it is
// worth the space, and the word to reach for instead. It is a list item and
// not a button because nothing opens — the whole teaching surface for a
// false friend is these four lines, so there is nowhere to go.
//
// "Caught you" is a word before it is a colour. The red surface says it to
// whoever can see it; the badge says it to everyone (WCAG 1.4.1).
function TrapCard({ trap, caught }) {
  return (
    <li style={{ ...citySurface(caught ? "tomato" : undefined), padding: "14px 16px 16px" }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Eyebrow style={{ opacity: 0.85 }}>
          <span aria-hidden="true">{LANG_LABELS[trap.lookalikeLang].flag} </span>
          {LANG_LABELS[trap.lookalikeLang].name}
        </Eyebrow>
        <Eyebrow
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: caught ? undefined : TOKENS.inkSoft,
            border: `2px solid ${caught ? "currentColor" : TOKENS.controlLine}`,
            borderRadius: 999,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          {caught && <TriangleAlert size={12} aria-hidden="true" />}
          {caught ? "Caught you" : "Not yet"}
        </Eyebrow>
      </span>

      <p
        style={{
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.55,
          margin: "10px 0 0",
          color: caught ? undefined : TOKENS.ink,
        }}
      >
        <Pair trap={trap} />
      </p>
      <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, margin: "6px 0 0", opacity: 0.92 }}>{trap.note}</p>
      <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, margin: "6px 0 0", opacity: 0.92 }}>
        Reach for <b lang="it">{trap.say.it}</b> instead.
      </p>
    </li>
  );
}

function FalsiAmiciHome({ progress, onPractise, onExit, exitLabel }) {
  const caught = trapsCaughtCount(progress, FALSI_AMICI);

  return (
    <Screen>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          <span lang="it">L&rsquo;Officina</span>
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Falsi Amici
        </h1>
        {/* The Italian line, glossed underneath — the learner is a beginner,
            and an untranslated subtitle is decoration rather than the course.
            Same treatment as the hub's and Gli Articoli's. */}
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontStyle: "italic", color: TOKENS.ink, margin: "8px 0 0" }}>
          La parola giusta, il senso sbagliato.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
          The right word with the wrong meaning. {caught} of {FALSI_AMICI.length} have caught you so far — the rest are here
          to be read before they get the chance.
        </p>
      </div>

      {TRAP_SETS.map((set) => (
        <section key={set.id} style={{ marginBottom: 26 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: TOKENS.ink, margin: "0 0 6px" }}>{set.name}</h2>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 14px", lineHeight: 1.55 }}>
            {set.blurb}
          </p>

          <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: 12 }}>
            {set.traps.map((trap) => (
              <TrapCard key={trap.id} trap={trap} caught={isTrapCaught(progress, trap)} />
            ))}
          </ul>

          <PrimaryButton onClick={() => onPractise(set)}>
            Practise these {set.traps.length} <ArrowRight size={16} aria-hidden="true" />
          </PrimaryButton>
        </section>
      ))}
    </Screen>
  );
}

// ── The header on a set's own screens ────────────────────────────────────

function SetBar({ set, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <BackLink label="Falsi Amici" onClick={onBack} />
      <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: TOKENS.inkSoft, margin: 0 }}>{set.name}</p>
    </div>
  );
}

// ── The drill ────────────────────────────────────────────────────────────

// Every visible sentence of the verdict, as markup. The plain-text twin that
// goes to the live region is `announce()` in feedback.js — the two say the
// same things, and the module test checks a screen reader isn't told less
// than the screen shows.
function Verdict({ trap, verdict }) {
  const accent = verdict.correct ? "pistachio" : verdict.kind === "trap" ? "tomato" : "lemon";

  return (
    <div style={{ ...citySurface(accent), padding: "14px 16px", marginTop: 16 }}>
      <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
        <AnswerMark state={verdict.correct ? "correct" : "incorrect"} size={14} />
        {verdict.correct ? "Right" : "Not there yet"}
      </Eyebrow>

      <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, display: "grid", gap: 6, marginTop: 8 }}>
        {verdict.kind === "trap" && (
          <>
            <p style={{ margin: 0 }}>
              That is the trap itself. <Pair trap={trap} />
            </p>
            <p style={{ margin: 0 }}>{trap.note}</p>
          </>
        )}

        {verdict.shared && (
          <p style={{ margin: 0 }}>
            You have <b lang="it">{verdict.shared}</b> right; it goes wrong after that.
          </p>
        )}

        {verdict.answer && (
          <p style={{ margin: 0 }}>
            {verdict.correct ? "Italian writes it " : "The answer is "}
            <b lang="it">{verdict.answer}</b> — {trap.say.en}.
          </p>
        )}

        {!verdict.correct && !verdict.last && <p style={{ margin: 0 }}>Have another go — you get one more.</p>}
      </div>
    </div>
  );
}

function Drill({ set, onBack, onDone, onGrade, onCaught }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [hit, setHit] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const trap = set.traps[index];
  // A wrong first attempt is not the end of the item: the learner gets the
  // located feedback and the field back. Only a right answer or a spent
  // second attempt closes it.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  const advance = () => {
    if (index + 1 >= set.traps.length) {
      onDone(results);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setAttempt(1);
    setHit(false);
    setVerdict(null);
  };

  // One button, whatever state the item is in — swapping "Check" for a
  // separate "Next" would unmount the element the learner just pressed and
  // drop focus to the body, which is a keyboard user losing their place on
  // every answer. Same reasoning as Le Mappe's.
  const submit = (event) => {
    event.preventDefault();
    if (settled) {
      advance();
      return;
    }
    if (input.trim() === "") return;

    const next = judge(trap, input, attempt);
    setVerdict(next);

    // The write this whole bench exists for, and it happens the moment the
    // false friend is typed rather than when the item closes: walking into
    // it on the first attempt and recovering on the second is still having
    // walked into it.
    const caught = hit || next.kind === "trap";
    if (next.kind === "trap") {
      setHit(true);
      onCaught(trap);
    }

    if (next.correct || next.last) {
      // Right first time is "known", anything that needed a second look is
      // "learning" — the same bar Le Mappe, Gli Articoli and the grammar
      // drill use, so the four cards mean the same thing. Deliberately not
      // the same fact as `caught`: this one says you can produce the word,
      // and that one says the trap has had you. See storage.js.
      const dodged = next.correct && attempt === 1;
      onGrade(trapKey(trap), dodged ? "known" : "learning");
      setResults((r) => [...r, { trap, dodged, caught }]);
    } else {
      setAttempt(attempt + 1);
      // Straight back into the field: the point of the second attempt is to
      // replace the word still sitting in it.
      inputRef.current.focus();
    }
  };

  const buttonLabel = () => {
    if (!settled) return "Check";
    return index + 1 >= set.traps.length ? "See how it went" : "Next";
  };

  return (
    <Screen>
      <SetBar set={set} onBack={onBack} />

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {set.traps.length}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Attempt {attempt} of {ATTEMPTS}
        </Eyebrow>
      </div>

      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 12px" }}>
        Write the Italian for this. The word that looks like it is the one thing it is not.
      </p>

      <div style={{ ...citySurface(LOOKALIKE_ACCENT[trap.lookalikeLang]), padding: "14px 16px", marginBottom: 14 }}>
        <Eyebrow style={{ opacity: 0.85 }}>
          <span aria-hidden="true">{LANG_LABELS[trap.lookalikeLang].flag} </span>
          {LANG_LABELS[trap.lookalikeLang].name}
        </Eyebrow>
        <p
          lang={langAttr(trap.lookalikeLang)}
          style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: "6px 0 0" }}
        >
          {trap.lookalike}
        </p>
        {/* The meaning, never the Italian. Without it `droga` is ambiguous in
            Polish on its own, and guessing which sense was meant is not the
            thing being tested. */}
        <p style={{ fontFamily: SANS, fontSize: 13, margin: "6px 0 0", opacity: 0.9 }}>{trap.lookalikeMeans}</p>
      </div>

      <form onSubmit={submit}>
        <label
          htmlFor={inputId}
          style={{ display: "block", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, marginBottom: 6 }}
        >
          <span aria-hidden="true">{LANG_LABELS.it.flag} </span>Write it in Italian
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

        {verdict && <Verdict trap={trap} verdict={verdict} />}

        <PrimaryButton type="submit" style={{ marginTop: 14 }}>
          {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </form>
    </Screen>
  );
}

// ── The end of a run ─────────────────────────────────────────────────────

function Summary({ set, results, onBack, onAgain }) {
  const dodged = results.filter((r) => r.dodged);
  const slipped = results.filter((r) => !r.dodged);
  const caught = results.filter((r) => r.caught);

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <TriangleAlert size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          {set.name} — that&rsquo;s the run
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{dodged.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>dodged</Eyebrow>
        </div>
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{slipped.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>revealed</Eyebrow>
        </div>
      </div>

      {caught.length > 0 && (
        <div style={{ ...citySurface("tomato"), padding: "14px 16px", marginBottom: 20 }}>
          <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
            <TriangleAlert size={13} aria-hidden="true" /> These ones caught you
          </Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {caught.map(({ trap }) => (
              <li key={trap.id} style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.45 }}>
                <Pair trap={trap} />
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
            They are marked on the collection now, and they stay marked.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <PrimaryButton onClick={onAgain}>Run it again</PrimaryButton>
        <PrimaryButton
          onClick={onBack}
          style={{ background: TOKENS.card, color: TOKENS.ink, border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}` }}
        >
          Back to the collection
        </PrimaryButton>
      </div>
    </Screen>
  );
}

// Two ways in, so two things `onExit` can mean: L'Officina's hub opens this
// as a child of itself and comes back to the workshop, and the NavMenu opens
// it at the top level and comes back to the city. `exitLabel` is how the back
// link says which of the two it is about to do. Same shape as Le Mappe's.
export default function FalsiAmiciModule({ onExit, exitLabel = "All modules" }) {
  const [progress, setProgress] = useState(loadProgress);
  const [session, setSession] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // markWord rather than reviewItem: this bench is outside the Leitner
  // queue, and the reasoning is written down beside `scheduled: false` in
  // shared/stats.js, because that flag is where anyone would look for it.
  const onGrade = (key, status) => setProgress((p) => markWord(p, key, status));
  const onCaught = (trap) => onGrade(trapCaughtKey(trap), "learning");

  if (session === null) {
    return (
      <FalsiAmiciHome
        progress={progress}
        onExit={onExit}
        exitLabel={exitLabel}
        onPractise={(set) => setSession({ set, mode: "drill" })}
      />
    );
  }

  const back = () => setSession(null);

  if (session.mode === "drill") {
    return (
      <Drill
        set={session.set}
        onBack={back}
        onGrade={onGrade}
        onCaught={onCaught}
        onDone={(results) => setSession({ ...session, mode: "summary", results })}
      />
    );
  }

  return (
    <Summary
      set={session.set}
      results={session.results}
      onBack={back}
      onAgain={() => setSession({ set: session.set, mode: "drill" })}
    />
  );
}
