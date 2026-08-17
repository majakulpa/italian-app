import React from "react";
import { TOKENS, tint } from "./theme.js";

// A1–C1 level picker, styled as small transit-line roundels — shared by
// every module's home screen (previously near-identical duplicated markup
// in each one). The active pill uses a tinted background + colored border
// rather than a solid accent fill: accent and accentDeep are both vivid
// enough now that a solid-fill pairing fails contrast (the same bug class
// as the original "you" bubble issue).
export default function LevelPicker({ levels, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
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
              border: `1.5px solid ${isActive ? lv.accent : TOKENS.line}`,
              background: isActive ? tint(lv.accent, 14) : "transparent",
              color: isActive ? lv.accentDeep : TOKENS.inkSoft,
              borderRadius: 999,
              padding: "6px 14px 6px 6px",
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
