// L'Officina's workbenches, as data.
//
// design/02-la-citta.html screen 07 draws four benches — La Riserva, Le
// Mappe, Gli Articoli, Falsi Amici — each with a live figure on it. Three of
// those four have something behind them today, so three of them carry a
// figure here.
//
// ── Why the mockup's numbers are not in this file ───────────────────────
// The design's cards read `834 / 2000`, `4 / 8`, `giorno 148`, `71% ↑` and
// `12 presi`. Every one of those was a drawing rather than a measurement, and
// the ones that now carry a figure carry a different one. Gli Articoli's
// `giorno 148` is a day counter, which is a streak wearing a different label,
// and PLAN.md deleted the streak permanently — what its badge counts is
// sentences answered right first time, read back out of storage. La Riserva's
// `834 / 2000` is every word touched at all, including the ones still in
// Leitner boxes 1–2; what its badge counts is the known-or-better subset, for
// the reason beside wordsHeld() below. Nothing records which traps you have
// walked into, so Falsi Amici still counts nothing. PLAN.md's "only gate on numbers you have measured" is the rule that
// kept four invented padlocks off the city map, and a figure invented to make
// a bench look busy is the same mistake in the same place. So a bench either
// derives its count from storage, or it says in a sentence what it is waiting
// on and shows no count at all.
//
// ── Why the vocabulary deck is a bench ──────────────────────────────────
// Before the hub existed the `officina` district routed straight to the
// vocabulary module, so pointing the district at this screen would have taken
// the app's largest content module off the map and left it reachable only
// through the NavMenu — the exact seam districts.test.js exists to prevent,
// re-opened one line below where it was closed. It is not one of the design's
// four benches because the design was drawn before the deck existed; it is
// real word work, so it gets a real card. La Riserva will eventually be the
// view *onto* what this deck teaches, not a replacement for it.

import { BookOpen, Grid3x3, Signpost, TriangleAlert, Type } from "lucide-react";
import { MAPS } from "../../data/mappe.js";
import { FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { coverage, heldWords } from "../../shared/coverage.js";
import { moduleStats } from "../../shared/stats.js";
import { mapKnownCount } from "../../shared/storage.js";

// A map counts as done when every drill on it is known — the same bar
// mapKnownCount already uses on Le Mappe's own screen, so the hub and the
// module can't disagree. Not moduleStats: that counts drills, and this bench
// counts whole maps, which is a fraction stats.js has no way to express.
// `total` is MAPS.length rather than the design's 8: four maps exist, and the
// denominator is the number of maps there are.
function mapsDone(progress) {
  return {
    done: MAPS.filter((map) => mapKnownCount(progress, map) === map.drills.length).length,
    total: MAPS.length,
    unit: "maps",
  };
}

// A sentence counts once it has been answered right first time. Straight
// through moduleStats, like the vocabulary deck below: stats.js already
// enumerates the articoli units with the same key builder and the same
// "known" bar the module writes, and it exists precisely so a bench and a
// module cannot hold two different counts of the same thing. Re-summing
// strandKnownCount here was a second implementation of one number.
// Sentences rather than strands: three is too coarse a denominator to move,
// and the item is the unit the learner meets.
function articlesLanded(progress) {
  const { done, total } = moduleStats(progress, "articoli");
  return { done, total, unit: "sentences" };
}

function wordsKnown(progress) {
  const { done, total } = moduleStats(progress, "vocab");
  return { done, total, unit: "words" };
}

// Straight out of the coverage tally, through the same heldWords() the
// Riserva header uses, so the bench and the room behind it cannot hold two
// ideas of "words you know".
//
// Known or better — Leitner box 3 and up — rather than the design's "every
// word touched". Screen 01 and screen 10 of the design disagree with each
// other by exactly this rule: 834 is every word met at all and 715 is the
// known-or-better subset the coverage percentage is made of. This badge sits
// one tap from that percentage, so counting the touched ones would put a
// bigger number next to a figure made of a smaller population and invite the
// reader to reconcile them. Boxes 1–2 are same-day and next-day recall, which
// is not yet a word you know.
function wordsHeld(progress) {
  return { done: heldWords(coverage(progress).counts), total: FONDAMENTALE_TARGET, unit: "words" };
}

// `route` is what this bench opens, or null for one that doesn't open yet:
// usually a module id, but La Riserva is a screen the hub renders itself,
// with no content to complete and no MODULE_STATS row — the same shape as
// the hub. `module` is its id in MODULE_STATS, which districts.test.js uses
// to check nothing the app ships has lost its front door, so a bench that
// opens no module leaves it null and contributes no door. `waiting` is the
// sentence a shut bench states instead of a count — never a bare padlock,
// per PLAN.md.
export const BENCHES = [
  {
    id: "vocab",
    name: "Vocabulary",
    module: "vocab",
    route: "vocab",
    accent: "azzurro",
    icon: BookOpen,
    count: wordsKnown,
    blurb: "Cards, quiz and listening, level by level. The deck the rest of the workshop is built out of.",
    waiting: null,
  },
  {
    id: "mappe",
    name: "Le Mappe",
    lang: "it",
    module: "mappe",
    route: "mappe",
    accent: "lemon",
    icon: Signpost,
    count: mapsDone,
    blurb:
      "One ending, learned once, and a few hundred words arrive behind it — with the traps that rule sets for you, which are the price of using it.",
    waiting: null,
  },
  {
    id: "riserva",
    name: "La Riserva",
    lang: "it",
    module: null,
    route: "riserva",
    accent: "grape",
    icon: Grid3x3,
    count: wordsHeld,
    blurb: `The ${FONDAMENTALE_TARGET.toLocaleString("en-GB")} words of De Mauro in frequency order, each one coloured by how well you know it.`,
    waiting: null,
  },
  {
    id: "articoli",
    name: "Gli Articoli",
    lang: "it",
    module: "articoli",
    route: "articoli",
    accent: "tomato",
    icon: Type,
    count: articlesLanded,
    blurb: "The strand that never finishes. Polish has no articles, so the errors survive into advanced proficiency.",
    waiting: null,
  },
  {
    id: "falsi-amici",
    name: "Falsi Amici",
    lang: "it",
    module: null,
    route: null,
    icon: TriangleAlert,
    count: null,
    blurb: "The traps a rule creates, collected as you walk into them.",
    waiting:
      "Not built. Every map already names its own traps on its card; what does not exist is anything that remembers which ones caught you. That is what this bench is short of.",
  },
];
