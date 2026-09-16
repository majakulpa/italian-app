import { describe, it, expect } from "vitest";
import { SCENES, SCENE_STAGE_PRESENTE } from "./scenes.js";
import { FONDAMENTALE } from "./fondamentale.js";

// Le scene are authored linguistic data, so the invariants below are the ones
// a human proofreader would apply, written down — the same bargain
// mappe.test.js strikes. A wrong line here does not crash anything: it
// teaches a beginner a form an Italian would not use, confidently, in a
// scene whose whole promise is that it is the real thing.
//
// Three of these tests are load-bearing rather than decorative:
//
//   the rank checklist   `knownRanks` is plain numbers, because that is what
//                        the brief's "N parole che sai già" count needs. That
//                        makes it silently wrong the day a rank in
//                        fondamentale.js means a different word. RANK_WORDS
//                        below is the authored claim about what each rank
//                        says, checked against the list, and every rank a
//                        scene uses has to appear in it — so a rank cannot
//                        be added to a scene without being spelled out here.
//
//   the fondamentale     Every `newWords` entry claims a `fondamentaleRank`,
//   claim                and the test resolves it for real. The whole reason
//                        scene words need their own scheduled module (plan
//                        S3) is that these words are *not* in the base list;
//                        `formaggio` is the one that turned out to be (rank
//                        235), which is why it sits in scene 2's knownRanks
//                        and not in its newWords. Guessing that was wrong.
//
//   the presente sweep   Stage 1 is presente only, and the form an author
//                        actually reaches for by mistake is not a futuro —
//                        it is the formal imperative. Design 03's own model
//                        dialogue opens "Mi dica, signora!", which is the
//                        present subjunctive of `dire` and cannot appear in
//                        a stage-1 scene. So that family is blacklisted by
//                        name, and every other word is made to declare
//                        itself: a verb with its tense, or a non-verb.
//
// The sweep is by inspection rather than by consulting real per-form stage
// tags, because those do not exist on main yet — they arrive with the stage
// ladder. When they land, this test should be rewritten to ask the ladder
// instead of asking an authored inventory, and both the inventory and the
// blacklist below deleted.

// ── The rank checklist ──────────────────────────────────────────────────
// rank → the word that rank has to be, for the scene that leans on it to
// mean what it says. Checked against FONDAMENTALE, both directions.
const RANK_WORDS = {
  1: "essere",
  2: "di",
  6: "avere",
  8: "un",
  11: "per",
  18: "questo",
  21: "volere",
  22: "potere",
  26: "tutto",
  28: "più",
  29: "no",
  44: "sì",
  45: "cosa",
  50: "molto",
  51: "bene",
  65: "così",
  66: "solo",
  67: "tanto",
  70: "altro",
  80: "buono",
  85: "bello",
  103: "dare",
  104: "prendere",
  136: "mangiare",
  148: "comprare",
  149: "pagare",
  150: "costare",
  212: "sera",
  235: "formaggio",
  302: "due",
  303: "tre",
  307: "sette",
  310: "dieci",
};

const byRank = new Map(FONDAMENTALE.map((entry) => [entry.rank, entry]));
const byWord = new Map(FONDAMENTALE.map((entry) => [entry.it, entry]));

const POS = new Set(["noun", "verb", "adj", "adv", "interrog", "phrase"]);
const ARTICLES = ["il ", "lo ", "la ", "l'", "i ", "gli ", "le "];

const eachScene = SCENES.map((scene) => [scene.id, scene]);
const eachWord = SCENES.flatMap((scene) => scene.newWords.map((word) => [`${scene.id}/${word.it}`, scene, word]));
const eachItem = SCENES.flatMap((scene) => scene.rehearsal.map((item) => [`${scene.id}/${item.id}`, scene, item]));
const eachCorrectable = SCENES.flatMap((scene) =>
  scene.correctables.map((fix) => [`${scene.id}/${fix.id}`, scene, fix]),
);
const eachRank = SCENES.flatMap((scene) => scene.knownRanks.map((rank) => [`${scene.id}/${rank}`, rank]));

describe("the scenes themselves", () => {
  it("ships the three Mercato scenes, distinctly identified", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["verdura", "salumiere", "quanto-costa"]);
    expect(new Set(SCENES.map((s) => s.title)).size).toBe(SCENES.length);
    for (const scene of SCENES) expect(scene.district).toBe("mercato");
  });

  it("puts every scene at the presente stage", () => {
    expect(SCENE_STAGE_PRESENTE).toBe(1);
    for (const scene of SCENES) expect(scene.stage).toBe(SCENE_STAGE_PRESENTE);
  });

  it.each(eachScene)("%s names an ability rather than a lesson", (_id, scene) => {
    // First person, and something the learner could read out and mean. "Posso"
    // is not decoration: design 02's argument is that the learner is becoming
    // someone who can buy tomatoes, not doing lesson 4.
    expect(scene.ability.it.startsWith("Posso ")).toBe(true);
    expect(scene.ability.it.endsWith(".")).toBe(true);
    expect(scene.ability.en.trim()).toBeTruthy();
    expect(scene.ability.en.startsWith("I can ")).toBe(true);
  });
});

describe("the lexicon the scenes lean on", () => {
  it.each(Object.entries(RANK_WORDS))("rank %s is still %s in fondamentale.js", (rank, word) => {
    const entry = byRank.get(Number(rank));
    expect(entry).toBeDefined();
    expect(entry.it).toBe(word);
  });

  it.each(eachRank)("%s is a rank this test has checked", (_label, rank) => {
    // The point of this one: a rank cannot be added to a scene's knownRanks
    // without being spelled out in RANK_WORDS, where the test above verifies
    // it actually means that word.
    expect(RANK_WORDS[rank]).toBeDefined();
  });

  it.each(eachScene)("%s lists its known ranks once each, in order", (_id, scene) => {
    expect(scene.knownRanks.length).toBeGreaterThan(0);
    expect(new Set(scene.knownRanks).size).toBe(scene.knownRanks.length);
    expect([...scene.knownRanks].sort((a, b) => a - b)).toEqual(scene.knownRanks);
    for (const rank of scene.knownRanks) expect(Number.isInteger(rank)).toBe(true);
  });
});

describe("the new words", () => {
  it.each(eachWord)("%s carries both glosses and a part of speech", (_label, _scene, word) => {
    expect(word.it.trim()).toBeTruthy();
    expect(word.en.trim()).toBeTruthy();
    expect(word.pl.trim()).toBeTruthy();
    expect(POS.has(word.pos)).toBe(true);
    // Not asserted: that the Polish differs from the English. It was, and
    // `euro` failed it — the Polish word for a euro is `euro`. fondamentale.js
    // does the same at rank 298, where `il problema` is "problem" in both, so
    // the stricter check was stricter than the house convention.
  });

  it.each(eachWord)("%s separates split senses the way fondamentale.js does", (_label, _scene, word) => {
    for (const gloss of [word.en, word.pl]) {
      if (!gloss.includes("·")) continue;
      expect(gloss).toMatch(/\S · \S/);
      expect(gloss).not.toMatch(/·[^ ]|[^ ]·/);
    }
  });

  it.each(eachWord)("%s stores its noun the way fondamentale.js stores nouns", (_label, _scene, word) => {
    if (word.pos !== "noun") {
      // Only nouns take the article convention, and only nouns take a gender.
      expect(word.gender).toBeUndefined();
      return;
    }
    const article = ARTICLES.find((a) => word.it.startsWith(a));
    if (article) {
      // Stored with its article, which is what an opaque ending requires.
      expect(/[oa]$/.test(word.it.slice(article.length))).toBe(false);
    } else {
      // Stored bare, which is only allowed when the ending gives the gender
      // away by itself.
      expect(word.it).toMatch(/[oa]$/);
    }
  });

  it.each(eachWord)("%s carries an explicit gender exactly where l' hides it", (_label, _scene, word) => {
    // fondamentale.js's rank-352 lesson: `l'` elides and stops carrying the
    // gender, so those entries and only those entries say it outright.
    if (word.it.startsWith("l'")) expect(["m", "f"]).toContain(word.gender);
    else expect(word.gender).toBeUndefined();
  });

  it.each(eachWord)("%s tells the truth about whether it is in fondamentale.js", (_label, _scene, word) => {
    const entry = byWord.get(word.it);
    expect(word.fondamentaleRank).toBe(entry ? entry.rank : null);
  });

  it("introduces each new word in one scene only", () => {
    const all = SCENES.flatMap((scene) => scene.newWords.map((word) => word.it));
    expect(new Set(all).size).toBe(all.length);
  });

  it.each(eachWord)("%s writes a real note if it writes one at all", (_label, _scene, word) => {
    if (word.note === undefined) return;
    expect(word.note.trim().length).toBeGreaterThan(20);
    expect(word.note.trim().endsWith(".")).toBe(true);
  });
});

describe("the grammar slice", () => {
  it.each(eachScene)("%s teaches one slice, with worked examples", (_id, scene) => {
    const { grammar } = scene;
    expect(grammar.slice.trim()).toBeTruthy();
    expect(grammar.title.trim()).toBeTruthy();
    expect(grammar.note.trim()).toBeTruthy();
    expect(grammar.examples.length).toBeGreaterThanOrEqual(2);
    for (const example of grammar.examples) {
      expect(example.it.trim()).toBeTruthy();
      expect(example.en.trim()).toBeTruthy();
    }
  });

  it.each(eachScene)("%s either builds a whole Polish card or none", (_id, scene) => {
    const { polish } = scene.grammar;
    // `null` is a real answer and the file argues for it in scene 2: a Polish
    // card only earns its space where Polish is the shorter road than
    // English, and `posso + infinito` is the same distance from both. A
    // half-filled card would be the padding this check exists to forbid.
    expect(scene.grammar).toHaveProperty("polish");
    if (polish === null) return;
    for (const field of ["it", "pl", "transfers", "differs"]) {
      expect(polish[field].trim()).toBeTruthy();
    }
    // A card that only says what transfers is a false friend of a card.
    expect(polish.differs.trim().length).toBeGreaterThan(20);
  });

  it("builds a Polish card only where one was argued for", () => {
    const withCard = SCENES.filter((scene) => scene.grammar.polish !== null).map((s) => s.id);
    expect(withCard).toEqual(["verdura", "quanto-costa"]);
  });
});

describe("the model dialogue", () => {
  it.each(eachScene)("%s models the task in 4 to 8 lines, translated", (_id, scene) => {
    expect(scene.model.length).toBeGreaterThanOrEqual(4);
    expect(scene.model.length).toBeLessThanOrEqual(8);
    for (const line of scene.model) {
      expect(["vendor", "customer"]).toContain(line.who);
      expect(line.it.trim()).toBeTruthy();
      expect(line.en.trim()).toBeTruthy();
    }
  });

  it.each(eachScene)("%s alternates the two speakers", (_id, scene) => {
    for (let i = 1; i < scene.model.length; i += 1) {
      expect(scene.model[i].who).not.toBe(scene.model[i - 1].who);
    }
  });
});

describe("the rehearsal items", () => {
  it.each(eachScene)("%s rehearses 3 or 4 things, distinctly identified", (_id, scene) => {
    expect(scene.rehearsal.length).toBeGreaterThanOrEqual(3);
    expect(scene.rehearsal.length).toBeLessThanOrEqual(4);
    const ids = scene.rehearsal.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(eachItem)("%s prompts in English and answers in Italian", (_label, _scene, item) => {
    expect(item.en.trim()).toBeTruthy();
    expect(item.answer.trim()).toBeTruthy();
    expect(item.en).not.toBe(item.answer);
  });

  it.each(eachItem)("%s accepts its own canonical answer", (_label, _scene, item) => {
    // shared/locatedFeedback.js `judge` takes exactly one `answer`, so the
    // screen picks the nearest `accepted` variant and judges against that
    // one (plan S5). If the canonical answer were not itself in the set, the
    // learner could type the app's own model answer and have it judged
    // against something else.
    expect(item.accepted).toContain(item.answer);
    expect(new Set(item.accepted).size).toBe(item.accepted.length);
    for (const variant of item.accepted) expect(variant.trim()).toBeTruthy();
  });

  it.each(eachItem)("%s keeps its neighbours off the accepted list", (_label, _scene, item) => {
    // A neighbour is another whole item the learner might have reached for —
    // a different quantity, a different cut. It is never a mis-formed version
    // of the answer: those are `correctables`. If the two sets overlapped,
    // judge would tell the learner a right answer was a different word.
    expect(item.neighbours.length).toBeGreaterThan(0);
    for (const neighbour of item.neighbours) {
      expect(neighbour.trim()).toBeTruthy();
      expect(item.accepted).not.toContain(neighbour);
    }
    expect(new Set(item.neighbours).size).toBe(item.neighbours.length);
  });
});

describe("the task", () => {
  it.each(eachScene)("%s sets a partner, a place, a goal and a way to know", (_id, scene) => {
    const { task } = scene;
    for (const pair of [task.partner, task.setting, task.goal, task.opening]) {
      expect(pair.it.trim()).toBeTruthy();
      expect(pair.en.trim()).toBeTruthy();
    }
    // The partner is a role at the market, named with its article.
    expect(task.partner.it).toMatch(/^(il|la|lo|l') /);
    expect(task.success.length).toBeGreaterThanOrEqual(2);
    // Plain terms, written for the partner model and the debrief rather than
    // for the screen — so English, and a whole statement each.
    for (const criterion of task.success) {
      expect(criterion.trim().endsWith(".")).toBe(true);
      expect(criterion.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("the correctables", () => {
  it.each(eachScene)("%s authors 3 to 5, distinctly identified", (_id, scene) => {
    expect(scene.correctables.length).toBeGreaterThanOrEqual(3);
    expect(scene.correctables.length).toBeLessThanOrEqual(5);
    const ids = scene.correctables.map((fix) => fix.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never reuses a correctable id across scenes", () => {
    const all = SCENES.flatMap((scene) => scene.correctables.map((fix) => fix.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it.each(eachCorrectable)("%s names a wrong form, a better one and why", (_label, _scene, fix) => {
    expect(fix.said.trim()).toBeTruthy();
    expect(fix.better.trim()).toBeTruthy();
    expect(fix.said).not.toBe(fix.better);
    expect(fix.why.trim().endsWith(".")).toBe(true);
    expect(fix.why.trim().length).toBeGreaterThan(10);
  });

  it.each(eachCorrectable)("%s declares a stage the debrief can check", (_label, scene, fix) => {
    // The debrief drops a correction above the learner's stage (plan S4), and
    // it reads the stage off this data rather than off what the model claims.
    // So `null` has to be written out — a forgotten field would otherwise
    // read as "always graded" and let anything through.
    expect(Object.prototype.hasOwnProperty.call(fix, "stage")).toBe(true);
    if (fix.stage === null) return;
    expect(Number.isInteger(fix.stage)).toBe(true);
    expect(fix.stage).toBeGreaterThan(0);
    expect(fix.stage).toBeLessThanOrEqual(scene.stage);
  });

  it("marks the clitic corrections as always graded", () => {
    // R1: clitics are graded whatever stage the learner is at, which is what
    // makes design 06's own correction — `lo mangio` → `li mangio` — legal in
    // a stage-1 scene. Those carry `stage: null`, and nothing else does.
    const always = SCENES.flatMap((scene) =>
      scene.correctables.filter((fix) => fix.stage === null).map((fix) => fix.id),
    );
    expect(always).toEqual(["clitico-plurale", "ne-mancante", "ne-quantita"]);
  });
});

// ── The presente sweep ──────────────────────────────────────────────────
// Every Italian form the scene *models* or *asks the learner to produce* has
// to be presente. Scope, deliberately:
//
//   swept      the model dialogue, the rehearsal answers and their accepted
//              and neighbour variants, the grammar examples, the ability
//              statement, the setting narration, the partner's opening line,
//              and both halves of every correctable — a correctable must be
//              an agreement or article error, never an above-stage tense.
//   not swept  the notes, the grammar note, the Polish card prose and the
//              `why` lines. Those are the teacher talking *about* Italian and
//              legitimately use other tenses ("la cosa è già stata detta").
//              Also not swept: `task.goal.it`, which is an instruction to the
//              learner in the tu imperative ("compra", "chiedi", "di'"), not
//              a form the scene models or asks for.
const PRODUCED = SCENES.flatMap((scene) => [
  [`${scene.id}/ability`, scene.ability.it],
  [`${scene.id}/setting`, scene.task.setting.it],
  [`${scene.id}/opening`, scene.task.opening.it],
  ...scene.grammar.examples.map((e, i) => [`${scene.id}/grammar-${i}`, e.it]),
  ...scene.model.map((line, i) => [`${scene.id}/model-${i}`, line.it]),
  ...scene.rehearsal.flatMap((item) => [
    [`${scene.id}/${item.id}/answer`, item.answer],
    ...item.accepted.map((v, i) => [`${scene.id}/${item.id}/accepted-${i}`, v]),
    ...item.neighbours.map((v, i) => [`${scene.id}/${item.id}/neighbour-${i}`, v]),
  ]),
  ...scene.correctables.flatMap((fix) => [
    [`${scene.id}/${fix.id}/said`, fix.said],
    [`${scene.id}/${fix.id}/better`, fix.better],
  ]),
]);

// The first version of this sweep matched endings — /(ato|ito|uto)$/ for a
// past participle, /(ando|endo)$/ for a gerundio — and it failed on the data
// it was written for. `mercato` is a market, `prendo` is the presente of
// prendere, `vendo` and `scendo` likewise, and no regex over Italian endings
// separates a tense from a noun. So the ending patterns are gone and the
// sweep classifies instead: every token in the produced Italian is either a
// verb form, named here with its lemma and its tense, or a non-verb, listed
// below. Nothing may be unclassified in either direction, so the day a scene
// gains a word somebody has to say which it is — and the day it gains a verb
// they have to write down its tense, where ALLOWED_TENSES refuses anything
// but the two a stage-1 scene may use.
const ALLOWED_TENSES = new Set(["presente", "infinito"]);

const VERB_FORMS = {
  assaggiare: ["assaggiare", "infinito"],
  assaggio: ["assaggiare", "presente"],
  chiedere: ["chiedere", "infinito"],
  chiederlo: ["chiedere", "infinito"],
  comprare: ["comprare", "infinito"],
  comprarlo: ["comprare", "infinito"],
  conosci: ["conoscere", "presente"],
  controllare: ["controllare", "infinito"],
  costa: ["costare", "presente"],
  costano: ["costare", "presente"],
  desidera: ["desiderare", "presente"],
  devi: ["dovere", "presente"],
  dire: ["dire", "infinito"],
  do: ["dare", "presente"],
  fa: ["fare", "presente"],
  hai: ["avere", "presente"],
  ho: ["avere", "presente"],
  mangio: ["mangiare", "presente"],
  ordinare: ["ordinare", "infinito"],
  paga: ["pagare", "presente"],
  pagare: ["pagare", "infinito"],
  pago: ["pagare", "presente"],
  parla: ["parlare", "presente"],
  posso: ["potere", "presente"],
  prendo: ["prendere", "presente"],
  può: ["potere", "presente"],
  rallenta: ["rallentare", "presente"],
  sono: ["essere", "presente"],
  taglia: ["tagliare", "presente"],
  tagliare: ["tagliare", "infinito"],
  taglio: ["tagliare", "presente"],
  va: ["andare", "presente"],
  voglio: ["volere", "presente"],
  vuoi: ["volere", "presente"],
  vuole: ["volere", "presente"],
  è: ["essere", "presente"],
};

// Everything else in the produced Italian. `c` and `quant` are what the
// apostrophe leaves behind in `c'è` and `quant'è`. `contante` and `euri` are
// not mistakes here: they are the wrong forms a `correctable` quotes back, and
// `euri` is not a word at all, which is the point of quoting it.
const NON_VERBS = new Set([
  "a", "al", "altro", "ancora", "banco", "belli", "bene", "biglietto",
  "bologna", "buongiorno", "buono", "c", "carta", "cartello", "cena", "cento",
  "certo", "che", "chili", "chilo", "cibo", "col", "con", "contante",
  "contanti", "cosa", "così", "da", "dei", "del", "di", "dieci", "due", "e",
  "ecco", "etti", "etto", "euri", "euro", "favore", "fine", "formaggio",
  "gente", "grammi", "grazie", "grosso", "i", "il", "in", "la", "le", "li",
  "lo", "ma", "maturi", "maturo", "me", "mercato", "mezza", "mezzo", "molto",
  "monete", "ne", "nessuno", "niente", "no", "non", "o", "pane", "per",
  "però", "peso", "pezzo", "piccoli", "più", "pomodori", "prezzo", "prima",
  "prosciutto", "quant", "quanti", "quanto", "quelli", "queste", "questi",
  "questo", "quindi", "resto", "sabato", "salumi", "sette", "solo", "stasera",
  "stesso", "sì", "tanto", "tre", "tutto", "un", "veloce", "venditore",
  "verdi",
]);

// The forms an author actually reaches for by mistake, named so the failure
// says what went wrong rather than just "unclassified". The Lei imperative is
// the present subjunctive, which is above stage 1 — and it is exactly what a
// stallholder says, so it is exactly what gets written: design 03's own model
// dialogue opens on `dica`.
const ABOVE_STAGE_WORDS = new Set([
  "dica", "dia", "guardi", "scusi", "senta", "prenda", "aspetti", "venga",
  "faccia", "provi", "assaggi", "tagli", "paghi", "metta", "scelga", "tenga",
  "sia", "abbia", "vada", "stia", "possa", "voglia", "sappia",
  "fu", "furono", "ebbe", "disse", "fece", "venne", "prese", "diede",
]);

const tokens = (line) =>
  line
    .toLowerCase()
    .replace(/[’']/g, " ")
    .split(/[^a-zàèéìòóù]+/)
    .filter(Boolean);

const CORPUS = new Set(PRODUCED.flatMap(([, line]) => tokens(line)));

describe("stage 1 means presente", () => {
  it.each(PRODUCED)("%s uses no form above the presente", (_label, line) => {
    const words = tokens(line);
    // The blacklist runs over the whole line first. Checking it token by
    // token alongside the classification meant that pasting design 03's "Mi
    // dica, signora!" back in failed on `mi` being unclassified — true, but
    // it buries the actual diagnosis two words later.
    for (const word of words) {
      expect(ABOVE_STAGE_WORDS.has(word), `"${word}" in "${line}" is a Lei imperative or a past tense`).toBe(false);
    }
    for (const word of words) {
      const verb = VERB_FORMS[word];
      if (!verb) {
        expect(NON_VERBS.has(word), `"${word}" in "${line}" is not classified as a verb or a non-verb`).toBe(true);
        continue;
      }
      const [lemma, tense] = verb;
      expect(ALLOWED_TENSES.has(tense), `"${word}" (${lemma}) is ${tense}, which stage 1 does not allow`).toBe(true);
    }
  });

  it("classifies the whole corpus and nothing but the corpus", () => {
    const classified = new Set([...Object.keys(VERB_FORMS), ...NON_VERBS]);
    expect([...CORPUS].filter((word) => !classified.has(word))).toEqual([]);
    expect([...classified].filter((word) => !CORPUS.has(word))).toEqual([]);
  });

  it("sweeps every scene's produced Italian, not a subset", () => {
    // Guards the collector above: if a scene gains a field the sweep does not
    // read, this count stops matching and says so.
    const expected = SCENES.reduce(
      (total, scene) =>
        total +
        3 +
        scene.grammar.examples.length +
        scene.model.length +
        scene.rehearsal.reduce((n, item) => n + 1 + item.accepted.length + item.neighbours.length, 0) +
        scene.correctables.length * 2,
      0,
    );
    expect(PRODUCED.length).toBe(expected);
    expect(SCENES.length).toBe(3);
  });
});
