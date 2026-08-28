import React, { useEffect, useRef, useState } from "react";
import { Menu, Home, Check } from "lucide-react";
import { TOKENS, tint } from "./theme.js";

// Global module switcher, mounted once in App.jsx so it's reachable from
// every screen (the module menu itself, and mid-session in any module) —
// picking an item jumps straight there, without backing out step by step.
export default function NavMenu({ modules, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (id) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menu"
        style={{
          border: `1px solid ${TOKENS.controlLine}`,
          background: TOKENS.card,
          color: TOKENS.inkSoft,
          borderRadius: "50%",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Menu size={16} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Navigate"
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            minWidth: 230,
            background: TOKENS.card,
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 14,
            boxShadow: "0 16px 32px -12px rgba(0,0,0,0.35)",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 20,
          }}
        >
          <NavItem label="All modules" icon={Home} isActive={active === null} onClick={() => pick(null)} />
          <div style={{ height: 1, background: TOKENS.line, margin: "4px 6px" }} />
          {modules.map((mod) => (
            <NavItem
              key={mod.id}
              label={mod.name}
              lang={mod.lang}
              icon={mod.icon}
              isActive={active === mod.id}
              disabled={!mod.ready}
              onClick={() => mod.ready && pick(mod.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// `lang` is undefined for an English name, which leaves the attribute off
// entirely and lets the item inherit the page's language — the correct
// markup, rather than lang="en" repeated on every row.
function NavItem({ label, lang, icon: Icon, isActive, disabled, onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      aria-current={isActive ? "true" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "none",
        background: isActive ? tint(TOKENS.adriatic, 12) : "transparent",
        color: disabled ? TOKENS.inkSoft : TOKENS.ink,
        borderRadius: 9,
        padding: "9px 10px",
        fontFamily: "'Inter', sans-serif",
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
        width: "100%",
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span lang={lang} style={{ flex: 1 }}>
        {label}
      </span>
      {disabled && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: 0.5, color: TOKENS.inkSoft }}>
          SOON
        </span>
      )}
      {isActive && <Check size={14} color={TOKENS.adriaticDeep} aria-hidden="true" />}
    </button>
  );
}
