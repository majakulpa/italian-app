// Casa — and the theme toggle, which is the one control in the app that
// changes what every other screen is painted in.
//
// This spec is the reason a browser is worth running at all. useThemeMode
// writes `data-theme` on <html>, theme.js's :root[data-theme="dark"] /
// [data-theme="light"] blocks (theme.js:91, :113) redefine the --color-*
// tokens, and every TOKENS.xxx call site is a var() reference that resolves
// AT PAINT TIME. Under jsdom there is no paint, so none of that can be
// observed: a toggle that set the attribute and changed nothing on screen
// would pass every unit test in the repo.
import { test, expect, openCity, pressTab } from "./fixtures.js";

// Read the colours the page is ACTUALLY painted, not the tokens it asks for.
//
// Deliberately not document.body: the app shell paints on the div inside
// #root (App.jsx:88), so body's own background computes to
// rgba(0, 0, 0, 0) in every theme. Measuring it compares transparent against
// transparent and passes whatever the toggle does — a test that cannot fail.
//
// `heading` is the load-bearing one. An unset `color` is the exact bug
// CLAUDE.md says already shipped: La Riserva's legend rows inherited the
// browser default and measured 1.27:1 on the dark ground with the token
// arithmetic green. A computed colour read out of a real browser is the only
// thing that sees it.
function painted(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("#root > div");
    const heading = document.querySelector("h1");
    const style = getComputedStyle(document.documentElement);
    return {
      paperToken: style.getPropertyValue("--color-paper").trim(),
      inkToken: style.getPropertyValue("--color-ink").trim(),
      shellBackground: getComputedStyle(shell).backgroundColor,
      headingColour: getComputedStyle(heading).color,
    };
  });
}

test.describe("Casa", () => {
  test("opens on the settings screen", async ({ page }) => {
    await openCity(page);
    await pressTab(page, "Casa");

    await expect(page.getByRole("heading", { level: 1, name: "Casa" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Lo Stadio/ })).toBeVisible();
  });

  // The toggle's NAME depends on the resolved mode (ThemeToggle.jsx:39), not
  // on a stored choice: with nothing stored the mode resolves from
  // prefers-color-scheme, so the fresh name is "Switch to dark mode" in the
  // light project and "Switch to light mode" in the dark one. Running this in
  // both projects is what proves the resolution, which is why the expected
  // names are derived from the project rather than written down.
  test("the toggle flips the painted palette and its own name", async ({ page }, testInfo) => {
    const startsDark = testInfo.project.name === "dark";
    const firstName = startsDark ? "Switch to light mode" : "Switch to dark mode";
    const secondName = startsDark ? "Switch to dark mode" : "Switch to light mode";

    await openCity(page);
    await pressTab(page, "Casa");

    // No stored preference, so useThemeMode.js:10 DELETES
    // document.documentElement.dataset.theme and the @media block governs.
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();

    const before = await painted(page);
    // Not transparent and not the browser default — proof the measurement
    // itself is looking at something.
    expect(before.shellBackground).not.toBe("rgba(0, 0, 0, 0)");
    await expect(page.getByRole("button", { name: firstName })).toBeVisible();
    await page.getByRole("button", { name: firstName }).click();

    // Now an explicit choice is stored, so the attribute appears and the
    // EXPLICIT palette blocks take over from the media query.
    await expect(page.locator("html")).toHaveAttribute("data-theme", startsDark ? "light" : "dark");
    await expect(page.getByRole("button", { name: secondName })).toBeVisible();

    // The assertion that matters: the pixels changed. An attribute that
    // nothing paints from would satisfy everything above and fail here.
    const after = await painted(page);
    expect(after).not.toEqual(before);
    expect(after.shellBackground).not.toBe(before.shellBackground);
    expect(after.headingColour).not.toBe(before.headingColour);

    // And it survives a reload, because the choice is stored rather than
    // held in state.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", startsDark ? "light" : "dark");
    expect(await painted(page)).toEqual(after);
  });

  // The explicit palette has to agree with the media-query palette, or the
  // toggle would be a third theme nobody designed. theme.js duplicates the
  // dark values in both blocks (:67 and :91) for exactly this reason, and
  // nothing in the jsdom suite can check that the duplication still paints
  // the same.
  test("the explicit palette paints what the media query paints", async ({ page }, testInfo) => {
    await openCity(page);
    const fromMediaQuery = await painted(page);
    expect(fromMediaQuery.shellBackground).not.toBe("rgba(0, 0, 0, 0)");

    // Toggle to the other mode and back, which leaves an explicit choice
    // matching the project's own scheme.
    await pressTab(page, "Casa");
    const first = testInfo.project.name === "dark" ? "Switch to light mode" : "Switch to dark mode";
    await page.getByRole("button", { name: first }).click();
    await page.getByRole("button", { name: testInfo.project.name === "dark" ? "Switch to dark mode" : "Switch to light mode" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", testInfo.project.name);
    expect(await painted(page)).toEqual(fromMediaQuery);
  });
});
