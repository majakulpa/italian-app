import { useEffect, useState } from "react";

// Does this person want less movement on screen?
//
// ── Why this is the app's first reduced-motion query ────────────────────────
// It did not need one until now. playwright.config.js said so out loud: "Only
// two transitions exist in the whole app and there are no keyframes, intervals
// or rAF anywhere in src/". A sing-along breaks that — the highlight moves down
// the page on its own and the list scrolls to follow it, which is the first
// thing in this app that animates without being asked to.
//
// What the preference controls here is the *scroll*, not the highlight. Turning
// the highlight off would remove the feature; scrolling smoothly to it is the
// part that can make somebody ill, so that is the part that degrades. With the
// preference set the list jumps to the line instead of gliding to it, which is
// the same information arriving without the motion. The highlight itself is
// also always pausable (the play button), which is what SC 2.2.2 asks for.
//
// ── Why it lives here rather than in shared/ ────────────────────────────────
// One caller. This repo moves a helper up when it gains a second one —
// locatedFeedback.js moved out of modules/review/ the day La Riserva became its
// second caller, and not before. When a second screen animates, this moves to
// shared/ and this comment goes with it.
const QUERY = "(prefers-reduced-motion: reduce)";

export default function useReducedMotion() {
  // `matchMedia?.` rather than `matchMedia`: jsdom does not implement it, and
  // useThemeMode.js already guards the same way for the colour-scheme query.
  // Defaulting to false is the right fallback — it means "animate", which is
  // what a browser too old to report the preference does anyway.
  const [reduced, setReduced] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const list = window.matchMedia?.(QUERY);
    if (!list) return undefined;

    // The preference can change mid-session — someone turning it on in system
    // settings while the song plays should not have to reload to be heard.
    const onChange = (event) => setReduced(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
