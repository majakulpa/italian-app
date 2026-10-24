// Il Cantiere — the grammar district: Learn, then Start drill, then answer.
//
// Reached from the map tile ONLY. There is no Grammar tab (App.jsx:112), and
// Il Cantiere is a district of the city, so pressing the Città tab is what
// comes back out. The district is called Il Cantiere on the map; the module's
// own h1 is "Grammar" (GrammarModule.jsx:132).
//
// Opens on A1 unconditionally (GrammarModule.jsx:115) — unlike the vocabulary
// bench it has no landingLevel memory, so there is nothing to seed.
import { test, expect, openCity } from "./fixtures.js";

const TOPIC = "Presente: verbi in -ARE";

async function openCantiere(page) {
  await openCity(page);
  await page.getByRole("button", { name: /Il Cantiere/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Grammar" })).toBeVisible();
}

// `Learn` and `Drill` render once per topic and A1 has four, so both names
// appear four times. Scoped to the card holding the topic's h3, the same way
// vocab.spec.js scopes a category.
function topicCard(page, name) {
  return page
    .locator("div.citta")
    .filter({ has: page.getByRole("heading", { level: 3, name }) })
    .filter({ has: page.getByRole("button", { name: "Drill" }) })
    .last();
}

test.describe("Il Cantiere", () => {
  test("Learn shows the conjugation table, then Start drill grades an answer", async ({ page }) => {
    await openCantiere(page);

    await topicCard(page, TOPIC).getByRole("button", { name: "Learn" }).click();

    // The lesson: an h2 naming the topic and a real <table> of conjugations.
    // A table rather than a grid of divs, so a screen reader can navigate it
    // by row and column.
    await expect(page.getByRole("heading", { level: 2, name: TOPIC })).toBeVisible();
    await expect(page.getByRole("table").first()).toBeVisible();

    await page.getByRole("button", { name: "Start drill" }).click();

    // The drill prompt is an h2 holding the gapped sentence. Options are
    // Italian verb forms.
    await expect(page.getByRole("heading", { level: 2, name: "Io ___ italiano ogni giorno." })).toBeVisible();

    // EVERY OPTION HAS A SIBLING SpeakButton named `Pronounce "parlo"`
    // (shared/SpeakButton.jsx:29), so getByRole("button", { name: /parlo/ })
    // matches TWO nodes — the option and the speaker. `exact: true` is what
    // separates them, and it is not optional.
    await expect(page.getByRole("button", { name: /parlo/ })).toHaveCount(2);
    await page.getByRole("button", { name: "parlo", exact: true }).click();

    // Feedback is never colour alone: AnswerStatus is a role="status" live
    // region, because answering repaints the options without moving focus.
    await expect(page.getByRole("status")).toContainText(/correct/i);

    // Advancing: "Next" for all but the last of the 40 drills, where it reads
    // "See results" instead.
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // A second item, so the advance is shown to actually advance rather than
    // just to be clickable. Focus lands on the new prompt
    // (GrammarModule.jsx:320), which sits immediately before the options in
    // tab order — otherwise it would fall to <body> and a keyboard learner
    // would re-tab from the top for every question.
    const prompt = page.getByRole("heading", { level: 2 });
    await expect(prompt).not.toHaveText("Io ___ italiano ogni giorno.");
    await expect(prompt).toBeFocused();
    // Italian inside an English page (SC 3.1.2).
    await expect(prompt).toHaveAttribute("lang", "it");
  });

  test("a wrong answer is marked wrong and names the answer in the live region", async ({ page }) => {
    await openCantiere(page);
    await topicCard(page, TOPIC).getByRole("button", { name: "Learn" }).click();
    await page.getByRole("button", { name: "Start drill" }).click();

    // `parlano` is one of the four options for drill 1 and is not its answer.
    await page.getByRole("button", { name: "parlano", exact: true }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText(/not quite/i);
    // AnswerStatus renders the answer as its own element rather than
    // interpolating it into the sentence, so an Italian answer is not read
    // with English phonetics (SC 3.1.2). The element carries lang="it".
    await expect(status.locator("[lang='it']")).toHaveText("parlo");
  });
});
