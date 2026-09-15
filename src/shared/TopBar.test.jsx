import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopBar from "./TopBar.jsx";
import { LEVEL_ACCENTS } from "./theme.js";

const level = { id: "A1", label: "A1", name: "Principiante", ...LEVEL_ACCENTS.A1 };

describe("TopBar", () => {
  // The uppercase is CSS, not a string method: the DOM keeps the authored
  // case (which is what a screen reader should read) and the page still
  // paints it in capitals.
  it("shows the level next to a label painted in capitals", () => {
    render(<TopBar level={level} label="At the café" onBack={() => {}} />);

    const header = screen.getByText("A1 · At the café");
    expect(header).toHaveStyle({ textTransform: "uppercase" });
  });

  // label.toUpperCase() made the prop string-only, so an Italian topic name
  // could never carry lang="it" here (WCAG 3.1.2).
  it("takes a marked-up label and keeps its language tag", () => {
    render(<TopBar level={level} label={<span lang="it">Gli articoli</span>} onBack={() => {}} />);

    expect(screen.getByText("Gli articoli")).toHaveAttribute("lang", "it");
    expect(screen.getByText("Gli articoli").closest("p")).toHaveTextContent("A1 · Gli articoli");
  });

  // Rule 4 of the city: the level owns its hue, and text takes accentDeep.
  it("paints the header in the level's deep accent", () => {
    render(<TopBar level={level} label="At the café" onBack={() => {}} />);

    expect(screen.getByText("A1 · At the café")).toHaveStyle({ color: LEVEL_ACCENTS.A1.accentDeep });
  });

  // The icon-only back button needs its accessible name from aria-label.
  it("goes back when the arrow is pressed", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<TopBar level={level} label="At the café" onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
