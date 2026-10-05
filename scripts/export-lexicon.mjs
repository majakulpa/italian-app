// Export src/data/fondamentale.js as the lexicon shape check_text.py wants.
//
// research/gen-experiment/build_lexicon.py writes `lexicon_600.json`: a flat
// JSON array of lemma strings, nothing else. check_text.py loads it with
// `set(json.load(...))` and asks whether a token's candidate lemmas intersect
// it. So the export is a JSON array of strings, in rank order.
//
// Why an export at all, rather than pointing the checker at build_lexicon.py's
// output: that output is an OpenSubtitles-derived *proxy* for De Mauro, and its
// own README admits it has no `tavolo`, no `letto`, no `sedia` and no `porta`.
// fondamentale.js exists to replace it. Measuring the serial against the proxy
// would measure the wrong 600 words — the experiment's 97.2% is for that proxy,
// not for us.
//
// Stripping the article is the one transformation here, and it is required:
// fondamentale.js stores an opaque noun *with* its definite article, because on
// a noun whose ending does not give the gender away the article is the gender
// (`la chiave`, `il problema`, `l'amore`). check_text.py matches single tokens,
// so `la chiave` in the lexicon would never match the token `chiave` and the
// word would read as unknown. shared/lemma.js's `lemmaKey` is exactly this
// normalisation and is reused rather than re-spelt — it is the same function
// coverage.js and srs.js use to decide that `la madre` and `madre` are one
// word, and the gate must not get a second opinion on that.
//
// It deliberately does not stem. `lemmaKey` says so itself: nothing in it
// decides that `parlo` and `parlare` are the same word. That is the Python
// side's job (spaCy + simplemma), which is why this script's output is an
// input to the checker and not a gate of its own.
//
// Usage: node scripts/export-lexicon.mjs <out.json>
import { writeFileSync } from "node:fs";
import { FONDAMENTALE } from "../src/data/fondamentale.js";
import { lemmaKey } from "../src/shared/lemma.js";

export function lexiconLemmas(entries) {
  return entries.map((entry) => lemmaKey(entry.it));
}

export function main(out) {
  if (!out) {
    console.error("usage: node scripts/export-lexicon.mjs <out.json>");
    return 2;
  }
  const lemmas = lexiconLemmas(FONDAMENTALE);
  writeFileSync(out, JSON.stringify(lemmas, null, 0) + "\n", "utf8");

  // A multi-word entry (`per favore`) cannot be matched by a token-level
  // checker and is reported rather than silently split: splitting it would add
  // lemmas nobody put on the list, which is the one thing a lexicon export
  // must not do.
  const phrases = lemmas.filter((lemma) => lemma.includes(" "));
  console.log(`wrote ${lemmas.length} lemmas to ${out}`);
  console.log(`unmatchable multi-word entries: ${phrases.length ? phrases.join(", ") : "none"}`);
  return 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main(process.argv[2]));
}
