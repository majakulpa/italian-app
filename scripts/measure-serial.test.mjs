import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "scripts", "measure-serial.mjs");

function run(cwd, args = []) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out: stdout };
  } catch (error) {
    return { code: error.status, out: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

// Every case runs from a temporary directory, and that is load-bearing rather
// than tidy. The script resolves the venv, the build dir and the reports dir
// relative to the *working directory*, so a run from anywhere but the repo
// root sees no checker — which is precisely the environment CI runs these in,
// and the environment a laptop never reproduces by accident.
//
// Two of these tests used to run from process.cwd(). They passed on the
// machine that wrote them, where research/gen-experiment/.venv exists, and
// failed on the first CI push, where it cannot: the venv check was the first
// statement in main(), so it answered every question before the question was
// read. Pinning them here means a usage error and an empty EPISODES list are
// answered without a checker, which is the property that broke.
describe("the measurement pipeline", () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "no-venv-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // The designed fallback when the checker cannot run is that *no episode
  // ships* — never a JavaScript approximation of the measurement, never a
  // lowered threshold. A pipeline that shrugged and carried on without the
  // venv would be the one failure mode the gate exists to prevent.
  //
  // Asked on a path that really would measure something, because that is the
  // only path the guard now sits on: with nothing to measure there is nothing
  // for a missing checker to stop.
  it("stops, loudly, when the checker venv is not there", () => {
    const { code, out } = run(dir, ["--text", "episode.txt", "--id", "ep1", "--out", "report.json"]);
    expect(code).toBe(1);
    expect(out).toContain("no checker venv");
    expect(out).toContain("an unmeasured episode does not ship");
  });

  // A usage error is knowable without a checker, and saying "no checker venv"
  // to someone who mistyped their flags sends them to build a Python
  // environment they already have.
  it("needs an id and an output path when given a single text, checker or not", () => {
    const { code, out } = run(dir, ["--text", "whatever.txt"]);
    expect(code).toBe(2);
    expect(out).toContain("--text needs --id and --out");
  });

  // With EPISODES empty there is nothing to measure, and saying so beats
  // silently writing no reports — the committed gate fixtures are what prove
  // the pipeline works, not this run. Also knowable without a checker.
  it("says so when there are no episodes, checker or not", () => {
    const { code, out } = run(dir);
    expect(code).toBe(0);
    expect(out).toContain("no episodes in src/data/serial.js");
  });
});
