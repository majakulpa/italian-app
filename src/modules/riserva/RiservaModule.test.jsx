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

// The grid is 300 real buttons, and Testing Library computes an accessible
// name for every one of them on each query. That is fine uninstrumented and
// tight against the default 5s once the coverage run is wrapped around it.
vi.setConfig({ testTimeout: 30000 });

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

// Right n times running puts an item in the top box; twice puts it in box 3,
// which is the first box coverage counts.
function study(progress, italian, times) {
  let next = progress;
  for (let i = 0; i < times; i += 1) next = reviewItem(next, vocabKey(italian), true, todayISO());
  return next;
}

const open = () => render(<RiservaModule onExit={() => {}} exitLabel="L'Officina" />);
const cell = (rank) => screen.getByRole("button", { name: new RegExp(`^posto ${rank}:`) });
const cells = () => screen.getAllByRole("button", { name: /^posto \d+:/ });

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

  // PLAN.md open question 3, on the screen it is about. The app does not hide
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
    const { container } = render(<RiservaModule onExit={() => {}} exitLabel="L'Officina" />);
    const chunks = container.textContent.split("%");

    // Ten fasce, ten percentages, and nothing else on the screen uses one.
    expect(chunks).toHaveLength(11);
    for (const chunk of chunks.slice(1)) {
      expect(chunk.startsWith(" of what this fascia is worth")).toBe(true);
    }
  });

  it("counts words in the header rather than quoting a percentage", () => {
    saveProgress(study(EMPTY, "madre", MAX_BOX));
    open();

    expect(screen.getByText("1 / 2,000 known")).toBeInTheDocument();
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
    open();

    expect(cells()).toHaveLength(FONDAMENTALE.length);
    expect(cell(1)).toBeInTheDocument();
    expect(cell(300)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^posto 301:/ })).toBeNull();
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
    const { container } = render(<RiservaModule onExit={() => {}} exitLabel="L'Officina" />);
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
// screen-reader user doesn't have.
describe("colour is never the only thing a square says", () => {
  it("names the word and its state in every square", () => {
    saveProgress(study(EMPTY, "madre", 2));
    open();

    expect(cell(252)).toHaveAccessibleName("posto 252: la madre — known");
    expect(cell(1)).toHaveAccessibleName("posto 1: essere — unseen");
  });

  it("marks the Italian headword inside a square as Italian", () => {
    open();

    expect(within(cell(1)).getByText("essere")).toHaveAttribute("lang", "it");
  });
});

describe("opening a word", () => {
  it("opens the detail from a square and comes back to the grid", async () => {
    const user = userEvent.setup({ delay: null });
    open();

    await user.click(cell(252));
    expect(screen.getByRole("heading", { name: "la madre" })).toHaveAttribute("lang", "it");

    await user.click(screen.getByRole("button", { name: /La Riserva/ }));
    expect(screen.getByRole("heading", { name: "La Riserva" })).toBeInTheDocument();
  });

  it("shows the rank and both glosses, and marks the Polish as Polish", async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(252));

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
    open();
    await user.click(cell(252));

    const entry = FONDAMENTALE.find((e) => e.rank === 252);
    expect(Object.keys(entry).sort()).toEqual(["en", "it", "pl", "rank"]);
    expect(screen.queryByText(/verbo|sostantivo|noun|verb$/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/\/[^/]*ˈ[^/]*\//);
  });
});

describe("the scheduler state", () => {
  it("says the state and the Leitner box the state came from", async () => {
    const user = userEvent.setup({ delay: null });
    saveProgress(study(EMPTY, "madre", 2));
    open();
    await user.click(cell(252));

    expect(screen.getByText("known · box 3")).toBeInTheDocument();
  });

  // A save written before the scheduler existed carries a status and no box.
  // There is a state to show and no box to show, and the pill says only what
  // it has.
  it("says the state alone when there is no schedule entry behind it", async () => {
    const user = userEvent.setup({ delay: null });
    saveProgress({ ...EMPTY, words: { [vocabKey("madre")]: "known" } });
    open();
    await user.click(cell(252));

    expect(screen.getByText("known")).toBeInTheDocument();
    expect(screen.queryByText(/box/)).toBeNull();
  });

  it("says unseen for a word nothing in the app has evidence about", async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(1));

    expect(screen.getByText("unseen")).toBeInTheDocument();
  });
});

// The design's "Torna fra 3 giorni". There is no honest answer for a word
// that has never been answered, so the row is absent rather than guessed.
describe("when it comes back", () => {
  const dueIn = (days) => ({
    version: 2,
    words: { [vocabKey("madre")]: "known" },
    schedule: { [vocabKey("madre")]: { box: 3, due: addDaysISO(todayISO(), days), last: todayISO() } },
  });

  const openDetail = async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(252));
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
  it("says today for an item that is due or overdue", async () => {
    saveProgress(dueIn(0));
    await openDetail();
    expect(screen.getByText("oggi")).toBeInTheDocument();

    saveProgress(dueIn(-9));
    await openDetail();
    expect(screen.getAllByText("oggi").length).toBeGreaterThan(0);
  });

  it("says nothing at all for a word that has never been answered", async () => {
    await openDetail();

    expect(screen.queryByText("Next review")).toBeNull();
  });
});

describe("where you met it", () => {
  it("shows the deck sentence and the story that glossed the word", async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(290));

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

    saveProgress({ ...study(EMPTY, "stazione", 1), words: { [vocabKey("stazione")]: "learning", [storyKey(a1, roma)]: "done" } });
    open();
    await user.click(cell(290));

    expect(screen.getByText("You have answered this card.")).toBeInTheDocument();
    expect(screen.getByText("You have finished this story.")).toBeInTheDocument();
  });

  it("says so in a sentence when there is nothing to show", async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(1));

    expect(screen.getByText(/Nowhere yet\./)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("says what has not been done yet, rather than leaving it blank", async () => {
    const user = userEvent.setup({ delay: null });
    open();
    await user.click(cell(290));

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
    expect(screen.getByText("20 / 2,000 known")).toBeInTheDocument();
    expect(screen.getByText("solid — 20")).toBeInTheDocument();
  });
});
