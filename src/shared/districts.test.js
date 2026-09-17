import { describe, it, expect, afterEach, vi } from "vitest";
import {
  DISTRICTS,
  STREETS,
  cityState,
  districtById,
  districtForModule,
} from "./districts.js";
import { MODULE_STATS } from "./stats.js";
import { MODULES } from "../App.jsx";
import { STATIONS, HUBS } from "./stations.js";
import { CITY_ACCENTS } from "./theme.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { wordKey, drillKey, conversationKey, storyKey } from "./storage.js";

const EMPTY = { words: {}, schedule: {} };

const state = (progress) => Object.fromEntries(cityState(progress).map((d) => [d.id, d]));

afterEach(() => {
  vi.restoreAllMocks();
});

function allDone(moduleId) {
  const mod = MODULE_STATS.find((m) => m.id === moduleId);
  return Object.fromEntries(mod.levels.flatMap((level) => mod.units(level).map((unit) => [unit.key, mod.doneStatus])));
}

describe("the district roster", () => {
  // A district's route is either a module id, the review session, or a hub.
  //
  // This used to spell the hubs out — `"review", "officina"` — which was fine
  // while L'Officina was the only one and became a special case the moment Il
  // Mercato stopped routing straight at the conversations module. So the hubs
  // come from shared/stations.js instead, derived from what actually registers
  // stations under them. That makes the check stronger rather than looser: a
  // district may route at a hub exactly when something is inside it, so a
  // district pointing at a hub screen with no stations registered still fails
  // here. Review stays named, because it is a route with no stations at all —
  // it replays what the other districts wrote.
  it("routes every district at something the app can actually show", () => {
    const routes = new Set([...MODULES.map((m) => m.id), "review", ...HUBS]);
    for (const district of DISTRICTS) {
      expect(routes, district.id).toContain(district.route);
    }
  });

  // And the other half of that: a hub is only a legal route because stations
  // sit in it, so every station has to name a hub that is a district on the
  // map. A station with a `hub` nobody draws would be reachable from nowhere
  // while still counting toward the reachability check above.
  it("puts every station inside a district that exists", () => {
    for (const station of STATIONS) {
      expect(districtById(station.hub), station.id).toBeDefined();
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

  // Every module that has a district has to keep it, or re-casting the home
  // screen as a city would have quietly hidden one.
  //
  // This test used to carry a BEHIND_THE_MENU exception list holding "mappe",
  // because the `officina` district still routed straight to `vocab` and the
  // NavMenu was Mappatura delle parole's only front door. The hub screen closed that, so
  // the list is gone — but a hub means a module can now be reached one door
  // in rather than straight off a district, and that broke an implication the
  // check had been leaning on since it was written.
  //
  // Until the hub, every district's `route` *was* its `module`, so
  // "d.module is set" and "pressing this district opens that module" were the
  // same statement. L'Officina is the first district where they come apart:
  // it keeps `module: "vocab"` because that is what its tile counts, while
  // its `route` goes to the workshop. Reading `d.module` as reachability
  // would credit the map with a front door onto the deck that the district
  // itself does not provide — and it would still do so with every bench
  // deleted, which is the one thing this test exists to catch.
  //
  // So a door is only a door when something opens it: a district contributes
  // its module when its route reaches that module directly, a station
  // contributes what its route opens, and a district pointing at a hub
  // contributes nothing on its own. What the hub reaches is its stations' job
  // to say.
  //
  // `BENCHES` used to be named here directly, and Il Mercato is why it no
  // longer is. The dialogues left the map's own routing table when the market
  // became a hub, so `conversations` is now reached exactly the way `vocab` is
  // — from inside a hub — and a check that only knew about L'Officina's
  // benches would have reported the app's oldest conversation module as having
  // no front door. STATIONS is the union both hubs register in.
  it("gives every module a front door on the map, whether or not it owns a district", () => {
    const fromMap = [
      ...DISTRICTS.filter((d) => d.module && d.route === d.module).map((d) => d.module),
      ...STATIONS.filter((s) => s.route && s.module).map((s) => s.route),
    ];

    expect([...new Set(fromMap)].sort()).toEqual(MODULE_STATS.map((m) => m.id).sort());
  });

  // The other half of that: a station that claims a module has to name one
  // that exists, and it has to open it. A `route` pointing nowhere would be
  // a card that does nothing when pressed.
  it("opens a real module from every station that says it opens one", () => {
    const ids = MODULES.map((m) => m.id);
    for (const station of STATIONS.filter((s) => s.module)) {
      expect(ids, station.id).toContain(station.route);
      expect(station.module, station.id).toBe(station.route);
    }
  });

  // A route implied a module until La Riserva, and it no longer does: a
  // routed station either names a module it opens, or says outright that it
  // is a view — a screen that reads the progress other stations wrote and
  // keeps none of its own, the way ReviewModule is a route rather than a
  // MODULES entry. What stays illegal is opening something while silently
  // claiming to be a module.
  it("makes every routed station either a module or an admitted view", () => {
    for (const station of STATIONS.filter((s) => s.route)) {
      expect(Boolean(station.module) !== Boolean(station.view), station.id).toBe(true);
    }
  });

  // A view counts nothing of its own, so it must not carry a MODULE_STATS id
  // by the back door — that is what would let it drift back into claiming
  // progress it does not write.
  it("keeps a view out of the module registry", () => {
    const ids = MODULE_STATS.map((m) => m.id);
    for (const station of STATIONS.filter((s) => s.view)) {
      expect(ids, station.id).not.toContain(station.route);
      expect(station.module, station.id).toBeNull();
    }
  });

  // Every station declares which hub it lives in, and that field is what the
  // reachability checks above and districtForModule below are driven off — so
  // a station with no hub would be counted as a door while being drawn by no
  // screen.
  it("makes every station name the hub that draws it", () => {
    for (const station of STATIONS) {
      expect(HUBS, station.id).toContain(station.hub);
    }
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

// La Piazza colours and labels every due item by the district it came from,
// and the screen carries no "no district" branch — so a scheduled module that
// does not resolve would throw there rather than degrade.
describe("districtForModule", () => {
  it("resolves every scheduled module to a district on the map", () => {
    for (const mod of MODULE_STATS.filter((m) => m.scheduled)) {
      expect(districtForModule(mod.id), mod.id).toBeDefined();
    }
  });

  it("sends a district's own module to that district", () => {
    expect(districtForModule("grammar").id).toBe("cantiere");
    expect(districtForModule("conversations").id).toBe("mercato");
  });

  // The station path, which is the half that used to be a hand-written map.
  // A workbench resolves to L'Officina and a stall to Il Mercato, off the same
  // `hub` field, with nothing in districts.js naming either module.
  it("sends a station's module to the hub that holds it", () => {
    expect(districtForModule("riserva").id).toBe("officina");
    expect(districtForModule("articoli").id).toBe("officina");
    expect(districtForModule("scenes").id).toBe("mercato");
  });

  it("resolves nothing for a module id that does not exist", () => {
    expect(districtForModule("nowhere")).toBeUndefined();
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

  it("shuts La Piazza, and says what opens it", () => {
    const city = state(EMPTY);

    expect(city.piazza.lock.why).toMatch(/Opens the moment a word is waiting/);
    expect(city.piazza.status).toBe("nothing due yet");
  });

  // Il Cinema used to be gated at 600 solid words. The lexicon held 500
  // entries of a 2,000 target at the time, so 500 solid was the ceiling and
  // the gate asked for more words than the app contained — the ten graded
  // readers behind it were shut for good, reachable only through the
  // NavMenu. Ranks 501–600 raised the lexicon to exactly 600 entries, so the
  // gate is no longer unreachable in principle, but that is a fact about the
  // ceiling, not about any account's progress — the readers stay unlocked
  // here regardless. See districts.js for why the threshold belongs to the
  // unbuilt serial instead.
  it("opens Il Cinema from the very first visit, onto the readers that ship", () => {
    const city = state(EMPTY);

    expect(city.cinema.lock).toBeNull();
    expect(city.cinema.status).toMatch(/^0 \/ \d+ stories$/);
  });

  // The guard on the whole class of bug: a lock nobody can open is worse than
  // no lock, because the tile states a condition and then never honours it.
  // Every lock the map draws has to be satisfiable by something a learner can
  // actually do, so the only one left is the one that turns on the data.
  it("draws no lock the shipped content cannot open", () => {
    const shut = cityState(EMPTY).filter((district) => district.lock);

    expect(shut.map((d) => d.id)).toEqual(["piazza"]);

    // And La Piazza's opens on a single answered item, which is reachable:
    // one real vocabulary word, answered once and now overdue.
    const level = LEVELS[0];
    const key = wordKey(level, level.categories[0], level.categories[0].words[0]);
    const withOne = { words: { [key]: "known" }, schedule: { [key]: { box: 2, due: "2020-01-01", last: "2020-01-01" } } };
    expect(state(withOne).piazza.lock).toBeNull();
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
