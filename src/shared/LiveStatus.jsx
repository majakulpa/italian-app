import React from "react";
import { SR_ONLY } from "./theme.js";

// One place where the live-region contract is decided, because getting it
// wrong fails silently — the markup looks correct and simply never speaks.
//
// Assistive tech registers a live region when the node enters the
// accessibility tree, then announces subsequent *changes* to its contents. A
// region mounted with its text already inside has no change to report, so
// whether it is announced at all comes down to the AT/browser pair. Mounted
// first and filled later is the only shape that works everywhere
// (WCAG 2.1 SC 4.1.3, Status Messages).
//
// So: mount this for the lifetime of the screen and pass falsy children when
// there is nothing to say. Never mount it next to the thing it describes,
// and never give the visible element this role — the visible half is seen,
// this half is heard, and one node cannot be both without becoming the case
// above.
export default function LiveStatus({ children }) {
  return (
    <p role="status" aria-live="polite" style={SR_ONLY}>
      {children}
    </p>
  );
}
