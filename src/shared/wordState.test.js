import { describe, it, expect } from "vitest";
import { WORD_STATES, stateForBox, wordState, strongest } from "./wordState.js";
import { reviewItem, BOX_DAYS, MAX_BOX } from "./srs.js";
import { markWord } from "./storage.js";

const KEY = "A1:greetings:ciao";
const EMPTY = { version: 2, words: {}, schedule: {} };

describe("WORD_STATES", () => {
  it("lists the four states weakest first", () => {
    expect(WORD_STATES).toEqual(["unseen", "learning", "known", "solid"]);
  });
});

// The guard that stops this file from growing a fifth state nothing writes.
//
// A state is only real if some code path in the app can put a word into it.
// The blobs below are built the only two ways the app ever writes progress —
// reviewItem for a graded answer, markWord for a finished story or dialogue —
// so a state that never turns up here is a state whose own tests can only be
// fixtures: progress no version of this app has ever saved.
describe("every state the model lists is reachable through the app's own writes", () => {
  const KEY_STORY = "story:A1:una-giornata";

  function reachable() {
    const seen = new Set();

    // Nothing written at all.
    seen.add(wordState(EMPTY, KEY));

    // A graded answer, right every time: box 1 up to the top of the ladder.
    let graded = EMPTY;
    for (let i = 0; i < MAX_BOX; i += 1) {
      graded = reviewItem(graded, KEY, true, "2026-08-23");
      seen.add(wordState(graded, KEY));
    }

    // And a wrong one, from the top box.
    seen.add(wordState(reviewItem(graded, KEY, false, "2026-08-23"), KEY));

    // The other write in the app: a story or dialogue marked done.
    seen.add(wordState(markWord(EMPTY, KEY_STORY, "done"), KEY_STORY));

    return seen;
  }

  it("can put a word into every state, and lists no state it cannot", () => {
    expect([...reachable()].sort()).toEqual([...WORD_STATES].sort());
  });
});

describe("stateForBox", () => {
  it("splits the Leitner boxes into learning, known and solid", () => {
    expect([1, 2, 3, 4, 5].map(stateForBox)).toEqual(["learning", "learning", "known", "known", "solid"]);
  });

  // "solid" is the top box, and the gap a word survives to *get* there is the
  // interval of the box below it — 7 days, not 21. The 21-day interval is what
  // a word waits once it is already solid, so describing solid as "survived 21
  // days" overstates it by two weeks. Pin the gap that actually earns it.
  it("ties solid to the top box, whatever the ladder's length", () => {
    expect(stateForBox(MAX_BOX)).toBe("solid");
    expect(stateForBox(MAX_BOX - 1)).not.toBe("solid");
    expect(BOX_DAYS[MAX_BOX - 2]).toBe(7); // the wait a word comes back from to become solid
    expect(BOX_DAYS[MAX_BOX - 1]).toBe(21); // the wait it earns by being solid
  });
});

describe("wordState", () => {
  it("calls a word nobody has touched unseen", () => {
    expect(wordState(EMPTY, KEY)).toBe("unseen");
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

  it("makes the first wrong answer learning — it was recalled and missed", () => {
    const progress = reviewItem(EMPTY, KEY, false, "2026-08-23");
    expect(wordState(progress, KEY)).toBe("learning");
  });
});

describe("strongest", () => {
  it("keeps whichever state is further along", () => {
    expect(strongest("learning", "known")).toBe("known");
    expect(strongest("known", "learning")).toBe("known");
    expect(strongest("known", "solid")).toBe("solid");
  });

  it("treats no state at all as weaker than any state", () => {
    expect(strongest(undefined, "learning")).toBe("learning");
    expect(strongest(undefined, "unseen")).toBe("unseen");
  });

  it("returns the second when the two are equal, which is the same answer", () => {
    expect(strongest("learning", "learning")).toBe("learning");
  });
});
