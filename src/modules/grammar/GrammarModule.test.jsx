import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GrammarModule from "./GrammarModule.jsx";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";

const a1 = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const presentAre = a1.topics.find((t) => t.id === "present-are");

beforeEach(() => {
  localStorage.clear();
  // Identity-shuffle so drill/option order always matches data/grammar.js exactly.
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderGrammar() {
  return render(<GrammarModule onExit={() => {}} />);
}

describe("GrammarHome", () => {
  it("shows A1 topics by default with taglines", () => {
    renderGrammar();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Presente: verbi in -ARE")).toBeInTheDocument();
    expect(screen.getByText("Essere e avere")).toBeInTheDocument();
    expect(screen.getByText(presentAre.tagline)).toBeInTheDocument();
  });

  it("switches topics when a different level is selected", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getByRole("button", { name: /B1 · Intermedio/ }));
    expect(screen.getByText("Passato prossimo")).toBeInTheDocument();
    expect(screen.getByText("Comparativi")).toBeInTheDocument();
    expect(screen.queryByText("Presente: verbi in -ARE")).not.toBeInTheDocument();
  });
});

describe("Lesson", () => {
  it("shows the explanation, conjugation table, and example sentences", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);

    expect(screen.getByText(presentAre.explanation.summary)).toBeInTheDocument();
    expect(screen.getByText("parlare")).toBeInTheDocument(); // table header
    expect(screen.getByText("parliamo")).toBeInTheDocument(); // table cell
    expect(screen.getByText(presentAre.explanation.points[0])).toBeInTheDocument();
    expect(screen.getByText(`"${presentAre.explanation.examples[0].it}"`)).toBeInTheDocument();
    expect(screen.getByText(presentAre.explanation.examples[0].en)).toBeInTheDocument();
  });

  it("starts the drill from the lesson screen", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Learn/ })[0]);
    await user.click(screen.getByRole("button", { name: /Start drill/ }));

    expect(screen.getByText(presentAre.drills[0].prompt)).toBeInTheDocument();
    expect(screen.getByText(presentAre.drills[0].hint)).toBeInTheDocument();
  });
});

describe("Drill", () => {
  it("marks a correct answer, updates the score, and advances", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    expect(screen.getByText(item0.prompt)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: item0.answer }));
    expect(screen.getByText("1 correct")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText(presentAre.drills[1].prompt)).toBeInTheDocument();
  });

  it("marks a wrong answer without crediting the score", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const item0 = presentAre.drills[0];
    const wrongOption = item0.options.find((opt) => opt !== item0.answer);

    await user.click(screen.getByRole("button", { name: wrongOption }));
    expect(screen.getByText("0 correct")).toBeInTheDocument();
  });

  it("completes the drill, shows a summary, and persists mastered items", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    for (const item of presentAre.drills) {
      await user.click(screen.getByRole("button", { name: item.answer }));
      await user.click(screen.getByRole("button", { name: /Next|See results/ }));
    }

    expect(screen.getByText("Drill complete")).toBeInTheDocument();
    expect(screen.getByText(`correct out of ${presentAre.drills.length}`)).toBeInTheDocument();
    expect(screen.getByText(String(presentAre.drills.length))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to topics" }));
    expect(screen.getByText(`${presentAre.drills.length} / ${presentAre.drills.length} mastered`)).toBeInTheDocument();
  });

  it("lists missed items for review at the end", async () => {
    const user = userEvent.setup();
    renderGrammar();
    await user.click(screen.getAllByRole("button", { name: /Drill/ })[0]);

    const [first, ...rest] = presentAre.drills;
    const wrongOption = first.options.find((opt) => opt !== first.answer);
    await user.click(screen.getByRole("button", { name: wrongOption }));
    await user.click(screen.getByRole("button", { name: /Next|See results/ }));

    for (const item of rest) {
      await user.click(screen.getByRole("button", { name: item.answer }));
      await user.click(screen.getByRole("button", { name: /Next|See results/ }));
    }

    expect(screen.getByText("Drill complete")).toBeInTheDocument();
    expect(screen.getByText("to review")).toBeInTheDocument();
    expect(screen.getByText("TO REVIEW")).toBeInTheDocument();
    expect(screen.getByText(first.prompt.replace("___", first.answer))).toBeInTheDocument();
  });
});
