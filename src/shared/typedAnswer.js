// Comparing a typed answer to the one that was wanted.
//
// This is the app's first production exercise — every other mode picks from
// options — and typing is where a hundred harmless differences turn into a
// hundred false negatives. A learner who types `perche` knows the word;
// `Città ` with a trailing space is the same answer as `città`; and on a
// phone keyboard the accented vowels are two taps away, so demanding them
// would be marking dexterity rather than Italian.
//
// So the rule is: fold the difference away for the *verdict*, and mention it
// afterwards. `accentsMissing` exists precisely so the caller can accept the
// answer and still say "it takes an accent: possibilità". Silently accepting
// and never mentioning it would teach the wrong spelling.
//
// Folding is NFD + strip the combining marks rather than a table of
// substitutions, so it covers è é ì í ò ó ù ú à and anything else Italian
// (or the learner's keyboard) produces, without a list to keep up to date.

export function foldTyped(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Same answer, allowing for accents, case and stray whitespace.
export function sameTyped(a, b) {
  return foldTyped(a) === foldTyped(b);
}

// Right letters, missing marks: `perche` for `perché`. False when the accents
// are already there, whatever the case or spacing — so a caller can tell
// "correct" from "correct, and here is how it's actually spelled".
export function accentsMissing(input, answer) {
  const bare = (value) => value.trim().toLowerCase().normalize("NFC");
  return sameTyped(input, answer) && bare(input) !== bare(answer);
}

// How far the two agree from the front, folded. This is the "where" in
// "a wrong answer gets located, not solved": `rivolu` out of `rivoluzione`
// tells the learner the stem was right and the ending wasn't, which is more
// use than a red cross. Returns the prefix taken from `answer`, so it reads
// back in its real spelling.
export function sharedPrefix(input, answer) {
  const folded = foldTyped(input);
  // Grown a character at a time off `answer` rather than sliced at an index
  // found in the folded strings: folding drops combining marks and collapses
  // whitespace, so the two strings don't share an index space.
  let prefix = "";
  for (const ch of answer) {
    if (!folded.startsWith(foldTyped(prefix + ch))) break;
    prefix += ch;
  }
  return prefix;
}
