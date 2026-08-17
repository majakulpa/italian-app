import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen, GraduationCap, MessageCircle, ScrollText } from "lucide-react";
import NavMenu from "./NavMenu.jsx";

const modules = [
  { id: "vocab", name: "Vocabulary", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", icon: MessageCircle, ready: true },
  { id: "stories", name: "Stories", icon: ScrollText, ready: false },
];

function renderMenu(active = null, onSelect = () => {}) {
  return render(<NavMenu modules={modules} active={active} onSelect={onSelect} />);
}

describe("NavMenu", () => {
  // The menu is a keyboard trap otherwise: it has no visible close control,
  // so Escape is the only way out for anyone not using a pointer.
  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  // Escape is the only key the document-level handler acts on — a stray
  // keystroke while browsing the menu shouldn't dismiss it. (Pressing Enter
  // here would re-trigger the still-focused toggle button, which is a
  // different path, so this uses a key bound to nothing.)
  it("ignores unrelated keys while open", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    screen.getByRole("menuitem", { name: /Vocabulary/ }).focus();
    await user.keyboard("a");

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("is closed by default and opens on click", async () => {
    const user = userEvent.setup();
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /All modules/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Vocabulary/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Grammar/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Conversations/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Stories/ })).toBeInTheDocument();
  });

  it("jumps straight to a module and closes the menu", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderMenu("vocab", onSelect);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: /Grammar/ }));

    expect(onSelect).toHaveBeenCalledWith("grammar");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("picking All modules selects null", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderMenu("grammar", onSelect);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: /All modules/ }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("does not select a module that isn't ready yet", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderMenu(null, onSelect);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("menuitem", { name: /Stories/ }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <NavMenu modules={modules} active={null} onSelect={() => {}} />
        <button>Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
