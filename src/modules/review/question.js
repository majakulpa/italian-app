// Turning one due unit into something the learner has to *produce*.
//
// La Piazza used to be four buttons. Recognition is the cheapest thing a
// review can ask for and the least like using the language, so every item
// here is typed instead — which is also what unblocks the two benches that
// stayed out of the queue rather than be answered by a red cross and the
// answer handed over.
//
// The two scheduled modules arrive in different shapes:
//
//   grammar  already a gapped sentence with one authored answer. The gap is
//            the question; its `options` are *not* shown — they become a
//            feedback signal instead (see feedback.js, verdict `distractor`).
//   vocab    a word and an English gloss. The gloss alone is often ambiguous
//            — "well / good" could be `bene` or `buono` — so the word's own
//            example sentence comes with it, with the word itself gapped out
//            as disambiguating context.
//   riserva  a base-vocabulary entry: an English gloss and a Polish one, and
//            no example sentence anywhere in the file. Its question is built
//            by modules/riserva/drill.js rather than here, because that is
//            where the argument about the two glosses lives and a second copy
//            of it would drift. The import direction is the right way round:
//            La Piazza has no content of its own, it replays other districts'.

import { lexiconQuestion } from "../riserva/drill.js";

const GAP = "___";

// Regex-special characters in a lemma. None of the 120 words has one today,
// but escaping is a one-liner and a lemma with an apostrophe or a full stop
// in it would otherwise build a regex that quietly matches the wrong thing.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The word's example sentence with the word itself replaced by the gap, or
// null when the word does not appear in its own example verbatim.
//
// Twelve of the 120 words don't: conjugated verbs whose lemma never shows up
// (`scadere` in *scade*, `allegare` in *Allego*) and the C1 idioms, which are
// inflected across the sentence (`farsi in quattro` in *Si è fatta in
// quattro*). Gapping those needs lemmatisation, and guessing at it would
// gap the wrong span — so they get the gloss on its own and no cloze.
// question.test.js pins exactly which twelve, so a new word that silently
// fails to gap is a test failure rather than a quietly weaker prompt.
//
// The match is case-insensitive (an example often opens with the word) and
// bounded by Unicode letters rather than by \b. \b is defined over ASCII word
// characters, so the position after the `ì` in `sì,` sits between two
// non-word characters and is not a boundary at all: `\bsì\b` never matches,
// and every accent-final word in the deck would silently lose its cloze.
export function clozeExample(word) {
  const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(word.it)}(?!\\p{L})`, "iu");
  if (!pattern.test(word.ex)) return null;
  return word.ex.replace(pattern, GAP);
}

// What the drill needs to ask one item and judge the answer.
//
// `alternatives` is the item's other authored forms, which only grammar has.
// They are never rendered — showing them would put the multiple choice back —
// but typing one of them is the most locatable error in the app, so the
// judge is given them.
//
// `neighbours` is the sibling field: other whole *items* the learner might
// have been reaching for instead. Empty on both shapes built here and filled
// only by La Riserva, and that is a fact about the content rather than an
// omission. A base-vocabulary entry sits in a closed list of 300 words the
// learner is working through, so "that is another word from this list" is a
// true and useful thing to say; a deck word's siblings are its category, and
// a grammar drill's are sentences, and neither would make that sentence true.
//
// `strictAccents` is the sibling of that field and false here for the same
// reason it is empty here. It says the answer is one of two entries a *list*
// tells apart by an accent alone, so a missing accent would mark the other one
// right; with no list there is no other one, and a deck word judged against
// itself can only ever be a missing accent. La Riserva derives it (see
// drill.js); the judge needs it on every shape, so it is stated rather than
// left undefined.
//
// `context` is the gap closed: the sentence in full, once the item is
// settled, so the answer arrives in the place it came from rather than as a
// loose word. `recap` is the one-line form the end-of-round list wants, where
// the word itself is the thing being listed.
export function toQuestion(unit) {
  if (unit.moduleId === "riserva") return lexiconQuestion(unit.item);

  if (unit.moduleId === "vocab") {
    return {
      kind: "vocab",
      gloss: unit.item.en,
      glossPl: null,
      cloze: clozeExample(unit.item),
      prompt: null,
      hint: null,
      answer: unit.item.it,
      alternatives: [],
      neighbours: [],
      strictAccents: false,
      context: { it: unit.item.ex, en: unit.item.exEn },
      recap: { primary: unit.item.it, secondary: unit.item.en },
    };
  }

  const filled = unit.item.prompt.replace(GAP, unit.item.answer);
  return {
    kind: "grammar",
    gloss: null,
    glossPl: null,
    cloze: null,
    prompt: unit.item.prompt,
    hint: unit.item.hint,
    answer: unit.item.answer,
    alternatives: unit.item.options.filter((option) => option !== unit.item.answer),
    neighbours: [],
    strictAccents: false,
    context: { it: filled, en: unit.item.en },
    recap: { primary: filled, secondary: unit.item.en },
  };
}
