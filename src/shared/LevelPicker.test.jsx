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
