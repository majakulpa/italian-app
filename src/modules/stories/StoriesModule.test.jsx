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
  // See the note in GrammarModule.test.jsx: the streak badge is shared markup,
  // so each module home has to check that it still renders its own.
  it("shows a running streak, and nothing before one has started", () => {
    const { unmount } = renderStories();
    expect(screen.queryByText(/^\d+ days?$/)).not.toBeInTheDocument();
    unmount();

    localStorage.setItem(
      "italiano:progress:v1",
      JSON.stringify({ words: {}, streak: { count: 5, lastDate: "2026-08-17" } }),
    );
    renderStories();
    expect(screen.getByText(/^5 days$/)).toBeInTheDocument();
  });

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

// The visible gloss bar, which comes and goes with the gloss. The live
// region that announces it is a separate, permanently mounted node (see
// GlossAnnouncer), so a role="status" query would no longer tell these
// tests anything about whether the bar is on screen.
const glossBar = () => screen.queryByRole("group", { name: "Word gloss" });

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
    const bar = glossBar();
    expect(within(bar).getByText("arriva")).toBeInTheDocument();
    expect(within(bar).getByText(roma.paragraphs[0].gloss.arriva)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "valigia" })[0]);
    expect(within(glossBar()).getByText(roma.paragraphs[0].gloss.valigia)).toBeInTheDocument();
    expect(screen.queryByText(roma.paragraphs[0].gloss.arriva)).not.toBeInTheDocument();
  });

  // A gloss opens without moving focus and without reflowing the page, so
  // the live region is the only thing that tells a screen-reader user it
  // happened (WCAG 2.1 SC 4.1.3). For it to be announced at all it has to
  // have been on the page, and empty, before the word was tapped — a region
  // that arrives already carrying its text has no content change to report,
  // and real screen readers stay silent. Hence the node-identity check:
  // going back to mounting the region with the gloss would pass every other
  // assertion here and still say nothing out loud.
  it("announces a gloss through a live region that was already on the page", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("");
    expect(glossBar()).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);

    expect(screen.getByRole("status")).toBe(live);
    expect(live).toHaveTextContent(`arriva: ${roma.paragraphs[0].gloss.arriva}`);

    // Swapping words is a content change in the same region, so it speaks again.
    await user.click(screen.getAllByRole("button", { name: "valigia" })[0]);
    expect(screen.getByRole("status")).toBe(live);
    expect(live).toHaveTextContent(`valigia: ${roma.paragraphs[0].gloss.valigia}`);

    // Closing empties it rather than tearing it down, so the next gloss is
    // still a change of contents in a region that's already registered.
    await user.click(screen.getByRole("button", { name: "Close gloss" }));
    expect(screen.getByRole("status")).toBe(live);
    expect(live).toHaveTextContent("");
  });

  // The headword is Italian and its meaning is English; the announcement
  // carries both, so the Italian half has to be marked (SC 3.1.2) or a
  // screen reader reads "valigia" with English phonetics.
  it("marks only the Italian half of the announcement as Italian", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);

    const live = screen.getByRole("status");
    expect(live.closest('[lang="it"]')).toBeNull();

    const italian = live.querySelector('[lang="it"]');
    expect(italian).toHaveTextContent("arriva");
    // The English meaning sits outside that span, not inside it.
    expect(italian.textContent).not.toContain(roma.paragraphs[0].gloss.arriva);
  });

  it("closes the gloss bar", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);
    await user.click(screen.getByRole("button", { name: "Close gloss" }));
    expect(glossBar()).not.toBeInTheDocument();
  });

  // The gloss bar is a fixed overlay at the bottom of the viewport, so
  // Escape is the reflex for dismissing it without hunting for the X.
  it("closes the gloss bar on Escape", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);
    expect(glossBar()).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(glossBar()).not.toBeInTheDocument();
  });

  it("keeps the gloss bar open on any other key", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getAllByRole("button", { name: "arriva" })[0]);
    await user.keyboard("a");

    expect(glossBar()).toBeInTheDocument();
  });

  it("reads a paragraph aloud without opening a gloss", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);

    await user.click(screen.getByRole("button", { name: `Pronounce "${roma.paragraphs[0].it}"` }));
    expect(speakSpy).toHaveBeenCalledWith(roma.paragraphs[0].it);
    expect(glossBar()).not.toBeInTheDocument();
  });
});

describe("Questions", () => {
  // Same double-answer guard the other graded screens have: a second click
  // must not re-grade the question or swap the explanation.
  it("ignores a second pick once an answer is in", async () => {
    const user = userEvent.setup();
    renderStories();
    await user.click(screen.getAllByRole("button", { name: /^Read/ })[0]);
    await user.click(screen.getByRole("button", { name: /Comprehension questions/ }));

    const first = roma.questions[0];
    await user.click(screen.getByRole("button", { name: first.answer }));
    const other = first.options.find((o) => o !== first.answer);
    await user.click(screen.getByRole("button", { name: other }));

    expect(screen.getByText("1 correct")).toBeInTheDocument();
    expect(screen.getByText(first.explain)).toBeInTheDocument();
  });

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
