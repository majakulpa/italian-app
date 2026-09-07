import { describe, it, expect } from "vitest";
import { clozeExample, toQuestion } from "./question.js";
import { LEVELS } from "../../data/vocab.js";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories.find((c) => c.id === "greetings");
const bene = greetings.words.find((w) => w.it === "bene");

const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const drill = a1Grammar.topics[0].drills[0];

// The twelve words of 120 whose lemma does not appear in their own example.
// Ten are inflected across the sentence — conjugated verbs (`scadere` in
// *scade*, `allegare` in *Allego*) and C1 idioms (`farsi in quattro` in *Si è
// fatta in quattro*) — and gapping them needs lemmatisation the app does not
// have. Cutting a guessed span out of the sentence would teach a wrong word,
// so these get their gloss on its own and no cloze.
//
// The list is pinned rather than derived because that is the point: a word
// added with an example that doesn't contain it would otherwise lose its
// disambiguating context silently, and a beginner would be left guessing
// which of "well / good" was wanted.
const NO_CLOZE = [
  "smentire",
  "risparmiare",
  "avere una gatta da pelare",
  "prendere in giro",
  "costare un occhio della testa",
  "andare liscio",
  "farsi in quattro",
  "tirare la corda",
  "avere le mani in pasta",
  "fare il punto",
  "scadere",
  "allegare",
];

const everyWord = LEVELS.flatMap((level) => level.categories.flatMap((category) => category.words));

describe("gapping a word out of its own example", () => {
  it("cuts the word out and leaves the rest of the sentence", () => {
    expect(clozeExample(bene)).toBe("Sto ___, grazie.");
  });

  it("matches a word that opens the sentence, capital and all", () => {
    expect(clozeExample({ it: "no", ex: "No, grazie." })).toBe("___, grazie.");
  });

  // \b would not do here: it is defined over ASCII word characters, so the
  // position after the `ì` and before the comma sits between two non-word
  // characters and is not a boundary at all — `\bsì\b` never matches, and
  // every accent-final word in the deck would silently lose its cloze.
  it("gaps a word that ends in an accent", () => {
    expect(clozeExample({ it: "sì", ex: "Sì, certo." })).toBe("___, certo.");
  });

  it("does not gap a word that is only the start of a longer one", () => {
    expect(clozeExample({ it: "casa", ex: "Il casale è vicino a casa." })).toBe("Il casale è vicino a ___.");
  });

  it("does not gap a word that is only the end of a longer one", () => {
    expect(clozeExample({ it: "amo", ex: "Chiamo un taxi, amo Roma." })).toBe("Chiamo un taxi, ___ Roma.");
  });

  it("gives back nothing when the word is not in its example verbatim", () => {
    expect(clozeExample({ it: "scadere", ex: "La carta d'identità scade a marzo." })).toBeNull();
  });

  it("gaps every word in the deck except the twelve that cannot be gapped", () => {
    const ungappable = everyWord.filter((word) => clozeExample(word) === null).map((word) => word.it);
    expect(ungappable).toEqual(NO_CLOZE);
  });

  // The gap has to actually remove the word, or the prompt hands over the
  // answer it is asking for.
  it("never leaves the answer showing in the gapped sentence", () => {
    for (const word of everyWord) {
      const cloze = clozeExample(word);
      if (cloze) expect(cloze.toLowerCase(), word.it).not.toContain(word.it.toLowerCase());
    }
  });
});

describe("building a question from a due unit", () => {
  it("asks a vocabulary word by its gloss, with its example gapped underneath", () => {
    const question = toQuestion({ moduleId: "vocab", item: bene });

    expect(question).toMatchObject({
      kind: "vocab",
      gloss: bene.en,
      cloze: "Sto ___, grazie.",
      prompt: null,
      answer: bene.it,
      alternatives: [],
    });
    expect(question.context).toEqual({ it: bene.ex, en: bene.exEn });
    expect(question.recap).toEqual({ primary: bene.it, secondary: bene.en });
  });

  it("leaves a word that cannot be gapped with its gloss alone", () => {
    const scadere = everyWord.find((w) => w.it === "scadere");
    expect(toQuestion({ moduleId: "vocab", item: scadere }).cloze).toBeNull();
  });

  // The options stay in the data and stop being drawn: they are the
  // `distractor` verdict's evidence now, not a line-up to pick from.
  it("asks a grammar drill by its own gap, and keeps its other forms as alternatives", () => {
    const question = toQuestion({ moduleId: "grammar", item: drill });

    expect(question).toMatchObject({ kind: "grammar", prompt: drill.prompt, hint: drill.hint, answer: drill.answer, gloss: null, cloze: null });
    expect(question.alternatives).toEqual(drill.options.filter((o) => o !== drill.answer));
    expect(question.alternatives).not.toContain(drill.answer);
    expect(question.context).toEqual({ it: drill.prompt.replace("___", drill.answer), en: drill.en });
  });
});
