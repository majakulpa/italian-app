import React, { useId, useRef, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { TOKENS, CITY_RULES, CITY_ACCENTS, citySurface } from "../../shared/theme.js";
import { save, remove, hasStoredKey, maskedKey } from "../../shared/partnerKey.js";
import LiveStatus from "../../shared/LiveStatus.jsx";

// Casa's second settings row: where the scene-partner key is set and removed.
//
// The crypto and the argument for it are in shared/partnerKey.js. This file is
// the form, and the copy — which is the half that is easy to get wrong, so it
// is worth saying what the copy is for.
//
// ── Why the copy says this much ─────────────────────────────────────────
// Asking someone to paste an API key into a web page is asking them to trust
// four separate things: that it is not sent anywhere it shouldn't be, that
// storing it here is not the same as publishing it, that the conversation
// goes to a named company, and that the microphone goes to a different one.
// A single line of reassurance would cover none of them, and a learner who
// later finds out any one of them would be right to stop trusting the app.
//
// So: four short blocks, each one a fact rather than a reassurance, and each
// one stated whether or not a key is currently stored — the facts do not
// change when the field does. The one thing deliberately *not* softened is
// the shared origin: fourteen of the owner's repositories publish to
// majakulpa.github.io, and localStorage is scoped to the host. Saying "stored
// safely on your device" instead would be a lie by omission.

const SANS = "'Inter', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const MESSAGES = {
  key: "That doesn’t look like an Anthropic key. They begin sk-ant- and run well past forty characters — check the paste picked up the whole thing.",
  pin: "Choose a PIN of at least four characters.",
  storage: "This browser would not store it — private browsing, or a full quota. Nothing was saved.",
};

export const SAVED = "The key is stored on this device, encrypted with your PIN.";
export const REMOVED = "The key has been removed from this device.";

export default function PartnerKeyRow() {
  const [stored, setStored] = useState(hasStoredKey);
  const [masked, setMasked] = useState(maskedKey);
  const [key, setKey] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  // One of MESSAGES' reasons, or null. The reason rather than the sentence,
  // because it also decides which field is marked invalid.
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");

  const headingRef = useRef(null);
  const headingId = useId();
  const keyId = useId();
  const keyHintId = useId();
  const pinId = useId();
  const pinHintId = useId();
  const errorId = useId();

  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setError(null);
    setNote("");
    const result = await save(key, pin);
    setBusy(false);

    if (!result.ok) return setError(result.reason);

    // Cleared from the form as well as from the screen: the state that held
    // the key was the last copy of it outside partnerKey's own memory.
    setKey("");
    setPin("");
    setStored(true);
    setMasked(maskedKey());
    setNote(SAVED);
    // The form that was being used has just unmounted, which drops focus to
    // the body — the same problem the phases fixed by focusing the new
    // heading. This row's heading is mounted either way, so it is the target.
    headingRef.current.focus();
  }

  function removeKey() {
    remove();
    setStored(false);
    setMasked(null);
    setError(null);
    setNote(REMOVED);
    headingRef.current.focus();
  }

  return (
    <section aria-labelledby={headingId} style={{ ...citySurface(), padding: "14px 16px 16px" }}>
      <h3
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: "uppercase", color: TOKENS.ink, margin: 0 }}
      >
        <KeyRound size={13} aria-hidden="true" />
        <span lang="it">Partner di scena</span>
      </h3>

      <p style={{ ...BODY, marginTop: 10 }}>
        The first three phases of a scene are a script, and they work with no key at all. The fourth is a partner who
        answers what you actually said &mdash; a language model, called from this browser with your own Anthropic API
        key.
      </p>

      <p style={{ ...BODY, marginTop: 10 }}>
        <strong>Why the PIN.</strong> This app is published on <span style={{ fontFamily: MONO }}>majakulpa.github.io</span>,
        and so are thirteen other sites of mine. A browser gives every site on one domain the same storage, so any of
        them &mdash; or any script one of them loads &mdash; can read what this app stores. What they would find is the
        encrypted key; without your PIN it is not a key. Belt and braces: make a key for this alone, and set a low
        spend limit on it.
      </p>

      <p style={{ ...BODY, marginTop: 10 }}>
        <strong>Who hears you.</strong> Anthropic receives the text of the conversation, because that is what the
        reply is generated from. If you use the microphone, the audio goes to whoever makes your browser &mdash; Apple
        on Safari, Google on Chrome &mdash; which is already true of the <span lang="it">Prova</span> phase you have
        now.
      </p>

      <p style={{ ...BODY, marginTop: 10 }}>
        <strong>On an iPhone.</strong> An app added to the home screen keeps its storage apart from Safari&rsquo;s, so
        the key has to be entered in whichever of the two you use. Safari may also clear the storage of a site you
        have not opened for about a week, and then it has to be entered again.
      </p>

      <LiveStatus>{note || (error ? MESSAGES[error] : "")}</LiveStatus>

      {stored ? (
        <div style={{ marginTop: 14 }}>
          <p lang="it" style={{ fontFamily: MONO, fontSize: 11, color: TOKENS.ink, margin: 0, letterSpacing: 0.3 }}>
            Salvata solo su questo dispositivo
          </p>
          <p style={{ ...BODY, fontWeight: 600, marginTop: 6 }}>
            {SAVED}
            {/* The tail comes from the key in memory, not from storage: four
                plaintext characters kept beside the ciphertext would be four
                characters the other thirteen sites could read. So it shows
                after the key is set, and not after a reload — which is also
                the honest picture of what the app knows. */}
            {masked ? <span style={{ fontFamily: MONO, fontWeight: 400 }}> {masked}</span> : null}
          </p>
          <button type="button" onClick={removeKey} style={{ ...SECONDARY, marginTop: 12 }}>
            <Trash2 size={15} aria-hidden="true" />
            Remove the key
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 14 }}>
          <label htmlFor={keyId} style={LABEL}>
            Anthropic API key
          </label>
          <p id={keyHintId} style={{ ...HINT }}>
            Begins <span style={{ fontFamily: MONO }}>sk-ant-</span>. Pasted in here, and never shown back in full.
          </p>
          <input
            id={keyId}
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={error === "key" ? "true" : undefined}
            aria-describedby={error === "key" ? `${keyHintId} ${errorId}` : keyHintId}
            style={INPUT}
          />

          <label htmlFor={pinId} style={{ ...LABEL, marginTop: 14 }}>
            A PIN to lock it with
          </label>
          <p id={pinHintId} style={HINT}>
            Four characters or more. You will be asked for it once each time you open the app, and it unlocks nothing
            else.
          </p>
          <input
            id={pinId}
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={error === "pin" ? "true" : undefined}
            aria-describedby={error === "pin" ? `${pinHintId} ${errorId}` : pinHintId}
            style={INPUT}
          />

          {error && (
            <p id={errorId} style={{ ...BODY, fontWeight: 600, marginTop: 12 }}>
              {MESSAGES[error]}
            </p>
          )}

          <button type="submit" disabled={busy} style={{ ...PRIMARY, marginTop: 14, opacity: busy ? 0.75 : 1 }}>
            {busy ? "Locking the key…" : "Save the key"}
          </button>
        </form>
      )}
    </section>
  );
}

const BODY = { fontFamily: SANS, fontSize: 13, color: TOKENS.ink, margin: 0, lineHeight: 1.6 };
const LABEL = { display: "block", fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TOKENS.ink };
const HINT = { fontFamily: SANS, fontSize: 12.5, color: TOKENS.ink, margin: "4px 0 8px", lineHeight: 1.55 };

const INPUT = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 44,
  fontFamily: MONO,
  fontSize: 15,
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

// controlLine, not line: a clickable boundary has to clear 3:1 against the
// card behind it and the page around it (SC 1.4.11).
const SECONDARY = {
  width: "100%",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: `2px solid ${TOKENS.controlLine}`,
  borderRadius: CITY_RULES.radius,
  background: "transparent",
  color: TOKENS.ink,
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
