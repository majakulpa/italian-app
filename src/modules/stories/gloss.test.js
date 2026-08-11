import { describe, it, expect } from "vitest";
import { tokenize, normalize, splitToken, lookupGloss } from "./gloss.js";

describe("tokenize", () => {
  it("keeps the whitespace so the paragraph can be rebuilt as written", () => {
    expect(tokenize("Marta arriva a Roma").join("")).toBe("Marta arriva a Roma");
  });
});

describe("normalize", () => {
  it("lowercases and strips punctuation around the word", () => {
    expect(normalize("«Voglio")).toBe("voglio");
    expect(normalize("piedi,")).toBe("piedi");
    expect(normalize("basso.»")).toBe("basso");
  });

  it("keeps apostrophes inside a word", () => {
    expect(normalize("l'acqua")).toBe("l'acqua");
  });
});

describe("splitToken", () => {
  it("peels punctuation off both ends, keeping the word intact", () => {
    expect(splitToken("«Voglio")).toEqual({ before: "«", core: "Voglio", after: "" });
    expect(splitToken("piedi,")).toEqual({ before: "", core: "piedi", after: "," });
    expect(splitToken("basso.»")).toEqual({ before: "", core: "basso", after: ".»" });
    expect(splitToken("nell'acqua")).toEqual({ before: "", core: "nell'acqua", after: "" });
  });

  it("rebuilds the original token", () => {
    for (const token of ["«Voglio", "sbagliata!", "6:40", "—"]) {
      const { before, core, after } = splitToken(token);
      expect(before + core + after).toBe(token);
    }
  });
});

describe("lookupGloss", () => {
  const gloss = { acqua: "water", "l'autobus": "the bus", piedi: "feet" };

  it("matches a word regardless of surrounding punctuation or case", () => {
    expect(lookupGloss(gloss, "Piedi,")).toEqual({ word: "piedi", meaning: "feet" });
  });

  it("matches an elided word on the part after the apostrophe", () => {
    expect(lookupGloss(gloss, "nell'acqua.")).toEqual({ word: "acqua", meaning: "water" });
  });

  it("prefers a whole-token key over the part after the apostrophe", () => {
    expect(lookupGloss(gloss, "l'autobus")).toEqual({ word: "l'autobus", meaning: "the bus" });
  });

  it("returns null for unglossed words, whitespace, and a missing gloss map", () => {
    expect(lookupGloss(gloss, "Roma")).toBeNull();
    expect(lookupGloss(gloss, " ")).toBeNull();
    expect(lookupGloss(undefined, "acqua")).toBeNull();
  });
});
