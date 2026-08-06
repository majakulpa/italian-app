import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("shows the module menu with only Vocabulary enabled", () => {
    render(<App />);
    expect(screen.getByText("Italiano")).toBeInTheDocument();

    const vocabButton = screen.getByRole("button", { name: /Vocabulary/ });
    expect(vocabButton).toBeEnabled();

    for (const name of ["Grammar", "Conversations", "Stories"]) {
      const button = screen.getByRole("button", { name: new RegExp(name) });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Coming soon");
    }
  });

  it("opens the Vocabulary module and returns to the menu via its back button", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Vocabulary/ }));
    expect(screen.getByText("Parole in viaggio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All modules/ }));
    expect(screen.getByText("Benvenuto")).toBeInTheDocument();
  });

  it("does nothing when a disabled module card is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Grammar/ }));
    expect(screen.getByText("Italiano")).toBeInTheDocument();
    expect(screen.queryByText("Parole in viaggio")).not.toBeInTheDocument();
  });
});
