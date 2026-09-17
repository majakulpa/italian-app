// Fails the build if anything shaped like an Anthropic API key would reach the
// published site or the repository.
//
// The scene partner (PLAN.md chunk 7) is called from the browser with the
// learner's own key. This app is a public repo that publishes to GitHub Pages,
// so the two ways a key gets published are a bundle and a commit — and the
// second is the likelier one: a fixture, a launch config, a note, a paste into
// a test. Both are checked.
//
// ── The four decisions ──────────────────────────────────────────────────
//
// 1. A *whole* key shape, not the prefix. `sk-ant-` on its own appears in this
//    repo legitimately: shared/sceneKey.js checks a pasted key starts with it,
//    and Casa's copy tells the learner what a key looks like. A guard that
//    fired on those would be a guard somebody switches off in week one. The
//    pattern below wants the prefix, the key type, its two digits and forty or
//    more of the body.
//
// 2. Every file in dist/, not the service worker's globPatterns. Workbox
//    precaches js/css/html/svg/png/ico; a key could sit in a .json, a .txt, a
//    .webmanifest or a source map and be served perfectly well.
//
// 3. Tracked files as well, for the reason above.
//
// 4. Its own step in the Pages workflow, between `npx vite build` and
//    upload-pages-artifact. CI never runs `npm run build`, so a postbuild hook
//    in package.json would never fire on the thing that actually deploys.
//
// A match is reported as a file and a line and never as text: printing it
// would copy the key into a public CI log, which is the accident this exists
// to prevent.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// sk-ant-<type><two digits>-<40+ url-safe characters>. Built fresh on each
// call: a /g regex carries lastIndex between uses.
const keyShape = () => /sk-ant-[a-z]+\d\d-[A-Za-z0-9_-]{40,}/g;

export function findMatches(text) {
  return [...text.matchAll(keyShape())].map((match) => ({
    index: match.index,
    // The line, so a human can find it. Never `match[0]`.
    line: text.slice(0, match.index).split("\n").length,
  }));
}

// latin1 rather than utf8: it maps bytes to code points one for one, so a
// binary file cannot mangle an adjacent ASCII run into something the pattern
// misses. Every character a key can contain is ASCII, so nothing is lost.
export function scanFile(file) {
  return findMatches(fs.readFileSync(file).toString("latin1")).map((hit) => ({ file, line: hit.line }));
}

export function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function trackedFiles(cwd = process.cwd()) {
  return execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .filter((file) => fs.existsSync(path.join(cwd, file)));
}

export function main(cwd = process.cwd()) {
  const dist = path.join(cwd, "dist");

  // A missing dist/ is a failure, not a skip. The whole point of the workflow
  // step is to check what is about to be uploaded; "there was nothing to
  // check" is the one answer that must never pass quietly.
  if (!fs.existsSync(dist)) {
    console.error("check-no-secrets: dist/ does not exist. Build first (`npx vite build`) — there is nothing to check.");
    return 1;
  }

  let tracked;
  try {
    tracked = trackedFiles(cwd);
  } catch {
    console.error("check-no-secrets: could not list tracked files. `git ls-files` failed — is this a git checkout?");
    return 1;
  }

  const distFiles = walk(dist);
  const hits = [...distFiles, ...tracked.map((file) => path.join(cwd, file))].flatMap(scanFile);

  if (hits.length) {
    console.error("check-no-secrets: something shaped like an Anthropic API key is in a file that would be published or committed.\n");
    for (const hit of hits) console.error(`  ${path.relative(cwd, hit.file)}:${hit.line}`);
    console.error("\nThe match itself is not printed — it is a secret, and this log may be public.");
    console.error("Take it out of the file, and rotate the key: treat it as already leaked.");
    return 1;
  }

  console.log(`check-no-secrets: ${distFiles.length} files in dist/ and ${tracked.length} tracked files — no Anthropic key shape found.`);
  return 0;
}

// Only when run as a script, so the tests can import the pieces.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(main());
}
