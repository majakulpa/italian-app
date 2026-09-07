// Judging one typed answer against the answer that was wanted.
//
// This was modules/review/feedback.js, and its header argued at length that
// it was "deliberately a sibling of modules/mappe and modules/articoli rather
// than a lift into shared/": the three share a *shape* — two attempts, a
// verdict that is data rather than a sentence, one announce() building the
// plain text for the live region, nothing revealed until the item is settled
// — but not judging logic. Mappatura delle parole measures a typed answer
// against a suffix rule, Gli Articoli classifies a chosen option along two
// categorical dimensions, and this file has neither a rule nor a set of
// options, only an answer and whatever the learner typed.
//
// That argument was right about those two and it is what moved this file: La
// Riserva's drill has neither a rule nor a set of options either. It shows a
// gloss and takes the Italian, which is the same judging problem to the
// character, so the choice was one shared judge or a fourth copy of it. The
// two callers are La Piazza (modules/review) and La Riserva
// (modules/riserva/drill.js); the four exports of shared/typedAnswer.js are
// still the domain-free half underneath.
//
// What did *not* move is the screen. Each bench composes its own markup
// around this, the way mappe, articoli and falsiAmici already do — the
// verdicts are data precisely so that stays possible.
//
// ── Located, not solved, with nothing but the answer to go on ────────────
// PLAN.md names the standard wrong → red cross → answer pattern as the
// weakest feedback shape available, and until now La Piazza *was* that
// pattern — which is why Mappatura delle parole and Gli Articoli both stayed
// out of the queue. So a verdict here says where the answer went wrong and
// never what it is, and the second attempt happens before anything is
// revealed:
//
//   exact       right, and written the way Italian writes it.
//   spelling    right, once the marks the learner was never asked to guess
//               are folded away — an accent left off, or the closing
//               punctuation the cloze swallowed (see CLOSING). Correct, and
//               spelled back all the same: accepting `possibilita` without
//               ever showing `possibilità` teaches the wrong spelling by
//               omission.
//   distractor  what was typed is one of the *other* forms this grammar item
//               was authored with. The most locatable error there is: the
//               right word in the wrong form. Naming that is not naming the
//               answer, and this never says which form was wanted.
//   neighbour   what was typed is a different *item from the same list* —
//               `via` when the answer is `strada`. Not another form of this
//               item, so not `distractor`, and emphatically not `other`: it
//               is real Italian, from the vocabulary being studied, aimed at
//               the wrong entry. Only La Riserva fills this in (see
//               drill.js); a deck word and a grammar drill have no list of
//               siblings the learner could have been reaching for instead.
//   ending      the answer is right up to its last letter or two.
//   partial     it starts right and diverges further in than that.
//   stem        it ends the way the answer ends and starts differently.
//   other       nothing lines up. Said plainly rather than dressed up as a
//               location that isn't there.
//   blank       nothing was typed. Not an attempt — see judge().
//   revealed    the learner pressed "show me".
//
// The fragments a verdict quotes back (`shared`, `tail`) are bounded at both
// ends, and the bound is about what the fragment *leaves* rather than where
// its letters came from. "She typed those letters herself" is not a defence:
// what a learner does not know is where the answer ends, and a span that runs
// to the end of the answer tells her exactly that. MEANINGFUL is the floor,
// quotable() is the ceiling. They are taken from the answer's spelling rather
// than the input's, so an accent she left off comes back with it on.
//
// Verdicts are data, not sentences: the module composes the markup, because
// these messages put Italian fragments inside English prose and one string
// can only claim one language (WCAG 3.1.2). LOCATED below is the exception —
// those five sentences are pure English with no Italian in them, so the card
// renders the very same strings rather than keeping a second copy that can
// drift.

import { foldTyped, sameTyped, accentsMissing, sharedPrefix } from "./typedAnswer.js";

export const ATTEMPTS = 2;

// Two characters is where an overlap stops being a coincidence — the same
// threshold Mappatura delle parole uses, for the same reason. Italian words
// overwhelmingly end in a vowel, so a one-letter tail is true of half the
// lexicon.
const MEANINGFUL = 2;

// How much of the answer may still be wrong for it to count as "the ending".
// One or two characters is a verb ending, a plural, an agreement — the things
// that miss on a form the learner otherwise has.
const ENDING = 2;

// An answer's closing punctuation belongs to the sentence it was cut out of,
// not to the Italian the learner has to produce. `come stai?` is a vocabulary
// entry: its gloss is "how are you?", its example is `Ciao Marco, come stai?`
// and the gap swallowed the question mark, so the screen reads `Ciao Marco,
// ___` and the only way to get the mark right is to guess that it is there.
// Typing `come stai` was marked wrong, handed back `come stai` as a located
// fragment — the whole answer bar the punctuation — and demoted to box 1.
//
// Folded for the verdict, kept for the spelling: the answer is still shown,
// spoken and read back with the mark on. Terminal only — the apostrophe in
// `dell'acqua` and any comma inside the answer are Italian and stay.
//
// This is deliberately *not* in shared/typedAnswer.js. Its other two callers
// are Mappatura delle parole and Falsi Amici, and no answer in either data
// file ends in punctuation, so folding it there would be a widened contract
// with nothing to show for it rather than an improvement. If a bench ever
// grows a sentence-shaped answer, that is the moment to lift this.
const CLOSING = /[?!.]+$/;

function withoutClosing(value) {
  return value.trim().replace(CLOSING, "").trim();
}

// Whether a sentence ending in this answer still needs its own full stop.
// "The answer is come stai?." reads as a typo. Exported because the card and
// announce() both build that sentence and they have to agree.
export function fullStopAfter(value) {
  return CLOSING.test(value) ? "" : ".";
}

// The mirror of sharedPrefix: how far the two agree from the *back*, folded,
// returned in the answer's own spelling. Not in typedAnswer.js because
// nothing else wants it — Mappatura delle parole asks "did the ending land"
// against the map's rule, a known string, and this file has no rule to ask
// against, only the answer's own tail.
//
// It measures honestly, up to and including the whole answer, and leaves the
// question of whether that may be *quoted* to quotable(). It used to stop one
// character short instead, which is the letter of the rule and none of its
// point: `a occhio e croce` against `un occhio e croce` came back as `occhio
// e croce`, fourteen characters of sixteen and three words of four.
function sharedTail(input, answer) {
  const folded = foldTyped(input);
  let tail = "";
  for (let i = answer.length - 1; i >= 0; i--) {
    const grown = answer[i] + tail;
    if (!folded.endsWith(foldTyped(grown))) break;
    tail = grown;
  }
  return tail;
}

function countWords(value) {
  return foldTyped(value).split(" ").filter(Boolean).length;
}

// The ceiling on a quoted span, and the one gate both ends go through.
//
// MEANINGFUL says when an overlap is too small to be a location. This says
// when it is too large to be one: a located verdict may never quote a span
// that is the whole answer, and never one so close to it that what is left is
// not a real guess. `span` is what the verdict wants to quote, `rest` is the
// rest of the answer, and `span + rest === answer` at either end.
//
// What is left has to be something the learner still has to produce, and
// there are two ways to measure that because there are two ways an answer is
// built:
//
//   inside a word   a span that stops mid-word leaves a word to finish.
//                   `parl` of `parlo` is four characters of five and is still
//                   the most useful verdict this file produces: -o, -i, -a,
//                   -iamo, -ate and -ano all still fit, so the ending is
//                   located and not handed over.
//   whole words     a span that stops on a word edge hands over whole words,
//                   and then a character count is no measure at all — the two
//                   characters `a occhio e croce` keeps back are one word of
//                   four. So at least half the answer's words have to remain.
//
// A proportion of characters cannot separate those two cases (80% against
// 87.5%) and neither can "one character short", which is what shipped. The
// unit has to be the word, because the word is what the learner produces.
function quotable(span, rest, answer) {
  if (rest.trim() === "") return false;
  const wholeWords = countWords(span) + countWords(rest) === countWords(answer);
  return !wholeWords || countWords(rest) * 2 >= countWords(answer);
}

export function judge(question, input, attempt) {
  const answer = question.answer;
  // Everything below judges, locates and quotes against `target` — the answer
  // without the punctuation the cloze swallowed — and every `answer` that
  // leaves this function is the full spelling. See CLOSING.
  const target = withoutClosing(answer);
  const typed = withoutClosing(input);
  const last = attempt >= ATTEMPTS;
  const base = { correct: false, kind: null, spent: true, last, answer: null, shared: null, tail: null };

  // An empty box is not an attempt. There is nothing in it to locate, and
  // spending one of two goes on a mis-tapped button would be marking
  // dexterity rather than Italian — the same argument that makes accents
  // forgivable in typedAnswer.js.
  if (input.trim() === "") {
    return { ...base, kind: "blank", spent: false, last: false };
  }

  if (sameTyped(typed, target)) {
    // Written exactly as Italian writes it, or right once a mark she was
    // never asked to guess is folded away. The second case is still correct
    // and is still spelled back, or the app teaches the spelling it accepted.
    const asWritten = sameTyped(input, answer) && !accentsMissing(input, answer);
    return { ...base, correct: true, kind: asWritten ? "exact" : "spelling", answer: asWritten ? null : answer };
  }

  if (question.alternatives.some((alternative) => sameTyped(typed, withoutClosing(alternative)))) {
    return { ...base, kind: "distractor", answer: last ? answer : null };
  }

  // Before the spelling analysis, and that ordering is the argument. If what
  // she typed is another whole word from the list, she did not misspell this
  // one — she reached for the wrong entry — and "it starts right and then goes
  // somewhere else" would be a confident lie about the kind of error it is.
  // `parlare` against `parola` shares three characters at the front and none
  // of the mistake.
  if (question.neighbours.some((word) => sameTyped(typed, withoutClosing(word)))) {
    return { ...base, kind: "neighbour", answer: last ? answer : null };
  }

  const prefix = sharedPrefix(typed, target);
  const behind = target.length - prefix.length;
  const tail = sharedTail(typed, target);

  // Ordered, and the order is the argument. A front-anchored match says more
  // than a back-anchored one — Italian inflects at the end — so a real shared
  // prefix wins even when the tail happens to agree too: `parlamo` for
  // `parliamo` starts right and ends right, and "it goes wrong after parl" is
  // the useful half. `behind > 0` keeps an input that contains the whole
  // answer plus something else out of "the ending missed", which would be a
  // lie about where the extra is.
  let kind = "other";
  if (prefix.trim().length >= MEANINGFUL && behind > 0 && behind <= ENDING) kind = "ending";
  else if (prefix.trim().length >= MEANINGFUL) kind = "partial";
  else if (tail.trim().length >= MEANINGFUL) kind = "stem";

  // The located sentence stands on its own; only the fragment is gated. So an
  // input that swallows the whole answer still gets "it starts right and then
  // goes somewhere else" — which is true, and locates it — without the card
  // spelling out where the answer stopped.
  const front = kind === "ending" || kind === "partial";
  const back = kind === "stem";
  const span = front ? prefix : tail;
  const rest = front ? target.slice(prefix.length) : target.slice(0, target.length - tail.length);
  const quote = (front || back) && quotable(span, rest, target) ? span.trim() : null;

  return {
    ...base,
    kind,
    shared: front ? quote : null,
    tail: back ? quote : null,
    answer: last ? answer : null,
  };
}

// Whether the verdict is about something the learner actually wrote. An empty
// box and a "show me" are not: there is no answer of hers to mark right or
// wrong. The tick/cross and aria-invalid both follow this rather than
// `!correct`, so neither tells her she got something wrong when she typed
// nothing (WCAG 1.4.1 for the first, 3.3.1 for the second).
//
// It lives beside the verdicts rather than in a screen because it is a fact
// about a verdict, and both screens that render one need it.
export function answered(verdict) {
  return verdict.kind !== "blank" && verdict.kind !== "revealed";
}

// "Show me" — a deliberate second choice, and wrong by definition: the item
// is settled, the answer is handed over, and nothing about it promotes.
export function reveal(question) {
  return { correct: false, kind: "revealed", spent: true, last: true, answer: question.answer, shared: null, tail: null };
}

// The located sentences. The one thing none of them may contain is the
// answer. Exported because the verdict card renders these very strings —
// they are pure English, so the WCAG 3.1.2 argument at the top of this file
// does not apply and a second copy in JSX would only be a copy to drift.
export const LOCATED = {
  distractor:
    "That is one of the other forms this item was written with — the right word, in a form the sentence does not want. Which one does it want?",
  neighbour:
    "That is a real word from this list, but it belongs to a different entry. Read the English gloss again — which word does this one want?",
  ending: "You have the word right up to its last letters. It is the ending that missed.",
  partial: "It starts right and then goes somewhere else.",
  stem: "It ends the way the answer ends. What comes in front of that does not.",
  other: "There is nothing in that to line up against the answer — it is a different word rather than a near miss.",
  blank: "Nothing is written yet, so there is nothing to place. Put down whatever you have and check it.",
};

// The card carries "Not there yet" in its heading and its AnswerMark, so the
// lead belongs only in the spoken twin.
const LEAD = "Not quite.";

// The same verdict as plain sentences, for the live region. A screen reader
// gets no colour and no cards, so everything the sighted learner reads off
// the feedback has to be in here — including the "where", which is the whole
// point of locating a wrong answer rather than solving it.
export function announce(verdict) {
  if (verdict.kind === "blank") return LOCATED.blank;

  if (verdict.correct) {
    return verdict.answer ? `Correct. Italian writes it ${verdict.answer}${fullStopAfter(verdict.answer)}` : "Correct.";
  }

  if (verdict.kind === "revealed") return `The answer is ${verdict.answer}${fullStopAfter(verdict.answer)}`;

  const parts = [`${LEAD} ${LOCATED[verdict.kind]}`];
  if (verdict.shared) parts.push(`You have ${verdict.shared} right.`);
  if (verdict.tail) parts.push(`Both end ${verdict.tail}.`);
  parts.push(verdict.answer ? `The answer is ${verdict.answer}${fullStopAfter(verdict.answer)}` : "Try once more.");
  return parts.join(" ");
}
