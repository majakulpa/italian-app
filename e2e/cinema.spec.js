// Il Cinema — the stories district: read, reveal a translation, open a gloss,
// then the comprehension questions.
//
// Reached from the map tile ONLY, like Il Cantiere. Opens on A1.
import { test, expect, openCity } from "./fixtures.js";
import { STORY_LEVELS } from "../src/data/stories.js";

const A1 = STORY_LEVELS.find((l) => l.id === "A1");
const STORY = A1.stories[0];
const QUESTION = STORY.questions[0];

async function openReader(page) {
  await openCity(page);
  await page.getByRole("button", { name: /Il Cinema/ }).click();
  // One `Read` per story and A1 has two, so .first() takes the first story —
  // the name becomes `Read again` once a story is finished, which is why the
  // name alone cannot identify which one this is. The h2 below says.
  await page.getByRole("button", { name: "Read", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: STORY.title })).toBeVisible();
}

test.describe("Il Cinema", () => {
  test("reveals a paragraph translation", async ({ page }) => {
    await openReader(page);

    // One toggle per paragraph (shared/TranslationToggle.jsx), so .first().
    const toggle = page.getByRole("button", { name: "Show translation" }).first();
    await expect(page.getByText(STORY.paragraphs[0].en)).toHaveCount(0);

    await toggle.click();
    await expect(page.getByText(STORY.paragraphs[0].en)).toBeVisible();
    // The toggle states its new action, not its old one.
    await expect(page.getByRole("button", { name: "Hide translation" }).first()).toBeVisible();
  });

  test("a glossed word opens the gloss bar, announces it, and does NOT move focus", async ({ page }) => {
    await openReader(page);

    // Every glossed word is its own button, named by the word core
    // (StoriesModule.jsx:122) — the keys of paragraphs[0].gloss.
    const word = Object.keys(STORY.paragraphs[0].gloss)[0];
    const glossWord = page.getByRole("button", { name: word, exact: true }).first();
    await glossWord.click();

    // The visible gloss bar is a labelled group and carries NO live role
    // (StoriesModule.jsx:184-185), so the gloss is announced once rather
    // than twice.
    const bar = page.getByRole("group", { name: "Word gloss" });
    await expect(bar).toBeVisible();

    // FOCUS DELIBERATELY DOES NOT MOVE. The bar opens at the bottom of the
    // viewport without taking focus, so tapping a word never loses the
    // reader's place in the paragraph; the spoken half is GlossAnnouncer
    // (:266) through shared/LiveStatus.jsx, a region that stays mounted and
    // starts empty. That is the only shape that is announced reliably across
    // AT/browser pairs — a region that appears with its text already inside
    // has no change of contents to report.
    //
    // This is the assertion that would fail if someone "improved" the gloss
    // by focusing it.
    await expect(glossWord).toBeFocused();

    await expect(page.getByRole("status")).toContainText(word);

    await page.getByRole("button", { name: "Close gloss" }).click();
    await expect(bar).toHaveCount(0);
  });

  test("Escape closes the gloss bar", async ({ page }) => {
    await openReader(page);

    const word = Object.keys(STORY.paragraphs[0].gloss)[1];
    await page.getByRole("button", { name: word, exact: true }).first().click();
    const bar = page.getByRole("group", { name: "Word gloss" });
    await expect(bar).toBeVisible();

    // StoriesModule.jsx:176 — a document-level keydown handler. Nothing in
    // the bar holds focus (see above), so this has to work from wherever the
    // learner's focus happens to be, which is the word they tapped.
    await page.keyboard.press("Escape");
    await expect(bar).toHaveCount(0);
  });

  test("works through the comprehension questions to Story complete", async ({ page }) => {
    await openReader(page);

    await page.getByRole("button", { name: "Comprehension questions" }).click();

    // The questions are in Italian at every level, A1 included, so the whole
    // block is lang="it" — options and all.
    const prompt = page.getByRole("heading", { level: 2, name: QUESTION.prompt });
    await expect(prompt).toBeVisible();

    // Options are the Italian option text and are shuffled
    // (StoriesModule.jsx:319), so they are addressed by name rather than by
    // position even with the Math.random stub in place.
    await page.getByRole("button", { name: QUESTION.answer, exact: true }).click();
    await expect(page.getByRole("status")).toContainText(/correct/i);

    for (let i = 0; i < STORY.questions.length; i++) {
      if (i > 0) {
        const q = STORY.questions[i];
        await expect(page.getByRole("heading", { level: 2, name: q.prompt })).toBeVisible();
        await page.getByRole("button", { name: q.answer, exact: true }).click();
      }
      await page
        .getByRole("button", { name: i + 1 >= STORY.questions.length ? "See results" : "Next question" })
        .click();
    }

    await expect(page.getByRole("heading", { level: 2, name: "Story complete" })).toBeVisible();
    await page.getByRole("button", { name: "Back to stories" }).click();
    // Finishing a story turns its `Read` into `Read again`.
    await expect(page.getByRole("button", { name: "Read again" }).first()).toBeVisible();
  });
});
