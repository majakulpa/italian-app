// Judging one typed answer on a false friend.
//
// A sibling of modules/mappe/feedback.js and modules/articoli/feedback.js
// rather than a reuse of either, and the reason is what each one judges
// against. La Mappatura's `judge` is built on `map.rule.to` and `map.routes` —
// it derives which suffix the prompt is an instance of, decides whether the
// ending landed, and names the rule back. There is no rule here: a false
// friend is a fact about two words, not a correspondence, so every branch of
// that file that does the locating would be dead on this data and `map` is a
// parameter this bench has nothing to pass for. Gli Articoli's judge
// compares one of three buttons along two categorical dimensions, which a
// typed answer has none of.
//
// What is reused is the shape PLAN.md actually asked to be reused — two
// attempts, verdicts as data rather than sentences, one announce() for the
// live region, nothing revealed until the attempts are spent — and, in real
// code, shared/typedAnswer.js, which is where all three of these files get
// their accent tolerance and their shared-prefix arithmetic.
//
// Four verdicts:
//
//   exact    right
//   accents  right letters, missing marks — accepted, with the spelling
//            shown, because accepting `realta` silently would teach the
//            wrong spelling by omission
//   trap     the learner typed the false friend. This is the event the whole
//            bench is a record of, and the module writes it to storage
//   wrong    something else. Located by how far the shared prefix got, which
//            is all the locating there is when there is no rule to point at
//
// `say.also` exists because two answers can both be right — Polish
// `patetyczny` is `ampolloso` or `solenne`, and marking one of them wrong
// would be teaching a preference the language does not have.

import { sameTyped, accentsMissing, sharedPrefix } from "../../shared/typedAnswer.js";

export const ATTEMPTS = 2;

export function judge(trap, input, attempt) {
  const last = attempt >= ATTEMPTS;
  const base = { trap, last, shared: null, answer: null };
  const accepted = [trap.say.it, ...trap.say.also];

  const matched = accepted.find((form) => sameTyped(input, form));
  if (matched) {
    const missing = accentsMissing(input, matched);
    return { ...base, correct: true, kind: missing ? "accents" : "exact", answer: missing ? matched : null };
  }

  if (sameTyped(input, trap.bait)) {
    return { ...base, correct: false, kind: "trap", answer: last ? trap.say.it : null };
  }

  const prefix = sharedPrefix(input, trap.say.it);
  return {
    ...base,
    correct: false,
    kind: "wrong",
    // Two characters is where a shared prefix stops being a coincidence —
    // the same bar La Mappatura uses, so the two drills locate alike.
    shared: prefix.length >= 2 ? prefix : null,
    answer: last ? trap.say.it : null,
  };
}

// The same verdict as one plain sentence, for the live region. A screen
// reader gets no colour and no card, so everything the sighted learner reads
// off the feedback has to be in here — including which way round the two
// words go, which is the entire content of a false friend.
export function announce(verdict) {
  const { trap } = verdict;
  const parts = [];

  if (verdict.correct) {
    parts.push(verdict.answer ? `Correct. Italian writes it ${verdict.answer}.` : "Correct.");
    return parts.join(" ");
  }

  if (verdict.kind === "trap") {
    parts.push(`Not quite — that is the trap itself. ${trap.it} is Italian for ${trap.means}, not ${trap.lookalikeMeans}.`);
  } else {
    parts.push("Not quite.");
    if (verdict.shared) parts.push(`You have ${verdict.shared} right, and it goes wrong after that.`);
  }

  parts.push(verdict.answer ? `The answer is ${verdict.answer} — ${trap.say.en}.` : "Try once more.");
  return parts.join(" ");
}
