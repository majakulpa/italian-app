import React, { useId, useRef, useState } from "react";
import { ArrowUp, Flag } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import Microphone from "../../shared/Microphone.jsx";
import { speakItalian } from "../../shared/speech.js";
import { foldTyped } from "../../shared/typedAnswer.js";
import { FINISH_PHRASE, TURN_CEILING } from "../../shared/scenePartner.js";
import { Card, Eyebrow, SANS, SERIF } from "./chrome.jsx";

// Phase 4 — Al mercato (design/02-la-citta.html, screen 05). The unscripted
// task: a transcript, a microphone, and a stallholder who answers what was
// actually said.
//
// ── Everything the model says is drawn as text ──────────────────────────
// `{turn.text}` and nothing else. No dangerouslySetInnerHTML anywhere in this
// file, no markdown-to-HTML step, not even for the bold a model likes to put
// round a price. This is plan S1's rule and it is the security boundary for
// the key, not a styling preference: the decrypted key lives in this page's
// memory, so script injected into this origin could read it. A model reply is
// untrusted input that arrives over the network, and the one safe thing to do
// with untrusted input is render it as characters.
//
// ── The recognised text is editable before it is sent ───────────────────
// The microphone writes into the same box the learner types in, and nothing
// leaves the device until she presses send. A recognition error is therefore
// never her mistake — and it matters more here than in Prova, because here
// the mistake would go into a transcript the debrief is then written from.
// Typing is available always, with or without a microphone.
//
// ── What the design draws here and this screen does not ─────────────────
// Two things, both refused, both for reasons that outlive this slice.
//
// - "🎙 chiaro ✓" on the learner's own bubble. Recognition confidence is not
//   a measurement of pronunciation and Safari reports 0 for every result, so
//   the badge would read "not clear" for every learner on the platform the
//   voice phase is designed for. Refused in #41 and still refused; see
//   shared/recognition.js for the whole argument.
// - The coaching card under the last vendor line ("Ti ha chiesto di
//   scegliere"). It is a good idea and it is a second structured call per
//   turn — it doubles the cost of every turn and it has to be written so that
//   it never corrects, which is the debrief's job. A later change, as an
//   on-demand "Aiuto", not this one (plan S7).
//
// ── The ceiling is a cost ceiling ───────────────────────────────────────
// Ten learner turns, said on screen as what it is. Reaching it is not losing:
// the scene ends and the debrief is written from what happened, with no
// failure wording anywhere (plan S7). The alternative — an open-ended
// conversation — is an open-ended bill on someone else's key.

const PARTNER = "partner";
const LEARNER = "learner";

export default function SceneTask({ scene, session, onDone }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [turns, setTurns] = useState([{ who: PARTNER, text: scene.task.opening.it }]);
  const [draft, setDraft] = useState("");
  // The reply as it is written. A separate state from `turns` on purpose: it
  // is provisional until the stream ends, because a refusal is only known
  // after the last delta and a partial the model then declined to finish is
  // not something to leave on screen.
  const [streaming, setStreaming] = useState(null);
  const [problem, setProblem] = useState(null);
  const busy = streaming !== null;

  const spoken = session.turns();
  const left = TURN_CEILING - spoken;

  const finish = (reason) => onDone(reason);

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (text === "" || busy) return;

    // She can also just say it. "Ho finito" is a thing said to a stallholder,
    // so it works from the microphone and from the keyboard, not only from
    // the button beneath.
    if (foldTyped(text) === foldTyped(FINISH_PHRASE)) return finish("finished");

    setDraft("");
    setProblem(null);
    setTurns((before) => [...before, { who: LEARNER, text }]);
    setStreaming("");

    const result = await session.say(text, (delta) => setStreaming((so) => so + delta));
    setStreaming(null);

    if (!result.ok) {
      // The module has already rolled its own history back, so the screen
      // rolls back to match and puts her sentence back in the box. That *is*
      // the retry: the text is where it was, the send button is where it was,
      // and pressing it again sends the turn that did not get through.
      setTurns((before) => before.slice(0, -1));
      setDraft(text);
      setProblem(result.kind);
      inputRef.current.focus();
      return;
    }

    setTurns((before) => [...before, { who: PARTNER, text: result.text }]);
    speakItalian(result.text);

    if (session.turns() >= TURN_CEILING) finish("ceiling");
  };

  return (
    <>
      {/* The goal, on screen while she works — the design prints it, and a
          task whose goal you have to remember from two screens ago is a
          memory test rather than a market stall. */}
      <Card eyebrow="Quello che devi fare" eyebrowLang="it" accent="lemon">
        <p lang="it" style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.4 }}>
          {scene.task.goal.it}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 13.5, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
          {scene.task.goal.en}
        </p>
      </Card>

      <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
        {turns.map((turn, index) => (
          <Bubble key={`${index}-${turn.text}`} scene={scene} who={turn.who} text={turn.text} />
        ))}
        {busy && <Bubble scene={scene} who={PARTNER} text={streaming} pending />}
      </ol>

      <LiveStatus>
        {busy ? `${scene.task.partner.en} is answering.` : problem ? PROBLEMS[problem] : ""}
      </LiveStatus>

      {problem && (
        <p
          role="alert"
          style={{ ...citySurface(), padding: "12px 14px", marginTop: 12, fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55 }}
        >
          {PROBLEMS[problem]}
        </p>
      )}

      <form onSubmit={send} style={{ marginTop: 16 }}>
        <label htmlFor={inputId} style={{ display: "block", fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TOKENS.ink, marginBottom: 6 }}>
          What you say back, in Italian
        </label>
        <input
          id={inputId}
          ref={inputRef}
          lang="it"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontFamily: SERIF,
            fontSize: 19,
            fontWeight: 600,
            color: TOKENS.ink,
            background: TOKENS.card,
            border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
            borderRadius: CITY_RULES.radius,
            padding: "12px 14px",
          }}
        />

        <Microphone onTranscript={setDraft} disabled={busy} />

        <button type="submit" disabled={busy} style={{ ...SEND, opacity: busy ? 0.75 : 1 }}>
          <span>{busy ? "Sending…" : "Send"}</span>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </form>

      <button type="button" onClick={() => finish("finished")} style={FINISH}>
        <Flag size={15} aria-hidden="true" />
        <span lang="it">{FINISH_PHRASE}</span>
      </button>

      {/* Said as what it is. Not "3 turns left" on its own, which reads as a
          score to beat, and not silence, which would make the scene stop
          without explanation on someone else's bill. */}
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: TOKENS.inkSoft, margin: "10px 0 0", lineHeight: 1.55, textAlign: "center" }}>
        There is no script &mdash; it answers what you actually say. {left} of {TURN_CEILING} turns left: a ceiling on
        what the scene costs you, not a time limit. Reaching it just ends the scene.
      </p>
    </>
  );
}

// One line of the transcript. The speaker is named in words above the bubble
// as well as being a different colour and a different side, because who said
// what is information and colour alone is not a way to carry it (WCAG 1.4.1).
function Bubble({ scene, who, text, pending = false }) {
  const mine = who === LEARNER;

  return (
    <li style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
      <Eyebrow style={{ color: TOKENS.inkSoft, marginBottom: 3 }}>
        {mine ? "You" : scene.task.partner.en}
      </Eyebrow>
      <div style={{ ...citySurface(mine ? "pistachio" : undefined), padding: "9px 12px", maxWidth: "92%" }}>
        {/* Plain text. See the header. */}
        <p lang="it" style={{ fontFamily: SANS, fontSize: 14.5, margin: 0, lineHeight: 1.5 }}>
          {text}
          {pending && text === "" && <span aria-hidden="true">&hellip;</span>}
        </p>
      </div>
    </li>
  );
}

// One sentence per failure kind, and each one names a thing to do. `refused`
// is the plain wording plan S1 asks for: no category, no explanation of what
// a classifier is, and no suggestion that she said something wrong.
const PROBLEMS = {
  key: "That key was turned down. Set a working one in Casa, on the fourth tab.",
  retry: "That did not get through. Your words are back in the box — send them again.",
  refused: "The partner could not continue this scene. Your words are back in the box; try saying it another way.",
  failed: "Something went wrong on the way there. Your words are back in the box — send them again.",
};

const SEND = {
  border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
  borderRadius: CITY_RULES.radius,
  boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
  background: CITY_ACCENTS.lemon.fill,
  color: CITY_ACCENTS.lemon.ink,
  padding: "13px 18px",
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  marginTop: 12,
};

const FINISH = {
  border: `2px solid ${TOKENS.controlLine}`,
  borderRadius: CITY_RULES.radius,
  background: "transparent",
  color: TOKENS.ink,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "12px 18px",
  marginTop: 10,
};
