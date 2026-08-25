// The four states a word can be in, and the one function that decides which.
//
//   unseen   — never encountered
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
// speaks for a save written before the scheduler existed, whose words carry a
// status and nothing else.
//
// There was a fifth state here — `met`, for a word glossed in a story but
// never recalled — and it came out because nothing in the app could ever write
// it. Reading a story writes no word status at all (StoriesModule only marks
// the story itself done), so `met` was a state the model advertised, the
// dashboard counted and the tests covered, that no learner could ever have a
// word in. Giving stories a real word-level write is Riserva-phase work: it
// needs a key namespace of its own and a second evidence source in
// coverage.js. When that lands, `met` comes back with a writer behind it —
// and wordState.test.js has a test that fails if it comes back without one.

import { MAX_BOX } from "./srs.js";

// Weakest to strongest. Callers that render a legend or a stacked bar want
// them in this order; the array is the single place that order is stated.
export const WORD_STATES = ["unseen", "learning", "known", "solid"];

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
const STATUS_STATE = { learning: "learning", known: "known" };

export function wordState(progress, key) {
  const box = progress.schedule[key]?.box;
  if (box) return stateForBox(box);
  return STATUS_STATE[progress.words[key]] ?? "unseen";
}

// Which of two states is the stronger evidence, treating "no state at all" as
// weaker than any of them. The same word can turn up in more than one deck,
// and studying it in one place must not be undone by having ignored it in
// another — coverage.js folds duplicate lemmas together with this.
export function strongest(a, b) {
  return WORD_STATES.indexOf(a) > WORD_STATES.indexOf(b) ? a : b;
}
