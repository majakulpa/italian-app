import React from "react";
import { ArrowLeft } from "lucide-react";
import { TOKENS, CITY_RULES, citySurface } from "../../shared/theme.js";
import SpeakButton from "../../shared/SpeakButton.jsx";
import { boxInterval, MAX_BOX } from "../../shared/srs.js";
import { glossSenses } from "../../data/fondamentale.js";
import { wordTraces } from "./traces.js";

// Word detail — design screen 11, and the screen behind a fascia.
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
// `Dove l'hai incontrata` lists `Ep. 7` and `Il Bar`, and both of those are
// drawings — a serial that does not exist and a scene from chunk 6. The first
// version of this screen concluded from that that nothing could fill the
// section, and said so. That was too strong, and traces.js is the correction:
// the vocabulary deck proves the app put a lemma in front of you in an example
// sentence, and the story glosses prove it opened one under your finger. Those
// are real encounters, and they are the two the app can actually prove.
//
// What stays true is the narrower claim: reading a story writes no word
// *status* (wordState.js, and why `met` was deleted), so a story trace can
// only say whether the story was finished, never that the word was learned.
//
// ── The Polish card, which the data already knew ────────────────────────
// The design's pink card has `chiedere` covering both *pytać* and *prosić o*,
// and that is not new content: fondamentale.js already separates multiple
// Polish senses with " · ", and 87 of the first 300 entries carry one. So the
// card fires off the data that is there.
//
// What it must not say is that the split only bites in one direction. It read
// "going this way you choose, and coming back you do not", and coming back you
// often do: 24 Polish senses in the first 300 entries are carried by more than
// one entry — `mówić` by both `dire` and `parlare`, which is a card this very
// screen draws — and `strada` and `via` share their whole Polish set.
// fondamentale.test.js pins that, and La Riserva's drill screen makes the same
// correction in its own note.
//
// What it must not do either is say *why* the split is there. Polish splits an Italian word for two
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

// Three Italian labels and one English one, so the language travels with the
// label rather than being asserted over all four. The pill used to carry a
// flat `lang="it"`, which told a screen reader to read "not started" as
// Italian — and, because <Pill> swallowed the prop, told it nothing at all.
// Both halves of that are fixed here: the prop reaches the DOM, and it is only
// there when the string is Italian.
const STATE_LABEL = {
  unseen: { label: "not started", lang: undefined },
  learning: { label: "in corso", lang: "it" },
  known: { label: "nota", lang: "it" },
  solid: { label: "solida", lang: "it" },
};

// Only ever set on an entry whose `it` elides to `l'` — fondamentale.js's
// `gender` field exists because that elision is the one case the article
// convention can't carry gender through on its own. Shown here in Italian,
// like the state pill beside it, because "maschile"/"femminile" are real
// Italian words a learner benefits from seeing rather than an English "m"/"f"
// abbreviation standing in for them.
const GENDER_LABEL = { m: "maschile", f: "femminile" };

// `...rest` for the `lang` the state pill passes — see RiservaModule.jsx's
// <Eyebrow> for what a component that quietly drops it costs.
function Pill({ children, accent, style, ...rest }) {
  return (
    <span
      {...rest}
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

export default function WordDetail({ entry, state, box, progress, onBack }) {
  const traces = wordTraces(progress, entry);
  const pl = glossSenses(entry.pl);
  const en = glossSenses(entry.en);
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
        {/* Italian, like the drill screen's twin — `posto` is a word, not a
            label, and an English document has to say so. */}
        <Pill lang="it">posto {entry.rank}</Pill>
        {entry.gender && <Pill lang="it">{GENDER_LABEL[entry.gender]}</Pill>}
        <Pill accent={state === "unseen" ? undefined : "lemon"} lang={STATE_LABEL[state].lang}>
          {STATE_LABEL[state].label}
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
              <b lang="pl">{pl.slice(0, -1).join(", ")}</b> and <b lang="pl">{pl[pl.length - 1]}</b> — so going this way
              you choose between them. Coming back is easier, and not free: a Polish word here can belong to another
              Italian entry too.
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
              Not in the scheduler. Nothing has asked you this word yet, so there is no box and no date to show — drill
              its <i lang="it">fascia</i> and it goes into the queue with everything else.
            </p>
          </Card>
        )}

        <Card>
          <Eyebrow style={{ opacity: 0.85, color: TOKENS.inkSoft }} lang="it">
            Dove l'hai incontrata
          </Eyebrow>
          {traces.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {traces.map((trace, i) => (
                <li key={i} style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <Eyebrow style={{ color: TOKENS.inkSoft }}>
                      {trace.kind === "deck" ? "deck" : "story"} · {trace.level.id}
                    </Eyebrow>
                    <span style={{ color: TOKENS.inkSoft }}>{trace.where}</span>
                    {trace.done && <span style={{ color: TOKENS.inkSoft }}>· done</span>}
                  </span>
                  {trace.kind === "deck" ? (
                    <>
                      <span lang="it" style={{ display: "block", fontStyle: "italic" }}>
                        {trace.it}
                      </span>
                      <span style={{ display: "block", color: TOKENS.inkSoft }}>{trace.en}</span>
                    </>
                  ) : (
                    // The gloss the story itself gave, verbatim. Matching is by
                    // written form, so a homograph can land here under the
                    // wrong sense — printing the story's own words makes that
                    // visible instead of asserting it. See traces.js.
                    <span style={{ display: "block", color: TOKENS.inkSoft }}>glossed there as “{trace.meaning}”</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: TOKENS.inkSoft }}>
              Nowhere yet. The app can prove two kinds of encounter — a word the vocabulary deck teaches, and a word a
              story glossed under your finger — and this one is in neither. Most of the lexicon is, for now.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
