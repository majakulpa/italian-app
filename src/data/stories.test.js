import { describe, it, expect } from "vitest";
import { STORY_LEVELS } from "./stories.js";
import { tokenize, lookupGloss } from "../modules/stories/gloss.js";

const allStories = STORY_LEVELS.flatMap((level) => level.stories.map((story) => ({ level, story })));

describe("STORY_LEVELS", () => {
  it("has A1 through C1 with two stories each and a level accent", () => {
    expect(STORY_LEVELS.map((l) => l.id)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
    for (const level of STORY_LEVELS) {
      expect(level.stories).toHaveLength(2);
      expect(level.accent).toBeTruthy();
      expect(level.accentDeep).toBeTruthy();
    }
  });

  it("gives every story a unique id within its level", () => {
    for (const level of STORY_LEVELS) {
      const ids = level.stories.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it.each(allStories.map(({ level, story }) => [`${level.id} · ${story.title}`, story]))(
    "%s has the card fields the home screen renders",
    (_name, story) => {
      expect(story.tagline).toBeTruthy();
      expect(story.blurb).toBeTruthy();
      expect(story.minutes).toBeGreaterThan(0);
      expect(story.paragraphs.length).toBeGreaterThanOrEqual(7);
    }
  );

  it.each(allStories.map(({ level, story }) => [`${level.id} · ${story.title}`, story]))(
    "%s has translated paragraphs",
    (_name, story) => {
      for (const paragraph of story.paragraphs) {
        expect(paragraph.it.trim()).toBeTruthy();
        expect(paragraph.en.trim()).toBeTruthy();
      }
    }
  );

  // A gloss key that doesn't occur in its own paragraph is dead data — the
  // reader would never render it, and nothing else would complain.
  it.each(allStories.map(({ level, story }) => [`${level.id} · ${story.title}`, story]))(
    "%s only glosses words that appear in the paragraph",
    (_name, story) => {
      for (const paragraph of story.paragraphs) {
        const matched = new Set(
          tokenize(paragraph.it)
            .map((piece) => lookupGloss(paragraph.gloss, piece))
            .filter(Boolean)
            .map((entry) => entry.word)
        );
        for (const key of Object.keys(paragraph.gloss || {})) {
          expect({ paragraph: paragraph.it, key, found: matched.has(key) }).toEqual({
            paragraph: paragraph.it,
            key,
            found: true,
          });
        }
      }
    }
  );

  it.each(allStories.map(({ level, story }) => [`${level.id} · ${story.title}`, story]))(
    "%s has three answerable comprehension questions",
    (_name, story) => {
      expect(story.questions).toHaveLength(3);
      const ids = story.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of story.questions) {
        expect(q.prompt).toBeTruthy();
        expect(q.explain).toBeTruthy();
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
    }
  );
});
