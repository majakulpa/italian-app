import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TranslationToggle from "./TranslationToggle.jsx";

describe("TranslationToggle", () => {
  it("hides the translation until it's asked for, then hides it again", async () => {
    const user = userEvent.setup();
    render(<TranslationToggle en="Good morning" />);

    expect(screen.queryByText("Good morning")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show translation" }));
    expect(screen.getByText("Good morning")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide translation" }));
    expect(screen.queryByText("Good morning")).not.toBeInTheDocument();
  });

  // This lives inside clickable option cards in ConversationsModule — a
  // click that bubbled would pick the option just for peeking at the English.
  it("does not let the click reach a clickable parent", async () => {
    const onParentClick = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={onParentClick}>
        <TranslationToggle en="Good morning" />
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Show translation" }));

    expect(screen.getByText("Good morning")).toBeInTheDocument();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
