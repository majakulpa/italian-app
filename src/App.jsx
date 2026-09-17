import React, { useEffect, useState } from "react";
import { BookOpen, Grid3x3, MessageCircle, GraduationCap, Mic, ScrollText, Signpost, TriangleAlert, Type } from "lucide-react";
import { TOKENS, FONTS_IMPORT, THEME_STYLE, CITY_STYLE } from "./shared/theme.js";
import TabBar, { TAB_BAR_CLEARANCE } from "./shared/TabBar.jsx";
import Dashboard from "./Dashboard.jsx";
import ReviewModule from "./modules/review/ReviewModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";
import StoriesModule from "./modules/stories/StoriesModule.jsx";
import OfficinaModule from "./modules/officina/OfficinaModule.jsx";
import MercatoModule from "./modules/mercato/MercatoModule.jsx";
import CasaModule from "./modules/casa/CasaModule.jsx";
import { recordCoverage } from "./shared/coverageHistory.js";
import useThemeMode from "./shared/useThemeMode.js";

// Every content module the app ships. A module id here needs a matching entry
// in MODULE_STATS (shared/stats.js) for the city to count its progress —
// stats.test.js checks the two agree.
//
// This is a registry, not a menu. The NavMenu that used to render from it is
// gone, so nothing here decides how a module is reached: grammar and stories
// open off their districts on the map, four are benches inside L'Officina,
// and two — the dialogues and Le Scene — are stalls inside Il Mercato.
// App.test.jsx walks every entry to its screen through those doors, so a
// module added here without one fails.
//
// Conversations left this file's routing table when Il Mercato became a hub.
// It was the district's own route until then; now the hub renders it, the way
// L'Officina renders the deck, so App has no branch for it and the door is
// modules/mercato/stalls.js's to declare.
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
  // L'Officina's benches, opened by that hub inside itself.
  { id: "mappe", name: "Mappatura delle parole", lang: "it", icon: Signpost, ready: true },
  // La Riserva used to be a view rather than a module — a screen that read
  // progress the other benches wrote and kept none of its own. It is a module
  // now because it writes: a *fascia* opens onto a typed drill over the base
  // vocabulary under `riserva:` keys, so it has units to count.
  { id: "riserva", name: "La Riserva", lang: "it", icon: Grid3x3, ready: true },
  { id: "articoli", name: "Gli Articoli", lang: "it", icon: Type, ready: true },
  { id: "falsi-amici", name: "Falsi Amici", lang: "it", icon: TriangleAlert, ready: true },
  // Le Scene is Il Mercato's stall, opened by the hub inside itself — the
  // same shape as a bench. It is a module rather than a route because it
  // writes: a scene's new words are banked under `scene:` keys when its
  // Ascolta phase is finished, so it has units to count and a queue to feed.
  { id: "scenes", name: "Le Scene", lang: "it", icon: Mic, ready: true },
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
        {/* Review, the two hubs and Casa are routes, not modules: none has
            content or progress of its own, so they stay out of MODULES. Each
            hub opens its own stations inside itself — see shared/stations.js
            for the list both of them register in. */}
        {active === "review" && <ReviewModule onExit={home} />}
        {active === "officina" && <OfficinaModule onExit={home} />}
        {/* `onCasa` is the one cross-place jump a screen is given rather than
            left to the tab bar, and it is given for a reason: Le Scene's
            fourth phase is waiting on a scene-partner key that is entered in
            Casa, so Casa is the only thing a learner can do about that screen.
            Pointing at the tab bar instead would be a sentence where a
            destination exists. */}
        {active === "mercato" && <MercatoModule onExit={home} onCasa={() => go("casa")} />}
        {active === "casa" && <CasaModule />}
        {active === "grammar" && <GrammarModule onExit={home} />}
        {active === "stories" && <StoriesModule onExit={home} />}
      </main>
      <TabBar route={active} onSelect={go} />
    </div>
  );
}
