// Il Cinema's generated serial — the episodes that have passed the release gate.
//
// Empty, deliberately. The gate ships before the content: an episode whose only
// verification is the slice that comes after it is not verified. Adding episode
// 1 means authoring it against src/data/fondamentale.js, running the pipeline in
// research/gen-experiment/README.md ("Release gate for the serial"), committing
// the report it writes, and then — only then — adding it here. If the gate does
// not pass, the prose gets the repair pass the experiment describes; the
// threshold does not move.
//
// ── The shape ───────────────────────────────────────────────────────────────
// {
//   id:       "ep1"            file-name-safe; names its report
//                              src/data/serial-reports/<id>.json
//   season:   "Stagione 1 · Via Zamboni"
//                              an authored title, not a measured figure
//   title:    "La chiave"
//   pages:    [["paragraph", "paragraph"], ["paragraph"], …]
//                              pages for the reading screen; a page is a list of
//                              paragraphs. Page boundaries leave no mark on the
//                              measured text — shared/serialGate.js's
//                              canonicalText() flattens them to one paragraph
//                              per line, which is the shape the checker read.
//   newWords: [{ it: "la chiave", en: "key", pl: "klucz" }, …]
//                              the deliberate new words. Every off-lexicon lemma
//                              the checker found must be in here (gate arm 3),
//                              and there is a cap (arm 4). `it` carries the
//                              article when the noun is opaque, exactly as
//                              fondamentale.js stores one — the gate normalises
//                              with shared/lemma.js.
// }
//
// What is deliberately absent: any reading-time estimate. "7 min" is not
// measurable and is refused the same way the scene brief's "circa 12 minuti"
// was; the word count is measurable and comes off the committed report.
export const EPISODES = [];
