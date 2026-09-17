// Italian pronunciation via the browser's built-in SpeechSynthesis API — no
// audio files or network calls needed. Voice quality/availability varies by
// browser and OS, but every major platform ships at least one Italian voice.

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedItalianVoice;

function getItalianVoice() {
  if (cachedItalianVoice !== undefined) return cachedItalianVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedItalianVoice =
    voices.find((v) => v.lang === "it-IT") || voices.find((v) => v.lang?.startsWith("it")) || null;
  return cachedItalianVoice;
}

if (isSpeechSupported()) {
  // Voices load asynchronously in some browsers (notably Chrome) — refresh
  // the cache once they arrive so the first speak() call picks one up.
  window.speechSynthesis.onvoiceschanged = () => {
    cachedItalianVoice = undefined;
  };
}

// Chrome can silently garbage-collect an utterance that nothing references,
// which drops speech with no error — keeping this live reference works
// around it. See: https://bugs.chromium.org/p/chromium/issues/detail?id=509488
let activeUtterance = null;

// Unlocks speech synthesis for the rest of the visit, and has to be called
// from inside a real user gesture.
//
// iOS Safari treats the first speak() of a page like it treats audio
// playback: an utterance started outside a user gesture is silently dropped,
// and every later one with it. A scene is the first screen in this app where
// that matters — the model dialogue's pronounce buttons are taps, so they are
// fine, but the phases that follow will speak a line the learner did not press
// a speaker for. So the "Comincia" tap on the brief spends itself on an empty
// utterance, which unlocks the queue and says nothing.
//
// An empty string rather than a space: some engines speak a space as a short
// breath, and the point is for this to be inaudible.
export function primeSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
}

export function speakItalian(text) {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  // Only cancel when something is actually queued/playing — calling
  // cancel() immediately before speak() on an idle queue is a known source
  // of the new utterance getting silently dropped in some Chrome versions.
  if (synth.speaking || synth.pending) synth.cancel();
  // Chrome can also leave the queue stuck "paused" after the tab loses and
  // regains focus; resume() is a no-op when nothing is paused, so it's safe
  // to call unconditionally as a defensive measure.
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.9;
  const voice = getItalianVoice();
  if (voice) utterance.voice = voice;
  activeUtterance = utterance;
  synth.speak(utterance);
}
