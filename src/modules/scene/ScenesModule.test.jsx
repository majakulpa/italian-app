import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScenesModule from "./ScenesModule.jsx";
import { SCENES } from "../../data/scenes.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { loadProgress, saveProgress, sceneKey, riservaKey, stageEvidenceKey } from "../../shared/storage.js";
import { reviewItem, dueCount } from "../../shared/srs.js";
import * as speech from "../../shared/speech.js";

const verdura = SCENES[0];
const EXIT = <span lang="it">Il Mercato</span>;

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
  vi.spyOn(speech, "primeSpeech").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function open(props = {}) {
  const user = userEvent.setup();
  render(<ScenesModule onExit={() => {}} exitLabel={EXIT} onCasa={() => {}} {...props} />);
  return user;
}

const begin = async (user, scene = verdura) => {
  await user.click(screen.getByRole("button", { name: new RegExp(scene.title) }));
};

// Answering every rehearsal item right, which is how Prova is left.
async function finishRehearsal(user) {
  for (const item of verdura.rehearsal) {
    await user.type(screen.getByRole("textbox"), item.answer);
    await user.click(screen.getByRole("button", { name: /Check/ }));
    await user.click(screen.getByRole("button", { name: /Avanti|Sono pronta/ }));
  }
}

// The brief → Ascolta → Prova → the stand-in, which is the walk every other
// test in this file starts from.
async function walkTo(user, phase) {
  await begin(user);
  if (phase === "brief") return;
  await user.click(screen.getByRole("button", { name: /Comincia/ }));
  if (phase === "listen") return;
  await user.click(screen.getByRole("button", { name: /Ho capito/ }));
  if (phase === "rehearse") return;
  await finishRehearsal(user);
}

describe("the list of scenes", () => {
  it("names every scene that ships, with what it makes you able to do", () => {
    open();

    expect(screen.getByRole("heading", { name: "Le Scene" })).toBeInTheDocument();
    for (const scene of SCENES) {
      const card = screen.getByRole("button", { name: new RegExp(scene.title) });
      expect(card).toHaveTextContent(scene.ability.en);
      expect(card).toHaveTextContent(`${scene.newWords.length} new words`);
    }
  });

  // The same real figure the brief shows, from the same function — a card and
  // the screen behind it disagreeing about how many words the learner knows
  // would be the design's drawn 14 arriving by two different routes.
  it("shows the learner's real known-word count on the card", () => {
    const rank = verdura.knownRanks[0];
    const entry = FONDAMENTALE.find((candidate) => candidate.rank === rank);
    const key = riservaKey(entry);
    saveProgress(reviewItem(reviewItem({ words: {}, schedule: {} }, key, true), key, true));

    open();
    expect(screen.getByRole("button", { name: new RegExp(verdura.title) })).toHaveTextContent(
      `1 of ${verdura.knownRanks.length} everyday ones`,
    );
  });

  it("leaves for the hub from the back link", async () => {
    const onExit = vi.fn();
    const user = open({ onExit });

    await user.click(screen.getByRole("button", { name: /Il Mercato/ }));
    expect(onExit).toHaveBeenCalled();
  });
});

describe("the four phases", () => {
  it("walks the brief, Ascolta and Prova, and ends on the stand-in", async () => {
    const user = open();

    await begin(user);
    expect(screen.getByRole("heading", { level: 1, name: verdura.title })).toBeInTheDocument();
    expect(screen.getByText(/Phase 1 of 4/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Ascolta" })).toBeInTheDocument();
    expect(screen.getByText(/Phase 2 of 4/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ho capito/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Prova" })).toBeInTheDocument();
    expect(screen.getByText(/Phase 3 of 4/)).toBeInTheDocument();

    await finishRehearsal(user);
    expect(screen.getByRole("heading", { level: 1, name: "Al mercato" })).toBeInTheDocument();
    expect(screen.getByText(/Phase 4 of 4/)).toBeInTheDocument();
  });

  // Every phase replaces the whole screen, so the button that was pressed
  // unmounts. Left alone that drops focus to the body: the next Tab starts
  // from the top of the document and a screen reader announces nothing about
  // having arrived somewhere.
  it("moves focus onto the new phase's heading each time", async () => {
    const user = open();

    await begin(user);
    expect(screen.getByRole("heading", { level: 1, name: verdura.title })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Ascolta" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /Ho capito/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Prova" })).toHaveFocus();
  });

  it("goes back to the list from inside a scene, and starts the next one at its brief", async () => {
    const user = open();

    await walkTo(user, "listen");
    await user.click(screen.getByRole("button", { name: /Le Scene/ }));
    expect(screen.getByRole("heading", { name: "Le Scene" })).toBeInTheDocument();

    await begin(user, SCENES[1]);
    expect(screen.getByText(/Phase 1 of 4/)).toBeInTheDocument();
  });
});

describe("the word write on finishing Ascolta", () => {
  it("writes exactly the scene's words, as learning due tomorrow", async () => {
    const user = open();
    await walkTo(user, "rehearse");

    const progress = loadProgress();
    for (const word of verdura.newWords) {
      const key = sceneKey(verdura, word);
      expect(progress.words[key], key).toBe("learning");
      expect(progress.schedule[key].box, key).toBe(1);
    }
  });

  // The design's "+N parole → Piazza", checked as the thing it claims rather
  // than as a label: the keys are in the queue, one day out.
  it("puts them in the La Piazza queue, from tomorrow", async () => {
    const user = open();
    await walkTo(user, "rehearse");

    const progress = loadProgress();
    const tomorrow = progress.schedule[sceneKey(verdura, verdura.newWords[0])].due;
    expect(dueCount(progress, tomorrow)).toBe(verdura.newWords.length);
  });

  it("stamps no stage-evidence marker on a word key", async () => {
    const user = open();
    await walkTo(user, "rehearse");

    const progress = loadProgress();
    for (const word of verdura.newWords) {
      expect(progress.words[stageEvidenceKey(sceneKey(verdura, word))]).toBeUndefined();
    }
  });

  it("writes nothing before Ascolta is finished", async () => {
    const user = open();
    await walkTo(user, "listen");

    expect(Object.keys(loadProgress().words)).toEqual([]);
  });

  it("counts only the keys it wrote in the +N banner", async () => {
    const user = open();
    await walkTo(user, "rehearse");

    expect(screen.getByText(`+${verdura.newWords.length}`, { exact: false })).toBeInTheDocument();
  });

  // The second run banks nothing, so the banner must not appear at all — a
  // "+6 parole" on every replay is the design's drawn figure arriving by the
  // back door.
  it("shows no banner on a scene heard before", async () => {
    const user = open();
    await walkTo(user, "rehearse");
    await user.click(screen.getByRole("button", { name: /Le Scene/ }));
    await walkTo(user, "rehearse");

    expect(screen.queryByText(/went into/)).not.toBeInTheDocument();
  });
});

describe("phase 4, with no scene partner", () => {
  it("says plainly what is missing, and offers no scripted stand-in", async () => {
    const user = open();
    await walkTo(user, "task");

    expect(screen.getByText(/needs a scene partner, and there isn’t one yet/)).toBeInTheDocument();
    expect(screen.getByText(/no practice version standing in for it/)).toBeInTheDocument();
    // Nothing to talk to: no text box, no microphone, no send.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("still shows what the phase will ask for", async () => {
    const user = open();
    await walkTo(user, "task");

    expect(screen.getByText(verdura.task.goal.it)).toBeInTheDocument();
    expect(screen.getByText(verdura.task.goal.en)).toBeInTheDocument();
  });

  it("opens Casa, which is where the key will go", async () => {
    const onCasa = vi.fn();
    const user = open({ onCasa });
    await walkTo(user, "task");

    await user.click(screen.getByRole("button", { name: /Open Casa/ }));
    expect(onCasa).toHaveBeenCalled();
  });

  it("goes back to the list", async () => {
    const user = open();
    await walkTo(user, "task");

    await user.click(screen.getByRole("button", { name: "Back to the scenes" }));
    expect(screen.getByRole("heading", { name: "Le Scene" })).toBeInTheDocument();
  });
});

// iOS drops any utterance started outside a user gesture, and the phases after
// the brief speak lines the learner did not press a speaker for. "Comincia" is
// the first gesture inside a scene, so it is where the queue gets unlocked.
describe("speech priming", () => {
  it("primes synthesis on the Comincia tap, and not before", async () => {
    const user = open();

    await begin(user);
    expect(speech.primeSpeech).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    expect(speech.primeSpeech).toHaveBeenCalled();
  });
});
