// The release gate for the generated serial — what an episode must satisfy
// before it can ship.
//
// ── This file measures no Italian ────────────────────────────────────────────
// Say it plainly, because the opposite would be easy to assume from the name.
// Nothing here lemmatises, parses or judges a verb tense. The measurement is an
// offline Python pass (research/gen-experiment/check_text.py: spaCy morphology
// unioned with Italian suffix rules) that writes a committed report per episode.
// This file checks that the committed report is still *about the text on disk*,
// and that what the report found was declared.
//
// That split is not a compromise, it is the finding. shared/lemma.js says of
// itself that `lemmaKey` is "deliberately not a stemmer: nothing here should
// decide that `parlo` and `parlare` are the same word" — and that is exactly the
// normalisation a coverage figure needs. Measured against the real 600 entries,
// the experiment's own certified episode text scores 58.2% by bare surface match
// over its 282 content tokens and 92.9% with a lemmatiser — a 34-point gap that
// is entirely Italian inflection. A JavaScript gate would reject prose the
// experiment certified, and an author chasing a JS number writes Italian with no
// inflection in it. So the instrument is Python, run once by the author, and the
// repo's job is to stop the prose drifting away from its measurement.
//
// If the Python venv cannot be built, no episode ships. A gate that cannot run
// is not a gate, and the fallback is to publish nothing, not to publish
// unchecked. That is why EPISODES in src/data/serial.js is empty rather than
// hopeful.
//
// ── The six arms ────────────────────────────────────────────────────────────
// 1. a report exists for the episode, and is about that episode;
// 2. the report's textSha256 matches the shipped text, byte for byte;
// 3. every off-lexicon lemma the checker found is in the episode's declared new
//    words — this, not raw coverage, is the real gate: every unknown word must
//    be deliberate;
// 4. the declared new words are within the per-episode cap;
// 5. stage flags are zero;
// 6. lexicon-only coverage is reported, and clears the floor.
//
// Arm 3 is the one the design already draws: screen 13 says "13 parole nuove"
// and screen 14 marks "only the deliberate new words". Coverage alone is the
// wrong shape once the headroom is this thin — and arm 4 is what stops
// "declare everything" from gaming arm 3.
import { lemmaKey } from "./lemma.js";

// The stage the serial is written in. shared/stage.js's seven-rung ladder is
// about a learner's progress and does not rank every tense a generator can
// emit — trapassato, for one, is not on it, so "above stage 3" is undefined for
// it. The serial therefore states its own rule rather than borrowing a ladder
// that cannot answer the question.
export const SERIAL_TENSES = "presente, passato prossimo, imperfetto";

// A judgement, and labelled as one. Nothing measures the right number of new
// words per episode; the design's screen 13 draws "13 parole nuove", so the cap
// is set just above what the design itself shows and the reason it exists at all
// is arm 4 above — without a cap, an episode could declare every word it does
// not know and arm 3 would pass trivially. Raise it only with an argument about
// reading, never to make a particular episode fit.
export const NEW_WORDS_CAP = 15;

// The figure the design promises a reader, so it is the figure the gate holds.
// Lexicon-only: the share of content tokens whose lemma is in the base
// vocabulary, *not* crediting the episode's own declarations — crediting them
// would let an episode buy its own readability number.
export const COVERAGE_FLOOR = 95;

// The serial opens at 600 solid words, so a report measured against fewer than
// 600 lemmas measured a lexicon the serial was never written for.
//
// The gate deliberately does *not* require report.lexicon.sha256 to match the
// current fondamentale.js. Growing the list cannot break a report: a new entry
// can only move a lemma off the off-lexicon list, never onto it, so a report
// measured against the smaller list over-states its unknowns and the gate stays
// conservative. *Removing* an entry can break it, and then the committed
// lexicon.sha256 is how you tell which list a report used. Re-run the pipeline
// when you remove or rename an entry under a shipped episode.
export const LEXICON_FLOOR = 600;

// The exact bytes the checker measured, reconstructed from the shipped data.
// Paragraphs, one per line, newline-terminated — the same shape as the
// experiment's texts/*.txt, so a text file can be run through the pipeline as if
// it were an episode and the two agree byte for byte. Page boundaries are a
// reading-screen concern and leave no mark on the measured text.
export function canonicalText(episode) {
  return episode.pages.flat().map((paragraph) => `${paragraph}\n`).join("");
}

export function declaredLemmas(episode) {
  // lemmaKey, not a bespoke normaliser: it is the same function coverage.js and
  // srs.js use to decide `la chiave` and `chiave` are one word, and the gate
  // must not get a second opinion on that. A declaration with no `it` throws
  // here rather than being skipped — loud is correct; a declaration the gate
  // quietly ignored would weaken arm 3 into nothing.
  return new Set(episode.newWords.map((word) => lemmaKey(word.it)));
}

// Every field arm 2–6 reads, with the type it must have. A report missing one of
// these is a malformed report, and saying so is the difference between a gate
// and a vacuous pass: `undefined < COVERAGE_FLOOR` is false, so an absent
// coverage figure would sail through a naive comparison.
const REQUIRED = [
  ["episodeId", (v) => typeof v === "string" && v.length > 0],
  ["textSha256", (v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v)],
  ["lexiconOnlyCoverage", (v) => typeof v === "number" && Number.isFinite(v)],
  ["offLexiconLemmas", (v) => Array.isArray(v)],
  ["stageFlags", (v) => Array.isArray(v)],
  ["lexicon", (v) => !!v && typeof v.size === "number"],
];

/**
 * Everything wrong with one episode, as sentences. Empty array means it ships.
 *
 * @param episode    the shipped episode from src/data/serial.js
 * @param report     the committed JSON report, or null/undefined if none exists
 * @param textSha256 SHA-256 of canonicalText(episode)'s UTF-8 bytes, computed by
 *                   the caller. Hashing is not done here on purpose: this module
 *                   is plain shared code with no Node dependency, so the gate
 *                   test hashes with node:crypto and a browser-side run of the
 *                   same check (screen 17, later) can hash with crypto.subtle.
 */
export function gateFailures(episode, report, textSha256) {
  if (!report) return [`${episode.id}: no measurement report — unmeasured text cannot ship`];

  const missing = REQUIRED.filter(([key, ok]) => !ok(report[key])).map(([key]) => key);
  if (missing.length) {
    return [`${episode.id}: report is malformed, unusable fields: ${missing.join(", ")}`];
  }

  const failures = [];
  if (report.episodeId !== episode.id) {
    failures.push(`${episode.id}: report is for episode "${report.episodeId}"`);
  }
  if (report.textSha256 !== textSha256) {
    failures.push(
      `${episode.id}: text has drifted from its measurement — report says ` +
        `${report.textSha256.slice(0, 12)}…, shipped text hashes to ${textSha256.slice(0, 12)}…`
    );
  }

  const declared = declaredLemmas(episode);
  const undeclared = report.offLexiconLemmas.filter((lemma) => !declared.has(lemma));
  if (undeclared.length) {
    failures.push(
      `${episode.id}: off-lexicon lemmas that are not declared new words: ${undeclared.join(", ")}`
    );
  }
  if (episode.newWords.length > NEW_WORDS_CAP) {
    failures.push(
      `${episode.id}: ${episode.newWords.length} declared new words, cap is ${NEW_WORDS_CAP}`
    );
  }
  if (report.stageFlags.length) {
    const flags = report.stageFlags.map((flag) => `${flag.word}[${flag.kind}]`).join(", ");
    failures.push(`${episode.id}: forms outside ${SERIAL_TENSES}: ${flags}`);
  }
  if (report.lexiconOnlyCoverage < COVERAGE_FLOOR) {
    failures.push(
      `${episode.id}: lexicon-only coverage ${report.lexiconOnlyCoverage}% is below the ` +
        `${COVERAGE_FLOOR}% floor`
    );
  }
  if (report.lexicon.size < LEXICON_FLOOR) {
    failures.push(
      `${episode.id}: measured against ${report.lexicon.size} lemmas, floor is ${LEXICON_FLOOR}`
    );
  }
  return failures;
}
