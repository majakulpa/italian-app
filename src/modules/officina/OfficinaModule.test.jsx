import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OfficinaModule from "./OfficinaModule.jsx";
import { BENCHES } from "./benches.js";
import { MAPS } from "../../data/mappe.js";
import { LEVELS } from "../../data/vocab.js";
import { saveProgress, mappeKey, wordKey } from "../../shared/storage.js";

const zione = MAPS.find((m) => m.id === "zione");
const bench = (id) => BENCHES.find((b) => b.id === id);
const card = (id) => screen.getByRole("button", { name: new RegExp(bench(id).name) });

const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

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

  // The mockup's La Riserva reads "834 / 2000", Gli Articoli "giorno 148 …
  // 71% ↑" and Falsi Amici "12 presi". None of the three has a data source,
  // so none of them may show a count of any shape.
  //
  // Keyed on `module` rather than on `route`: "has nothing to count" is the
  // claim, and a bench that grew a route while still counting nothing would
  // walk straight past a check written against openness.
  it("puts no counter at all on a bench with nothing behind it", () => {
    render(<OfficinaModule onExit={() => {}} />);

    for (const b of BENCHES.filter((x) => !x.module)) {
      expect(card(b.id).textContent, b.id).not.toMatch(/\d+\s*\/\s*\d+/);
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

  it("names the decision La Riserva is blocked on, not just that it is blocked", () => {
    render(<OfficinaModule onExit={() => {}} />);

    expect(card("riserva")).toHaveAccessibleName(/which quantity it shows/);
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

    await user.click(card("riserva"));
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
