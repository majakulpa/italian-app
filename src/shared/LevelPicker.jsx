import React from "react";
import { TOKENS, CITY_RULES, tint } from "./theme.js";

// A1–C1 level picker, styled as small transit-line roundels — shared by
// every module's home screen (previously near-identical duplicated markup
// in each one). The active pill uses a tinted background + colored border
// rather than a solid accent fill: accent and accentDeep are both vivid
// enough now that a solid-fill pairing fails contrast (the same bug class
// as the original "you" bubble issue).
//
// La Città: every pill carries the 3px rule and the hard, unblurred sticker
// shadow. Two things deliberately don't follow the city's neutral surface.
// The boundary stays `controlLine` on an idle pill, because this is a control
// and that is the token theme.js promises 3:1 for (SC 1.4.11); and the active
// pill's edge stays the level's own accentDeep, because the levels read as
// metro lines and rule 4 says a hue that means something keeps it. The pill
// stays a pill: a metro roundel is round by nature, and 999 is the radius the
// city's own count badges use.
export default function LevelPicker({ levels, active, onSelect }) {
  return (
    <div className="citta" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
      {levels.map((lv) => {
        const isActive = lv.id === active.id;
        return (
          <button
            key={lv.id}
            onClick={() => onSelect(lv)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `${CITY_RULES.border}px solid ${isActive ? lv.accentDeep : TOKENS.controlLine}`,
              boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
              background: isActive ? tint(lv.accent, 14) : "transparent",
              color: isActive ? lv.accentDeep : TOKENS.inkSoft,
              borderRadius: 999,
              padding: "5px 14px 5px 5px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: lv.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {lv.label}
            </span>
            {lv.name}
          </button>
        );
      })}
    </div>
  );
}
