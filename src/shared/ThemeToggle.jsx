import React from "react";
import { Sun, Moon } from "lucide-react";
import { TOKENS, CITY_RULES } from "./theme.js";
import useThemeMode from "./useThemeMode.js";

// The light/dark toggle. It lives in Casa's settings now: it used to be fixed
// in the top-right corner of every screen beside the menu, and the design has
// neither — Casa is where settings go.
//
// Its name is written on it rather than carried by an icon and an aria-label,
// so what a sighted learner reads and what a screen reader says are the same
// words (WCAG 2.5.3), and the target is a full 44px row.
export default function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  const Icon = mode === "dark" ? Sun : Moon;

  return (
    <button
      onClick={toggle}
      style={{
        width: "100%",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        cursor: "pointer",
        background: TOKENS.card,
        color: TOKENS.ink,
        border: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
        borderRadius: 12,
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      <Icon size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
      {mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    </button>
  );
}
