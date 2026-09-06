// Judging one typed answer in a review session.
//
// The third of these files, and deliberately a sibling of modules/mappe and
// modules/articoli rather than a lift into shared/. What the three have in
// common is a *shape* — two attempts, a verdict that is data rather than a
// sentence, one announce() that builds the plain text for the live region,
// and nothing revealed until the item is settled. What they do not have in
// common is judging logic: Le Mappe measures a typed answer against a suffix
// rule, Gli Articoli classifies a chosen option along two categorical
// dimensions, and this file has neither a rule nor a set of options — only an
// answer and whatever the learner typed. The four exports of
// shared/typedAnswer.js are the domain-free half, and they are what this is
// built on.
//
// ── Located, not solved, with nothing but the answer to go on ────────────
// PLAN.md names the standard wrong → red cross → answer pattern as the
// weakest feedback shape available, and until now La Piazza *was* that
// pattern — which is why Le Mappe and Gli Articoli both stayed out of the
// queue. So a verdict here says where the answer went wrong and never what it
// is, and the second attempt happens before anything is revealed:
//
//   exact       right.
//   accents     folded-equal, marks missing. Correct, and spelled back —
//               accepting `possibilita` without ever showing `possibilità`
//               teaches the wrong spelling by omission.
//   distractor  what was typed is one of the *other* forms this grammar item
//               was authored with. The most locatable error there is: the
//               right word in the wrong form. Naming that is not naming the
//               answer, and this never says which form was wanted.
//   ending      the answer is right up to its last letter or two.
//   partial     it starts right and diverges further in than that.
//   stem        it ends the way the answer ends and starts differently.
//   other       nothing lines up. Said plainly rather than dressed up as a
//               location that isn't there.
//   blank       nothing was typed. Not an attempt — see judge().
//   revealed    the learner pressed "show me".
//
// The fragments a verdict quotes back (`shared`, `tail`) are always letters
// the learner typed herself, so quoting them reveals nothing she did not
// already write. They are taken from the answer's spelling rather than the
// input's, so an accent she left off comes back with it on.
//
// Verdicts are data, not sentences: the module composes the markup, because
// these messages put Italian fragments inside English prose and one string
// can only claim one language (WCAG 3.1.2). LOCATED below is the exception —
// those five sentences are pure English with no Italian in them, so the card
// renders the very same strings rather than keeping a second copy that can
// drift.

import { foldTyped, sameTyped, accentsMissing, sharedPrefix } from "../../shared/typedAnswer.js";

export const ATTEMPTS = 2;

// Two characters is where an overlap stops being a coincidence — the same
// threshold Le Mappe uses, for the same reason. Italian words overwhelmingly
// end in a vowel, so a one-letter tail is true of half the lexicon.
const MEANINGFUL = 2;

// How much of the answer may still be wrong for it to count as "the ending".
// One or two characters is a verb ending, a plural, an agreement — the things
// that miss on a form the learner otherwise has.
const ENDING = 2;

// The mirror of sharedPrefix: how far the two agree from the *back*, folded,
// returned in the answer's own spelling. Not in typedAnswer.js because
// nothing else wants it — Le Mappe's "did the ending land" question is asked
// against the map's rule, a known string, and this file has no rule to ask
// against, only the answer's own tail.
//
// Never the whole answer: the loop stops one character short, so a tail can
// narrow the answer down but can't be it.
function sharedTail(input, answer) {
  const folded = foldTyped(input);
  let tail = "";
  for (let i = answer.length - 1; i >= 1; i--) {
    const grown = answer[i] + tail;
    if (!folded.endsWith(foldTyped(grown))) break;
    tail = grown;
  }
  return tail.trim();
}

export function judge(question, input, attempt) {
  const answer = question.answer;
  const last = attempt >= ATTEMPTS;
  const base = { correct: false, kind: null, spent: true, last, answer: null, shared: null, tail: null };

  // An empty box is not an attempt. There is nothing in it to locate, and
  // spending one of two goes on a mis-tapped button would be marking
  // dexterity rather than Italian — the same argument that makes accents
  // forgivable in typedAnswer.js.
  if (input.trim() === "") {
    return { ...base, kind: "blank", spent: false, last: false };
  }

  if (sameTyped(input, answer)) {
    const missing = accentsMissing(input, answer);
    return { ...base, correct: true, kind: missing ? "accents" : "exact", answer: missing ? answer : null };
  }

  if (question.alternatives.some((alternative) => sameTyped(input, alternative))) {
    return { ...base, kind: "distractor", answer: last ? answer : null };
  }

  const prefix = sharedPrefix(input, answer);
  const behind = answer.length - prefix.length;
  const tail = sharedTail(input, answer);

  // Ordered, and the order is the argument. A front-anchored match says more
  // than a back-anchored one — Italian inflects at the end — so a real shared
  // prefix wins even when the tail happens to agree too: `parlamo` for
  // `parliamo` starts right and ends right, and "it goes wrong after parl" is
  // the useful half. `behind > 0` keeps an input that contains the whole
  // answer plus something else out of "the ending missed", which would be a
  // lie about where the extra is.
  let kind = "other";
  if (prefix.length >= MEANINGFUL && behind > 0 && behind <= ENDING) kind = "ending";
  else if (prefix.length >= MEANINGFUL) kind = "partial";
  else if (tail.length >= MEANINGFUL) kind = "stem";

  return {
    ...base,
    kind,
    shared: kind === "ending" || kind === "partial" ? prefix : null,
    tail: kind === "stem" ? tail : null,
    answer: last ? answer : null,
  };
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
    return verdict.answer ? `Correct. Italian writes it ${verdict.answer}.` : "Correct.";
  }

  if (verdict.kind === "revealed") return `The answer is ${verdict.answer}.`;

  const parts = [`${LEAD} ${LOCATED[verdict.kind]}`];
  if (verdict.shared) parts.push(`You have ${verdict.shared} right.`);
  if (verdict.tail) parts.push(`Both end ${verdict.tail}.`);
  parts.push(verdict.answer ? `The answer is ${verdict.answer}.` : "Try once more.");
  return parts.join(" ");
}
