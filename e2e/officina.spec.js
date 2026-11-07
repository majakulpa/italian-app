// Mappatura delle parole — the typed production drill, and L'Officina's hub.
//
// This is the screen the typed-drill spec is written against rather than one
// of the shuffled ones, and that is the whole reason: Mappatura walks its
// drills in AUTHORED order (MappeModule.jsx:406 indexes map.drills directly),
// so item 1 is item 1 with or without the Math.random stub. Item 1 of the
// -cja map is `rewolucja` -> `rivoluzione`.
import { test, expect, openCity, pressTab, typeAnswer } from "./fixtures.js";
import { MAPS } from "../src/data/mappe.js";

const ZIONE = MAPS.find((m) => m.id === "zione");
const FIRST = ZIONE.drills[0];

async function openDrill(page) {
  await openCity(page);
  await pressTab(page, "Officina");
  await page.getByRole("button", { name: /Mappatura delle parole/ }).click();
  // The map card is a single button wrapping the whole card
  // (MappeModule.jsx:185), so its name runs "Mappa 01 0 / 6 drilled -cja or
  // -tion becomes -zione …" — substring only.
  await page.getByRole("button", { name: /-cja/ }).click();
  await page.getByRole("button", { name: "Practise the rule" }).click();
  await expect(page.getByText(FIRST.src)).toBeVisible();
}

// The label contains an aria-hidden flag emoji before the text
// (MappeModule.jsx:508), so the accessible name is not the bare string —
// regex, never exact. La Piazza's equivalent field has no emoji and IS exact;
// the two are deliberately different and piazza.spec.js says so.
function answerBox(page) {
  return page.getByLabel(/Write it in Italian/);
}

// The verdict card's own prose, as distinct from the LiveStatus that mirrors
// it. Both carry the same sentences BY DESIGN — announce() in
// modules/mappe/feedback.js builds the region's copy from the same verdict
// object the card renders — so an unscoped getByText matches twice and
// Playwright's strict mode rejects it. That double match is the design
// working, not a bug, so the specs name which half they mean rather than
// loosening the locator.
function cardSays(page, text) {
  return page.locator("p:not([role='status'])").filter({ hasText: text });
}

test.describe("Mappatura delle parole — typed drill", () => {
  test("a wrong first attempt is located, not solved, and the field stays live", async ({ page }) => {
    await openDrill(page);

    await expect(page.getByText("Attempt 1 of 2")).toBeVisible();
    await expect(page.getByText("1 / 6")).toBeVisible();

    const box = answerBox(page);
    await box.click();
    // Never fill() a field the app refocuses — the second attempt below
    // refocuses this very input (MappeModule.jsx:465). pressSequentially
    // sends real key events, which a refocus cannot swallow.
    await typeAnswer(box, "rivolucja");
    await page.getByRole("button", { name: "Check" }).click();

    // LOCATED, NOT SOLVED. The verdict says where it went wrong and never
    // what the answer was: the ending the map lands on, and how far the
    // learner's own spelling stayed on track. Only a spent second attempt
    // reveals anything.
    await expect(page.getByText("Not there yet")).toBeVisible();
    await expect(cardSays(page, "This map lands on")).toContainText("-zione");
    await expect(cardSays(page, "You have")).toContainText("rivolu");
    await expect(page.getByText("Have another go — you get one more.")).toBeVisible();
    // The answer is NOT on the screen yet. This is the assertion that fails
    // if the verdict ever starts solving instead of locating.
    await expect(page.getByText(FIRST.it, { exact: true })).toHaveCount(0);

    await expect(page.getByText("Attempt 2 of 2")).toBeVisible();

    // The verdict is mirrored into a LiveStatus (MappeModule.jsx:481), which
    // stays mounted and starts empty — the only shape that is reliably
    // announced. announce() in feedback.js is the one place that sentence is
    // built, so the region and the card cannot drift apart.
    await expect(page.getByRole("status")).toContainText("Not quite.");

    // The field stays live and is refocused, because the point of the second
    // attempt is to fix the word still sitting in it.
    await expect(box).not.toHaveAttribute("readonly", /.*/);
    await expect(box).toBeFocused();
    await expect(box).toHaveAttribute("aria-invalid", "true");
  });

  test("the right answer on the second go settles the item and offers Next", async ({ page }) => {
    await openDrill(page);

    const box = answerBox(page);
    await box.click();
    await typeAnswer(box, "rivolucja");
    await page.getByRole("button", { name: "Check" }).click();

    // Already focused by the app, so clear and retype in place.
    await expect(box).toBeFocused();
    await box.fill("");
    await typeAnswer(box, FIRST.it);
    await page.getByRole("button", { name: "Check" }).click();

    await expect(page.getByText("Right")).toBeVisible();
    // The rule that was applied, named — a right answer says what you did,
    // not just that you did it.
    await expect(cardSays(page, "You applied")).toContainText("-zione");
    await expect(page.getByRole("status")).toContainText("Correct.");

    // Settled: the input goes readOnly and the one button becomes Next. ONE
    // button across the whole item, deliberately — swapping Check for a
    // separate Next would unmount the element just pressed and drop focus to
    // <body>.
    await expect(box).toHaveAttribute("readonly", /.*/);
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    // Mappe NEVER says "Check again" — that string belongs to La Piazza.
    await expect(page.getByRole("button", { name: "Check again" })).toHaveCount(0);

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("2 / 6")).toBeVisible();
    await expect(page.getByText("Attempt 1 of 2")).toBeVisible();
    await expect(page.getByText(ZIONE.drills[1].src)).toBeVisible();
  });

  test("a right first answer needs no second attempt, and item 6 ends the round", async ({ page }) => {
    await openDrill(page);

    for (let i = 0; i < ZIONE.drills.length; i++) {
      await expect(page.getByText(`${i + 1} / 6`)).toBeVisible();
      const box = answerBox(page);
      await box.click();
      await typeAnswer(box, ZIONE.drills[i].it);
      await page.getByRole("button", { name: "Check" }).click();
      await expect(page.getByText("Right")).toBeVisible();
      // Item 6's advance reads "See how it went", not "Next".
      await page
        .getByRole("button", { name: i + 1 >= ZIONE.drills.length ? "See how it went" : "Next" })
        .click();
    }

    // Six landed, nothing revealed — the round's own summary, which is
    // Mappatura's rather than the shared SessionSummary.
    // \u2019, not an ASCII apostrophe: the heading is written `that&rsquo;s`
    // (MappeModule.jsx:554), and the app uses typographic punctuation
    // throughout. An ASCII ' here matches nothing.
    await expect(page.getByRole("heading", { level: 1, name: /that\u2019s the run/ })).toBeVisible();
    await expect(page.getByText("Worth another look")).toHaveCount(0);

    // All five Officina benches are open today: SHUT_BENCHES is empty, so
    // ShutBench (OfficinaModule.jsx:121) never renders. Coming back out lands
    // on the maps rather than a padlock.
    await page.getByRole("button", { name: "Back to the maps" }).click();
    await expect(page.getByRole("button", { name: /-cja/ })).toBeVisible();
  });
});
