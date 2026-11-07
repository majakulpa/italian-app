// The browser suite's runner. Separate from vitest on purpose — see e2e/
// and the `e2e/**` exclusion in vite.config.js for why the specs cannot live
// under src/.
//
// WHY A REAL BROWSER AT ALL
//
// CLAUDE.md: "jsdom computes no cascade for inherited colour, so an element
// that sets no `color` passes every arithmetic contrast check and axe pass
// while being invisible in one theme. That has already shipped once."
// src/test/a11y.js says the same from the other side: under jsdom axe's
// `color-contrast` rule can only ever return *incomplete*, because jsdom has
// no layout and no paint. And src/test/contrast.js, which narrows that gap,
// reads the hex values the design system *promises* — it proves a token has
// good contrast, never that a token was applied.
//
// La Riserva's legend shipped with rows that set no `color`: 18.6:1 on the
// light ground, 1.27:1 on the dark one, every token check green. A browser
// resolves the cascade, so `color-contrast` returns a measured ratio for the
// pixels that are actually painted. That is the one thing this suite adds
// that the jsdom suite cannot have, and it is why this lands as a regression
// gate rather than a bug hunt: the app is clean today.
//
// This is ADDITIVE. src/a11y.test.jsx, src/test/a11y.js and
// src/test/contrast.js keep doing exactly what they do.
import { defineConfig, devices } from "@playwright/test";

// 375x812 — the viewport CLAUDE.md asks UI changes to be verified at, and the
// one the design is drawn for. The app is a phone-first PWA.
const VIEWPORT = { width: 375, height: 812 };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One retry in CI only. A retried-and-passed spec still shows as flaky in
  // the report rather than being silently green.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : [["list"]],

  use: {
    baseURL: "http://localhost:5173",
    viewport: VIEWPORT,
    // The owner asked to watch these run, so every test records, passing or
    // not — the videos are most of what makes the published PR report worth
    // opening. Measured on the suite as it stands: 70 tests, 8.2MB of webm,
    // ~120KB each at 375x812, 8.9MB for the whole HTML report. That rides
    // along in the PR preview the deploy workflow already publishes, and the
    // workflow's cleanup job deletes the preview when the PR closes.
    video: "on",
    trace: "on-first-retry",
    // Only two transitions exist in the whole app (SpeakButton.jsx:41,
    // LevelPicker.jsx:42) and there are no keyframes, intervals or rAF
    // anywhere in src/ — but a screenshot taken mid-transition is a flake for
    // free, so they are frozen for the capture.
    screenshot: { mode: "only-on-failure", animations: "disabled" },
  },

  // Chromium only, and that is a measured decision rather than laziness.
  // isSpeechSupported() (src/shared/speech.js) gates the `Listen` button, and
  // every SpeakButton renders `null` without it — so the number of controls on
  // a screen, and therefore every `.first()` and every name that has to be
  // unambiguous, differs per engine. A cross-browser matrix needs per-engine
  // expectations written first; adding WebKit without them would buy a red
  // suite, not coverage.
  //
  // Two projects rather than two tests, because the dark palette is a context
  // option: with no stored preference useThemeMode.js deletes
  // document.documentElement.dataset.theme and theme.js's
  // @media (prefers-color-scheme: dark) block governs. `colorScheme` on the
  // context is what flips that media query, so it has to be set before the
  // page exists. (The *third* palette — the explicit :root[data-theme="dark"]
  // block the Casa toggle writes — is reached by seeding storage instead; see
  // e2e/a11y.spec.js.)
  projects: [
    {
      name: "light",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORT, colorScheme: "light" },
    },
    {
      name: "dark",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORT, colorScheme: "dark" },
    },
  ],

  // `npm run dev`, not `npm run preview`, for three reasons:
  //  1. vite.config.js registers a service worker with
  //     registerType: "autoUpdate". Against a built target that SW can serve
  //     assets from a previous build, so a spec can pass or fail on code that
  //     is not the code under test.
  //  2. `npm run dev` is what CLAUDE.md asks a UI change to be verified
  //     against, so this suite and a human checking by hand look at the same
  //     thing.
  //  3. `vite build` is already its own CI step — the build is gated, and
  //     gating it twice through a slower path buys nothing.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
