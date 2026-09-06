import { describe, it, expect } from "vitest";
import { TRAP_SETS, FALSI_AMICI, trapByWord } from "./falsiAmici.js";
import { MAPS, LANG_LABELS } from "./mappe.js";

// A false friend is a claim about two languages at once, so what these tests
// can check is the *shape* of the claim — that both halves are there, that
// they differ, that nothing is stated twice in two places that could drift.
// Whether `panna` really is cream is a language fact and lives in the review
// of the file itself; what a test can hold is that the collection never
// grows a second copy of something a map already declares.

const eachTrap = FALSI_AMICI.map((trap) => [trap.id, trap]);

describe("the collection", () => {
  it("gives every trap a unique id", () => {
    const ids = FALSI_AMICI.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("draws from both sets and keeps neither empty", () => {
    expect(TRAP_SETS.map((s) => s.id)).toEqual(["mappe", "altri"]);
    for (const set of TRAP_SETS) {
      expect(set.traps.length, set.id).toBeGreaterThan(0);
    }
    expect(FALSI_AMICI.length).toBe(TRAP_SETS.reduce((n, s) => n + s.traps.length, 0));
  });

  it.each(eachTrap)("%s states both halves of the pair, and they differ", (_id, trap) => {
    expect(trap.it.trim()).toBeTruthy();
    expect(trap.means.trim()).toBeTruthy();
    expect(trap.lookalike.trim()).toBeTruthy();
    expect(trap.lookalikeMeans.trim()).toBeTruthy();
    expect(trap.means).not.toBe(trap.lookalikeMeans);
    expect(LANG_LABELS[trap.lookalikeLang]).toBeDefined();
    expect(trap.note.trim()).toBeTruthy();
  });

  // The answer to reach for is the thing that makes a trap drillable, and it
  // must not be the trap: an entry whose `say` was its own false friend would
  // grade the mistake as the right answer.
  it.each(eachTrap)("%s says what to reach for instead, and it is not the trap", (_id, trap) => {
    expect(trap.say.it.trim()).toBeTruthy();
    expect(trap.say.en.trim()).toBeTruthy();
    expect(trap.say.it).not.toBe(trap.bait);
    for (const alt of trap.say.also) {
      expect(alt, trap.id).not.toBe(trap.bait);
      expect(alt, trap.id).not.toBe(trap.say.it);
    }
  });

  // `bait` is what a learner would actually type: no article in front of it,
  // because nothing types an article into a one-word answer box. Le Mappe
  // writes `l'attualità` on its card, which is right there and wrong here.
  it("strips the article off the word a learner would type", () => {
    const attualita = FALSI_AMICI.find((t) => t.id === "attualita");
    expect(attualita.it).toBe("l'attualità");
    expect(attualita.bait).toBe("attualità");
  });
});

// The whole point of the `from` indirection: the maps stay the single source
// of what a trap they generate *is*, and this file adds only the production
// answer they state in prose rather than in data.
describe("the traps the maps already declare", () => {
  const mapTraps = MAPS.flatMap((map) => map.traps);

  it("collects every one of them, and copies none", () => {
    const collected = FALSI_AMICI.filter((t) => t.source === "mappe");
    expect(collected.map((t) => t.id).sort()).toEqual(mapTraps.map((t) => t.id).sort());

    for (const trap of collected) {
      const declared = mapTraps.find((t) => t.id === trap.id);
      // Field for field the map's, not a second wording of it.
      expect({ id: trap.id, it: trap.it, means: trap.means, note: trap.note }).toEqual({
        id: declared.id,
        it: declared.it,
        means: declared.means,
        note: declared.note,
      });
    }
  });

  // The other half of "never copy": a trap a map declares must not also be
  // written out longhand in this file's own list. `colazione` twice is
  // exactly the drift the indirection exists to prevent.
  it("never authors a second entry for a word a map already traps", () => {
    const own = FALSI_AMICI.filter((t) => t.source !== "mappe").map((t) => t.it);
    for (const declared of mapTraps) {
      expect(own, declared.id).not.toContain(declared.it);
    }
  });
});

// The join Le Mappe writes through. It has to hit on the map trap that is a
// real false friend and miss on the three that are the rule overreaching,
// because those are a different lesson and the bench is not a list of them.
describe("trapByWord", () => {
  it("finds the trap behind a word the maps bait with", () => {
    expect(trapByWord("colazione").id).toBe("colazione");
  });

  it("ignores case and accents, the way a typed answer does", () => {
    expect(trapByWord("Attualita").id).toBe("attualita");
  });

  it("returns null for a map trap that is not a word in either language", () => {
    for (const word of ["citità", "musico", "psichiatrista"]) {
      expect(trapByWord(word), word).toBeNull();
    }
  });

  // Every trap in the collection is reachable by the word a learner types,
  // or the drill would grade a catch it could never record.
  it.each(eachTrap)("%s is reachable by the word that walks into it", (id, trap) => {
    expect(trapByWord(trap.bait).id).toBe(id);
  });
});
