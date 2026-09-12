// Coverage: what share of running Italian text the learner would understand.
//
// This is the number that replaces "% complete" on the dashboard. The two are
// not the same kind of thing at all. "% complete" measures how much of the app
// has been consumed; coverage measures how much of the *language* is now
// legible, which is the thing the learner actually came for and the only one
// of the two that keeps meaning something after the content runs out.
//
// ── The weighting ────────────────────────────────────────────────────────
// Word frequency in every natural language follows Zipf's law: the r-th most
// frequent word occurs roughly 1/r as often as the most frequent one. So a
// word's contribution to coverage is proportional to 1/rank, and knowing
// `essere` (rank 1) is worth hundreds of times more running text than knowing
// the word at rank 1,900. Counting words instead — known/2000 — would claim a
// learner who has memorised the back half of the list can read half of Italian,
// which is wrong by a wide margin and in the flattering direction.
//
// Two assumptions, both stated so they can be argued with:
//
//   1. Plain Zipf (exponent 1, no Mandelbrot offset). Real Italian is slightly
//      flatter at the very top, so this over-weights the first few dozen words
//      a little. It is the standard first approximation and the shape is right.
//   2. The whole 2,000-word base vocabulary is worth LEXICON_COVERAGE — 86% of
//      running text — which is the figure De Mauro's vocabolario di base is
//      normally quoted with, and what the design puts on the Riserva screen.
//      Everything here is that 86% divided up by 1/rank.
//
// A sanity check the maths has to pass, and does: the top 300 words come out
// worth about two thirds of running text. That matches what corpus studies of
// Italian report, and it is also why the serial in the design can't open until
// 600 words — the sweep in research/gen-experiment measured constrained text
// at 90% coverage for a 400-word learner and 97% for a 600-word one, and the
// gap between those two is the difference between decoding and reading.
//
// ── What counts as covered ──────────────────────────────────────────────
// `known` and `solid` (Leitner box 3 and up). Not `learning`, which is boxes
// 1–2, still same-day and next-day recall. Coverage claims you would
// understand the word in running text, so it wants the states that survived a
// real gap. The design settles this the same way: screen 01 of design/02-la-
// citta.html puts "715 parole" beside the coverage figure and La Riserva puts
// "834", and the difference is exactly this rule — 834 is every word touched
// at all, 715 is the known-or-better subset the percentage is made of.
//
// ── The ceiling, and what moved it ──────────────────────────
// Coverage used to learn that a word is known from exactly one place: the
// vocabulary module's 120 words, matched onto lemmas by lexiconStates()
// below. Only 20 of those 120 are in the base 2,000, so a learner who
// mastered every word, drill, dialogue and story the app shipped saw 1.6% and
// "20 / 2000 solid", and could not see more. The other 100 vocabulary words
// are real Italian and worth learning; they were simply outside the
// population this figure is a percentage of.
//
// The comment that stood here named three ways out — "seed more of the
// lexicon, widen what feeds the bridge, or change what the headline is a
// percentage of" — and La Riserva took the second. The reservoir has a verb
// now: a *fascia* opens onto a typed production round over the entries it
// holds, graded through the same reviewItem() as everything else, under
// `riserva:` keys of its own. So LEXICON_SOURCES below is two modules rather
// than one, and every rank with a word written down is reachable.
//
// The ceiling is therefore the coverage of the ranks that have a word behind
// them, which today is 1–300: **66.1%, and 300 / 2000 solid.** That is not a
// coincidence — the sanity check higher up this file says the top 300 words
// are worth about two thirds of running text, and this is the same figure
// arriving from the other side.
//
// What is left under it is the honest bottleneck, and it is now the one
// PLAN.md always claimed it was: the list is 300 of a 2,000 target, so 1,700
// ranks have no word to drill. Raising the ceiling past 66.1% is a content
// job — entries with accurate English and Polish glosses — and no longer an
// engineering one.
//
// coverage.test.js pins the ceiling ("the ceiling a fully-mastered account
// reaches") so it can never move, or fail to move, silently. Moving it is the
// point; moving it quietly is not.

import { FONDAMENTALE, FONDAMENTALE_TARGET, BAND_SIZE } from "../data/fondamentale.js";
import { MODULE_STATS } from "./stats.js";
import { lemmaKey } from "./lemma.js";
import { wordState, WORD_STATES, strongest } from "./wordState.js";

// What the full 2,000 is worth, as a fraction of running text.
export const LEXICON_COVERAGE = 0.86;

const COVERED = new Set(["known", "solid"]);

function harmonic(n) {
  let sum = 0;
  for (let r = 1; r <= n; r += 1) sum += 1 / r;
  return sum;
}

// Σ 1/r over the whole list, so the weights add up to LEXICON_COVERAGE.
const NORMALISER = LEXICON_COVERAGE / harmonic(FONDAMENTALE_TARGET);

// The share of running text one word is worth. Outside the list it is zero:
// the 2,001st word of Italian is not part of what this figure promises.
export function rankWeight(rank) {
  if (rank < 1 || rank > FONDAMENTALE_TARGET) return 0;
  return NORMALISER / rank;
}

// Ranks that actually have an entry in the file yet — the first 300 of 2,000.
// A rank with no entry can't be known by anyone, which is why it is worth
// reporting separately rather than letting it read as "unseen".
const SEEDED = new Set(FONDAMENTALE.map((e) => e.rank));

// The rule that says a word the vocab module stores as "chiave" is the entry
// stored as "la chiave". It lives in shared/lemma.js rather than here, because
// srs.js collapses the review queue by the very same rule and cannot import
// this file: coverage → wordState → srs is already a chain, and the other
// direction would close it. Re-exported so the bridge's own callers still read
// it off the bridge.
export { lemmaKey };

const BY_LEMMA = new Map(FONDAMENTALE.map((entry) => [lemmaKey(entry.it), entry]));

// The modules that can tell coverage a lexicon word is known, in the order
// their evidence is folded. Two, where there used to be one:
//
//   vocab    the deck. It teaches 120 Italian words with example sentences,
//            and 20 of them normalise onto a base-vocabulary lemma. Narrow,
//            and it was the whole bridge.
//   riserva  the reservoir itself. Every entry in fondamentale.js is a unit
//            under a `riserva:` key, so a word can be studied *as* a lexicon
//            word rather than only by turning up in a deck category.
//
// Order matters only for a tie, and only for which key travels with the
// state: vocab is first, so a word the learner holds equally well in both
// places reports the deck key, which is the one with an example sentence
// behind it.
const LEXICON_SOURCES = ["vocab", "riserva"];

// rank -> the units whose lemma normalises onto it, built once. The bridge is
// walked in one place and read from three: the states below, the detail
// screen's box, and the traces under "dove l'hai incontrata". Walking it per
// word opened would be the same answer computed again.
//
// `moduleId` travels with each unit because the three readers do not want the
// same subset — see lexiconUnits().
const UNITS_BY_RANK = (() => {
  const byRank = new Map();

  for (const id of LEXICON_SOURCES) {
    const mod = MODULE_STATS.find((m) => m.id === id);
    for (const level of mod.levels) {
      for (const unit of mod.units(level)) {
        // A Riserva unit normalises onto itself, which is the point of going
        // through lemmaKey() for both rather than special-casing the one that
        // already knows its rank: one code path, and it stays correct if a
        // third source ever arrives with its own spelling of a lemma.
        const entry = BY_LEMMA.get(lemmaKey(unit.item.it));
        if (entry) {
          byRank.set(entry.rank, [...(byRank.get(entry.rank) ?? []), { ...unit, level, moduleId: id }]);
        }
      }
    }
  }

  return byRank;
})();

// Every *deck* unit that reaches one lexicon rank. Empty for the ranks the
// deck never covers, which is most of them.
//
// Deliberately not every unit at that rank. Its one caller is traces.js,
// answering "dove l'hai incontrata" — where the app can prove it put this
// word in front of you, in a category, inside an example sentence. A Riserva
// unit is not an encounter of that kind: it is the lexicon asking about
// itself, with no context to show, and listing it would turn "where you met
// this word" into "you have a scheduler entry", which the state pill at the
// top of that screen already says.
export function lexiconUnits(rank) {
  return (UNITS_BY_RANK.get(rank) ?? []).filter((unit) => unit.moduleId === "vocab");
}

// rank -> state, for every lexicon word the app has any evidence about.
//
// The evidence is LEXICON_SOURCES: the vocabulary deck, which teaches Italian
// words that happen to be in the base 2,000, and La Riserva, which drills the
// base 2,000 as itself. Both are matched onto lemmas by their Italian string.
// It goes through MODULE_STATS rather than walking the data itself, for the
// same reason stats.js does — the key builders have to be the ones the
// modules wrote with, or the number drifts.
//
// The seam is deliberately this one function. Widening it was what raised the
// ceiling from 1.6% to 66.1%; a third source widens it here and nowhere else.
export function lexiconEvidence(progress) {
  const found = new Map();

  for (const [rank, units] of UNITS_BY_RANK) {
    for (const unit of units) {
      // A lemma can sit in more than one level or category, so fold the two
      // together rather than letting whichever deck comes last decide. A rank
      // with nothing but "unseen" behind it stays out of the map entirely —
      // most of the vocabulary module is outside the base 2,000, and an entry
      // saying "no evidence" is not evidence.
      const prior = found.get(rank);
      const state = strongest(prior?.state, wordState(progress, unit.key));
      // The key travels with the state because it is the only route back to
      // the scheduler: the box and the next review date live under the vocab
      // key, and a rank on its own cannot find them. It has to be the key
      // whose state actually won, or the detail screen would show one word's
      // state above another word's due date.
      if (state !== "unseen" && state !== prior?.state) found.set(rank, { state, key: unit.key });
    }
  }

  return found;
}

// Just the states, which is what coverage arithmetic wants. Derived from the
// walk above rather than repeating it — the bridge from the vocabulary deck
// is deliberately one function, and two copies of it would drift.
export function lexiconStates(progress) {
  return new Map([...lexiconEvidence(progress)].map(([rank, { state }]) => [rank, state]));
}

// One slice of the reservoir: how much of running text ranks `from`..`to` are
// worth, how much of that the learner has, and the state of every rank in it.
//
// Three percentages, and they answer three different questions — mixing them
// up is how a band bar ends up drawn at 4% when the learner has finished the
// band. All three share a numerator or a denominator with another, so:
//
//   pct       — the slice's share of ALL running Italian. Adds up across the
//               ten bands to the headline figure. Never reaches 100 for a
//               band; the whole 2,000 only reaches LEXICON_COVERAGE.
//   weightPct — what the slice is worth in total, learner aside ("queste 200
//               da sole valgono 61,8 punti di copertura").
//   bandPct   — how much of THIS slice the learner has, 0–100. The only one
//               of the three a progress bar inside a band should be drawn
//               from. No guard against a zero-weight slice: every caller
//               passes a non-empty range inside 1..FONDAMENTALE_TARGET, so
//               `weight` is always positive, and a branch no input can reach
//               is a branch no test can honestly cover.
function tally(states, from, to) {
  const counts = Object.fromEntries(WORD_STATES.map((s) => [s, 0]));
  let fraction = 0;
  let weight = 0;
  let seeded = 0;

  for (let rank = from; rank <= to; rank += 1) {
    const state = states.get(rank) ?? "unseen";
    counts[state] += 1;
    weight += rankWeight(rank);
    if (COVERED.has(state)) fraction += rankWeight(rank);
    if (SEEDED.has(rank)) seeded += 1;
  }

  return {
    from,
    to,
    counts,
    seeded,
    fraction,
    weight,
    pct: pct(fraction),
    weightPct: pct(weight),
    bandPct: pct(fraction / weight),
  };
}

// Coverage is quoted to one decimal — the design's "41,2%" — because whole
// percent hides a whole study session's worth of movement out past rank 400.
function pct(fraction) {
  return Math.round(fraction * 1000) / 10;
}

// The headline figure, over the whole 2,000. `counts` covers all 2,000 ranks,
// so the unseen count includes the ranks not seeded into the data file yet;
// `seeded` says how many of the 2,000 the list actually holds.
export function coverage(progress) {
  return tally(lexiconStates(progress), 1, FONDAMENTALE_TARGET);
}

// The band breakdown La Riserva draws: ten fasce of 200, weakest words last.
// See tally() above for which of the three percentages answers which question
// — `bandPct` is the one that means "how much of this band the learner has".
export function coverageBands(progress) {
  const states = lexiconStates(progress);
  const count = Math.ceil(FONDAMENTALE_TARGET / BAND_SIZE);

  return Array.from({ length: count }, (_, i) =>
    tally(states, i * BAND_SIZE + 1, Math.min((i + 1) * BAND_SIZE, FONDAMENTALE_TARGET)),
  );
}
