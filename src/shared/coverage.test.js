import { describe, it, expect } from "vitest";
import { coverage, coverageBands, lexiconStates, rankWeight, LEXICON_COVERAGE, BAND_SIZE } from "./coverage.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../data/fondamentale.js";
import { LEVELS } from "../data/vocab.js";
import { wordKey, markWord } from "./storage.js";
import { reviewItem } from "./srs.js";
import { MAX_BOX } from "./srs.js";
import { MODULE_STATS } from "./stats.js";

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

  it("counts every rank exactly once across the four states", () => {
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

  // The arithmetic sanity check from the header comment. Stated as what it
  // actually pins: a property of the *weighting*, that ranks 1–300 carry about
  // two thirds of running text. It says nothing about which Italian words sit
  // at those ranks — fondamentale.test.js owns the word list's quality — so
  // the ranks are summed directly rather than read off the entries, which
  // would have dressed a constant up as a fact about the data.
  it("puts ranks 1–300 at about two thirds of running text", () => {
    let top300 = 0;
    for (let r = 1; r <= 300; r += 1) top300 += rankWeight(r);
    expect(top300).toBeGreaterThan(0.6);
    expect(top300).toBeLessThan(0.7);
  });

  // ...and the link that makes the figure above describe the shipped file:
  // the seeded entries really are ranks 1–300 and not any 300 ranks.
  it("has seeded exactly the ranks that two thirds figure is about", () => {
    expect(FONDAMENTALE.map((e) => e.rank)).toEqual(
      Array.from({ length: 300 }, (_, i) => i + 1),
    );
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

  // A band reports two different percentages and they are not interchangeable.
  // `pct` is the band's share of ALL running Italian — it is what the ten
  // bands add up to the headline with. `bandPct` is how much of *this band*
  // the learner has, which is the one a progress bar inside a band wants.
  // Drawing a bar from `pct` would show a full band as a stub, because a late
  // band is only worth a couple of points of running text in the first place.
  it("separates a band's share of all Italian from its share of itself", () => {
    const studied = coverageBands(study(EMPTY, keyFor("madre"), MAX_BOX));
    const index = Math.floor((rankOf("la madre") - 1) / BAND_SIZE);
    const band = studied[index];

    // Same numerator, different denominators: all of running text vs the band.
    // Both quoted to one decimal, which is the file's stated contract.
    const oneDecimal = (f) => Math.round(f * 1000) / 10;
    expect(band.pct).toBe(oneDecimal(band.fraction));
    expect(band.bandPct).toBe(oneDecimal(band.fraction / band.weight));

    // And the gap is the whole point: this band is worth a small slice of
    // Italian, so its share of itself is far larger than its share of all of
    // it. A bar drawn from `pct` would be the wrong one by this factor.
    expect(band.bandPct).toBeGreaterThan(band.pct * 10);
  });

  // The bound that makes bandPct safe to draw a bar with, and pct unsafe:
  // bandPct is a real 0–100, while pct can never reach 100 for any band.
  it("keeps bandPct a real percentage and pct a slice of the whole", () => {
    const full = coverageBands(EMPTY);

    expect(full.every((b) => b.bandPct >= 0 && b.bandPct <= 100)).toBe(true);
    expect(full.every((b) => b.pct <= b.weightPct)).toBe(true);
    expect(Math.max(...full.map((b) => b.weightPct))).toBeLessThan(100);
  });
});

// ── The ceiling ─────────────────────────────────────────────────────────
//
// The headline is bounded by the content that ships, and the bound is low.
// Coverage learns that a word is known from one place — the vocabulary
// module's 120 words — and only 20 of those 120 normalise onto a
// FONDAMENTALE lemma. The other 100 move the figure by exactly zero, no
// matter how well they are learned, because they are not in the base 2,000.
//
// So this is the tripwire the reviewer asked for: it pins what a learner who
// has mastered *everything the app contains* actually sees. If the headline
// is ever again a near-constant that no amount of study can move, one of
// these numbers changes and this test says so. Raising them is the point —
// seed more of the lexicon, or widen the bridge, and come update this test on
// purpose. What must not happen is the ceiling moving silently.
describe("the ceiling a fully-mastered account reaches", () => {
  // Built through the modules' own write paths — reviewItem for the two graded
  // modules, markWord for the two that are only ever finished — so this is a
  // progress blob a real learner could own, not a hand-made fixture.
  function masterEverything() {
    let progress = EMPTY;

    for (const mod of MODULE_STATS) {
      for (const level of mod.levels) {
        for (const unit of mod.units(level)) {
          if (mod.scheduled) {
            for (let i = 0; i < MAX_BOX; i += 1) {
              progress = reviewItem(progress, unit.key, true, "2026-08-23");
            }
          } else {
            progress = markWord(progress, unit.key, mod.doneStatus);
          }
        }
      }
    }

    return progress;
  }

  const mastered = masterEverything();

  // Sanity: the blob really does have everything at the top of the ladder,
  // otherwise the numbers below would be a ceiling on nothing.
  it("really has mastered every unit the app ships", () => {
    const scheduled = MODULE_STATS.filter((m) => m.scheduled).flatMap((m) =>
      m.levels.flatMap((l) => m.units(l)),
    );
    expect(scheduled.length).toBeGreaterThan(0);
    expect(scheduled.every((u) => mastered.schedule[u.key].box === MAX_BOX)).toBe(true);
  });

  it("cannot get the headline above 1.6%, however much the learner studies", () => {
    expect(coverage(mastered).pct).toBe(1.6);
  });

  // The other half of the headline. 20 of 120 vocabulary words are in the base
  // 2,000, so "x / 2000 solid" stops at 20 — the denominator is a promise the
  // shipped content cannot come close to keeping.
  it("cannot get the solid count above 20 of the 2,000", () => {
    expect(coverage(mastered).counts.solid).toBe(20);
  });

  // Naming the cause, so a failure above is diagnosable: it is the bridge from
  // vocabulary to lexicon that is narrow, not the scheduler or the weighting.
  it("bridges only 20 of the vocabulary module's 120 words onto a lemma", () => {
    const vocab = MODULE_STATS.find((m) => m.id === "vocab");
    const words = vocab.levels.flatMap((l) => vocab.units(l));

    expect(words).toHaveLength(120);
    expect(lexiconStates(mastered).size).toBe(20);
  });
});
