// The scene partner: every call to the Anthropic API this app makes, behind
// one seam, plus the two things the client does rather than trusts — the
// filters on the debrief, and the arithmetic on what the scene cost.
//
// Nothing here reads storage, renders anything, or holds the key. The screen
// gets the decrypted key from partnerKey.js, builds a client with it, and
// hands the client in; this file never sees localStorage and the key it is
// given goes exactly one place, into the SDK. It is never logged — neither is
// a transcript — and there is no console statement anywhere in this file for
// the same reason.
//
// ── Why the client is injected ──────────────────────────────────────────
// So the tests never open a socket. `openScene({ client, ... })` takes
// anything with `beta.messages.stream` and `beta.messages.create` on it, and
// scenePartner.test.js hands it a fake that records the request and replays a
// canned stream. The real one comes from `partnerClient` below, which is the
// only line in the app that constructs an Anthropic client.
//
// ── Where the API shape comes from ──────────────────────────────────────
// The claude-api skill, not memory. Each choice is commented with what told
// it to do that, because every one of them has changed inside a year:
//
//   model              claude-opus-5, the skill's default. One constant, so
//                      the owner's "use sonnet for this" is a one-line diff.
//   thinking           omitted. On Opus 5 thinking is adaptive by default —
//                      unlike Opus 4.8 — and the skill's pitfall list says
//                      disabling it on Opus 5 makes the model write tool
//                      calls and <thinking> tags into visible text. Lower
//                      effort is the cost lever, not thinking-off.
//   output_config      effort "low" for a conversational turn (short,
//                      latency-sensitive), "medium" for the debrief, which is
//                      a judgement over a whole transcript.
//   fallbacks          "default" with beta server-side-fallback-2026-07-01,
//                      the scalar form. The skill says to include it by
//                      default on claude-opus-5 and to prefer "default" over
//                      pinning a model, because the right substitute depends
//                      on the refusal category. Note the header: the array
//                      form takes -2026-06-01 and pairing either header with
//                      the other form is a 400.
//   cache_control      on the system block, which is the frozen half. See
//                      `openScene`.
//   structured output  output_config.format with a json_schema, per the
//                      migration guide's prefill-replacement table. Not the
//                      zod helper: that would add a dependency to state a
//                      schema this file can write literally.
//   max_tokens         deliberately small. The skill's guidance is ~64000 for
//                      a streaming call and to go lower only with a hard
//                      reason; a market stallholder's turn is two sentences
//                      and the learner is paying per token, which is two.
//
// Prefill is not used anywhere: it is a 400 on Opus 5.

import Anthropic, {
  APIConnectionError,
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { foldTyped } from "./typedAnswer.js";
import { isGraded } from "./stage.js";

// One line to change. The skill's instruction is not to downgrade for cost on
// anyone's behalf — that is the owner's call — so this is the default it
// names, and it is a constant so making that call costs one edit.
export const PARTNER_MODEL = "claude-opus-5";

// The published list price for that model, US dollars per million tokens.
//
// A published price can change, and when it does this constant is wrong until
// someone edits it. That is the honest trade: the alternative is showing no
// figure at all, and a per-scene cost is exactly the number an owner paying
// per call needs to see. The two multipliers are the skill's own ratios for
// cached tokens — a cache write costs about 1.25× an input token and a cache
// read about 0.1× — so they move with the input rate rather than being a
// third and fourth number to keep up to date.
export const PARTNER_RATE_USD_PER_MTOK = { input: 5, output: 25 };
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

// Turn cap. A cost ceiling and labelled as one on screen (plan S7): reaching
// it is not a failure and the debrief says nothing about having run out.
export const TURN_CEILING = 10;

// What the learner says to end the scene herself. Italian, because it is a
// thing she says to the stallholder and not a button on a form.
export const FINISH_PHRASE = "Ho finito";

// ── The praise vocabulary ───────────────────────────────────────────────
// `saidWell[].why` is an enum, and these are the authored reasons (plan S4).
// The model picks a key; the app writes the sentence. Two things fall out of
// that, and the second is the point: the model cannot write free prose into a
// praise line, so it cannot smuggle a correction into one — which was the
// reviewer's open question B — and the English is the app's own, so a praise
// line is never unmarked Italian in an English paragraph.
export const PRAISE_REASONS = {
  quantita: "Quantity, then di, and no article — that is the pattern.",
  accordo: "The agreement is right.",
  clitico: "The pronoun matches the thing it stands for.",
  verbo: "The right verb form for who is doing it.",
  cortesia: "Said the way it actually gets said at a counter.",
  chiarezza: "Clear enough that the stallholder simply answered it.",
};

// ── The frozen system prompt ────────────────────────────────────────────
// Frozen when the scene opens, and that is a caching requirement rather than
// tidiness: caching is a prefix match, so one byte different anywhere in the
// system block re-bills the whole prefix. The learner's stage name and her
// known words are therefore snapshotted at open and never recomputed
// mid-scene — she could establish a stage in the middle of a market
// conversation, and the prompt must not notice.
//
// Plan S7 also deleted a claim the draft made here: that the cacheable prefix
// clears Opus 5's 512-token minimum. For a day-one learner the known-word
// list is nearly empty and it may well not. The cache_control breakpoint
// costs nothing when the prefix is too short — it simply does not cache — so
// it stays, and no comment claims a hit.
export function systemPrompt({ scene, stageName, knownWords }) {
  return [
    `You are ${scene.task.partner.it} — ${scene.task.partner.en}. Stay in role for the whole conversation. You are never an assistant, a tutor or a chatbot, and you never mention being a model.`,
    "",
    `THE SITUATION: ${scene.task.setting.en}`,
    `You have already said, as the first thing in this conversation: "${scene.task.opening.it}". Do not say it again.`,
    "",
    `WHAT THE LEARNER IS TRYING TO DO: ${scene.task.goal.en}`,
    "She succeeds when all of these are true:",
    ...scene.task.success.map((line) => `- ${line}`),
    "",
    "HOW TO SPEAK:",
    "- Italian only. One or two short sentences per turn, the length a busy stallholder actually uses.",
    `- The learner is at stage ${scene.stage}, ${stageName}. Keep your own verbs at or below that stage. A higher form may appear as a fixed phrase she only has to understand, never as something she has to answer in.`,
    `- Stay close to these words, which this scene teaches: ${scene.newWords.map((word) => word.it).join(", ")}.`,
    knownWords.length > 0
      ? `- She also already knows: ${knownWords.join(", ")}.`
      : "- She knows very little else yet, so keep to the words above plus greetings and numbers.",
    "- Ask her something, or answer what she asked. Move the transaction along. Do not narrate, do not describe the scene, do not offer choices in English.",
    "",
    "WHAT YOU MUST NOT DO:",
    "- Never correct her Italian, never repeat it back fixed, never comment on her grammar or her accent. If you can tell what she means, answer it. If you genuinely cannot, say so in role, the way a stallholder would.",
    "- No translation, no English, no explanation of words.",
    "- No stage directions, no asterisks, no markdown. Plain spoken lines only.",
  ].join("\n");
}

// The one line in the app that builds a client.
//
// `dangerouslyAllowBrowser` is required: the SDK refuses to run in a browser
// without it, because the normal reason to be calling this from a browser is
// that someone has shipped their own key in a bundle. That is not what is
// happening here — the key is the learner's, she typed it into this device,
// it is encrypted at rest under her PIN (partnerKey.js) and it is never in the
// bundle — but the flag is named to make anyone reading this stop and check,
// so the check is written down.
export function partnerClient(key) {
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

// The beta header the `fallbacks: "default"` scalar form is gated on.
const BETAS = ["server-side-fallback-2026-07-01"];

// What every failure the screen has to draw looks like. Typed SDK classes,
// never a string match on a message — the skill is explicit about that, and a
// message is not an API.
//
//   key      the credential was rejected. 401 and 403 both: a revoked key and
//            a key without permission for this model are the same fix, which
//            is going to Casa and setting a working one.
//   retry    429, or the connection never completed. Pressing send again is a
//            reasonable thing to do and the screen offers it.
//   refused  a safety classifier declined, after the fallback model also
//            declined. Not an exception — it arrives as a 200.
//   failed   anything else the API returned, and anything that is not an API
//            error at all. Named rather than swallowed, retryable because the
//            alternative is a dead screen.
export function classifyError(error) {
  if (error instanceof AuthenticationError || error instanceof PermissionDeniedError) return "key";
  if (error instanceof RateLimitError || error instanceof APIConnectionError) return "retry";
  if (error instanceof APIError) return "failed";
  return "failed";
}

// Only the text blocks, joined. A thinking block's text is never shown to the
// learner — `display` is omitted, so on Opus 5 it arrives empty anyway — and a
// block of any other type is not a spoken line.
function textOf(message) {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

// Tokens and money for one response's `usage`, measured off the response
// rather than estimated from the prompt.
export function costOf(usage) {
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;

  return {
    tokens: input + output + cacheWrite + cacheRead,
    usd:
      ((input + cacheWrite * CACHE_WRITE_MULTIPLIER + cacheRead * CACHE_READ_MULTIPLIER) *
        PARTNER_RATE_USD_PER_MTOK.input +
        output * PARTNER_RATE_USD_PER_MTOK.output) /
      1e6,
  };
}

function addCost(total, usage) {
  const one = costOf(usage);
  return { calls: total.calls + 1, tokens: total.tokens + one.tokens, usd: total.usd + one.usd };
}

// ── The debrief, and its filters ────────────────────────────────────────

// Per scene, because the correctable enum is the scene's own. Stating the
// enum in the schema means the model usually cannot name a correctable that
// does not exist; the filter below re-checks anyway, because "usually" is not
// the standard plan S4 sets and because a schema is the server's promise
// rather than this app's.
export function debriefSchema(scene) {
  return {
    type: "object",
    properties: {
      saidWell: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            phrase: { type: "string" },
            why: { type: "string", enum: Object.keys(PRAISE_REASONS) },
          },
          required: ["phrase", "why"],
          additionalProperties: false,
        },
      },
      correction: {
        type: ["object", "null"],
        properties: { correctableId: { type: "string", enum: scene.correctables.map((c) => c.id) } },
        required: ["correctableId"],
        additionalProperties: false,
      },
      goalMet: { type: "boolean" },
    },
    required: ["saidWell", "correction", "goalMet"],
    additionalProperties: false,
  };
}

export function debriefInstruction(scene) {
  return [
    "The conversation is over. Step out of role and report on it, as JSON in the given shape. This report is read by the app, not by the learner, and the app writes the words she sees.",
    "",
    "The learner's turns came out of the browser's speech recogniser, so they may contain words it misheard, missing punctuation and no capitals. Never treat a recognition artefact as a mistake: judge what she was plainly saying, not the transcription.",
    "",
    "saidWell: up to three things she genuinely said well. `phrase` must be copied exactly from one of HER OWN turns — not your line, not a tidied-up version of hers, not a whole turn if only part of it is the good bit. `why` is one of the given keys. If she did fewer than three things worth naming, return fewer. An empty list is a valid answer.",
    "",
    `correction: at most one, and only by naming an id from this scene's list: ${scene.correctables
      .map((c) => `${c.id} (she said something like "${c.said}" instead of "${c.better}")`)
      .join("; ")}. Return null unless she really made that error in this conversation. If she made some other mistake, return null — an unlisted mistake is not corrected here, and inventing an id is worse than saying nothing.`,
    "",
    `goalMet: true only if she did the thing. The goal was: ${scene.task.goal.en} Judge it against the success criteria in your instructions, not against how good her Italian was.`,
  ].join("\n");
}

// The phrase check's normaliser. `foldTyped` already folds accents, case and
// whitespace — the same fold the judge marks answers on — and punctuation
// comes off on top of it, because the model quotes a phrase out of a sentence
// and the comma it ended on is not part of what she said.
function foldForContains(text) {
  return foldTyped(text).replace(/[^\p{L}\p{N} ]/gu, "");
}

// The one place a correctable's stage is turned into a yes or no.
//
// ── The `??` trap, written down because it bites ─────────────────────────
// `isGraded(progress, topic, item)` reads the stage as `item.stage ??
// topic.stage`, and `??` treats null as absent. A clitic correctable carries
// `stage: null` deliberately — R1 makes clitics always graded — so handing it
// in as the `item` with a numbered topic behind it would fall *through* the
// null to the topic's number and check the clitic against a rung it does not
// sit on. So both halves carry the same stage: `null ?? null` is null, which
// isGraded answers true to, and `1 ?? 1` is 1, which it checks against the
// ladder. Symmetric, and the test feeds it both.
function correctionIsGraded(progress, correctable) {
  const rung = { stage: correctable.stage };
  return isGraded(progress, rung, rung);
}

// Plan S4, in code. Everything the model says about the scene is checked
// against the scene's own data or against the learner's own words, and
// anything that fails is dropped rather than argued with.
//
//   correction   must name a correctableId that exists in THIS scene, and the
//                stage on that data — not a stage the model claims — must be
//                graded for this learner. An unpredicted error therefore
//                yields no correction at all, which the design allows: it
//                draws "at most one".
//   saidWell     `phrase` must appear inside one of the learner's own turns
//                after folding, or it is a recast of her Italian into better
//                Italian and is dropped. `why` must be a key of
//                PRAISE_REASONS. Three at most, whatever arrives.
//   goalMet      a boolean or nothing.
export function filterDebrief(raw, { scene, progress, saidByLearner }) {
  const spoken = saidByLearner.map(foldForContains);

  const saidWell = (Array.isArray(raw?.saidWell) ? raw.saidWell : [])
    .filter((entry) => typeof entry?.phrase === "string" && entry.phrase.trim() !== "")
    .filter((entry) => Object.prototype.hasOwnProperty.call(PRAISE_REASONS, entry.why))
    .filter((entry) => spoken.some((turn) => turn.includes(foldForContains(entry.phrase))))
    .slice(0, 3);

  const named = scene.correctables.find((c) => c.id === raw?.correction?.correctableId) ?? null;
  const correction = named !== null && correctionIsGraded(progress, named) ? named : null;

  return { saidWell, correction, goalMet: raw?.goalMet === true };
}

// ── The scene ───────────────────────────────────────────────────────────
// A session object rather than a pure function, because the conversation has
// to be append-only across renders: the system prompt is frozen at open, the
// messages only ever grow, and a React component that rebuilt either from
// props on every keystroke would re-bill the cached prefix every turn. The
// screen holds this in a ref and keeps its own state for what to draw.
export function openScene({ client, scene, progress, stageName, knownWords }) {
  const system = systemPrompt({ scene, stageName, knownWords });
  const messages = [];
  let spend = { calls: 0, tokens: 0, usd: 0 };

  // Every request's frozen half, byte for byte the same object shape each
  // time. The breakpoint goes here and nowhere else — the messages grow, so a
  // breakpoint further down would move every turn.
  const frozen = () => ({
    model: PARTNER_MODEL,
    betas: BETAS,
    fallbacks: "default",
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
  });

  // One learner turn. Streams the reply through `onDelta` so it appears as it
  // is written, and resolves to what the caller has to draw.
  //
  // ── stop_reason before content ──────────────────────────────────────
  // The deltas arrive before the stop reason does, so a refusal is only known
  // once the stream has finished. That is why the streamed text goes to
  // `onDelta` as *provisional* and the result says whether to keep it: on a
  // refusal the partial is thrown away by the screen, which is also what the
  // skill says to do with it (a mid-stream decline bills the partial; there is
  // nothing to be done about the billing, but showing it would be showing the
  // learner half of something the model then declined to finish).
  //
  // ── Why a failed turn is rolled back ────────────────────────────────
  // The learner's line is appended before the request and removed again if
  // there is no reply to pair it with. Append-only is a rule about never
  // editing a turn the model has already seen; a turn it never answered is
  // not history, and leaving it in would mean a retry sent her sentence twice.
  async function say(text, onDelta) {
    messages.push({ role: "user", content: text });

    let final;
    try {
      const stream = client.beta.messages.stream({
        ...frozen(),
        max_tokens: 400,
        output_config: { effort: "low" },
        messages: [...messages],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") onDelta(event.delta.text);
      }

      final = await stream.finalMessage();
    } catch (error) {
      messages.pop();
      return { ok: false, kind: classifyError(error) };
    }

    spend = addCost(spend, final.usage);

    if (final.stop_reason === "refusal") {
      messages.pop();
      return { ok: false, kind: "refused" };
    }

    const reply = textOf(final);
    messages.push({ role: "assistant", content: reply });
    return { ok: true, text: reply };
  }

  // The debrief: one structured call over the conversation that just happened.
  //
  // Not appended to `messages`. The instruction asks the model to step out of
  // role, and a scene that carried that turn in its history would be a scene
  // whose partner had been told the conversation was over — the transcript is
  // the transcript, and this is a question asked about it.
  //
  // Effort is "medium" here where a turn is "low": this is a judgement over a
  // whole conversation rather than a two-sentence reply. The skill notes that
  // changing effort mid-conversation invalidates the messages cache, which is
  // a real cost and the right one to pay — it is one call, it is the last of
  // the scene, and the alternative is grading a transcript at the effort
  // level chosen for speaking speed.
  async function debrief() {
    let final;
    try {
      final = await client.beta.messages.create({
        ...frozen(),
        max_tokens: 2000,
        output_config: { effort: "medium", format: { type: "json_schema", schema: debriefSchema(scene) } },
        messages: [...messages, { role: "user", content: debriefInstruction(scene) }],
      });
    } catch (error) {
      return { ok: false, kind: classifyError(error) };
    }

    spend = addCost(spend, final.usage);

    if (final.stop_reason === "refusal") return { ok: false, kind: "refused" };

    // Structured output is constrained decoding, so this is valid JSON unless
    // the response was cut off — which `max_tokens` above makes unlikely and
    // not impossible. A debrief that cannot be read is a failed call, not a
    // debrief with nothing in it: "you said nothing well and met no goal" is
    // a false report, where "that didn't come back" is true.
    let raw;
    try {
      raw = JSON.parse(textOf(final));
    } catch {
      return { ok: false, kind: "failed" };
    }

    return {
      ok: true,
      report: filterDebrief(raw, {
        scene,
        progress,
        saidByLearner: messages.filter((m) => m.role === "user").map((m) => m.content),
      }),
    };
  }

  return {
    system,
    say,
    debrief,
    // Read rather than exposed, so nothing outside can push a turn in.
    turns: () => messages.filter((m) => m.role === "user").length,
    spend: () => spend,
  };
}
