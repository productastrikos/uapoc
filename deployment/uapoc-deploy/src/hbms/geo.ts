/**
 * Georeferencing: the schematic plan ↔ real coordinates at Ngurah Rai (DPS).
 *
 * The room schedule in `terminalPlan.ts` is drawn in an abstract 1000 × 560
 * plan space. To put those rooms on real satellite imagery, that space is
 * mapped onto the ground with a similarity transform — an origin, a rotation
 * and a scale — so a room's plan rectangle becomes a polygon in lat/lng.
 *
 * ── Calibration ────────────────────────────────────────────────────────────
 * ANCHOR / BEARING / SPAN below are the whole calibration. They place the
 * plan's top-left corner, the direction its +x axis runs, and how many metres
 * the plan's full width covers. Nudge these three against the imagery and the
 * entire plan — every room, every stand, every pin — follows.
 *
 * Current values put the terminal complex along the north side of runway
 * 09-27, domestic west and international east, with the airside face toward
 * the apron, which is the arrangement on the map. They are a starting fit, not
 * a survey: expect to adjust them once against the satellite layer.
 */

import { LEVEL_ROOMS, PLAN_H, PLAN_W, SHELL, STANDS, type LevelKey, type TerminalRoom } from './terminalPlan';

/** Where the plan's (0, 0) corner sits on the ground. */
export const ANCHOR = { lat: -8.748979, lng: 115.161121 };

/**
 * Compass bearing the plan's +x axis runs along, in degrees from north.
 *
 * +x runs domestic wing → international wing, which at DPS is roughly ENE, so
 * the complex sits parallel to runway 09-27 with the apron on its south side.
 */
export const BEARING_DEG = 75;

/** Ground distance the plan's full 1000-unit width covers, in metres. The two
 *  wing centres are ~656 m apart and sit 498 plan units apart, which sets this. */
export const SPAN_M = 1317;

/** Airport reference point, for the initial camera. */
export const DPS_CENTER = { lat: -8.745200, lng: 115.166300 };

const M_PER_DEG_LAT = 110574;
const mPerDegLng = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180);

const metresPerUnit = SPAN_M / PLAN_W;
const rad = (BEARING_DEG * Math.PI) / 180;
const sinB = Math.sin(rad);
const cosB = Math.cos(rad);

/**
 * Plan units → [lng, lat].
 *
 * +x runs along the bearing. +y runs 90° *anticlockwise* from it, because the
 * plan is drawn airside-up and at DPS the apron is on the south side: the top
 * of the drawing is the apron, the bottom is the landside kerb, and that only
 * lands correctly on the ground if increasing y heads north.
 */
export function planToLngLat(x: number, y: number): [number, number] {
  const east = (x * sinB - y * cosB) * metresPerUnit;
  const north = (x * cosB + y * sinB) * metresPerUnit;
  return [
    ANCHOR.lng + east / mPerDegLng(ANCHOR.lat),
    ANCHOR.lat + north / M_PER_DEG_LAT,
  ];
}

/** A room's footprint as a closed ring, ready for GeoJSON. */
export function roomRing(room: TerminalRoom): [number, number][] {
  const c: [number, number][] = [
    planToLngLat(room.x, room.y),
    planToLngLat(room.x + room.w, room.y),
    planToLngLat(room.x + room.w, room.y + room.h),
    planToLngLat(room.x, room.y + room.h),
  ];
  return [...c, c[0]];
}

/** A room's centre on the ground — where its marker goes. */
export function roomCentreLngLat(room: TerminalRoom): [number, number] {
  return planToLngLat(room.x + room.w / 2, room.y + room.h / 2);
}

/** A percentage position in plan space → ground. Zone and asset pins are
 *  already expressed this way, so they need no other conversion. */
export function pctToLngLat(xPct: number, yPct: number): [number, number] {
  return planToLngLat((xPct / 100) * PLAN_W, (yPct / 100) * PLAN_H);
}

/** The rooms of a level as a GeoJSON FeatureCollection. */
export function levelRoomsGeoJSON(level: LevelKey) {
  return {
    type: 'FeatureCollection' as const,
    // No top-level `id` here: GeoJSON feature ids must be numeric for
    // MapLibre, and a string one makes it drop the feature during tiling —
    // the source loads, reports no error, and renders nothing. The id lives
    // in properties instead, which is where the click handler reads it.
    features: LEVEL_ROOMS[level].map((room) => ({
      type: 'Feature' as const,
      properties: {
        id: room.id,
        name: room.name,
        short: room.short,
        category: room.category,
        detail: room.detail ?? '',
        zone: room.zone ?? '',
      },
      geometry: { type: 'Polygon' as const, coordinates: [roomRing(room)] },
    })),
  };
}

/** The terminal shell and its two wings, drawn under the rooms. */
export function shellGeoJSON() {
  const box = (b: { x: number; y: number; w: number; h: number }) => {
    const c: [number, number][] = [
      planToLngLat(b.x, b.y),
      planToLngLat(b.x + b.w, b.y),
      planToLngLat(b.x + b.w, b.y + b.h),
      planToLngLat(b.x, b.y + b.h),
    ];
    return [...c, c[0]];
  };
  return {
    type: 'FeatureCollection' as const,
    features: [
      { type: 'Feature' as const, properties: { kind: 'building' }, geometry: { type: 'Polygon' as const, coordinates: [box(SHELL.building)] } },
    ],
  };
}

/** Aerobridge stands along the airside face. */
export function standsGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: STANDS.map((s) => ({
      type: 'Feature' as const,
      properties: { id: s.id, wing: s.wing },
      geometry: { type: 'Point' as const, coordinates: planToLngLat(s.x, SHELL.building.y - 30) },
    })),
  };
}
