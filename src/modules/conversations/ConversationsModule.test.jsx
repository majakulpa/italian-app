import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConversationsModule from "./ConversationsModule.jsx";
import { CONVERSATION_LEVELS } from "../../data/conversations.js";
import * as speech from "../../shared/speech.js";

const a1 = CONVERSATION_LEVELS.find((l) => l.id === "A1");
const cafe = a1.dialogues.find((d) => d.id === "cafe");
const a2 = CONVERSATION_LEVELS.find((l) => l.id === "A2");
const directions = a2.dialogues.find((d) => d.id === "directions");
const c1 = CONVERSATION_LEVELS.find((l) => l.id === "C1");
const contratto = c1.dialogues.find((d) => d.id === "contratto");

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderConversations() {
  return render(<ConversationsModule onExit={() => {}} />);
}

describe("ConversationsHome", () => {
  // See the note in GrammarModule.test.jsx: the streak badge is shared markup,
  // so each module home has to check that it still renders its own.
  it("shows a running streak, and nothing before one has started", () => {
    const { unmount } = renderConversations();
    expect(screen.queryByText(/^\d+ days?$/)).not.toBeInTheDocument();
    unmount();

    localStorage.setItem(
      "italiano:progress:v1",
      JSON.stringify({ words: {}, streak: { count: 5, lastDate: "2026-08-17" } }),
    );
    renderConversations();
    expect(screen.getByText(/^5 days$/)).toBeInTheDocument();
  });

  it("shows A1 dialogues by default with taglines", () => {
    renderConversations();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    expect(screen.getByText("At the café")).toBeInTheDocument();
    expect(screen.getByText("Meeting someone new")).toBeInTheDocument();
    expect(screen.getByText(cafe.tagline)).toBeInTheDocument();
  });

  it("switches dialogues when a different level is selected", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getByRole("button", { name: /Elementare/ }));
    expect(screen.getByText("Asking for directions")).toBeInTheDocument();
    expect(screen.queryByText("At the café")).not.toBeInTheDocument();
  });
});

describe("Dialogue", () => {
  // The options are divs with role="button", so Enter and Space are wired by
  // hand rather than coming free with a real <button>.
  it("picks a response with Enter as well as a click", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const pick = cafe.steps[0].options[0];
    screen.getByText(pick.it).closest('[role="button"]').focus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText(pick.feedback)).toBeInTheDocument();
  });

  it("ignores keys that aren't Enter or Space", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    screen.getByText(cafe.steps[0].options[0].it).closest('[role="button"]').focus();
    await user.keyboard("a");

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("picks a response with Space too", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const pick = cafe.steps[0].options[0];
    screen.getByText(pick.it).closest('[role="button"]').focus();
    await user.keyboard(" ");

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("shows the opening line and lets the user pick a response", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText(cafe.steps[0].them.it)).toBeInTheDocument();

    const formalOption = cafe.steps[0].options.find((o) => o.tone === "formal");
    expect(screen.getByText(formalOption.it)).toBeInTheDocument();
  });

  it("advances to the next step after a pick, keeping the transcript visible", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const step0Pick = cafe.steps[0].options[0];
    await user.click(screen.getByText(step0Pick.it));

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    // Step 0's exchange stays visible above the new step.
    expect(screen.getByText(cafe.steps[0].them.it)).toBeInTheDocument();
    expect(screen.getByText(step0Pick.it)).toBeInTheDocument();
    expect(screen.getByText(step0Pick.feedback)).toBeInTheDocument();
    // Step 1's prompt is now showing.
    expect(screen.getByText(cafe.steps[1].them.it)).toBeInTheDocument();
  });

  it("completes the dialogue, tallies tone picks, and persists completion", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    // Pick the formal option at every step.
    for (const step of cafe.steps) {
      const formalOption = step.options.find((o) => o.tone === "formal");
      await user.click(screen.getByText(formalOption.it));
    }

    expect(screen.getByText("Conversation complete")).toBeInTheDocument();
    expect(screen.getByText("formal picks")).toBeInTheDocument();
    expect(screen.getByText("casual picks")).toBeInTheDocument();
    expect(screen.getByText("YOUR RESPONSES")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to dialogues" }));
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Practice again/ })).toBeInTheDocument();
  });

  it("lets the player open dialogues that start with their own line", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getByRole("button", { name: /Elementare/ }));
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    expect(screen.getByText("You start the conversation:")).toBeInTheDocument();
    const firstOption = directions.steps[0].options[0];
    expect(screen.getByText(firstOption.it)).toBeInTheDocument();
  });
});

// A1–B1 dialogues run three turns; the B2/C1 ones run four. The step
// counter and the recap both come from dialogue.steps.length, so a dialogue
// of a different length is the case where a hardcoded 3 would show up.
describe("a longer dialogue", () => {
  it("counts its own steps rather than assuming three", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getByRole("button", { name: /Avanzato/ }));
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    expect(contratto.steps).toHaveLength(4);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();

    await user.click(screen.getByText(contratto.steps[0].options[0].it));
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });

  it("tallies every turn in the recap, mixed tones included", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getByRole("button", { name: /Avanzato/ }));
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    // Alternate formal/casual so the two counts have to be tallied
    // separately rather than just echoing the step count.
    const picks = contratto.steps.map((step, i) =>
      step.options.find((o) => o.tone === (i % 2 === 0 ? "formal" : "casual"))
    );
    for (const pick of picks) {
      await user.click(screen.getByText(pick.it));
    }

    expect(screen.getByText("Conversation complete")).toBeInTheDocument();
    // Two of each, and every response listed back with its feedback. The
    // recap puts both in one paragraph ("<response> — <feedback>"), so the
    // feedback isn't a text node of its own to query for.
    expect(screen.getAllByText("2")).toHaveLength(2);
    for (const pick of picks) {
      const line = screen.getByText(pick.it).closest("p");
      expect(line.textContent).toContain(pick.feedback);
    }
  });
});

describe("translations", () => {
  it("hides English translations for the opening line and options until revealed", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    expect(screen.queryByText(cafe.steps[0].them.en)).not.toBeInTheDocument();
    for (const opt of cafe.steps[0].options) {
      expect(screen.queryByText(opt.en)).not.toBeInTheDocument();
    }

    const [themToggle] = screen.getAllByRole("button", { name: "Show translation" });
    await user.click(themToggle);
    expect(screen.getByText(cafe.steps[0].them.en)).toBeInTheDocument();
  });

  it("hides the translation of a picked response until revealed, but always shows the feedback", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const step0Pick = cafe.steps[0].options[0];
    await user.click(screen.getByText(step0Pick.it));

    // Feedback is coaching content, not a translation — always visible.
    expect(screen.getByText(step0Pick.feedback)).toBeInTheDocument();
    expect(screen.queryByText(step0Pick.en)).not.toBeInTheDocument();
  });

  it("toggling an option's translation does not select that option", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    // Toggles in DOM order: the them-bubble's, then each option's.
    // Use one of the option toggles — the ones nested inside the
    // otherwise-clickable option card, where stopPropagation matters.
    const toggles = screen.getAllByRole("button", { name: "Show translation" });
    await user.click(toggles[1]);

    // Still on step 1 with both options present — nothing was chosen.
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText(cafe.steps[0].options[0].it)).toBeInTheDocument();
    expect(screen.getByText(cafe.steps[0].options[1].it)).toBeInTheDocument();
  });

  it("does not leak a revealed translation into the next step's option at the same position", async () => {
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    // Reveal the first option's translation, then pick the *other* option
    // so the reveal itself isn't what advances the step.
    const optionToggles = screen.getAllByRole("button", { name: "Show translation" });
    await user.click(optionToggles[1]); // the first option's own toggle (after the them-bubble's toggle)
    await user.click(screen.getByText(cafe.steps[0].options[1].it));

    // New step, same option position — should be hidden again.
    expect(screen.queryByText(cafe.steps[1].options[0].en)).not.toBeInTheDocument();
  });
});

describe("pronunciation", () => {
  it("lets the user hear an option without selecting it", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const step0Pick = cafe.steps[0].options[0];
    const speakButton = screen.getByRole("button", { name: `Pronounce "${step0Pick.it}"` });
    await user.click(speakButton);

    expect(speakSpy).toHaveBeenCalledWith(step0Pick.it);
    // Still on step 1 with nothing chosen — the click didn't select the option.
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText(cafe.steps[0].options[1].it)).toBeInTheDocument();
  });

  it("lets the user hear their own picked response", async () => {
    vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
    const speakSpy = vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
    const user = userEvent.setup();
    renderConversations();
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    const step0Pick = cafe.steps[0].options[0];
    await user.click(screen.getByText(step0Pick.it));
    speakSpy.mockClear();

    const speakButton = screen.getByRole("button", { name: `Pronounce "${step0Pick.it}"` });
    await user.click(speakButton);
    expect(speakSpy).toHaveBeenCalledWith(step0Pick.it);
  });
});
