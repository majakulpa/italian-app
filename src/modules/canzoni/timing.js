// Which lyric line is being sung right now, and how a timing pass writes its
// result down. Pure functions, deliberately separated from CanzoniModule so the
// interesting part is testable without a media element — jsdom has no working
// HTMLMediaElement, so anything that needs one to be exercised is something the
// coverage gate can only reach through a hand-rolled fake.
//
// ── Why a song may have no timings at all ───────────────────────────────────
// A sing-along needs to know when each line starts, and nobody can know that
// without listening to the recording. The person who built this screen could
// not: no timing had been measured when the song shipped, so every `start` in
// src/data/canzoni.js is `null`.
//
// The refusal to guess is the same one src/modules/scene/SceneListen.jsx:15-26
// makes when it declines to print "▶ 0:14" over a recording that does not
// exist — "a length nobody measured". Dividing the duration by the line count
// would have produced a highlight that drifts out of sync within two lines and
// looks like a bug rather than an absence.
//
// So an untimed song is a first-class state, not a broken one. `isTimed` is
// what the screen asks, and the answer decides whether it draws a sing-along or
// a bilingual lyric sheet. Both are useful; only one of them makes a claim
// about the recording.

// True when every line carries a numeric `start`, which is the only state the
// highlight can be trusted in.
//
// All-or-nothing rather than per-line, and that is a judgement. A song with
// timings on some lines would highlight in patches, and a learner cannot tell a
// line that was deliberately left out from one the app lost track of — the
// screen would be reporting its own incomplete data as if it were the music.
// canzoni.test.js holds the data to the same rule from the other side: every
// `start` is null, or all of them are numbers in ascending order.
export function isTimed(lines) {
  return lines.length > 0 && lines.every((line) => typeof line.start === "number");
}

// The index of the line being sung at `currentTime`, or -1 for "none yet".
//
// -1 covers two different situations on purpose: an untimed song, and a timed
// one during whatever instrumental introduction precedes the first line. The
// screen draws both the same way — no line highlighted — so splitting them
// would be a distinction without a render.
//
// The loop breaks on the first line that has not started, which assumes
// ascending `start` values. That assumption is not left to trust:
// canzoni.test.js fails if any song's timings are out of order, which is the
// cheaper place to catch it than here, where every call would pay for the
// check.
export function activeLineIndex(lines, currentTime) {
  if (!isTimed(lines)) return -1;

  let active = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].start > currentTime) break;
    active = i;
  }
  return active;
}

// A timing pass's output, as something that can be pasted into canzoni.js.
//
// This is the other half of refusing to guess: rather than shipping invented
// numbers, the screen can *measure* them. Somebody plays the recording, taps
// once as each line comes in, and this turns the taps they collected into the
// `start` values for the data file. One pass per song, and it is the same pass
// whoever adds the next song will need.
//
// Two decimal places because that is the precision a tap deserves — a human
// tapping along to music is accurate to a tenth of a second at best, and
// printing eight decimals would dress a tap up as a measurement.
export function formatTimings(times) {
  return `[${times.map((time) => time.toFixed(2)).join(", ")}]`;
}

// Seconds as a clock, for the elapsed/total readout beside the play button.
//
// `Math.floor` rather than rounding, because a clock that reads 2:22 over a
// 2:21.6 recording would be showing a moment the recording does not have. A
// media element can also report a hair under zero while it seeks, so negatives
// clamp to 0:00 rather than rendering "0:-1".
export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}
