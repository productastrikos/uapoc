/**
 * Terminal building management — asset model.
 *
 * The AHU fleet is ported from the Long Thanh LBMS build: the same 209 units
 * across four floors, the same deterministic generator, and the same restricted
 * parameter set (Run/Stop, Manual, Trip, RA/SA Temp, FAN RPM, FAN, VSD-RPM, RA
 * Pressure, Cooling Coil Valve %, Duct Smoke, Pre-Filter, Bag-Filter). Keeping
 * the field list identical matters — it is the agreed LBMS scope, and it is the
 * faceplate template the rest of this platform now follows.
 *
 * Around the AHUs sit the other device classes that appear on a building
 * schematic — VAV, CAV, FCU and exhaust fans — so the floor plan reads like the
 * plant it represents rather than an AHU-only view.
 */

export type Floor = 'GF' | '1F' | '2F' | '3F';

export const FLOOR_ORDER: Floor[] = ['GF', '1F', '2F', '3F'];

export const FLOOR_LABELS: Record<Floor, string> = {
  GF: 'Ground Floor',
  '1F': 'First Floor',
  '2F': 'Second Floor',
  '3F': 'Third Floor',
};

/**
 * Working/fault counts per floor — 209 AHUs, deliberately with a single unit in
 * fault, so the whole console tells one consistent story around one real
 * problem rather than a scatter of unrelated red.
 */
export const AHU_FLOOR_COUNTS: Record<Floor, { working: number; fault: number }> = {
  GF: { working: 109, fault: 0 },
  '1F': { working: 42, fault: 1 },
  '2F': { working: 26, fault: 0 },
  '3F': { working: 31, fault: 0 },
};

export interface AhuAsset {
  id: string;
  floor: Floor;
  seq: number;
  status: 'Working' | 'Fault';
  runStop: boolean;
  manual: boolean;
  trip: boolean;
  /** Return air temperature, °C. */
  raTemp: number;
  /** Supply air temperature, °C. */
  saTemp: number;
  fanRpm: number;
  fanOn: boolean;
  vsdRpmPct: number;
  raPressurePct: number;
  coolingValvePct: number;
  ductSmokeOk: boolean;
  preFilterOk: boolean;
  bagFilterOk: boolean;
}

/**
 * Small deterministic LCG so the fleet is stable across renders and reloads —
 * a unit's readings must not jump every time the grid re-renders.
 */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildFloorAhus(floor: Floor): AhuAsset[] {
  const { working, fault } = AHU_FLOOR_COUNTS[floor];
  const total = working + fault;
  const rng = makeRng(
    total * 7919 + floor.charCodeAt(0) * 97 + floor.charCodeAt(floor.length - 1)
  );

  // Deterministic shuffle so faults are scattered through the id range rather
  // than clustered at the start.
  const statuses: ('Working' | 'Fault')[] = Array.from({ length: total }, (_, i) =>
    i < fault ? 'Fault' : 'Working'
  );
  for (let i = statuses.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  return statuses.map((status, i) => {
    const seq = i + 1;
    const id = `AHU-${300 + seq}-${floor}-EXT1`;

    if (status === 'Fault') {
      return {
        id,
        floor,
        seq,
        status,
        runStop: false,
        manual: true,
        trip: true,
        raTemp: Math.round((26 + rng() * 4) * 10) / 10,
        saTemp: Math.round((18 + rng() * 5) * 10) / 10,
        fanRpm: 0,
        fanOn: false,
        vsdRpmPct: 0,
        raPressurePct: Math.round(80 + rng() * 18),
        coolingValvePct: Math.round(70 + rng() * 25),
        ductSmokeOk: rng() > 0.65,
        preFilterOk: rng() > 0.5,
        bagFilterOk: rng() > 0.6,
      };
    }

    return {
      id,
      floor,
      seq,
      status,
      runStop: true,
      manual: rng() > 0.7,
      trip: false,
      raTemp: Math.round((21 + rng() * 2) * 10) / 10,
      saTemp: Math.round((14 + rng() * 2) * 10) / 10,
      fanRpm: Math.round(1000 + rng() * 800),
      fanOn: true,
      vsdRpmPct: Math.round(35 + rng() * 35),
      raPressurePct: Math.round(20 + rng() * 40),
      coolingValvePct: Math.round(15 + rng() * 40),
      ductSmokeOk: true,
      preFilterOk: true,
      bagFilterOk: true,
    };
  });
}

export const ALL_AHUS: AhuAsset[] = FLOOR_ORDER.flatMap(buildFloorAhus);
export const AHU_TOTAL = ALL_AHUS.length;
export const AHU_FAULTS = ALL_AHUS.filter((a) => a.status === 'Fault').length;

/** Fault units first, then by floor, then by sequence. */
export function sortAhus(assets: AhuAsset[]): AhuAsset[] {
  const rank: Record<string, number> = { GF: 0, '1F': 1, '2F': 2, '3F': 3 };
  return [...assets].sort((a, b) => {
    const s = (a.status === 'Fault' ? 0 : 1) - (b.status === 'Fault' ? 0 : 1);
    if (s !== 0) return s;
    const f = (rank[a.floor] ?? 9) - (rank[b.floor] ?? 9);
    if (f !== 0) return f;
    return a.seq - b.seq;
  });
}

// ---------------------------------------------------------------------------
// Floor plan devices
// ---------------------------------------------------------------------------

export type DeviceKind = 'AHU' | 'VAV' | 'CAV' | 'FCU' | 'EF' | 'PACU';

export type DeviceStatus = 'normal' | 'alarm' | 'offline';

export interface PlanDevice {
  id: string;
  kind: DeviceKind;
  /** Position on the floor plan as a percentage of the plan extent. */
  x: number;
  y: number;
  status: DeviceStatus;
  /** Reading shown beside the device on the plan. */
  value?: string;
  /** AHU units link back to the fleet so the plan and the grid agree. */
  ahuId?: string;
}

/** Rooms drawn on the schematic, as percentages of the plan extent. */
export interface PlanRoom {
  id: string;
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PLAN_ROOMS: PlanRoom[] = [
  { id: 'plant-10', label: 'PLANT ROOM 10', x: 24, y: 6, w: 18, h: 22 },
  { id: 'control', label: 'CONTROL ROOM', x: 58, y: 10, w: 17, h: 20 },
  { id: 'conference', label: 'CONFERENCE', x: 26, y: 44, w: 15, h: 18 },
  { id: 'plant-2', label: 'PLANT ROOM', x: 54, y: 60, w: 16, h: 20 },
  { id: 'r01', x: 10, y: 32, w: 12, h: 12 },
  { id: 'r03', x: 10, y: 46, w: 12, h: 12 },
  { id: 'r05', x: 10, y: 60, w: 12, h: 12 },
  { id: 'r07', x: 10, y: 74, w: 12, h: 12 },
  { id: 'r11', x: 44, y: 6, w: 11, h: 11 },
  { id: 'r13', x: 44, y: 19, w: 11, h: 11 },
  { id: 'r26', x: 44, y: 32, w: 11, h: 11 },
  { id: 'r29', x: 58, y: 32, w: 8, h: 11 },
  { id: 'r33', x: 72, y: 44, w: 10, h: 12 },
  { id: 'r37', x: 78, y: 10, w: 9, h: 9 },
  { id: 'r39', x: 78, y: 21, w: 9, h: 9 },
  { id: 'r43', x: 78, y: 32, w: 9, h: 9 },
];

/** Corridor spine, drawn as a band across the plan. */
export const PLAN_CORRIDOR = { x: 8, y: 88, w: 80, h: 6, label: '24 Corridor' };

/**
 * Devices on the Building 1 schematic.
 *
 * The first six AHU positions are bound to real units from the fleet so that
 * clicking one on the plan opens the same faceplate the AHU grid opens, and the
 * fault on 1F shows up in both places.
 */
export function buildPlanDevices(floor: Floor): PlanDevice[] {
  const floorAhus = ALL_AHUS.filter((a) => a.floor === floor);
  // Put the faulted unit first so it always lands on the plan.
  const ordered = sortAhus(floorAhus);

  const ahuSpots = [
    { x: 6, y: 14 },
    { x: 6, y: 52 },
    { x: 90, y: 22 },
    { x: 90, y: 40 },
    { x: 90, y: 58 },
    { x: 46, y: 78 },
  ];

  const devices: PlanDevice[] = ahuSpots.map((p, i) => {
    const ahu = ordered[i];
    return {
      id: ahu ? ahu.id : `AHU-SPARE-${i}`,
      kind: 'AHU',
      x: p.x,
      y: p.y,
      status: ahu?.status === 'Fault' ? 'alarm' : 'normal',
      value: ahu ? `${ahu.saTemp.toFixed(1)} °C` : undefined,
      ahuId: ahu?.id,
    };
  });

  const seed = makeRng(floor.charCodeAt(0) * 131 + 17);
  const push = (kind: DeviceKind, spots: { x: number; y: number }[], unit: string) => {
    spots.forEach((p, i) => {
      const alarm = seed() > 0.86;
      devices.push({
        id: `BLD1_${kind}${String(i + 1).padStart(3, '0')}`,
        kind,
        x: p.x,
        y: p.y,
        status: alarm ? 'alarm' : 'normal',
        value: `${Math.round(20 + seed() * 60)}${unit}`,
      });
    });
  };

  push('VAV', [
    { x: 20, y: 4 }, { x: 40, y: 4 }, { x: 62, y: 4 },
    { x: 16, y: 68 }, { x: 34, y: 92 }, { x: 70, y: 68 }, { x: 70, y: 76 },
  ], '%');

  push('CAV', [
    { x: 16, y: 26 }, { x: 36, y: 26 }, { x: 68, y: 22 },
    { x: 40, y: 60 }, { x: 62, y: 92 }, { x: 82, y: 68 },
  ], '%');

  push('FCU', [{ x: 6, y: 30 }, { x: 6, y: 66 }], '%');
  push('EF', [{ x: 8, y: 96 }, { x: 84, y: 96 }], '%');
  push('PACU', [{ x: 33, y: 2 }], '%');

  return devices;
}

export const DEVICE_KINDS: DeviceKind[] = ['AHU', 'VAV', 'CAV', 'FCU', 'EF', 'PACU'];
