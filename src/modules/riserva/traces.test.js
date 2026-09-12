import { describe, it, expect } from "vitest";
import { wordTraces } from "./traces.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { LEVELS } from "../../data/vocab.js";
import { STORY_LEVELS } from "../../data/stories.js";
import { wordKey, storyKey } from "../../shared/storage.js";
import { reviewItem } from "../../shared/srs.js";

const EMPTY = { version: 2, words: {}, schedule: {} };

const entry = (it) => FONDAMENTALE.find((e) => e.it === it);

function vocabKey(italian) {
  for (const level of LEVELS) {
    for (const category of level.categories) {
      const word = category.words.find((w) => w.it === italian);
      if (word) return wordKey(level, category, word);
    }
  }
  throw new Error(`no vocab word "${italian}"`);
}

function storyByTitle(title) {
  for (const level of STORY_LEVELS) {
    const story = level.stories.find((s) => s.title === title);
    if (story) return { level, story };
  }
  throw new Error(`no story "${title}"`);
}

const kinds = (traces) => traces.map((t) => t.kind);

describe("the two sources", () => {
  // "la stazione" is the one lemma in the list that both sources reach: the
  // A2 travel deck teaches it and the A1 Rome story glosses it. So it is
  // where the ordering and the two shapes can be checked at once.
  it("lists the deck sentence before the story that walked past the word", () => {
    const traces = wordTraces(EMPTY, entry("la stazione"));

    expect(kinds(traces)).toEqual(["deck", "story"]);
    expect(traces[0]).toMatchObject({ where: "Travel", it: "Ci vediamo alla stazione.", en: "See you at the station." });
    expect(traces[0].level.id).toBe("A2");
    expect(traces[1]).toMatchObject({ where: "Un giorno a Roma", meaning: "station" });
    expect(traces[1].level.id).toBe("A1");
  });

  // Most of the list is ahead of the lessons — 400 lexicon entries against
  // 120 deck words and ten stories — so "nowhere yet" is the common answer
  // and the screen has to be able to say it.
  it("finds nothing at all for a word no lesson has reached", () => {
    expect(wordTraces(EMPTY, entry("essere"))).toEqual([]);
  });

  // Ranks 301–400 raised this from 59 to 78 on their own — ordinary
  // everyday words like `governo` and `la legge` turned out to already be
  // deck words, and `il sole`, `gatto`, `storia` and others turned out to be
  // glossed somewhere in a story — without either being sought out on
  // purpose. That is the traces bridge doing exactly what it is for.
  it("leaves most of the shipped lexicon with no trace, and that is the honest count", () => {
    const traced = FONDAMENTALE.filter((e) => wordTraces(EMPTY, e).length > 0);
    expect(traced).toHaveLength(78);
    expect(FONDAMENTALE).toHaveLength(400);
  });

  // A lemma glossed in two different stories is two places you met it, and
  // both are listed, in the order the stories ship.
  it("lists every story that glossed the word", () => {
    const titles = wordTraces(EMPTY, entry("muro")).map((t) => t.where);

    expect(titles).toEqual(["La lucertola e la luna", "La casa sul lago"]);
  });
});

describe("what the learner has actually done", () => {
  // A deck trace is marked from the word's own status, and the bar is the
  // weakest honest one: answered at least once. Getting it wrong still means
  // you were there.
  it("marks a deck sentence once the card has been answered, right or wrong", () => {
    const key = vocabKey("stazione");
    expect(wordTraces(EMPTY, entry("la stazione"))[0].done).toBe(false);

    const missed = reviewItem(EMPTY, key, false, "2026-09-06");
    expect(wordTraces(missed, entry("la stazione"))[0].done).toBe(true);
  });

  // A story trace can only say whether the story was finished: reading one
  // writes no word status at all, which is why wordState.js has no `met`
  // state. Claiming more than that would be inventing a trace.
  it("marks a story only once the story itself is finished", () => {
    const { level, story } = storyByTitle("Un giorno a Roma");
    const traces = (progress) => wordTraces(progress, entry("la stazione"))[1];

    expect(traces(EMPTY).done).toBe(false);
    expect(traces({ ...EMPTY, words: { [storyKey(level, story)]: "done" } }).done).toBe(true);
  });

  // The two are independent: finishing the story says nothing about the card.
  it("does not let a finished story mark the deck sentence", () => {
    const { level, story } = storyByTitle("Un giorno a Roma");
    const traces = wordTraces({ ...EMPTY, words: { [storyKey(level, story)]: "done" } }, entry("la stazione"));

    expect(traces[0].done).toBe(false);
    expect(traces[1].done).toBe(true);
  });
});

// The limit the module header states, pinned so nobody "fixes" the display by
// hiding it. Matching is by written form — the app has no part of speech and
// no lemma on a story gloss — so the noun `porta` (door, rank 215) picks up
// the fairy tale's gloss of the verb form *porta* (carries). The trace is
// right about the encounter and wrong about the sense, and the gloss travels
// with it so a reader can see that for themselves.
describe("the homograph it cannot resolve", () => {
  it("keeps the story's own gloss beside the trace, mismatched sense and all", () => {
    const [trace] = wordTraces(EMPTY, entry("porta"));

    expect(entry("porta").en).toBe("door");
    expect(trace.meaning).toBe("takes, brings (portare)");
  });

  // The other half: it does not invent matches either. `arriva` in a story is
  // not `arrivare` in the lexicon, because lemmaKey compares written forms
  // and does not stem.
  it("does not match an inflected form onto the lemma", () => {
    expect(wordTraces(EMPTY, entry("arrivare")).filter((t) => t.kind === "story")).toEqual([]);
  });
});
