// La Piazza — the review district. Two screens, and a fresh account only
// reaches one of them.
//
// ON A FRESH ACCOUNT dueCount === 0, so the Piazza tab renders NothingDue
// (ReviewModule.jsx:287): an h1, a "Nothing due" eyebrow, the sentence about
// everything being scheduled for a later day, and ONE button. There is no
// `Start the round` and no "0 items waiting" card to find, which is why that
// state is tested as itself rather than as a degraded landing.
//
// The landing and the round need a seed. See ./seed.js for why addInitScript
// is enough and why the date is 2020 rather than today.
import { test, expect, openCity, pressTab, typeAnswer } from "./fixtures.js";
import { seedOneDueWord } from "./seed.js";

// The summary's two stat cards are a count in a <p> followed by its label
// (ReviewModule.jsx:675-683). The label alone is always on screen whatever
// the counts are, so a spec that asserts the label asserts nothing — these
// read the number next to it.
function countBeside(page, label) {
  return page.getByText(label, { exact: true }).locator("xpath=preceding-sibling::p[1]");
}

test.describe("La Piazza — fresh account", () => {
  test("renders the empty state as itself, with one way out", async ({ page }) => {
    await openCity(page);
    await pressTab(page, "Piazza");

    await expect(page.getByRole("heading", { level: 1, name: "La Piazza" })).toBeVisible();
    await expect(page.getByText("Nothing due")).toBeVisible();
    await expect(page.getByText(/Everything you have studied is scheduled for a later day/)).toBeVisible();

    // The things that are NOT here. A landing screen degraded to zero would
    // show these; this is a different screen.
    await expect(page.getByRole("button", { name: /Start the round/ })).toHaveCount(0);
    await expect(page.getByText(/items waiting/)).toHaveCount(0);

    await page.getByRole("button", { name: /Back to the city/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "La Città" })).toBeVisible();
  });
});

test.describe("La Piazza — one item due", () => {
  test.beforeEach(async ({ page }) => {
    await seedOneDueWord(page);
  });

  test("the landing states the count and opens the round", async ({ page }) => {
    await openCity(page);

    // The map tile is no longer locked once something is waiting: lockFor()
    // (shared/districts.js:180) fires only when due === 0, and this is the
    // same count the landing shows — the badge and the round it opens can
    // never say different numbers (srs.js dueCount).
    const tile = page.getByRole("button", { name: /La Piazza/ });
    await expect(tile).not.toHaveAttribute("aria-disabled", "true");

    await pressTab(page, "Piazza");
    await expect(page.getByText("item waiting")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start the round/ })).toBeVisible();
  });

  test("a wrong answer is located, Check again, then the round's summary", async ({ page }) => {
    await openCity(page);
    await pressTab(page, "Piazza");
    await page.getByRole("button", { name: /Start the round/ }).click();

    await expect(page.getByText("1 / 1")).toBeVisible();
    await expect(page.getByText("Attempt 1 of 2")).toBeVisible();

    // EXACT here, unlike Mappatura's. La Piazza's label is the bare string
    // "Write it in Italian" (ReviewModule.jsx:609); Mappatura's carries an
    // aria-hidden flag emoji and needs a regex. The two fields look the same
    // on screen and are not the same accessible name.
    const box = page.getByLabel("Write it in Italian", { exact: true });
    await box.click();
    // Never fill() — ReviewModule.jsx:369 refocuses this input.
    await typeAnswer(box, "sbagliato");

    await page.getByRole("button", { name: "Check", exact: true }).click();

    // Located, not solved: two goes before anything is revealed. "Check
    // again" is La Piazza's string and Mappatura never says it — see
    // officina.spec.js, which asserts its absence there.
    await expect(page.getByText("Attempt 2 of 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Check again" })).toBeVisible();
    // "Show me" is drawn as a deliberate second choice rather than the quick
    // way out, and it is wrong by definition — only a first-attempt correct
    // answer promotes.
    await expect(page.getByRole("button", { name: "Show me" })).toBeVisible();

    await expect(box).toBeFocused();
    await box.fill("");
    await typeAnswer(box, "ciao");
    await page.getByRole("button", { name: "Check again" }).click();

    // One item in the queue, so this advance is the last one.
    await page.getByRole("button", { name: /See how it went/ }).click();

    await expect(page.getByRole("heading", { level: 1, name: /That’s the round/ })).toBeVisible();
    // Right on the second go, after the app said where to look — so it comes
    // back rather than being promoted.
    await expect(page.getByText("coming back")).toBeVisible();
    await expect(page.getByText("Worth another look")).toBeVisible();

    await page.getByRole("button", { name: /Back to La Piazza/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "La Piazza" })).toBeVisible();
  });

  test("Show me reveals the answer and never promotes", async ({ page }) => {
    await openCity(page);
    await pressTab(page, "Piazza");
    await page.getByRole("button", { name: /Start the round/ }).click();

    await page.getByRole("button", { name: "Show me" }).click();

    // An empty box is not an attempt, so there is nothing to locate — the
    // screen says so plainly rather than inventing a place.
    await expect(page.getByText("ciao").first()).toBeVisible();
    await page.getByRole("button", { name: /See how it went/ }).click();

    await expect(page.getByRole("heading", { level: 1, name: /That’s the round/ })).toBeVisible();
    await expect(page.getByText("right first time")).toBeVisible();
  });
});
