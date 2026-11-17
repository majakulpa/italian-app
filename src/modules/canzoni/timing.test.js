import { describe, it, expect } from "vitest";
import { isTimed, activeLineIndex, formatTimings, formatClock } from "./timing.js";
import { CANZONI } from "../../data/canzoni.js";

// The timed cases are built here rather than read out of canzoni.js, and that
// is the one place in this repo where a test fixture is written by hand on
// purpose. Every song that ships is untimed — no recording has been listened
// to — so the shipped data cannot exercise the branch that matters most. These
// stand in for a song that has had its timing pass done.
const timed = [
  { start: 0 },
  { start: 4.5 },
  { start: 9 },
];

describe("isTimed", () => {
  it("accepts a song whose every line carries a number", () => {
    expect(isTimed(timed)).toBe(true);
  });

  // The state every song in the app is actually in today.
  it("rejects a song whose lines carry no timings", () => {
    expect(isTimed([{ start: null }, { start: null }])).toBe(false);
  });

  // All-or-nothing: see the argument in timing.js. One missing number makes
  // the whole song untimed rather than partly highlighted.
  it("rejects a song timed only in patches", () => {
    expect(isTimed([{ start: 0 }, { start: null }, { start: 9 }])).toBe(false);
  });

  // `every` is true of an empty list, so without the length guard a song with
  // no lines at all would claim to be timed and then highlight nothing.
  it("rejects a song with no lines", () => {
    expect(isTimed([])).toBe(false);
  });

  // Every song that ships really is untimed — if this starts failing, a timing
  // pass has been done and this file's `timed` fixture is no longer the only
  // way to reach the highlight.
  it("reports every shipped song as untimed, which is what they are", () => {
    for (const song of CANZONI) {
      expect(isTimed(song.lines), song.id).toBe(false);
    }
  });
});

describe("activeLineIndex", () => {
  it("highlights nothing in a song with no timings", () => {
    expect(activeLineIndex([{ start: null }, { start: null }], 30)).toBe(-1);
  });

  // The instrumental introduction. -1 is the same answer an untimed song
  // gets, deliberately: the screen draws both as "no line highlighted".
  it("highlights nothing before the first line comes in", () => {
    expect(activeLineIndex(timed, -1)).toBe(-1);
  });

  it("highlights a line from the exact moment it starts", () => {
    expect(activeLineIndex(timed, 0)).toBe(0);
    expect(activeLineIndex(timed, 4.5)).toBe(1);
  });

  it("holds a line until the next one starts", () => {
    expect(activeLineIndex(timed, 4.49)).toBe(0);
    expect(activeLineIndex(timed, 8.99)).toBe(1);
  });

  // Nothing follows the last line, so it stays lit through the outro rather
  // than the highlight vanishing before the music does.
  it("keeps the last line lit after it starts", () => {
    expect(activeLineIndex(timed, 9)).toBe(2);
    expect(activeLineIndex(timed, 600)).toBe(2);
  });
});

describe("formatTimings", () => {
  // Two decimals, because a human tapping along to music is accurate to about
  // a tenth of a second and more digits would dress a tap up as a measurement.
  it("prints taps as a pasteable array, rounded to a tap's worth of precision", () => {
    expect(formatTimings([0, 4.5006, 9.129])).toBe("[0.00, 4.50, 9.13]");
  });

  it("prints an empty pass as an empty array", () => {
    expect(formatTimings([])).toBe("[]");
  });
});

describe("formatClock", () => {
  it("pads the seconds so the readout does not jump about", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(70)).toBe("1:10");
  });

  // Flooring, not rounding: 2:22 over a 2:21.6 recording would show a moment
  // the recording does not have.
  it("floors rather than rounds", () => {
    expect(formatClock(141.9)).toBe("2:21");
  });

  // A media element can report a hair under zero while it seeks.
  it("clamps a negative time to zero", () => {
    expect(formatClock(-0.4)).toBe("0:00");
  });
});
