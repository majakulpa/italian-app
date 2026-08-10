import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Check, Flame, User, Eye, EyeOff } from "lucide-react";
import { TOKENS } from "../../shared/theme.js";
import { CONVERSATION_LEVELS } from "../../data/conversations.js";
import { loadProgress, saveProgress, touchStreak, markWord, conversationKey, isConversationDone } from "../../shared/storage.js";
import Postmark from "../../shared/Postmark.jsx";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";

function ConversationsHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(CONVERSATION_LEVELS[0]);
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
          Due parole
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Conversations
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
        {CONVERSATION_LEVELS.map((lv) => {
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
        {level.dialogues.map((dialogue) => {
          const done = isConversationDone(progress, level, dialogue);
          return (
            <div
              key={dialogue.id}
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
                  {dialogue.title}
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  {done && <Check size={13} color={TOKENS.malachite} />}
                  {done ? "Completed" : dialogue.tagline}
                </p>
              </div>
              <button
                onClick={() => onPick(level, dialogue)}
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
                {done ? "Practice again" : "Start"} <ChevronRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// English is hidden by default — tap to reveal it, matching the
// tap-to-flip/tap-to-reveal pattern used elsewhere in the app (flashcards,
// listening quiz). stopPropagation matters where this sits inside a larger
// clickable element (an option card).
function TranslationToggle({ en, align = "left" }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setRevealed((r) => !r);
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: TOKENS.inkSoft,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
        }}
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
        {revealed ? "Hide translation" : "Show translation"}
      </button>
      {revealed && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0", textAlign: align }}>
          {en}
        </p>
      )}
    </div>
  );
}

function ThemBubble({ speakerName, line, level }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: TOKENS.paperDeep,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: TOKENS.inkSoft,
            flexShrink: 0,
          }}
        >
          <User size={12} />
        </div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: TOKENS.inkSoft, letterSpacing: 0.5, margin: 0 }}>
          {speakerName.toUpperCase()}
        </p>
      </div>
      <div
        style={{
          background: TOKENS.card,
          border: `1px solid ${TOKENS.line}`,
          borderRadius: "4px 16px 16px 16px",
          padding: "12px 16px",
          maxWidth: "85%",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: TOKENS.ink, margin: 0 }}>{line.it}</p>
        <SpeakButton text={line.it} color={level.accentDeep} size={14} />
      </div>
      <TranslationToggle en={line.en} align="left" />
    </div>
  );
}

function YouBubble({ pick, level }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: TOKENS.inkSoft, letterSpacing: 0.5, margin: "0 0 6px" }}>
        YOU
      </p>
      <div
        style={{
          background: level.accent,
          borderRadius: "16px 4px 16px 16px",
          padding: "12px 16px",
          maxWidth: "85%",
        }}
      >
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: level.accentDeep, margin: 0 }}>{pick.it}</p>
      </div>
      <TranslationToggle en={pick.en} align="right" />
      <p style={{ fontFamily: "'Inter', sans-serif", fontStyle: "italic", fontSize: 12, color: TOKENS.inkSoft, margin: "6px 0 0", textAlign: "right", maxWidth: "85%" }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontStyle: "normal",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: pick.tone === "formal" ? TOKENS.adriatic : TOKENS.limoncelloDeep,
            marginRight: 6,
          }}
        >
          {pick.tone}
        </span>
        {pick.feedback}
      </p>
    </div>
  );
}

function Dialogue({ level, dialogue, onBack, onMarkDone, onStudySession }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onStudySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (option) => {
    const nextPicks = [...picks, option];
    setPicks(nextPicks);
    if (stepIndex + 1 >= dialogue.steps.length) {
      onMarkDone(conversationKey(level, dialogue), "done");
      setDone(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (done) {
    const formalCount = picks.filter((p) => p.tone === "formal").length;
    const casualCount = picks.filter((p) => p.tone === "casual").length;
    return (
      <SessionSummary
        level={level}
        title="Conversation complete"
        primary={formalCount}
        primaryLabel="formal picks"
        secondary={casualCount}
        secondaryLabel="casual picks"
        missed={picks.map((p, i) => ({ id: `${i}-${p.it}`, primary: p.it, secondary: p.feedback }))}
        missedHeading="YOUR RESPONSES"
        backLabel="Back to dialogues"
        onBack={onBack}
      />
    );
  }

  const currentStep = dialogue.steps[stepIndex];

  return (
    <div>
      <TopBar level={level} label={dialogue.title} onBack={onBack} />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 18 }}>
          {stepIndex + 1} / {dialogue.steps.length}
        </div>

        {dialogue.steps.slice(0, stepIndex + 1).map((step, i) => (
          <div key={i}>
            {step.them && <ThemBubble speakerName={dialogue.speakerName} line={step.them} level={level} />}
            {picks[i] && <YouBubble pick={picks[i]} level={level} />}
          </div>
        ))}

        {!currentStep.them && !picks[stepIndex] && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, fontStyle: "italic", margin: "0 0 12px" }}>
            You start the conversation:
          </p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {currentStep.options.map((opt, i) => (
            <div
              // Keying on stepIndex too (not just i) forces a fresh instance
              // per step, so a revealed translation doesn't carry over onto
              // the next step's option in the same list position.
              key={`${stepIndex}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => choose(opt)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") choose(opt);
              }}
              style={{
                textAlign: "left",
                border: `1.5px solid ${TOKENS.line}`,
                background: TOKENS.card,
                borderRadius: 10,
                padding: "13px 16px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: opt.tone === "formal" ? TOKENS.adriatic : TOKENS.limoncelloDeep,
                }}
              >
                {opt.tone}
              </span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: TOKENS.ink }}>{opt.it}</span>
              <TranslationToggle en={opt.en} align="left" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// onExit returns to the app's module menu (see src/App.jsx)
export default function ConversationsModule({ onExit }) {
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const onPick = (level, dialogue) => setSession({ level, dialogue });
  const onBack = () => setSession(null);
  const onMarkDone = (key, status) => setProgress((p) => markWord(p, key, status));
  const onStudySession = () => setProgress((p) => touchStreak(p));

  if (!session) return <ConversationsHome onPick={onPick} onExit={onExit} progress={progress} />;
  return (
    <Dialogue
      level={session.level}
      dialogue={session.dialogue}
      onBack={onBack}
      onMarkDone={onMarkDone}
      onStudySession={onStudySession}
    />
  );
}
