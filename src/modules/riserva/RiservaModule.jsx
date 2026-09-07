import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TOKENS, SR_ONLY, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET, BAND_SIZE, FASCE } from "../../data/fondamentale.js";
import { lexiconEvidence, coverageBands } from "../../shared/coverage.js";
import { WORD_STATES } from "../../shared/wordState.js";
import { loadProgress, saveProgress, riservaKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";
import WordDetail from "./WordDetail.jsx";
import DrillRound, { DrillSummary, fasciaLabel } from "./DrillRound.jsx";
import { drillRound, unmetCount, ROUND_SIZE } from "./drill.js";

// La Riserva — L'Officina's grid of the 2,000, and design screen 10.
//
// The reservoir made physical: one cell per word of De Mauro's base
// vocabulary, in frequency order, `essere` in the top-left corner. Frequency
// order is what makes the picture worth drawing — the top-left cells are worth
// hundreds of times more running text than the bottom-right ones, so the
// gradient that forms as you learn is the shape of your own progress and not
// a bar filling up.
//
// ── The one number this screen may not show ─────────────────────────────
// A percentage. PLAN.md settles it under "Coverage is never shown as a
// percentage of ability": a share of running text reads like a share of the
// language, and the two diverge worst exactly where a beginner is standing.
// A learner with a hundred words has 54.5% coverage and cannot read a menu;
// both halves are true and only the second is about her.
//
// So this screen shows what it can defend: how many of the 2,000 she holds,
// and what each *fascia* of 200 is worth in coverage points — which is what
// the design already draws ("queste 200 da sole valgono 4,3 punti"). The
// percentage stays on the city map, where it is labelled as a share of running
// text rather than as progress.
//
// ── The screen has a verb now ───────────────────────────────────────────
// It did not, and that was the ceiling on the whole app: coverage learned a
// word was known from one place, the vocabulary deck, and only 20 of its 120
// words are in the base 2,000 — so a fully-mastered account read 1.6% and
// could not read more. Every cell here was a picture of a word there was no
// way to study.
//
// A *fascia* is the door, which PLAN.md settled for word detail and which is
// the same answer here. Opening a band offers a typed production round over
// the entries it holds — gloss in English and Polish, you write the Italian —
// judged by shared/locatedFeedback.js and graded through reviewItem(), so a
// word met here is in the Leitner queue and in the coverage figure by the
// same write. See drill.js for what one round is and why, and DrillRound.jsx
// for the screen.
//
// ── Why the grid is not 2,000 buttons ───────────────────────────────────
// The design draws cells you could imagine tapping, and a word detail screen
// (design 11) is the obvious thing behind one. Two thousand focusable controls
// is not a tab order, it is a trap — a keyboard user would need two thousand
// presses to cross this screen — and there is no word detail screen built yet
// for them to open. So the grid is a picture: the cells are aria-hidden and
// the same facts are given as text, and the *fasce* underneath are the ten
// real controls. When word detail lands it wants a route in that is not
// "press one of two thousand things".
//
// ── Seeded is not the same as unseen ────────────────────────────────────
// The lexicon is 300 entries of a 2,000 target (PLAN.md, the open question on
// the size of the lexicon), so
// most ranks have no word behind them yet. A rank nobody has written down
// cannot be unseen — "unseen" is a claim about the learner and this is a claim
// about the file — so the grid draws those differently and says so. It makes
// the honest shape of the list visible instead of implying 1,700 words the
// learner has merely failed to learn.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// Weakest to strongest, then the ranks with nothing behind them. Order is
// WORD_STATES' own, so a fifth state added there shows up here rather than
// silently vanishing from the legend.
const STATE_PAINT = {
  unseen: { fill: TOKENS.controlLine, label: "not started" },
  learning: { fill: TOKENS.viola, label: "in corso" },
  known: { fill: TOKENS.limoncello, label: "nota" },
  solid: { fill: TOKENS.malachite, label: "solida" },
};

// A rank with no word behind it has to *recede*, and the first version of this
// got it exactly backwards: it drew the empty ranks as a hollow square with a
// hairline and the real ones as a dark fill, so at 7px the 1,700 words nobody
// has written down read brighter than the 300 that exist. Both states are
// solid fills now and no borders.
//
// `unseen` is painted with controlLine rather than line, and the reason is a
// contrast one rather than a taste one. This grid is a graphical object you
// have to be able to read to understand the screen, so WCAG 1.4.11's 3:1
// applies to the difference between a rank that exists and one that does not.
// `line` is a decorative hairline and manages 1.20:1 against paperDeep in the
// light theme — the distinction was there in the DOM and invisible on the
// screen. controlLine is the token that already promises 3:1 on every surface.
const EMPTY_FILL = TOKENS.paperDeep;

// `...rest` carries the `lang="it"` a Band passes for its Italian heading.
// See DrillRound.jsx's twin for why a component that quietly swallows that
// prop is worse than an obviously missing tag: the JSX reads correct, the DOM
// is wrong, and no axe rule can tell the difference.
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

function Screen({ children }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      {children}
    </div>
  );
}

// One cell per rank. Presentational: the states are given as text below, so a
// screen reader gets the same facts without two thousand list items.
function Grid({ states, seeded }) {
  const cells = [];

  for (let rank = 1; rank <= FONDAMENTALE_TARGET; rank += 1) {
    const has = seeded.has(rank);
    const state = states.get(rank) ?? "unseen";
    cells.push(
      <span
        key={rank}
        data-rank={rank}
        data-state={has ? state : "empty"}
        style={{
          background: has ? STATE_PAINT[state].fill : EMPTY_FILL,
          borderRadius: 1,
          aspectRatio: "1",
        }}
      />,
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(40, 1fr)",
        gap: 2,
        margin: "14px 0 16px",
      }}
    >
      {cells}
    </div>
  );
}

// A legend swatch has to clear two different bars, and the first version of
// this only cleared one. In the grid, `unseen` and `empty` sit next to each
// other, so what matters is the contrast *between* them — that is the 3:1 the
// controlLine fix bought. Down here each swatch sits alone on the page, and
// the bar is contrast against that ground: measured in the browser, `in corso`
// came out at 2.24 and `not written down yet` at 1.16, which is a colour you
// cannot see at all.
//
// So every swatch carries a hairline ring that clears 3:1 on its own. The fill
// still carries the mapping back to the grid; the ring guarantees the shape is
// perceivable whatever the fill does. The label beside it is what actually
// names the state — colour is never the only channel here — so the ring only
// has to make the swatch visible, not tell two of them apart.
function Swatch({ fill }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 12,
        height: 12,
        borderRadius: 3,
        background: fill,
        border: `1px solid ${TOKENS.controlLine}`,
        flex: "none",
      }}
    />
  );
}

// `color` is explicit, and that is the whole point of it being here. Nothing
// up this tree sets one — the screen frame paints a background and no text
// colour — so a row without this inherits the browser default, which is black.
// Black is 18.6:1 on the light ground and 1.27:1 on the dark one, so the
// legend simply vanished in the dark theme while every arithmetic check
// passed: the tokens were fine, there was just no token being used.
//
// jsdom cannot catch this. It computes no cascade for inherited colour, so the
// axe pass sees nothing wrong and the suite stays green. It was found by
// measuring the rendered page in a browser, which is the only place this class
// of bug is visible at all.
const LEGEND_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: SANS,
  fontSize: 13,
  color: TOKENS.ink,
};

function Legend({ counts, empty }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
      {WORD_STATES.map((state) => (
        <li key={state} style={{ ...LEGEND_ROW }}>
          <Swatch fill={STATE_PAINT[state].fill} />
          <span lang="it">{STATE_PAINT[state].label}</span>
          <b>{counts[state]}</b>
        </li>
      ))}
      <li style={{ ...LEGEND_ROW }}>
        <Swatch fill={EMPTY_FILL} />
        not written down yet
        <b>{empty}</b>
      </li>
    </ul>
  );
}

// One fascia. `weightPct` is what the band is worth to somebody who knows all
// of it — the design's "queste 200 da sole valgono 4,3 punti" — and not how
// much of it the learner has, which is a different number and the one a bar
// drawn here would be mistaken for. See coverage.js's tally() on why the three
// percentages must not be swapped.
function Band({ band, fascia, index, unmet, selected, onSelect, onOpenWord, onDrill }) {
  const words = FONDAMENTALE.filter((e) => e.rank >= band.from && e.rank <= band.to);
  const label = fasciaLabel(fascia);

  return (
    <li>
      <button
        onClick={() => onSelect(selected ? null : index)}
        aria-expanded={selected}
        style={{
          ...citySurface(selected ? "pistachio" : undefined),
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          padding: "12px 14px",
          borderRadius: CITY_RULES.radius,
          display: "grid",
          gap: 4,
        }}
      >
        <Eyebrow lang="it">{label}</Eyebrow>
        <span style={{ fontFamily: SANS, fontSize: 13 }}>
          worth <b>{band.weightPct}</b> coverage points · <b>{band.seeded}</b> of {BAND_SIZE} written down
        </span>
      </button>

      {selected && (
        <div style={{ padding: "10px 14px 2px", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft }}>
          {/* The verb, and the rule that a band of empty ranks must not
              present as a drill of nothing: a band with no word written down
              offers no round, and a band whose words have all been met says
              so rather than opening an empty one. Both are true sentences
              about different subjects — the file, and the learner. */}
          {words.length > 0 &&
            (unmet > 0 ? (
              <button
                onClick={() => onDrill(fascia)}
                style={{
                  border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
                  borderRadius: CITY_RULES.radius,
                  boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
                  background: CITY_ACCENTS.pistachio.fill,
                  color: CITY_ACCENTS.pistachio.ink,
                  padding: "11px 16px",
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  marginBottom: 12,
                }}
              >
                Drill the next {Math.min(unmet, ROUND_SIZE)} words
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <p style={{ margin: "0 0 12px", lineHeight: 1.6, color: TOKENS.ink }}>
                You have met every word written down in this band.{" "}
                <span lang="it">La Piazza</span> is where they come back.
              </p>
            ))}

          {words.length > 0 && unmet > 0 && (
            <p style={{ margin: "-4px 0 12px", lineHeight: 1.6 }}>
              {unmet} of the {words.length} written down here are still to meet.
            </p>
          )}

          {words.length > 0 ? (
            // The answer to word detail's way in. Two hundred at most, and
            // only once a band is opened — so a keyboard user reaches a word
            // in two presses and a band's worth of arrows, instead of
            // crossing a two-thousand-cell grid.
            <p style={{ margin: 0, lineHeight: 1.9 }}>
              {words.map((e, i) => (
                <React.Fragment key={e.rank}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <button
                    lang="it"
                    onClick={() => onOpenWord(e)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      font: "inherit",
                      color: TOKENS.ink,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    {e.it}
                  </button>
                </React.Fragment>
              ))}
            </p>
          ) : (
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Nothing in this band is written down yet. The list is {FONDAMENTALE.length} of{" "}
              {FONDAMENTALE_TARGET.toLocaleString("en-GB")}, and these ranks are waiting on it.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function RiservaModule({ onExit, exitLabel = "All modules" }) {
  const [progress, setProgress] = useState(loadProgress);
  const [open, setOpen] = useState(null);
  const [word, setWord] = useState(null);
  const [round, setRound] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Built once, when the round starts, from storage as it is at that moment —
  // answering must not reshuffle the queue underneath you, and the same
  // argument La Piazza makes applies here: the band list may have been open a
  // while.
  const startDrill = (fascia) => {
    setResults(null);
    setRound({ fascia, queue: drillRound(loadProgress(), fascia) });
  };

  const backToBands = () => {
    setRound(null);
    setResults(null);
  };

  if (results !== null) {
    return (
      <Screen>
        <DrillSummary fascia={round.fascia} results={results} onBack={backToBands} />
      </Screen>
    );
  }

  if (round !== null) {
    return (
      <Screen>
        <DrillRound
          fascia={round.fascia}
          queue={round.queue}
          onBack={backToBands}
          onGrade={(entry, correct) => setProgress((p) => reviewItem(p, riservaKey(entry), correct))}
          onDone={setResults}
        />
      </Screen>
    );
  }

  const evidence = lexiconEvidence(progress);
  const states = new Map([...evidence].map(([rank, e]) => [rank, e.state]));
  const bands = coverageBands(progress);
  const seeded = new Set(FONDAMENTALE.map((e) => e.rank));

  // Counted over the seeded ranks only, for the same reason the grid draws
  // them differently: a rank with no word behind it is not a word the learner
  // has failed to meet.
  const counts = Object.fromEntries(WORD_STATES.map((s) => [s, 0]));
  for (const rank of seeded) counts[states.get(rank) ?? "unseen"] += 1;

  const held = WORD_STATES.filter((s) => s !== "unseen").reduce((n, s) => n + counts[s], 0);

  if (word) {
    const found = evidence.get(word.rank);
    return (
      <Screen>
        <WordDetail
          entry={word}
          state={found?.state ?? "unseen"}
          box={progress.schedule[found?.key]?.box ?? null}
          progress={progress}
          onBack={() => setWord(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
          La Riserva
        </h1>
        <span
          style={{
            ...citySurface("pistachio"),
            borderRadius: 999,
            padding: "4px 12px",
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {held} / {FONDAMENTALE_TARGET.toLocaleString("en-GB")}
        </span>
      </div>

      <p lang="it" style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: TOKENS.ink, margin: "8px 0 0" }}>
        Le 2 000 di De Mauro, in ordine di frequenza. In alto a sinistra c'è <i>essere</i>.
      </p>
      <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
        De Mauro's two thousand, in frequency order, with <i lang="it">essere</i> in the top-left corner. The corner is
        worth hundreds of times more running text than the far end, which is why this is a map and not a progress bar.
      </p>

      <Grid states={states} seeded={seeded} />

      {/* The grid is aria-hidden, so this carries the same facts in text. */}
      <Legend counts={counts} empty={FONDAMENTALE_TARGET - seeded.size} />

      <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: TOKENS.ink, margin: "26px 0 10px" }}>
        The ten <i lang="it">fasce</i>
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 12px", lineHeight: 1.55 }}>
        Two hundred words each, and they are not worth the same. The first band alone carries more of a page than the
        last five together.
      </p>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {bands.map((band, i) => (
          <Band
            key={band.from}
            band={band}
            fascia={FASCE[i]}
            index={i}
            unmet={unmetCount(progress, FASCE[i])}
            selected={open === i}
            onSelect={setOpen}
            onOpenWord={setWord}
            onDrill={startDrill}
          />
        ))}
      </ul>

      <p style={SR_ONLY}>
        {held} of {FONDAMENTALE_TARGET} words held, from a list of {FONDAMENTALE.length} written down so far.
      </p>
    </Screen>
  );
}
