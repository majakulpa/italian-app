// The five states a word can be in, and the one function that decides which.
//
//   unseen   — never encountered
//   met      — seen in input and glossed, never successfully recalled
//   learning — in the scheduler, Leitner boxes 1–2
//   known    — boxes 3–4
//   solid    — the top box, reached by getting it right after a week away
//
// Every one of these is *derived*, never stored. storage.js keeps two maps —
// a status string and a schedule entry — and srs.js writes both together in
// reviewItem, which is what makes the box authoritative: a stored state field
// would be a third copy of the same fact and the first one to go stale.
//
// So the rule is: if there is a box, the box decides. The stored status only
// speaks for words the scheduler has never touched — a "met" word, which has
// no schedule entry by definition, and a save written before the scheduler
// existed, whose words carry a status and nothing else.

import { MAX_BOX } from "./srs.js";

// Weakest to strongest. Callers that render a legend or a stacked bar want
// them in this order; the array is the single place that order is stated.
export const WORD_STATES = ["unseen", "met", "learning", "known", "solid"];

// The first box that counts as "known". Boxes 1–2 come round the same day and
// the next day, which is recognition rather than retention; box 3 is the first
// with a real gap behind it (3 days).
const KNOWN_BOX = 3;

// "solid" is the top box rather than a literal 5, so adding a sixth Leitner
// interval moves the line with it instead of quietly stranding it.
export function stateForBox(box) {
  if (box >= MAX_BOX) return "solid";
  if (box >= KNOWN_BOX) return "known";
  return "learning";
}

// A status that isn't in here belongs to a module the word model doesn't
// cover — a dialogue or a story is "done", which is not a thing you know.
const STATUS_STATE = { met: "met", learning: "learning", known: "known" };

export function wordState(progress, key) {
  const box = progress.schedule[key]?.box;
  if (box) return stateForBox(box);
  return STATUS_STATE[progress.words[key]] ?? "unseen";
}

// Tallies a run of keys into { unseen, met, learning, known, solid }. Every
// state is present with a zero rather than absent, so a caller can render the
// full legend without guarding each lookup.
export function countStates(progress, keys) {
  const counts = Object.fromEntries(WORD_STATES.map((s) => [s, 0]));
  for (const key of keys) counts[wordState(progress, key)] += 1;
  return counts;
}
