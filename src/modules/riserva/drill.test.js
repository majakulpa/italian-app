import { describe, it, expect } from "vitest";
import { drillRound, unmetCount, lexiconQuestion, accentIsTheWord, ROUND_SIZE } from "./drill.js";
import { FASCE, FONDAMENTALE } from "../../data/fondamentale.js";
import { LEVELS } from "../../data/vocab.js";
import { riservaKey, wordKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";
// drillRound and unmetCount take the rank → state Map rather than a progress
// object, because La Riserva builds it once and asks all ten bands off it.
// The tests go in through the same door.
import { lexiconStates as states } from "../../shared/coverage.js";
import { judge, ATTEMPTS } from "../../shared/locatedFeedback.js";
import { foldTyped } from "../../shared/typedAnswer.js";

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
    const round = drillRound(states(EMPTY), BAND_1);

    expect(round).toHaveLength(ROUND_SIZE);
    expect(round.map((e) => e.rank)).toEqual(Array.from({ length: ROUND_SIZE }, (_, i) => i + 1));
    expect(round[0].it).toBe("essere");
  });

  // The band is the door and the round is the sitting. 200 typed items is not
  // a sitting, so the cap is the same as a review round's.
  it("caps a round at ROUND_SIZE however many the band holds", () => {
    expect(unmetCount(states(EMPTY), BAND_1)).toBeGreaterThan(ROUND_SIZE);
    expect(drillRound(states(EMPTY), BAND_1).length).toBe(ROUND_SIZE);
  });

  // The selection rule: this bench meets a word for the first time, and the
  // Leitner queue is what brings it back. Offering it here again the same
  // afternoon would be two schedules racing over one key.
  it("skips a word that has already been met on this bench", () => {
    const progress = met(EMPTY, FONDAMENTALE[0]);
    const round = drillRound(states(progress), BAND_1);

    expect(round.map((e) => e.it)).not.toContain("essere");
    expect(round[0].rank).toBe(2);
    expect(round).toHaveLength(ROUND_SIZE);
  });

  // And the cross-source half of it: met-ness is read through lexiconStates,
  // so a word the vocabulary deck already taught is not offered here as new.
  // Twenty lemmas overlap; without this they would be asked twice.
  it("skips a word the vocabulary deck already taught", () => {
    const bene = entryFor("bene");
    expect(drillRound(states(EMPTY), BAND_1).concat(FONDAMENTALE.slice(0, 60)).map((e) => e.it)).toContain("bene");

    const progress = metInDeck(EMPTY, "bene");
    expect(unmetCount(states(progress), BAND_1)).toBe(unmetCount(states(EMPTY), BAND_1) - 1);
    expect(drillRound(states(progress), BAND_1).map((e) => e.rank)).not.toContain(bene.rank);
  });

  // A rank nobody has written down is a fact about the file, not about the
  // learner, so a band of empty ranks yields nothing rather than a drill of
  // nothing. This is the invariant La Riserva's grid has drawn since it
  // shipped, held in the code that opens a round.
  it("offers no round for a band with no word written down in it", () => {
    expect(EMPTY_BAND.from).toBeGreaterThan(FONDAMENTALE.length);
    expect(drillRound(states(EMPTY), EMPTY_BAND)).toEqual([]);
    expect(unmetCount(states(EMPTY), EMPTY_BAND)).toBe(0);
  });

  it("offers no round once every word in the band has been met", () => {
    let progress = EMPTY;
    for (const entry of FONDAMENTALE.filter((e) => e.rank <= BAND_1.to)) progress = met(progress, entry);

    expect(unmetCount(states(progress), BAND_1)).toBe(0);
    expect(drillRound(states(progress), BAND_1)).toEqual([]);
  });

  // Band 2 is half written down (ranks 201–300 of 201–400), which is the
  // partial case: it drills what exists and counts what exists.
  it("drills only the written-down half of a partly seeded band", () => {
    expect(unmetCount(states(EMPTY), FASCE[1])).toBe(100);
    expect(drillRound(states(EMPTY), FASCE[1]).every((e) => e.rank <= FONDAMENTALE.length)).toBe(true);
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
  // split in Polish and the file cannot say whether a split is two meanings
  // or two aspects, so the prompt shows both and lets the English pick.
  //
  // Both assertions are on fields the screen renders: `glossPl` is the Polish
  // line and `splits` is what draws the note under it. The version of this
  // test that shipped asserted on a `senses` field nothing read, so it would
  // have stayed green with the Polish gone from the screen entirely.
  it("shows every Polish sense rather than picking one", () => {
    const q = lexiconQuestion(entryFor("dire"));

    expect(q.glossPl).toBe("mówić · powiedzieć");
    expect(q.splits).toBe(true);
    expect(q.answer).toBe("dire");
  });

  it("does not claim a split where the file has one sense", () => {
    expect(lexiconQuestion(entryFor("essere")).splits).toBe(false);
    expect(lexiconQuestion(entryFor("essere")).glossPl).toBe("być");
  });

  // A lexicon entry is not authored with alternative forms, so the
  // `distractor` verdict has nothing to fire on — and near neighbours from
  // elsewhere in the list must not be faked into it, because they were never
  // offered with this item. They get a verdict of their own instead.
  it("offers the judge no alternatives to mistake for authored forms", () => {
    expect(lexiconQuestion(entryFor("dire")).alternatives).toEqual([]);
    expect(judge(lexiconQuestion(entryFor("dire")), "fare", 1).kind).not.toBe("distractor");
  });

  // `strada` (280, `droga · ulica`) and `via` (281, `ulica · droga`) have
  // identical Polish sets at adjacent ranks, so they arrive in one round and
  // the Polish half of the prompt cannot separate them. Typing one for the
  // other is not a spelling slip and it is not "nothing lines up" — it is a
  // real word from this very list, which is the most locatable thing that can
  // be said about it without naming the answer.
  it("names a wrong answer that is another entry in the list", () => {
    const verdict = judge(lexiconQuestion(entryFor("strada")), "via", 1);

    expect(verdict.kind).toBe("neighbour");
    expect(verdict.correct).toBe(false);
    // Located, not solved: the first attempt still reveals nothing.
    expect(verdict.answer).toBeNull();
    expect(judge(lexiconQuestion(entryFor("strada")), "via", ATTEMPTS).answer).toBe("strada");
  });

  // The same shape one rank apart at the top of the list, where the Polish is
  // `do · w` on both entries and only the English tells them apart.
  it("catches the near neighbour the Polish gloss cannot separate", () => {
    expect(judge(lexiconQuestion(entryFor("a")), "in", 1).kind).toBe("neighbour");
    expect(judge(lexiconQuestion(entryFor("in")), "a", 1).kind).toBe("neighbour");
  });

  // The guard on that verdict, against the real list rather than a fixture.
  // A one-character slip that lands on another entry is a slip: 71 pairs of
  // the 300 are within one fold-edit of each other, and reporting a missed
  // gender as "you reached for a different entry" is the app being confidently
  // wrong about the commonest mistake it can receive.
  it("locates a one-character slip rather than calling it a different entry", () => {
    expect(judge(lexiconQuestion(entryFor("ragazza")), "ragazzo", 1)).toMatchObject({
      kind: "ending",
      shared: "ragazz",
    });
    expect(judge(lexiconQuestion(entryFor("figlia")), "figlio", 1).kind).toBe("ending");
    expect(judge(lexiconQuestion(entryFor("nonna")), "nonno", 1).kind).toBe("ending");
    expect(judge(lexiconQuestion(entryFor("primo")), "prima", 1).kind).toBe("ending");
    expect(judge(lexiconQuestion(entryFor("alto")), "altro", 1).kind).toBe("ending");
    expect(judge(lexiconQuestion(entryFor("mondo")), "modo", 1).kind).toBe("partial");
    expect(judge(lexiconQuestion(entryFor("no")), "noi", 1).kind).toBe("partial");
  });

  // And the neighbour verdict keeps every pair it was added for. `di` and `da`
  // are one edit apart and no pair of glosses separates two prepositions
  // overlapping that heavily — but the spelling analysis has nothing to say
  // about them either, so there is no true verdict for the neighbour one to
  // talk over.
  it("still names the neighbours no gloss and no spelling can separate", () => {
    expect(judge(lexiconQuestion(entryFor("da")), "di", 1).kind).toBe("neighbour");
    expect(judge(lexiconQuestion(entryFor("di")), "da", 1).kind).toBe("neighbour");
    expect(judge(lexiconQuestion(entryFor("mi")), "ti", 1).kind).toBe("neighbour");
  });

  // And two edits out it overrides a located verdict, which is the half the
  // guard has to leave standing. `quello` for `questo` would be "it starts
  // right and then goes somewhere else" and `potere` for `volere` "it ends the
  // way the answer ends" — both true about the letters and both wrong about
  // the error, which is that she reached for the other word.
  it("overrides the spelling verdict for an entry two edits away", () => {
    expect(judge(lexiconQuestion(entryFor("questo")), "quello", 1).kind).toBe("neighbour");
    expect(judge(lexiconQuestion(entryFor("volere")), "potere", 1).kind).toBe("neighbour");
    expect(judge(lexiconQuestion(entryFor("non")), "nonno", 1).kind).toBe("neighbour");
  });

  // An entry is never its own neighbour, walked over the whole list.
  it("never calls the answer itself a neighbour", () => {
    for (const entry of FONDAMENTALE) {
      expect(lexiconQuestion(entry).neighbours, entry.it).not.toContain(entry.it);
      expect(judge(lexiconQuestion(entry), entry.it, 1).correct, entry.it).toBe(true);
    }
  });

  // ...and that loop is not enough on its own, which is how `si` and `sì`
  // graded each other correct for a whole review round. Judging every entry
  // against its own spelling passes whatever the tolerance does. What has to
  // be asserted is that no *other* entry is accepted for it.
  //
  // Only an entry that folds onto the answer can be: `correct` is returned
  // from one branch of judge() and that branch is behind sameTyped, which
  // compares folded strings and nothing else. So the pairs to walk are the
  // fold groups, found in the data rather than named here — and walking those
  // rather than all 300 × 299 is also what keeps this test finishing when the
  // list grows from 300 entries to 2,000.
  it("accepts no other entry of the list for the one being asked", () => {
    const byFold = new Map();
    for (const entry of FONDAMENTALE) {
      const folded = foldTyped(entry.it);
      byFold.set(folded, [...(byFold.get(folded) ?? []), entry]);
    }
    const groups = [...byFold.values()].filter((group) => group.length > 1);

    expect(groups.flat().map((e) => `${e.rank} ${e.it}`)).toEqual(["42 si", "44 sì"]);
    expect(groups.flat().every((e) => accentIsTheWord(e.it))).toBe(true);
    expect(FONDAMENTALE.filter((e) => accentIsTheWord(e.it))).toHaveLength(groups.flat().length);

    for (const group of groups) {
      for (const entry of group) {
        const q = lexiconQuestion(entry);
        for (const other of group.filter((o) => o !== entry)) {
          expect(judge(q, other.it, 1).correct, `${other.it} for ${entry.it}`).toBe(false);
        }
      }
    }
  });

  // The judged half of that, spelled out on the pair itself — including what
  // it must *not* break: the accent is still forgiven on every entry that has
  // no twin to be confused with.
  it("holds the accent exact on the pair that folds together, and nowhere else", () => {
    const si = lexiconQuestion(entryFor("si"));

    expect(si.strictAccents).toBe(true);
    expect(si.gloss).toBe("oneself; one, people");
    expect(judge(si, "sì", 1)).toMatchObject({ correct: false, kind: "neighbour" });
    expect(judge(lexiconQuestion(entryFor("sì")), "si", 1)).toMatchObject({ correct: false, kind: "neighbour" });

    expect(judge(si, "si", 1)).toMatchObject({ correct: true, kind: "exact" });
    expect(lexiconQuestion(entryFor("perché")).strictAccents).toBe(false);
    expect(judge(lexiconQuestion(entryFor("perché")), "perche", 1)).toMatchObject({
      correct: true,
      kind: "spelling",
    });
  });

  // And the verdict stays honest about what it cannot place. A word that is
  // not in the list gets `other`, as before — "a real word from this list" has
  // to mean that, or it means nothing.
  it("still says nothing lines up for a word that is not in the list", () => {
    expect(judge(lexiconQuestion(entryFor("strada")), "xilofono", 1).kind).toBe("other");
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
