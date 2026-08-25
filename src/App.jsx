import React, { useState } from "react";
import { BookOpen, MessageCircle, GraduationCap, ScrollText } from "lucide-react";
import { TOKENS, FONTS_IMPORT, THEME_STYLE, CITY_STYLE } from "./shared/theme.js";
import ThemeToggle from "./shared/ThemeToggle.jsx";
import NavMenu from "./shared/NavMenu.jsx";
import Dashboard from "./Dashboard.jsx";
import ReviewModule from "./modules/review/ReviewModule.jsx";
import VocabModule from "./modules/vocab/VocabModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";
import ConversationsModule from "./modules/conversations/ConversationsModule.jsx";
import StoriesModule from "./modules/stories/StoriesModule.jsx";

// Add new modules here as they're built. `ready: true` modules render their
// component; `ready: false` modules show a "coming soon" card on the dashboard.
// A module id here needs a matching entry in MODULE_STATS (shared/stats.js) for
// the dashboard to count its progress — stats.test.js checks the two agree.
export const MODULES = [
  { id: "vocab", name: "Vocabulary", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", icon: MessageCircle, ready: true },
  { id: "stories", name: "Stories", icon: ScrollText, ready: true },
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
      </main>
    </div>
  );
}
