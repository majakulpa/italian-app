// La Città: the districts on the home screen, and what opens each one.
//
// The five districts are a new front door onto the four modules that already
// exist plus the review session. Nothing behind them is rewritten — a
// district knows a `route` (what App.jsx should show) and, where it has one,
// a `module` id it reads its progress from through stats.js. That is the
// whole coupling, which is why re-casting the app as a city costs no changes
// inside vocab, grammar, conversations or stories.
//
// ── Why so few locks ────────────────────────────────────────────────────
// design/02-la-citta.html shows a day-one map with five padlocks on it. Four
// of those five doors are scene districts (Il Bar, La Stazione, La Farmacia)
// that don't exist yet, and their thresholds are pacing choices nobody has
// measured. So the map ships exactly one lock, and it isn't a number at all:
// an empty review queue has nothing to show you, which is a fact about the
// data rather than a decision about pacing.
//
// Everything else opens from the start. A lock invented to make the map look
// busier would be the pacing guess the design spent a sweep avoiding.
//
// ── Why Il Cinema is no longer gated on 600 solid words ─────────────────
// It used to be, and the gate could never open. The threshold is real —
// research/gen-experiment/ measured it — but it is a threshold for *the
// generated serial*, which is PLAN.md chunk 6 and is not built. This district
// routes to `stories`: ten hand-written graded readers that ship today.
//
// Gating those on 600 solid words made them unreachable, because solid words
// come from the lexicon and `data/fondamentale.js` holds 400 of its 2,000
// target — so the ceiling is 400, pinned in `coverage.test.js` at 69.1%. The
// gate asked for half again as many words as the app contains, and it moved
// further out of reach rather than closer as the list grew: every entry
// added raises the ceiling, and 600 needs 200 more than exist. Every test
// that proved the door opened had to mock a solid count past that ceiling to
// do it, which is the tell — the district was shut for good, and the ten
// stories behind it were reachable only through the NavMenu.
//
// So the readers open, because reading is what the district is for, and the
// 600 comes back with the thing it was measured for — the serial goes inside
// Il Cinema behind its own gate, the way L'Officina holds benches. That keeps
// PLAN.md's "only gate on numbers you have measured" pointing the right way:
// the number was measured, it was just measuring something else.

import { Clapperboard, Hammer, RefreshCw, Store, Wrench } from "lucide-react";
import { moduleStats } from "./stats.js";
import { dueCount } from "./srs.js";

// `x`/`y` are percentages of the map plate, used both for the button's
// position and for the endpoints of the streets drawn under it — one set of
// coordinates so a tile and its street can never drift apart.
//
// La Piazza sits in the middle with a street to each of the other four,
// because review is the thing every district feeds and returns to.
export const DISTRICTS = [
  {
    id: "officina",
    name: "L'Officina",
    // The workshop hub (modules/officina), not a module: it holds no content
    // of its own, and the benches inside it open the modules that do. Its
    // `module` stays `vocab` because that is what the tile counts — the words
    // in the district. Mappatura delle parole's units are drills, which do not belong in an
    // "N / M words" figure.
    route: "officina",
    module: "vocab",
    accent: "grape",
    icon: Wrench,
    unit: "words",
    blurb: "Where words get taken apart. The one district that never locks.",
    x: 26,
    y: 15,
  },
  {
    id: "cantiere",
    name: "Il Cantiere",
    route: "grammar",
    module: "grammar",
    accent: "azzurro",
    icon: Hammer,
    unit: "drills",
    blurb: "Where sentences get built — the machinery behind the words.",
    x: 75,
    y: 26,
  },
  {
    id: "piazza",
    name: "La Piazza",
    route: "review",
    module: null,
    accent: "pistachio",
    icon: RefreshCw,
    // A review queue has no denominator: it counts what is waiting, not what
    // is finished, so La Piazza's tile is the one that shows a bare number.
    unit: null,
    blurb: "Where everything you have met comes back to find you.",
    x: 50,
    y: 52,
  },
  {
    id: "mercato",
    name: "Il Mercato",
    route: "conversations",
    module: "conversations",
    accent: "lemon",
    icon: Store,
    unit: "dialogues",
    blurb: "Where you have to say it out loud to somebody.",
    x: 24,
    y: 80,
  },
  {
    id: "cinema",
    name: "Il Cinema",
    route: "stories",
    module: "stories",
    accent: "bubble",
    icon: Clapperboard,
    unit: "stories",
    // The blurb used to promise a story written once you had enough words,
    // which was the serial's promise rather than this district's. What is
    // behind the door today is ten graded readers, so it says that instead.
    blurb: "Where you read something that was graded to meet you.",
    x: 76,
    y: 79,
  },
];

// Which districts a street runs between. Drawn from DISTRICTS' own
// coordinates, so moving a tile moves its roads with it.
export const STREETS = [
  ["officina", "piazza"],
  ["cantiere", "piazza"],
  ["piazza", "mercato"],
  ["piazza", "cinema"],
];

const byId = new Map(DISTRICTS.map((d) => [d.id, d]));

export function districtById(id) {
  return byId.get(id);
}

// L'Officina's benches that are modules in their own right but are not the
// one its tile counts. The tile names `vocab` because "N / M words" is what a
// district shows, and a district row can only name one module — so a
// scheduled module living inside the same walls needs saying here rather than
// inventing a district of its own for a workbench.
const BENCH_DISTRICT = { riserva: "officina", articoli: "officina" };

// Which district an item belongs to, by the module it came from. La Piazza
// uses it to colour and label a due item, so every scheduled module has to
// resolve — ReviewModule.test.jsx pins that, which is why the screen carries
// no "no district" branch.
export function districtForModule(moduleId) {
  return DISTRICTS.find((district) => district.module === moduleId) ?? byId.get(BENCH_DISTRICT[moduleId]);
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// The lock on one district, or null if it's open. `why` is the sentence the
// map states underneath — a padlock on its own tells you nothing, so every
// locked district says what opens it. `short` is the live counter that goes
// on the tile itself.
function lockFor(district, { due }) {
  if (district.id === "piazza" && due === 0) {
    return {
      short: "nothing due yet",
      why: "Opens the moment a word is waiting. Answer anything in L'Officina or Il Cantiere and the first ones come back tomorrow.",
    };
  }

  return null;
}

// What one district shows on the map: its lock, and the count on its tile.
//
// The count is deliberately a real fraction rather than a percentage —
// "3 / 10 dialogues" says how much is left, where "30%" is the content-
// consumed metric the coverage headline exists to replace.
function stateFor(district, progress, context) {
  const lock = lockFor(district, context);
  const stats = district.module ? moduleStats(progress, district.module) : null;

  return {
    ...district,
    lock,
    stats,
    done: stats !== null && stats.done === stats.total,
    // La Piazza counts what is waiting rather than what is finished; there is
    // no denominator to a review queue.
    status: lock ? lock.short : stats ? `${stats.done} / ${stats.total} ${district.unit}` : plural(context.due, "item"),
  };
}

// The whole map, in one read of storage. Everything the home screen draws
// comes through here so the tiles, the streets and the locked-door notes
// below them can't disagree about which districts are open.
export function cityState(progress) {
  const context = { due: dueCount(progress) };

  return DISTRICTS.map((district) => stateFor(district, progress, context));
}
