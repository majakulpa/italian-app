// The WCAG 2.1 AA sweep, in a real browser, in both palettes.
//
// Read ./a11y.js first: it says what this does that src/a11y.test.jsx cannot
// (real contrast, no fragment exemptions, the third palette) and holds the
// assertion that keeps the contrast claim from going quietly hollow.
//
// Every screen a journey in this directory reaches gets scanned here, and
// each scan is a whole real document served by vite — so `region`,
// `landmark-one-main`, `page-has-heading-one`, `html-has-lang` and
// `document-title`, which src/test/a11y.js has to disable on a fragment,
// all run on all of them.
import { test, expect, openCity, pressTab, typeAnswer } from "./fixtures.js";
import { auditScreen } from "./a11y.js";
import { seedOneDueWord, seedTheme } from "./seed.js";
import { LEVELS } from "../src/data/vocab.js";

const GREETINGS = LEVELS.find((l) => l.id === "A1").categories.find((c) => c.id === "greetings");
const GLOSS = new Map(GREETINGS.words.map((w) => [w.it, w.en]));

// Answer the quiz question on screen correctly. The prompt h2 holds the
// Italian word and the options are named by the English gloss, so the right
// option is read off the screen rather than assumed from the shuffle.
async function answerVocabQuestion(page) {
  const word = (await page.getByRole("heading", { level: 2 }).textContent()).trim();
  await page.getByRole("button", { name: GLOSS.get(word), exact: true }).click();
}

test.describe("WCAG 2.1 AA — every screen a journey reaches", () => {
  test("La Città, the map", async ({ page }, testInfo) => {
    await openCity(page);
    await auditScreen(page, testInfo, "city");
  });

  test("L'Officina hub, the vocabulary bench and both faces of a flashcard", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await auditScreen(page, testInfo, "officina-hub");

    await page.getByRole("button", { name: /Vocabulary/ }).click();
    await auditScreen(page, testInfo, "vocab-home");

    await page.getByRole("button", { name: "Cards" }).first().click();
    await auditScreen(page, testInfo, "vocab-card-front");
    // The flipped face paints the feedback-coloured surfaces the front does
    // not, so both faces are scanned.
    await page.getByRole("button", { name: "Tap to reveal translation" }).click();
    await auditScreen(page, testInfo, "vocab-card-flipped");
  });

  test("the vocabulary quiz, an answered option, and the session summary", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await page.getByRole("button", { name: /Vocabulary/ }).click();
    await page.getByRole("button", { name: "Quiz" }).first().click();
    await auditScreen(page, testInfo, "vocab-quiz");

    // An answered option is the state that repaints the boundaries and the
    // fills: it swaps its boundary for malachiteDeep / corolloDeep rather
    // than the fill accents, which only manage 2.5:1 on the dark card. That
    // swap is a claim about painted pixels, so it is measured here rather
    // than computed from the tokens.
    //
    // The right option is derived from the prompt — the prompt is the Italian
    // word and the options are its English gloss — so this clicks an option
    // on purpose rather than whichever button happens to be third.
    await answerVocabQuestion(page);
    await expect(page.getByRole("status")).toContainText(/correct/i);
    await auditScreen(page, testInfo, "vocab-quiz-answered");

    // Through to SessionSummary, which is a screen four modules share, so
    // auditing it once here covers the last advance in all of them.
    await page.getByRole("button", { name: "Next word" }).click();
    for (let i = 1; i < GREETINGS.words.length; i++) {
      await answerVocabQuestion(page);
      await page.getByRole("button", { name: i + 1 >= GREETINGS.words.length ? "See results" : "Next word" }).click();
    }
    await expect(page.getByRole("heading", { level: 2, name: "Quiz complete" })).toBeVisible();
    await auditScreen(page, testInfo, "vocab-quiz-summary");
  });

  test("Il Cantiere: the topic list, the lesson, the drill and an answered drill", async ({ page }, testInfo) => {
    await openCity(page);
    await page.getByRole("button", { name: /Il Cantiere/ }).click();
    await auditScreen(page, testInfo, "cantiere-home");

    await page.getByRole("button", { name: "Learn" }).first().click();
    // The conjugation <table> only exists here, so table markup is only ever
    // audited on this screen.
    await auditScreen(page, testInfo, "cantiere-lesson");

    await page.getByRole("button", { name: "Start drill" }).click();
    await auditScreen(page, testInfo, "cantiere-drill");

    await page.getByRole("button", { name: "parlo", exact: true }).click();
    await auditScreen(page, testInfo, "cantiere-drill-answered");
  });

  test("Il Cinema: the story list, the reader, a revealed translation, an open gloss and the questions", async ({ page }, testInfo) => {
    await openCity(page);
    await page.getByRole("button", { name: /Il Cinema/ }).click();
    await auditScreen(page, testInfo, "cinema-home");

    await page.getByRole("button", { name: "Read", exact: true }).first().click();
    await auditScreen(page, testInfo, "cinema-reader");

    await page.getByRole("button", { name: "Show translation" }).first().click();
    await auditScreen(page, testInfo, "cinema-reader-translated");

    // The gloss bar is a labelled group docked above the tab bar, drawn in
    // the city's 3px edge — a surface pairing that exists nowhere else.
    await page.getByRole("button", { name: "arriva", exact: true }).first().click();
    await expect(page.getByRole("group", { name: "Word gloss" })).toBeVisible();
    await auditScreen(page, testInfo, "cinema-gloss-open");

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Comprehension questions" }).click();
    await auditScreen(page, testInfo, "cinema-questions");
  });

  test("Mappatura: the map list, a map card, the typed drill and a located verdict", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await page.getByRole("button", { name: /Mappatura delle parole/ }).click();
    await auditScreen(page, testInfo, "mappe-home");

    await page.getByRole("button", { name: /-cja/ }).click();
    await auditScreen(page, testInfo, "mappe-card");

    await page.getByRole("button", { name: "Practise the rule" }).click();
    await auditScreen(page, testInfo, "mappe-drill");

    const box = page.getByLabel(/Write it in Italian/);
    await box.click();
    await typeAnswer(box, "rivolucja");
    await page.getByRole("button", { name: "Check" }).click();
    // The "Not there yet" verdict card: a lemon city surface with prose on
    // it, plus an aria-invalid input. Both are contrast pairings the token
    // arithmetic covers and only a browser can confirm were applied.
    await auditScreen(page, testInfo, "mappe-verdict-wrong");
  });

  test("La Piazza, empty", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Piazza");
    await auditScreen(page, testInfo, "piazza-nothing-due");
  });

  test("La Piazza: the landing, the round and the summary", async ({ page }, testInfo) => {
    await seedOneDueWord(page);
    await openCity(page);
    await pressTab(page, "Piazza");
    await auditScreen(page, testInfo, "piazza-landing");

    await page.getByRole("button", { name: /Start the round/ }).click();
    await auditScreen(page, testInfo, "piazza-round");

    await page.getByRole("button", { name: "Show me" }).click();
    await auditScreen(page, testInfo, "piazza-revealed");

    await page.getByRole("button", { name: /See how it went/ }).click();
    await auditScreen(page, testInfo, "piazza-summary");
  });

  test("Casa", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Casa");
    await auditScreen(page, testInfo, "casa");
  });
});

// THE THIRD PALETTE.
//
// theme.js has three sets of --color-* values, not two: the base :root block
// (light, :25), the @media (prefers-color-scheme: dark) block (:67), and the
// explicit :root[data-theme="dark"] (:91) / :root[data-theme="light"] (:113)
// blocks that only apply once useThemeMode has written a choice.
//
// The sweep above is driven by the colorScheme context option, which flips
// the MEDIA QUERY. It therefore never paints with the last two blocks at all.
// Those blocks duplicate the values by hand, so a token edited in one place
// and not the other is a palette that exists only for learners who have
// touched the Casa toggle — which is a code path a media-query-only sweep can
// never reach.
//
// Each project seeds the OPPOSITE mode, so between them the two explicit
// blocks are both exercised whichever project is running.
test.describe("WCAG 2.1 AA — the explicit palette the Casa toggle writes", () => {
  for (const stored of ["light", "dark"]) {
    test(`stored theme "${stored}" paints the map to AA`, async ({ page }, testInfo) => {
      await seedTheme(page, stored);
      await openCity(page);

      // Proof the seed took, and that it is the attribute path rather than
      // the media query doing the painting. A JSON-quoted seed would set
      // data-theme='"dark"' and silently fall through to the base palette —
      // see seedTheme in ./seed.js.
      await expect(page.locator("html")).toHaveAttribute("data-theme", stored);

      await auditScreen(page, testInfo, `explicit-${stored}-city`);

      // One deeper screen too: the map is mostly surfaces, and the typed
      // drill is where tinted feedback, an input and prose all meet.
      await pressTab(page, "Officina");
      await page.getByRole("button", { name: /Mappatura delle parole/ }).click();
      await page.getByRole("button", { name: /-cja/ }).click();
      await page.getByRole("button", { name: "Practise the rule" }).click();
      await auditScreen(page, testInfo, `explicit-${stored}-mappe-drill`);
    });
  }
});

// KEYBOARD ACCESS — SC 2.1.1, which axe cannot check.
//
// axe reports on markup; "can a keyboard reach this and see where it is" is a
// behavioural question, so it gets its own tests rather than a rule.
test.describe("Keyboard access", () => {
  test("every district tile and all four tabs are reachable by Tab, with visible focus", async ({ page }) => {
    await openCity(page);

    const names = ["L'Officina", "Il Cantiere", "Il Mercato", "Il Cinema", "La Piazza", "Città", "Officina", "Piazza", "Casa"];
    const reached = new Set();

    // A bounded walk rather than `while (true)`: 60 presses is comfortably
    // more than the document holds, and a regression that drops something
    // from the tab order shows up as a missing name rather than a hang.
    for (let i = 0; i < 60 && reached.size < names.length; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          text: (el.textContent || "").trim(),
          tag: el.tagName,
          // What makes the focus ring visible. The browser default is an
          // outline; this asserts the app has not set `outline: none`
          // anywhere in the tab order without putting something back.
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      if (!focused) continue;

      // Every control in the app is a real <button> — no role="button" divs,
      // no nested interactive controls. A div in the tab order here would be
      // a regression on that.
      expect(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"]).toContain(focused.tag);
      expect(focused.outlineStyle).not.toBe("none");
      expect(focused.outlineWidth).not.toBe("0px");

      for (const name of names) {
        if (focused.text.includes(name)) reached.add(name);
      }
    }

    // La Piazza's tile is aria-disabled, NOT disabled, so it is in this list
    // on purpose: a locked door you cannot even reach is the thing the design
    // argues against, and `disabled` would take it out of the tab order.
    expect([...names].filter((n) => !reached.has(n))).toEqual([]);
  });

  test("Escape closes the story gloss from the keyboard", async ({ page }) => {
    await openCity(page);
    await page.getByRole("button", { name: /Il Cinema/ }).click();
    await page.getByRole("button", { name: "Read", exact: true }).first().click();

    // Opened from the keyboard, not the mouse: a glossed word is a real
    // <button> (StoriesModule.jsx:122), so Enter opens it.
    const word = page.getByRole("button", { name: "stazione", exact: true }).first();
    await word.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: "Word gloss" })).toBeVisible();

    // The bar deliberately does not take focus, so Escape has to work from
    // the word the learner is still standing on (StoriesModule.jsx:176).
    await expect(word).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Word gloss" })).toHaveCount(0);
  });
});
