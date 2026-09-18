import React, { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { TOKENS, citySurface } from "../../shared/theme.js";
import { SCENES } from "../../data/scenes.js";
import { abilityKey, loadProgress, markWord, saveProgress } from "../../shared/storage.js";
import { primeSpeech } from "../../shared/speech.js";
import { PHASES, bankSceneWords, knownCount } from "./scene.js";
import { BackLink, Eyebrow, SANS, SERIF } from "./chrome.jsx";
import SceneBrief from "./SceneBrief.jsx";
import SceneListen from "./SceneListen.jsx";
import SceneRehearse from "./SceneRehearse.jsx";
import ScenePartner from "./ScenePartner.jsx";

// Le Scene — Il Mercato's first stall, and the four-phase shape design 02–06
// is built around.
//
// This file is the list of scenes and the router between the phases; each
// phase is its own screen and carries its own argument in its own header. The
// scenes themselves are data (src/data/scenes.js) and the arithmetic is
// scene.js.
//
// ── Where the writes happen ─────────────────────────────────────────────
// Two places, both here, because this is where the progress blob lives — the
// phase screens themselves never touch storage.
//
//   finishing Ascolta   the scene's new words, through bankSceneWords. Plan
//                       S3 puts it there rather than on the task being
//                       completed, because that is the moment the words have
//                       been met, and because a learner with no scene partner
//                       would otherwise bank nothing from a scene she has
//                       read, heard and rehearsed.
//   the debrief saying  the scene's can-do statement. Only on goalMet, which
//   the goal was met    is the whole difference between a Posso and a
//                       checkbox; the debrief calls onDemonstrated and the
//                       write is made here.
//
// ── Focus, on every phase change ────────────────────────────────────────
// Every phase replaces the whole screen, which unmounts the button that was
// pressed. Left alone that drops focus to the body: the next Tab starts from
// the top of the document and a screen reader announces nothing. So the new
// phase's h1 takes focus — see PhaseHeading in chrome.jsx. The effect keys on
// the phase id rather than firing on mount, so opening a scene moves focus to
// the brief's heading too; the list's own button has just unmounted there for
// exactly the same reason.

export default function ScenesModule({ onExit, exitLabel, onCasa, createClient }) {
  const [progress, setProgress] = useState(loadProgress);
  const [scene, setScene] = useState(null);
  const [phase, setPhase] = useState(PHASES[0]);
  // The keys finishing Ascolta actually wrote, so Prova's "+N parole" counts
  // what happened rather than how many words the scene has.
  const [banked, setBanked] = useState([]);
  const headingRef = useRef(null);

  useEffect(() => {
    if (scene) headingRef.current.focus();
  }, [scene, phase]);

  const open = (next) => {
    setScene(next);
    setPhase(PHASES[0]);
    setBanked([]);
  };

  const leave = () => setScene(null);

  // The brief's "Comincia" is the first user gesture inside a scene, which is
  // where synthesis has to be unlocked: iOS drops any utterance started
  // outside a gesture, and the phases after this one speak lines the learner
  // did not press a speaker for. See primeSpeech in shared/speech.js.
  const begin = () => {
    primeSpeech();
    setPhase(PHASES[1]);
  };

  const heard = () => {
    const { progress: next, written } = bankSceneWords(progress, scene);
    setProgress(next);
    saveProgress(next);
    setBanked(written);
    setPhase(PHASES[2]);
  };

  // The one write the task makes. `done` rather than a status with degrees to
  // it: the ability was demonstrated or it was not, and doing the scene again
  // writes the same value over the same key rather than counting a second
  // time — a Posso is a thing you can do, not a tally of the times you did.
  const demonstrated = (which) => {
    const next = markWord(progress, abilityKey(which), "done");
    setProgress(next);
    saveProgress(next);
  };

  if (!scene) {
    return (
      <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
        <BackLink label={exitLabel} onClick={onExit} />

        <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
          <Eyebrow style={{ color: TOKENS.inkSoft, letterSpacing: 3, display: "block", marginBottom: 6 }}>
            {SCENES.length} scenes, four phases each
          </Eyebrow>
          <h1 lang="it" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.05 }}>
            Le Scene
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
            Not lessons. Each one names something you will be able to do at a market stall, and then gets you to the
            point where it is true.
          </p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {SCENES.map((candidate, index) => (
            <button
              key={candidate.id}
              onClick={() => open(candidate)}
              style={{
                ...citySurface("lemon"),
                padding: "14px 16px 16px",
                textAlign: "left",
                cursor: "pointer",
                display: "block",
                width: "100%",
                font: "inherit",
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <Eyebrow lang="it" style={{ opacity: 0.85 }}>
                  scena {index + 1}
                </Eyebrow>
                <ChevronRight size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
              </span>
              <span
                lang="it"
                style={{ display: "block", fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "8px 0 6px", lineHeight: 1.2 }}
              >
                {candidate.title}
              </span>
              <span style={{ display: "block", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, opacity: 0.92 }}>
                {candidate.ability.en}
              </span>
              {/* The same real count the brief shows, so the card and the
                  screen behind it cannot disagree. */}
              <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, marginTop: 8, opacity: 0.85 }}>
                {candidate.newWords.length} new words &middot; {knownCount(progress, candidate)} of{" "}
                {candidate.knownRanks.length} everyday ones you already know
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
      <BackLink label={<span lang="it">Le Scene</span>} onClick={leave} />

      {phase === PHASES[0] && (
        <SceneBrief scene={scene} progress={progress} headingRef={headingRef} onBegin={begin} />
      )}
      {phase === PHASES[1] && <SceneListen scene={scene} headingRef={headingRef} onDone={heard} />}
      {phase === PHASES[2] && (
        <SceneRehearse scene={scene} banked={banked} headingRef={headingRef} onDone={() => setPhase(PHASES[3])} />
      )}
      {phase === PHASES[3] && (
        <ScenePartner
          scene={scene}
          progress={progress}
          headingRef={headingRef}
          onCasa={onCasa}
          onLeave={leave}
          onDemonstrated={demonstrated}
          createClient={createClient}
        />
      )}
    </div>
  );
}
