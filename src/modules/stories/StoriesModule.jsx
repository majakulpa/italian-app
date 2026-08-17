import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronRight, Check, Clock, X } from "lucide-react";
import { TOKENS, tint } from "../../shared/theme.js";
import { STORY_LEVELS } from "../../data/stories.js";
import { loadProgress, saveProgress, touchStreak, markWord, storyKey, isStoryDone } from "../../shared/storage.js";
import { shuffle } from "../../shared/shuffle.js";
import { tokenize, splitToken, lookupGloss } from "./gloss.js";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import LevelPicker from "../../shared/LevelPicker.jsx";
import TicketCard from "../../shared/TicketCard.jsx";
import TranslationToggle from "../../shared/TranslationToggle.jsx";
import StreakChip from "../../shared/StreakChip.jsx";

function StoriesHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(STORY_LEVELS[0]);

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
          Quattro pagine
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Stories
        </h1>
      </div>

      <LevelPicker levels={STORY_LEVELS} active={level} onSelect={setLevel} />

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 15, marginBottom: 28 }}>
        {level.tagline}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {level.stories.map((story) => {
          const done = isStoryDone(progress, level, story);
          return (
            <TicketCard
              key={story.id}
              level={level}
              title={story.title}
              subtitle={
                <>
                  {done && <Check size={13} color={TOKENS.malachiteDeep} />}
                  {done ? "Completed" : story.tagline}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: TOKENS.inkSoft, whiteSpace: "nowrap" }}>
                    <Clock size={11} /> {story.minutes} min
                  </span>
                </>
              }
            >
              <button
                onClick={() => onPick(level, story)}
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
                  whiteSpace: "nowrap",
                }}
              >
                {done ? "Read again" : "Read"} <ChevronRight size={15} />
              </button>
            </TicketCard>
          );
        })}
      </div>

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 13, marginTop: 24, lineHeight: 1.5 }}>
        Underlined words are glossed — tap one to see what it means.
      </p>
    </div>
  );
}

// A story paragraph, with every glossed word turned into its own button.
// Non-glossed pieces are plain text, so the paragraph still reads (and
// wraps, and gets selected) as ordinary prose.
function Paragraph({ paragraph, level, onWordTap }) {
  const pieces = useMemo(() => tokenize(paragraph.it), [paragraph.it]);

  return (
    <div style={{ marginBottom: 26 }}>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 18, lineHeight: 1.75, color: TOKENS.ink, margin: 0 }}>
        {pieces.map((piece, i) => {
          const entry = lookupGloss(paragraph.gloss, piece);
          if (!entry) return <React.Fragment key={i}>{piece}</React.Fragment>;
          // Only the word itself is underlined and tappable — the comma or
          // quote mark around it stays plain text.
          const { before, core, after } = splitToken(piece);
          return (
            <React.Fragment key={i}>
              {before}
              <button
                onClick={() => onWordTap(entry)}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  margin: 0,
                  font: "inherit",
                  color: level.accentDeep,
                  borderBottom: `1.5px dotted ${level.accent}`,
                  cursor: "pointer",
                }}
              >
                {core}
              </button>
              {after}
            </React.Fragment>
          );
        })}
      </p>
      {/* flex-start keeps the speaker icon on the toggle's line rather than
          drifting to the middle once the translation is revealed. */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 2 }}>
        <TranslationToggle en={paragraph.en} align="left" />
        <span style={{ display: "flex", paddingTop: 5 }}>
          <SpeakButton text={paragraph.it} color={TOKENS.inkSoft} size={14} />
        </span>
      </div>
    </div>
  );
}

// Sits at the bottom of the viewport so tapping a word never reflows the
// text you're reading. Tapping another word swaps its contents in place.
function GlossBar({ entry, level, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: TOKENS.card,
        borderTop: `1.5px solid ${level.accent}`,
        boxShadow: "0 -10px 24px -16px rgba(0,0,0,0.5)",
        zIndex: 15,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: level.accentDeep }}>
              {entry.word}
            </span>
            <SpeakButton text={entry.word} color={level.accentDeep} size={15} />
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.inkSoft, margin: "2px 0 0" }}>
            {entry.meaning}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close gloss"
          style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.inkSoft, display: "flex", padding: 6, flexShrink: 0 }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function Reader({ level, story, onBack, onStartQuestions }) {
  const [glossEntry, setGlossEntry] = useState(null);

  return (
    <div>
      <TopBar level={level} label={story.title} onBack={onBack} />
      {/* The bottom padding leaves room for the gloss bar, so the last
          paragraph and the questions button stay reachable while it's up. */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 160px" }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: TOKENS.ink, margin: "0 0 6px", lineHeight: 1.15 }}>
          {story.title}
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 28px" }}>
          {story.blurb}
        </p>

        {story.paragraphs.map((paragraph, i) => (
          <Paragraph key={i} paragraph={paragraph} level={level} onWordTap={setGlossEntry} />
        ))}

        <button
          onClick={onStartQuestions}
          style={{
            marginTop: 10,
            width: "100%",
            border: "none",
            background: TOKENS.ink,
            color: TOKENS.paper,
            borderRadius: 10,
            padding: "14px 0",
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
          Comprehension questions <ChevronRight size={16} />
        </button>
      </div>

      {glossEntry && <GlossBar entry={glossEntry} level={level} onClose={() => setGlossEntry(null)} />}
    </div>
  );
}

function Questions({ level, story, onBack, onMarkDone }) {
  // Shuffled once per session so the answer isn't always in the same slot,
  // matching the vocab quiz.
  const questions = useMemo(
    () => story.questions.map((q) => ({ ...q, options: shuffle(q.options) })),
    [story]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    if (opt === q.answer) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissed((m) => [...m, q]);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      onMarkDone(storyKey(level, story), "done");
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
        title="Story complete"
        primary={correctCount}
        primaryLabel={`correct out of ${questions.length}`}
        secondary={missed.length}
        secondaryLabel="to review"
        missed={missed.map((m) => ({ id: m.id, primary: m.answer, secondary: m.explain }))}
        missedHeading="QUESTIONS TO REVIEW"
        backLabel="Back to stories"
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <TopBar level={level} label={story.title} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 14 }}>
          <span>{index + 1} / {questions.length}</span>
          <span>{correctCount} correct</span>
        </div>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: TOKENS.ink, margin: "0 0 22px", lineHeight: 1.3 }}>
          {q.prompt}
        </h2>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const isAnswer = opt === q.answer;
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
              <button
                key={opt}
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
                  gap: 10,
                }}
              >
                {opt}
                {selected && isAnswer && <Check size={16} style={{ flexShrink: 0 }} />}
                {selected && isSelected && !isAnswer && <X size={16} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {selected && (
          <>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, lineHeight: 1.55, margin: "16px 0 0" }}>
              {q.explain}
            </p>
            <button
              onClick={next}
              style={{
                marginTop: 18,
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
              {index + 1 >= questions.length ? "See results" : "Next question"} <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// onExit returns to the app's module menu (see src/App.jsx)
export default function StoriesModule({ onExit }) {
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const onPick = (level, story) => {
    setProgress((p) => touchStreak(p));
    setSession({ level, story, phase: "read" });
  };
  const onBack = () => setSession(null);
  const onMarkDone = (key, status) => setProgress((p) => markWord(p, key, status));

  if (!session) return <StoriesHome onPick={onPick} onExit={onExit} progress={progress} />;

  if (session.phase === "read") {
    return (
      <Reader
        level={session.level}
        story={session.story}
        onBack={onBack}
        onStartQuestions={() => setSession((s) => ({ ...s, phase: "questions" }))}
      />
    );
  }

  return (
    <Questions
      level={session.level}
      story={session.story}
      onBack={onBack}
      onMarkDone={onMarkDone}
    />
  );
}
