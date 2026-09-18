// The scene-partner API key: how it is held at rest, and how it is held in
// memory. Nothing here talks to Anthropic — that is the next slice. This file
// is only the lock on the drawer.
//
// ── Named partnerKey, not sceneKey, on purpose ──────────────────────────
// `storage.js` exports a `sceneKey(scene, word)` that builds a progress key
// for a word a scene introduced — nothing to do with an API key. This file
// was called `sceneKey.js` for exactly one commit, which put two unrelated
// meanings of "key" one letter apart in the same directory. It is the
// *partner* key: the credential for the scene partner. The two never meet —
// nothing imports both, and the progress blob must never contain anything
// from here.
//
// ── Why the key is encrypted at all ─────────────────────────────────────
// This app is published to GitHub Pages at majakulpa.github.io/italian-app/,
// and fourteen of the owner's repositories publish to that same host. The
// browser's storage is scoped to the *origin* — the host, not the path — so
// every one of those sites, and every third-party script any of them loads,
// can read anything this app puts in localStorage. A key in plain
// localStorage would be a key handed to thirteen other sites.
//
// So the owner's decision: a PIN, scoped to this one thing. What is stored is
// a ciphertext; the PIN is what turns it back into a key, it is asked for once
// per app run, and it unlocks nothing else anywhere in the app.
//
// This is not a claim that a four-digit PIN is a strong secret. It is a claim
// that reading the stored blob is no longer the same as reading the key, and
// that grinding a PIN offline costs real compute (see PBKDF2_ITERATIONS). The
// Casa copy says exactly that, and says the belt-and-braces move out loud: a
// key created for this alone, with a low spend limit set on it.
//
// ── Where the decrypted key lives ───────────────────────────────────────
// In `unlocked`, below. A module-scope variable, in memory, for as long as the
// page is loaded. Never localStorage, never sessionStorage, never a cookie,
// never a URL. A reload loses it and the PIN is asked for again, which is the
// intended cost.

// Its own slot, deliberately nowhere near the progress blob. Two reasons, and
// the second is the load-bearing one:
//
// - The progress blob is exported, migrated and used as a test fixture. A key
//   inside it would travel into all three.
// - Long-lived screens hold the progress blob in state and write it back
//   whole on every answer, so anything else living in it is one stale write
//   away from being clobbered — the same argument the coverage history makes.
const SLOT = "italiano:scene-key:v1";

export const RECORD_VERSION = 1;

// PBKDF2-HMAC-SHA256, 600,000 iterations.
//
// The number is OWASP's Password Storage Cheat Sheet recommendation for
// PBKDF2-HMAC-SHA256, and the reason to take the high end rather than a
// comfortable middle is that the secret being stretched is a *PIN*. Four
// digits is about 13 bits of entropy: an attacker holding the ciphertext has
// only ten thousand candidates to try. Iteration count is the only thing that
// makes trying them cost anything, and it is the one parameter we control.
//
// At 600,000 iterations a single guess is ~600k SHA-256 compressions, so a
// four-digit PIN costs an attacker ~6 × 10^9 of them — minutes to hours of a
// GPU's time per stolen blob rather than milliseconds. The honest reading is
// that this buys time and cost, not impossibility, which is why the copy also
// tells the learner to use a key with a spend limit.
//
// The price paid by the learner is one derivation per app run, on their own
// phone: measured at ~370 ms in Chrome on this machine (see the PR). Raising
// it further would start being felt at the moment a scene opens; lowering it
// would make the PIN decorative.
export const PBKDF2_ITERATIONS = 600000;

const SALT_BYTES = 16;
// 96 bits, the size AES-GCM is specified for — anything else makes the
// browser derive the nonce internally instead of using it directly.
const IV_BYTES = 12;

const MIN_PIN_LENGTH = 4;

// The prefix every Anthropic key has, and the only part of a key shape that
// appears anywhere in this repository. It is deliberately not a whole-key
// regex: scripts/check-no-secrets.mjs fails the build on a *whole* key shape,
// and the point of matching the whole shape there is that a line like this one
// can exist here without turning the guard into a thing people disable.
const KEY_PREFIX = "sk-ant-";

// Short enough that no real key is rejected (they run past a hundred
// characters), long enough that a truncated paste is caught.
const MIN_KEY_LENGTH = 40;

const MASK = "•".repeat(8);

// The decrypted key. The whole security model of this file is that this
// variable is the only place it exists after `save`.
let unlocked = null;

const encoder = new TextEncoder();

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

function random(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveAesKey(pin, salt) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    // Not extractable: nothing in this app has any reason to export the
    // derived key, and a key that cannot be exported cannot be exfiltrated by
    // script that gets a reference to it.
    false,
    ["encrypt", "decrypt"],
  );
}

// Anything unreadable reads as "nothing stored", the same answer storage.js
// gives a blob from a version it does not know: a bad record cannot be
// decrypted, so treating it as absent is the only useful reading. It is also
// why tampering and a wrong PIN are indistinguishable from the outside — both
// end at the same false from `unlock`.
function readRecord() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLOT));
    if (parsed?.version !== RECORD_VERSION) return null;
    return {
      salt: fromBase64(parsed.salt),
      iv: fromBase64(parsed.iv),
      ciphertext: fromBase64(parsed.ciphertext),
    };
  } catch {
    return null;
  }
}

export function hasStoredKey() {
  return readRecord() !== null;
}

// A paste usually arrives with a newline on it, so the key is trimmed before
// it is checked or stored. The PIN is not: a PIN with a space in it is a
// legitimate PIN, and silently trimming one would store something the learner
// cannot type again.
export function keyLooksRight(key) {
  const trimmed = key.trim();
  return trimmed.startsWith(KEY_PREFIX) && trimmed.length >= MIN_KEY_LENGTH;
}

export function pinLooksRight(pin) {
  return pin.length >= MIN_PIN_LENGTH;
}

// Why a reason rather than a thrown error: the caller has to put the message
// beside the field it belongs to, and a string it can look up in a table does
// that without a chain of `if`s at the call site. `{ ok: true }` on success.
//
// `save` also leaves the key unlocked in memory. The learner just typed it
// into this tab, so there is nothing to protect it from that is not already
// inside the page — and it means the row can show the masked tail immediately
// instead of asking for a PIN that was entered a second ago.
export async function save(key, pin) {
  if (!keyLooksRight(key)) return { ok: false, reason: "key" };
  if (!pinLooksRight(pin)) return { ok: false, reason: "pin" };

  const trimmed = key.trim();
  const salt = random(SALT_BYTES);
  const iv = random(IV_BYTES);
  const aes = await deriveAesKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, encoder.encode(trimmed));

  try {
    localStorage.setItem(
      SLOT,
      JSON.stringify({
        version: RECORD_VERSION,
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(new Uint8Array(ciphertext)),
      }),
    );
  } catch {
    // Private browsing, or a full quota. Nothing is held in memory either:
    // pretending the key was saved would mean a scene working once and then
    // silently asking for a key again on the next load.
    return { ok: false, reason: "storage" };
  }

  unlocked = trimmed;
  return { ok: true };
}

// Fails closed, and gives away nothing. A wrong PIN, a tampered ciphertext, a
// record from a future version and no record at all all return false, and the
// caller has one sentence for all four — "that PIN doesn't match". AES-GCM is
// authenticated, so a flipped byte fails the tag check rather than decrypting
// to rubbish that then gets sent to an API as a key.
//
// Nothing is written on failure: whatever was in memory before is still there,
// and a half-decrypted state does not exist.
export async function unlock(pin) {
  const record = readRecord();
  if (!record) return false;

  try {
    const aes = await deriveAesKey(pin, record.salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv }, aes, record.ciphertext);
    unlocked = new TextDecoder().decode(plain);
    return true;
  } catch {
    return false;
  }
}

export function isUnlocked() {
  return unlocked !== null;
}

// The decrypted key, for the one caller that will need to pass it to the API —
// named for what it is at rest rather than what it is in the hand, because
// every other name for it ("apiKey", "plaintext") reads like something that
// would be fine to log. Returns null while locked.
export function lockedKey() {
  return unlocked;
}

// Never the whole key, on screen or anywhere else. Four characters of a
// hundred-character key is enough to tell two keys apart and not enough to be
// one, and it comes from memory rather than from storage — there is
// deliberately no plaintext tail stored beside the ciphertext for the locked
// case, because those four characters would then be four characters the other
// thirteen sites can read.
export function maskedKey() {
  return unlocked === null ? null : `${MASK}${unlocked.slice(-4)}`;
}

// Drop the key from memory without touching what is stored. What a "lock
// again" control calls, and what the next slice calls when a scene ends.
export function forget() {
  unlocked = null;
}

// Forget the key entirely. Storage *and* memory: a Remove that left the
// decrypted key in memory would leave the app able to run a scene with a key
// the learner has just been told is gone.
export function remove() {
  forget();
  try {
    localStorage.removeItem(SLOT);
  } catch {
    // Storage unavailable. There was nothing readable in it to remove.
  }
}
