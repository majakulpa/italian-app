import React from "react";
import { TOKENS } from "./theme.js";

export default function PerforatedDivider() {
  return (
    <div
      style={{
        height: 1,
        backgroundImage: `repeating-linear-gradient(to right, ${TOKENS.line} 0, ${TOKENS.line} 6px, transparent 6px, transparent 12px)`,
        margin: "18px 0",
      }}
    />
  );
}
