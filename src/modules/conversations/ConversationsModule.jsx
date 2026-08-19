import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Check, User } from "lucide-react";
import { TOKENS, tint } from "../../shared/theme.js";
import { CONVERSATION_LEVELS } from "../../data/conversations.js";
import { loadProgress, saveProgress, touchStreak, markWord, conversationKey, isConversationDone } from "../../shared/storage.js";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import LevelPicker from "../../shared/LevelPicker.jsx";
import TicketCard from "../../shared/TicketCard.jsx";
import TranslationToggle from "../../shared/TranslationToggle.jsx";
import StreakChip from "../../shared/StreakChip.jsx";

function ConversationsHome({ onPick, onExit, progress }) {
  const [level, setLevel] = useState(CONVERSATION_LEVELS[0]);

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
          Due parole
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Conversations
        </h1>
      </div>

      <LevelPicker levels={CONVERSATION_LEVELS} active={level} onSelect={setLevel} />

      <p style={{ textAlign: "center", color: TOKENS.inkSoft, fontFamily: "'Inter', sans-serif", fontSize: 15, marginBottom: 28 }}>
        {level.tagline}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {level.dialogues.map((dialogue) => {
          const done = isConversationDone(progress, level, dialogue);
          return (
            <TicketCard
              key={dialogue.id}
              level={level}
              title={dialogue.title}
              subtitle={
                <>
                  {done && <Check size={13} color={TOKENS.malachiteDeep} />}
                  {done ? "Completed" : dialogue.tagline}
                </>
              }
            >
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
            </TicketCard>
          );
        })}
      </div>
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
        <p lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: TOKENS.ink, margin: 0 }}>{line.it}</p>
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
          background: tint(level.accent, 15),
          border: `1.5px solid ${level.accent}`,
          borderRadius: "16px 4px 16px 16px",
          padding: "12px 16px",
          maxWidth: "85%",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <p lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: level.accentDeep, margin: 0 }}>{pick.it}</p>
        <SpeakButton text={pick.it} color={level.accentDeep} size={14} />
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
            color: pick.tone === "formal" ? TOKENS.adriaticDeep : TOKENS.limoncelloDeep,
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
        missedLang="it"
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
            // The card is a plain container: the reply itself is a real
            // <button>, and the speaker and the translation toggle sit beside
            // it rather than inside it. Controls nested inside a control are
            // announced unpredictably, and the two inner ones each need to be
            // reachable without triggering the choice.
            <div
              // Keying on stepIndex too (not just i) forces a fresh instance
              // per step, so a revealed translation doesn't carry over onto
              // the next step's option in the same list position.
              key={`${stepIndex}-${i}`}
              style={{
                border: `1.5px solid ${TOKENS.controlLine}`,
                background: TOKENS.card,
                borderRadius: 10,
                padding: "13px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <button
                onClick={() => choose(opt)}
                style={{
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 3,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: opt.tone === "formal" ? TOKENS.adriaticDeep : TOKENS.limoncelloDeep,
                  }}
                >
                  {opt.tone}
                </span>
                <span lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: TOKENS.ink }}>{opt.it}</span>
              </button>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SpeakButton text={opt.it} color={TOKENS.inkSoft} size={14} style={{ padding: 0 }} />
                <TranslationToggle en={opt.en} align="left" />
              </span>
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
