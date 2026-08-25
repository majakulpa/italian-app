import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  wordKey,
  markWord,
  categoryKnownCount,
  drillKey,
  topicKnownCount,
  conversationKey,
  isConversationDone,
  todayISO,
  addDaysISO,
  loadThemeMode,
  saveThemeMode,
  PROGRESS_VERSION,
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

const EMPTY = { version: PROGRESS_VERSION, words: {}, schedule: {} };

describe("loadProgress", () => {
  it("returns empty progress when nothing is stored", () => {
    expect(loadProgress()).toEqual(EMPTY);
  });

  it("returns stored progress", () => {
    const progress = {
      version: PROGRESS_VERSION,
      words: { "A1:greetings:ciao": "known" },
      schedule: { "A1:greetings:ciao": { box: 2, due: "2026-08-06", last: "2026-08-05" } },
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

  it("fills in words and schedule when a save has neither", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify({ schedule: null }));
    expect(loadProgress()).toEqual(EMPTY);
  });

  // The whole reason scheduling went into its own map: a blob saved before
  // the scheduler existed has to keep loading, with its words intact and an
  // empty schedule.
  it("loads a pre-scheduler blob with its words intact and no schedule", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify({ words: { "A1:greetings:ciao": "known" } }));

    expect(loadProgress()).toEqual({ ...EMPTY, words: { "A1:greetings:ciao": "known" } });
  });
});

// The migration that matters: a real v1 save, written by the app before the
// streak was retired, has to come through with everything a learner earned.
// The only thing that may disappear is the streak counter itself.
describe("loadProgress — migrating a version 1 save", () => {
  const V1 = {
    words: { "A1:greetings:ciao": "known", "grammar:A1:present-are:1": "learning" },
    schedule: { "A1:greetings:ciao": { box: 4, due: "2026-09-01", last: "2026-08-25" } },
    streak: { count: 37, lastDate: "2026-08-22" },
  };

  it("keeps every word and every schedule entry", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify(V1));

    const loaded = loadProgress();
    expect(loaded.words).toEqual(V1.words);
    expect(loaded.schedule).toEqual(V1.schedule);
  });

  it("drops the streak and stamps the new version", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify(V1));

    const loaded = loadProgress();
    expect(loaded.version).toBe(PROGRESS_VERSION);
    expect(loaded).not.toHaveProperty("streak");
  });

  // Migration has to be idempotent: the app saves what it loaded, so the
  // migrated blob goes straight back into the same slot and is read again on
  // the next visit.
  it("re-loads a migrated save unchanged", () => {
    localStorage.setItem("italiano:progress:v1", JSON.stringify(V1));

    const once = loadProgress();
    saveProgress(once);
    expect(loadProgress()).toEqual(once);
  });
});

describe("saveProgress / loadProgress roundtrip", () => {
  it("persists progress across save/load", () => {
    const progress = {
      version: PROGRESS_VERSION,
      words: { "A1:greetings:ciao": "known" },
      schedule: { "A1:greetings:ciao": { box: 3, due: "2026-08-09", last: "2026-08-06" } },
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
    const progress = { words: {} };
    const next = markWord(progress, "A1:greetings:ciao", "known");
    expect(next.words).toEqual({ "A1:greetings:ciao": "known" });
    expect(progress.words).toEqual({});
  });

  it("overwrites an existing word's status", () => {
    const progress = { words: { "A1:greetings:ciao": "learning" } };
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
    };
    expect(categoryKnownCount(progress, level, category)).toBe(1);
  });

  it("returns 0 when nothing is marked known", () => {
    const progress = { words: {} };
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
    };
    expect(topicKnownCount(progress, level, topic)).toBe(1);
  });

  it("returns 0 when nothing is marked known", () => {
    const progress = { words: {} };
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
    const progress = { words: { "conversation:A1:cafe": "done" } };
    expect(isConversationDone(progress, level, dialogue)).toBe(true);
  });

  it("returns false when not yet marked done", () => {
    const progress = { words: {} };
    expect(isConversationDone(progress, level, dialogue)).toBe(false);
  });
});

// The theme choice deliberately lives under its own key, so resetting
// progress can't wipe it and vice versa.
describe("loadThemeMode / saveThemeMode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips an explicit choice", () => {
    saveThemeMode("dark");
    expect(loadThemeMode()).toBe("dark");
  });

  // No stored value is what "follow the OS" means (see useThemeMode.js), so
  // clearing has to remove the key rather than store an empty string.
  it("clears the stored choice back to following the OS", () => {
    saveThemeMode("light");
    saveThemeMode(null);

    expect(loadThemeMode()).toBeNull();
    expect(localStorage.getItem("italiano:theme:v1")).toBeNull();
  });

  it("reads as no choice when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadThemeMode()).toBeNull();
  });

  // Private browsing throws on write; the app should fall back to the OS
  // preference rather than crash on a theme toggle.
  it("swallows a write failure instead of throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveThemeMode("dark")).not.toThrow();
  });
});
