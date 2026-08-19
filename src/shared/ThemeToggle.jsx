import React from "react";
import { Sun, Moon } from "lucide-react";
import { TOKENS } from "./theme.js";
import useThemeMode from "./useThemeMode.js";

// Single light/dark toggle, mounted once in App.jsx so it's reachable from
// every screen regardless of which module is active.
export default function ThemeToggle() {
  const { mode, toggle } = useThemeMode();

  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        border: `1px solid ${TOKENS.controlLine}`,
        background: TOKENS.card,
        color: TOKENS.inkSoft,
        borderRadius: "50%",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
