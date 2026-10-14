// ─────────────────────────────────────────────────────────────────────────────
// lbmsAssets — the deterministic AHU asset register.
import { LEVEL_ORDER, zoneCentresFor, roomForZone, type LevelKey } from './terminalPlan';
// AHU asset data model for LBMS — Operator view's paginated card grid and the
// Map view's floor pins share this single generated dataset, so both flows
// always agree on the same 209 units and the same restricted parameter set
// (Run/Stop, Manual, Trip, RA/SA Temp, FAN RPM, FAN, VSD-RPM, RA Pressure,
// Cooling Coil Valve %, Duct Smoke, Pre-Filter, Bag-Filter — see
// public/asset_details_card.png, the spec for this exact field list).
// ─────────────────────────────────────────────────────────────────────────────

export type AHUFloor = 'GF' | '1F' | '2F' | '3F';

/** Working/Fault/Total AHU counts per floor — 209 AHUs total, deliberately
 *  only ONE in fault (on 1F), so the fleet matches the single real problem
 *  the rest of the app already tells one consistent story around: the
 *  Dashboard's one AHU alert (ALT-004) and the map's Zone 23 drill-down
 *  (isIssueZone in zonesForFloor below) both point at this same unit. Verified
 *  via the same throwaway seeded-RNG script used before: with these exact
 *  counts, `faults[0]` on 1F resolves to AHU-306-1F-EXT1 — the same id
 *  already hardcoded in Dashboard.tsx's SAMPLE_ALERTS and the zone marker
 *  narrative, so nothing else needed to change when this was reduced from 13. */
export const AHU_FLOOR_COUNTS: Record<AHUFloor, { working: number; fault: number }> = {
  'GF': { working: 109, fault: 0 },
  '1F': { working: 42,  fault: 1 },
  '2F': { working: 26,  fault: 0 },
  '3F': { working: 31,  fault: 0 },
};

export const AHU_FLOOR_ORDER: AHUFloor[] = ['GF', '1F', '2F', '3F'];
export const AHU_FLOOR_LABELS: Record<AHUFloor, string> = {
  'GF': 'Ground Floor', '1F': 'First Floor', '2F': 'Second Floor', '3F': 'Third Floor',
};

export interface AHUAsset {
  id: string;
  floor: AHUFloor;
  seq: number;
  status: 'Working' | 'Fault';
  runStop: boolean;
  manual: boolean;
  trip: boolean;
  raTemp: number;
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

// Small deterministic LCG so the generated fleet is stable across renders/
// reloads (no Math.random() — a card's values shouldn't jump around every
// time the grid re-renders or the page is revisited).
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildFloorAssets(floor: AHUFloor): AHUAsset[] {
  const { working, fault } = AHU_FLOOR_COUNTS[floor];
  const total = working + fault;
  const rng = makeRng(total * 7919 + floor.charCodeAt(0) * 97 + floor.charCodeAt(floor.length - 1));

  // Deterministic shuffle of exactly `fault` Fault slots among `total` seqs,
  // so faults are scattered through the id range rather than clustered.
  const statuses: ('Working' | 'Fault')[] = Array.from({ length: total }, (_, i) => (i < fault ? 'Fault' : 'Working'));
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  return statuses.map((status, i) => {
    const seq = i + 1;
    const id = `AHU-${300 + seq}-${floor}-EXT1`;
    if (status === 'Fault') {
      return {
        id, floor, seq, status,
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
      id, floor, seq, status,
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

export const ALL_AHU_ASSETS: AHUAsset[] = AHU_FLOOR_ORDER.flatMap(buildFloorAssets);

export const AHU_TOTAL_COUNT = ALL_AHU_ASSETS.length;
export const AHU_FAULT_COUNT = ALL_AHU_ASSETS.filter(a => a.status === 'Fault').length;

/** Fault/inactive units first (mirrors AssetList.tsx's own Inactive→Warning→
 *  Active statusOrder convention), then by floor, then by id. */
export function sortAssetsForDisplay(assets: AHUAsset[]): AHUAsset[] {
  const floorRank: Record<string, number> = { GF: 0, '1F': 1, '2F': 2, '3F': 3 };
  return [...assets].sort((a, b) => {
    const s = (a.status === 'Fault' ? 0 : 1) - (b.status === 'Fault' ? 0 : 1);
    if (s !== 0) return s;
    const f = (floorRank[a.floor] ?? 9) - (floorRank[b.floor] ?? 9);
    if (f !== 0) return f;
    return a.seq - b.seq;
  });
}

/** Zone centres now come from the terminal plan (see terminalPlan.ts), so a
 *  pin lands in the room it actually serves rather than on a numbered cell of
 *  the old zone drawing. Kept as a flat list for the callers that want every
 *  zone the building has, regardless of level. */
export const ZONE_CENTERS: { zone: string; xPct: number; yPct: number }[] = (() => {
  const seen = new Set<string>();
  const out: { zone: string; xPct: number; yPct: number }[] = [];
  for (const level of LEVEL_ORDER) {
    for (const c of zoneCentresFor(level)) {
      if (seen.has(c.zone)) continue;
      seen.add(c.zone);
      out.push(c);
    }
  }
  return out;
})();

export interface ZoneAssetPin extends AHUAsset { xPct: number; yPct: number }

/** A floor→zone→asset hierarchy for the Map view's Floor→Zone→Asset click
 *  flow (mirrors the Dashboard's Zone 23 drill-down): the whole floor shows
 *  a handful of zone markers; opening one reveals its 1-2 AHU asset pins.
 *  Zone 23 on 1F is deliberately the ONLY zone flagged as having an issue —
 *  every other zone (any floor) only ever gets Working (healthy) assets, so
 *  the map reads as "one real problem, everything else green" rather than
 *  scattering all 13 fault units across the map. */
export interface FloorZone {
  zoneId: string;
  xPct: number;
  yPct: number;
  hasIssue: boolean;
  /** The plan room this zone sits in — markers name the room, not a number. */
  roomId?: string;
  roomName: string;
  assets: ZoneAssetPin[];
}

export function zonesForFloor(floor: AHUFloor): FloorZone[] {
  const assets = ALL_AHU_ASSETS.filter(a => a.floor === floor);
  if (assets.length === 0) return [];
  const working = assets.filter(a => a.status === 'Working');
  const faults = assets.filter(a => a.status === 'Fault');
  let workingCursor = 0;
  const nextWorking = (): AHUAsset | null => (working.length > 0 ? working[workingCursor++ % working.length] : null);

  // Zones are the rooms this level actually has — so a marker on 4F lands on
  // an AHU plant room, and one on 1F lands on the check-in hall.
  return zoneCentresFor(floor as LevelKey)
    .map((center): FloorZone | null => {
      const zoneId = center.zone;
      const room = roomForZone(floor as LevelKey, zoneId);
      const isIssueZone = floor === '1F' && zoneId === '23' && faults.length > 0;
      const pins: ZoneAssetPin[] = [];
      if (isIssueZone) {
        pins.push({ ...faults[0], xPct: center.xPct - 1.6, yPct: center.yPct - 1.4 });
        const w = nextWorking();
        if (w) pins.push({ ...w, xPct: center.xPct + 1.6, yPct: center.yPct + 1.4 });
      } else {
        const w1 = nextWorking();
        if (w1) pins.push({ ...w1, xPct: center.xPct - 1.4, yPct: center.yPct - 1.1 });
        const w2 = nextWorking();
        if (w2) pins.push({ ...w2, xPct: center.xPct + 1.4, yPct: center.yPct + 1.1 });
      }
      return {
        zoneId,
        xPct: center.xPct,
        yPct: center.yPct,
        hasIssue: isIssueZone,
        roomId: room?.id,
        roomName: room?.name ?? `Zone ${zoneId}`,
        assets: pins,
      };
    })
    .filter((z): z is FloorZone => z !== null && z.assets.length > 0);
}
