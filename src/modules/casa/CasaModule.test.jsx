import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App.jsx";
import CasaModule from "./CasaModule.jsx";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { coverage } from "../../shared/coverage.js";
import { saveProgress, loadProgress, saveCoverageHistory, loadCoverageHistory, riservaKey, todayISO } from "../../shared/storage.js";

beforeEach(() => {
  localStorage.clear();
});

// Known through La Riserva's key, which is enough for coverage to count it.
function knowing(n) {
  const words = Object.fromEntries(FONDAMENTALE.slice(0, n).map((entry) => [riservaKey(entry), "known"]));
  saveProgress({ words, schedule: {} });
  return coverage(loadProgress());
}

const tabBar = () => screen.getByRole("navigation", { name: "Sections" });
const coverageCard = () => screen.getByRole("region", { name: "Coverage" });
const longDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

async function openCasa() {
  const user = userEvent.setup();
  const utils = render(<App />);
  await user.click(within(tabBar()).getByRole("button", { name: "Casa" }));
  return { user, ...utils };
}

describe("Casa", () => {
  it("opens from its tab, which becomes the current page", async () => {
    await openCasa();

    expect(screen.getByRole("heading", { level: 1, name: "Casa" })).toBeInTheDocument();
    expect(within(tabBar()).getByRole("button", { name: "Casa" })).toHaveAttribute("aria-current", "page");
  });

  // PLAN.md's three rules for the percentage: labelled as a share of running
  // text, paired with the solid count, never called progress.
  it("labels coverage as a share of text, beside the solid count, and never as progress", async () => {
    const { pct, counts } = knowing(12);
    await openCasa();

    const card = coverageCard();
    expect(within(card).getByText(`${pct}%`)).toBeInTheDocument();
    expect(within(card).getByText(/of the words in/)).toHaveTextContent("of the words in everyday Italian text");
    expect(within(card).getByText(`${counts.solid} / ${FONDAMENTALE_TARGET} solid`)).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/progress|complete|done/i);
  });

  // A fresh save has one point, written as the app opened. One point is not a
  // curve, so the screen says where the curve starts instead of drawing one.
  it("says the curve starts now on a fresh save, and draws nothing", async () => {
    await openCasa();

    expect(within(coverageCard()).getByText(/The curve starts now\./)).toBeInTheDocument();
    expect(within(coverageCard()).queryByRole("img")).not.toBeInTheDocument();
    expect(loadCoverageHistory()).toEqual([{ date: todayISO(), pct: 0 }]);
  });

  it("says when the curve started, if coverage has not moved since", async () => {
    saveCoverageHistory([{ date: "2020-01-01", pct: 0 }]);
    await openCasa();

    expect(within(coverageCard()).getByText(/The curve starts on 1 Jan 2020\./)).toBeInTheDocument();
    expect(within(coverageCard()).queryByRole("img")).not.toBeInTheDocument();
  });

  // Rendered on its own, before anything has recorded a point, there is no
  // history at all — and still no invented start.
  it("says the curve starts now when there is no history at all", () => {
    render(<CasaModule />);
    expect(screen.getByText(/The curve starts now\./)).toBeInTheDocument();
  });

  it("draws the recorded points, labelled with their real first and last dates", async () => {
    const { pct } = knowing(12);
    saveCoverageHistory([
      { date: "2020-01-01", pct: 0 },
      { date: "2020-02-01", pct: 3.5 },
      { date: "2020-03-01", pct },
    ]);
    const { container } = await openCasa();

    const card = coverageCard();
    expect(within(card).getByRole("img", { name: `Coverage from 0% on 1 Jan 2020 to ${pct}% on 1 Mar 2020` })).toBeInTheDocument();
    expect(container.querySelector("polyline").getAttribute("points").split(" ")).toHaveLength(3);
    expect(within(card).getByText("1 Jan 2020 · 0%")).toBeInTheDocument();
    expect(within(card).getByText(`1 Mar 2020 · ${pct}%`)).toBeInTheDocument();
    expect(within(card).getByText(/Recorded from 1 Jan 2020/)).toBeInTheDocument();
    expect(within(card).queryByText(/The curve starts/)).not.toBeInTheDocument();
  });

  // The move to Casa records before Casa reads: what a module has just
  // written is on the curve the moment you arrive, dated today.
  it("puts what was just studied on the curve on the way in", async () => {
    saveCoverageHistory([{ date: "2020-01-01", pct: 0 }]);
    const user = userEvent.setup();
    render(<App />);

    const { pct } = knowing(12);
    await user.click(within(tabBar()).getByRole("button", { name: "Casa" }));

    expect(
      within(coverageCard()).getByRole("img", { name: `Coverage from 0% on 1 Jan 2020 to ${pct}% on ${longDate(todayISO())}` }),
    ).toBeInTheDocument();
  });

  it("gives the FSI figure as the size of the job, not as hours the learner has done", async () => {
    await openCasa();
    expect(screen.getByText(/600–750 hours of class/)).toHaveTextContent("this app does not count hours");
  });

  // The toggle used to be mounted on every screen, and mounting it was also
  // what applied a stored choice. With the toggle only in Casa, the choice
  // still has to hold from the first screen.
  it("applies a stored theme on the map, before Casa is ever opened", () => {
    delete document.documentElement.dataset.theme;
    localStorage.setItem("italiano:theme:v1", "dark");
    render(<App />);

    expect(screen.queryByRole("button", { name: /Switch to/ })).not.toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    delete document.documentElement.dataset.theme;
  });

  // The theme toggle moved here from the corner of every screen.
  it("holds the theme toggle in its settings, and the map no longer does", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByRole("button", { name: /Switch to/ })).not.toBeInTheDocument();

    await user.click(within(tabBar()).getByRole("button", { name: "Casa" }));
    const settings = screen.getByRole("region", { name: "Settings" });
    expect(within(settings).getByRole("button", { name: /Switch to (dark|light) mode/ })).toBeInTheDocument();
  });
});
