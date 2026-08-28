// localStorage-backed progress tracking, shared by every module.
// Progress shape (version 2): { version: 2,
//                    words: { "<level>:<category>:<it>": "learning" | "known" | "done" },
//                    schedule: { "<same key>": { box, due, last } } }
//
// "learning" and "known" are written by reviewItem for a graded vocab or
// grammar answer; "done" is written by the stories and conversations modules,
// whose units are finished rather than known. Those three are the whole set —
// wordState.test.js pins that no other status can reach the map.
//
// `words` and `schedule` are deliberately two maps rather than one map of
// richer objects: the status string is read by every module home and every
// counter in stats.js, so widening it would have meant migrating data that
// people have already built up. A blob saved before the scheduler existed
// simply has no `schedule` key and loads with an empty one — see srs.js for
// what an item with no schedule entry means.
//
// The four-state word model the dashboard and coverage figure are built on is
// *derived* from these two maps rather than stored beside them — see
// wordState.js. Storing a state as well as a box would let the two disagree.

// The localStorage slot. Deliberately still "v1": it is where a learner's
// progress lives, and renaming it would strand every existing save. The shape
// inside it is versioned by the `version` field, migrated on load.
const KEY = "italiano:progress:v1";

export const PROGRESS_VERSION = 2;

const EMPTY_PROGRESS = { version: PROGRESS_VERSION, words: {}, schedule: {} };

// Read an older blob forward. v1 carried a `streak: { count, lastDate }`
// counter; v2 drops it, because days-logged turned out to correlate with
// almost nothing (see the evidence review) and nothing in the app reads it any
// more. Everything a v1 user actually earned lives in `words` and `schedule`,
// and both come through untouched — the migration only stops copying a key.
function migrate(parsed) {
  return {
    version: PROGRESS_VERSION,
    words: parsed.words || {},
    schedule: parsed.schedule || {},
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    return migrate(JSON.parse(raw));
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable (private browsing, quota, etc.) — progress just won't persist
  }
}

export function wordKey(level, category, word) {
  return `${level.id}:${category.id}:${word.it}`;
}

export function markWord(progress, key, status) {
  return { ...progress, words: { ...progress.words, [key]: status } };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// "2026-08-17" + 3 -> "2026-08-20". Anchored to UTC midnight, like todayISO()
// above, so the two always agree on what day it is — and so a DST boundary
// can't turn +1 day into 23 hours and round back to the same date.
export function addDaysISO(iso, days) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function categoryKnownCount(progress, level, category) {
  return category.words.filter((w) => progress.words[wordKey(level, category, w)] === "known").length;
}

// Grammar drill items are keyed by level/topic/item id rather than an
// Italian word, so they get their own key builder — namespaced with a
// "grammar:" prefix to avoid ever colliding with a vocab wordKey.
export function drillKey(level, topic, item) {
  return `grammar:${level.id}:${topic.id}:${item.id}`;
}

export function topicKnownCount(progress, level, topic) {
  return topic.drills.filter((d) => progress.words[drillKey(level, topic, d)] === "known").length;
}

// Conversations don't have a "known"/"learning" word to track — a dialogue
// is either completed or not — so this reuses the same map with a
// "conversation:" namespace and a "done" status.
export function conversationKey(level, dialogue) {
  return `conversation:${level.id}:${dialogue.id}`;
}

export function isConversationDone(progress, level, dialogue) {
  return progress.words[conversationKey(level, dialogue)] === "done";
}

// Stories work like conversations: read + answer the comprehension
// questions and the story is "done". Same map, "story:" namespace.
export function storyKey(level, story) {
  return `story:${level.id}:${story.id}`;
}

export function isStoryDone(progress, level, story) {
  return progress.words[storyKey(level, story)] === "done";
}

// Le Mappe drills work like grammar drills — right first time is "known",
// anything else is "learning" — so they need no new shape in the blob, only
// their own namespace. A save written before Le Mappe existed simply has no
// "mappe:" keys in it and loads unchanged; nothing here had to be versioned.
export function mappeKey(map, drill) {
  return `mappe:${map.id}:${drill.id}`;
}

export function mapKnownCount(progress, map) {
  return map.drills.filter((d) => progress.words[mappeKey(map, d)] === "known").length;
}

// Explicit light/dark choice, separate from the progress blob so a reset of
// one doesn't touch the other. No stored value means "follow the OS" —
// see useThemeMode.js.
const THEME_KEY = "italiano:theme:v1";

export function loadThemeMode() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function saveThemeMode(mode) {
  try {
    if (mode) {
      localStorage.setItem(THEME_KEY, mode);
    } else {
      localStorage.removeItem(THEME_KEY);
    }
  } catch {
    // storage unavailable (private browsing, quota, etc.) — falls back to OS preference
  }
}
