import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  save,
  unlock,
  isUnlocked,
  lockedKey,
  maskedKey,
  forget,
  remove,
  hasStoredKey,
  keyLooksRight,
  pinLooksRight,
  PBKDF2_ITERATIONS,
  RECORD_VERSION,
} from "./sceneKey.js";
import { loadProgress, saveProgress, saveCoverageHistory, saveThemeMode, riservaKey } from "./storage.js";
import { FONDAMENTALE } from "../data/fondamentale.js";
import { FAKE_KEY, OTHER_FAKE_KEY } from "../test/fakeKey.js";

// These tests run against the browser's real WebCrypto — jsdom 30 exposes
// Node's `crypto.subtle`, so no shim is needed and none is installed. That
// matters: a stubbed AES-GCM would happily "decrypt" a tampered ciphertext,
// and the tamper test below is only worth anything because the tag check is
// the real one.
//
// The cost is real too. At PBKDF2_ITERATIONS a single derivation is ~0.4s
// here, so every round trip in this file is about a second. The tests are
// written to derive as few times as they can get away with rather than to
// lower the parameter for the suite, because the parameter is one of the
// things under test.

const SLOT = "italiano:scene-key:v1";

beforeEach(() => {
  localStorage.clear();
  forget();
});

afterEach(() => {
  forget();
});

describe("the scene-partner key at rest", () => {
  it("comes back out of storage under the PIN it went in with", async () => {
    expect(hasStoredKey()).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(lockedKey()).toBe(null);

    expect(await save(FAKE_KEY, "4821")).toEqual({ ok: true });
    expect(hasStoredKey()).toBe(true);

    // A reload: the page is gone, the memory with it, the storage stays.
    forget();
    expect(isUnlocked()).toBe(false);

    expect(await unlock("4821")).toBe(true);
    expect(lockedKey()).toBe(FAKE_KEY);
    expect(isUnlocked()).toBe(true);
  });

  it("stores a versioned record of salt, IV and ciphertext, and nothing else", async () => {
    await save(FAKE_KEY, "4821");

    const record = JSON.parse(localStorage.getItem(SLOT));
    expect(Object.keys(record).sort()).toEqual(["ciphertext", "iv", "salt", "version"]);
    expect(record.version).toBe(RECORD_VERSION);
    // 16 salt bytes and 12 IV bytes, base64.
    expect(atob(record.salt)).toHaveLength(16);
    expect(atob(record.iv)).toHaveLength(12);
  });

  it("uses a fresh salt and IV each time, so the same key twice is not the same ciphertext", async () => {
    await save(FAKE_KEY, "4821");
    const first = JSON.parse(localStorage.getItem(SLOT));
    await save(FAKE_KEY, "4821");
    const second = JSON.parse(localStorage.getItem(SLOT));

    expect(second.salt).not.toBe(first.salt);
    expect(second.iv).not.toBe(first.iv);
    expect(second.ciphertext).not.toBe(first.ciphertext);
  });

  it("stretches the PIN hard enough to be worth calling a lock", () => {
    // A PIN is worth ~13 bits. The iteration count is the whole defence
    // against grinding all ten thousand of them, so it is pinned here rather
    // than left as a number someone can quietly halve to speed the suite up.
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });
});

describe("a PIN that does not match", () => {
  it("fails closed, leaves no partial state, and says the same thing as tampered data", async () => {
    await save(FAKE_KEY, "4821");
    forget();

    expect(await unlock("4820")).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(lockedKey()).toBe(null);
    expect(maskedKey()).toBe(null);
    // Still stored: a wrong PIN is not a reason to destroy the key.
    expect(hasStoredKey()).toBe(true);
  });

  it("does not disturb a key that is already unlocked", async () => {
    await save(FAKE_KEY, "4821");

    expect(await unlock("nope")).toBe(false);
    expect(lockedKey()).toBe(FAKE_KEY);
  });

  it("refuses a tampered ciphertext with the right PIN, because AES-GCM is authenticated", async () => {
    await save(FAKE_KEY, "4821");
    forget();

    const record = JSON.parse(localStorage.getItem(SLOT));
    const bytes = Uint8Array.from(atob(record.ciphertext), (c) => c.charCodeAt(0));
    bytes[0] ^= 1;
    let flipped = "";
    for (const byte of bytes) flipped += String.fromCharCode(byte);
    localStorage.setItem(SLOT, JSON.stringify({ ...record, ciphertext: btoa(flipped) }));

    expect(await unlock("4821")).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it("reads an absent, unparseable, mis-versioned or non-base64 record as nothing stored", async () => {
    expect(hasStoredKey()).toBe(false);
    expect(await unlock("4821")).toBe(false);

    localStorage.setItem(SLOT, "{not json");
    expect(hasStoredKey()).toBe(false);

    localStorage.setItem(SLOT, JSON.stringify({ version: RECORD_VERSION + 1, salt: "AA==", iv: "AA==", ciphertext: "AA==" }));
    expect(hasStoredKey()).toBe(false);

    localStorage.setItem(SLOT, JSON.stringify({ version: RECORD_VERSION, salt: "!!!", iv: "AA==", ciphertext: "AA==" }));
    expect(hasStoredKey()).toBe(false);
    expect(await unlock("4821")).toBe(false);
  });
});

describe("what it refuses to store", () => {
  it("rejects something that is not shaped like an Anthropic key", async () => {
    expect(await save("hunter2", "4821")).toEqual({ ok: false, reason: "key" });
    expect(await save(FAKE_KEY.slice(0, 20), "4821")).toEqual({ ok: false, reason: "key" });
    expect(hasStoredKey()).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it("rejects a PIN shorter than four characters", async () => {
    expect(await save(FAKE_KEY, "123")).toEqual({ ok: false, reason: "pin" });
    expect(hasStoredKey()).toBe(false);
  });

  it("exports the two checks so a form can use the same rules", () => {
    expect(keyLooksRight(FAKE_KEY)).toBe(true);
    expect(keyLooksRight("sk-ant-short")).toBe(false);
    expect(keyLooksRight(`not-a-key-${"x".repeat(60)}`)).toBe(false);
    expect(pinLooksRight("1234")).toBe(true);
    expect(pinLooksRight("12 4")).toBe(true);
    expect(pinLooksRight("12")).toBe(false);
  });

  it("trims a pasted key but never the PIN", async () => {
    expect(await save(`  ${FAKE_KEY}\n`, " 4821 ")).toEqual({ ok: true });
    expect(lockedKey()).toBe(FAKE_KEY);

    forget();
    expect(await unlock("4821")).toBe(false);
    expect(await unlock(" 4821 ")).toBe(true);
  });

  it("says so rather than pretending, when storage will not take it", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(await save(FAKE_KEY, "4821")).toEqual({ ok: false, reason: "storage" });
    // Nothing in memory either: a scene that worked once and then asked for a
    // key again on the next load would be worse than a plain refusal.
    expect(isUnlocked()).toBe(false);

    vi.restoreAllMocks();
  });
});

describe("what leaves memory, and what leaves the device", () => {
  it("shows a masked tail and never the whole key", async () => {
    await save(FAKE_KEY, "4821");

    const masked = maskedKey();
    expect(masked).toBe(`••••••••${FAKE_KEY.slice(-4)}`);
    expect(masked).not.toContain(FAKE_KEY.slice(0, 20));
    expect(FAKE_KEY).not.toContain(masked);
  });

  it("forget() drops the key from memory and leaves the stored record alone", async () => {
    await save(FAKE_KEY, "4821");
    expect(isUnlocked()).toBe(true);

    forget();

    expect(isUnlocked()).toBe(false);
    expect(lockedKey()).toBe(null);
    expect(maskedKey()).toBe(null);
    expect(hasStoredKey()).toBe(true);
  });

  it("remove() clears the record and memory together", async () => {
    await save(FAKE_KEY, "4821");

    remove();

    expect(hasStoredKey()).toBe(false);
    expect(localStorage.getItem(SLOT)).toBe(null);
    // Memory too: a Remove that left the key usable would contradict the
    // sentence the learner just read.
    expect(isUnlocked()).toBe(false);
    expect(await unlock("4821")).toBe(false);
  });

  it("survives storage refusing the removal", async () => {
    await save(FAKE_KEY, "4821");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(() => remove()).not.toThrow();
    expect(isUnlocked()).toBe(false);

    vi.restoreAllMocks();
  });
});

describe("the key and the progress blob", () => {
  // The reason the key has its own slot rather than a field in the progress
  // blob: the blob is exported, migrated, held in component state and written
  // back whole. This is the test that stops a future convenience from moving
  // the key into it.
  it("puts nothing of the key into the progress blob, or any slot progress code reads", async () => {
    saveProgress({ words: { [riservaKey(FONDAMENTALE[0])]: "known" }, schedule: {} });
    saveCoverageHistory([{ date: "2026-01-01", pct: 1 }]);
    saveThemeMode("dark");

    await save(FAKE_KEY, "4821");

    const progress = loadProgress();
    expect(JSON.stringify(progress)).not.toContain(FAKE_KEY);
    expect(JSON.stringify(progress)).not.toContain("sk-ant");
    expect(Object.keys(progress.words)).toEqual([riservaKey(FONDAMENTALE[0])]);

    // And nothing anywhere else. Every slot, not just the three above, so
    // that a new slot added later is covered by this test the day it appears.
    const slots = Object.keys(localStorage);
    expect(slots).toContain(SLOT);
    for (const slot of slots) {
      const value = localStorage.getItem(slot);
      expect(value, `${slot} holds the key in plain text`).not.toContain(FAKE_KEY);
      expect(value, `${slot} holds the key's tail in plain text`).not.toContain(FAKE_KEY.slice(-8));
      if (slot !== SLOT) expect(value, `${slot} mentions a key`).not.toContain("sk-ant");
    }
  });

  it("leaves the progress blob untouched when the key is removed", async () => {
    saveProgress({ words: { [riservaKey(FONDAMENTALE[0])]: "known" }, schedule: {} });
    await save(OTHER_FAKE_KEY, "4821");

    remove();

    expect(loadProgress().words).toEqual({ [riservaKey(FONDAMENTALE[0])]: "known" });
  });
});
