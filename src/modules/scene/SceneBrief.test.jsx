import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SceneBrief from "./SceneBrief.jsx";
import { SCENES } from "../../data/scenes.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { riservaKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";

const verdura = SCENES[0];
const EMPTY = { words: {}, schedule: {} };

function known(progress, rank) {
  const key = riservaKey(FONDAMENTALE.find((entry) => entry.rank === rank));
  return reviewItem(reviewItem(progress, key, true), key, true);
}

function show(progress = EMPTY, props = {}) {
  const ref = { current: null };
  const user = userEvent.setup();
  render(<SceneBrief scene={verdura} progress={progress} headingRef={ref} onBegin={() => {}} {...props} />);
  return user;
}

beforeEach(() => {
  localStorage.clear();
});

describe("the brief", () => {
  it("leads with the ability, in both languages", () => {
    show();

    expect(screen.getByText(verdura.ability.it)).toBeInTheDocument();
    expect(screen.getAllByText(verdura.ability.en).length).toBeGreaterThan(0);
  });

  it("sets the scene, in both languages", () => {
    show();

    expect(screen.getByText(verdura.task.setting.it)).toBeInTheDocument();
    expect(screen.getByText(verdura.task.setting.en)).toBeInTheDocument();
  });

  it("lists the new words and names the grammar slice", () => {
    show();

    expect(screen.getByText(verdura.newWords.map((word) => word.it).join(", "))).toBeInTheDocument();
    expect(screen.getByText(verdura.grammar.title)).toBeInTheDocument();
  });

  it("begins the scene", async () => {
    const onBegin = vi.fn();
    const user = show(EMPTY, { onBegin });

    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    expect(onBegin).toHaveBeenCalled();
  });
});

// The one figure on this screen that is not authored, and the reason it is
// computed: design 02 draws "✓ 14 parole che sai già", and fourteen is a
// drawing. Nobody has fourteen of these ranks on day one.
describe("the known-word count", () => {
  it("is zero on a fresh account, and says so rather than borrowing the design's 14", () => {
    show();

    expect(screen.getByText(/^0 parole che sai già$/)).toBeInTheDocument();
    expect(screen.queryByText(/14 parole/)).not.toBeInTheDocument();
  });

  it("moves with the learner's own lexicon", () => {
    show(verdura.knownRanks.slice(0, 3).reduce(known, EMPTY));

    expect(screen.getByText(/^3 parole che sai già$/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`3 of the ${verdura.knownRanks.length} everyday words`))).toBeInTheDocument();
  });
});

describe("what the brief refuses to claim", () => {
  // design/02-la-citta.html prints "4 fasi · circa 12 minuti". Nothing in this
  // app has ever timed a scene — by design, since PLAN.md forbids counting
  // minutes — so the estimate is not on the screen in any form.
  // Matched on the shape of a duration rather than on the literal "12": every
  // other number on this screen is derived from the data (how many ranks the
  // scene leans on, how many words are new), so a bare /12/ would go red the
  // day one of those counts happened to be twelve. What must never appear is a
  // quantity of time.
  it("prints no time estimate", () => {
    show();

    expect(screen.queryByText(/minut/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bcirca\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*(min|minuti|minutes|hours|ore)\b/i)).not.toBeInTheDocument();
  });

  // "4 fasi" survives, because four is a fact about the data — and the brief
  // says which one is not ready rather than letting the learner find out on
  // arrival.
  it("promises four phases and names the one that is not set up", () => {
    show();

    expect(screen.getByText(/4 fasi/)).toBeInTheDocument();
    expect(screen.getByText(/that partner is not set up yet/)).toBeInTheDocument();
    expect(screen.getByText(/The first three work now/)).toBeInTheDocument();
  });
});
