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

  // The `color` prop exists for one reason: on a filled city surface, the
  // default inkSoft measured 3.92:1 against the pistachio bubble in the
  // browser (SC 1.4.3 wants 4.5 at 12px). A caller on a coloured surface
  // passes "inherit" and gets that surface's ink instead. jsdom computes no
  // cascade, so this asserts the declaration rather than a measured ratio —
  // the arithmetic lives in theme.test.js and the measurement in the browser.
  describe("the colour it draws itself in", () => {
    it("defaults to the soft ink every existing caller was built on", () => {
      render(<TranslationToggle en="Good morning" />);
      expect(screen.getByRole("button", { name: "Show translation" })).toHaveStyle({ color: "var(--color-ink-soft)" });
    });

    it("takes the surface's own colour when a caller asks it to inherit", async () => {
      const user = userEvent.setup();
      render(<TranslationToggle en="Good morning" color="inherit" />);

      const button = screen.getByRole("button", { name: "Show translation" });
      expect(button.style.color).toBe("inherit");

      // The revealed English too, not just the button that reveals it.
      await user.click(button);
      expect(screen.getByText("Good morning").style.color).toBe("inherit");
    });
  });
});
