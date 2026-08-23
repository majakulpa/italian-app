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
// `known` and `solid` (Leitner box 3 and up). Not `met` — a word glossed once
// in a story is recognised, not retrievable — and not `learning`, which is
// boxes 1–2, still same-day and next-day recall. Coverage claims you would
// understand the word in running text, so it wants the states that survived a
// real gap. This is a judgement call and the design doesn't settle it: screen
// 01 puts "834 parole" next to the coverage figure, and 834 there is the count
// of every word touched at all.

import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../data/fondamentale.js";
import { MODULE_STATS } from "./stats.js";
import { wordState, WORD_STATES, strongest } from "./wordState.js";

// What the full 2,000 is worth, as a fraction of running text.
export const LEXICON_COVERAGE = 0.86;

// La Riserva draws the reservoir in *fasce* of 200 — "Fascia 3 · posti
// 401–600". Ten bands over the 2,000.
export const BAND_SIZE = 200;

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

// The lexicon indexed by a comparable form, so a word the vocab module stores
// as "chiave" finds the entry stored as "la chiave". Leading articles go,
// case goes, trailing punctuation goes.
function normalise(italian) {
  return italian
    .trim()
    .toLowerCase()
    .replace(/^(l'|un'|(il|lo|la|i|gli|le|un|uno|una) )/, "")
    .replace(/[?!.,;:]+$/, "");
}

const BY_LEMMA = new Map(FONDAMENTALE.map((entry) => [normalise(entry.it), entry]));

// rank -> state, for every lexicon word the app has any evidence about.
//
// The evidence is the vocabulary module: its 120 words are the only place the
// app currently learns that a *word* is known, so coverage bridges from there
// by matching Italian strings. It goes through MODULE_STATS rather than
// walking the data itself, for the same reason stats.js does — the key
// builders have to be the ones the modules wrote with, or the number drifts.
//
// When La Riserva lands in a later phase the lexicon gets keys of its own and
// this bridge becomes one more source rather than the only one. The seam is
// deliberately this one function.
export function lexiconStates(progress) {
  const states = new Map();
  const vocab = MODULE_STATS.find((mod) => mod.id === "vocab");

  for (const level of vocab.levels) {
    for (const unit of vocab.units(level)) {
      const entry = BY_LEMMA.get(normalise(unit.item.it));
      if (!entry) continue;

      // A lemma can sit in more than one level or category, so fold the two
      // together rather than letting whichever deck comes last decide. A rank
      // with nothing but "unseen" behind it stays out of the map entirely —
      // most of the vocabulary module is outside the base 2,000, and an entry
      // saying "no evidence" is not evidence.
      const state = strongest(states.get(entry.rank), wordState(progress, unit.key));
      if (state !== "unseen") states.set(entry.rank, state);
    }
  }

  return states;
}

// One slice of the reservoir: how much of running text ranks `from`..`to` are
// worth, how much of that the learner has, and the state of every rank in it.
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

  return { from, to, counts, seeded, fraction, weight, pct: pct(fraction), weightPct: pct(weight) };
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
// `weightPct` is what the whole band is worth ("queste 200 da sole valgono
// 4,3 punti di copertura"); `pct` is how much of it the learner has.
export function coverageBands(progress) {
  const states = lexiconStates(progress);
  const count = Math.ceil(FONDAMENTALE_TARGET / BAND_SIZE);

  return Array.from({ length: count }, (_, i) =>
    tally(states, i * BAND_SIZE + 1, Math.min((i + 1) * BAND_SIZE, FONDAMENTALE_TARGET)),
  );
}
