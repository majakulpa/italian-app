import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketCard from "./TicketCard.jsx";
import { LEVEL_ACCENTS } from "./theme.js";

const level = { id: "A2", label: "A2", name: "Elementare", ...LEVEL_ACCENTS.A2 };

describe("TicketCard", () => {
  it("shows the level badge, title and subtitle", () => {
    render(<TicketCard level={level} title="At the restaurant" subtitle="Order dinner" />);

    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("LINEA")).toBeInTheDocument();
    expect(screen.getByText("At the restaurant")).toBeInTheDocument();
    expect(screen.getByText("Order dinner")).toBeInTheDocument();
  });

  // Modules pass one to three action buttons as children (Learn/Drill,
  // Flashcards/Quiz/Listen, Read, ...).
  it("renders the actions it's given and leaves them wired up", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(
      <TicketCard level={level} title="At the restaurant" subtitle="Order dinner">
        <button onClick={onStart}>Start</button>
        <button>Practice</button>
      </TicketCard>
    );

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Practice" })).toBeInTheDocument();
  });

  it("accepts a composed subtitle, not just a string", () => {
    render(
      <TicketCard
        level={level}
        title="At the restaurant"
        subtitle={
          <>
            <span>Completed</span>
            <span>4 min</span>
          </>
        }
      />
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("4 min")).toBeInTheDocument();
  });
});
