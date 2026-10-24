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

// Two reasons axe returns `color-contrast` as incomplete, and only one of
// them matters here.
//
// It can mean "I could not work out what colours are painted" — text over a
// background image or gradient, a partially obscured element, a semi
// transparent foreground. That is the jsdom answer, and a scan that collects
// it has quietly stopped checking the thing this suite exists for.
//
// It can also mean "this is not really text, so I decline to judge it".
// `shortTextContent` is a one- or two-character run; `nonBmp` is a glyph with
// no letters in it at all. Mappatura's map list has eleven of those on one
// screen: aria-hidden separator spans holding " · " and " → " at opacity
// 0.55, decoration whose meaning is given separately as visually hidden text
// by the Glyph component. Failing on those would be failing on a bullet.
//
// So the gate is narrowed by messageKey rather than loosened: everything axe
// could not RESOLVE still fails, and only axe's own "that is punctuation"
// verdicts are let through. Measured: with this filter the whole suite scans
// clean in both palettes, and dimming a --color-* token below 4.5:1 still
// fails — see the README's E2E section.
const NOT_REALLY_TEXT = ["shortTextContent", "nonBmp"];

function unresolved(node) {
  return !node.any.every((check) => NOT_REALLY_TEXT.includes(check.data?.messageKey));
}

// The assertion that keeps point 1 above from becoming a claim.
//
// A sweep where `color-contrast` quietly stopped evaluating would stay green
// forever while checking nothing — which is exactly the state the jsdom suite
// is permanently in. So every scan asserts the rule actually ran against
// painted pixels: it must appear in `passes` (or `violations`) with nodes, and
// nothing may be left unresolved.
export function assertContrastWasMeasured(results, label) {
  const stuck = (results.incomplete.find((r) => r.id === "color-contrast")?.nodes ?? []).filter(unresolved);
  expect(
    stuck.map((n) => n.target.join(" ")),
    `${label} — axe could not determine the painted colours for ${stuck.length} node(s), which is the jsdom answer and the gap this suite exists to close:\n${stuck
      .map((n) => `    ${n.target.join(" ")}\n      ${n.html.slice(0, 160)}\n      ${n.any.map((c) => `${c.data?.messageKey}: ${c.message}`).join(" | ")}`)
      .join("\n")}`,
  ).toEqual([]);

  const measured = results.passes.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  const failed = results.violations.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  expect(measured + failed, `${label} — color-contrast evaluated no nodes at all, so this scan proves nothing about contrast`).toBeGreaterThan(0);
}

// The two together: no violations anywhere, and contrast genuinely measured.
export async function auditScreen(page, testInfo, label) {
  const results = await audit(page, testInfo, label);
  assertContrastWasMeasured(results, label);
  return results;
}
