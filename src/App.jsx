import React, { useState } from "react";
import { BookOpen, MessageCircle, GraduationCap, ScrollText, Signpost } from "lucide-react";
import { TOKENS, FONTS_IMPORT, THEME_STYLE, CITY_STYLE } from "./shared/theme.js";
import ThemeToggle from "./shared/ThemeToggle.jsx";
import NavMenu from "./shared/NavMenu.jsx";
import Dashboard from "./Dashboard.jsx";
import ReviewModule from "./modules/review/ReviewModule.jsx";
import VocabModule from "./modules/vocab/VocabModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";
import ConversationsModule from "./modules/conversations/ConversationsModule.jsx";
import StoriesModule from "./modules/stories/StoriesModule.jsx";
import MappeModule from "./modules/mappe/MappeModule.jsx";

// Add new modules here as they're built. `ready: true` modules render their
// component; `ready: false` modules show a "coming soon" card on the dashboard.
// A module id here needs a matching entry in MODULE_STATS (shared/stats.js) for
// the dashboard to count its progress — stats.test.js checks the two agree.
//
// `lang` is for a name that isn't English. Every module until now was called
// something a screen reader could read off the page; "Le Mappe" is Italian
// and has to say so (WCAG 3.1.2), the same as the district names on the map.
export const MODULES = [
  { id: "vocab", name: "Vocabulary", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", icon: MessageCircle, ready: true },
  { id: "stories", name: "Stories", icon: ScrollText, ready: true },
  // Le Mappe is the first of L'Officina's four workbenches. Until the
  // Officina hub screen lands, the NavMenu is how it is reached — the
  // `officina` district in shared/districts.js still routes to `vocab`.
  { id: "mappe", name: "Le Mappe", lang: "it", icon: Signpost, ready: true },
];

export default function App() {
  const [active, setActive] = useState(null);

  return (
    <div style={{ background: TOKENS.paper, minHeight: "100vh" }}>
      <style>{FONTS_IMPORT}</style>
      <style>{THEME_STYLE}</style>
      <style>{CITY_STYLE}</style>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10, display: "flex", gap: 8 }}>
        <NavMenu modules={MODULES} active={active} onSelect={setActive} />
        <ThemeToggle />
      </div>
      {/* One landmark around whatever screen is showing, so a screen-reader
          user can jump straight to the content past the fixed nav buttons. */}
      <main>
        {!active && <Dashboard onSelect={setActive} />}
        {/* Review is a route, not a module: it has no content or progress of
            its own, so it stays out of MODULES (and out of the NavMenu that
            renders from it). La Piazza on the map is how you reach it. */}
        {active === "review" && <ReviewModule onExit={() => setActive(null)} />}
        {active === "vocab" && <VocabModule onExit={() => setActive(null)} />}
        {active === "grammar" && <GrammarModule onExit={() => setActive(null)} />}
        {active === "conversations" && <ConversationsModule onExit={() => setActive(null)} />}
        {active === "stories" && <StoriesModule onExit={() => setActive(null)} />}
        {active === "mappe" && <MappeModule onExit={() => setActive(null)} />}
      </main>
    </div>
  );
}
