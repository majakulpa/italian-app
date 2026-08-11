import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopBar from "./TopBar.jsx";
import { LEVEL_ACCENTS } from "./theme.js";

const level = { id: "A1", label: "A1", name: "Principiante", ...LEVEL_ACCENTS.A1 };

describe("TopBar", () => {
  it("shows the level next to an upper-cased label", () => {
    render(<TopBar level={level} label="At the café" onBack={() => {}} />);

    expect(screen.getByText("A1 · AT THE CAFÉ")).toBeInTheDocument();
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
