import { describe, it, expect } from "vitest";
import { PHASES, PLAYABLE_PHASES, bankSceneWords, knownCount, nearest, rehearsalQuestion } from "./scene.js";
import { SCENES } from "../../data/scenes.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { sceneKey, riservaKey } from "../../shared/storage.js";
import { reviewItem, dueCount, dueItems, MAX_BOX } from "../../shared/srs.js";
import { judge } from "../../shared/locatedFeedback.js";

const verdura = SCENES.find((scene) => scene.id === "verdura");
const salumiere = SCENES.find((scene) => scene.id === "salumiere");
const EMPTY = { words: {}, schedule: {} };

const entryAt = (rank) => FONDAMENTALE.find((entry) => entry.rank === rank);

// A base-vocabulary rank, answered right enough times to reach a given box.
// Going through reviewItem rather than writing a box by hand is the point:
// knownCount reads the *derived* word state, so a test that seeded a box
// directly could pass while the real write path produced something else.
function heldAt(progress, rank, box) {
  const key = riservaKey(entryAt(rank));
  return Array.from({ length: box - 1 }).reduce((acc) => reviewItem(acc, key, true, "2026-01-01"), progress);
}

describe("PHASES", () => {
  // The brief prints PHASES.length as "4 fasi" and names the last one, so a
  // phase added or removed without the screen noticing would make the brief
  // lie about the scene it is introducing.
  it("is four, ending on the one that needs a partner", () => {
    expect(PHASES.map((phase) => phase.id)).toEqual(["brief", "listen", "rehearse", "task"]);
    expect(PHASES.filter((phase) => phase.partner).map((phase) => phase.id)).toEqual(["task"]);
  });

  it("leaves exactly the first three playable", () => {
    expect(PLAYABLE_PHASES.map((phase) => phase.id)).toEqual(["brief", "listen", "rehearse"]);
  });
});

describe("knownCount", () => {
  it("counts nothing on a fresh account", () => {
    expect(knownCount(EMPTY, verdura)).toBe(0);
  });

  // "Already knows" is known-or-better, the same bar coverage counts a word
  // at. Box 2 comes round tomorrow, which is recognition rather than
  // retention, and the brief must not promise the learner walks in with it.
  it("ignores a rank that is only in the learning boxes", () => {
    expect(knownCount(heldAt(EMPTY, verdura.knownRanks[0], 2), verdura)).toBe(0);
  });

  it("counts a rank from box 3 up", () => {
    expect(knownCount(heldAt(EMPTY, verdura.knownRanks[0], 3), verdura)).toBe(1);
    expect(knownCount(heldAt(EMPTY, verdura.knownRanks[0], MAX_BOX), verdura)).toBe(1);
  });

  it("counts only the ranks this scene leans on", () => {
    const outside = FONDAMENTALE.find((entry) => !verdura.knownRanks.includes(entry.rank));
    expect(knownCount(heldAt(EMPTY, outside.rank, MAX_BOX), verdura)).toBe(0);
  });

  it("adds up across several ranks of one scene", () => {
    const two = verdura.knownRanks.slice(0, 2).reduce((acc, rank) => heldAt(acc, rank, 3), EMPTY);
    expect(knownCount(two, verdura)).toBe(2);
  });
});

describe("bankSceneWords", () => {
  it("writes every new word as learning, due tomorrow, in box 1", () => {
    const { progress, written } = bankSceneWords(EMPTY, verdura, "2026-03-04");

    expect(written).toEqual(verdura.newWords.map((word) => sceneKey(verdura, word)));
    for (const key of written) {
      expect(progress.words[key], key).toBe("learning");
      expect(progress.schedule[key], key).toEqual({ box: 1, due: "2026-03-05", last: "2026-03-04" });
    }
  });

  // The whole reason this is not deferItem: that helper also calls
  // markStageShown, which would put a `stage-evidence:` marker on a word key.
  // That namespace belongs to grammar forms, where being shown a form gates
  // whether a right answer may establish a stage; a scene word carries no
  // stage, so the marker would be a fact about nothing sitting in the map
  // stats.js enumerates.
  it("writes no stage-evidence marker", () => {
    const { progress } = bankSceneWords(EMPTY, verdura);

    expect(Object.keys(progress.words).filter((key) => key.startsWith("stage-evidence:"))).toEqual([]);
  });

  it("writes nothing outside the scene's own keys", () => {
    const { progress } = bankSceneWords(EMPTY, verdura);

    expect(Object.keys(progress.words).sort()).toEqual(verdura.newWords.map((w) => sceneKey(verdura, w)).sort());
  });

  // A scene replayed must not demote what the learner has since earned, and
  // "+N parole" has to report nothing rather than report the words again.
  it("leaves an already-met word alone and reports it as unwritten", () => {
    const key = sceneKey(verdura, verdura.newWords[0]);
    const solid = reviewItem(reviewItem(reviewItem(EMPTY, key, true), key, true), key, true);
    const { progress, written } = bankSceneWords(solid, verdura, "2026-03-04");

    expect(written).not.toContain(key);
    expect(written).toHaveLength(verdura.newWords.length - 1);
    expect(progress.words[key]).toBe("known");
    expect(progress.schedule[key]).toEqual(solid.schedule[key]);
  });

  it("reports nothing written when the whole scene has been heard before", () => {
    const once = bankSceneWords(EMPTY, verdura).progress;
    const { written } = bankSceneWords(once, verdura);

    expect(written).toEqual([]);
  });

  it("keys each scene's words separately", () => {
    const both = bankSceneWords(bankSceneWords(EMPTY, verdura).progress, salumiere).progress;

    expect(Object.keys(both.words)).toHaveLength(verdura.newWords.length + salumiere.newWords.length);
  });
});

// The claim the design's "+N parole → Piazza" makes, checked end to end
// through the real scheduler rather than by inspecting keys: a `scene:` key is
// only ever served by La Piazza because MODULE_STATS enumerates it, so this is
// the test that would have caught the words being written into a namespace
// nothing reads.
describe("banked words and the review queue", () => {
  it("puts nothing in the queue today and the whole scene in it tomorrow", () => {
    const { progress } = bankSceneWords(EMPTY, verdura, "2026-03-04");

    expect(dueCount(progress, "2026-03-04")).toBe(0);
    expect(dueCount(progress, "2026-03-05")).toBe(verdura.newWords.length);
  });

  it("serves a banked word as a real due item, with the scene as its group", () => {
    const { progress } = bankSceneWords(EMPTY, verdura, "2026-03-04");
    const queue = dueItems(progress, "2026-03-05");

    expect(queue.map((unit) => unit.moduleId)).toEqual(verdura.newWords.map(() => "scenes"));
    expect(queue.every((unit) => unit.group === verdura)).toBe(true);
    expect(queue.map((unit) => unit.item.it).sort()).toEqual(verdura.newWords.map((w) => w.it).sort());
  });
});

describe("nearest", () => {
  const etto = verdura.rehearsal.find((item) => item.id === "un-etto");

  // Not a detail. An empty string's distance to a candidate is that
  // candidate's length, so "nearest" over a blank box means "shortest" — and
  // "Show me" on an untouched box would then teach the tersest accepted form
  // rather than the one the scene authored. This test failed before scene.js
  // special-cased it, handing back "Mezzo chilo di pomodori." where the
  // canonical answer is "Mezzo chilo di pomodori, per favore."
  it("returns the canonical answer for an empty box, not the shortest accepted one", () => {
    const shortest = [...etto.accepted].sort((a, b) => a.length - b.length)[0];
    const mezzo = verdura.rehearsal.find((item) => item.id === "mezzo-chilo");

    expect(nearest(etto, "")).toBe(etto.answer);
    expect(nearest(mezzo, "")).toBe(mezzo.answer);
    expect(nearest(mezzo, "")).not.toBe([...mezzo.accepted].sort((a, b) => a.length - b.length)[0]);
    expect(shortest).toBe(etto.answer);
  });

  // The case S5 exists for: `cento grammi di formaggio` is authored as
  // accepted, and judging it against `un etto di formaggio` would call a right
  // answer wrong and then locate an error in it.
  it("picks the accepted form the learner actually wrote", () => {
    expect(nearest(etto, "cento grammi di formaggio")).toBe("cento grammi di formaggio");
    expect(nearest(etto, "un etto di formaggio")).toBe("un etto di formaggio");
  });

  it("picks the nearer accepted form for a near miss of it", () => {
    expect(nearest(etto, "cento grami di formaggio")).toBe("cento grammi di formaggio");
  });

  // Folded the way the judge folds, so the two cannot disagree about whether
  // two strings are the same string.
  it("is blind to case and accents, like the judge", () => {
    const quanto = SCENES[2].rehearsal.find((item) => item.id === "in-tutto");
    expect(nearest(quanto, "QUANT'E IN TUTTO?")).toBe("Quant'è in tutto?");
  });
});

describe("rehearsalQuestion", () => {
  it("judges an accepted alternative as exactly right", () => {
    const etto = verdura.rehearsal.find((item) => item.id === "un-etto");
    const verdict = judge(rehearsalQuestion(etto, "cento grammi di formaggio"), "cento grammi di formaggio", 1);

    expect(verdict.correct).toBe(true);
    expect(verdict.kind).toBe("exact");
  });

  it("still marks a wrong answer wrong, against the form it was nearest", () => {
    const etto = verdura.rehearsal.find((item) => item.id === "un-etto");
    const question = rehearsalQuestion(etto, "un etto di formagg");
    const verdict = judge(question, "un etto di formagg", 1);

    expect(question.answer).toBe("un etto di formaggio");
    expect(verdict.correct).toBe(false);
  });

  // Plan S5's third clause. A neighbour is another whole item — a different
  // quantity, a different cut — and the `neighbour` verdict's own sentence
  // says "another word from the base vocabulary", which is false here twice
  // over: none of these is in that list, and asking for the wrong amount in
  // good Italian is not reaching for the wrong dictionary entry.
  it("never returns the different-entry verdict, even on an authored neighbour", () => {
    for (const item of SCENES.flatMap((scene) => scene.rehearsal)) {
      for (const neighbour of item.neighbours) {
        const verdict = judge(rehearsalQuestion(item, neighbour), neighbour, 1);
        expect(verdict.kind, `${item.id} / ${neighbour}`).not.toBe("neighbour");
      }
    }
  });

  it("hands the judge no alternatives, so nothing is called a distractor", () => {
    const question = rehearsalQuestion(verdura.rehearsal[0], "");
    expect(question.alternatives).toEqual([]);
    expect(question.neighbours).toEqual([]);
    expect(question.strictAccents).toBe(false);
  });

  // The context line Verdict draws under a settled item: the Italian that was
  // wanted, and the English prompt it was wanted for.
  it("contexts the answer against the prompt it came from", () => {
    const item = verdura.rehearsal[0];
    expect(rehearsalQuestion(item, "").context).toEqual({ it: item.answer, en: item.en });
  });
});
