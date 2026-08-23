import { describe, it, expect } from "vitest";
import { coverage, coverageBands, lexiconStates, rankWeight, LEXICON_COVERAGE, BAND_SIZE } from "./coverage.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../data/fondamentale.js";
import { LEVELS } from "../data/vocab.js";
import { wordKey } from "./storage.js";
import { reviewItem } from "./srs.js";
import { MAX_BOX } from "./srs.js";

const EMPTY = { version: 2, words: {}, schedule: {} };

// The vocabulary module is where coverage gets its evidence, so the tests
// build progress the way the app does — a real key, graded through reviewItem.
function keyFor(italian) {
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => w.it === italian);
      if (word) return wordKey(level, category, word);
    }
  }
  throw new Error(`no vocab word "${italian}"`);
}

function rankOf(lemma) {
  const entry = FONDAMENTALE.find((e) => e.it === lemma);
  return entry.rank;
}

// Right n times running puts an item in the top box; once puts it in box 2.
function study(progress, key, times) {
  let next = progress;
  for (let i = 0; i < times; i += 1) next = reviewItem(next, key, true, "2026-08-23");
  return next;
}

describe("rankWeight", () => {
  it("is worth nothing outside the list", () => {
    expect(rankWeight(0)).toBe(0);
    expect(rankWeight(FONDAMENTALE_TARGET + 1)).toBe(0);
    expect(rankWeight(FONDAMENTALE_TARGET)).toBeGreaterThan(0);
  });

  // Zipf: the r-th word is worth 1/r. This is the whole reason coverage isn't
  // a word count, so it gets asserted as a ratio rather than a vibe.
  it("falls off as 1/rank", () => {
    expect(rankWeight(1) / rankWeight(2)).toBeCloseTo(2, 10);
    expect(rankWeight(10) / rankWeight(100)).toBeCloseTo(10, 10);
  });

  // The task's own example, and the sentence the whole file exists to make
  // true: a word near the top is worth far more than one near the bottom.
  it("makes rank 12 worth far more than rank 1900", () => {
    expect(rankWeight(12)).toBeGreaterThan(rankWeight(1900) * 100);
  });

  it("sums to what the whole base vocabulary is worth", () => {
    let total = 0;
    for (let r = 1; r <= FONDAMENTALE_TARGET; r += 1) total += rankWeight(r);
    expect(total).toBeCloseTo(LEXICON_COVERAGE, 10);
  });
});

describe("coverage", () => {
  it("is zero, and the whole list unseen, on a fresh account", () => {
    const result = coverage(EMPTY);
    expect(result.pct).toBe(0);
    expect(result.counts.unseen).toBe(FONDAMENTALE_TARGET);
    expect(result.seeded).toBe(FONDAMENTALE.length);
  });

  it("counts every rank exactly once across the five states", () => {
    const progress = study(EMPTY, keyFor("madre"), MAX_BOX);
    const { counts } = coverage(progress);

    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(FONDAMENTALE_TARGET);
    expect(counts.solid).toBe(1);
  });

  it("adds exactly the weight of the word that became known", () => {
    const progress = study(EMPTY, keyFor("madre"), MAX_BOX);
    expect(coverage(progress).fraction).toBeCloseTo(rankWeight(rankOf("la madre")), 12);
  });

  // The point of the whole exercise. Two words, both worth one word each on a
  // count, worth very different amounts of readable text.
  it("is not a word count — a top-ranked word is worth more than a low one", () => {
    const high = coverage(study(EMPTY, keyFor("madre"), MAX_BOX)).fraction;
    const low = coverage(study(EMPTY, keyFor("stazione"), MAX_BOX)).fraction;

    expect(rankOf("la madre")).toBeLessThan(rankOf("la stazione"));
    expect(high).toBeGreaterThan(low);
  });

  // Box 1–2 is same-day and next-day recall. Coverage claims you'd understand
  // the word in running text, which is a stronger claim than that.
  it("counts known and solid, and not learning", () => {
    const key = keyFor("madre");
    expect(coverage(study(EMPTY, key, 1)).fraction).toBe(0);
    expect(coverage(study(EMPTY, key, 2)).fraction).toBeGreaterThan(0);
  });

  it("counts a word met but never recalled as met, and not as coverage", () => {
    const progress = { ...EMPTY, words: { [keyFor("madre")]: "met" } };
    const result = coverage(progress);

    expect(result.counts.met).toBe(1);
    expect(result.fraction).toBe(0);
  });

  // The arithmetic sanity check from the header comment: knowing the first
  // 300 words of Italian is worth roughly two thirds of running text — which
  // is also why the design's serial can't open at 400 words.
  it("puts the whole seeded 300 at about two thirds of running text", () => {
    let top300 = 0;
    for (const entry of FONDAMENTALE) top300 += rankWeight(entry.rank);
    expect(top300).toBeGreaterThan(0.6);
    expect(top300).toBeLessThan(0.7);
  });
});

describe("lexiconStates", () => {
  it("maps a studied vocab word onto its lexicon rank", () => {
    const states = lexiconStates(study(EMPTY, keyFor("madre"), MAX_BOX));
    expect(states.get(rankOf("la madre"))).toBe("solid");
  });

  // "la madre" in the lexicon, "madre" in the vocab deck — the article
  // convention would silently zero the coverage figure without this.
  it("matches across the article convention", () => {
    expect(FONDAMENTALE.find((e) => e.it === "la madre")).toBeTruthy();
    expect(lexiconStates(study(EMPTY, keyFor("madre"), 2)).size).toBeGreaterThan(0);
  });

  // Most of the vocabulary module is outside the base 2,000 — "buongiorno"
  // is not a fondamentale lemma — and those words simply don't appear.
  it("ignores vocab words the lexicon doesn't hold", () => {
    const states = lexiconStates(study(EMPTY, keyFor("buongiorno"), MAX_BOX));
    expect(states.size).toBe(0);
  });
});

describe("coverageBands", () => {
  const bands = coverageBands(EMPTY);

  it("cuts the 2,000 into fasce of 200, in rank order", () => {
    expect(bands).toHaveLength(FONDAMENTALE_TARGET / BAND_SIZE);
    expect(bands[0]).toMatchObject({ from: 1, to: 200 });
    expect(bands[2]).toMatchObject({ from: 401, to: 600 });
    expect(bands.at(-1)).toMatchObject({ from: 1801, to: FONDAMENTALE_TARGET });
  });

  it("adds up to the whole list's worth", () => {
    const total = bands.reduce((sum, band) => sum + band.weight, 0);
    expect(total).toBeCloseTo(LEXICON_COVERAGE, 10);
  });

  // The reason the Riserva grid is drawn in frequency order in the first
  // place: the top-left corner is worth vastly more than the bottom-right.
  it("makes the first band worth many times the last", () => {
    expect(bands[0].weightPct).toBeGreaterThan(bands.at(-1).weightPct * 20);
  });

  it("reports how much of each band the data file actually holds", () => {
    expect(bands.map((b) => b.seeded)).toEqual([200, 100, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("puts a studied word in its own band and leaves the others alone", () => {
    const studied = coverageBands(study(EMPTY, keyFor("madre"), MAX_BOX));
    const rank = rankOf("la madre");
    const index = Math.floor((rank - 1) / BAND_SIZE);

    expect(studied[index].counts.solid).toBe(1);
    expect(studied.filter((b, i) => i !== index).every((b) => b.counts.solid === 0)).toBe(true);
  });
});
