/**
 * CCTV coverage, per room.
 *
 * The AOCC watches 2,800 cameras across the 185,800 m² of terminal and the
 * perimeter, and on an alarm the BMS slews the nearest PTZ heads onto the
 * triggered coordinate — so the useful question from a BMS screen is never
 * "show me the camera list", it is "what can see this room right now".
 * `camerasForRoom` answers that, ranked by distance, alert coverage first.
 *
 * `streamUrl` is the seam for a real feed. Left unset, the tile renders a
 * simulated view rather than pretending to be live.
 */

import { LEVEL_ROOMS, roomCentrePct, type LevelKey } from './terminalPlan';

export interface TerminalCamera {
  id: string;
  location: string;
  level: LevelKey;
  /** Rooms this camera has a view of, nearest first. */
  covers: string[];
  ptz: boolean;
  status: 'online' | 'offline';
  /** Straight-line distance to the room it is being listed against. */
  distanceM: number;
  /** True when this camera has been slewed onto an active alert. */
  coversAlert?: boolean;
  /** Set to render a real feed instead of the simulated one. */
  streamUrl?: string;
}

/** Hand-placed cameras for the rooms the demo actually opens, plus a
 *  generated set so every room has some coverage rather than an empty panel. */
const NAMED: TerminalCamera[] = [
  { id: 'CAM-1F-214', location: 'Domestic check-in — row 12 overview', level: '1F', covers: ['f1-checkin-dom'], ptz: true, status: 'online', distanceM: 8, coversAlert: true },
  { id: 'CAM-1F-215', location: 'Domestic check-in — AHU riser', level: '1F', covers: ['f1-checkin-dom'], ptz: true, status: 'online', distanceM: 14, coversAlert: true },
  { id: 'CAM-1F-218', location: 'Domestic check-in — east entrance', level: '1F', covers: ['f1-checkin-dom', 'f1-transit'], ptz: false, status: 'online', distanceM: 22 },
  { id: 'CAM-1F-221', location: 'Transit counters', level: '1F', covers: ['f1-transit', 'f1-checkin-dom'], ptz: false, status: 'online', distanceM: 31 },
  { id: 'CAM-1F-230', location: 'Domestic security screening lanes', level: '1F', covers: ['f1-sse-dom'], ptz: true, status: 'online', distanceM: 12 },
  { id: 'CAM-1F-244', location: 'Departure immigration hall', level: '1F', covers: ['f1-immig-dep'], ptz: true, status: 'online', distanceM: 10 },
  { id: 'CAM-1F-251', location: 'International check-in — west aisle', level: '1F', covers: ['f1-checkin-intl'], ptz: false, status: 'online', distanceM: 16 },
  { id: 'CAM-1F-252', location: 'International check-in — east aisle', level: '1F', covers: ['f1-checkin-intl'], ptz: false, status: 'offline', distanceM: 19 },

  { id: 'CAM-PIT-06', location: 'Chiller hall CRB-3', level: 'PIT', covers: ['pit-crb3', 'pit-crb2'], ptz: false, status: 'online', distanceM: 6 },
  { id: 'CAM-PIT-07', location: 'Chiller hall — CHW pump gallery', level: 'PIT', covers: ['pit-chw', 'pit-crb3'], ptz: false, status: 'online', distanceM: 18 },
  { id: 'CAM-PIT-11', location: 'Main Power House 1', level: 'PIT', covers: ['pit-mph1', 'pit-sub-t1'], ptz: true, status: 'online', distanceM: 9 },
  { id: 'CAM-PIT-12', location: 'Substation T1 — AFL feeders', level: 'PIT', covers: ['pit-sub-t1', 'pit-mph1'], ptz: true, status: 'online', distanceM: 11 },
  { id: 'CAM-PIT-19', location: 'BHS sorting hall — international', level: 'PIT', covers: ['pit-bhs-intl', 'pit-hbs-intl'], ptz: true, status: 'online', distanceM: 15 },
  { id: 'CAM-PIT-24', location: 'BMS data centre — cold aisle', level: 'PIT', covers: ['pit-dc', 'pit-comms'], ptz: false, status: 'online', distanceM: 7 },

  { id: 'CAM-2F-431', location: 'International concourse — centre', level: '2F', covers: ['f2-conc-intl'], ptz: true, status: 'online', distanceM: 9 },
  { id: 'CAM-2F-433', location: 'International concourse — duty free', level: '2F', covers: ['f2-conc-intl', 'f2-dutyfree'], ptz: false, status: 'online', distanceM: 20 },
  { id: 'CAM-2F-440', location: 'Food court — kitchen extract line', level: '2F', covers: ['f2-foodcourt'], ptz: false, status: 'online', distanceM: 13 },
  { id: 'CAM-2F-455', location: 'Gate lounge A1–A2', level: '2F', covers: ['f2-gate-a1'], ptz: true, status: 'online', distanceM: 11 },

  { id: 'CAM-3F-502', location: 'AOCC operations floor', level: '3F', covers: ['f3-aocc', 'f3-secctrl'], ptz: false, status: 'online', distanceM: 5 },
  { id: 'CAM-3F-506', location: 'Security control room', level: '3F', covers: ['f3-secctrl'], ptz: false, status: 'online', distanceM: 6 },

  { id: 'CAM-4F-611', location: 'AHU plant room north 1', level: '4F', covers: ['f4-ahu-n1'], ptz: false, status: 'online', distanceM: 8 },
  { id: 'CAM-4F-620', location: 'Cooling tower deck', level: '4F', covers: ['f4-cooling-tower'], ptz: true, status: 'online', distanceM: 17 },
  { id: 'CAM-4F-628', location: 'Solar PV array — string 4', level: '4F', covers: ['f4-solar', 'f4-inverter'], ptz: true, status: 'online', distanceM: 24 },
];

/** Every room gets at least two cameras, so the panel is never empty. The
 *  generated ones are numbered from the room's position on its level. */
function generatedFor(roomId: string, level: LevelKey): TerminalCamera[] {
  const idx = LEVEL_ROOMS[level].findIndex((r) => r.id === roomId);
  if (idx < 0) return [];
  const base = 700 + idx * 3;
  const room = LEVEL_ROOMS[level][idx];
  return [
    { id: `CAM-${level}-${base}`, location: `${room.name} — overview`, level, covers: [roomId], ptz: idx % 3 === 0, status: 'online', distanceM: 7 + (idx % 5) * 3 },
    { id: `CAM-${level}-${base + 1}`, location: `${room.name} — secondary`, level, covers: [roomId], ptz: false, status: idx % 7 === 6 ? 'offline' : 'online', distanceM: 18 + (idx % 4) * 4 },
  ];
}

export const CAMERAS = NAMED;

/** Cameras with a view of a room, alert coverage first, then by distance. */
export function camerasForRoom(roomId: string, level: LevelKey): TerminalCamera[] {
  const named = NAMED.filter((c) => c.covers.includes(roomId));
  const list = named.length >= 2 ? named : [...named, ...generatedFor(roomId, level)];
  return list
    .slice()
    .sort((a, b) => Number(!!b.coversAlert) - Number(!!a.coversAlert) || a.distanceM - b.distanceM);
}

/** Total fleet size, as quoted in the research — shown on the security panel. */
export const CCTV_FLEET_SIZE = 2800;

/** Cameras on a level, for the plan's camera layer. */
export function camerasOnLevel(level: LevelKey): { camera: TerminalCamera; xPct: number; yPct: number }[] {
  return NAMED.filter((c) => c.level === level).flatMap((camera) => {
    const room = LEVEL_ROOMS[level].find((r) => r.id === camera.covers[0]);
    if (!room) return [];
    const c = roomCentrePct(room);
    // Offset a little so a camera pin never sits exactly under a zone marker.
    return [{ camera, xPct: c.xPct + 2.4, yPct: c.yPct - 2.6 }];
  });
}
