// Judging one typed answer in a mapping drill.
//
// The plan names the standard wrong → red cross → answer pattern as the
// weakest feedback shape available, and it is right: a cross says the answer
// is wrong and nothing else, so the learner's only move is to memorise the
// word — which is exactly what a rule-based map exists to avoid. So a verdict
// here carries *where* it went, and the module gives a second attempt before
// it reveals anything.
//
// There are five verdicts and each one is a different piece of information:
//
//   exact    right, and worth naming what was applied
//   accents  right letters, missing marks — accepted, with the spelling shown
//   trap     the map's own output, on one of the items where the map is
//            wrong. The most useful wrong answer there is, because it means
//            the rule was applied correctly and the rule is the problem
//   stem     the ending landed, the word in front of it didn't
//   ending   the ending didn't land
//
// `stem` needs an ending to have landed on, so a trap drill — whose answer
// sits outside the rule by construction — never produces it, and never names
// the rule's ending as the thing that was wanted. There the shared prefix
// carries the locating on its own.
//
// Verdicts are data, not sentences: the module composes the markup, because
// the Italian in these messages needs lang="it" around it and a string can't
// carry that. `announce()` is the one place a sentence gets built, for the
// live region, which can only take text.

import { sameTyped, accentsMissing, sharedPrefix } from "../../shared/typedAnswer.js";

export const ATTEMPTS = 2;

// Which of the map's source endings this drill's prompt is an instance of —
// derived rather than stored, so a drill can't claim a rule its prompt
// doesn't actually follow. mappe.test.js pins that every drill has one, which
// is why there's no "no suffix matched" branch here to cover.
export function drillSuffix(map, drill) {
  const route = map.routes.find((r) => r.lang === drill.srcLang);
  return route.from.find((suffix) => drill.src.endsWith(suffix.replace(/^-/, "")));
}

// "-cja → -zione", the rule as this drill uses it.
export function appliedRule(map, drill) {
  return `${drillSuffix(map, drill)} → ${map.rule.to}`;
}

export function judge(map, drill, input, attempt) {
  const answer = drill.it;
  const last = attempt >= ATTEMPTS;
  // On a trap drill the rule is the thing being disproved, so there is no
  // ending to praise, to demand, or to name in the feedback.
  const target = drill.trap ? null : map.rule.to;
  const base = { applied: null, extras: [], shared: null, trap: null, target, answer: null, last };

  if (sameTyped(input, answer)) {
    const missing = accentsMissing(input, answer);
    return {
      ...base,
      correct: true,
      kind: missing ? "accents" : "exact",
      applied: target ? appliedRule(map, drill) : null,
      extras: drill.extras,
      // Spelled out on an accent miss whether or not this was the last go:
      // accepting `possibilita` without ever showing `possibilità` would
      // teach the wrong spelling by omission.
      answer: missing ? answer : null,
    };
  }

  if (drill.trap && sameTyped(input, drill.trap.instead)) {
    return { ...base, correct: false, kind: "trap", trap: drill.trap, answer: last ? answer : null };
  }

  const ending = map.rule.to.replace(/^-/, "");
  const landed = target !== null && sameTyped(input.slice(-ending.length), ending);
  const prefix = sharedPrefix(input, answer);

  return {
    ...base,
    correct: false,
    kind: landed ? "stem" : "ending",
    // Two characters is where a shared prefix stops being a coincidence.
    shared: prefix.length >= 2 ? prefix : null,
    answer: last ? answer : null,
  };
}

// The same verdict as one plain sentence, for the live region. A screen
// reader gets no colour and no card, so everything the sighted learner reads
// off the feedback card has to be in here — including the "where", which is
// the whole point of locating a wrong answer rather than solving it.
export function announce(verdict) {
  const parts = [];

  if (verdict.correct) {
    parts.push(verdict.answer ? `Correct. Italian writes it ${verdict.answer}.` : "Correct.");
    if (verdict.applied) parts.push(`You applied ${verdict.applied}.`);
    for (const extra of verdict.extras) parts.push(`You also changed ${extra.from} to ${extra.to}.`);
    return parts.join(" ");
  }

  if (verdict.kind === "trap") {
    parts.push(`Not quite. ${verdict.trap.instead} is what the map gives you, and it means ${verdict.trap.means}.`);
  } else if (verdict.kind === "stem") {
    parts.push(`Not quite. The ending ${verdict.target} is right; the word in front of it is not.`);
  } else if (verdict.target) {
    parts.push(`Not quite. This map lands on ${verdict.target}, and that answer does not.`);
  } else {
    parts.push("Not quite.");
  }

  if (verdict.shared) parts.push(`You have ${verdict.shared} right, and it goes wrong after that.`);
  parts.push(verdict.answer ? `The answer is ${verdict.answer}.` : "Try once more.");
  return parts.join(" ");
}
