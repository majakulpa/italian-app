import React, { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { TOKENS, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { loadProgress, loadCoverageHistory, todayISO } from "../../shared/storage.js";
import { coverage } from "../../shared/coverage.js";
import { FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { stageState, STAGES } from "../../shared/stage.js";
import ThemeToggle from "../../shared/ThemeToggle.jsx";
import SceneKeyRow from "./SceneKeyRow.jsx";
import StadioScreen from "./StadioScreen.jsx";

// Casa — design screen 19, the fourth tab. What the learner has, said without
// a streak, and the place settings live.
//
// A route rather than a MODULES entry, like L'Officina and La Piazza: it has
// no content and no progress of its own. It is a tab's front screen, so it has
// no way back to offer and takes no onExit — the tab bar is the way out.
//
// ── What the design draws here and this screen does not ─────────────────
// Each for the same reason as the figures L'Officina's benches refused:
// nothing behind it, or something behind it PLAN.md forbids.
//
// - "Sei mesi dentro". Six months in is a count of time spent, which is the
//   streak by another name. The heading is the place's name instead.
// - "Tu sei a 84" ore. The app counts no hours and must not start. The FSI
//   figure stays, as the size of the whole job — see FsiCard.
// - "feb 49,6%" as the curve's start. A curve here starts on the day the app
//   first wrote coverage down, which for any save older than this screen is
//   the upgrade, not the day the learner began. The label is that real date.
// - "23 Posso…" and "Le ultime cose che sai fare". Can-do statements are
//   things demonstrated in a scene, and scenes are PLAN.md chunk 7. They come
//   with it; until then there is nothing to have demonstrated.
export default function CasaModule() {
  const [progress] = useState(loadProgress);
  const [points] = useState(loadCoverageHistory);
  // Lo Stadio opens inside Casa, the way a bench opens inside L'Officina: the
  // design draws it under the Casa tab, so the tab stays current, and pressing
  // it comes back here.
  const [stadio, setStadio] = useState(false);

  if (stadio) return <StadioScreen onExit={() => setStadio(false)} />;

  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ ...EYEBROW, color: TOKENS.inkSoft, letterSpacing: 3, margin: "0 0 6px" }}>Home</p>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Casa
        </h1>
      </div>

      <CoverageCard progress={progress} points={points} />
      <StadioDoor progress={progress} onOpen={() => setStadio(true)} />
      <FsiCard />
      <Settings />

      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, textAlign: "center", margin: "22px 0 0" }}>
        No streak. No count of days.
      </p>
    </div>
  );
}

const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const EYEBROW = { fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase" };

// "2026-09-01" -> "1 Sep 2026". Read as UTC midnight, the same anchor
// todayISO() uses, so a date never slides a day in a timezone west of UTC.
function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// The headline, and the curve under it.
//
// PLAN.md's rules for the percentage, all three: it is labelled as a share of
// running text, it sits beside the solid-word count it is made of, and
// nothing here calls it progress, complete or done.
function CoverageCard({ progress, points }) {
  const headingId = useId();
  const { pct, counts } = coverage(progress);
  const ink = CITY_ACCENTS.pistachio.ink;

  return (
    <section aria-labelledby={headingId} style={{ ...citySurface("pistachio"), padding: "14px 16px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <h2 id={headingId} style={{ ...EYEBROW, margin: 0 }}>
          Coverage
        </h2>
        <span style={{ ...EYEBROW, letterSpacing: 0, textTransform: "none", border: `2px solid ${ink}`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
          {counts.solid} / {FONDAMENTALE_TARGET} solid
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, lineHeight: 0.95 }}>{pct}%</span>
        <span style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.25, textAlign: "right" }}>
          of the words in{" "}
          <br />
          everyday Italian text
        </span>
      </div>

      {points.length >= 2 ? <Curve points={points} /> : <NoCurveYet points={points} />}
    </section>
  );
}

// Fewer than two points is a fact to say, not a chart to draw: one dot, or a
// flat line invented back to a start nobody recorded, would both be a picture
// of something that did not happen.
function NoCurveYet({ points }) {
  const first = points[0];
  const since = !first || first.date === todayISO() ? "now" : `on ${formatDate(first.date)}`;

  return (
    <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5, margin: "12px 0 0" }}>
      The curve starts {since}. Coverage is written down on each day it changes, from the first time this version of
      the app opened — nothing earlier was recorded, so nothing earlier is drawn. It becomes a line the next day it
      moves.
    </p>
  );
}

// The curve. Across by date, so a gap of a fortnight looks like one; up on
// the whole 0–100 scale, the same one the map's bar uses, so the line is not
// stretched to look steeper than it is.
const W = 200;
const H = 60;
const PAD = 6;

function Curve({ points }) {
  const descId = useId();
  const first = points[0];
  const last = points[points.length - 1];
  const day = (iso) => Date.parse(`${iso}T00:00:00Z`) / 86400000;
  const span = day(last.date) - day(first.date);
  const at = (point) => [PAD + ((day(point.date) - day(first.date)) / span) * (W - 2 * PAD), H - PAD - (point.pct / 100) * (H - 2 * PAD)];
  const ink = CITY_ACCENTS.pistachio.ink;
  const [lx, ly] = at(last);

  return (
    <figure style={{ margin: "12px 0 0" }}>
      <svg role="img" aria-labelledby={descId} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <title id={descId}>
          {`Coverage from ${first.pct}% on ${formatDate(first.date)} to ${last.pct}% on ${formatDate(last.date)}`}
        </title>
        <polyline
          points={points.map((p) => at(p).join(",")).join(" ")}
          fill="none"
          stroke={ink}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lx} cy={ly} r={4.5} fill={ink} />
      </svg>
      <figcaption style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: MONO, fontSize: 11, marginTop: 6 }}>
        <span>
          {formatDate(first.date)} · {first.pct}%
        </span>
        <span>
          {formatDate(last.date)} · {last.pct}%
        </span>
      </figcaption>
      <p style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.5, margin: "8px 0 0" }}>
        Recorded from {formatDate(first.date)}, the first day this app wrote it down. Nothing earlier is drawn.
      </p>
    </figure>
  );
}

// The way into Lo Stadio, saying the one thing worth knowing before you go
// in: which rung you are on.
function StadioDoor({ progress, onOpen }) {
  const { name, stage } = STAGES[stageState(progress).current - 1];

  return (
    <button
      onClick={onOpen}
      style={{
        ...citySurface("grape"),
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        marginBottom: 16,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span lang="it" style={EYEBROW}>
          Lo Stadio
        </span>
        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600 }}>
          Stage {stage} · <span lang="it">{name}</span>
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
    </button>
  );
}

// The design's FSI line, kept for the half of it that is true. The Foreign
// Service Institute's figure is 600–750 class hours to professional working
// proficiency in Italian for an English speaker; it says how big the whole
// job is. The other half — "you are at 84" — would need the app to count
// hours, which PLAN.md forbids, so the card says the app does not know.
function FsiCard() {
  return (
    <div style={{ ...citySurface(), background: "transparent", boxShadow: "none", borderStyle: "dashed", padding: "12px 14px", marginBottom: 22 }}>
      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.ink, margin: 0, lineHeight: 1.5 }}>
        For scale: the US Foreign Service Institute puts professional working Italian at 600–750 hours of class for an
        English speaker. That is the size of the whole job, not a measure of where you are on it — this app does not
        count hours.
      </p>
    </div>
  );
}

// Settings. Two rows: the theme, and the scene-partner key (SceneKeyRow).
function Settings() {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} style={{ ...EYEBROW, color: TOKENS.inkSoft, margin: "0 0 10px" }}>
        Settings
      </h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        <li>
          <ThemeToggle />
        </li>
        <li>
          <SceneKeyRow />
        </li>
      </ul>
    </section>
  );
}
