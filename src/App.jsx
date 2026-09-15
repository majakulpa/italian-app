import React, { useEffect, useState } from "react";
import { BookOpen, Grid3x3, MessageCircle, GraduationCap, ScrollText, Signpost, TriangleAlert, Type } from "lucide-react";
import { TOKENS, FONTS_IMPORT, THEME_STYLE, CITY_STYLE } from "./shared/theme.js";
import TabBar, { TAB_BAR_CLEARANCE } from "./shared/TabBar.jsx";
import Dashboard from "./Dashboard.jsx";
import ReviewModule from "./modules/review/ReviewModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";
import ConversationsModule from "./modules/conversations/ConversationsModule.jsx";
import StoriesModule from "./modules/stories/StoriesModule.jsx";
import OfficinaModule from "./modules/officina/OfficinaModule.jsx";
import CasaModule from "./modules/casa/CasaModule.jsx";
import { recordCoverage } from "./shared/coverageHistory.js";
import useThemeMode from "./shared/useThemeMode.js";

// Every content module the app ships. A module id here needs a matching entry
// in MODULE_STATS (shared/stats.js) for the city to count its progress —
// stats.test.js checks the two agree.
//
// This is a registry, not a menu. The NavMenu that used to render from it is
// gone, so nothing here decides how a module is reached: grammar,
// conversations and stories open off their districts on the map, and the
// other five are benches inside L'Officina. App.test.jsx walks every entry to
// its screen through those doors, so a module added here without one fails.
//
// `lang` is for a name that isn't English. Every module until now was called
// something a screen reader could read off the page; "Mappatura delle parole"
// is Italian and has to say so (WCAG 3.1.2), the same as the district names on
// the map.
export const MODULES = [
  { id: "vocab", name: "Vocabulary", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", icon: MessageCircle, ready: true },
  { id: "stories", name: "Stories", icon: ScrollText, ready: true },
  // Mappatura delle parole, La Riserva, Gli Articoli and Falsi Amici are
  // L'Officina's benches, opened by the hub inside itself.
  { id: "mappe", name: "Mappatura delle parole", lang: "it", icon: Signpost, ready: true },
  // La Riserva used to be a view rather than a module — a screen that read
  // progress the other benches wrote and kept none of its own. It is a module
  // now because it writes: a *fascia* opens onto a typed drill over the base
  // vocabulary under `riserva:` keys, so it has units to count.
  { id: "riserva", name: "La Riserva", lang: "it", icon: Grid3x3, ready: true },
  { id: "articoli", name: "Gli Articoli", lang: "it", icon: Type, ready: true },
  { id: "falsi-amici", name: "Falsi Amici", lang: "it", icon: TriangleAlert, ready: true },
];

export default function App() {
  const [active, setActive] = useState(null);
  // Applies a stored light/dark choice from the first screen. The toggle that
  // changes it lives in Casa, and used to be mounted on every screen, which is
  // what applied the choice at startup; without this a learner who chose dark
  // gets the OS theme on the map until Casa is opened. The toggle keeps its
  // own copy of the hook: this one only ever applies the stored value once, so
  // the two cannot fight over data-theme.
  useThemeMode();
  // Bumped on every move and used as the key on the routed screen, so that
  // pressing a tab always lands on that place's front screen. Without it,
  // pressing Officina from inside a bench would leave the bench open: the hub
  // keeps which bench is open in its own state, and the route would not have
  // changed.
  const [visit, setVisit] = useState(0);

  // Coverage is written down when the app opens and on every move, before
  // the next screen mounts — so a module just left has its answers in the
  // figure, and Casa reads a history that already has them. See
  // coverageHistory.js for why a point is dated the day it is recorded.
  useEffect(() => {
    recordCoverage();
  }, []);

  const go = (route) => {
    recordCoverage();
    setActive(route);
    setVisit((n) => n + 1);
  };
  const home = () => go(null);

  return (
    <div style={{ background: TOKENS.paper, minHeight: "100vh" }}>
      <style>{FONTS_IMPORT}</style>
      <style>{THEME_STYLE}</style>
      <style>{CITY_STYLE}</style>
      {/* One landmark around whatever screen is showing, so a screen-reader
          user can jump straight to the content. The bottom padding keeps the
          last line of the longest screen clear of the fixed tab bar. */}
      <main key={visit} style={{ paddingBottom: TAB_BAR_CLEARANCE }}>
        {!active && <Dashboard onSelect={go} />}
        {/* Review, L'Officina and Casa are routes, not modules: none has
            content or progress of its own, so they stay out of MODULES.
            L'Officina opens its benches inside itself. */}
        {active === "review" && <ReviewModule onExit={home} />}
        {active === "officina" && <OfficinaModule onExit={home} />}
        {active === "casa" && <CasaModule />}
        {active === "grammar" && <GrammarModule onExit={home} />}
        {active === "conversations" && <ConversationsModule onExit={home} />}
        {active === "stories" && <StoriesModule onExit={home} />}
      </main>
      <TabBar route={active} onSelect={go} />
    </div>
  );
}
