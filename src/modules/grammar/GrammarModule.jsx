import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { optionPaint } from "./optionPaint.js";
import { GRAMMAR_LEVELS, PRONOUN_GLOSS } from "../../data/grammar.js";
import { loadProgress, saveProgress, drillKey, topicKnownCount, markStageShown } from "../../shared/storage.js";
import { reviewItem, deferItem } from "../../shared/srs.js";
import { aboveStage, shownNotCorrected } from "../../shared/stage.js";
import StageNote from "../../shared/StageNote.jsx";
import { shuffle } from "../../shared/shuffle.js";
import PerforatedDivider from "../../shared/PerforatedDivider.jsx";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import AnswerStatus from "../../shared/AnswerStatus.jsx";
import LevelPicker from "../../shared/LevelPicker.jsx";
import TicketCard from "../../shared/TicketCard.jsx";

// A header or cell is either a plain string or { it, en }; subject pronouns
// stay plain strings and pick their English up from PRONOUN_GLOSS, so the
// data doesn't repeat io/tu/lui/... in every conjugation table. Returns the
// Italian plus the English to print under it, if there is one.
function readCell(cell) {
  if (typeof cell === "object") return { it: cell.it, en: cell.en };
  return { it: cell, en: PRONOUN_GLOSS[cell] };
}

// The English sits under the Italian in small type — enough for a beginner
// to decode "parlare" or "voi" without it competing with the conjugation
// itself, which is what the table is actually teaching.
function CellGloss({ en }) {
  if (!en) return null;
  return (
    <span
      style={{
        display: "block",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        fontSize: 11,
        letterSpacing: 0,
        color: TOKENS.inkSoft,
        opacity: 0.85,
        marginTop: 1,
      }}
    >
      {en}
    </span>
  );
}

function ExplanationTable({ table }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 18 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 320 }}>
        <thead>
          <tr>
            {table.headers.map((header, i) => {
              const { it, en } = readCell(header);
              return (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: 0.5,
                    color: TOKENS.inkSoft,
                    borderBottom: `1.5px solid ${TOKENS.line}`,
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                    verticalAlign: "bottom",
                  }}
                >
                  <span lang="it">{it}</span>
                  <CellGloss en={en} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {
                const { it, en } = readCell(cell);
                return (
                  <td
                    key={j}
                    style={{
                      fontFamily: j === 0 ? "'Inter', sans-serif" : "'Fraunces', serif",
                      fontWeight: j === 0 ? 500 : 600,
                      fontSize: j === 0 ? 13 : 15,
                      color: j === 0 ? TOKENS.inkSoft : TOKENS.ink,
                      borderBottom: `1px solid ${TOKENS.line}`,
                      padding: "7px 10px",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    <span lang="it">{it}</span>
                    <CellGloss en={en} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrammarHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(GRAMMAR_LEVELS[0]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "68px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={onExit}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.inkSoft, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, padding: 0 }}
        >
          <ArrowLeft size={16} /> All modules
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p lang="it" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriaticDeep, marginBottom: 6, textTransform: "uppercase" }}>
          Regole in tasca
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Grammar
        </h1>
      </div>

      <LevelPicker levels={GRAMMAR_LEVELS} active={level} onSelect={setLevel} />

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 15, marginBottom: 28 }}>
        {level.tagline}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {level.topics.map((topic) => {
          const known = topicKnownCount(progress, level, topic);
          return (
            // The topic name is Italian ("Presente: verbi in -ARE") and says
            // so; the subtitle is not. The taglines are English sentences
            // that happen to quote Italian inside them ("Mi alzo, ti svegli
            // — describing your day"), and `lang` is per-element: marking
            // the whole string Italian would have a screen reader read the
            // English half in an Italian voice, which is worse than leaving
            // it. Splitting those sentences is a data change, not a markup
            // one, so it is left alone here.
            <TicketCard
              key={topic.id}
              level={level}
              title={<span lang="it">{topic.name}</span>}
              subtitle={known > 0 ? `${known} / ${topic.drills.length} mastered` : topic.tagline}
            >
              <button
                onClick={() => onPick(level, topic, "lesson")}
                style={{
                  border: `1.5px solid ${TOKENS.ink}`,
                  background: "transparent",
                  color: TOKENS.ink,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BookOpen size={15} /> Learn
              </button>
              <button
                onClick={() => onPick(level, topic, "drill")}
                style={{
                  border: "none",
                  background: TOKENS.ink,
                  color: TOKENS.paper,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Drill <ChevronRight size={15} />
              </button>
            </TicketCard>
          );
        })}
      </div>
    </div>
  );
}

function Lesson({ level, topic, onBack, onPick }) {
  const { explanation } = topic;

  return (
    <div>
      <TopBar level={level} label={topic.name} onBack={onBack} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px" }}>
        <h2 lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: TOKENS.ink, margin: "0 0 12px" }}>
          {topic.name}
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.6, margin: "0 0 20px" }}>
          {explanation.summary}
        </p>

        {explanation.table && <ExplanationTable table={explanation.table} />}

        {explanation.points && explanation.points.length > 0 && (
          <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
            {explanation.points.map((point, i) => (
              <li key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.ink, marginBottom: 8, lineHeight: 1.5 }}>
                {point}
              </li>
            ))}
          </ul>
        )}

        {explanation.examples && explanation.examples.length > 0 && (
          <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
            {explanation.examples.map((ex, i) => (
              <div key={i} style={{ marginBottom: i === explanation.examples.length - 1 ? 0 : 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p lang="it" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: TOKENS.ink, margin: 0 }}>
                    "{ex.it}"
                  </p>
                  <SpeakButton text={ex.it} color={level.accentDeep} size={15} />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "2px 0 0" }}>
                  {ex.en}
                </p>
                {i !== explanation.examples.length - 1 && <PerforatedDivider />}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onPick(level, topic, "drill")}
          style={{
            width: "100%",
            border: "none",
            background: TOKENS.ink,
            color: TOKENS.paper,
            borderRadius: 10,
            padding: "13px 0",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          Start drill <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function buildDrillQuestions(topic) {
  return shuffle(topic.drills).map((item) => ({
    item,
    options: shuffle(item.options),
  }));
}

function fillBlank(item) {
  return item.prompt.replace("___", item.answer);
}

function Drill({ level, topic, progress, onBack, onMarkDrill, onDefer }) {
  const questions = useMemo(() => buildDrillQuestions(topic), [topic]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  // The current item's stage gate when a wrong pick landed above the
  // learner's stage (shared/stage.js), else null; and how many did.
  const [gate, setGate] = useState(null);
  const [deferred, setDeferred] = useState(0);
  const [done, setDone] = useState(false);
  const promptRef = useRef(null);

  const q = questions[index];

  // Advancing unmounts the "Next" button the learner just pressed, and
  // nothing else takes its place, so focus falls back to <body>: a keyboard
  // learner re-tabs from the top of the document for every question and a
  // screen-reader user is told nothing about the item that replaced the one
  // they answered. The newer benches (review/ReviewModule.jsx,
  // mappe/MappeModule.jsx, riserva/DrillRound.jsx) avoid it by keeping one
  // button mounted in both states, which works there because the answer is
  // typed and "Check" and "Next" are the same control. Here the answer *is*
  // a button, and a permanently mounted "Next" would either be dead before
  // an answer or let the learner skip the question — so this screen takes
  // the other half of the same pattern, the one riserva/RiservaModule.jsx
  // uses when its control disappears: move focus deliberately to the
  // nearest thing that is still there. That is the new prompt, which is
  // also the sentence a screen reader needs to hear. `index` only ever
  // moves forward and only `next` moves it, so index > 0 means the learner
  // advanced rather than opened the drill.
  useEffect(() => {
    if (index > 0) promptRef.current.focus();
  }, [index]);

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    const key = drillKey(level, topic, q.item);
    if (opt === q.item.answer) {
      // Promotes exactly as it always has. A pick out of four is recognition,
      // so it is no evidence of a stage and writes no marker.
      onMarkDrill(key, "known");
      setCorrectCount((c) => c + 1);
      return;
    }

    // A wrong pick above the learner's stage is not marked wrong: it is
    // deferred rather than demoted, it is not counted against the score and
    // it is not listed to review. The gate is read at the moment of the pick,
    // from progress as it stands.
    const above = aboveStage(progress, topic, q.item);
    if (above) {
      setGate(above);
      setDeferred((d) => d + 1);
      onDefer(key);
      return;
    }
    onMarkDrill(key, "learning");
    setMissed((m) => [...m, q.item]);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setGate(null);
    }
  };

  if (done) {
    return (
      <SessionSummary
        level={level}
        title="Drill complete"
        primary={correctCount}
        primaryLabel={`correct out of ${questions.length - deferred}`}
        secondary={missed.length}
        secondaryLabel="to review"
        missed={missed.map((item) => ({ id: item.id, primary: fillBlank(item), secondary: item.hint }))}
        missedLang="it"
        missedHeading="TO REVIEW"
        note={deferred > 0 ? shownNotCorrected(deferred) : undefined}
        backLabel="Back to topics"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={topic.name} onBack={onBack} />
      {/* La Città, like the chrome around it and La Piazza, which asks these
          same items typed: `citta` is what gives every control here the grape
          focus ring. */}
      <div className="citta" style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 8px" }}>
          Complete the sentence
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {/* tabIndex={-1} makes the prompt focusable without putting it in
              the tab order: it is the target of the focus move above, not a
              stop a learner tabs through. The browser's own focus ring is
              left in place — this is where the keyboard user now is. */}
          <h2
            ref={promptRef}
            tabIndex={-1}
            lang="it"
            style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: TOKENS.ink, margin: 0, letterSpacing: 0.2 }}
          >
            {q.item.prompt}
          </h2>
          {/* The speaker here reads the sentence with the gap filled in, so
              it cannot be offered before the item is answered: tapping it
              would simply say the answer, and SpeakButton's accessible name
              is `Pronounce "<text>"`, which hands the answer to a screen
              reader on tab-focus alone — before an answer is even spent.
              Speaking the gapped prompt instead is no fix either: speech
              synthesis reads "___" as a stumble or as nothing, and a
              sentence with a hole in it is not a pronunciation model. So the
              control waits for the answer, which is also when hearing the
              whole sentence is worth most. The per-option speakers stay
              available throughout — they only ever say what is already on
              screen. */}
          {selected && <SpeakButton text={fillBlank(q.item)} color={level.accentDeep} size={17} />}
        </div>
        {/* The English is shown outright rather than behind a tap-to-reveal:
            here the exercise is the conjugation, not reading comprehension,
            and the hint already names the person, so the translation gives
            nothing away. (Stories/conversations hide it — there the reading
            IS the exercise.) */}
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 6px" }}>
          {q.item.en}
        </p>
        {/* Unmarked on purpose: the hint is one string mixing both languages
            ("parlare (to speak) — io"), so neither `lang` value is true of
            it. Same case as the taglines on the home screen. */}
        <p style={{ fontFamily: "'Inter', sans-serif", fontStyle: "italic", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 22px" }}>
          {q.item.hint}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isAnswer = opt === q.item.answer;
            // An above-stage pick is not judged, so it stays idle: no tomato,
            // no cross. See optionPaint.js for the three states.
            const state = !selected ? "idle" : isAnswer ? "answer" : selected === opt && !gate ? "wrong" : "idle";
            const paint = optionPaint(state);
            // The option is a real <button> rather than a div with
            // role="button", and the speaker sits beside it rather than
            // inside it: a control nested in a control is announced
            // unpredictably, and Enter/Space come free on the real thing.
            //
            // The button is the painted tile and the speaker sits outside it
            // on the page, rather than both inside one painted row. Inside a
            // row, each control's grape focus ring would land on the fill,
            // and dark grape on pistachio or tomato is under 2:1. Out here
            // both rings land on paper, which theme.test.js holds at 3:1.
            return (
              <div key={opt} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => choose(opt)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "left",
                    background: paint.background,
                    color: paint.color,
                    border: paint.border,
                    borderRadius: CITY_RULES.radius,
                    boxShadow: state === "idle" ? "none" : `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
                    padding: "12px 14px 12px 16px",
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: selected ? "default" : "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span lang="it" style={{ color: paint.color }}>
                    {opt}
                  </span>
                  {state === "answer" && <AnswerMark state="correct" style={{ color: paint.color }} />}
                  {state === "wrong" && <AnswerMark state="incorrect" style={{ color: paint.color }} />}
                </button>
                <SpeakButton text={opt} color={TOKENS.ink} size={15} />
              </div>
            );
          })}
        </div>

        {/* Above the learner's stage the pick is not judged, so what replaces
            "Not quite" says why and gives the form — on screen here, and
            spoken through the same live region below. A neutral city card,
            not a lemon or tomato one: those are the colours of a miss. */}
        {gate && (
          <div style={{ ...citySurface(), padding: "14px 16px", marginTop: 16, fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.55 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: TOKENS.inkSoft,
              }}
            >
              Not corrected yet
            </p>
            <p style={{ margin: "0 0 6px", color: TOKENS.ink }}>
              <StageNote gate={gate} />
            </p>
            <p style={{ margin: 0, color: TOKENS.ink }}>
              The form is <b lang="it">{q.item.answer}</b>.
            </p>
          </div>
        )}

        {/* The spoken feedback is an English sentence with one Italian word
            dropped into it ("Not quite. The answer is parlo."), so the answer
            needs marking without marking the English around it. AnswerStatus
            renders it as its own element now and takes the language from
            here, because the answer is not Italian everywhere — the
            vocabulary quiz's answer is an English gloss. */}
        <AnswerStatus
          correct={selected === null ? null : selected === q.item.answer}
          answer={q.item.answer}
          answerLang="it"
          gate={gate}
        />

        {selected && (
          <button
            onClick={next}
            style={{
              marginTop: 20,
              width: "100%",
              border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
              boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
              background: CITY_ACCENTS.pistachio.fill,
              color: CITY_ACCENTS.pistachio.ink,
              borderRadius: CITY_RULES.radius,
              padding: "13px 0",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {index + 1 >= questions.length ? "See results" : "Next"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// onExit returns to the app's module menu (see src/App.jsx)
export default function GrammarModule({ onExit }) {
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const onPick = (level, topic, mode) => setSession({ level, topic, mode });
  const onBack = () => setSession(null);
  // Goes through reviewItem rather than markWord so every answer also moves
  // the drill's Leitner box — ordinary study is what feeds the review queue.
  //
  // A wrong pick at or below the learner's stage also marks the item "shown":
  // the drill has just painted the right option, so the next clean typed
  // answer to it in La Piazza is a copy of that, not evidence.
  const onMarkDrill = (key, status) =>
    setProgress((p) => (status === "known" ? reviewItem(p, key, true) : markStageShown(reviewItem(p, key, false), key)));
  // Above the learner's stage: deferred, never demoted. deferItem marks the
  // item "shown" itself.
  const onDefer = (key) => setProgress((p) => deferItem(p, key));

  if (!session) return <GrammarHome onPick={onPick} onExit={onExit} progress={progress} />;
  if (session.mode === "lesson") {
    return (
      <Lesson
        level={session.level}
        topic={session.topic}
        onBack={onBack}
        onPick={onPick}
      />
    );
  }
  return (
    <Drill
      level={session.level}
      topic={session.topic}
      progress={progress}
      onBack={onBack}
      onMarkDrill={onMarkDrill}
      onDefer={onDefer}
    />
  );
}
