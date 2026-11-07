// La Città — the map, its five districts, and the one shut door.
import { test, expect, openCity, pressTab } from "./fixtures.js";

// A district tile is a SINGLE button wrapping the whole card
// (Dashboard.jsx:224), so its accessible name concatenates every text node
// inside it: the district name, then its fraction. These are regexes because
// the fraction is live — it moves the moment anything is answered.
const DISTRICTS = [
  { name: /L'Officina/, fresh: /L'Officina\s+0 \/ 120 words/ },
  { name: /Il Cantiere/, fresh: /Il Cantiere\s+0 \/ 160 drills/ },
  { name: /Il Mercato/, fresh: /Il Mercato\s+0 \/ 10 dialogues/ },
  { name: /Il Cinema/, fresh: /Il Cinema\s+0 \/ 10 stories/ },
  { name: /La Piazza/, fresh: /La Piazza\s+locked, nothing due yet/ },
];

test.describe("La Città", () => {
  test("draws all five districts with a real fraction on each", async ({ page }) => {
    await openCity(page);

    for (const district of DISTRICTS) {
      await expect(page.getByRole("button", { name: district.fresh })).toBeVisible();
    }
  });

  // THE ONE SHUT DOOR on a fresh account. lockFor() (shared/districts.js:180)
  // is the only lock in the app and fires only for piazza when due === 0.
  //
  // It uses aria-disabled rather than the `disabled` attribute deliberately
  // (Dashboard.jsx:214-226): a disabled button leaves the tab order entirely,
  // and "a locked door you can't even reach" is the thing the design argues
  // against. So the three facts worth pinning are a set, not one assertion —
  // announced as unavailable, STILL FOCUSABLE, and a no-op when pressed. Swap
  // aria-disabled for disabled and the second one fails.
  test("La Piazza is announced as locked, stays focusable, and does nothing when pressed", async ({ page }) => {
    await openCity(page);

    const piazza = page.getByRole("button", { name: /La Piazza/ });

    await expect(piazza).toHaveAttribute("aria-disabled", "true");

    // NOT the `disabled` attribute — that is the whole point, and it has to
    // be asserted against the DOM rather than with expect().toBeDisabled():
    // Playwright follows ARIA semantics there, so a node carrying only
    // aria-disabled reports as disabled and the matcher cannot tell the two
    // apart. `el.disabled` can.
    await expect(piazza).not.toHaveAttribute("disabled", /.*/);
    expect(await piazza.evaluate((el) => el.disabled)).toBe(false);

    // Reachable from the keyboard, which `disabled` would prevent. This is
    // the assertion that actually fails if someone "tidies up" aria-disabled
    // into disabled.
    await piazza.focus();
    await expect(piazza).toBeFocused();

    // onClick is a no-op (Dashboard.jsx:225), so the map is still the map.
    // Activated from the keyboard, the way the focusability above makes
    // possible — and the way a learner who tabbed onto it would.
    await piazza.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "La Città" })).toBeVisible();

    // And the map says what the padlock is waiting on, rather than leaving a
    // padlock to explain itself.
    await expect(page.getByRole("heading", { level: 2, name: "Shut for now" })).toBeVisible();
  });

  // Route -> current tab, from shared/TabBar.jsx. Città is current on the map
  // AND on grammar, stories and mercato, because those are districts of the
  // city rather than places of their own.
  test("the tab bar marks the current section, and Il Cantiere keeps Città current", async ({ page }) => {
    await openCity(page);

    const nav = page.getByRole("navigation", { name: "Sections" });
    await expect(nav.getByRole("button", { name: "Città" })).toHaveAttribute("aria-current", "page");

    // Il Cantiere is reached from the map tile only — there is no Grammar tab
    // (App.jsx:112) — and it is a district, so Città stays current.
    await page.getByRole("button", { name: /Il Cantiere/ }).click();
    // The district is called Il Cantiere on the map; the module's own h1 is
    // "Grammar" (GrammarModule.jsx:132). They are deliberately different
    // names for the same place, so this asserts the one the screen prints.
    await expect(page.getByRole("heading", { level: 1, name: "Grammar" })).toBeVisible();
    // Re-resolved from `page`: App.jsx:96 is <main key={visit}>, so the move
    // above remounted everything and an earlier locator would be detached.
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Città" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await pressTab(page, "Officina");
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Officina" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Città" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  // The tab bar is never disabled, including the tab onto the district whose
  // map tile is locked: La Piazza's own screen states the empty state, which
  // is a different thing from a door with nothing behind it. See piazza.spec.js.
  test("every tab is reachable even when La Piazza's tile is locked", async ({ page }) => {
    await openCity(page);

    const nav = page.getByRole("navigation", { name: "Sections" });
    for (const label of ["Città", "Officina", "Piazza", "Casa"]) {
      await expect(nav.getByRole("button", { name: label })).toBeEnabled();
    }
  });
});
