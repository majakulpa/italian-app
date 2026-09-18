import { describe, it, expect } from "vitest";
import Anthropic, {
  AuthenticationError,
  APIConnectionError,
  BadRequestError,
  PermissionDeniedError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import {
  PARTNER_MODEL,
  PRAISE_REASONS,
  TURN_CEILING,
  classifyError,
  costOf,
  debriefSchema,
  filterDebrief,
  openScene,
  partnerClient,
  systemPrompt,
} from "./scenePartner.js";
import { SCENES } from "../data/scenes.js";
import { markStageProduced, drillKey } from "./storage.js";
import { GRAMMAR_LEVELS } from "../data/grammar.js";
import { formStage } from "./stage.js";
import { FAKE_KEY } from "../test/fakeKey.js";

// The partner module, against an injected fake client. Nothing here opens a
// socket: `openScene` takes the client, and every test below hands it an
// object that records the request it was given and replays a canned answer.
//
// What is checked, in the order the plan asks for it: the request shape
// (model, effort, cache control, fallbacks, and that the system prompt is
// frozen across turns), streaming, refusal, each error class, the cost
// arithmetic, and then the four debrief filters one at a time.

const verdura = SCENES[0];
const empty = { version: 2, words: {}, schedule: {} };

const USAGE = { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

// A stream the SDK would give back: an async iterable of events, plus
// finalMessage(). Only the two event shapes the module reads are produced,
// plus one it must ignore.
function fakeStream(chunks, final) {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "message_start" };
      yield { type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "ignored" } };
      for (const chunk of chunks) {
        yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: chunk } };
      }
      yield { type: "message_stop" };
    },
    finalMessage: async () => final,
  };
}

function reply(text, extra = {}) {
  return {
    content: [
      { type: "thinking", thinking: "" },
      { type: "text", text },
    ],
    stop_reason: "end_turn",
    usage: USAGE,
    ...extra,
  };
}

// The fake client. `streams` and `creates` are queues of either a value to
// return or an Error to throw; `requests` is what it was asked for.
function fakeClient({ streams = [], creates = [] } = {}) {
  const requests = [];

  const next = (queue, request) => {
    requests.push(request);
    const item = queue.shift();
    if (item instanceof Error) throw item;
    return item;
  };

  return {
    requests,
    beta: {
      messages: {
        stream: (request) => next(streams, request),
        create: async (request) => next(creates, request),
      },
    },
  };
}

const scene = ({ streams, creates, progress = empty } = {}) =>
  openScene({
    client: fakeClient({ streams, creates }),
    scene: verdura,
    progress,
    stageName: "presente",
    knownWords: ["pomodoro", "mezzo"],
  });

describe("the frozen system prompt", () => {
  it("names the role, the goal, the stage and the scene's words", () => {
    const text = systemPrompt({ scene: verdura, stageName: "presente", knownWords: ["pomodoro"] });

    expect(text).toContain(verdura.task.partner.it);
    expect(text).toContain(verdura.task.goal.en);
    expect(text).toContain(verdura.task.opening.it);
    expect(text).toContain("stage 1, presente");
    for (const word of verdura.newWords) expect(text).toContain(word.it);
    expect(text).toContain("She also already knows: pomodoro.");
  });

  it("says so plainly when the learner knows nothing yet, rather than an empty list", () => {
    const text = systemPrompt({ scene: verdura, stageName: "presente", knownWords: [] });

    expect(text).toContain("She knows very little else yet");
    expect(text).not.toContain("She also already knows");
  });

  it("tells the partner never to correct mid-scene", () => {
    const text = systemPrompt({ scene: verdura, stageName: "presente", knownWords: [] });

    expect(text).toContain("Never correct her Italian");
  });
});

describe("one learner turn", () => {
  it("sends the model, the effort, the cached system block and the fallback, and streams the reply", async () => {
    const partner = scene({ streams: [fakeStream(["Questi ", "o quelli?"], reply("Questi o quelli?"))] });

    const seen = [];
    const result = await partner.say("Mezzo chilo di pomodori.", (delta) => seen.push(delta));

    expect(result).toEqual({ ok: true, text: "Questi o quelli?" });
    expect(seen).toEqual(["Questi ", "o quelli?"]);
    expect(partner.turns()).toBe(1);
  });

  it("builds the request the skill's Opus 5 shape calls for", async () => {
    const client = fakeClient({ streams: [fakeStream(["Ecco."], reply("Ecco."))] });
    const partner = openScene({ client, scene: verdura, progress: empty, stageName: "presente", knownWords: [] });

    await partner.say("Buongiorno.", () => {});
    const [request] = client.requests;

    expect(request.model).toBe(PARTNER_MODEL);
    expect(request.output_config).toEqual({ effort: "low" });
    expect(request.fallbacks).toBe("default");
    expect(request.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(request.system).toEqual([
      { type: "text", text: partner.system, cache_control: { type: "ephemeral" } },
    ]);
    expect(request.messages).toEqual([{ role: "user", content: "Buongiorno." }]);
    // Thinking is adaptive by default on Opus 5 and the skill warns against
    // switching it off, so the request must not mention it at all.
    expect(request).not.toHaveProperty("thinking");
    expect(request).not.toHaveProperty("temperature");
  });

  it("keeps the system prompt byte-identical across turns and only ever appends messages", async () => {
    const client = fakeClient({
      streams: [fakeStream(["Uno."], reply("Uno.")), fakeStream(["Due."], reply("Due."))],
    });
    const partner = openScene({ client, scene: verdura, progress: empty, stageName: "presente", knownWords: [] });

    await partner.say("Primo.", () => {});
    await partner.say("Secondo.", () => {});

    const [first, second] = client.requests;
    expect(second.system[0].text).toBe(first.system[0].text);
    expect(second.messages).toEqual([
      { role: "user", content: "Primo." },
      { role: "assistant", content: "Uno." },
      { role: "user", content: "Secondo." },
    ]);
    // Append-only: the first request's messages are a prefix of the second's.
    expect(second.messages.slice(0, first.messages.length)).toEqual(first.messages);
    expect(partner.turns()).toBe(2);
  });

  it("reports a refusal without keeping the partial, and rolls the turn back", async () => {
    const client = fakeClient({
      streams: [fakeStream(["Non "], reply("Non ", { stop_reason: "refusal" })), fakeStream(["Va bene."], reply("Va bene."))],
    });
    const partner = openScene({ client, scene: verdura, progress: empty, stageName: "presente", knownWords: [] });

    expect(await partner.say("Qualcosa.", () => {})).toEqual({ ok: false, kind: "refused" });
    expect(partner.turns()).toBe(0);

    // The rolled-back turn is not resent behind the retry.
    await partner.say("Altro.", () => {});
    expect(client.requests[1].messages).toEqual([{ role: "user", content: "Altro." }]);
  });

  it("charges the refused turn anyway, because a mid-stream decline is billed", async () => {
    const partner = scene({ streams: [fakeStream(["Non "], reply("Non ", { stop_reason: "refusal" }))] });

    await partner.say("Qualcosa.", () => {});
    expect(partner.spend().calls).toBe(1);
  });
});

describe("failures, by SDK class", () => {
  const cases = [
    ["a rejected key", new AuthenticationError(401, {}, "no", new Headers()), "key"],
    ["a key without access", new PermissionDeniedError(403, {}, "no", new Headers()), "key"],
    ["a rate limit", new RateLimitError(429, {}, "slow down", new Headers()), "retry"],
    ["a dead network", new APIConnectionError({ message: "offline" }), "retry"],
    ["anything else the API returned", new BadRequestError(400, {}, "bad", new Headers()), "failed"],
    ["something that is not an API error at all", new TypeError("boom"), "failed"],
  ];

  for (const [name, error, kind] of cases) {
    it(`classifies ${name} as ${kind}`, () => {
      expect(classifyError(error)).toBe(kind);
    });
  }

  it("turns a thrown error into a kind and rolls the turn back", async () => {
    const partner = scene({ streams: [new RateLimitError(429, {}, "slow down", new Headers())] });

    expect(await partner.say("Mezzo chilo.", () => {})).toEqual({ ok: false, kind: "retry" });
    expect(partner.turns()).toBe(0);
    expect(partner.spend().calls).toBe(0);
  });

  it("classifies a failure on the debrief call too", async () => {
    const partner = scene({ creates: [new AuthenticationError(401, {}, "no", new Headers())] });

    expect(await partner.debrief()).toEqual({ ok: false, kind: "key" });
  });
});

describe("what the scene cost", () => {
  it("prices input, output, cache writes and cache reads off the response", () => {
    expect(costOf({ input_tokens: 1e6, output_tokens: 0 })).toEqual({ tokens: 1e6, usd: 5 });
    expect(costOf({ input_tokens: 0, output_tokens: 1e6 })).toEqual({ tokens: 1e6, usd: 25 });
    // A cache write is 1.25x an input token, a read 0.1x.
    expect(costOf({ cache_creation_input_tokens: 1e6 })).toEqual({ tokens: 1e6, usd: 6.25 });
    expect(costOf({ cache_read_input_tokens: 1e6 })).toEqual({ tokens: 1e6, usd: 0.5 });
  });

  it("adds up every call in the scene, the debrief included", async () => {
    const partner = scene({
      streams: [fakeStream(["Ecco."], reply("Ecco."))],
      creates: [
        {
          content: [{ type: "text", text: JSON.stringify({ saidWell: [], correction: null, goalMet: true }) }],
          stop_reason: "end_turn",
          usage: USAGE,
        },
      ],
    });

    await partner.say("Mezzo chilo.", () => {});
    await partner.debrief();

    const spend = partner.spend();
    expect(spend.calls).toBe(2);
    expect(spend.tokens).toBe(240);
    expect(spend.usd).toBeCloseTo(2 * ((100 * 5 + 20 * 25) / 1e6), 10);
  });
});

describe("the debrief call", () => {
  const body = (payload) => ({
    content: [{ type: "text", text: JSON.stringify(payload) }],
    stop_reason: "end_turn",
    usage: USAGE,
  });

  it("asks for structured output at medium effort and does not append the question to the transcript", async () => {
    const client = fakeClient({
      streams: [fakeStream(["Ecco."], reply("Ecco."))],
      creates: [body({ saidWell: [], correction: null, goalMet: false })],
    });
    const partner = openScene({ client, scene: verdura, progress: empty, stageName: "presente", knownWords: [] });

    await partner.say("Mezzo chilo di pomodori.", () => {});
    await partner.debrief();

    const request = client.requests[1];
    expect(request.output_config.effort).toBe("medium");
    expect(request.output_config.format).toEqual({ type: "json_schema", schema: debriefSchema(verdura) });
    expect(request.messages[request.messages.length - 1].role).toBe("user");
    expect(partner.turns()).toBe(1);
  });

  it("enumerates this scene's correctable ids in the schema", () => {
    expect(debriefSchema(verdura).properties.correction.properties.correctableId.enum).toEqual(
      verdura.correctables.map((c) => c.id),
    );
    expect(debriefSchema(verdura).properties.saidWell.items.properties.why.enum).toEqual(Object.keys(PRAISE_REASONS));
  });

  it("treats an unreadable body as a failed call rather than an empty debrief", async () => {
    const partner = scene({
      creates: [{ content: [{ type: "text", text: "{ truncated" }], stop_reason: "end_turn", usage: USAGE }],
    });

    expect(await partner.debrief()).toEqual({ ok: false, kind: "failed" });
  });

  it("reports a refusal on the debrief", async () => {
    const partner = scene({ creates: [body({ goalMet: true })] });
    const refused = scene({
      creates: [{ content: [], stop_reason: "refusal", usage: USAGE }],
    });

    expect((await partner.debrief()).ok).toBe(true);
    expect(await refused.debrief()).toEqual({ ok: false, kind: "refused" });
  });
});

describe("the debrief filters (plan S4)", () => {
  const said = ["mezzo chilo di pomodori, per favore", "sono più maturi questi?"];
  const filter = (raw, progress = empty) => filterDebrief(raw, { scene: verdura, progress, saidByLearner: said });

  const clitic = verdura.correctables.find((c) => c.stage === null);
  const stageOne = verdura.correctables.find((c) => c.stage === 1);

  it("keeps a correction that names a real correctable of a graded stage", () => {
    expect(filter({ correction: { correctableId: clitic.id } }).correction).toBe(clitic);
  });

  it("drops a correction naming an id this scene does not have", () => {
    expect(filter({ correction: { correctableId: "invented-id" } }).correction).toBeNull();
    // Including one that belongs to a different scene.
    const elsewhere = SCENES[1].correctables[0].id;
    expect(filter({ correction: { correctableId: elsewhere } }).correction).toBeNull();
  });

  it("drops a correction whose stage — from the data — is above the learner", () => {
    // Nothing produced, so the learner is at stage 1 and a stage-1 correctable
    // is graded. A stage-2 one is not, and the stage comes off the data even
    // when the model claims otherwise.
    expect(filter({ correction: { correctableId: stageOne.id } }).correction).toBe(stageOne);

    const above = {
      scene: { ...verdura, correctables: [{ ...stageOne, stage: 2 }] },
      progress: empty,
      saidByLearner: said,
    };
    expect(filterDebrief({ correction: { correctableId: stageOne.id, stage: 1 } }, above).correction).toBeNull();
  });

  it("keeps an above-current correction once that stage is established", () => {
    // Four clean passato-prossimo forms establish stage 2 out of order, which
    // is what isGraded's second clause is for.
    const stage2 = GRAMMAR_LEVELS.flatMap((level) =>
      level.topics.flatMap((topic) =>
        topic.drills.filter((item) => formStage(topic, item) === 2).map((item) => drillKey(level, topic, item)),
      ),
    ).slice(0, 4);
    const progress = stage2.reduce((acc, key) => markStageProduced(acc, key), empty);

    const withStage2 = {
      scene: { ...verdura, correctables: [{ ...stageOne, stage: 2 }] },
      progress,
      saidByLearner: said,
    };
    expect(filterDebrief({ correction: { correctableId: stageOne.id } }, withStage2).correction).not.toBeNull();
  });

  it("always grades a clitic, whatever the learner's stage", () => {
    expect(clitic.stage).toBeNull();
    expect(filter({ correction: { correctableId: clitic.id } }).correction).toBe(clitic);
  });

  it("keeps a phrase the learner really said, accents and case forgiven", () => {
    const kept = filter({ saidWell: [{ phrase: "Mezzo Chilo Di Pomodori", why: "quantita" }] });
    expect(kept.saidWell).toEqual([{ phrase: "Mezzo Chilo Di Pomodori", why: "quantita" }]);

    // And the model quoting it with the comma it ended on.
    expect(filter({ saidWell: [{ phrase: "sono piu maturi,", why: "accordo" }] }).saidWell).toHaveLength(1);
  });

  it("drops a recast — a phrase the learner never said", () => {
    expect(filter({ saidWell: [{ phrase: "mezzo chilo di pomodori maturi", why: "quantita" }] }).saidWell).toEqual([]);
    // The partner's own line is not the learner's either.
    expect(filter({ saidWell: [{ phrase: "Questi o quelli?", why: "chiarezza" }] }).saidWell).toEqual([]);
  });

  it("drops a why that is not one of the authored reasons", () => {
    expect(filter({ saidWell: [{ phrase: "mezzo chilo di pomodori", why: "ottimo lavoro" }] }).saidWell).toEqual([]);
    expect(filter({ saidWell: [{ phrase: "mezzo chilo di pomodori", why: "toString" }] }).saidWell).toEqual([]);
  });

  it("drops an empty phrase and caps the list at three", () => {
    expect(filter({ saidWell: [{ phrase: "  ", why: "accordo" }, { phrase: 7, why: "accordo" }] }).saidWell).toEqual([]);

    const four = Array.from({ length: 4 }, () => ({ phrase: "mezzo chilo", why: "quantita" }));
    expect(filter({ saidWell: four }).saidWell).toHaveLength(3);
  });

  it("reads goalMet as true only when it is true, and survives a shapeless body", () => {
    expect(filter({ goalMet: true }).goalMet).toBe(true);
    expect(filter({ goalMet: "yes" }).goalMet).toBe(false);
    expect(filter(null)).toEqual({ saidWell: [], correction: null, goalMet: false });
    expect(filter({ saidWell: "not an array" }).saidWell).toEqual([]);
  });
});

describe("the ceiling", () => {
  it("is ten turns", () => {
    expect(TURN_CEILING).toBe(10);
  });
});

// The one line in the app that builds a real client. It opens no socket —
// constructing one sends nothing — and the assertion is that browser mode is
// actually on: this test file runs in jsdom, which is exactly the environment
// the SDK refuses to run in without the flag, so a `partnerClient` that
// dropped `dangerouslyAllowBrowser` would throw here rather than at a
// learner's market stall.
describe("the real client", () => {
  it("is built in browser mode, which jsdom is the check for", () => {
    expect(() => partnerClient(FAKE_KEY)).not.toThrow();
    // And the flag is what makes the difference, not a coincidence:
    expect(() => new Anthropic({ apiKey: FAKE_KEY })).toThrow(/browser/i);
  });
});
