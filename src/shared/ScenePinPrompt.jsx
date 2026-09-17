import React, { useId, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "./theme.js";
import { unlock } from "./sceneKey.js";
import LiveStatus from "./LiveStatus.jsx";

// The PIN gate. Asked for once per app run, immediately before a scene needs
// its partner, and never anywhere else — this is the only screen in the app
// that asks for a PIN, and it unlocks exactly one thing (see sceneKey.js).
//
// It is built here, in this slice, without being wired to anything: phase 05
// is the next slice, and a component with no caller is still worth landing
// with its tests rather than being written twice.
//
// ── Why one message for every failure ───────────────────────────────────
// A wrong PIN, a tampered record and no stored key at all all end at the same
// sentence. That is not vagueness for its own sake: distinguishing them would
// tell whoever is holding a copy of the stored blob which of their guesses was
// closer to being the right kind of guess. `unlock` returns one boolean, and
// this is the one sentence for false.

const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export const WRONG_PIN = "That PIN doesn’t match. Try again, or set the key again in Casa.";

export default function ScenePinPrompt({ onUnlocked, onCancel }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef(null);
  const headingId = useId();
  const hintId = useId();
  const errorId = useId();

  // No re-entrancy guard in here, deliberately. The submit button is
  // `disabled` while the derivation runs, which is what stops a second click,
  // and HTML's implicit submission is a click on the form's default button —
  // so a disabled button swallows a second Enter too. An `if (busy) return`
  // would be a branch nothing could reach, and an unreachable branch is worse
  // than no branch: it reads as a defence and is never exercised.
  //
  // Two derivations would in any case be harmless — the same PIN twice — so
  // this is about not lying in code rather than about correctness.
  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setWrong(false);
    const opened = await unlock(pin);
    setBusy(false);

    if (opened) return onUnlocked();

    // Cleared rather than left in place: the field is a password field, so
    // there is nothing on screen to correct, and retyping four characters is
    // cheaper than guessing which one to delete. Focus comes back to it
    // because pressing the button moved focus away from the thing that now
    // needs typing in again.
    setPin("");
    setWrong(true);
    inputRef.current.focus();
  }

  return (
    <section aria-labelledby={headingId} style={{ ...citySurface(), padding: "16px" }}>
      <h2 id={headingId} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: TOKENS.ink, margin: 0 }}>
        <Lock size={13} aria-hidden="true" />
        Your PIN
      </h2>

      <form onSubmit={submit}>
        <label htmlFor={`${headingId}-pin`} style={{ display: "block", fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TOKENS.ink, margin: "12px 0 6px" }}>
          PIN
        </label>
        <p id={hintId} style={{ fontFamily: SANS, fontSize: 13, color: TOKENS.ink, margin: "0 0 10px", lineHeight: 1.55 }}>
          The PIN you locked your scene-partner key with, in <span lang="it">Casa</span>. It unlocks nothing else in
          this app, and it is asked for once each time you open it.
        </p>
        <input
          id={`${headingId}-pin`}
          ref={inputRef}
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={wrong ? "true" : undefined}
          aria-describedby={wrong ? `${hintId} ${errorId}` : hintId}
          style={INPUT}
        />

        <LiveStatus>{busy ? "Checking your PIN." : wrong ? WRONG_PIN : ""}</LiveStatus>

        {wrong && (
          <p id={errorId} style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TOKENS.ink, margin: "10px 0 0", lineHeight: 1.55 }}>
            {WRONG_PIN}
          </p>
        )}

        <button type="submit" disabled={busy} style={{ ...PRIMARY, marginTop: 14, opacity: busy ? 0.75 : 1 }}>
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>

      {/* controlLine, not line: this is a clickable boundary and has to clear
          3:1 against both the card behind it and the page (SC 1.4.11). */}
      <button type="button" onClick={onCancel} style={SECONDARY}>
        Not now
      </button>
    </section>
  );
}

const INPUT = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 44,
  fontFamily: MONO,
  fontSize: 17,
  color: TOKENS.ink,
  background: TOKENS.card,
  border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
  borderRadius: CITY_RULES.radius,
  padding: "10px 14px",
};

const PRIMARY = {
  width: "100%",
  minHeight: 44,
  border: `${CITY_RULES.border}px solid ${TOKENS.cityInk}`,
  borderRadius: CITY_RULES.radius,
  boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
  background: CITY_ACCENTS.lemon.fill,
  color: CITY_ACCENTS.lemon.ink,
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const SECONDARY = {
  width: "100%",
  minHeight: 44,
  marginTop: 10,
  border: `2px solid ${TOKENS.controlLine}`,
  borderRadius: CITY_RULES.radius,
  background: "transparent",
  color: TOKENS.ink,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
