// localStorage seeding, for the one screen a fresh account cannot reach.
//
// WHY addInitScript WORKS HERE
//
// Every screen reads storage synchronously in a useState(loadProgress)
// initialiser — Dashboard.jsx:22, OfficinaModule.jsx:243,
// ReviewModule.jsx:722, CasaModule.jsx:39. There is no IndexedDB, no cookie
// and no server, so a value written before the first script runs is the value
// the first render sees.
//
// SEED BEFORE LOAD, NEVER DURING. The long-lived screens write the whole
// progress blob back on every answer (`useEffect(() => saveProgress(progress))`),
// so re-seeding `italiano:progress:v1` mid-test gets clobbered by the next
// answer. The other three slots have no such writer, so a mid-test write to
// them would survive — but nothing here does that: every seeder below is an
// addInitScript guarded to the first document, including seedTheme, because
// a value re-applied on a reload would overwrite a choice the app had made
// since. If a spec ever does need a mid-test write, those three slots are
// where it is safe, and it should use page.evaluate rather than this file.
import { PROGRESS_VERSION, wordKey } from "../src/shared/storage.js";
import { STORAGE_KEYS } from "./fixtures.js";

// Far in the past, never "today". todayISO() (storage.js:72) is UTC-anchored
// and isDue compares ISO strings, so a seed dated "today" computed in the
// runner's local time flips to not-yet-due across the midnight boundary — a
// test that fails once a day for an hour.
export const LONG_OVERDUE = "2020-01-01";

// Keys are built through the real builder rather than hand-rolled, so a
// change to the key format breaks this loudly instead of silently seeding a
// key nothing matches. wordKey takes (level, category, word) objects and
// reads .id/.id/.it — storage.js:64.
export function vocabKey(level, category, it) {
  return wordKey({ id: level }, { id: category }, { it });
}

// Write a progress blob before the app's first script runs.
//
// Guarded on the first-load flag the fixture sets, so a page.reload() inside
// a test does NOT re-seed and overwrite what the app has written since. See
// the STORAGE block in ./fixtures.js.
export async function seedProgress(page, { words = {}, schedule = {} } = {}) {
  const blob = JSON.stringify({ version: PROGRESS_VERSION, words, schedule });
  await page.addInitScript(
    ([key, value]) => {
      if (!window.__italianoE2EFirstLoad) return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // storage unavailable — the app handles that too
      }
    },
    [STORAGE_KEYS.progress, blob],
  );
}

// One overdue vocabulary item: the minimum that unlocks La Piazza.
//
// Three constraints make this the smallest seed that works, all of them in
// srs.js:
//   (a) dueUnits filters against scheduledUnits() (srs.js:152), so a key only
//       counts if it names a real unit enumerated by MODULE_STATS in
//       src/shared/stats.js. An invented key seeds nothing.
//   (b) an item is due only when progress.words[key] is truthy AND its
//       schedule entry's `due` is on or before today.
//   (c) a round is capped at SESSION_LIMIT = 20 (srs.js:26), so seeding more
//       than twenty only lengthens the queue, never the round.
//
// "A1:greetings:ciao" is the first word of the first category of A1
// (src/data/vocab.js), so it is as load-bearing a unit as the data has.
export async function seedOneDueWord(page) {
  const key = vocabKey("A1", "greetings", "ciao");
  await seedProgress(page, {
    words: { [key]: "known" },
    schedule: { [key]: { box: 1, due: LONG_OVERDUE, last: LONG_OVERDUE } },
  });
  return key;
}

// Set the stored light/dark choice. This is the ONLY way to reach the third
// palette: theme.js has :root (light, :25), the @media
// (prefers-color-scheme: dark) block (:67) and explicit
// :root[data-theme="dark"] (:91) / [data-theme="light"] (:113) blocks that
// only exist once useThemeMode has written a choice. A sweep driven by
// colorScheme alone never paints with those last two.
//
// The value is a BARE string, not JSON: saveThemeMode (storage.js:412) writes
// localStorage.setItem(THEME_KEY, mode) and loadThemeMode reads it back with
// no parse. A JSON-quoted '"dark"' would load as the string '"dark"', which
// is neither "system" nor "dark", so useThemeMode would set
// data-theme='"dark"' and theme.js's [data-theme="dark"] selector would miss
// — a seed that looks like it worked and paints the light palette.
export async function seedTheme(page, mode) {
  await page.addInitScript(
    ([key, value]) => {
      if (!window.__italianoE2EFirstLoad) return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // storage unavailable — the app handles that too
      }
    },
    [STORAGE_KEYS.theme, mode],
  );
}
