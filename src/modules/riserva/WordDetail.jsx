import React from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, CITY_RULES, citySurface } from "../../shared/theme.js";
import SpeakButton from "../../shared/SpeakButton.jsx";
import { boxInterval, MAX_BOX } from "../../shared/srs.js";

// Word detail — design screen 11, and the last screen in L'Officina.
//
// The other half of what makes the lexicon visible: La Riserva says how much
// of the reservoir you hold, this says what one drop of it is.
//
// ── The way in ──────────────────────────────────────────────────────────
// This was the open question, and it was never the quantity. The design draws
// cells you could imagine tapping and there are two thousand of them, which is
// not a tab order. The answer is the *fascia*: a band opens to at most two
// hundred words, on demand, and those are the buttons. A keyboard user reaches
// a word in two presses and a band's worth of arrow keys instead of crossing a
// two-thousand-cell grid, and the cells stay a picture.
//
// ── What the design draws that is not here, and why ─────────────────────
// `/ˈkjɛː.de.re/ · verbo irregolare`. There is no pronunciation or
// part-of-speech data in this app, and inventing an IPA transcription per word
// is exactly the kind of confident error the lexicon's own header warns about
// — a wrong stress mark teaches a wrong word. The speak button is the honest
// version of that line: the browser says it aloud instead of the app claiming
// to know how it is written down.
//
// `Dove l'hai incontrata`, with two sentences from Il Cinema and Il Bar, is
// the best idea on the screen and the one thing nothing in this app can
// answer. Reading a story writes no word-level record — wordState.js says so
// at length, and it is why the `met` state was deleted rather than kept as
// decoration. So the section states what it is waiting on, in the same voice a
// shut bench uses, rather than showing two invented sentences.
//
// ── The Polish card, which the data already knew ────────────────────────
// The design's pink card has `chiedere` covering both *pytać* and *prosić o*,
// and that is not new content: fondamentale.js already separates multiple
// Polish senses with " · ", and 87 of the first 300 entries carry one. So the
// card fires off the data that is there.
//
// What it must not do is say *why*. Polish splits an Italian word for two
// quite different reasons — `pytać · prosić o` is two meanings, `mówić ·
// powiedzieć` is one meaning in two aspects — and nothing in the file
// distinguishes them. Aspect is a verb category, so the two cases are not
// even always confusable, but "this one is aspect" is a claim per word and
// this file cannot make it. The card states the fact, which is certain, and
// names both reasons without picking one.
//
// The obvious refinement — only mention aspect for verbs, since Polish aspect
// is a verb category and saying it under a preposition like `di` is noise —
// was tried and dropped. There is no reliable verb test here: an infinitive
// ending is not one, because `mare` ends in -are and is a noun. A heuristic
// that is wrong about `mare` is worse than a sentence that is merely broad.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

const STATE_LABEL = { unseen: "not started", learning: "in corso", known: "nota", solid: "solida" };

// The gloss as senses. " · " is the separator fondamentale.js uses, and the
// count is the whole point of the card below.
export function senses(gloss) {
  return gloss.split(" · ").map((s) => s.trim());
}

function Pill({ children, accent, style }) {
  return (
    <span
      style={{
        ...citySurface(accent),
        borderRadius: 999,
        padding: "4px 12px",
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Card({ accent, children, style }) {
  return (
    <div
      style={{
        ...citySurface(accent),
        borderRadius: CITY_RULES.radius,
        padding: "14px 16px",
        display: "grid",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, style }) {
  return (
    <span
      style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", ...style }}
    >
      {children}
    </span>
  );
}

// "Torna fra 3 giorni". Only where there is a box to read it off — most of the
// lexicon has never been in the scheduler, and a due date for a word nothing
// has ever asked you would be fiction.
function Schedule({ box }) {
  const days = boxInterval(box);

  return (
    <Card accent="pistachio">
      <Eyebrow style={{ opacity: 0.85 }}>Where it sits</Eyebrow>
      <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.55 }}>
        Box <b>{box}</b> of {MAX_BOX}
        {box >= MAX_BOX ? (
          <>
            {" "}— the top one. It comes back after <b>{days} days</b>, and surviving that gap is what <i lang="it">solida</i>{" "}
            means.
          </>
        ) : (
          <>
            {" "}— it comes back after <b>{days === 0 ? "the same day" : `${days} day${days === 1 ? "" : "s"}`}</b>.
          </>
        )}
      </p>
    </Card>
  );
}

export default function WordDetail({ entry, state, box, onBack }) {
  const pl = senses(entry.pl);
  const en = senses(entry.en);
  const divides = pl.length > 1;

  return (
    <>
      <button
        onClick={onBack}
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
        La Riserva
      </button>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 10px" }}>
        <Pill>posto {entry.rank}</Pill>
        <Pill accent={state === "unseen" ? undefined : "lemon"} lang="it">
          {STATE_LABEL[state]}
        </Pill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
          {entry.it}
        </h1>
        <SpeakButton text={entry.it} size={20} />
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <Card>
          <div style={{ display: "grid", gap: 8, fontFamily: SANS, fontSize: 15 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <span aria-hidden="true">🇬🇧</span>
              <span>{en.join(" · ")}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span aria-hidden="true">🇵🇱</span>
              <span lang="pl">{pl.join(" · ")}</span>
            </div>
          </div>
        </Card>

        {/* Pink is Polish everywhere in L'Officina. */}
        {divides && (
          <Card accent="bubble">
            <Eyebrow style={{ opacity: 0.85 }}>🇵🇱 Polish uses more than one word here</Eyebrow>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.6 }}>
              Italian has <i lang="it">{entry.it}</i>. Polish has{" "}
              <b lang="pl">{pl.slice(0, -1).join(", ")}</b> and <b lang="pl">{pl[pl.length - 1]}</b> — so going this way you
              choose, and coming back you do not.
            </p>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
              That happens for two different reasons: two senses Italian does not separate, or one sense in two aspects,
              which is a thing Polish does to verbs and Italian does with tense instead. Which one this is, the list does
              not say — so check the pair rather than trusting the split.
            </p>
          </Card>
        )}

        {box ? (
          <Schedule box={box} />
        ) : (
          <Card>
            <Eyebrow style={{ opacity: 0.85, color: TOKENS.inkSoft }}>Where it sits</Eyebrow>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: TOKENS.inkSoft }}>
              Not in the scheduler. Nothing has asked you this word yet, so there is no box and no date to show — the
              vocabulary deck is the only thing that puts a lexicon word into the queue.
            </p>
          </Card>
        )}

        {/* The design's best section, and the one nothing can fill in. */}
        <Card>
          <Eyebrow style={{ opacity: 0.85, color: TOKENS.inkSoft }} lang="it">
            Dove l'hai incontrata
          </Eyebrow>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: TOKENS.inkSoft }}>
            Waiting on something that remembers where you met a word. Reading a story writes no word-level record today —
            only that the story is done — so the sentences that would go here do not exist yet. It fills itself in the day
            a glossing surface starts writing them down.
          </p>
        </Card>
      </div>
    </>
  );
}
