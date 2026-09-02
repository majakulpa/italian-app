// Judging one article choice.
//
// Same argument as modules/mappe/feedback.js, and deliberately a sibling of
// it rather than a lift into shared/. What the two have in common is a
// *shape* — two attempts, a verdict that is data rather than a sentence, one
// announce() that builds the plain text for the live region, and nothing
// revealed until the attempts are spent. What they do not have in common is a
// single line of judging logic: Le Mappe compares a typed string against a
// suffix rule and measures how far a shared prefix got, and this file
// compares a chosen option against an answer along two categorical
// dimensions. There is nothing to lift but the number 2, and hoisting that
// would couple two drills that have no reason to keep the same attempt count
// forever. PLAN's instruction was to reuse the shape rather than re-decide
// it, and the shape is what is reused.
//
// ── Located, not solved, when there are only three options ───────────────
// A typed answer has an infinite answer space, so "the ending is right and
// the stem is not" narrows almost nothing. Three buttons do not have that
// luxury, and pretending otherwise would mean saying nothing useful at all.
// So a verdict here names the *dimension* the choice went wrong on and never
// the answer, which is a hint the learner can only use if they can classify
// the three options themselves — and classifying them is the lesson:
//
//   fusion        the preposition and the article are both right, and Italian
//                 writes them as one word. The most useful wrong answer in
//                 the strand, because the reasoning was correct
//   intrusive     Italian wants no article in this gap and there is one
//   missing       Italian wants one and the gap was left empty — the error
//                 both of the learner's languages push her toward
//   definiteness  an article belongs, but the other kind of one
//   form          the right kind, the wrong shape for the gender or for the
//                 sound the next word starts with
//
// None of those five sentences contains the answer; see announce() below.
//
// The rule and the Polish anchor are withheld on a wrong first attempt for
// the same reason: naming the rule for an item whose answer is `lo` *is*
// giving the answer, and the anchor for `Bevo il caffè` says in as many words
// that neither language would put anything there. Both arrive on a right
// answer, or on the reveal.
//
// Verdicts are data, not sentences: the module composes the markup, because
// these messages mix Italian forms, Polish sentences and English prose in one
// paragraph and a string can only claim one language (WCAG 3.1.2).

import { ARTICLE_FORMS, RULES, filled } from "../../data/articoli.js";

export const ATTEMPTS = 2;

// Which dimension the choice went wrong on. `want` and `got` are
// ARTICLE_FORMS entries, so this reasons about what the forms *are* and never
// about how they are spelled.
//
// Order matters. The fusion check goes first because an unfused pick against
// a fused answer is a different lesson from every other mismatch — the
// learner got both halves right. It falls through when the answer is not
// fused at all: `in il` against `in centro` is an article that should not be
// there, and the fusion sermon would be beside the point.
function locate(want, got) {
  if (got.kind === "unfused" && want.kind === "fused") return "fusion";
  if (want.kind === "zero") return "intrusive";
  if (got.kind === "zero") return "missing";
  if (got.kind === want.kind) return "form";
  return "definiteness";
}

// Everything a settled item hands over: the rule behind it, the Polish
// anchor, the answer and the sentence with the gap closed. Shared by the
// right answer and by the reveal, so the two can never show different halves.
function opened(item) {
  return { rule: RULES[item.rule], anchor: item.anchor, answer: item.answer, sentence: filled(item), en: item.en };
}

export function judge(item, picked, attempt) {
  const last = attempt >= ATTEMPTS;
  const base = { picked, last, rule: null, anchor: null, answer: null, sentence: null, en: null };

  if (picked === item.answer) {
    return { ...base, ...opened(item), correct: true, kind: "exact" };
  }

  const kind = locate(ARTICLE_FORMS[item.answer], ARTICLE_FORMS[picked]);
  return { ...base, ...(last ? opened(item) : {}), correct: false, kind };
}

// The five located sentences, and the one thing none of them may contain is
// the answer. Each names a dimension and leaves the learner to work out which
// of the three buttons that rules out.
//
// Exported because the module renders these very strings inside the verdict
// card — they are the one part of the feedback that is pure English, with no
// Italian form and no Polish sentence in it, so the WCAG 3.1.2 argument at
// the top of this file (a string can only claim one language) does not apply
// and there is no reason to keep a second copy of the prose in JSX. There was
// a second copy, and it had already drifted: the card said "right. Italian"
// where this said "right, and Italian".
export const LOCATED = {
  fusion: "Both of those words are right. Italian writes a preposition and its article joined rather than side by side.",
  intrusive: "Which article to use is not the question here. Whether there is one at all is.",
  missing:
    "Italian does not leave this gap empty, even where Polish and English both would. Which article is the question.",
  definiteness: "An article does belong here. Which kind of one is what missed.",
  form:
    "Definite or indefinite is not what went wrong — that part is right. The shape is: Italian picks it by gender, and by the sound the next word starts with.",
};

// The card carries the same "not there yet" in its heading and its AnswerMark,
// so the lead only belongs in the spoken twin.
const LEAD = "Not quite.";

// The same verdict as plain sentences, for the live region. A screen reader
// gets no colour and no cards, so everything the sighted learner reads off
// the feedback has to be in here — the located "where", the rule, and the
// Polish anchor, which is a first-class layer rather than decoration.
export function announce(verdict) {
  const parts = [];

  if (verdict.correct) {
    parts.push(`Correct. Italian writes it: ${verdict.sentence} — ${verdict.en}.`);
  } else {
    parts.push(`${LEAD} ${LOCATED[verdict.kind]}`);
    parts.push(verdict.answer ? `The answer is ${verdict.answer}. ${verdict.sentence} — ${verdict.en}.` : "Try once more.");
  }

  if (verdict.rule) {
    parts.push(`One of the rules behind it: ${verdict.rule.forms.join(", ")}, ${verdict.rule.when}.`);
    parts.push(verdict.rule.says);
    parts.push(`In Polish: ${verdict.anchor.pl}. ${verdict.anchor.says}`);
  }

  return parts.join(" ");
}
