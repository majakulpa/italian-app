import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConversationsModule from "./ConversationsModule.jsx";
import { CONVERSATION_LEVELS } from "../../data/conversations.js";

const a1 = CONVERSATION_LEVELS.find((l) => l.id === "A1");
const cafe = a1.dialogues.find((d) => d.id === "cafe");
const a2 = CONVERSATION_LEVELS.find((l) => l.id === "A2");
const directions = a2.dialogues.find((d) => d.id === "directions");

beforeEach(() => {
  localStorage.clear();
});

function renderConversations() {
  return render(<ConversationsModule onExit={() => {}} />);
}

describe("ConversationsHome", () => {
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
    await user.click(screen.getByRole("button", { name: /A2 · Elementare/ }));
    expect(screen.getByText("Asking for directions")).toBeInTheDocument();
    expect(screen.queryByText("At the café")).not.toBeInTheDocument();
  });
});

describe("Dialogue", () => {
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
    await user.click(screen.getByRole("button", { name: /A2 · Elementare/ }));
    await user.click(screen.getAllByRole("button", { name: /Start/ })[0]);

    expect(screen.getByText("You start the conversation:")).toBeInTheDocument();
    const firstOption = directions.steps[0].options[0];
    expect(screen.getByText(firstOption.it)).toBeInTheDocument();
  });
});
