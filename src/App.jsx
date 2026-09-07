import React, { useState } from "react";
import { BookOpen, Grid3x3, MessageCircle, GraduationCap, ScrollText, Signpost, TriangleAlert, Type } from "lucide-react";
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
import ArticoliModule from "./modules/articoli/ArticoliModule.jsx";
import RiservaModule from "./modules/riserva/RiservaModule.jsx";
import FalsiAmiciModule from "./modules/falsiAmici/FalsiAmiciModule.jsx";
import OfficinaModule from "./modules/officina/OfficinaModule.jsx";

// Add new modules here as they're built. `ready: true` modules render their
// component; `ready: false` modules show a "coming soon" card on the dashboard.
// A module id here needs a matching entry in MODULE_STATS (shared/stats.js) for
// the dashboard to count its progress — stats.test.js checks the two agree.
//
// `lang` is for a name that isn't English. Every module until now was called
// something a screen reader could read off the page; "Mappatura delle parole" is Italian
// and has to say so (WCAG 3.1.2), the same as the district names on the map.
export const MODULES = [
  { id: "vocab", name: "Vocabulary", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", icon: MessageCircle, ready: true },
  { id: "stories", name: "Stories", icon: ScrollText, ready: true },
  // Mappatura delle parole is one of L'Officina's workbenches, reached from the hub the
  // `officina` district routes to. It keeps its NavMenu entry all the same:
  // the switcher lists every content module, and Mappatura delle parole would otherwise be
  // the one module missing from it.
  { id: "mappe", name: "Mappatura delle parole", lang: "it", icon: Signpost, ready: true },
  // La Riserva used to be a view rather than a module — a screen that read
  // progress the other benches wrote and kept none of its own. It is a module
  // now because it writes: a *fascia* opens onto a typed drill over the base
  // vocabulary under `riserva:` keys, so it has units to count, a card with a
  // real fraction on it, and a place in the switcher beside the other benches.
  { id: "riserva", name: "La Riserva", lang: "it", icon: Grid3x3, ready: true },
  // Gli Articoli is L'Officina's third bench, and in the NavMenu for the same
  // reason Mappatura delle parole is: the switcher lists every content module, and this
  // would otherwise be reachable only two doors into the workshop.
  { id: "articoli", name: "Gli Articoli", lang: "it", icon: Type, ready: true },
  // Falsi Amici is L'Officina's fourth bench, and in the NavMenu for the
  // same reason the other two are. It is also the module that is *most*
  // worth reaching mid-session: the traps it collects are the ones you walk
  // into somewhere else, and the collection is a thing to read rather than a
  // course to work through.
  { id: "falsi-amici", name: "Falsi Amici", lang: "it", icon: TriangleAlert, ready: true },
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
        {/* Review and L'Officina are routes, not modules: neither has content
            or progress of its own, so they stay out of MODULES (and out of
            the NavMenu that renders from it). The map is how you reach them —
            La Piazza for the review session, L'Officina for the workshop,
            which then opens the benches inside itself. */}
        {active === "review" && <ReviewModule onExit={() => setActive(null)} />}
        {active === "officina" && <OfficinaModule onExit={() => setActive(null)} />}
        {active === "vocab" && <VocabModule onExit={() => setActive(null)} />}
        {active === "grammar" && <GrammarModule onExit={() => setActive(null)} />}
        {active === "conversations" && <ConversationsModule onExit={() => setActive(null)} />}
        {active === "stories" && <StoriesModule onExit={() => setActive(null)} />}
        {active === "mappe" && <MappeModule onExit={() => setActive(null)} />}
        {active === "riserva" && <RiservaModule onExit={() => setActive(null)} />}
        {active === "articoli" && <ArticoliModule onExit={() => setActive(null)} />}
        {active === "falsi-amici" && <FalsiAmiciModule onExit={() => setActive(null)} />}
      </main>
    </div>
  );
}
