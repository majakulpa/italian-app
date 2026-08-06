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

export function speakItalian(text) {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel(); // interrupt whatever's currently playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.9;
  const voice = getItalianVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
