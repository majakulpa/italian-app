import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Mic, Square } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS } from "./theme.js";
import LiveStatus from "./LiveStatus.jsx";
import { isRecognitionSupported, startListening, NO_RECOGNITION } from "./recognition.js";

// The microphone, in the two shapes it has to have.
//
// It does not own the text. Whatever it hears goes to `onTranscript`, the
// caller writes it into its own input, and the learner edits it there before
// anything is judged — plan S5's rule, and the reason this component is a
// button and a note rather than a field. A recognition error must never become
// the learner's mistake, and the only way to guarantee that is for the
// recognised text to land somewhere she can change.
//
// ── Hold, and also tap ──────────────────────────────────────────────────
// Design 05 draws hold-to-talk ("🎙 tieni premuto"), which is the right
// gesture on a phone: it is unambiguous about when the app is listening, and
// it cannot be left on by accident. It is also, on its own, a WCAG 2.1.1
// failure — a press-and-hold has no keyboard equivalent, so a learner using a
// switch or a keyboard could not talk at all.
//
// Both, then, with an explicit switch between them rather than a clever
// heuristic. Hold is the default because it is the phone gesture and the
// design's; the switch is a real button beside it, so reaching tap-to-toggle
// takes one Tab and one Enter. In toggle mode the mic is an ordinary button
// with a pressed state, which needs nothing special from the keyboard.
//
// Guessing the mode from the event — treating a click with `detail === 0` as a
// keyboard activation — was the alternative. It fails quietly on the platforms
// that matter (a tap on iOS delivers a click with detail 1, and so does
// VoiceOver's double-tap), and a mode the learner can see and choose is worth
// more than one the app infers.
//
// ── pointercancel ───────────────────────────────────────────────────────
// A held press ends in pointerup only when nothing interrupts it. Scroll the
// page, get a phone call, have the browser decide the gesture was a pan, and
// the last event is pointercancel with no pointerup behind it. Without it the
// recogniser is left running with the button still drawn as pressed, until a
// silence timeout eventually ends it — which on Chrome is several seconds of an
// open microphone.
//
// pointerleave is handled for the same class of reason: a finger that slides
// off the button never delivers pointerup to it.

const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// The two gestures, as data, so the label, the hint and the switch cannot
// disagree about which one is on.
const HOLD = {
  id: "hold",
  // Italian on the button face, the way the design draws it; the hint under it
  // is English, so the instruction is never only in the language being learned.
  face: "tieni premuto",
  hint: "Hold the button while you talk.",
  switchTo: "Switch to tap to talk",
};

const TOGGLE = {
  id: "toggle",
  face: "tocca per parlare",
  hint: "Tap to start, tap again to stop. Works from the keyboard.",
  switchTo: "Switch to hold to talk",
};

// The API's own error string, turned into something to do about it.
// `not-allowed` and `service-not-allowed` are the permission cases and are
// worth telling apart from silence, because the fix is different: one is a
// browser prompt, the other is talking louder.
function errorNote(error) {
  return error === "not-allowed" || error === "service-not-allowed"
    ? "The browser did not give this page the microphone. Allow it in the address bar, or type instead."
    : "Nothing came through that time. Try again, or type it.";
}

export default function Microphone({ onTranscript, disabled = false }) {
  const [mode, setMode] = useState(HOLD);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const stopRef = useRef(null);

  // Whatever happens to this screen, the microphone closes. A phase that
  // advances while the learner is still holding the button would otherwise
  // unmount the only reference to the stop function.
  useEffect(() => () => stopRef.current?.(), []);

  if (!isRecognitionSupported()) {
    return (
      <p style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55 }}>
        {NO_RECOGNITION}
      </p>
    );
  }

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  const start = () => {
    if (stopRef.current) return;
    setError(null);
    setListening(true);
    stopRef.current = startListening({
      onTranscript,
      onEnd: () => {
        setListening(false);
        stopRef.current = null;
      },
      onError: setError,
    });
  };

  // In hold mode the press itself starts and the release stops. In toggle mode
  // the pointer events do nothing and `onClick` carries both, which is what
  // makes Enter and Space work.
  //
  // `disabled` has to be checked here as well as on the element. A disabled
  // <button> suppresses `click`, but pointer events still reach it — so a
  // press on a switched-off microphone opened the recogniser anyway, with no
  // way on screen to close it again. Microphone.test.jsx caught that.
  const held = mode === HOLD;
  const live = held && !disabled;
  const press = live ? start : undefined;
  const release = live ? stop : undefined;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={held ? undefined : listening}
          onPointerDown={press}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onClick={held ? undefined : () => (listening ? stop() : start())}
          style={{
            flex: 1,
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            // Two tokens, because the button changes what it sits on.
            //
            // `cityInk` is not theme-reactive — it is #141024 in both themes,
            // because it is the ink that sits on an *accent fill*, and accent
            // fills stay bright in the dark. Idle, this button's fill is
            // `card`, so a cityInk rule around it measured **1.39:1** against
            // the dark card: the microphone had no visible boundary at all in
            // dark mode, while passing every arithmetic check because the
            // pairing it was checked against was the wrong one. The browser
            // pass is what caught it.
            //
            // So idle takes `cityEdge`, the theme-reactive card rule (18.29:1
            // light, 10.46:1 dark), and listening keeps the design's dark rule
            // on a bright fill — where the tomato fill itself carries the
            // boundary (4.08:1 against the dark card) even if the rule does
            // not. See CLAUDE.md on why this had to be measured.
            border: `${CITY_RULES.border}px solid ${listening ? TOKENS.cityInk : TOKENS.cityEdge}`,
            borderRadius: CITY_RULES.radius,
            boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
            background: listening ? CITY_ACCENTS.tomato.fill : TOKENS.card,
            color: listening ? CITY_ACCENTS.tomato.ink : TOKENS.ink,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 15,
            cursor: disabled ? "default" : "pointer",
            // A held button must not also be a text selection or a page pan.
            touchAction: "none",
            userSelect: "none",
          }}
        >
          {/* Two icons rather than one that changes colour: listening is never
              signalled by the red fill alone (WCAG 1.4.1), and the word beside
              it changes too. */}
          {listening ? <Square size={16} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          <span>
            {listening ? (
              "Listening — stop"
            ) : (
              <>
                Talk &middot; <span lang="it">{mode.face}</span>
              </>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode(held ? TOGGLE : HOLD)}
          aria-label={mode.switchTo}
          style={{
            width: 48,
            border: `2px solid ${TOKENS.controlLine}`,
            borderRadius: CITY_RULES.radius,
            background: "transparent",
            color: TOKENS.ink,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {held ? <Keyboard size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
        </button>
      </div>

      <p style={{ fontFamily: SANS, fontSize: 12.5, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.5 }}>
        {/* "before it goes anywhere", not "before you check": this control is
            now on two screens with two different buttons under it — Prova's
            Check and the task's Send — and naming one of them made the hint
            wrong on the other. The browser pass caught it on screen 05. */}
        {mode.hint} Whatever it hears goes in the box above, where you can fix it before it goes anywhere.
      </p>

      {/* Mounted for the life of the control and empty until there is
          something to say — see LiveStatus.jsx for why a region that appears
          with its text already inside may never be announced. It carries the
          listening state as well as the error, because a learner who cannot
          see the button turn red has no other way to know the microphone is
          open. */}
      <LiveStatus>{error ? errorNote(error) : listening ? "Listening." : ""}</LiveStatus>

      {/* The engine's own error, named rather than swallowed. */}
      {error && (
        <p style={{ fontFamily: MONO, fontSize: 12, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.5 }}>
          {errorNote(error)}
        </p>
      )}
    </div>
  );
}
