import { useEffect, useState } from "react";
import { loadThemeMode, saveThemeMode } from "./storage.js";

// Two-state light/dark toggle. No stored preference means "follow the OS"
// (see the @media block in theme.js) — an explicit choice here overrides
// that by setting data-theme on <html>, which wins over the media query.
export default function useThemeMode() {
  const [mode, setMode] = useState(() => loadThemeMode() || "system");

  useEffect(() => {
    if (mode === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = mode;
    }
  }, [mode]);

  const toggle = () => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const current = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    const next = current === "dark" ? "light" : "dark";
    setMode(next);
    saveThemeMode(next);
  };

  const resolved = mode === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;

  return { mode: resolved, toggle };
}
