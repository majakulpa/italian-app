import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { STAGES, EMERGENCE_ITEMS, itemStage, formStage, stageState, isGraded } from "./stage.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { drillKey, stageEvidenceKey, markStageProduced, markStageShown, markWord, riservaKey } from "./storage.js";
import { reviewItem, deferItem, dueCount, dueItems } from "./srs.js";
import { MODULE_STATS, moduleStats, levelLadder } from "./stats.js";
import { coverage, coverageBands } from "./coverage.js";
import { wordState } from "./wordState.js";
import { FONDAMENTALE } from "../data/fondamentale.js";

const TODAY = "2026-08-17";
const EMPTY = { version: 2, words: {}, schedule: {} };

const topicById = (id) => GRAMMAR_LEVELS.flatMap((l) => l.topics).find((t) => t.id === id);
const levelOf = (topic) => GRAMMAR_LEVELS.find((l) => l.topics.includes(topic));
const drill = (topicId, itemId) => {
  const topic = topicById(topicId);
  const item = topic.drills.find((d) => d.id === itemId);
  return { topic, item, key: drillKey(levelOf(topic), topic, item) };
};

// Every grammar drill with the stage its clean answer is evidence of.
const ALL = GRAMMAR_LEVELS.flatMap((level) =>
  level.topics.flatMap((topic) =>
    topic.drills.map((item) => ({ topic, item, key: drillKey(level, topic, item), stage: formStage(topic, item) })),
  ),
);
const ofStage = (stage) => ALL.filter((d) => d.stage === stage);

const produce = (progress, drills) => drills.reduce((acc, d) => markStageProduced(acc, d.key), progress);
const establish = (progress, stage) => produce(progress, ofStage(stage).slice(0, EMERGENCE_ITEMS));

describe("STAGES", () => {
  it("is the design's ladder, with passato remoto as the seventh rung", () => {
    expect(STAGES).toEqual([
      { stage: 1, name: "presente" },
      { stage: 2, name: "passato prossimo" },
      { stage: 3, name: "imperfetto" },
      { stage: 4, name: "futuro" },
      { stage: 5, name: "condizionale" },
      { stage: 6, name: "congiuntivo" },
      { stage: 7, name: "passato remoto" },
    ]);
  });

  it("establishes a stage on four distinct items", () => {
    expect(EMERGENCE_ITEMS).toBe(4);
  });
});

describe("itemStage", () => {
  it("takes the topic's stage when the item has none of its own", () => {
    const { topic, item } = drill("verbi-modali", "1");
    expect(itemStage(topic, item)).toBe(1);
  });

  it("takes the item's own stage where it raises the topic's", () => {
    const { topic, item } = drill("verbi-modali", "8"); // ho dovuto
    expect(topic.stage).toBe(1);
    expect(itemStage(topic, item)).toBe(2);
  });

  it("is null where the answer is not a verb form", () => {
    const { topic, item } = drill("articles", "1");
    expect(itemStage(topic, item)).toBeNull();
  });
});

describe("formStage", () => {
  it("is the grading stage wherever the item types a form of that stage", () => {
    const { topic, item } = drill("verbi-modali", "8");
    expect(formStage(topic, item)).toBe(2);
  });

  it("is the stage of the contrast form where it differs from the choice", () => {
    const { topic, item } = drill("imperfetto", "4"); // ho visto
    expect(itemStage(topic, item)).toBe(3);
    expect(formStage(topic, item)).toBe(2);
  });

  // Null has to survive: a clitic in a stage-1 topic is evidence of nothing,
  // not of the presente by default.
  it("is null where the typed answer has no tense, even in a staged topic", () => {
    const { topic, item } = drill("riflessivi", "2"); // ti
    expect(itemStage(topic, item)).toBe(1);
    expect(formStage(topic, item)).toBeNull();
  });
});

describe("stageState", () => {
  // The finding that split the two stages: these four grade at 6 and type no
  // congiuntivo. Four clean answers to them are exactly EMERGENCE_ITEMS, and
  // must not establish a mood never produced.
  it("does not establish the congiuntivo on answers that type no congiuntivo", () => {
    const noCongiuntivo = [
      drill("congiuntivo-presente", "8"),
      drill("periodo-ipotetico", "2"),
      drill("periodo-ipotetico", "5"),
      drill("periodo-ipotetico", "7"),
    ];
    for (const d of noCongiuntivo) expect(itemStage(d.topic, d.item)).toBe(6);

    const state = stageState(produce(EMPTY, noCongiuntivo));
    expect(state.stages[5]).toMatchObject({ evidence: 0, established: false });
    expect(state.stages[4].evidence).toBe(2);
    expect(state.stages[0].evidence).toBe(2);
  });

  it("starts everyone at stage 1, with no evidence anywhere", () => {
    const state = stageState(EMPTY);

    expect(state.current).toBe(1);
    expect(state.stages.map((s) => s.evidence)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(state.stages.map((s) => s.status)).toEqual(["current", "above", "above", "above", "above", "above", "above"]);
    expect(state.stages[0]).toMatchObject({ stage: 1, name: "presente", needed: EMERGENCE_ITEMS, established: false });
  });

  it("reports evidence short of the threshold as N of 4, not established", () => {
    const state = stageState(produce(EMPTY, ofStage(2).slice(0, EMERGENCE_ITEMS - 1)));

    expect(state.stages[1]).toMatchObject({ evidence: EMERGENCE_ITEMS - 1, needed: EMERGENCE_ITEMS, established: false });
    expect(state.current).toBe(1);
  });

  it("establishes a stage at four items and moves current up to the next", () => {
    const state = stageState(establish(EMPTY, 1));

    expect(state.stages[0]).toMatchObject({ evidence: 4, established: true, status: "established" });
    expect(state.current).toBe(2);
    expect(state.stages[1].status).toBe("current");
  });

  it("counts every produced item, past the threshold too", () => {
    expect(stageState(produce(EMPTY, ofStage(3))).stages[2].evidence).toBe(ofStage(3).length);
  });

  // Shown is the opposite of evidence: the form was on screen.
  it("does not count an item marked shown", () => {
    const shown = ofStage(1).slice(0, EMERGENCE_ITEMS).reduce((acc, d) => markStageShown(acc, d.key), EMPTY);
    expect(stageState(shown).stages[0].evidence).toBe(0);
  });

  // A grade is not evidence: known says right, not typed clean without a
  // showing. Only the marker counts.
  it("does not read a known grade as evidence", () => {
    const known = ofStage(1).slice(0, EMERGENCE_ITEMS).reduce((acc, d) => reviewItem(acc, d.key, true, TODAY), EMPTY);
    expect(stageState(known).stages[0].evidence).toBe(0);
  });

  it("counts an override toward its own stage, not its topic's", () => {
    const state = stageState(produce(EMPTY, [drill("verbi-modali", "8"), drill("imperativo", "7")]));

    expect(state.stages[0].evidence).toBe(0);
    expect(state.stages[1].evidence).toBe(1);
    expect(state.stages[5].evidence).toBe(1);
  });

  it("counts no evidence for an unstaged item or a key that is not a drill", () => {
    const progress = produce(
      produce(EMPTY, ALL.filter((d) => d.stage === null)),
      [{ key: riservaKey(FONDAMENTALE[0]) }, { key: "grammar:A1:present-are:99" }],
    );
    expect(stageState(progress).stages.every((s) => s.evidence === 0)).toBe(true);
  });

  // The screen shows what was produced, not a ladder it pretends was climbed
  // in order.
  it("establishes a stage out of order without moving current past a gap", () => {
    const state = stageState(establish(establish(EMPTY, 1), 4));

    expect(state.current).toBe(2);
    expect(state.stages.map((s) => s.status)).toEqual([
      "established",
      "current",
      "above",
      "established",
      "above",
      "above",
      "above",
    ]);
  });

  it("puts a learner with every stage established at the top of the ladder", () => {
    const state = stageState(STAGES.reduce((acc, { stage }) => establish(acc, stage), EMPTY));

    expect(state.current).toBe(7);
    expect(state.stages.every((s) => s.status === "established")).toBe(true);
  });
});

describe("isGraded", () => {
  const presente = drill("present-are", "1");
  const passato = drill("passato-prossimo", "1");
  const imperfetto = drill("imperfetto", "1");
  const futuro = drill("futuro", "1");
  const graded = (progress, d) => isGraded(progress, d.topic, d.item);

  it("always grades an item that is not a verb form", () => {
    expect(graded(EMPTY, drill("articles", "1"))).toBe(true);
    expect(graded(EMPTY, drill("pronomi", "2"))).toBe(true);
  });

  it("grades the current stage and does not grade the one above it", () => {
    expect(graded(EMPTY, presente)).toBe(true);
    expect(graded(EMPTY, passato)).toBe(false);
  });

  it("grades a stage once the one below it is established", () => {
    const progress = establish(EMPTY, 1);
    expect(graded(progress, passato)).toBe(true);
    expect(graded(progress, imperfetto)).toBe(false);
  });

  it("grades a stage established out of order, and still not the gap below it", () => {
    const progress = establish(establish(EMPTY, 1), 4);
    expect(graded(progress, futuro)).toBe(true);
    expect(graded(progress, imperfetto)).toBe(false);
  });

  // The rule that made ho visto stage 3 has to reach the gate, not only the data.
  it("reads a raised item at its raised stage, not its topic's", () => {
    expect(graded(EMPTY, drill("verbi-modali", "1"))).toBe(true);
    expect(graded(EMPTY, drill("verbi-modali", "8"))).toBe(false);
    expect(graded(establish(EMPTY, 2), drill("imperfetto", "4"))).toBe(false);
  });
});

// The markers share `words` with every unit's grade, the way `falsi-caught:`
// does. These pin that nothing which enumerates or counts units ever reads one
// as a unit: a save full of evidence has exactly the queue, the counts, the
// coverage and the word states of the same save without it.
describe("stage evidence keys are not units", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const UNIT_KEYS = MODULE_STATS.flatMap((mod) => mod.levels.flatMap((level) => mod.units(level).map((u) => u.key)));

  // A real save: some of every scheduled bench answered, right and wrong.
  const graded = (() => {
    let progress = EMPTY;
    ALL.slice(0, 40).forEach((d, i) => {
      progress = reviewItem(progress, d.key, i % 3 !== 0, "2026-08-10");
    });
    FONDAMENTALE.slice(0, 40).forEach((entry, i) => {
      progress = reviewItem(progress, riservaKey(entry), i % 2 === 0, "2026-08-12");
    });
    // And words from a save older than the scheduler: a status, no box, so
    // the status is all wordState and coverage have to go on.
    UNIT_KEYS.filter((key) => !key.startsWith("grammar:"))
      .filter((_, i) => i % 7 === 0)
      .forEach((key) => {
        if (!progress.words[key]) progress = markWord(progress, key, "known");
      });
    return deferItem(progress, ALL[100].key, "2026-08-12");
  })();

  // The same save with a marker beside every unit in the app — met or not,
  // shown or produced. Written straight in rather than through the transitions,
  // which would clear the "shown" deferItem left above and so miss a key.
  const marked = UNIT_KEYS.reduce(
    (acc, key, i) => markWord(acc, stageEvidenceKey(key), i % 2 ? "shown" : "produced"),
    graded,
  );
  const sortedKeys = (progress, day) => dueItems(progress, day, Infinity).map((u) => u.key).sort();

  it("has a marker for every unit, so the comparison below is not vacuous", () => {
    expect(Object.keys(marked.words).filter((k) => k.startsWith("stage-evidence:"))).toHaveLength(UNIT_KEYS.length);
  });

  it("leaves the scheduler's queue unchanged", () => {
    for (const day of [TODAY, "2026-09-30"]) {
      expect(dueCount(marked, day)).toBe(dueCount(graded, day));
      expect(sortedKeys(marked, day)).toEqual(sortedKeys(graded, day));
    }
    expect(sortedKeys(marked, TODAY).some((key) => key.startsWith("stage-evidence:"))).toBe(false);
  });

  it("puts no marker in the schedule, whatever is answered afterwards", () => {
    const after = UNIT_KEYS.slice(0, 50).reduce((acc, key) => reviewItem(acc, key, false, TODAY), marked);
    expect(Object.keys(after.schedule).some((key) => key.startsWith("stage-evidence:"))).toBe(false);
  });

  it("leaves every module's counts and the level ladder unchanged", () => {
    for (const mod of MODULE_STATS) {
      expect(moduleStats(marked, mod.id)).toEqual(moduleStats(graded, mod.id));
    }
    expect(levelLadder(marked)).toEqual(levelLadder(graded));
  });

  it("leaves coverage unchanged", () => {
    expect(coverage(marked)).toEqual(coverage(graded));
    expect(coverageBands(marked)).toEqual(coverageBands(graded));
  });

  it("leaves every unit's word state unchanged, and gives a marker none", () => {
    for (const key of UNIT_KEYS) expect(wordState(marked, key)).toBe(wordState(graded, key));
    expect(wordState(marked, stageEvidenceKey(UNIT_KEYS[0]))).toBe("unseen");
    expect(wordState(marked, stageEvidenceKey(UNIT_KEYS[1]))).toBe("unseen");
  });
});
