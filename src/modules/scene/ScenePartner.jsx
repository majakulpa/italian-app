import React from "react";
import { Home, MessageSquareOff } from "lucide-react";
import { TOKENS, CITY_RULES, citySurface } from "../../shared/theme.js";
import { PHASES } from "./scene.js";
import { Card, PhaseHeading, PhaseMeter, PrimaryButton, SANS, SERIF } from "./chrome.jsx";

// Phase 4 — Al mercato, and what stands in its place today
// (design/02-la-citta.html, screen 05).
//
// The phase is the unscripted task: a stallholder who answers what the learner
// actually said, at speed, without a script. That needs a scene partner — a
// language model, called with the learner's own API key — and neither the key
// storage nor the partner is built in this slice.
//
// ── Why there is no stand-in ────────────────────────────────────────────
// The obvious thing to put here is a scripted conversation: a few authored
// vendor turns, chosen by keyword, labelled "practice mode". It is refused,
// and this is the whole argument.
//
// A scripted partner is a *worse* version of the dialogues one door away in
// this same district. Il Mercato already ships ten of them, they are better
// written than anything improvised here would be, and they say what they are.
// Putting a thin one behind phase 4 would take the one thing this phase is for
// — that nobody slows down for you and nothing is predictable — and replace it
// with the one thing it is explicitly not. The learner would practise against
// a script, conclude that the scene phase is the dialogues again, and be
// wrong about what she can do at a real market stall.
//
// The honest version is a screen that says what is missing and what it needs.
// It costs the learner nothing: the brief said "the first three work now", the
// words are already in La Piazza, and the goal is printed here so she knows
// what the phase will ask of her when it arrives.
//
// ── Why Casa ────────────────────────────────────────────────────────────
// Casa is where the scene-partner key will be entered (plan S1: a PIN-locked
// key, stored encrypted, never in the progress blob). So Casa is the one place
// a learner can do anything at all about this screen, which is why it gets a
// real button rather than a sentence pointing at the tab bar.

export default function ScenePartner({ scene, headingRef, onCasa, onLeave }) {
  const phase = PHASES[3];

  return (
    <>
      <PhaseMeter phase={phase} />
      <PhaseHeading
        headingRef={headingRef}
        it={phase.label}
        en="The scene itself — and the one phase that is not set up yet."
      />

      <div style={{ ...citySurface(), padding: "16px", display: "flex", gap: 10 }}>
        <MessageSquareOff size={20} aria-hidden="true" color={TOKENS.ink} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.35 }}>
            This phase needs a scene partner, and there isn&rsquo;t one yet.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, margin: "10px 0 0", lineHeight: 1.6 }}>
            The other three phases are a script: the same dialogue, the same prompts, the same accepted answers every
            time. This one cannot be. It is a stallholder who answers what you actually said, and that takes a language
            model and a key of your own &mdash; which is set up in <span lang="it">Casa</span>, and is the next thing
            being built.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
            There is no practice version standing in for it. A scripted stallholder would be a worse copy of the{" "}
            <span lang="it">Dialoghi</span> next door, and it would teach you that this phase is predictable when the
            entire point is that it is not.
          </p>
        </div>
      </div>

      {/* The goal, printed rather than withheld. It is the thing the phase will
          ask for, it is already written down in the data, and reading it now is
          how the rest of the scene stays worth doing. */}
      <Card eyebrow="Quando ci sarà, ti chiederà questo" eyebrowLang="it" accent="lemon" style={{ marginTop: 14 }}>
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.4 }}>
          {scene.task.goal.it}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13.5, margin: "8px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
          {scene.task.goal.en}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13, margin: "10px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
          Your partner would be <span lang="it">{scene.task.partner.it}</span> &mdash; {scene.task.partner.en}.
        </p>
      </Card>

      <PrimaryButton accent="lemon" onClick={onCasa} style={{ marginTop: 18 }}>
        <Home size={16} aria-hidden="true" />
        <span>
          Open <span lang="it">Casa</span>
        </span>
      </PrimaryButton>

      {/* A boundary in controlLine rather than no boundary at all. This
          shipped borderless first, and the browser pass caught it: every other
          back route in the app is a left-arrow link, and this one is a
          centred line of small grey text under a filled primary button, which
          reads as a caption rather than as something to press. controlLine is
          the token for a clickable boundary (3.65:1 on paper, 4.05:1 on card,
          so it clears SC 1.4.11 in both themes) — `line` would not. */}
      <button
        type="button"
        onClick={onLeave}
        style={{
          border: `2px solid ${TOKENS.controlLine}`,
          borderRadius: CITY_RULES.radius,
          background: "transparent",
          color: TOKENS.ink,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "block",
          width: "100%",
          padding: "12px 18px",
          marginTop: 12,
        }}
      >
        Back to the scenes
      </button>
    </>
  );
}
