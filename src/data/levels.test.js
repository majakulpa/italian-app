import { describe, it, expect } from "vitest";
import { LEVELS } from "./vocab.js";
import { GRAMMAR_LEVELS } from "./grammar.js";
import { CONVERSATION_LEVELS } from "./conversations.js";
import { STORY_LEVELS } from "./stories.js";
import { LEVEL_ACCENTS } from "../shared/theme.js";

// Cross-module invariants for the level ladder itself. Each data file's own
// test file checks its own contents; what nothing else checks is that the
// four files agree with each other. They have to: the level picker, the
// postmark badge and the "A2 means red everywhere" promise all assume a
// level id means the same thing in every module, and a level added to one
// data file but not the others is the easiest way to break that quietly.

const MODULES = [
  ["vocab", LEVELS, (level) => level.categories],
  ["grammar", GRAMMAR_LEVELS, (level) => level.topics],
  ["conversations", CONVERSATION_LEVELS, (level) => level.dialogues],
  ["stories", STORY_LEVELS, (level) => level.stories],
];

const LADDER = ["A1", "A2", "B1", "B2", "C1"];

describe("the level ladder", () => {
  it.each(MODULES)("%s offers the same levels in the same order", (_name, levels) => {
    expect(levels.map((l) => l.id)).toEqual(LADDER);
  });

  // The picker shows `label` + `name`, so a level calling itself
  // "Superiore" in one module and "Avanzato" in another would look like two
  // different levels to the person studying.
  it("gives a level id the same label and name in every module", () => {
    for (const id of LADDER) {
      const naming = MODULES.map(([name, levels]) => {
        const level = levels.find((l) => l.id === id);
        return { module: name, label: level.label, name: level.name };
      });
      const [first, ...rest] = naming;
      for (const other of rest) {
        expect({ id, ...other }).toEqual({ id, module: other.module, label: first.label, name: first.name });
      }
    }
  });

  // Two levels sharing an accent would make them indistinguishable in the
  // picker, which is the one place all five appear side by side.
  it("gives every level a distinct accent pair", () => {
    const fills = LADDER.map((id) => LEVEL_ACCENTS[id].accent);
    const texts = LADDER.map((id) => LEVEL_ACCENTS[id].accentDeep);

    expect(new Set(fills).size).toBe(LADDER.length);
    expect(new Set(texts).size).toBe(LADDER.length);
  });

  // The mirror of vocab/grammar/etc's "LEVEL_ACCENTS covers every level id"
  // check in theme.test.js: an accent nobody uses is a level someone half
  // added, and it will read as a colour that means nothing.
  it("uses every accent LEVEL_ACCENTS declares", () => {
    expect(Object.keys(LEVEL_ACCENTS).sort()).toEqual([...LADDER].sort());
  });

  it.each(MODULES)("%s gives every level at least two things to study", (_name, levels, items) => {
    for (const level of levels) {
      expect({ level: level.id, enough: items(level).length >= 2 }).toEqual({
        level: level.id,
        enough: true,
      });
    }
  });

  // A level's tagline is the one line of orientation on a module's home
  // screen, and it should say something about that module — the same
  // sentence in all four would be a copy/paste slip.
  it("gives each level a tagline that isn't shared across modules", () => {
    for (const id of LADDER) {
      const taglines = MODULES.map(([, levels]) => levels.find((l) => l.id === id).tagline);
      for (const tagline of taglines) {
        expect(tagline.trim()).toBeTruthy();
      }
      expect({ id, unique: new Set(taglines).size }).toEqual({ id, unique: MODULES.length });
    }
  });
});
