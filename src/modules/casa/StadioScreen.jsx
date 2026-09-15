import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, CITY_RULES, citySurface } from "../../shared/theme.js";
import { loadProgress } from "../../shared/storage.js";
import { stageState } from "../../shared/stage.js";

// Lo Stadio — design screen 20, reached from Casa and drawn under its tab.
// Where the learner is on the tense ladder, and what that does: the stages
// above are in what she reads, and a wrong answer to them is not corrected.
//
// Every figure comes from stageState() in shared/stage.js, which derives the
// stage from clean typed answers and stores nothing. This screen adds no
// arithmetic of its own, so it cannot disagree with the gate it describes.
//
// ── What the design draws here and this screen does not ─────────────────
// Same rule as L'Officina's benches (benches.js) and Casa's refusals: a figure
// is measured or it is absent.
//
// - "da marzo" under presente. Nothing records when a stage was reached —
//   the evidence markers say which items were produced, not when — and a
//   date invented for it would be a fact about nobody.
// - "ausiliare giusto 91%", "aspetto 64%". A percentage of right over tries
//   is not what the gate counts. The gate counts distinct items typed clean,
//   against EMERGENCE_ITEMS, so each rung says "N of 4 items": the gate's own
//   number, and the one that decides whether a miss is corrected.
// - "Stagione 2 della serie è scritta col condizionale. Si apre quando arrivi
//   allo stadio 5." There is no serial (PLAN.md chunk 6). And when there is,
//   nothing may open on the stage until EMERGENCE_ITEMS has been measured —
//   stage.js says so beside the constant.
// - "Ti chiederò di costruirle quando ci arrivi" on the vorrei card. Untrue
//   here: the app already asks for forms above your stage, and a right answer
//   to one counts. What waits for the stage is correction, so the card says
//   that instead.
export default function StadioScreen({ onExit }) {
  const [{ current, stages }] = useState(() => stageState(loadProgress()));
  const condizionale = stages.find((s) => s.name === "condizionale");

  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 40px" }}>
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
        <ArrowLeft size={16} aria-hidden="true" /> <span lang="it">Casa</span>
      </button>

      <div style={{ textAlign: "center", margin: "18px 0 20px" }}>
        <p lang="it" style={{ ...EYEBROW, color: TOKENS.inkSoft, letterSpacing: 3, margin: "0 0 6px" }}>
          Lo Stadio
        </p>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Dove sei
        </h1>
        <p lang="it" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: TOKENS.ink, margin: "12px 0 0", lineHeight: 1.45 }}>
          Dedotto da quello che produci giusto — non da quante lezioni hai aperto.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.5 }}>
          Worked out from forms you typed right first time in <span lang="it">La Piazza</span>, without being shown them
          first — not from how many lessons you opened.
        </p>
      </div>

      <ol aria-label="The stages" style={{ listStyle: "none", margin: "0 0 18px", padding: 0, display: "grid", gap: 8 }}>
        {stages.map((stage) => (
          <Rung key={stage.stage} stage={stage} />
        ))}
      </ol>

      {/* The design's card, about the one form a beginner certainly meets
          above her stage: vorrei is how the dialogues order a coffee. It is
          only true while the condizionale is above, so it goes when it isn't
          — the ladder's own "lo leggi, non lo correggo" still carries the
          rule for whatever stays above. */}
      {condizionale.status === "above" && (
        <div style={{ ...citySurface("bubble"), padding: "14px 16px" }}>
          <h2 lang="it" style={{ ...EYEBROW, margin: 0 }}>
            Perché vedi <i style={{ textTransform: "none" }}>vorrei</i> lo stesso
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>
            Forms above your stage are already in what you read — <i lang="it">vorrei</i> is how the dialogues order a
            coffee, long before stage {condizionale.stage}. You can answer them now, and a right answer counts. A wrong one
            is shown to you rather than marked wrong, until you reach the stage. You are at stage {current}.
          </p>
        </div>
      )}
    </div>
  );
}

const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const EYEBROW = { fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase" };

// The mark is a different shape for each status and the status is also a
// word, so neither colour nor the glyph alone carries it. The glyph is
// hidden from a screen reader, which reads the word.
const STATUS = {
  established: { mark: "✓", say: "Established" },
  current: { mark: "◆", say: "You are here" },
  above: { mark: "○", say: "Above your stage" },
};

// "N of 4 items", never a percentage. Past the threshold the fraction is
// full, and the rest is said as a count rather than as "6 of 4".
function evidenceText({ evidence, needed }) {
  const shown = `${Math.min(evidence, needed)} of ${needed} items`;
  return evidence > needed ? `${shown} · ${evidence} in all` : shown;
}

function Rung({ stage }) {
  const { mark, say } = STATUS[stage.status];
  const here = stage.status === "current";

  return (
    <li
      style={{
        ...(here ? citySurface("grape") : { color: TOKENS.ink }),
        ...(here ? { boxShadow: "none", borderRadius: 14 } : { border: `${CITY_RULES.border}px solid transparent` }),
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "8px 12px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: "22px", width: 18, textAlign: "center", flexShrink: 0 }}>
        {mark}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <b style={{ fontFamily: SANS, fontSize: 15, lineHeight: "22px" }}>
          {stage.stage} · <span lang="it">{stage.name}</span>
        </b>
        <span style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.4, color: here ? undefined : TOKENS.inkSoft }}>
          {say} · {evidenceText(stage)}
        </span>
        {stage.status === "above" && (
          <span lang="it" style={{ fontFamily: SANS, fontSize: 13, fontStyle: "italic", lineHeight: 1.4, color: TOKENS.inkSoft }}>
            lo leggi, non lo correggo
          </span>
        )}
      </span>
    </li>
  );
}
