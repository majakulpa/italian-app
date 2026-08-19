import React, { useState, useMemo, useEffect } from "react";
import { ChevronRight, Check, X } from "lucide-react";
import { TOKENS, tint } from "../../shared/theme.js";
import { loadProgress, saveProgress, touchStreak, todayISO } from "../../shared/storage.js";
import { dueItems, reviewItem } from "../../shared/srs.js";
import { shuffle } from "../../shared/shuffle.js";
import TopBar from "../../shared/TopBar.jsx";
import SessionSummary from "../../shared/SessionSummary.jsx";
import SpeakButton from "../../shared/SpeakButton.jsx";
import AnswerMark from "../../shared/AnswerMark.jsx";
import AnswerStatus from "../../shared/AnswerStatus.jsx";

// The summary and the empty state aren't at any one level — a review mixes
// them — so they borrow the gold that theme.js reserves for streaks and
// celebration rather than pretending to be A1 or C1.
const GOLD = { label: "SRS", accent: TOKENS.limoncello, accentDeep: TOKENS.limoncelloDeep };

// A due unit becomes a multiple-choice question. Vocabulary asks for the
// meaning and draws its distractors from the word's own category, the way the
// vocab quiz does; a grammar drill already carries its own authored options.
function toQuestion(unit) {
  if (unit.moduleId === "vocab") {
    const distractors = shuffle(unit.group.words.filter((w) => w.it !== unit.item.it)).slice(0, 3);
    return {
      prompt: unit.item.it,
      speak: unit.item.it,
      hint: null,
      options: shuffle([unit.item, ...distractors]).map((w) => w.en),
      answer: unit.item.en,
      optionsAreItalian: false,
      recap: { primary: unit.item.it, secondary: unit.item.en },
    };
  }
  return {
    prompt: unit.item.prompt,
    speak: null,
    hint: unit.item.hint,
    options: shuffle(unit.item.options),
    answer: unit.item.answer,
    optionsAreItalian: true,
    recap: { primary: unit.item.prompt.replace("___", unit.item.answer), secondary: unit.item.en },
  };
}

export default function ReviewModule({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  // Built once, from the progress as it was when the session opened —
  // answering shouldn't reshuffle the queue underneath you.
  const queue = useMemo(() => dueItems(loadProgress(), todayISO()).map((unit) => ({ unit, q: toQuestion(unit) })), []);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (queue.length > 0) setProgress((p) => touchStreak(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (queue.length === 0) {
    return <NothingDue onExit={onExit} />;
  }

  if (done) {
    return (
      <SessionSummary
        level={GOLD}
        title="Review complete"
        primary={correctCount}
        primaryLabel="correct"
        secondary={queue.length - correctCount}
        secondaryLabel="to see again"
        missed={missed}
        missedLang="it"
        backLabel="Back to home"
        onBack={onExit}
      />
    );
  }

  const { unit, q } = queue[index];

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === q.answer;
    setProgress((p) => reviewItem(p, unit.key, isCorrect));
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMissed((m) => [...m, { id: unit.key, ...q.recap }]);
    }
  };

  const next = () => {
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <div>
      {/* the item's own level, so you can see what you're being asked from */}
      <TopBar level={unit.level} label="Review" onBack={onExit} />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft }}>
            {index + 1} / {queue.length}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft }}>
            {correctCount} correct
          </span>
        </div>

        <div
          style={{
            background: TOKENS.card,
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 16,
            padding: "26px 22px",
            marginBottom: 22,
            textAlign: "center",
          }}
        >
          <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: 0 }}>
            <span lang="it" style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: TOKENS.ink, lineHeight: 1.4 }}>
              {q.prompt}
            </span>
            {q.speak && <SpeakButton text={q.speak} color={unit.level.accentDeep} size={17} />}
          </p>
          {q.hint && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: "10px 0 0" }}>
              {q.hint}
            </p>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {/* Same colour language as the vocab quiz and the grammar drill:
              green marks the answer, red marks a wrong pick, and the answer
              is always revealed once you've committed. */}
          {q.options.map((option) => {
            const isAnswer = option === q.answer;
            const isPicked = selected === option;
            let bg = TOKENS.card;
            let border = TOKENS.controlLine;
            let color = TOKENS.ink;
            if (selected) {
              if (isAnswer) {
                bg = tint(TOKENS.malachite, 12);
                border = TOKENS.malachiteDeep;
                color = TOKENS.malachiteDeep;
              } else if (isPicked) {
                bg = tint(TOKENS.corallo, 12);
                border = TOKENS.corolloDeep;
                color = TOKENS.corolloDeep;
              }
            }

            return (
              <button
                key={option}
                onClick={() => choose(option)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
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
                  width: "100%",
                }}
              >
                <span lang={q.optionsAreItalian ? "it" : undefined}>{option}</span>
                {selected && isAnswer && <AnswerMark state="correct" />}
                {selected && isPicked && !isAnswer && <AnswerMark state="incorrect" />}
              </button>
            );
          })}
        </div>

        <AnswerStatus correct={selected === null ? null : selected === q.answer} answer={q.answer} />

        {selected && (
          <button
            onClick={next}
            style={{
              border: "none",
              background: TOKENS.ink,
              color: TOKENS.paper,
              borderRadius: 10,
              padding: "13px 22px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "22px 0 0 auto",
            }}
          >
            {index + 1 >= queue.length ? "See results" : "Next"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Reachable by opening a review from a stale dashboard, or by finishing
// everything and coming straight back.
function NothingDue({ onExit }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: TOKENS.ink, margin: "0 0 10px" }}>
        Nothing due
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 26px", lineHeight: 1.6 }}>
        Everything you've studied is scheduled for a later day. Study something new and it'll come back here when it's time.
      </p>
      <button
        onClick={onExit}
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
        Back to home
      </button>
    </div>
  );
}
