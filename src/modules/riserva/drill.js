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
// alone, so a word the *deck* already taught is not offered here as new — the
// 20 lemmas the deck shares with the base 2,000 are the only overlap today.
//
// That guard points one way only, and this comment used to claim it pointed
// both ("the line that stops them being asked twice"). It stops this bench
// re-offering a word the deck taught; it cannot stop the deck teaching a word
// this bench drilled, because the deck excludes nothing. Do both and one lemma
// carries two live scheduler keys — a real state, and a legitimate one. What
// must not follow is the *queue* asking for that word twice in one round, and
// srs.js's dueUnits() is where that is held, by the same lemma rule
// coverage.js folds the two units with.
//
// ── Ranks with no word behind them are not drillable ────────────────────
// The list is 400 of 2,000. A rank nobody has written down is a claim about
// the file, not about the learner — La Riserva's grid has drawn that
// distinction since it shipped — so an empty band yields an empty round and
// the screen says so rather than opening a drill of nothing.

import { FONDAMENTALE, fasciaWords, glossSenses, FONDAMENTALE_TARGET } from "../../data/fondamentale.js";
import { SESSION_LIMIT } from "../../shared/srs.js";
import { foldTyped } from "../../shared/typedAnswer.js";

// Every word written down in the list, for the `neighbour` verdict below.
// Built once: it is the same 400 strings whichever entry is being asked.
const LEXICON_WORDS = FONDAMENTALE.map((entry) => entry.it);

// The entries that another entry folds onto — where the accent is the only
// thing telling two words of this list apart.
//
// The judge forgives a missing accent on purpose: `possibilita` for
// `possibilità` is a learner who knows the word and has a phone keyboard, and
// marking that wrong would be marking dexterity. But `si` (42, "oneself; one,
// people") and `sì` (44, "yes") differ by nothing else, so on those two the
// tolerance stops being forgiveness and starts marking one entry right for the
// other — prompt "oneself; one, people", typed `sì`, and the card answers
// "Correct. Italian writes it si" while a Leitner box climbs on the wrong word.
//
// Derived rather than named, because the pair that needs this is a property of
// the list and the list is 400 of 2,000. `si`/`sì` is the only one today and
// drill.test.js pins that; the next 1,600 entries will bring more, and they
// will be covered the day they are written down rather than the day somebody
// notices. Folded with the judge's own foldTyped, so the set can only ever
// contain exactly the pairs the judge would confuse.
const FOLDED = FONDAMENTALE.map((entry) => foldTyped(entry.it));
const FOLD_TWINS = new Set(FOLDED.filter((folded, i) => FOLDED.indexOf(folded) !== i));

// Whether an entry's accent is load-bearing in the sense above. Exported for
// the test that pins which entries these are.
export function accentIsTheWord(italian) {
  return FOLD_TWINS.has(foldTyped(italian));
}

// One sitting. The same size as a review round, for the same reason: it is
// how many typed items a person will actually finish before the session stops
// being retrieval and starts being endurance. A band holds up to 200, so the
// band is the door and this is the doorway.
export const ROUND_SIZE = SESSION_LIMIT;

// The band's written-down words the learner has not met, in rank order.
//
// Both of these take the rank → state Map that coverage.js's lexiconStates()
// builds, rather than the progress object, and the reason is that La Riserva
// asks the question ten times in one render — once per band. lexiconStates()
// walks every unit of two modules and normalises each one onto a lemma, so
// building it inside here meant ten full rebuilds of the same Map per paint,
// on a screen that also draws two thousand cells. The caller builds it once.
function unmet(states, fascia) {
  return fasciaWords(fascia).filter((entry) => (states.get(entry.rank) ?? "unseen") === "unseen");
}

// The next sitting for one band, or an empty array when there is nothing left
// to introduce. See the header for why "not met" is the rule.
export function drillRound(states, fascia) {
  return unmet(states, fascia).slice(0, ROUND_SIZE);
}

// How many of a band's written-down words are still waiting to be met. The
// band states this, so a learner can tell "nothing written down here yet"
// from "you have already met all of it" without opening either.
export function unmetCount(states, fascia) {
  return unmet(states, fascia).length;
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
// The second is that showing both costs the learner less than trimming to one
// would — but it is not free, and the version of this argument that shipped
// said it was. It claimed the Polish senses "all point at the same Italian
// one", so a split was "more evidence for the answer than either alone". The
// file says otherwise. 24 Polish senses in the first 300 entries are carried
// by two entries or more — `mówić` by dire and parlare, `uczyć się` by
// studiare and imparare, `głowa` by testa and capo — and `strada` (280,
// `droga · ulica`) and `via` (281, `ulica · droga`) have identical Polish sets
// at adjacent ranks, so they land in the same round with nothing in the Polish
// to separate them. fondamentale.test.js now pins that, so the claim cannot
// come back.
//
// What is actually true is a division of labour between the two glosses:
//
//   English   disambiguates. No two entries share an English gloss —
//             fondamentale.test.js pins that, and it is the guarantee a prompt
//             never has two right answers in the list. `strada` is "road,
//             street" and `via` is "way; street (in an address)".
//   Polish    corroborates. On most entries it narrows the answer alongside
//             the English; on a minority it would not be enough on its own.
//
// So the decision stands and the reason for it changes: both languages, every
// sense, exactly as written down — because the file cannot say which sense is
// primary and picking one would assert a fact it does not have — and the
// screen tells the learner which gloss to steer by rather than claiming the
// Polish is unambiguous.
//
// ── Where the prompt is still thin, and what says so ────────────────────
// A near neighbour is the residue: `di` is "of, from · z · od" and `da` is
// "from, by, since · od · z · przez", and no pair of glosses separates two
// Italian prepositions overlapping that heavily. Typing one for the other used
// to be judged `other` — "there is nothing in that to line up against the
// answer" — which is false about a real word from the very list being drilled.
// So the question carries `neighbours`, and locatedFeedback.js has a verdict
// for it. Being wrong once here and meeting the word again in La Piazza is the
// correct outcome rather than a failure; being told the wrong thing about why
// is not.
//
// Which cuts both ways, and the first version of this only saw one side of it.
// The neighbour verdict ran ahead of the spelling analysis with no guard, so a
// one-character slip that happened to land on another entry — `ragazzo` for
// `ragazza`, and 71 such pairs in the 300 — was reported as reaching for the
// wrong word when the learner had the word and missed the gender. The verdict
// now has to beat what the spelling analysis found before it is said; see
// NEIGHBOUR_EDITS in locatedFeedback.js for where the line sits and why
// `di`/`da` is still on the near side of it.
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
    // A lexicon entry is not authored with alternative forms the way a grammar
    // drill is, so the `distractor` verdict — "that is one of the other forms
    // this item was written with" — has nothing to fire on here, and must not
    // be faked with words from elsewhere in the list. Those were never offered
    // with this item and so were never "written with" it.
    alternatives: [],
    // They get their own verdict instead. Every other word written down in the
    // list, so typing a real Italian word aimed at the wrong entry is named as
    // that rather than as a spelling that failed to line up. The whole list,
    // not a hand-picked set of confusable pairs: "that is a word from this
    // list, and not this one" is true of any of them, and choosing which
    // neighbours count would be the app asserting a similarity judgement the
    // file does not contain.
    neighbours: LEXICON_WORDS.filter((word) => word !== entry.it),
    // ...and the one case where a neighbour reaches the judge *through* the
    // accent tolerance rather than past it. See accentIsTheWord above.
    strictAccents: accentIsTheWord(entry.it),
    // No line-up: a lexicon word is written, not picked. Declared empty rather
    // than left undefined because it is the field La Piazza branches on to
    // decide between a text box and three buttons, and the one shape that
    // fills it is Gli Articoli's. See modules/review/question.js.
    options: [],
    // A lexicon word has no example sentence to close a gap in, so the
    // context line says the other true thing about where it sits: its place
    // in the reservoir. Repeating the answer and its gloss back under the
    // answer and its gloss would be a line that says nothing.
    context: { it: entry.it, en: `rank ${entry.rank} of De Mauro's ${FONDAMENTALE_TARGET.toLocaleString("en-GB")}` },
    recap: { primary: entry.it, secondary: entry.en },
    // Whether Polish divides this word, which is what draws the note under the
    // Polish line. The senses themselves are not carried: the screen renders
    // `glossPl` as written, so a split array here would be a second copy of
    // the prompt that nothing reads — which is exactly what it was.
    splits: glossSenses(entry.pl).length > 1,
    rank: entry.rank,
  };
}
