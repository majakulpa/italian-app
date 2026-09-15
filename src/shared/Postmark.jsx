import React from "react";
import { TOKENS, CITY_RULES, tint } from "./theme.js";

// Small rotated "postmark" badge showing the level (A1–C1) — used by
// every module to keep the level visually identifiable across the app.
//
// La Città: the 3px rule and the hard offset shadow, which turn a rubber
// stamp into a sticker slapped on at an angle — the tilt is kept for that
// reason. The ring stays the level's accentDeep rather than the city edge
// (rule 4: the level owns its hue), and it is text-coloured, so it is the
// deep variant and never the fill accent. The translucent fill composites to
// the card it sits on, which is why accentDeep-on-card is the pairing that
// holds it.
export default function Postmark({ level, accentDeep }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `${CITY_RULES.border}px solid ${accentDeep}`,
        boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
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
