// Progress arithmetic for the home dashboard.
//
// Every module already writes into the same `progress.words` map, namespaced
// by its own key builder in storage.js. This file is the one place that reads
// that map back across every module at once, so the dashboard can't drift
// from what a module itself counts as done: the unitKeys functions below call
// the very same key builders the modules use.

import { LEVELS } from "../data/vocab.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { CONVERSATION_LEVELS } from "../data/conversations.js";
import { STORY_LEVELS } from "../data/stories.js";
import { MAPS } from "../data/mappe.js";
import { STRANDS } from "../data/articoli.js";
import { wordKey, drillKey, conversationKey, storyKey, mappeKey, articoliKey } from "./storage.js";

// One entry per module: how to enumerate a level's completable units, and
// which stored status counts as finished. Ids must match the MODULES array in
// App.jsx — stats.test.js pins that.
//
// `units` yields { key, item, group } rather than a bare key because the
// spaced-repetition scheduler (srs.js) has to turn a due key back into the
// word or drill to show, and into its sibling group to draw distractors from.
// `group` is the category/topic an item belongs to, or null where a module's
// unit *is* the group (a dialogue, a story).
//
// `scheduled` marks the modules the Leitner scheduler covers. Conversations
// are excluded because they have no wrong answer by design, and stories
// because a story is read rather than drilled.
export const MODULE_STATS = [
  {
    id: "vocab",
    levels: LEVELS,
    scheduled: true,
    units: (level) =>
      level.categories.flatMap((cat) => cat.words.map((w) => ({ key: wordKey(level, cat, w), item: w, group: cat }))),
    doneStatus: "known",
  },
  {
    id: "grammar",
    levels: GRAMMAR_LEVELS,
    scheduled: true,
    units: (level) =>
      level.topics.flatMap((topic) =>
        topic.drills.map((d) => ({ key: drillKey(level, topic, d), item: d, group: topic })),
      ),
    doneStatus: "known",
  },
  {
    id: "conversations",
    levels: CONVERSATION_LEVELS,
    scheduled: false,
    units: (level) => level.dialogues.map((d) => ({ key: conversationKey(level, d), item: d, group: null })),
    doneStatus: "done",
  },
  {
    id: "stories",
    levels: STORY_LEVELS,
    scheduled: false,
    units: (level) => level.stories.map((s) => ({ key: storyKey(level, s), item: s, group: null })),
    doneStatus: "done",
  },
  {
    id: "mappe",
    // `levels` is really "the containers this module enumerates units from".
    // For the other four that is the CEFR ladder; Le Mappe has no ladder,
    // because a suffix correspondence isn't A1 or B2 — `-cja → -zione` is
    // worth the same on day one as in year two. So its containers are the
    // maps themselves. levelStats() looks a container up by level id, finds
    // none, and leaves Le Mappe out of every rung, which is the right answer
    // rather than a gap.
    levels: MAPS,
    // Not in the review queue, and this is a decision rather than an
    // oversight. Two reasons, both about what the queue is for. A Leitner box
    // schedules a *lexical item*, which decays one word at a time; a map is a
    // productive rule, and once `-cja → -zione` is installed it doesn't fade
    // word by word — the words it unlocks decay, and those belong to the
    // lexicon, which vocab already feeds. And La Piazza is a multiple-choice
    // surface: putting a typed production item into it would either turn
    // "produce first" back into recognition, or need a second interaction
    // model inside ReviewModule, which is a change to La Piazza and not to
    // Le Mappe. Revisit when La Piazza learns to ask for typing.
    scheduled: false,
    units: (map) => map.drills.map((d) => ({ key: mappeKey(map, d), item: d, group: map })),
    doneStatus: "known",
  },
  {
    id: "articoli",
    // Strands where the other modules put CEFR levels, for the same reason Le
    // Mappe puts maps there: the article system is not A1 or B2. It is the
    // first thing a beginner gets wrong and it is still the thing an advanced
    // Polish speaker gets wrong, which is exactly why PLAN.md calls it the
    // permanent strand. levelStats() looks a container up by level id, finds
    // none, and leaves it out of every rung.
    levels: STRANDS,
    // Out of the review queue, and — like Le Mappe — a decision rather than
    // an oversight, though for a different reason. Le Mappe's blocker is the
    // interaction model: La Piazza is multiple-choice and Le Mappe types. An
    // article item *is* multiple-choice, so that objection does not apply
    // here and the queue would accept it as it stands.
    //
    // The objection that does apply is the feedback. La Piazza answers a
    // wrong pick by painting the right option green and revealing it on the
    // spot — the standard wrong → red cross → answer pattern that PLAN.md
    // names as the weakest feedback shape available, and the exact pattern
    // this bench was built to replace. Scheduling article items would take
    // the app's most carefully located feedback and replay it in the weakest
    // form available, which is a worse outcome than them not recurring.
    //
    // Revisit when La Piazza learns to locate a wrong answer rather than
    // solve it. That is a change to La Piazza, not to this bench.
    scheduled: false,
    units: (strand) => strand.items.map((i) => ({ key: articoliKey(strand, i), item: i, group: strand })),
    doneStatus: "known",
  },
];

function tally(done, total) {
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// done/total for one module at one level.
function countLevel(progress, mod, level) {
  const units = mod.units(level);
  return tally(units.filter((u) => progress.words[u.key] === mod.doneStatus).length, units.length);
}

// Averaging module percentages, rather than pooling every unit into one
// fraction. Pooled, vocabulary's 120 words would be over half of the app's
// units and finishing a whole story would barely move the bar — averaging
// makes each of the four levelled modules worth a quarter of the figure.
// Le Mappe is not one of them: it declares no CEFR level, so it contributes
// to no rung and doesn't dilute the four that do.
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

// How far one level is, across the modules that have that level. `pct` is the averaged
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

// The level ladder the dashboard draws, in ladder order. Derived from the
// vocab levels rather than a hardcoded list — levels.test.js already
// guarantees all four modules offer the same ids in the same order, and this
// way the ladder picks up a new level with no extra edit.
export function levelLadder(progress) {
  return LEVELS.map((level) => ({ level, stats: levelStats(progress, level.id) }));
}
