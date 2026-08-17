import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { LEVELS } from "./data/vocab.js";

const TOTAL_WORDS = LEVELS.flatMap((l) => l.categories).flatMap((c) => c.words).length;

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("shows the module menu with every module enabled", () => {
    render(<App />);
    expect(screen.getByText("Italiano")).toBeInTheDocument();

    for (const name of ["Vocabulary", "Grammar", "Conversations", "Stories"]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeEnabled();
    }
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  // The dashboard reads storage once per mount rather than subscribing to it,
  // which only works because App unmounts it while a module is open. If that
  // ever changes to keeping the dashboard mounted, its numbers would freeze at
  // whatever they were when the app started, and this is the test that catches
  // it — the module-level tests all render their module in isolation.
  it("updates the dashboard after you study and come back", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`0 / ${TOTAL_WORDS}`);
    expect(screen.queryByText(/^\d+ days?$/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    await user.click(screen.getAllByRole("button", { name: "Cards" })[0]);
    await user.click(screen.getByText("Tap to reveal translation"));
    await user.click(screen.getByRole("button", { name: /I knew it/ }));

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: /All modules/ }));

    expect(screen.getByRole("button", { name: /Vocabulary/ })).toHaveTextContent(`1 / ${TOTAL_WORDS}`);
    // Opening the deck also started the daily streak, so the dashboard's
    // header picks that up on the same remount.
    expect(screen.getByText(/^1 day$/)).toBeInTheDocument();
  });

  it("opens the Vocabulary module and returns to the menu via its back button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    expect(screen.getByText("Parole in viaggio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByText("Benvenuto")).toBeInTheDocument();
  });

  it("opens the Grammar module and returns to the menu via its back button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Grammar/ }));
    expect(screen.getByText("Regole in tasca")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByText("Benvenuto")).toBeInTheDocument();
  });

  it("opens the Conversations module and returns to the menu via its back button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Conversations/ }));
    expect(screen.getByText("Due parole")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByText("Benvenuto")).toBeInTheDocument();
  });

  it("opens the Stories module and returns to the menu via its back button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Stories/ }));
    expect(screen.getByText("Quattro pagine")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByText("Benvenuto")).toBeInTheDocument();
  });
});
