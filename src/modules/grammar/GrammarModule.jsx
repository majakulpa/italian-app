import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Check, X } from "lucide-react";
import { TOKENS, tint } from "../../shared/theme.js";
import { GRAMMAR_LEVELS, PRONOUN_GLOSS } from "../../data/grammar.js";
import { loadProgress, saveProgress, touchStreak, markWord, drillKey, topicKnownCount } from "../../shared/storage.js";
import { shuffle } from "../../shared/shuffle.js";
import PerforatedDivider from "../../shared/PerforatedDivider.jsx";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import LevelPicker from "../../shared/LevelPicker.jsx";
import TicketCard from "../../shared/TicketCard.jsx";
import StreakChip from "../../shared/StreakChip.jsx";

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
                  {it}
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
                    {it}
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
        <StreakChip progress={progress} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriaticDeep, marginBottom: 6, textTransform: "uppercase" }}>
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
            <TicketCard
              key={topic.id}
              level={level}
              title={topic.name}
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

function Lesson({ level, topic, onBack, onPick, onStudySession }) {
  useEffect(() => {
    onStudySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { explanation } = topic;

  return (
    <div>
      <TopBar level={level} label={topic.name} onBack={onBack} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: TOKENS.ink, margin: "0 0 12px" }}>
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
                  <p style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: TOKENS.ink, margin: 0 }}>
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

function Drill({ level, topic, onBack, onMarkDrill, onStudySession }) {
  const questions = useMemo(() => buildDrillQuestions(topic), [topic]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onStudySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === q.item.answer;
    onMarkDrill(drillKey(level, topic, q.item), isCorrect ? "known" : "learning");
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissed((m) => [...m, q.item]);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (done) {
    return (
      <SessionSummary
        level={level}
        title="Drill complete"
        primary={correctCount}
        primaryLabel={`correct out of ${questions.length}`}
        secondary={missed.length}
        secondaryLabel="to review"
        missed={missed.map((item) => ({ id: item.id, primary: fillBlank(item), secondary: item.hint }))}
        missedHeading="TO REVIEW"
        backLabel="Back to topics"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={topic.name} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 8px" }}>
          Complete the sentence
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: TOKENS.ink, margin: 0, letterSpacing: 0.2 }}>
            {q.item.prompt}
          </h2>
          <SpeakButton text={fillBlank(q.item)} color={level.accentDeep} size={17} />
        </div>
        {/* The English is shown outright rather than behind a tap-to-reveal:
            here the exercise is the conjugation, not reading comprehension,
            and the hint already names the person, so the translation gives
            nothing away. (Stories/conversations hide it — there the reading
            IS the exercise.) */}
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 6px" }}>
          {q.item.en}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontStyle: "italic", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 22px" }}>
          {q.item.hint}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const isAnswer = opt === q.item.answer;
            let bg = TOKENS.card;
            let border = TOKENS.line;
            let color = TOKENS.ink;
            if (selected) {
              if (isAnswer) {
                bg = tint(TOKENS.malachite, 12);
                border = TOKENS.malachite;
                color = TOKENS.malachiteDeep;
              } else if (isSelected) {
                bg = tint(TOKENS.corallo, 12);
                border = TOKENS.corallo;
                color = TOKENS.corolloDeep;
              }
            }
            return (
              <div
                key={opt}
                role="button"
                tabIndex={0}
                onClick={() => choose(opt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") choose(opt);
                }}
                style={{
                  textAlign: "left",
                  border: `1.5px solid ${border}`,
                  background: bg,
                  color,
                  borderRadius: 10,
                  padding: "13px 16px",
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: selected ? "default" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {opt}
                  <SpeakButton text={opt} color={color} size={15} />
                </span>
                {selected && isAnswer && <Check size={16} />}
                {selected && isSelected && !isAnswer && <X size={16} />}
              </div>
            );
          })}
        </div>

        {selected && (
          <button
            onClick={next}
            style={{
              marginTop: 20,
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
  const onMarkDrill = (key, status) => setProgress((p) => markWord(p, key, status));
  const onStudySession = () => setProgress((p) => touchStreak(p));

  if (!session) return <GrammarHome onPick={onPick} onExit={onExit} progress={progress} />;
  if (session.mode === "lesson") {
    return (
      <Lesson
        level={session.level}
        topic={session.topic}
        onBack={onBack}
        onPick={onPick}
        onStudySession={onStudySession}
      />
    );
  }
  return (
    <Drill
      level={session.level}
      topic={session.topic}
      onBack={onBack}
      onMarkDrill={onMarkDrill}
      onStudySession={onStudySession}
    />
  );
}
