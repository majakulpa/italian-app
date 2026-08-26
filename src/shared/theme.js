// Shared design tokens for the whole app.
// Keep every module (vocab, grammar, conversations, stories) drawing colors
// and fonts from here so the app stays visually consistent as it grows.
//
// TOKENS values are CSS custom-property references, not literal hex — the
// actual hex values live in THEME_STYLE below, keyed by light/dark mode.
// This means every TOKENS.xxx / LEVEL_ACCENTS.xxx call site (inline styles
// throughout the app) is theme-reactive for free: toggling `data-theme` on
// <html> repaints them without any component re-render, because var()
// resolves at paint time. Level colors get spread into src/data/*.js level
// objects once at module load, which would otherwise go stale on toggle —
// var() references sidestep that entirely.

export const FONTS_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

// Light values are the default (:root), used whenever no explicit choice has
// been made — dark values apply either via the OS preference or an explicit
// data-theme="dark" set by useThemeMode. Accent "fill" colors (adriatic/
// corallo/malachite/limoncello) are deliberately identical in both modes:
// their job is staying legible under white badge text, which doesn't depend
// on the page background. Only the neutrals and the *Deep text variants flip.
export const THEME_STYLE = `
:root {
  --color-ink: #1C3F4A;
  --color-ink-soft: #3E5C64;
  --color-paper: #F5F1E6;
  --color-paper-deep: #EAE3D2;
  --color-card: #FFFDF8;
  --color-line: #D9D0BA;
  --color-control-line: #8C7B5A;

  --color-adriatic: #2A63E4;
  --color-adriatic-deep: #1E3E8C;
  --color-corallo: #C92E2E;
  --color-corallo-deep: #7A1F1F;
  --color-malachite: #187A48;
  --color-malachite-deep: #0F4C2C;
  --color-limoncello: #E8A93B;
  --color-limoncello-deep: #855A10;

  --color-viola: #6B3FA0;
  --color-viola-deep: #46246F;
  --color-laguna: #0E7C86;
  --color-laguna-deep: #0A4A55;

  /* La Città — see the block comment below CITY_ACCENTS. */
  --color-city-ink: #141024;
  --color-city-edge: #141024;
  --color-city-shadow: #141024;

  --color-tomato: #FF4D3D;
  --color-tomato-ink: #2A0A06;
  --color-lemon: #FFD23F;
  --color-lemon-ink: #241C00;
  --color-pistachio: #00D9A3;
  --color-pistachio-ink: #0A2119;
  --color-azzurro: #2BB3FF;
  --color-azzurro-ink: #04213A;
  --color-bubble: #FF7BC8;
  --color-bubble-ink: #33061F;
  --color-grape: #6B2FE8;
  --color-grape-ink: #FFFFFF;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-ink: #E7E3D8;
    --color-ink-soft: #93A5AC;
    --color-paper: #14202A;
    --color-paper-deep: #1C2C38;
    --color-card: #1F313D;
    --color-line: #3A4E5A;
    --color-control-line: #7C8F9B;

    --color-adriatic-deep: #8FB4FF;
    --color-corallo-deep: #FF9B9B;
    --color-malachite-deep: #7FE0AC;
    --color-limoncello-deep: #FFD98A;
    --color-viola-deep: #C7A6F2;
    --color-laguna-deep: #7FD8E4;

    --color-city-edge: #E7E3D8;
    --color-city-shadow: #070C11;
    --color-grape: #9B72FF;
    --color-grape-ink: #150730;
  }
}

:root[data-theme="dark"] {
  --color-ink: #E7E3D8;
  --color-ink-soft: #93A5AC;
  --color-paper: #14202A;
  --color-paper-deep: #1C2C38;
  --color-card: #1F313D;
  --color-line: #3A4E5A;
  --color-control-line: #7C8F9B;

  --color-adriatic-deep: #8FB4FF;
  --color-corallo-deep: #FF9B9B;
  --color-malachite-deep: #7FE0AC;
  --color-limoncello-deep: #FFD98A;
  --color-viola-deep: #C7A6F2;
  --color-laguna-deep: #7FD8E4;

  --color-city-edge: #E7E3D8;
  --color-city-shadow: #070C11;
  --color-grape: #9B72FF;
  --color-grape-ink: #150730;
}

:root[data-theme="light"] {
  --color-ink: #1C3F4A;
  --color-ink-soft: #3E5C64;
  --color-paper: #F5F1E6;
  --color-paper-deep: #EAE3D2;
  --color-card: #FFFDF8;
  --color-line: #D9D0BA;
  --color-control-line: #8C7B5A;

  --color-adriatic-deep: #1E3E8C;
  --color-corallo-deep: #7A1F1F;
  --color-malachite-deep: #0F4C2C;
  --color-limoncello-deep: #855A10;
  --color-viola-deep: #46246F;
  --color-laguna-deep: #0A4A55;

  --color-city-edge: #141024;
  --color-city-shadow: #141024;
  --color-grape: #6B2FE8;
  --color-grape-ink: #FFFFFF;
}
`;

// The one rule La Città needs that an inline style can't express: a focus
// ring. It lives apart from THEME_STYLE because that string is parsed as
// nothing but custom properties — by theme.test.js, and by the contrast
// helper in src/test/contrast.js.
//
// Grape rather than ink, per the design, and it flips with the theme, so the
// ring clears 3:1 against the map plate in both modes (5.1:1 light,
// 4.3:1 dark). Scoped to :focus-visible so a mouse click on a district
// doesn't leave a ring behind it.
export const CITY_STYLE = `
.citta :focus-visible {
  outline: 3px solid var(--color-grape);
  outline-offset: 3px;
  border-radius: 6px;
}
`;

export const TOKENS = {
  ink: "var(--color-ink)",
  inkSoft: "var(--color-ink-soft)",
  paper: "var(--color-paper)",
  paperDeep: "var(--color-paper-deep)",
  card: "var(--color-card)",
  line: "var(--color-line)",
  // Hairline for anything decorative — dividers, table rules, the edge of a
  // card. `controlLine` is its counterpart for anything you can click: the
  // boundary of a control has to clear 3:1 against the surfaces around it
  // (WCAG 1.4.11), which a hairline this pale never could.
  controlLine: "var(--color-control-line)",

  // Metro line blue — A1, and the "formal" tone color.
  adriatic: "var(--color-adriatic)",
  adriaticDeep: "var(--color-adriatic-deep)",
  // Metro line red — A2, and quiz/drill "incorrect" feedback.
  corallo: "var(--color-corallo)",
  corolloDeep: "var(--color-corallo-deep)",
  // Metro line green — B1, and quiz/drill "correct" feedback.
  malachite: "var(--color-malachite)",
  malachiteDeep: "var(--color-malachite-deep)",
  // Gold — casual tone, review prompts, celebratory accents. Not a level color.
  limoncello: "var(--color-limoncello)",
  limoncelloDeep: "var(--color-limoncello-deep)",
  // Metro line purple — B2.
  viola: "var(--color-viola)",
  violaDeep: "var(--color-viola-deep)",
  // Metro line teal — C1.
  laguna: "var(--color-laguna)",
  lagunaDeep: "var(--color-laguna-deep)",

  // ── La Città ──────────────────────────────────────────────────────────
  // The chunky outline that goes *on* a bright district fill. It never
  // flips: a district tile is a vivid block in both modes, so its outline
  // wants to stay dark in both. What carries the 3:1 control boundary
  // (SC 1.4.11) changes with the mode, though — in light mode it is this
  // outline against the page (16:1), and in dark mode it is the bright fill
  // itself against the dark page. theme.test.js checks both halves.
  cityInk: "var(--color-city-ink)",
  // The same 3px rule on a *neutral* surface — the map plate, a locked
  // district, an unfilled card. This one has to flip, because near-black on
  // the dark page would be invisible.
  cityEdge: "var(--color-city-edge)",
  // The hard, un-blurred offset shadow. Purely decorative, so no contrast
  // requirement — it darkens rather than outlines.
  cityShadow: "var(--color-city-shadow)",

  tomato: "var(--color-tomato)",
  tomatoInk: "var(--color-tomato-ink)",
  lemon: "var(--color-lemon)",
  lemonInk: "var(--color-lemon-ink)",
  pistachio: "var(--color-pistachio)",
  pistachioInk: "var(--color-pistachio-ink)",
  azzurro: "var(--color-azzurro)",
  azzurroInk: "var(--color-azzurro-ink)",
  bubble: "var(--color-bubble)",
  bubbleInk: "var(--color-bubble-ink)",
  grape: "var(--color-grape)",
  grapeInk: "var(--color-grape-ink)",
};

// Text that only a screen reader gets: the tick on a correct answer, the
// "completed" state of a card, the live announcement after an answer. Clipped
// to a 1px box rather than display:none or visibility:hidden, both of which
// take it out of the accessibility tree along with the layout.
export const SR_ONLY = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

// A tinted, theme-reactive background for a given accent token — e.g. the
// "you" bubble or a correct/incorrect answer state. Renders as
// `color-mix(...)` rather than hex+alpha so it keeps working once the
// underlying var() is repainted for dark mode.
export function tint(colorToken, percent = 15, base = TOKENS.card) {
  return `color-mix(in srgb, ${colorToken} ${percent}%, ${base})`;
}

// Per-level accent colors, reused by every module so A1…C1 always mean the
// same color everywhere in the app. `accent` is for fills/borders/badges
// only — always pair long text with `accentDeep`, never `accent` (that
// pairing is what caused the original contrast bug). Adding a level here is
// half the job: it also needs its --color-* pair declared in THEME_STYLE
// above, in the base :root *and* in all three override blocks.
export const LEVEL_ACCENTS = {
  A1: { accent: TOKENS.adriatic, accentDeep: TOKENS.adriaticDeep },
  A2: { accent: TOKENS.corallo, accentDeep: TOKENS.corolloDeep },
  B1: { accent: TOKENS.malachite, accentDeep: TOKENS.malachiteDeep },
  B2: { accent: TOKENS.viola, accentDeep: TOKENS.violaDeep },
  C1: { accent: TOKENS.laguna, accentDeep: TOKENS.lagunaDeep },
};

// ── La Città: the design system for the city map ─────────────────────────
//
// design/02-la-citta.html states it as four rules, applied to every surface
// so the style can't drift card by card:
//
//   1. A 3px ink border on everything. Nothing floats without an outline.
//   2. A hard offset shadow, never blurred — a flat block of ink, down-right.
//      That is what makes a tile read as a sticker rather than as glass.
//   3. An 18px radius and flat fills. No gradients anywhere.
//   4. Colour carries meaning: each district owns a hue and keeps it.
//
// The rules live here as numbers rather than as copied-out inline styles,
// because "applied everywhere" is only true if there is one place to apply.
export const CITY_RULES = {
  border: 3,
  radius: 18,
  shadow: "4px 4px 0",
  shadowSmall: "3px 3px 0",
};

// Rule 4, as data. `fill` is a flat block of colour; `ink` is the only text
// colour allowed on top of it — the pairing, not either half, is what
// theme.test.js checks against 4.5:1.
//
// Only grape flips between modes. #6B2FE8 is dark enough that on the dark
// page it manages 2.5:1, which is under the 3:1 a control boundary needs,
// so dark mode lightens it (and swaps its white text for dark). The other
// five fills are bright in both modes and stay put.
export const CITY_ACCENTS = {
  tomato: { fill: TOKENS.tomato, ink: TOKENS.tomatoInk },
  lemon: { fill: TOKENS.lemon, ink: TOKENS.lemonInk },
  pistachio: { fill: TOKENS.pistachio, ink: TOKENS.pistachioInk },
  grape: { fill: TOKENS.grape, ink: TOKENS.grapeInk },
  azzurro: { fill: TOKENS.azzurro, ink: TOKENS.azzurroInk },
  bubble: { fill: TOKENS.bubble, ink: TOKENS.bubbleInk },
};

// One chunky surface, obeying all four rules. Pass an accent name for a
// district's own colour, or nothing for the neutral card the map plate and a
// locked district use — which is the same shape in a quieter voice, and the
// one case where the outline has to flip with the theme.
export function citySurface(accent) {
  const paint = CITY_ACCENTS[accent];

  return {
    background: paint ? paint.fill : TOKENS.card,
    color: paint ? paint.ink : TOKENS.ink,
    border: `${CITY_RULES.border}px solid ${paint ? TOKENS.cityInk : TOKENS.cityEdge}`,
    borderRadius: CITY_RULES.radius,
    boxShadow: `${CITY_RULES.shadow} ${TOKENS.cityShadow}`,
  };
}
