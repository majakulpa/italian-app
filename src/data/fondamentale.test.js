import { describe, it, expect } from "vitest";
import { FONDAMENTALE, FONDAMENTALE_TARGET, glossSenses } from "./fondamentale.js";

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
  it("ships the first 400 of a 2,000-word target", () => {
    expect(FONDAMENTALE).toHaveLength(400);
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

  // La Riserva's drill asks by the glosses and takes the Italian back, so a
  // gloss that names two entries would be a prompt with two right answers and
  // one of them marked wrong. modules/riserva/drill.js leans on this holding.
  //
  // It is the English gloss that has to be unique, not the pair: a learner
  // reads the English first, and "two entries share an English gloss but
  // differ in Polish" is still a prompt she can answer either way.
  it("gives every entry an English gloss no other entry has", () => {
    const glosses = FONDAMENTALE.map((w) => w.en.toLowerCase());
    const seen = new Map();
    for (const [i, gloss] of glosses.entries()) {
      seen.set(gloss, [...(seen.get(gloss) ?? []), FONDAMENTALE[i].it]);
    }
    expect([...seen.values()].filter((words) => words.length > 1)).toEqual([]);
  });

  // The other half of that, and the half the drill screen got wrong: the
  // Polish gloss is *not* a key, and nothing in this file makes it one.
  //
  // Twenty-four Polish senses in the first 300 entries are carried by two
  // entries or more — `mówić` by dire and parlare, `uczyć się` by studiare and
  // imparare, `głowa` by testa and capo — and three entries share their whole
  // Polish set with another: `non`/`no`, `a`/`in`, and `strada`/`via`, which
  // sit at adjacent ranks and so land in the same drill round.
  //
  // This is asserted rather than merely known because a screen was telling the
  // learner the opposite. DrillRound's note on a split entry claimed the Polish
  // senses "all point at the same Italian one"; on these they point at two.
  // The division of labour the drill actually has is the one above — English
  // disambiguates, Polish corroborates — and it only holds while this is true.
  //
  // If a lexicographer ever does make the Polish unique, this goes red, and
  // that is the moment the screen may say something stronger.
  it("does not make the Polish gloss a key, and the drill must not treat it as one", () => {
    const bySense = new Map();
    for (const word of FONDAMENTALE) {
      for (const sense of word.pl.split(" · ").map((s) => s.trim())) {
        bySense.set(sense, [...(bySense.get(sense) ?? []), word.it]);
      }
    }
    const shared = [...bySense].filter(([, words]) => words.length > 1);

    expect(shared.length).toBeGreaterThan(0);
    expect(Object.fromEntries(shared)).toMatchObject({
      "mówić": ["dire", "parlare"],
      "droga": ["strada", "via"],
      "ulica": ["strada", "via"],
    });

    // And an entry whose whole Polish set is another entry's, so the Polish
    // alone cannot pick between them at all.
    const strada = FONDAMENTALE.find((w) => w.it === "strada");
    const via = FONDAMENTALE.find((w) => w.it === "via");
    const set = (word) => word.pl.split(" · ").map((s) => s.trim()).sort().join("|");
    expect(set(strada)).toBe(set(via));
    expect(strada.en).not.toBe(via.en);
  });

  it("stores every entry lower-case and untrimmed of nothing", () => {
    for (const word of FONDAMENTALE) {
      expect(word.it, `rank ${word.rank}`).toBe(word.it.trim().toLowerCase());
    }
  });
});

// " · " is this file's own separator, so the function that splits on it lives
// here rather than in either of the two screens that read a gloss. It was
// exported from WordDetail.jsx, which pulled a React component module into
// drill.js and from there into La Piazza's question.js import path, to reach
// one string split.
describe("glossSenses", () => {
  it("splits on the separator the lexicon actually uses", () => {
    expect(glossSenses("pytać · prosić o")).toEqual(["pytać", "prosić o"]);
    expect(glossSenses("być")).toEqual(["być"]);
  });

  // Every gloss in the file goes through it, so a stray separator — a bare
  // "·" with no spaces, a trailing one — would silently produce an empty
  // sense and a screen that renders " · " with nothing after it.
  it("yields no empty sense anywhere in the list", () => {
    for (const word of FONDAMENTALE) {
      for (const gloss of [word.en, word.pl]) {
        const parts = glossSenses(gloss);
        expect(parts.length, `${word.it}: ${gloss}`).toBeGreaterThan(0);
        for (const part of parts) expect(part, `${word.it}: ${gloss}`).not.toBe("");
      }
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
  // infinitive. The list below was 50 words for the first 300, mostly
  // function words that live at the top of a frequency list — but ranks
  // 301–400 grew it by 13 in one pass, all numerals (`due`, `sei`, `dieci`...)
  // and a handful of -e adjectives (`blu`, `felice`, `triste`), because a
  // content batch further down the list can still land a run of opaque-ending
  // non-nouns; adding one is the cost of keeping the convention enforced
  // instead of merely documented.
  const NON_NOUNS = new Set([
    "di", "che", "e", "il", "non", "un", "in", "per", "con", "come", "tu", "se", "su", "anche", "più",
    "lui", "lei", "noi", "voi", "mi", "ti", "ci", "si", "ne", "sì", "perché", "dove", "chi", "bene",
    "già", "sempre", "mai", "poi", "oggi", "ieri", "domani", "qui", "là", "così", "ogni", "qualche",
    "niente", "grande", "giovane", "breve", "facile", "difficile", "importante", "possibile", "uguale",
    // Ranks 301–400 added numerals and a few more -e/-i adjectives, none of
    // which are nouns either — the same cost the comment above already names.
    "due", "tre", "cinque", "sei", "sette", "nove", "dieci", "mille",
    "blu", "verde", "marrone", "felice", "triste",
  ]);

  it("leaves no noun with an opaque ending standing bare", () => {
    // A vowel-initial opaque noun elides to `l'` and is not "bare" in the
    // sense this test means — it carries an article, just not a spaced one —
    // so it is excluded here and checked on its own terms below.
    const bare = FONDAMENTALE.filter((w) => !ARTICLES.includes(w.it.split(" ")[0]) && !w.it.startsWith("l'"));
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

// The limit the header names: a vowel-initial opaque noun elides `il`/`la` to
// `l'`, which stops carrying the gender on its own. Rank 352 (`l'animale`) is
// the first entry to hit it, so those entries carry a real `gender` field
// instead — required exactly there, and nowhere else, so the convention
// cannot quietly start leaning on it for a word that doesn't need it.
describe("FONDAMENTALE — vowel-initial nouns and their gender field", () => {
  const elided = FONDAMENTALE.filter((w) => w.it.startsWith("l'"));

  it("has at least one elided entry to test the rule against", () => {
    expect(elided.length).toBeGreaterThan(0);
  });

  it("only elides to l' when the stem is actually vowel-initial", () => {
    for (const word of elided) {
      expect(VOWEL.test(word.it.slice(2)), word.it).toBe(true);
    }
  });

  it("requires gender on every elided entry, and forbids it everywhere else", () => {
    for (const word of FONDAMENTALE) {
      if (word.it.startsWith("l'")) {
        expect(["m", "f"], word.it).toContain(word.gender);
      } else {
        expect(word.gender, word.it).toBeUndefined();
      }
    }
  });
});
