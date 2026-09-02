// L'Officina's workbenches, as data.
//
// design/02-la-citta.html screen 07 draws four benches — La Riserva, Le
// Mappe, Gli Articoli, Falsi Amici — each with a live figure on it. Two of
// those four have something behind them today, so two of them carry a figure
// here.
//
// ── Why the mockup's numbers are not in this file ───────────────────────
// The design's cards read `834 / 2000`, `4 / 8`, `giorno 148`, `71% ↑` and
// `12 presi`. Every one of those is a drawing, not a measurement: nothing
// records which traps you have walked into, and the Riserva's own quantity is
// still an open question (PLAN.md, open question 1). Gli Articoli now has
// data behind it and so has a figure — but not that figure: `giorno 148` is a
// day counter, which is a streak wearing a different label, and PLAN.md
// deleted the streak permanently. What its badge counts is sentences answered
// right first time, read back out of storage. PLAN.md's "only gate on numbers you have measured" is the rule that
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

// `route` is the module id this bench opens, or null for one that doesn't
// open yet. `module` is its id in MODULE_STATS, which districts.test.js uses
// to check nothing the app ships has lost its front door. `waiting` is the
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
    route: null,
    icon: Grid3x3,
    count: null,
    blurb: `The ${FONDAMENTALE_TARGET.toLocaleString("en-GB")} words of De Mauro in frequency order, each one coloured by how well you know it.`,
    waiting:
      "Waiting on one decision: which quantity it shows. Frequency-weighted coverage puts a day-one learner near 50%, because function words dominate — arithmetically right, and a useless thing to hand a beginner. Nothing goes on this bench until that is settled.",
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
