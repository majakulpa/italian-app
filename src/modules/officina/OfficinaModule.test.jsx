import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OfficinaModule from "./OfficinaModule.jsx";
import { BENCHES } from "./benches.js";
import { MAPS } from "../../data/mappe.js";
import { LEVELS } from "../../data/vocab.js";
import { saveProgress, mappeKey, wordKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";

const zione = MAPS.find((m) => m.id === "zione");
const bench = (id) => BENCHES.find((b) => b.id === id);
const card = (id) => screen.getByRole("button", { name: new RegExp(bench(id).name) });

const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

// A word graded right `times` times running, through the module's own write
// path, so the blob is one a real learner could own.
function studied(italian, times) {
  const level = LEVELS.find((l) => l.categories.some((c) => c.words.some((w) => w.it === italian)));
  const category = level.categories.find((c) => c.words.some((w) => w.it === italian));
  const key = wordKey(level, category, category.words.find((w) => w.it === italian));

  let progress = { version: 2, words: {}, schedule: {} };
  for (let i = 0; i < times; i += 1) progress = reviewItem(progress, key, true, "2026-09-06");
  return progress;
}

// Every drill on one map known — which is what makes that map count as done
// on the hub, and the only way the maps figure can move at all.
const wholeMapKnown = (map) => Object.fromEntries(map.drills.map((d) => [mappeKey(map, d), "known"]));

beforeEach(() => {
  localStorage.clear();
});

describe("the workshop", () => {
  it("opens on the design's own heading and its Italian line", () => {
    render(<OfficinaModule onExit={() => {}} />);

    expect(screen.getByRole("heading", { name: "L'Officina" })).toHaveAttribute("lang", "it");
    expect(screen.getByText("Qui si smontano le parole.")).toHaveAttribute("lang", "it");
  });

  // Nothing checked this sentence, which is how opening La Riserva left the
  // screen reading "1 that say what they are still waiting on". It is
  // asserted against the roster rather than against a hardcoded "5 — 4 and
  // 1", so building the next bench moves the test with the screen instead of
  // failing it.
  it("counts its own benches in a sentence that reads correctly at any split", () => {
    render(<OfficinaModule onExit={() => {}} />);

    const open = BENCHES.filter((b) => b.route).length;
    expect(
      screen.getByText(
        `Here words get taken apart. ${BENCHES.length} benches — ${open} open today and ${BENCHES.length - open} not. ` +
          "A bench that is shut says what it is waiting on.",
      ),
    ).toBeInTheDocument();
  });

  it("puts every bench on the screen as its own card", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES) expect(card(b.id), b.id).toBeInTheDocument();
  });

  it("goes back to the city when asked", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<OfficinaModule onExit={() => (left = true)} />);

    await user.click(screen.getByRole("button", { name: /La Città/ }));
    expect(left).toBe(true);
  });
});

// The ruling this screen was built under: the design draws four live figures
// and three of them are drawings. A bench either counts something out of
// storage or it says what it is waiting on — nothing in between.
describe("the figures on the benches", () => {
  it("counts the vocabulary deck out of storage rather than out of the mockup", () => {
    const level = LEVELS.find((l) => l.id === "A1");
    const category = level.categories[0];
    saveProgress({ words: { [wordKey(level, category, category.words[0])]: "known" } });
    render(<OfficinaModule onExit={() => {}} />);

    expect(card("vocab")).toHaveAccessibleName(expect.stringContaining(`1 / ${TOTAL_WORDS} words`));
  });

  // The design's badge reads "4 / 8". There are four maps, so four is the
  // denominator — derived from MAPS, not copied off the drawing.
  it("counts Le Mappe against the maps that exist, not the eight in the design", () => {
    render(<OfficinaModule onExit={() => {}} />);

    expect(card("mappe")).toHaveAccessibleName(expect.stringContaining(`0 / ${MAPS.length} maps`));
    expect(MAPS.length).toBe(4);
  });

  it("counts a map as done only once every drill on it is known", () => {
    saveProgress({ words: { [mappeKey(zione, zione.drills[0])]: "known" } });
    const { unmount } = render(<OfficinaModule onExit={() => {}} />);
    expect(card("mappe")).toHaveAccessibleName(expect.stringContaining(`0 / ${MAPS.length} maps`));
    unmount();

    saveProgress({ words: wholeMapKnown(zione) });
    render(<OfficinaModule onExit={() => {}} />);
    expect(card("mappe")).toHaveAccessibleName(expect.stringContaining(`1 / ${MAPS.length} maps`));
  });

  // La Riserva counts words known or better out of the whole 2,000, through
  // the same heldWords() its own header uses — so the door and the room can't
  // disagree. Not the design's "834 / 2000", which is every word touched at
  // all: that population is larger than the one the coverage percentage is
  // made of, and this badge sits one tap from that percentage.
  it("counts La Riserva at the same bar the coverage figure is made of", () => {
    const fresh = render(<OfficinaModule onExit={() => {}} />);
    expect(card("riserva")).toHaveAccessibleName(expect.stringContaining("0 / 2000 words"));
    fresh.unmount();

    // Two answers right puts the word in box 3, which is where a word starts
    // counting. One answer — box 2 — must not move this badge.
    saveProgress(studied("madre", 1));
    const { unmount } = render(<OfficinaModule onExit={() => {}} />);
    expect(card("riserva")).toHaveAccessibleName(expect.stringContaining("0 / 2000 words"));
    unmount();

    saveProgress(studied("madre", 2));
    render(<OfficinaModule onExit={() => {}} />);
    expect(card("riserva")).toHaveAccessibleName(expect.stringContaining("1 / 2000 words"));
  });

  // The mockup's Falsi Amici reads "12 presi" and nothing records which traps
  // caught you, so it may show no count of any shape. Keyed on `count`
  // rather than on `route`: "has nothing to count" is the claim, and a bench
  // that grew a route while still counting nothing would walk straight past a
  // check written against openness.
  it("puts no counter at all on a bench with nothing behind it", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES.filter((x) => !x.count)) {
      expect(card(b.id).textContent, b.id).not.toMatch(/\d+\s*\/\s*\d+/);
    }
  });

  // None of the five may quote a figure off the drawing, counting or not.
  it("quotes none of the mockup's invented figures", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES) {
      expect(card(b.id).textContent, b.id).not.toMatch(/834|giorno 148|71%|12 presi/);
    }
  });
});

describe("a bench that is not open yet", () => {
  it("says what it is waiting on rather than showing a bare padlock", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES.filter((x) => !x.route)) {
      expect(card(b.id), b.id).toHaveAccessibleName(expect.stringContaining(b.waiting));
    }
  });

  // Same rule as a shut district on the map: aria-disabled, never `disabled`,
  // so it keeps its place in the tab order. A bench you cannot reach is a
  // bench you never knew was there.
  it("stays focusable and announces as unavailable", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES.filter((x) => !x.route)) {
      const el = card(b.id);
      expect(el, b.id).toHaveAttribute("aria-disabled", "true");
      expect(el, b.id).not.toBeDisabled();

      el.focus();
      expect(document.activeElement, b.id).toBe(el);
    }
  });

  it("does nothing when pressed", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    await user.click(card("falsi-amici"));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
  });
});

describe("opening a bench", () => {
  it("opens the vocabulary deck and comes back to the workshop, not to the city", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<OfficinaModule onExit={() => (left = true)} />);

    await user.click(card("vocab"));
    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeInTheDocument();

    // The back link says where it goes, and it goes there.
    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
    expect(left).toBe(false);
  });

  it("opens Le Mappe and comes back to the workshop", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    await user.click(card("mappe"));
    expect(screen.getByRole("heading", { name: "Le Mappe" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
  });

  // La Riserva is the one bench that opens a screen the hub renders itself
  // rather than a MODULES entry, so it is the route most likely to be wired
  // wrong — and the only way in, since it has no NavMenu entry either.
  it("opens La Riserva and comes back to the workshop", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    await user.click(card("riserva"));
    expect(screen.getByRole("heading", { name: "La Riserva" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
  });

  // The hub bench is Gli Articoli's front door — the NavMenu entry is the
  // second way in, not the first — so this is the route that has to work.
  it("opens Gli Articoli and comes back to the workshop", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    await user.click(card("articoli"));
    expect(screen.getByRole("heading", { name: "Gli Articoli" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
  });

  // The hub stays mounted while a bench is open, so its counts would freeze
  // at whatever they were when the workshop was first opened unless it
  // re-reads storage on the way back. This is the test that catches that.
  it("picks up work done on a bench without leaving the workshop", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    expect(card("vocab")).toHaveAccessibleName(expect.stringContaining(`0 / ${TOTAL_WORDS} words`));

    await user.click(card("vocab"));
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /I knew it/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: /L'Officina/ }));

    expect(card("vocab")).toHaveAccessibleName(expect.stringContaining(`1 / ${TOTAL_WORDS} words`));
  });
});
