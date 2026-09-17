import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SceneRehearse from "./SceneRehearse.jsx";
import { SCENES } from "../../data/scenes.js";
import { LOCATED, judge } from "../../shared/locatedFeedback.js";
import { rehearsalQuestion } from "./scene.js";
import * as speech from "../../shared/speech.js";

const verdura = SCENES.find((scene) => scene.id === "verdura");
const salumiere = SCENES.find((scene) => scene.id === "salumiere");
const first = verdura.rehearsal[0];

beforeEach(() => {
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function show({ scene = verdura, banked = [], onDone = () => {} } = {}) {
  const ref = { current: null };
  const user = userEvent.setup();
  render(<SceneRehearse scene={scene} banked={banked} headingRef={ref} onDone={onDone} />);
  return user;
}

const box = () => screen.getByRole("textbox");
const check = () => screen.getByRole("button", { name: /Check/ });

describe("the grammar cards", () => {
  it("draws the slice with its examples and its note", () => {
    show();

    expect(screen.getByText(verdura.grammar.title)).toBeInTheDocument();
    expect(screen.getByText(verdura.grammar.note)).toBeInTheDocument();
    for (const example of verdura.grammar.examples) {
      expect(screen.getByText(example.it)).toBeInTheDocument();
      expect(screen.getByText(example.en)).toBeInTheDocument();
    }
  });

  // Design 04's own rule for the pink card: it "appears only where Polish
  // gives you a real hook". Scene 2 is `polish: null` on purpose, and drawing
  // an empty card there would break the promise the card makes by existing.
  it("draws the Polish card where the scene has one", () => {
    show();

    expect(screen.getByText(verdura.grammar.polish.pl)).toBeInTheDocument();
    expect(screen.getByText(verdura.grammar.polish.transfers)).toBeInTheDocument();
    expect(screen.getByText(verdura.grammar.polish.differs)).toBeInTheDocument();
  });

  it("draws no Polish card where the scene has none", () => {
    expect(salumiere.grammar.polish).toBeNull();
    show({ scene: salumiere });

    expect(screen.queryByText("Lo sai già")).not.toBeInTheDocument();
  });
});

describe("Dillo tu", () => {
  it("asks in English and takes the Italian", async () => {
    const user = show();

    expect(screen.getByLabelText(`“${first.en}”`)).toBe(box());
    await user.type(box(), first.answer);
    await user.click(check());

    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("walks every item and then hands back", async () => {
    const onDone = vi.fn();
    const user = show({ onDone });

    for (const item of verdura.rehearsal) {
      await user.type(box(), item.answer);
      await user.click(check());
      await user.click(screen.getByRole("button", { name: /Avanti|Sono pronta/ }));
    }
    expect(onDone).toHaveBeenCalled();
  });

  it("gives a second attempt, and puts focus back in the box", async () => {
    const user = show();

    await user.type(box(), "mezzo chilo di pomodor");
    await user.click(check());

    expect(screen.getByRole("button", { name: /Check again/ })).toBeInTheDocument();
    expect(box()).toHaveFocus();
    expect(box()).toHaveAttribute("aria-invalid", "true");
  });

  // A blank box is not an attempt — the same rule the rest of the app follows,
  // and it must not be marked wrong (WCAG 3.3.1).
  it("does not spend an attempt on an empty box", async () => {
    const user = show();

    await user.click(check());
    // Twice over: the verdict card, and the visually hidden live region that
    // says the same thing to a screen reader (see LiveStatus.jsx).
    expect(screen.getAllByText(LOCATED.blank)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /^Check/ })).toBeInTheDocument();
    expect(box()).not.toHaveAttribute("aria-invalid");
  });

  // "Show me" reveals the canonical accepted form, not whichever alternative
  // happens to be shortest — see nearest() in scene.js.
  it("shows the canonical answer on Show me", async () => {
    const user = show();

    await user.click(screen.getByRole("button", { name: "Show me" }));
    expect(screen.getAllByText(first.answer).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/The answer is/).length).toBeGreaterThan(0);
    // The shortest accepted form is the one nearest() would have picked if it
    // measured distance from an empty box, and it is not what is shown.
    const shortest = [...first.accepted].sort((a, b) => a.length - b.length)[0];
    expect(shortest).not.toBe(first.answer);
    expect(screen.queryByText(shortest)).not.toBeInTheDocument();
  });
});

// Plan S5, the three clauses, through the screen rather than through the
// helper.
describe("judging fairly", () => {
  it("accepts an authored alternative as exactly right", async () => {
    const etto = verdura.rehearsal.find((item) => item.id === "un-etto");
    const user = show();

    // Walk to the second item, which is the one with a real synonym.
    await user.type(box(), first.answer);
    await user.click(check());
    await user.click(screen.getByRole("button", { name: /Avanti/ }));

    await user.type(box(), "cento grammi di formaggio");
    await user.click(check());

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(etto.accepted).toContain("cento grammi di formaggio");
  });

  // An authored neighbour is another whole item — the wrong quantity, in
  // perfectly good Italian. The `neighbour` verdict would call it "another
  // word from the base vocabulary", which is false twice over, so it is
  // suppressed and the learner gets the located verdict instead.
  it("never tells the learner she reached for a different entry", async () => {
    const user = show();

    await user.type(box(), first.neighbours[0]);
    await user.click(check());

    expect(screen.queryByText(LOCATED.neighbour)).not.toBeInTheDocument();
    // `Un chilo di pomodori, per favore.` against `Mezzo chilo di pomodori,
    // per favore.`: nothing shared at the front, everything from `chilo`
    // onward shared at the back, so the located verdict is the one about the
    // ending agreeing and the front not.
    expect(screen.getAllByText(LOCATED.stem).length).toBeGreaterThan(0);
  });

  it("locates every authored neighbour without ever naming a different entry", async () => {
    for (const item of verdura.rehearsal) {
      for (const neighbour of item.neighbours) {
        const verdict = judge(rehearsalQuestion(item, neighbour), neighbour, 1);
        expect(verdict.kind, `${item.id} / ${neighbour}`).not.toBe("neighbour");
      }
    }
  });
});

describe("the +N banner", () => {
  it("says what finishing Ascolta banked", () => {
    show({ banked: ["scene:verdura:mezzo", "scene:verdura:chilo"] });

    expect(screen.getByText("+2", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/went into/)).toBeInTheDocument();
  });

  it("says nothing when nothing was written", () => {
    show({ banked: [] });

    expect(screen.queryByText(/went into/)).not.toBeInTheDocument();
  });
});

// The transcript is the same box the learner types in, which is what makes a
// recognition error fixable rather than fatal. Driven here through the box
// itself; the microphone's own wiring is tested in shared/Microphone.test.jsx.
describe("the answer box", () => {
  it("is editable up to the moment it is checked, and read-only after", async () => {
    const user = show();

    await user.type(box(), "mezz");
    await user.clear(box());
    await user.type(box(), first.answer);
    expect(box()).not.toHaveAttribute("readonly");

    await user.click(check());
    expect(box()).toHaveAttribute("readonly");
  });

  it("switches the microphone off once the item is settled", async () => {
    // jsdom has no SpeechRecognition, and without one the control renders its
    // "this browser cannot listen" note instead of a button — which is the
    // case the next test covers. Here the microphone has to exist.
    window.SpeechRecognition = class {
      start() {}
      stop() {}
    };
    const user = show();
    const mic = () => screen.getByRole("button", { name: /Talk/ });

    expect(mic()).not.toBeDisabled();
    await user.type(box(), first.answer);
    await user.click(check());
    expect(mic()).toBeDisabled();
    delete window.SpeechRecognition;
  });

  // Firefox has no recognition at all, and this phase has to stay fully
  // usable there: the note replaces the button, and the box still takes an
  // answer and still judges it.
  it("stays fully usable with no speech recognition at all", async () => {
    const user = show();

    expect(screen.queryByRole("button", { name: /Talk/ })).not.toBeInTheDocument();
    expect(screen.getByText(/This browser cannot listen/)).toBeInTheDocument();

    await user.type(box(), first.answer);
    await user.click(check());
    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });
});
