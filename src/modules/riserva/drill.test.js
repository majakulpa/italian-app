import { describe, it, expect } from "vitest";
import { drillRound, unmetCount, lexiconQuestion, ROUND_SIZE } from "./drill.js";
import { FASCE, FONDAMENTALE } from "../../data/fondamentale.js";
import { LEVELS } from "../../data/vocab.js";
import { riservaKey, wordKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";
import { judge } from "../../shared/locatedFeedback.js";

const EMPTY = { version: 2, words: {}, schedule: {} };

const BAND_1 = FASCE[0];
// Ranks 601–800 — well past the 300 that are written down, so this band has
// no words in it at all and must not offer a round.
const EMPTY_BAND = FASCE[3];

const entryFor = (italian) => FONDAMENTALE.find((e) => e.it === italian);

// Graded the way the drill grades: through reviewItem, under the riserva key.
function met(progress, entry) {
  return reviewItem(progress, riservaKey(entry), true, "2026-09-01");
}

// The same word met on the *other* side of the bridge — the vocabulary deck,
// under a wordKey. `bene` is rank 51 and is also an A1 deck word.
function metInDeck(progress, italian) {
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => w.it === italian);
      if (word) return reviewItem(progress, wordKey(level, category, word), true, "2026-09-01");
    }
  }
  throw new Error(`no vocab word "${italian}"`);
}

describe("drillRound", () => {
  it("takes the band's first words in frequency order", () => {
    const round = drillRound(EMPTY, BAND_1);

    expect(round).toHaveLength(ROUND_SIZE);
    expect(round.map((e) => e.rank)).toEqual(Array.from({ length: ROUND_SIZE }, (_, i) => i + 1));
    expect(round[0].it).toBe("essere");
  });

  // The band is the door and the round is the sitting. 200 typed items is not
  // a sitting, so the cap is the same as a review round's.
  it("caps a round at ROUND_SIZE however many the band holds", () => {
    expect(unmetCount(EMPTY, BAND_1)).toBeGreaterThan(ROUND_SIZE);
    expect(drillRound(EMPTY, BAND_1).length).toBe(ROUND_SIZE);
  });

  // The selection rule: this bench meets a word for the first time, and the
  // Leitner queue is what brings it back. Offering it here again the same
  // afternoon would be two schedules racing over one key.
  it("skips a word that has already been met on this bench", () => {
    const progress = met(EMPTY, FONDAMENTALE[0]);
    const round = drillRound(progress, BAND_1);

    expect(round.map((e) => e.it)).not.toContain("essere");
    expect(round[0].rank).toBe(2);
    expect(round).toHaveLength(ROUND_SIZE);
  });

  // And the cross-source half of it: met-ness is read through lexiconStates,
  // so a word the vocabulary deck already taught is not offered here as new.
  // Twenty lemmas overlap; without this they would be asked twice.
  it("skips a word the vocabulary deck already taught", () => {
    const bene = entryFor("bene");
    expect(drillRound(EMPTY, BAND_1).concat(FONDAMENTALE.slice(0, 60)).map((e) => e.it)).toContain("bene");

    const progress = metInDeck(EMPTY, "bene");
    expect(unmetCount(progress, BAND_1)).toBe(unmetCount(EMPTY, BAND_1) - 1);
    expect(drillRound(progress, BAND_1).map((e) => e.rank)).not.toContain(bene.rank);
  });

  // A rank nobody has written down is a fact about the file, not about the
  // learner, so a band of empty ranks yields nothing rather than a drill of
  // nothing. This is the invariant La Riserva's grid has drawn since it
  // shipped, held in the code that opens a round.
  it("offers no round for a band with no word written down in it", () => {
    expect(EMPTY_BAND.from).toBeGreaterThan(FONDAMENTALE.length);
    expect(drillRound(EMPTY, EMPTY_BAND)).toEqual([]);
    expect(unmetCount(EMPTY, EMPTY_BAND)).toBe(0);
  });

  it("offers no round once every word in the band has been met", () => {
    let progress = EMPTY;
    for (const entry of FONDAMENTALE.filter((e) => e.rank <= BAND_1.to)) progress = met(progress, entry);

    expect(unmetCount(progress, BAND_1)).toBe(0);
    expect(drillRound(progress, BAND_1)).toEqual([]);
  });

  // Band 2 is half written down (ranks 201–300 of 201–400), which is the
  // partial case: it drills what exists and counts what exists.
  it("drills only the written-down half of a partly seeded band", () => {
    expect(unmetCount(EMPTY, FASCE[1])).toBe(100);
    expect(drillRound(EMPTY, FASCE[1]).every((e) => e.rank <= FONDAMENTALE.length)).toBe(true);
  });
});

describe("lexiconQuestion", () => {
  it("asks by both glosses and answers with the Italian", () => {
    const q = lexiconQuestion(entryFor("libro"));

    expect(q.gloss).toBe("book");
    expect(q.glossPl).toBe("książka");
    expect(q.answer).toBe("libro");
    expect(q.rank).toBe(300);
  });

  // The multi-sense decision, held in a test so it cannot be quietly
  // "tidied" into a first-sense-only prompt. 87 of the first 300 entries
  // split in Polish, the file cannot say whether a split is two meanings or
  // two aspects, and in this direction both senses point at one answer.
  it("shows every Polish sense rather than picking one", () => {
    const q = lexiconQuestion(entryFor("dire"));

    expect(q.glossPl).toBe("mówić · powiedzieć");
    expect(q.senses.pl).toEqual(["mówić", "powiedzieć"]);
    expect(q.splits).toBe(true);
    expect(q.answer).toBe("dire");
  });

  it("does not claim a split where the file has one sense", () => {
    expect(lexiconQuestion(entryFor("essere")).splits).toBe(false);
    expect(lexiconQuestion(entryFor("essere")).senses.pl).toEqual(["być"]);
  });

  // A lexicon entry is not authored with alternative forms, so the
  // `distractor` verdict has nothing to fire on — and near neighbours from
  // elsewhere in the list must not be faked into it, because they were never
  // offered with this item.
  it("offers the judge no alternatives to mistake for authored forms", () => {
    expect(lexiconQuestion(entryFor("dire")).alternatives).toEqual([]);
    expect(judge(lexiconQuestion(entryFor("dire")), "fare", 1).kind).not.toBe("distractor");
  });

  // There is no example sentence anywhere in fondamentale.js, so the line
  // under a revealed answer says the other true thing about the word.
  it("puts the word's place in the reservoir where a sentence would go", () => {
    expect(lexiconQuestion(entryFor("libro")).context).toEqual({
      it: "libro",
      en: "rank 300 of De Mauro's 2,000",
    });
  });
});

// The point of reusing shared/locatedFeedback.js rather than writing a fourth
// judge: these verdicts are the ones La Piazza already produces, on a
// question shape built here.
describe("judged through the shared verdicts", () => {
  const chiave = lexiconQuestion(entryFor("la chiave"));

  it("accepts the exact answer", () => {
    expect(judge(chiave, "la chiave", 1)).toMatchObject({ correct: true, kind: "exact" });
  });

  it("accepts a missing accent and spells the word back", () => {
    const q = lexiconQuestion(entryFor("perché"));
    expect(judge(q, "perche", 1)).toMatchObject({ correct: true, kind: "spelling", answer: "perché" });
  });

  // The article is the gender on these entries — fondamentale.js stores one
  // only where the ending does not give it away — so the bare noun is a real
  // error, and it gets located rather than solved.
  it("locates a bare noun as the missing article rather than accepting it", () => {
    const verdict = judge(chiave, "chiave", 1);

    expect(verdict.correct).toBe(false);
    expect(verdict.kind).toBe("stem");
    expect(verdict.answer).toBeNull();
  });

  it("locates a wrong ending on a verb", () => {
    const verdict = judge(lexiconQuestion(entryFor("parlare")), "parlato", 1);

    expect(verdict.kind).toBe("ending");
    expect(verdict.shared).toBe("parla");
  });
});
