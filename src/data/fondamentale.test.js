import { describe, it, expect } from "vitest";
import { FONDAMENTALE, FONDAMENTALE_TARGET } from "./fondamentale.js";

const ARTICLES = ["il", "lo", "la", "i", "gli", "le"];

// Nouns whose ending contradicts their gender. They end in -o or -a and still
// need the article, which is exactly why they are the interesting ones — and
// why they have to be declared here rather than slipping in unnoticed.
const GENDER_LIARS = ["la mano", "il problema"];

const articled = FONDAMENTALE.filter((w) => ARTICLES.includes(w.it.split(" ")[0]));

// Italian picks the article from the sound that follows it. `lo` (and plural
// `gli`) goes before s + consonant, z, gn, ps, pn, x, y and i + vowel; `il`
// (plural `i`) goes before every other consonant; both elide to l' before a
// vowel. Getting this wrong is the most visible possible error in a word list
// a learner reads, so it gets checked rather than trusted.
const VOWEL = /^[aeiouàèéìòù]/i;
const NEEDS_LO = /^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y|i[aeiou])/i;

const legalArticle = (article, noun) => {
  if (VOWEL.test(noun)) return article === "l'" || article === "gli" || article === "le";
  if (article === "lo" || article === "gli") return NEEDS_LO.test(noun);
  if (article === "il" || article === "i") return !NEEDS_LO.test(noun);
  return article === "la" || article === "le";
};

describe("FONDAMENTALE", () => {
  it("ships the first 300 of a 2,000-word target", () => {
    expect(FONDAMENTALE).toHaveLength(300);
    expect(FONDAMENTALE_TARGET).toBe(2000);
    expect(FONDAMENTALE.length).toBeLessThanOrEqual(FONDAMENTALE_TARGET);
  });

  // Coverage weights a word by its rank, so a gap or a repeat in the ranks is
  // a silently wrong percentage rather than a crash.
  it("is in rank order, contiguous from 1, with no gaps", () => {
    expect(FONDAMENTALE.map((w) => w.rank)).toEqual(FONDAMENTALE.map((_, i) => i + 1));
  });

  it("has a filled-in Italian, English and Polish gloss on every entry", () => {
    for (const word of FONDAMENTALE) {
      expect(word.it.trim(), `rank ${word.rank}`).toBeTruthy();
      expect(word.en.trim(), `rank ${word.rank} (${word.it})`).toBeTruthy();
      expect(word.pl.trim(), `rank ${word.rank} (${word.it})`).toBeTruthy();
    }
  });

  // The Italian string is the lookup key coverage.js indexes on, so a
  // duplicate would make one of the two words uncountable.
  it("lists each Italian entry once", () => {
    const seen = FONDAMENTALE.map((w) => w.it);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("stores every entry lower-case and untrimmed of nothing", () => {
    for (const word of FONDAMENTALE) {
      expect(word.it, `rank ${word.rank}`).toBe(word.it.trim().toLowerCase());
    }
  });
});

// The design is explicit that a noun whose gender its ending doesn't give away
// is stored with its article — `la chiave`, not `chiave`. These two tests hold
// both directions of that convention.
describe("FONDAMENTALE — the article convention", () => {
  it("puts an article only on nouns whose ending doesn't already say the gender", () => {
    const wrong = articled.filter((w) => /[oa]$/.test(w.it) && !GENDER_LIARS.includes(w.it));
    expect(wrong.map((w) => w.it)).toEqual([]);
  });

  it("keeps the gender-lying nouns, and only those, carrying an article despite an -o/-a ending", () => {
    expect(articled.filter((w) => /[oa]$/.test(w.it)).map((w) => w.it).sort()).toEqual([...GENDER_LIARS].sort());
  });

  // The other direction, and the one that catches the mistake the design
  // actually warns about: a bare `chiave`. Nothing in { rank, it, en, pl }
  // says which entries are nouns, so the check works by exclusion — every
  // bare entry with an opaque ending has to be a declared non-noun or an
  // infinitive. The list below is 50 words for the first 300 and barely grows
  // after that, because function words all live at the top of a frequency
  // list; adding one is the cost of keeping the convention enforced instead
  // of merely documented.
  const NON_NOUNS = new Set([
    "di", "che", "e", "il", "non", "un", "in", "per", "con", "come", "tu", "se", "su", "anche", "più",
    "lui", "lei", "noi", "voi", "mi", "ti", "ci", "si", "ne", "sì", "perché", "dove", "chi", "bene",
    "già", "sempre", "mai", "poi", "oggi", "ieri", "domani", "qui", "là", "così", "ogni", "qualche",
    "niente", "grande", "giovane", "breve", "facile", "difficile", "importante", "possibile", "uguale",
  ]);

  it("leaves no noun with an opaque ending standing bare", () => {
    const bare = FONDAMENTALE.filter((w) => !ARTICLES.includes(w.it.split(" ")[0]));
    const opaque = bare.filter(
      (w) => !/[oa]$/.test(w.it) && !/(are|ere|ire)$/.test(w.it) && !NON_NOUNS.has(w.it),
    );
    expect(opaque.map((w) => w.it)).toEqual([]);
  });

  it("uses the article form Italian phonology actually requires", () => {
    for (const word of articled) {
      const [article, ...rest] = word.it.split(" ");
      expect(legalArticle(article, rest.join(" ")), `${word.it} (rank ${word.rank})`).toBe(true);
    }
  });

  // Not a spot check for its own sake: the whole reason the list exists rather
  // than a scraped one is that these four are missing from frequency dumps.
  it("carries the concrete nouns a frequency dump loses", () => {
    const seen = FONDAMENTALE.map((w) => w.it);
    for (const noun of ["tavolo", "letto", "sedia", "porta"]) {
      expect(seen, noun).toContain(noun);
    }
  });
});
