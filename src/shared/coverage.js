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
// ── The ceiling, stated because it is low ───────────────────────────────
// Coverage learns that a word is known from one place: the vocabulary
// module's 120 words, matched onto lemmas by lexiconStates() below. Only 20
// of those 120 are in the base 2,000, so a learner who masters every word,
// drill, dialogue and story the app ships sees 1.6% and "20 / 2000 solid",
// and cannot see more. The other 100 vocabulary words are real Italian and
// worth learning; they are simply outside the population this figure is a
// percentage of.
//
// That is a property of the content, not a bug in the arithmetic — the
// weighting is right, the list is 300 of a 2,000 target, and the bridge is
// deliberately one narrow seam. But it means the headline is close to a
// constant today, and nobody should discover that from a user. The ceiling is
// pinned by test in coverage.test.js ("the ceiling a fully-mastered account
// reaches") so it can never move, or fail to move, silently. Widening it is a
// product decision: seed more of the lexicon, widen what feeds the bridge, or
// change what the headline is a percentage of.

import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../data/fondamentale.js";
import { MODULE_STATS } from "./stats.js";
import { wordState, WORD_STATES, strongest } from "./wordState.js";

// What the full 2,000 is worth, as a fraction of running text.
export const LEXICON_COVERAGE = 0.86;

// La Riserva draws the reservoir in *fasce* of 200 — "Fascia 3 · posti
// 401–600". Ten bands over the 2,000.
export const BAND_SIZE = 200;

const COVERED = new Set(["known", "solid"]);

// How many words a tally's `counts` holds at the bar the fraction is built
// from — known or better, never `learning`. Exported because "words you
// know" is now shown in three places (the L'Officina bench badge, the
// Riserva header, a fascia) and a second addition somewhere would be a
// second definition of the bar: the design's own screens disagree by exactly
// this rule, 834 words touched against the 715 the percentage is made of.
export function heldWords(counts) {
  return WORD_STATES.filter((state) => COVERED.has(state)).reduce((sum, state) => sum + counts[state], 0);
}

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

// The lexicon indexed by a comparable form, so a word the vocab module stores
// as "chiave" finds the entry stored as "la chiave". Leading articles go,
// case goes, trailing punctuation goes.
//
// Exported because it is the only definition of "the same word" this app has,
// and a second copy of it somewhere else would drift the first time an
// article convention changed. La Riserva's word detail matches a lemma
// against the story glosses with it (modules/riserva/traces.js).
export function lemmaKey(italian) {
  return italian
    .trim()
    .toLowerCase()
    .replace(/^(l'|un'|(il|lo|la|i|gli|le|un|uno|una) )/, "")
    .replace(/[?!.,;:]+$/, "");
}

const BY_LEMMA = new Map(FONDAMENTALE.map((entry) => [lemmaKey(entry.it), entry]));

// rank -> the vocabulary units whose lemma normalises onto it.
//
// This is the bridge, and it is the only one: the vocabulary module's 120
// words are the only place the app currently learns that a *word* is known,
// so coverage crosses over by matching Italian strings. It goes through
// MODULE_STATS rather than walking the data itself, for the same reason
// stats.js does — the key builders have to be the ones the modules wrote
// with, or the number drifts.
//
// Built once at load rather than per call. It depends on the data files
// alone, never on progress, so recomputing it per render would be 120 string
// normalisations to arrive at the same map.
//
// When stories get a word-level write the bridge grows a second source and
// this becomes one of two. The seam is deliberately this one table.
const UNITS_BY_RANK = (() => {
  const byRank = new Map();
  const vocab = MODULE_STATS.find((mod) => mod.id === "vocab");

  for (const level of vocab.levels) {
    for (const unit of vocab.units(level)) {
      const entry = BY_LEMMA.get(lemmaKey(unit.item.it));
      if (!entry) continue;
      // `level` is not in what MODULE_STATS.units yields, and the word detail
      // needs it to say which deck a sentence came from — srs.js folds it in
      // the same way and for the same reason.
      byRank.set(entry.rank, [...(byRank.get(entry.rank) ?? []), { ...unit, level }]);
    }
  }

  return byRank;
})();

// Every vocabulary unit sitting behind one lexicon rank, in deck order. Empty
// for the ranks no deck reaches, which is most of them.
export function lexiconUnits(rank) {
  return UNITS_BY_RANK.get(rank) ?? [];
}

// rank -> state, for every lexicon word the app has any evidence about.
export function lexiconStates(progress) {
  const states = new Map();

  for (const [rank, units] of UNITS_BY_RANK) {
    for (const unit of units) {
      // A lemma can sit in more than one level or category, so fold the two
      // together rather than letting whichever deck comes last decide. A rank
      // with nothing but "unseen" behind it stays out of the map entirely —
      // most of the vocabulary module is outside the base 2,000, and an entry
      // saying "no evidence" is not evidence.
      const state = strongest(states.get(rank), wordState(progress, unit.key));
      if (state !== "unseen") states.set(rank, state);
    }
  }

  return states;
}

// rank -> { rank, state, key, unit }: the same verdict lexiconStates reaches,
// plus the storage key it was reached from, so a screen that shows the state
// can also show the Leitner box and the due date behind it without deciding
// for itself which key that was.
//
// Layered on top of lexiconStates rather than folded into it. The fold that
// picks a state when a lemma sits in two decks is subtle enough to want one
// implementation, and this way the key is chosen to *match* the state that
// fold produced — a rank read as "solid" cannot end up carrying the key of
// the deck that has it at box 1.
export function lexiconEvidence(progress) {
  const evidence = new Map();

  for (const [rank, state] of lexiconStates(progress)) {
    // No guard on the find, and it cannot come back undefined: lexiconStates
    // folds `strongest` over exactly these units and drops the rank when the
    // fold is "unseen", so any state it reports is one some unit in this list
    // actually holds. A guard here would be a branch no input can reach.
    const unit = lexiconUnits(rank).find((candidate) => wordState(progress, candidate.key) === state);
    evidence.set(rank, { rank, state, key: unit.key, unit });
  }

  return evidence;
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
