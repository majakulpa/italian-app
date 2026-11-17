import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CANZONI } from "./canzoni.js";

// The songs' own invariants. Two of them are load-bearing rather than tidy:
// the timing rule, which modules/canzoni/timing.js assumes and does not check
// per call, and the licence rule, because this is the first media this repo
// publishes and a public repo deploying to GitHub Pages is the wrong place to
// discover that a recording was never free to begin with.

describe("CANZONI", () => {
  it("ships at least one song", () => {
    expect(CANZONI.length).toBeGreaterThan(0);
  });

  it("gives every song an id of its own", () => {
    const ids = CANZONI.map((song) => song.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares every field the screen reads", () => {
    for (const song of CANZONI) {
      expect(Object.keys(song), song.id).toEqual(
        expect.arrayContaining(["id", "title", "year", "language", "languageName", "credits", "audio", "provenance", "lines"]),
      );
      expect(song.credits.music, song.id).toBeTruthy();
      expect(song.credits.words, song.id).toBeTruthy();
    }
  });

  // ── The language rule ────────────────────────────────────────────────────
  // A song's `language` is what the screen puts in `lang`, and it must be the
  // language actually sung rather than the one the app teaches. Marking
  // Neapolitan as `it` would have a screen reader apply Italian phonetics to a
  // different language — the SC 3.1.2 defect AnswerStatus.jsx:18-24 describes
  // from the other direction. It is a real subtag, so axe's `valid-lang`
  // accepts it; nothing but this test stops it drifting to "it" for tidiness.
  it("names the language actually sung, which is not Italian", () => {
    for (const song of CANZONI) {
      expect(song.language, song.id).toBe("nap");
      expect(song.languageName, song.id).toBeTruthy();
    }
  });

  // ── The licence rule ─────────────────────────────────────────────────────
  it("records where every recording came from and that it is free", () => {
    for (const song of CANZONI) {
      expect(song.provenance.licence, song.id).toMatch(/public domain/i);
      expect(song.provenance.recording, song.id).toBeTruthy();
    }
  });

  // The audio is the one asset a unit test can check the existence of, and it
  // is worth checking: a renamed file is a silent play button, and the e2e
  // suite would only catch it if somebody pressed play in it.
  it("points at an audio file that is actually in public/", () => {
    for (const song of CANZONI) {
      expect(existsSync(join(process.cwd(), "public", song.audio.src)), song.audio.src).toBe(true);
      expect(song.audio.duration, song.id).toBeGreaterThan(0);
    }
  });

  it("gives every line all three languages", () => {
    for (const song of CANZONI) {
      expect(song.lines.length, song.id).toBeGreaterThan(0);
      for (const [i, line] of song.lines.entries()) {
        const where = `${song.id} line ${i}`;
        expect(line.nap, where).toBeTruthy();
        expect(line.en, where).toBeTruthy();
        expect(line.pl, where).toBeTruthy();
      }
    }
  });

  // An `it` equal to the `nap` would be a restatement dressed as a lesson —
  // the field exists to show where the two languages part company, so a line
  // that carries one has to actually differ.
  it("only gives a line a standard-Italian equivalent when it differs", () => {
    for (const song of CANZONI) {
      for (const [i, line] of song.lines.entries()) {
        if (line.it) expect(line.it, `${song.id} line ${i}`).not.toBe(line.nap);
      }
    }
  });

  // ── The timing rule ─────────────────────────────────────────────────────
  // timing.js's activeLineIndex breaks out of its loop at the first line that
  // has not started, which is only correct for ascending timings, and it treats
  // a song as timed only when every line has a number. Both assumptions are
  // held here rather than re-checked on every call.
  //
  // Today every song is untimed: nobody has listened to a recording, so no
  // start has been measured, and guessing them is the thing this screen exists
  // not to do. When a timing pass lands, this test is what stops it landing
  // crooked.
  it("times every line or none, in order, inside the recording", () => {
    for (const song of CANZONI) {
      const starts = song.lines.map((line) => line.start);
      const timed = starts.filter((start) => typeof start === "number");

      expect([0, starts.length], song.id).toContain(timed.length);
      if (timed.length === 0) {
        expect(starts.every((start) => start === null), song.id).toBe(true);
        continue;
      }

      expect(timed[0], song.id).toBeGreaterThanOrEqual(0);
      expect(timed[timed.length - 1], song.id).toBeLessThanOrEqual(song.audio.duration);
      for (let i = 1; i < timed.length; i += 1) {
        expect(timed[i], `${song.id} line ${i}`).toBeGreaterThan(timed[i - 1]);
      }
    }
  });
});
