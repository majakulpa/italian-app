import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScenePinPrompt, { WRONG_PIN } from "./ScenePinPrompt.jsx";
import { save, forget, isUnlocked, lockedKey } from "./partnerKey.js";
import { FAKE_KEY } from "../test/fakeKey.js";
import { expectNoViolations } from "../test/a11y.js";

// Testing Library's async helpers default to a one-second timeout, which is
// four PBKDF2 derivations' worth of headroom when this file runs alone and
// none at all when the whole suite runs: vitest runs test files in parallel
// workers, every other worker is busy, and a 400 ms derivation becomes a
// two-second one. Raising the async timeout rather than the iteration count,
// because the iteration count is one of the things under test.
configure({ asyncUtilTimeout: 15000 });

beforeEach(() => {
  localStorage.clear();
  forget();
});

afterEach(() => {
  forget();
});

const prompt = (props = {}) => render(<ScenePinPrompt onUnlocked={() => {}} onCancel={() => {}} {...props} />);
const field = () => screen.getByLabelText("PIN");

// The message appears twice on purpose — once seen, once heard — so a query
// by its text finds both. This is the seen one.
const shownError = () => screen.getAllByText(WRONG_PIN).find((node) => node.getAttribute("role") !== "status");

describe("the scene PIN prompt", () => {
  it("names the field, explains what the PIN is for, and does not name the app's password", () => {
    prompt();

    // A real label, not a placeholder: the accessible name has to survive the
    // field having something typed in it.
    expect(field()).toHaveAttribute("type", "password");
    expect(field()).toHaveAttribute("autocomplete", "off");
    expect(field()).not.toHaveAttribute("placeholder");
    expect(screen.getByText(/unlocks nothing else in this app/)).toBeInTheDocument();
  });

  it("hands the key over when the PIN is right", async () => {
    await save(FAKE_KEY, "4821");
    forget();

    const onUnlocked = vi.fn();
    const user = userEvent.setup();
    prompt({ onUnlocked });

    await user.type(field(), "4821");
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    // The derivation is real PBKDF2 at the shipped iteration count, so the
    // button says what it is doing while it runs rather than looking dead.
    expect(screen.getByRole("button", { name: "Unlocking…" })).toBeDisabled();

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(lockedKey()).toBe(FAKE_KEY);
  });

  it("announces the one failure message, clears the field and keeps focus on it", async () => {
    await save(FAKE_KEY, "4821");
    forget();

    const onUnlocked = vi.fn();
    const user = userEvent.setup();
    const { container } = prompt({ onUnlocked });

    await user.type(field(), "1111");
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    await waitFor(() => expect(shownError()).toBeInTheDocument());
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(isUnlocked()).toBe(false);
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
    expect(field()).toHaveAttribute("aria-invalid", "true");
    // The message is reachable from the field, and heard rather than only
    // seen — the live region is mounted for the screen's lifetime.
    expect(field().getAttribute("aria-describedby")).toContain(shownError().id);
    expect(screen.getByRole("status")).toHaveTextContent(WRONG_PIN);

    await expectNoViolations(container);
  });

  it("says the same thing when there is no stored key at all", async () => {
    const user = userEvent.setup();
    prompt();

    await user.type(field(), "4821");
    await user.click(screen.getByRole("button", { name: "Unlock" }));

    await waitFor(() => expect(shownError()).toBeInTheDocument());
  });

  it("offers a way out that unlocks nothing", async () => {
    await save(FAKE_KEY, "4821");
    forget();

    const onCancel = vi.fn();
    const user = userEvent.setup();
    prompt({ onCancel });

    await user.click(screen.getByRole("button", { name: "Not now" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(isUnlocked()).toBe(false);
  });
});
