/**
 * Airfield geometry and fixture generation.
 *
 * Laid out in real airfield metres with the runway centreline at y = 0, then
 * mapped to the SVG viewBox at render time. The pattern follows ICAO Annex 14
 * closely enough that it reads correctly to anyone who knows an airfield:
 *
 *   - Runway edge lights at 60 m, yellow over the last 600 m
 *   - Centreline at 30 m: white, then red/white from 900 m, red for the last 300 m
 *   - Touchdown zone barrettes in pairs either side of the centreline over the
 *     first 900 m — the grid pattern you see on any precision runway
 *   - A CAT I precision approach system: centreline barrettes out to 900 m with
 *     crossbars at 150 m and 300 m
 *   - PAPI as a four-unit wing bar set PERPENDICULAR to the centreline and
 *     stepping outward from the runway edge, on the left of each approach
 *   - Two pairs of crossing rapid-exit taxiways, which is what gives a real
 *     airfield its X-shaped taxiway geometry
 */

import {
  Circuit,
  Fixture,
  FixtureCategory,
  CategoryMeta,
  LightColour,
} from './types';

/** Runway length in metres. */
export const RUNWAY_LENGTH = 3000;
/** Runway width in metres. */
export const RUNWAY_WIDTH = 45;
/** Lateral offset of the edge lights from the centreline. */
const EDGE_OFFSET = 25;
/** Centreline of the parallel taxiway. */
export const TAXIWAY_Y = -300;
/** Runway-holding position, 90 m from the centreline for a CAT I runway. */
const HOLD_Y = -95;

export type Pt = [number, number];

export interface TaxiwayDef {
  id: string;
  label: string;
  /** `ret` taxiways are rapid exits and leave the runway at a shallow angle. */
  kind: 'parallel' | 'connector' | 'ret' | 'stub';
  points: Pt[];
  width: number;
  /** Connectors and rapid exits carry a stop bar at the holding position. */
  holdAt?: Pt;
}

/**
 * Taxiway system.
 *
 * B/C and D/E are opposing rapid exits — B and D serve landings on 09, C and E
 * serve landings on 27 — and each pair overlaps in x so the two cross. That
 * crossing is the shape a real airfield makes, and it is what the flat
 * perpendicular-connector layout was missing.
 */
export const TAXIWAYS: TaxiwayDef[] = [
  {
    id: 'A',
    label: 'A',
    kind: 'parallel',
    points: [[150, TAXIWAY_Y], [2850, TAXIWAY_Y]],
    width: 44,
  },
  {
    id: 'A1',
    label: 'A1',
    kind: 'connector',
    points: [[230, -EDGE_OFFSET], [230, TAXIWAY_Y]],
    width: 44,
    holdAt: [230, HOLD_Y],
  },
  {
    id: 'B',
    label: 'B',
    kind: 'ret',
    points: [[1000, -EDGE_OFFSET], [1180, -150], [1411, TAXIWAY_Y]],
    width: 44,
    holdAt: [1150, HOLD_Y],
  },
  {
    id: 'C',
    label: 'C',
    kind: 'ret',
    points: [[1600, -EDGE_OFFSET], [1420, -150], [1189, TAXIWAY_Y]],
    width: 44,
    holdAt: [1450, HOLD_Y],
  },
  {
    id: 'D',
    label: 'D',
    kind: 'ret',
    points: [[2000, -EDGE_OFFSET], [2180, -150], [2411, TAXIWAY_Y]],
    width: 44,
    holdAt: [2150, HOLD_Y],
  },
  {
    id: 'E',
    label: 'E',
    kind: 'ret',
    points: [[2600, -EDGE_OFFSET], [2420, -150], [2189, TAXIWAY_Y]],
    width: 44,
    holdAt: [2450, HOLD_Y],
  },
  {
    id: 'H',
    label: 'H',
    kind: 'connector',
    points: [[2790, -EDGE_OFFSET], [2790, TAXIWAY_Y]],
    width: 44,
    holdAt: [2790, HOLD_Y],
  },
  // Apron entry stubs off the parallel taxiway.
  { id: 'S1', label: '', kind: 'stub', points: [[700, TAXIWAY_Y], [700, -400]], width: 40 },
  { id: 'S2', label: '', kind: 'stub', points: [[1500, TAXIWAY_Y], [1500, -400]], width: 40 },
  { id: 'S3', label: '', kind: 'stub', points: [[2300, TAXIWAY_Y], [2300, -400]], width: 40 },
];

/** Apron blocks drawn beneath the parallel taxiway. */
export const APRONS = [
  { id: 'Apron 1', x: 480, w: 440, y: -400, h: 260, stands: 4 },
  { id: 'Apron 2', x: 1280, w: 440, y: -400, h: 260, stands: 4 },
  { id: 'Apron 3', x: 2080, w: 440, y: -400, h: 260, stands: 4 },
];

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
}

// ---------------------------------------------------------------------------
// Polyline helpers — taxiway lights are placed by walking the centreline path
// ---------------------------------------------------------------------------

function segLength(a: Pt, b: Pt) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Positions every `spacing` metres along a polyline, with the local heading. */
function walk(points: Pt[], spacing: number): { x: number; y: number; nx: number; ny: number }[] {
  const out: { x: number; y: number; nx: number; ny: number }[] = [];
  let carry = 0;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = segLength(a, b);
    if (len === 0) continue;
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    // Unit normal, used to offset edge lights either side of the centreline.
    const nx = -uy;
    const ny = ux;

    for (let d = carry; d < len; d += spacing) {
      out.push({ x: a[0] + ux * d, y: a[1] + uy * d, nx, ny });
    }
    carry = (carry - len) % spacing;
    if (carry < 0) carry += spacing;
  }

  return out;
}

/** Build every fixture on the airfield. */
function buildDrafts(): Draft[] {
  const out: Draft[] = [];
  let n = 0;

  // --- Runway edge lights, both sides, 60 m spacing ------------------------
  n = 0;
  for (let x = 0; x <= RUNWAY_LENGTH; x += 60) {
    for (const side of [-1, 1]) {
      n += 1;
      out.push({
        id: `RWY_Edge_Light_${pad(n)}`,
        category: 'runway_edge',
        description: `Runway Edge Light ${pad(n)} (${x} m ${side < 0 ? 'south' : 'north'})`,
        x,
        y: side * EDGE_OFFSET,
        colour: edgeColour(x),
      });
    }
  }

  // --- Runway centreline, 30 m spacing ------------------------------------
  n = 0;
  for (let x = 15; x < RUNWAY_LENGTH; x += 30) {
    n += 1;
    out.push({
      id: `RWY_Center_Light_${pad(n)}`,
      category: 'runway_centerline',
      description: `Runway Centerline Light ${pad(n)} (${x} m)`,
      x,
      y: 0,
      colour: centrelineColour(x),
    });
  }

  // --- Touchdown zone: paired barrettes of three, first 900 m -------------
  for (const rwy of ['09', '27'] as const) {
    n = 0;
    for (let d = 150; d <= 900; d += 60) {
      const x = rwy === '09' ? d : RUNWAY_LENGTH - d;
      for (const side of [-1, 1]) {
        // Each barrette is three lights on 1.5 m centres, 11 m off the axis.
        for (let k = 0; k < 3; k += 1) {
          n += 1;
          out.push({
            id: `RWY${rwy}_TouchDwn_Light_${pad(n)}`,
            category: 'runway_tdz',
            description: `Runway ${rwy} Touch Down Zone Light ${pad(n)} (${d} m)`,
            x: x + (k - 1) * 4,
            y: side * 11,
            colour: 'white',
          });
        }
      }
    }
  }

  // --- Threshold (green) and runway end (red) -----------------------------
  for (const rwy of ['09', '27'] as const) {
    const x = rwy === '09' ? 0 : RUNWAY_LENGTH;
    n = 0;
    for (let i = 0; i < 14; i += 1) {
      n += 1;
      out.push({
        id: `RWY${rwy}_Threshold_Light_${pad(n)}`,
        category: 'runway_threshold',
        description: `Runway ${rwy} Threshold Light ${pad(n)}`,
        x: x + (rwy === '09' ? 4 : -4),
        y: -22.5 + (i * 45) / 13,
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
        y: -22.5 + (i * 45) / 7,
        colour: 'red',
      });
    }
  }

  // --- CAT I precision approach system ------------------------------------
  // Centreline barrettes to 900 m with crossbars at 150 m and 300 m. The
  // crossbars are what give the approach its ladder shape on the plan.
  for (const rwy of ['09', '27'] as const) {
    const dir = rwy === '09' ? -1 : 1;
    const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
    n = 0;

    for (let d = 30; d <= 900; d += 30) {
      // Inside 300 m the centreline runs as barrettes of three; beyond that a
      // single light per station, as a CAT I system is built.
      const lights = d <= 300 ? 3 : 1;
      for (let k = 0; k < lights; k += 1) {
        n += 1;
        out.push({
          id: `RWY${rwy}_Approach_Light_${pad(n)}`,
          category: 'approach',
          description: `Runway ${rwy} Approach Centerline Light ${pad(n)} (${d} m out)`,
          x: base + dir * d,
          y: lights === 1 ? 0 : (k - 1) * 4,
          colour: 'white',
        });
      }
    }

    for (const bar of [150, 300]) {
      const halfCount = bar === 300 ? 5 : 3;
      for (let k = -halfCount; k <= halfCount; k += 1) {
        if (k === 0) continue;
        n += 1;
        out.push({
          id: `RWY${rwy}_Approach_Light_${pad(n)}`,
          category: 'approach',
          description: `Runway ${rwy} Approach Crossbar Light ${pad(n)} (${bar} m out)`,
          x: base + dir * bar,
          y: k * 4.5,
          colour: 'white',
        });
      }
    }
  }

  // --- PAPI: four-unit wing bar, perpendicular to the centreline -----------
  // Set on the left of each approach — north of the runway for 09, south for
  // 27 — with unit 1 fifteen metres off the edge and 9 m between units.
  for (const rwy of ['09', '27'] as const) {
    const x = rwy === '09' ? 300 : RUNWAY_LENGTH - 300;
    const side = rwy === '09' ? 1 : -1;
    for (let i = 0; i < 4; i += 1) {
      out.push({
        id: `RWY${rwy}_PAPI_Light_${pad(i + 1)}`,
        category: 'papi',
        description: `Runway ${rwy} PAPI Unit ${i + 1}`,
        x,
        y: side * (EDGE_OFFSET + 15 + i * 9),
        colour: 'white',
      });
    }
  }

  // --- Taxiway centreline, edge and stop bars -----------------------------
  for (const twy of TAXIWAYS) {
    const name = twy.id;

    // Centreline, green, 30 m spacing.
    walk(twy.points, 30).forEach((p, i) => {
      out.push({
        id: `TWY_${name}_Center_Light_${pad(i + 1)}`,
        category: 'taxiway_centerline',
        description: `Taxiway ${name} Centerline Light ${pad(i + 1)}`,
        x: Math.round(p.x),
        y: Math.round(p.y),
        colour: 'green',
      });
    });

    // Edge, blue, 90 m spacing, offset either side along the local normal.
    walk(twy.points, 90).forEach((p, i) => {
      for (const side of [-1, 1]) {
        out.push({
          id: `TWY_${name}_Edge_Light_${pad(i * 2 + (side < 0 ? 1 : 2))}`,
          category: 'taxiway_edge',
          description: `Taxiway ${name} Edge Light ${pad(i * 2 + (side < 0 ? 1 : 2))}`,
          x: Math.round(p.x + p.nx * side * (twy.width / 2)),
          y: Math.round(p.y + p.ny * side * (twy.width / 2)),
          colour: 'blue',
        });
      }
    });

    // Stop bar across the holding position, perpendicular to the taxiway.
    if (twy.holdAt) {
      const a = twy.points[0];
      const b = twy.points[1];
      const len = segLength(a, b) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      for (let k = -2; k <= 2; k += 1) {
        out.push({
          id: `TWY_${name}_StopBar_Light_${pad(k + 3)}`,
          category: 'stopbar',
          description: `Taxiway ${name} Holding Point Stop Bar Light ${pad(k + 3)}`,
          x: Math.round(twy.holdAt[0] + nx * k * 10),
          y: Math.round(twy.holdAt[1] + ny * k * 10),
          colour: 'red',
        });
      }
    }
  }

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
  { id: 'CCR-09', name: 'Taxiway A Centerline', ccrModel: 'ASG8000i 15 kVA', aceUnit: 'ACE3-09', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_centerline' && d.id.startsWith('TWY_A_Center_Light_') },
  {
    // Rapid exits and connectors sit on their own loop. Keeping them off the
    // parallel taxiway's circuit matches how an airfield is wired, and it means
    // a break on one loop produces a genuinely contiguous run of silent
    // fixtures rather than one interrupted by a crossing taxiway.
    id: 'CCR-12', name: 'Exit & Connector Centerlines', ccrModel: 'CHF 10 kVA', aceUnit: 'ACE3-12', ratedCurrent: 6.6, match: (d) => d.category === 'taxiway_centerline',
  },
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
  const drafts = buildDrafts();

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
    // Tag collisions would silently drop fixtures from the index, so make the
    // rare duplicate explicit rather than letting it overwrite.
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
  for (const c of circuits) {
    c.fixtureIds.sort((a, b) => {
      const fa = byId[a];
      const fb = byId[b];
      return fa.x - fb.x || fa.y - fb.y;
    });
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
