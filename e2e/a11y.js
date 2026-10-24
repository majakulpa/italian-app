// The axe wrapper for the browser sweep.
//
// WHAT THIS DOES THAT src/a11y.test.jsx CANNOT
//
// 1. REAL CONTRAST. Under jsdom there is no layout and no paint, so axe's
//    `color-contrast` rule can only ever return *incomplete* — src/test/a11y.js
//    says so itself. src/shared/theme.test.js narrows that gap arithmetically,
//    but it reads the hex values THEME_STYLE promises: it proves a token has
//    good contrast, never that a token was applied. La Riserva's legend
//    shipped with rows that set no `color`, inherited the browser default, and
//    measured 1.27:1 on the dark ground with the whole suite green. Here the
//    rule resolves the actual cascade and returns a measured ratio, so that
//    class of bug fails a test. assertContrastWasMeasured below is what keeps
//    this claim honest.
//
// 2. NO FRAGMENT EXEMPTIONS. src/test/a11y.js disables five rules —
//    `region`, `landmark-one-main`, `page-has-heading-one`, `html-has-lang`,
//    `document-title` — because a module rendered on its own is not a
//    document and those rules would be meaningless. Every scan here is a
//    whole real document served by vite, so all five run on every screen.
//
// 3. THE THIRD PALETTE. See seedTheme in ./seed.js.
//
// The four tags are deliberately the SAME four as src/test/a11y.js's WCAG_AA,
// and @axe-core/playwright 4.14.0 depends on axe-core ~4.14.0, which the
// repo's existing ^4.13.0 already resolves to — one hoisted copy. So the jsdom
// sweep and this one judge against the identical rule set, and a rule that
// passes in one cannot be a different rule in the other.
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";

export const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function describe(violations) {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    ${n.target.join(" ")}\n      ${n.html.slice(0, 200)}\n      ${n.failureSummary.replace(/\n/g, "\n      ")}`)
        .join("\n");
      return `${v.id} (${v.impact}) — ${v.help}\n${nodes}`;
    })
    .join("\n\n");
}

// Run the AA rule set over the whole document and fail with the rule id, the
// offending node and — for contrast — axe's measured ratio.
//
// The full axe result is attached as JSON on a failure, so the published HTML
// report carries the machine-readable version beside the video rather than
// just a truncated assertion message.
export async function audit(page, testInfo, label) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

  if (results.violations.length > 0) {
    await testInfo.attach(`axe-${label.replace(/[^a-z0-9]+/gi, "-")}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
  }

  expect(results.violations, `${label} — ${results.violations.length} WCAG 2.1 AA violation(s):\n\n${describe(results.violations)}`).toEqual([]);

  return results;
}

// WHICH `color-contrast` INCOMPLETES ARE TOLERATED, AND WHY IT IS A
// CONJUNCTION RATHER THAN A LIST OF MESSAGE KEYS.
//
// axe returns an incomplete for two quite different reasons, and the
// difference is the whole gate.
//
// It can mean "I could not work out what colours are painted" — text over a
// background image or gradient, a partially obscured element, a semi
// transparent foreground, equal foreground and background. That is the jsdom
// answer, and a scan that collects it has quietly stopped checking the thing
// this suite exists for.
//
// It can also mean "this is not really text, so I decline to judge it":
// `shortTextContent` (axe.js:31623 — `visibleText.length === 1`, exactly one
// character) and `nonBmp` (a glyph with no letters in it). Mappatura's map
// list produces eleven of those on one screen, measured:
//
//   [shortTextContent] <span aria-hidden="true" style="opacity: 0.55;"> · </span>  x6
//   [nonBmp]           <span aria-hidden="true" style="opacity: 0.55;"> → </span>  x5
//
// All eleven are decoration whose meaning is given separately as visually
// hidden text by the Glyph component. WCAG 1.4.3 exempts pure decoration and
// `aria-hidden` is the declaration of it, so failing on those would be
// failing on a bullet.
//
// BUT THE MESSAGE KEY ALONE IS NOT ENOUGH, and an earlier version of this
// file got that wrong. `shortTextContent` is set on axe's `!isValid` branch:
// it is a measured failure being discarded, not a decline to measure. So
// exempting the key on its own let a *visible* single character and a
// *visible* bare glyph through at 2.29:1. Measured, on injected nodes at
// #3E5C64 on #14202a:
//
//   one-char-visible    incomplete shortTextContent   <- WAS LET THROUGH
//   arrow-visible       incomplete nonBmp             <- WAS LET THROUGH
//   two-char-visible    violation                     caught
//   many-char-visible   violation                     caught
//
// Hence the conjunction: a node is tolerated only when it is declared
// decoration (`aria-hidden`, inherited, so the check is `closest()`) AND axe
// declined it as non-text. Either clause alone is wrong. Keeping the message
// key clause means a genuinely unresolvable aria-hidden node — `bgImage`,
// `bgGradient`, `elmPartiallyObscured`, `fgAlpha`, `equalRatio` — still
// fails, which was the original intent. `equalRatio` is confirmed still
// caught.
//
// a11y.spec.js's "the contrast gate itself" block is the regression test for
// all of this, and it is the justification for the filter existing at all.
const AXE_DECLINED_AS_NON_TEXT = ["shortTextContent", "nonBmp"];

// Needs the page, because `aria-hidden` applies to a whole subtree and axe's
// node report says nothing about ancestry. A selector that no longer resolves
// counts as NOT decoration, so the gate fails loudly rather than quietly.
async function unresolvedContrast(page, results) {
  const nodes = results.incomplete.find((r) => r.id === "color-contrast")?.nodes ?? [];
  if (nodes.length === 0) return [];

  // target is an array of selectors, one per frame depth; the last entry is
  // the element itself. This app has no iframes, so it is always length 1.
  const decoration = await page.evaluate(
    (selectors) =>
      selectors.map((selector) => {
        try {
          const el = document.querySelector(selector);
          return el ? !!el.closest('[aria-hidden="true"]') : false;
        } catch {
          return false;
        }
      }),
    nodes.map((node) => node.target[node.target.length - 1]),
  );

  return nodes.filter(
    (node, i) => !(decoration[i] && node.any.every((check) => AXE_DECLINED_AS_NON_TEXT.includes(check.data?.messageKey))),
  );
}

// The assertion that keeps point 1 above from becoming a claim.
//
// A sweep where `color-contrast` quietly stopped evaluating would stay green
// forever while checking nothing — which is exactly the state the jsdom suite
// is permanently in. So every scan asserts the rule actually ran against
// painted pixels: it must appear in `passes` (or `violations`) with nodes, and
// nothing may be left unresolved.
export async function assertContrastWasMeasured(page, results, label) {
  const stuck = await unresolvedContrast(page, results);
  expect(
    stuck.map((n) => n.target.join(" ")),
    `${label} — axe could not determine the painted colours for ${stuck.length} node(s), which is the jsdom answer and the gap this suite exists to close:\n${stuck
      .map((n) => `    ${n.target.join(" ")}\n      ${n.html.slice(0, 160)}\n      ${n.any.map((c) => `${c.data?.messageKey}: ${c.message}`).join(" | ")}`)
      .join("\n")}`,
  ).toEqual([]);

  // A pass can also mean "this node is not painted at all": axe.js:31536-31541
  // returns true with messageKey "hidden" when !isVisibleOnScreen. Counting
  // those would make the floor below say "contrast was measured" about text
  // nobody can see, so they are excluded and the number means what the
  // comment claims.
  //
  // Honest note on how load-bearing this is: measured across seven screens in
  // both palettes, every single color-contrast pass node carried NO message
  // key — 21/24/32/13/68/12/40 nodes, zero "hidden" among them. SR_ONLY
  // (theme.js:219) is position:absolute at 1x1 with overflow:hidden, which
  // trips axe's own offscreen test, so those nodes are dropped by the rule's
  // excludeHidden before the evaluator runs and never reach `passes`. So this
  // filter is defensive rather than a fix for an observed hole — it keeps the
  // floor honest if either side of that changes.
  const measured = (results.passes.find((r) => r.id === "color-contrast")?.nodes ?? []).filter((node) =>
    node.any.every((check) => check.data?.messageKey !== "hidden"),
  ).length;
  const failed = results.violations.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  expect(
    measured + failed,
    `${label} — color-contrast measured no painted nodes at all, so this scan proves nothing about contrast`,
  ).toBeGreaterThan(0);
}

// The two together: no violations anywhere, and contrast genuinely measured.
export async function auditScreen(page, testInfo, label) {
  const results = await audit(page, testInfo, label);
  await assertContrastWasMeasured(page, results, label);
  return results;
}
