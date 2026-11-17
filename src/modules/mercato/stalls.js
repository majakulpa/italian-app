// Il Mercato's two stalls, as data — the same shape L'Officina's benches have,
// and registered in the shared station list for the same reason (see
// shared/stations.js).
//
// ── Why Il Mercato is a hub at all ──────────────────────────────────────
// The district routed straight at `conversations`, so the ten guided dialogues
// were the whole of the market. Le Scene is the four-phase shape design 02–06
// is built around, it belongs in the same district — both are "say it out loud
// to somebody", which is the district's own blurb — and neither replaces the
// other. The dialogues are scripted, offline and finishable; a scene is
// unscripted at the end and needs a partner the app cannot yet provide. Making
// scenes replace the dialogues would have deleted ten working screens to make
// room for three that are three-quarters built.
//
// ── What the badges count ───────────────────────────────────────────────
// Both come out of storage through moduleStats, which is the rule benches.js
// states at length: a station either derives its figure or shows none.
//
// Le Scene counts *words*, not scenes, and that is the honest figure rather
// than the convenient one. A scene is finished when its task is done with a
// scene partner, and the partner is not built — so "0 / 3 scene" could never
// move off zero, which is the invented-number mistake the city map spent a
// sweep avoiding. What a learner really banks in this slice is the scene's new
// words, written when Ascolta is finished, and that number moves the first
// time anybody opens a scene.

import { MessageCircle, Mic, Music } from "lucide-react";
import { moduleStats } from "../../shared/stats.js";
import { SCENES } from "../../data/scenes.js";

function sceneWordsMet(progress) {
  const { done, total } = moduleStats(progress, "scenes");
  return { done, total, unit: "words" };
}

function dialoguesDone(progress) {
  const { done, total } = moduleStats(progress, "conversations");
  return { done, total, unit: "dialogues" };
}

export const STALLS = [
  {
    id: "scenes",
    hub: "mercato",
    name: "Scene",
    lang: "it",
    module: "scenes",
    route: "scenes",
    // The district's own hue, and the design's: the phase meter across screens
    // 03–05 is drawn in #FFD23F, which is this token.
    accent: "lemon",
    icon: Mic,
    count: sceneWordsMet,
    blurb: `${SCENES.length} scenes at the market, each in four phases: watch it done, take the pieces, say it yourself, then do it for real.`,
    waiting: null,
  },
  {
    id: "dialoghi",
    hub: "mercato",
    name: "Dialoghi",
    lang: "it",
    module: "conversations",
    route: "conversations",
    accent: "azzurro",
    icon: MessageCircle,
    blurb: "Scripted conversations with the reply chosen from three. No microphone and no network — they work anywhere.",
    count: dialoguesDone,
    waiting: null,
  },
  // ── The first station in the city that counts nothing ──────────────────
  //
  // `view: true` and `module: null`, which is the shape benches.js kept the
  // flag alive for: "a route without a module has to *say* that it counts
  // nothing, rather than being handed a MODULE_STATS entry over keys nothing
  // writes". Le Canzoni writes no storage at all. A songs-listened figure
  // would be the content-consumed metric the coverage headline exists to
  // replace, and a song is the one thing here you would do for its own sake.
  //
  // So `count` is null and `badge` says what the stall is instead. Every
  // other station in both hubs derives a fraction; this one has no numerator
  // and no denominator and should not pretend to. What goes in the pill is
  // the fact a learner most needs on the door: it is dialect.
  //
  // It belongs in Il Mercato rather than L'Officina or Il Cinema because the
  // district's own blurb is "where you have to say it out loud to somebody",
  // and singing is saying it out loud. Il Cinema is the better long-term
  // home, but it routes straight at `stories` — putting a second screen
  // there means making it a hub, which is work that belongs with the serial.
  {
    id: "canzoni",
    hub: "mercato",
    name: "Canzoni",
    lang: "it",
    module: null,
    route: "canzoni",
    view: true,
    accent: "tomato",
    icon: Music,
    count: null,
    badge: "Napoletano",
    // Plural-agnostic on purpose: "N songs" with a count interpolated would
    // be a branch the coverage gate could not reach while only one ships.
    blurb: "Songs old enough to be nobody's property, with the words in Neapolitan, English and Polish. Nothing is marked or counted.",
    waiting: null,
  },
];
