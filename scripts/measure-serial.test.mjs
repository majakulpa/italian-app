import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

});

// With no episodes there is nothing to measure, and saying so beats silently
// writing no reports — the committed gate fixtures are what prove the pipeline
// works, not this run. Also knowable without a checker, which is why it is
// asserted at all.
//
// This used to run the script as a subprocess and assert on the real EPISODES,
// which worked only while the serial had no content. src/data/serial.js now
// ships episode 1, so that run reaches the measuring path and answers "no
// checker venv" instead — a true answer to a different question. The behaviour
// is still the pipeline's, and still the state the repo returns to whenever a
// season is started from scratch, so the episode list is injected instead.
// Injecting is the only way to empty it: the script resolves `EPISODES` through
// a static import relative to its own file, so no choice of working directory
// can change what it sees.
//
// The working directory still has to be a venv-free one, and that half is not
// decoration. Mocking alone would have let this test pass through the exact
// regression it is named for: with the venv guard back at the top of main(),
// run from the repo root where a venv exists, requireChecker() returns null,
// execution falls through to the empty-episodes branch, and the assertion below
// still holds. The guard's ordering is only observable where the checker is
// absent — so main() is called from an empty mkdtemp, which is what CI is and
// what a laptop never reproduces by accident. The import happens before the
// chdir deliberately: VENV_PYTHON is a module-level *relative* path, resolved
// against the working directory at existsSync() time, so importing early and
// chdir'ing late tests the lookup rather than the module load.
describe("the pipeline with nothing to measure", () => {
  let dir;
  let home;

  beforeEach(() => {
    home = process.cwd();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "no-venv-"));
  });

  afterEach(() => {
    process.chdir(home);
    fs.rmSync(dir, { recursive: true, force: true });
    vi.doUnmock("../src/data/serial.js");
    vi.resetModules();
  });

  it("says so when there are no episodes, checker or not", async () => {
    vi.doMock("../src/data/serial.js", () => ({ EPISODES: [] }));
    vi.resetModules();
    const { main } = await import("./measure-serial.mjs");
    const lines = [];
    const log = vi.spyOn(console, "log").mockImplementation((line) => lines.push(line));
    let code;
    try {
      process.chdir(dir);
      expect(fs.existsSync(path.join("research", "gen-experiment", ".venv"))).toBe(false);
      code = main([]);
    } finally {
      process.chdir(home);
      log.mockRestore();
    }
    expect(code).toBe(0);
    expect(lines.join("\n")).toContain("no episodes in src/data/serial.js");
  });
});
