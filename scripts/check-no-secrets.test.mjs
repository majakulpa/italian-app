import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findMatches, scanFile, trackedFiles } from "./check-no-secrets.mjs";
import { FAKE_KEY } from "../src/test/fakeKey.js";

const SCRIPT = path.join(process.cwd(), "scripts", "check-no-secrets.mjs");

// Runs the guard as the workflow runs it, and returns what CI would see.
function run(cwd) {
  try {
    const stdout = execFileSync("node", [SCRIPT], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: stdout };
  } catch (error) {
    return { code: error.status, out: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

// A throwaway repo: git, because half of what the guard checks is the list of
// tracked files, and there is no honest way to test that without one.
function repo({ dist = {}, tracked = {}, init = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "no-secrets-"));
  if (init) {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: dir });
    execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
  }
  for (const [name, body] of Object.entries(tracked)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), body);
    if (init) execFileSync("git", ["add", "--", name], { cwd: dir });
  }
  for (const [name, body] of Object.entries(dist)) {
    fs.mkdirSync(path.dirname(path.join(dir, "dist", name)), { recursive: true });
    fs.writeFileSync(path.join(dir, "dist", name), body);
  }
  return dir;
}

describe("the key shape it matches", () => {
  it("matches a whole key, wherever it sits in a file", () => {
    expect(findMatches(`const k = "${FAKE_KEY}";`)).toHaveLength(1);
    expect(findMatches(`line one\nline two\nkey: ${FAKE_KEY}\n`)[0].line).toBe(3);
    expect(findMatches(`${FAKE_KEY} ${FAKE_KEY}`)).toHaveLength(2);
  });

  it("does not match the prefix, which this repo uses legitimately", () => {
    // These are the real strings in the tree. If the guard fired on them the
    // build would be red on every push and the first fix anyone reached for
    // would be to weaken the pattern.
    expect(findMatches('const KEY_PREFIX = "sk-ant-";')).toEqual([]);
    expect(findMatches("Begins sk-ant-. Pasted in here, and never shown back in full.")).toEqual([]);
    expect(findMatches("They begin sk-ant- and run well past forty characters")).toEqual([]);
  });

  it("does not match a key shape with too short a body", () => {
    expect(findMatches("sk-ant-api03-tooshort")).toEqual([]);
    expect(findMatches(`sk-ant-api03-${"A".repeat(39)}`)).toEqual([]);
    expect(findMatches(`sk-ant-api03-${"A".repeat(40)}`)).toHaveLength(1);
  });

  it("reports a file and a line and never the key itself", () => {
    const dir = repo({ tracked: { "fixture.json": `{"key":"${FAKE_KEY}"}` } });
    const hits = scanFile(path.join(dir, "fixture.json"));

    expect(hits).toEqual([{ file: path.join(dir, "fixture.json"), line: 1 }]);
    expect(JSON.stringify(hits)).not.toContain("sk-ant");
  });
});

describe("the guard as the workflow runs it", () => {
  it("passes on a clean tree, and says what it looked at", () => {
    const dir = repo({ dist: { "index.html": "<p>ciao</p>" }, tracked: { "README.md": "# hi" } });

    const { code, out } = run(dir);

    expect(code).toBe(0);
    expect(out).toContain("1 files in dist/");
    expect(out).toContain("1 tracked files");
  });

  it("fails on a key planted in dist/, in a file the service worker would not precache", () => {
    // .json is deliberate: workbox's globPatterns are js/css/html/svg/png/ico,
    // so a guard driven off those globs would have missed this one.
    const dir = repo({ dist: { "data/seed.json": `{"key":"${FAKE_KEY}"}` }, tracked: { "README.md": "# hi" } });

    const { code, out } = run(dir);

    expect(code).toBe(1);
    expect(out).toContain("dist/data/seed.json:1");
    expect(out).not.toContain("sk-ant");
    expect(out).toContain("rotate the key");
  });

  it("fails on a key planted in a tracked file, which dist/ alone would never see", () => {
    const dir = repo({ dist: { "index.html": "<p>ciao</p>" }, tracked: { ".claude/launch.json": `{"env":{"K":"${FAKE_KEY}"}}` } });

    const { code, out } = run(dir);

    expect(code).toBe(1);
    expect(out).toContain(".claude/launch.json:1");
    expect(out).not.toContain("sk-ant");
  });

  it("survives a file that git tracks but the working tree no longer has", () => {
    // `git ls-files` lists a staged file that has since been deleted from
    // disk. Reading it would crash the guard with a stack trace, which reads
    // like a broken build rather than a clean pass.
    const dir = repo({ dist: { "index.html": "<p>ciao</p>" }, tracked: { "gone.txt": "bye" } });
    fs.rmSync(path.join(dir, "gone.txt"));

    expect(trackedFiles(dir)).toEqual([]);
    expect(run(dir).code).toBe(0);
  });

  it("fails rather than skipping when there is no dist/ to check", () => {
    const dir = repo({ tracked: { "README.md": "# hi" } });

    const { code, out } = run(dir);

    expect(code).toBe(1);
    expect(out).toContain("dist/ does not exist");
  });

  it("fails rather than skipping when it cannot list tracked files", () => {
    const dir = repo({ dist: { "index.html": "<p>ciao</p>" }, init: false });

    const { code, out } = run(dir);

    expect(code).toBe(1);
    expect(out).toContain("could not list tracked files");
  });
});

describe("this repository", () => {
  // The other half of "prove it fails": prove it also passes on the real
  // thing, so a red build means a key and not a false positive. dist/ is not
  // built here, so this checks the tracked half — which is the half that
  // contains sceneKey.js's prefix constant and Casa's copy.
  it("has no Anthropic key shape in any tracked file", () => {
    const hits = trackedFiles().flatMap((file) => scanFile(file));

    expect(hits).toEqual([]);
  });
});
