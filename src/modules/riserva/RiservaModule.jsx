import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, SR_ONLY, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { coverage, coverageBands, lexiconEvidence, heldWords } from "../../shared/coverage.js";
import { WORD_STATES } from "../../shared/wordState.js";
import { loadProgress, todayISO } from "../../shared/storage.js";
import SpeakButton from "../../shared/SpeakButton.jsx";
import { wordTraces } from "./traces.js";

// La Riserva — the reservoir made visible, and the word detail behind it.
// design/02-la-citta.html, screens 10 and 11.
//
// L'Officina's fourth workbench. It is a route inside the hub rather than a
// MODULES entry, because it has no content of its own and nothing to
// complete — the same shape as the hub itself, and as the review session.
//
// ── The quantity this screen shows, and the one it must not ─────────────
// PLAN.md settles which quantity this screen shows, under "La Riserva shows
// counts and per-band quantities", and this screen is where that ruling
// lands. The rule is about what each figure is *about*, not about its units:
//
//   Every quantity that describes the learner is a count of words — how many
//   of the 2,000 sit in each state, how many of a fascia's 200 you hold.
//   The only share-of-all-running-text on the screen is `weightPct`, what a
//   fascia is worth, which is a fact about Italian and not a claim about
//   you. `bandPct` sits between the two and says so in its own sentence: how
//   much of *that fascia's* worth you have, with the denominator written out
//   beside it.
//
// What never appears is `pct` from coverage.js — the learner's share of all
// running Italian. That is deliberate rather than an oversight. The top 100
// words alone are worth about 55% of running Italian, so a beginner who has
// learned the function words would read "55%" as "I understand half of
// Italian". That figure keeps its place on the city map and the dashboard,
// where it is labelled as a share of running text and is honestly that. A
// count out of 200 words cannot be misread as ability.
//
// ── What is not built from the design ───────────────────────────────────
// Screen 10 draws all 2,000 cells and a "Studia la fascia 3 →" button.
// Neither ships.
//
// The cells: the list is 300 of 2,000, so eight of the ten fasce are empty.
// Drawing 1,700 placeholder nodes costs DOM for nothing, and if they were
// buttons it would cost 1,700 tab stops to tell a keyboard user nothing a
// sentence doesn't tell them better. So an empty fascia states in words how
// much of it is written and what it will be worth; a part-written one draws
// its written ranks as real buttons and its unwritten ones as inert
// hairlines, aria-hidden, so the shape of the fascia stays honest without
// anything landing in the tab order that has nothing behind it.
//
// The button: nothing in the app can study a fascia. The vocabulary deck is
// organised by level and category, not by frequency rank, and there is no
// query that turns "ranks 401–600" into a session. A button that opened the
// wrong thing would be worse than no button, and benches.js's rule about
// invented figures applies to invented doors too.
//
// Screen 11 puts `/ˈkjɛː.de.re/ · verbo irregolare` under the headword.
// There is no IPA and no part of speech in src/data/fondamentale.js, and
// deriving either from the spelling would be a guess printed as a fact —
// exactly what benches.js exists to prevent. So the word detail shows the
// two glosses the data really holds and stops there. Both fields come back
// the day the data file grows them.
//
// The pink Polish card from screen 11 is not built either, for the same
// reason: it needs a per-entry note field that fondamentale.js does not have.
// It was scoped for this change and dropped when the data behind it did not
// land — a card no entry can fill is the dead `met` state of wordState.js all
// over again, a branch the app advertises and nothing can reach. PLAN.md
// carries it as outstanding work on the L'Officina chunk.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// The reservoir indexed by rank, so a cell can find its word. Ranks 1–300
// today; the map simply grows as the list does.
const BY_RANK = new Map(FONDAMENTALE.map((entry) => [entry.rank, entry]));

// Rule 4 of the city design system applied to the four word states: each
// state owns a colour and keeps it, here and in the legend. `unseen` takes
// the neutral surface rather than a colour, because "nothing here yet" is
// the absence of a state and should look like it.
//
// Colour is never the only carrier (WCAG 1.4.1): every cell's accessible
// name says the word and the state in words, and the legend pairs each
// swatch with its name and its count.
const STATE_PAINT = { unseen: null, learning: "azzurro", known: "lemon", solid: "pistachio" };

// What each cell is worth as a boundary, which is the 3:1 that SC 1.4.11
// asks of a control. Same split citySurface() makes and theme.test.js
// already checks both halves of: on a colour fill the near-black outline
// does it in light mode and the bright fill does it in dark, while a neutral
// cell has only its outline, so that one flips.
// One square, in CSS pixels. Small, and knowingly so — this is a decision
// rather than an oversight, so here is the trade.
//
// WCAG 2.2's SC 2.5.8 asks 24 CSS pixels of any pointer target. This is 15.
// The app targets WCAG 2.1 AA (see README), where there is no minimum target
// size at AA, so this sits outside the stated bar rather than under it — but
// it is a real cost to anyone with a tremor or a large fingertip and it
// should not be discovered by them.
//
// What 24px would cost: at 375px the grid has about 297px of usable width,
// which is 15 columns at this size and 10 at 24px. A fascia of 200 goes from
// 14 rows and ~266px to 20 rows and ~560px — one fascia then fills a phone
// screen on its own, and the whole reservoir roughly doubles to a 5,000px
// scroll. The screen exists to show 200 words as one block and the gradient
// forming across it; a fascia you can only see a third of at a time is not
// that screen.
//
// What softens it: no word is reachable *only* by hitting a square. Every
// square is a real button in rank order, so a keyboard or switch user
// arrives at one by moving rather than by aiming, and the fascia's own
// sentences carry the counts without anyone pressing anything. If the target
// size ever becomes the bar, the answer is a zoom or a list view beside the
// grid, not a bigger square.
const CELL_SIZE = 15;

function cellSurface(state) {
  const paint = CITY_ACCENTS[STATE_PAINT[state]];
  return {
    background: paint ? paint.fill : TOKENS.paperDeep,
    border: `1px solid ${paint ? TOKENS.cityInk : TOKENS.cityEdge}`,
    borderRadius: 3,
  };
}

const count = (n) => n.toLocaleString("en-GB");

function Eyebrow({ children, style, lang }) {
  return (
    <span
      lang={lang}
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

function Pill({ children, lang, style }) {
  return (
    <Eyebrow
      lang={lang}
      style={{
        display: "block",
        border: `2px solid ${TOKENS.controlLine}`,
        borderRadius: 999,
        padding: "3px 9px",
        whiteSpace: "nowrap",
        color: TOKENS.ink,
        ...style,
      }}
    >
      {children}
    </Eyebrow>
  );
}

// The id is for the tests, and it is the same trick the squares use: a name
// query resolves an accessible name for all 300 buttons before it can filter,
// which is tens of seconds under coverage instrumentation. One id costs
// nothing and lets a test address this control directly, then check its name
// on that one element rather than on every button to find it.
function BackLink({ label, onClick }) {
  return (
    <button
      id="riserva-back"
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

// ── The grid (design screen 10) ──────────────────────────────────────────

// One written rank. A real <button>, because it opens the word detail — the
// design's grid is a navigation surface, not a picture of one.
//
// The cell itself is a 15px square with no text in it, which is why the name
// is carried by visually-hidden content rather than by an aria-label: that
// way the Italian headword can be marked lang="it" and a screen reader says
// "essere" rather than reading it with English phonetics (SC 3.1.2). The
// rank goes in the name too, so 300 cells have 300 distinct names.
// `cellId` rather than a ref map: coming back from the word detail has to
// find one square out of 300 that were unmounted while the detail was open,
// so there is no ref to have kept. An id derived from the rank survives the
// remount, which a ref does not.
const cellId = (rank) => `riserva-posto-${rank}`;

function Cell({ entry, state, onOpen }) {
  return (
    <button
      id={cellId(entry.rank)}
      onClick={() => onOpen(entry.rank)}
      style={{
        ...cellSurface(state),
        aspectRatio: "1",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <span style={SR_ONLY}>
        <span lang="it">posto {entry.rank}</span>: <span lang="it">{entry.it}</span> — {state}
      </span>
    </button>
  );
}

// A rank inside a part-written fascia that the word list hasn't reached.
// aria-hidden and not focusable: there is no word behind it, so it is the
// shape of the fascia and nothing else. The fascia says how many of these
// there are in a sentence underneath, which is the part a screen reader
// needs.
function Placeholder() {
  return (
    <span
      aria-hidden="true"
      style={{
        aspectRatio: "1",
        borderRadius: 3,
        border: `1px dashed ${TOKENS.line}`,
      }}
    />
  );
}

function BandGrid({ band, evidence, onOpen }) {
  const ranks = [];
  for (let rank = band.from; rank <= band.to; rank += 1) ranks.push(rank);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${CELL_SIZE}px, 1fr))`,
        gap: 4,
        margin: "12px 0",
      }}
    >
      {ranks.map((rank) => {
        const entry = BY_RANK.get(rank);
        if (!entry) return <Placeholder key={rank} />;
        return <Cell key={rank} entry={entry} state={evidence.get(rank)?.state ?? "unseen"} onOpen={onOpen} />;
      })}
    </div>
  );
}

// One fascia of 200. Two quantities, both with words or coverage points as
// their denominator and neither of them the share-of-all-Italian figure:
// what these 200 are worth if you had them all (`weightPct`), and how much
// of that you have (`bandPct`, plus the raw count it comes from).
function Band({ band, index, evidence, onOpen }) {
  const size = band.to - band.from + 1;
  const held = heldWords(band.counts);

  return (
    <div style={{ ...citySurface(), padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Eyebrow lang="it" style={{ color: TOKENS.inkSoft }}>
          Fascia {index + 1} · posti {count(band.from)}–{count(band.to)}
        </Eyebrow>
        <Pill>{band.weightPct} points</Pill>
      </div>

      {/* Only the written ranks get drawn. An empty fascia is a sentence,
          not 200 empty squares — see the header comment. */}
      {band.seeded > 0 && <BandGrid band={band} evidence={evidence} onOpen={onOpen} />}

      {/* One Italian word inside an English sentence, and it can be told
          apart from its neighbours here in a way the story glosses can't —
          so it is marked (SC 3.1.2) rather than left to English phonetics. */}
      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.ink, margin: "10px 0 0", lineHeight: 1.55 }}>
        These {size} are worth {band.weightPct} coverage points. You hold {held} of them — {band.bandPct}% of what this{" "}
        <span lang="it">fascia</span> is worth.
      </p>
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: TOKENS.inkSoft, margin: "4px 0 0", lineHeight: 1.5 }}>
        {band.seeded} of {size} written into the list so far.
      </p>
    </div>
  );
}

function Legend({ counts }) {
  return (
    <ul
      style={{
        listStyle: "none",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 14px",
        padding: 0,
        margin: "0 0 18px",
      }}
    >
      {WORD_STATES.map((state) => (
        <li key={state} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true" style={{ ...cellSurface(state), width: 12, height: 12, flexShrink: 0 }} />
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: TOKENS.ink }}>
            {state} — {count(counts[state])}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RiservaGrid({ progress, evidence, onOpen, onExit, exitLabel, returnTo }) {
  const total = useMemo(() => coverage(progress), [progress]);
  const bands = useMemo(() => coverageBands(progress), [progress]);

  // Coming back from the word detail puts focus on the square it was opened
  // from, rather than dropping it on <body> in front of 300 tab stops.
  // No optional chaining on the lookup: `returnTo` only ever holds a rank
  // that was reached by pressing its square, so the square is on the screen,
  // and a guard for a case no input can produce is a branch no test can
  // honestly cover.
  useEffect(() => {
    if (returnTo) document.getElementById(cellId(returnTo.rank)).focus();
  }, [returnTo]);

  return (
    <Screen>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ margin: "18px 0 14px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The reservoir
        </Eyebrow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
            La Riserva
          </h1>
          {/* "known or better", not "known". The figure is heldWords() —
              known plus solid — and the legend directly below lists `known`
              and `solid` as two separate counts, so a pill saying "known"
              would name one population in the header and a smaller one ten
              pixels lower. Same function as the L'Officina bench badge, so
              the door and the room still cannot disagree about the number. */}
          <Pill>
            {count(heldWords(total.counts))} / {count(FONDAMENTALE_TARGET)} known or better
          </Pill>
        </div>

        {/* The design's own line, in Italian and glossed underneath — the
            learner is a beginner, and an untranslated subtitle is decoration
            rather than the course. Same treatment as the hub's. */}
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: TOKENS.ink, margin: "10px 0 0" }}>
          Le 2 000 di De Mauro, in ordine di frequenza. In alto a sinistra c'è essere.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
          De Mauro's {count(FONDAMENTALE_TARGET)} in frequency order, so the top-left corner is worth far more per square
          than the bottom-right. Tap a square for the word.
        </p>
        {/* PLAN.md's open question 2, stated on the screen it is about. This
            app does not hide its own ceilings — see the "ceiling, stated
            because it is low" note in shared/coverage.js. */}
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
          {count(FONDAMENTALE.length)} of the {count(FONDAMENTALE_TARGET)} are written so far. The{" "}
          <span lang="it">fasce</span> below draw the ranks that exist and say what the rest will be worth.
        </p>
      </div>

      <Legend counts={total.counts} />

      <div style={{ display: "grid", gap: 14 }}>
        {bands.map((band, index) => (
          <Band key={band.from} band={band} index={index} evidence={evidence} onOpen={onOpen} />
        ))}
      </div>
    </Screen>
  );
}

// ── The word detail (design screen 11) ───────────────────────────────────

// The design's "Torna fra 3 giorni", in Italian and grammatical at zero: an
// overdue or due-today item is `oggi`, not "fra 0 giorni".
//
// A schedule entry with a box and no `due` is a save written before the
// scheduler grew due dates. srs.js's isDue() reads that shape as due now —
// there is no honest answer to when it next comes round, and the safe one is
// "now" — so this reads it the same way rather than subtracting from
// undefined and rendering "fra NaN giorni".
//
// Both ends of the subtraction are anchored to UTC midnight, the same as
// todayISO() and addDaysISO() in storage.js, so a DST boundary can't turn one
// day into 23 hours and round it away.
function whenDue(due, today) {
  if (!due) return "oggi";

  const days = Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days <= 0) return "oggi";
  if (days === 1) return "fra 1 giorno";
  return `fra ${days} giorni`;
}

const TRACE_DONE = {
  deck: ["You have answered this card.", "You have not answered this card yet."],
  story: ["You have finished this story.", "You have not finished this story."],
};

// One place the app put this word in front of you. Never colour alone: what
// the learner has and hasn't done is stated in a sentence.
function Trace({ trace }) {
  return (
    <li style={{ ...citySurface(), padding: "12px 14px" }}>
      <Eyebrow style={{ color: TOKENS.inkSoft, display: "block" }}>
        {trace.level.label} · {trace.kind === "deck" ? "Vocabulary" : "Story"}
      </Eyebrow>

      {/* A category name is English ("Travel"); a story title is Italian
          ("Un giorno a Roma"), so only the second one may claim to be. */}
      <p
        lang={trace.kind === "story" ? "it" : undefined}
        style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: TOKENS.ink, margin: "6px 0 0", lineHeight: 1.3 }}
      >
        {trace.where}
      </p>

      {trace.kind === "deck" ? (
        <>
          <p lang="it" style={{ fontFamily: SERIF, fontSize: 15, color: TOKENS.ink, margin: "6px 0 0", lineHeight: 1.45 }}>
            {trace.it}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "2px 0 0", lineHeight: 1.45 }}>
            {trace.en}
          </p>
        </>
      ) : (
        /* The story's own gloss, verbatim. It is what makes a homograph
           visible: `porta` is glossed there as "takes, brings (portare)"
           and the lexicon entry is the noun. See traces.js. */
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.45 }}>
          Glossed there as “{trace.meaning}”.
        </p>
      )}

      <p style={{ fontFamily: SANS, fontSize: 12.5, color: TOKENS.inkSoft, margin: "8px 0 0" }}>
        {TRACE_DONE[trace.kind][trace.done ? 0 : 1]}
      </p>
    </li>
  );
}

function WordDetail({ entry, found, progress, onBack }) {
  const schedule = found ? progress.schedule[found.key] : undefined;
  const state = found ? found.state : "unseen";
  const traces = wordTraces(progress, entry);

  // Focus moves to the headword when the detail opens. Every other screen in
  // the app swaps without moving focus and gets away with it, because focus
  // lands on <body> and the next Tab reaches the back link. Here the next Tab
  // reaches the first of 300 squares, and a keyboard user who opened the
  // square at rank 290 would have to walk back through 289 of them. tabIndex
  // -1 makes the heading focusable without adding a tab stop.
  const heading = useRef(null);
  useEffect(() => {
    heading.current.focus();
  }, []);

  return (
    <Screen>
      <BackLink label={<span lang="it">La Riserva</span>} onClick={onBack} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, margin: "18px 0 12px" }}>
        <Pill lang="it">posto {count(entry.rank)}</Pill>
        {/* The design's "in corso · box 2". The box comes off the schedule
            entry, so a word carried over from a save written before the
            scheduler existed has a state and no box, and says only the
            state rather than inventing one. */}
        <Pill>{schedule ? `${state} · box ${schedule.box}` : state}</Pill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <h1
          ref={heading}
          tabIndex={-1}
          lang="it"
          style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}
        >
          {entry.it}
        </h1>
        <SpeakButton text={entry.it} size={20} color={TOKENS.inkSoft} />
      </div>

      <div style={{ ...citySurface(), padding: "14px 16px", margin: "14px 0" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, display: "block" }}>English</Eyebrow>
        <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: TOKENS.ink, margin: "4px 0 12px", lineHeight: 1.3 }}>
          {entry.en}
        </p>
        <Eyebrow style={{ color: TOKENS.inkSoft, display: "block" }}>Polish</Eyebrow>
        <p
          lang="pl"
          style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: TOKENS.ink, margin: "4px 0 0", lineHeight: 1.3 }}
        >
          {entry.pl}
        </p>
      </div>

      <h2 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: TOKENS.ink, margin: "18px 0 8px" }}>
        Where you met it
      </h2>

      {traces.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {/* Keyed by position. `kind:where` reads better but is not
              unique — two decks can share a category name for one lemma —
              and this list is derived fresh and never reordered, so the
              index is a stable identity for it. */}
          {traces.map((trace, i) => (
            <Trace key={`${trace.kind}-${i}`} trace={trace} />
          ))}
        </ul>
      ) : (
        /* The common answer, and it gets a sentence rather than an empty
           box. 300 lexicon entries against 120 deck words and ten stories:
           most of the list is ahead of the lessons, which is the ceiling
           coverage.js documents rather than a gap in this screen. */
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.6 }}>
          Nowhere yet. The word list runs ahead of the lessons — no deck teaches this word and no story glosses it — so
          there is nothing here the app could honestly claim you have seen.
        </p>
      )}

      {/* Nothing at all when the word has no schedule entry. There is no
          honest answer to "when does it come back" for a word that has
          never been answered. */}
      {schedule && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 18 }}>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>Next review</Eyebrow>
          <Pill lang="it">{whenDue(schedule.due, todayISO())}</Pill>
        </div>
      )}
    </Screen>
  );
}

// onExit returns to L'Officina, which is where this screen is reached from
// (see modules/officina/OfficinaModule.jsx). exitLabel is what the back link
// says, for the same reason the other benches take one.
export default function RiservaModule({ onExit, exitLabel }) {
  // Read-only: nothing on either screen writes progress, so this is loaded
  // once on mount rather than re-read. The hub re-reads on the way back, so
  // a bench that did write would still be picked up there.
  const [progress] = useState(loadProgress);
  const [openRank, setOpenRank] = useState(null);
  // A fresh object rather than the bare rank, so opening and closing the same
  // square twice running still changes the value the grid's focus effect
  // depends on. Holding the number would restore focus the first time and
  // silently not the second.
  const [returnTo, setReturnTo] = useState(null);

  const evidence = useMemo(() => lexiconEvidence(progress), [progress]);

  const back = () => {
    setReturnTo({ rank: openRank });
    setOpenRank(null);
  };

  if (openRank) {
    return (
      <WordDetail
        entry={BY_RANK.get(openRank)}
        found={evidence.get(openRank)}
        progress={progress}
        onBack={back}
      />
    );
  }

  return (
    <RiservaGrid
      progress={progress}
      evidence={evidence}
      onOpen={setOpenRank}
      onExit={onExit}
      exitLabel={exitLabel}
      returnTo={returnTo}
    />
  );
}
