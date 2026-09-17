// The stations inside the city's hubs.
//
// A district on the map is usually a front door onto one module. Two of them
// are not: L'Officina holds five workbenches, and Il Mercato now holds Le
// Scene and the guided dialogues. In both, the district's own `route` goes to
// a hub screen that holds no content of its own, and what the map can actually
// reach is whatever that hub opens.
//
// districts.test.js has to answer exactly that question — "does every module
// the app ships still have a front door?" — and until now it answered it by
// naming `BENCHES` directly. That worked while L'Officina was the only hub and
// stopped working the moment there were two: Il Mercato would have had to be
// special-cased in the test, in `districtForModule`, and in the list of routes
// the app can show.
//
// So this is that list generalised. Every hub's own data file declares its
// stations and which hub they sit in, and this file is the union. Three things
// read it and none of them knows about a particular hub any more:
//
//   districts.js        resolves a module id to the district it lives in, for
//                       La Piazza's per-item colour and label.
//   districts.test.js   both reachability checks, and the set of routes a
//                       district is allowed to point at.
// A hub screen still imports its own list directly — OfficinaModule reads
// BENCHES, MercatoModule reads STALLS — because each draws its stations with
// its own chrome and there is nothing to share there. What is shared is the
// union, and the union is what the checks above need.
//
// The contract a station owes this file is four fields: `id`, `hub` (a
// district id), `route` (what pressing it opens, or null for a station that
// does not open yet) and `module` (the MODULE_STATS id it opens, or null for
// one that counts nothing of its own). Everything else on a station — the
// count, the icon, the blurb — belongs to the hub that draws it, and this file
// neither reads nor cares about it.

import { BENCHES } from "../modules/officina/benches.js";
import { STALLS } from "../modules/mercato/stalls.js";

export const STATIONS = [...BENCHES, ...STALLS];

// The hub routes, derived rather than listed. A district may route at a hub
// exactly when something registers stations under it — which is the property
// worth enforcing: a district pointing at a hub screen with nothing inside it
// is a door onto an empty room.
export const HUBS = [...new Set(STATIONS.map((station) => station.hub))];
