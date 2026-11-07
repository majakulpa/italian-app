// The WCAG 2.1 AA sweep, in a real browser, in both palettes.
//
// Read ./a11y.js first: it says what this does that src/a11y.test.jsx cannot
// (real contrast, no fragment exemptions, the third palette) and holds the
// assertion that keeps the contrast claim from going quietly hollow.
//
// Every screen the app can be in gets scanned here — the ones the journey
// specs in this directory walk, and the four they do not (Il Mercato and the
// Gli Articoli / La Riserva / Falsi Amici benches, at the bottom of the first
// block). Each scan is a whole real document served by vite, so `region`,
// `landmark-one-main`, `page-has-heading-one`, `html-has-lang` and
// `document-title`, which src/test/a11y.js has to disable on a fragment, all
// run on all of them.
import { test, expect, openCity, pressTab, typeAnswer } from "./fixtures.js";
import { auditScreen } from "./a11y.js";

// The journey specs record every run, because the owner asked to watch those.
// This file does not: nobody needs 32 webm files of a passing axe scan, and
// at ~120KB each they were most of the 8.9MB the PR report accumulated in
// gh-pages history on every push. The evidence that matters on a failure here
// is axe's JSON, which ./a11y.js attaches, and the video is still kept when
// there is something to look at.
test.use({ video: "retain-on-failure" });
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

test.describe("WCAG 2.1 AA — every screen", () => {
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

  // The four screens no journey spec in this directory walks. They are here
  // because the sweep's job is every screen, not every screen that happens
  // to have a journey — Il Mercato is a hub with two open stalls, and
  // Gli Articoli, La Riserva and Falsi Amici are three of L'Officina's five
  // benches, all open on a fresh account.
  //
  // Audited only. Journey specs for them are deliberately out of scope: each
  // would need its own recon of prompts, verdicts and summaries, and the
  // thing that was missing here was palette coverage of their markup.

  test("Il Mercato, the hub and its two stalls", async ({ page }, testInfo) => {
    await openCity(page);
    await page.getByRole("button", { name: /Il Mercato/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Il Mercato" })).toBeVisible();
    await auditScreen(page, testInfo, "mercato-hub");
  });

  test("Gli Articoli: the strands and a gap drill", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await page.getByRole("button", { name: /Gli Articoli/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Gli Articoli" })).toBeVisible();
    await auditScreen(page, testInfo, "articoli-home");

    // Authored order, no shuffle — Gli Articoli walks its items as written,
    // which is why no Math.random stub is needed to reach a stable screen.
    await page.getByRole("button", { name: /Il determinativo/ }).click();
    await auditScreen(page, testInfo, "articoli-strand");
  });

  test("Falsi Amici: the collection and both trap sets", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await page.getByRole("button", { name: /Falsi Amici/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Falsi Amici" })).toBeVisible();
    // Two h2 sections — "The maps set these" and "Nothing generates these" —
    // so the collection screen covers both sources in one scan.
    await auditScreen(page, testInfo, "falsi-amici-home");

    await page.getByRole("button", { name: /^Practise these/ }).first().click();
    await auditScreen(page, testInfo, "falsi-amici-drill");
  });

  // La Riserva is the slow one, and deliberately scanned WHOLE rather than
  // with an exclude. src/test/a11y.js documents an `exclude` escape hatch for
  // exactly this screen, and requires that a screen which excludes its
  // decoration be scanned whole somewhere else — this is that place.
  //
  // It is affordable here because the cost that made it expensive under jsdom
  // was coverage instrumentation, which a browser does not pay. The grid is
  // 2,000 cells, aria-hidden with its facts given as text, and the ten bands
  // are the real controls — two thousand focusable cells would be a trap
  // rather than a tab order. Scanning it whole is what checks the grid is
  // still hidden: un-hide it and its contents become checked nodes.
  test("La Riserva, the whole grid included", async ({ page }, testInfo) => {
    await openCity(page);
    await pressTab(page, "Officina");
    await page.getByRole("button", { name: /La Riserva/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "La Riserva" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "The ten fasce" })).toBeVisible();
    await auditScreen(page, testInfo, "riserva-home");

    // A fascia with words behind it opens a typed round; the first band has
    // all 200 ranks filled.
    // Anchored and with the separator, because /Fascia 1/ also matches
    // "Fascia 10 \u00b7 posti 1801\u20132000".
    await page.getByRole("button", { name: /^Fascia 1 \u00b7/ }).click();
    await auditScreen(page, testInfo, "riserva-fascia");
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

    const nav = page.getByRole("navigation", { name: "Sections" });

    // IDENTITY, NOT SUBSTRING, and that is the whole point of this shape.
    //
    // A district tile is one button wrapping the whole card, so its
    // accessible name concatenates every text node — "L'Officina 0 / 120
    // words". districts.js:62,91 name two districts L'Officina and La Piazza,
    // and TabBar names two tabs Officina and Piazza. An earlier version of
    // this test matched with `text.includes(name)`, so reaching the two TILES
    // marked the two TABS as reached: it gated two of the four tabs it
    // claimed, and those two buttons might never have been focused at all —
    // which means their focus-visible outline was never checked either.
    //
    // These are element handles compared with ===, so nothing can stand in
    // for anything else. The tabs are scoped to the nav as well.
    const targets = [
      ["tile L'Officina", page.getByRole("button", { name: /L'Officina/ })],
      ["tile Il Cantiere", page.getByRole("button", { name: /Il Cantiere/ })],
      ["tile Il Mercato", page.getByRole("button", { name: /Il Mercato/ })],
      ["tile Il Cinema", page.getByRole("button", { name: /Il Cinema/ })],
      ["tile La Piazza", page.getByRole("button", { name: /La Piazza/ })],
      ["tab Città", nav.getByRole("button", { name: "Città", exact: true })],
      ["tab Officina", nav.getByRole("button", { name: "Officina", exact: true })],
      ["tab Piazza", nav.getByRole("button", { name: "Piazza", exact: true })],
      ["tab Casa", nav.getByRole("button", { name: "Casa", exact: true })],
    ];

    const handles = [];
    for (const [id, locator] of targets) {
      // Each target must name exactly one element, or "reached" would be
      // ambiguous about which one it reached.
      await expect(locator, `${id} should resolve to exactly one element`).toHaveCount(1);
      handles.push(await locator.elementHandle());
    }

    const reached = new Set();

    // A bounded walk rather than `while (true)`: 60 presses is comfortably
    // more than the document holds, and a regression that drops something
    // from the tab order shows up as a missing name rather than a hang.
    for (let i = 0; i < 60 && reached.size < targets.length; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate((els) => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          tag: el.tagName,
          // What makes the focus ring visible. The browser default is an
          // outline; this asserts the app has not set `outline: none`
          // anywhere in the tab order without putting something back.
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          index: els.indexOf(el),
        };
      }, handles);
      if (!focused) continue;

      // Every control in the app is a real <button> — no role="button" divs,
      // no nested interactive controls. A div in the tab order here would be
      // a regression on that.
      expect(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"]).toContain(focused.tag);
      expect(focused.outlineStyle).not.toBe("none");
      expect(focused.outlineWidth).not.toBe("0px");

      if (focused.index >= 0) reached.add(targets[focused.index][0]);
    }

    // La Piazza's tile is aria-disabled, NOT disabled, so it is in this list
    // on purpose: a locked door you cannot even reach is the thing the design
    // argues against, and `disabled` would take it out of the tab order.
    expect(targets.map(([id]) => id).filter((id) => !reached.has(id))).toEqual([]);
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

// THE CONTRAST GATE ITSELF.
//
// Every test above asserts the app is clean. None of them asserts the gate
// can fail — and a gate that cannot fail is the state the jsdom suite is
// permanently in, which is the whole reason this directory exists. These
// tests inject known-bad contrast into a real screen and assert the audit
// rejects it.
//
// They exist specifically because an earlier version of ./a11y.js tolerated
// `shortTextContent` and `nonBmp` on the message key alone, which let a
// VISIBLE single character and a VISIBLE bare glyph through at 2.29:1. That
// bug was invisible to every other test in this file. See the long comment
// in ./a11y.js for the measurements.
//
// #3E5C64 on #14202a is 2.29:1. Both are set explicitly on the injected
// subtree rather than inherited, so the ratio is the same in both projects
// and these tests do not depend on which palette is painting.
const BAD_FG = "#3E5C64";
const BAD_BG = "#14202a";

async function inject(page, html) {
  await page.evaluate(
    ([markup, bg]) => {
      const host = document.createElement("div");
      host.style.cssText = `background:${bg};padding:20px`;
      host.innerHTML = markup;
      document.body.appendChild(host);
    },
    [html, BAD_BG],
  );
}

test.describe("The contrast gate itself", () => {
  // Each of these was measured: the first two land in axe's `incomplete` with
  // a message key, so they are caught by assertContrastWasMeasured rather
  // than by the violation list. The third lands in `violations`. All three
  // must fail, and for the suite to mean anything the first two matter most —
  // they are the ones that used to pass.
  const CAUGHT = {
    "a visible single character": `<p style="color:${BAD_FG};font-size:16px">x</p>`,
    "a visible bare glyph": `<p style="color:${BAD_FG};font-size:16px"> → </p>`,
    "visible words": `<p style="color:${BAD_FG};font-size:16px">hello there</p>`,
  };

  for (const [what, html] of Object.entries(CAUGHT)) {
    test(`fails on ${what} at 2.29:1`, async ({ page }, testInfo) => {
      await openCity(page);
      // The screen is clean before the injection, so the rejection below is
      // the injected node and not something that was already there.
      await auditScreen(page, testInfo, "gate-baseline");

      await inject(page, html);

      await expect(auditScreen(page, testInfo, "gate-injected")).rejects.toThrow(
        /color-contrast|could not determine the painted colours/,
      );
    });
  }

  // The other half of the conjunction, and the reason the filter is not
  // simply "fail on every incomplete": Mappatura's six " · " separators and
  // five " → " glyphs are aria-hidden decoration at opacity 0.55, and WCAG
  // 1.4.3 exempts pure decoration. These must NOT fail, or the suite is red
  // on a bullet.
  test("tolerates the same shapes when they are aria-hidden decoration", async ({ page }, testInfo) => {
    await openCity(page);
    await inject(
      page,
      `<span aria-hidden="true" style="color:${BAD_FG};font-size:16px"> · </span>
       <span aria-hidden="true" style="color:${BAD_FG};font-size:16px"> → </span>
       <div aria-hidden="true"><span style="color:${BAD_FG};font-size:16px">x</span></div>`,
    );

    // The third one is nested rather than marked directly, because aria-hidden
    // is inherited down the subtree — the filter has to use closest(), and a
    // version that read the node's own attribute would fail here.
    await auditScreen(page, testInfo, "gate-decoration");
  });

  // aria-hidden is not a blanket exemption. A node axe genuinely could not
  // resolve still fails even when it is decoration, because "I could not
  // measure this" is never the same answer as "this is a bullet".
  test("still fails on an aria-hidden node axe could not resolve", async ({ page }, testInfo) => {
    await openCity(page);
    // Equal foreground and background: axe reports `equalRatio` as
    // incomplete, which is not one of the tolerated non-text keys.
    await inject(page, `<p aria-hidden="true" style="color:${BAD_BG};font-size:16px">unresolvable text here</p>`);

    await expect(auditScreen(page, testInfo, "gate-unresolvable")).rejects.toThrow(/could not determine the painted colours/);
  });
});
