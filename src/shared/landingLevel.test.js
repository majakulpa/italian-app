import { describe, it, expect } from "vitest";
import { isLevelComplete, landingLevel } from "./landingLevel.js";
import { markWord, wordKey } from "./storage.js";
import { LEVELS } from "../data/vocab.js";

const EMPTY = { version: 2, words: {}, schedule: {} };

// Mark every word of a level known, the way a finished level's save looks.
function complete(progress, level) {
  return level.categories.reduce(
    (p, cat) => cat.words.reduce((q, w) => markWord(q, wordKey(level, cat, w), "known"), p),
    progress
  );
}

// One word known: the level is started, not finished.
function started(progress, level) {
  const cat = level.categories[0];
  return markWord(progress, wordKey(level, cat, cat.words[0]), "known");
}

const [a1, a2, b1] = LEVELS;

describe("isLevelComplete", () => {
  it("is false for an untouched level", () => {
    expect(isLevelComplete(EMPTY, a1)).toBe(false);
  });

  it("is false while one word is still unknown", () => {
    const cat = a1.categories[0];
    const all = complete(EMPTY, a1);
    const words = { ...all.words };
    delete words[wordKey(a1, cat, cat.words[0])];
    expect(isLevelComplete({ ...all, words }, a1)).toBe(false);
  });

  it("is false when a word is only learning, not known", () => {
    const cat = a1.categories[0];
    const all = complete(EMPTY, a1);
    expect(isLevelComplete(markWord(all, wordKey(a1, cat, cat.words[0]), "learning"), a1)).toBe(false);
  });

  it("is true once every word in every category is known", () => {
    expect(isLevelComplete(complete(EMPTY, a1), a1)).toBe(true);
  });

  it("is false for a level with no words, rather than vacuously true", () => {
    expect(isLevelComplete(EMPTY, { id: "X", categories: [{ id: "none", words: [] }] })).toBe(false);
  });
});

describe("landingLevel", () => {
  it("opens on the first level on a first visit", () => {
    expect(landingLevel(LEVELS, EMPTY, null)).toBe(a1);
  });

  it("returns to the remembered level even when an earlier one is unfinished", () => {
    expect(landingLevel(LEVELS, EMPTY, "B1")).toBe(b1);
  });

  it("ignores a remembered id that no longer names a level", () => {
    expect(landingLevel(LEVELS, EMPTY, "B3")).toBe(a1);
  });

  // The case in the report: A1 finished, A2 and B1 both part-done, nothing
  // remembered — land on A2, the next one with work left in it.
  it("skips finished levels to the first unfinished one", () => {
    const progress = started(started(complete(EMPTY, a1), a2), b1);
    expect(landingLevel(LEVELS, progress, null)).toBe(a2);
  });

  it("moves off the remembered level once it is finished", () => {
    const progress = started(complete(complete(EMPTY, a1), a2), b1);
    expect(landingLevel(LEVELS, progress, "A2")).toBe(b1);
  });

  it("stays on the remembered level while it still has work left", () => {
    const progress = started(complete(EMPTY, a1), b1);
    expect(landingLevel(LEVELS, progress, "B1")).toBe(b1);
  });

  it("keeps the remembered level when every level is finished", () => {
    const progress = LEVELS.reduce(complete, EMPTY);
    expect(landingLevel(LEVELS, progress, "A2")).toBe(a2);
  });

  it("falls back to the last level, not the first, when everything is finished", () => {
    const progress = LEVELS.reduce(complete, EMPTY);
    expect(landingLevel(LEVELS, progress, null)).toBe(LEVELS[LEVELS.length - 1]);
  });
});
