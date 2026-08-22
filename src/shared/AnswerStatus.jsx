import React from "react";
import LiveStatus from "./LiveStatus.jsx";

// Answering a question repaints the options in green or red without moving
// focus, which a screen reader would otherwise pass over in silence. This is
// the spoken half of that feedback; LiveStatus is what keeps the region
// mounted and empty until there's something to say.
//
// Kept visually hidden because the same information is already on screen, in
// the colours and the tick/cross the sighted reader sees.
export default function AnswerStatus({ correct, answer }) {
  return (
    <LiveStatus>
      {correct === null || correct === undefined
        ? ""
        : correct
          ? "Correct."
          : `Not quite. The answer is ${answer}.`}
    </LiveStatus>
  );
}
