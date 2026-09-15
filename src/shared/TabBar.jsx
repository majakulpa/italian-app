import React from "react";
import { TOKENS, CITY_RULES, CITY_ACCENTS } from "./theme.js";

// The design's bottom tab bar (design/02-la-citta.html draws it under every
// screen): the four places the app is organised into, always one press away.
//
// It replaced the hamburger NavMenu, which listed modules rather than places.
// Nothing is lost by that: every module is behind a door on the map or a bench
// in L'Officina, and App.test.jsx walks every MODULES entry to its screen
// without a menu to prove it.
//
// `route` is what App.jsx shows for the tab: null is the map.
export const TABS = [
  { id: "citta", label: "Città", route: null },
  { id: "officina", label: "Officina", route: "officina" },
  { id: "piazza", label: "Piazza", route: "review" },
];

// Which tab a route lives under. A route that is not a tab's own root was
// reached from the map — Il Cantiere, Il Mercato and Il Cinema open grammar,
// conversations and stories straight off a district — so it sits under Città.
export function tabFor(route) {
  return TABS.find((tab) => tab.route === route) ?? TABS[0];
}

// The bar's own height: a 44px target (WCAG 2.5.5's size, and Apple's), 6px
// of padding either side of it, and the city's 3px rule along the top.
export const TAB_BAR_HEIGHT = 44 + 6 * 2 + CITY_RULES.border;

// How far anything has to stay clear of the bottom edge so the bar never sits
// on top of it: the bar, plus the home-indicator strip on an iPhone, which
// the bar pads itself out over (index.html sets viewport-fit=cover, which is
// what makes the inset non-zero there).
export const TAB_BAR_CLEARANCE = `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`;

// Every tab is a real button with its name written on it. A locked place is
// never a disabled tab: La Piazza with nothing due still opens, onto the
// landing that says what opens it — the same rule as a shut district on the
// map, which stays focusable and states its condition.
//
// Every tab draws its own boundary in controlLine, so each reads as something
// to press rather than as a caption on the bar. The current one is told apart
// three ways, so none of them is colour alone: aria-current for a screen
// reader, and on screen a filled chip with the city's heavier ink outline and
// a heavier weight.
export default function TabBar({ route, onSelect }) {
  const current = tabFor(route).id;

  return (
    <nav
      aria-label="Sections"
      className="citta"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        background: TOKENS.card,
        borderTop: `${CITY_RULES.border}px solid ${TOKENS.cityEdge}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul style={{ listStyle: "none", margin: "0 auto", padding: "6px 8px", maxWidth: 560, display: "flex", gap: 6 }}>
        {TABS.map((tab) => {
          const on = tab.id === current;

          return (
            <li key={tab.id} style={{ flex: 1, display: "flex" }}>
              <button
                onClick={() => onSelect(tab.route)}
                aria-current={on ? "page" : undefined}
                style={{
                  flex: 1,
                  minHeight: 44,
                  cursor: "pointer",
                  borderRadius: 12,
                  border: on ? `${CITY_RULES.border}px solid ${TOKENS.cityInk}` : `2px solid ${TOKENS.controlLine}`,
                  background: on ? CITY_ACCENTS.lemon.fill : "transparent",
                  color: on ? CITY_ACCENTS.lemon.ink : TOKENS.inkSoft,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: on ? 700 : 600,
                  padding: "0 4px",
                }}
              >
                <span lang="it">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
