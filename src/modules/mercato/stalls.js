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

import { MessageCircle, Mic } from "lucide-react";
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
];
