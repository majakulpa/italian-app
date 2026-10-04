// The serial's authoring pipeline: measure every episode and commit the report.
//
// Run it after writing or editing any episode in src/data/serial.js. It exports
// src/data/fondamentale.js to the lexicon shape check_text.py wants, hands each
// episode's canonical text to the offline Python checker, and writes the report
// `npm test` then holds that text to. The JS gate (src/shared/serialGate.js) is
// the enforcement; this is the measurement, and it needs the venv.
//
// Usage:
//   node scripts/measure-serial.mjs                       every shipped episode
//   node scripts/measure-serial.mjs --text FILE --id ID --out REPORT.json
//                                                         one text file, as if
//                                                         it were an episode
//
// The second form is how the gate's fixtures were made: the experiment's own
// certified text run through the exact pipeline an episode goes through.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EPISODES } from "../src/data/serial.js";
import { canonicalText } from "../src/shared/serialGate.js";

const EXPERIMENT = path.join("research", "gen-experiment");
const VENV_PYTHON = path.join(EXPERIMENT, ".venv", "bin", "python");
const BUILD = path.join(EXPERIMENT, ".build");
const LEXICON = path.join(BUILD, "lexicon_fondamentale.json");
const REPORTS = path.join("src", "data", "serial-reports");

function run(file, args) {
  execFileSync(file, args, { stdio: "inherit" });
}

export function measure({ id, textPath, outPath }) {
  run(VENV_PYTHON, [
    path.join(EXPERIMENT, "report_episode.py"),
    "--lexicon", LEXICON,
    "--id", id,
    "--text", textPath,
    "--out", outPath,
  ]);
}

export function main(argv) {
  if (!existsSync(VENV_PYTHON)) {
    // Not a warning. The designed fallback when the checker cannot run is that
    // no episode ships — never a JavaScript approximation, never a lowered
    // threshold. See research/gen-experiment/README.md for the venv commands.
    console.error(
      `no checker venv at ${VENV_PYTHON}\n` +
        "Build it with the commands in research/gen-experiment/README.md. " +
        "Without it nothing can be measured, and an unmeasured episode does not ship."
    );
    return 1;
  }
  mkdirSync(BUILD, { recursive: true });
  run(process.execPath, [path.join("scripts", "export-lexicon.mjs"), LEXICON]);

  const flag = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const textPath = flag("--text");
  if (textPath) {
    const id = flag("--id");
    const outPath = flag("--out");
    if (!id || !outPath) {
      console.error("--text needs --id and --out");
      return 2;
    }
    measure({ id, textPath, outPath });
    return 0;
  }

  if (!EPISODES.length) {
    console.log("no episodes in src/data/serial.js — nothing to measure");
    return 0;
  }
  mkdirSync(REPORTS, { recursive: true });
  for (const episode of EPISODES) {
    const textPath = path.join(BUILD, `${episode.id}.txt`);
    writeFileSync(textPath, canonicalText(episode), "utf8");
    measure({ id: episode.id, textPath, outPath: path.join(REPORTS, `${episode.id}.json`) });
  }
  return 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main(process.argv.slice(2)));
}
