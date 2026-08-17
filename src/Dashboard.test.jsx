import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard.jsx";
import { MODULES } from "./App.jsx";
import { LEVELS } from "./data/vocab.js";
import { STORY_LEVELS } from "./data/stories.js";
import { wordKey, storyKey } from "./shared/storage.js";

// The dashboard reads storage once on mount, so every test seeds
// localStorage before rendering — the same approach App.test.jsx uses.
const KEY = "italiano:progress:v1";

function seed(words = {}, streak = { count: 0, lastDate: null }) {
  localStorage.setItem(KEY, JSON.stringify({ words, streak }));
}

// Counted straight from the data file rather than through stats.js, so this
// stays an independent check of the number on the card.
const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

const A1_STORY = (() => {
  const level = STORY_LEVELS.find((l) => l.id === "A1");
  return storyKey(level, level.stories[0]);
})();

const A1_WORD = (() => {
  const level = LEVELS.find((l) => l.id === "A1");
  return wordKey(level, level.categories[0], level.categories[0].words[0]);
})();

beforeEach(() => {
  localStorage.clear();
});

describe("Dashboard", () => {
  it("shows a fresh account as nothing done", () => {
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByText(/complete/, { selector: "p" })).toHaveTextContent("0% complete");
    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`0 / ${TOTAL_WORDS}`);
  });

  it("counts a known word on the Vocabulary card only", () => {
    seed({ [A1_WORD]: "known" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`1 / ${TOTAL_WORDS}`);
    expect(screen.getByRole("button", { name: /Stories/ })).toHaveTextContent("0 /");
  });

  it("shows the streak when one is running and hides it otherwise", () => {
    seed({}, { count: 3, lastDate: "2026-08-17" });
    const { unmount } = render(<Dashboard modules={MODULES} onSelect={() => {}} />);
    expect(screen.getByText(/3 days/)).toBeInTheDocument();

    unmount();
    localStorage.clear();
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);
    expect(screen.queryByText(/days/)).not.toBeInTheDocument();
  });

  it("draws the whole A1–C1 ladder, empty on a fresh account", () => {
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    const rungs = screen.getAllByRole("listitem");
    expect(rungs.map((r) => r.getAttribute("aria-label"))).toEqual([
      "A1 0% complete",
      "A2 0% complete",
      "B1 0% complete",
      "B2 0% complete",
      "C1 0% complete",
    ]);
  });

  // Progress at one level must move that level's rung and leave the rest
  // alone — the ladder is the only place the five levels are compared.
  it("fills the rung for the level you studied", () => {
    seed({ [A1_STORY]: "done" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByLabelText(/^A1 /).getAttribute("aria-label")).not.toBe("A1 0% complete");
    expect(screen.getByLabelText(/^A2 /)).toHaveAttribute("aria-label", "A2 0% complete");
  });

  it("opens the module you pick", async () => {
    const user = userEvent.setup();
    const picked = [];
    render(<Dashboard modules={MODULES} onSelect={(id) => picked.push(id)} />);

    await user.click(screen.getByRole("button", { name: /Grammar/ }));
    expect(picked).toEqual(["grammar"]);
  });

  // A module that isn't finished yet has no progress to report, so it keeps
  // the placeholder card instead of showing a misleading 0 / 0 bar.
  it("shows an unready module as coming soon, with no bar", async () => {
    const user = userEvent.setup();
    const modules = [...MODULES, { id: "verbs", name: "Verbs", icon: MODULES[0].icon, ready: false }];
    const picked = [];
    render(<Dashboard modules={modules} onSelect={(id) => picked.push(id)} />);

    const card = screen.getByRole("button", { name: /Verbs/ });
    expect(card).toHaveTextContent("Coming soon");
    expect(card).toBeDisabled();

    await user.click(card);
    expect(picked).toEqual([]);
  });
});
