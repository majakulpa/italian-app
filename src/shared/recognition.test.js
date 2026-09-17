import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isRecognitionSupported, startListening, NO_RECOGNITION } from "./recognition.js";

// A stand-in for the browser's SpeechRecognition, which jsdom does not have.
// It records what was configured on it and hands back the last instance, so a
// test can fire the events the real API fires.
let latest;

class FakeRecognition {
  constructor() {
    this.started = 0;
    this.stopped = 0;
    latest = this;
  }

  start() {
    this.started += 1;
  }

  stop() {
    this.stopped += 1;
  }
}

// The shape a real `result` event has: a list of results, each a list of
// alternatives, each with a transcript.
function resultEvent(...transcripts) {
  return { results: transcripts.map((transcript) => [{ transcript }]) };
}

beforeEach(() => {
  latest = undefined;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

afterEach(() => {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  vi.restoreAllMocks();
});

describe("isRecognitionSupported", () => {
  // Firefox, which is the whole reason there is a typed-only path.
  it("is false when the browser has neither name for it", () => {
    expect(isRecognitionSupported()).toBe(false);
  });

  it("is true on the standard name", () => {
    window.SpeechRecognition = FakeRecognition;
    expect(isRecognitionSupported()).toBe(true);
  });

  it("is true on Safari's prefixed name", () => {
    window.webkitSpeechRecognition = FakeRecognition;
    expect(isRecognitionSupported()).toBe(true);
  });
});

describe("NO_RECOGNITION", () => {
  // The sentence has one job beyond naming the problem: telling the learner
  // that nothing here needs the microphone. Without that she cannot tell
  // whether she has lost a feature or a convenience.
  it("says typing works and names Firefox", () => {
    expect(NO_RECOGNITION).toMatch(/Firefox/);
    expect(NO_RECOGNITION).toMatch(/[Tt]ype the Italian/);
  });
});

describe("startListening", () => {
  beforeEach(() => {
    window.SpeechRecognition = FakeRecognition;
  });

  it("returns null and starts nothing where there is no recogniser", () => {
    delete window.SpeechRecognition;
    expect(startListening({ onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() })).toBeNull();
  });

  it("listens in Italian, one utterance at a time", () => {
    startListening({ onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });

    expect(latest.lang).toBe("it-IT");
    expect(latest.continuous).toBe(false);
    expect(latest.interimResults).toBe(true);
    expect(latest.started).toBe(1);
  });

  // The refusal, as a property of the request rather than a promise in a
  // comment: one alternative is asked for, so there is nothing to rank and no
  // confidence to paint a "🎙 chiaro ✓" badge from.
  it("asks for one alternative, so there is nothing to grade pronunciation with", () => {
    startListening({ onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });

    expect(latest.maxAlternatives).toBe(1);
  });

  it("reports the whole transcript so far on every result", () => {
    const onTranscript = vi.fn();
    startListening({ onTranscript, onEnd: vi.fn(), onError: vi.fn() });

    latest.onresult(resultEvent("mezzo"));
    latest.onresult(resultEvent("mezzo chilo", "di pomodori"));

    expect(onTranscript).toHaveBeenNthCalledWith(1, "mezzo");
    expect(onTranscript).toHaveBeenNthCalledWith(2, "mezzo chilo di pomodori");
  });

  it("trims and collapses the whitespace the engine leaves in", () => {
    const onTranscript = vi.fn();
    startListening({ onTranscript, onEnd: vi.fn(), onError: vi.fn() });

    latest.onresult(resultEvent("  un etto ", " di   formaggio "));
    expect(onTranscript).toHaveBeenCalledWith("un etto di formaggio");
  });

  it("passes the API's own error string through, and still ends", () => {
    const onEnd = vi.fn();
    const onError = vi.fn();
    startListening({ onTranscript: vi.fn(), onEnd, onError });

    latest.onerror({ error: "not-allowed" });
    latest.onend();

    expect(onError).toHaveBeenCalledWith("not-allowed");
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("stops the recogniser when the returned stop is called", () => {
    const stop = startListening({ onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });

    stop();
    expect(latest.stopped).toBe(1);
  });

  // The pointercancel case, at this level: one press can deliver a
  // pointerleave and then a pointerup, or a pointercancel and then nothing,
  // and stop() on an instance that has already ended throws on some engines.
  it("ignores a second stop from the same gesture", () => {
    const stop = startListening({ onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });

    stop();
    stop();
    stop();
    expect(latest.stopped).toBe(1);
  });
});
