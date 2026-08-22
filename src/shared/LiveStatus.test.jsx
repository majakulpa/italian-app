import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LiveStatus from "./LiveStatus.jsx";

describe("LiveStatus", () => {
  // The whole point of the component: callers mount it up front and fill it
  // later, so it has to be a real, findable region while it's still empty.
  it("is an empty live region when there is nothing to say", () => {
    render(<LiveStatus>{""}</LiveStatus>);

    const live = screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("");
  });

  it("keeps the same node when its contents change", () => {
    const { rerender } = render(<LiveStatus>{""}</LiveStatus>);
    const live = screen.getByRole("status");

    rerender(<LiveStatus>Correct.</LiveStatus>);

    expect(screen.getByRole("status")).toBe(live);
    expect(live).toHaveTextContent("Correct.");
  });

  // Visually hidden rather than display:none, which would take it out of the
  // accessibility tree along with the layout.
  it("is hidden from sight but not from the accessibility tree", () => {
    render(<LiveStatus>Correct.</LiveStatus>);

    expect(screen.getByRole("status")).toHaveStyle({ position: "absolute" });
  });
});
