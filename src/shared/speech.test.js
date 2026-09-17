import { describe, it, expect, beforeEach, vi } from "vitest";

class MockUtterance {
  constructor(text) {
    this.text = text;
  }
}

function setSpeechSynthesis(voices, { speaking = false, pending = false } = {}) {
  window.speechSynthesis = {
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    speaking,
    pending,
    onvoiceschanged: null,
  };
  global.SpeechSynthesisUtterance = MockUtterance;
}

beforeEach(() => {
  vi.resetModules();
  delete window.speechSynthesis;
  delete global.SpeechSynthesisUtterance;
});

describe("isSpeechSupported", () => {
  it("returns false when the browser has no speechSynthesis API", async () => {
    const { isSpeechSupported } = await import("./speech.js");
    expect(isSpeechSupported()).toBe(false);
  });

  it("returns true when speechSynthesis is available", async () => {
    setSpeechSynthesis([]);
    const { isSpeechSupported } = await import("./speech.js");
    expect(isSpeechSupported()).toBe(true);
  });
});

describe("speakItalian", () => {
  it("does nothing when speech isn't supported", async () => {
    const { speakItalian } = await import("./speech.js");
    expect(() => speakItalian("ciao")).not.toThrow();
  });

  it("speaks the given text in Italian", async () => {
    setSpeechSynthesis([]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("buongiorno");

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("buongiorno");
    expect(utterance.lang).toBe("it-IT");
    expect(utterance.rate).toBe(0.9);
  });

  it("resumes the queue defensively even when nothing is paused", async () => {
    setSpeechSynthesis([]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("buongiorno");

    expect(window.speechSynthesis.resume).toHaveBeenCalled();
  });

  it("does not cancel when the queue is idle", async () => {
    setSpeechSynthesis([], { speaking: false, pending: false });
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");

    expect(window.speechSynthesis.cancel).not.toHaveBeenCalled();
  });

  it("cancels the current utterance before speaking a new one", async () => {
    setSpeechSynthesis([], { speaking: true });
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it("selects an exact it-IT voice when one is available", async () => {
    const itVoice = { lang: "it-IT", name: "Alice" };
    setSpeechSynthesis([{ lang: "en-US", name: "Sam" }, itVoice]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");

    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(itVoice);
  });

  it("falls back to any voice whose lang starts with 'it' when no exact it-IT match exists", async () => {
    const itVoice = { lang: "it-CH", name: "Marco" };
    setSpeechSynthesis([{ lang: "en-US", name: "Sam" }, itVoice]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");

    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(itVoice);
  });

  it("leaves the voice unset when no Italian voice is available", async () => {
    setSpeechSynthesis([{ lang: "en-US", name: "Sam" }]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");

    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBeUndefined();
  });
});

// Chrome populates getVoices() asynchronously and fires onvoiceschanged when
// it's done. speech.js caches the chosen voice, so without this reset the
// first utterance of a session would pin "no Italian voice" forever.
describe("the voice cache", () => {
  it("re-picks a voice after the browser reports new ones", async () => {
    setSpeechSynthesis([]);
    const { speakItalian } = await import("./speech.js");

    // No Italian voice yet, so speakItalian leaves `voice` unset entirely.
    speakItalian("ciao");
    expect(window.speechSynthesis.speak.mock.calls[0][0].voice).toBeUndefined();

    // The voice list arrives late, as it does on a cold Chrome load.
    const itVoice = { lang: "it-IT", name: "Alice" };
    window.speechSynthesis.getVoices = vi.fn(() => [itVoice]);
    window.speechSynthesis.onvoiceschanged();

    speakItalian("ciao");
    expect(window.speechSynthesis.speak.mock.calls[1][0].voice).toBe(itVoice);
  });

  // getVoices() is not cheap in some browsers, and the answer doesn't change
  // between utterances — so it's looked up once and cached.
  it("looks the voice list up once and reuses it", async () => {
    setSpeechSynthesis([{ lang: "it-IT", name: "Alice" }]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("ciao");
    speakItalian("grazie");

    expect(window.speechSynthesis.getVoices).toHaveBeenCalledTimes(1);
  });

  it("registers the listener only when speech is supported", async () => {
    await import("./speech.js");
    expect(window.speechSynthesis).toBeUndefined();
  });
});

// iOS Safari treats the first speak() of a page like audio playback: an
// utterance started outside a user gesture is silently dropped, and so is
// every later one. Le Scene is the first place in this app where that bites,
// because the phases after the brief speak lines the learner did not press a
// speaker for — so the "Comincia" tap spends itself on an empty utterance.
describe("primeSpeech", () => {
  it("speaks one empty utterance, so the queue is unlocked and nothing is heard", async () => {
    setSpeechSynthesis([]);
    const { primeSpeech } = await import("./speech.js");

    primeSpeech();

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    // Empty rather than a space: some engines read a space as a short breath,
    // and the point of this utterance is to be inaudible.
    expect(window.speechSynthesis.speak.mock.calls[0][0].text).toBe("");
  });

  it("does nothing at all where there is no speech synthesis", async () => {
    const { primeSpeech } = await import("./speech.js");
    expect(() => primeSpeech()).not.toThrow();
  });
});
