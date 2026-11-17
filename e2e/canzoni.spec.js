// Le Canzoni in a real browser — the app's first screen with a media element
// and its first with content that moves on its own.
//
// Two things here cannot be done under jsdom and are the reason this file
// exists:
//
// 1. **The painted ink.** Every TOKENS.xxx is a var() resolved at paint time.
//    CLAUDE.md's standing warning is La Riserva's legend, which set no `color`
//    at all, inherited the browser default, and measured 1.27:1 on the dark
//    ground while the token arithmetic stayed green. A lyric sheet is twenty
//    lines of text on two different surfaces, so it is exactly the shape that
//    bug takes. `litInk` below reads what the browser actually painted.
//
// 2. **Playback.** jsdom has no working HTMLMediaElement; the unit tests stub
//    play() and dispatch the events by hand. Whether a real browser fetches
//    the MP3, satisfies its own autoplay policy from a click, and fires
//    `play` is only answerable here.
//
// What this file deliberately does NOT claim to check: the *sung* line's
// painted contrast. No recording has been timed, so no line ever becomes
// active and the aria-current branch is unreachable in a browser. The colour
// pairing it uses is not unverified, though — the active line is
// citySurface("tomato") with CITY_ACCENTS.tomato.ink, which is the same
// pairing the song card and the Play button are painted in on this very
// screen, and axe measures those. When a timing pass lands, a scan of the lit
// line belongs here.
import { test, expect, openCity } from "./fixtures.js";
import { auditScreen } from "./a11y.js";

// Il Mercato is a district on the map, not a tab — the tab bar is
// Città · Officina · Piazza · Casa — so the walk is two doors rather than a
// tab press and a click.
async function openCanzoni(page) {
  await openCity(page);
  await page.getByRole("button", { name: /Il Mercato/ }).click();
  await page.getByRole("button", { name: /Canzoni/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Le Canzoni" })).toBeVisible();
}

async function openSong(page) {
  await openCanzoni(page);
  await page.getByRole("button", { name: /Funicul/ }).click();
}

// What the first lyric line and the transport are ACTUALLY painted in, beside
// the tokens they asked for. An unset colour computes to the browser default
// (rgb(0, 0, 0)) and matches no token, which is the assertion below.
function litInk(page) {
  return page.evaluate(() => {
    // Resolve the token through the browser so it comes back in the same
    // rgb() form as a computed colour — comparing "#1C3F4A" to
    // "rgb(28, 63, 74)" would fail on notation rather than on colour.
    const probe = document.createElement("span");
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim();
    document.body.appendChild(probe);
    const inkResolved = getComputedStyle(probe).color;
    probe.remove();

    const line = document.querySelector("ol li span[lang]");
    return {
      inkResolved,
      lineColour: getComputedStyle(line).color,
      lineBackground: getComputedStyle(line.closest("li")).backgroundColor,
    };
  });
}

test.describe("Le Canzoni", () => {
  test("is reachable from the market, and says what it is on the door", async ({ page }) => {
    await openCanzoni(page);

    // The caveat a learner needs before tapping: this is dialect.
    await expect(page.getByRole("button", { name: /Funicul/ })).toContainText("Napoletano");
    await expect(page.getByText(/Nothing here is marked, counted or remembered/)).toBeVisible();
  });

  test("shows the words, in Neapolitan, with the Italian beside them", async ({ page }) => {
    await openSong(page);

    await expect(page.getByText(/This is Neapolitan, not standard Italian/)).toBeVisible();
    // Untimed, and it says so rather than leaving a highlight that never moves.
    await expect(page.getByText(/Nobody has timed this recording yet/)).toBeVisible();

    const lines = page.locator("ol li[aria-current]");
    await expect(lines).toHaveCount(0);

    await page.getByRole("button", { name: "Show the translations" }).click();
    await expect(page.getByText(/In italiano:/).first()).toBeVisible();
  });

  // The one assertion that would have caught the La Riserva bug: the lyric ink
  // is a colour the design system chose, in both palettes, rather than an
  // inherited default that happens to look right in one of them.
  test("paints the words in a colour it actually set", async ({ page }) => {
    await openSong(page);
    const { inkResolved, lineColour, lineBackground } = await litInk(page);

    // The exact assertion, not an approximation of one: the painted ink IS the
    // design system's ink for this palette. An unset `color` would inherit the
    // browser default rgb(0, 0, 0), and neither ink token is pure black
    // (#1C3F4A light, #E7E3D8 dark), so this fails the moment a line stops
    // setting its own colour — which is the bug that shipped once already.
    expect(lineColour).toBe(inkResolved);
    // And the card it sits on is painted rather than transparent, so the
    // contrast axe measures is the contrast a reader gets.
    expect(lineBackground).not.toBe("rgba(0, 0, 0, 0)");
  });

  // Headless Chromium has no audio output device, but a click is a user
  // gesture, the autoplay policy is satisfied by it, and the `play` event
  // fires regardless — which is all the screen's state depends on.
  test("plays the recording from a press, and pauses again", async ({ page }) => {
    await openSong(page);

    const response = page.waitForResponse((res) => res.url().endsWith(".mp3"));
    await page.getByRole("button", { name: "Play" }).click();
    expect((await response).status()).toBeLessThan(400);

    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    // SC 2.2.2's control, and the thing that freezes the highlight.
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("passes WCAG 2.1 AA on the list, the song, and the song with translations", async ({ page }, testInfo) => {
    await openCanzoni(page);
    await auditScreen(page, testInfo, "canzoni-list");

    await page.getByRole("button", { name: /Funicul/ }).click();
    await auditScreen(page, testInfo, "canzoni-song");

    await page.getByRole("button", { name: "Show the translations" }).click();
    await auditScreen(page, testInfo, "canzoni-song-translated");

    await page.getByText("Measure the line timings").click();
    await auditScreen(page, testInfo, "canzoni-timing-pass");
  });
});
