import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CanzoniModule from "./CanzoniModule.jsx";
import { CANZONI } from "../../data/canzoni.js";

const shipped = CANZONI[0];

// ── Why there is a hand-written song in here ────────────────────────────────
// Every song the app ships is untimed — nobody has listened to a recording, so
// no `start` has been measured, and canzoni.test.js holds the data to exactly
// that. The highlight is the whole point of the screen and the shipped data
// cannot reach it, so the timed case needs a song that does not exist. That is
// what `songs` is a prop for.
//
// The second line deliberately carries no `it`: a line already close to
// standard Italian gets no equivalent, and the branch that omits it needs
// exercising as much as the one that prints it.
const TIMED = [
  {
    ...shipped,
    id: "timed-fixture",
    lines: [
      { nap: "Prima riga", en: "First line", pl: "Pierwszy wers", it: "Prima riga in italiano", start: 2 },
      { nap: "Seconda riga", en: "Second line", pl: "Drugi wers", start: 5 },
      { nap: "Terza riga", en: "Third line", pl: "Trzeci wers", it: "Terza riga in italiano", start: 10 },
    ],
  },
];

// jsdom implements no media element worth the name: play() and pause() throw
// "Not implemented" and fire no events. These stand in, and they dispatch the
// events a real element would so that the screen's `playing` state is driven
// the same way it is in a browser — through onPlay/onPause rather than by the
// click handler guessing.
function stubMedia({ rejects = false } = {}) {
  const play = vi.fn(function play() {
    if (rejects) return Promise.reject(new Error("blocked by the autoplay policy"));
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  const pause = vi.fn(function pause() {
    this.dispatchEvent(new Event("pause"));
  });
  HTMLMediaElement.prototype.play = play;
  HTMLMediaElement.prototype.pause = pause;
  return { play, pause };
}

// Moving the playhead. Three things are going on here and all three are
// necessary:
//
// - `currentTime` is *defined* rather than assigned, because jsdom's own
//   setter is not reliable, and the screen reads the value both off the event
//   target and off the ref.
// - the event is dispatched natively, because that is how a real media element
//   drives this screen — there is no timer to advance.
// - `act` wraps it, because a native dispatch is outside React's knowledge and
//   the state update it causes is otherwise not flushed before the next
//   assertion. Without it a second seek in one test silently keeps the first
//   seek's render.
function seek(seconds) {
  const audio = document.querySelector("audio");
  Object.defineProperty(audio, "currentTime", { value: seconds, configurable: true });
  act(() => {
    audio.dispatchEvent(new Event("timeupdate"));
  });
  return audio;
}

function fire(type) {
  const audio = document.querySelector("audio");
  act(() => {
    audio.dispatchEvent(new Event(type));
  });
}

async function openSong(user, songs) {
  render(<CanzoniModule onExit={() => {}} songs={songs} />);
  await user.click(screen.getByRole("button", { name: /Funicul/ }));
}

beforeEach(() => {
  localStorage.clear();
  stubMedia();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete HTMLMediaElement.prototype.play;
  delete HTMLMediaElement.prototype.pause;
  delete Element.prototype.scrollIntoView;
  delete window.matchMedia;
});

describe("the Canzoni landing", () => {
  it("lists the songs with the language on the door", () => {
    render(<CanzoniModule onExit={() => {}} />);

    expect(screen.getByRole("heading", { level: 1, name: "Le Canzoni" })).toBeInTheDocument();
    const card = screen.getByRole("button", { name: /Funicul/ });
    // The caveat is on the card, not behind it: this is dialect, and a learner
    // should know before they tap.
    expect(card).toHaveTextContent(shipped.languageName);
    expect(card).toHaveTextContent(String(shipped.year));
  });

  it("says outright that it counts nothing", () => {
    render(<CanzoniModule onExit={() => {}} />);
    expect(screen.getByText(/Nothing here is marked, counted or remembered/)).toBeInTheDocument();
  });

  it("leaves the stall when the back link is pressed", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<CanzoniModule onExit={onExit} exitLabel="Il Mercato" />);

    await user.click(screen.getByRole("button", { name: "Il Mercato" }));
    expect(onExit).toHaveBeenCalled();
  });
});

describe("a song", () => {
  it("opens with the credits and the dialect warning", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    expect(screen.getByRole("heading", { level: 1, name: shipped.title })).toBeInTheDocument();
    expect(screen.getByText(/This is Neapolitan, not standard Italian/)).toBeInTheDocument();
    // "Sung by" rather than the performer's name: the name also appears in the
    // provenance footer, and two matches is an ambiguous selector rather than
    // a passing test.
    expect(screen.getByText(/Sung by/)).toHaveTextContent(shipped.audio.performer);
  });

  // The whole lyric is on screen from the start, in the language it is sung
  // in. `nap`, not `it` — marking it Italian would have a screen reader read
  // Neapolitan with Italian phonetics (SC 3.1.2).
  it("marks the words as Neapolitan rather than Italian", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    const first = screen.getByText(shipped.lines[0].nap);
    expect(first).toHaveAttribute("lang", "nap");
  });

  it("goes back to the song list, not out of the stall", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<CanzoniModule onExit={onExit} exitLabel="Il Mercato" />);

    await user.click(screen.getByRole("button", { name: /Funicul/ }));
    await user.click(screen.getByRole("button", { name: "Le Canzoni" }));

    expect(screen.getByRole("heading", { level: 1, name: "Le Canzoni" })).toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
  });

  it("says nobody has timed the recording, because nobody has", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);
    expect(screen.getByText(/Nobody has timed this recording yet/)).toBeInTheDocument();
  });

  it("drops that note once a song is timed", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);
    expect(screen.queryByText(/Nobody has timed this recording yet/)).not.toBeInTheDocument();
  });
});

describe("the transport", () => {
  it("plays, then pauses, and says which out loud", async () => {
    const user = userEvent.setup();
    const { play, pause } = stubMedia();
    await openSong(user, undefined);

    // The live region is mounted empty — the contract LiveStatus.jsx states.
    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBe(live);
    expect(live).toHaveTextContent("Playing.");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(live).toHaveTextContent("");
  });

  // SC 2.2.2: the highlight is content that updates on its own, and the pause
  // control is what satisfies it. Pausing has to freeze the line, not just the
  // sound — so the highlight is driven by the media clock and nothing else.
  it("holds the highlight where it was when paused", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);

    await user.click(screen.getByRole("button", { name: "Play" }));
    seek(6);
    expect(screen.getByText(TIMED[0].lines[1].nap).closest("li")).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText(TIMED[0].lines[1].nap).closest("li")).toHaveAttribute("aria-current", "true");
  });

  it("counts the clock up as the recording runs", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    expect(screen.getByText(`0:00 / 2:22`)).toBeInTheDocument();
    seek(65);
    expect(screen.getByText(`1:05 / 2:22`)).toBeInTheDocument();
  });

  it("goes back to Play when the recording ends", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    await user.click(screen.getByRole("button", { name: "Play" }));
    fire("ended");

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  // A browser that refuses to start the audio must not leave a dead button and
  // no explanation. The words are the point; the recording is the accompaniment.
  it("says so when the browser refuses to play, and keeps the words", async () => {
    const user = userEvent.setup();
    stubMedia({ rejects: true });
    await openSong(user, undefined);

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/would not start the recording/);
    expect(screen.getByText(shipped.lines[0].nap)).toBeInTheDocument();
  });
});

describe("the highlight", () => {
  it("lights nothing before the first line", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);

    expect(document.querySelectorAll("li[aria-current]")).toHaveLength(0);
  });

  it("lights one line at a time, and follows the music", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);

    seek(3);
    expect(document.querySelectorAll("li[aria-current]")).toHaveLength(1);
    expect(screen.getByText(TIMED[0].lines[0].nap).closest("li")).toHaveAttribute("aria-current", "true");

    seek(11);
    expect(document.querySelectorAll("li[aria-current]")).toHaveLength(1);
    expect(screen.getByText(TIMED[0].lines[2].nap).closest("li")).toHaveAttribute("aria-current", "true");
  });

  it("never lights a line in an untimed song, however far the clock runs", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    seek(90);
    expect(document.querySelectorAll("li[aria-current]")).toHaveLength(0);
  });

  it("scrolls the sung line into view", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const user = userEvent.setup();
    await openSong(user, TIMED);

    seek(3);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
  });

  // The motion is what degrades, not the highlight: turning the highlight off
  // would remove the feature, where jumping to the line delivers the same
  // information without the movement.
  it("jumps rather than glides when less motion is asked for", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const user = userEvent.setup();
    await openSong(user, TIMED);

    seek(3);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
  });

  it("picks the preference up when it changes mid-song", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    let handler;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: (_event, fn) => { handler = fn; },
      removeEventListener: vi.fn(),
    });
    const user = userEvent.setup();
    await openSong(user, TIMED);

    seek(3);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "center", behavior: "smooth" });

    // Same reason `seek` wraps its dispatch: the media-query listener fires
    // outside React, so the state it sets is not flushed without `act`.
    act(() => { handler({ matches: true }); });
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "center", behavior: "auto" });
  });
});

describe("the translations", () => {
  // One control for every line, not one per line. Twenty identical "Show
  // translation" buttons would be twenty tab stops in front of the play
  // control — the argument the README makes against La Riserva's grid.
  it("shows and hides every line's English and Polish from one control", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);

    expect(screen.queryByText(TIMED[0].lines[0].en)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show the translations" }));
    for (const line of TIMED[0].lines) {
      expect(screen.getByText(line.en)).toBeInTheDocument();
      expect(screen.getByText(line.pl)).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Hide the translations" }));
    expect(screen.queryByText(TIMED[0].lines[0].en)).not.toBeInTheDocument();
  });

  it("marks the Polish as Polish", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);
    await user.click(screen.getByRole("button", { name: "Show the translations" }));

    expect(screen.getByText(TIMED[0].lines[0].pl)).toHaveAttribute("lang", "pl");
  });

  // The standard-Italian equivalent is the lesson this song can actually
  // teach: `jamme` against `andiamo` is worth more than another dialect word.
  it("gives the standard Italian where the two languages part company", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);
    await user.click(screen.getByRole("button", { name: "Show the translations" }));

    const italian = screen.getByText(/In italiano: Prima riga in italiano/);
    expect(italian).toHaveAttribute("lang", "it");
  });

  // The sung line and the translations are independent states that meet: a
  // lit line's glosses are painted in the accent's own ink rather than the
  // card's, because inkSoft on a tomato fill is not a pairing theme.test.js
  // holds above 4.5:1. Reaching it needs a line lit AND the translations open
  // at the same time, which no other test here does.
  it("repaints a lit line's glosses in the accent ink", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);
    await user.click(screen.getByRole("button", { name: "Show the translations" }));
    seek(3);

    const lit = screen.getByText(TIMED[0].lines[0].nap).closest("li");
    expect(lit).toHaveAttribute("aria-current", "true");
    expect(within(lit).getByText(TIMED[0].lines[0].en)).toBeInTheDocument();
    expect(within(lit).getByText(TIMED[0].lines[0].pl)).toBeInTheDocument();
    expect(within(lit).getByText(/In italiano:/)).toBeInTheDocument();
  });

  it("stays quiet on a line that is already close to Italian", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);
    await user.click(screen.getByRole("button", { name: "Show the translations" }));

    // The second fixture line carries no `it`, so nothing is restated for it.
    expect(screen.getByText(TIMED[0].lines[1].nap).closest("li")).not.toHaveTextContent("In italiano");
  });
});

describe("the timing pass", () => {
  it("collects a tap per line and prints a pasteable array", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    expect(screen.getByText(`Next: line 1 of ${shipped.lines.length}.`)).toBeInTheDocument();

    seek(3.456);
    await user.click(screen.getByRole("button", { name: "Tap for this line" }));

    expect(screen.getByText("[3.46]")).toBeInTheDocument();
    expect(screen.getByText(`Next: line 2 of ${shipped.lines.length}.`)).toBeInTheDocument();
  });

  it("starts again when asked", async () => {
    const user = userEvent.setup();
    await openSong(user, undefined);

    seek(3);
    await user.click(screen.getByRole("button", { name: "Tap for this line" }));
    expect(screen.getByText("[3.00]")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.queryByText("[3.00]")).not.toBeInTheDocument();
    expect(screen.getByText(`Next: line 1 of ${shipped.lines.length}.`)).toBeInTheDocument();
  });

  it("stops accepting taps once every line has one", async () => {
    const user = userEvent.setup();
    await openSong(user, TIMED);

    const tap = screen.getByRole("button", { name: "Tap for this line" });
    for (const [i] of TIMED[0].lines.entries()) {
      seek(i + 1);
      await user.click(tap);
    }

    expect(screen.getByText("All lines measured.")).toBeInTheDocument();
    expect(tap).toBeDisabled();
  });
});
