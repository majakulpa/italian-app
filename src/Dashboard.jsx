import React, { useId, useState } from "react";
import { Check, Lock } from "lucide-react";
import { TOKENS, SR_ONLY, CITY_RULES, CITY_ACCENTS, citySurface } from "./shared/theme.js";
import { loadProgress } from "./shared/storage.js";
import { coverage } from "./shared/coverage.js";
import { cityState, districtById, STREETS } from "./shared/districts.js";
import { FONDAMENTALE_TARGET } from "./data/fondamentale.js";

// La Città — the home screen, and a map rather than a list of modules.
//
// It replaced a dashboard of four cards plus a level ladder. The cards are
// now districts, which is not just a rename: a card said "Vocabulary, 12 of
// 120" and a district says where you are, what is open, and what is still
// shut and why. The ladder went because its per-level percentage was the
// "% complete" figure — content consumed — that the coverage headline above
// the map exists to replace.
//
// Read-only, like the dashboard before it. App.jsx unmounts this whenever a
// district is open, so reading storage once per mount picks up fresh numbers
// every time you come back.
export default function Dashboard({ onSelect }) {
  const [progress] = useState(loadProgress);
  const districts = cityState(progress);
  const shut = districts.filter((district) => district.lock);

  return (
    <div className="citta" style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            color: TOKENS.inkSoft,
            margin: "0 0 6px",
            textTransform: "uppercase",
          }}
        >
          Italiano
        </p>
        <h1
          lang="it"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 40,
            fontWeight: 600,
            color: TOKENS.ink,
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          La Città
        </h1>
      </div>

      <CoverageCard progress={progress} />
      <CityMap districts={districts} onSelect={onSelect} />
      {shut.length > 0 && <ClosedDoors districts={shut} />}
    </div>
  );
}

// The headline, kept from Phase 1 and moved onto the map: how much of
// everyday Italian is legible now, weighted by how often each word actually
// occurs (shared/coverage.js), beside the count of solid words the
// percentage is made of.
//
// Both numbers are capped low by the content that ships — 1.6% and 20 solid
// is everything the app can currently teach, because only 20 of the vocab
// module's 120 words are inside the base 2,000. So this card reads 0,0% for
// a real day-one learner and never climbs far. That is a property of the
// seeded lexicon, not of the arithmetic; coverage.js explains it at length
// and coverage.test.js pins the ceiling.
function CoverageCard({ progress }) {
  const { pct, counts } = coverage(progress);
  const ink = CITY_ACCENTS.pistachio.ink;

  return (
    <div style={{ ...citySurface("pistachio"), padding: "14px 16px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          Coverage
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 600,
            border: `2px solid ${ink}`,
            borderRadius: 999,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          {counts.solid} / {FONDAMENTALE_TARGET} solid
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 600, lineHeight: 0.95 }}>{pct}%</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.25, textAlign: "right" }}>
          of everyday{" "}
          <br />
          Italian
        </span>
      </div>

      {/* The bar is the same percentage, drawn. It stays a hairline for a
          long time, which is the honest picture: the first two hundred words
          of Italian are most of running text, and nobody has them yet. */}
      <div
        aria-hidden="true"
        style={{
          height: 10,
          marginTop: 10,
          border: `2px solid ${ink}`,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <span style={{ display: "block", width: `${pct}%`, height: "100%", background: ink }} />
      </div>
    </div>
  );
}

// The map itself: streets underneath, districts on top of them.
//
// The streets are an SVG and the districts are real <button>s positioned
// over it, rather than the whole thing being one clickable SVG. That is the
// accessible shape and it costs nothing: a <button> gets a focus ring, a
// role, a name and keyboard activation for free, where an SVG <circle>
// needs every one of those bolted on by hand and still announces oddly.
//
// Both read their coordinates from the same DISTRICTS entries, so a tile and
// the street running to it cannot drift apart.
function CityMap({ districts, onSelect }) {
  const titleId = useId();
  const descId = useId();
  const open = new Set(districts.filter((district) => !district.lock).map((district) => district.id));

  return (
    <div
      style={{
        ...citySurface(),
        background: TOKENS.paperDeep,
        position: "relative",
        aspectRatio: "1 / 1.06",
        marginBottom: 18,
      }}
    >
      <svg
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descId}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <title id={titleId}>La Città</title>
        {/* The streets carry information the buttons don't: which districts
            lead to which. Said in words, since a screen reader can't see a
            line. */}
        <desc id={descId}>
          A map of five districts joined by streets —{" "}
          {STREETS.map(([from, to]) => `${districtById(from).name} to ${districtById(to).name}`).join(", ")}. Each
          district is a button on the map.
        </desc>
        {STREETS.map(([from, to]) => {
          const a = districtById(from);
          const b = districtById(to);
          // A street to a shut district is drawn dashed and pale, so the map
          // reads as a place still opening up rather than as a finished one.
          const walkable = open.has(from) && open.has(to);

          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={walkable ? TOKENS.cityEdge : TOKENS.controlLine}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={walkable ? undefined : "6 6"}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {districts.map((district) => (
        <DistrictTile key={district.id} district={district} onSelect={onSelect} />
      ))}
    </div>
  );
}

// One district. A shut one uses aria-disabled rather than the disabled
// attribute: a disabled button leaves the tab order entirely, and a locked
// door you can't even reach is exactly the "door you didn't know was there"
// the design argues against. It stays focusable, announces as unavailable,
// and does nothing when pressed.
function DistrictTile({ district, onSelect }) {
  const { lock, accent, icon: Icon } = district;
  const open = !lock;

  return (
    <button
      onClick={() => open && onSelect(district.route)}
      aria-disabled={open ? undefined : "true"}
      style={{
        position: "absolute",
        left: `${district.x}%`,
        top: `${district.y}%`,
        transform: "translate(-50%, -50%)",
        width: 106,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        background: "none",
        border: "none",
        padding: 0,
        cursor: open ? "pointer" : "default",
        textAlign: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...citySurface(open ? accent : undefined),
          boxShadow: `${CITY_RULES.shadowSmall} ${TOKENS.cityShadow}`,
          borderRadius: "50%",
          width: 46,
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: open ? undefined : TOKENS.inkSoft,
        }}
      >
        {open ? district.done ? <Check size={22} /> : <Icon size={20} /> : <Lock size={18} />}
      </span>

      {/* The label sits on a chip of the plate colour, the way a place name
          on a real map sits in a halo. Without it the streets run straight
          through the lettering — the tiles are laid over the SVG, so a line
          shows through every gap in the type. */}
      <span
        style={{
          background: TOKENS.paperDeep,
          borderRadius: 7,
          padding: "2px 6px 3px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          lang="it"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 13,
            fontWeight: 600,
            color: TOKENS.ink,
            lineHeight: 1.1,
          }}
        >
          {district.name}
        </span>

        {/* Never a padlock alone: the tile carries the live counter, and the
            note below the map carries the rule behind it. This is the word a
            screen reader needs, which the padlock glyph can't give it. */}
        {!open && <span style={SR_ONLY}>locked, </span>}

        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            color: TOKENS.inkSoft,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
          }}
        >
          {district.status}
        </span>
      </span>
    </button>
  );
}

// What every shut district needs and a padlock can't say: the condition, in
// words, with the learner's current position in it. Dashed and unshadowed —
// the design's flat card — so it reads as a note about the map rather than
// as another thing to press.
function ClosedDoors({ districts }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: TOKENS.inkSoft,
          margin: "0 0 10px",
        }}
      >
        Shut for now
      </h2>

      <div style={{ display: "grid", gap: 10 }}>
        {districts.map((district) => (
          <div
            key={district.id}
            style={{
              ...citySurface(),
              background: "transparent",
              boxShadow: "none",
              border: `${CITY_RULES.border}px dashed ${TOKENS.cityEdge}`,
              padding: "12px 14px",
              display: "flex",
              gap: 10,
            }}
          >
            <Lock size={15} color={TOKENS.inkSoft} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.45 }}>
              <b lang="it" style={{ color: TOKENS.ink }}>
                {district.name}
              </b>{" "}
              — {district.lock.why}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
