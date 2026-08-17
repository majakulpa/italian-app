// Progress arithmetic for the home dashboard.
//
// Every module already writes into the same `progress.words` map, namespaced
// by its own key builder in storage.js. This file is the one place that reads
// that map back across all four modules at once, so the dashboard can't drift
// from what a module itself counts as done: the unitKeys functions below call
// the very same key builders the modules use.

import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { wordKey, drillKey, conversationKey, storyKey } from "./storage.js";

// One entry per module: how to enumerate a level's completable units, and
// which stored status counts as finished. Ids must match the MODULES array in
// App.jsx — stats.test.js pins that.
export const MODULE_STATS = [
  {
    id: "vocab",
    levels: LEVELS,
    unitKeys: (level) => level.categories.flatMap((cat) => cat.words.map((w) => wordKey(level, cat, w))),
    doneStatus: "known",
  },
  {
    id: "grammar",
    levels: GRAMMAR_LEVELS,
    unitKeys: (level) => level.topics.flatMap((topic) => topic.drills.map((d) => drillKey(level, topic, d))),
    doneStatus: "known",
  },
  {
    id: "conversations",
    levels: CONVERSATION_LEVELS,
    unitKeys: (level) => level.dialogues.map((d) => conversationKey(level, d)),
    doneStatus: "done",
  },
  {
    id: "stories",
    levels: STORY_LEVELS,
    unitKeys: (level) => level.stories.map((s) => storyKey(level, s)),
    doneStatus: "done",
  },
];

function tally(done, total) {
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// done/total for one module at one level.
function countLevel(progress, mod, level) {
  const keys = mod.unitKeys(level);
  return tally(keys.filter((k) => progress.words[k] === mod.doneStatus).length, keys.length);
}

// Averaging module percentages, rather than pooling every unit into one
// fraction. Pooled, vocabulary's 120 words would be over half of the app's
// units and finishing a whole story would barely move the bar — averaging
// makes each of the four modules worth a quarter of the figure.
function averagePct(tallies) {
  if (tallies.length === 0) return 0;
  return Math.round(tallies.reduce((sum, t) => sum + t.pct, 0) / tallies.length);
}

// Raw unit count for one module across every level — this one is a real
// fraction, because it's the number shown on that module's own card
// ("48 / 120 words known").
export function moduleStats(progress, moduleId) {
  const mod = MODULE_STATS.find((m) => m.id === moduleId);
  if (!mod) return tally(0, 0);

  const perLevel = mod.levels.map((level) => countLevel(progress, mod, level));
  return tally(
    perLevel.reduce((sum, t) => sum + t.done, 0),
    perLevel.reduce((sum, t) => sum + t.total, 0),
  );
}

// How far one level is, across all four modules. `pct` is the averaged
// figure; `done`/`total` stay raw so a caller can still show counts.
export function levelStats(progress, levelId) {
  const perModule = MODULE_STATS.flatMap((mod) => {
    const level = mod.levels.find((l) => l.id === levelId);
    return level ? [countLevel(progress, mod, level)] : [];
  });

  return {
    done: perModule.reduce((sum, t) => sum + t.done, 0),
    total: perModule.reduce((sum, t) => sum + t.total, 0),
    pct: averagePct(perModule),
  };
}

// The single headline figure on the dashboard, averaged the same way.
export function overallStats(progress) {
  const perModule = MODULE_STATS.map((mod) => moduleStats(progress, mod.id));

  return {
    done: perModule.reduce((sum, t) => sum + t.done, 0),
    total: perModule.reduce((sum, t) => sum + t.total, 0),
    pct: averagePct(perModule),
  };
}

// The level ladder the dashboard draws, in ladder order. Derived from the
// vocab levels rather than a hardcoded list — levels.test.js already
// guarantees all four modules offer the same ids in the same order, and this
// way the ladder picks up a new level with no extra edit.
export function levelLadder(progress) {
  return LEVELS.map((level) => ({ level, stats: levelStats(progress, level.id) }));
}
