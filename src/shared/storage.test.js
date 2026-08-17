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
  conversationKey,
  isConversationDone,
  todayISO,
  addDaysISO,
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
const dialogue = { id: "cafe" };

beforeEach(() => {
  localStorage.clear();
});

const EMPTY = { words: {}, schedule: {}, streak: { count: 0, lastDate: null } };

describe("loadProgress", () => {
  it("returns empty progress when nothing is stored", () => {
    expect(loadProgress()).toEqual(EMPTY);
  });

  it("returns stored progress", () => {
    const progress = {
      words: { "A1:greetings:ciao": "known" },
      schedule: { "A1:greetings:ciao": { box: 2, due: "2026-08-06", last: "2026-08-05" } },
      streak: { count: 3, lastDate: "2026-08-05" },
    };
    localStorage.setItem("italiano:progress:v1", JSON.stringify(progress));
    expect(loadProgress()).toEqual(progress);
  });

  it("falls back to empty progress on corrupt JSON", () => {
    localStorage.setItem("italiano:progress:v1", "{not valid json");
    expect(loadProgress()).toEqual(EMPTY);
  });

  it("fills in missing fields from older/partial saved shapes", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify({ words: { a: "known" } }));
    expect(loadProgress()).toEqual({ ...EMPTY, words: { a: "known" } });
  });

  // The whole reason scheduling went into its own map: a blob saved before
  // the scheduler existed has to keep loading, with its words intact and an
  // empty schedule, without any migration step.
  it("loads a pre-scheduler blob with its words intact and no schedule", () => {
    const v1 = { words: { "A1:greetings:ciao": "known" }, streak: { count: 4, lastDate: "2026-08-05" } };
    localStorage.setItem("italiano:progress:v1", JSON.stringify(v1));

    expect(loadProgress()).toEqual({ ...v1, schedule: {} });
  });
});

describe("saveProgress / loadProgress roundtrip", () => {
  it("persists progress across save/load", () => {
    const progress = {
      words: { "A1:greetings:ciao": "known" },
      schedule: { "A1:greetings:ciao": { box: 3, due: "2026-08-09", last: "2026-08-06" } },
      streak: { count: 1, lastDate: "2026-08-06" },
    };
    saveProgress(progress);
    expect(loadProgress()).toEqual(progress);
  });
});

describe("addDaysISO", () => {
  it("advances a date by whole days", () => {
    expect(addDaysISO("2026-08-17", 3)).toBe("2026-08-20");
  });

  it("rolls over month and year boundaries", () => {
    expect(addDaysISO("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("returns the same day for zero, which is what box 1 stores", () => {
    expect(addDaysISO("2026-08-17", 0)).toBe("2026-08-17");
  });

  // Anchored to UTC midnight so it can't disagree with todayISO() — a local
  // -time implementation would drift by a day for anyone west of UTC.
  it("agrees with todayISO when adding nothing to today", () => {
    expect(addDaysISO(todayISO(), 0)).toBe(todayISO());
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

describe("conversationKey", () => {
  it("builds a namespaced key from level and dialogue", () => {
    expect(conversationKey(level, dialogue)).toBe("conversation:A1:cafe");
  });

  it("never collides with a grammar drillKey for the same level", () => {
    const grammarK = drillKey(level, topic, { id: "1" });
    const conversationK = conversationKey(level, dialogue);
    expect(grammarK).not.toBe(conversationK);
  });
});

describe("isConversationDone", () => {
  it("returns true once the dialogue is marked done", () => {
    const progress = { words: { "conversation:A1:cafe": "done" }, streak: { count: 0, lastDate: null } };
    expect(isConversationDone(progress, level, dialogue)).toBe(true);
  });

  it("returns false when not yet marked done", () => {
    const progress = { words: {}, streak: { count: 0, lastDate: null } };
    expect(isConversationDone(progress, level, dialogue)).toBe(false);
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
