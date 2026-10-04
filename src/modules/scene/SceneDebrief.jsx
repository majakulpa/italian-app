import React, { useEffect, useRef, useState } from "react";
import { Check, Diamond, RotateCcw } from "lucide-react";
import { TOKENS, citySurface } from "../../shared/theme.js";
import LiveStatus from "../../shared/LiveStatus.jsx";
import { PRAISE_REASONS } from "../../shared/scenePartner.js";
import { Card, Eyebrow, PrimaryButton, SANS, SERIF } from "./chrome.jsx";

// Phase 4's ending — design screen 06. One structured call over the
// conversation that just happened, and then nothing but what survived the
// filters in shared/scenePartner.js.
//
// ── No score, anywhere ──────────────────────────────────────────────────
// The design's own caption: "success is the outcome, not a score". So there
// is no percentage, no mark out of anything, no count of mistakes, and no
// "you got 2 of 3 right" — the outcome is whether she bought the tomatoes,
// and the rest is at most three things said well and at most one correction.
// The number of correct things is deliberately not drawn as a figure either:
// a list of two is a list of two, and "2/3" is a score by another spelling.
//
// ── Two things the design draws that are refused ────────────────────────
// - "🔓 La Stazione · aperta". There is no scene district behind that door.
//   Il Mercato is the only one with scenes in it, La Stazione does not exist
//   as a route, and PLAN forbids an unlock with nothing behind it. The card
//   is not drawn and this comment is why; when a second scene district is
//   built, an unlock can be built with it.
// - "+4 parole → Piazza". The scene's words were banked when Ascolta
//   finished (#41, plan S3) and Prova already said so, with a count of the
//   keys the write actually made. Saying it again here would either be a
//   second claim about one write or — worse — an invitation to write them
//   twice, which would drop a word already at box 4 back to box 1.
//
// ── Reaching the turn ceiling is not losing ─────────────────────────────
// A scene that ends on the ceiling arrives here exactly like one she ended
// herself. Nothing on this screen says "ran out", "too long" or "try to be
// quicker", because the ceiling is about what the call costs and not about
// her Italian (plan S7). The only thing that differs is one sentence saying
// the scene ended there, so the ending is not mysterious.

const OUTCOME = {
  finished: "You ended the scene.",
  ceiling: "The scene ended at its ten-turn ceiling — that is a cap on what it costs to run, nothing to do with how it went.",
};

export default function SceneDebrief({ scene, session, outcome, onDemonstrated, onLeave }) {
  const [state, setState] = useState({ status: "asking" });
  // StrictMode double-invokes effects in development, and this effect spends
  // real money. Once per mount, then.
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;

    session.debrief().then((result) => {
      if (!result.ok) return setState({ status: "failed", kind: result.kind });
      if (result.report.goalMet) onDemonstrated(scene);
      setState({ status: "ready", report: result.report });
    });

    // No cleanup, deliberately, and this is the second half of the StrictMode
    // problem rather than an oversight. A `live` flag flipped in a cleanup
    // would be flipped by StrictMode's *simulated* unmount — the effect then
    // re-runs, the guard above stops it asking again, and the answer to the
    // first ask lands with nothing willing to take it: a debrief that is paid
    // for and never drawn. The thing the flag would have prevented is a
    // setState after a real unmount, which React 18 neither warns about nor
    // leaks.
  }, [scene, session, onDemonstrated]);

  const spend = session.spend();

  return (
    <>
      <LiveStatus>
        {state.status === "asking" ? "Looking back over the conversation." : state.status === "ready" ? "Your debrief is ready." : ""}
      </LiveStatus>

      {state.status === "asking" && <Waiting />}
      {state.status === "failed" && <Failed kind={state.kind} />}
      {state.status === "ready" && (
        <Report scene={scene} report={state.report} outcome={outcome} />
      )}

      <CostLine spend={spend} />

      <PrimaryButton accent="lemon" onClick={onLeave} style={{ marginTop: 14 }}>
        <RotateCcw size={16} aria-hidden="true" />
        <span>
          Back to <span lang="it">Le Scene</span>
        </span>
      </PrimaryButton>
    </>
  );
}

function Waiting() {
  return (
    <p style={{ ...citySurface(), padding: "16px", fontFamily: SANS, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
      Looking back over what you said&hellip;
    </p>
  );
}

// The debrief did not come back. The conversation still happened and the
// words are still banked; what is missing is the report, and saying that is
// better than drawing an empty one — "you said nothing well" is a false
// report where "this did not come back" is a true one.
function Failed({ kind }) {
  return (
    <p role="alert" style={{ ...citySurface(), padding: "16px", fontFamily: SANS, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
      {kind === "key"
        ? "That key was turned down before the debrief could be written. The conversation still happened — set a working key in Casa and the next scene will have one."
        : "The debrief did not come back. The conversation still happened; only the write-up is missing."}
    </p>
  );
}

function Report({ scene, report, outcome }) {
  return (
    <>
      <div style={{ textAlign: "center", padding: "4px 0 14px" }}>
        <Eyebrow lang="it" style={{ color: TOKENS.ink, display: "block", marginBottom: 6 }}>
          {report.goalMet ? "Missione riuscita" : "Fine della scena"}
        </Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.2 }}>
          {report.goalMet ? scene.task.goal.en : "You did not get all the way there this time."}
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
          {OUTCOME[outcome]}
          {!report.goalMet && " The scene is still there — you can walk back in."}
        </p>
      </div>

      {/* The can-do, recorded and said. Only on goalMet: a "Posso" is
          something demonstrated, which is the whole difference between this
          and a checklist. */}
      {report.goalMet && (
        <Card eyebrow="Nuovo “Posso”" eyebrowLang="it" accent="pistachio">
          <p lang="it" style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.4 }}>
            {scene.ability.it}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13.5, margin: "6px 0 0", lineHeight: 1.55, opacity: 0.92 }}>
            {scene.ability.en} It is on the shelf in <span lang="it">Casa</span> now.
          </p>
        </Card>
      )}

      {report.saidWell.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <Eyebrow lang="it" style={{ color: TOKENS.inkSoft, display: "block", marginBottom: 8 }}>
            Detto bene
          </Eyebrow>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {report.saidWell.map((entry) => (
              <li key={entry.phrase} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                {/* An icon and a word, not a green tick alone. */}
                <Check size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3, color: TOKENS.ink }} />
                <span style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: TOKENS.ink }}>
                  <b lang="it">{entry.phrase}</b>
                  <span style={{ display: "block", opacity: 0.9 }}>{PRAISE_REASONS[entry.why]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.correction && (
        <section style={{ marginTop: 16 }}>
          <Eyebrow lang="it" style={{ color: TOKENS.inkSoft, display: "block", marginBottom: 8 }}>
            Da rivedere
          </Eyebrow>
          <div style={{ ...citySurface(), padding: "12px 14px", display: "flex", gap: 8 }}>
            <Diamond size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
            <p style={{ fontFamily: SANS, fontSize: 14, margin: 0, lineHeight: 1.55 }}>
              <span lang="it" style={{ textDecoration: "line-through" }}>
                {report.correction.said}
              </span>{" "}
              &rarr; <b lang="it">{report.correction.better}</b>
              <span lang="it" style={{ display: "block", marginTop: 4, opacity: 0.92 }}>
                {report.correction.why}
              </span>
            </p>
          </div>
        </section>
      )}

      {report.saidWell.length === 0 && !report.correction && (
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TOKENS.inkSoft, margin: "16px 0 0", lineHeight: 1.6 }}>
          Nothing to single out either way this time. That is an answer, not a blank: the debrief only names things it
          can point at in what you actually said.
        </p>
      )}
    </>
  );
}

// What the scene cost, measured off the `usage` on the responses rather than
// estimated from the prompt. The rate it is priced at is a published list
// price and can change — see PARTNER_RATE_USD_PER_MTOK in
// shared/scenePartner.js, which is the one place to edit when it does.
//
// Four decimal places because the honest number for a short scene is
// fractions of a cent, and rounding it to "$0.00" would be a figure that
// says nothing. The token count sits beside it for the same reason the
// coverage percentage sits beside a word count: a price with no quantity
// behind it cannot be checked.
function CostLine({ spend }) {
  return (
    <p style={{ ...citySurface(), background: "transparent", boxShadow: "none", borderStyle: "dashed", padding: "10px 12px", marginTop: 18, fontFamily: SANS, fontSize: 12.5, color: TOKENS.ink, lineHeight: 1.55 }}>
      This scene cost <b>${spend.usd.toFixed(4)}</b> on your key: {spend.tokens.toLocaleString("en-GB")} tokens over{" "}
      {spend.calls} {spend.calls === 1 ? "call" : "calls"}, priced at the published rate for the model. Measured, not
      estimated.
    </p>
  );
}

// Nothing in this file writes to storage. The can-do is recorded by the
// module that owns the progress blob (ScenesModule), through onDemonstrated,
// for the same reason the word-banking write lives there: a phase screen that
// wrote progress would be a second place progress is written from, and the
// two would drift.
