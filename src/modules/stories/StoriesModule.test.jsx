import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StoriesModule from "./StoriesModule.jsx";
import { STORY_LEVELS } from "../../data/stories.js";
import * as speech from "../../shared/speech.js";

const a1 = STORY_LEVELS.find((l) => l.id === "A1");
const roma = a1.stories.find((s) => s.id === "roma");
const b1 = STORY_LEVELS.find((l) => l.id === "B1");

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderStories() {
  return render(<StoriesModule onExit={() => {}} />);
}

// Open a story and answer every comprehension question correctly.
async function completeStory(user) {
  await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
  await user.click(screen.getByRole("button", { name: /Comprehension questions/ }));
  for (const q of roma.questions) {
    await user.click(screen.getByRole("button", { name: q.answer }));
    await user.click(screen.getByRole("button", { name: /See results|Next question/ }));
  }
}

describe("StoriesHome", () => {
  it("shows A1 stories by default with their taglines and reading time", () => {
    renderStories();
    expect(screen.getByText("Stories")).toBeInTheDocument();
    expect(screen.getByText("Un giorno a Roma")).toBeInTheDocument();
    expect(screen.getByText("La lucertola e la luna")).toBeInTheDocument();
    expect(screen.getByText(roma.tagline)).toBeInTheDocument();
    // Both A1 stories happen to be the same length, so match on count.
    expect(screen.getAllByText(`${roma.minutes} min`)).toHaveLength(a1.stories.length);
  });

  it("switches stories when a different level is selected", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getByRole("button", { name: /Intermedio/ }));
    for (const story of b1.stories) {
      expect(screen.getByText(story.title)).toBeInTheDocument();
    }
    expect(screen.queryByText("Un giorno a Roma")).not.toBeInTheDocument();
  });
});

describe("Reader", () => {
  it("renders the whole story with English hidden", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    // Every paragraph is on the page at once — it's a reader, not a pager.
    for (const paragraph of roma.paragraphs) {
      expect(screen.queryByText(paragraph.en)).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Show translation" })).toHaveLength(roma.paragraphs.length);
  });

  it("reveals only the paragraph whose translation was tapped", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    const [firstToggle] = screen.getAllByRole("button", { name: "Show translation" });
    await user.click(firstToggle);

    expect(screen.getByText(roma.paragraphs[0].en)).toBeInTheDocument();
    expect(screen.queryByText(roma.paragraphs[1].en)).not.toBeInTheDocument();
  });

  it("opens the gloss bar with the meaning of a tapped word, and swaps it for the next one", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);
    const bar = screen.getByRole("status");
    expect(within(bar).getByText("arriva")).toBeInTheDocument();
    expect(within(bar).getByText(roma.paragraphs[0].gloss.arriva)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "valigia" })[0]);
    expect(within(screen.getByRole("status")).getByText(roma.paragraphs[0].gloss.valigia)).toBeInTheDocument();
    expect(screen.queryByText(roma.paragraphs[0].gloss.arriva)).not.toBeInTheDocument();
  });

  it("closes the gloss bar", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);
    await user.click(screen.getByRole("button", { name: "Close gloss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reads a paragraph aloud without opening a gloss", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getByRole("button", { name: `Pronounce "${roma.paragraphs[0].it}"` }));
    expect(speakSpy).toHaveBeenCalledWith(roma.paragraphs[0].it);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Questions", () => {
  it("shows the explanation after an answer and counts correct picks", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await user.click(screen.getByRole("button", { name: /Comprehension questions/ }));

    const first = roma.questions[0];
    expect(screen.getByText(first.prompt)).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: first.answer }));
    expect(screen.getByText(first.explain)).toBeInTheDocument();
    expect(screen.getByText("1 correct")).toBeInTheDocument();
  });

  it("completes the story, shows the summary, and persists completion", async () => {
    const user = userEvent.setup();
    renderStories();
    await completeStory(user);

    expect(screen.getByText("Story complete")).toBeInTheDocument();
    expect(screen.getByText("correct out of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to stories" }));
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Read again/ })).toBeInTheDocument();
  });

  it("lists a missed question with its explanation in the summary", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await user.click(screen.getByRole("button", { name: /Comprehension questions/ }));

    for (const q of roma.questions) {
      const wrong = q.options.find((o) => o !== q.answer);
      await user.click(screen.getByRole("button", { name: wrong }));
      await user.click(screen.getByRole("button", { name: /See results|Next question/ }));
    }

    expect(screen.getByText("QUESTIONS TO REVIEW")).toBeInTheDocument();
    // SessionSummary renders "<strong>answer</strong> — explanation", so the
    // line is split across elements and needs a textContent matcher.
    for (const q of roma.questions) {
      expect(
        screen.getByText((_, el) => el?.tagName === "P" && el.textContent === `${q.answer} — ${q.explain}`)
      ).toBeInTheDocument();
    }
  });
});
