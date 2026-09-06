import { describe, it, expect } from "vitest";
import { judge, announce, ATTEMPTS } from "./feedback.js";
import { FALSI_AMICI } from "../../data/falsiAmici.js";

// A hand-built trap rather than a real one, so the assertions pin the logic
// instead of the current contents of the collection — with one sweep over
// the real data at the end, because a `say` that could never be typed
// correctly would be a broken drill no unit test of `judge` would notice.
const trap = {
  id: "divano",
  it: "divano",
  bait: "divano",
  means: "a sofa",
  lookalike: "dywan",
  lookalikeLang: "pl",
  lookalikeMeans: "a carpet",
  note: "Both are furniture.",
  say: { it: "tappeto", also: ["arazzo"], en: "a carpet" },
};

const accented = { ...trap, say: { it: "realtà", also: [], en: "reality" } };

describe("judge", () => {
  it("takes the answer", () => {
    const verdict = judge(trap, "tappeto", 1);
    expect({ correct: verdict.correct, kind: verdict.kind, answer: verdict.answer }).toEqual({
      correct: true,
      kind: "exact",
      answer: null,
    });
  });

  // Two answers can both be right — Polish patetyczny is ampolloso or
  // solenne — and marking one wrong would teach a preference the language
  // does not have.
  it("takes any of the answers the pair genuinely has", () => {
    expect(judge(trap, "arazzo", 1).correct).toBe(true);
  });

  it("takes an answer without its accents, and spells it out anyway", () => {
    const verdict = judge(accented, "realta", 1);
    expect({ correct: verdict.correct, kind: verdict.kind, answer: verdict.answer }).toEqual({
      correct: true,
      kind: "accents",
      answer: "realtà",
    });
  });

  // The verdict the whole bench is a record of.
  it("names the false friend as the trap when it is typed", () => {
    const verdict = judge(trap, "divano", 1);
    expect({ correct: verdict.correct, kind: verdict.kind }).toEqual({ correct: false, kind: "trap" });
  });

  it("locates a near miss by how far it got", () => {
    const verdict = judge(trap, "tappero", 1);
    expect({ kind: verdict.kind, shared: verdict.shared }).toEqual({ kind: "wrong", shared: "tappe" });
  });

  // Two characters is where a shared prefix stops being a coincidence — the
  // same bar Mappatura delle parole uses, so the two drills locate alike.
  it("says nothing about a prefix too short to mean anything", () => {
    expect(judge(trap, "moquette", 1).shared).toBeNull();
  });

  // Produce first, reveal last: nothing is handed over while an attempt is
  // left, and that holds for the trap verdict too.
  it("reveals nothing until the attempts are spent", () => {
    expect(judge(trap, "divano", 1).answer).toBeNull();
    expect(judge(trap, "moquette", 1).answer).toBeNull();

    expect(judge(trap, "divano", ATTEMPTS).answer).toBe("tappeto");
    expect(judge(trap, "moquette", ATTEMPTS).answer).toBe("tappeto");
  });
});

// A screen reader gets no colour and no card, so the spoken twin has to
// carry everything the sighted learner reads — above all which way round the
// two words go, which is the entire content of a false friend.
describe("announce", () => {
  it("says which word means what when the trap is walked into", () => {
    const spoken = announce(judge(trap, "divano", 1));
    expect(spoken).toContain("divano");
    expect(spoken).toContain("a sofa");
    expect(spoken).toContain("a carpet");
    expect(spoken).toContain("Try once more.");
  });

  it("speaks the located prefix a sighted learner can see", () => {
    expect(announce(judge(trap, "tappero", 1))).toContain("tappe");
  });

  it("gives the answer once the attempts are spent, and not before", () => {
    expect(announce(judge(trap, "moquette", 1))).not.toContain("tappeto");
    expect(announce(judge(trap, "moquette", ATTEMPTS))).toContain("The answer is tappeto");
  });

  it("says nothing but correct when nothing else needs saying", () => {
    expect(announce(judge(trap, "tappeto", 1))).toBe("Correct.");
  });

  it("spells out an answer accepted without its accents", () => {
    expect(announce(judge(accented, "realta", 1))).toBe("Correct. Italian writes it realtà.");
  });
});

// The one sweep over the real collection: every entry has to be answerable,
// and no entry's answer may be its own trap — otherwise the drill would
// grade the mistake it exists to catch as the right answer.
describe("every trap in the collection", () => {
  it.each(FALSI_AMICI.map((t) => [t.id, t]))("%s takes its own answer and traps its own lookalike", (_id, real) => {
    expect(judge(real, real.say.it, 1).correct).toBe(true);
    expect(judge(real, real.bait, 1).kind).toBe("trap");
    for (const alt of real.say.also) {
      expect(judge(real, alt, 1).correct).toBe(true);
    }
  });
});
