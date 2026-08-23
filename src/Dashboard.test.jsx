import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard.jsx";
import { MODULES } from "./App.jsx";
import { LEVELS } from "./data/vocab.js";
import { STORY_LEVELS } from "./data/stories.js";
import { wordKey, storyKey } from "./shared/storage.js";
import { reviewItem } from "./shared/srs.js";
import { coverage } from "./shared/coverage.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "./data/fondamentale.js";

// The dashboard reads storage once on mount, so every test seeds
// localStorage before rendering — the same approach App.test.jsx uses.
const KEY = "italiano:progress:v1";

function seed(words = {}, schedule = {}) {
  localStorage.setItem(KEY, JSON.stringify({ words, schedule }));
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

// A vocab word that is also in the fondamentale list, so studying it moves
// the coverage figure. Found rather than hardcoded: which of the 120 vocab
// words overlap the lexicon changes as the lexicon grows past 300.
const LEXICON_WORD = (() => {
  const lemmas = new Set(FONDAMENTALE.map((e) => e.it.replace(/^(il|lo|la|i|gli|le) /, "")));
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => lemmas.has(w.it));
      if (word) return { key: wordKey(level, category, word), word };
    }
  }
  throw new Error("no vocab word overlaps the fondamentale list");
})();

// Right five times running puts an item in the top Leitner box, which is what
// "solid" means. Seeded through reviewItem so the box and the status agree
// exactly as they would after five real sessions.
function seedSolid(key) {
  let progress = { words: {}, schedule: {} };
  for (let i = 0; i < 5; i += 1) progress = reviewItem(progress, key, true, "2026-08-23");
  localStorage.setItem(KEY, JSON.stringify(progress));
  return progress;
}

beforeEach(() => {
  localStorage.clear();
});

describe("Dashboard", () => {
  it("shows a fresh account as no coverage and no solid words", () => {
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByText(/of everyday Italian/)).toHaveTextContent("0% of everyday Italian");
    expect(screen.getByText(/solid$/)).toHaveTextContent(`0 / ${FONDAMENTALE_TARGET} solid`);
    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`0 / ${TOTAL_WORDS}`);
  });

  // The headline the streak and the "% complete" figure were replaced with.
  // It has to be the frequency-weighted number, not a word count, so the test
  // reads the expected value out of coverage.js rather than hardcoding a
  // percentage that would drift the moment the lexicon grows.
  it("shows the coverage figure and the solid-word count once a word is solid", () => {
    const progress = seedSolid(LEXICON_WORD.key);
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    const expected = coverage(progress);
    expect(expected.pct).toBeGreaterThan(0);
    expect(screen.getByText(/of everyday Italian/)).toHaveTextContent(`${expected.pct}% of everyday Italian`);
    expect(screen.getByText(/solid$/)).toHaveTextContent(`1 / ${FONDAMENTALE_TARGET} solid`);
  });

  // A word answered right once sits in box 2 — learning, not known — so it
  // must not show up as coverage. This is the invariant that stops the
  // headline overstating what someone can actually read.
  it("leaves coverage at zero for a word answered right only once", () => {
    localStorage.setItem(KEY, JSON.stringify(reviewItem({ words: {}, schedule: {} }, LEXICON_WORD.key, true, "2026-08-23")));
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByText(/of everyday Italian/)).toHaveTextContent("0% of everyday Italian");
    expect(screen.getByText(/solid$/)).toHaveTextContent(`0 / ${FONDAMENTALE_TARGET} solid`);
  });

  it("counts a known word on the Vocabulary card only", () => {
    seed({ [A1_WORD]: "known" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`1 / ${TOTAL_WORDS}`);
    expect(screen.getByRole("button", { name: /Stories/ })).toHaveTextContent("0 /");
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

  // The band is an action, so a permanent "0 due" row would be a nag that
  // tells you nothing — it stays hidden until something is actually waiting.
  it("hides the review band when nothing is due", () => {
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);
    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
  });

  it("shows the review band with a count once items are due", () => {
    seed({ [A1_WORD]: "learning" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Review/ })).toHaveTextContent("1 item due today");
  });

  it("pluralises the count past one", () => {
    const level = LEVELS.find((l) => l.id === "A1");
    const second = wordKey(level, level.categories[0], level.categories[0].words[1]);
    seed({ [A1_WORD]: "learning", [second]: "learning" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /Review/ })).toHaveTextContent("2 items due today");
  });

  it("counts only what is actually due, not everything studied", () => {
    seed({ [A1_WORD]: "known" }, { [A1_WORD]: { box: 4, due: "2099-01-01", last: "2026-08-17" } });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
  });

  it("opens the review session from the band", async () => {
    const user = userEvent.setup();
    const picked = [];
    seed({ [A1_WORD]: "learning" });
    render(<Dashboard modules={MODULES} onSelect={(id) => picked.push(id)} />);

    await user.click(screen.getByRole("button", { name: /Review/ }));
    expect(picked).toEqual(["review"]);
  });

  // A story is finished, not scheduled — it must never produce a review.
  it("ignores stories and dialogues when counting what's due", () => {
    seed({ [A1_STORY]: "done" });
    render(<Dashboard modules={MODULES} onSelect={() => {}} />);

    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
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
