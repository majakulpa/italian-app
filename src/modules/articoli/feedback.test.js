import { describe, it, expect } from "vitest";
import { judge, announce, ATTEMPTS } from "./feedback.js";
import { STRANDS, ZERO } from "../../data/articoli.js";

// The five located verdicts are this module's whole argument with the
// standard wrong → red cross → answer pattern, so each is pinned here against
// the real items rather than a fixture: if the data changes under them, these
// should notice.

const strand = (id) => STRANDS.find((s) => s.id === id);
const item = (strandId, itemId) => strand(strandId).items.find((i) => i.id === itemId);

const caffe = item("determinativo", "caffe"); // il, against un and the zero article
const studente = item("determinativo", "studente"); // lo, against il and l'
const medico = item("indeterminativo", "medico"); // the zero article, against un and il
const chiave = item("indeterminativo", "chiave"); // un', against un and una
const cassetto = item("preposizioni", "cassetto"); // nel, against "in il" and in
const centro = item("preposizioni", "centro"); // in, against nel and "in il"

describe("a right answer", () => {
  it("shows the sentence with the gap closed, and what it means", () => {
    const verdict = judge(caffe, "il", 1);

    expect(verdict.correct).toBe(true);
    expect(verdict.kind).toBe("exact");
    expect(verdict.sentence).toBe("Bevo il caffè ogni mattina.");
    expect(announce(verdict)).toContain("Correct. Italian writes it: Bevo il caffè ogni mattina. — I drink coffee every morning.");
  });

  it("opens the rule and the Polish anchor the moment it lands", () => {
    const verdict = judge(caffe, "il", 1);

    expect(verdict.rule.id).toBe("generico");
    expect(verdict.anchor.pl).toBe("Piję kawę");
    // "One of the rules", never "the rule": la mano is filed under `corpo`
    // and is a deceptive-gender noun as well.
    expect(announce(verdict)).toContain("One of the rules behind it: il, la, i, le,");
    expect(announce(verdict)).toContain("In Polish: Piję kawę.");
  });

  it("recognises the zero article as an answer rather than a refusal to answer", () => {
    const verdict = judge(medico, ZERO, 1);

    expect(verdict.correct).toBe(true);
    expect(verdict.sentence).toBe("Sono medico.");
  });
});

describe("a wrong answer gets located, not solved", () => {
  // The rule for this item is "lo before s + consonant". Printing it on a
  // first miss would hand over the answer, so nothing opens until the
  // attempts are spent.
  it("withholds the answer, the rule and the anchor on the first attempt", () => {
    const verdict = judge(studente, "il", 1);

    expect(verdict.correct).toBe(false);
    expect(verdict.last).toBe(false);
    expect({ answer: verdict.answer, rule: verdict.rule, anchor: verdict.anchor, sentence: verdict.sentence }).toEqual({
      answer: null,
      rule: null,
      anchor: null,
      sentence: null,
    });
    expect(announce(verdict)).toContain("Try once more.");
  });

  it("reveals all of it only once the attempts are spent", () => {
    const verdict = judge(studente, "il", ATTEMPTS);

    expect(verdict.last).toBe(true);
    expect(verdict.answer).toBe("lo");
    expect(verdict.rule.id).toBe("suono");
    expect(announce(verdict)).toContain("The answer is lo. Ieri lo studente è arrivato tardi.");
    expect(announce(verdict)).toContain("In Polish: Student się spóźnił.");
  });

  it("says the shape missed when the definiteness was right", () => {
    const verdict = judge(studente, "il", 1);

    expect(verdict.kind).toBe("form");
    expect(announce(verdict)).toContain("Definite or indefinite is not what went wrong");
  });

  it("calls a gender slip a shape slip too, not a different kind of article", () => {
    // Polish klucz is masculine and pushes the learner at `un`; la chiave is
    // feminine. Both are indefinite, so the dimension is the shape.
    expect(judge(chiave, "un", 1).kind).toBe("form");
    expect(judge(chiave, "una", 1).kind).toBe("form");
  });

  it("says an article belongs and the kind of it missed", () => {
    const verdict = judge(caffe, "un", 1);

    expect(verdict.kind).toBe("definiteness");
    expect(announce(verdict)).toContain("An article does belong here. Which kind of one is what missed.");
  });

  // The error both of the learner's languages push her into, and the reason
  // this strand exists at all.
  it("says Italian does not leave the gap empty when the learner did", () => {
    const verdict = judge(caffe, ZERO, 1);

    expect(verdict.kind).toBe("missing");
    expect(announce(verdict)).toContain("even where Polish and English both would");
  });

  it("says the presence of an article is the question when Italian wants none", () => {
    const verdict = judge(medico, "un", 1);

    expect(verdict.kind).toBe("intrusive");
    expect(announce(verdict)).toContain("Whether there is one at all is.");
  });

  // Not one of the five located sentences may narrow the three options to
  // one by naming a form. This is the invariant the whole file exists for,
  // and it is checked against every wrong option of every real item.
  //
  // Word by word rather than by substring, and that is not pedantry: `gli`
  // sits inside `English`, which the located sentence for a missing article
  // says out loud. A substring check fails on the one message that most has
  // to exist.
  const wordsOf = (text) => text.toLowerCase().split(/[\s,.;:\u2014!?]+/).filter(Boolean);

  it("never names a form in a located verdict", () => {
    for (const s of STRANDS) {
      for (const i of s.items) {
        for (const option of i.options.filter((o) => o !== i.answer)) {
          const said = announce(judge(i, option, 1));
          expect(said, `${s.id}/${i.id} ← ${option}`).toContain("Not quite.");
          // The zero article is a glyph rather than a word, so there is no
          // token to look for; the assertion below covers it instead.
          if (i.answer !== ZERO) {
            expect(wordsOf(said), `${s.id}/${i.id} ← ${option}`).not.toContain(i.answer.toLowerCase());
          }
        }
      }
    }
  });

  // The zero article's half of the test above, and renamed to say so. It was
  // called "never says the gap should be empty while the attempt is still
  // live", which it could not fail for: the intrusive sentence *does* convey
  // that the gap is empty — that is the design, argued in feedback.js's own
  // header, and with three buttons some elimination is unavoidable. What the
  // assertion actually checks is narrower and is a real property: the answer
  // is never *spelled out*. The other four options are words the loop above
  // can look for; the zero article is a glyph with no token to search, so its
  // names have to be listed. Any rewording that reaches for one of them —
  // "Italian wants no article here" — turns this red.
  const zeroItems = STRANDS.flatMap((s) => s.items.filter((i) => i.answer === ZERO).map((i) => [i.id, i]));

  it.each(zeroItems)("never spells the zero article out on %s while the attempt is still live", (_id, item) => {
    for (const option of item.options.filter((o) => o !== ZERO)) {
      const said = announce(judge(item, option, 1));

      expect(said, option).not.toMatch(/no article|none at all|nothing at all|empty|leave it blank/i);
      expect(said, option).toContain("Whether there is one at all is.");
    }
  });
});

describe("the fused prepositions", () => {
  // The most useful wrong answer in the strand: both halves are right and
  // Italian's orthography is the thing that failed the learner. Saying only
  // "incorrect" there would throw away the fact that the reasoning worked.
  it("credits both words and names the joining as the thing that missed", () => {
    const verdict = judge(cassetto, "in il", 1);

    expect(verdict.kind).toBe("fusion");
    expect(announce(verdict)).toContain("Both of those words are right");
  });

  it("calls a bare preposition a missing article rather than a fusion slip", () => {
    expect(judge(cassetto, "in", 1).kind).toBe("missing");
  });

  // `Abito in centro` takes no article, so `in il` there is not a fusion
  // lesson at all — it is an article that should not exist. Lecturing about
  // joining would be advice about the wrong dimension on the one item that
  // proves the article is optional.
  it("does not preach fusion on an item whose answer has no article to fuse", () => {
    const verdict = judge(centro, "in il", 1);

    expect(verdict.kind).toBe("intrusive");
    expect(announce(verdict)).not.toContain("joined");
  });

  it("treats a fused form where none belongs the same way", () => {
    expect(judge(centro, "nel", 1).kind).toBe("intrusive");
  });
});
