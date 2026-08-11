import { describe, it, expect } from "vitest";
import { GRAMMAR_LEVELS } from "./grammar.js";

const allTopics = GRAMMAR_LEVELS.flatMap((level) => level.topics.map((topic) => ({ level, topic })));

describe("GRAMMAR_LEVELS", () => {
  it("has A1/A2/B1, each with a level accent the modules can render", () => {
    expect(GRAMMAR_LEVELS.map((l) => l.id)).toEqual(["A1", "A2", "B1"]);
    for (const level of GRAMMAR_LEVELS) {
      expect(level.label).toBeTruthy();
      expect(level.name).toBeTruthy();
      expect(level.tagline).toBeTruthy();
      expect(level.accent).toBeTruthy();
      expect(level.accentDeep).toBeTruthy();
      expect(level.topics.length).toBeGreaterThan(0);
    }
  });

  it("keeps topic ids unique within a level", () => {
    for (const level of GRAMMAR_LEVELS) {
      const ids = level.topics.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(allTopics.map(({ level, topic }) => [`${level.id} · ${topic.id}`, topic]))(
    "%s has a lesson the explanation screen can render",
    (_name, topic) => {
      expect(topic.name).toBeTruthy();
      expect(topic.tagline).toBeTruthy();
      expect(topic.explanation.summary.trim()).toBeTruthy();
      expect(topic.explanation.points.length).toBeGreaterThan(0);
      for (const example of topic.explanation.examples || []) {
        expect(example.it.trim()).toBeTruthy();
        expect(example.en.trim()).toBeTruthy();
      }
    }
  );

  // The table is optional, but a ragged one would break the conjugation grid.
  it.each(allTopics.map(({ level, topic }) => [`${level.id} · ${topic.id}`, topic]))(
    "%s has a rectangular conjugation table, when it has one at all",
    (_name, topic) => {
      const table = topic.explanation.table;
      if (!table) return;
      expect(table.headers.length).toBeGreaterThan(1);
      for (const row of table.rows) {
        expect(row).toHaveLength(table.headers.length);
      }
    }
  );

  it.each(allTopics.map(({ level, topic }) => [`${level.id} · ${topic.id}`, topic]))(
    "%s has answerable drills with unique ids",
    (_name, topic) => {
      expect(topic.drills.length).toBeGreaterThanOrEqual(4);
      const ids = topic.drills.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const drill of topic.drills) {
        expect(drill.prompt).toContain("___");
        expect(drill.hint.trim()).toBeTruthy();
        expect(new Set(drill.options).size).toBe(drill.options.length);
        expect(drill.options).toContain(drill.answer);
      }
    }
  );
});
