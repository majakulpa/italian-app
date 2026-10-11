import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { EPISODES } from "./serial.js";
import { FONDAMENTALE } from "./fondamentale.js";
import { lemmaKey } from "../shared/lemma.js";
import {
  COVERAGE_FLOOR,
  LEXICON_FLOOR,
  NEW_WORDS_CAP,
  canonicalText,
  gateFailures,
} from "../shared/serialGate.js";

// This file is the release gate. It measures no Italian — the measurement is the
// offline Python pass in research/gen-experiment/, which writes a committed
// report per episode. What runs here is the enforcement: that a report exists,
// that it is still about the text on disk byte for byte, and that everything it
// found was deliberate.
const ROOT = process.cwd();
const REPORTS = path.join(ROOT, "src", "data", "serial-reports");
const EXPERIMENT = path.join(ROOT, "research", "gen-experiment");
const FIXTURE = path.join(EXPERIMENT, "gate-fixture");

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// The single code path. The shipped-episode loop and every fixture below go
// through this one function, so a fixture proves the gate the episodes get —
// not a parallel imitation of it.
function gate(episode, report) {
  return gateFailures(episode, report, sha256(canonicalText(episode)));
}

function committedReport(id) {
  const file = path.join(REPORTS, `${id}.json`);
  return existsSync(file) ? readJson(file) : null;
}

describe("the shipped serial", () => {
  it("passes the release gate", () => {
    expect(EPISODES.flatMap((episode) => gate(episode, committedReport(episode.id)))).toEqual([]);
  });

  // The other direction: a report left behind by an episode that was deleted or
  // renamed would otherwise sit there looking like evidence for nothing.
  it("has no report without an episode behind it", () => {
    const ids = new Set(EPISODES.map((episode) => episode.id));
    const orphans = (existsSync(REPORTS) ? readdirSync(REPORTS) : [])
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it("gives every episode a file-name-safe id, so its report can be found", () => {
    expect(EPISODES.filter((episode) => !/^[a-z0-9_-]+$/.test(episode.id))).toEqual([]);
  });
});

// ── What the gate deliberately does not check ────────────────────────────────
//
// serialGate.js is the measurement's enforcement arm and nothing more: it reads
// `newWords[].it` and ignores everything else on an episode, which is right —
// the gate's fixtures are bare `{ it }` declarations and should not have to
// carry prose metadata to prove an arm bites. But a *shipped* episode is also a
// screen, and the four things below would each ship silently broken.
describe("every shipped episode, as something a reader opens", () => {
  const base = new Set(FONDAMENTALE.map((entry) => lemmaKey(entry.it)));

  // A "parola nuova" the learner already has in the base 600 is not new, and
  // telling them it is undoes the one thing the declaration list is for. This
  // is the inverse of gate arm 3: that arm asks whether every unknown word was
  // declared, and nothing asks whether every declared word was unknown.
  it("declares only words that are genuinely outside the base vocabulary", () => {
    const alreadyKnown = EPISODES.flatMap((episode) =>
      episode.newWords.filter((word) => base.has(lemmaKey(word.it))).map((word) => word.it)
    );
    expect(alreadyKnown).toEqual([]);
  });

  // The learner is a Polish native who also reads English, which is why
  // fondamentale.js carries both glosses. A new word with one gloss or none
  // renders as a word with no meaning attached.
  it("glosses every new word in English and Polish", () => {
    const ungloss = EPISODES.flatMap((episode) =>
      episode.newWords.filter((word) => !word.en || !word.pl).map((word) => word.it)
    );
    expect(ungloss).toEqual([]);
  });

  // An empty page, or a paragraph that is empty or merely padded, is not a
  // cosmetic problem: canonicalText() joins paragraphs with newlines, so a blank
  // one emits a blank line and a padded one shifts a byte, and either changes
  // the hash the report was written against. The gate would then report
  // "drifted from its measurement" — true but unhelpful, naming the symptom
  // several steps downstream of the typo.
  it("ships no empty page, and no paragraph that would shift the measured bytes", () => {
    const bad = EPISODES.flatMap((episode) => [
      ...(episode.pages.length && episode.pages.every((page) => page.length)
        ? []
        : [`${episode.id}: empty page`]),
      ...episode.pages
        .flat()
        .filter((p) => p !== p.trim() || !p.length)
        .map((p) => `${episode.id}: untrimmed or empty paragraph ${JSON.stringify(p)}`),
    ]);
    expect(bad).toEqual([]);
  });

  it("gives every episode an authored season and title", () => {
    const unnamed = EPISODES.filter((episode) => !episode.season || !episode.title).map(
      (episode) => episode.id
    );
    expect(unnamed).toEqual([]);
  });
});

// ── Proof that the pass above is not vacuous ─────────────────────────────────
//
// "passes the release gate" now runs over a real shipped episode, but a passing
// episode only ever demonstrates that the gate *can* pass. A gate that cannot
// fail is the thing this repo refuses most, so the same gate is run here against
// texts that break it: the generation experiment's own certified text,
// put through the exact pipeline an episode goes through
// (`node scripts/measure-serial.mjs --text ... --id ... --out ...`), with its
// report committed under research/gen-experiment/gate-fixture/.
describe("the gate, proven against the experiment's own text", () => {
  const source = readFileSync(path.join(EXPERIMENT, "texts", "B_constr_1.txt"), "utf8");
  // 20 paragraphs, newline-terminated, split across four pages the way the
  // design's screen 13 draws "1/4". Page boundaries are a reading concern and
  // must leave no mark on the measured text.
  const paragraphs = source.split("\n").slice(0, -1);
  const measured = readJson(path.join(FIXTURE, "B_constr_1.json"));

  // Every one of the twelve off-lexicon lemmas the checker found, declared the
  // way fondamentale.js writes a word: an opaque noun carries its article.
  const fixture = () => ({
    id: "B_constr_1",
    season: "Fixture",
    title: "La chiave",
    pages: [
      paragraphs.slice(0, 5),
      paragraphs.slice(5, 10),
      paragraphs.slice(10, 15),
      paragraphs.slice(15),
    ],
    newWords: [
      { it: "l'aria" },
      { it: "attimo" },
      { it: "la luce" },
      { it: "lì" },
      { it: "me" },
      { it: "mio" },
      { it: "piano" },
      { it: "strano" },
      { it: "suo" },
      { it: "il tipo" },
      { it: "tranquillo" },
      { it: "tuo" },
    ],
  });

  it("reconstructs the exact bytes the checker measured", () => {
    expect(canonicalText(fixture())).toBe(source);
    expect(Buffer.byteLength(canonicalText(fixture()), "utf8")).toBe(measured.textBytes);
    expect(sha256(canonicalText(fixture()))).toBe(measured.textSha256);
  });

  // The number this slice exists to find out. The experiment reported 97.2% for
  // this text — against an OpenSubtitles proxy lexicon whose own README admits
  // it has no `tavolo`, `letto`, `sedia` or `porta`. Against the 600 real
  // entries in fondamentale.js the same text measures 92.9%, because our list
  // has no `suo`, `mio`, `tuo`, `luce`, `aria`, `tipo` or `piano` in it. So the
  // experiment's figure was never ours to import, and the repair pass it
  // describes is the norm rather than the exception.
  it("measures 92.9% against our 600, not the experiment's 97.2% against its own", () => {
    expect(measured.lexicon.size).toBe(LEXICON_FLOOR);
    expect(measured.contentWords).toBe(282);
    expect(measured.lexiconOnlyCoverage).toBe(92.9);
    expect(measured.lexiconOnlyCoverage).toBeLessThan(COVERAGE_FLOOR);
  });

  it("clears every arm except coverage, and says exactly which one bit", () => {
    expect(gate(fixture(), measured)).toEqual([
      `B_constr_1: lexicon-only coverage 92.9% is below the ${COVERAGE_FLOOR}% floor`,
    ]);
  });

  it("fails when an off-lexicon lemma was not declared", () => {
    const undeclared = fixture();
    undeclared.newWords = undeclared.newWords.filter((word) => word.it !== "la luce");
    expect(gate(undeclared, measured)).toContain(
      "B_constr_1: off-lexicon lemmas that are not declared new words: luce"
    );
  });

  it("fails when the prose drifts away from its measurement", () => {
    const edited = fixture();
    // One word changed, nine pages away from anything the report mentions.
    edited.pages[0] = edited.pages[0].map((p) => p.replace("È sera tardi.", "È sera presto."));
    const failures = gate(edited, measured);
    expect(failures.some((line) => line.includes("text has drifted from its measurement"))).toBe(
      true
    );
  });

  it("fails when there is no report at all", () => {
    expect(gate(fixture(), null)).toEqual([
      "B_constr_1: no measurement report — unmeasured text cannot ship",
    ]);
  });

  it("fails when more new words are declared than the cap allows", () => {
    const greedy = fixture();
    greedy.newWords = [
      ...greedy.newWords,
      ...Array.from({ length: NEW_WORDS_CAP - greedy.newWords.length + 1 }, (_, i) => ({
        it: `parola${i}`,
      })),
    ];
    expect(gate(greedy, measured)).toContain(
      `B_constr_1: ${NEW_WORDS_CAP + 1} declared new words, cap is ${NEW_WORDS_CAP}`
    );
  });
});

// The stage arm needs a text that actually breaks the stage, measured by the
// real detectors rather than hand-written into a report. gate-fixture/
// stage_violations.txt is three sentences carrying a futuro, a condizionale and
// two congiuntivi; the committed report is what check_text.py's two-detector
// union found in them.
describe("the stage arm, proven on a text that breaks the stage", () => {
  const source = readFileSync(path.join(FIXTURE, "stage_violations.txt"), "utf8");
  const measured = readJson(path.join(FIXTURE, "stage_violations.json"));
  const fixture = {
    id: "stage_violations",
    pages: [source.split("\n").slice(0, -1)],
    newWords: [{ it: "mio" }],
  };

  it("found the futuro, the condizionale and the congiuntivo", () => {
    expect(measured.stageFlags).toEqual([
      { word: "andrò", kind: "futuro" },
      { word: "potessi", kind: "congiuntivo" },
      { word: "verrei", kind: "condizionale" },
      { word: "sia", kind: "congiuntivo" },
    ]);
  });

  it("fails the gate on the stage arm alone — coverage and declarations are fine", () => {
    expect(measured.lexiconOnlyCoverage).toBeGreaterThanOrEqual(COVERAGE_FLOOR);
    expect(gate(fixture, measured)).toEqual([
      "stage_violations: forms outside presente, passato prossimo, imperfetto: " +
        "andrò[futuro], potessi[congiuntivo], verrei[condizionale], sia[congiuntivo]",
    ]);
  });
});
