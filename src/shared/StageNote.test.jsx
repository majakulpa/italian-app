import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import StageNote from "./StageNote.jsx";
import { STAGES, stageNoteText } from "./stage.js";

// The card draws StageNote and the live region speaks stageNoteText, so the
// two have to say the same words, for every rung.
describe("StageNote", () => {
  it.each(STAGES.slice(1).map((stage) => [stage.name, stage]))("says what stageNoteText says for %s", (_name, stage) => {
    const gate = { stage, current: STAGES[0] };
    const { container } = render(<StageNote gate={gate} />);
    expect(container.textContent).toBe(stageNoteText(gate));
  });

  it("marks both stage names Italian and nothing else", () => {
    const gate = { stage: STAGES[5], current: STAGES[1] };
    const { container } = render(<StageNote gate={gate} />);
    expect([...container.querySelectorAll('[lang="it"]')].map((el) => el.textContent)).toEqual([
      "congiuntivo",
      "passato prossimo",
    ]);
  });
});
