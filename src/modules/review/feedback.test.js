import { describe, it, expect } from "vitest";
import { judge, reveal, announce, LOCATED, ATTEMPTS } from "./feedback.js";

// A question, as question.js builds one. Only the two fields the judge reads.
const q = (answer, alternatives = []) => ({ answer, alternatives });

const WORD = q("sorella");
const DRILL = q("parlo", ["parli", "parla", "parlano"]);

const FIRST = 1;
const LAST = ATTEMPTS;

describe("judging a typed review answer", () => {
  it("takes an exact answer, ignoring case and stray whitespace", () => {
    expect(judge(DRILL, "  Parlo ", FIRST)).toMatchObject({ correct: true, kind: "exact", answer: null });
  });

  // Accepted, and spelled back all the same: accepting `citta` without ever
  // showing `città` would teach the wrong spelling by omission.
  it("takes an answer with the accents left off, and spells it out", () => {
    expect(judge(q("città"), "citta", FIRST)).toMatchObject({ correct: true, kind: "accents", answer: "città" });
  });

  // The most locatable error in the app, and the whole reason the authored
  // options stay in the data after they stop being drawn.
  it("names another authored form as a form, and never says which one was wanted", () => {
    const verdict = judge(DRILL, "parli", FIRST);
    expect(verdict).toMatchObject({ correct: false, kind: "distractor", answer: null, shared: null });
    expect(LOCATED.distractor).not.toContain("parlo");
  });

  it("holds the answer back until the attempts are spent", () => {
    expect(judge(DRILL, "parli", FIRST).answer).toBeNull();
    expect(judge(DRILL, "parli", LAST).answer).toBe("parlo");
  });

  it("calls it an ending when only the last letter or two missed", () => {
    expect(judge(q("parlo"), "parla", FIRST)).toMatchObject({ kind: "ending", shared: "parl" });
  });

  it("calls it partial when it diverges further in than the ending", () => {
    expect(judge(q("parliamo"), "parlate", FIRST)).toMatchObject({ kind: "partial", shared: "parl" });
  });

  // A front-anchored match says more than a back-anchored one, because
  // Italian inflects at the end. `parlamo` starts right *and* ends right, and
  // "it goes wrong after parl" is the half worth having.
  it("prefers the shared start over the shared end when both agree", () => {
    expect(judge(q("parliamo"), "parlamo", FIRST)).toMatchObject({ kind: "partial", shared: "parl", tail: null });
  });

  // Otherwise "you have it right up to the last letters" would be a lie about
  // where the extra is.
  it("does not call it an ending when the whole answer is there with more after it", () => {
    expect(judge(q("conto"), "conto subito", FIRST)).toMatchObject({ kind: "partial", shared: "conto" });
  });

  it("says the ending landed when the front is what missed", () => {
    expect(judge(WORD, "fratella", FIRST)).toMatchObject({ kind: "stem", tail: "ella", shared: null });
  });

  // The tail is grown off the answer but stops one character short, so it can
  // narrow the answer down and never be it.
  it("never quotes the whole answer back as the shared ending", () => {
    const verdict = judge(q("conto"), "il conto", FIRST);
    expect(verdict.kind).toBe("stem");
    expect(verdict.tail).toBe("onto");
  });

  // foldTyped collapses and trims whitespace, so a tail grown across a space
  // has to come back trimmed rather than with a stray leading space.
  it("trims a shared ending that reaches back across a space", () => {
    expect(judge(q("per favore"), "il favore", FIRST)).toMatchObject({ kind: "stem", tail: "favore" });
  });

  it("refuses to locate a single shared letter, at either end", () => {
    expect(judge(q("andare"), "aeiou", FIRST)).toMatchObject({ kind: "other", shared: null, tail: null });
    expect(judge(q("andare"), "xyze", FIRST)).toMatchObject({ kind: "other", shared: null, tail: null });
  });

  // An empty box is not an attempt: there is nothing in it to locate, and
  // spending one of two goes on a mis-tap would mark dexterity.
  it("does not spend an attempt on an empty box", () => {
    expect(judge(DRILL, "   ", FIRST)).toMatchObject({ kind: "blank", spent: false, last: false, answer: null });
    expect(judge(DRILL, "", LAST)).toMatchObject({ kind: "blank", spent: false, last: false, answer: null });
  });

  it("hands the answer over when the learner asks for it, and calls it wrong", () => {
    expect(reveal(WORD)).toMatchObject({ correct: false, kind: "revealed", last: true, answer: "sorella" });
  });
});

// A screen reader gets no colour and no cards, so everything the sighted
// learner reads off the feedback has to be in the spoken twin.
describe("announcing a verdict", () => {
  it("says correct, and nothing more, when there is nothing more", () => {
    expect(announce(judge(DRILL, "parlo", FIRST))).toBe("Correct.");
  });

  it("spells out an answer taken with its accents missing", () => {
    expect(announce(judge(q("città"), "citta", FIRST))).toBe("Correct. Italian writes it città.");
  });

  it("speaks the located sentence and the shared start, without the answer", () => {
    const spoken = announce(judge(q("parliamo"), "parlate", FIRST));
    expect(spoken).toBe(`Not quite. ${LOCATED.partial} You have parl right. Try once more.`);
    expect(spoken).not.toContain("parliamo");
  });

  it("speaks the shared ending", () => {
    expect(announce(judge(WORD, "fratella", FIRST))).toBe(`Not quite. ${LOCATED.stem} Both end ella. Try once more.`);
  });

  it("speaks the answer once the attempts are spent", () => {
    expect(announce(judge(WORD, "fratella", LAST))).toContain("The answer is sorella.");
  });

  it("says an empty box is empty rather than dressing it as a near miss", () => {
    expect(announce(judge(DRILL, "", FIRST))).toBe(LOCATED.blank);
  });

  it("speaks the revealed answer", () => {
    expect(announce(reveal(WORD))).toBe("The answer is sorella.");
  });

  it("has a located sentence for every kind that locates one", () => {
    for (const kind of ["distractor", "ending", "partial", "stem", "other", "blank"]) {
      expect(LOCATED[kind], kind).toBeTruthy();
    }
    // The two right answers and the reveal have nothing to locate, and the
    // card renders LOCATED[kind] straight, so an entry here would print a
    // location on a correct answer.
    for (const kind of ["exact", "accents", "revealed"]) {
      expect(LOCATED[kind], kind).toBeUndefined();
    }
  });
});
