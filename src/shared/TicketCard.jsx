import React from "react";
import { TOKENS, CITY_RULES, citySurface } from "./theme.js";

// A home-screen list item styled like a metro ticket stub: a colored line
// badge, a punched perforation, then the title/subtitle and whatever
// action(s) the caller passes as children (1-3 buttons). Replaces the
// near-identical plain card markup that used to be duplicated across
// VocabHome/GrammarHome/ConversationsHome.
//
// La Città: the ticket is a city surface — citySurface() gives it the 3px
// edge, the 18px radius, the hard shadow and the flat card fill, so it can't
// drift from the map's own tiles. What it keeps is the metaphor, because
// theme.js has level accents read as metro lines: the stub is a flat block of
// the level's line colour, and the perforation is still a perforation.
//
// The perforation is decoration, so it draws in `line`, not `controlLine`.
// The card itself isn't a control — the buttons passed in are — and the
// level the stub shows is given as text on it.
//
// The two punched holes are unbordered discs of the page colour laid over the
// card's top and bottom edges. That bites a notch out of the 3px rule, which
// is what a hole punched through an outlined ticket looks like, and it works
// in both themes because the page behind every module is `paper`.
const INNER_RADIUS = CITY_RULES.radius - CITY_RULES.border;
const HOLE = 16;

export default function TicketCard({ level, title, subtitle, children }) {
  return (
    <div className="citta" style={{ ...citySurface(), display: "flex" }}>
      <div
        style={{
          width: 58,
          flexShrink: 0,
          borderRadius: `${INNER_RADIUS}px 0 0 ${INNER_RADIUS}px`,
          background: level.accent,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700 }}>{level.label}</span>
        {/* No opacity here: dimming white on the accent fill drops it to
            4.26:1, under AA for text this small. */}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, letterSpacing: 1 }}>LINEA</span>
      </div>

      <div
        data-testid="perforation"
        aria-hidden="true"
        style={{ position: "relative", width: 0, borderLeft: `2px dashed ${TOKENS.line}`, margin: "12px 0", flexShrink: 0 }}
      >
        {/* Centred on the card's outer edge: 12px of margin, plus the 3px
            border, puts the edge 15px outside this box. */}
        <span
          style={{
            position: "absolute",
            left: -(HOLE / 2) - 1,
            top: -(12 + CITY_RULES.border) - HOLE / 2,
            width: HOLE,
            height: HOLE,
            borderRadius: "50%",
            background: TOKENS.paper,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: -(HOLE / 2) - 1,
            bottom: -(12 + CITY_RULES.border) - HOLE / 2,
            width: HOLE,
            height: HOLE,
            borderRadius: "50%",
            background: TOKENS.paper,
          }}
        />
      </div>

      <div style={{ flex: 1, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: TOKENS.ink, margin: "0 0 2px" }}>
            {title}
          </h3>
          {/* wraps so a subtitle with several parts (status, tagline, reading
              time) stacks on a narrow screen instead of squeezing */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            {subtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{children}</div>
      </div>
    </div>
  );
}
