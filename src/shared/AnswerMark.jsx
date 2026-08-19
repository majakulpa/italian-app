import React from "react";
import { Check, X } from "lucide-react";
import { SR_ONLY } from "./theme.js";

// The tick / cross that marks an answered option. The icon alone is silent
// to a screen reader and the colour alone is silent to anyone not seeing it,
// so the mark carries its meaning in text too — visually hidden, but part of
// the option's accessible name (WCAG 1.4.1: colour is never the only cue).
//
// `state` is "correct" for the right answer and "incorrect" for a wrong one
// the person actually picked.
export default function AnswerMark({ state, size = 16, style }) {
  const Icon = state === "correct" ? Check : X;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, ...style }}>
      <Icon size={size} aria-hidden="true" />
      <span style={SR_ONLY}>{state === "correct" ? "correct answer" : "your answer, incorrect"}</span>
    </span>
  );
}
