import { describe, it, expect } from "vitest";
import { judge, announce, drillSuffix, appliedRule, ATTEMPTS } from "./feedback.js";
import { MAPS } from "../../data/mappe.js";

// The five verdicts are the module's whole argument with the standard
// wrong → cross → answer pattern, so each one is pinned here on real data
// rather than on a fixture: if the maps change under it, these should notice.

const zione = MAPS.find((m) => m.id === "zione");
const ita = MAPS.find((m) => m.id === "ita");

const drill = (map, id) => map.drills.find((d) => d.id === id);

const rivoluzione = drill(zione, "rivoluzione"); // pl, has extras
const cena = drill(zione, "cena"); // pl, the trap: kolacja is not colazione
const possibilita = drill(ita, "possibilita"); // en, accented answer
const citta = drill(ita, "citta"); // en, the trap: city is not *citità

describe("drillSuffix", () => {
  it("finds the ending the prompt is actually an instance of", () => {
    expect(drillSuffix(zione, rivoluzione)).toBe("-cja");
    expect(drillSuffix(ita, possibilita)).toBe("-ity");
  });

  // The -ico map lists both -ic and -ical, and `historical` matches only the
  // longer one — a first-match-wins lookup that checked -ic first would have
  // to not match it, and does not.
  it("picks the ending that fits when a route offers more than one", () => {
    const ico = MAPS.find((m) => m.id === "ico");
    expect(drillSuffix(ico, drill(ico, "storico"))).toBe("-ical");
    expect(drillSuffix(ico, drill(ico, "elettrico"))).toBe("-yczny");
  });

  it("states the rule as the drill uses it", () => {
    expect(appliedRule(zione, rivoluzione)).toBe("-cja → -zione");
  });
});

describe("a right answer", () => {
  it("names the rule that was applied", () => {
    const verdict = judge(zione, rivoluzione, "rivoluzione", 1);
    expect(verdict.correct).toBe(true);
    expect(verdict.kind).toBe("exact");
    expect(verdict.applied).toBe("-cja → -zione");
    expect(verdict.answer).toBeNull();
  });

  // Design screen 09's whole point: telling someone their intuition is
  // working means naming the part nobody taught them.
  it("names the sub-pattern nobody taught, when the drill has one", () => {
    const verdict = judge(zione, rivoluzione, "rivoluzione", 1);
    expect(verdict.extras.map((e) => `${e.from} → ${e.to}`)).toEqual(["rewo- → rivo-"]);
    expect(announce(verdict)).toContain("You also changed rewo- to rivo-.");
  });

  it("has nothing extra to name on a drill with no sub-pattern", () => {
    const verdict = judge(zione, drill(zione, "funzione"), "funzione", 1);
    expect(verdict.extras).toEqual([]);
    expect(announce(verdict)).toBe("Correct. You applied -cja → -zione.");
  });

  it("accepts a missing accent and then shows the spelling anyway", () => {
    const verdict = judge(ita, possibilita, "possibilita", 1);
    expect(verdict.correct).toBe(true);
    expect(verdict.kind).toBe("accents");
    expect(verdict.answer).toBe("possibilità");
    expect(announce(verdict)).toContain("Italian writes it possibilità.");
  });

  it("forgives case and stray spaces without remarking on them", () => {
    const verdict = judge(zione, drill(zione, "porzione"), "  Porzione ", 1);
    expect(verdict.kind).toBe("exact");
    expect(verdict.answer).toBeNull();
  });

  // On a trap item the rule is what is being disproved, so praising the
  // learner for applying it would be the opposite of the lesson.
  it("claims no rule was applied when the item is one the map gets wrong", () => {
    const verdict = judge(zione, cena, "cena", 1);
    expect(verdict.correct).toBe(true);
    expect(verdict.applied).toBeNull();
    expect(verdict.target).toBeNull();
    expect(announce(verdict)).toBe("Correct.");
  });
});

describe("a wrong answer gets located, not solved", () => {
  it("withholds the answer on the first attempt and offers another go", () => {
    const verdict = judge(zione, rivoluzione, "rivolucione", 1);
    expect(verdict.correct).toBe(false);
    expect(verdict.last).toBe(false);
    expect(verdict.answer).toBeNull();
    expect(announce(verdict)).toContain("Try once more.");
  });

  it("reveals only once the attempts are spent", () => {
    const verdict = judge(zione, rivoluzione, "rivolucione", ATTEMPTS);
    expect(verdict.last).toBe(true);
    expect(verdict.answer).toBe("rivoluzione");
    expect(announce(verdict)).toContain("The answer is rivoluzione.");
  });

  it("says the ending landed and the stem did not", () => {
    const verdict = judge(zione, rivoluzione, "revoluzione", 1);
    expect(verdict.kind).toBe("stem");
    expect(verdict.target).toBe("-zione");
    expect(announce(verdict)).toContain("The ending -zione is right; the word in front of it is not.");
  });

  it("says the ending is what missed when it did", () => {
    const verdict = judge(zione, rivoluzione, "rivoluzioni", 1);
    expect(verdict.kind).toBe("ending");
    expect(announce(verdict)).toContain("This map lands on -zione, and that answer does not.");
  });

  it("points at how far the answer stayed on track", () => {
    const verdict = judge(zione, rivoluzione, "rivolucione", 1);
    expect(verdict.shared).toBe("rivolu");
    expect(announce(verdict)).toContain("You have rivolu right, and it goes wrong after that.");
  });

  it("says nothing about a prefix when there isn't one worth naming", () => {
    const verdict = judge(zione, rivoluzione, "xyz", 1);
    expect(verdict.shared).toBeNull();
    expect(announce(verdict)).not.toContain("right, and it goes wrong");
  });

  // A single shared letter is a coincidence — half the Italian nouns in the
  // app start with a c — so it is not reported as progress.
  it("does not call one shared letter a prefix", () => {
    expect(judge(zione, rivoluzione, "ratto", 1).shared).toBeNull();
    expect(judge(zione, rivoluzione, "rialzo", 1).shared).toBe("ri");
  });
});

describe("the traps", () => {
  // The most useful wrong answer in the module: the learner applied the rule
  // correctly and the rule is what failed. Saying "incorrect" there would
  // teach exactly the wrong lesson.
  it("recognises the map's own output as the map's mistake, not the learner's", () => {
    const verdict = judge(zione, cena, "colazione", 1);
    expect(verdict.kind).toBe("trap");
    expect(verdict.trap.instead).toBe("colazione");
    expect(announce(verdict)).toContain("colazione is what the map gives you, and it means breakfast.");
  });

  it("still reveals the real answer once the attempts are spent", () => {
    const verdict = judge(ita, citta, "citità", ATTEMPTS);
    expect(verdict.kind).toBe("trap");
    expect(verdict.answer).toBe("città");
  });

  // On a trap item there is no ending to have landed on, so the feedback
  // must not demand one — "this map lands on -ità" would be false advice
  // about the very item that proves it doesn't.
  it("never names the rule's ending on an item that sits outside the rule", () => {
    const verdict = judge(zione, cena, "pranzo", 1);
    expect(verdict.kind).toBe("ending");
    expect(verdict.target).toBeNull();
    const said = announce(verdict);
    expect(said).not.toContain("-zione");
    expect(said).toContain("Not quite.");
  });
});
