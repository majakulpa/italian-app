import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewModule from "./ReviewModule.jsx";
import { LEVELS } from "../../data/vocab.js";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import { wordKey, drillKey, loadProgress, todayISO } from "../../shared/storage.js";
import { TOKENS } from "../../shared/theme.js";
import * as speech from "../../shared/speech.js";

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories[0];
const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const topic = a1Grammar.topics[0];

const word = greetings.words[0];
const WORD_KEY = wordKey(a1Vocab, greetings, word);
const drill = topic.drills[0];
const DRILL_KEY = drillKey(a1Grammar, topic, drill);

// Seeds items as studied-but-unscheduled, which srs.js treats as due now.
function seedDue(words, schedule = {}) {
  localStorage.setItem(
    "italiano:progress:v1",
    JSON.stringify({ words, schedule, streak: { count: 0, lastDate: null } }),
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderReview = (onExit = () => {}) => render(<ReviewModule onExit={onExit} />);

describe("ReviewModule", () => {
  it("says nothing is due when the queue is empty", () => {
    renderReview();
    expect(screen.getByText("Nothing due")).toBeInTheDocument();
    expect(screen.queryByText(/^1 \//)).not.toBeInTheDocument();
  });

  it("shows an item scheduled for a future day as nothing due", () => {
    seedDue({ [WORD_KEY]: "known" }, { [WORD_KEY]: { box: 4, due: "2099-01-01", last: todayISO() } });
    renderReview();
    expect(screen.getByText("Nothing due")).toBeInTheDocument();
  });

  it("asks a due vocabulary word for its meaning, with its own level in the header", () => {
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();

    expect(screen.getByText(word.it)).toBeInTheDocument();
    expect(screen.getByText(/A1 · REVIEW/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: word.en })).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("asks a due grammar drill with its prompt and hint", () => {
    seedDue({ [DRILL_KEY]: "learning" });
    renderReview();

    expect(screen.getByText(drill.prompt)).toBeInTheDocument();
    expect(screen.getByText(drill.hint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: drill.answer })).toBeInTheDocument();
  });

  // The round trip that makes the feature worth having: answering right has
  // to move the item's box and push it out of today's queue.
  it("promotes a correct answer out of today's queue", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();

    await user.click(screen.getByRole("button", { name: word.en }));
    await user.click(screen.getByRole("button", { name: /See results/ }));

    expect(screen.getByText("Review complete")).toBeInTheDocument();

    const saved = loadProgress();
    expect(saved.words[WORD_KEY]).toBe("known");
    expect(saved.schedule[WORD_KEY].box).toBe(2);
    expect(saved.schedule[WORD_KEY].due).not.toBe(todayISO());
  });

  it("sends a wrong answer back to box 1 and lists it in the recap", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "known" }, { [WORD_KEY]: { box: 4, due: "2020-01-01", last: "2020-01-01" } });
    renderReview();

    const wrong = greetings.words.find((w) => w.en !== word.en);
    await user.click(screen.getByRole("button", { name: wrong.en }));
    await user.click(screen.getByRole("button", { name: /See results/ }));

    const saved = loadProgress();
    expect(saved.words[WORD_KEY]).toBe("learning");
    expect(saved.schedule[WORD_KEY]).toEqual({ box: 1, due: todayISO(), last: todayISO() });
    expect(screen.getByText("TO REVIEW")).toBeInTheDocument();
  });

  // Wrong or right, you should be able to see what the answer was — same
  // green/red language the vocab quiz uses, so the colours are the assertion.
  it("marks both the wrong pick and the correct option", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();

    const wrong = greetings.words.find((w) => w.en !== word.en);
    const wrongButton = screen.getByRole("button", { name: wrong.en });
    await user.click(wrongButton);

    expect(wrongButton).toHaveStyle({ color: TOKENS.corolloDeep });
    expect(screen.getByRole("button", { name: word.en })).toHaveStyle({ color: TOKENS.malachiteDeep });
  });

  it("scores a correct answer green and leaves the rest neutral", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();

    const right = screen.getByRole("button", { name: word.en });
    await user.click(right);

    const other = greetings.words.find((w) => w.en !== word.en);
    expect(right).toHaveStyle({ color: TOKENS.malachiteDeep });
    expect(screen.getByRole("button", { name: other.en })).toHaveStyle({ color: TOKENS.ink });
  });

  it("works through a mixed vocabulary and grammar queue and tallies the result", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning", [DRILL_KEY]: "learning" });
    renderReview();

    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // Math.random is pinned, so the queue order is fixed: answer whichever
    // item is on screen right, twice, and both modules get exercised.
    for (const step of [0, 1]) {
      const answer = screen.queryByRole("button", { name: word.en }) ? word.en : drill.answer;
      await user.click(screen.getByRole("button", { name: answer }));
      await user.click(screen.getByRole("button", { name: step === 0 ? /Next/ : /See results/ }));
    }

    expect(screen.getByText("Review complete")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("correct")).toBeInTheDocument();

    const saved = loadProgress();
    expect(saved.schedule[WORD_KEY].box).toBe(2);
    expect(saved.schedule[DRILL_KEY].box).toBe(2);
  });

  // Without the guard in choose(), a second click would grade the item again
  // — and clicking a wrong option after a right one would demote a box the
  // answer had just earned.
  it("ignores a second pick, leaving the first answer's box alone", async () => {
    const user = userEvent.setup();
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();

    await user.click(screen.getByRole("button", { name: word.en }));
    const wrong = greetings.words.find((w) => w.en !== word.en);
    await user.click(screen.getByRole("button", { name: wrong.en }));

    expect(screen.getByText("1 correct")).toBeInTheDocument();
    const saved = loadProgress();
    expect(saved.words[WORD_KEY]).toBe("known");
    expect(saved.schedule[WORD_KEY].box).toBe(2);
  });

  it("leaves the empty state via its own button", async () => {
    const user = userEvent.setup();
    const exits = [];
    renderReview(() => exits.push("exit"));

    await user.click(screen.getByRole("button", { name: "Back to home" }));
    expect(exits).toEqual(["exit"]);
  });

  it("leaves the summary via its own button", async () => {
    const user = userEvent.setup();
    const exits = [];
    seedDue({ [WORD_KEY]: "learning" });
    renderReview(() => exits.push("exit"));

    await user.click(screen.getByRole("button", { name: word.en }));
    await user.click(screen.getByRole("button", { name: /See results/ }));
    await user.click(screen.getByRole("button", { name: "Back to home" }));

    expect(exits).toEqual(["exit"]);
  });

  it("starts the daily streak when a session opens", () => {
    seedDue({ [WORD_KEY]: "learning" });
    renderReview();
    expect(loadProgress().streak).toEqual({ count: 1, lastDate: todayISO() });
  });

  // Nothing due means nothing was studied, so it shouldn't count as a day.
  it("does not touch the streak when nothing is due", () => {
    renderReview();
    expect(loadProgress().streak.count).toBe(0);
  });

  it("leaves via the back button", async () => {
    const user = userEvent.setup();
    const exits = [];
    seedDue({ [WORD_KEY]: "learning" });
    renderReview(() => exits.push("exit"));

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(exits).toEqual(["exit"]);
  });
});
