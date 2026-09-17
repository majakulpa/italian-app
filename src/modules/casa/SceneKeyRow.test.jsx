import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configure, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SceneKeyRow, { SAVED, REMOVED } from "./SceneKeyRow.jsx";
import { forget, isUnlocked, lockedKey, hasStoredKey } from "../../shared/sceneKey.js";
import { loadProgress, saveProgress, riservaKey } from "../../shared/storage.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { FAKE_KEY } from "../../test/fakeKey.js";
import { expectNoViolations } from "../../test/a11y.js";

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

const keyField = () => screen.getByLabelText("Anthropic API key");
const pinField = () => screen.getByLabelText("A PIN to lock it with");
const saveButton = () => screen.getByRole("button", { name: "Save the key" });

// Every message this row shows is also announced, so it is in the document
// twice — once seen, once in the live region. This is the seen one.
const shown = (matcher) => {
  const seen = screen.getAllByText(matcher).filter((node) => node.getAttribute("role") !== "status");
  expect(seen).toHaveLength(1);
  return seen[0];
};

// Every save runs real PBKDF2 at the shipped iteration count (~0.4s), so the
// flows here wait for the outcome rather than assuming the click settled it.
async function setKey(user, key = FAKE_KEY, pin = "4821") {
  await user.type(keyField(), key);
  await user.type(pinField(), pin);
  await user.click(saveButton());
  await waitFor(() => expect(shown(new RegExp(SAVED))).toBeInTheDocument());
}

describe("Casa's scene-partner key row", () => {
  it("states the four facts about the key whether or not one is stored", () => {
    render(<SceneKeyRow />);

    expect(screen.getByRole("heading", { name: "Partner di scena" })).toBeInTheDocument();
    // The shared origin, named, with the number of sites on it.
    expect(screen.getByText(/thirteen other sites of mine/)).toBeInTheDocument();
    expect(screen.getByText(/without your PIN it is not a key/)).toBeInTheDocument();
    expect(screen.getByText(/low.*spend limit/)).toBeInTheDocument();
    // Both recipients, named.
    expect(screen.getByText(/Anthropic receives the text of the conversation/)).toBeInTheDocument();
    expect(screen.getByText(/Apple.*on Safari, Google.*on Chrome/)).toBeInTheDocument();
    // Both iOS caveats.
    expect(screen.getByText(/keeps its storage apart from Safari/)).toBeInTheDocument();
    expect(screen.getByText(/have not opened for about a week/)).toBeInTheDocument();
  });

  it("marks its Italian as Italian", () => {
    render(<SceneKeyRow />);

    expect(screen.getByText("Partner di scena")).toHaveAttribute("lang", "it");
    expect(screen.getByText("Prova")).toHaveAttribute("lang", "it");
  });

  it("takes a key and a PIN, stores ciphertext, and then offers Remove", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await setKey(user);

    expect(hasStoredKey()).toBe(true);
    expect(screen.queryByLabelText("Anthropic API key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove the key" })).toBeInTheDocument();
    expect(screen.getByText("Salvata solo su questo dispositivo")).toHaveAttribute("lang", "it");

    // What is on the device is not the key.
    const record = localStorage.getItem("italiano:scene-key:v1");
    expect(record).not.toContain(FAKE_KEY);
    expect(record).not.toContain("sk-ant");
    expect(JSON.parse(record)).toMatchObject({ version: 1 });

    // Nor is it in the form's own state any more, nor anywhere on screen.
    expect(document.body.textContent).not.toContain(FAKE_KEY);
    expect(document.body.textContent).not.toContain(FAKE_KEY.slice(0, 20));
  });

  it("shows a masked tail from memory, and nothing of the key itself", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await setKey(user);

    expect(screen.getByText(`••••••••${FAKE_KEY.slice(-4)}`)).toBeInTheDocument();
  });

  it("says a key is stored on a fresh load, with no tail, because the key is locked", async () => {
    const user = userEvent.setup();
    const first = render(<SceneKeyRow />);
    await setKey(user);
    first.unmount();

    // A reload: storage survives, the decrypted key does not.
    forget();
    render(<SceneKeyRow />);

    expect(shown(new RegExp(SAVED))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove the key" })).toBeInTheDocument();
    expect(screen.queryByText(/••••/)).not.toBeInTheDocument();
  });

  it("removes the key from storage and from memory, and announces it", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);
    await setKey(user);

    await user.click(screen.getByRole("button", { name: "Remove the key" }));

    expect(hasStoredKey()).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(lockedKey()).toBe(null);
    expect(screen.getByRole("status")).toHaveTextContent(REMOVED);
    // The form is back, and focus is on the heading rather than lost to the
    // body with the button that was pressed.
    expect(keyField()).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Partner di scena" })).toHaveFocus();
  });

  it("keeps focus and the announcement on the heading after a save", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await setKey(user);

    expect(screen.getByRole("heading", { name: "Partner di scena" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(SAVED);
  });

  it("refuses something that is not a key, on the key field, and stores nothing", async () => {
    const user = userEvent.setup();
    const { container } = render(<SceneKeyRow />);

    await user.type(keyField(), "hunter2");
    await user.type(pinField(), "4821");
    await user.click(saveButton());

    await waitFor(() => expect(shown(/doesn’t look like an Anthropic key/)).toBeInTheDocument());
    const message = shown(/doesn’t look like an Anthropic key/);
    expect(keyField()).toHaveAttribute("aria-invalid", "true");
    expect(keyField().getAttribute("aria-describedby")).toContain(message.id);
    expect(pinField()).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("status")).toHaveTextContent(/doesn’t look like an Anthropic key/);
    expect(hasStoredKey()).toBe(false);
    // The key field keeps what was typed — it is the thing to correct.
    expect(keyField()).toHaveValue("hunter2");

    await expectNoViolations(container);
  });

  it("refuses a PIN that is too short, on the PIN field", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await user.type(keyField(), FAKE_KEY);
    await user.type(pinField(), "12");
    await user.click(saveButton());

    await waitFor(() => expect(shown(/at least four characters/)).toBeInTheDocument());
    const message = shown(/at least four characters/);
    expect(pinField()).toHaveAttribute("aria-invalid", "true");
    expect(pinField().getAttribute("aria-describedby")).toContain(message.id);
    expect(keyField()).not.toHaveAttribute("aria-invalid");
    expect(hasStoredKey()).toBe(false);
  });

  it("says so when the browser will not store anything, and marks neither field", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await user.type(keyField(), FAKE_KEY);
    await user.type(pinField(), "4821");
    await user.click(saveButton());

    await waitFor(() => expect(shown(/would not store it/)).toBeInTheDocument());
    expect(keyField()).not.toHaveAttribute("aria-invalid");
    expect(pinField()).not.toHaveAttribute("aria-invalid");
    expect(isUnlocked()).toBe(false);

    vi.restoreAllMocks();
  });

  it("says what it is doing while the PIN is being stretched", async () => {
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await user.type(keyField(), FAKE_KEY);
    await user.type(pinField(), "4821");
    await user.click(saveButton());

    expect(screen.getByRole("button", { name: "Locking the key…" })).toBeDisabled();
    await waitFor(() => expect(shown(new RegExp(SAVED))).toBeInTheDocument());
    expect(hasStoredKey()).toBe(true);
  });

  it("writes nothing into the progress blob", async () => {
    saveProgress({ words: { [riservaKey(FONDAMENTALE[0])]: "known" }, schedule: {} });
    const user = userEvent.setup();
    render(<SceneKeyRow />);

    await setKey(user);

    expect(loadProgress().words).toEqual({ [riservaKey(FONDAMENTALE[0])]: "known" });
    expect(localStorage.getItem("italiano:progress:v1")).not.toContain("sk-ant");
  });
});
