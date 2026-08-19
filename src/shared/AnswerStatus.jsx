import React from "react";
import { SR_ONLY } from "./theme.js";

// Answering a question repaints the options in green or red without moving
// focus, which a screen reader would otherwise pass over in silence. This is
// the spoken half of that feedback (WCAG 2.1 SC 4.1.3, Status Messages): a
// live region that stays mounted — empty until there's something to say, so
// the change of contents is what gets announced.
//
// Kept visually hidden because the same information is already on screen, in
// the colours and the tick/cross the sighted reader sees.
export default function AnswerStatus({ correct, answer }) {
  return (
    <p role="status" aria-live="polite" style={SR_ONLY}>
      {correct === null || correct === undefined
        ? ""
        : correct
          ? "Correct."
          : `Not quite. The answer is ${answer}.`}
    </p>
  );
}
