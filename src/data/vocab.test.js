import { describe, it, expect } from "vitest";
import { LEVELS } from "./vocab.js";

const allCategories = LEVELS.flatMap((level) => level.categories.map((category) => ({ level, category })));

describe("LEVELS", () => {
  it("has A1 through C1, each with a level accent the modules can render", () => {
    expect(LEVELS.map((l) => l.id)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
    for (const level of LEVELS) {
      expect(level.label).toBeTruthy();
      expect(level.name).toBeTruthy();
      expect(level.tagline).toBeTruthy();
      expect(level.accent).toBeTruthy();
      expect(level.accentDeep).toBeTruthy();
      expect(level.categories.length).toBeGreaterThan(0);
    }
  });

  it("keeps category ids unique within a level", () => {
    for (const level of LEVELS) {
      const ids = level.categories.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(allCategories.map(({ level, category }) => [`${level.id} · ${category.id}`, category]))(
    "%s has fully filled-in words",
    (_name, category) => {
      expect(category.name).toBeTruthy();
      for (const word of category.words) {
        expect(word.it.trim()).toBeTruthy();
        expect(word.en.trim()).toBeTruthy();
        expect(word.ex.trim()).toBeTruthy();
        expect(word.exEn.trim()).toBeTruthy();
      }
    }
  );

  // buildQuizQuestions in VocabModule builds a question per word with three
  // distractors drawn from the same category, so a category smaller than
  // four would silently produce short option lists.
  it.each(allCategories.map(({ level, category }) => [`${level.id} · ${category.id}`, category]))(
    "%s has at least four words, with no duplicate Italian entries",
    (_name, category) => {
      expect(category.words.length).toBeGreaterThanOrEqual(4);
      const italian = category.words.map((w) => w.it);
      expect(new Set(italian).size).toBe(italian.length);
    }
  );

  // Quiz options are the English meanings, so two words sharing one would
  // give a question with two correct-looking answers.
  it.each(allCategories.map(({ level, category }) => [`${level.id} · ${category.id}`, category]))(
    "%s has no two words sharing an English meaning",
    (_name, category) => {
      const english = category.words.map((w) => w.en);
      expect(new Set(english).size).toBe(english.length);
    }
  );
});
