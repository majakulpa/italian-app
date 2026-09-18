// Le Scene's arithmetic and its one write, kept out of the screens.
//
// Four facts live here, and each one is a place a screen would otherwise have
// invented a number:
//
//   PHASES         what "4 fasi" means, named once. The brief counts them, the
//                  meter divides by them, and the fourth one's name is the
//                  scene partner — so the brief cannot promise four phases and
//                  the router deliver three.
//   knownCount     the brief's "✓ N parole che sai già", read out of the
//                  learner's real lexicon. The design draws 14; nobody has 14
//                  on day one, and whoever has 40 should be told 40.
//   bankSceneWords the write that puts a scene's new words in La Piazza's
//                  queue when Ascolta is finished, and reports which keys it
//                  actually wrote so "+N parole" is a count rather than a
//                  claim.
//   nearest        which of an item's accepted answers the learner was
//                  reaching for, so Prova judges against that one.

import { lexiconStates } from "../../shared/coverage.js";
import { FONDAMENTALE } from "../../data/fondamentale.js";
import { markWord, sceneKey, todayISO, addDaysISO } from "../../shared/storage.js";
import { foldTyped } from "../../shared/typedAnswer.js";

// The four phases, in order. `partner: true` marks the one that needs a scene
// partner — design 05's unscripted task — which is what the stand-in screen
// branches on and what the brief names when it says what the fourth phase is.
//
// Numbered from the design's own captions (02 is phase 1, "guarda come si
// fa"), so the meter and the "Fase N" eyebrow agree with the mockup.
export const PHASES = [
  { id: "brief", label: "Il briefing", en: "the brief" },
  { id: "listen", label: "Ascolta", en: "watch it done" },
  { id: "rehearse", label: "Prova", en: "take the pieces" },
  { id: "task", label: "Al mercato", en: "do it for real", partner: true },
];

// The phases that are usable in this slice. The fourth needs a scene partner,
// which is not built; it is still a phase, still counted, and still opens —
// onto a screen that says what it is waiting for.
export const PLAYABLE_PHASES = PHASES.filter((phase) => !phase.partner);

// How many of the ranks a scene leans on the learner already holds.
//
// "Already knows" is known-or-better, which is the same bar coverage counts a
// word at — see design 01's own note that coverage counts a word "once it is
// known or solid, not merely met". A word in box 1, due back tomorrow, is not
// one the brief may promise the learner walks in with.
const KNOWN_ENOUGH = new Set(["known", "solid"]);

// Which of them, by name. The scene partner's system prompt needs the words
// themselves — "she also already knows: …" — and it has to be the same set the
// brief counted, or the brief and the partner would disagree about what the
// learner walks in with. scenes.test.js pins that every knownRank resolves to
// an entry, so there is no missing-word branch to defend here.
const BY_RANK = new Map(FONDAMENTALE.map((entry) => [entry.rank, entry.it]));

export function knownWords(progress, scene) {
  const states = lexiconStates(progress);
  return scene.knownRanks.filter((rank) => KNOWN_ENOUGH.has(states.get(rank))).map((rank) => BY_RANK.get(rank));
}

export function knownCount(progress, scene) {
  return knownWords(progress, scene).length;
}

// The scene's new words, written into the scheduler when Ascolta is finished.
//
// ── Why here and not on the task being done ─────────────────────────────
// Plan S3: this is the moment the words are *met*. Waiting for the unscripted
// task would mean a learner with no scene partner banks nothing at all, and
// phases 02–04 are meant to be fully usable without one.
//
// ── Why not deferItem ───────────────────────────────────────────────────
// deferItem writes the same status and the same due date, and it also calls
// markStageShown — which would stamp a `stage-evidence:` marker onto a word
// key. That namespace is for grammar forms, where "the app has put this form
// on screen for you" gates whether a right answer may establish a stage; a
// scene word carries no stage, so the marker would be a fact about nothing,
// sitting in `words` where stats.js enumerates keys.
//
// ── Why box 1 and tomorrow ──────────────────────────────────────────────
// Meeting a word is not producing it, so nothing here is `known` and no box is
// earned: box 1 is where an unanswered item already sits (srs.js), and tomorrow
// is the first day it can honestly be asked for. Today would put it in a round
// the learner is still in the middle of.
//
// A word already met — the scene replayed, or a second scene that introduces
// it — is left exactly as it is. Re-writing would drop a word the learner has
// got to box 4 back to `learning` and box 1, which is the punishment for
// listening to a dialogue twice.
//
// Returns the new progress *and* the keys it wrote, because "+N parole" has to
// count what happened rather than what was on the screen.
export function bankSceneWords(progress, scene, today = todayISO()) {
  const tomorrow = addDaysISO(today, 1);

  return scene.newWords.reduce(
    (acc, word) => {
      const key = sceneKey(scene, word);
      if (acc.progress.words[key]) return acc;

      const marked = markWord(acc.progress, key, "learning");
      return {
        progress: { ...marked, schedule: { ...marked.schedule, [key]: { box: 1, due: tomorrow, last: today } } },
        written: [...acc.written, key],
      };
    },
    { progress, written: [] },
  );
}

// Which accepted answer the learner was reaching for.
//
// ── Why this exists at all ──────────────────────────────────────────────
// Plan S5. `judge` (shared/locatedFeedback.js) takes exactly one `answer`, and
// a rehearsal item has a set: "Mezzo chilo di pomodori, per favore." and
// "Mezzo chilo di pomodori." are both right, and so are "cento grammi di
// formaggio" and "un etto di formaggio". Handing judge the canonical one and
// nothing else would mark a correct answer wrong and then locate an error in
// it, which is worse than a bare cross: it would tell the learner the ending
// missed on a sentence an Italian would accept without blinking.
//
// So the nearest accepted form is chosen first and judge is called against
// that. When the learner is exactly right in any accepted form, the nearest is
// that form and the verdict is `exact`. When she is wrong, the nearest is the
// accepted form her attempt is closest to, which is the one whose located
// feedback tells her something — "it starts right and then goes somewhere
// else" about the sentence she was actually building.
//
// Folded through typedAnswer's own normaliser so the distance is measured on
// the same footing the judge marks on: accents and case are forgiven there, and
// a nearest-answer pick that disagreed with the judge about whether two strings
// are the same string would be able to hand judge an answer it then marks the
// attempt wrong against.
//
// ── The empty box is not a near miss ────────────────────────────────────
// An empty string's distance to a candidate is just that candidate's length,
// so "nearest" over a blank box means "shortest", and the learner who presses
// "Show me" without typing would be handed whichever accepted form happens to
// be tersest — "Mezzo chilo di pomodori." rather than the canonical "Mezzo
// chilo di pomodori, per favore.". That is the form the app should teach, and
// `accepted` always begins with `answer` (scenes.test.js pins it), so a blank
// box gets `answer` outright. There is nothing in an empty box to be near to.
//
// Ties among real attempts go to the earlier entry, which is `answer` first
// for the same reason.
export function nearest(item, input) {
  const typed = foldTyped(input);
  if (typed === "") return item.answer;

  return item.accepted.reduce((best, candidate) =>
    distance(typed, foldTyped(candidate)) < distance(typed, foldTyped(best)) ? candidate : best,
  );
}

// Levenshtein, over two rows. A copy of the one in locatedFeedback.js, which
// is not exported and is deliberately private to the verdict logic there — it
// is tuned for the NEIGHBOUR_EDITS threshold and exporting it would make a
// judging constant part of this module's contract. Here it only ever orders
// candidates, so the two never have to agree on a number.
function distance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = row;
  }

  return previous[b.length];
}

// What Prova hands `judge` for one rehearsal item.
//
// ── The suppressed verdict ──────────────────────────────────────────────
// `neighbours` is empty, on purpose, and it is plan S5's third clause. The
// data gives every item its neighbours — "Un chilo di pomodori, per favore."
// against "Mezzo chilo" — and judge would turn a match on one into the
// `neighbour` verdict, whose sentence is "That is another word from the base
// vocabulary, not the one being asked for". Two things are wrong with it here.
// It is false: none of these is in the base vocabulary. And it is the wrong
// accusation even reworded — the learner who says "un chilo di pomodori" has
// built a perfectly good Italian sentence and asked for the wrong amount,
// which is a different thing from reaching for the wrong entry in a word list.
// What she gets instead is the spelling analysis, which says the true thing:
// it starts right and then goes somewhere else.
//
// The neighbours stay in the data because Phase 05's debrief is where they earn
// their keep — the partner needs to know which near-miss items exist — and
// because they are the authoring discipline scenes.test.js checks.
//
// `alternatives` is empty for the reason question.js gives about a lexicon
// entry: the `distractor` verdict says "one of the other forms this item was
// written with", and a rehearsal item is not written with alternative forms.
//
// `context` is the answer and its English, which is what Verdict draws under a
// settled item. Unlike a lexicon word there is something to say: the English
// prompt is the question, so repeating it under the answer places the Italian
// against what it was for.
export function rehearsalQuestion(item, input) {
  const answer = nearest(item, input);

  return {
    kind: "rehearsal",
    answer,
    alternatives: [],
    neighbours: [],
    strictAccents: false,
    context: { it: answer, en: item.en },
  };
}
