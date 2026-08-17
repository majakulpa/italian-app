import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StreakChip from "./StreakChip.jsx";

const progressWith = (streak) => ({ words: {}, streak });

describe("StreakChip", () => {
  it("shows the running streak", () => {
    render(<StreakChip progress={progressWith({ count: 6, lastDate: "2026-08-17" })} />);
    expect(screen.getByText(/6 days/)).toBeInTheDocument();
  });

  it("says day, not days, on the first day", () => {
    render(<StreakChip progress={progressWith({ count: 1, lastDate: "2026-08-17" })} />);
    expect(screen.getByText(/1 day$/)).toBeInTheDocument();
  });

  // A streak nobody has started is hidden entirely rather than shown as
  // "0 days" — the chip is an encouragement, and an empty one isn't.
  it("renders nothing before a streak has started", () => {
    const { container } = render(<StreakChip progress={progressWith({ count: 0, lastDate: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  // A count with no date is a half-written record; treat it as no streak
  // rather than trusting the number.
  it("renders nothing when the count has no date behind it", () => {
    const { container } = render(<StreakChip progress={progressWith({ count: 4, lastDate: null })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
