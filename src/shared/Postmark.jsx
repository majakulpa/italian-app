import React from "react";
import { TOKENS, tint } from "./theme.js";

// Small rotated "postmark" badge showing the level (A1/A2/B1) — used by
// every module to keep the level visually identifiable across the app.
export default function Postmark({ level, accentDeep }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2px solid ${accentDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        transform: "rotate(-8deg)",
        background: tint(TOKENS.card, 50, "transparent"),
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: accentDeep, letterSpacing: 0.5 }}>
        {level}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: accentDeep, letterSpacing: 1 }}>
        ITALIANO
      </span>
    </div>
  );
}
