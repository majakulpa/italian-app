// A key-shaped string for the tests, assembled at run time rather than
// written out.
//
// ── Why it is not a literal ─────────────────────────────────────────────
// scripts/check-no-secrets.mjs fails the build on a whole Anthropic key
// shape — `sk-ant-<letters><two digits>-<40+ url-safe characters>` — and it
// scans the repository's tracked files as well as `dist/`, because for a
// public repo the likelier leak is a commit: a fixture, a launch config, a
// screenshot. A realistic fake key written out in a test file is exactly that
// shape, so a literal here would fail the build on every push and the first
// fix anyone reached for would be to loosen the guard.
//
// Joined from pieces, no tracked file contains the shape, the guard stays
// strict, and what the tests exercise is identical — the string at run time
// is a whole key shape, which is what `partnerKey`'s own test asserts by
// feeding it to the guard's matcher.
export const FAKE_KEY = ["sk", "ant", "api03", `${"Aa1_-".repeat(11)}Zz`].join("-");

// A second one, different in its last four characters, for the tests that
// need to tell two stored keys apart.
export const OTHER_FAKE_KEY = ["sk", "ant", "api03", `${"Bb2_-".repeat(11)}Yy`].join("-");
