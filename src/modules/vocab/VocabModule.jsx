import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ArrowLeft, RotateCw, Check, X, ChevronRight, Layers, Headphones, Volume2 } from "lucide-react";
import { TOKENS, tint } from "../../shared/theme.js";
import { LEVELS } from "../../data/vocab.js";
import { loadProgress, saveProgress, touchStreak, wordKey, categoryKnownCount } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";
import { shuffle } from "../../shared/shuffle.js";
import { speakItalian, isSpeechSupported } from "../../shared/speech.js";
import SpeakButton from "../../shared/SpeakButton.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import AnswerStatus from "../../shared/AnswerStatus.jsx";
import Postmark from "../../shared/Postmark.jsx";
import PerforatedDivider from "../../shared/PerforatedDivider.jsx";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import LevelPicker from "../../shared/LevelPicker.jsx";
import TicketCard from "../../shared/TicketCard.jsx";
import StreakChip from "../../shared/StreakChip.jsx";

function VocabHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(LEVELS[0]);

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
          Parole in viaggio
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Vocabulary
        </h1>
      </div>

      <LevelPicker levels={LEVELS} active={level} onSelect={setLevel} />

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 15, marginBottom: 28 }}>
        {level.tagline}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {level.categories.map((cat) => {
          const known = categoryKnownCount(progress, level, cat);
          return (
            <TicketCard
              key={cat.id}
              level={level}
              title={cat.name}
              subtitle={known > 0 ? `${known} / ${cat.words.length} known` : `${cat.words.length} parole`}
            >
              <button
                onClick={() => onPick(level, cat, "flashcards")}
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
                <Layers size={15} /> Cards
              </button>
              {isSpeechSupported() && (
                <button
                  onClick={() => onPick(level, cat, "listening")}
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
                  <Headphones size={15} /> Listen
                </button>
              )}
              <button
                onClick={() => onPick(level, cat, "quiz")}
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
                Quiz <ChevronRight size={15} />
              </button>
            </TicketCard>
          );
        })}
      </div>
    </div>
  );
}

function Flashcards({ level, category, onBack, onMarkWord, onStudySession }) {
  const order = useMemo(() => shuffle(category.words), [category]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, learning: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    onStudySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = order[index];

  const advance = useCallback(
    (knew) => {
      onMarkWord(wordKey(level, category, word), knew ? "known" : "learning");
      setStats((s) => (knew ? { ...s, known: s.known + 1 } : { ...s, learning: s.learning + 1 }));
      if (index + 1 >= order.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [index, order.length, word, level, category, onMarkWord]
  );

  if (done) {
    return (
      <SessionSummary
        level={level}
        title="Deck complete"
        primary={stats.known}
        primaryLabel="marked known"
        secondary={stats.learning}
        secondaryLabel="still learning"
        backLabel="Back to categories"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={category.name} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 10 }}>
          <span>{index + 1} / {order.length}</span>
          <span>{stats.known} known</span>
        </div>

        <div
          onClick={() => setFlipped((f) => !f)}
          style={{
            background: TOKENS.card,
            border: `1px solid ${TOKENS.controlLine}`,
            borderRadius: 18,
            padding: "32px 26px 22px",
            cursor: "pointer",
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <Postmark level={level.label} accentDeep={level.accentDeep} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 50 }}>
            {!flipped ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
                  {word.it}
                </h2>
                <SpeakButton text={word.it} color={level.accentDeep} size={20} />
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: level.accentDeep, margin: "0 0 10px" }}>
                  {word.en}
                </h2>
                <PerforatedDivider />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p lang="it" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: TOKENS.ink, margin: "0 0 4px" }}>
                    "{word.ex}"
                  </p>
                  <SpeakButton text={word.ex} color={TOKENS.inkSoft} size={15} style={{ marginBottom: 4 }} />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                  {word.exEn}
                </p>
              </>
            )}
          </div>

          {/* The card flips on a tap anywhere, but that tap target is a
              plain div — this is the same action as a real button, so it can
              be reached and fired from the keyboard too. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped((f) => !f);
            }}
            aria-expanded={flipped}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: TOKENS.inkSoft,
              margin: "14px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <RotateCw size={13} /> {flipped ? "Tap to see the word again" : "Tap to reveal translation"}
          </button>
        </div>

        {flipped && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => advance(false)}
              style={{
                flex: 1,
                border: `1.5px solid ${TOKENS.corolloDeep}`,
                background: "transparent",
                color: TOKENS.corolloDeep,
                borderRadius: 10,
                padding: "12px 0",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <X size={16} /> Still learning
            </button>
            <button
              onClick={() => advance(true)}
              style={{
                flex: 1,
                border: `1.5px solid ${TOKENS.malachiteDeep}`,
                background: tint(TOKENS.malachite, 14),
                color: TOKENS.malachiteDeep,
                borderRadius: 10,
                padding: "12px 0",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Check size={16} /> I knew it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildQuizQuestions(category) {
  const all = category.words;
  return shuffle(all).map((w) => {
    const distractors = shuffle(all.filter((x) => x.it !== w.it)).slice(0, 3);
    const options = shuffle([w, ...distractors]);
    return { word: w, options };
  });
}

function Quiz({ level, category, onBack, onMarkWord, onStudySession }) {
  const questions = useMemo(() => buildQuizQuestions(category), [category]);
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
    const isCorrect = opt.it === q.word.it;
    onMarkWord(wordKey(level, category, q.word), isCorrect ? "known" : "learning");
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissed((m) => [...m, q.word]);
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
        title="Quiz complete"
        primary={correctCount}
        primaryLabel={`correct out of ${questions.length}`}
        secondary={missed.length}
        secondaryLabel="to review"
        missed={missed.map((w) => ({ id: w.it, primary: w.it, secondary: w.en }))}
        missedLang="it"
        missedHeading="WORDS TO REVIEW"
        backLabel="Back to categories"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={category.name} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 8px" }}>
          What does this mean?
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <h2 lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
            {q.word.it}
          </h2>
          <SpeakButton text={q.word.it} color={level.accentDeep} size={19} />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isSelected = selected && selected.it === opt.it;
            const isAnswer = opt.it === q.word.it;
            let bg = TOKENS.card;
            let border = TOKENS.controlLine;
            let color = TOKENS.ink;
            if (selected) {
              if (isAnswer) {
                bg = tint(TOKENS.malachite, 12);
                border = TOKENS.malachiteDeep;
                color = TOKENS.malachiteDeep;
              } else if (isSelected) {
                bg = tint(TOKENS.corallo, 12);
                border = TOKENS.corolloDeep;
                color = TOKENS.corolloDeep;
              }
            }
            return (
              <button
                key={opt.it}
                onClick={() => choose(opt)}
                style={{
                  textAlign: "left",
                  border: `1.5px solid ${border}`,
                  background: bg,
                  color,
                  borderRadius: 10,
                  padding: "13px 16px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: selected ? "default" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {opt.en}
                {selected && isAnswer && <AnswerMark state="correct" />}
                {selected && isSelected && !isAnswer && <AnswerMark state="incorrect" />}
              </button>
            );
          })}
        </div>

        <AnswerStatus correct={selected === null ? null : selected.it === q.word.it} answer={q.word.en} />

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
            {index + 1 >= questions.length ? "See results" : "Next word"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ListeningQuiz({ level, category, onBack, onMarkWord, onStudySession }) {
  const questions = useMemo(() => buildQuizQuestions(category), [category]);
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

  // Auto-play each new word as soon as its question appears.
  useEffect(() => {
    if (!done) speakItalian(q.word.it);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done]);

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt.it === q.word.it;
    onMarkWord(wordKey(level, category, q.word), isCorrect ? "known" : "learning");
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissed((m) => [...m, q.word]);
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
        title="Listening complete"
        primary={correctCount}
        primaryLabel={`correct out of ${questions.length}`}
        secondary={missed.length}
        secondaryLabel="to review"
        missed={missed.map((w) => ({ id: w.it, primary: w.it, secondary: w.en }))}
        missedLang="it"
        missedHeading="WORDS TO REVIEW"
        backLabel="Back to categories"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={category.name} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <p style={{ textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 16px" }}>
          Listen, then choose what it means
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button
            onClick={() => speakItalian(q.word.it)}
            aria-label="Play again"
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              border: `2px solid ${level.accentDeep}`,
              background: TOKENS.card,
              color: level.accentDeep,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Volume2 size={32} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "0 0 22px" }}>
          Tap to hear it again
        </p>

        {selected && (
          <p lang="it" style={{ textAlign: "center", fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 18, color: TOKENS.ink, margin: "-8px 0 20px" }}>
            {q.word.it}
          </p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isSelected = selected && selected.it === opt.it;
            const isAnswer = opt.it === q.word.it;
            let bg = TOKENS.card;
            let border = TOKENS.controlLine;
            let color = TOKENS.ink;
            if (selected) {
              if (isAnswer) {
                bg = tint(TOKENS.malachite, 12);
                border = TOKENS.malachiteDeep;
                color = TOKENS.malachiteDeep;
              } else if (isSelected) {
                bg = tint(TOKENS.corallo, 12);
                border = TOKENS.corolloDeep;
                color = TOKENS.corolloDeep;
              }
            }
            return (
              <button
                key={opt.it}
                onClick={() => choose(opt)}
                style={{
                  textAlign: "left",
                  border: `1.5px solid ${border}`,
                  background: bg,
                  color,
                  borderRadius: 10,
                  padding: "13px 16px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: selected ? "default" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {opt.en}
                {selected && isAnswer && <AnswerMark state="correct" />}
                {selected && isSelected && !isAnswer && <AnswerMark state="incorrect" />}
              </button>
            );
          })}
        </div>

        <AnswerStatus correct={selected === null ? null : selected.it === q.word.it} answer={q.word.en} />

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
            {index + 1 >= questions.length ? "See results" : "Next word"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// onExit returns to the app's module menu (see src/App.jsx)
export default function VocabModule({ onExit }) {
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const onPick = (level, category, mode) => setSession({ level, category, mode });
  const onBack = () => setSession(null);
  // Goes through reviewItem rather than markWord so every answer also moves
  // the word's Leitner box — ordinary study is what feeds the review queue.
  const onMarkWord = (key, status) => setProgress((p) => reviewItem(p, key, status === "known"));
  const onStudySession = () => setProgress((p) => touchStreak(p));

  if (!session) return <VocabHome onPick={onPick} onExit={onExit} progress={progress} />;
  if (session.mode === "flashcards") {
    return (
      <Flashcards
        level={session.level}
        category={session.category}
        onBack={onBack}
        onMarkWord={onMarkWord}
        onStudySession={onStudySession}
      />
    );
  }
  if (session.mode === "listening") {
    return (
      <ListeningQuiz
        level={session.level}
        category={session.category}
        onBack={onBack}
        onMarkWord={onMarkWord}
        onStudySession={onStudySession}
      />
    );
  }
  return (
    <Quiz
      level={session.level}
      category={session.category}
      onBack={onBack}
      onMarkWord={onMarkWord}
      onStudySession={onStudySession}
    />
  );
}
