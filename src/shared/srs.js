// Spaced repetition: a five-box Leitner scheduler over vocabulary and grammar.
//
// Every study session in those two modules already grades an answer as simply
// right or wrong, which is exactly what Leitner wants — no ease factors, no
// 0-5 quality rating a binary UI can't produce. An item moves up one box when
// you get it right and falls all the way back to box 1 when you don't, and its
// box decides how long before it comes round again.
//
// Schedule entries live in progress.schedule (see storage.js); an item's box
// and its "known"/"learning" status are written together by reviewItem below,
// so the dashboard's counts and the queue can't disagree.

import { markWord, todayISO, addDaysISO } from "./storage.js";
import { MODULE_STATS } from "./stats.js";
import { shuffle } from "./shuffle.js";

// Days until an item in box N comes round again. Box 1 is 0 days — "later
// today" — which in practice means the next session rather than a requeue
// inside the current one: a queue is built once when a session starts.
export const BOX_DAYS = [0, 1, 3, 7, 21];
export const MAX_BOX = BOX_DAYS.length;

// How many items one review sitting holds. Also what keeps the first review
// after upgrading from dumping every word you've ever studied on you at once.
export const SESSION_LIMIT = 20;

export function boxInterval(box) {
  return BOX_DAYS[Math.min(Math.max(box, 1), MAX_BOX) - 1];
}

// Where an item lands after being answered. A right answer promotes one box
// (capped at the top); a wrong answer goes straight back to box 1 from
// wherever it was, including from the top box.
export function nextSchedule(entry, correct, today) {
  // An item nobody has answered yet sits in box 1, so getting it right the
  // first time promotes it to box 2 — same as any other correct answer.
  const box = correct ? Math.min((entry?.box ?? 1) + 1, MAX_BOX) : 1;
  return { box, due: addDaysISO(today, boxInterval(box)), last: today };
}

// An item with no schedule entry is due. It was either never studied, or
// studied before the scheduler existed — and in the second case there's no
// honest answer to when it's next due, so the safe reading is "now".
export function isDue(entry, today) {
  if (!entry?.due) return true;
  return entry.due <= today; // ISO dates sort as strings
}

// Every unit the scheduler covers, as { key, item, group, level, moduleId }.
function scheduledUnits() {
  return MODULE_STATS.filter((mod) => mod.scheduled).flatMap((mod) =>
    mod.levels.flatMap((level) => mod.units(level).map((unit) => ({ ...unit, level, moduleId: mod.id }))),
  );
}

// The queue for a review session: things you've studied at least once and
// that are due today or overdue. Untouched items are left out — review is for
// bringing back what you've met, not for meeting new material, which is what
// the modules themselves are for.
export function dueItems(progress, today = todayISO(), limit = SESSION_LIMIT) {
  const due = scheduledUnits().filter(
    (unit) => progress.words[unit.key] && isDue(progress.schedule[unit.key], today),
  );

  // Most overdue first so nothing starves, then shuffled within the cut so a
  // session interleaves vocabulary and grammar instead of marching through
  // one module and then the other.
  due.sort((a, b) => (progress.schedule[a.key]?.due || "").localeCompare(progress.schedule[b.key]?.due || ""));
  return shuffle(due.slice(0, limit));
}

export function dueCount(progress, today = todayISO()) {
  return scheduledUnits().filter(
    (unit) => progress.words[unit.key] && isDue(progress.schedule[unit.key], today),
  ).length;
}

// The single write point for a graded answer: moves the item's box and its
// known/learning status together. Every vocab and grammar session goes
// through this, so ordinary study feeds the scheduler as a side effect.
export function reviewItem(progress, key, correct, today = todayISO()) {
  const withStatus = markWord(progress, key, correct ? "known" : "learning");
  return {
    ...withStatus,
    schedule: { ...withStatus.schedule, [key]: nextSchedule(progress.schedule[key], correct, today) },
  };
}
