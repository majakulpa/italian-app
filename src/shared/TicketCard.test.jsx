import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketCard from "./TicketCard.jsx";
import { LEVEL_ACCENTS, TOKENS, citySurface } from "./theme.js";

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

  // La Città: the ticket goes through citySurface() rather than hand-rolling
  // its border and shadow, so it can't drift from the map's tiles.
  it("is a city surface: 3px edge, 18px radius, hard shadow, flat card fill", () => {
    const { container } = render(<TicketCard level={level} title="At the restaurant" subtitle="Order dinner" />);
    const surface = citySurface();

    const card = container.firstChild.style;

    expect(card.border).toBe(surface.border);
    expect(card.borderRadius).toBe(`${surface.borderRadius}px`);
    expect(card.boxShadow).toBe(surface.boxShadow);
    expect(card.background).toBe(surface.background);
  });

  // The perforation is decoration: it draws in the hairline, not the control
  // boundary, and screen readers skip it.
  it("draws the perforation in the decorative hairline, hidden from assistive tech", () => {
    render(<TicketCard level={level} title="At the restaurant" subtitle="Order dinner" />);
    const perforation = screen.getByTestId("perforation");

    expect(perforation.style.borderLeft).toBe(`2px dashed ${TOKENS.line}`);
    expect(perforation).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the stub in the level's line colour, under white text", () => {
    render(<TicketCard level={level} title="At the restaurant" subtitle="Order dinner" />);
    const stub = screen.getByText("LINEA").parentElement;

    expect(stub.style.background).toBe(LEVEL_ACCENTS.A2.accent);
    expect(stub.style.color).toBe("rgb(255, 255, 255)");
  });
});
