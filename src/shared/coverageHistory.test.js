import { describe, it, expect, beforeEach } from "vitest";
import { recordCoverage } from "./coverageHistory.js";
import { coverage } from "./coverage.js";
import { FONDAMENTALE } from "../data/fondamentale.js";
import { saveProgress, loadProgress, loadCoverageHistory, saveCoverageHistory, riservaKey, todayISO } from "./storage.js";

beforeEach(() => {
  localStorage.clear();
});

// Known through La Riserva's key, which is enough for coverage to count it.
function knowing(n) {
  const words = Object.fromEntries(FONDAMENTALE.slice(0, n).map((entry) => [riservaKey(entry), "known"]));
  saveProgress({ words, schedule: {} });
  return coverage(loadProgress()).pct;
}

describe("recordCoverage", () => {
  it("writes today's figure as the first point of a save that has none", () => {
    const pct = knowing(5);
    expect(pct).toBeGreaterThan(0);

    expect(recordCoverage()).toEqual([{ date: todayISO(), pct }]);
    expect(loadCoverageHistory()).toEqual([{ date: todayISO(), pct }]);
  });

  it("writes nothing when the figure is where the last point left it", () => {
    const pct = knowing(5);
    saveCoverageHistory([{ date: "2026-09-01", pct }]);
    const stored = localStorage.getItem("italiano:coverage-history:v1");

    recordCoverage("2026-09-10");
    recordCoverage("2026-09-11");
    expect(localStorage.getItem("italiano:coverage-history:v1")).toBe(stored);
  });

  it("adds a dated point once the figure moves", () => {
    saveCoverageHistory([{ date: "2026-09-01", pct: 0 }]);
    const pct = knowing(12);

    expect(recordCoverage("2026-09-10")).toEqual([
      { date: "2026-09-01", pct: 0 },
      { date: "2026-09-10", pct },
    ]);
  });
});
