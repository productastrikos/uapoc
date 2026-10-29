/**
 * The terminal, and the zones inside it.
 *
 * ── What changed, and why ──────────────────────────────────────────────────
 * This used to define two areas — "Terminal 1 — Domestic" and "Terminal 2 —
 * International" — as convex hulls over OpenStreetMap building ways. Both the
 * names and the hulls were wrong: DPS tags only one building as a terminal, the
 * split between them was inferred, and a convex hull swallows the apron between
 * the piers, so the highlighted shape was bigger than the building it claimed
 * to be.
 *
 * So the hulls are gone. The geometry now comes from the same surveyed terminal
 * outlines the airfield lighting console draws (`geometry.dps.ts`), which is
 * the shape that already reads correctly on that screen. The map opens on the
 * west terminal block — the 441 x 204 m building — and divides *that building
 * and nothing else* into zones. No apron, no forecourt, no hull slop.
 *
 * ── How the zones are cut ──────────────────────────────────────────────────
 * The building's minimum-area oriented bounding box is tiled into equal cells,
 * and a cell survives only if its centre falls inside the real outline. That
 * gives equal-sized zones that follow the building's own axis rather than
 * north-south, which is what makes them look deliberate rather than like a grid
 * dropped on top.
 *
 * © OpenStreetMap contributors, ODbL.
 */

import { TERMINAL_RINGS } from './airfieldOverlay';

export interface TerminalZone {
  id: string;
  short: string;
  name: string;
  /** Zone centre, [lng, lat]. */
  centre: [number, number];
  /** Zone footprint as a closed ring, [lng, lat]. */
  ring: [number, number][];
}

export interface TerminalArea {
  id: string;
  name: string;
  short: string;
  centre: [number, number];
  /** Long axis of the building, for orienting the camera along it. */
  bearingDeg: number;
  widthM: number;
  depthM: number;
  outline: [number, number][];
  zones: TerminalZone[];
}

/* ────────────────────────────────────────────────────────────── geometry ── */

const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LNG = 111320 * Math.cos((-8.7449 * Math.PI) / 180);

const toM = ([lng, lat]: [number, number]): [number, number] => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];
const toLL = ([x, y]: [number, number]): [number, number] => [x / M_PER_DEG_LNG, y / M_PER_DEG_LAT];

/** Minimum-area oriented bounding box, by rotating calipers over each edge. */
function obb(ring: [number, number][]) {
  const M = ring.map(toM);
  let best: { area: number; ang: number; w: number; h: number; x0: number; y0: number } | null = null;
  for (let i = 0; i < M.length; i += 1) {
    const a = M[i];
    const b = M[(i + 1) % M.length];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const c = Math.cos(-ang);
    const s = Math.sin(-ang);
    const xs = M.map((p) => p[0] * c - p[1] * s);
    const ys = M.map((p) => p[0] * s + p[1] * c);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    if (!best || w * h < best.area) {
      best = { area: w * h, ang, w, h, x0: Math.min(...xs), y0: Math.min(...ys) };
    }
  }
  return best!;
}

/** OBB-local metres → [lng, lat]. */
function fromLocal(o: ReturnType<typeof obb>, u: number, v: number): [number, number] {
  const c = Math.cos(o.ang);
  const s = Math.sin(o.ang);
  const x = o.x0 + u;
  const y = o.y0 + v;
  return toLL([x * c - y * s, x * s + y * c]);
}

function inside(ring: [number, number][], pt: [number, number]): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const ringArea = (ring: [number, number][]) => {
  const M = ring.map(toM);
  let a = 0;
  for (let i = 0; i < M.length; i += 1) {
    const j = (i + 1) % M.length;
    a += M[i][0] * M[j][1] - M[j][0] * M[i][1];
  }
  return Math.abs(a / 2);
};

/**
 * Zone names, west to east along the building.
 *
 * A generic "Zone 1..12" tells an operator nothing about where they are, and a
 * zone is how this console addresses a place. These follow the ordinary
 * departures-then-arrivals arrangement of a single-block terminal.
 */
const ZONE_NAMES = [
  'Kerbside West', 'Check-in Hall West', 'Check-in Hall East', 'Security Screening',
  'Departure Lounge', 'Boarding Gates', 'Arrivals Hall', 'Baggage Reclaim',
  'Immigration', 'Customs', 'Plant Room West', 'Plant Room East',
];

function buildArea(ring: [number, number][], cols: number, rows: number): TerminalArea {
  const o = obb(ring);
  const zones: TerminalZone[] = [];
  let n = 0;

  for (let ry = 0; ry < rows; ry += 1) {
    for (let cx = 0; cx < cols; cx += 1) {
      const u0 = (cx / cols) * o.w;
      const u1 = ((cx + 1) / cols) * o.w;
      const v0 = (ry / rows) * o.h;
      const v1 = ((ry + 1) / rows) * o.h;
      const centre = fromLocal(o, (u0 + u1) / 2, (v0 + v1) / 2);
      if (!inside(ring, centre)) continue;

      // Inset so neighbouring zones read as separate rooms, not one grid.
      const pad = 0.1;
      const cu = (u0 + u1) / 2;
      const cv = (v0 + v1) / 2;
      const cell: [number, number][] = ([[u0, v0], [u1, v0], [u1, v1], [u0, v1]] as [number, number][])
        .map(([u, v]) => fromLocal(o, cu + (u - cu) * (1 - pad), cv + (v - cv) * (1 - pad)));
      cell.push(cell[0]);

      n += 1;
      zones.push({
        id: `TZ-${n}`,
        short: `Z${n}`,
        name: ZONE_NAMES[n - 1] ?? `Zone ${n}`,
        centre,
        ring: cell,
      });
    }
  }

  const cLng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;

  return {
    id: 'terminal',
    name: 'Passenger Terminal',
    short: 'TERMINAL',
    centre: [cLng, cLat],
    bearingDeg: ((90 - (o.ang * 180) / Math.PI) % 360 + 360) % 360,
    widthM: Math.round(o.w),
    depthM: Math.round(o.h),
    outline: ring,
    zones,
  };
}

/**
 * The west terminal block, zoned.
 *
 * `TERMINAL_RINGS[0]` is the 441 x 204 m building at the west end of the
 * complex — chosen by area among the rings that sit west of the apron centre,
 * so it stays correct if the surveyed geometry is re-exported.
 */
const WEST_BLOCK = (() => {
  const scored = TERMINAL_RINGS
    .map((r) => ({ r, area: ringArea(r), lng: r.reduce((s, p) => s + p[0], 0) / r.length }))
    .filter((c) => c.area > 5000)
    .sort((a, b) => a.lng - b.lng);
  return scored[0]?.r ?? TERMINAL_RINGS[0];
})();

export const TERMINAL_AREA: TerminalArea = buildArea(WEST_BLOCK, 6, 2);

/** Kept as a list because the map still iterates areas; there is only one now. */
export const TERMINAL_AREAS: TerminalArea[] = [TERMINAL_AREA];

export const ALL_ZONES: (TerminalZone & { areaId: string })[] = TERMINAL_AREA.zones.map((z) => ({
  ...z,
  areaId: TERMINAL_AREA.id,
}));

export const areaById = (id: string) => TERMINAL_AREAS.find((a) => a.id === id);
export const zoneById = (id: string) => ALL_ZONES.find((z) => z.id === id);

/* ───────────────────────────────────────────────────────────────── levels ── */

/**
 * Levels, and how each one changes the footprint it is drawn at.
 *
 * A terminal is not extruded from one plate: the apron level runs out under the
 * piers, the concourse is the widest floor, and the upper levels step back. Each
 * level scales the outline about its centroid, so the operator can see they
 * changed level without reading the label.
 */
export interface LevelSpec {
  key: string;
  label: string;
  scale: number;
}

export const LEVELS: LevelSpec[] = [
  { key: 'GF', label: 'Ground Floor — Arrivals & Kerbside', scale: 1 },
  { key: '1F', label: 'Level 1 — Check-in & Departures', scale: 0.94 },
  { key: '2F', label: 'Level 2 — Departure Lounge', scale: 0.86 },
  { key: '3F', label: 'Level 3 — Offices & Plant', scale: 0.74 },
];

export const levelByKey = (key: string) => LEVELS.find((l) => l.key === key) ?? LEVELS[0];

/** A ring scaled about its own centroid — how a level's footprint is derived. */
export function scaleRing(ring: [number, number][], scale: number): [number, number][] {
  if (scale === 1) return ring;
  const n = ring.length;
  const cx = ring.reduce((s, p) => s + p[0], 0) / n;
  const cy = ring.reduce((s, p) => s + p[1], 0) / n;
  return ring.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
}
