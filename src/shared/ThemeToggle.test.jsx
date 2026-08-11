import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "./ThemeToggle.jsx";

// jsdom has no matchMedia — stub it so useThemeMode can read the OS
// preference the same way it does in a browser.
function mockOSPrefersDark(prefersDark) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: prefersDark });
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  mockOSPrefersDark(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("follows the OS preference when nothing has been chosen", () => {
    mockOSPrefersDark(true);
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    // No explicit choice yet, so data-theme stays off and the @media rule
    // in theme.js keeps control.
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("switches away from the OS preference on the first tap", async () => {
    mockOSPrefersDark(true);
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("persists the choice so it survives a remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    unmount();
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  // An explicit choice has to keep winning even when the OS says otherwise —
  // that's the whole point of data-theme overriding the media query.
  it("keeps a stored choice that disagrees with the OS", () => {
    localStorage.setItem("italiano:theme:v1", "light");
    mockOSPrefersDark(true);
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("toggles back and forth", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
