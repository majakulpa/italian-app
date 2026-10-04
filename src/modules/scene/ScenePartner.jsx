import React, { useState } from "react";
import ScenePinPrompt from "../../shared/ScenePinPrompt.jsx";
import { hasStoredKey, isUnlocked, lockedKey } from "../../shared/partnerKey.js";
import { openScene, partnerClient } from "../../shared/scenePartner.js";
import { STAGES, stageState } from "../../shared/stage.js";
import { PHASES, knownWords } from "./scene.js";
import { PhaseHeading, PhaseMeter } from "./chrome.jsx";
import SceneNoPartner from "./SceneNoPartner.jsx";
import SceneTask from "./SceneTask.jsx";
import SceneDebrief from "./SceneDebrief.jsx";

// Phase 4's front door: which of three screens the task is, and where the
// scene is opened.
//
//   no key stored     SceneNoPartner — what the phase is and why this device
//                     cannot run it, with the way to Casa.
//   key stored,       ScenePinPrompt — the PIN, asked for once per app run
//   still locked      (plan S1). Nothing else in the app asks for it.
//   unlocked          SceneTask, then SceneDebrief.
//
// ── The scene is opened once, here ──────────────────────────────────────
// `openScene` freezes the system prompt — the learner's stage name and the
// words she walks in with, snapshotted — so it must happen once per scene and
// not once per render. A lazy `useState` initialiser is that: it runs on the
// first render that reaches it, which is the first render after the key is
// unlocked, and never again. Rebuilding it per render would rewrite the
// cached prefix on every keystroke.
//
// ── Why the client is a prop ────────────────────────────────────────────
// `createClient` defaults to the real one. It is a seam rather than a stub:
// the module underneath takes an injected client by design (see
// shared/scenePartner.js), so something has to hand one in, and a prop with a
// working default is the smallest thing that can. The tests pass a fake; the
// browser pass stubs `window.fetch` instead and drives the real SDK through
// this same default.

export default function ScenePartner({ scene, progress, headingRef, onCasa, onLeave, onDemonstrated, createClient = partnerClient }) {
  const phase = PHASES[3];
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [outcome, setOutcome] = useState(null);

  return (
    <>
      <PhaseMeter phase={phase} />
      <PhaseHeading headingRef={headingRef} it={phase.label} en="No script. It answers what you actually say." />

      {!hasStoredKey() ? (
        <SceneNoPartner scene={scene} onCasa={onCasa} onLeave={onLeave} />
      ) : !unlocked ? (
        <ScenePinPrompt onUnlocked={() => setUnlocked(true)} onCancel={onLeave} />
      ) : (
        <Talking
          scene={scene}
          progress={progress}
          outcome={outcome}
          onFinish={setOutcome}
          onDemonstrated={onDemonstrated}
          onLeave={onLeave}
          createClient={createClient}
        />
      )}
    </>
  );
}

// The two screens that share one session. Split out so the session's lazy
// initialiser only runs once the key is actually in hand — `lockedKey()` is
// null until then, and a client built round null would be a client built for
// a scene that cannot run.
function Talking({ scene, progress, outcome, onFinish, onDemonstrated, onLeave, createClient }) {
  const [session] = useState(() =>
    openScene({
      client: createClient(lockedKey()),
      scene,
      progress,
      stageName: STAGES[stageState(progress).current - 1].name,
      knownWords: knownWords(progress, scene),
    }),
  );

  if (outcome === null) return <SceneTask scene={scene} session={session} onDone={onFinish} />;

  return (
    <SceneDebrief
      scene={scene}
      session={session}
      outcome={outcome}
      onDemonstrated={onDemonstrated}
      onLeave={onLeave}
    />
  );
}
