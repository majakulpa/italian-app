// When two Italian strings are the same word.
//
// The app stores one lemma in more than one spelling on purpose. The
// vocabulary deck stores `madre`, because that is the word its category is
// teaching; fondamentale.js stores `la madre`, because on a noun whose ending
// does not give the gender away the article *is* the gender. Both are right,
// and they are one word.
//
// This is one function in a file of its own rather than a helper inside
// coverage.js, where it used to live, because two callers now need it and
// they cannot both reach coverage.js:
//
//   coverage.js  builds the bridge from a module's units onto lexicon ranks,
//                and folds two units at one rank with strongest().
//   srs.js       collapses the review queue, so a word held on two benches is
//                asked once. srs.js cannot import coverage.js — coverage.js
//                imports wordState.js, which imports srs.js for MAX_BOX, and
//                the cycle would leave one of the three reading an
//                uninitialised binding.
//
// It has to be one function rather than two normalisers that happen to agree:
// the queue's idea of "the same word" and coverage's idea of it must not be
// allowed to drift, or the dashboard and the round end up counting different
// things.

// Leading article goes, case goes, trailing punctuation goes. Deliberately
// not a stemmer: nothing here should decide that `parlo` and `parlare` are
// the same word, only that `la madre` and `madre` are.
export function lemmaKey(italian) {
  return italian
    .trim()
    .toLowerCase()
    .replace(/^(l'|un'|(il|lo|la|i|gli|le|un|uno|una) )/, "")
    .replace(/[?!.,;:]+$/, "");
}
