import { describe, it, expect } from "vitest";
import { STATIONS, HUBS } from "./stations.js";
import { BENCHES } from "../modules/officina/benches.js";
import { STALLS } from "../modules/mercato/stalls.js";
import { DISTRICTS } from "./districts.js";

// The station list's own invariants. The reachability checks that read it live
// in districts.test.js, where the map is; these are about the list being a
// list — that it holds everything, that ids are unique across hubs, and that
// the four fields the readers rely on are actually there.

describe("STATIONS", () => {
  it("holds every hub's own stations and nothing else", () => {
    expect(STATIONS).toEqual([...BENCHES, ...STALLS]);
  });

  // Ids are used as React keys inside one hub today, and the reachability
  // checks report failures by id across both — so a collision would name the
  // wrong station in a failure message and, worse, make two cards in two
  // hubs indistinguishable in a future single list.
  it("gives every station an id of its own, across hubs", () => {
    const ids = STATIONS.map((station) => station.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The contract shared/stations.js states: id, hub, route, module. `route`
  // and `module` may be null — a station that does not open yet, or one that
  // counts nothing — but they have to be declared rather than left undefined,
  // which is the same discipline question.js applies to `options` and
  // `alternatives`. A reader checking `station.module` must not have to know
  // which hub's file it came from first.
  it("declares all four contract fields on every station", () => {
    for (const station of STATIONS) {
      expect(Object.keys(station), station.id).toEqual(expect.arrayContaining(["id", "hub", "route", "module"]));
    }
  });
});

describe("HUBS", () => {
  it("names each hub once, in the order stations first mention it", () => {
    expect(HUBS).toEqual(["officina", "mercato"]);
  });

  // A hub is a district whose route is the hub itself — that is what makes it
  // a hub rather than a district with a module behind it. Checked here as well
  // as in districts.test.js because this file is where the derivation lives:
  // HUBS comes from the stations, so nothing stops a typo in one station's
  // `hub` from inventing a hub that no district points at.
  it("matches exactly the districts that route at themselves", () => {
    const routed = DISTRICTS.filter((district) => district.route === district.id).map((district) => district.id);
    expect([...HUBS].sort()).toEqual(routed.sort());
  });
});
