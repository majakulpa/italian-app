import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiservaModule from "./RiservaModule.jsx";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { LEVELS } from "../../data/vocab.js";
import { STORY_LEVELS } from "../../data/stories.js";
import { coverage } from "../../shared/coverage.js";
import { saveProgress, wordKey, storyKey, todayISO, addDaysISO } from "../../shared/storage.js";
import { reviewItem, MAX_BOX } from "../../shared/srs.js";
import * as speech from "../../shared/speech.js";

const EMPTY = { version: 2, words: {}, schedule: {} };

function vocabKey(italian) {
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => w.it === italian);
      if (word) return wordKey(level, category, word);
    }
  }
  throw new Error(`no vocab word "${italian}"`);
}

// Right n times running puts an item in box n+1: once is box 2 (learning),
// twice is box 3 (the first box coverage counts), MAX_BOX times is solid.
function study(progress, italian, times) {
  let next = progress;
  for (let i = 0; i < times; i += 1) next = reviewItem(next, vocabKey(italian), true, todayISO());
  return next;
}

const open = () => render(<RiservaModule onExit={() => {}} exitLabel="L'Officina" />);

// ── Reaching a square ────────────────────────────────────────────────────
//
// Never through getAllByRole({ name }): a name query resolves an accessible
// name for every button on the screen before it can filter, and this screen
// has 300 of them, which is tens of seconds under coverage instrumentation to
// learn something the markup already states. A square carries its rank as an
// id precisely so the grid can put focus back on it, and that id is an exact
// selector here too. The accessible name still gets checked — once, with
// toHaveAccessibleName, in the tests that are actually about the name.
const square = (container, rank) => container.querySelector(`#riserva-posto-${rank}`);
const squares = (container) => [...container.querySelectorAll("button")].filter((b) => b.textContent.startsWith("posto "));

beforeEach(() => {
  localStorage.clear();
  // jsdom has no SpeechSynthesis and the word detail carries a speaker
  // button — pretend it's there, as it is in every browser this ships to.
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the reservoir", () => {
  it("opens on the design's own heading and its Italian line", () => {
    open();

    expect(screen.getByRole("heading", { name: "La Riserva" })).toHaveAttribute("lang", "it");
    expect(screen.getByText(/In alto a sinistra c'è essere/)).toHaveAttribute("lang", "it");
  });

  it("goes back to the workshop when asked", async () => {
    const user = userEvent.setup({ delay: null });
    let left = false;
    render(<RiservaModule onExit={() => (left = true)} exitLabel="L'Officina" />);

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(left).toBe(true);
  });

  // PLAN.md open question 2, on the screen it is about. The app does not hide
  // its own ceilings, and "300 of 2,000" is the biggest one it has.
  it("says how much of the 2,000 is written", () => {
    open();

    expect(screen.getByText(/300 of the 2,000 are written so far/)).toBeInTheDocument();
    expect(FONDAMENTALE).toHaveLength(300);
    expect(FONDAMENTALE_TARGET).toBe(2000);
  });
});

// The ruling this screen was built under (PLAN.md, settled): counts and
// per-band quantities, never a single headline percentage. The frequency
// weighting puts a day-one learner near 50% of running *text*, which is
// arithmetically right and reads as "I understand half of Italian".
describe("the quantity it shows", () => {
  // The strongest form the ruling can be tested in: not "the number 1.6 is
  // absent" — fascia 7 is worth 1.6 points, so digits prove nothing — but
  // that every percent sign on the screen is followed by the denominator it
  // is a percentage of, and that denominator is one fascia.
  it("puts its denominator beside every percentage it prints", () => {
    const { container } = open();
    const chunks = container.textContent.split("%");

    // Ten fasce, ten percentages, and nothing else on the screen uses one.
    expect(chunks).toHaveLength(11);
    for (const chunk of chunks.slice(1)) {
      expect(chunk.startsWith(" of what this fascia is worth")).toBe(true);
    }
  });

  // The header pill is heldWords() — known *plus* solid — and the legend
  // right under it lists `known` and `solid` as separate counts. So the pill
  // has to say "known or better", or one screen would use one word for two
  // populations, on the one screen whose whole point is figures that cannot
  // be misread.
  it("counts words in the header, and names the population it counts", () => {
    saveProgress(study(study(EMPTY, "madre", MAX_BOX), "padre", 2));
    open();

    expect(screen.getByText("2 / 2,000 known or better")).toBeInTheDocument();
    expect(screen.getByText("known — 1")).toBeInTheDocument();
    expect(screen.getByText("solid — 1")).toBeInTheDocument();
  });

  // What a fascia is worth, in the design's own coverage points, with no
  // percent sign on it — 61.8 points of running text is a property of the
  // words, not a claim about the learner.
  it("says what each fascia is worth in coverage points", () => {
    open();

    expect(screen.getByText(/These 200 are worth 61.8 coverage points/)).toBeInTheDocument();
    expect(screen.getByText(/These 200 are worth 4.3 coverage points/)).toBeInTheDocument();
  });
});

describe("the legend", () => {
  it("names every word state and how many of the 2,000 are in it", () => {
    open();

    expect(screen.getByText("unseen — 2,000")).toBeInTheDocument();
    expect(screen.getByText("learning — 0")).toBeInTheDocument();
    expect(screen.getByText("known — 0")).toBeInTheDocument();
    expect(screen.getByText("solid — 0")).toBeInTheDocument();
  });

  it("moves a word out of unseen as it is studied", () => {
    saveProgress(study(EMPTY, "madre", MAX_BOX));
    open();

    expect(screen.getByText("unseen — 1,999")).toBeInTheDocument();
    expect(screen.getByText("solid — 1")).toBeInTheDocument();
  });
});

describe("the fasce", () => {
  it("cuts the reservoir into ten, in the design's own labelling", () => {
    open();

    expect(screen.getByText("Fascia 1 · posti 1–200")).toHaveAttribute("lang", "it");
    expect(screen.getByText("Fascia 3 · posti 401–600")).toBeInTheDocument();
    expect(screen.getByText("Fascia 10 · posti 1,801–2,000")).toBeInTheDocument();
  });

  // The whole reason the grid isn't 2,000 nodes: eight of the ten fasce have
  // nothing written in them, and 1,600 empty squares would be 1,600 nodes
  // saying what one sentence says.
  it("draws a square only for a rank the word list has reached", () => {
    const { container } = open();

    expect(squares(container)).toHaveLength(FONDAMENTALE.length);
    expect(square(container, 1)).toBeInTheDocument();
    expect(square(container, 300)).toBeInTheDocument();
    expect(square(container, 301)).toBeNull();
  });

  it("says in a sentence how much of each fascia is written", () => {
    open();

    expect(screen.getByText("200 of 200 written into the list so far.")).toBeInTheDocument();
    expect(screen.getByText("100 of 200 written into the list so far.")).toBeInTheDocument();
    expect(screen.getAllByText("0 of 200 written into the list so far.")).toHaveLength(8);
  });

  // A part-written fascia keeps its shape: the 100 unwritten ranks are drawn
  // as hairlines so the square block is honest about being half empty. They
  // are aria-hidden and unfocusable, because there is no word behind them.
  it("draws the unwritten half of a part-written fascia as inert placeholders", () => {
    const { container } = open();
    const placeholders = container.querySelectorAll('[aria-hidden="true"][style*="dashed"]');

    expect(placeholders).toHaveLength(100);
    for (const node of placeholders) expect(node.tagName).toBe("SPAN");
  });

  it("holds what the learner has, per fascia, in words", () => {
    saveProgress(study(EMPTY, "madre", MAX_BOX));
    open();

    // "la madre" is rank 252, which is fascia 2.
    expect(screen.getByText(/These 200 are worth 7.3 coverage points\. You hold 1 of them/)).toBeInTheDocument();
    expect(screen.getByText(/These 200 are worth 61.8 coverage points\. You hold 0 of them/)).toBeInTheDocument();
  });
});

// WCAG 1.4.1: a 15px square with a colour in it and nothing else would put
// the whole meaning of this screen in the one channel a colour-blind or
// screen-reader user doesn't have. jsdom paints nothing, so the colour half
// is theme.test.js's problem; what is checkable here is that every square
// says its own state in words, and that the four states really do produce
// four different names.
describe("colour is never the only thing a square says", () => {
  it("names the word and its own state in every square, across all four states", () => {
    // One word per state, each at the box that produces it: box 2 learning,
    // box 3 known, the top box solid, and a word nothing has touched.
    let progress = study(EMPTY, "madre", MAX_BOX);
    progress = study(progress, "padre", 2);
    progress = study(progress, "figlio", 1);
    saveProgress(progress);

    const { container } = open();

    expect(square(container, 252)).toHaveAccessibleName("posto 252: la madre — solid");
    expect(square(container, 253)).toHaveAccessibleName("posto 253: il padre — known");
    expect(square(container, 254)).toHaveAccessibleName("posto 254: figlio — learning");
    expect(square(container, 1)).toHaveAccessibleName("posto 1: essere — unseen");
  });

  it("marks the Italian headword inside a square as Italian", () => {
    const { container } = open();

    expect(within(square(container, 1)).getByText("essere")).toHaveAttribute("lang", "it");
  });
});

describe("opening a word", () => {
  it("opens the detail from a square and comes back to the grid", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();

    await user.click(square(container, 252));
    expect(screen.getByRole("heading", { name: "la madre" })).toHaveAttribute("lang", "it");

    await user.click(screen.getByRole("button", { name: /La Riserva/ }));
    expect(screen.getByRole("heading", { name: "La Riserva" })).toBeInTheDocument();
  });

  it("shows the rank and both glosses, and marks the Polish as Polish", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 252));

    expect(screen.getByText("posto 252")).toHaveAttribute("lang", "it");
    expect(screen.getByText("mother")).toBeInTheDocument();
    expect(screen.getByText("matka")).toHaveAttribute("lang", "pl");
  });

  // Design screen 11 puts "/ˈkjɛː.de.re/ · verbo irregolare" under the
  // headword. The data has neither, and inventing them is what benches.js
  // exists to prevent — so the omission is pinned rather than left to look
  // like something that fell out.
  it("shows no pronunciation and no part of speech, because the data has neither", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 252));

    const entry = FONDAMENTALE.find((e) => e.rank === 252);
    expect(Object.keys(entry).sort()).toEqual(["en", "it", "pl", "rank"]);
    expect(screen.queryByText(/verbo|sostantivo|noun|verb$/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/\/[^/]*ˈ[^/]*\//);
  });
});

// Opening a square unmounts the grid and coming back remounts it, so focus
// would land on <body> both ways round. Every other screen in the app does
// exactly that and gets away with it; this one puts 300 tab stops between
// <body> and anything a keyboard user wants, which is a different problem.
describe("where focus goes", () => {
  it("moves to the headword on the way in and back to the square on the way out", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();

    await user.click(square(container, 252));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "la madre" }));

    await user.click(screen.getByRole("button", { name: /La Riserva/ }));
    expect(document.activeElement).toBe(square(container, 252));
  });

  // Twice running through the same square: the grid's effect depends on a
  // value that has to change each time, and holding the bare rank would
  // restore focus the first time and silently not the second.
  it("restores focus again when the same square is opened twice", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();

    for (let visit = 0; visit < 2; visit += 1) {
      await user.click(square(container, 252));
      await user.click(screen.getByRole("button", { name: /La Riserva/ }));
      expect(document.activeElement, `visit ${visit}`).toBe(square(container, 252));
    }
  });
});

describe("the scheduler state", () => {
  it("says the state and the Leitner box the state came from", async () => {
    const user = userEvent.setup({ delay: null });
    saveProgress(study(EMPTY, "madre", 2));
    const { container } = open();
    await user.click(square(container, 252));

    expect(screen.getByText("known · box 3")).toBeInTheDocument();
  });

  // A save written before the scheduler existed carries a status and no box.
  // There is a state to show and no box to show, and the pill says only what
  // it has.
  it("says the state alone when there is no schedule entry behind it", async () => {
    const user = userEvent.setup({ delay: null });
    saveProgress({ ...EMPTY, words: { [vocabKey("madre")]: "known" } });
    const { container } = open();
    await user.click(square(container, 252));

    expect(screen.getByText("known")).toBeInTheDocument();
    expect(screen.queryByText(/box/)).toBeNull();
  });

  it("says unseen for a word nothing in the app has evidence about", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 1));

    expect(screen.getByText("unseen")).toBeInTheDocument();
  });
});

// The design's "Torna fra 3 giorni". There is no honest answer for a word
// that has never been answered, so the row is absent rather than guessed.
describe("when it comes back", () => {
  const scheduled = (entry) => ({
    version: 2,
    words: { [vocabKey("madre")]: "known" },
    schedule: { [vocabKey("madre")]: entry },
  });
  const dueIn = (days) => scheduled({ box: 3, due: addDaysISO(todayISO(), days), last: todayISO() });

  const openDetail = async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 252));
  };

  it("counts the days from today", async () => {
    saveProgress(dueIn(3));
    await openDetail();

    expect(screen.getByText("Next review")).toBeInTheDocument();
    expect(screen.getByText("fra 3 giorni")).toHaveAttribute("lang", "it");
  });

  it("says one day in the singular", async () => {
    saveProgress(dueIn(1));
    await openDetail();

    expect(screen.getByText("fra 1 giorno")).toBeInTheDocument();
  });

  // "fra 0 giorni" is not Italian, and an overdue item is not in the future
  // either. Both are today.
  it("says today for an item that is due, and for one that is overdue", async () => {
    saveProgress(dueIn(0));
    await openDetail();
    expect(screen.getByText("oggi")).toBeInTheDocument();

    saveProgress(dueIn(-9));
    await openDetail();
    expect(screen.getAllByText("oggi")).toHaveLength(2);
  });

  // A box with no due date is a save written before the scheduler grew them.
  // srs.js's isDue() calls that shape due now; so does this, rather than
  // subtracting from undefined and printing "fra NaN giorni".
  it("says today for a schedule entry that has a box and no due date", async () => {
    saveProgress(scheduled({ box: 3 }));
    await openDetail();

    expect(screen.getByText("known · box 3")).toBeInTheDocument();
    expect(screen.getByText("oggi")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN/);
  });

  it("says nothing at all for a word that has never been answered", async () => {
    await openDetail();

    expect(screen.queryByText("Next review")).toBeNull();
  });
});

describe("where you met it", () => {
  it("shows the deck sentence and the story that glossed the word", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 290));

    // "la stazione" is the one lemma both sources reach.
    expect(screen.getByText("Ci vediamo alla stazione.")).toHaveAttribute("lang", "it");
    expect(screen.getByText("See you at the station.")).toBeInTheDocument();
    expect(screen.getByText("Un giorno a Roma")).toHaveAttribute("lang", "it");
    expect(screen.getByText(/Glossed there as “station”/)).toBeInTheDocument();
  });

  it("says which of them the learner has actually done", async () => {
    const user = userEvent.setup({ delay: null });
    const a1 = STORY_LEVELS.find((l) => l.id === "A1");
    const roma = a1.stories.find((s) => s.title === "Un giorno a Roma");

    saveProgress({
      ...study(EMPTY, "stazione", 1),
      words: { [vocabKey("stazione")]: "learning", [storyKey(a1, roma)]: "done" },
    });
    const { container } = open();
    await user.click(square(container, 290));

    expect(screen.getByText("You have answered this card.")).toBeInTheDocument();
    expect(screen.getByText("You have finished this story.")).toBeInTheDocument();
  });

  it("says so in a sentence when there is nothing to show", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 1));

    expect(screen.getByText(/Nowhere yet\./)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("says what has not been done yet, rather than leaving it blank", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = open();
    await user.click(square(container, 290));

    expect(screen.getByText("You have not answered this card yet.")).toBeInTheDocument();
    expect(screen.getByText("You have not finished this story.")).toBeInTheDocument();
  });
});

// The other half of the ceiling: the reservoir does not pretend a mastered
// account has finished anything. Same tripwire coverage.test.js sets on the
// headline, in the place a learner would read it.
describe("the ceiling, on the screen", () => {
  it("shows 20 of the 2,000 for an account that has mastered the whole deck", () => {
    let progress = EMPTY;
    for (const level of LEVELS) {
      for (const category of level.categories) {
        for (const word of category.words) progress = study(progress, word.it, MAX_BOX);
      }
    }
    saveProgress(progress);
    open();

    expect(coverage(progress).counts.solid).toBe(20);
    expect(screen.getByText("20 / 2,000 known or better")).toBeInTheDocument();
    expect(screen.getByText("solid — 20")).toBeInTheDocument();
  });
});
