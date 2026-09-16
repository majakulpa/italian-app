import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, RotateCw, Check, X, ChevronRight, Layers, Headphones, Volume2 } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { LEVELS } from "../../data/vocab.js";
import { loadProgress, saveProgress, wordKey, categoryKnownCount } from "../../shared/storage.js";
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

const SANS = "'Inter', sans-serif";

// La Città, as this module's own surfaces draw it. The shapes are the ones
// La Riserva (riserva/DrillRound.jsx) and Gli Articoli (articoli/cards.jsx)
// already use, so a deck reached from L'Officina doesn't change design
// language on the way in.
//
// The primary action is the pistachio block every city screen moves forward
// on; its outline is the fixed city ink, and in dark mode the bright fill
// itself is what carries the 3:1 boundary against the page.
const PRIMARY = {
  border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
  borderRadius: CITY_RULES.radius,
  boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
  background: CITY_ACCENTS.pistachio.fill,
  color: CITY_ACCENTS.pistachio.ink,
  fontFamily: SANS,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

// Its quieter twin: no fill, so the outline alone is the control boundary,
// which is why it is the flipping city edge rather than the fixed ink.
const SECONDARY = {
  border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
  borderRadius: CITY_RULES.radius,
  background: "transparent",
  color: TOKENS.ink,
  fontFamily: SANS,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

// One answer option, before and after answering, drawn the way Gli Articoli
// draws its three: a neutral card in the control line until it is settled,
// then a pistachio tile for the answer and a tomato one for a wrong pick,
// each in its own ink. Colour is never the only signal — AnswerMark rides
// along inside the button — and the unpicked distractors stay neutral.
function optionStyle(state) {
  const paint = state === "correct" ? CITY_ACCENTS.pistachio : state === "incorrect" ? CITY_ACCENTS.tomato : null;
  return {
    ...citySurface(),
    background: paint ? paint.fill : TOKENS.card,
    color: paint ? paint.ink : TOKENS.ink,
    border: `${CITY_RULES.border}px solid ${paint ? TOKENS.cityInk : TOKENS.controlLine}`,
  };
}

function VocabHome({ onPick, onExit, exitLabel, progress }) {
  const [level, setLevel] = useState(LEVELS[0]);

  return (
    <div className="citta" style={{ maxWidth: 640, margin: "0 auto", padding: "68px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          onClick={onExit}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: TOKENS.inkSoft, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, padding: 0 }}
        >
          <ArrowLeft size={16} /> {exitLabel}
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        {/* The only Italian on this screen besides the "N parole" counts
            below: the level taglines and every category name in
            src/data/vocab.js are English ("Travel", "Food & dining"), so
            they are left unmarked (SC 3.1.2). */}
        <p lang="it" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriaticDeep, marginBottom: 6, textTransform: "uppercase" }}>
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
              // Only the unstudied subtitle is Italian, and only the word
              // "parole" in it — but the count belongs to that phrase, so the
              // span wraps both and an Italian voice reads "dodici parole".
              // The studied form ("7 / 12 known") is English throughout.
              subtitle={
                known > 0 ? (
                  `${known} / ${cat.words.length} known`
                ) : (
                  <span lang="it">{`${cat.words.length} parole`}</span>
                )
              }
            >
              <button
                onClick={() => onPick(level, cat, "flashcards")}
                style={{ ...SECONDARY, padding: "7px 12px", fontSize: 13 }}
              >
                <Layers size={15} /> Cards
              </button>
              {isSpeechSupported() && (
                <button
                  onClick={() => onPick(level, cat, "listening")}
                  style={{ ...SECONDARY, padding: "7px 12px", fontSize: 13 }}
                >
                  <Headphones size={15} /> Listen
                </button>
              )}
              <button
                onClick={() => onPick(level, cat, "quiz")}
                style={{ ...PRIMARY, padding: "7px 12px", fontSize: 13 }}
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

function Flashcards({ level, category, onBack, onMarkWord }) {
  const order = useMemo(() => shuffle(category.words), [category]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  // The words themselves, not just a tally: every other summary in the app
  // lists what you got wrong, and a deck that only says "4 still learning"
  // makes the learner replay the whole deck to find out which four.
  const [learning, setLearning] = useState([]);
  const [done, setDone] = useState(false);
  const wordRef = useRef(null);

  const word = order[index];

  // Grading a card unmounts the "I knew it" / "Still learning" pair that was
  // just pressed (the card flips back to its front face), and nothing takes
  // their place, so focus falls to <body>: a keyboard learner re-tabs from
  // the top of the document for every card and a screen reader says nothing
  // about the word that replaced the one they graded.
  //
  // The typed benches (review/ReviewModule.jsx, mappe/MappeModule.jsx,
  // riserva/DrillRound.jsx) avoid that by keeping one button mounted across
  // the transition and refocusing their input. There is no input here and no
  // control that survives the swap in a useful place, so this screen takes
  // the other half of the same pattern — the deliberate move that
  // stories/StoriesModule.jsx and grammar/GrammarModule.jsx use: focus the
  // node that *is* the new item. On a flashcard deck that is the Italian
  // word on the front of the card; it is the question, and it is what a
  // screen-reader user needs to hear before deciding whether they know it.
  //
  // Unconditional rather than guarded on `index > 0`, because arriving from
  // the home screen unmounts the "Cards" button the same way. Finishing the
  // deck leaves `index` where it is and returns the summary, which takes
  // focus to its own title (SessionSummary), so this never fires with the
  // front face unmounted.
  useEffect(() => {
    wordRef.current.focus();
  }, [index]);

  const advance = useCallback(
    (knew) => {
      onMarkWord(wordKey(level, category, word), knew ? "known" : "learning");
      if (knew) {
        setKnownCount((c) => c + 1);
      } else {
        setLearning((l) => [...l, word]);
      }
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
        primary={knownCount}
        primaryLabel="marked known"
        secondary={learning.length}
        secondaryLabel="still learning"
        missed={learning.map((w) => ({ id: w.it, primary: w.it, secondary: w.en }))}
        missedLang="it"
        missedHeading="STILL LEARNING"
        backLabel="Back to categories"
        onBack={onBack}
      />
    );
  }

  return (
    <div className="citta">
      <TopBar level={level} label={category.name} onBack={onBack} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, marginBottom: 10 }}>
          <span>{index + 1} / {order.length}</span>
          <span>{knownCount} known</span>
        </div>

        <div
          onClick={() => setFlipped((f) => !f)}
          style={{
            // The whole card flips on a tap, so its outline is a control
            // boundary: the flipping city edge, which clears 3:1 on the page
            // in both themes where the old hairline was only just there.
            ...citySurface(),
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
                {/* tabIndex={-1} makes the word focusable without adding a
                    tab stop: it is the target of the focus move above, not
                    somewhere a learner tabs through. The focus ring stays —
                    the grape one, from .citta — because that is where the
                    keyboard user now is. */}
                <h2
                  ref={wordRef}
                  tabIndex={-1}
                  lang="it"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: 0 }}
                >
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
              style={{ ...SECONDARY, flex: 1, padding: "11px 0", fontSize: 14 }}
            >
              <X size={16} /> Still learning
            </button>
            <button
              onClick={() => advance(true)}
              style={{ ...PRIMARY, flex: 1, padding: "11px 0", fontSize: 14 }}
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

function Quiz({ level, category, onBack, onMarkWord }) {
  const questions = useMemo(() => buildQuizQuestions(category), [category]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);
  const promptRef = useRef(null);

  const q = questions[index];

  // Advancing unmounts the "Next word" button that was just pressed and puts
  // nothing in its place, dropping focus to <body> — see the note on the
  // flashcard deck above for why that is a keyboard learner losing their
  // place on every single question. This screen is the same shape as the
  // grammar drill (grammar/GrammarModule.jsx) and the story questions
  // (stories/StoriesModule.jsx): the answer *is* a button, so there is no
  // input to keep mounted and refocus. Focus goes to the prompt — the
  // Italian word being asked about, which is both the nearest surviving node
  // and the one thing that states what changed.
  useEffect(() => {
    promptRef.current.focus();
  }, [index]);

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
    <div className="citta">
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
          {/* tabIndex={-1}: focusable as the target of the move above, but
              not a tab stop of its own. */}
          <h2
            ref={promptRef}
            tabIndex={-1}
            lang="it"
            style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, color: TOKENS.ink, margin: 0 }}
          >
            {q.word.it}
          </h2>
          <SpeakButton text={q.word.it} color={level.accentDeep} size={19} />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {q.options.map((opt) => {
            const isSelected = selected && selected.it === opt.it;
            const isAnswer = opt.it === q.word.it;
            const state = !selected ? null : isAnswer ? "correct" : isSelected ? "incorrect" : null;
            return (
              <button
                key={opt.it}
                onClick={() => choose(opt)}
                style={{
                  ...optionStyle(state),
                  textAlign: "left",
                  padding: "12px 16px",
                  fontFamily: SANS,
                  fontWeight: 600,
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
            style={{ ...PRIMARY, marginTop: 20, width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            {index + 1 >= questions.length ? "See results" : "Next word"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ListeningQuiz({ level, category, onBack, onMarkWord }) {
  const questions = useMemo(() => buildQuizQuestions(category), [category]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);

  const replayRef = useRef(null);

  const q = questions[index];

  // Auto-play each new word as soon as its question appears.
  useEffect(() => {
    if (!done) speakItalian(q.word.it);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done]);

  // Same dropped focus as the other two decks, but a different landing place,
  // because this screen deliberately has no visible prompt: the item *is* the
  // audio, and showing the Italian word would answer the question. So focus
  // goes to the replay control, which is the one node that stands for the
  // item — the direct equivalent of the typed benches refocusing their input
  // (review/ReviewModule.jsx, mappe/MappeModule.jsx, riserva/DrillRound.jsx),
  // and the learner's likely next action. The effect above has just replayed
  // the new word as focus lands on it, and the options follow it in DOM
  // order, so Tab from here reaches the answers.
  useEffect(() => {
    replayRef.current.focus();
  }, [index]);

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
    <div className="citta">
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
            ref={replayRef}
            onClick={() => speakItalian(q.word.it)}
            aria-label="Play again"
            style={{
              // A neutral city surface, kept round: it is the one control on
              // the screen that stands for the item, and a round play button
              // is what the design draws for audio (screen 16's mic). The
              // icon keeps the level's deep accent, which is text-grade on
              // the card in both themes.
              ...citySurface(),
              width: 84,
              height: 84,
              borderRadius: "50%",
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

        <div style={{ display: "grid", gap: 12 }}>
          {q.options.map((opt) => {
            const isSelected = selected && selected.it === opt.it;
            const isAnswer = opt.it === q.word.it;
            const state = !selected ? null : isAnswer ? "correct" : isSelected ? "incorrect" : null;
            return (
              <button
                key={opt.it}
                onClick={() => choose(opt)}
                style={{
                  ...optionStyle(state),
                  textAlign: "left",
                  padding: "12px 16px",
                  fontFamily: SANS,
                  fontWeight: 600,
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
            style={{ ...PRIMARY, marginTop: 20, width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            {index + 1 >= questions.length ? "See results" : "Next word"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// onExit returns to the app's module menu (see src/App.jsx)
// `exitLabel` says where the back link goes. L'Officina's hub, the deck's one
// way in, passes its own name, because opening the deck from the workshop
// comes back to the workshop. The "All modules" default is the label the other
// module interiors still carry.
export default function VocabModule({ onExit, exitLabel = "All modules" }) {
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

  if (!session) return <VocabHome onPick={onPick} onExit={onExit} exitLabel={exitLabel} progress={progress} />;
  if (session.mode === "flashcards") {
    return (
      <Flashcards
        level={session.level}
        category={session.category}
        onBack={onBack}
        onMarkWord={onMarkWord}
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
      />
    );
  }
  return (
    <Quiz
      level={session.level}
      category={session.category}
      onBack={onBack}
      onMarkWord={onMarkWord}
    />
  );
}
