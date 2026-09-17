import React from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { PHASES } from "./scene.js";

// The pieces every scene phase draws, in one place — the La Città styling the
// rest of the district is in, and nothing more. Kept out of the phase files so
// that four screens cannot drift into four slightly different eyebrows, which
// is what happened to the postcard modules before the design system existed.

export const MONO = "'IBM Plex Mono', monospace";
export const SERIF = "'Fraunces', serif";
export const SANS = "'Inter', sans-serif";

export function Eyebrow({ children, style, ...rest }) {
  return (
    <span
      {...rest}
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

export function BackLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: TOKENS.inkSoft,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: SANS,
        fontSize: 14,
        padding: "6px 2px",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export function PrimaryButton({ children, accent = "lemon", type = "button", onClick, style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
        borderRadius: CITY_RULES.radius,
        boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
        background: CITY_ACCENTS[accent].fill,
        color: CITY_ACCENTS[accent].ink,
        padding: "13px 18px",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// A titled card in one of the city's hues, which is what every block on
// screens 02–04 is.
export function Card({ eyebrow, eyebrowLang, accent, children, style }) {
  return (
    <div style={{ ...citySurface(accent), padding: "14px 16px 16px", ...style }}>
      <Eyebrow lang={eyebrowLang} style={{ opacity: accent ? 0.85 : 1, color: accent ? undefined : TOKENS.inkSoft }}>
        {eyebrow}
      </Eyebrow>
      {children}
    </div>
  );
}

// Which phase this is, drawn as the design's bar plus the fact in words.
//
// The bar is a real <progress>, not a div with a width: design 03–05 draw it
// as decoration, and decoration that carries the only statement of how far
// through you are is a statement a screen reader never hears. The text beside
// it says the same thing, so the bar is genuinely redundant — which is the
// only condition under which `aria-hidden` on it would also have been fine.
export function PhaseMeter({ phase }) {
  const index = PHASES.indexOf(phase);

  return (
    <div style={{ margin: "14px 0 12px" }}>
      <progress
        value={index + 1}
        max={PHASES.length}
        aria-label={`Phase ${index + 1} of ${PHASES.length}`}
        style={{ width: "100%", height: 8, accentColor: CITY_ACCENTS.lemon.fill }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Phase {index + 1} of {PHASES.length}
        </Eyebrow>
        <Eyebrow lang="it" style={{ color: TOKENS.inkSoft }}>
          {phase.label}
        </Eyebrow>
      </div>
    </div>
  );
}

// The h1 every phase opens with, and the focus target when a phase replaces
// the one before it.
//
// ── Why focus moves here ────────────────────────────────────────────────
// Pressing "Comincia" unmounts the button that was pressed, which drops focus
// to the body: a keyboard learner's next Tab starts again from the top of the
// document, and a screen reader says nothing at all about having arrived
// somewhere new. So the new phase's heading takes focus — the same move the
// grammar drill and the dialogue already make onto their new prompt, and for
// the same reason. tabIndex={-1} makes it focusable without adding a tab stop
// nobody wants.
export function PhaseHeading({ headingRef, it, en }) {
  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        lang="it"
        style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: TOKENS.ink, margin: "0 0 4px", lineHeight: 1.15 }}
      >
        {it}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 16px", lineHeight: 1.5 }}>{en}</p>
    </>
  );
}
