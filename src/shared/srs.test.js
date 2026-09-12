import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BOX_DAYS,
  MAX_BOX,
  SESSION_LIMIT,
  boxInterval,
  nextSchedule,
  isDue,
  dueItems,
  dueCount,
  reviewItem,
} from "./srs.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { STORY_LEVELS } from "../data/stories.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { FONDAMENTALE } from "../data/fondamentale.js";
import { wordKey, drillKey, storyKey, conversationKey, riservaKey } from "./storage.js";
import { lemmaKey } from "./lemma.js";

// Dates are passed in rather than read from the clock, so none of this
// depends on when the suite runs.
const TODAY = "2026-08-17";

const EMPTY = { words: {}, schedule: {} };

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories[0];
const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const firstTopic = a1Grammar.topics[0];

const VOCAB_KEYS = greetings.words.map((w) => wordKey(a1Vocab, greetings, w));
const DRILL_KEY = drillKey(a1Grammar, firstTopic, firstTopic.drills[0]);
const STORY_KEY = (() => {
  const level = STORY_LEVELS.find((l) => l.id === "A1");
  return storyKey(level, level.stories[0]);
})();
const DIALOGUE_KEY = (() => {
  const level = CONVERSATION_LEVELS.find((l) => l.id === "A1");
  return conversationKey(level, level.dialogues[0]);
})();

function progressWith(words, schedule = {}) {
  return { ...EMPTY, words, schedule };
}

beforeEach(() => {
  // dueItems shuffles; a value just under 1 makes Fisher-Yates a no-op, so
  // the queue stays in the order the scheduler put it in and can be asserted.
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the boxes", () => {
  it("has an interval for every box and never shrinks going up", () => {
    expect(BOX_DAYS).toHaveLength(MAX_BOX);
    for (let box = 2; box <= MAX_BOX; box++) {
      expect(boxInterval(box)).toBeGreaterThan(boxInterval(box - 1));
    }
  });

  it("clamps an out-of-range box rather than returning undefined days", () => {
    expect(boxInterval(0)).toBe(BOX_DAYS[0]);
    expect(boxInterval(99)).toBe(BOX_DAYS[MAX_BOX - 1]);
  });
});

describe("nextSchedule", () => {
  it("starts a new item in box 1, due the same day", () => {
    expect(nextSchedule(undefined, false, TODAY)).toEqual({ box: 1, due: TODAY, last: TODAY });
  });

  it("promotes one box on a correct answer and pushes the due date out", () => {
    const first = nextSchedule(undefined, true, TODAY);
    expect(first).toEqual({ box: 2, due: "2026-08-18", last: TODAY });

    // box 2 -> 3 is a three-day interval
    expect(nextSchedule(first, true, TODAY)).toEqual({ box: 3, due: "2026-08-20", last: TODAY });
  });

  it("stops promoting at the top box but still pushes the date out", () => {
    const top = { box: MAX_BOX, due: TODAY, last: TODAY };
    const after = nextSchedule(top, true, TODAY);

    expect(after.box).toBe(MAX_BOX);
    expect(after.due).toBe("2026-09-07"); // 21 days on
  });

  // The whole point of the box system: one wrong answer costs you the ladder,
  // however long you'd been climbing it.
  it("drops to box 1 on a wrong answer from any box, including the top", () => {
    for (let box = 1; box <= MAX_BOX; box++) {
      expect(nextSchedule({ box, due: TODAY, last: TODAY }, false, TODAY)).toEqual({
        box: 1,
        due: TODAY,
        last: TODAY,
      });
    }
  });
});

describe("isDue", () => {
  // An item studied before the scheduler existed has no entry, and there's no
  // honest answer to when it's next due — so it's due now.
  it("treats an item with no schedule entry as due", () => {
    expect(isDue(undefined, TODAY)).toBe(true);
    expect(isDue({ box: 2 }, TODAY)).toBe(true);
  });

  it("is due on the day itself and while overdue", () => {
    expect(isDue({ box: 2, due: TODAY }, TODAY)).toBe(true);
    expect(isDue({ box: 2, due: "2026-08-01" }, TODAY)).toBe(true);
  });

  it("is not due while the date is still ahead", () => {
    expect(isDue({ box: 2, due: "2026-08-18" }, TODAY)).toBe(false);
  });

  // ISO dates are compared as strings, which only works because the format is
  // zero-padded — a naive "2026-9-1" would sort wrong.
  it("compares dates across a month boundary correctly", () => {
    expect(isDue({ box: 2, due: "2026-09-01" }, "2026-08-31")).toBe(false);
    expect(isDue({ box: 2, due: "2026-08-31" }, "2026-09-01")).toBe(true);
  });
});

describe("dueItems", () => {
  it("returns nothing when nothing has been studied", () => {
    expect(dueItems(EMPTY, TODAY)).toEqual([]);
    expect(dueCount(EMPTY, TODAY)).toBe(0);
  });

  // Review brings back what you've met; meeting new material is what the
  // modules themselves are for.
  it("leaves out items that have never been studied", () => {
    const progress = progressWith({ [VOCAB_KEYS[0]]: "known" });
    expect(dueItems(progress, TODAY).map((u) => u.key)).toEqual([VOCAB_KEYS[0]]);
  });

  it("includes a studied item whose schedule is missing or past, and skips future ones", () => {
    const progress = progressWith(
      { [VOCAB_KEYS[0]]: "known", [VOCAB_KEYS[1]]: "learning", [VOCAB_KEYS[2]]: "known" },
      {
        [VOCAB_KEYS[1]]: { box: 1, due: "2026-08-10", last: "2026-08-10" },
        [VOCAB_KEYS[2]]: { box: 4, due: "2026-09-01", last: TODAY },
      },
    );

    expect(dueItems(progress, TODAY).map((u) => u.key).sort()).toEqual([VOCAB_KEYS[0], VOCAB_KEYS[1]].sort());
    expect(dueCount(progress, TODAY)).toBe(2);
  });

  it("puts the most overdue first", () => {
    const progress = progressWith(
      { [VOCAB_KEYS[0]]: "known", [VOCAB_KEYS[1]]: "known" },
      {
        [VOCAB_KEYS[0]]: { box: 2, due: "2026-08-16", last: "2026-08-15" },
        [VOCAB_KEYS[1]]: { box: 2, due: "2026-08-02", last: "2026-08-01" },
      },
    );

    expect(dueItems(progress, TODAY).map((u) => u.key)).toEqual([VOCAB_KEYS[1], VOCAB_KEYS[0]]);
  });

  it("caps the queue at the session limit", () => {
    const words = {};
    for (const level of LEVELS) {
      for (const cat of level.categories) {
        for (const w of cat.words) words[wordKey(level, cat, w)] = "known";
      }
    }
    const progress = progressWith(words);

    expect(dueCount(progress, TODAY)).toBeGreaterThan(SESSION_LIMIT);
    expect(dueItems(progress, TODAY)).toHaveLength(SESSION_LIMIT);
    expect(dueItems(progress, TODAY, 5)).toHaveLength(5);
  });

  // Conversations and stories are explicitly out of scope; if one ever leaked
  // into the queue, the review session would have no question to build.
  it("never queues a conversation or a story", () => {
    const progress = progressWith({ [STORY_KEY]: "done", [DIALOGUE_KEY]: "done", [DRILL_KEY]: "learning" });

    expect(dueItems(progress, TODAY).map((u) => u.key)).toEqual([DRILL_KEY]);
  });

  it("carries what a review session needs to render the question", () => {
    const [unit] = dueItems(progressWith({ [VOCAB_KEYS[0]]: "known" }), TODAY);

    expect(unit.moduleId).toBe("vocab");
    expect(unit.level.id).toBe("A1");
    expect(unit.item.it).toBe(greetings.words[0].it);
    expect(unit.group.words.length).toBeGreaterThan(3); // enough for distractors
  });

  it("mixes vocabulary and grammar in one queue", () => {
    const progress = progressWith({ [VOCAB_KEYS[0]]: "known", [DRILL_KEY]: "learning" });

    expect(dueItems(progress, TODAY).map((u) => u.moduleId).sort()).toEqual(["grammar", "vocab"]);
  });

  // Two benches can hold the same Italian word. `sì` is rank 44 of the base
  // vocabulary and it is also the first word of the A1 greetings category, so
  // studying it in both places writes two live scheduler keys for one word —
  // and La Piazza would then ask for `sì` twice in a single round.
  //
  // Coverage already treats those two units as one word: lexiconEvidence()
  // folds them onto one rank with strongest(). The queue has to agree, or the
  // dashboard and the round are counting different things.
  describe("one word, one place in the queue", () => {
    const SI_DECK = wordKey(a1Vocab, greetings, greetings.words.find((w) => w.it === "sì"));
    const SI_RISERVA = riservaKey(FONDAMENTALE.find((e) => e.it === "sì"));

    it("offers a word held on two benches once, not twice", () => {
      const progress = progressWith({ [SI_DECK]: "known", [SI_RISERVA]: "known" });

      expect(dueItems(progress, TODAY).filter((u) => u.item.it === "sì")).toHaveLength(1);
      expect(dueCount(progress, TODAY)).toBe(1);
    });

    // Which of the two survives is not arbitrary. Most overdue wins, and on a
    // tie the deck does — the same rule coverage.js's LEXICON_SOURCES states,
    // and for the same reason: the deck unit has an example sentence behind
    // it, so La Piazza can gap a real sentence rather than show a bare gloss.
    it("keeps the deck's unit on a tie, and the more overdue one otherwise", () => {
      const tied = progressWith({ [SI_DECK]: "known", [SI_RISERVA]: "known" });
      expect(dueItems(tied, TODAY)[0].key).toBe(SI_DECK);

      const riservaOlder = progressWith(
        { [SI_DECK]: "known", [SI_RISERVA]: "known" },
        {
          [SI_DECK]: { box: 2, due: "2026-08-16", last: "2026-08-15" },
          [SI_RISERVA]: { box: 2, due: "2026-08-02", last: "2026-08-01" },
        },
      );
      expect(dueItems(riservaOlder, TODAY).map((u) => u.key)).toEqual([SI_RISERVA]);
    });

    // The collapse is by lemma, not by string: the deck stores `madre` and the
    // lexicon stores `la madre`, and they are the same word.
    it("collapses two spellings of one lemma, article and all", () => {
      const family = a1Vocab.categories.find((c) => c.words.some((w) => w.it === "madre"));
      const deck = wordKey(a1Vocab, family, family.words.find((w) => w.it === "madre"));
      const lexicon = riservaKey(FONDAMENTALE.find((e) => e.it === "la madre"));
      const progress = progressWith({ [deck]: "known", [lexicon]: "known" });

      expect(dueCount(progress, TODAY)).toBe(1);
      expect(dueItems(progress, TODAY)[0].key).toBe(deck);
    });

    // And the other direction: a word that is only in the reservoir still gets
    // queued, and two *different* lexicon words are still two items. A dedupe
    // that swallowed either of those would be worse than the bug it fixes.
    it("leaves distinct words alone, wherever they were met", () => {
      const essere = riservaKey(FONDAMENTALE[0]);
      const di = riservaKey(FONDAMENTALE[1]);
      const progress = progressWith({ [essere]: "known", [di]: "known", [DRILL_KEY]: "learning" });

      expect(dueCount(progress, TODAY)).toBe(3);
      expect(dueItems(progress, TODAY).map((u) => u.key).sort()).toEqual([di, essere, DRILL_KEY].sort());
    });
  });
});

describe("reviewItem", () => {
  // The status and the box have to move together — the dashboard counts the
  // first and the queue reads the second, and they describe the same answer.
  it("writes the status and the box together on a correct answer", () => {
    const after = reviewItem(EMPTY, VOCAB_KEYS[0], true, TODAY);

    expect(after.words[VOCAB_KEYS[0]]).toBe("known");
    expect(after.schedule[VOCAB_KEYS[0]]).toEqual({ box: 2, due: "2026-08-18", last: TODAY });
  });

  it("marks a wrong answer as still learning and sends it back to box 1", () => {
    const climbed = reviewItem(reviewItem(EMPTY, VOCAB_KEYS[0], true, TODAY), VOCAB_KEYS[0], true, TODAY);
    expect(climbed.schedule[VOCAB_KEYS[0]].box).toBe(3);

    const after = reviewItem(climbed, VOCAB_KEYS[0], false, TODAY);
    expect(after.words[VOCAB_KEYS[0]]).toBe("learning");
    expect(after.schedule[VOCAB_KEYS[0]]).toEqual({ box: 1, due: TODAY, last: TODAY });
  });

  it("leaves the original progress untouched", () => {
    const before = progressWith({ [VOCAB_KEYS[0]]: "learning" });
    reviewItem(before, VOCAB_KEYS[0], true, TODAY);

    expect(before.words[VOCAB_KEYS[0]]).toBe("learning");
    expect(before.schedule).toEqual({});
  });


  // Answering an item correctly should take it out of today's queue — the
  // round trip that makes a review session actually shrink the backlog.
  it("removes an item from today's queue once it's answered right", () => {
    const before = progressWith({ [VOCAB_KEYS[0]]: "learning" });
    expect(dueCount(before, TODAY)).toBe(1);

    expect(dueCount(reviewItem(before, VOCAB_KEYS[0], true, TODAY), TODAY)).toBe(0);
  });

  // ...but getting it wrong leaves it due today, since box 1 is same-day.
  it("keeps an item due today when it's answered wrong", () => {
    const before = progressWith({ [VOCAB_KEYS[0]]: "known" });
    expect(dueCount(reviewItem(before, VOCAB_KEYS[0], false, TODAY), TODAY)).toBe(1);
  });
});

// The collapse in dueUnits() and the write in reviewItem() are one mechanism,
// and checking either on its own is what let a stuck queue through: the
// collapse tests above all passed while a perfect round left the backlog
// exactly where it started. So these run the whole cycle — due, served,
// graded, due again — because that is the property a learner can see.
describe("the round trip over a word held on two benches", () => {
  const SI_DECK = wordKey(a1Vocab, greetings, greetings.words.find((w) => w.it === "sì"));
  const SI_RISERVA = riservaKey(FONDAMENTALE.find((e) => e.it === "sì"));

  // Every deck word whose lemma is also a lexicon entry, met on both benches.
  // Twenty lemmas overlap today, and the whole overlap is used rather than a
  // hand-picked pair because the bug scaled with it: 40 keys, a round of 20,
  // and 20 still due after answering every one of them correctly.
  function metOnBothBenches() {
    const byLemma = new Map(FONDAMENTALE.map((entry) => [lemmaKey(entry.it), entry]));
    const words = {};
    let pairs = 0;
    for (const level of LEVELS) {
      for (const cat of level.categories) {
        for (const w of cat.words) {
          const entry = byLemma.get(lemmaKey(w.it));
          if (!entry) continue;
          pairs += 1;
          words[wordKey(level, cat, w)] = "known";
          words[riservaKey(entry)] = "known";
        }
      }
    }
    return { progress: progressWith(words), pairs };
  }

  function answerEveryServedItem(progress) {
    return dueItems(progress, TODAY).reduce((p, unit) => reviewItem(p, unit.key, true, TODAY), progress);
  }

  it("empties the queue when every served item is answered right", () => {
    const { progress, pairs } = metOnBothBenches();
    expect(pairs).toBe(20);
    expect(Object.keys(progress.words)).toHaveLength(pairs * 2);
    expect(dueCount(progress, TODAY)).toBe(pairs);
    expect(dueItems(progress, TODAY)).toHaveLength(pairs);

    const after = answerEveryServedItem(progress);

    expect(dueCount(after, TODAY)).toBe(0);
    expect(dueItems(after, TODAY)).toEqual([]);
  });

  // One pair, spelled out: the sibling the queue dropped moves with the one it
  // served, up one box from wherever it was rather than onto the survivor's
  // box. A word that is solid on one bench must not be demoted for being newer
  // on the other, and the earlier of the two due dates is what the collapse
  // reads next time — so the word comes back at the weaker key's pace, which
  // is the safe direction to be wrong in.
  it("moves the dropped sibling's box and status, not just the survivor's", () => {
    const progress = progressWith(
      { [SI_DECK]: "known", [SI_RISERVA]: "learning" },
      {
        [SI_DECK]: { box: 3, due: "2026-08-10", last: "2026-08-03" },
        [SI_RISERVA]: { box: 1, due: "2026-08-15", last: "2026-08-15" },
      },
    );
    expect(dueItems(progress, TODAY).map((u) => u.key)).toEqual([SI_DECK]);

    const after = reviewItem(progress, SI_DECK, true, TODAY);

    expect(after.schedule[SI_DECK]).toEqual({ box: 4, due: "2026-08-24", last: TODAY });
    expect(after.schedule[SI_RISERVA]).toEqual({ box: 2, due: "2026-08-18", last: TODAY });
    expect(after.words[SI_RISERVA]).toBe("known");
    expect(dueCount(after, TODAY)).toBe(0);
  });

  // And the wrong answer travels too, or a word the learner has just failed
  // stays solid on the bench the round did not serve.
  it("sends both keys back to box 1 on a wrong answer", () => {
    const progress = progressWith(
      { [SI_DECK]: "known", [SI_RISERVA]: "known" },
      {
        [SI_DECK]: { box: 3, due: "2026-08-10", last: "2026-08-03" },
        [SI_RISERVA]: { box: 5, due: "2026-08-11", last: "2026-08-03" },
      },
    );

    const after = reviewItem(progress, SI_DECK, false, TODAY);

    expect(after.schedule[SI_DECK].box).toBe(1);
    expect(after.schedule[SI_RISERVA].box).toBe(1);
    expect(after.words[SI_RISERVA]).toBe("learning");
  });

  // The write follows the collapse exactly: only a unit the learner has met
  // can be collapsed, so only a met unit may be moved. Marking an untouched
  // deck word known would complete a category she has never opened.
  it("leaves a sibling the learner has never met alone", () => {
    const progress = progressWith({ [SI_RISERVA]: "known" });
    const after = reviewItem(progress, SI_RISERVA, true, TODAY);

    expect(after.words[SI_DECK]).toBeUndefined();
    expect(after.schedule[SI_DECK]).toBeUndefined();
  });

  // Two different words stay two words. A write-through that walked the wrong
  // set would quietly grade half the queue off one answer, which is the same
  // failure as the stuck queue pointed the other way.
  it("moves nothing else when a word has no sibling", () => {
    const progress = progressWith({ [VOCAB_KEYS[0]]: "known", [VOCAB_KEYS[1]]: "known" });
    const after = reviewItem(progress, VOCAB_KEYS[0], true, TODAY);

    expect(after.schedule[VOCAB_KEYS[1]]).toBeUndefined();
    expect(dueCount(after, TODAY)).toBe(1);
  });

  // A key that belongs to no scheduled unit still grades — there is simply
  // nothing for it to be collapsed with. reviewItem is the single write point
  // and nothing stops a caller handing it a key from an unscheduled module.
  it("grades a key that is not a scheduled unit at all", () => {
    const after = reviewItem(EMPTY, STORY_KEY, true, TODAY);

    expect(after.words[STORY_KEY]).toBe("known");
    expect(after.schedule[STORY_KEY]).toEqual({ box: 2, due: "2026-08-18", last: TODAY });
  });
});
