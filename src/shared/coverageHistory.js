// Writing coverage down, so Casa can draw how it has moved.
//
// storage.js owns the shape and the rules (one point a day, only on a change);
// this is the single place that reads the live figure and hands it over. App.jsx
// calls it when the app opens and on every move between screens — which is
// when a module has just been left and its answers are already in storage — so
// the point lands before Casa, if that is where the move goes, reads it.
//
// The date on a point is the day it was recorded, not the day the answers
// behind it were given. The two only differ when a session is closed without
// leaving the screen it was on; the next open then records it. That is a day
// late at most, never a figure that was not reached.

import { coverage } from "./coverage.js";
import { loadProgress, loadCoverageHistory, saveCoverageHistory, addCoveragePoint, todayISO } from "./storage.js";

export function recordCoverage(today = todayISO()) {
  const before = loadCoverageHistory();
  const after = addCoveragePoint(before, today, coverage(loadProgress()).pct);
  if (after !== before) saveCoverageHistory(after);
  return after;
}
