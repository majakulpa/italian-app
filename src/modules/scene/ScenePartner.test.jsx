import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configure, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthenticationError, RateLimitError } from "@anthropic-ai/sdk";
import ScenePartner from "./ScenePartner.jsx";
import CasaModule from "../casa/CasaModule.jsx";
import ScenesModule from "./ScenesModule.jsx";
import { SCENES } from "../../data/scenes.js";
import { TURN_CEILING } from "../../shared/scenePartner.js";
import { abilityKey, loadProgress } from "../../shared/storage.js";
import { save as saveSceneKey, forget as forgetSceneKey } from "../../shared/partnerKey.js";
import { FAKE_KEY } from "../../test/fakeKey.js";
import { WRONG_PIN } from "../../shared/ScenePinPrompt.jsx";
import * as speech from "../../shared/speech.js";
import * as recognition from "../../shared/recognition.js";

// Phase 4 end to end, through the real components, with the Anthropic client
// injected. Nothing here opens a socket: `createClient` is the seam the module
// underneath already required, and these tests hand it a fake.
//
// The PIN is real. `saveSceneKey` runs the actual PBKDF2 derivation, so a test
// that unlocks pays for one — which is why the ones that do not need it start
// from an already-unlocked key, and why PIN is a short constant.

// Same reason ScenePinPrompt.test.jsx raises its own: a PBKDF2 derivation at
// 600,000 iterations is ~400 ms alone and several seconds when every other
// vitest worker is busy, and the tests below pay for up to three of them.
// The whole test, not just the async helpers, because the derivations happen
// inside `saveSceneKey` as well as inside the click.
configure({ asyncUtilTimeout: 15000 });
vi.setConfig({ testTimeout: 30000 });

const verdura = SCENES[0];
const PIN = "4821";

const USAGE = { input_tokens: 120, output_tokens: 30 };

function fakeStream(text, final = {}) {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text } };
    },
    finalMessage: async () => ({
      content: [{ type: "text", text }],
      stop_reason: "end_turn",
      usage: USAGE,
      ...final,
    }),
  };
}

function debriefBody(payload) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }], stop_reason: "end_turn", usage: USAGE };
}

// One client for a whole scene: every turn gets the same canned reply unless a
// queue is given, and the debrief gets whatever `debrief` says.
function client({ replies = [], reply = "Questi o quelli?", debrief = { saidWell: [], correction: null, goalMet: false } } = {}) {
  const calls = { stream: 0, create: 0 };

  return {
    calls,
    beta: {
      messages: {
        stream: () => {
          calls.stream += 1;
          const next = replies.shift();
          if (next instanceof Error) throw next;
          return next ?? fakeStream(reply);
        },
        create: async () => {
          calls.create += 1;
          if (debrief instanceof Error) throw debrief;
          return debriefBody(debrief);
        },
      },
    },
  };
}

function partner(props = {}) {
  const user = userEvent.setup();
  const utils = render(
    <ScenePartner
      scene={verdura}
      progress={loadProgress()}
      headingRef={{ current: null }}
      onCasa={() => {}}
      onLeave={() => {}}
      onDemonstrated={() => {}}
      createClient={() => client()}
      {...props}
    />,
  );
  return { user, ...utils };
}

const say = async (user, text) => {
  await user.clear(screen.getByRole("textbox"));
  await user.type(screen.getByRole("textbox"), text);
  await user.click(screen.getByRole("button", { name: /^Send/ }));
};

beforeEach(() => {
  localStorage.clear();
  forgetSceneKey();
  vi.spyOn(speech, "isSpeechSupported").mockReturnValue(true);
  vi.spyOn(speech, "speakItalian").mockImplementation(() => {});
  vi.spyOn(speech, "primeSpeech").mockImplementation(() => {});
  vi.spyOn(recognition, "isRecognitionSupported").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  forgetSceneKey();
});

describe("the door into phase 4", () => {
  it("says there is no key rather than faking a partner", () => {
    partner();

    expect(screen.getByText(/this device has no key for one/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("asks for the PIN when a key is stored but still locked", async () => {
    await saveSceneKey(FAKE_KEY, PIN);
    forgetSceneKey();

    partner();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
    // And nothing to talk into until it is unlocked.
    expect(screen.queryByRole("button", { name: /^Send/ })).not.toBeInTheDocument();
  });

  it("opens the conversation once the PIN is right, and keeps it shut when it is wrong", async () => {
    await saveSceneKey(FAKE_KEY, PIN);
    forgetSceneKey();
    const { user } = partner();

    await user.type(screen.getByLabelText("PIN"), "0000");
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    // Twice on screen: the live region hears it, the paragraph shows it.
    expect(await screen.findAllByText(WRONG_PIN)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^Send/ })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("PIN"), PIN);
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    expect(await screen.findByRole("button", { name: /^Send/ })).toBeInTheDocument();
  });

  it("skips the PIN when the key is already unlocked this run", async () => {
    // `save` leaves the key unlocked in memory, which is the state a learner
    // is in straight after setting it in Casa.
    await saveSceneKey(FAKE_KEY, PIN);
    partner();

    expect(screen.queryByLabelText("PIN")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Send/ })).toBeInTheDocument();
  });
});

describe("the conversation", () => {
  beforeEach(async () => {
    await saveSceneKey(FAKE_KEY, PIN);
  });

  it("opens on the scene's own line and prints the goal", () => {
    partner();

    expect(screen.getByText(verdura.task.opening.it)).toBeInTheDocument();
    expect(screen.getByText(verdura.task.goal.it)).toBeInTheDocument();
  });

  it("sends what is in the box and shows the reply", async () => {
    const { user } = partner({ createClient: () => client({ reply: "Questi sono maturi." }) });

    await say(user, "Mezzo chilo di pomodori.");

    expect(await screen.findByText("Questi sono maturi.")).toBeInTheDocument();
    expect(screen.getByText("Mezzo chilo di pomodori.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("speaks the reply", async () => {
    const { user } = partner({ createClient: () => client({ reply: "Ecco a Lei." }) });

    await say(user, "Grazie.");
    await waitFor(() => expect(speech.speakItalian).toHaveBeenCalledWith("Ecco a Lei."));
  });

  it("renders the reply as text, never as markup", async () => {
    const injected = '<img src=x onerror="alert(1)"> **grassetto**';
    const { user } = partner({ createClient: () => client({ reply: injected }) });

    await say(user, "Buongiorno.");

    const bubble = await screen.findByText(injected);
    // The characters are on screen and no element was built out of them.
    expect(bubble.querySelector("img")).toBeNull();
    expect(bubble.innerHTML).not.toContain("<img");
  });

  it("never sends an empty box", async () => {
    const fake = client();
    const { user } = partner({ createClient: () => fake });

    await user.click(screen.getByRole("button", { name: /^Send/ }));
    expect(fake.calls.stream).toBe(0);
  });

  it("types the Italian when there is no microphone, and says so", async () => {
    recognition.isRecognitionSupported.mockReturnValue(false);
    const { user } = partner({ createClient: () => client({ reply: "Va bene." }) });

    expect(screen.getByText(recognition.NO_RECOGNITION)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Talk/ })).not.toBeInTheDocument();

    await say(user, "Mezzo chilo.");
    expect(await screen.findByText("Va bene.")).toBeInTheDocument();
  });

  it("ends on the Ho finito button", async () => {
    const { user } = partner();

    await user.click(screen.getByRole("button", { name: "Ho finito" }));
    expect(await screen.findByText(/You ended the scene/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Send/ })).not.toBeInTheDocument();
  });

  it("ends when Ho finito is said into the box, without sending it", async () => {
    const fake = client();
    const { user } = partner({ createClient: () => fake });

    await say(user, "ho finito");
    expect(await screen.findByText(/You ended the scene/)).toBeInTheDocument();
    expect(fake.calls.stream).toBe(0);
  });

  it("ends at the turn ceiling, and calls it a cost ceiling", async () => {
    const { user } = partner();

    expect(screen.getByText(new RegExp(`${TURN_CEILING} of ${TURN_CEILING} turns left`))).toBeInTheDocument();
    expect(screen.getByText(/a ceiling on what the scene costs you, not a time limit/)).toBeInTheDocument();

    for (let turn = 0; turn < TURN_CEILING; turn += 1) {
      await say(user, `Turno ${turn}.`);
    }

    // The debrief, with no failure wording: nothing says she ran out.
    expect(await screen.findByText(/ten-turn ceiling/)).toBeInTheDocument();
    expect(screen.queryByText(/ran out|too long|too slow/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Send/ })).not.toBeInTheDocument();
  });
});

describe("when a turn does not get through", () => {
  beforeEach(async () => {
    await saveSceneKey(FAKE_KEY, PIN);
  });

  it("points at Casa when the key is turned down", async () => {
    const rejected = new AuthenticationError(401, {}, "no", new Headers());
    const { user } = partner({ createClient: () => client({ replies: [rejected] }) });

    await say(user, "Mezzo chilo.");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Set a working one in Casa/);
  });

  it("puts the words back in the box so the send button is the retry", async () => {
    const limited = new RateLimitError(429, {}, "slow", new Headers());
    const fake = client({ replies: [limited, fakeStream("Ecco.")] });
    const { user } = partner({ createClient: () => fake });

    await say(user, "Mezzo chilo di pomodori.");
    expect(await screen.findByRole("alert")).toHaveTextContent(/send them again/);
    expect(screen.getByRole("textbox")).toHaveValue("Mezzo chilo di pomodori.");
    // The turn was rolled back, so it is not in the transcript twice after.
    await user.click(screen.getByRole("button", { name: /^Send/ }));
    expect(await screen.findByText("Ecco.")).toBeInTheDocument();
    expect(screen.getAllByText("Mezzo chilo di pomodori.")).toHaveLength(1);
  });

  it("says the partner could not continue, plainly, on a refusal", async () => {
    const refused = fakeStream("Non ", { stop_reason: "refusal" });
    const { user } = partner({ createClient: () => client({ replies: [refused] }) });

    await say(user, "Qualcosa.");
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not continue this scene/);
    // The partial the model declined to finish is not left on screen.
    expect(screen.queryByText("Non")).not.toBeInTheDocument();
  });
});

describe("the debrief", () => {
  beforeEach(async () => {
    await saveSceneKey(FAKE_KEY, PIN);
  });

  const toDebrief = async (props) => {
    const rendered = partner(props);
    await rendered.user.click(screen.getByRole("button", { name: "Ho finito" }));
    return rendered;
  };

  it("drops a phrase the learner never said, and draws no score at all", async () => {
    const clitic = verdura.correctables.find((c) => c.stage === null);
    await toDebrief({
      createClient: () =>
        client({
          debrief: {
            saidWell: [{ phrase: "mezzo chilo di pomodori", why: "quantita" }],
            correction: { correctableId: clitic.id },
            goalMet: true,
          },
        }),
    });

    // She ended the scene without saying anything, so the praise is a recast
    // and never reaches the screen. The correction does: it is named by id
    // out of the scene's own data, not quoted out of her words.
    expect(await screen.findByText(verdura.ability.it)).toBeInTheDocument();
    expect(screen.queryByText("mezzo chilo di pomodori")).not.toBeInTheDocument();
    expect(screen.getByText(clitic.better)).toBeInTheDocument();
    expect(screen.queryByText(/score|punteggio|out of|\d+%/i)).not.toBeInTheDocument();
  });

  it("says nothing to single out when both halves come back empty", async () => {
    await toDebrief({ createClient: () => client({ debrief: { saidWell: [], correction: null, goalMet: true } }) });

    expect(await screen.findByText(/Nothing to single out either way/)).toBeInTheDocument();
  });

  it("keeps a phrase she really said, and the correction the data allows", async () => {
    const clitic = verdura.correctables.find((c) => c.stage === null);
    const { user } = partner({
      createClient: () =>
        client({
          reply: "Certo.",
          debrief: {
            saidWell: [{ phrase: "mezzo chilo di pomodori", why: "quantita" }],
            correction: { correctableId: clitic.id },
            goalMet: true,
          },
        }),
    });

    await say(user, "Mezzo chilo di pomodori, per favore.");
    await screen.findByText("Certo.");
    await user.click(screen.getByRole("button", { name: "Ho finito" }));

    expect(await screen.findByText("mezzo chilo di pomodori")).toBeInTheDocument();
    expect(screen.getByText("Quantity, then di, and no article — that is the pattern.")).toBeInTheDocument();
    expect(screen.getByText(clitic.better)).toBeInTheDocument();
    expect(screen.getByText(clitic.why)).toBeInTheDocument();
  });

  it("refuses the design's district unlock", async () => {
    await toDebrief({ createClient: () => client({ debrief: { saidWell: [], correction: null, goalMet: true } }) });

    await screen.findByText(verdura.ability.it);
    expect(screen.queryByText(/Stazione/)).not.toBeInTheDocument();
    expect(screen.queryByText(/aperta/)).not.toBeInTheDocument();
  });

  it("does not claim the words again — Ascolta banked them", async () => {
    await toDebrief({ createClient: () => client({ debrief: { saidWell: [], correction: null, goalMet: true } }) });

    await screen.findByText(verdura.ability.it);
    expect(screen.queryByText(/parole → Piazza|parole&nbsp;→/)).not.toBeInTheDocument();
  });

  it("shows what the scene cost, measured off the responses", async () => {
    const { user } = partner({ createClient: () => client({ reply: "Sì." }) });

    await say(user, "Mezzo chilo.");
    await screen.findByText("Sì.");
    await user.click(screen.getByRole("button", { name: "Ho finito" }));

    // Two calls: the turn and the debrief. 120 in + 30 out each.
    const line = await screen.findByText(/This scene cost/);
    expect(line).toHaveTextContent("300 tokens over 2 calls");
    expect(line).toHaveTextContent(`$${(2 * ((120 * 5 + 30 * 25) / 1e6)).toFixed(4)}`);
  });

  it("says the write-up is missing rather than drawing an empty one", async () => {
    await toDebrief({ createClient: () => client({ debrief: new RateLimitError(429, {}, "slow", new Headers()) }) });

    expect(await screen.findByRole("alert")).toHaveTextContent(/debrief did not come back/);
  });

  it("names Casa when the key is what failed", async () => {
    await toDebrief({
      createClient: () => client({ debrief: new AuthenticationError(401, {}, "no", new Headers()) }),
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/set a working key in Casa/);
  });

  // The effect that asks for the debrief spends real money, and StrictMode
  // double-invokes effects in development — main.jsx wraps the app in it. So
  // the guard is exercised the way the app exercises it.
  it("asks once, even under StrictMode", async () => {
    const fake = client({ debrief: { saidWell: [], correction: null, goalMet: false } });
    const user = userEvent.setup();
    render(
      <React.StrictMode>
        <ScenePartner
          scene={verdura}
          progress={loadProgress()}
          headingRef={{ current: null }}
          onCasa={() => {}}
          onLeave={() => {}}
          onDemonstrated={() => {}}
          createClient={() => fake}
        />
      </React.StrictMode>,
    );

    await user.click(screen.getByRole("button", { name: "Ho finito" }));
    await screen.findByText(/You ended the scene/);
    expect(fake.calls.create).toBe(1);
  });

  it("records the can-do only when the goal was met", async () => {
    const met = vi.fn();
    const { user } = partner({
      createClient: () => client({ debrief: { saidWell: [], correction: null, goalMet: false } }),
      onDemonstrated: met,
    });

    await user.click(screen.getByRole("button", { name: "Ho finito" }));
    await screen.findByText(/not get all the way there/);
    expect(met).not.toHaveBeenCalled();
  });
});

// The whole way through, because the can-do is written by ScenesModule and
// read by Casa, and neither would notice if the key they agreed on drifted.
describe("a can-do, from the scene to Casa", () => {
  it("is written on goalMet and drawn on the shelf", async () => {
    await saveSceneKey(FAKE_KEY, PIN);
    const user = userEvent.setup();
    const fake = client({ debrief: { saidWell: [], correction: null, goalMet: true } });

    const { unmount } = render(
      <ScenesModule onExit={() => {}} exitLabel="Il Mercato" onCasa={() => {}} createClient={() => fake} />,
    );

    await user.click(screen.getByRole("button", { name: new RegExp(verdura.title) }));
    await user.click(screen.getByRole("button", { name: /Comincia/ }));
    await user.click(screen.getByRole("button", { name: /Ho capito/ }));
    for (const item of verdura.rehearsal) {
      await user.type(screen.getByRole("textbox"), item.answer);
      await user.click(screen.getByRole("button", { name: /Check/ }));
      await user.click(screen.getByRole("button", { name: /Avanti|Sono pronta/ }));
    }
    await user.click(screen.getByRole("button", { name: "Ho finito" }));
    await screen.findByText(verdura.ability.it);

    expect(loadProgress().words[abilityKey(verdura)]).toBe("done");

    unmount();
    render(<CasaModule />);
    expect(screen.getByRole("heading", { name: "Posso…" })).toBeInTheDocument();
    expect(screen.getByText(verdura.ability.it)).toBeInTheDocument();
    expect(screen.getByText(verdura.ability.en)).toBeInTheDocument();
  });

  it("says what a Posso is when there are none, rather than drawing a nought", () => {
    render(<CasaModule />);

    const shelf = screen.getByRole("region", { name: "Posso…" });
    expect(shelf).toHaveTextContent(/is a thing you have done, not a thing you have read/);
    expect(within(shelf).queryByText("0")).not.toBeInTheDocument();
  });
});
