import React, { useState } from "react";
import { BookOpen, MessageCircle, GraduationCap, ScrollText, ChevronRight } from "lucide-react";
import { TOKENS, FONTS_IMPORT } from "./shared/theme.js";
import VocabModule from "./modules/vocab/VocabModule.jsx";
import GrammarModule from "./modules/grammar/GrammarModule.jsx";

// Add new modules here as they're built. `ready: true` modules render their
// component; `ready: false` modules show a "coming soon" card on the menu.
const MODULES = [
  { id: "vocab", name: "Vocabulary", tagline: "Flashcards & quizzes", icon: BookOpen, ready: true },
  { id: "grammar", name: "Grammar", tagline: "Rules, drills, verb tables", icon: GraduationCap, ready: true },
  { id: "conversations", name: "Conversations", tagline: "Guided dialogues", icon: MessageCircle, ready: false },
  { id: "stories", name: "Stories", tagline: "Short graded readers", icon: ScrollText, ready: false },
];

function ModuleMenu({ onSelect }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 3, color: TOKENS.adriatic, marginBottom: 8, textTransform: "uppercase" }}>
          Benvenuto
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 600, color: TOKENS.ink, margin: 0, lineHeight: 1.1 }}>
          Italiano
        </h1>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => mod.ready && onSelect(mod.id)}
              disabled={!mod.ready}
              style={{
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: TOKENS.card,
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 14,
                padding: "18px 20px",
                cursor: mod.ready ? "pointer" : "default",
                opacity: mod.ready ? 1 : 0.55,
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: TOKENS.paperDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: TOKENS.ink,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: TOKENS.ink, margin: "0 0 2px" }}>
                  {mod.name}
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                  {mod.ready ? mod.tagline : "Coming soon"}
                </p>
              </div>
              {mod.ready && <ChevronRight size={18} color={TOKENS.inkSoft} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState(null);

  return (
    <div style={{ background: TOKENS.paper, minHeight: "100vh" }}>
      <style>{FONTS_IMPORT}</style>
      {!active && <ModuleMenu onSelect={setActive} />}
      {active === "vocab" && <VocabModule onExit={() => setActive(null)} />}
      {active === "grammar" && <GrammarModule onExit={() => setActive(null)} />}
    </div>
  );
}
