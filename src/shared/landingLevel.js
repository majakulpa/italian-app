import { categoryKnownCount } from "./storage.js";

// Which level a module's home screen should open on.
//
// Every home screen used to open on LEVELS[0], so a learner working through
// B1 landed on A1 and re-picked their level on every visit. Two facts decide
// it instead: the level they were last on (storage.js, loadLastLevelId) and
// how far each level has been taken.
//
// "Complete" is every word in every category of the level marked known —
// the same count the category cards show. A level with no words in it at all
// is not complete; it is empty, and landing on it would be landing on a
// screen with nothing to do.
export function isLevelComplete(progress, level) {
  const total = level.categories.reduce((n, cat) => n + cat.words.length, 0);
  if (total === 0) return false;
  return level.categories.every((cat) => categoryKnownCount(progress, level, cat) === cat.words.length);
}

// The rule, in order:
//
// 1. The remembered level, if it still has work left in it. Where you were is
//    the best guess at where you want to be, and it is the one the learner
//    chose by hand.
// 2. Otherwise the first level that is not finished. This covers both the
//    first visit (nothing remembered) and the visit after finishing a level:
//    with A1 done and A2 and B1 part-done, you land on A2 rather than back on
//    the level you just cleared.
// 3. Everything finished: the remembered level if there is one, else the last
//    level — never the first, which would send a learner who has finished the
//    whole list back to "ciao".
//
// A remembered id that no longer matches a level (data edited under an old
// save) is treated as nothing remembered.
export function landingLevel(levels, progress, rememberedId) {
  const remembered = levels.find((lv) => lv.id === rememberedId) || null;
  if (remembered && !isLevelComplete(progress, remembered)) return remembered;

  const unfinished = levels.find((lv) => !isLevelComplete(progress, lv));
  return unfinished || remembered || levels[levels.length - 1];
}
