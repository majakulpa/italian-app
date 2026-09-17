// Italian speech recognition through the browser's Web Speech API — the input
// half of what shared/speech.js does for output. No audio is uploaded by this
// app: the browser hands the audio to its own vendor (Apple on Safari, Google
// on Chrome) and hands back text.
//
// ── What this deliberately does not do ──────────────────────────────────
// Design 05 draws a badge on the learner's own bubble: "🎙 chiaro ✓". That is
// refused, and the refusal is why `maxAlternatives` is 1 and why no result's
// `confidence` is read anywhere below.
//
// Two reasons, and either alone is enough. The number is not trustworthy —
// Safari reports 0 for every result, so the badge would read "not clear" for
// every learner on an iPhone, which is the platform the whole voice phase is
// designed for. And even where it is populated it is the engine's confidence
// in its own transcription, not a measurement of the learner's pronunciation:
// a perfect Bolognese *maturi* into a noisy market gets a low number and a
// flat English *matury* into a quiet room gets a high one. An app that painted
// the second green and the first amber would be grading the microphone.
//
// Pronunciation feedback is a real thing to want and this API cannot give it.
//
// ── Why the recogniser is created per utterance ─────────────────────────
// A SpeechRecognition object is single-shot in practice: `continuous` is
// unimplemented on Safari, and restarting a stopped instance throws
// InvalidStateError on Chrome often enough that reuse is not worth the
// bookkeeping. So `startListening` builds one, wires it, starts it, and hands
// back the one thing a caller needs — how to stop it.

// The constructor, under whichever name this browser has it. Firefox has
// neither, which is the case NO_RECOGNITION exists for.
function recognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isRecognitionSupported() {
  return recognitionCtor() !== null;
}

// Said on screen wherever the microphone would have been. Never a disabled
// mic button: a control that is there and does nothing tells the learner her
// phone is broken, where a sentence tells her which half of the app she is
// using. The last clause is the load-bearing one — nothing in Le Scene needs
// the microphone, and a learner on Firefox has to be told that rather than
// left to infer it.
export const NO_RECOGNITION =
  "This browser cannot listen: Firefox ships no speech recognition, and some others have it switched off. Type the Italian instead — every phase works the same way typed.";

// Every result the engine has produced so far, interim ones included, as one
// string. Interim results are on because the learner should see the box
// filling while she talks; the final pass overwrites the same box, so nothing
// accumulates twice.
function transcriptOf(event) {
  return Array.from(event.results)
    .map((result) => result[0].transcript)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// Starts listening in Italian. Returns a `stop` function, or null when the
// browser has no recogniser — a caller that ignores the null is asking a
// Firefox user to hold a button that cannot do anything, so every caller
// checks isRecognitionSupported() first and this is the belt.
//
// `onTranscript` may fire several times for one utterance, each time with the
// whole transcript so far. `onEnd` fires once, whether the stop was the
// learner's, a silence timeout, or an error — a caller only ever has to undo
// "listening" in one place. `onError` fires *as well as* `onEnd` and carries
// the API's own error string, which is how "no microphone permission" is told
// apart from "I heard nothing".
export function startListening({ onTranscript, onEnd, onError }) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = "it-IT";
  recognition.interimResults = true;
  recognition.continuous = false;
  // One alternative, because the others would only ever be used to rank, and
  // ranking is what this file refuses to do. See the header.
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => onTranscript(transcriptOf(event));
  recognition.onerror = (event) => onError(event.error);
  recognition.onend = () => onEnd();
  recognition.start();

  // Guarded because the stop can arrive twice from one gesture: a pointerup
  // and a pointercancel for the same press, or a pointerleave followed by the
  // pointerup that the browser still delivers. `stop()` on an instance that
  // has already ended throws on some engines, and there is nothing for a
  // second stop to do.
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    recognition.stop();
  };
}
