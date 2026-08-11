import React from "react";
import { TOKENS } from "./theme.js";

// A home-screen list item styled like a metro ticket stub: a colored line
// badge, a punched perforation, then the title/subtitle and whatever
// action(s) the caller passes as children (1-3 buttons). Replaces the
// near-identical plain card markup that used to be duplicated across
// VocabHome/GrammarHome/ConversationsHome.
export default function TicketCard({ level, title, subtitle, children }) {
  return (
    <div
      style={{
        background: TOKENS.card,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 16,
        display: "flex",
      }}
    >
      <div
        style={{
          width: 58,
          flexShrink: 0,
          borderRadius: "16px 0 0 16px",
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
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, letterSpacing: 1, opacity: 0.85 }}>LINEA</span>
      </div>

      <div style={{ position: "relative", width: 0, borderLeft: `1.5px dashed ${TOKENS.line}`, margin: "10px 0", flexShrink: 0 }}>
        <span style={{ position: "absolute", left: -7, top: -10, width: 14, height: 14, borderRadius: "50%", background: TOKENS.paper }} />
        <span style={{ position: "absolute", left: -7, bottom: -10, width: 14, height: 14, borderRadius: "50%", background: TOKENS.paper }} />
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
