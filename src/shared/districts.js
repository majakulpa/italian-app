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
// measured. Exactly one number in the design comes out of an experiment
// rather than out of someone's judgement — Il Cinema's 600 — so exactly one
// district here is gated on a number. La Piazza's gate isn't a number at
// all: an empty review queue has nothing to show you, which is a fact about
// the data rather than a decision about pacing.
//
// Everything else opens from the start. A lock invented to make the map look
// busier would be the pacing guess the design spent a sweep avoiding.

import { Clapperboard, Hammer, RefreshCw, Store, Wrench } from "lucide-react";
import { moduleStats } from "./stats.js";
import { dueCount } from "./srs.js";
import { coverage } from "./coverage.js";

// The threshold out of research/gen-experiment/: at 400 known words the best
// achievable coverage of text written *for* the learner is 90.1%, which is
// roughly one unknown word in ten — decoding rather than reading. At 600 it
// is 97.2%, comfortably past Nation's 95% floor. The second half of the
// condition is about output rather than input: two districts finished means
// the learner has produced Italian before being handed a page of it to read.
export const CINEMA_SOLID_WORDS = 600;
export const CINEMA_DISTRICTS = 2;

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
    // in the district. Le Mappe's units are drills, which do not belong in an
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
    blurb: "Where the story is, once there are enough words to write you one.",
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

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// A district counts as finished when every unit of its module is done. La
// Piazza has no content of its own — it replays other districts' — so it is
// not a district you can finish, and it doesn't count toward Il Cinema.
//
// No guard against an empty module, which would read 0/0 as finished: every
// module ships content and levels.test.js holds it that way, so the guard
// would be a branch nothing could reach and therefore nothing could honestly
// cover. Add it back the day a district can legitimately be empty.
function isFinished(progress, district) {
  const stats = moduleStats(progress, district.module);
  return stats.done === stats.total;
}

function finishedCount(progress) {
  return DISTRICTS.filter((d) => d.module).filter((d) => isFinished(progress, d)).length;
}

// The lock on one district, or null if it's open. `why` is the sentence the
// map states underneath — a padlock on its own tells you nothing, so every
// locked district says what opens it. `short` is the live counter that goes
// on the tile itself.
function lockFor(district, { due, solid, finished }) {
  if (district.id === "piazza" && due === 0) {
    return {
      short: "nothing due yet",
      why: "Opens the moment a word is waiting. Answer anything in L'Officina or Il Cantiere and the first ones come back tomorrow.",
    };
  }

  if (district.id === "cinema") {
    const wordsToGo = Math.max(CINEMA_SOLID_WORDS - solid, 0);
    const districtsToGo = Math.max(CINEMA_DISTRICTS - finished, 0);
    if (wordsToGo === 0 && districtsToGo === 0) return null;

    return {
      short: wordsToGo > 0 ? `${plural(wordsToGo, "word")} to go` : `${plural(districtsToGo, "district")} to go`,
      why:
        `Opens at ${CINEMA_SOLID_WORDS} solid words and ${CINEMA_DISTRICTS} districts finished — ` +
        `you have ${solid} and ${finished}. Below ${CINEMA_SOLID_WORDS} the best a story written for you ` +
        "can manage is about 90% known words, and that is decoding rather than reading.",
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
  const context = {
    due: dueCount(progress),
    solid: coverage(progress).counts.solid,
    finished: finishedCount(progress),
  };

  return DISTRICTS.map((district) => stateFor(district, progress, context));
}
