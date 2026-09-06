// Falsi Amici — the traps, collected.
//
// A false friend is a claim about two languages at once, so a wrong one here
// teaches an error permanently and the learner — Polish L1 — spots it
// instantly. Same discipline as data/mappe.js: accuracy over length. Every
// pair below was checked in both directions, and the one PLAN.md names that
// did not survive the check is written up rather than quietly dropped (see
// `tappeto` at the foot of this file).
//
// ── Two sources, one collection ─────────────────────────────────────────
// PLAN.md says Le Mappe is where *most* of these get generated, not all, and
// that is exactly the shape of the data.
//
//   from a map   `-cja → -zione` reliably produces the right *shape* and has
//                no opinion about the *meaning*, so every map already
//                declares the traps its own rule sets. Those are referenced
//                here by `from`, never restated: a second copy of
//                `colazione` is the drift shared/stats.js exists to prevent,
//                and it would be a copy that could disagree with the card
//                the learner reads it on.
//   nobody's     `droga`, `firma`, `divano` and the rest follow no suffix
//                rule at all. Latin handed the same word to both languages
//                and the two took it in different directions, which no map
//                can generate and nothing else in the app had a place for.
//
// ── Shape of an entry ───────────────────────────────────────────────────
//   id                 stable, and the storage key is built off it. Never
//                      the spelling: fixing a gloss must not lose a learner
//                      the record of having been caught by it.
//   it / means         the Italian word, and what it actually means.
//   lookalike          the Polish or English word it is not, its language,
//                      and what *that* one means.
//   note               why the pair is worth the space — usually which of
//                      the learner's two languages is the one lying.
//   say                what to reach for instead: the Italian the lookalike
//                      actually translates to, an `also` of other answers
//                      that are just as right, and an English gloss.
//
// `say` is the one field a map trap does not carry, and it is the reason
// this file exists as more than a filter. A map's trap card teaches what the
// word is *not*; the drill here asks the learner to produce what it *is*,
// and the map states that in prose (`Supper is la cena`) rather than in
// data. Teaching fields belong to the map, the production answer belongs to
// the bench that drills it.
//
// ── The drill this feeds ────────────────────────────────────────────────
// Prompt from the lookalike, produce the Italian, and the false friend is
// the tempting wrong answer — Le Mappe's own trap-drill shape, and PLAN.md's
// retrieval rule (produce first, reveal last) either way. So every entry
// needs a `say` whether it came from a map or not.

import { MAPS } from "./mappe.js";
import { foldTyped } from "../shared/typedAnswer.js";

// Traps no map generates, authored here. Each one was checked in both
// languages — the Italian word's meaning, the Polish or English lookalike's
// meaning, and that the two genuinely diverge rather than merely rhyming.
const OWN = [
  {
    id: "droga",
    it: "droga",
    means: "a drug — a narcotic, or a medicine in a chemist's sense",
    lookalike: "droga",
    lookalikeLang: "pl",
    lookalikeMeans: "a road, a way",
    note: "Identical spelling, no shared sense left at all. La droga is what a police report means; the road you drive on is la strada.",
    say: { it: "strada", also: [], en: "a road" },
  },
  {
    id: "firma",
    it: "firma",
    means: "a signature — the thing you write at the bottom of a page",
    lookalike: "firma",
    lookalikeLang: "pl",
    lookalikeMeans: "a company, a business",
    note: "The verb gives it away: firmare is to sign. A Polish firma is una ditta or un'azienda, and the Polish for la firma is podpis.",
    say: { it: "ditta", also: ["azienda"], en: "a company, a firm" },
  },
  {
    id: "divano",
    it: "divano",
    means: "a sofa, a couch",
    lookalike: "dywan",
    lookalikeLang: "pl",
    lookalikeMeans: "a carpet, a rug",
    note: "Both are furniture and both are in the same room, which is what makes this one stick. A dywan is il tappeto; a divano is a kanapa.",
    say: { it: "tappeto", also: [], en: "a carpet, a rug" },
  },
  {
    id: "cena",
    it: "cena",
    means: "dinner, the evening meal",
    lookalike: "cena",
    lookalikeLang: "pl",
    lookalikeMeans: "a price",
    note: "Le Mappe mentions this one in passing, on the drill where kolacja lands on cena. It is written down as a trap here, which is the only place the app can show it to you before it catches you.",
    say: { it: "prezzo", also: [], en: "a price" },
  },
  {
    id: "panna",
    it: "panna",
    means: "cream — la panna montata is whipped cream",
    lookalike: "panna",
    lookalikeLang: "pl",
    lookalikeMeans: "a young unmarried woman; Miss",
    note: "Worth knowing before you order. The Polish sense is la signorina, and Polish for the Italian sense is śmietana.",
    say: { it: "signorina", also: [], en: "a young woman, Miss" },
  },
  {
    id: "fabbrica",
    it: "fabbrica",
    means: "a factory",
    lookalike: "fabric",
    lookalikeLang: "en",
    lookalikeMeans: "cloth, material",
    note: "PLAN.md's own worked example of Polish winning: fabryka is exactly la fabbrica, and English is the language that misleads. Cloth is il tessuto.",
    say: { it: "tessuto", also: ["stoffa"], en: "cloth, material" },
  },
  {
    id: "parenti",
    it: "parenti",
    means: "relatives — aunts, cousins, the whole lot",
    lookalike: "parents",
    lookalikeLang: "en",
    lookalikeMeans: "your mother and father",
    note: "Polish keeps the two apart and English does not: krewni against rodzice. Your parents are i genitori.",
    say: { it: "genitori", also: [], en: "parents" },
  },
  {
    id: "libreria",
    it: "libreria",
    means: "a bookshop — also the bookcase it stands in",
    lookalike: "library",
    lookalikeLang: "en",
    lookalikeMeans: "the place you borrow books from",
    note: "Polish is safe again: biblioteka is la biblioteca, and księgarnia is la libreria. Only English pulls you the wrong way.",
    say: { it: "biblioteca", also: [], en: "a library" },
  },
  {
    id: "eventualmente",
    it: "eventualmente",
    means: "possibly, if it comes to that",
    lookalike: "eventually",
    lookalikeLang: "en",
    lookalikeMeans: "in the end, sooner or later",
    note: "Polish agrees with Italian here — ewentualnie is eventualmente — so the only language misleading you is the one you are fluent in.",
    say: { it: "alla fine", also: ["prima o poi"], en: "in the end, sooner or later" },
  },
];

// The production answer for a trap a map already declares. Keyed by the
// trap's id, so the map keeps every teaching field and this file adds only
// the one the map has in prose rather than in data.
const SAY_FOR_MAP_TRAP = {
  colazione: { it: "cena", also: [], en: "supper, the evening meal" },
  attualita: { it: "realtà", also: [], en: "reality, the state of being real" },
  // The map's own note offers both, so both are right and both are accepted.
  patetico: { it: "ampolloso", also: ["solenne"], en: "pompous, grandiloquent" },
  simpatico: { it: "comprensivo", also: [], en: "compassionate, understanding" },
  autista: { it: "autistico", also: [], en: "autistic" },
};

// The trap word as a learner would type it. Le Mappe writes `l'attualità`
// with its article, because the card is teaching a noun and the article is
// half of what a -ità noun is; nothing types an article into a one-word
// answer box.
function bare(word) {
  return word.replace(/^(l['’]|il |lo |la |i |gli |le )/, "");
}

function fromMaps() {
  return MAPS.flatMap((map) =>
    map.traps.map((trap) => ({ ...trap, mapId: map.id, source: "mappe", say: SAY_FOR_MAP_TRAP[trap.id] })),
  );
}

// Two sets rather than one flat list, and the split is the thing worth
// showing: the first set is the price of a rule the learner is being taught
// to use, and the second set is nobody's fault and nothing generates it.
// It is also the run length — fourteen typed answers in a row is a chore,
// and each set is a session.
export const TRAP_SETS = [
  {
    id: "mappe",
    name: "The maps set these",
    accent: "lemon",
    blurb:
      "A suffix rule gets the shape right and has no opinion about the meaning, so every map hands you a few confident mistakes along with the few hundred words. Le Mappe names them on the card that creates them; this is where they are kept.",
    traps: fromMaps(),
  },
  {
    id: "altri",
    name: "Nothing generates these",
    accent: "grape",
    blurb:
      "No rule reaches them. Latin gave the same word to Italian and to Polish or English, the two languages walked off with it in different directions, and the only defence is having met the pair once.",
    traps: OWN,
  },
].map((set) => ({
  ...set,
  traps: set.traps.map((trap) => ({ ...trap, setId: set.id, bait: bare(trap.it) })),
}));

export const FALSI_AMICI = TRAP_SETS.flatMap((set) => set.traps);

// The trap a typed Italian word walks into, or null. This is the join
// between Le Mappe and this bench: a mapping drill that produces a `trap`
// verdict has caught the learner with the map's own output, and where that
// output is one of these, it is the same event the bench is a record of.
//
// It returns null far more often than not, and deliberately: three of Le
// Mappe's four trap drills bait with `citità`, `musico` and `psichiatrista`,
// which are not words at all in the sense that matters — they are the rule
// overreaching, not a false friend. Only `colazione` is both.
const BY_WORD = new Map(FALSI_AMICI.map((trap) => [foldTyped(trap.bait), trap]));

export function trapByWord(word) {
  return BY_WORD.get(foldTyped(word)) ?? null;
}

// ── What was checked, and what was left out ─────────────────────────────
//
// `firma` is the one PLAN.md flagged as suspect, and it survives: Italian
// `la firma` is a signature (from `firmare`, to sign) and Polish `firma` is
// a company. They diverge completely — Polish for the Italian sense is
// `podpis`, Italian for the Polish sense is `la ditta` or `l'azienda`. It is
// in.
//
// `tappeto` is out, and it is a real pair: Italian `il tappeto` is a carpet
// and Polish `tapeta` is wallpaper. It is left out because the drill it
// would make is bad — the answer is `la carta da parati`, a four-word
// phrase, and this bench asks for one typed word. The pair is half-taught
// anyway by `divano`, whose note names `il tappeto` as the right answer for
// `dywan`.
//
// `pasta` is out for a different reason: Italian `pasta` really does mean
// paste as well as pasta (`pasta dentifricia`), so Polish `pasta` is not a
// false friend so much as a narrower one. A pair that needs a paragraph of
// hedging is not a trap.
