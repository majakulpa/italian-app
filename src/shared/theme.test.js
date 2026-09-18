import { describe, it, expect } from "vitest";
import { TOKENS, THEME_STYLE, CITY_STYLE, LEVEL_ACCENTS, CITY_ACCENTS, CITY_RULES, citySurface, tint } from "./theme.js";
import { parsePalettes, contrastRatio, mix, round, AA_TEXT, AA_NON_TEXT } from "../test/contrast.js";
import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { optionPaint } from "../modules/grammar/optionPaint.js";

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
      ...Object.values(CITY_ACCENTS).flatMap((a) => [...referencedBy(a)]),
      // CITY_STYLE is a stylesheet rather than a token map, and it reaches
      // for a variable too — a focus ring painted in nothing is invisible.
      ...[...CITY_STYLE.matchAll(/var\((--color-[a-z-]+)\)/g)].map((m) => m[1]),
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

  // A glossed word in a story is underlined and nothing else marks it: its
  // own text colour sits ~1.6:1 from the body ink around it, so the underline
  // is the whole affordance and therefore a control boundary at 3:1. It is
  // drawn in the level's accentDeep, on the paper the paragraph is printed
  // on. Drawn in the *fill* accent — which is what shipped — dark mode gave
  // A1 3.15, A2 3.08, B1 3.08, C1 3.34 and B2 2.24, a straight failure that
  // no check in this file was looking at. The pairing is checked against
  // every surface because the card and paper-deep carry the same paragraphs
  // elsewhere; which token the module actually reaches for is held by
  // StoriesModule.test.jsx, since a sound palette says nothing about that.
  it.each(MODES)("%s: the glossed-word underline clears 3:1 on every surface", (_mode, vars) => {
    const named = (token) => token.match(/var\((--color-[a-z-]+)\)/)[1];
    const failures = [];
    for (const [id, accents] of Object.entries(LEVEL_ACCENTS)) {
      for (const surface of SURFACES) {
        const ratio = contrastRatio(vars[named(accents.accentDeep)], vars[surface]);
        if (ratio < AA_NON_TEXT) failures.push(`${id} underline on ${surface}: ${round(ratio)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // An answered option swaps its boundary for the state colour, and the
  // level picker marks the active level the same way — same job, same 3:1.
  // These are the *-deep variants precisely because the fill accents only
  // manage 2.5:1 against the dark card.
  // The session summary's trophy roundel: a level's accentDeep icon and 3px
  // ring on tint(accent, 16%) of that same level, drawn over the page. The
  // icon is a graphic (3:1 would do) but it is held to text contrast, and
  // the ring to 3:1 against the paper the roundel sits on.
  it.each(MODES)("%s: the summary roundel's accentDeep clears 4.5:1 on its own sixteen-percent tint", (_mode, vars) => {
    const named = (token) => token.match(/var\((--color-[a-z-]+)\)/)[1];
    const failures = [];
    for (const [id, { accent, accentDeep }] of Object.entries(LEVEL_ACCENTS)) {
      const fill = mix(vars[named(accent)], vars["--color-card"], 16);
      const onTint = contrastRatio(vars[named(accentDeep)], fill);
      const ringOnPaper = contrastRatio(vars[named(accentDeep)], vars["--color-paper"]);
      if (onTint < AA_TEXT) failures.push(`${id} icon on its tint: ${round(onTint)}`);
      if (ringOnPaper < AA_NON_TEXT) failures.push(`${id} ring on paper: ${round(ringOnPaper)}`);
    }
    expect(failures).toEqual([]);
  });

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

// ── La Città ────────────────────────────────────────────────────────────
// The city palette is vivid where the rest of the app is muted, which is
// exactly the combination that goes wrong quietly: a fill bright enough to
// look good is rarely dark enough to carry text, and the outline that fixes
// it in light mode disappears in dark mode. Every pairing the map paints is
// checked here, both ways round.
describe("La Città palette contrast (WCAG 2.1 AA)", () => {
  const palettes = parsePalettes(THEME_STYLE);
  const MODES = Object.entries(palettes).map(([mode, vars]) => [mode, vars]);
  const SURFACES = ["--color-paper", "--color-paper-deep", "--color-card"];

  const named = (token) => token.match(/var\((--color-[a-z-]+)\)/)[1];
  const PAIRS = Object.entries(CITY_ACCENTS).map(([id, a]) => [id, named(a.fill), named(a.ink)]);

  it.each(MODES)("%s: each district's ink clears 4.5:1 on its own fill", (_mode, vars) => {
    const failures = PAIRS.map(([id, fill, ink]) => [id, contrastRatio(vars[ink], vars[fill])])
      .filter(([, ratio]) => ratio < AA_TEXT)
      .map(([id, ratio]) => `${id}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // SC 1.4.11 on a district tile, which is a control. What draws the
  // boundary changes with the mode and that is deliberate: in light mode the
  // near-black outline does it (16:1 on paper) while the fills themselves are
  // pale against cream; in dark mode the outline vanishes into the page and
  // the bright fill does it instead. Either is enough on its own, so the
  // rule is that at least one of the two has to clear 3:1 — asserting the
  // outline alone would fail in dark mode and asserting the fill alone would
  // fail in light, and both assertions would be describing the wrong thing.
  it.each(MODES)("%s: every district tile is 3:1 distinguishable from every surface", (_mode, vars) => {
    const failures = [];
    for (const [id, fill] of PAIRS) {
      for (const surface of SURFACES) {
        const best = Math.max(
          contrastRatio(vars["--color-city-ink"], vars[surface]),
          contrastRatio(vars[fill], vars[surface]),
        );
        if (best < AA_NON_TEXT) failures.push(`${id} on ${surface}: ${round(best)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // The same 3px rule on a neutral surface — the map plate, a shut district,
  // the dashed note under the map. This one has nothing but itself to make
  // the edge, so it has to clear 3:1 outright, which is why it flips.
  it.each(MODES)("%s: the neutral city edge clears 3:1 on every surface", (_mode, vars) => {
    const failures = SURFACES.map((surface) => [surface, contrastRatio(vars["--color-city-edge"], vars[surface])])
      .filter(([, ratio]) => ratio < AA_NON_TEXT)
      .map(([surface, ratio]) => `city-edge on ${surface}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // A focus ring you can't see is not a focus ring (SC 2.4.11 / 1.4.11). It
  // is painted in grape and the map plate is paper-deep, so that is the
  // pairing that has to hold.
  it.each(MODES)("%s: the focus ring clears 3:1 against the map plate", (_mode, vars) => {
    expect(round(contrastRatio(vars["--color-grape"], vars["--color-paper-deep"]))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  // The shared module chrome (TopBar, LevelPicker, TicketCard, SessionSummary)
  // wears `.citta` too, so the grape ring now lands on the module page, which
  // is paper, and around buttons sitting on a ticket's card. The weakest of
  // the three is grape on the dark card, 3.99:1.
  it.each(MODES)("%s: the focus ring clears 3:1 on every surface the chrome puts it on", (_mode, vars) => {
    const failures = SURFACES.map((surface) => [surface, contrastRatio(vars["--color-grape"], vars[surface])])
      .filter(([, ratio]) => ratio < AA_NON_TEXT)
      .map(([surface, ratio]) => `focus ring on ${surface}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // SessionSummary's tallies used to paint TOKENS.malachite and
  // TOKENS.corallo as text on the card. They are pistachio and lemon city
  // tiles now, in each tile's own ink (held above). This pins why the move
  // was needed rather than a nicety: a fill accent as text on the dark card
  // fails even the 3:1 that 30px text is allowed.
  // The grammar drill's answer surfaces, measured off optionPaint() itself so
  // a state that changes its paint changes what is measured. Each option is a
  // control on the page: its text has to clear 4.5:1 on its own background,
  // and its boundary 3:1 on paper, drawn either by the edge or by the fill (the
  // same either-or the district tiles above use, for the same reason). The
  // speaker beside it is an ink icon on paper, and both controls' grape focus
  // ring lands on paper, because the painted tile is the button alone.
  const DRILL_STATES = ["idle", "answer", "wrong"];
  it.each(MODES)("%s: every grammar drill option state is readable and bounded on the page", (_mode, vars) => {
    const failures = [];
    for (const state of DRILL_STATES) {
      const paint = optionPaint(state);
      const [bg, ink, edge] = [named(paint.background), named(paint.color), named(paint.edge)];
      const text = contrastRatio(vars[ink], vars[bg]);
      if (text < AA_TEXT) failures.push(`${state} text: ${round(text)}`);
      const bound = Math.max(contrastRatio(vars[edge], vars["--color-paper"]), contrastRatio(vars[bg], vars["--color-paper"]));
      if (bound < AA_NON_TEXT) failures.push(`${state} boundary: ${round(bound)}`);
    }
    for (const [what, fg, min] of [
      ["speaker icon", "--color-ink", AA_NON_TEXT],
      ["focus ring", "--color-grape", AA_NON_TEXT],
    ]) {
      const ratio = contrastRatio(vars[fg], vars["--color-paper"]);
      if (ratio < min) failures.push(`${what} on paper: ${round(ratio)}`);
    }
    expect(failures).toEqual([]);
  });

  // The drill's above-stage note is a neutral city card: an ink sentence, an
  // ink-soft eyebrow, and the flipping city edge around it on paper. Its Next
  // button is the pistachio primary La Piazza uses, held by the tile tests.
  it.each(MODES)("%s: the grammar drill's above-stage note is readable and bounded", (_mode, vars) => {
    const card = vars["--color-card"];
    expect(round(contrastRatio(vars["--color-ink"], card))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(round(contrastRatio(vars["--color-ink-soft"], card))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(round(contrastRatio(vars["--color-city-edge"], vars["--color-paper"]))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  // Why the option is not a painted row with the speaker inside it: the ring
  // would sit on the fill, and in dark mode grape on either state fill is far
  // under 3:1. Pins the reason, so nobody paints the row back.
  it("dark: the focus ring would not show on a painted option's fill", () => {
    const vars = palettes.dark;
    for (const state of ["answer", "wrong"]) {
      const fill = named(optionPaint(state).background);
      expect(round(contrastRatio(vars["--color-grape"], vars[fill])), state).toBeLessThan(AA_NON_TEXT);
    }
  });

  // The bug this pins actually shipped for the length of one browser pass, and
  // it is exactly the class CLAUDE.md warns about: `--color-city-ink` is the
  // one city token that does *not* flip between modes, because it is the ink
  // that sits on an accent fill and accent fills stay bright in the dark. Put
  // it around a control whose own fill is `card` and in dark mode it measures
  // 1.39:1 — an invisible boundary, on a control that passed every arithmetic
  // check it was given, because the pairing it was checked against was the
  // wrong one. Le Scene's microphone did that.
  //
  // So: a control on a card gets its outline from `--color-city-edge`, which
  // flips, and this is the test that says why.
  it("dark: the fixed city ink cannot draw a boundary on the card, which city-edge is for", () => {
    const vars = palettes.dark;
    expect(round(contrastRatio(vars["--color-city-ink"], vars["--color-card"]))).toBeLessThan(AA_NON_TEXT);
    expect(round(contrastRatio(vars["--color-city-edge"], vars["--color-card"]))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("dark: a state fill accent is not a text colour on the card", () => {
    const vars = palettes.dark;
    for (const fill of ["--color-malachite", "--color-corallo"]) {
      expect(round(contrastRatio(vars[fill], vars["--color-card"])), fill).toBeLessThan(AA_NON_TEXT);
    }
  });

  // The vocab, conversations and stories interiors, as La Città redraws them.
  // Most of these pairings are held generically above; they are listed here
  // by what paints them, so a change to one of these screens can be checked
  // against the list and a pairing nobody thought of has an obvious home.
  // `min` is 4.5 for text and 3 for a boundary or an icon.
  const INTERIOR_PAIRS = [
    // An answered option: the pistachio tile (the answer) and the tomato one
    // (a wrong pick), each in its own ink, with AnswerMark in currentColor.
    ["answer text on pistachio", "--color-pistachio-ink", "--color-pistachio", AA_TEXT],
    ["wrong-pick text on tomato", "--color-tomato-ink", "--color-tomato", AA_TEXT],
    // Its outline is the fixed city ink, which carries the boundary in light
    // mode and is invisible on the dark page, where the tile's own fill
    // carries it instead. Either half may: a list means "the better of".
    ["pistachio tile on the page", ["--color-city-ink", "--color-pistachio"], "--color-paper", AA_NON_TEXT],
    ["tomato tile on the page", ["--color-city-ink", "--color-tomato"], "--color-paper", AA_NON_TEXT],
    ["pistachio action on a ticket", ["--color-city-ink", "--color-pistachio"], "--color-card", AA_NON_TEXT],
    // An open option, a reply card: the control line, 3px.
    ["open option outline on the page", "--color-control-line", "--color-paper", AA_NON_TEXT],
    ["open option outline on its card", "--color-control-line", "--color-card", AA_NON_TEXT],
    // The flashcard, the secondary buttons, the replay button, the gloss bar
    // and its close button: the flipping city edge.
    ["city edge on the page", "--color-city-edge", "--color-paper", AA_NON_TEXT],
    ["city edge on a card", "--color-city-edge", "--color-card", AA_NON_TEXT],
    ["secondary button text on the page", "--color-ink", "--color-paper", AA_TEXT],
    // The grape ring, now that .citta wraps each interior.
    ["focus ring on the page", "--color-grape", "--color-paper", AA_NON_TEXT],
    ["focus ring on a card", "--color-grape", "--color-card", AA_NON_TEXT],
    // Le Scene. The speaker bubbles in Ascolta are lemon and pistachio tiles
    // and their ink is held by the generic accent test above; what is new here
    // is the microphone in Prova, which sits inside a neutral card and changes
    // what draws its boundary when it starts listening. Idle it is the
    // flipping city edge (held two rows up); listening, the tomato fill is
    // what separates it from the card behind it.
    ["listening microphone on a card", ["--color-city-ink", "--color-tomato"], "--color-card", AA_NON_TEXT],
    // The stand-in's "back to the scenes" button, and the microphone's own
    // mode switch: both a 2px control line on a card (held above), with their
    // label in full ink rather than ink-soft.
    ["scene button label on a card", "--color-ink", "--color-card", AA_TEXT],
    // Casa's scene-key row and the PIN prompt both put a lemon primary button
    // and a lemon-inked label *inside* a neutral card, which the pistachio row
    // above only covers for pistachio. Same two halves: in light mode the
    // fixed city ink outlines the button, in dark mode the lemon fill is what
    // separates it from the card.
    ["lemon action on a card", ["--color-city-ink", "--color-lemon"], "--color-card", AA_NON_TEXT],
    ["lemon action label", "--color-lemon-ink", "--color-lemon", AA_TEXT],
  ];

  it.each(MODES)("%s: every pairing the module interiors paint clears its threshold", (_mode, vars) => {
    const failures = INTERIOR_PAIRS.map(([label, fg, bg, min]) => [
      label,
      Math.max(...[fg].flat().map((colour) => contrastRatio(vars[colour], vars[bg]))),
      min,
    ])
      .filter(([, ratio, min]) => ratio < min)
      .map(([label, ratio]) => `${label}: ${round(ratio)}`);

    expect(failures).toEqual([]);
  });

  // The per-level half. The learner's own line in a dialogue is a transparent
  // bubble with its text in the level's deep accent straight on the page, and
  // a dashed outline in the same colour; the replay button's icon and the
  // gloss bar's headword are that accent on the card.
  it.each(MODES)("%s: every level's deep accent is text-grade on the page and on a card", (_mode, vars) => {
    const named = (token) => token.match(/var\((--color-[a-z-]+)\)/)[1];
    const failures = [];
    for (const [id, { accentDeep }] of Object.entries(LEVEL_ACCENTS)) {
      for (const surface of ["--color-paper", "--color-card"]) {
        const ratio = contrastRatio(vars[named(accentDeep)], vars[surface]);
        if (ratio < AA_TEXT) failures.push(`${id} accentDeep on ${surface}: ${round(ratio)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("the four rules of the city design system", () => {
  // design/02-la-citta.html states them as four, and the whole claim is that
  // they are applied everywhere. citySurface() is the "everywhere" — if a
  // component can get a chunky surface without going through it, the rules
  // are advice rather than a system.
  it("gives a district tile a 3px border, an 18px radius and a hard offset shadow", () => {
    const tile = citySurface("tomato");

    expect(tile.border).toBe(`3px solid ${TOKENS.cityInk}`);
    expect(tile.borderRadius).toBe(18);
    expect(tile.boxShadow).toBe(`4px 4px 0 ${TOKENS.cityShadow}`);
    // Rule 2: hard, never blurred. A third length in the shadow is a blur.
    expect(tile.boxShadow.trim().split(/\s+/)).toHaveLength(4);
  });

  // Rule 3: flat fills. A gradient anywhere is the thing that would make the
  // whole set of tiles stop reading as stickers.
  it("fills flat, with no gradient anywhere in the palette", () => {
    for (const accent of Object.keys(CITY_ACCENTS)) {
      expect(citySurface(accent).background).not.toMatch(/gradient/);
    }
  });

  it("keeps the same shape for a neutral surface, in the flipping edge colour", () => {
    const plate = citySurface();

    expect(plate.border).toBe(`${CITY_RULES.border}px solid ${TOKENS.cityEdge}`);
    expect(plate.borderRadius).toBe(CITY_RULES.radius);
    expect(plate.background).toBe(TOKENS.card);
  });

  it("pairs every accent with its own ink rather than a shared text colour", () => {
    const inks = Object.values(CITY_ACCENTS).map((a) => a.ink);
    for (const [id, accent] of Object.entries(CITY_ACCENTS)) {
      expect(accent.fill, id).toBeTruthy();
      expect(accent.ink, id).not.toBe(accent.fill);
    }
    expect(new Set(inks).size).toBe(inks.length);
  });
});
