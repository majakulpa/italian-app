import { describe, it, expect } from "vitest";
import {
  COVERAGE_FLOOR,
  LEXICON_FLOOR,
  NEW_WORDS_CAP,
  SERIAL_TENSES,
  canonicalText,
  declaredLemmas,
  gateFailures,
} from "./serialGate.js";

// A minimal episode and the report a clean pipeline run would write for it.
const episode = () => ({
  id: "ep1",
  season: "Stagione 1 · Via Zamboni",
  title: "La chiave",
  pages: [["Marta torna a casa.", "La strada è senza gente."], ["Poi vede la chiave."]],
  newWords: [{ it: "la luce", en: "light", pl: "światło" }],
});

const report = (over = {}) => ({
  episodeId: "ep1",
  textSha256: "a".repeat(64),
  lexiconOnlyCoverage: 96.4,
  offLexiconLemmas: ["luce"],
  stageFlags: [],
  lexicon: { size: 600, source: "lexicon_fondamentale.json" },
  ...over,
});

const HASH = "a".repeat(64);

describe("canonicalText", () => {
  it("flattens pages to one paragraph per line, newline-terminated", () => {
    expect(canonicalText(episode())).toBe(
      "Marta torna a casa.\nLa strada è senza gente.\nPoi vede la chiave.\n"
    );
  });

  it("leaves no trace of where the page breaks fell", () => {
    const onePage = { pages: [["a", "b", "c"]] };
    const three = { pages: [["a"], ["b"], ["c"]] };
    expect(canonicalText(onePage)).toBe(canonicalText(three));
  });
});

describe("declaredLemmas", () => {
  // The declarations are written the way fondamentale.js writes a word — an
  // opaque noun carries its article — and the checker reports bare lemmas. If
  // these two did not meet, arm 3 would flag every declared noun as undeclared.
  it("strips the article, so a declaration written `la luce` answers the lemma `luce`", () => {
    const declared = declaredLemmas({
      newWords: [{ it: "la luce" }, { it: "l'aria" }, { it: "il tipo" }, { it: "strano" }],
    });
    expect([...declared].sort()).toEqual(["aria", "luce", "strano", "tipo"]);
  });
});

describe("gateFailures", () => {
  it("passes a measured episode whose unknown words were all declared", () => {
    expect(gateFailures(episode(), report(), HASH)).toEqual([]);
  });

  it("refuses an episode with no report", () => {
    expect(gateFailures(episode(), null, HASH)).toEqual([
      "ep1: no measurement report — unmeasured text cannot ship",
    ]);
  });

  // The anti-vacuity cases. An absent field must be a failure, not a pass:
  // `undefined < COVERAGE_FLOOR` is false, and an unguarded `.length` on an
  // absent array throws rather than reporting, so every field arms 2-6 read is
  // type-checked before it is trusted.
  it.each([
    ["episodeId is not a string", { episodeId: 42 }, "episodeId"],
    ["episodeId is empty", { episodeId: "" }, "episodeId"],
    ["textSha256 is not a string", { textSha256: 42 }, "textSha256"],
    ["textSha256 is not a sha256", { textSha256: "deadbeef" }, "textSha256"],
    ["coverage is a string", { lexiconOnlyCoverage: "96.4" }, "lexiconOnlyCoverage"],
    ["coverage is NaN", { lexiconOnlyCoverage: NaN }, "lexiconOnlyCoverage"],
    ["coverage is absent", { lexiconOnlyCoverage: undefined }, "lexiconOnlyCoverage"],
    ["off-lexicon lemmas are absent", { offLexiconLemmas: undefined }, "offLexiconLemmas"],
    ["stage flags are not an array", { stageFlags: {} }, "stageFlags"],
    ["the lexicon block is absent", { lexicon: null }, "lexicon"],
    ["the lexicon size is a string", { lexicon: { size: "600" } }, "lexicon"],
  ])("refuses a report where %s", (_name, over, field) => {
    expect(gateFailures(episode(), report(over), HASH)).toEqual([
      `ep1: report is malformed, unusable fields: ${field}`,
    ]);
  });

  it("names every unusable field at once", () => {
    const failures = gateFailures(episode(), report({ stageFlags: 0, lexicon: null }), HASH);
    expect(failures).toEqual(["ep1: report is malformed, unusable fields: stageFlags, lexicon"]);
  });

  it("refuses a report measured for a different episode", () => {
    expect(gateFailures(episode(), report({ episodeId: "ep2" }), HASH)).toContain(
      'ep1: report is for episode "ep2"'
    );
  });

  it("refuses text that has drifted from its measurement", () => {
    const failures = gateFailures(episode(), report(), "b".repeat(64));
    expect(failures).toEqual([
      "ep1: text has drifted from its measurement — report says aaaaaaaaaaaa…, " +
        "shipped text hashes to bbbbbbbbbbbb…",
    ]);
  });

  it("refuses an unknown word nobody declared", () => {
    const failures = gateFailures(
      episode(),
      report({ offLexiconLemmas: ["luce", "attimo", "tranquillo"] }),
      HASH
    );
    expect(failures).toEqual([
      "ep1: off-lexicon lemmas that are not declared new words: attimo, tranquillo",
    ]);
  });

  it("refuses more declared new words than the cap", () => {
    const over = episode();
    over.newWords = Array.from({ length: NEW_WORDS_CAP + 1 }, (_, i) => ({ it: `parola${i}` }));
    const failures = gateFailures(over, report({ offLexiconLemmas: [] }), HASH);
    expect(failures).toEqual([
      `ep1: ${NEW_WORDS_CAP + 1} declared new words, cap is ${NEW_WORDS_CAP}`,
    ]);
  });

  it("refuses a form outside the serial's three tenses", () => {
    const failures = gateFailures(
      episode(),
      report({ stageFlags: [{ word: "andrò", kind: "futuro" }, { word: "sia", kind: "congiuntivo" }] }),
      HASH
    );
    expect(failures).toEqual([
      `ep1: forms outside ${SERIAL_TENSES}: andrò[futuro], sia[congiuntivo]`,
    ]);
  });

  it("refuses coverage below the floor", () => {
    const failures = gateFailures(episode(), report({ lexiconOnlyCoverage: 92.9 }), HASH);
    expect(failures).toEqual([
      `ep1: lexicon-only coverage 92.9% is below the ${COVERAGE_FLOOR}% floor`,
    ]);
  });

  it("refuses a report measured against fewer lemmas than the serial opens at", () => {
    const failures = gateFailures(episode(), report({ lexicon: { size: 400 } }), HASH);
    expect(failures).toEqual([
      `ep1: measured against 400 lemmas, floor is ${LEXICON_FLOOR}`,
    ]);
  });

  it("reports every arm that failed, not just the first", () => {
    const broken = episode();
    broken.newWords = [];
    const failures = gateFailures(
      broken,
      report({
        episodeId: "ep9",
        lexiconOnlyCoverage: 80,
        stageFlags: [{ word: "sarà", kind: "futuro" }],
        lexicon: { size: 10 },
      }),
      "c".repeat(64)
    );
    expect(failures).toHaveLength(6);
  });
});
