// L'Officina's workbenches, as data.
//
// design/02-la-citta.html screen 07 draws four benches — La Riserva, Le
// Mappe, Gli Articoli, Falsi Amici — each with a live figure on it. Three of
// those four have something behind them today, so three of them carry a
// figure here.
//
// ── Why the mockup's numbers are not in this file ───────────────────────
// The design's cards read `834 / 2000`, `4 / 8`, `giorno 148`, `71% ↑` and
// `12 presi`. Every one of those is a drawing, not a measurement: nothing
// records which traps you have walked into. The Riserva's own quantity is now
// settled (PLAN.md, "Coverage is never shown as a percentage of ability"):
// counts and per-band worth, never a percentage — so `834 / 2000` is the one
// mockup figure here that was right all along, and it becomes real the day the
// grid is built. Gli Articoli now has
// data behind it and so has a figure — but not that figure: `giorno 148` is a
// day counter, which is a streak wearing a different label, and PLAN.md
// deleted the streak permanently. What its badge counts is sentences answered
// right first time, read back out of storage. Falsi Amici now has a figure
// too, and `12 presi` turns out to have been the one honest number in the
// mockup — it is the right *quantity*, taken rather than available, just not
// the right value. PLAN.md's "only gate on numbers you have measured" is the rule that
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
import { FALSI_AMICI } from "../../data/falsiAmici.js";
import { FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { lexiconStates } from "../../shared/coverage.js";
import { moduleStats } from "../../shared/stats.js";
import { mapKnownCount, trapsCaughtCount } from "../../shared/storage.js";

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

// The one bench whose figure is not progress. `12 presi` on the design's card
// is *taken*, and taken is what this counts: how many of the false friends
// the app knows about have actually caught the learner, read straight out of
// the caught key in storage.js. Not moduleStats, and the difference is the
// point — moduleStats counts the ones she can now produce the right word for,
// which is the opposite fact about the same list. A bench that showed that
// number would be a false-friends card reporting on how well the drilling is
// going, when the thing worth knowing is which traps have had you.
//
// The denominator is every trap in the collection rather than only the ones
// met, so the bench reads "3 of 14" from the first day: the uncaught ones are
// on that screen to be read before they get the chance, which is the whole
// argument for having the list at all.
function trapsCaught(progress) {
  return { done: trapsCaughtCount(progress, FALSI_AMICI), total: FALSI_AMICI.length, unit: "caught" };
}

// What the Riserva itself draws: ranks the learner holds at learning or
// better, out of the whole 2,000. Read through lexiconStates so the bench and
// the screen cannot disagree — the same rule as counting Gli Articoli through
// moduleStats.
function lexiconHeld(progress) {
  const states = lexiconStates(progress);
  return { done: [...states.values()].filter((s) => s !== "unseen").length, total: FONDAMENTALE_TARGET, unit: "words" };
}

function wordsKnown(progress) {
  const { done, total } = moduleStats(progress, "vocab");
  return { done, total, unit: "words" };
}

// `route` is what this bench opens, or null for one that doesn't open yet.
// Usually that is a module id. La Riserva is the exception and the reason
// `view` exists: it opens a screen that *reads* progress the other benches
// wrote and keeps none of its own, exactly as ReviewModule is "a route, not a
// MODULES entry". Giving it a MODULE_STATS entry to satisfy the old
// route-implies-module rule would have meant inventing keys nothing writes —
// the same mistake as the `met` word state, which was designed, counted,
// tested, and impossible for any learner to have. So a bench either names a
// module it opens, or is marked `view: true` and names neither. `module` is its id in MODULE_STATS, which districts.test.js uses
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
    route: "riserva",
    view: true,
    // The last free hue in the city palette. `bubble` is the other one and is
    // not available: pink means Polish everywhere in L'Officina.
    accent: "pistachio",
    icon: Grid3x3,
    count: lexiconHeld,
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
    module: "falsi-amici",
    route: "falsi-amici",
    accent: "grape",
    icon: TriangleAlert,
    count: trapsCaught,
    blurb:
      "The traps a rule creates, and the ones no rule reaches — collected as you walk into them, and readable before you do.",
    waiting: null,
  },
];
