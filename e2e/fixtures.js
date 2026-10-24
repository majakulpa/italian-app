// The shared fixture every browser spec uses, plus the navigation helpers
// that get a page from "/" to a screen.
//
// WHY e2e/ IS NOT UNDER src/
//
// Two reasons, both of which bite:
//
//  1. Vitest's default `include` is **/*.{test,spec}.?(c|m)[jt]s?(x), so
//     `src/.../city.spec.js` would be collected by `npm test` and die on
//     `import { test } from "@playwright/test"`. vite.config.js excludes
//     `e2e/**` as the other half of this.
//  2. The coverage gate's `include` is `src/**/*.{js,jsx}` at 100% on all
//     four metrics. Helpers living under src/ would have to be covered by
//     the jsdom suite, which cannot run them — they only mean anything
//     inside a browser.
//
// THE APP HAS NO ROUTER. Screens are React state inside one page (see the
// comment at the top of .github/workflows/deploy.yml), so every journey
// starts at "/" and clicks. There is no URL to deep-link to.
import { test as base, expect } from "@playwright/test";

// The four localStorage slots the app owns, exactly as src/shared/storage.js
// writes them: KEY (:27), COVERAGE_HISTORY_KEY (:338), THEME_KEY (:401) and
// LAST_LEVEL_KEY (:435). "progress" is deliberately still :v1 — the shape
// inside it is versioned by its own `version` field.
export const STORAGE_KEYS = {
  progress: "italiano:progress:v1",
  coverageHistory: "italiano:coverage-history:v1",
  theme: "italiano:theme:v1",
  lastLevel: "italiano:last-level:v1",
};

// sessionStorage marker for "this test's first document". See the STORAGE
// block below.
const FIRST_LOAD_SENTINEL = "__italiano_e2e_bootstrapped__";

export const test = base.extend({
  page: async ({ page }, use) => {
    // ---- 1. DETERMINISM -------------------------------------------------
    // One source of randomness feeds every shuffled screen in the app:
    // Math.random() inside shuffle() (src/shared/shuffle.js:4). It decides
    // deck order and quiz question order (VocabModule.jsx:176, 365-367),
    // the distractor pick and option order in the grammar drill
    // (GrammarModule.jsx:279, 281), the story comprehension options
    // (StoriesModule.jsx:319) and the review queue (srs.js:182).
    //
    // 0.99 is the same stub src/a11y.test.jsx:71 uses, so the jsdom suite and
    // this one see the same ordering and a selector that works in one works
    // in the other. Mappatura, Gli Articoli and La Riserva walk authored
    // order and need no stub at all — which is why Mappatura, not one of the
    // shuffled screens, carries the typed-drill spec.
    await page.addInitScript(() => {
      Math.random = () => 0.99;
    });

    // ---- 2. STORAGE -----------------------------------------------------
    // Clean once per TEST, not once per document load, and the difference is
    // not academic: addInitScript runs before EVERY navigation, so a version
    // of this that cleared unconditionally wiped the app's own storage on
    // page.reload() as well. The Casa spec caught it — the theme choice it
    // had just made read back empty after a reload, because the harness had
    // deleted it, not because the app failed to persist it. A fixture that
    // makes reload-persistence untestable hides exactly the class of bug a
    // PWA suite is for.
    //
    // The sentinel lives in sessionStorage because that survives a reload and
    // dies with the tab, which is the lifetime wanted. Playwright gives each
    // test a fresh context, so every test gets a fresh sentinel.
    //
    // It also publishes window.__italianoE2EFirstLoad for ./seed.js: a seed
    // has to land on the first document and then stop, or re-running it on a
    // reload would overwrite whatever the app had written since. Init scripts
    // run in registration order within one document, and this one is
    // registered before any spec's seed, so the flag is always set by the
    // time a seed reads it.
    await page.addInitScript(
      ([keys, sentinel]) => {
        try {
          if (sessionStorage.getItem(sentinel)) return;
          sessionStorage.setItem(sentinel, "1");
          window.__italianoE2EFirstLoad = true;
          for (const key of keys) localStorage.removeItem(key);
        } catch {
          // storage unavailable — the app handles that too
        }
      },
      [Object.values(STORAGE_KEYS), FIRST_LOAD_SENTINEL],
    );

    // ---- 3. FONTS -------------------------------------------------------
    // src/shared/theme.js:14-16 is an @import of fonts.googleapis.com,
    // injected as a <style> on every load (App.jsx:90). Left alone that is a
    // cross-origin request per test and a layout shift when the font swaps
    // in — both of which turn a timing-sensitive assertion into a coin flip.
    // Aborted here, the whole suite needs no network at all.
    //
    // This does NOT weaken the contrast audit: the font never carried the
    // colour, and axe measures the computed colour of whatever glyphs are
    // painted. It does change metrics, so font-size-dependent AA thresholds
    // (large text is judged at 18.5px/14px bold) are judged against the
    // fallback — which is the stricter direction, since the fallback renders
    // no larger than Fraunces at the same declared size.
    //
    // One visible consequence: the aborted request logs
    // "Failed to load resource: net::ERR_FAILED" to the console. Measured
    // across every journey in this directory, that and vite's own HMR
    // chatter plus React's devtools notice are the ONLY console output —
    // no app errors, no React warnings, no unhandled rejections. So a
    // console error in a run that is not this font URL is a real one.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

    // ---- 4. VIEWPORT AND COLOUR SCHEME ----------------------------------
    // Both come from the project in playwright.config.js: 375x812 for every
    // project, and colorScheme light/dark as the two projects. They are
    // context options rather than page calls because the dark palette is a
    // media query — @media (prefers-color-scheme: dark) in theme.js:67 — and
    // has to be settled before the document exists.

    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Navigation.
//
// TWO AUTHORING RULES THESE HELPERS EXIST TO ENFORCE:
//
//  a. Never hold a locator across a tab press. App.jsx:96 is
//     `<main key={visit}>` and `visit` is bumped on every move, so pressing
//     a tab remounts the entire subtree and any locator resolved before it
//     points at a detached node. Every helper here re-resolves from `page`.
//
//  b. Never fill() an input the app is about to refocus. Six screens move
//     focus on item change (VocabModule.jsx:210, 392, 533,
//     GrammarModule.jsx:320, StoriesModule.jsx:343, ReviewModule.jsx:369,
//     MappeModule.jsx:465). fill() sets the value in one shot and a refocus
//     landing mid-way can drop it; type(), awaiting focus first, cannot.
//     See typeAnswer() below.
// ---------------------------------------------------------------------------

// The city map, which is the app's front screen and the only entry point.
export async function openCity(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "La Città" })).toBeVisible();
}

// Press one of the four tab-bar tabs. The bar is a <nav aria-label="Sections">
// holding four plain <button>s (shared/TabBar.jsx) — no tab/tablist roles, so
// these are buttons by role, not tabs.
export async function pressTab(page, name) {
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name }).click();
}

// A district tile on the map. The tile is a SINGLE button wrapping the whole
// card (Dashboard.jsx:224), so its accessible name concatenates every text
// node inside it — "Il Cantiere 0 / 160 drills". Hence a regex, never an
// exact string: the counts move as soon as anything is answered.
export async function openDistrict(page, namePattern) {
  await page.getByRole("button", { name: namePattern }).click();
}

// Type into a field the app may refocus. Awaits focus, then sends real key
// events one at a time. See rule (b) above.
export async function typeAnswer(locator, text) {
  await expect(locator).toBeFocused();
  await locator.pressSequentially(text);
}
