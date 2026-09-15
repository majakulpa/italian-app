import React from "react";
import LiveStatus from "./LiveStatus.jsx";
import StageNote from "./StageNote.jsx";

// Answering a question repaints the options in green or red without moving
// focus, which a screen reader would otherwise pass over in silence. This is
// the spoken half of that feedback; LiveStatus is what keeps the region
// mounted and empty until there's something to say.
//
// Kept visually hidden because the same information is already on screen, in
// the colours and the tick/cross the sighted reader sees.
//
// ── Why the answer is its own element ───────────────────────────────────
// This used to build one flat string — `Not quite. The answer is ${answer}.`
// — and where the answer was Italian, a screen reader read it with English
// phonetics (SC 3.1.2). `lang` marks elements, not substrings, so a template
// literal genuinely cannot be marked; the fix is to stop building one.
//
// `answerLang` is per caller rather than defaulted to Italian, because the
// answer is not always Italian: the grammar drill and the story questions
// pass an Italian form, and the vocabulary quiz passes `word.en`, an English
// gloss. Defaulting to "it" would mispronounce every vocabulary answer —
// the same defect, pointed the other way. Undefined leaves the attribute
// off, which correctly inherits the page's language.
//
// `gate` is the grammar drill's third outcome: a miss on an item above the
// learner's stage (shared/stage.js), which is not called wrong. It is a prop
// here rather than a second live region beside this one, because a region
// mounted with its text already inside may never be announced — the one
// region has to carry every outcome.
export default function AnswerStatus({ correct, answer, answerLang, gate }) {
  if (correct === null || correct === undefined) return <LiveStatus>{""}</LiveStatus>;

  return (
    <LiveStatus>
      {correct ? (
        "Correct."
      ) : gate ? (
        <>
          <StageNote gate={gate} /> The form is <span lang={answerLang}>{answer}</span>.
        </>
      ) : (
        <>
          Not quite. The answer is <span lang={answerLang}>{answer}</span>.
        </>
      )}
    </LiveStatus>
  );
}
