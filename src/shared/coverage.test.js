import { describe, it, expect } from "vitest";
import { coverage, coverageBands, lexiconStates, lexiconUnits, rankWeight, LEXICON_COVERAGE } from "./coverage.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET, BAND_SIZE } from "../data/fondamentale.js";
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

  // ...and the link that makes the two-thirds figure above describe what the
  // file used to hold, plus the same check for where the file actually is
  // now: the seeded entries are ranks 1–400, contiguous from 1, and not any
  // 400 ranks. fondamentale.test.js owns contiguity as its own invariant;
  // this is the version that ties it to the ceiling arithmetic.
  it("has seeded exactly the ranks the ceiling is computed over", () => {
    expect(FONDAMENTALE.map((e) => e.rank)).toEqual(
      Array.from({ length: 400 }, (_, i) => i + 1),
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
    expect(bands.map((b) => b.seeded)).toEqual([200, 200, 0, 0, 0, 0, 0, 0, 0, 0]);
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

// The bridge feeds three readers and they do not want the same subset. This
// one is the deck alone, because its caller answers "where did you meet this
// word" — a place, in a category, inside an example sentence — and a Riserva
// unit is the lexicon asking about itself.
describe("lexiconUnits", () => {
  it("reports the deck units behind a rank and never the Riserva's own", () => {
    const rank = rankOf("bene");
    const units = lexiconUnits(rank);

    expect(units.length).toBeGreaterThan(0);
    expect(units.every((u) => u.moduleId === "vocab")).toBe(true);
    expect(units.every((u) => u.item.ex)).toBe(true);
  });

  it("reports nothing for a rank with no word written down", () => {
    expect(FONDAMENTALE.length).toBeLessThan(FONDAMENTALE_TARGET);
    expect(lexiconUnits(FONDAMENTALE.length + 1)).toEqual([]);
  });

  it("reports nothing for a lexicon word the deck never teaches", () => {
    expect(lexiconUnits(rankOf("il problema"))).toEqual([]);
  });
});

// ── The ceiling ─────────────────────────────────────────────────────────
//
// The headline is bounded by the content that ships, and this pins where the
// bound is. It used to be 1.6% and 20 words, because coverage learned that a
// word was known from exactly one place — the vocabulary module's 120 words,
// of which only 20 normalise onto a FONDAMENTALE lemma. The other 100 moved
// the figure by zero however well they were learned, because they are not in
// the base 2,000, and no amount of study could reach the rest of the list.
//
// La Riserva's drill is what moved it past that. Every entry in
// fondamentale.js is a unit under a `riserva:` key, graded through the same
// reviewItem() as everything else, so the bridge in coverage.js has two
// sources and every rank with a word written down is reachable. The ceiling
// is therefore the coverage of the seeded ranks and nothing else — 1 to 300
// moved it to 66.1%, and ranks 301–400, added for their own sake as content
// rather than mechanism, moved it again:
//
//   69.1%   Σ 1/r over ranks 1–400, normalised so the whole 2,000 comes to
//           LEXICON_COVERAGE. Up from 66.1% at 300 entries — still roughly
//           two thirds and a bit more, because ranks past 300 are worth less
//           each but there are 100 more of them.
//   400     of 2,000 solid. The denominator is a promise the *list* cannot
//           keep yet, and that is now the only reason it cannot: the
//           mechanism reaches every entry, and 1,600 ranks have no entry.
//
// So this stays the tripwire it was, with the failure it catches turned
// around. Before, it caught the headline being a near-constant nothing could
// move. Now it catches the headline being *capped by the mechanism again* —
// if a change narrows the bridge, un-schedules the bench, or drops a source,
// 69.1 falls and this says so. The other direction is a content change:
// seeding entry 401 raises both numbers, and the honest thing to do is come
// and update them on purpose. What must not happen is either move being
// silent.
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

  // The same walk over one module, so a test can ask what a single source is
  // worth on its own — which is how the old 1.6% ceiling is still checkable
  // after the bridge stopped being one module wide.
  function masterOne(moduleId) {
    let progress = EMPTY;
    const mod = MODULE_STATS.find((m) => m.id === moduleId);

    for (const level of mod.levels) {
      for (const unit of mod.units(level)) {
        for (let i = 0; i < MAX_BOX; i += 1) progress = reviewItem(progress, unit.key, true, "2026-08-23");
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

  it("reaches 69.1% — the worth of every rank that has a word behind it", () => {
    expect(coverage(mastered).pct).toBe(69.1);
  });

  // The other half of the headline. Every seeded rank is drillable, so
  // "x / 2000 solid" stops at however many entries the file holds — 400 —
  // and the denominator is now a promise only the *list* is short of.
  it("reaches 400 of the 2,000 solid, which is the length of the list", () => {
    expect(coverage(mastered).counts.solid).toBe(FONDAMENTALE.length);
    expect(coverage(mastered).counts.solid).toBe(400);
  });

  // Naming the cause, so a failure above is diagnosable. The ceiling is a
  // fact about the file, not about the bridge: the drill reaches every entry,
  // and the arithmetic agrees with a direct sum over the ranks that have one.
  it("is exactly the coverage of ranks 1 to 400 and nothing else", () => {
    const seeded = FONDAMENTALE.reduce((sum, entry) => sum + rankWeight(entry.rank), 0);

    expect(coverage(mastered).pct).toBe(Math.round(seeded * 1000) / 10);
    expect(lexiconStates(mastered).size).toBe(FONDAMENTALE.length);
  });

  // And the half that used to *be* the ceiling, kept because it is still the
  // reason the old number was 1.6: the deck bridges most of its 120 words
  // onto no lemma at all. What changed with ranks 301–400 is the exact count
  // — `governo` and `legge` are both deck words that are now also lexicon
  // entries, so the bridge widened from 20 to 22 — and what stayed the same
  // is that it is not the only way in, so it does not set the bound.
  it("still bridges only 22 of the vocabulary module's 120 words onto a lemma", () => {
    const vocab = MODULE_STATS.find((m) => m.id === "vocab");
    const words = vocab.levels.flatMap((l) => vocab.units(l));
    const deckOnly = masterOne("vocab");

    expect(words).toHaveLength(120);
    expect(lexiconStates(deckOnly).size).toBe(22);
    expect(coverage(deckOnly).pct).toBe(1.6);
  });
});
