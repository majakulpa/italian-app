// The stage model: where on the tense ladder a learner is, inferred from what
// they have produced, and used to decide which answers get corrected.
//
// PLAN.md's rule is "never grade a structure above the learner's stage — it
// stays in the input". This file is the half of that rule that knows what the
// stage is. It gates *grading*, never content: an item above your stage is
// still shown and still asked; a wrong answer to it is just not marked wrong.
//
// Like wordState.js, everything here is derived and nothing is stored. The
// only persisted fact is the per-item evidence marker in storage.js
// (`stage-evidence:<key>`); a stored stage beside it would be a second copy of
// the same fact, and the first to go stale.

import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { drillKey, hasStageEvidence } from "./storage.js";

// The ladder, lowest first: the design's own sequence, and the one the story
// generator's checker already uses, so the grading gate and the generator
// can't disagree about what "above your stage" means. Passato remoto is the
// seventh rung — the design never drew it, but a narrative past a learner
// meets mostly in reading sits above the congiuntivo, not outside the ladder.
export const STAGES = [
  { stage: 1, name: "presente" },
  { stage: 2, name: "passato prossimo" },
  { stage: 3, name: "imperfetto" },
  { stage: 4, name: "futuro" },
  { stage: 5, name: "condizionale" },
  { stage: 6, name: "congiuntivo" },
  { stage: 7, name: "passato remoto" },
];

// How many distinct items of a stage must carry "produced" evidence before
// that stage is established.
//
// This is a judgement, not a measurement. It is allowed to be one because it
// gates *correction* only: getting it wrong costs a learner some leniency on
// wrong answers above their stage, and can never lock anything away. Nothing
// may gate *content* on the stage — a season, a story, a screen that opens
// "at stage 5" — until this number has been measured against real learners.
export const EMERGENCE_ITEMS = 4;

// An item's stage: its own override if it has one, else its topic's. The
// override can only raise (grammar.test.js holds that), which is what makes
// this max(topic, form) without having to compute a max. `null` means the
// answer is not a verb form and is never gated.
export function itemStage(topic, item) {
  return item.stage ?? topic.stage;
}

// Every staged grammar item with the key its evidence marker hangs off.
const STAGED_ITEMS = GRAMMAR_LEVELS.flatMap((level) =>
  level.topics.flatMap((topic) =>
    topic.drills.map((item) => ({ key: drillKey(level, topic, item), stage: itemStage(topic, item) })),
  ),
).filter((unit) => unit.stage !== null);

// Where the learner is on the ladder.
//
//   stages[i].evidence    distinct items of that stage produced clean — "N of 4"
//   stages[i].established evidence has reached EMERGENCE_ITEMS
//   stages[i].status      "established" | "current" | "above"
//   current               the lowest stage not yet established
//
// Stages can be established out of order, and the screen says so rather than
// pretending otherwise: someone who types four clean futuro forms has shown
// the futuro, whether or not the imperfetto has caught up. Once every stage is
// established the learner is at the top of the ladder, and current is its
// last rung.
export function stageState(progress) {
  const stages = STAGES.map(({ stage, name }) => {
    const evidence = STAGED_ITEMS.filter((unit) => unit.stage === stage && hasStageEvidence(progress, unit.key)).length;
    return { stage, name, evidence, needed: EMERGENCE_ITEMS, established: evidence >= EMERGENCE_ITEMS };
  });

  const current = (stages.find((s) => !s.established) ?? stages[stages.length - 1]).stage;

  return {
    current,
    stages: stages.map((s) => ({
      ...s,
      status: s.established ? "established" : s.stage === current ? "current" : "above",
    })),
  };
}

// Whether a wrong answer to this item may be marked wrong. A right answer is
// always graded — that is evidence, and refusing it would hide progress — so
// this only decides what happens to a miss.
export function isGraded(progress, topic, item) {
  const stage = itemStage(topic, item);
  if (stage === null) return true;

  const state = stageState(progress);
  return stage <= state.current || state.stages[stage - 1].established;
}
