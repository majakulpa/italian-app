import { describe, it, expect } from "vitest";
import { MAPS, LANG_LABELS } from "./mappe.js";
import { drillSuffix } from "../modules/mappe/feedback.js";
import { CITY_ACCENTS } from "../shared/theme.js";

// Le Mappe is authored linguistic data, and a wrong example here is worse
// than a bug: it teaches the learner something false, confidently, and a
// Polish native spots it instantly. So the invariants below are the ones a
// human proofreader would apply, written down.
//
// The load-bearing one is "every example demonstrates its own rule". A card
// that says `-cja → -zione` and then lists `policja → polizia` has quietly
// stopped being a rule and gone back to being a word list — and that is
// exactly what the design's own screen 08 does, which is how this test
// earned its place.

const strip = (suffix) => suffix.replace(/^-/, "");
const routeOf = (map, lang) => map.routes.find((r) => r.lang === lang);
const endsWithAny = (word, suffixes) => suffixes.some((s) => word.endsWith(strip(s)));

const eachMap = MAPS.map((map) => [map.id, map]);
const eachDrill = MAPS.flatMap((map) => map.drills.map((drill) => [`${map.id}/${drill.id}`, map, drill]));
const eachPair = MAPS.flatMap((map) =>
  map.routes.flatMap((route) => route.pairs.map((pair) => [`${map.id}/${route.lang}/${pair.src}`, map, route, pair])),
);

describe("the maps themselves", () => {
  it("gives every map a distinct id and a distinct city accent", () => {
    expect(new Set(MAPS.map((m) => m.id)).size).toBe(MAPS.length);
    expect(new Set(MAPS.map((m) => m.accent)).size).toBe(MAPS.length);
  });

  it.each(eachMap)("%s paints in an accent the design system actually has", (_id, map) => {
    expect(CITY_ACCENTS[map.accent]).toBeDefined();
  });

  it.each(eachMap)("%s states its Italian ending as a suffix", (_id, map) => {
    expect(map.rule.to.startsWith("-")).toBe(true);
    expect(map.rule.to.length).toBeGreaterThan(1);
  });

  it.each(eachMap)("%s offers routes in languages the module can label", (_id, map) => {
    const langs = map.routes.map((r) => r.lang);
    expect(new Set(langs).size).toBe(langs.length);
    for (const lang of langs) expect(LANG_LABELS[lang]).toBeDefined();
    for (const route of map.routes) {
      expect(route.from.length).toBeGreaterThan(0);
      for (const suffix of route.from) expect(suffix.startsWith("-")).toBe(true);
      expect(route.pairs.length).toBeGreaterThanOrEqual(3);
      expect(route.heading.trim()).toBeTruthy();
    }
  });

  it.each(eachMap)("%s says what the ending brings with it", (_id, map) => {
    expect(map.reach.trim()).toBeTruthy();
    expect(map.notes.length).toBeGreaterThan(0);
    for (const note of map.notes) expect(note.trim()).toBeTruthy();
  });
});

describe("worked examples", () => {
  // The whole claim of a map is that the rule holds. An example that doesn't
  // follow it is either a mistake or an exception being smuggled in as a
  // rule, and both are worth failing over.
  it.each(eachPair)("%s starts from the ending its route claims", (_id, _map, route, pair) => {
    expect(endsWithAny(pair.src, route.from)).toBe(true);
  });

  it.each(eachPair)("%s lands on the ending the map teaches", (_id, map, _route, pair) => {
    expect(pair.it.endsWith(strip(map.rule.to))).toBe(true);
  });

  // A Polish source word is opaque to nobody, but the *Italian* it produces
  // still needs a meaning attached, and on an English route the prompt is
  // already the meaning. So the gloss is required exactly where it carries
  // information.
  it.each(eachPair)("%s glosses the meaning unless the prompt already is one", (_id, _map, route, pair) => {
    if (route.lang === "en") {
      expect(pair.en).toBeUndefined();
    } else {
      expect(pair.en?.trim()).toBeTruthy();
    }
  });

  it.each(eachMap)("%s never lists the same Italian word twice", (_id, map) => {
    const words = map.routes.flatMap((r) => r.pairs.map((p) => p.it));
    expect(new Set(words).size).toBe(words.length);
  });
});

describe("drills", () => {
  it.each(eachMap)("%s gives every drill a distinct id", (_id, map) => {
    const ids = map.drills.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(4);
  });

  it.each(eachDrill)("%s prompts from a route the map has", (_id, map, drill) => {
    expect(routeOf(map, drill.srcLang)).toBeDefined();
    expect(endsWithAny(drill.src, routeOf(map, drill.srcLang).from)).toBe(true);
    // feedback.js derives the rule it praises from this, and has no branch
    // for "no suffix matched" — because of this assertion.
    expect(drillSuffix(map, drill)).toBeTruthy();
  });

  it.each(eachDrill)("%s glosses a non-English prompt", (_id, _map, drill) => {
    if (drill.srcLang === "en") {
      expect(drill.en).toBeUndefined();
    } else {
      expect(drill.en?.trim()).toBeTruthy();
    }
  });

  // Produce first: the drill has to ask the learner to *apply* the rule to a
  // word the card never worked through. Re-asking `mobilność → mobilità`
  // three cards after showing it is recall, and recall is the thing every
  // other module in the app already does.
  it.each(eachDrill)("%s asks for a word the card did not already hand over", (_id, map, drill) => {
    const shown = map.routes.flatMap((r) => r.pairs);
    expect(shown.map((p) => p.it)).not.toContain(drill.it);
    expect(shown.map((p) => p.src)).not.toContain(drill.src);
  });

  it.each(eachDrill)("%s lands on the rule, or is a trap that deliberately doesn't", (_id, map, drill) => {
    const onRule = drill.it.endsWith(strip(map.rule.to));
    expect(onRule).toBe(!drill.trap);
  });

  it.each(eachDrill)("%s names any sub-pattern it expects beyond the rule", (_id, _map, drill) => {
    expect(Array.isArray(drill.extras)).toBe(true);
    for (const extra of drill.extras) {
      expect(extra.from).not.toBe(extra.to);
      expect(extra.note.trim()).toBeTruthy();
    }
  });
});

describe("traps", () => {
  // The plan is explicit that a card with no trap is suspicious, because a
  // correspondence that reliably produces the right shape has no opinion at
  // all about the meaning. Every map owes at least one.
  it.each(eachMap)("%s teaches at least one false friend of its own", (_id, map) => {
    expect(map.traps.length).toBeGreaterThan(0);
  });

  it.each(eachMap)("%s keeps each trap distinct from the word it looks like", (_id, map) => {
    for (const trap of map.traps) {
      expect(trap.it).not.toBe(trap.lookalike);
      expect(trap.means).not.toBe(trap.lookalikeMeans);
      expect(LANG_LABELS[trap.lookalikeLang]).toBeDefined();
      expect(trap.note.trim()).toBeTruthy();
    }
  });

  // A trap drill is the one place the map is wrong, so its wrong answer has
  // to be the map's *own* output — otherwise it is just a hard question, and
  // the "you applied the rule and the rule is the problem" feedback would be
  // a lie.
  it.each(eachMap)("%s drills at least one item where the map itself fails", (_id, map) => {
    const trapped = map.drills.filter((d) => d.trap);
    expect(trapped.length).toBeGreaterThan(0);

    for (const drill of trapped) {
      expect(drill.trap.instead).not.toBe(drill.it);
      expect(drill.trap.instead.endsWith(strip(map.rule.to))).toBe(true);
      expect(drill.trap.why.trim()).toBeTruthy();
      expect(drill.trap.means.trim()).toBeTruthy();
    }
  });
});

describe("across the whole set", () => {
  it("never asks for the same Italian answer under two different maps", () => {
    const answers = MAPS.flatMap((map) => map.drills.map((d) => d.it));
    expect(new Set(answers).size).toBe(answers.length);
  });

  it("keeps drill keys unique once they are namespaced", () => {
    const keys = MAPS.flatMap((map) => map.drills.map((d) => `${map.id}:${d.id}`));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
