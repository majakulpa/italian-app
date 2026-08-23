import { describe, it, expect } from "vitest";
import { TOKENS, THEME_STYLE, LEVEL_ACCENTS, tint } from "./theme.js";
import { parsePalettes, contrastRatio, mix, round, AA_TEXT, AA_NON_TEXT } from "../test/contrast.js";
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

// WCAG 2.1 AA, the colour half. axe can't judge contrast in jsdom (no paint,
// so it returns "incomplete" — see src/test/a11y.js), which would leave the
// palette unchecked exactly where a change is most likely to break it. These
// cases do it arithmetically instead, on the hex values THEME_STYLE ships.
describe("palette contrast (WCAG 2.1 AA)", () => {
  const palettes = parsePalettes(THEME_STYLE);
  const MODES = Object.entries(palettes).map(([mode, vars]) => [mode, vars]);

  const SURFACES = ["--color-paper", "--color-paper-deep", "--color-card"];
  // Every colour the app paints body text, labels or headings in.
  const TEXT = [
    "--color-ink",
    "--color-ink-soft",
    "--color-adriatic-deep",
    "--color-corallo-deep",
    "--color-malachite-deep",
    "--color-limoncello-deep",
    "--color-viola-deep",
    "--color-laguna-deep",
  ];
  // The level fills, which carry white text in the ticket stub and the level
  // picker's roundel. limoncello is deliberately absent: it's a gold used for
  // the review band and tints, never behind white text.
  const LEVEL_FILLS = ["--color-adriatic", "--color-corallo", "--color-malachite", "--color-viola", "--color-laguna"];

  it.each(MODES)("%s: every text colour clears 4.5:1 on every surface", (_mode, vars) => {
    const failures = [];
    for (const text of TEXT) {
      for (const surface of SURFACES) {
        const ratio = contrastRatio(vars[text], vars[surface]);
        if (ratio < AA_TEXT) failures.push(`${text} on ${surface}: ${round(ratio)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(MODES)("%s: white on a level fill clears 4.5:1", (_mode, vars) => {
    const failures = LEVEL_FILLS.map((fill) => [fill, contrastRatio(vars[fill], "#ffffff")])
      .filter(([, ratio]) => ratio < AA_TEXT)
      .map(([fill, ratio]) => `#fff on ${fill}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // The answered-question states paint their text over tint(accent, 12%) and
  // the flashcard's "I knew it" over tint(malachite, 14%) — a mix, so the
  // ratio isn't either colour's on its own.
  it.each(MODES)("%s: feedback text clears 4.5:1 on its tinted background", (_mode, vars) => {
    const pairs = [
      ["--color-malachite-deep", "--color-malachite"],
      ["--color-corallo-deep", "--color-corallo"],
      ["--color-limoncello-deep", "--color-limoncello"],
    ];
    const failures = [];
    for (const [text, accent] of pairs) {
      for (const percent of [12, 14, 15]) {
        const background = mix(vars[accent], vars["--color-card"], percent);
        const ratio = contrastRatio(vars[text], background);
        if (ratio < AA_TEXT) failures.push(`${text} on ${percent}% ${accent}: ${round(ratio)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // 1.4.11: the boundary of a control is what tells you it's a control, so it
  // needs 3:1 — which is why anything clickable draws with controlLine rather
  // than the decorative hairline.
  it.each(MODES)("%s: the control boundary clears 3:1 on every surface", (_mode, vars) => {
    const failures = SURFACES.map((surface) => [surface, contrastRatio(vars["--color-control-line"], vars[surface])])
      .filter(([, ratio]) => ratio < AA_NON_TEXT)
      .map(([surface, ratio]) => `control-line on ${surface}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // An answered option swaps its boundary for the state colour, and the
  // level picker marks the active level the same way — same job, same 3:1.
  // These are the *-deep variants precisely because the fill accents only
  // manage 2.5:1 against the dark card.
  it.each(MODES)("%s: a state or selection border clears 3:1 on the card", (_mode, vars) => {
    const failures = [
      "--color-malachite-deep",
      "--color-corallo-deep",
      "--color-limoncello-deep",
      "--color-adriatic-deep",
      "--color-viola-deep",
      "--color-laguna-deep",
    ]
      .map((accent) => [accent, contrastRatio(vars[accent], vars["--color-card"])])
      .filter(([, ratio]) => ratio < AA_NON_TEXT)
      .map(([accent, ratio]) => `${accent} border on card: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });
});
