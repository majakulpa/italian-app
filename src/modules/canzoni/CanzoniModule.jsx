import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Music, Pause, Play, Eye, EyeOff } from "lucide-react";
import { TOKENS, CITY_ACCENTS, citySurface, SR_ONLY } from "../../shared/theme.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import { CANZONI } from "../../data/canzoni.js";
import { activeLineIndex, formatClock, formatTimings, isTimed } from "./timing.js";
import useReducedMotion from "./useReducedMotion.js";

// Le Canzoni — Il Mercato's third stall, and the one screen in the app that
// asks nothing of you. You press play and sing.
//
// ── Why it counts nothing ───────────────────────────────────────────────────
// It writes no progress at all, which is why it is a `view: true` station
// rather than a MODULES entry (see modules/mercato/stalls.js, and the flag's
// own argument at modules/officina/benches.js:115-124). A "songs listened"
// figure would be the content-consumed metric the coverage headline exists to
// replace — README: a card counts what you have worked through, coverage counts
// what would survive a gap, and a song survives neither. Nothing here goes
// through reviewItem and nothing lands in La Piazza.
//
// ── Why this song, and why it says "Napoletano" on the door ─────────────────
// Lyrics and recordings are two separate copyrights and almost every Italian
// song fails one of them. `'O sole mio` is the famous trap — widely believed
// public domain, still in copyright in the EU because of the 2002 Mazzucchi
// co-authorship ruling. "Funiculì, Funiculà" is clean on both: an 1880 work
// whose authors died in 1903 and 1922, with a 1906 recording Wikimedia Commons
// holds as public domain. data/canzoni.js carries the whole provenance.
//
// The cost is that it is Neapolitan, not Italian, and it will teach nothing of
// data/fondamentale.js's top 600. So the screen says so — "Napoletano · 1880",
// and a line of prose under the title admitting it is here to be enjoyed rather
// than studied. The alternative was letting a dialect song sit unmarked among
// the Italian and imply it was curriculum, which is the kind of quiet
// overclaim this app spends most of its comments refusing.
//
// Each line carries the standard-Italian equivalent where the two diverge
// interestingly, which turns the honest weakness into the actual lesson: `jamme`
// against `andiamo` is worth more to a learner than another `-zione` noun.
//
// ── Why there is no SpeakButton on these lines ──────────────────────────────
// shared/speech.js hard-codes `it-IT`. Pointing it at Neapolitan would
// mispronounce every line with confidence, which is worse than offering
// nothing — the same defect AnswerStatus.jsx:18-24 describes when an Italian
// answer was read with English phonetics. A recording of somebody actually
// singing it is what this screen has instead.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// The stall's hue, kept in one place so the card on the hub and the screen
// behind it cannot disagree.
const ACCENT = "tomato";

function Eyebrow({ children, style }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function BackLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: TOKENS.inkSoft,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SANS,
        fontSize: 13,
        padding: "6px 6px 6px 0",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
}

// ── One lyric line ──────────────────────────────────────────────────────────
//
// The active line is marked three ways and not one: the accent surface, a
// heavier weight, and `aria-current`. WCAG 1.4.1 is the reason — colour is
// never the only cue here, which is the rule shared/AnswerMark.jsx states for
// the tick and the cross. `aria-current` is this repo's first, and it is the
// honest element: it says "this one" to a screen reader without claiming the
// visual treatment means anything to it.
//
// Not a button. Twenty tappable lines would be twenty tab stops in front of
// the play control, and the README's own argument against La Riserva's grid
// applies at any size: focusable cells are a trap rather than a tab order.
function Line({ line, language, active, english, innerRef }) {
  const paint = CITY_ACCENTS[ACCENT];

  return (
    <li
      ref={innerRef}
      aria-current={active ? "true" : undefined}
      style={{
        ...(active ? citySurface(ACCENT) : citySurface()),
        padding: "10px 12px",
        marginBottom: 8,
        listStyle: "none",
        borderLeftWidth: active ? 10 : 3,
      }}
    >
      <span
        lang={language}
        style={{
          display: "block",
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: active ? 700 : 500,
          lineHeight: 1.35,
          color: active ? paint.ink : TOKENS.ink,
        }}
      >
        {line.nap}
      </span>

      {english && (
        <span style={{ display: "block", marginTop: 6 }}>
          <span
            style={{
              display: "block",
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.5,
              color: active ? paint.ink : TOKENS.inkSoft,
            }}
          >
            {line.en}
          </span>
          <span
            lang="pl"
            style={{
              display: "block",
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.5,
              color: active ? paint.ink : TOKENS.inkSoft,
            }}
          >
            {line.pl}
          </span>
          {/* The standard-Italian equivalent, where the Neapolitan diverges
              enough to be worth naming. Omitted on lines that are already
              close to Italian — printing `it` identical to `nap` would teach
              nothing and pad every line with a restatement. */}
          {line.it && (
            <span
              lang="it"
              style={{
                display: "block",
                marginTop: 4,
                fontFamily: SANS,
                fontSize: 12,
                fontStyle: "italic",
                lineHeight: 1.5,
                color: active ? paint.ink : TOKENS.inkSoft,
              }}
            >
              In italiano: {line.it}
            </span>
          )}
        </span>
      )}
    </li>
  );
}

// ── The timing pass ─────────────────────────────────────────────────────────
//
// Nobody has listened to the recording, so data/canzoni.js ships every `start`
// as null and the highlight has nothing to follow. This is how that gets fixed
// without anybody guessing: play the song, tap as each line comes in, paste the
// array it prints into the data file.
//
// It is a `<details>` because it is maintenance, not study — it should be
// findable by the person adding a song and invisible to the person singing.
// It is in the shipped screen rather than a script because the measurement has
// to happen against the same audio element the app plays, and because the next
// song will need it too.
function TimingPass({ lines, taps, onTap, onReset }) {
  const next = taps.length;
  const done = next >= lines.length;

  return (
    <details style={{ marginTop: 28, fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft }}>
      <summary style={{ cursor: "pointer", padding: "6px 0" }}>Measure the line timings</summary>

      <p style={{ lineHeight: 1.6, margin: "8px 0" }}>
        Press play above, then tap once as each line is sung. When you reach the end, paste the array
        into <code>src/data/canzoni.js</code> as each line&rsquo;s <code>start</code>. Nothing is saved
        here &mdash; this screen keeps no storage of its own.
      </p>

      <p style={{ margin: "8px 0" }}>
        {done ? "All lines measured." : `Next: line ${next + 1} of ${lines.length}.`}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={onTap}
          disabled={done}
          style={{
            ...citySurface(),
            padding: "10px 16px",
            cursor: done ? "default" : "pointer",
            font: "inherit",
            fontWeight: 600,
            color: TOKENS.ink,
          }}
        >
          Tap for this line
        </button>
        <button
          onClick={onReset}
          style={{
            ...citySurface(),
            padding: "10px 16px",
            cursor: "pointer",
            font: "inherit",
            color: TOKENS.ink,
          }}
        >
          Start again
        </button>
      </div>

      {taps.length > 0 && (
        // A plain <p>, and that is a correction rather than a preference.
        // This was an <output>, which ARIA maps to role="status" — an
        // implicit live region. Two things went wrong with it: every tap
        // re-announced the whole growing array, which is chatter during the
        // one activity that needs you listening to music; and it put a second
        // live region on a screen that already has one, so the play/pause
        // announcement and a timing readout would compete. It also made
        // getByRole("status") ambiguous the moment a tap existed, which the
        // tests only survived because none of them tapped and then looked.
        //
        // The array is something you read and copy, deliberately, when you
        // have finished. It does not need announcing at all.
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontFamily: MONO,
            fontSize: 12,
            lineHeight: 1.6,
            color: TOKENS.ink,
            wordBreak: "break-all",
          }}
        >
          {formatTimings(taps)}
        </p>
      )}
    </details>
  );
}

// ── One song ────────────────────────────────────────────────────────────────
function SongScreen({ song, onExit, exitLabel }) {
  const audioRef = useRef(null);
  const lineRefs = useRef([]);
  const reduceMotion = useReducedMotion();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [english, setEnglish] = useState(false);
  const [failed, setFailed] = useState(false);
  const [taps, setTaps] = useState([]);

  const timed = isTimed(song.lines);
  const active = activeLineIndex(song.lines, currentTime);

  // Follow the sung line down the page. Smoothly, unless that has been asked
  // not to happen — see useReducedMotion.js for why the scroll degrades and
  // the highlight does not.
  //
  // Both guards are real rather than defensive clutter: the effect runs once
  // before any line is active (-1), and jsdom implements no scrollIntoView at
  // all, so the app would throw in its own test suite without the second.
  useEffect(() => {
    const node = lineRefs.current[active];
    if (!node || !node.scrollIntoView) return;
    node.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, [active, reduceMotion]);

  // A gesture starts playback, which is both the accessible shape and the only
  // shape browsers allow: shared/speech.js:35-45 records the same restriction
  // for speech synthesis, and HTMLAudioElement.play() is governed by the same
  // autoplay policy. `await` inside try/catch rather than a .catch() chain
  // because play() can reject *and* throw synchronously — jsdom throws.
  const toggle = async () => {
    const el = audioRef.current;
    if (playing) {
      el.pause();
      return;
    }
    try {
      await el.play();
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ margin: "18px 0 20px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          {song.languageName} &middot; {song.year}
        </Eyebrow>
        <h1
          lang={song.language}
          style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}
        >
          {song.title}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
          {song.credits.music} &middot; words by {song.credits.words}. Sung by {song.audio.performer},
          recorded {song.audio.recorded}.
        </p>
        {/* The honest label. This is dialect, it is not what the rest of the
            app teaches, and saying so is cheaper than letting the screen imply
            otherwise. */}
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55 }}>
          This is Neapolitan, not standard Italian &mdash; it will not teach you the core vocabulary,
          and it is not meant to. Each line shows what it would be in Italian where the two part
          company.
        </p>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a caption track
          would be the lyrics, which are on the screen already, in three
          languages, as text. */}
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}${song.audio.src}`}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={toggle}
          style={{
            ...citySurface(ACCENT),
            padding: "12px 18px",
            cursor: "pointer",
            font: "inherit",
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>

        <span style={{ fontFamily: MONO, fontSize: 12, color: TOKENS.inkSoft }}>
          {formatClock(currentTime)} / {formatClock(song.audio.duration)}
        </span>

        <button
          onClick={() => setEnglish((shown) => !shown)}
          style={{
            ...citySurface(),
            padding: "10px 14px",
            cursor: "pointer",
            font: "inherit",
            fontFamily: SANS,
            fontSize: 13,
            color: TOKENS.ink,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {english ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          {english ? "Hide the translations" : "Show the translations"}
        </button>
      </div>

      {/* Mounted for the life of the screen and empty until there is something
          to say, which is the contract shared/LiveStatus.jsx states. It
          announces play and pause ONLY.
          Deliberately not the lyrics: a polite region fed every line would
          talk over the song for its whole length, and the live-region
          precedent in this app is strictly one announcement per deliberate
          action (see StoriesModule's GlossAnnouncer). The lines are static
          text and readable at any time. */}
      <LiveStatus>{playing ? "Playing." : ""}</LiveStatus>

      {failed && (
        <p role="alert" style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.ink, margin: "12px 0 0", lineHeight: 1.55 }}>
          This browser would not start the recording. The words are all below, and they read
          perfectly well without it.
        </p>
      )}

      {!timed && (
        // Not an apology and not a padlock: it names what is missing and who
        // can fix it. The screen is fully usable in this state, which is why
        // it ships in it rather than waiting.
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "14px 0 0", lineHeight: 1.55 }}>
          Nobody has timed this recording yet, so no line lights up as it is sung. Play it and read
          along; the timings can be measured at the bottom of this screen.
        </p>
      )}

      {/* `role="list"` on a list is not redundant here, and it is the first
          in the repo. Safari drops list semantics from a ul/ol the moment
          `list-style: none` is set — VoiceOver stops announcing "list, 15
          items" and stops numbering the rows — and restating the role is the
          documented way back. No axe rule catches it, in jsdom or in a
          browser, so the suite being green says nothing either way.

          Fourteen other files in src/ set `listStyle: none` without this, so
          the gap is a repo-wide one rather than anything this screen
          introduced. It is not fixed wholesale here: that is a sweep of its
          own, and this list is the one in front of me. A lyric sheet is also
          the case where it matters most, being the only list in the app whose
          row order is the content. */}
      <ol role="list" style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
        {song.lines.map((line, i) => (
          <Line
            key={i}
            innerRef={(node) => { lineRefs.current[i] = node; }}
            line={line}
            language={song.language}
            active={i === active}
            english={english}
          />
        ))}
      </ol>

      <TimingPass
        lines={song.lines}
        taps={taps}
        onTap={() => setTaps((previous) => [...previous, audioRef.current.currentTime])}
        onReset={() => setTaps([])}
      />

      <p style={{ fontFamily: SANS, fontSize: 12, color: TOKENS.inkSoft, margin: "24px 0 0", lineHeight: 1.6 }}>
        {song.provenance.recording} {song.provenance.licence}.
      </p>
    </div>
  );
}

// ── The stall's landing: which song ─────────────────────────────────────────
//
// One song today, and still a list. Going straight into the only song would
// have to be undone the moment there are two, and the list is where a song
// gets to state what it is — "Napoletano · 1880" belongs on the door, not
// behind it.
function CanzoniHome({ songs, onPick, onExit, exitLabel }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          Nothing to get right
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Le Canzoni
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
          Songs old enough to be nobody&rsquo;s property, with the words in three languages. Nothing
          here is marked, counted or remembered.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {songs.map((song) => (
          <button
            key={song.id}
            onClick={() => onPick(song.id)}
            style={{
              ...citySurface(ACCENT),
              padding: "14px 16px 16px",
              textAlign: "left",
              cursor: "pointer",
              display: "block",
              width: "100%",
              font: "inherit",
            }}
          >
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <Music size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
              <Eyebrow
                style={{
                  display: "block",
                  border: `2px solid ${CITY_ACCENTS[ACCENT].ink}`,
                  borderRadius: 999,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {song.languageName} &middot; {song.year}
              </Eyebrow>
            </span>
            <span
              lang={song.language}
              style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "8px 0 6px", lineHeight: 1.2 }}
            >
              {song.title}
            </span>
            <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>
              {song.lines.length} lines, sung in {song.audio.recorded.slice(0, 4)}.
              <span style={SR_ONLY}> Language: {song.languageName}.</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// `songs` is a seam for the tests and nothing else: every song that ships is
// untimed, so the highlight — the whole point of the screen — cannot be
// exercised against the real data. ScenesModule takes `createClient` for the
// same kind of reason.
export default function CanzoniModule({ onExit, exitLabel = "All modules", songs = CANZONI }) {
  const [openId, setOpenId] = useState(null);
  const song = songs.find((candidate) => candidate.id === openId);

  if (!song) return <CanzoniHome songs={songs} onPick={setOpenId} onExit={onExit} exitLabel={exitLabel} />;

  return <SongScreen song={song} onExit={() => setOpenId(null)} exitLabel={<span lang="it">Le Canzoni</span>} />;
}
