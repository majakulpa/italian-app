import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Grid3x3 } from "lucide-react";

// Every bench on the hub is open now — La Riserva was the last shut one — so
// the shut-bench rendering has no subject in the real BENCHES list any more.
//
// It is kept rather than deleted, and this file is the reason it can be. The
// `met` word state was removed because *nothing in the app could ever write
// it*; this is a different case, because the moment any future bench ships
// before its screen does, this code is what a learner sees. PLAN.md's "Locks
// must state their condition. Never a bare padlock" is a standing rule with
// real accessibility teeth — aria-disabled rather than `disabled`, so the card
// keeps its place in the tab order — and a rule with no test is a rule that
// quietly stops being true.
//
// So the list is mocked with one shut bench, which is exactly the shape a
// fifth bench would arrive in.
const SHUT = {
  id: "detail",
  name: "Word detail",
  module: null,
  route: null,
  accent: "azzurro",
  icon: Grid3x3,
  count: null,
  blurb: "Both glosses, the scheduler's own state, and the places you met it.",
  waiting: "Not built. It wants a way in that is not pressing one of two thousand cells, and that is design 11's open question rather than this bench's.",
};

vi.mock("./benches.js", () => ({ BENCHES: [SHUT] }));

const { default: OfficinaModule } = await import("./OfficinaModule.jsx");

beforeEach(() => {
  localStorage.clear();
});

describe("a bench that is not open yet", () => {
  const card = () => screen.getByRole("button", { name: new RegExp(SHUT.name) });

  it("states what it is waiting on instead of showing a bare padlock", () => {
    render(<OfficinaModule onExit={() => {}} />);

    expect(card()).toHaveAccessibleName(expect.stringContaining(SHUT.waiting));
  });

  it("shows no counter, because it has nothing to count", () => {
    render(<OfficinaModule onExit={() => {}} />);

    expect(card().textContent).not.toMatch(/\d+\s*\/\s*\d+/);
  });

  // The accessibility half, and the reason `disabled` is wrong: a disabled
  // button drops out of the tab order, so a keyboard user never learns the
  // bench is there at all.
  it("stays focusable and announces as unavailable", () => {
    render(<OfficinaModule onExit={() => {}} />);

    const el = card();
    expect(el).toHaveAttribute("aria-disabled", "true");
    expect(el).not.toBeDisabled();

    el.focus();
    expect(document.activeElement).toBe(el);
  });

  it("does nothing when pressed", async () => {
    const user = userEvent.setup();
    render(<OfficinaModule onExit={() => {}} />);

    await user.click(card());
    expect(screen.getByRole("heading", { name: "L'Officina" })).toBeInTheDocument();
  });
});
