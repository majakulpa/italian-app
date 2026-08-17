// localStorage-backed progress tracking, shared by every module.
// Progress shape: { words: { "<level>:<category>:<it>": "known" | "learning" },
//                    schedule: { "<same key>": { box, due, last } },
//                    streak: { count: number, lastDate: "YYYY-MM-DD" | null } }
//
// `words` and `schedule` are deliberately two maps rather than one map of
// richer objects: the status string is read by every module home and every
// counter in stats.js, so widening it would have meant migrating data that
// people have already built up. A blob saved before the scheduler existed
// simply has no `schedule` key and loads with an empty one — see srs.js for
// what an item with no schedule entry means.

const KEY = "italiano:progress:v1";

const EMPTY_PROGRESS = { words: {}, schedule: {}, streak: { count: 0, lastDate: null } };

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      words: parsed.words || {},
      schedule: parsed.schedule || {},
      streak: parsed.streak || EMPTY_PROGRESS.streak,
    };
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

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// "2026-08-17" + 3 -> "2026-08-20". Anchored to UTC midnight, like todayISO()
// above, so the two always agree on what day it is — and so a DST boundary
// can't turn +1 day into 23 hours and round back to the same date.
export function addDaysISO(iso, days) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

// Call once per study session (entering flashcards or quiz) to update the streak.
export function touchStreak(progress) {
  const today = todayISO();
  const { count, lastDate } = progress.streak;
  if (lastDate === today) return progress;
  const gap = lastDate ? daysBetween(lastDate, today) : null;
  const nextCount = gap === 1 ? count + 1 : 1;
  return { ...progress, streak: { count: nextCount, lastDate: today } };
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
