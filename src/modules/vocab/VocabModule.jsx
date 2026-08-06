import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ArrowLeft, RotateCw, Check, X, ChevronRight, Trophy, Layers, Flame } from "lucide-react";
import { TOKENS } from "../../shared/theme.js";
import { LEVELS } from "../../data/vocab.js";
import { loadProgress, saveProgress, touchStreak, markWord, wordKey, categoryKnownCount } from "../../shared/storage.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Postmark({ level, accentDeep }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2px solid ${accentDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        transform: "rotate(-8deg)",
        background: "rgba(255,255,255,0.5)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: accentDeep, letterSpacing: 0.5 }}>
        {level}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: accentDeep, letterSpacing: 1 }}>
        ITALIANO
      </span>
    </div>
  );
}

function PerforatedDivider() {
  return (
    <div
      style={{
        height: 1,
        backgroundImage: `repeating-linear-gradient(to right, ${TOKENS.line} 0, ${TOKENS.line} 6px, transparent 6px, transparent 12px)`,
        margin: "18px 0",
      }}
    />
  );
}

function VocabHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(LEVELS[0]);
  const { count: streakCount, lastDate } = progress.streak;
  const streakIsLive = streakCount > 0 && lastDate;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={onExit}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.inkSoft, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, padding: 0 }}
        >
          <ArrowLeft size={16} /> All modules
        </button>
        {streakIsLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: TOKENS.limoncelloDeep, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13 }}>
            <Flame size={15} /> {streakCount} day{streakCount === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriatic, marginBottom: 6, textTransform: "uppercase" }}>
          Parole in viaggio
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Vocabulary
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
        {LEVELS.map((lv) => {
          const active = lv.id === level.id;
          return (
            <button
              key={lv.id}
              onClick={() => setLevel(lv)}
              style={{
                border: `1.5px solid ${active ? lv.accentDeep : TOKENS.line}`,
                background: active ? lv.accent : "transparent",
                color: active ? lv.accentDeep : TOKENS.inkSoft,
                borderRadius: 999,
                padding: "9px 18px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {lv.label} · {lv.name}
            </button>
          );
        })}
      </div>

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 15, marginBottom: 28 }}>
        {level.tagline}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {level.categories.map((cat) => {
          const known = categoryKnownCount(progress, level, cat);
          return (
          <div
            key={cat.id}
            style={{
              background: TOKENS.card,
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 14,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Postmark level={level.label} accentDeep={level.accentDeep} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: TOKENS.ink, margin: "0 0 2px" }}>
                {cat.name}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                {known > 0 ? `${known} / ${cat.words.length} known` : `${cat.words.length} parole`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
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
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBar({ level, category, onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={onBack}
        aria-label="Back"
        style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.ink, display: "flex", padding: 6 }}
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: level.accentDeep, margin: 0, letterSpacing: 1 }}>
          {level.label} · {category.name.toUpperCase()}
        </p>
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
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} category={category} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 10 }}>
          <span>{index + 1} / {order.length}</span>
          <span>{stats.known} known</span>
        </div>

        <div
          onClick={() => setFlipped((f) => !f)}
          style={{
            background: TOKENS.card,
            border: `1px solid ${TOKENS.line}`,
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
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
                {word.it}
              </h2>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: level.accentDeep, margin: "0 0 10px" }}>
                  {word.en}
                </h2>
                <PerforatedDivider />
                <p style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: TOKENS.ink, margin: "0 0 4px" }}>
                  "{word.ex}"
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                  {word.exEn}
                </p>
              </>
            )}
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "14px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
            <RotateCw size={13} /> {flipped ? "Tap to see the word again" : "Tap to reveal translation"}
          </p>
        </div>

        {flipped && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => advance(false)}
              style={{
                flex: 1,
                border: `1.5px solid ${TOKENS.corallo}`,
                background: "transparent",
                color: TOKENS.corallo,
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
                border: "none",
                background: TOKENS.malachite,
                color: "#fff",
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
        missed={missed}
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} category={category} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 8px" }}>
          What does this mean?
        </p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: TOKENS.ink, margin: "0 0 22px" }}>
          {q.word.it}
        </h2>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isSelected = selected && selected.it === opt.it;
            const isAnswer = opt.it === q.word.it;
            let bg = TOKENS.card;
            let border = TOKENS.line;
            let color = TOKENS.ink;
            if (selected) {
              if (isAnswer) {
                bg = "#EAF3EE";
                border = TOKENS.malachite;
                color = TOKENS.malachite;
              } else if (isSelected) {
                bg = "#F8EAE7";
                border = TOKENS.corallo;
                color = TOKENS.corallo;
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
                {selected && isAnswer && <Check size={16} />}
                {selected && isSelected && !isAnswer && <X size={16} />}
              </button>
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
            {index + 1 >= questions.length ? "See results" : "Next word"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function SessionSummary({ level, title, primary, primaryLabel, secondary, secondaryLabel, missed, onBack }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: level.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: level.accentDeep,
          }}
        >
          <Trophy size={28} />
        </div>
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: TOKENS.ink, margin: "0 0 22px" }}>
        {title}
      </h2>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 22px", minWidth: 120 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: TOKENS.malachite, margin: 0 }}>{primary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>{primaryLabel}</p>
        </div>
        <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 22px", minWidth: 120 }}>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: TOKENS.corallo, margin: 0 }}>{secondary}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>{secondaryLabel}</p>
        </div>
      </div>

      {missed && missed.length > 0 && (
        <div style={{ textAlign: "left", background: TOKENS.card, border: `1px solid ${TOKENS.line}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: TOKENS.inkSoft, margin: "0 0 10px", letterSpacing: 1 }}>
            WORDS TO REVIEW
          </p>
          {missed.map((w) => (
            <p key={w.it} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.ink, margin: "0 0 6px" }}>
              <strong>{w.it}</strong> — {w.en}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        style={{
          border: "none",
          background: TOKENS.ink,
          color: TOKENS.paper,
          borderRadius: 10,
          padding: "13px 26px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Back to categories
      </button>
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
  const onMarkWord = (key, status) => setProgress((p) => markWord(p, key, status));
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
