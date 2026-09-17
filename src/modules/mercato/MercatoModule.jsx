import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { loadProgress } from "../../shared/storage.js";
import { districtById } from "../../shared/districts.js";
import ConversationsModule from "../conversations/ConversationsModule.jsx";
import ScenesModule from "../scene/ScenesModule.jsx";
import { STALLS } from "./stalls.js";

// Il Mercato — the market, and the front door on the district that used to
// route straight at the conversations module (design/02-la-citta.html, the
// district row on screen 01 and the scene phases on 02–06).
//
// It is a hub rather than an exercise, exactly like L'Officina: no content, no
// progress and no MODULE_STATS entry of its own, which is why "mercato" is a
// route in App.jsx rather than a MODULES entry. The two stalls it draws, and
// what each of their badges counts, are in stalls.js.
//
// ── Why the stalls render in here rather than through App ───────────────
// A stall opens its module as a child of this component, so leaving the module
// comes back to the market you opened it from. Routing it through App instead
// would land you on the city map, having pressed "back" from a screen you
// reached two doors in. The one cost is that the child's exit link has to say
// where it goes, which is the `exitLabel` prop — the same bargain
// OfficinaModule struck, and the reason ConversationsModule gained that prop:
// its back link said "All modules", which was true when the district opened it
// and is not true of a hub.
//
// Both stalls open today, so there is no shut-stall shape here. `waiting` is
// still on the data because stalls.js and benches.js are read by one station
// list and a station that does not open has to say what it is waiting on
// rather than show a padlock; the day Il Mercato gains one, this screen grows
// the branch L'Officina already has.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

// One spelling of the name, shared with the tile on the map — a screen and the
// door to it should not disagree about the article.
const NAME = districtById("mercato").name;

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

function Stall({ stall, progress, onOpen }) {
  const { done, total, unit } = stall.count(progress);
  const paint = CITY_ACCENTS[stall.accent];
  const Icon = stall.icon;

  return (
    <button
      onClick={() => onOpen(stall.route)}
      style={{
        ...citySurface(stall.accent),
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
        lang={stall.lang}
        style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "8px 0 6px", lineHeight: 1.2 }}
      >
        {stall.name}
      </span>

      <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>{stall.blurb}</span>
    </button>
  );
}

function MercatoHome({ progress, onOpen, onExit }) {
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
          Where you say it out loud
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          {NAME}
        </h1>
        {/* The district's Italian line, glossed underneath — the learner is a
            beginner, and an untranslated subtitle is decoration rather than
            the course. The same rule L'Officina's heading follows. */}
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontStyle: "italic", color: TOKENS.ink, margin: "8px 0 0" }}>
          Qui si parla con qualcuno.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
          Here you talk to somebody. Two stalls: scenes you walk into, and dialogues you can do on a train with no signal.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {STALLS.map((stall) => (
          <Stall key={stall.id} stall={stall} progress={progress} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// onExit returns to the city map (see src/App.jsx).
export default function MercatoModule({ onExit, onCasa }) {
  const [progress, setProgress] = useState(loadProgress);
  const [open, setOpen] = useState(null);

  // Re-read on the way back rather than subscribing: the hub stays mounted
  // while a stall is open, so without this the counts would still be the ones
  // from when the market was first opened. Both stalls write through
  // storage.js as they go, so storage is already current here.
  const back = () => {
    setOpen(null);
    setProgress(loadProgress());
  };

  if (open === "scenes") return <ScenesModule onExit={back} exitLabel={EXIT_LABEL} onCasa={onCasa} />;
  if (open === "conversations") return <ConversationsModule onExit={back} exitLabel={EXIT_LABEL} />;

  return <MercatoHome progress={progress} onOpen={setOpen} onExit={onExit} />;
}
