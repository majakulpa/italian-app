import { describe, it, expect } from "vitest";
import { STRANDS, RULES, ARTICLE_FORMS, ZERO, filled } from "./articoli.js";
import { CITY_ACCENTS } from "../shared/theme.js";

// Gli Articoli is authored linguistic data, and a wrong answer here is worse
// than a bug: it teaches the learner something false about the one part of
// Italian neither of her languages helps with. So the invariants below are
// the ones a human proofreader would apply, written down — the same
// discipline as mappe.test.js.
//
// The load-bearing ones are "every option is a form the feedback can
// classify" and "every item's answer is one of its own options". Both are
// silent failures otherwise: an unclassifiable option makes judge() read
// `undefined.kind`, and an answer outside the options is an item nobody can
// ever get right.

const eachStrand = STRANDS.map((strand) => [strand.id, strand]);
const eachItem = STRANDS.flatMap((strand) => strand.items.map((item) => [`${strand.id}/${item.id}`, strand, item]));
const eachRule = Object.entries(RULES);

describe("the strands", () => {
  // The design's own footer states the order — determinativo ✓ ·
  // indeterminativo ✓ · preposizioni articolate — adesso — and it is a
  // teaching decision, not authoring order: a fused preposition is a definite
  // article welded onto a preposition, so it cannot come first.
  it("sequences determinativo, then indeterminativo, then the fused prepositions", () => {
    expect(STRANDS.map((s) => s.id)).toEqual(["determinativo", "indeterminativo", "preposizioni"]);
  });

  it("gives every strand a distinct id and a distinct city accent", () => {
    expect(new Set(STRANDS.map((s) => s.id)).size).toBe(STRANDS.length);
    expect(new Set(STRANDS.map((s) => s.accent)).size).toBe(STRANDS.length);
  });

  it.each(eachStrand)("%s paints in an accent the design system actually has", (_id, strand) => {
    expect(CITY_ACCENTS[strand.accent]).toBeDefined();
  });

  // Pink is the Polish anchor card on this screen, the way it is the Polish
  // road in Le Mappe. A strand painted pink would put the colour on two
  // different meanings inside one drill.
  it.each(eachStrand)("%s leaves pink to the Polish anchor", (_id, strand) => {
    expect(strand.accent).not.toBe("bubble");
  });

  it.each(eachStrand)("%s says what it is for, in both languages' worth of naming", (_id, strand) => {
    expect(strand.name.trim()).toBeTruthy();
    expect(strand.label.trim()).toBeTruthy();
    expect(strand.reach.trim()).toBeTruthy();
    expect(strand.items.length).toBeGreaterThanOrEqual(4);
  });

  it.each(eachStrand)("%s teaches rules that exist, and no rule twice", (_id, strand) => {
    for (const id of strand.teaches) expect(RULES[id], id).toBeDefined();
    expect(new Set(strand.teaches).size).toBe(strand.teaches.length);
  });

  // A card that teaches four rules and then drills a fifth would be asking
  // for something it never taught — the opposite of "produce first".
  it.each(eachStrand)("%s drills only rules its own card teaches", (_id, strand) => {
    for (const item of strand.items) expect(strand.teaches, item.id).toContain(item.rule);
  });
});

describe("the rules", () => {
  it.each(eachRule)("%s is filed under its own id", (key, rule) => {
    expect(rule.id).toBe(key);
  });

  it.each(eachRule)("%s carries Italian forms and an English explanation", (_key, rule) => {
    expect(rule.forms.length).toBeGreaterThan(0);
    for (const form of rule.forms) expect(form.trim()).toBeTruthy();
    expect(rule.when.trim()).toBeTruthy();
    expect(rule.says.trim()).toBeTruthy();
  });

  // A rule nothing drills is a rule the learner reads once and never applies,
  // which is the recognition-only shape this whole bench exists to avoid.
  it("drills every rule it states", () => {
    const drilled = new Set(STRANDS.flatMap((s) => s.items.map((i) => i.rule)));
    expect([...Object.keys(RULES)].filter((id) => !drilled.has(id))).toEqual([]);
  });
});

describe("the items", () => {
  it.each(eachItem)("%s offers the three choices the design draws", (_id, _strand, item) => {
    expect(item.options).toHaveLength(3);
    expect(new Set(item.options).size).toBe(3);
  });

  // Without this an item is unanswerable: every option scores wrong and the
  // second attempt reveals a form that was never on screen.
  it.each(eachItem)("%s puts its own answer among its options", (_id, _strand, item) => {
    expect(item.options).toContain(item.answer);
  });

  // judge() reads ARTICLE_FORMS[option].kind directly. A form missing from
  // the table is a TypeError at the moment the learner presses the button,
  // which is the worst possible place to find out.
  it.each(eachItem)("%s only offers forms the feedback can classify", (_id, _strand, item) => {
    for (const option of item.options) expect(ARTICLE_FORMS[option], option).toBeDefined();
  });

  it.each(eachItem)("%s names a rule that exists", (_id, _strand, item) => {
    expect(RULES[item.rule], item.rule).toBeDefined();
  });

  it.each(eachItem)("%s carries the sentence, its English and its Polish anchor", (_id, _strand, item) => {
    expect(item.before.trim()).toBeTruthy();
    expect(item.after.trim()).toBeTruthy();
    expect(item.en.trim()).toBeTruthy();
    expect(item.anchor.pl.trim()).toBeTruthy();
    expect(item.anchor.says.trim()).toBeTruthy();
  });

  // The gap is a gap. An item whose `before` or `after` already contained the
  // answer would be showing the learner what it is about to ask for.
  it.each(eachItem)("%s does not leave its own answer lying in the sentence", (_id, _strand, item) => {
    const words = `${item.before} ${item.after}`.toLowerCase().split(/[\s.,!?]+/);
    if (item.answer !== ZERO) expect(words).not.toContain(item.answer.toLowerCase());
  });

  it.each(eachItem)("%s reads as a finished Italian sentence once the gap is filled", (_id, _strand, item) => {
    const sentence = filled(item);
    expect(sentence).not.toMatch(/\s{2,}/);
    expect(sentence).toMatch(/[.!?]$/);
  });

  it("keeps item keys unique once they are namespaced by strand", () => {
    const keys = STRANDS.flatMap((s) => s.items.map((i) => `${s.id}:${i.id}`));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never asks for the same sentence twice across the whole set", () => {
    const sentences = STRANDS.flatMap((s) => s.items.map((i) => filled(i)));
    expect(new Set(sentences).size).toBe(sentences.length);
  });
});

describe("the zero article", () => {
  // PLAN's point and the design's: the third option on screen 12 is `—`, and
  // it is a real answer rather than a filler. If no item ever answers ZERO,
  // the learner can safely never pick it, and the hardest third of the
  // strand — Sono medico, ho fame, abito in centro — has quietly gone.
  it("is the right answer somewhere, not only ever a distractor", () => {
    const zeroAnswers = STRANDS.flatMap((s) => s.items).filter((i) => ARTICLE_FORMS[i.answer].kind === "zero");
    expect(zeroAnswers.length).toBeGreaterThan(0);
  });

  it("puts nothing in the gap, where a bare preposition still puts its own word", () => {
    const medico = STRANDS[1].items.find((i) => i.id === "medico");
    const centro = STRANDS[2].items.find((i) => i.id === "centro");

    expect(filled(medico)).toBe("Sono medico.");
    expect(filled(centro)).toBe("Abito in centro.");
  });

  it("can fill a gap with a form other than the answer, for the summary line", () => {
    const caffe = STRANDS[0].items.find((i) => i.id === "caffe");
    expect(filled(caffe, "un")).toBe("Bevo un caffè ogni mattina.");
  });
});

describe("the forms table", () => {
  it.each(Object.entries(ARTICLE_FORMS))("%s declares a kind the feedback knows", (_form, entry) => {
    expect(["definite", "indefinite", "fused", "unfused", "zero"]).toContain(entry.kind);
  });

  // The unfused forms are the distractors that carry the whole fusion lesson,
  // so each one has to have a fused partner to be wrong *against*.
  it("pairs every unfused distractor with the fused form Italian actually writes", () => {
    const fused = Object.entries(ARTICLE_FORMS).filter(([, e]) => e.kind === "fused");
    const unfused = Object.entries(ARTICLE_FORMS).filter(([, e]) => e.kind === "unfused");

    expect(unfused.length).toBeGreaterThan(0);
    for (const [form, entry] of unfused) {
      expect(form, form).toBe(`${entry.prep} ${entry.article}`);
      expect(
        fused.some(([, f]) => f.prep === entry.prep && f.article === entry.article),
        form,
      ).toBe(true);
    }
  });

  // Five prepositions fuse in Italian and PLAN names all five. Any one of
  // them missing is a hole in the strand that nothing else would report.
  it("covers di, a, da, in and su", () => {
    const preps = new Set(
      Object.values(ARTICLE_FORMS)
        .filter((e) => e.kind === "fused")
        .map((e) => e.prep),
    );
    expect([...preps].sort()).toEqual(["a", "da", "di", "in", "su"]);
  });
});
