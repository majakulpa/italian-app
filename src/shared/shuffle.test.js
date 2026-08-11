import { describe, it, expect, afterEach, vi } from "vitest";
import { shuffle } from "./shuffle.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shuffle", () => {
  it("returns the same items, so no quiz option is ever lost or duplicated", () => {
    const input = ["a", "b", "c", "d", "e"];
    expect([...shuffle(input)].sort()).toEqual([...input].sort());
  });

  it("does not mutate its input", () => {
    const input = ["a", "b", "c", "d"];
    shuffle(input);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });

  it("handles empty and single-item lists", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["only"])).toEqual(["only"]);
  });

  // Math.random() === 0 makes every swap pick index 0, which is a fixed,
  // checkable permutation — enough to prove items really move.
  it("actually reorders", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(shuffle(["a", "b", "c"])).toEqual(["b", "c", "a"]);
  });
});
