// "Dove l'hai incontrata" — where you met a word, from the two places the app
// can actually prove it put one in front of you.
//
// Design screen 11 lists two traces under a headword and both of them are
// drawings: `Ep. 7` is an episode of a serial that does not exist, and
// `Il Bar` is a scene from the four-phase task loop, which is chunk 6. What
// does exist is the vocabulary deck (a lemma has an example sentence, in a
// category, at a level) and the story glosses (a paragraph tapped a word open
// and told you what it meant). Those two, and nothing else — benches.js's own
// rule is that a figure invented to make a bench look busy is the mistake
// this codebase refuses, and an invented *trace* is worse than an invented
// figure, because it claims something about the learner's own history.
//
// ── Two sources, two different kinds of claim ───────────────────────────
// A deck trace is a word the app *teaches*: it has a Leitner key, so whether
// the learner has actually worked through it is a fact, and `done` says so.
// A story trace is a word the app *glossed*: reading a story writes no word
// status (see wordState.js on why there is no `met` state), so the only
// thing that can be said is whether the story itself was finished. `done`
// means that, and the field is named the same on both because in both cases
// it answers "have you done this one".
//
// ── The homograph problem, stated rather than hidden ────────────────────
// Matching is by written form, through coverage.js's lemmaKey — the app has
// no lemma field and no part of speech, which is exactly why the word detail
// shows neither. So a story that glosses `porta` as "takes, brings
// (portare)" is listed under lexicon rank 215, which is the noun *door*.
// That trace is not wrong about the encounter — those letters really were on
// that page — but it is wrong about the sense, and no data in this app can
// tell the two apart. So every story trace carries the gloss the story gave,
// verbatim: the mismatch is then visible to the reader instead of being
// asserted at them. Dropping the source entirely would lose the many traces
// that are right; hiding the gloss would make the few that are wrong
// invisible. Fixing it properly needs a part-of-speech field in
// data/fondamentale.js and lemmas on the story glosses, and neither exists.

import { STORY_LEVELS } from "../../data/stories.js";
import { lemmaKey, lexiconUnits } from "../../shared/coverage.js";
import { isStoryDone } from "../../shared/storage.js";
import { wordState } from "../../shared/wordState.js";

// lemma -> [{ story, level, meaning }], built once at load. It walks every
// paragraph of every story, which is a few thousand gloss keys; doing that
// per word detail opened would be the same answer computed again.
const STORIES_BY_LEMMA = (() => {
  const byLemma = new Map();

  for (const level of STORY_LEVELS) {
    for (const story of level.stories) {
      // The set of lemmas one story glosses, not the list. A story that
      // glossed the same word in three paragraphs would still be one place
      // you met it, and a Set says so without a guard clause that today's
      // data can never take — the shipped stories gloss each word once.
      const glossed = new Map(
        story.paragraphs.flatMap((paragraph) =>
          Object.entries(paragraph.gloss).map(([word, meaning]) => [lemmaKey(word), meaning]),
        ),
      );

      for (const [key, meaning] of glossed) {
        byLemma.set(key, [...(byLemma.get(key) ?? []), { story, level, meaning }]);
      }
    }
  }

  return byLemma;
})();

// Everywhere the app has put one lexicon entry in front of the learner, in
// the order the two sources are worth reading: the deck teaches the word, a
// story only walks past it.
export function wordTraces(progress, entry) {
  const deck = lexiconUnits(entry.rank).map((unit) => ({
    kind: "deck",
    level: unit.level,
    where: unit.group.name,
    it: unit.item.ex,
    en: unit.item.exEn,
    // The weakest honest claim, which is the one the heading asks for: this
    // card has been answered at least once. Not coverage's box-3 bar and not
    // the vocabulary card's `known` bar — both of those answer "how well do
    // you know it", which the state pill at the top of the screen already
    // answers. This answers "have you been here", and a word you got wrong
    // on the way past is still a word you met.
    done: wordState(progress, unit.key) !== "unseen",
  }));

  const stories = (STORIES_BY_LEMMA.get(lemmaKey(entry.it)) ?? []).map(({ story, level, meaning }) => ({
    kind: "story",
    level,
    where: story.title,
    meaning,
    done: isStoryDone(progress, level, story),
  }));

  return [...deck, ...stories];
}
