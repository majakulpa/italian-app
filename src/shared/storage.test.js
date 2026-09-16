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
  mappeKey,
  mapKnownCount,
  trapKey,
  trapCaughtKey,
  isTrapCaught,
  trapsCaughtCount,
  stageEvidenceKey,
  hasStageEvidence,
  markStageShown,
  markStageProduced,
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

// Mappatura delle parole added no new shape to the blob — only a namespace inside the map
// every other module already writes into. That is the property worth pinning:
// a save written before Mappatura delle parole existed has to keep loading, and a mapping
// drill must not be able to collide with a vocab word or a grammar drill.
describe("mappeKey / mapKnownCount", () => {
  const map = { id: "zione", drills: [{ id: "cena" }, { id: "funzione" }] };

  it("namespaces a drill under its own map", () => {
    expect(mappeKey(map, map.drills[0])).toBe("mappe:zione:cena");
  });

  it("counts only the drills that landed first time", () => {
    const progress = {
      words: {
        [mappeKey(map, map.drills[0])]: "known",
        [mappeKey(map, map.drills[1])]: "learning",
      },
    };
    expect(mapKnownCount(progress, map)).toBe(1);
  });

  it("reads a save written before Mappatura delle parole existed as nothing drilled", () => {
    saveProgress({ version: 1, words: { "A1:greetings:ciao": "known" } });
    expect(mapKnownCount(loadProgress(), map)).toBe(0);
    // and the older progress survives the load untouched
    expect(loadProgress().words["A1:greetings:ciao"]).toBe("known");
  });
});

// Falsi Amici is the one module that keeps two facts about the same unit, so
// these are the tests that hold the two apart. Getting a trap right must not
// make the record of it having caught you disappear, and being caught by one
// must not read as progress.
describe("trapKey / trapCaughtKey", () => {
  const trap = { id: "divano" };

  it("namespaces the two facts about one trap under two different keys", () => {
    expect(trapKey(trap)).toBe("falsi:divano");
    expect(trapCaughtKey(trap)).toBe("falsi-caught:divano");
    expect(trapKey(trap)).not.toBe(trapCaughtKey(trap));
  });

  it("counts a trap as caught only once the caught key says so", () => {
    expect(isTrapCaught({ words: {} }, trap)).toBe(false);
    expect(isTrapCaught({ words: { [trapCaughtKey(trap)]: "learning" } }, trap)).toBe(true);
  });

  // The bench asks which traps have had you, not how the drilling is going.
  // A drill grade under `falsi:` must never be read as a catch, or the
  // collection would mark every trap the learner has merely practised.
  it("does not read a drill grade as a catch", () => {
    expect(isTrapCaught({ words: { [trapKey(trap)]: "known" } }, trap)).toBe(false);
    expect(isTrapCaught({ words: { [trapKey(trap)]: "learning" } }, trap)).toBe(false);
  });

  // The design's card reads `12 presi` — taken. Producing the right word
  // afterwards is progress and lives in the other key; it does not un-happen
  // the catch, and a record that quietly empties itself is not a record.
  it("keeps a trap caught once it is caught, whatever the drill grade beside it", () => {
    const progress = {
      words: { [trapCaughtKey(trap)]: "learning", [trapKey(trap)]: "known" },
    };
    expect(isTrapCaught(progress, trap)).toBe(true);
  });

  it("counts the caught ones out of a collection", () => {
    const traps = [{ id: "divano" }, { id: "droga" }, { id: "panna" }];
    const progress = {
      words: {
        [trapCaughtKey(traps[0])]: "learning",
        [trapCaughtKey(traps[2])]: "learning",
        [trapKey(traps[1])]: "known",
      },
    };
    expect(trapsCaughtCount(progress, traps)).toBe(2);
  });

  it("reads a save written before the bench existed as nothing caught", () => {
    saveProgress({ version: 1, words: { "A1:greetings:ciao": "known" } });
    expect(trapsCaughtCount(loadProgress(), [trap])).toBe(0);
    expect(loadProgress().words["A1:greetings:ciao"]).toBe("known");
  });
});

// The marker that decides whether a right answer is evidence of a stage. Every
// transition is here, because the rule is only as good as its worst edge: one
// that let a correction be followed straight by a counted answer would make
// the stage measure how well you copy what you were just shown.
describe("stage evidence markers", () => {
  const KEY = "grammar:B1:imperfetto:4";
  const MARKER = "stage-evidence:grammar:B1:imperfetto:4";
  const withMarker = (value) => ({ words: { [KEY]: "known", [MARKER]: value }, schedule: {} });
  const NONE = { words: { [KEY]: "known" }, schedule: {} };

  it("namespaces the marker apart from the unit's own grade", () => {
    expect(stageEvidenceKey(KEY)).toBe(MARKER);
    expect(stageEvidenceKey(KEY)).not.toBe(KEY);
  });

  it("counts as evidence only when the marker says produced", () => {
    expect(hasStageEvidence(NONE, KEY)).toBe(false);
    expect(hasStageEvidence(withMarker("shown"), KEY)).toBe(false);
    expect(hasStageEvidence(withMarker("produced"), KEY)).toBe(true);
  });

  // The unit's grade is a different fact. A known item is not produced.
  it("does not read the unit's own status as evidence", () => {
    expect(hasStageEvidence({ words: { [KEY]: "produced" } }, KEY)).toBe(false);
  });

  describe("markStageShown", () => {
    it("marks an item with no marker as shown", () => {
      expect(markStageShown(NONE, KEY).words[MARKER]).toBe("shown");
    });

    // Showing always wins: being shown the form undoes earlier evidence.
    it("overwrites produced", () => {
      expect(markStageShown(withMarker("produced"), KEY).words[MARKER]).toBe("shown");
    });

    it("leaves shown as shown", () => {
      expect(markStageShown(withMarker("shown"), KEY).words[MARKER]).toBe("shown");
    });
  });

  describe("markStageProduced", () => {
    it("marks an item with no marker as produced", () => {
      expect(markStageProduced(NONE, KEY).words[MARKER]).toBe("produced");
    });

    it("leaves produced as produced", () => {
      expect(markStageProduced(withMarker("produced"), KEY).words[MARKER]).toBe("produced");
    });

    // The clean answer straight after a correction clears the flag and does
    // not count; the one after that does.
    it("clears shown without counting it", () => {
      const cleared = markStageProduced(withMarker("shown"), KEY);
      expect(cleared.words).not.toHaveProperty(MARKER);
      expect(hasStageEvidence(cleared, KEY)).toBe(false);

      expect(markStageProduced(cleared, KEY).words[MARKER]).toBe("produced");
    });

    it("needs a clean answer after the last showing, however many came before", () => {
      let progress = NONE;
      progress = markStageProduced(progress, KEY);
      progress = markStageShown(progress, KEY);
      progress = markStageProduced(progress, KEY);
      expect(hasStageEvidence(progress, KEY)).toBe(false);
      progress = markStageProduced(progress, KEY);
      expect(hasStageEvidence(progress, KEY)).toBe(true);
    });
  });

  it("touches nothing but the marker, and leaves the original progress untouched", () => {
    const before = withMarker("shown");
    const snapshot = structuredClone(before);

    expect(markStageShown(before, KEY).words[KEY]).toBe("known");
    expect(markStageProduced(before, KEY).words[KEY]).toBe("known");
    expect(markStageProduced(withMarker("produced"), KEY).words[KEY]).toBe("known");
    expect(before).toEqual(snapshot);
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
