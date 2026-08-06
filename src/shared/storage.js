// localStorage-backed progress tracking, shared by every module.
// Progress shape: { words: { "<level>:<category>:<it>": "known" | "learning" },
//                    streak: { count: number, lastDate: "YYYY-MM-DD" | null } }

const KEY = "italiano:progress:v1";

const EMPTY_PROGRESS = { words: {}, streak: { count: 0, lastDate: null } };

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_PROGRESS, ...parsed, words: parsed.words || {}, streak: parsed.streak || EMPTY_PROGRESS.streak };
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
