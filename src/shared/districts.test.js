import { describe, it, expect, afterEach, vi } from "vitest";
import {
  DISTRICTS,
  STREETS,
  CINEMA_SOLID_WORDS,
  CINEMA_DISTRICTS,
  cityState,
  districtById,
} from "./districts.js";
import { MODULE_STATS } from "./stats.js";
import { MODULES } from "../App.jsx";
import { CITY_ACCENTS } from "./theme.js";
import * as coverageModule from "./coverage.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { wordKey, drillKey, conversationKey, storyKey } from "./storage.js";
import { reviewItem } from "./srs.js";
import { FONDAMENTALE } from "../data/fondamentale.js";

const EMPTY = { words: {}, schedule: {} };

const state = (progress) => Object.fromEntries(cityState(progress).map((d) => [d.id, d]));

afterEach(() => {
  vi.restoreAllMocks();
});

// Right five times running is what the top Leitner box takes, and the top box
// is what "solid" means — seeded through reviewItem so the box and the status
// agree exactly as they would after five real sessions.
function solidify(progress, keys) {
  return keys.reduce((acc, key) => {
    let next = acc;
    for (let i = 0; i < 5; i += 1) next = reviewItem(next, key, true, "2026-08-25");
    return next;
  }, progress);
}

// One vocab key per distinct lexicon lemma — the only words that can move the
// solid count at all, since coverage.js bridges from the vocabulary deck by
// matching Italian strings. There are 20 of them in the whole app.
const LEXICON_KEYS = (() => {
  const ranked = new Map(FONDAMENTALE.map((entry) => [entry.it, entry.rank]));
  const byRank = new Map();

  for (const level of LEVELS) {
    for (const category of level.categories) {
      for (const word of category.words) {
        const rank = ranked.get(word.it);
        if (rank !== undefined && !byRank.has(rank)) byRank.set(rank, wordKey(level, category, word));
      }
    }
  }

  return [...byRank.values()];
})();

function allDone(moduleId) {
  const mod = MODULE_STATS.find((m) => m.id === moduleId);
  return Object.fromEntries(mod.levels.flatMap((level) => mod.units(level).map((unit) => [unit.key, mod.doneStatus])));
}

// The app cannot currently reach 600 solid words: only 20 of the vocabulary
// module's 120 words are inside the base 2,000, and coverage.js pins that
// ceiling on purpose. So the far side of Il Cinema's gate can only be reached
// by standing in for the coverage figure — stated outright rather than hidden
// behind a fixture name, because "unreachable with the content that ships" is
// itself the interesting fact. The tests that don't need 600 use real study.
function pretendSolidWords(count) {
  vi.spyOn(coverageModule, "coverage").mockReturnValue({ counts: { solid: count } });
}

describe("the district roster", () => {
  it("routes every district at something the app can actually show", () => {
    const routes = new Set([...MODULES.map((m) => m.id), "review"]);
    for (const district of DISTRICTS) {
      expect(routes, district.id).toContain(district.route);
    }
  });

  // A district with a `module` reads its counts through stats.js. An id the
  // registry doesn't know would silently report 0 / 0 rather than throw.
  it("names a real stats module wherever it claims one", () => {
    const ids = MODULE_STATS.map((m) => m.id);
    for (const district of DISTRICTS.filter((d) => d.module)) {
      expect(ids, district.id).toContain(district.module);
    }
  });

  // Every one of the four existing modules has to keep a front door, or
  // re-casting the home screen as a city would have quietly hidden one.
  it("gives all four modules a front door", () => {
    expect(
      DISTRICTS.filter((d) => d.module)
        .map((d) => d.module)
        .sort(),
    ).toEqual(MODULE_STATS.map((m) => m.id).sort());
  });

  // Rule 4 of the design system: colour carries meaning, so each district
  // owns a hue from the city palette and no two share one.
  it("gives each district its own colour from the city palette", () => {
    const accents = DISTRICTS.map((d) => d.accent);
    for (const accent of accents) expect(CITY_ACCENTS).toHaveProperty(accent);
    expect(new Set(accents).size).toBe(DISTRICTS.length);
  });

  it("runs every street between two districts that exist", () => {
    for (const [from, to] of STREETS) {
      expect(districtById(from), from).toBeDefined();
      expect(districtById(to), to).toBeDefined();
    }
  });

  // A district with no street to it is drawn but not connected to anything,
  // which reads as a mistake rather than as a place.
  it("leaves no district off the street network", () => {
    const connected = new Set(STREETS.flat());
    expect(DISTRICTS.filter((d) => !connected.has(d.id))).toEqual([]);
  });
});

describe("what a day-one map looks like", () => {
  it("opens L'Officina, Il Cantiere and Il Mercato from the very first visit", () => {
    const city = state(EMPTY);

    expect(city.officina.lock).toBeNull();
    expect(city.cantiere.lock).toBeNull();
    expect(city.mercato.lock).toBeNull();
  });

  it("shows each open district a real fraction rather than a percentage", () => {
    const city = state(EMPTY);

    expect(city.officina.status).toMatch(/^0 \/ \d+ words$/);
    expect(city.cantiere.status).toMatch(/^0 \/ \d+ drills$/);
    expect(city.mercato.status).toMatch(/^0 \/ \d+ dialogues$/);
  });

  it("shuts La Piazza and Il Cinema, and says what opens each", () => {
    const city = state(EMPTY);

    expect(city.piazza.lock.why).toMatch(/Opens the moment a word is waiting/);
    expect(city.piazza.status).toBe("nothing due yet");
    expect(city.cinema.lock.why).toContain(`${CINEMA_SOLID_WORDS} solid words`);
    expect(city.cinema.lock.why).toContain(`${CINEMA_DISTRICTS} districts finished`);
  });

  // The point of the lock, per the design: a visible door with a live counter
  // beats a door you didn't know was there. So the number has to be the
  // learner's real distance from it, earned by real study — no stub here.
  it("counts Il Cinema's remaining words down as words actually go solid", () => {
    expect(state(EMPTY).cinema.status).toBe(`${CINEMA_SOLID_WORDS} words to go`);

    const studied = solidify(EMPTY, LEXICON_KEYS.slice(0, 3));
    expect(state(studied).cinema.status).toBe(`${CINEMA_SOLID_WORDS - 3} words to go`);
  });

  it("draws on three genuinely different lexicon words to do it", () => {
    expect(LEXICON_KEYS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(LEXICON_KEYS.slice(0, 3)).size).toBe(3);
  });
});

describe("La Piazza", () => {
  // Not a pacing threshold: an empty review queue has nothing to show, which
  // is a fact about the data rather than a judgement about readiness.
  it("opens the moment something is due, and counts what is waiting", () => {
    const level = LEVELS.find((l) => l.id === "A1");
    const key = wordKey(level, level.categories[0], level.categories[0].words[0]);
    const city = state({ words: { [key]: "learning" }, schedule: {} });

    expect(city.piazza.lock).toBeNull();
    expect(city.piazza.status).toBe("1 item");
  });

  it("pluralises the queue past one", () => {
    const level = LEVELS.find((l) => l.id === "A1");
    const [first, second] = level.categories[0].words;
    const city = state({
      words: {
        [wordKey(level, level.categories[0], first)]: "learning",
        [wordKey(level, level.categories[0], second)]: "learning",
      },
      schedule: {},
    });

    expect(city.piazza.status).toBe("2 items");
  });

  // A story is finished, not scheduled, so it must never open La Piazza.
  it("stays shut for a finished story, which is read rather than drilled", () => {
    const level = STORY_LEVELS.find((l) => l.id === "A1");
    const city = state({ words: { [storyKey(level, level.stories[0])]: "done" }, schedule: {} });

    expect(city.piazza.lock).not.toBeNull();
  });
});

describe("Il Cinema's gate", () => {
  // The words half and the districts half are independent, and the tile has
  // to say which one is still outstanding — "2 districts to go" is a
  // different instruction from "540 words to go".
  it("switches its counter to districts once the words are there", () => {
    pretendSolidWords(CINEMA_SOLID_WORDS);
    expect(state(EMPTY).cinema.status).toBe(`${CINEMA_DISTRICTS} districts to go`);
  });

  it("counts a finished district off the second half of the condition", () => {
    pretendSolidWords(CINEMA_SOLID_WORDS);
    const city = state({ words: allDone("conversations"), schedule: {} });

    expect(city.mercato.done).toBe(true);
    expect(city.cinema.status).toBe("1 district to go");
  });

  it("stays shut on the districts alone, however many are finished", () => {
    const city = state({ words: { ...allDone("conversations"), ...allDone("stories") }, schedule: {} });

    expect(city.cinema.lock).not.toBeNull();
    expect(city.cinema.status).toBe(`${CINEMA_SOLID_WORDS} words to go`);
  });

  it("opens once both halves are met", () => {
    pretendSolidWords(CINEMA_SOLID_WORDS);
    const city = state({ words: { ...allDone("conversations"), ...allDone("stories") }, schedule: {} });

    expect(city.cinema.lock).toBeNull();
    expect(city.cinema.status).toMatch(/stories$/);
  });

  it("opens past the threshold, not only exactly on it", () => {
    pretendSolidWords(CINEMA_SOLID_WORDS + 40);
    const city = state({ words: { ...allDone("conversations"), ...allDone("stories") }, schedule: {} });

    expect(city.cinema.lock).toBeNull();
  });

  // La Piazza replays other districts rather than holding content of its own,
  // so it can't be one of the two — otherwise the second half of the gate
  // would be satisfiable by a district with nothing in it.
  it("never counts La Piazza toward the two districts", () => {
    expect(DISTRICTS.find((d) => d.id === "piazza").module).toBeNull();
  });
});

describe("cityState", () => {
  it("marks a district done once every unit of its module is", () => {
    const city = state({ words: allDone("grammar"), schedule: {} });

    expect(city.cantiere.done).toBe(true);
    expect(city.officina.done).toBe(false);
    expect(city.cantiere.status).toMatch(/^(\d+) \/ \1 drills$/);
  });

  it("counts a drill on Il Cantiere and a dialogue on Il Mercato, and nowhere else", () => {
    const grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
    const conversation = CONVERSATION_LEVELS.find((l) => l.id === "A1");
    const city = state({
      words: {
        [drillKey(grammar, grammar.topics[0], grammar.topics[0].drills[0])]: "known",
        [conversationKey(conversation, conversation.dialogues[0])]: "done",
      },
      schedule: {},
    });

    expect(city.cantiere.stats.done).toBe(1);
    expect(city.mercato.stats.done).toBe(1);
    expect(city.officina.stats.done).toBe(0);
    expect(city.cinema.stats.done).toBe(0);
  });

  it("gives La Piazza no stats to report, because a queue has no denominator", () => {
    expect(state(EMPTY).piazza.stats).toBeNull();
    expect(state(EMPTY).piazza.done).toBe(false);
  });
});
