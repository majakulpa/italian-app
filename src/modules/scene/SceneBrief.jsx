import React from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { TOKENS } from "../../shared/theme.js";
import { PHASES, knownCount } from "./scene.js";
import { Card, Eyebrow, PhaseHeading, PhaseMeter, PrimaryButton, SANS, SERIF } from "./chrome.jsx";

// Phase 1 — the brief (design/02-la-citta.html, screen 02).
//
// The screen's whole job is the first line of its own caption: "you're not
// doing lesson 4, you're becoming someone who can buy tomatoes." So the
// ability comes before anything else, and the material is listed under it as
// what it costs rather than as what the lesson contains.
//
// ── The one real number, and the two refusals ───────────────────────────
// "✓ 14 parole che sai già" is drawn in the mockup. Fourteen is a drawing:
// nobody has fourteen of these ranks on day one, and a learner who has forty
// should be told forty. So the figure comes out of the learner's own lexicon
// state over the scene's `knownRanks` — see knownCount in scene.js for what
// "already knows" is allowed to mean.
//
// Refused: **"circa 12 minuti"**, which the mockup prints beside "4 fasi".
// Nobody has timed a scene. There is no instrumentation in this app that
// could produce that number — by design, since PLAN.md forbids counting
// minutes — and a twelve that turns out to be twenty-five is the kind of
// small lie that makes a learner stop trusting the rest of the screen. "4
// fasi" stays, because four is a fact about the data.
//
// Refused: the ability's own unglossed words. `cibo` and `peso` are in
// neither `knownRanks` nor `newWords` (scenes.js says so outright), and the
// temptation was to gloss them here. They are not glossed, because the
// ability is read rather than produced and the English sits directly under
// it — a beginner who does not know `peso` reads "by weight" on the next
// line, which is what the English is for. Glossing them would make the
// can-do statement look like a sixth new word to learn.

export default function SceneBrief({ scene, progress, headingRef, onBegin }) {
  const known = knownCount(progress, scene);
  const partner = PHASES.find((phase) => phase.partner);

  return (
    <>
      <PhaseMeter phase={PHASES[0]} />
      <PhaseHeading headingRef={headingRef} it={scene.title} en={scene.ability.en} />

      <div style={{ display: "grid", gap: 14 }}>
        <Card eyebrow="La situazione" eyebrowLang="it">
          <p lang="it" style={{ fontFamily: SANS, fontSize: 14.5, margin: "8px 0 0", lineHeight: 1.6, color: TOKENS.ink }}>
            {scene.task.setting.it}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "8px 0 0", lineHeight: 1.55, color: TOKENS.inkSoft }}>
            {scene.task.setting.en}
          </p>
        </Card>

        {/* The design's pistachio "Se ce la fai" card, which is the ability
            stated as the thing you will be able to do. */}
        <Card eyebrow="Se ce la fai" eyebrowLang="it" accent="pistachio">
          <p lang="it" style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.35 }}>
            {scene.ability.it}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13.5, margin: "8px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
            {scene.ability.en}
          </p>
        </Card>

        <div>
          <Eyebrow lang="it" style={{ color: TOKENS.inkSoft }}>
            Ti serve
          </Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 10 }}>
            {/* Every row carries an icon *and* says its own arithmetic in
                words: a tick beside a number is not a statement about which
                half of the row is the good news (WCAG 1.4.1). */}
            <li style={{ display: "flex", gap: 8, fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.5 }}>
              <Check size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
              <span>
                {known} of the {scene.knownRanks.length} everyday words this scene leans on are ones you already know
                &mdash; <span lang="it">{known} parole che sai gi&agrave;</span>
              </span>
            </li>
            <li style={{ display: "flex", gap: 8, fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.5 }}>
              <Plus size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
              <span>
                {scene.newWords.length} new:{" "}
                <i lang="it">{scene.newWords.map((word) => word.it).join(", ")}</i>
              </span>
            </li>
            <li style={{ display: "flex", gap: 8, fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.5 }}>
              <Plus size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
              <span>
                one piece of grammar: <i lang="it">{scene.grammar.title}</i>
              </span>
            </li>
          </ul>
        </div>

        <PrimaryButton onClick={onBegin}>
          <span lang="it">Comincia</span> <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>

        {/* "4 fasi" and what the fourth one is, which is the honest half of
            the promise: the task at the end needs somebody to talk to, and
            that somebody is not built yet. Saying it here rather than only on
            phase 4 means nobody starts a scene expecting to finish it. */}
        <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: 0, textAlign: "center", lineHeight: 1.6 }}>
          <span lang="it">{PHASES.length} fasi</span>. The last one, <span lang="it">{partner.label}</span>, is the scene
          itself with a partner who answers back &mdash; and that partner is not set up yet. The first three work now.
        </p>
      </div>
    </>
  );
}
