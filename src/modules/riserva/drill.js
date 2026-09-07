// Drilling the reservoir: which words a fascia hands you, and what one of
// them looks like as a question.
//
// La Riserva drew the 2,000 and every cell in it was a picture. You could
// look at a word and you could read its detail card, and there was no way to
// *study* one — which is why coverage was a near-constant with a ceiling of
// 1.6% (see the header of shared/coverage.js). This file is the verb.
//
// ── The way in is a fascia ──────────────────────────────────────────────
// PLAN.md settled it for word detail and it settles it here: the grid is
// deliberately not two thousand buttons, so a band is the door. A band is
// also a natural session boundary — 200 ranks that are worth roughly the same
// as each other and very different from the next band's.
//
// ── What one round is ───────────────────────────────────────────────────
// The band's seeded words, in frequency order, that the learner has not met
// yet, capped at ROUND_SIZE.
//
// Frequency order rather than shuffled, because the order is the teaching
// order: this is the one list in the app where item n+1 is worth measurably
// less than item n, and working through it in any other order is throwing
// that away.
//
// "Not met yet" is the whole selection rule, and it is deliberately not a
// second scheduler. Once a word has been answered here even once it is in the
// Leitner queue with a box and a due date, and La Piazza is what brings it
// back — re-offering it on this bench the same afternoon would be two
// schedules racing over one key. So the bench introduces and the queue
// reviews, which is exactly how the vocabulary deck and La Piazza already
// divide the work.
//
// Met-ness is read through lexiconStates() rather than off the riserva key
// alone, so a word the *deck* already taught is not offered here as new. The
// 20 lemmas the deck shares with the base 2,000 are the only overlap today,
// and this is the line that stops them being asked twice.
//
// ── Ranks with no word behind them are not drillable ────────────────────
// The list is 300 of 2,000. A rank nobody has written down is a claim about
// the file, not about the learner — La Riserva's grid has drawn that
// distinction since it shipped — so an empty band yields an empty round and
// the screen says so rather than opening a drill of nothing.

import { fasciaWords, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { lexiconStates } from "../../shared/coverage.js";
import { SESSION_LIMIT } from "../../shared/srs.js";
import { senses } from "./WordDetail.jsx";

// One sitting. The same size as a review round, for the same reason: it is
// how many typed items a person will actually finish before the session stops
// being retrieval and starts being endurance. A band holds up to 200, so the
// band is the door and this is the doorway.
export const ROUND_SIZE = SESSION_LIMIT;

// The band's written-down words the learner has not met, in rank order.
function unmet(progress, fascia) {
  const states = lexiconStates(progress);
  return fasciaWords(fascia).filter((entry) => (states.get(entry.rank) ?? "unseen") === "unseen");
}

// The next sitting for one band, or an empty array when there is nothing left
// to introduce. See the header for why "not met" is the rule.
export function drillRound(progress, fascia) {
  return unmet(progress, fascia).slice(0, ROUND_SIZE);
}

// How many of a band's written-down words are still waiting to be met. The
// band states this, so a learner can tell "nothing written down here yet"
// from "you have already met all of it" without opening either.
export function unmetCount(progress, fascia) {
  return unmet(progress, fascia).length;
}

// One entry as something to produce.
//
// ── Both glosses, verbatim, and why the multi-sense ones are not trimmed ─
// 87 of the first 300 entries carry more than one Polish sense, separated by
// " · ". The obvious move is to pick one and ask on that; it is wrong here,
// for two reasons.
//
// The first is that the file cannot tell which to pick. PLAN.md is explicit
// about it and WordDetail repeats it: `pytać · prosić o` is two meanings and
// `mówić · powiedzieć` is one meaning in two aspects, and nothing in
// { rank, it, en, pl } distinguishes them. Choosing a "primary" sense would
// be the app asserting a fact it does not have — the same class of invention
// as the mockup's `giorno 148`.
//
// The second is that in this direction the split is not ambiguity at all. The
// drill runs gloss → Italian, and the Italian collapses every one of those
// senses back into a single word: if you can be shown *both* `mówić` and
// `powiedzieć` and both point at `dire`, that is more evidence for the answer
// than either alone, not less. A split only costs the learner something going
// the other way, which is the direction this drill does not run — and that is
// the sentence WordDetail's pink card already makes ("going this way you
// choose, and coming back you do not").
//
// So: both languages, every sense, exactly as written down. The screen shows
// the Polish with `lang="pl"` and, where it splits, says that it splits.
//
// ── Where the prompt is still thin, said plainly ────────────────────────
// No two entries in the file share an English gloss or an English+Polish pair
// (fondamentale.test.js pins both), so a prompt never has two right answers
// *in the list*. What it can still have is a near neighbour: `di` is
// "of, from · z · od" and `da` is "from, by, since · od · z · przez", and no
// pair of glosses separates two Italian prepositions that overlap that
// heavily. Those are the items the second attempt and the located verdict
// exist for, and they are also the items where being wrong once and meeting
// the word again in La Piazza is the correct outcome rather than a failure.
//
// ── The answer includes the article ─────────────────────────────────────
// `la chiave`, not `chiave`. The article is not decoration on these entries:
// fondamentale.js stores one only where the ending does not give the gender
// away, so on exactly those words it is the gender, and PLAN.md calls
// articles "the one genuinely hard thing" for this learner. Typing the bare
// noun is judged `stem` — "it ends the way the answer ends, what comes in
// front of that does not" — which is a true and useful location of a real
// error rather than a technicality.
export function lexiconQuestion(entry) {
  const pl = senses(entry.pl);

  return {
    kind: "lexicon",
    // `gloss`, `cloze`, `prompt` and `hint` are the fields La Piazza's round
    // already renders; `glossPl` is the one this shape adds, because the
    // Polish half cannot be folded into an English string without becoming
    // unmarked Polish (WCAG 3.1.2).
    gloss: entry.en,
    glossPl: entry.pl,
    cloze: null,
    prompt: null,
    hint: null,
    answer: entry.it,
    // Nothing to be confused with. A lexicon entry is not authored with
    // alternative forms the way a grammar drill is, so the `distractor`
    // verdict — "that is one of the other forms this item was written with" —
    // has nothing to fire on and must not be faked with near neighbours from
    // elsewhere in the list, which were never offered and so were never
    // "written with" this item.
    alternatives: [],
    // A lexicon word has no example sentence to close a gap in, so the
    // context line says the other true thing about where it sits: its place
    // in the reservoir. Repeating the answer and its gloss back under the
    // answer and its gloss would be a line that says nothing.
    context: { it: entry.it, en: `rank ${entry.rank} of De Mauro's ${FONDAMENTALE_TARGET.toLocaleString("en-GB")}` },
    recap: { primary: entry.it, secondary: entry.en },
    // Split for the drill screen, which draws the senses rather than the raw
    // string, and needs to know whether Polish divides this word.
    senses: { en: senses(entry.en), pl },
    splits: pl.length > 1,
    rank: entry.rank,
  };
}
