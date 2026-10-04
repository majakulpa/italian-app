import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lexiconLemmas, main } from "./export-lexicon.mjs";
import { FONDAMENTALE } from "../src/data/fondamentale.js";

describe("lexiconLemmas", () => {
  // The whole reason this export exists. fondamentale.js stores an opaque noun
  // with its definite article, because on a noun whose ending does not give the
  // gender away the article *is* the gender. check_text.py matches single
  // tokens, so `la chiave` in the lexicon would never answer the token `chiave`
  // and the word would read as unknown — understating coverage on exactly the
  // nouns the list exists to carry.
  it("strips the article, leaving the lemma a token-level checker can match", () => {
    expect(
      lexiconLemmas([
        { it: "la chiave" },
        { it: "il problema" },
        { it: "l'amore" },
        { it: "i soldi" },
        { it: "la città" },
        { it: "tavolo" },
        { it: "parlare" },
      ])
    ).toEqual(["chiave", "problema", "amore", "soldi", "città", "tavolo", "parlare"]);
  });

  it("exports every entry, in rank order", () => {
    const lemmas = lexiconLemmas(FONDAMENTALE);
    expect(lemmas).toHaveLength(600);
    expect(lemmas[0]).toBe("essere");
    expect(lemmas.at(-1)).toBe("dicembre");
    expect(new Set(lemmas).size).toBe(lemmas.length);
  });

  // Deliberately not stemmed, and the gate depends on knowing that. `lemmaKey`
  // says so of itself; it is why the coverage measurement is a Python pass with
  // a real lemmatiser and not a JavaScript comparison.
  it("does not stem — the lexicon holds infinitives, not conjugations", () => {
    expect(lexiconLemmas([{ it: "parlare" }])).toEqual(["parlare"]);
    expect(lexiconLemmas([{ it: "parlo" }])).toEqual(["parlo"]);
  });
});

describe("the CLI", () => {
  it("writes a flat JSON array of strings, which is what check_text.py loads", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lexicon-"));
    const out = path.join(dir, "lexicon.json");
    expect(main(out)).toBe(0);
    const parsed = JSON.parse(fs.readFileSync(out, "utf8"));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.every((lemma) => typeof lemma === "string")).toBe(true);
    expect(parsed).toHaveLength(600);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("refuses to run without an output path", () => {
    expect(main(undefined)).toBe(2);
  });
});
