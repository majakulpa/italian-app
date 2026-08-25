import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard.jsx";
import { LEVELS } from "./data/vocab.js";
import { STORY_LEVELS } from "./data/stories.js";
import { wordKey, storyKey } from "./shared/storage.js";
import { reviewItem } from "./shared/srs.js";
import { LEXICON_COVERAGE } from "./shared/coverage.js";
import { CINEMA_SOLID_WORDS, DISTRICTS } from "./shared/districts.js";
import { MODULE_STATS } from "./shared/stats.js";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "./data/fondamentale.js";

// The dashboard reads storage once on mount, so every test seeds
// localStorage before rendering — the same approach App.test.jsx uses.
const KEY = "italiano:progress:v1";

function seed(words = {}, schedule = {}) {
  localStorage.setItem(KEY, JSON.stringify({ words, schedule }));
}

// Counted straight from the data file rather than through stats.js, so this
// stays an independent check of the number on L'Officina's tile.
const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

const A1_STORY = (() => {
  const level = STORY_LEVELS.find((l) => l.id === "A1");
  return storyKey(level, level.stories[0]);
})();

const A1_WORD = (() => {
  const level = LEVELS.find((l) => l.id === "A1");
  return wordKey(level, level.categories[0], level.categories[0].words[0]);
})();

// A vocab word that is also in the fondamentale list, so studying it moves the
// coverage figure. Named outright rather than discovered by re-implementing
// coverage.js's normalise() here — the old version of this helper stripped
// "il/lo/la/i/gli/le " and not "l'" or "un'", so it was a second, subtly
// different copy of production logic living in a test. Both halves of the
// overlap are asserted below, so if "bene" ever leaves either list this fails
// loudly instead of silently picking some other word.
const LEXICON_LEMMA = "bene";

const LEXICON_WORD = (() => {
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => w.it === LEXICON_LEMMA);
      if (word) return { key: wordKey(level, category, word), word };
    }
  }
  throw new Error(`no vocab word "${LEXICON_LEMMA}"`);
})();

const LEXICON_RANK = FONDAMENTALE.find((e) => e.it === LEXICON_LEMMA).rank;

// Right five times running puts an item in the top Leitner box, which is what
// "solid" means. Seeded through reviewItem so the box and the status agree
// exactly as they would after five real sessions.
function seedSolid(key) {
  let progress = { words: {}, schedule: {} };
  for (let i = 0; i < 5; i += 1) progress = reviewItem(progress, key, true, "2026-08-23");
  localStorage.setItem(KEY, JSON.stringify(progress));
  return progress;
}

const district = (name) => screen.getByRole("button", { name: new RegExp(name) });

beforeEach(() => {
  localStorage.clear();
});

// ── The headline, carried over from Phase 1 ─────────────────────────────
// It moved onto the map rather than disappearing with the dashboard, so the
// cases that pinned it move with it.
describe("the coverage headline", () => {
  it("shows a fresh account as no coverage and no solid words", () => {
    render(<Dashboard onSelect={() => {}} />);

    expect(screen.getByText(/of everyday/)).toHaveTextContent("of everyday Italian");
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText(/solid$/)).toHaveTextContent(`0 / ${FONDAMENTALE_TARGET} solid`);
  });

  // The expected percentage is worked out here from the documented formula —
  // Zipf 1/rank, normalised so the whole 2,000 comes to LEXICON_COVERAGE,
  // quoted to one decimal — rather than by calling coverage() and comparing it
  // to itself. Asking the unit under test what it expects only ever proves the
  // number reached the screen; it cannot prove the number is right, and would
  // stay green if the weighting were replaced with a word count tomorrow.
  it("shows the frequency-weighted figure once a word is solid", () => {
    seedSolid(LEXICON_WORD.key);
    render(<Dashboard onSelect={() => {}} />);

    let harmonic = 0;
    for (let r = 1; r <= FONDAMENTALE_TARGET; r += 1) harmonic += 1 / r;
    const share = LEXICON_COVERAGE / harmonic / LEXICON_RANK;
    const expected = Math.round(share * 1000) / 10;

    expect(expected).toBeGreaterThan(0);
    expect(screen.getByText(`${expected}%`)).toBeInTheDocument();
    expect(screen.getByText(/solid$/)).toHaveTextContent(`1 / ${FONDAMENTALE_TARGET} solid`);
  });

  // The overlap the two tests above rely on, asserted rather than assumed.
  it("studies a word that really is in both the deck and the lexicon", () => {
    expect(LEXICON_WORD.word.it).toBe(LEXICON_LEMMA);
    expect(FONDAMENTALE.some((e) => e.it === LEXICON_LEMMA)).toBe(true);
  });

  // A word answered right once sits in box 2 — learning, not known — so it
  // must not show up as coverage. This is the invariant that stops the
  // headline overstating what someone can actually read.
  it("leaves coverage at zero for a word answered right only once", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify(reviewItem({ words: {}, schedule: {} }, LEXICON_WORD.key, true, "2026-08-23")),
    );
    render(<Dashboard onSelect={() => {}} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText(/solid$/)).toHaveTextContent(`0 / ${FONDAMENTALE_TARGET} solid`);
  });
});

describe("the map", () => {
  it("draws every district as a button", () => {
    render(<Dashboard onSelect={() => {}} />);

    for (const { name } of DISTRICTS) {
      expect(district(name)).toBeInTheDocument();
    }
  });

  // jsdom can't see a line, and neither can a screen reader — the streets
  // carry information the district buttons don't (which place leads to which)
  // so the map has to say it in words.
  it("gives the drawn map a text alternative naming the streets", () => {
    render(<Dashboard onSelect={() => {}} />);

    const map = screen.getByRole("img");
    expect(map).toHaveAccessibleName("La Città");
    expect(map).toHaveAccessibleDescription(/L'Officina to La Piazza/);
    expect(map).toHaveAccessibleDescription(/La Piazza to Il Cinema/);
  });

  it("shows an open district its real count, not a percentage", () => {
    render(<Dashboard onSelect={() => {}} />);
    expect(district("L'Officina")).toHaveTextContent(`0 / ${TOTAL_WORDS} words`);
  });

  it("counts a known word on L'Officina's tile only", () => {
    seed({ [A1_WORD]: "known" });
    render(<Dashboard onSelect={() => {}} />);

    expect(district("L'Officina")).toHaveTextContent(`1 / ${TOTAL_WORDS} words`);
    expect(district("Il Cinema")).not.toHaveTextContent("1 /");
  });

  // A finished district swaps its icon for a tick. The tick is decorative —
  // it sits inside an aria-hidden roundel — so the tile has to say it in text
  // as well, which is what "10 / 10 dialogues" is doing. Both halves asserted,
  // because the tick alone would be colour-and-shape-only feedback.
  it("marks a finished district as finished, in text as well as in glyph", () => {
    const mod = MODULE_STATS.find((m) => m.id === "conversations");
    const total = mod.levels.flatMap((level) => mod.units(level));
    seed(Object.fromEntries(total.map((unit) => [unit.key, mod.doneStatus])));

    const { container } = render(<Dashboard onSelect={() => {}} />);
    const mercato = district("Il Mercato");

    expect(mercato).toHaveTextContent(`${total.length} / ${total.length} dialogues`);
    expect(mercato.querySelector("svg.lucide-check")).not.toBeNull();
    expect(district("L'Officina").querySelector("svg.lucide-check")).toBeNull();
    expect(container.querySelectorAll("svg.lucide-check")).toHaveLength(1);
  });

  it("opens the district you pick", async () => {
    const user = userEvent.setup();
    const picked = [];
    render(<Dashboard onSelect={(id) => picked.push(id)} />);

    await user.click(district("Il Cantiere"));
    expect(picked).toEqual(["grammar"]);
  });

  // La Piazza is how the review session is reached now that the old Review
  // band is gone — nothing else in the app routes to it.
  it("reaches the review session through La Piazza once something is due", async () => {
    const user = userEvent.setup();
    const picked = [];
    seed({ [A1_WORD]: "learning" });
    render(<Dashboard onSelect={(id) => picked.push(id)} />);

    expect(district("La Piazza")).toHaveTextContent("1 item");
    await user.click(district("La Piazza"));
    expect(picked).toEqual(["review"]);
  });
});

describe("a shut district", () => {
  it("says on the tile that it is locked, and how far away it is", () => {
    render(<Dashboard onSelect={() => {}} />);

    const cinema = district("Il Cinema");
    expect(cinema).toHaveAccessibleName(/locked/);
    expect(cinema).toHaveTextContent(`${CINEMA_SOLID_WORDS} words to go`);
  });

  // The rule the design insists on: never a padlock alone. The condition is
  // spelled out in words underneath the map, with the reason behind it.
  it("states the condition in words below the map", () => {
    render(<Dashboard onSelect={() => {}} />);

    const shut = screen.getByRole("region", { name: /Shut for now/i });
    expect(within(shut).getByText(/Il Cinema/)).toBeInTheDocument();
    expect(shut).toHaveTextContent(new RegExp(`${CINEMA_SOLID_WORDS} solid words`));
    expect(shut).toHaveTextContent(/decoding rather than reading/);
    expect(shut).toHaveTextContent(/Opens the moment a word is waiting/);
  });

  it("goes nowhere when pressed", async () => {
    const user = userEvent.setup();
    const picked = [];
    render(<Dashboard onSelect={(id) => picked.push(id)} />);

    await user.click(district("Il Cinema"));
    expect(picked).toEqual([]);
  });

  // aria-disabled rather than the disabled attribute, on purpose: a disabled
  // button drops out of the tab order, and a locked door you can't even reach
  // is the door-you-didn't-know-was-there the design argues against.
  it("stays reachable by keyboard, announced as unavailable", () => {
    render(<Dashboard onSelect={() => {}} />);

    const cinema = district("Il Cinema");
    expect(cinema).toHaveAttribute("aria-disabled", "true");
    expect(cinema).not.toBeDisabled();

    cinema.focus();
    expect(document.activeElement).toBe(cinema);
  });

  it("drops the note once the district opens", () => {
    seed({ [A1_WORD]: "learning" });
    render(<Dashboard onSelect={() => {}} />);

    const shut = screen.getByRole("region", { name: /Shut for now/i });
    expect(shut).not.toHaveTextContent(/La Piazza/);
    expect(district("La Piazza")).not.toHaveAccessibleName(/locked/);
  });

  // A story is finished rather than drilled, so reading one must not open the
  // review square — the same invariant the old Review band had.
  it("keeps La Piazza shut for a finished story", () => {
    seed({ [A1_STORY]: "done" });
    render(<Dashboard onSelect={() => {}} />);

    expect(district("La Piazza")).toHaveAccessibleName(/locked/);
  });
});
