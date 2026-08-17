import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LevelPicker from "./LevelPicker.jsx";
import { LEVEL_ACCENTS } from "./theme.js";

const LEVELS = [
  { id: "A1", label: "A1", name: "Principiante", ...LEVEL_ACCENTS.A1 },
  { id: "A2", label: "A2", name: "Elementare", ...LEVEL_ACCENTS.A2 },
  { id: "B1", label: "B1", name: "Intermedio", ...LEVEL_ACCENTS.B1 },
];

describe("LevelPicker", () => {
  it("renders one roundel per level", () => {
    render(<LevelPicker levels={LEVELS} active={LEVELS[0]} onSelect={() => {}} />);

    for (const level of LEVELS) {
      expect(screen.getByRole("button", { name: new RegExp(level.name) })).toBeInTheDocument();
    }
  });

  it("hands the whole level object back on a pick", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<LevelPicker levels={LEVELS} active={LEVELS[0]} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /Intermedio/ }));

    expect(onSelect).toHaveBeenCalledWith(LEVELS[2]);
  });

  // The active pill is a tinted background + colored border rather than a
  // solid accent fill — a solid fill under accentDeep text fails contrast.
  it("marks only the active level, without filling it with the accent color", () => {
    render(<LevelPicker levels={LEVELS} active={LEVELS[1]} onSelect={() => {}} />);

    const active = screen.getByRole("button", { name: /Elementare/ });
    const inactive = screen.getByRole("button", { name: /Principiante/ });

    expect(active.style.background).toContain("color-mix");
    expect(active.style.background).not.toBe(LEVEL_ACCENTS.A2.accent);
    expect(inactive.style.background).toBe("transparent");
  });
});

// The picker is the one screen where every level appears at once, so it's
// where a newly added level shows up wrong first — an accent that doesn't
// resolve, or a fifth roundel that pushes the row off screen.
describe("LevelPicker with the full ladder", () => {
  const FULL = Object.entries(LEVEL_ACCENTS).map(([id, accents]) => ({
    id,
    label: id,
    name: `Livello ${id}`,
    ...accents,
  }));

  it("renders a roundel for every level the theme declares an accent for", () => {
    render(<LevelPicker levels={FULL} active={FULL[0]} onSelect={() => {}} />);

    expect(screen.getAllByRole("button")).toHaveLength(FULL.length);
    for (const level of FULL) {
      expect(screen.getByRole("button", { name: new RegExp(level.name) })).toBeInTheDocument();
    }
  });

  it("wraps instead of overflowing once the ladder outgrows one row", () => {
    const { container } = render(<LevelPicker levels={FULL} active={FULL[0]} onSelect={() => {}} />);

    expect(container.firstChild.style.flexWrap).toBe("wrap");
  });

  // accent is for the roundel fill (white text on it), accentDeep for the
  // pill's own text — swapping them is the contrast bug theme.js warns
  // about, and it has to hold for every level, new ones included.
  it.each(Object.keys(LEVEL_ACCENTS))("pairs %s's accent fill with accentDeep text", (id) => {
    const active = FULL.find((l) => l.id === id);
    render(<LevelPicker levels={FULL} active={active} onSelect={() => {}} />);

    const pill = screen.getByRole("button", { name: new RegExp(active.name) });
    expect(pill.style.color).toBe(LEVEL_ACCENTS[id].accentDeep);

    const roundel = pill.querySelector("span");
    expect(roundel.style.background).toBe(LEVEL_ACCENTS[id].accent);
    expect(roundel.style.color).toBe("rgb(255, 255, 255)");
  });
});
