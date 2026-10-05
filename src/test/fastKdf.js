// PBKDF2 at the shipped work factor, for the tests that are not about it.
//
// shared/partnerKey.js derives its AES key with PBKDF2-HMAC-SHA256 at
// PBKDF2_ITERATIONS (600,000), which is the point: grinding a PIN offline has
// to cost real compute. It costs the test suite real compute too — a single
// derivation measures ~0.4s on a fast machine and ~2.4s on a slow one, and
// four of them sit inside a11y.test.jsx's Le Scene scans, ten inside
// ScenePartner.test.jsx. That is minutes of CPU spent re-proving that
// PBKDF2 is slow.
//
// This drops the work factor to one iteration and changes nothing else. The
// algorithm is still the real PBKDF2-HMAC-SHA256, the key is still a real
// non-extractable AES-GCM key, and AES-GCM's tag check is still the real one —
// so a wrong PIN and a tampered record still fail exactly as they do in the
// browser. It applies to both halves of a round trip (save derives, unlock
// derives again from the stored salt), so the two still agree.
//
// Three files deliberately do NOT use this, and the reasons are different:
//
//   shared/partnerKey.test.js asserts the iteration count itself. A test that
//   lowered the parameter it is checking would be worthless.
//
//   shared/ScenePinPrompt.test.jsx and modules/casa/PartnerKeyRow.test.jsx
//   assert the *pending* affordance — the button that reads "Unlocking…" or
//   "Locking the key…" while the PIN is being stretched. That state only
//   exists because the derivation takes human-perceptible time, so at one
//   iteration it is over before the assertion can see it and both tests fail
//   with "Unable to find an accessible element with the role button and name
//   Unlocking…". They keep the real work factor, and their raised
//   asyncUtilTimeout with it; the slowness is the thing they are about.
//
// What is left — the axe sweeps of the screens behind a key, and the
// conversation tests that need a key to exist at all — only needs a key that
// goes in and comes back out.
import { vi } from "vitest";

// Captured once, at import, and deliberately not inside useFastKdf().
//
// Reading it per call looks harmless and is not: the files that call this from
// `beforeEach` do not all call `vi.restoreAllMocks()` afterwards, so on the
// second test the "real" function read here would be the previous spy, and the
// shim would delegate to itself. That is an infinite recursion, and it is how
// this was first written — eleven tests across ScenePinPrompt.test.jsx and
// PartnerKeyRow.test.jsx died with "Maximum call stack size exceeded".
//
// Imports are evaluated before any test runs, so this is always the pristine
// WebCrypto method, and calling useFastKdf() any number of times is safe.
const REAL_DERIVE_KEY = crypto.subtle.deriveKey.bind(crypto.subtle);

export function useFastKdf() {
  // Spied rather than assigned, so a file that does restore its mocks gets the
  // shipped work factor back rather than keeping a cheap one by accident.
  vi.spyOn(crypto.subtle, "deriveKey").mockImplementation((algorithm, ...rest) =>
    REAL_DERIVE_KEY({ ...algorithm, iterations: 1 }, ...rest),
  );
}
