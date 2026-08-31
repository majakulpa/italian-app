import React, { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Signpost, TriangleAlert } from "lucide-react";
import { TOKENS, SR_ONLY, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { MAPS, LANG_LABELS } from "../../data/mappe.js";
import { loadProgress, saveProgress, markWord, mappeKey, mapKnownCount } from "../../shared/storage.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import { judge, announce, drillSuffix, ATTEMPTS } from "./feedback.js";

// Le Mappe — the first of L'Officina's workbenches, and the app's first
// production exercise: every other mode picks from options, this one asks you
// to write the Italian.
//
// Built in the La Città design system (citySurface + CITY_ACCENTS) rather
// than the old postcard styling the four older module interiors still use.
// PLAN.md's open question 4 is exactly that seam, and its answer is that a
// screen migrates when it is built, never in a blanket pass — so this screen
// is new and the others are left alone.
//
// Colour carries meaning here the same way it does on the map: pink is the
// Polish road, blue is the English one, green is a rule paying off, red is a
// trap. Nothing is only colour — every one of those is labelled in words too.

const ROUTE_ACCENT = { pl: "bubble", en: "azzurro" };

// The document is English, so marking English text lang="en" would be noise
// on every second span. Polish and Italian have to say so (WCAG 3.1.2) —
// without it a screen reader reads `lekcja` and `lezione` with English
// phonetics, and this screen puts all three languages in one paragraph.
function langAttr(lang) {
  return lang === "en" ? undefined : lang;
}

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

// The rule itself: source endings on the left, the Italian one on the right.
// Built out of `routes` rather than a pre-written string so each suffix can
// carry its own language — `-cja` is Polish, `-tion` is English and `-zione`
// is Italian, all inside one heading.
//
// The `·` and `→` are drawn for the eye and spelled for the ear. An
// accessible name is computed by trimming each text node and joining what is
// left, so a separator that lives in the whitespace around a glyph vanishes
// and the heading announces as "-cja·-tion→-zione" — one run-on token. The
// words are what a screen reader actually gets.
function Glyph({ children, says }) {
  return (
    <>
      <span aria-hidden="true" style={{ opacity: 0.55 }}>
        {children}
      </span>
      {/* display:block, not inline: the name algorithm trims each text node
          and only inserts whitespace around block-level ones, so an inline
          " or " comes out welded to its neighbours. SR_ONLY is clipped to a
          1px box either way, so the display value costs nothing visually. */}
      <span style={{ ...SR_ONLY, display: "block" }}>{says}</span>
    </>
  );
}

function RuleHeadline({ map, size }) {
  return (
    <>
      {map.routes.flatMap((route, r) =>
        route.from.map((suffix, i) => (
          <React.Fragment key={`${route.lang}-${suffix}`}>
            {(r > 0 || i > 0) && <Glyph says=" or "> · </Glyph>}
            <span lang={langAttr(route.lang)}>{suffix}</span>
          </React.Fragment>
        )),
      )}
      <Glyph says=" becomes "> → </Glyph>
      <span lang="it" style={{ fontSize: size }}>
        {map.rule.to}
      </span>
    </>
  );
}

function PrimaryButton({ children, onClick, type = "button", style }) {
  return (
    <button
      type={type}
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

// ── The list of maps ─────────────────────────────────────────────────────

function MappeHome({ progress, onOpen, onExit }) {
  return (
    <Screen>
      <BackLink label="All modules" onClick={onExit} />

      <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
        <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
          <span lang="it">L&rsquo;Officina</span>
        </Eyebrow>
        <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
          Le Mappe
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55 }}>
          One ending, learned once, and a few hundred words arrive behind it. Each map is a rule — and the traps that rule
          sets for you, which are the price of using it.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {MAPS.map((map, i) => {
          const known = mapKnownCount(progress, map);
          const paint = CITY_ACCENTS[map.accent];

          return (
            <button
              key={map.id}
              onClick={() => onOpen(map)}
              style={{
                ...citySurface(map.accent),
                padding: "14px 16px 16px",
                textAlign: "left",
                cursor: "pointer",
                display: "block",
                width: "100%",
                font: "inherit",
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <Eyebrow style={{ opacity: 0.85, display: "block" }}>Mappa {String(i + 1).padStart(2, "0")}</Eyebrow>
                <Eyebrow
                  style={{
                    display: "block",
                    border: `2px solid ${paint.ink}`,
                    borderRadius: 999,
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {known} / {map.drills.length} drilled
                </Eyebrow>
              </span>

              <span
                style={{
                  display: "block",
                  fontFamily: SERIF,
                  fontSize: 21,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  margin: "8px 0 6px",
                }}
              >
                <RuleHeadline map={map} />
              </span>

              <span style={{ display: "block", fontFamily: SANS, fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>
                {map.reach}
              </span>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

// ── The header on a map's own screens ────────────────────────────────────

function MappaBar({ map, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <BackLink label="Le Mappe" onClick={onBack} />
      <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: TOKENS.inkSoft, margin: 0 }}>
        <span lang="it">Mappa</span> <span lang="it">{map.name}</span>
      </p>
    </div>
  );
}

// ── The teaching card (design screen 08) ─────────────────────────────────

function MapCard({ map, onBack, onPractise }) {
  return (
    <Screen>
      <MappaBar map={map} onBack={onBack} />

      <div style={{ ...citySurface(), padding: "6px 12px", display: "inline-block", marginBottom: 14 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>A rule, not a list</Eyebrow>
      </div>

      <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: TOKENS.ink, margin: "0 0 18px", lineHeight: 1.2 }}>
        <RuleHeadline map={map} size={34} />
      </h1>

      <div style={{ ...citySurface("pistachio"), padding: "14px 16px", marginBottom: 14 }}>
        <p style={{ fontFamily: SANS, fontSize: 14, margin: 0, lineHeight: 1.55 }}>{map.reach}</p>
      </div>

      {map.routes.map((route) => (
        <div key={route.lang} style={{ ...citySurface(ROUTE_ACCENT[route.lang]), padding: "14px 16px", marginBottom: 14 }}>
          <Eyebrow style={{ opacity: 0.85 }}>
            <span aria-hidden="true">{LANG_LABELS[route.lang].flag} </span>
            {LANG_LABELS[route.lang].name} — {route.heading}
          </Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 4 }}>
            {route.pairs.map((pair) => (
              <li key={pair.src} style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
                <span lang={langAttr(route.lang)}>{pair.src}</span>
                <Glyph says=" becomes "> → </Glyph>
                <b lang="it">{pair.it}</b>
                {pair.en && <span style={{ fontFamily: SANS, fontSize: 12, opacity: 0.8 }}> · {pair.en}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 14 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>What comes with it</Eyebrow>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8 }}>
          {map.notes.map((note) => (
            <li key={note} style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.ink, lineHeight: 1.55 }}>
              {note}
            </li>
          ))}
        </ul>
      </div>

      {map.traps.map((trap) => (
        <div key={trap.it} style={{ ...citySurface("tomato"), padding: "14px 16px", marginBottom: 14 }}>
          <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
            <TriangleAlert size={13} aria-hidden="true" /> A trap inside this rule
          </Eyebrow>
          <p style={{ fontFamily: SANS, fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>
            <b lang="it">{trap.it}</b> means {trap.means} — not{" "}
            <b lang={langAttr(trap.lookalikeLang)}>{trap.lookalike}</b>, which is {trap.lookalikeMeans}.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.92 }}>{trap.note}</p>
        </div>
      ))}

      <PrimaryButton onClick={onPractise}>
        Practise the rule <ArrowRight size={16} aria-hidden="true" />
      </PrimaryButton>
    </Screen>
  );
}

// ── The drill (design screen 09) ─────────────────────────────────────────

// Every visible sentence of the verdict, as markup. The plain-text twin that
// goes to the live region is `announce()` in feedback.js — the two say the
// same things, and the module test checks a screen reader isn't told less
// than the screen shows.
function Verdict({ map, drill, verdict }) {
  const accent = verdict.correct ? "pistachio" : verdict.kind === "trap" ? "tomato" : "lemon";

  return (
    <div style={{ ...citySurface(accent), padding: "14px 16px", marginTop: 16 }}>
      <Eyebrow style={{ opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
        <AnswerMark state={verdict.correct ? "correct" : "incorrect"} size={14} />
        {verdict.correct ? "Right" : "Not there yet"}
      </Eyebrow>

      <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, display: "grid", gap: 6, marginTop: 8 }}>
        {/* The rule is rebuilt from its two halves rather than printed from
            verdict.applied: the left half is Polish or English and the right
            half is Italian, and one string can only claim one language. */}
        {verdict.applied && (
          <p style={{ margin: 0 }}>
            You applied <b lang={langAttr(drill.srcLang)}>{drillSuffix(map, drill)}</b>
            <Glyph says=" to "> → </Glyph>
            <b lang="it">{map.rule.to}</b>.
          </p>
        )}

        {verdict.extras.map((extra) => (
          <p key={extra.from} style={{ margin: 0 }}>
            You also fixed <b lang={langAttr(drill.srcLang)}>{extra.from}</b>
            <Glyph says=" to "> → </Glyph>
            <b lang="it">{extra.to}</b>. {extra.note} Nobody taught you that part — you heard it.
          </p>
        ))}

        {verdict.kind === "trap" && (
          <p style={{ margin: 0 }}>
            <b lang="it">{verdict.trap.instead}</b> is exactly what the rule gives you, and it means {verdict.trap.means}.{" "}
            {verdict.trap.why}
          </p>
        )}

        {verdict.kind === "stem" && (
          <p style={{ margin: 0 }}>
            The ending is right — <b lang="it">{verdict.target}</b>. It is the word in front of it that slipped.
          </p>
        )}

        {verdict.kind === "ending" &&
          (verdict.target ? (
            <p style={{ margin: 0 }}>
              This map lands on <b lang="it">{verdict.target}</b>, and that answer does not.
            </p>
          ) : (
            <p style={{ margin: 0 }}>This is one of the items where the map does not reach — the answer is off the rule.</p>
          ))}

        {verdict.shared && (
          <p style={{ margin: 0 }}>
            You have <b lang="it">{verdict.shared}</b> right; it goes wrong after that.
          </p>
        )}

        {verdict.answer && (
          <p style={{ margin: 0 }}>
            {verdict.correct ? "Italian writes it " : "The answer is "}
            <b lang="it">{verdict.answer}</b>
            {drill.en ? ` — ${drill.en}` : ""}.
          </p>
        )}

        {!verdict.correct && !verdict.last && <p style={{ margin: 0 }}>Have another go — you get one more.</p>}
      </div>
    </div>
  );
}

function Drill({ map, onBack, onDone, onGrade }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [results, setResults] = useState([]);

  const drill = map.drills[index];
  // A wrong first attempt is not the end of the item: the learner gets the
  // located feedback and the input back. Only a right answer or a spent
  // second attempt closes it.
  const settled = verdict !== null && (verdict.correct || verdict.last);

  const advance = () => {
    if (index + 1 >= map.drills.length) {
      onDone(results);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setAttempt(1);
    setVerdict(null);
  };

  // One button, whatever state the item is in. Swapping a "Check" button for
  // a separate "Next" one would unmount the element the learner just pressed
  // and drop focus to the body, which is a keyboard user losing their place
  // every single answer.
  const submit = (event) => {
    event.preventDefault();
    if (settled) {
      advance();
      return;
    }
    if (input.trim() === "") return;

    const next = judge(map, drill, input, attempt);
    setVerdict(next);
    if (next.correct || next.last) {
      // Right first time is "known"; anything that needed a second look, or
      // ran out of looks, is "learning" — the same bar the grammar drill
      // uses, so a Mappe card and a Grammar card mean the same thing.
      onGrade(mappeKey(map, drill), next.correct && attempt === 1 ? "known" : "learning");
      setResults((r) => [...r, { drill, landed: next.correct }]);
    } else {
      setAttempt(attempt + 1);
      // Straight back into the field: the point of the second attempt is to
      // fix the word that is still sitting in it.
      inputRef.current.focus();
    }
  };

  const buttonLabel = () => {
    if (!settled) return "Check";
    return index + 1 >= map.drills.length ? "See how it went" : "Next";
  };

  return (
    <Screen>
      <MappaBar map={map} onBack={onBack} />

      {/* Mounted for the life of the screen and empty until there is a
          verdict — see LiveStatus.jsx. A region that appears with its text
          already inside may never be announced at all. */}
      <LiveStatus>{verdict ? announce(verdict) : ""}</LiveStatus>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          {index + 1} / {map.drills.length}
        </Eyebrow>
        <Eyebrow style={{ color: TOKENS.inkSoft }}>
          Attempt {attempt} of {ATTEMPTS}
        </Eyebrow>
      </div>

      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 12px" }}>
        Apply the rule — don&rsquo;t guess.
      </p>

      <div style={{ ...citySurface(ROUTE_ACCENT[drill.srcLang]), padding: "14px 16px", marginBottom: 14 }}>
        <Eyebrow style={{ opacity: 0.85 }}>
          <span aria-hidden="true">{LANG_LABELS[drill.srcLang].flag} </span>
          {LANG_LABELS[drill.srcLang].name}
        </Eyebrow>
        <p lang={langAttr(drill.srcLang)} style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, margin: "6px 0 0" }}>
          {drill.src}
        </p>
      </div>

      <form onSubmit={submit}>
        <label htmlFor={inputId} style={{ display: "block", fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, marginBottom: 6 }}>
          <span aria-hidden="true">{LANG_LABELS.it.flag} </span>Write it in Italian
        </label>
        <input
          id={inputId}
          ref={inputRef}
          lang="it"
          value={input}
          readOnly={settled}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={verdict !== null && !verdict.correct ? "true" : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: SERIF,
            fontSize: 20,
            fontWeight: 600,
            color: TOKENS.ink,
            background: TOKENS.card,
            border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
            borderRadius: CITY_RULES.radius,
            padding: "12px 14px",
          }}
        />

        {verdict && <Verdict map={map} drill={drill} verdict={verdict} />}

        <PrimaryButton type="submit" style={{ marginTop: 14 }}>
          {buttonLabel()} <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </form>
    </Screen>
  );
}

// ── The end of a run ─────────────────────────────────────────────────────

function Summary({ map, results, onBack, onAgain }) {
  const landed = results.filter((r) => r.landed);
  const slipped = results.filter((r) => !r.landed);

  return (
    <Screen>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Signpost size={30} color={TOKENS.ink} aria-hidden="true" />
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "8px 0 0" }}>
          <span lang="it">{map.name}</span> — that&rsquo;s the run
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ ...citySurface("pistachio"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{landed.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>landed</Eyebrow>
        </div>
        <div style={{ ...citySurface("lemon"), padding: "14px 16px", flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0 }}>{slipped.length}</p>
          <Eyebrow style={{ opacity: 0.9 }}>revealed</Eyebrow>
        </div>
      </div>

      {slipped.length > 0 && (
        <div style={{ ...citySurface(), padding: "14px 16px", marginBottom: 20 }}>
          <Eyebrow style={{ color: TOKENS.inkSoft }}>Worth another look</Eyebrow>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
            {slipped.map(({ drill }) => (
              <li key={drill.id} style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.ink, lineHeight: 1.45 }}>
                <b lang={langAttr(drill.srcLang)}>{drill.src}</b>
                <Glyph says=" becomes "> → </Glyph>
                <b lang="it">{drill.it}</b>
                {drill.en && <span style={{ color: TOKENS.inkSoft }}> · {drill.en}</span>}
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
          Back to the maps
        </PrimaryButton>
      </div>
    </Screen>
  );
}

// onExit returns to the city map (see src/App.jsx). Le Mappe is reached
// through the NavMenu for now: the `officina` district still routes to
// `vocab` until the L'Officina hub screen lands with the rest of that chunk.
export default function MappeModule({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const [session, setSession] = useState(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // markWord rather than reviewItem: Le Mappe is deliberately outside the
  // Leitner queue. The reasoning is written down beside `scheduled: false`
  // in shared/stats.js, because that flag is where anyone would look for it.
  const onGrade = (key, status) => setProgress((p) => markWord(p, key, status));

  if (session === null) {
    return <MappeHome progress={progress} onExit={onExit} onOpen={(map) => setSession({ map, mode: "card" })} />;
  }

  const back = () => setSession(null);

  if (session.mode === "card") {
    return <MapCard map={session.map} onBack={back} onPractise={() => setSession({ ...session, mode: "drill" })} />;
  }

  if (session.mode === "drill") {
    return (
      <Drill
        map={session.map}
        onBack={back}
        onGrade={onGrade}
        onDone={(results) => setSession({ ...session, mode: "summary", results })}
      />
    );
  }

  return (
    <Summary
      map={session.map}
      results={session.results}
      onBack={back}
      onAgain={() => setSession({ map: session.map, mode: "drill" })}
    />
  );
}
