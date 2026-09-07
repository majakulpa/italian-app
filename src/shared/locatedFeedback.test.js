import { describe, it, expect } from "vitest";
import { judge, reveal, announce, LOCATED, ATTEMPTS } from "./locatedFeedback.js";
import { foldTyped } from "./typedAnswer.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";

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
    expect(judge(q("città"), "citta", FIRST)).toMatchObject({ correct: true, kind: "spelling", answer: "città" });
  });

  // `come stai?` is a real vocabulary entry. Its cloze is `Ciao Marco, ___`,
  // so the question mark is inside the gap and the only way to get it right
  // is to guess it is there. Typing the Italian was marked wrong, handed back
  // `come stai` as a located fragment, and demoted the word to box 1.
  it("takes an answer without the closing punctuation the gap swallowed", () => {
    expect(judge(q("come stai?"), "come stai", FIRST)).toMatchObject({
      correct: true,
      kind: "spelling",
      answer: "come stai?",
    });
    expect(judge(q("come stai?"), "Come stai?", FIRST)).toMatchObject({ correct: true, kind: "exact", answer: null });
    expect(judge(q("davvero!"), "davvero", FIRST)).toMatchObject({ correct: true, answer: "davvero!" });
  });

  // The mark is folded for the verdict and never for the spelling — the point
  // of accepting it is not to teach that it isn't there.
  it("spells the closing punctuation back rather than quietly dropping it", () => {
    expect(announce(judge(q("come stai?"), "come stai", FIRST))).toBe("Correct. Italian writes it come stai?");
    expect(reveal(q("come stai?")).answer).toBe("come stai?");
    expect(announce(reveal(q("come stai?")))).toBe("The answer is come stai?");
    expect(announce(reveal(q("sorella")))).toBe("The answer is sorella.");
  });

  // The punctuation goes before the fragment arithmetic too, or the mark
  // counts as a character the learner got wrong.
  it("locates against the answer without its closing mark", () => {
    expect(judge(q("come stai?"), "come stare", FIRST)).toMatchObject({ kind: "ending", shared: "come sta" });
    // And the mark must not stand in for the character that keeps a span
    // under the ceiling: judged against `come stai?` this input leaves the
    // question mark as its "rest" and quotes the whole Italian back.
    expect(judge(q("come stai?"), "come stai adesso", FIRST)).toMatchObject({ kind: "partial", shared: null });
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
  // where the extra is. The located sentence still stands; what it may not do
  // is quote the answer back — see the invariant below.
  it("does not call it an ending when the whole answer is there with more after it", () => {
    expect(judge(q("conto"), "conto subito", FIRST)).toMatchObject({ kind: "partial", shared: null });
  });

  it("says the ending landed when the front is what missed", () => {
    expect(judge(WORD, "fratella", FIRST)).toMatchObject({ kind: "stem", tail: "ella", shared: null });
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

// The ceiling on a quoted span, stated as the rule rather than as the
// behaviour of one input. What shipped first satisfied "stops one character
// short" and leaked anyway: `sharedPrefix` returns the entire answer whenever
// the input is the answer plus a suffix, and `sharedTail` stopping one
// character short of `a occhio e croce` still hands over three words of four.
//
// The rule: a verdict may never quote a span that is the whole answer, and
// where the span stops on a word edge it must leave at least half the
// answer's words behind. The located sentence is not gated — it locates
// without quoting — only the fragment is.
describe("what a verdict may quote", () => {
  const words = (value) => foldTyped(value).split(" ").filter(Boolean);
  const quoted = (verdict) => verdict.shared || verdict.tail;

  // Every one of these was a real drill in the shipped data: a learner who
  // types the answer with a word of her own after it, or in front of it, was
  // handed the answer on attempt one.
  const swallowed = [
    ["parlo", "parlo italiano"],
    ["sì", "sì certo"],
    ["il", "il libro"],
    ["gli", "gli amici"],
    ["ciao", "ciaone"],
    ["conto", "il conto"],
    ["bene", "molto bene"],
  ];

  it.each(swallowed)("never quotes %s back when the input swallows it whole", (answer, input) => {
    const verdict = judge(q(answer), input, FIRST);
    expect({ input, quoted: quoted(verdict) }).toEqual({ input, quoted: null });
    expect(verdict.answer).toBeNull();
  });

  // The other end of the same bug. Two characters short of the answer, and
  // one word of four left to guess, is not a guess.
  it("never leaves a multi-word answer one word short", () => {
    const verdict = judge(q("a occhio e croce"), "un occhio e croce", FIRST);
    expect(verdict.kind).toBe("stem");
    expect(quoted(verdict)).toBeNull();
    expect(LOCATED.stem).toBeTruthy();
  });

  // The ceiling must not eat the verdict it exists to protect. A span that
  // stops inside a word leaves a word to finish, however few characters that
  // is: -o, -i, -a, -iamo, -ate and -ano all still fit after `parl`.
  it("still quotes a span that stops inside a word", () => {
    expect(judge(q("parlo"), "parla", FIRST).shared).toBe("parl");
    expect(judge(q("sorella"), "fratella", FIRST).tail).toBe("ella");
  });

  // And a whole word may be quoted while half the answer's words remain.
  it("still quotes a whole word when half the answer is left to produce", () => {
    expect(judge(q("per favore"), "il favore", FIRST).tail).toBe("favore");
    expect(judge(q("buona sera"), "buona notte", FIRST).shared).toBe("buona");
  });

  // The sweep the first round of this file did not have: every answer the app
  // can actually ask, against the two inputs that produced the leak. A single
  // pinned example cannot catch a rule that is wrong in general.
  const shipped = [
    ...LEVELS.flatMap((level) => level.categories.flatMap((category) => category.words.map((w) => w.it))),
    ...GRAMMAR_LEVELS.flatMap((level) => level.topics.flatMap((topic) => topic.drills.map((d) => d.answer))),
  ];

  it("leaves something to produce for every shipped answer, whichever side is swallowed", () => {
    expect(shipped.length).toBeGreaterThan(200);

    for (const answer of shipped) {
      for (const input of [`${answer} qualcosa`, `qualcosa ${answer}`, `davvero ${answer} qualcosa`]) {
        const span = quoted(judge(q(answer), input, FIRST));
        if (span === null) continue;

        // Never the answer itself...
        expect({ answer, input, span: foldTyped(span) }).not.toEqual({ answer, input, span: foldTyped(answer) });

        // ...and never so many of its words that what is left is not a guess.
        // Counted in whole words the span hands over, so a fragment of a word
        // — `parl` of `parlo` — costs nothing and `occhio e croce` of
        // `a occhio e croce` costs three of four.
        const inSpan = words(span);
        const held = words(answer).filter((w) => inSpan.includes(w)).length;
        const all = words(answer).length;
        expect({ answer, input, span, enough: (all - held) * 2 >= all }).toMatchObject({ enough: true });
      }
    }
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
    for (const kind of ["exact", "spelling", "revealed"]) {
      expect(LOCATED[kind], kind).toBeUndefined();
    }
  });
});
