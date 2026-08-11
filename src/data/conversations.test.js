import { describe, it, expect } from "vitest";
import { CONVERSATION_LEVELS } from "./conversations.js";

const allDialogues = CONVERSATION_LEVELS.flatMap((level) =>
  level.dialogues.map((dialogue) => ({ level, dialogue }))
);

describe("CONVERSATION_LEVELS", () => {
  it("has A1/A2/B1, each with a level accent the modules can render", () => {
    expect(CONVERSATION_LEVELS.map((l) => l.id)).toEqual(["A1", "A2", "B1"]);
    for (const level of CONVERSATION_LEVELS) {
      expect(level.label).toBeTruthy();
      expect(level.name).toBeTruthy();
      expect(level.tagline).toBeTruthy();
      expect(level.accent).toBeTruthy();
      expect(level.accentDeep).toBeTruthy();
      expect(level.dialogues.length).toBeGreaterThan(0);
    }
  });

  it("keeps dialogue ids unique within a level", () => {
    for (const level of CONVERSATION_LEVELS) {
      const ids = level.dialogues.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(allDialogues.map(({ level, dialogue }) => [`${level.id} · ${dialogue.id}`, dialogue]))(
    "%s has the card and transcript fields the module renders",
    (_name, dialogue) => {
      expect(dialogue.title).toBeTruthy();
      expect(dialogue.tagline).toBeTruthy();
      expect(dialogue.speakerName).toBeTruthy();
      expect(dialogue.steps.length).toBeGreaterThan(0);
      for (const step of dialogue.steps) {
        // `them: null` is allowed — it means you open the conversation.
        if (step.them) {
          expect(step.them.it.trim()).toBeTruthy();
          expect(step.them.en.trim()).toBeTruthy();
        }
      }
    }
  );

  // Every step pairs one formal and one casual phrasing — the summary
  // tallies those two tones, so a step missing either would skew the recap.
  it.each(allDialogues.map(({ level, dialogue }) => [`${level.id} · ${dialogue.id}`, dialogue]))(
    "%s offers a formal and a casual option at every step",
    (_name, dialogue) => {
      for (const step of dialogue.steps) {
        expect(step.options).toHaveLength(2);
        expect(step.options.map((o) => o.tone).sort()).toEqual(["casual", "formal"]);
        for (const option of step.options) {
          expect(option.it.trim()).toBeTruthy();
          expect(option.en.trim()).toBeTruthy();
          expect(option.feedback.trim()).toBeTruthy();
        }
      }
    }
  );

  it("only ever lets the player open a dialogue at its first step", () => {
    for (const { dialogue } of allDialogues) {
      for (const step of dialogue.steps.slice(1)) {
        expect(step.them).toBeTruthy();
      }
    }
  });
});
