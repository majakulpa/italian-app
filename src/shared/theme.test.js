import { describe, it, expect } from "vitest";
import { TOKENS, THEME_STYLE, LEVEL_ACCENTS, tint } from "./theme.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";

const declaredIn = (css) => new Set(css.match(/--color-[a-z-]+(?=\s*:)/g) || []);
const referencedBy = (obj) =>
  new Set(Object.values(obj).flatMap((v) => [...v.matchAll(/var\((--color-[a-z-]+)\)/g)].map((m) => m[1])));

// The base :root block is the one that has to be complete — the dark/light
// blocks only override a subset of it.
const rootBlock = THEME_STYLE.match(/:root\s*\{([^}]*)\}/)[1];
// Every other selector block: the @media dark override and the two explicit
// data-theme blocks.
const overrideBlocks = THEME_STYLE.split(/:root(?:\[data-theme="\w+"\])?\s*\{/)
  .slice(2)
  .map((chunk) => chunk.split("}")[0]);

describe("tint", () => {
  it("mixes an accent into a base with color-mix, so it survives a theme repaint", () => {
    // Hex + alpha would bake in the light-mode background; color-mix keeps
    // resolving against whatever the var() paints to.
    expect(tint(TOKENS.adriatic, 15)).toBe(
      "color-mix(in srgb, var(--color-adriatic) 15%, var(--color-card))"
    );
  });

  it("defaults to 15% over the card background", () => {
    expect(tint(TOKENS.corallo)).toBe(tint(TOKENS.corallo, 15, TOKENS.card));
  });

  it("takes an explicit base", () => {
    expect(tint(TOKENS.card, 50, "transparent")).toBe(
      "color-mix(in srgb, var(--color-card) 50%, transparent)"
    );
  });
});

describe("THEME_STYLE", () => {
  // A TOKENS entry pointing at a variable nobody declares resolves to
  // nothing, which paints as transparent or inherited — easy to miss by eye.
  it("declares every CSS variable that TOKENS and LEVEL_ACCENTS reference", () => {
    const declared = declaredIn(rootBlock);
    const referenced = new Set([
      ...referencedBy(TOKENS),
      ...Object.values(LEVEL_ACCENTS).flatMap((a) => [...referencedBy(a)]),
    ]);

    expect([...referenced].filter((v) => !declared.has(v))).toEqual([]);
  });

  it("only overrides variables the base :root actually declares", () => {
    const declared = declaredIn(rootBlock);
    for (const block of overrideBlocks) {
      expect([...declaredIn(block)].filter((v) => !declared.has(v))).toEqual([]);
    }
  });

  // The toggle has to be able to get you back to exactly where you started,
  // so whatever dark flips, light has to flip back.
  it("gives the dark and light data-theme blocks the same variables to flip", () => {
    const explicitDark = THEME_STYLE.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)[1];
    const explicitLight = THEME_STYLE.match(/:root\[data-theme="light"\]\s*\{([^}]*)\}/)[1];

    expect([...declaredIn(explicitDark)].sort()).toEqual([...declaredIn(explicitLight)].sort());
  });
});

describe("LEVEL_ACCENTS", () => {
  // Every data file spreads LEVEL_ACCENTS[<level id>] into its levels, so a
  // level with no accent entry spreads `undefined` and renders colorless.
  it.each([
    ["vocab", LEVELS],
    ["grammar", GRAMMAR_LEVELS],
    ["conversations", CONVERSATION_LEVELS],
    ["stories", STORY_LEVELS],
  ])("covers every level id used by %s", (_name, levels) => {
    for (const level of levels) {
      expect(LEVEL_ACCENTS[level.id]).toBeDefined();
      expect(level.accent).toBe(LEVEL_ACCENTS[level.id].accent);
      expect(level.accentDeep).toBe(LEVEL_ACCENTS[level.id].accentDeep);
    }
  });

  it("pairs a fill accent with a distinct deeper text color for each level", () => {
    for (const [id, accents] of Object.entries(LEVEL_ACCENTS)) {
      expect(accents.accent, id).toBeTruthy();
      expect(accents.accentDeep, id).toBeTruthy();
      // accent is for fills only; pairing text with it is the contrast bug
      // the comment in theme.js warns about, so they must not be the same.
      expect(accents.accent).not.toBe(accents.accentDeep);
    }
  });
});
