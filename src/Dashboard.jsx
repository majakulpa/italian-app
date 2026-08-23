import React, { useState } from "react";
import { ChevronRight, Timer } from "lucide-react";
import { TOKENS, tint } from "./shared/theme.js";
import { loadProgress } from "./shared/storage.js";
import { moduleStats, overallStats, levelLadder } from "./shared/stats.js";
import { dueCount } from "./shared/srs.js";

// The home screen: overall completion, an A1–C1 ladder, and the
// module list with real counts on each card. Read-only — it reports progress,
// it never writes any.
//
// App.jsx unmounts this whenever a module is active, so reading storage once
// per mount (the same useState(loadProgress) every module does) is enough to
// pick up fresh numbers each time you come back from studying.
export default function Dashboard({ modules, onSelect }) {
  const [progress] = useState(loadProgress);
  const overall = overallStats(progress);
  const due = dueCount(progress);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriaticDeep, marginBottom: 8, textTransform: "uppercase" }}>
          Benvenuto
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Italiano
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingBottom: 14,
          borderBottom: `1px solid ${TOKENS.line}`,
          marginBottom: 24,
          minHeight: 20,
        }}
      >
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0, marginLeft: "auto" }}>
          <span style={{ fontWeight: 700, color: TOKENS.ink }}>{overall.pct}%</span> complete
        </p>
      </div>

      {due > 0 && <ReviewBand due={due} onSelect={onSelect} />}

      <LevelLadder progress={progress} />

      <div style={{ display: "grid", gap: 14 }}>
        {modules.map((mod) => (
          <ModuleCard key={mod.id} module={mod} progress={progress} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// Shown only when something is actually due — a permanent "0 due" row would
// be a nag on every visit and tell you nothing. Gold rather than a level
// accent: a review mixes levels, and theme.js already reserves that colour
// for streaks and celebration.
function ReviewBand({ due, onSelect }) {
  return (
    <button
      onClick={() => onSelect("review")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        background: tint(TOKENS.limoncello, 14),
        border: `1.5px solid ${TOKENS.limoncelloDeep}`,
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 24,
        cursor: "pointer",
      }}
    >
      <Timer size={20} color={TOKENS.limoncelloDeep} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: TOKENS.ink, margin: "0 0 1px" }}>
          Review
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
          {due} item{due === 1 ? "" : "s"} due today
        </p>
      </div>
      <ChevronRight size={18} color={TOKENS.limoncelloDeep} style={{ flexShrink: 0 }} />
    </button>
  );
}

// Five roundels, one per level, filled clockwise by how far that level is
// across all four modules. The ring is a conic-gradient over the level's own
// accent — var()-based like everything else, so a dark-mode toggle repaints it
// without a re-render (see the note at the top of theme.js).
function LevelLadder({ progress }) {
  return (
    <div
      role="list"
      aria-label="Level progress"
      style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}
    >
      {levelLadder(progress).map(({ level, stats }) => (
        <div
          key={level.id}
          role="listitem"
          aria-label={`${level.label} ${stats.pct}% complete`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: `conic-gradient(${level.accent} ${stats.pct}%, ${TOKENS.line} 0)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: TOKENS.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: level.accentDeep,
              }}
            >
              {level.label}
            </span>
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: TOKENS.inkSoft }}>
            {stats.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ModuleCard({ module: mod, progress, onSelect }) {
  const Icon = mod.icon;
  const stats = mod.ready ? moduleStats(progress, mod.id) : null;

  return (
    <button
      onClick={() => mod.ready && onSelect(mod.id)}
      disabled={!mod.ready}
      style={{
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: TOKENS.card,
        border: `1px solid ${TOKENS.controlLine}`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: mod.ready ? "pointer" : "default",
        opacity: mod.ready ? 1 : 0.55,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: TOKENS.paperDeep,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: TOKENS.ink,
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: TOKENS.ink, margin: "0 0 4px" }}>
          {mod.name}
        </h3>
        {stats ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background: TOKENS.paperDeep,
                overflow: "hidden",
                display: "block",
                minWidth: 40,
              }}
            >
              <span style={{ display: "block", width: `${stats.pct}%`, height: "100%", background: TOKENS.ink, borderRadius: 999 }} />
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: TOKENS.inkSoft, flexShrink: 0 }}>
              {stats.done} / {stats.total}
            </span>
          </div>
        ) : (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>Coming soon</p>
        )}
      </div>
      {mod.ready && <ChevronRight size={18} color={TOKENS.inkSoft} />}
    </button>
  );
}
