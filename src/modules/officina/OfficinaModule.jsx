import React, { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { loadProgress } from "../../shared/storage.js";
import { districtById } from "../../shared/districts.js";
import VocabModule from "../vocab/VocabModule.jsx";
import MappeModule from "../mappe/MappeModule.jsx";
import { BENCHES } from "./benches.js";

// L'Officina — the word workshop, and the front door on the district that
// used to be the vocabulary module (design/02-la-citta.html, screen 07).
//
// It is a hub rather than an exercise: no content, no progress and no
// MODULE_STATS entry of its own, which is why "officina" is a route in
// App.jsx rather than a MODULES entry — the same shape as the review
// session, and for the same reason.
//
// The benches it draws, and the ruling on which of them carry a figure, are
// in benches.js. The short version: two benches have something behind them
// and show a count derived from storage; three don't, and say in a sentence
// what they are waiting on. Nothing on this screen is a number the app has
// not measured.
//
// ── Why the workbenches render in here rather than through App ──────────
// A bench opens its module as a child of this component, so leaving the
// module comes back to the workshop you opened it from. Routing it through
// App instead would land you on the city map, having pressed "back" from a
// screen you reached two doors in — and App would need to remember where you
// came from to do any better. The one cost is that the child's exit link has
// to say where it goes, which is the `exitLabel` prop.
//
// Built in the La Città design system, like Le Mappe. The vocabulary deck
// behind the first bench is still in the old postcard styling; that is
// PLAN.md's open question 4, and the answer there is that a screen migrates
// when it is rebuilt, never in a blanket pass.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// One spelling of the name, shared with the tile on the map — a screen and
// the door to it should not disagree about the apostrophe.
const NAME = districtById("officina").name;

const EXIT_LABEL = <span lang="it">{NAME}</span>;

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

// A bench that opens: its own colour from CITY_ACCENTS, and the count it
// derives from storage sitting in the badge the design puts there.
function OpenBench({ bench, progress, onOpen }) {
  const { done, total, unit } = bench.count(progress);
  const paint = CITY_ACCENTS[bench.accent];
  const Icon = bench.icon;

  return (
    <button
      onClick={() => onOpen(bench.route)}
      style={{
        ...citySurface(bench.accent),
        padding: "14px 16px 16px",
        textAlign: "left",
        cursor: "pointer",
        display: "block",
        width: "100%",
        font: "inherit",
      }}
    >
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
        <Eyebrow
          style={{
            display: "block",
            border: `2px solid ${paint.ink}`,
            borderRadius: 999,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          {done} / {total} {unit}
        </Eyebrow>
      </span>

      <span
        lang={bench.lang}
        style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "8px 0 6px", lineHeight: 1.2 }}
      >
        {bench.name}
      </span>

      <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>{bench.blurb}</span>
    </button>
  );
}

// A bench that doesn't open yet. aria-disabled rather than `disabled`, for
// the reason the map's shut districts give: a disabled button leaves the tab
// order, and a door you can't reach is a door you never knew was there.
//
// The dashed, unshadowed neutral surface is the same "note about the place
// rather than another thing to press" shape the city map uses under it, and
// the padlock is never on its own — the sentence beside it is the point.
function ShutBench({ bench }) {
  const Icon = bench.icon;

  return (
    <button
      aria-disabled="true"
      style={{
        ...citySurface(),
        background: "transparent",
        boxShadow: "none",
        border: `${CITY_RULES.border}px dashed ${TOKENS.cityEdge}`,
        padding: "14px 16px 16px",
        textAlign: "left",
        cursor: "default",
        display: "block",
        width: "100%",
        font: "inherit",
      }}
    >
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Icon size={18} aria-hidden="true" color={TOKENS.inkSoft} style={{ flexShrink: 0 }} />
        <Eyebrow
          style={{
            display: "block",
            color: TOKENS.inkSoft,
            border: `2px solid ${TOKENS.controlLine}`,
            borderRadius: 999,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          Not open yet
        </Eyebrow>
      </span>

      <span
        lang={bench.lang}
        style={{
          display: "block",
          fontFamily: SERIF,
          fontSize: 21,
          fontWeight: 600,
          margin: "8px 0 6px",
          lineHeight: 1.2,
          color: TOKENS.ink,
        }}
      >
        {bench.name}
      </span>

      <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: TOKENS.inkSoft }}>
        {bench.blurb}
      </span>

      <span style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Lock size={14} color={TOKENS.inkSoft} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: TOKENS.inkSoft }}>
          {bench.waiting}
        </span>
      </span>
    </button>
  );
}

const OPEN_BENCHES = BENCHES.filter((bench) => bench.route);
const SHUT_BENCHES = BENCHES.filter((bench) => !bench.route);

function OfficinaHome({ progress, onOpen, onExit }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      <button
        onClick={onExit}
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
        <ArrowLeft size={16} aria-hidden="true" /> <span lang="it">La Citt&agrave;</span>
      </button>

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The word workshop
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {NAME}
        </h1>
        {/* The design's own line, kept in Italian and glossed underneath —
            the learner is a beginner, and an untranslated subtitle is
            decoration rather than the course. */}
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontStyle: "italic", color: TOKENS.ink, margin: "8px 0 0" }}>
          Qui si smontano le parole.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
          Here words get taken apart. {BENCHES.length} benches — {OPEN_BENCHES.length} you can walk up to today, and{" "}
          {SHUT_BENCHES.length} that say what they are still waiting on.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {BENCHES.map((bench) =>
          bench.route ? (
            <OpenBench key={bench.id} bench={bench} progress={progress} onOpen={onOpen} />
          ) : (
            <ShutBench key={bench.id} bench={bench} />
          ),
        )}
      </div>
    </div>
  );
}

// onExit returns to the city map (see src/App.jsx).
export default function OfficinaModule({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const [open, setOpen] = useState(null);

  // Re-read on the way back rather than subscribing: the hub stays mounted
  // while a bench is open, so without this the counts would still be the
  // ones from when the workshop was first opened. The bench modules write
  // through storage.js as they go, so storage is already current here.
  const back = () => {
    setOpen(null);
    setProgress(loadProgress());
  };

  if (open === "vocab") return <VocabModule onExit={back} exitLabel={EXIT_LABEL} />;
  if (open === "mappe") return <MappeModule onExit={back} exitLabel={EXIT_LABEL} />;

  return <OfficinaHome progress={progress} onOpen={setOpen} onExit={onExit} />;
}
