import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

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
