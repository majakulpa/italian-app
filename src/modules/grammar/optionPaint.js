import { TOKENS, CITY_RULES, CITY_ACCENTS } from "../../shared/theme.js";

// How a grammar drill option is painted, in La Città: the same three states Gli
// Articoli's option buttons use (modules/articoli/cards.jsx), so a choice looks
// like a choice in every district.
//
//   idle    unanswered, or answered and neither the answer nor a graded miss —
//           which includes the learner's own pick above her stage: that pick is
//           not judged, so it is not painted as anything.
//   answer  the right form, once the item is answered.
//   wrong   the learner's pick, where it was wrong and her stage grades it.
//
// A fill takes its own ink and never a neighbour's (rule 4 in theme.js), and a
// painted option draws its edge in cityInk. Kept out of the component so
// theme.test.js can measure exactly these pairings rather than a copy of them.
export function optionPaint(state) {
  if (state === "answer") return paint(CITY_ACCENTS.pistachio.fill, CITY_ACCENTS.pistachio.ink, TOKENS.cityInk);
  if (state === "wrong") return paint(CITY_ACCENTS.tomato.fill, CITY_ACCENTS.tomato.ink, TOKENS.cityInk);
  return paint(TOKENS.card, TOKENS.ink, TOKENS.controlLine);
}

function paint(background, color, edge) {
  return { background, color, border: `${CITY_RULES.border}px solid ${edge}`, edge };
}
