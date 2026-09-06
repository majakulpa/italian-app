import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiservaModule from "./RiservaModule.jsx";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { MODULE_STATS } from "../../shared/stats.js";
import { saveProgress } from "../../shared/storage.js";

// The bridge from the vocabulary deck is the only thing that puts a state on a
// lexicon rank (coverage.js says so at length), so a test that wants a word
// "known" has to write the key the vocab module would have written.
const vocab = MODULE_STATS.find((m) => m.id === "vocab");
const lexiconLemmas = new Set(FONDAMENTALE.map((e) => e.it));

function someVocabUnitInTheLexicon() {
  for (const level of vocab.levels) {
    for (const unit of vocab.units(level)) {
      if (lexiconLemmas.has(unit.item.it)) return unit;
    }
  }
  throw new Error("no vocabulary word bridges into the lexicon");
}

const cells = (container) => container.querySelectorAll("[data-rank]");

beforeEach(() => {
  localStorage.clear();
});

describe("La Riserva", () => {
  it("draws one cell per word of the target, not per word written down", () => {
    const { container } = render(<RiservaModule onExit={() => {}} />);

    // 2,000 cells even though the list holds 300 — the grid is the shape of
    // the target, and the gap is the point rather than an omission.
    expect(cells(container)).toHaveLength(FONDAMENTALE_TARGET);
    expect(FONDAMENTALE.length).toBeLessThan(FONDAMENTALE_TARGET);
  });

  // PLAN.md: "a rank nobody has written down cannot be unseen". The two are
  // different claims — one about the file, one about the learner — and the
  // grid has to tell them apart or it implies 1,700 words she failed to learn.
  it("tells a rank with no word behind it from one the learner has not met", () => {
    const { container } = render(<RiservaModule onExit={() => {}} />);
    const all = cells(container);

    expect(all[0]).toHaveAttribute("data-state", "unseen");
    expect(all[FONDAMENTALE_TARGET - 1]).toHaveAttribute("data-state", "empty");
    expect(screen.getByText(/not written down yet/)).toBeInTheDocument();
  });

  it("colours a rank the learner actually holds", async () => {
    const unit = someVocabUnitInTheLexicon();
    const rank = FONDAMENTALE.find((e) => e.it === unit.item.it).rank;
    saveProgress({ words: { [unit.key]: "known" } });

    const { container } = render(<RiservaModule onExit={() => {}} />);

    expect(container.querySelector(`[data-rank="${rank}"]`)).toHaveAttribute("data-state", "known");
  });

  // The whole point of the settled decision in PLAN.md. A percentage on this
  // screen reads as a share of the language rather than of running text, and
  // at a hundred words those are 54% and unreadable respectively.
  it("shows no percentage anywhere", () => {
    const { container } = render(<RiservaModule onExit={() => {}} />);

    expect(container.textContent).not.toMatch(/%/);
  });

  it("counts what is held out of the whole target", () => {
    const unit = someVocabUnitInTheLexicon();
    saveProgress({ words: { [unit.key]: "known" } });

    render(<RiservaModule onExit={() => {}} />);

    expect(screen.getByText(`1 / ${FONDAMENTALE_TARGET.toLocaleString("en-GB")}`)).toBeInTheDocument();
  });

  // Two thousand focusable cells is not a tab order, it is a trap. The cells
  // are a picture; the ten fasce are the controls.
  it("keeps the grid out of the tab order and gives its facts as text", () => {
    const { container } = render(<RiservaModule onExit={() => {}} />);

    expect(container.querySelector("[data-rank]").closest("[aria-hidden]")).toBeTruthy();
    expect(screen.getAllByRole("button").length).toBeLessThan(FONDAMENTALE_TARGET);
    expect(screen.getByText(/of 2000 words held/)).toBeInTheDocument();
  });

  it("opens a fascia to its words, and closes it again", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);

    const first = screen.getByRole("button", { name: /Fascia 1 · posti 1–200/ });
    expect(first).toHaveAttribute("aria-expanded", "false");

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    // The band's own list, in rank order, each word its own control — that is
    // word detail's way in. Asserted against the data rather than a literal,
    // so a reordered lexicon fails here instead of drifting.
    for (const e of FONDAMENTALE.slice(0, 3)) {
      expect(screen.getByRole("button", { name: e.it }), e.it).toBeInTheDocument();
    }

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  // A band past the seeded range has nothing to list, and saying so is more
  // honest than an empty paragraph that looks like a rendering bug.
  it("says a fascia is unwritten rather than showing an empty list", async () => {
    const user = userEvent.setup();
    render(<RiservaModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Fascia 10 · posti 1801–2000/ }));
    expect(screen.getByText(/Nothing in this band is written down yet/)).toBeInTheDocument();
  });

  // coverage.js's tally() returns three different percentages and warns that
  // swapping them is how a band bar ends up drawn at 4% when it is finished.
  // The band card states what the band is *worth*, which is the learner-free
  // one, and the first band has to dwarf the last.
  it("states what a fascia is worth, weighted by frequency", async () => {
    const user = userEvent.setup();
    const { container } = render(<RiservaModule onExit={() => {}} />);

    const worth = (name) =>
      Number(
        screen
          .getByRole("button", { name: new RegExp(name) })
          .textContent.match(/worth ([\d.]+) coverage points/)[1],
      );

    expect(worth("Fascia 1 ")).toBeGreaterThan(worth("Fascia 10 ") * 5);
    expect(container).toBeTruthy();
  });

  it("goes back the way it was opened", async () => {
    const user = userEvent.setup();
    let left = false;
    render(<RiservaModule onExit={() => (left = true)} exitLabel="L'Officina" />);

    await user.click(screen.getByRole("button", { name: /L'Officina/ }));
    expect(left).toBe(true);
  });
});
