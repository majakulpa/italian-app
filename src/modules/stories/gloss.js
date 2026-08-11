// Turning a story paragraph into tappable words.
//
// Story paragraphs are plain Italian text plus a separate `gloss` map of
// word -> meaning (see src/data/stories.js). Rather than marking words up
// inside the text, the reader splits the paragraph here and looks each
// piece up, so authoring a gloss stays a single key/value pair.

// Anything that can sit around a word without being part of it. The
// apostrophes are deliberately absent — they're handled by lookupGloss,
// since an apostrophe inside a word ("l'acqua") is part of it.
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu;
const TOKEN_PARTS = /^([^\p{L}\p{N}']*)(.*?)([^\p{L}\p{N}']*)$/u;

// Split into alternating word/whitespace pieces, keeping the separators so
// the paragraph can be rebuilt exactly as written.
export function tokenize(text) {
  return text.split(/(\s+)/).filter((piece) => piece !== "");
}

// The lookup form of a token: lowercased, stripped of leading/trailing
// punctuation. "«Voglio" -> "voglio", "piedi," -> "piedi".
export function normalize(token) {
  return token.replace(EDGE_PUNCTUATION, "").toLowerCase().replace(/’/g, "'");
}

// Peel the punctuation off a token so the reader can underline only the
// word itself: "«Voglio" -> ["«", "Voglio", ""], "piedi," -> ["", "piedi", ","].
export function splitToken(token) {
  const [, before, core, after] = token.match(TOKEN_PARTS);
  return { before, core, after };
}

// Find a token's gloss entry, if it has one. Elisions match either whole
// ("l'acqua") or on the part after the apostrophe ("acqua"), so a gloss
// author doesn't have to predict which form the word appears in.
export function lookupGloss(gloss, token) {
  if (!gloss) return null;
  const word = normalize(token);
  if (!word) return null;
  if (gloss[word]) return { word, meaning: gloss[word] };
  const afterApostrophe = word.slice(word.lastIndexOf("'") + 1);
  if (afterApostrophe !== word && gloss[afterApostrophe]) {
    return { word: afterApostrophe, meaning: gloss[afterApostrophe] };
  }
  return null;
}
