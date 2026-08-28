import { describe, it, expect } from "vitest";
import { foldTyped, sameTyped, accentsMissing, sharedPrefix } from "./typedAnswer.js";

describe("foldTyped", () => {
  it("strips the diacritics Italian actually uses", () => {
    expect(foldTyped("perché")).toBe("perche");
    expect(foldTyped("città")).toBe("citta");
    expect(foldTyped("però")).toBe("pero");
    expect(foldTyped("più")).toBe("piu");
  });

  it("folds case and stray whitespace away too", () => {
    expect(foldTyped("  Possibilità ")).toBe("possibilita");
    expect(foldTyped("la\tcena")).toBe("la cena");
  });

  // The point of NFD-and-strip rather than a substitution table: a decomposed
  // é typed by a Linux compose key and a precomposed é from an iPhone are the
  // same answer, and no list has to be kept up to date for that to hold.
  it("treats a decomposed accent as the same letter as a precomposed one", () => {
    const precomposed = "perch\u00e9"; // \u00e9 as a single code point
    const decomposed = "perche\u0301"; // e followed by a combining acute
    expect(precomposed).not.toBe(decomposed);
    expect(foldTyped(decomposed)).toBe(foldTyped(precomposed));
    expect(sameTyped(decomposed, precomposed)).toBe(true);
  });
});

describe("sameTyped", () => {
  it("accepts the answer without its accents", () => {
    expect(sameTyped("possibilita", "possibilità")).toBe(true);
  });

  it("still refuses a different word", () => {
    expect(sameTyped("possibile", "possibilità")).toBe(false);
  });

  it("does not accept a missing letter as a missing accent", () => {
    expect(sameTyped("citt", "città")).toBe(false);
  });
});

describe("accentsMissing", () => {
  it("is true when the letters are right and the marks are not", () => {
    expect(accentsMissing("possibilita", "possibilità")).toBe(true);
  });

  it("is false when the accent is already there", () => {
    expect(accentsMissing("possibilità", "possibilità")).toBe(false);
  });

  // Case and spacing are forgiven silently; only the accent is worth saying
  // something about, because only the accent is part of the spelling.
  it("is false for a difference that is only case or spacing", () => {
    expect(accentsMissing(" LEZIONE ", "lezione")).toBe(false);
  });

  it("is false when the answer is simply wrong", () => {
    expect(accentsMissing("cena", "colazione")).toBe(false);
  });
});

describe("sharedPrefix", () => {
  it("reports how far a wrong answer stayed on track", () => {
    expect(sharedPrefix("rivolucione", "rivoluzione")).toBe("rivolu");
  });

  it("returns the prefix in the answer's own spelling, accents and all", () => {
    // Folding shortens nothing here, but it does drop a combining mark — a
    // version that sliced the answer at an index found in the folded string
    // would come back a character short on a decomposed input.
    expect(sharedPrefix("città vecchia", "città")).toBe("città");
  });

  it("is empty when nothing matches from the front", () => {
    expect(sharedPrefix("pranzo", "cena")).toBe("");
  });

  it("is the whole answer when the answer is right", () => {
    expect(sharedPrefix("LEZIONE", "lezione")).toBe("lezione");
  });
});
