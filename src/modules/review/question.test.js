import { describe, it, expect } from "vitest";
import { clozeExample, toQuestion } from "./question.js";
import { LEVELS } from "../../data/vocab.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { lexiconQuestion } from "../riserva/drill.js";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import { STRANDS, ZERO, filled } from "../../data/articoli.js";

const determinativo = STRANDS.find((s) => s.id === "determinativo");
// "Bevo ___ caffè ogni mattina." — answer `il`, options il / un / —, and the
// one item in the file the design itself picked to make the Polish point.
const caffe = determinativo.items.find((i) => i.id === "caffe");
const everyArticle = STRANDS.flatMap((strand) => strand.items);

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

  // A base-vocabulary word is built by the bench that owns it, not by a
  // second copy here. La Piazza has no content of its own — it replays other
  // districts' — so this is one delegation rather than one more shape to keep
  // in step with modules/riserva/drill.js.
  it("hands a base-vocabulary word to La Riserva's own builder", () => {
    const dire = FONDAMENTALE.find((e) => e.it === "dire");
    const question = toQuestion({ moduleId: "riserva", item: dire });

    expect(question).toEqual(lexiconQuestion(dire));
    expect(question).toMatchObject({ kind: "lexicon", gloss: dire.en, glossPl: dire.pl, answer: "dire" });
  });

  // The Polish half is a field of its own rather than text appended to the
  // English gloss, because one string can only claim one language (WCAG
  // 3.1.2) — and the other two shapes have to declare it absent rather than
  // leaving the screen to read an undefined.
  it("gives every question shape a Polish slot, filled only where there is one", () => {
    expect(toQuestion({ moduleId: "vocab", item: bene }).glossPl).toBeNull();
    expect(toQuestion({ moduleId: "grammar", item: drill }).glossPl).toBeNull();
    expect(toQuestion({ moduleId: "riserva", item: FONDAMENTALE[0] }).glossPl).toBe(FONDAMENTALE[0].pl);
  });

  // The one shape that is not typed. Its gap is the question the way a grammar
  // drill's is, and the English under it is the small line a grammar drill
  // puts its hint on — but the three forms are drawn, which nothing else here
  // does, and that is the whole point of the shape.
  it("asks an article item by its gap, with the three forms it is chosen from", () => {
    const question = toQuestion({ moduleId: "articoli", item: caffe });

    expect(question).toMatchObject({
      kind: "articoli",
      prompt: "Bevo ___ caffè ogni mattina.",
      hint: caffe.en,
      answer: caffe.answer,
      gloss: null,
      glossPl: null,
      cloze: null,
    });
    expect(question.options).toEqual(caffe.options);
    expect(question.options).toContain(ZERO);
    expect(question.context).toEqual({ it: "Bevo il caffè ogni mattina.", en: caffe.en });
  });

  // The recap is what the end-of-round list prints, and a bare `il` there
  // would be the one part of the item that says nothing on its own — an
  // article is only ever an answer to the noun it stands in front of.
  it("recaps an article item as the sentence with its gap closed", () => {
    expect(toQuestion({ moduleId: "articoli", item: caffe }).recap).toEqual({
      primary: "Bevo il caffè ogni mattina.",
      secondary: caffe.en,
    });
  });

  // The same check the cloze gets, for the same reason: a prompt that still
  // contains the answer is a question that hands it over. `da` sits inside
  // `dalla` and `di` inside `della`, so this has to be bounded rather than a
  // substring test — and the zero article is an em dash, which never appears
  // in a sentence.
  it("never leaves the answer showing in an article prompt", () => {
    for (const item of everyArticle) {
      if (item.answer === ZERO) continue;
      const { prompt } = toQuestion({ moduleId: "articoli", item });
      const bounded = new RegExp(`(?<!\\p{L})${item.answer}(?!\\p{L})`, "iu");
      expect(bounded.test(prompt), `${item.id}: ${prompt}`).toBe(false);
    }
  });

  // Closing the gap has exactly one implementation — data/articoli.js's
  // filled() — so the sentence La Piazza reveals and the sentence the bench
  // reveals cannot come out different.
  it("closes an article gap the way the bench closes it", () => {
    for (const item of everyArticle) {
      const question = toQuestion({ moduleId: "articoli", item });
      expect(question.context.it, item.id).toBe(filled(item));
      expect(question.recap.primary, item.id).toBe(filled(item));
    }
  });

  // `options` is what the screen branches on to choose between a text box and
  // three buttons, so the typed shapes have to declare it empty rather than
  // leave the screen reading `undefined.length`.
  it("gives every question shape an options slot, filled only on the article one", () => {
    expect(toQuestion({ moduleId: "vocab", item: bene }).options).toEqual([]);
    expect(toQuestion({ moduleId: "grammar", item: drill }).options).toEqual([]);
    expect(toQuestion({ moduleId: "riserva", item: FONDAMENTALE[0] }).options).toEqual([]);
    expect(toQuestion({ moduleId: "articoli", item: caffe }).options).toHaveLength(3);
  });

  // `options` and `alternatives` are two fields because they are two things: a
  // grammar drill is authored with three forms that are never drawn, and an
  // article item is authored with three that are the question. Folding them
  // into one field would put the grammar line-up back on screen.
  it("keeps the drawn forms and the undrawn ones in different fields", () => {
    const grammar = toQuestion({ moduleId: "grammar", item: drill });
    expect(grammar.alternatives.length).toBeGreaterThan(0);
    expect(grammar.options).toEqual([]);

    const article = toQuestion({ moduleId: "articoli", item: caffe });
    expect(article.options.length).toBeGreaterThan(0);
    expect(article.alternatives).toEqual([]);
  });
});
