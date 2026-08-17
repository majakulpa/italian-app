import { describe, it, expect } from "vitest";
import { MODULE_STATS, moduleStats, levelStats, overallStats, levelLadder } from "./stats.js";
import { MODULES } from "../App.jsx";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { wordKey, drillKey, conversationKey, storyKey } from "./storage.js";

// Pure arithmetic over a seeded progress object — no rendering, so these can
// pin the exact numbers the dashboard will show.

const EMPTY = { words: {}, streak: { count: 0, lastDate: null } };

function withWords(entries) {
  return { ...EMPTY, words: entries };
}

const A1 = (levels) => levels.find((l) => l.id === "A1");

// First unit of each module at A1, so a test can mark exactly one thing done.
const firstVocabKey = () => {
  const level = A1(LEVELS);
  return wordKey(level, level.categories[0], level.categories[0].words[0]);
};
const firstDrillKey = () => {
  const level = A1(GRAMMAR_LEVELS);
  return drillKey(level, level.topics[0], level.topics[0].drills[0]);
};
const firstDialogueKey = () => {
  const level = A1(CONVERSATION_LEVELS);
  return conversationKey(level, level.dialogues[0]);
};
const firstStoryKey = () => {
  const level = A1(STORY_LEVELS);
  return storyKey(level, level.stories[0]);
};

describe("MODULE_STATS", () => {
  // The dashboard renders App's MODULES and looks each one up here by id — a
  // module in one list and not the other silently loses its progress bar.
  it("covers exactly the modules App renders", () => {
    expect(MODULE_STATS.map((m) => m.id).sort()).toEqual(MODULES.map((m) => m.id).sort());
  });

  it("gives every module something to count", () => {
    for (const mod of MODULE_STATS) {
      expect({ id: mod.id, total: moduleStats(EMPTY, mod.id).total > 0 }).toEqual({ id: mod.id, total: true });
    }
  });

  // Namespaced keys are what keep four modules in one storage map from
  // colliding; if two modules ever enumerated the same key, one would count
  // the other's progress as its own.
  it("enumerates a distinct key for every unit in the app", () => {
    const all = MODULE_STATS.flatMap((mod) => mod.levels.flatMap((lv) => mod.units(lv).map((u) => u.key)));
    expect(new Set(all).size).toBe(all.length);
  });

  // srs.js reaches through `item` to render a due question and through
  // `group` to draw its distractors, so a unit missing either would blow up
  // in a review session rather than here.
  it("carries the item and its sibling group on every scheduled unit", () => {
    for (const mod of MODULE_STATS.filter((m) => m.scheduled)) {
      for (const unit of mod.units(mod.levels[0])) {
        expect({ id: mod.id, item: Boolean(unit.item), group: Boolean(unit.group) }).toEqual({
          id: mod.id,
          item: true,
          group: true,
        });
      }
    }
  });

  // Conversations have no wrong answer and a story is read rather than
  // drilled, so neither belongs in a review queue.
  it("schedules vocabulary and grammar only", () => {
    expect(MODULE_STATS.filter((m) => m.scheduled).map((m) => m.id)).toEqual(["vocab", "grammar"]);
  });
});

describe("moduleStats", () => {
  it("reports nothing done on fresh progress", () => {
    for (const mod of MODULE_STATS) {
      const stats = moduleStats(EMPTY, mod.id);
      expect({ id: mod.id, done: stats.done, pct: stats.pct }).toEqual({ id: mod.id, done: 0, pct: 0 });
    }
  });

  it("counts a word marked known", () => {
    expect(moduleStats(withWords({ [firstVocabKey()]: "known" }), "vocab").done).toBe(1);
  });

  // "still learning" is a real status the flashcards write — it means seen,
  // not finished, and the dashboard must not count it as progress.
  it("does not count a word still being learned", () => {
    expect(moduleStats(withWords({ [firstVocabKey()]: "learning" }), "vocab").done).toBe(0);
  });

  it("counts a drill, a dialogue and a story under their own modules", () => {
    const progress = withWords({
      [firstDrillKey()]: "known",
      [firstDialogueKey()]: "done",
      [firstStoryKey()]: "done",
    });

    expect({
      grammar: moduleStats(progress, "grammar").done,
      conversations: moduleStats(progress, "conversations").done,
      stories: moduleStats(progress, "stories").done,
      vocab: moduleStats(progress, "vocab").done,
    }).toEqual({ grammar: 1, conversations: 1, stories: 1, vocab: 0 });
  });

  it("returns an empty tally for an unknown module id", () => {
    expect(moduleStats(EMPTY, "nope")).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe("levelStats", () => {
  it("reports nothing done on fresh progress", () => {
    expect(levelStats(EMPTY, "A1")).toEqual({ done: 0, total: levelStats(EMPTY, "A1").total, pct: 0 });
    expect(levelStats(EMPTY, "A1").total).toBeGreaterThan(0);
  });

  // The load-bearing choice in stats.js: each module is worth a quarter of a
  // level, rather than every unit being worth the same. One finished A1
  // dialogue out of two is half the conversations module = 25% of the level,
  // where pooling units would put it near 2%. Asserting the averaged number
  // means the weighting can't be swapped back silently.
  it("averages the four modules rather than pooling their units", () => {
    const level = A1(CONVERSATION_LEVELS);
    const half = Math.round((1 / level.dialogues.length) * 100);
    const stats = levelStats(withWords({ [firstDialogueKey()]: "done" }), "A1");

    expect(stats.pct).toBe(Math.round(half / 4));
    expect(stats.done).toBe(1);
  });

  it("keeps a level's progress out of its neighbours", () => {
    const progress = withWords({ [firstDialogueKey()]: "done" });
    expect(levelStats(progress, "A2").done).toBe(0);
  });
});

describe("overallStats", () => {
  it("reports 0% on fresh progress and counts every unit in the app", () => {
    const stats = overallStats(EMPTY);
    const units = MODULE_STATS.reduce((sum, mod) => sum + moduleStats(EMPTY, mod.id).total, 0);

    expect({ done: stats.done, pct: stats.pct, total: stats.total }).toEqual({ done: 0, pct: 0, total: units });
  });

  it("rises when anything anywhere is finished", () => {
    const progress = withWords({ [firstStoryKey()]: "done" });
    expect(overallStats(progress).done).toBe(1);
    expect(overallStats(progress).pct).toBeGreaterThan(0);
  });
});

describe("levelLadder", () => {
  it("returns every level in ladder order with its accent intact", () => {
    const ladder = levelLadder(EMPTY);
    expect(ladder.map((entry) => entry.level.id)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
    for (const entry of ladder) {
      expect(entry.level.accent).toBeTruthy();
      expect(entry.stats.pct).toBe(0);
    }
  });
});
