import { describe, it, expect, beforeEach, vi } from "vitest";

class MockUtterance {
  constructor(text) {
    this.text = text;
  }
}

function setSpeechSynthesis(voices) {
  window.speechSynthesis = {
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
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

  it("cancels any current speech and speaks the given text in Italian", async () => {
    setSpeechSynthesis([]);
    const { speakItalian } = await import("./speech.js");

    speakItalian("buongiorno");

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("buongiorno");
    expect(utterance.lang).toBe("it-IT");
    expect(utterance.rate).toBe(0.9);
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
