import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MercatoModule from "./MercatoModule.jsx";
import { STALLS } from "./stalls.js";
import { CONVERSATION_LEVELS } from "../../data/conversations.js";
import { SCENES } from "../../data/scenes.js";
import { saveProgress, conversationKey, sceneKey } from "../../shared/storage.js";

const a1 = CONVERSATION_LEVELS.find((level) => level.id === "A1");
const TOTAL_DIALOGUES = CONVERSATION_LEVELS.flatMap((level) => level.dialogues).length;
const TOTAL_SCENE_WORDS = SCENES.flatMap((scene) => scene.newWords).length;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Il Mercato", () => {
  it("names the district and draws both stalls", () => {
    render(<MercatoModule onExit={() => {}} />);

    expect(screen.getByRole("heading", { name: "Il Mercato" })).toBeInTheDocument();
    for (const stall of STALLS) {
      expect(screen.getByRole("button", { name: new RegExp(stall.name) })).toBeInTheDocument();
    }
  });

  // The hub is a front door, not a screen with content of its own, so what it
  // must get right is the counts — a stall badge that disagreed with the
  // module behind it would be the invented-figure mistake benches.js spends
  // its header on.
  it("counts scene words and dialogues out of storage", () => {
    render(<MercatoModule onExit={() => {}} />);

    expect(screen.getByRole("button", { name: /Scene/ })).toHaveTextContent(`0 / ${TOTAL_SCENE_WORDS} words`);
    expect(screen.getByRole("button", { name: /Dialoghi/ })).toHaveTextContent(`0 / ${TOTAL_DIALOGUES} dialogues`);
  });

  it("moves both badges when storage says so", () => {
    const scene = SCENES[0];
    saveProgress({
      words: {
        [conversationKey(a1, a1.dialogues[0])]: "done",
        [sceneKey(scene, scene.newWords[0])]: "known",
      },
      schedule: {},
    });
    render(<MercatoModule onExit={() => {}} />);

    expect(screen.getByRole("button", { name: /Scene/ })).toHaveTextContent(`1 / ${TOTAL_SCENE_WORDS} words`);
    expect(screen.getByRole("button", { name: /Dialoghi/ })).toHaveTextContent(`1 / ${TOTAL_DIALOGUES} dialogues`);
  });

  it("opens Le Scene and comes back to the market", async () => {
    const user = userEvent.setup();
    render(<MercatoModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Scene/ }));
    expect(screen.getByRole("heading", { name: "Le Scene" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Il Mercato/ }));
    expect(screen.getByRole("heading", { name: "Il Mercato" })).toBeInTheDocument();
  });

  // The dialogues are unchanged behind this door, which is the whole claim
  // made for making the district a hub rather than replacing them — and their
  // back link now says where it goes.
  it("opens the dialogues, whose back link names Il Mercato", async () => {
    const user = userEvent.setup();
    render(<MercatoModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Dialoghi/ }));
    expect(screen.getByText("Due parole")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Il Mercato/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /All modules/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Il Mercato/ }));
    expect(screen.getByRole("heading", { name: "Il Mercato" })).toBeInTheDocument();
  });

  // Meeting a word is not knowing it, and the badge counts knowing. So a
  // learner who has listened to a scene has words in La Piazza and a stall
  // badge still reading zero — which is the right answer and worth pinning,
  // because the tempting alternative is a badge that counts what has been met
  // and then claims the learner holds nineteen words she has never produced.
  it("does not credit a met word to the badge", async () => {
    const user = userEvent.setup();
    render(<MercatoModule onExit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Scene/ }));
    await user.click(screen.getByRole("button", { name: new RegExp(SCENES[0].title) }));
    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    await user.click(screen.getByRole("button", { name: /Ho capito/ }));
    await user.click(screen.getByRole("button", { name: /Le Scene/ }));
    await user.click(screen.getByRole("button", { name: /Il Mercato/ }));

    expect(screen.getByRole("button", { name: /Scene/ })).toHaveTextContent(`0 / ${TOTAL_SCENE_WORDS} words`);
  });

  it("leaves for the city from the back link", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<MercatoModule onExit={onExit} />);

    await user.click(screen.getByRole("button", { name: /La Città/ }));
    expect(onExit).toHaveBeenCalled();
  });
});
