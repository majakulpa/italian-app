import React from "react";

// The sentence that replaces "wrong" on an item above the learner's stage
// (see shared/stage.js). Drawn by the grammar drill and by La Piazza's verdict
// card, and spoken by both, so it lives once.
//
// The words are stageNoteText()'s, but the stage names are Italian inside an
// English sentence and a flat string cannot say so (WCAG 3.1.2), so this draws
// them as elements. StageNote.test.jsx holds the two to the same text.
export default function StageNote({ gate }) {
  const { stage, current } = gate;
  return (
    <>
      This form belongs to stage {stage.stage}, <span lang="it">{stage.name}</span>. You are at stage {current.stage},{" "}
      <span lang="it">{current.name}</span>, so it is not corrected yet.
    </>
  );
}
