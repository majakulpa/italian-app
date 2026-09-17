import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { TOKENS, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import SpeakButton from "../../shared/SpeakButton.jsx";
import TranslationToggle from "../../shared/TranslationToggle.jsx";
import { PHASES } from "./scene.js";
import { Card, Eyebrow, PhaseHeading, PhaseMeter, PrimaryButton, SANS, SERIF } from "./chrome.jsx";

// Phase 2 — Ascolta (design/02-la-citta.html, screen 03).
//
// Input before output, which is the caption's own claim: "you never produce
// cold". The learner reads and hears the whole exchange done well before
// being asked for a syllable of it.
//
// ── Refused: "▶ 0:14" ───────────────────────────────────────────────────
// The mockup puts a duration pill beside the vendor's name, which implies a
// recording. There is no recording. Every line here is spoken by the
// browser's own speech synthesis (shared/speech.js), one line at a time,
// at whatever rate the learner's device reads it — so there is no duration to
// print, and printing one would promise an audio file that does not exist and
// a length nobody measured.
//
// What replaces it is a pronounce button on each line, which is the thing the
// pill was standing in for: the design wanted the dialogue to be audible, and
// per-line playback is audible and honest about being synthesis.
//
// ── The gloss cards ─────────────────────────────────────────────────────
// The design underlines `maturi` inside the line and drops a lemon card under
// the dialogue. Same idea here, with the underline as a real <button>: a
// word you can tap has to be something a keyboard can reach and a screen
// reader can name, and an underline is neither. The card carries English,
// Polish and the note — all three, because that is what scenes.js authored
// and the note is usually the part that does the work.
//
// The notes are in Italian, which is a real question and is flagged in the
// report rather than papered over: translating them here would be inventing
// content that is not in the data.

// Who is speaking, in the learner's terms. `who` is "vendor" or "customer"
// in the data; the customer is the learner, so the label says so rather than
// naming a third person on screen.
const SPEAKER = {
  vendor: { label: "Il venditore", en: "the stallholder", accent: "lemon" },
  customer: { label: "Tu", en: "you", accent: "pistachio" },
};

function Line({ line }) {
  const speaker = SPEAKER[line.who];

  return (
    <div
      style={{
        ...citySurface(speaker.accent),
        padding: "10px 12px 12px",
        alignSelf: line.who === "customer" ? "flex-end" : "flex-start",
        maxWidth: "92%",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <Eyebrow lang="it" style={{ opacity: 0.85 }}>
          {speaker.label}
        </Eyebrow>
        <SpeakButton text={line.it} size={16} />
      </span>
      <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, margin: "6px 0 0", lineHeight: 1.4 }}>
        {line.it}
      </p>
      {/* `inherit` rather than the toggle's default inkSoft: this sits on a
          filled city surface, where inkSoft measured 3.92:1 against the
          pistachio bubble in the browser. Inheriting gives the surface's own
          ink, which theme.test.js already holds above 4.5:1 for every accent.
          See TranslationToggle.jsx. */}
      <TranslationToggle en={line.en} color="inherit" />
    </div>
  );
}

// One new word, as a button that opens its gloss. `aria-expanded` rather than
// a bare press state: the button controls a region that appears, which is
// what that attribute is for, and it is how a screen reader is told the gloss
// is now there without the card having to shout.
function WordButton({ word, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        border: `2px solid ${open ? TOKENS.cityInk : TOKENS.controlLine}`,
        borderRadius: 999,
        background: open ? CITY_ACCENTS.lemon.fill : "transparent",
        color: open ? CITY_ACCENTS.lemon.ink : TOKENS.ink,
        padding: "7px 13px",
        minHeight: 34,
        fontFamily: SERIF,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <span lang="it">{word.it}</span>
    </button>
  );
}

function Gloss({ word }) {
  return (
    <Card eyebrow="Nuova parola" eyebrowLang="it" accent="lemon" style={{ marginTop: 12 }}>
      <p style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0" }}>
        <span lang="it" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600 }}>
          {word.it}
        </span>
        <SpeakButton text={word.it} size={16} />
      </p>
      <p style={{ fontFamily: SANS, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>
        {word.en} &middot; <span lang="pl">{word.pl}</span>
      </p>
      {/* Italian, as authored. See the file header. */}
      <p lang="it" style={{ fontFamily: SANS, fontSize: 13, margin: "8px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
        {word.note}
      </p>
    </Card>
  );
}

export default function SceneListen({ scene, headingRef, onDone }) {
  const [open, setOpen] = useState(null);
  const word = scene.newWords.find((candidate) => candidate.it === open);

  return (
    <>
      <PhaseMeter phase={PHASES[1]} />
      <PhaseHeading headingRef={headingRef} it="Ascolta" en="Watch it done once, before you say any of it yourself." />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {scene.model.map((line, index) => (
          <Line key={index} line={line} />
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>The new words &mdash; tap one for its gloss</Eyebrow>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {scene.newWords.map((candidate) => (
            <WordButton
              key={candidate.it}
              word={candidate}
              open={candidate.it === open}
              // Pressing the open word again closes it. The button stays
              // mounted either way, so focus needs no help here — which is
              // exactly why the gloss is a card under the row rather than a
              // panel that replaces it.
              onToggle={() => setOpen(candidate.it === open ? null : candidate.it)}
            />
          ))}
        </div>
        {word && <Gloss word={word} />}
      </div>

      <PrimaryButton accent="pistachio" onClick={onDone} style={{ marginTop: 22 }}>
        <span lang="it">Ho capito</span> <ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>

      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
        Finishing here puts these {scene.newWords.length} words into <span lang="it">La Piazza</span>, so they come back
        tomorrow whether or not you get any further.
      </p>
    </>
  );
}
