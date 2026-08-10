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
