// Shared design tokens for the whole app.
// Keep every module (vocab, grammar, conversations, stories) drawing colors
// and fonts from here so the app stays visually consistent as it grows.

export const FONTS_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
`;

export const TOKENS = {
  ink: "#1C3F4A",
  inkSoft: "#3E5C64",
  adriatic: "#2C6E7F",
  limoncello: "#E8A93B",
  limoncelloDeep: "#8A5E12",
  corallo: "#A83C32",
  corolloSoft: "#C97064",
  malachite: "#3F7A5C",
  malachiteSoft: "#6FA787",
  paper: "#F5F1E6",
  paperDeep: "#EAE3D2",
  card: "#FFFDF8",
  line: "#D9D0BA",
};

// Per-level accent colors, reused by every module so A1/A2/B1
// always mean the same color everywhere in the app.
export const LEVEL_ACCENTS = {
  A1: { accent: TOKENS.limoncello, accentDeep: TOKENS.limoncelloDeep },
  A2: { accent: TOKENS.corallo, accentDeep: "#5C231D" },
  B1: { accent: TOKENS.malachite, accentDeep: "#1E4030" },
};
