import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Type } from "lucide-react";
import { TOKENS, SR_ONLY, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { STRANDS, RULES, filled } from "../../data/articoli.js";
import { loadProgress, saveProgress, markWord, articoliKey, strandKnownCount } from "../../shared/storage.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import { judge, announce, ATTEMPTS } from "./feedback.js";
import { Options, ArticleVerdict, Rule, PolishAnchor } from "./cards.jsx";

// Gli Articoli — L'Officina's third workbench, and design screen 12.
//
// The permanent strand. Polish has no articles, English has them and drops
// them exactly where Italian keeps them, and the errors survive into advanced
// proficiency — so this is the one bench that never graduates.
//
// Built in the La Città design system, like Mappatura delle parole and the hub. PLAN.md's
// open question on the visual seam is the one between that and the four older module
// interiors, and its answer is that a screen migrates when it is built, never
// in a blanket pass.
//
// ── What is not built from the design ───────────────────────────────────
// Screen 12's status bar reads `ARTICOLI · GIORNO 148` and its pill reads
// `71% ↑`. Both are drawings. There is no day counter anywhere in this app —
// PLAN.md deleted the streak permanently, and a day number is a streak with a
// different label — and 71% is a figure of nothing. What this screen shows
// instead is the fraction it can actually measure: how many of a strand's
// items have been answered right first time, read back out of storage.
//
// The design also puts the pink Polish card beside the unanswered question.
// It is here instead *after* the item settles, which is a deliberate
// departure: the anchor for `Bevo il caffè` says in as many words that
// neither Polish nor English would put anything in that gap, and printing
// that above three buttons is the answer. Produce first, reveal last.

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const SANS = "'Inter', sans-serif";

function Eyebrow({ children, style }) {
  return (
    <span
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

function PrimaryButton({ children, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
        borderRadius: CITY_RULES.radius,
        boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
        background: CITY_ACCENTS.pistachio.fill,
        color: CITY_ACCENTS.pistachio.ink,
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

function BackLink({ label, onClick }) {
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
        fontSize: 13,
        padding: "6px 6px 6px 0",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
}

function Screen({ children }) {
  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      {children}
    </div>
  );
}

// ── The three strands ────────────────────────────────────────────────────

function ArticoliHome({ progress, onOpen, onExit, exitLabel }) {
  return (
    <Screen>
      <BackLink label={exitLabel} onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          The permanent strand
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Gli Articoli
        </h1>
        {/* The design's own line, in Italian and glossed underneath — the
            learner is a beginner, and an untranslated subtitle is decoration
            rather than the course. Same treatment as the hub's. */}
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontStyle: "italic", color: TOKENS.ink, margin: "8px 0 0" }}>
          Il polacco non ne ha. Per questo non smette mai di comparire.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", lineHeight: 1.55 }}>
          Polish has none of them, which is why this never stops coming back. English has them and drops them in exactly the
          places Italian keeps them, so neither of your two languages helps here.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {STRANDS.map((strand, i) => {
          const known = strandKnownCount(progress, strand);
          const paint = CITY_ACCENTS[strand.accent];

          return (
            <button
              key={strand.id}
              onClick={() => onOpen(strand)}
              style={{
                ...citySurface(strand.accent),
                padding: "14px 16px 16px",
                textAlign: "left",
                cursor: "pointer",
                display: "block",
                width: "100%",
                font: "inherit",
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <Eyebrow style={{ opacity: 0.85, display: "block" }}>Passo {String(i + 1).padStart(2, "0")}</Eyebrow>
                <Eyebrow
                  style={{
                    display: "block",
                    border: `2px solid ${paint.ink}`,
                    borderRadius: 999,
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {known} / {strand.items.length} landed
                </Eyebrow>
              </span>

              <span
                lang="it"
                style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "8px 0 2px", lineHeight: 1.2 }}
              >
                {strand.name}
              </span>
              <span style={{ display: "block", fontFamily: SANS, fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
                {strand.label}
              </span>

              <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>
                {strand.reach}
              </span>
            </button>
          );
        })}
      </div>

      {/* The design's footer trail — determinativo ✓ · indeterminativo ✓ ·
          preposizioni articolate — adesso. Real ticks rather than drawn ones:
          a strand is only ticked once every item in it has landed. */}
      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "16px 0 0", lineHeight: 1.6 }}>
        In this order, and the order is the point — a fused preposition is a definite article welded onto a preposition, so
        there is nothing to fuse until the first strand is yours.
      </p>
    </Screen>
  );
}

// ── The header on a strand's own screens ─────────────────────────────────

function StrandBar({ strand, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <BackLink label="Gli Articoli" onClick={onBack} />
      <p lang="it" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: TOKENS.inkSoft, margin: 0 }}>
        {strand.name}
      </p>
    </div>
  );
}

// ── The teaching card ────────────────────────────────────────────────────

function StrandCard({ strand, onBack, onPractise }) {
  return (
    <Screen>
      <StrandBar strand={strand} onBack={onBack} />

      <div style={{ ...citySurface(), padding: "6px 12px", display: "inline-block", marginBottom: 14 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>{strand.label}</Eyebrow>
      </div>

      <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: TOKENS.ink, margin: "0 0 18px", lineHeight: 1.2 }}>
        {strand.name}
      </h1>

      <div style={{ ...citySurface(strand.accent), padding: "14px 16px", marginBottom: 14 }}>
        <p style={{ fontFamily: SANS, fontSize: 14, margin: 0, lineHeight: 1.55 }}>{strand.reach}</p>
      </div>

      <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
        {strand.teaches.map((id) => (
          <Rule key={id} rule={RULES[id]} heading="The rule" />
        ))}
      </div>

      <PrimaryButton onClick={onPractise}>
        Practise it <ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>
    </Screen>
  );
}

// ── The drill (design screen 12) ─────────────────────────────────────────

function Drill({ strand, onBack, onDone, onGrade }) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [tried, setTried] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const item = strand.items[index];
  // A wrong first attempt is not the end of the item: the learner gets the
  // located verdict and the buttons back. Only a right answer or a spent
  // second attempt closes it.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  const advance = () => {
    if (index + 1 >= strand.items.length) {
      onDone(results);
      return;
    }
    setIndex(index + 1);
    setAttempt(1);
    setTried([]);
    setVerdict(null);
  };

  const choose = (option) => {
    if (settled || tried.includes(option)) return;

    const next = judge(item, option, attempt);
    setVerdict(next);
    setTried([...tried, option]);
    if (next.correct || next.last) {
      // Right first time is "known"; anything that needed a second look, or
      // ran out of looks, is "learning" — the same bar Mappatura delle parole and the
      // grammar drill use, so the three cards mean the same thing.
      //
      // One expression, used twice, and that is the whole point. It was two:
      // storage asked for right-first-time and the summary asked only for
      // right-eventually, so a second-attempt win made the summary say "5
      // landed" and the strand list say "4 / 5 landed" about the same run —
      // and dropped the one item most worth revisiting out of "Worth another
      // look". `landed` is now the single definition of the word.
      const landed = next.correct && attempt === 1;
      onGrade(articoliKey(strand, item), landed ? "known" : "learning");
      setResults((r) => [...r, { item, landed }]);
    } else {
      setAttempt(attempt + 1);
    }
  };

  return (
    <Screen>
      <StrandBar strand={strand} onBack={onBack} />

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {strand.items.length}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Attempt {attempt} of {ATTEMPTS}
        </Eyebrow>
      </div>

      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 12px" }}>
        Fill the gap. One of the three is right, and one of the three is nothing at all.
      </p>

      <div style={{ ...citySurface(strand.accent), padding: "16px" }}>
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: 0, lineHeight: 1.45 }}>
          {item.before} <span aria-hidden="true">___</span>
          <span style={SR_ONLY}> blank </span> {item.after}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13, margin: "8px 0 0", opacity: 0.9 }}>{item.en}</p>
      </div>

      <Options
        options={item.options}
        answer={item.answer}
        tried={tried}
        settled={settled}
        onChoose={choose}
      />

      {verdict && <ArticleVerdict verdict={verdict} />}
      {verdict && verdict.rule && (
        <div style={{ marginTop: 14 }}>
          <Rule rule={verdict.rule} />
        </div>
      )}
      {verdict && verdict.anchor && <PolishAnchor anchor={verdict.anchor} />}

      {settled && (
        <PrimaryButton onClick={advance} style={{ marginTop: 14 }}>
          {index + 1 >= strand.items.length ? "See how it went" : "Continua"} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      )}
    </Screen>
  );
}

// ── The end of a run ─────────────────────────────────────────────────────

// `landed` means one thing in this app — answered right first time — and it is
// decided once, in the drill, so the number on this screen and the number on
// the strand card behind it are the same number read two ways.
function Summary({ strand, results, onBack, onAgain }) {
  const landed = results.filter((r) => r.landed);
  const slipped = results.filter((r) => !r.landed);

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Type size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          <span lang="it">{strand.name}</span> — that&rsquo;s the run
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{landed.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>landed</Eyebrow>
        </div>
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{slipped.length}</p>
          {/* Not "revealed": an item won back on the second attempt was never
              revealed, and it belongs on this tile all the same. */}
          <Eyebrow style={{ opacity: 0.9 }}>took a second look</Eyebrow>
        </div>
      </div>

      {slipped.length > 0 && (
        <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 20 }}>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>Worth another look</Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
            {slipped.map(({ item }) => (
              <li key={item.id} style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.45 }}>
                <b lang="it">{filled(item)}</b>
                <span style={{ color: TOKENS.inkSoft }}> · {item.en}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <PrimaryButton onClick={onAgain}>Run it again</PrimaryButton>
        <PrimaryButton
          onClick={onBack}
          style={{ background: TOKENS.card, color: TOKENS.ink, border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}` }}
        >
          Back to the strands
        </PrimaryButton>
      </div>
    </Screen>
  );
}

// Two ways in, so two things `onExit` can mean: L'Officina's hub opens this as
// a child of itself and comes back to the workshop, and the NavMenu opens it
// at the top level and comes back to the city. `exitLabel` is how the back
// link says which of the two it is about to do. Same shape as Mappatura delle parole.
export default function ArticoliModule({ onExit, exitLabel = "All modules" }) {
  const [progress, setProgress] = useState(loadProgress);
  const [session, setSession] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // markWord rather than reviewItem: Gli Articoli is deliberately outside the
  // Leitner queue. The reasoning is written down beside `scheduled: false` in
  // shared/stats.js, because that flag is where anyone would look for it.
  const onGrade = (key, status) => setProgress((p) => markWord(p, key, status));

  if (session === null) {
    return (
      <ArticoliHome
        progress={progress}
        onExit={onExit}
        exitLabel={exitLabel}
        onOpen={(strand) => setSession({ strand, mode: "card" })}
      />
    );
  }

  const back = () => setSession(null);

  if (session.mode === "card") {
    return <StrandCard strand={session.strand} onBack={back} onPractise={() => setSession({ ...session, mode: "drill" })} />;
  }

  if (session.mode === "drill") {
    return (
      <Drill
        strand={session.strand}
        onBack={back}
        onGrade={onGrade}
        onDone={(results) => setSession({ ...session, mode: "summary", results })}
      />
    );
  }

  return (
    <Summary
      strand={session.strand}
      results={session.results}
      onBack={back}
      onAgain={() => setSession({ strand: session.strand, mode: "drill" })}
    />
  );
}
