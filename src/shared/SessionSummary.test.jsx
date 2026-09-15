import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionSummary from "./SessionSummary.jsx";
import { LEVEL_ACCENTS, TOKENS, CITY_ACCENTS, citySurface } from "./theme.js";

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

  // The bold half of a missed row is the Italian the learner didn't produce.
  // Unmarked, a screen reader reads it with English phonetics (SC 3.1.2), and
  // the caller is the only one who knows — so an omitted prop must not
  // silently become "it" either.
  it("marks the bold half of a missed row in the language the caller names", () => {
    const { rerender } = renderSummary({
      missed: [{ id: "1", primary: "ciao", secondary: "hi / bye" }],
      missedHeading: "WORDS TO REVIEW",
      missedLang: "it",
    });

    expect(screen.getByText("ciao")).toHaveAttribute("lang", "it");

    rerender(
      <SessionSummary
        level={level}
        title="Quiz complete"
        primary={7}
        primaryLabel="correct out of 8"
        secondary={1}
        secondaryLabel="to review"
        onBack={() => {}}
        missed={[{ id: "1", primary: "ciao", secondary: "hi / bye" }]}
        missedHeading="WORDS TO REVIEW"
      />
    );
    expect(screen.getByText("ciao")).not.toHaveAttribute("lang");
  });

  // Every module arrives here by pressing a button this screen then unmounts.
  // Nothing else claims focus, so it falls to <body> and the learner is at
  // the top of the document with no idea the session ended.
  it("takes focus onto its title, rather than leaving it on the body", () => {
    renderSummary({ title: "Story complete" });

    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Story complete" }));
    expect(document.activeElement).not.toBe(document.body);
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

  // The tallies were painted in TOKENS.malachite / TOKENS.corallo as text on
  // the card: fill accents, 2.50:1 in dark mode. On a city fill, each number
  // and label carries that fill's own ink — set on the node itself, because
  // jsdom can't see an inherited colour and neither can this test.
  it.each([
    ["7", "correct out of 8", "pistachio"],
    ["1", "to review", "lemon"],
  ])("paints tally %s (%s) on the %s city fill, in that fill's own ink", (figure, label, accent) => {
    renderSummary();
    const number = screen.getByText(figure);
    const caption = screen.getByText(label);

    const tile = number.parentElement.style;

    expect(tile.background).toBe(citySurface(accent).background);
    expect(tile.border).toBe(citySurface(accent).border);
    expect(tile.boxShadow).toBe(citySurface(accent).boxShadow);
    for (const node of [number, caption]) {
      expect(node.style.color).toBe(CITY_ACCENTS[accent].ink);
      expect(node.style.color).not.toBe(TOKENS.malachite);
      expect(node.style.color).not.toBe(TOKENS.corallo);
    }
  });

  it("sets the review list on a neutral city surface", () => {
    renderSummary({ missed: [{ id: "1", primary: "ciao", secondary: "hi / bye" }], missedHeading: "WORDS TO REVIEW" });

    expect(screen.getByText("WORDS TO REVIEW").parentElement.style.border).toBe(citySurface().border);
  });

  it("makes the way out a pistachio city button", () => {
    renderSummary({ backLabel: "Back to categories" });
    const button = screen.getByRole("button", { name: "Back to categories" });

    expect(button.style.background).toBe(CITY_ACCENTS.pistachio.fill);
    expect(button.style.color).toBe(CITY_ACCENTS.pistachio.ink);
    expect(button.style.border).toBe(`3px solid ${TOKENS.cityInk}`);
  });
});

// The grammar drill's items above the learner's stage were neither right nor
// to review, so the one sentence about them sits apart from both tallies.
describe("SessionSummary note", () => {
  it("draws the note in an explicit ink when given", () => {
    renderSummary({ note: "1 form was shown but not corrected — above your stage for now." });
    expect(screen.getByText("1 form was shown but not corrected — above your stage for now.").style.color).toBe(
      TOKENS.inkSoft,
    );
  });

  it("draws no note by default", () => {
    const { container } = renderSummary();
    expect(container.textContent).not.toMatch(/not corrected/);
  });
});
