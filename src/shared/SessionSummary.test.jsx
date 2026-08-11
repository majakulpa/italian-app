import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionSummary from "./SessionSummary.jsx";
import { LEVEL_ACCENTS } from "./theme.js";

const level = { id: "A1", label: "A1", name: "Principiante", ...LEVEL_ACCENTS.A1 };

function renderSummary(props = {}) {
  return render(
    <SessionSummary
      level={level}
      title="Quiz complete"
      primary={7}
      primaryLabel="correct out of 8"
      secondary={1}
      secondaryLabel="to review"
      onBack={() => {}}
      {...props}
    />
  );
}

describe("SessionSummary", () => {
  it("shows both tallies with their labels", () => {
    renderSummary();

    expect(screen.getByText("Quiz complete")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("correct out of 8")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
  });

  it("lists missed items under a caller-supplied heading", () => {
    renderSummary({
      missed: [{ id: "1", primary: "ciao", secondary: "hi / bye" }],
      missedHeading: "WORDS TO REVIEW",
    });

    expect(screen.getByText("WORDS TO REVIEW")).toBeInTheDocument();
    expect(screen.getByText("ciao")).toBeInTheDocument();
  });

  it("omits the review list entirely on a clean run", () => {
    renderSummary({ missed: [], missedHeading: "WORDS TO REVIEW" });

    expect(screen.queryByText("WORDS TO REVIEW")).not.toBeInTheDocument();
  });

  it("calls back with a caller-supplied button label", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderSummary({ backLabel: "Back to categories", onBack });

    await user.click(screen.getByRole("button", { name: "Back to categories" }));

    expect(onBack).toHaveBeenCalled();
  });
});
