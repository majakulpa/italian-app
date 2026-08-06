import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  wordKey,
  markWord,
  touchStreak,
  categoryKnownCount,
  drillKey,
  topicKnownCount,
  todayISO,
} from "./storage.js";

const level = { id: "A1" };
const category = {
  id: "greetings",
  words: [
    { it: "ciao", en: "hi" },
    { it: "grazie", en: "thanks" },
  ],
};
const topic = {
  id: "present-are",
  drills: [
    { id: "1", answer: "parlo" },
    { id: "2", answer: "parli" },
  ],
};

beforeEach(() => {
  localStorage.clear();
});

describe("loadProgress", () => {
  it("returns empty progress when nothing is stored", () => {
    expect(loadProgress()).toEqual({ words: {}, streak: { count: 0, lastDate: null } });
  });

  it("returns stored progress", () => {
    const progress = { words: { "A1:greetings:ciao": "known" }, streak: { count: 3, lastDate: "2026-08-05" } };
    localStorage.setItem("italiano:progress:v1", JSON.stringify(progress));
    expect(loadProgress()).toEqual(progress);
  });

  it("falls back to empty progress on corrupt JSON", () => {
    localStorage.setItem("italiano:progress:v1", "{not valid json");
    expect(loadProgress()).toEqual({ words: {}, streak: { count: 0, lastDate: null } });
  });

  it("fills in missing fields from older/partial saved shapes", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify({ words: { a: "known" } }));
    expect(loadProgress()).toEqual({ words: { a: "known" }, streak: { count: 0, lastDate: null } });
  });
});

describe("saveProgress / loadProgress roundtrip", () => {
  it("persists progress across save/load", () => {
    const progress = { words: { "A1:greetings:ciao": "known" }, streak: { count: 1, lastDate: "2026-08-06" } };
    saveProgress(progress);
    expect(loadProgress()).toEqual(progress);
  });
});

describe("wordKey", () => {
  it("builds a stable key from level, category, and word", () => {
    expect(wordKey(level, category, { it: "ciao" })).toBe("A1:greetings:ciao");
  });
});

describe("markWord", () => {
  it("sets a word's status without mutating the original progress", () => {
    const progress = { words: {}, streak: { count: 0, lastDate: null } };
    const next = markWord(progress, "A1:greetings:ciao", "known");
    expect(next.words).toEqual({ "A1:greetings:ciao": "known" });
    expect(progress.words).toEqual({});
  });

  it("overwrites an existing word's status", () => {
    const progress = { words: { "A1:greetings:ciao": "learning" }, streak: { count: 0, lastDate: null } };
    const next = markWord(progress, "A1:greetings:ciao", "known");
    expect(next.words["A1:greetings:ciao"]).toBe("known");
  });
});

describe("categoryKnownCount", () => {
  it("counts only words marked known in that category", () => {
    const progress = {
      words: {
        "A1:greetings:ciao": "known",
        "A1:greetings:grazie": "learning",
      },
      streak: { count: 0, lastDate: null },
    };
    expect(categoryKnownCount(progress, level, category)).toBe(1);
  });

  it("returns 0 when nothing is marked known", () => {
    const progress = { words: {}, streak: { count: 0, lastDate: null } };
    expect(categoryKnownCount(progress, level, category)).toBe(0);
  });
});

describe("drillKey", () => {
  it("builds a namespaced key from level, topic, and drill item", () => {
    expect(drillKey(level, topic, { id: "1" })).toBe("grammar:A1:present-are:1");
  });

  it("never collides with a vocab wordKey for the same level", () => {
    const vocabK = wordKey(level, category, { it: "ciao" });
    const grammarK = drillKey(level, topic, { id: "1" });
    expect(vocabK).not.toBe(grammarK);
  });
});

describe("topicKnownCount", () => {
  it("counts only drill items marked known in that topic", () => {
    const progress = {
      words: {
        "grammar:A1:present-are:1": "known",
        "grammar:A1:present-are:2": "learning",
      },
      streak: { count: 0, lastDate: null },
    };
    expect(topicKnownCount(progress, level, topic)).toBe(1);
  });

  it("returns 0 when nothing is marked known", () => {
    const progress = { words: {}, streak: { count: 0, lastDate: null } };
    expect(topicKnownCount(progress, level, topic)).toBe(0);
  });
});

describe("touchStreak", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a streak at 1 on the first-ever study session", () => {
    const progress = { words: {}, streak: { count: 0, lastDate: null } };
    const next = touchStreak(progress);
    expect(next.streak).toEqual({ count: 1, lastDate: todayISO() });
  });

  it("does not change the streak when studying again the same day", () => {
    const today = todayISO();
    const progress = { words: {}, streak: { count: 2, lastDate: today } };
    const next = touchStreak(progress);
    expect(next.streak).toEqual({ count: 2, lastDate: today });
  });

  it("increments the streak when studying exactly one day after the last session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T12:00:00Z"));
    const progress = { words: {}, streak: { count: 2, lastDate: "2026-08-05" } };
    const next = touchStreak(progress);
    expect(next.streak).toEqual({ count: 3, lastDate: "2026-08-06" });
  });

  it("resets the streak to 1 after a multi-day gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T12:00:00Z"));
    const progress = { words: {}, streak: { count: 5, lastDate: "2026-07-01" } };
    const next = touchStreak(progress);
    expect(next.streak).toEqual({ count: 1, lastDate: "2026-08-06" });
  });
});
