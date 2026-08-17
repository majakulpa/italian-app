import { describe, it, expect } from "vitest";
import { GRAMMAR_LEVELS, PRONOUN_GLOSS } from "./grammar.js";

const allTopics = GRAMMAR_LEVELS.flatMap((level) => level.topics.map((topic) => ({ level, topic })));
const allTables = allTopics.map(({ level, topic }) => ({ level, topic, table: topic.explanation.table }));

describe("GRAMMAR_LEVELS", () => {
  it("has A1 through C1, each with a level accent the modules can render", () => {
    expect(GRAMMAR_LEVELS.map((l) => l.id)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
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

  // Every Italian word in a table is either translated inline as { it, en }
  // or is a subject pronoun the renderer glosses from PRONOUN_GLOSS. A bare
  // string that's neither would leave a beginner with untranslated Italian.
  it.each(allTables.filter((t) => t.table).map(({ level, topic, table }) => [`${level.id} · ${topic.id}`, table]))(
    "%s translates every table label",
    (_name, table) => {
      const labels = [
        ...table.headers,
        // The first column holds the row labels; the rest are the forms
        // being taught, which the lesson's examples already cover.
        ...table.rows.map((row) => row[0]),
      ];
      for (const label of labels) {
        if (label === "") continue;
        const translated = typeof label === "object" ? Boolean(label.en) : label in PRONOUN_GLOSS;
        expect({ label, translated }).toEqual({ label, translated: true });
      }
    }
  );

  it("glosses each of the six subject pronouns", () => {
    expect(Object.keys(PRONOUN_GLOSS)).toEqual(["io", "tu", "lui / lei", "noi", "voi", "loro"]);
    for (const en of Object.values(PRONOUN_GLOSS)) {
      expect(en.trim()).toBeTruthy();
    }
  });

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

  // Without these a beginner sees an Italian sentence with a hole in it and
  // an infinitive they may never have met.
  it.each(allTopics.map(({ level, topic }) => [`${level.id} · ${topic.id}`, topic]))(
    "%s translates every drill prompt and spells out its hint in English",
    (_name, topic) => {
      for (const drill of topic.drills) {
        expect(drill.en.trim()).toBeTruthy();
        // A hint is either already plain English ("as tall as", "the (masc.
        // + consonant)"), or the "infinitive — person" form — and that form
        // has to gloss the Italian infinitive, which is the word a beginner
        // won't know.
        if (!drill.hint.includes(" — ")) continue;
        const [infinitive] = drill.hint.split(" — ");
        expect({ hint: drill.hint, glossed: /\(.+\)/.test(infinitive) }).toEqual({
          hint: drill.hint,
          glossed: true,
        });
      }
    }
  );
});
