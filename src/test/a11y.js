// axe-core, wired up for the component tests.
//
// `expectNoViolations` runs the WCAG 2.1 A + AA rule set over a rendered
// container and fails with the rule id, the offending markup and axe's own
// remediation text — enough to fix it without opening a browser.
//
// One thing jsdom genuinely can't check is colour contrast: it has no layout
// or paint, so axe can only ever return "incomplete" for it. That half of AA
// is covered instead by the palette arithmetic in ./contrast.js, which reads
// the same hex values the app ships and checks every pairing the design
// system promises.
import axe from "axe-core";

const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Rules that need a whole document to mean anything (landmarks, page title,
// a single top-level h1) are judged on the App-level scans, not on the
// fragment scans where a module is rendered on its own.
const FRAGMENT_EXEMPT = ["region", "page-has-heading-one", "landmark-one-main", "html-has-lang", "document-title"];

function describeViolations(violations) {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    ${n.target.join(" ")}\n      ${n.html.slice(0, 160)}\n      ${n.failureSummary.replace(/\n/g, "\n      ")}`)
        .join("\n");
      return `${v.id} (${v.impact}) — ${v.help}\n${nodes}`;
    })
    .join("\n\n");
}

// axe keeps one global "am I running?" flag, and throws rather than queueing
// if a second run starts while the first is in flight — which is exactly what
// happens when one scan is abandoned (a test times out) and the next test
// starts. Chaining every call onto the last one keeps that failure from
// cascading through the rest of the file.
let inFlight = Promise.resolve();

export function findViolations(container, { fragment = true } = {}) {
  const run = inFlight.then(() =>
    axe.run(container, {
      runOnly: { type: "tag", values: WCAG_AA },
      resultTypes: ["violations"],
      // Skip axe's stylesheet preload: it fetches every <style>/<link> before
      // running, which in jsdom is slow and noisy (and pointless — the rules
      // that need it are the contrast ones jsdom can't do anyway).
      preload: false,
      rules: fragment ? Object.fromEntries(FRAGMENT_EXEMPT.map((id) => [id, { enabled: false }])) : {},
    }),
  );
  // The queue must not stall on a failed scan, so it waits on settlement.
  inFlight = run.catch(() => {});
  return run.then((results) => results.violations);
}

export async function expectNoViolations(container, options) {
  const violations = await findViolations(container, options);
  if (violations.length > 0) {
    throw new Error(`Expected no WCAG 2.1 AA violations, found ${violations.length}:\n\n${describeViolations(violations)}`);
  }
}
