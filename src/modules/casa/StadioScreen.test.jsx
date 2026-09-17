import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App.jsx";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import { formStage, stageState, STAGES, EMERGENCE_ITEMS } from "../../shared/stage.js";
import { drillKey, markStageProduced, saveProgress, loadProgress } from "../../shared/storage.js";

beforeEach(() => {
  localStorage.clear();
});

// Every grammar drill whose clean answer is evidence of a stage, by stage.
const ALL = GRAMMAR_LEVELS.flatMap((level) =>
  level.topics.flatMap((topic) => topic.drills.map((item) => ({ key: drillKey(level, topic, item), stage: formStage(topic, item) }))),
);
const ofStage = (stage) => ALL.filter((d) => d.stage === stage);

// Clean typed answers to `counts[stage]` distinct items of each stage.
function seed(counts) {
  let progress = { version: 2, words: {}, schedule: {} };
  for (const [stage, n] of Object.entries(counts)) {
    for (const { key } of ofStage(Number(stage)).slice(0, n)) progress = markStageProduced(progress, key);
  }
  saveProgress(progress);
  return stageState(loadProgress());
}

const tabBar = () => screen.getByRole("navigation", { name: "Sections" });

async function openStadio() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(within(tabBar()).getByRole("button", { name: "Casa" }));
  await user.click(screen.getByRole("button", { name: /Lo Stadio/ }));
  return user;
}

const rungs = () => within(screen.getByRole("list", { name: "The stages" })).getAllByRole("listitem");

describe("Lo Stadio", () => {
  it("opens from Casa, under the Casa tab, and comes back", async () => {
    const user = await openStadio();

    expect(screen.getByRole("heading", { level: 1, name: "Dove sei" })).toBeInTheDocument();
    expect(within(tabBar()).getByRole("button", { name: "Casa" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Dedotto da quello che produci giusto — non da quante lezioni hai aperto.")).toHaveAttribute("lang", "it");

    await user.click(screen.getByRole("button", { name: "Casa", current: false }));
    expect(screen.getByRole("heading", { level: 1, name: "Casa" })).toBeInTheDocument();
  });

  // The tab is the other way out, and it lands on Casa's front screen rather
  // than leaving the ladder open.
  it("goes back to Casa's front screen when the Casa tab is pressed", async () => {
    const user = await openStadio();
    await user.click(within(tabBar()).getByRole("button", { name: "Casa" }));
    expect(screen.getByRole("heading", { level: 1, name: "Casa" })).toBeInTheDocument();
  });

  it("names the current rung on the way in", async () => {
    const state = seed({ 1: EMERGENCE_ITEMS, 2: 1 });
    render(<App />);
    await userEvent.setup().click(within(tabBar()).getByRole("button", { name: "Casa" }));

    expect(state.current).toBe(2);
    expect(screen.getByRole("button", { name: /Lo Stadio/ })).toHaveTextContent("Stage 2 · passato prossimo");
  });

  // Every rung's figure against the gate's own state, seeded out of order on
  // purpose: stage 1 past the threshold, stage 2 part-way, stage 4 with one
  // clean answer although stage 3 has none.
  it("shows each rung's evidence as N of 4 items, straight from stageState", async () => {
    const state = seed({ 1: EMERGENCE_ITEMS + 2, 2: 2, 4: 1 });
    await openStadio();

    const rows = rungs();
    expect(rows).toHaveLength(STAGES.length);
    state.stages.forEach((stage, i) => {
      expect(rows[i]).toHaveTextContent(`${stage.stage} · ${stage.name}`);
      expect(rows[i]).toHaveTextContent(`${Math.min(stage.evidence, EMERGENCE_ITEMS)} of ${EMERGENCE_ITEMS} items`);
      expect(rows[i].textContent).not.toMatch(/%/);
    });

    expect(rows[0]).toHaveTextContent(`Established · 4 of 4 items · ${EMERGENCE_ITEMS + 2} in all`);
    expect(rows[1]).toHaveTextContent("You are here · 2 of 4 items");
    expect(rows[3]).toHaveTextContent("Above your stage · 1 of 4 items");
  });

  it("says every rung above is read and not corrected, and no rung at or below", async () => {
    const state = seed({ 1: EMERGENCE_ITEMS, 2: EMERGENCE_ITEMS });
    await openStadio();

    const rows = rungs();
    state.stages.forEach((stage, i) => {
      const note = within(rows[i]).queryByText("lo leggi, non lo correggo");
      if (stage.status === "above") expect(note).toHaveAttribute("lang", "it");
      else expect(note).toBeNull();
    });
    expect(state.stages.map((s) => s.status)).toEqual(["established", "established", "current", "above", "above", "above", "above"]);
  });

  it("marks each status with its own glyph, hidden from screen readers in favour of the word", async () => {
    seed({ 1: EMERGENCE_ITEMS });
    await openStadio();

    const [established, current, above] = rungs();
    expect(within(established).getByText("✓")).toHaveAttribute("aria-hidden", "true");
    expect(within(current).getByText("◆")).toHaveAttribute("aria-hidden", "true");
    expect(within(above).getByText("○")).toHaveAttribute("aria-hidden", "true");
  });

  it("explains why vorrei turns up while the condizionale is above", async () => {
    await openStadio();

    const heading = screen.getByRole("heading", { name: /Perché vedi vorrei lo stesso/ });
    expect(heading).toHaveAttribute("lang", "it");
    expect(heading.parentElement).toHaveTextContent("A wrong one is shown to you rather than marked wrong, until you reach the stage.");
  });

  // Once the condizionale is established the card would be describing
  // something that no longer happens, so it goes.
  it("drops the vorrei card once the condizionale is no longer above", async () => {
    const state = seed({ 5: EMERGENCE_ITEMS });
    expect(state.stages[4].status).toBe("established");
    await openStadio();

    expect(screen.queryByRole("heading", { name: /Perché vedi/ })).not.toBeInTheDocument();
  });

  it("draws neither a date a stage was reached, nor a serial it opens", async () => {
    seed({ 1: EMERGENCE_ITEMS });
    await openStadio();

    expect(document.body.textContent).not.toMatch(/\bda (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/);
    expect(document.body.textContent).not.toMatch(/Stagione|serie/);
  });
});
