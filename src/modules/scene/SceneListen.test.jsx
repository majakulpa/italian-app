import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SceneListen from "./SceneListen.jsx";
import { SCENES } from "../../data/scenes.js";
import * as speech from "../../shared/speech.js";

const verdura = SCENES[0];

beforeEach(() => {
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function show(props = {}) {
  const ref = { current: null };
  const user = userEvent.setup();
  render(<SceneListen scene={verdura} headingRef={ref} onDone={() => {}} {...props} />);
  return user;
}

describe("the model dialogue", () => {
  it("shows every line, in order, attributed to alternating speakers", () => {
    show();

    for (const line of verdura.model) {
      expect(screen.getByText(line.it)).toBeInTheDocument();
    }
    // Three vendor turns and three of the learner's own in this scene, and the
    // customer is labelled as the learner rather than as a third person.
    expect(screen.getAllByText("Il venditore")).toHaveLength(verdura.model.filter((l) => l.who === "vendor").length);
    expect(screen.getAllByText("Tu")).toHaveLength(verdura.model.filter((l) => l.who === "customer").length);
  });

  // Tap to reveal, the same pattern the flashcards and the dialogues use: the
  // English is not on screen until it is asked for, so the learner reads the
  // Italian first.
  it("hides each line's English until it is asked for", async () => {
    const user = show();
    const first = verdura.model[0];

    expect(screen.queryByText(first.en)).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Show translation" })[0]);
    expect(screen.getByText(first.en)).toBeInTheDocument();
  });

  it("pronounces a line through the shared speech helper", async () => {
    const user = show();

    await user.click(screen.getByRole("button", { name: `Pronounce "${verdura.model[0].it}"` }));
    expect(speech.speakItalian).toHaveBeenCalledWith(verdura.model[0].it);
  });

  // design/02-la-citta.html puts "▶ 0:14" beside the speaker's name, which
  // implies a recording. There is none: every line is browser speech
  // synthesis, read at whatever rate the learner's device chooses, so there is
  // no duration to print and printing one would promise an audio file that
  // does not exist.
  it("prints no recording duration", () => {
    show();

    expect(screen.queryByText(/0:\d\d/)).not.toBeInTheDocument();
  });
});

describe("the new words", () => {
  it("offers every one as a real button, closed to start with", () => {
    show();

    for (const word of verdura.newWords) {
      const button = screen.getByRole("button", { name: word.it });
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("opens a gloss with English, Polish and the note", async () => {
    const user = show();
    const maturo = verdura.newWords.find((word) => word.it === "maturo");

    await user.click(screen.getByRole("button", { name: "maturo" }));
    expect(screen.getByRole("button", { name: "maturo" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(new RegExp(maturo.en))).toBeInTheDocument();
    expect(screen.getByText(maturo.pl)).toBeInTheDocument();
    expect(screen.getByText(maturo.note)).toBeInTheDocument();
  });

  it("closes the gloss when its word is pressed again", async () => {
    const user = show();
    const maturo = verdura.newWords.find((word) => word.it === "maturo");

    await user.click(screen.getByRole("button", { name: "maturo" }));
    await user.click(screen.getByRole("button", { name: "maturo" }));
    expect(screen.queryByText(maturo.note)).not.toBeInTheDocument();
  });

  it("shows one gloss at a time", async () => {
    const user = show();
    const [first, second] = verdura.newWords;

    await user.click(screen.getByRole("button", { name: first.it }));
    await user.click(screen.getByRole("button", { name: second.it }));

    expect(screen.queryByText(first.note)).not.toBeInTheDocument();
    expect(screen.getByText(second.note)).toBeInTheDocument();
  });

  // The Italian notes are marked as Italian, which is the whole of WCAG 3.1.2
  // on this screen — axe cannot tell what language a string is in, so this is
  // asserted rather than scanned for.
  it("marks the Italian note as Italian", async () => {
    const user = show();
    const maturo = verdura.newWords.find((word) => word.it === "maturo");

    await user.click(screen.getByRole("button", { name: "maturo" }));
    expect(screen.getByText(maturo.note)).toHaveAttribute("lang", "it");
  });
});

describe("finishing the phase", () => {
  it("says what finishing here does before it is pressed", () => {
    show();

    expect(screen.getByText(new RegExp(`these ${verdura.newWords.length} words into`))).toBeInTheDocument();
  });

  it("hands back to the module", async () => {
    const onDone = vi.fn();
    const user = show({ onDone });

    await user.click(screen.getByRole("button", { name: /Ho capito/ }));
    expect(onDone).toHaveBeenCalled();
  });
});
