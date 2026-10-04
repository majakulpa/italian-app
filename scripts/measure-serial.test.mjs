import { describe, it, expect } from "vitest";
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

describe("the measurement pipeline", () => {
  // The designed fallback when the checker cannot run is that *no episode
  // ships* — never a JavaScript approximation of the measurement, never a
  // lowered threshold. A pipeline that shrugged and carried on without the venv
  // would be the one failure mode the gate exists to prevent, so it is tested
  // from a directory where the venv cannot be found.
  it("stops, loudly, when the checker venv is not there", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "no-venv-"));
    const { code, out } = run(dir);
    expect(code).toBe(1);
    expect(out).toContain("no checker venv");
    expect(out).toContain("an unmeasured episode does not ship");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("needs an id and an output path when given a single text", () => {
    const { code, out } = run(process.cwd(), ["--text", "whatever.txt"]);
    expect(code).toBe(2);
    expect(out).toContain("--text needs --id and --out");
  });

  // With EPISODES empty there is nothing to measure, and saying so beats
  // silently writing no reports — the committed gate fixtures are what prove
  // the pipeline works, not this run.
  it("says so when there are no episodes", () => {
    const { code, out } = run(process.cwd());
    expect(code).toBe(0);
    expect(out).toContain("no episodes in src/data/serial.js");
  });
});
