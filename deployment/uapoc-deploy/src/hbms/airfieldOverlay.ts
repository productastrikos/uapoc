/**
 * The airfield's own structures, georeferenced for the map.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * The building-management map was drawing OpenStreetMap's raw `building`
 * layer, which at terminal zoom renders every shed, shop and house around the
 * aerodrome as an identical little box. The terminal was in there somewhere,
 * indistinguishable from the suburb.
 *
 * The airfield lighting console already had the right answer: `geometry.dps.ts`
 * carries surveyed apron and terminal outlines, cleaned and traced, which is
 * why that screen reads as an airport at a glance. Those polygons live in the
 * AGL local frame — metres along the runway from the 09 threshold, metres
 * perpendicular to it — so all that was missing was the transform back to
 * lng/lat.
 *
 * That is what this module is. One source of truth for what the terminal looks
 * like, shared by the two consoles that draw it, so they can never disagree.
 *
 * ── The transform ──────────────────────────────────────────────────────────
 * `geometry.dps.ts` was built by projecting OSM onto a local tangent plane
 * about the runway, rotating the runway onto +x and putting the 09 threshold at
 * the origin. This inverts that: rotate back by the surveyed true heading and
 * offset from the threshold's real position (OSM way 26213892, the 09/27
 * runway). Round-trips to within about half a metre, checked against the
 * independently-sourced terminal centroid.
 *
 * © OpenStreetMap contributors, ODbL.
 */

import { APRON_POLYGONS, TERMINAL_POLYGONS, OTHER_FEATURES, AIRPORT } from '../agl/geometry.dps';

/** The 09 threshold, where the AGL local frame has its origin. */
const THRESHOLD_09 = { lat: -8.7489422, lng: 115.1538825 };

const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LNG = 111320 * Math.cos((THRESHOLD_09.lat * Math.PI) / 180);

const H = (AIRPORT.headingDeg * Math.PI) / 180;
const SIN_H = Math.sin(H);
const COS_H = Math.cos(H);
// +y in the local frame runs 90 degrees anticlockwise from the runway heading,
// which at DPS points at the terminal — north of the strip.
const SIN_P = Math.sin(H - Math.PI / 2);
const COS_P = Math.cos(H - Math.PI / 2);

/** AGL local metres → [lng, lat]. */
export function aglToLngLat(x: number, y: number): [number, number] {
  const east = x * SIN_H + y * SIN_P;
  const north = x * COS_H + y * COS_P;
  return [
    THRESHOLD_09.lng + east / M_PER_DEG_LNG,
    THRESHOLD_09.lat + north / M_PER_DEG_LAT,
  ];
}

const ring = (pts: [number, number][]): [number, number][] => {
  const out = pts.map(([x, y]) => aglToLngLat(x, y));
  const first = out[0];
  const last = out[out.length - 1];
  // GeoJSON polygons must close; the source outlines do not always.
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) out.push(first);
  return out;
};

/** Terminal building outlines, in lng/lat. */
export const TERMINAL_RINGS: [number, number][][] = TERMINAL_POLYGONS.map(ring);

/** Apron and stand pavement, in lng/lat. */
export const APRON_RINGS: [number, number][][] = APRON_POLYGONS.map(ring);

/** Piers, hangars and the other built structures the AGL canvas draws. */
export const STRUCTURE_RINGS: [number, number][][] = OTHER_FEATURES.map((f) => ring(f.points));

const fc = (rings: [number, number][][], kind: string) => ({
  type: 'FeatureCollection' as const,
  features: rings.map((r, i) => ({
    type: 'Feature' as const,
    id: i,
    properties: { kind },
    geometry: { type: 'Polygon' as const, coordinates: [r] },
  })),
});

export const TERMINAL_GEOJSON = fc(TERMINAL_RINGS, 'terminal');
export const APRON_GEOJSON = fc(APRON_RINGS, 'apron');
export const STRUCTURE_GEOJSON = fc(STRUCTURE_RINGS, 'structure');
