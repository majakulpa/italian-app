// WCAG contrast arithmetic over the shipped palette.
//
// jsdom has no paint, so axe can only ever return "incomplete" for the
// colour-contrast rule (see ./a11y.js). These helpers close that gap the
// other way round: they read the hex values straight out of THEME_STYLE,
// resolve the same color-mix() tints the components ask for, and compute the
// real WCAG ratio — so a palette change that dims text below AA fails the
// suite rather than waiting to be noticed on a screen.

// The three palettes the app can paint in. The base :root block is light and
// complete; the dark blocks override a subset of it, so dark = light + those.
export function parsePalettes(css) {
  const block = (pattern) => (css.match(pattern) || [, ""])[1];
  const vars = (chunk) =>
    Object.fromEntries([...chunk.matchAll(/(--color-[a-z-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

  const light = vars(block(/:root\s*\{([^}]*)\}/));
  const darkOverrides = vars(block(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/));

  return { light, dark: { ...light, ...darkOverrides } };
}

export function toRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function channelLuminance(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const [r, g, b] = toRgb(hex).map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// What `tint(color, percent, base)` from shared/theme.js actually paints:
// CSS color-mix(in srgb, color P%, base). sRGB mixing is a plain per-channel
// average weighted by the percentage, which is what browsers do here.
export function mix(color, base, percent) {
  const [cr, cg, cb] = toRgb(color);
  const [br, bg, bb] = toRgb(base);
  const w = percent / 100;
  const channel = (c, b) => Math.round(c * w + b * (1 - w));
  return `#${[channel(cr, br), channel(cg, bg), channel(cb, bb)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// WCAG 1.4.3 (text) and 1.4.11 (UI components and graphics).
export const AA_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;

export function round(ratio) {
  return Math.round(ratio * 100) / 100;
}
