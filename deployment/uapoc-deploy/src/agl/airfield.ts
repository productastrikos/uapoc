/**
 * Airfield lighting layout, generated onto the real surveyed geometry of
 * Ngurah Rai (WADD / DPS), Bali.
 *
 * Nothing here is hand-placed. Runway fixtures are stationed off the surveyed
 * centreline, and taxiway fixtures are walked along the surveyed taxiway
 * network, so every lamp sits where the pavement actually is. Spacings and
 * colours follow ICAO Annex 14:
 *
 *   - Runway edge at 60 m, yellow over the last 600 m
 *   - Centreline at 30 m: white, red/white from 900 m, red for the last 300 m
 *   - Touchdown zone barrettes of three, paired either side, over the first 900 m
 *   - CAT I approach: centreline barrettes to 900 m, crossbars at 150 m and 300 m
 *   - PAPI as a four-unit wing bar PERPENDICULAR to the centreline, stepping
 *     outward from the runway edge, on the left of each approach
 *   - Taxiway centreline green, edge blue, stop bars red at runway holding positions
 */

import {
  Circuit,
  Fixture,
  FixtureCategory,
  CategoryMeta,
  LightColour,
} from './types';
import {
  AIRPORT,
  RUNWAY_CENTRELINE,
  TAXIWAY_LINES,
  APRON_POLYGONS,
  TERMINAL_POLYGONS,
  OTHER_FEATURES,
  EXTENT,
  Pt,
} from './geometry.dps';

export {
  AIRPORT,
  RUNWAY_CENTRELINE,
  TAXIWAY_LINES,
  APRON_POLYGONS,
  TERMINAL_POLYGONS,
  OTHER_FEATURES,
  EXTENT,
};
export type { Pt };

export const RUNWAY_LENGTH = AIRPORT.runwayLength;
export const RUNWAY_WIDTH = AIRPORT.runwayWidth;
/** Lateral offset of the runway edge lights from the centreline. */
const EDGE_OFFSET = RUNWAY_WIDTH / 2;
/** Runway-holding position, 90 m from the centreline for a CAT I runway. */
const HOLD_DIST = 90;

/** Lateral offset of the runway centreline at a given station, in metres. */
function runwayYAt(x: number): number {
  const c = RUNWAY_CENTRELINE;
  for (let i = 1; i < c.length; i += 1) {
    const [ax, ay] = c[i - 1];
    const [bx, by] = c[i];
    if (x >= ax && x <= bx) {
      const t = bx === ax ? 0 : (x - ax) / (bx - ax);
      return ay + (by - ay) * t;
    }
  }
  return c[x <= c[0][0] ? 0 : c.length - 1][1];
}

/** Serviceability targets per lighting category. */
export const CATEGORIES: CategoryMeta[] = [
  { id: 'runway_centerline', label: 'Runway Center Lighting', colour: 'white', target: 95 },
  { id: 'runway_edge', label: 'Runway Edge Lighting', colour: 'white', target: 95 },
  { id: 'runway_tdz', label: 'Runway Touch Down Lighting', colour: 'white', target: 95 },
  { id: 'runway_threshold', label: 'Runway Threshold Lighting', colour: 'green', target: 100 },
  { id: 'runway_end', label: 'Runway End Lighting', colour: 'red', target: 100 },
  { id: 'approach', label: 'Approach Lighting', colour: 'white', target: 95 },
  { id: 'papi', label: 'PAPI Lighting', colour: 'white', target: 100 },
  { id: 'taxiway_centerline', label: 'Taxiway Center Lighting', colour: 'green', target: 90 },
  { id: 'taxiway_edge', label: 'Taxiway Edge Lighting', colour: 'blue', target: 90 },
  { id: 'stopbar', label: 'Stop Bar Lighting', colour: 'red', target: 100 },
];

export const CATEGORY_LABEL: Record<FixtureCategory, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.label }),
  { runway_guard: 'Runway Guard Lighting' } as Record<FixtureCategory, string>
);

/** Nominal luminous intensity in candela, used for setpoints and alarm limits. */
export const NOMINAL_INTENSITY: Record<FixtureCategory, number> = {
  runway_edge: 10000,
  runway_centerline: 5000,
  runway_tdz: 5000,
  runway_threshold: 10000,
  runway_end: 2500,
  approach: 20000,
  papi: 20000,
  taxiway_centerline: 200,
  taxiway_edge: 100,
  stopbar: 300,
  runway_guard: 300,
};

/** ADB SAFEGATE product family fitted to each category. */
const PRODUCT: Record<FixtureCategory, string> = {
  runway_edge: 'AXON EQ Runway Edge',
  runway_centerline: 'AXON EQ Runway Centerline',
  runway_tdz: 'AXON EQ Touchdown Zone',
  runway_threshold: 'AXON EQ Threshold / End',
  runway_end: 'AXON EQ Threshold / End',
  approach: 'AXON Approach Centerline & Crossbar',
  papi: 'RELIANCE PAPI Gen2 (L-880)',
  taxiway_centerline: 'AXON EQ Taxiway Centerline',
  taxiway_edge: 'AXON EQ Taxiway Edge Omni',
  stopbar: 'AXON EQ Stop Bar',
  runway_guard: 'AXON EQ Runway Guard Light',
};

const pad = (n: number) => String(n).padStart(3, '0');

function centrelineColour(x: number): LightColour {
  const remaining = Math.min(x, RUNWAY_LENGTH - x);
  if (remaining <= 300) return 'red';
  if (remaining <= 900) return 'red_white';
  return 'white';
}

function edgeColour(x: number): LightColour {
  const remaining = Math.min(x, RUNWAY_LENGTH - x);
  return remaining <= 600 ? 'yellow' : 'white';
}

interface Draft {
  id: string;
  category: FixtureCategory;
  description: string;
  x: number;
  y: number;
  colour: LightColour;
  /** Beam heading in degrees, for fixtures rendered as directional symbols. */
  heading?: number;
}

// ---------------------------------------------------------------------------
// Polyline helpers
// ---------------------------------------------------------------------------

const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Offset a polyline sideways by `d` metres, positive to the left of travel.
 *
 * Used to place and draw edge lighting, which runs parallel to a centreline at
 * a fixed offset. Joins are handled by simply offsetting each vertex along the
 * average of its adjoining normals — on airfield geometry, where bends are
 * gentle and offsets small relative to segment length, that is indistinguishable
 * from a proper miter and far cheaper.
 */
export function offsetPath(points: Pt[], d: number): Pt[] {
  const n = points.length;
  if (n < 2) return points;
  const normals: Pt[] = [];
  for (let i = 1; i < n; i += 1) {
    const len = segLen(points[i - 1], points[i]) || 1;
    normals.push([
      -(points[i][1] - points[i - 1][1]) / len,
      (points[i][0] - points[i - 1][0]) / len,
    ]);
  }

  const out: Pt[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = normals[Math.max(0, i - 1)];
    const b = normals[Math.min(normals.length - 1, i)];
    let nx = (a[0] + b[0]) / 2;
    let ny = (a[1] + b[1]) / 2;
    const m = Math.hypot(nx, ny) || 1;
    nx /= m;
    ny /= m;
    out.push([points[i][0] + nx * d, points[i][1] + ny * d]);
  }
  return out;
}

/** Slice a polyline between two arc-length stations. */
export function slicePath(points: Pt[], from: number, to: number): Pt[] {
  const out: Pt[] = [];
  let s = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = segLen(a, b);
    if (len < 1e-6) continue;
    const segStart = s;
    const segEnd = s + len;
    if (segEnd >= from && segStart <= to) {
      const t0 = Math.max(0, (from - segStart) / len);
      const t1 = Math.min(1, (to - segStart) / len);
      const p0: Pt = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0];
      const p1: Pt = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
      if (out.length === 0) out.push(p0);
      out.push(p1);
    }
    s = segEnd;
  }
  return out;
}

export function pathLength(points: Pt[]): number {
  let n = 0;
  for (let i = 1; i < points.length; i += 1) n += segLen(points[i - 1], points[i]);
  return n;
}

/** Stations every `spacing` metres along a polyline, with the local normal. */
function walk(points: Pt[], spacing: number) {
  const out: { x: number; y: number; nx: number; ny: number; hdg: number }[] = [];
  let carry = 0;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = segLen(a, b);
    if (len < 1e-6) continue;
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    const hdg = (Math.atan2(uy, ux) * 180) / Math.PI;

    for (let d = carry; d < len; d += spacing) {
      out.push({ x: a[0] + ux * d, y: a[1] + uy * d, nx: -uy, ny: ux, hdg });
    }
    carry = spacing - ((len - carry) % spacing);
    if (carry >= spacing) carry -= spacing;
  }
  return out;
}

/** Standard ray-cast point-in-polygon. */
function insidePolygon(pts: Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function insideAnyApron(x: number, y: number): boolean {
  return APRON_POLYGONS.some((p) => insidePolygon(p, x, y));
}

/** Minimum length for an apron lane to be treated as a lit through-taxilane. */
const APRON_THROUGH_MIN = 120;

/**
 * Classify each surveyed line as a lit taxilane or a painted stand lead-in.
 *
 * OSM traces 171 of the 198 ways at this airport inside the apron — one per
 * stand lead-in and service lane. Lighting all of them puts a green lamp every
 * 30 m across the whole apron, which is why it read as scatter: real aprons are
 * floodlit, with lighting on the through-taxilanes only and the stands reached
 * by PAINTED yellow lead-in lines. Short apron ways are therefore drawn as
 * markings rather than generated as fixtures.
 */
export function isStandLeadIn(points: Pt[]): boolean {
  const mid = points[Math.floor(points.length / 2)];
  if (!insideAnyApron(mid[0], mid[1])) return false;
  return pathLength(points) < APRON_THROUGH_MIN;
}

/**
 * Drop fixtures that land on top of one another.
 *
 * OSM traces the apron as many short, overlapping and near-parallel ways —
 * every stand lead-in, every service lane. Walking each independently produces
 * clumps of centreline lights a metre or two apart, which reads as scatter
 * rather than as lit taxi routes. Snapping to a grid and keeping the first
 * fixture in each cell leaves one clean line per lane.
 */
function dedupe(drafts: Draft[], minSpacing: number): Draft[] {
  const seen = new Set<string>();
  const out: Draft[] = [];
  for (const d of drafts) {
    // Runway fixtures are surveyed precisely and are meant to sit close
    // together — thinning them would break the barrettes.
    if (!d.category.startsWith('taxiway')) {
      out.push(d);
      continue;
    }
    const key = `${d.category}:${Math.round(d.x / minSpacing)}:${Math.round(d.y / minSpacing)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

/** Shortest distance from a point to a polyline. */
function distToPath(points: Pt[], px: number, py: number): number {
  let best = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const vx = bx - ax;
    const vy = by - ay;
    const l2 = vx * vx + vy * vy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
    best = Math.min(best, Math.hypot(px - (ax + vx * t), py - (ay + vy * t)));
  }
  return best;
}

/** Build every fixture on the airfield. */
function buildDrafts(): Draft[] {
  const out: Draft[] = [];
  let n = 0;

  // --- Runway edge, both sides, 60 m ---------------------------------------
  n = 0;
  for (let x = 0; x <= RUNWAY_LENGTH; x += 60) {
    const cy = runwayYAt(x);
    for (const side of [-1, 1]) {
      n += 1;
      out.push({
        id: `RWY_Edge_Light_${pad(n)}`,
        category: 'runway_edge',
        description: `Runway Edge Light ${pad(n)} (${Math.round(x)} m ${side < 0 ? 'south' : 'north'})`,
        x,
        y: cy + side * EDGE_OFFSET,
        colour: edgeColour(x),
        heading: 0,
      });
    }
  }

  // --- Runway centreline, 30 m ---------------------------------------------
  n = 0;
  for (let x = 15; x < RUNWAY_LENGTH; x += 30) {
    n += 1;
    out.push({
      id: `RWY_Center_Light_${pad(n)}`,
      category: 'runway_centerline',
      description: `Runway Centerline Light ${pad(n)} (${Math.round(x)} m)`,
      x,
      y: runwayYAt(x),
      colour: centrelineColour(x),
      heading: 0,
    });
  }

  // --- Touchdown zone: paired barrettes of three, first 900 m --------------
  for (const rwy of ['09', '27'] as const) {
    n = 0;
    for (let d = 150; d <= 900; d += 60) {
      const x = rwy === '09' ? d : RUNWAY_LENGTH - d;
      const cy = runwayYAt(x);
      for (const side of [-1, 1]) {
        for (let k = 0; k < 3; k += 1) {
          n += 1;
          out.push({
            id: `RWY${rwy}_TouchDwn_Light_${pad(n)}`,
            category: 'runway_tdz',
            description: `Runway ${rwy} Touch Down Zone Light ${pad(n)} (${d} m)`,
            x: x + (k - 1) * 4,
            y: cy + side * 11,
            colour: 'white',
            heading: 0,
          });
        }
      }
    }
  }

  // --- Threshold (green) and runway end (red) ------------------------------
  for (const rwy of ['09', '27'] as const) {
    const x = rwy === '09' ? 0 : RUNWAY_LENGTH;
    const cy = runwayYAt(x);
    n = 0;
    for (let i = 0; i < 14; i += 1) {
      n += 1;
      out.push({
        id: `RWY${rwy}_Threshold_Light_${pad(n)}`,
        category: 'runway_threshold',
        description: `Runway ${rwy} Threshold Light ${pad(n)}`,
        x: x + (rwy === '09' ? 4 : -4),
        y: cy - EDGE_OFFSET + (i * RUNWAY_WIDTH) / 13,
        colour: 'green',
      });
    }
    n = 0;
    for (let i = 0; i < 8; i += 1) {
      n += 1;
      out.push({
        id: `RWY${rwy}_End_Light_${pad(n)}`,
        category: 'runway_end',
        description: `Runway ${rwy} End Light ${pad(n)}`,
        x: x + (rwy === '09' ? -4 : 4),
        y: cy - EDGE_OFFSET + (i * RUNWAY_WIDTH) / 7,
        colour: 'red',
      });
    }
  }

  // --- CAT I precision approach --------------------------------------------
  for (const rwy of ['09', '27'] as const) {
    const dir = rwy === '09' ? -1 : 1;
    const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
    const cy = runwayYAt(base);
    n = 0;

    for (let d = 30; d <= 900; d += 30) {
      const lights = d <= 300 ? 3 : 1;
      for (let k = 0; k < lights; k += 1) {
        n += 1;
        out.push({
          id: `RWY${rwy}_Approach_Light_${pad(n)}`,
          category: 'approach',
          description: `Runway ${rwy} Approach Centerline Light ${pad(n)} (${d} m out)`,
          x: base + dir * d,
          y: cy + (lights === 1 ? 0 : (k - 1) * 4),
          colour: 'white',
        });
      }
    }

    for (const bar of [150, 300]) {
      const half = bar === 300 ? 5 : 3;
      for (let k = -half; k <= half; k += 1) {
        if (k === 0) continue;
        n += 1;
        out.push({
          id: `RWY${rwy}_Approach_Light_${pad(n)}`,
          category: 'approach',
          description: `Runway ${rwy} Approach Crossbar Light ${pad(n)} (${bar} m out)`,
          x: base + dir * bar,
          y: cy + k * 4.5,
          colour: 'white',
        });
      }
    }
  }

  // --- PAPI: four-unit wing bar, perpendicular, left of each approach -------
  for (const rwy of ['09', '27'] as const) {
    const x = rwy === '09' ? 300 : RUNWAY_LENGTH - 300;
    const cy = runwayYAt(x);
    const side = rwy === '09' ? 1 : -1;
    for (let i = 0; i < 4; i += 1) {
      out.push({
        id: `RWY${rwy}_PAPI_Light_${pad(i + 1)}`,
        category: 'papi',
        description: `Runway ${rwy} PAPI Unit ${i + 1}`,
        x,
        y: cy + side * (EDGE_OFFSET + 15 + i * 9),
        colour: 'white',
      });
    }
  }

  // --- Taxiway centreline and edge, walked along the surveyed network ------
  //
  // Two placement rules matter here, and getting either wrong scatters lights
  // across the apron in a way no real airfield looks like:
  //
  //  1. Edge lighting does not belong on an apron. Aprons are floodlit, and
  //     movement on them is guided by stand lead-in lines, not by rows of blue
  //     edge lights. Any station falling inside an apron polygon gets a
  //     centreline light only.
  //  2. Edge lighting does not belong on the runway either. Several surveyed
  //     taxiways cross the runway, and offsetting 11 m from those crossings
  //     dropped blue lights onto the runway surface.
  TAXIWAY_LINES.forEach((twy, ti) => {
    const label = pad(ti + 1);

    // Stand lead-ins are painted, not lit — see isStandLeadIn.
    if (isStandLeadIn(twy.points)) return;

    walk(twy.points, 30).forEach((p, i) => {
      out.push({
        id: `TWY_${label}_Center_Light_${pad(i + 1)}`,
        category: 'taxiway_centerline',
        description: `Taxiway ${label} Centerline Light ${pad(i + 1)}`,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        colour: 'green',
        heading: p.hdg,
      });
    });

    if (twy.lane) return;

    let n = 0;
    walk(twy.points, 90).forEach((p) => {
      for (const side of [-1, 1]) {
        const x = p.x + p.nx * side * 11;
        const y = p.y + p.ny * side * 11;
        if (insideAnyApron(x, y)) continue;
        if (distToPath(RUNWAY_CENTRELINE, x, y) < RUNWAY_WIDTH / 2 + 8) continue;
        n += 1;
        out.push({
          id: `TWY_${label}_Edge_Light_${pad(n)}`,
          category: 'taxiway_edge',
          description: `Taxiway ${label} Edge Light ${pad(n)}`,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          colour: 'blue',
        });
      }
    });
  });

  // --- Stop bars at runway holding positions -------------------------------
  // A holding position is where a taxiway meets the runway strip. Rather than
  // hand-listing them, find each taxiway station that sits at the holding
  // distance from the runway centreline and place a bar across the taxiway.
  let bar = 0;
  TAXIWAY_LINES.forEach((twy) => {
    if (twy.lane) return;
    let placed = false;
    walk(twy.points, 10).forEach((p) => {
      if (placed) return;
      const d = distToPath(RUNWAY_CENTRELINE, p.x, p.y);
      if (d > HOLD_DIST - 6 && d < HOLD_DIST + 6) {
        bar += 1;
        const b = bar;
        for (let k = -2; k <= 2; k += 1) {
          out.push({
            id: `TWY_HP${pad(b)}_StopBar_Light_${pad(k + 3)}`,
            category: 'stopbar',
            description: `Holding Position ${pad(b)} Stop Bar Light ${pad(k + 3)}`,
            x: Math.round((p.x + p.nx * k * 5.5) * 10) / 10,
            y: Math.round((p.y + p.ny * k * 5.5) * 10) / 10,
            colour: 'red',
          });
        }
        placed = true;
      }
    });
  });

  return out;
}

/** Assignment of fixtures to series circuits; first match wins. */
const CIRCUIT_PLAN: {
  id: string;
  name: string;
  ccrModel: string;
  aceUnit: string;
  ratedCurrent: number;
  match: (d: Draft) => boolean;
}[] = [
  { id: 'CCR-01', name: 'Runway Edge — RWY 09 half', ccrModel: 'ASG8000i 20 kVA', aceUnit: 'ACE3-01', ratedCurrent: 6.6, match: (d) => d.category === 'runway_edge' && d.x <= RUNWAY_LENGTH / 2 },
  { id: 'CCR-02', name: 'Runway Edge — RWY 27 half', ccrModel: 'ASG8000i 20 kVA', aceUnit: 'ACE3-02', ratedCurrent: 6.6, match: (d) => d.category === 'runway_edge' },
  { id: 'CCR-03', name: 'Runway Centerline', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-03', ratedCurrent: 6.6, match: (d) => d.category === 'runway_centerline' },
  { id: 'CCR-04', name: 'Touchdown Zone', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-04', ratedCurrent: 6.6, match: (d) => d.category === 'runway_tdz' },
  { id: 'CCR-05', name: 'Threshold & Runway End', ccrModel: 'CHF 7.5 kVA', aceUnit: 'ACE3-05', ratedCurrent: 6.6, match: (d) => d.category === 'runway_threshold' || d.category === 'runway_end' },
  { id: 'CCR-06', name: 'Approach — RWY 09', ccrModel: 'CHF 10 kVA', aceUnit: 'ACE3-06', ratedCurrent: 6.6, match: (d) => d.category === 'approach' && d.id.includes('RWY09') },
  { id: 'CCR-07', name: 'Approach — RWY 27', ccrModel: 'CHF 10 kVA', aceUnit: 'ACE3-07', ratedCurrent: 6.6, match: (d) => d.category === 'approach' },
  { id: 'CCR-08', name: 'PAPI', ccrModel: 'CHF 4 kVA', aceUnit: 'ACE3-08', ratedCurrent: 6.6, match: (d) => d.category === 'papi' },
  // The taxiway network is large enough to need several loops. Splitting it by
  // position along the field mirrors how an airfield is actually fed from
  // separate vault circuits, and keeps a cable fault confined to one loop.
  { id: 'CCR-09', name: 'Taxiway Centerline — West', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-09', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_centerline' && d.x < 1000 },
  { id: 'CCR-12', name: 'Taxiway Centerline — Central', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-12', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_centerline' && d.x < 2000 },
  { id: 'CCR-13', name: 'Taxiway Centerline — East', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-13', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_centerline' },
  { id: 'CCR-10', name: 'Taxiway Edge', ccrModel: 'CHF 7.5 kVA', aceUnit: 'ACE3-10', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_edge' },
  { id: 'CCR-11', name: 'Stop Bars', ccrModel: 'CHF 4 kVA', aceUnit: 'ACE3-11', ratedCurrent: 6.6, match: (d) => d.category === 'stopbar' || d.category === 'runway_guard' },
];

export interface Airfield {
  fixtures: Fixture[];
  circuits: Circuit[];
  byId: Record<string, Fixture>;
}

/** Generate the complete airfield: fixtures, circuits and lookup index. */
export function buildAirfield(): Airfield {
  // 18 m keeps a clean line at the 30 m centreline spacing while collapsing the
  // clumps thrown up by overlapping surveyed ways.
  const drafts = dedupe(buildDrafts(), 18);

  const circuits: Circuit[] = CIRCUIT_PLAN.map((p) => ({
    id: p.id,
    name: p.name,
    ccrModel: p.ccrModel,
    aceUnit: p.aceUnit,
    step: 3,
    ratedCurrent: p.ratedCurrent,
    outputCurrent: 5.2,
    insulationResistance: 120 + Math.round(Math.random() * 60),
    healthy: true,
    faulted: false,
    fixtureIds: [],
  }));

  const fixtures: Fixture[] = [];
  const byId: Record<string, Fixture> = {};

  for (const d of drafts) {
    if (byId[d.id]) continue;

    const plan = CIRCUIT_PLAN.find((p) => p.match(d));
    const circuitId = plan ? plan.id : 'CCR-01';
    const circuit = circuits.find((c) => c.id === circuitId)!;
    const nominal = NOMINAL_INTENSITY[d.category];

    const fixture: Fixture = {
      id: d.id,
      category: d.category,
      description: d.description,
      x: d.x,
      y: d.y,
      colour: d.colour,
      circuitId,
      seq: circuit.fixtureIds.length + 1,
      product: PRODUCT[d.category],
      state: 'on',
      comms: 'reporting',
      intensitySetpoint: nominal,
      intensityActual: Math.round(nominal * (0.94 + Math.random() * 0.1)),
      maintenanceMode: false,
      burnHours: Math.round(2000 + Math.random() * 14000),
    };

    circuit.fixtureIds.push(fixture.id);
    fixtures.push(fixture);
    byId[fixture.id] = fixture;
  }

  // Order each circuit along the loop so `seq` is geometrically meaningful —
  // fault localisation depends on neighbours actually being adjacent on the
  // cable, not merely adjacent in the array.
  //
  // Ordering by raw x would interleave fixtures from different taxiways that
  // happen to share a station, which is not how a series loop is pulled. A
  // cable runs the length of one taxiway before continuing to the next, so
  // group by run first and keep the walk order within each run. The array is
  // already in walk order, and sort is stable, so sorting on the run key alone
  // achieves both.
  for (const c of circuits) {
    const runKey = (id: string) => id.replace(/_\d+$/, '');
    c.fixtureIds.sort((a, b) => runKey(a).localeCompare(runKey(b)));
    c.fixtureIds.forEach((id, i) => {
      byId[id].seq = i + 1;
    });
  }

  return { fixtures, circuits, byId };
}

/** Approximate cable distance between two fixtures on the same loop. */
export function spanBetween(a: Fixture, b: Fixture): number {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
}
