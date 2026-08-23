import { describe, it, expect } from "vitest";
import { WORD_STATES, stateForBox, wordState, strongest } from "./wordState.js";
import { reviewItem, BOX_DAYS, MAX_BOX } from "./srs.js";

const KEY = "A1:greetings:ciao";
const EMPTY = { version: 2, words: {}, schedule: {} };

describe("WORD_STATES", () => {
  it("lists the five states weakest first", () => {
    expect(WORD_STATES).toEqual(["unseen", "met", "learning", "known", "solid"]);
  });
});

describe("stateForBox", () => {
  it("splits the Leitner boxes into learning, known and solid", () => {
    expect([1, 2, 3, 4, 5].map(stateForBox)).toEqual(["learning", "learning", "known", "known", "solid"]);
  });

  // "solid" is defined as the box behind the longest interval — the design
  // calls it "survived the 21-day interval". Pin both halves of that: the top
  // box is what stateForBox calls solid, and the top box is the 21-day one.
  it("ties solid to the top box, whatever the ladder's length", () => {
    expect(stateForBox(MAX_BOX)).toBe("solid");
    expect(stateForBox(MAX_BOX - 1)).not.toBe("solid");
    expect(BOX_DAYS[MAX_BOX - 1]).toBe(21);
  });
});

describe("wordState", () => {
  it("calls a word nobody has touched unseen", () => {
    expect(wordState(EMPTY, KEY)).toBe("unseen");
  });

  it("reads met off the stored status, since a met word has no schedule entry", () => {
    expect(wordState({ ...EMPTY, words: { [KEY]: "met" } }, KEY)).toBe("met");
  });

  // A blob written before the scheduler existed has statuses and no boxes.
  // Those words still have to report a sensible state rather than falling
  // back to unseen and wiping out someone's history.
  it("falls back to the stored status for a pre-scheduler save", () => {
    expect(wordState({ ...EMPTY, words: { [KEY]: "known" } }, KEY)).toBe("known");
    expect(wordState({ ...EMPTY, words: { [KEY]: "learning" } }, KEY)).toBe("learning");
  });

  // A dialogue or a story is "done", which is not a degree of knowing a word.
  it("has no state for a status that isn't a word status", () => {
    expect(wordState({ ...EMPTY, words: { "conversation:A1:cafe": "done" } }, "conversation:A1:cafe")).toBe("unseen");
  });

  // The point of deriving rather than storing: reviewItem writes "known" the
  // first time you get something right, but one right answer only reaches box
  // 2. The box is the authority, so the word is still learning.
  it("lets the box overrule the stored status when the two disagree", () => {
    const progress = { ...EMPTY, words: { [KEY]: "known" }, schedule: { [KEY]: { box: 2, due: "2026-09-01" } } };
    expect(wordState(progress, KEY)).toBe("learning");
  });
});

// The state model is only worth anything if it tracks what the scheduler
// actually does, so drive it through reviewItem rather than hand-writing boxes.
describe("wordState over a real run of answers", () => {
  it("climbs learning → known → solid as answers land, and falls back in one wrong", () => {
    let progress = EMPTY;
    const seen = [];
    for (let i = 0; i < MAX_BOX - 1; i += 1) {
      progress = reviewItem(progress, KEY, true, "2026-08-23");
      seen.push(wordState(progress, KEY));
    }
    expect(seen).toEqual(["learning", "known", "known", "solid"]);

    progress = reviewItem(progress, KEY, false, "2026-08-23");
    expect(wordState(progress, KEY)).toBe("learning");
  });

  it("makes the first wrong answer learning, not met — it was recalled and missed", () => {
    const progress = reviewItem(EMPTY, KEY, false, "2026-08-23");
    expect(wordState(progress, KEY)).toBe("learning");
  });
});

describe("strongest", () => {
  it("keeps whichever state is further along", () => {
    expect(strongest("met", "known")).toBe("known");
    expect(strongest("known", "met")).toBe("known");
  });

  it("treats no state at all as weaker than any state", () => {
    expect(strongest(undefined, "met")).toBe("met");
  });

  it("returns the second when the two are equal, which is the same answer", () => {
    expect(strongest("learning", "learning")).toBe("learning");
  });
});
