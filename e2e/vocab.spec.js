// L'Officina's vocabulary bench: the flashcard deck and the quiz.
//
// Both screens are shuffled, so both depend on the Math.random stub in
// ./fixtures.js. With random() fixed at 0.99, shuffle() (shared/shuffle.js) is
// the identity: its inner index is floor(0.99 * (i + 1)), which equals i for
// every i <= 99, so every element swaps with itself. Decks, quiz questions and
// quiz options therefore all come out in authored order — which is what makes
// "the twelfth card ends the deck" a fact rather than a hope.
import { test, expect, openCity, pressTab } from "./fixtures.js";
import { LEVELS } from "../src/data/vocab.js";

// Read from the shipped data rather than transcribed into the spec, so a
// reworded gloss or a reordered category breaks the data test that owns it
// instead of this one.
const A1 = LEVELS.find((l) => l.id === "A1");
const GREETINGS = A1.categories.find((c) => c.id === "greetings");
const GLOSS = new Map(GREETINGS.words.map((w) => [w.it, w.en]));

async function openVocabBench(page) {
  await openCity(page);
  await pressTab(page, "Officina");
  // The bench is a single button wrapping the whole card
  // (OfficinaModule.jsx:75), so its name runs "0 / 120 words Vocabulary
  // Cards, quiz and listening, level by level. …" — substring, not exact.
  await page.getByRole("button", { name: /Vocabulary/ }).click();
  // landingLevel (shared/landingLevel.js:35) opens the first unfinished
  // level, which on a fresh account is A1.
  await expect(page.getByRole("button", { name: "A1 Principiante" })).toBeVisible();
}

// `Cards`, `Listen` and `Quiz` each render once PER CATEGORY — A1 has two —
// so every one of those names is ambiguous. Scoped to the TicketCard that
// holds the category's h3 rather than taken with .first(), so the spec names
// the deck it opened instead of depending on which card comes first.
//
// TicketCard's root is <div className="citta"> (shared/TicketCard.jsx:29).
// Both filters are needed and .last() picks the innermost match: a `.citta`
// ancestor wrapping the whole list would satisfy either filter on its own.
function categoryCard(page, name) {
  return page
    .locator("div.citta")
    .filter({ has: page.getByRole("heading", { level: 3, name }) })
    .filter({ has: page.getByRole("button", { name: "Quiz" }) })
    .last();
}

test.describe("Vocabulary — flashcards", () => {
  test("flips a card, grades the whole deck, and finishes on Deck complete", async ({ page }) => {
    await openVocabBench(page);
    await categoryCard(page, "Greetings & basics").getByRole("button", { name: "Cards" }).click();

    await expect(page.getByText("1 / 12")).toBeVisible();

    // The flip control is a real <button> with aria-expanded (VocabModule.jsx:323)
    // — before it existed, flipping a card needed a mouse. The card body is
    // also click-to-flip but is a bare div (:259), so this is the only
    // keyboard-reachable way in and the one worth pinning.
    const flip = page.getByRole("button", { name: "Tap to reveal translation" });
    await expect(flip).toHaveAttribute("aria-expanded", "false");

    // Grading is only offered while flipped (:342): a card you have not
    // looked at cannot be graded.
    await expect(page.getByRole("button", { name: "I knew it" })).toHaveCount(0);

    await flip.click();
    // The accessible name itself carries the state, as well as aria-expanded.
    await expect(page.getByRole("button", { name: "Tap to see the word again" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(GLOSS.get(GREETINGS.words[0].it))).toBeVisible();
    await expect(page.getByRole("button", { name: "I knew it" })).toBeVisible();

    // Grading card 1, which is already flipped. The card flips back to its
    // front face for card 2, which is why the loop below can flip again.
    await page.getByRole("button", { name: "I knew it" }).click();
    await expect(page.getByText("2 / 12")).toBeVisible();

    // The remaining eleven. Deliberately all of them rather than a shortcut to
    // the summary: the deck advance is where focus moves (VocabModule.jsx:210)
    // and where the count has to stay in step.
    for (let i = 1; i < GREETINGS.words.length; i++) {
      await expect(page.getByText(`${i + 1} / 12`)).toBeVisible();
      // Re-resolved every iteration — grading re-renders the card and the
      // name flips back to "Tap to reveal translation".
      await page.getByRole("button", { name: "Tap to reveal translation" }).click();
      await page.getByRole("button", { name: "I knew it" }).click();
    }

    await expect(page.getByRole("heading", { level: 2, name: "Deck complete" })).toBeVisible();
    await page.getByRole("button", { name: "Back to categories" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Greetings & basics" })).toBeVisible();
  });
});

test.describe("Vocabulary — quiz", () => {
  test("marks a right answer, a wrong answer, and lists the miss in the summary", async ({ page }) => {
    await openVocabBench(page);
    await categoryCard(page, "Greetings & basics").getByRole("button", { name: "Quiz" }).click();

    // The prompt is an h2 holding the Italian word, marked lang="it"
    // (VocabModule.jsx:450) — Italian inside an English page, SC 3.1.2.
    const prompt = page.getByRole("heading", { level: 2 });
    await expect(prompt).toHaveAttribute("lang", "it");

    // ---- question 1, answered right ----
    // The right option is derived from what the screen is asking rather than
    // assumed from the authored order, so this still holds if the shuffle
    // stub is ever changed. Options are named by the English gloss (opt.en).
    const firstWord = (await prompt.textContent()).trim();
    await page.getByRole("button", { name: GLOSS.get(firstWord), exact: true }).click();

    // Feedback is never colour alone: AnswerStatus is a role="status" live
    // region (SC 4.1.3), because answering repaints the options without
    // moving focus. It is a status, not a button.
    await expect(page.getByRole("status")).toContainText(/correct/i);
    await expect(page.getByText("1 correct")).toBeVisible();

    await page.getByRole("button", { name: "Next word" }).click();

    // ---- question 2, answered wrong ----
    const secondWord = (await page.getByRole("heading", { level: 2 }).textContent()).trim();
    // Only four of the twelve glosses are on screen, so the distractor is
    // found by asking which ones are, rather than guessed and skipped if the
    // guess misses — a test that can quietly skip itself proves nothing.
    const wrong = page
      .getByRole("button")
      .filter({ hasText: new RegExp(`^(${GREETINGS.words.filter((w) => w.en !== GLOSS.get(secondWord)).map((w) => w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`) })
      .first();
    await expect(wrong).toBeVisible();
    const wrongGloss = (await wrong.textContent()).trim();
    await wrong.click();
    await expect(page.getByRole("status")).toContainText(/not quite/i);
    // Still "1 correct" — a wrong answer does not advance the tally.
    await expect(page.getByText("1 correct")).toBeVisible();

    // FEEDBACK IS NEVER COLOUR ALONE (WCAG 1.4.1). AnswerMark pairs the
    // tick/cross with visually hidden text that becomes part of the option's
    // accessible name, so the two marks are asserted by NAME rather than by
    // the colour or the icon — neither of which a screen reader gets.
    //
    // This replaces an assertion that could not fail: it compared the gloss
    // just picked against the correct one, which the filter above had already
    // excluded from the candidates.
    await expect(page.getByRole("button", { name: `${wrongGloss} your answer, incorrect` })).toBeVisible();
    await expect(page.getByRole("button", { name: `${GLOSS.get(secondWord)} correct answer` })).toBeVisible();

    // ---- through to the summary ----
    await page.getByRole("button", { name: "Next word" }).click();
    for (let i = 2; i < GREETINGS.words.length; i++) {
      const word = (await page.getByRole("heading", { level: 2 }).textContent()).trim();
      await page.getByRole("button", { name: GLOSS.get(word), exact: true }).click();
      // The twelfth question's advance reads "See results", not "Next word".
      await page.getByRole("button", { name: i + 1 >= GREETINGS.words.length ? "See results" : "Next word" }).click();
    }

    await expect(page.getByRole("heading", { level: 2, name: "Quiz complete" })).toBeVisible();
    // The missed-word list: the thing that makes a summary worth reading
    // rather than a tally the learner has to replay the deck to decode.
    await expect(page.getByText("WORDS TO REVIEW")).toBeVisible();
    await expect(page.getByText(secondWord, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Back to categories" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Greetings & basics" })).toBeVisible();
  });
});
