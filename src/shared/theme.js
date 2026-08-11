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

  --color-adriatic: #2A63E4;
  --color-adriatic-deep: #1E3E8C;
  --color-corallo: #C92E2E;
  --color-corallo-deep: #7A1F1F;
  --color-malachite: #187A48;
  --color-malachite-deep: #0F4C2C;
  --color-limoncello: #E8A93B;
  --color-limoncello-deep: #8A5E12;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-ink: #E7E3D8;
    --color-ink-soft: #93A5AC;
    --color-paper: #14202A;
    --color-paper-deep: #1C2C38;
    --color-card: #1F313D;
    --color-line: #3A4E5A;

    --color-adriatic-deep: #8FB4FF;
    --color-corallo-deep: #FF9B9B;
    --color-malachite-deep: #7FE0AC;
    --color-limoncello-deep: #FFD98A;
  }
}

:root[data-theme="dark"] {
  --color-ink: #E7E3D8;
  --color-ink-soft: #93A5AC;
  --color-paper: #14202A;
  --color-paper-deep: #1C2C38;
  --color-card: #1F313D;
  --color-line: #3A4E5A;

  --color-adriatic-deep: #8FB4FF;
  --color-corallo-deep: #FF9B9B;
  --color-malachite-deep: #7FE0AC;
  --color-limoncello-deep: #FFD98A;
}

:root[data-theme="light"] {
  --color-ink: #1C3F4A;
  --color-ink-soft: #3E5C64;
  --color-paper: #F5F1E6;
  --color-paper-deep: #EAE3D2;
  --color-card: #FFFDF8;
  --color-line: #D9D0BA;

  --color-adriatic-deep: #1E3E8C;
  --color-corallo-deep: #7A1F1F;
  --color-malachite-deep: #0F4C2C;
  --color-limoncello-deep: #8A5E12;
}
`;

export const TOKENS = {
  ink: "var(--color-ink)",
  inkSoft: "var(--color-ink-soft)",
  paper: "var(--color-paper)",
  paperDeep: "var(--color-paper-deep)",
  card: "var(--color-card)",
  line: "var(--color-line)",

  // Metro line blue — A1, and the "formal" tone color.
  adriatic: "var(--color-adriatic)",
  adriaticDeep: "var(--color-adriatic-deep)",
  // Metro line red — A2, and quiz/drill "incorrect" feedback.
  corallo: "var(--color-corallo)",
  corolloDeep: "var(--color-corallo-deep)",
  // Metro line green — B1, and quiz/drill "correct" feedback.
  malachite: "var(--color-malachite)",
  malachiteDeep: "var(--color-malachite-deep)",
  // Gold — casual tone, streaks, celebratory accents. Not a level color.
  limoncello: "var(--color-limoncello)",
  limoncelloDeep: "var(--color-limoncello-deep)",
};

// A tinted, theme-reactive background for a given accent token — e.g. the
// "you" bubble or a correct/incorrect answer state. Renders as
// `color-mix(...)` rather than hex+alpha so it keeps working once the
// underlying var() is repainted for dark mode.
export function tint(colorToken, percent = 15, base = TOKENS.card) {
  return `color-mix(in srgb, ${colorToken} ${percent}%, ${base})`;
}

// Per-level accent colors, reused by every module so A1/A2/B1 always mean
// the same color everywhere in the app. `accent` is for fills/borders/
// badges only — always pair long text with `accentDeep`, never `accent`
// (that pairing is what caused the original contrast bug).
export const LEVEL_ACCENTS = {
  A1: { accent: TOKENS.adriatic, accentDeep: TOKENS.adriaticDeep },
  A2: { accent: TOKENS.corallo, accentDeep: TOKENS.corolloDeep },
  B1: { accent: TOKENS.malachite, accentDeep: TOKENS.malachiteDeep },
};
