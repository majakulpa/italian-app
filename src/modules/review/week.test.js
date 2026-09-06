import { describe, it, expect } from "vitest";
import { solidThisWeek, WEEK_DAYS } from "./week.js";
import { LEVELS } from "../../data/vocab.js";
import { GRAMMAR_LEVELS } from "../../data/grammar.js";
import { wordKey, drillKey, addDaysISO } from "../../shared/storage.js";
import { MAX_BOX } from "../../shared/srs.js";

const a1Vocab = LEVELS.find((l) => l.id === "A1");
const greetings = a1Vocab.categories.find((c) => c.id === "greetings");
const key = (i) => wordKey(a1Vocab, greetings, greetings.words[i]);

const a1Grammar = GRAMMAR_LEVELS.find((l) => l.id === "A1");
const topic = a1Grammar.topics[0];
const DRILL_KEY = drillKey(a1Grammar, topic, topic.drills[0]);

const TODAY = "2026-03-10";
const at = (box, days) => ({ box, due: addDaysISO(TODAY, days), last: TODAY });

const progressWith = (schedule) => ({ words: {}, schedule });

describe("what comes back this week", () => {
  it("counts nothing when nothing is scheduled", () => {
    expect(solidThisWeek(progressWith({}), TODAY)).toBe(0);
  });

  it("counts a solid word whose turn falls inside the week", () => {
    expect(solidThisWeek(progressWith({ [key(0)]: at(MAX_BOX, 3) }), TODAY)).toBe(1);
  });

  it("counts the last day of the window and not the one after it", () => {
    const schedule = { [key(0)]: at(MAX_BOX, WEEK_DAYS), [key(1)]: at(MAX_BOX, WEEK_DAYS + 1) };
    expect(solidThisWeek(progressWith(schedule), TODAY)).toBe(1);
  });

  // Already due is the queue, and the queue is the count beside the title.
  // This card is about what is not on the pile yet.
  it("leaves out anything already due", () => {
    const schedule = { [key(0)]: at(MAX_BOX, 0), [key(1)]: at(MAX_BOX, -4) };
    expect(solidThisWeek(progressWith(schedule), TODAY)).toBe(0);
  });

  // "Solid" is the top box. A word in box 3 is known, which is a different
  // claim, and rolling it in would inflate the figure.
  it("leaves out a word that is known but not solid", () => {
    expect(solidThisWeek(progressWith({ [key(0)]: at(MAX_BOX - 1, 3) }), TODAY)).toBe(0);
  });

  // `solid` is a word state (wordState.js) and a grammar drill is not a word.
  // It still turns up in the session; it is just not what this sentence says.
  it("counts words only, not the grammar drills scheduled beside them", () => {
    expect(solidThisWeek(progressWith({ [DRILL_KEY]: at(MAX_BOX, 3) }), TODAY)).toBe(0);
  });
});
