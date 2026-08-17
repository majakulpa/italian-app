import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VocabModule from "./VocabModule.jsx";
import { LEVELS } from "../../data/vocab.js";
import { TOKENS } from "../../shared/theme.js";
import { loadProgress, wordKey, todayISO } from "../../shared/storage.js";
import * as speech from "../../shared/speech.js";

const a1 = LEVELS.find((l) => l.id === "A1");
const greetings = a1.categories.find((c) => c.id === "greetings");

beforeEach(() => {
  localStorage.clear();
  // shuffle() uses Math.random via Fisher-Yates; a value just under 1 makes
  // every swap a no-op (j always equals i), so word/option order stays
  // exactly as authored in data/vocab.js and tests can assert on it.
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  // jsdom has no SpeechSynthesis API — pretend it's supported (as in every
  // real browser this app targets) so speaker buttons and Listen mode render.
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderVocab(onExit = () => {}) {
  return render(<VocabModule onExit={onExit} />);
}

describe("VocabHome", () => {
  it("shows A1 categories by default with word counts", () => {
    renderVocab();
    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Greetings & basics")).toBeInTheDocument();
    expect(screen.getByText("Family")).toBeInTheDocument();
    // Both A1 categories happen to have 12 words each.
    expect(screen.getAllByText(`${greetings.words.length} parole`)).toHaveLength(a1.categories.length);
  });

  it("switches categories when a different level is selected", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getByRole("button", { name: /Elementare/ }));
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.queryByText("Greetings & basics")).not.toBeInTheDocument();
  });

  it("has no streak badge and no known-count until something is studied", () => {
    renderVocab();
    expect(screen.queryByText(/^\d+ days?$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(`${greetings.words.length} parole`).length).toBeGreaterThan(0);
  });

  it("hides the Listen button when speech isn't supported, but keeps Cards/Quiz", () => {
    speech.isSpeechSupported.mockReturnValue(false);
    renderVocab();
    expect(screen.queryByRole("button", { name: /Listen/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cards" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Quiz" })[0]).toBeInTheDocument();
  });
});

describe("Flashcards", () => {
  it("flips a card to reveal the translation and example sentence", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    const firstWord = greetings.words[0];
    expect(screen.getByText(firstWord.it)).toBeInTheDocument();

    await user.click(screen.getByText("Tap to reveal translation"));
    expect(screen.getByText(firstWord.en)).toBeInTheDocument();
    expect(screen.getByText(`"${firstWord.ex}"`)).toBeInTheDocument();
  });

  // The other half of the flashcard grade: "Still learning" has to advance
  // without counting as known, and — since the scheduler went in — has to
  // leave the word in box 1 so it comes straight back in the next review.
  it("marking a word still learning advances without counting it as known", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /Still learning/ }));

    expect(screen.getByText("0 known")).toBeInTheDocument();
    expect(screen.getByText(greetings.words[1].it)).toBeInTheDocument();

    const saved = loadProgress();
    const key = wordKey(a1, greetings, greetings.words[0]);
    expect(saved.words[key]).toBe("learning");
    expect(saved.schedule[key].box).toBe(1);
  });

  // Every vocab answer now goes through srs.reviewItem, so studying normally
  // is what fills the review queue — nothing else in this module's tests
  // would notice if that wiring came undone.
  it("schedules a word into box 2 when it's marked known", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /I knew it/ }));

    const saved = loadProgress();
    const key = wordKey(a1, greetings, greetings.words[0]);
    expect(saved.schedule[key].box).toBe(2);
    expect(saved.schedule[key].due).not.toBe(todayISO());
  });

  it("marking a word known increases the known count and advances to the next card", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /I knew it/ }));

    expect(screen.getByText("1 known")).toBeInTheDocument();
    expect(screen.getByText(`2 / ${greetings.words.length}`)).toBeInTheDocument();
    expect(screen.getByText(greetings.words[1].it)).toBeInTheDocument();
  });

  it("completes the deck, shows a summary, and persists known words", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);

    for (let i = 0; i < greetings.words.length; i++) {
      await user.click(screen.getByText("Tap to reveal translation"));
      await user.click(screen.getByRole("button", { name: /I knew it/ }));
    }

    expect(screen.getByText("Deck complete")).toBeInTheDocument();
    expect(screen.getByText("marked known")).toBeInTheDocument();
    expect(screen.getByText(String(greetings.words.length))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to categories" }));
    expect(screen.getByText(`${greetings.words.length} / ${greetings.words.length} known`)).toBeInTheDocument();
  });
});

describe("Quiz", () => {
  // Every graded screen guards against a second pick. Without it a stray
  // double-click would grade the item twice — and since answers now move a
  // Leitner box, a second click on a wrong option would undo the promotion
  // the first click had just earned.
  it("ignores a second pick once an answer is in", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);

    const word0 = greetings.words[0];
    await user.click(screen.getByRole("button", { name: word0.en }));
    const other = greetings.words.find((w) => w.en !== word0.en);
    await user.click(screen.getByRole("button", { name: other.en }));

    expect(screen.getByText("1 correct")).toBeInTheDocument();
    expect(loadProgress().schedule[wordKey(a1, greetings, word0)].box).toBe(2);
  });

  it("marks a correct answer, updates the score, and moves to the next question", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);

    const word0 = greetings.words[0];
    expect(screen.getByText(word0.it)).toBeInTheDocument();

    const correctButton = screen.getByRole("button", { name: word0.en });
    await user.click(correctButton);

    expect(screen.getByText("1 correct")).toBeInTheDocument();
    expect(correctButton).toHaveStyle({ color: TOKENS.malachiteDeep });

    await user.click(screen.getByRole("button", { name: /Next word/ }));
    expect(screen.getByText(greetings.words[1].it)).toBeInTheDocument();
  });

  it("marks a wrong answer, highlighting both the pick and the correct option", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);

    // With shuffle() mocked to be a no-op, distractors are the next words
    // in category order, so word1's translation is guaranteed to be a
    // wrong option for word0's question.
    const word0 = greetings.words[0];
    const word1 = greetings.words[1];

    const wrongButton = screen.getByRole("button", { name: word1.en });
    await user.click(wrongButton);

    expect(screen.getByText("0 correct")).toBeInTheDocument();
    expect(wrongButton).toHaveStyle({ color: TOKENS.corolloDeep });
    expect(screen.getByRole("button", { name: word0.en })).toHaveStyle({ color: TOKENS.malachiteDeep });
  });

  it("completes the quiz and lists missed words for review", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: "Quiz" })[0]);

    const word0 = greetings.words[0];
    const word1 = greetings.words[1];

    // Get question 0 wrong on purpose.
    await user.click(screen.getByRole("button", { name: word1.en }));
    await user.click(screen.getByRole("button", { name: /Next word|See results/ }));

    // Answer the rest correctly.
    for (let i = 1; i < greetings.words.length; i++) {
      const word = greetings.words[i];
      await user.click(screen.getByRole("button", { name: word.en }));
      await user.click(screen.getByRole("button", { name: /Next word|See results/ }));
    }

    expect(screen.getByText("Quiz complete")).toBeInTheDocument();
    expect(screen.getByText(`correct out of ${greetings.words.length}`)).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
    expect(screen.getByText("WORDS TO REVIEW")).toBeInTheDocument();
    expect(screen.getByText(word0.it)).toBeInTheDocument();
  });
});

describe("ListeningQuiz", () => {
  it("ignores a second pick once an answer is in", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    const word0 = greetings.words[0];
    await user.click(screen.getByRole("button", { name: word0.en }));
    const other = greetings.words.find((w) => w.en !== word0.en);
    await user.click(screen.getByRole("button", { name: other.en }));

    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  it("auto-plays the word and lets the user replay it", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    const word0 = greetings.words[0];
    expect(speech.speakItalian).toHaveBeenCalledWith(word0.it);

    speech.speakItalian.mockClear();
    await user.click(screen.getByRole("button", { name: "Play again" }));
    expect(speech.speakItalian).toHaveBeenCalledWith(word0.it);
  });

  it("does not reveal the Italian word until an answer is chosen", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    const word0 = greetings.words[0];
    expect(screen.queryByText(word0.it)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: word0.en }));
    expect(screen.getByText(word0.it)).toBeInTheDocument();
  });

  it("marks a correct answer, updates the score, and auto-plays the next word", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    const word0 = greetings.words[0];
    const word1 = greetings.words[1];
    await user.click(screen.getByRole("button", { name: word0.en }));
    expect(screen.getByText("1 correct")).toBeInTheDocument();

    speech.speakItalian.mockClear();
    await user.click(screen.getByRole("button", { name: /Next word/ }));
    expect(speech.speakItalian).toHaveBeenCalledWith(word1.it);
  });

  it("marks a wrong answer without crediting the score", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    // With shuffle() mocked to be a no-op, word1's translation is guaranteed
    // to be a wrong option for word0's question (see the Quiz tests above).
    const word1 = greetings.words[1];
    await user.click(screen.getByRole("button", { name: word1.en }));

    expect(screen.getByText("0 correct")).toBeInTheDocument();
  });

  it("completes the session, shows a summary, and persists known words", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    for (const word of greetings.words) {
      await user.click(screen.getByRole("button", { name: word.en }));
      await user.click(screen.getByRole("button", { name: /Next word|See results/ }));
    }

    expect(screen.getByText("Listening complete")).toBeInTheDocument();
    expect(screen.getByText(`correct out of ${greetings.words.length}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to categories" }));
    expect(screen.getByText(`${greetings.words.length} / ${greetings.words.length} known`)).toBeInTheDocument();
  });

  it("lists missed words for review at the end", async () => {
    const user = userEvent.setup();
    renderVocab();
    await user.click(screen.getAllByRole("button", { name: /Listen/ })[0]);

    const word0 = greetings.words[0];
    const word1 = greetings.words[1];

    // Get question 0 wrong on purpose.
    await user.click(screen.getByRole("button", { name: word1.en }));
    await user.click(screen.getByRole("button", { name: /Next word|See results/ }));

    // Answer the rest correctly.
    for (let i = 1; i < greetings.words.length; i++) {
      const word = greetings.words[i];
      await user.click(screen.getByRole("button", { name: word.en }));
      await user.click(screen.getByRole("button", { name: /Next word|See results/ }));
    }

    expect(screen.getByText("Listening complete")).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
    expect(screen.getByText("WORDS TO REVIEW")).toBeInTheDocument();
    expect(screen.getByText(word0.it)).toBeInTheDocument();
  });
});
