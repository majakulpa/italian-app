// Turning one due unit into something the learner has to *produce*.
//
// La Piazza used to be four buttons. Recognition is the cheapest thing a
// review can ask for and the least like using the language, so every item
// here is typed instead — which is also what unblocks the two benches that
// stayed out of the queue rather than be answered by a red cross and the
// answer handed over.
//
// The scheduled modules arrive in different shapes:
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
//   articoli the one shape that is not typed, and the reason `options` exists
//            below. Everything above has an answer space the learner writes
//            into; an article item is a choice between three authored forms,
//            one of which may be the zero article, and asking it any other
//            way would mean asking the learner to guess which three of the
//            ten article forms Italian was choosing between here.

import { lexiconQuestion } from "../riserva/drill.js";
import { filled } from "../../data/articoli.js";

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
//
// `options` is the field that says how the item is *answered* rather than what
// it is answered with, and it is the one the screen branches on: empty means a
// text box, three forms mean three buttons. It is declared empty on the typed
// shapes rather than left undefined, the same discipline `alternatives` and
// `glossPl` already follow — a screen reading `q.options.length` must not have
// to know which shape it is holding first.
//
// It is emphatically not `alternatives` under another name. `alternatives` is
// the forms an item was authored with that are *never drawn* and exist to feed
// the judge a `distractor` verdict; `options` is the line-up. A grammar drill
// has both and they are different sets: its options stay out of sight.
export function toQuestion(unit) {
  if (unit.moduleId === "riserva") return lexiconQuestion(unit.item);

  // The gapped sentence, the English under it, and the three forms — which is
  // what Gli Articoli's own bench draws, minus the strand chrome around it.
  // `hint` is where the English goes because `hint` is the small line under
  // the prompt, and the English *is* the hint here in the strict sense: it is
  // as often a trap as a help, since English drops the article in exactly the
  // places Italian keeps it. `Bevo il caffè` is `I drink coffee`.
  if (unit.moduleId === "articoli") {
    return {
      kind: "articoli",
      gloss: null,
      glossPl: null,
      cloze: null,
      prompt: `${unit.item.before} ${GAP} ${unit.item.after}`,
      hint: unit.item.en,
      answer: unit.item.answer,
      // The judge this shape routes to (modules/articoli/feedback.js) reasons
      // about what the forms *are*, not about a string it was handed, so it
      // takes the item itself and has no use for either of these two.
      alternatives: [],
      neighbours: [],
      strictAccents: false,
      options: unit.item.options,
      context: { it: filled(unit.item), en: unit.item.en },
      // The sentence with its gap closed, which is what Gli Articoli's own
      // summary lists. A bare `il` in the "worth another look" list would be
      // the one thing about the item that is useless on its own: the article
      // is only ever an answer to the noun it sits in front of.
      recap: { primary: filled(unit.item), secondary: unit.item.en },
    };
  }

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
      options: [],
      context: { it: unit.item.ex, en: unit.item.exEn },
      recap: { primary: unit.item.it, secondary: unit.item.en },
    };
  }

  // `closed`, not `filled`: data/articoli.js exports a function by that name
  // and this branch is inside the same function scope as the article one, so a
  // local `filled` would shadow the import across both and leave the article
  // branch calling a const in its temporal dead zone. It did, and
  // question.test.js caught it.
  const closed = unit.item.prompt.replace(GAP, unit.item.answer);
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
    // Authored with three forms and asked with none of them on screen: the gap
    // is the question, and the other two are the `distractor` verdict's
    // evidence. This is the shape that makes `options` and `alternatives` two
    // fields rather than one.
    options: [],
    context: { it: closed, en: unit.item.en },
    recap: { primary: closed, secondary: unit.item.en },
  };
}
