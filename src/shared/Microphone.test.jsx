import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Microphone from "./Microphone.jsx";
import { NO_RECOGNITION } from "./recognition.js";

let latest;

class FakeRecognition {
  constructor() {
    this.stopped = 0;
    latest = this;
  }

  start() {}

  stop() {
    this.stopped += 1;
    this.onend();
  }
}

const mic = () => screen.getByRole("button", { name: /Talk|Listening/ });
const modeSwitch = () => screen.getByRole("button", { name: /Switch to/ });

// userEvent's pointer API, driven directly: the hold gesture is
// pointerdown → pointerup, and the interesting failures are the endings that
// are not pointerup.
const down = (user) => user.pointer({ keys: "[MouseLeft>]", target: mic() });

beforeEach(() => {
  latest = undefined;
  window.SpeechRecognition = FakeRecognition;
});

afterEach(() => {
  delete window.SpeechRecognition;
  vi.restoreAllMocks();
});

describe("with no recognition in the browser", () => {
  it("replaces the button with a sentence, and never a dead control", () => {
    delete window.SpeechRecognition;
    render(<Microphone onTranscript={() => {}} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(NO_RECOGNITION)).toBeInTheDocument();
  });
});

describe("hold to talk", () => {
  it("starts on the press and stops on the release", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    expect(latest).toBeDefined();
    expect(mic()).toHaveTextContent(/Listening/);

    await user.pointer({ keys: "[/MouseLeft]", target: mic() });
    expect(latest.stopped).toBe(1);
    expect(mic()).toHaveTextContent(/Talk/);
  });

  it("writes what it hears to the caller, and nowhere else", async () => {
    const user = userEvent.setup();
    const onTranscript = vi.fn();
    render(<Microphone onTranscript={onTranscript} />);

    await down(user);
    act(() => latest.onresult({ results: [[{ transcript: "mezzo chilo di pomodori" }]] }));

    expect(onTranscript).toHaveBeenCalledWith("mezzo chilo di pomodori");
    // The control owns no field: the transcript's only destination is the
    // caller's own box, which is what makes it editable before it is judged.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  // A held press ends in pointerup only when nothing interrupts it. Scroll,
  // take a call, or have the browser decide the gesture was a pan, and the
  // last event is pointercancel — with no pointerup behind it. Without this
  // the microphone stays open until a silence timeout.
  it("closes the microphone on pointercancel", async () => {
    render(<Microphone onTranscript={() => {}} />);

    const user = userEvent.setup();
    await down(user);
    mic().dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));

    expect(latest.stopped).toBe(1);
  });

  // Same class of failure: a finger that slides off the button never delivers
  // pointerup to it.
  it("closes the microphone when the finger slides off", async () => {
    render(<Microphone onTranscript={() => {}} />);

    const user = userEvent.setup();
    await user.pointer([{ keys: "[MouseLeft>]", target: mic() }, { target: document.body }]);

    expect(latest.stopped).toBe(1);
  });

  it("does not start a second recogniser while one is running", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    const running = latest;
    mic().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(latest).toBe(running);
  });

  // Hold is a press-and-hold with no keyboard equivalent, so on its own it is
  // a WCAG 2.1.1 failure. In hold mode a keyboard activation deliberately does
  // nothing — the escape hatch is the mode switch beside it, which is a real
  // button one Tab away.
  it("is a no-op from the keyboard, which is why the mode switch exists", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    mic().focus();
    await user.keyboard("{Enter}");
    expect(latest).toBeUndefined();
    expect(modeSwitch()).toBeInTheDocument();
  });
});

describe("tap to toggle", () => {
  it("switches mode, and says which mode it would switch to next", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    expect(modeSwitch()).toHaveAccessibleName("Switch to tap to talk");
    await user.click(modeSwitch());
    expect(modeSwitch()).toHaveAccessibleName("Switch to hold to talk");
    expect(screen.getByText(/Works from the keyboard/)).toBeInTheDocument();

    // And back, because the switch is a switch rather than a one-way door: a
    // learner who tries tap-to-toggle on a phone and prefers holding has to be
    // able to go back to the design's own gesture.
    await user.click(modeSwitch());
    expect(modeSwitch()).toHaveAccessibleName("Switch to tap to talk");
    expect(screen.getByText(/Hold the button while you talk/)).toBeInTheDocument();
    expect(mic()).not.toHaveAttribute("aria-pressed");
  });

  it("starts and stops from the keyboard alone (SC 2.1.1)", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await user.click(modeSwitch());

    mic().focus();
    await user.keyboard("{Enter}");
    expect(latest).toBeDefined();
    expect(mic()).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Enter}");
    expect(latest.stopped).toBe(1);
    expect(mic()).toHaveAttribute("aria-pressed", "false");
  });

  it("does not start on a press in toggle mode, only on the click", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);
    await user.click(modeSwitch());

    mic().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(latest).toBeUndefined();
  });

  // In hold mode `aria-pressed` is deliberately absent: the button is not a
  // toggle there, it is a momentary control, and claiming a pressed state
  // would tell a screen reader it can be left on.
  it("carries no pressed state in hold mode", () => {
    render(<Microphone onTranscript={() => {}} />);
    expect(mic()).not.toHaveAttribute("aria-pressed");
  });
});

describe("listening is never signalled by colour alone", () => {
  it("changes the word on the button as well as its fill", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    expect(mic()).toHaveTextContent(/Talk/);
    await down(user);
    expect(mic()).toHaveTextContent(/Listening/);
  });

  it("announces listening to a screen reader", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    expect(screen.getByRole("status")).toHaveTextContent("Listening.");
  });
});

describe("errors", () => {
  it("tells a permission refusal apart from silence", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    act(() => latest.onerror({ error: "not-allowed" }));
    expect(screen.getAllByText(/did not give this page the microphone/).length).toBeGreaterThan(0);
  });

  it("says something useful about every other error", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    act(() => latest.onerror({ error: "no-speech" }));
    expect(screen.getAllByText(/Nothing came through that time/).length).toBeGreaterThan(0);
  });

  it("clears the last error when the learner tries again", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} />);

    await down(user);
    act(() => latest.onerror({ error: "no-speech" }));
    await user.pointer({ keys: "[/MouseLeft]", target: mic() });
    await down(user);

    expect(screen.queryByText(/Nothing came through that time/)).not.toBeInTheDocument();
  });
});

describe("unmounting mid-press", () => {
  // A phase that advances while the learner is still holding the button would
  // otherwise unmount the only reference to the stop function, leaving the
  // microphone open.
  it("closes the microphone when the screen goes away", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Microphone onTranscript={() => {}} />);

    await down(user);
    unmount();
    expect(latest.stopped).toBe(1);
  });
});

describe("disabled", () => {
  it("cannot be held once the caller switches it off", async () => {
    const user = userEvent.setup();
    render(<Microphone onTranscript={() => {}} disabled />);

    expect(mic()).toBeDisabled();
    await down(user);
    expect(latest).toBeUndefined();
  });
});
