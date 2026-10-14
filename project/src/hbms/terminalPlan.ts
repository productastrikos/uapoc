/**
 * I Gusti Ngurah Rai International Airport (DPS) — terminal plan model.
 *
 * This replaces the single `zone_map_all_floor.jpg` the port inherited, which
 * was one undifferentiated zone drawing reused for all six levels. What a BMS
 * operator actually needs is the room they are looking at: which plant room
 * holds the chiller, which hall the AHU serves, which level the fault is on.
 * So the plan is data, not a picture — every level carries its own room
 * schedule and the renderer draws it.
 *
 * Everything here is sourced from `research documents/Bali Airport BMS
 * Research.md`, which is cited inline against each figure:
 *
 *   Domestic terminal      65,800 m²  · 62 check-in, 4 transit, 8 boarding
 *                                       gates, 7 arrival gates, 8 aerobridges,
 *                                       5 baggage belts
 *   International terminal 120,000 m² · 96 check-in, 11 aerobridges,
 *                                       26 immigration, 20 visa-on-arrival
 *   Terminal total        185,800 m²
 *   Apron                 381,862 m²  · 53 north stands, 11 south stands
 *   Runway 09-27          3,000 × 45 m
 *   Levels                PIT · GF · 1F · 2F · 3F · 4F
 *   Mechanical            209 AHU, 1,366 FCU, 3 chiller sets (2 active),
 *                         chiller plant CRB-3 linked to the aviobridge zones
 *   Electrical            Main Power House 1 (3,465 kVA), Substation T1
 *                         (AFL load 94.33 kVA), UPS arrays, 155 kWp solar PV
 *   Hydrology             STP 150 m³/day, hydraulic + booster pumps
 *   Life safety           FM200 in AOCC server rooms, substations, data centre
 *   Security              2,800 CCTV cameras
 *
 * Geometry is schematic but faithful to the real arrangement: one linear
 * terminal complex with the domestic terminal west, the international terminal
 * east (roughly twice the footprint), aerobridge fingers reaching north onto
 * the apron, and the landside kerb and forecourt to the south — the layout you
 * see on the map, turned so airside is up.
 *
 * Plan space is 1000 × 560 units; every consumer works in those coordinates or
 * in percentages of them.
 */

export const PLAN_W = 1000;
export const PLAN_H = 560;

export type LevelKey = 'PIT' | 'GF' | '1F' | '2F' | '3F' | '4F';

export const LEVEL_ORDER: LevelKey[] = ['PIT', 'GF', '1F', '2F', '3F', '4F'];

export const LEVEL_LABELS: Record<LevelKey, string> = {
  PIT: 'PIT Floor',
  GF: 'Ground Floor',
  '1F': 'First Floor',
  '2F': 'Second Floor',
  '3F': 'Third Floor',
  '4F': 'Fourth Floor',
};

/** What each level is for — shown as the plan's subtitle. */
export const LEVEL_PROGRAMME: Record<LevelKey, string> = {
  PIT: 'Baggage handling, chiller plant, electrical and water services',
  GF: 'Arrivals — baggage reclaim, customs, ground transport',
  '1F': 'Departures — check-in, security screening, immigration',
  '2F': 'Departure concourse, gate lounges and aerobridges',
  '3F': 'AOCC, control rooms, airline lounges and administration',
  '4F': 'Mechanical plant, AHU rooms, cooling towers and solar PV',
};

/** Room category — drives the fill, and the legend. */
export type RoomCategory =
  | 'circulation'
  | 'checkin'
  | 'security'
  | 'immigration'
  | 'retail'
  | 'lounge'
  | 'baggage'
  | 'plant'
  | 'electrical'
  | 'water'
  | 'fire'
  | 'control'
  | 'office'
  | 'restricted'
  | 'gate'
  | 'landside';

export interface RoomCategoryStyle {
  label: string;
  fill: string;
  stroke: string;
  text: string;
}

/** Dark-mode palette, drawn from the TAMS ramps so the plan sits in the
 *  console rather than next to it. Categories are separated by hue, and the
 *  service categories (plant/electrical/water/fire) share a warm family so
 *  the mechanical side of the building reads as one thing. */
export const ROOM_STYLES: Record<RoomCategory, RoomCategoryStyle> = {
  circulation: { label: 'Circulation',       fill: 'rgba(1,163,164,0.07)',   stroke: 'rgba(1,163,164,0.34)',   text: '#7FCFD0' },
  checkin:     { label: 'Check-in',          fill: 'rgba(34,199,198,0.13)',  stroke: 'rgba(34,199,198,0.46)',  text: '#9BEAE8' },
  security:    { label: 'Security screening',fill: 'rgba(239,68,68,0.11)',   stroke: 'rgba(239,68,68,0.42)',   text: '#FCA5A5' },
  immigration: { label: 'Immigration',       fill: 'rgba(139,92,246,0.13)',  stroke: 'rgba(139,92,246,0.44)',  text: '#C4B5FD' },
  retail:      { label: 'Retail / F&B',      fill: 'rgba(230,184,92,0.13)',  stroke: 'rgba(230,184,92,0.44)',  text: '#F5DCA8' },
  lounge:      { label: 'Lounge',            fill: 'rgba(192,148,41,0.14)',  stroke: 'rgba(192,148,41,0.44)',  text: '#EFCB82' },
  baggage:     { label: 'Baggage handling',  fill: 'rgba(14,85,106,0.34)',   stroke: 'rgba(34,199,198,0.36)',  text: '#8FC9D4' },
  plant:       { label: 'Mechanical plant',  fill: 'rgba(249,115,22,0.12)',  stroke: 'rgba(249,115,22,0.42)',  text: '#FDBA74' },
  electrical:  { label: 'Electrical',        fill: 'rgba(245,158,11,0.13)',  stroke: 'rgba(245,158,11,0.46)',  text: '#FCD34D' },
  water:       { label: 'Water / effluent',  fill: 'rgba(56,189,248,0.11)',  stroke: 'rgba(56,189,248,0.40)',  text: '#7DD3FC' },
  fire:        { label: 'Fire / life safety',fill: 'rgba(220,38,38,0.15)',   stroke: 'rgba(220,38,38,0.50)',   text: '#F87171' },
  control:     { label: 'Control room',      fill: 'rgba(16,185,129,0.14)',  stroke: 'rgba(16,185,129,0.48)',  text: '#6EE7B7' },
  office:      { label: 'Offices',           fill: 'rgba(138,155,168,0.10)', stroke: 'rgba(138,155,168,0.36)', text: '#B8C5D1' },
  restricted:  { label: 'Restricted',        fill: 'rgba(219,39,119,0.11)',  stroke: 'rgba(219,39,119,0.40)',  text: '#F9A8D4' },
  gate:        { label: 'Gate / aerobridge', fill: 'rgba(1,163,164,0.16)',   stroke: 'rgba(1,163,164,0.52)',   text: '#5FDCDA' },
  landside:    { label: 'Landside',          fill: 'rgba(7,16,40,0.55)',     stroke: 'rgba(138,155,168,0.26)', text: '#8A9BA8' },
};

export interface TerminalRoom {
  id: string;
  /** Full name, used in the tooltip and the asset popup. */
  name: string;
  /** Short label drawn inside the room when it is big enough. */
  short: string;
  category: RoomCategory;
  x: number;
  y: number;
  w: number;
  h: number;
  /** BMS zone this room belongs to — the id the AHU pins are grouped under. */
  zone?: string;
  /** Free-text detail: counter counts, capacities, plant ratings. */
  detail?: string;
  /** 'DOM' | 'INTL' | 'CENTRAL' — which terminal the room sits in. */
  wing?: 'DOM' | 'INTL' | 'CENTRAL';
}

// ── Shared shell geometry ────────────────────────────────────────────────────
// Airside (apron) runs across the top, the terminal band across the middle,
// landside across the bottom — the real arrangement, rotated so aircraft are up.

const BUILD_Y = 104;      // terminal north (airside) face
const BUILD_H = 322;      // terminal depth
const BUILD_Y2 = BUILD_Y + BUILD_H;

/** Domestic terminal — 65,800 m², the smaller western half. */
const DOM_X = 44;
const DOM_W = 316;
/** Central link between the two terminals. */
const LINK_X = DOM_X + DOM_W;   // 360
const LINK_W = 84;
/** International terminal — 120,000 m², roughly twice the domestic footprint. */
const INTL_X = LINK_X + LINK_W; // 444
const INTL_W = 512;

export const SHELL = {
  building: { x: DOM_X, y: BUILD_Y, w: DOM_W + LINK_W + INTL_W, h: BUILD_H },
  domestic: { x: DOM_X, y: BUILD_Y, w: DOM_W, h: BUILD_H },
  link: { x: LINK_X, y: BUILD_Y, w: LINK_W, h: BUILD_H },
  international: { x: INTL_X, y: BUILD_Y, w: INTL_W, h: BUILD_H },
  apron: { x: 0, y: 0, w: PLAN_W, h: BUILD_Y },
  landside: { x: 0, y: BUILD_Y2, w: PLAN_W, h: PLAN_H - BUILD_Y2 },
};

/** Aerobridge stands on the airside face: 8 domestic, 11 international. */
export interface Stand {
  id: string;
  x: number;
  wing: 'DOM' | 'INTL';
}

export const STANDS: Stand[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `B${i + 1}`,
    x: DOM_X + 26 + i * ((DOM_W - 52) / 7),
    wing: 'DOM' as const,
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    id: `A${i + 1}`,
    x: INTL_X + 30 + i * ((INTL_W - 60) / 10),
    wing: 'INTL' as const,
  })),
];

// ── Level room schedules ─────────────────────────────────────────────────────
// Rooms are laid out in bands across the terminal depth. Airside band sits
// against BUILD_Y, landside band against BUILD_Y2, with the processing halls
// between — which is how the passenger actually moves through the building.

const r = (
  id: string, name: string, short: string, category: RoomCategory,
  x: number, y: number, w: number, h: number,
  extra: Partial<TerminalRoom> = {},
): TerminalRoom => ({ id, name, short, category, x, y, w, h, ...extra });

/** PIT — baggage handling and the whole services plant. */
const PIT_ROOMS: TerminalRoom[] = [
  // Baggage, against the airside face where the makeup carousels feed the stands
  r('pit-bhs-intl', 'International BHS Sorting Hall', 'BHS SORT — INTL', 'baggage', INTL_X + 8, BUILD_Y + 10, 300, 108, { zone: '41', wing: 'INTL', detail: 'PLC-controlled sorter, HBS levels 1-3' }),
  r('pit-hbs-intl', 'Hold Baggage Screening — International', 'HBS INTL', 'restricted', INTL_X + 316, BUILD_Y + 10, 130, 108, { zone: '42', wing: 'INTL', detail: 'Level 4/5 manual search, EDS array' }),
  r('pit-bhs-dom', 'Domestic BHS Sorting Hall', 'BHS SORT — DOM', 'baggage', DOM_X + 8, BUILD_Y + 10, 194, 108, { zone: '21', wing: 'DOM', detail: '5 baggage conveyor belts' }),
  r('pit-hbs-dom', 'Hold Baggage Screening — Domestic', 'HBS DOM', 'restricted', DOM_X + 208, BUILD_Y + 10, 100, 108, { zone: '22', wing: 'DOM' }),
  r('pit-makeup', 'Baggage Makeup / Tug Dock', 'MAKEUP', 'baggage', LINK_X + 4, BUILD_Y + 10, 76, 108, { zone: '31', wing: 'CENTRAL' }),

  // Service corridor spine
  r('pit-corridor', 'Service Tunnel', 'SERVICE TUNNEL', 'circulation', DOM_X + 8, BUILD_Y + 124, DOM_W + LINK_W + INTL_W - 16, 26, { zone: '13' }),

  // Mechanical plant — chillers, per the district-cooling centralisation
  r('pit-crb1', 'Chiller Plant CRB-1', 'CRB-1', 'plant', DOM_X + 8, BUILD_Y + 158, 96, 92, { zone: '23', wing: 'DOM', detail: 'Primary chiller + CHW pump + condenser pump' }),
  r('pit-crb2', 'Chiller Plant CRB-2', 'CRB-2', 'plant', DOM_X + 110, BUILD_Y + 158, 96, 92, { zone: '24', wing: 'DOM', detail: 'Primary chiller, active set' }),
  r('pit-crb3', 'Chiller Plant CRB-3', 'CRB-3', 'plant', DOM_X + 212, BUILD_Y + 158, 96, 92, { zone: '11', wing: 'DOM', detail: 'Cross-linked to aviobridge zones — cold standby' }),
  r('pit-chw', 'Chilled Water Pump Room', 'CHW PUMPS', 'plant', LINK_X + 4, BUILD_Y + 158, 76, 92, { zone: '12', wing: 'CENTRAL', detail: 'Primary + secondary CHW, motorised transfer valves' }),

  // Electrical
  r('pit-mph1', 'Main Power House 1', 'MPH-1', 'electrical', INTL_X + 8, BUILD_Y + 158, 118, 92, { zone: '43', wing: 'INTL', detail: '3,465 kVA installed · PLN utility feed' }),
  r('pit-sub-t1', 'Substation T1 — AFL', 'SUB T1', 'electrical', INTL_X + 132, BUILD_Y + 158, 92, 92, { zone: '44', wing: 'INTL', detail: 'Airfield lighting load 94.33 kVA' }),
  r('pit-ups', 'UPS Array A / B', 'UPS A/B', 'electrical', INTL_X + 230, BUILD_Y + 158, 84, 92, { zone: '14', wing: 'INTL', detail: 'Bridges generator step-load, min 372 V of 380 V' }),
  r('pit-gen', 'Standby Generator Hall', 'GEN HALL', 'electrical', INTL_X + 320, BUILD_Y + 158, 90, 92, { zone: '15', wing: 'INTL', detail: 'Min 84.2 kW to AFL + UPS recharge' }),

  // Water and fire
  r('pit-stp', 'Sewage Treatment Plant', 'STP', 'water', INTL_X + 416, BUILD_Y + 158, 88, 92, { zone: '32', wing: 'INTL', detail: '150 m³/day extended aeration' }),
  r('pit-pumps', 'Hydraulic & Booster Pump Room', 'PUMPS', 'water', DOM_X + 8, BUILD_Y + 256, 118, 58, { zone: '33', wing: 'DOM', detail: 'Filtration + booster sets, digital metering by floor' }),
  r('pit-tank', 'Potable Water Tanks', 'WATER TANKS', 'water', DOM_X + 132, BUILD_Y + 256, 104, 58, { zone: '34', wing: 'DOM' }),
  r('pit-firepump', 'Fire Pump Room — Electric + Diesel', 'FIRE PUMPS', 'fire', DOM_X + 242, BUILD_Y + 256, 70, 58, { zone: '35', wing: 'DOM', detail: 'Primary electric, secondary diesel' }),
  r('pit-fm200', 'FM200 Cylinder Store', 'FM200 STORE', 'fire', LINK_X + 4, BUILD_Y + 256, 76, 58, { zone: '36', wing: 'CENTRAL', detail: 'Nitrogen actuation lines monitored' }),

  // IT
  r('pit-dc', 'BMS Data Centre', 'BMS DATA CENTRE', 'control', INTL_X + 8, BUILD_Y + 256, 150, 58, { zone: '37', wing: 'INTL', detail: 'CRAH cooled · FM200 protected' }),
  r('pit-comms', 'Comms / Network Room', 'COMMS', 'control', INTL_X + 164, BUILD_Y + 256, 120, 58, { zone: '51', wing: 'INTL', detail: 'Modbus / BACnet / OPC UA head-ends' }),
  r('pit-store', 'Maintenance Workshop & Stores', 'WORKSHOP', 'office', INTL_X + 290, BUILD_Y + 256, 214, 58, { zone: '52', wing: 'INTL' }),
];

/** GF — arrivals. */
const GF_ROOMS: TerminalRoom[] = [
  r('gf-arr-conc-intl', 'International Arrival Concourse', 'ARRIVAL CONCOURSE — INTL', 'circulation', INTL_X + 8, BUILD_Y + 10, 496, 56, { zone: '41', wing: 'INTL' }),
  r('gf-arr-conc-dom', 'Domestic Arrival Concourse', 'ARRIVAL CONCOURSE — DOM', 'circulation', DOM_X + 8, BUILD_Y + 10, 300, 56, { zone: '21', wing: 'DOM', detail: '7 arrival gates' }),
  r('gf-link-hall', 'Inter-terminal Link', 'LINK', 'circulation', LINK_X + 4, BUILD_Y + 10, 76, 302, { zone: '31', wing: 'CENTRAL' }),

  r('gf-immig-arr', 'Arrival Immigration Hall', 'ARRIVAL IMMIGRATION', 'immigration', INTL_X + 8, BUILD_Y + 74, 268, 76, { zone: '42', wing: 'INTL', detail: '26 immigration counters' }),
  r('gf-voa', 'Visa on Arrival Hall', 'VISA ON ARRIVAL', 'immigration', INTL_X + 282, BUILD_Y + 74, 222, 76, { zone: '43', wing: 'INTL', detail: '20 visa-on-arrival counters' }),

  r('gf-reclaim-intl', 'International Baggage Reclaim', 'BAGGAGE RECLAIM — INTL', 'baggage', INTL_X + 8, BUILD_Y + 158, 340, 92, { zone: '44', wing: 'INTL' }),
  r('gf-customs', 'Customs Hall & Quarantine', 'CUSTOMS', 'restricted', INTL_X + 354, BUILD_Y + 158, 150, 92, { zone: '11', wing: 'INTL' }),
  r('gf-reclaim-dom', 'Domestic Baggage Reclaim', 'BAGGAGE RECLAIM — DOM', 'baggage', DOM_X + 8, BUILD_Y + 74, 300, 176, { zone: '22', wing: 'DOM', detail: '5 conveyor belts' }),

  r('gf-meet', 'Meet & Greet Hall', 'MEET & GREET', 'circulation', DOM_X + 8, BUILD_Y + 256, 300, 58, { zone: '23', wing: 'DOM' }),
  r('gf-transport', 'Ground Transport Hall', 'GROUND TRANSPORT', 'circulation', INTL_X + 8, BUILD_Y + 256, 300, 58, { zone: '12', wing: 'INTL' }),
  r('gf-retail-arr', 'Arrivals Retail & F&B', 'RETAIL', 'retail', INTL_X + 314, BUILD_Y + 256, 190, 58, { zone: '13', wing: 'INTL' }),
];

/** 1F — departures, check-in and screening. */
const F1_ROOMS: TerminalRoom[] = [
  r('f1-gate-conc-intl', 'International Departure Corridor', 'DEPARTURE CORRIDOR — INTL', 'circulation', INTL_X + 8, BUILD_Y + 10, 496, 48, { zone: '41', wing: 'INTL' }),
  r('f1-gate-conc-dom', 'Domestic Departure Corridor', 'DEPARTURE CORRIDOR — DOM', 'circulation', DOM_X + 8, BUILD_Y + 10, 300, 48, { zone: '21', wing: 'DOM' }),
  r('f1-link', 'Inter-terminal Link', 'LINK', 'circulation', LINK_X + 4, BUILD_Y + 10, 76, 302, { zone: '31', wing: 'CENTRAL' }),

  r('f1-immig-dep', 'Departure Immigration Hall', 'DEPARTURE IMMIGRATION', 'immigration', INTL_X + 8, BUILD_Y + 66, 268, 72, { zone: '42', wing: 'INTL', detail: '26 counters' }),
  r('f1-sse-intl', 'Security Screening — International', 'SECURITY SCREENING — INTL', 'security', INTL_X + 282, BUILD_Y + 66, 222, 72, { zone: '43', wing: 'INTL', detail: 'SSE lanes, X-ray and ETD' }),
  r('f1-sse-dom', 'Security Screening — Domestic', 'SECURITY SCREENING — DOM', 'security', DOM_X + 8, BUILD_Y + 66, 300, 72, { zone: '22', wing: 'DOM' }),

  r('f1-checkin-intl', 'International Check-in Hall', 'CHECK-IN HALL — INTL  ·  96 COUNTERS', 'checkin', INTL_X + 8, BUILD_Y + 146, 496, 104, { zone: '44', wing: 'INTL', detail: '96 check-in counters' }),
  r('f1-checkin-dom', 'Domestic Check-in Hall', 'CHECK-IN HALL — DOM  ·  62 COUNTERS', 'checkin', DOM_X + 8, BUILD_Y + 146, 236, 104, { zone: '23', wing: 'DOM', detail: '62 check-in counters' }),
  r('f1-transit', 'Transit Counters', 'TRANSIT', 'checkin', DOM_X + 250, BUILD_Y + 146, 58, 104, { zone: '24', wing: 'DOM', detail: '4 transit counters' }),

  r('f1-departure-hall', 'Departure Forecourt Hall', 'DEPARTURE HALL', 'circulation', DOM_X + 8, BUILD_Y + 258, 300, 56, { zone: '11', wing: 'DOM' }),
  r('f1-retail-dep', 'Landside Retail & F&B', 'RETAIL', 'retail', INTL_X + 8, BUILD_Y + 258, 260, 56, { zone: '12', wing: 'INTL' }),
  r('f1-airline-ops', 'Airline Ticketing & Ops', 'AIRLINE OPS', 'office', INTL_X + 274, BUILD_Y + 258, 230, 56, { zone: '13', wing: 'INTL' }),
];

/** 2F — concourse and gate lounges. */
const F2_ROOMS: TerminalRoom[] = [
  ...Array.from({ length: 6 }, (_, i) =>
    r(`f2-gate-a${i + 1}`, `International Gate Lounge A${i * 2 + 1}/A${i * 2 + 2}`, `A${i * 2 + 1}–A${i * 2 + 2}`, 'gate',
      INTL_X + 8 + i * 84, BUILD_Y + 10, 78, 76, { zone: ['41', '42', '43', '44', '11', '12'][i], wing: 'INTL' }),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    r(`f2-gate-b${i + 1}`, `Domestic Gate Lounge B${i * 2 + 1}/B${i * 2 + 2}`, `B${i * 2 + 1}–B${i * 2 + 2}`, 'gate',
      DOM_X + 8 + i * 76, BUILD_Y + 10, 70, 76, { zone: ['21', '22', '23', '24'][i], wing: 'DOM' }),
  ),
  r('f2-link', 'Inter-terminal Link', 'LINK', 'circulation', LINK_X + 4, BUILD_Y + 10, 76, 302, { zone: '31', wing: 'CENTRAL' }),

  r('f2-conc-intl', 'International Departure Concourse', 'DEPARTURE CONCOURSE — INTL', 'circulation', INTL_X + 8, BUILD_Y + 94, 496, 56, { zone: '13', wing: 'INTL' }),
  r('f2-conc-dom', 'Domestic Departure Concourse', 'DEPARTURE CONCOURSE — DOM', 'circulation', DOM_X + 8, BUILD_Y + 94, 300, 56, { zone: '14', wing: 'DOM' }),

  r('f2-dutyfree', 'Duty Free Mall', 'DUTY FREE', 'retail', INTL_X + 8, BUILD_Y + 158, 300, 92, { zone: '15', wing: 'INTL' }),
  r('f2-foodcourt', 'Food Court', 'FOOD COURT', 'retail', INTL_X + 314, BUILD_Y + 158, 190, 92, { zone: '32', wing: 'INTL', detail: 'KEF extraction interlocked with MAU make-up air' }),
  r('f2-retail-dom', 'Domestic Retail & F&B', 'RETAIL — DOM', 'retail', DOM_X + 8, BUILD_Y + 158, 300, 92, { zone: '33', wing: 'DOM' }),

  r('f2-prayer', 'Prayer Rooms', 'PRAYER', 'circulation', DOM_X + 8, BUILD_Y + 258, 96, 56, { zone: '34', wing: 'DOM' }),
  r('f2-smoking', 'Smoking Lounges', 'SMOKING', 'circulation', DOM_X + 110, BUILD_Y + 258, 96, 56, { zone: '35', wing: 'DOM' }),
  r('f2-bus-gate', 'Remote Stand Bus Gates', 'BUS GATES', 'gate', DOM_X + 212, BUILD_Y + 258, 96, 56, { zone: '36', wing: 'DOM' }),
  r('f2-toilets', 'Washrooms & Baby Care', 'WASHROOMS', 'circulation', INTL_X + 8, BUILD_Y + 258, 190, 56, { zone: '37', wing: 'INTL' }),
  r('f2-cip', 'CIP / VIP Lounge', 'CIP LOUNGE', 'lounge', INTL_X + 204, BUILD_Y + 258, 300, 56, { zone: '51', wing: 'INTL' }),
];

/** 3F — control, lounges and administration. */
const F3_ROOMS: TerminalRoom[] = [
  r('f3-aocc', 'Airport Operational Control Centre', 'AOCC', 'control', INTL_X + 8, BUILD_Y + 10, 210, 108, { zone: '41', wing: 'INTL', detail: 'A-CDM floor — airlines, ground handlers, AVSEC' }),
  r('f3-secctrl', 'Security Control Room', 'SECURITY CONTROL', 'control', INTL_X + 224, BUILD_Y + 10, 160, 108, { zone: '42', wing: 'INTL', detail: '2,800 CCTV cameras · PTZ auto-slew on alarm' }),
  r('f3-bms', 'BMS Control Room', 'BMS CONTROL', 'control', INTL_X + 390, BUILD_Y + 10, 114, 108, { zone: '43', wing: 'INTL', detail: 'EnMS / ISO 50001 operational interface' }),
  r('f3-server', 'AOCC Server Room', 'SERVER ROOM', 'fire', DOM_X + 8, BUILD_Y + 10, 140, 108, { zone: '21', wing: 'DOM', detail: 'FM200 clean agent · CRAH cooled' }),
  r('f3-ups3', 'IT UPS & Distribution', 'IT UPS', 'electrical', DOM_X + 154, BUILD_Y + 10, 154, 108, { zone: '22', wing: 'DOM' }),
  r('f3-link', 'Inter-terminal Link', 'LINK', 'circulation', LINK_X + 4, BUILD_Y + 10, 76, 302, { zone: '31', wing: 'CENTRAL' }),

  r('f3-lounge-intl', 'International Airline Lounges', 'AIRLINE LOUNGES', 'lounge', INTL_X + 8, BUILD_Y + 126, 300, 92, { zone: '44', wing: 'INTL' }),
  r('f3-lounge-prem', 'Premium / Garuda Lounge', 'PREMIUM LOUNGE', 'lounge', INTL_X + 314, BUILD_Y + 126, 190, 92, { zone: '11', wing: 'INTL' }),
  r('f3-lounge-dom', 'Domestic Lounges', 'LOUNGES — DOM', 'lounge', DOM_X + 8, BUILD_Y + 126, 300, 92, { zone: '23', wing: 'DOM' }),

  r('f3-admin', 'Airport Administration', 'ADMINISTRATION', 'office', DOM_X + 8, BUILD_Y + 226, 300, 88, { zone: '24', wing: 'DOM' }),
  r('f3-airline-office', 'Airline Back Offices', 'AIRLINE OFFICES', 'office', INTL_X + 8, BUILD_Y + 226, 300, 88, { zone: '12', wing: 'INTL' }),
  r('f3-meeting', 'Meeting & Briefing Rooms', 'MEETING ROOMS', 'office', INTL_X + 314, BUILD_Y + 226, 190, 88, { zone: '13', wing: 'INTL' }),
];

/** 4F — mechanical plant and roof. */
const F4_ROOMS: TerminalRoom[] = [
  r('f4-ahu-n1', 'AHU Plant Room — North 1', 'AHU PLANT N1', 'plant', INTL_X + 8, BUILD_Y + 10, 160, 92, { zone: '41', wing: 'INTL', detail: 'Serves international concourse and gates' }),
  r('f4-ahu-n2', 'AHU Plant Room — North 2', 'AHU PLANT N2', 'plant', INTL_X + 174, BUILD_Y + 10, 160, 92, { zone: '42', wing: 'INTL' }),
  r('f4-ahu-n3', 'AHU Plant Room — North 3', 'AHU PLANT N3', 'plant', INTL_X + 340, BUILD_Y + 10, 164, 92, { zone: '43', wing: 'INTL' }),
  r('f4-ahu-w1', 'AHU Plant Room — West 1', 'AHU PLANT W1', 'plant', DOM_X + 8, BUILD_Y + 10, 148, 92, { zone: '21', wing: 'DOM' }),
  r('f4-ahu-w2', 'AHU Plant Room — West 2', 'AHU PLANT W2', 'plant', DOM_X + 162, BUILD_Y + 10, 146, 92, { zone: '22', wing: 'DOM' }),
  r('f4-link', 'Riser & Service Shaft', 'RISERS', 'plant', LINK_X + 4, BUILD_Y + 10, 76, 302, { zone: '31', wing: 'CENTRAL', detail: 'Chilled water and electrical risers' }),

  r('f4-pau', 'PAU / MAU Plant Room', 'PAU / MAU', 'plant', INTL_X + 8, BUILD_Y + 110, 190, 76, { zone: '44', wing: 'INTL', detail: 'Primary and make-up air, food court interlock' }),
  r('f4-fan-spf', 'Smoke Purge Fan Room (SPF)', 'SPF FANS', 'fire', INTL_X + 204, BUILD_Y + 110, 148, 76, { zone: '11', wing: 'INTL', detail: '100% on fire alarm, stairwell pressurisation' }),
  r('f4-fan-sef', 'Staircase Extract Fans (SEF)', 'SEF FANS', 'fire', INTL_X + 358, BUILD_Y + 110, 146, 76, { zone: '12', wing: 'INTL' }),
  r('f4-fan-eaf', 'Exhaust & Fresh Air Fans (EAF / FAF)', 'EAF / FAF', 'plant', DOM_X + 8, BUILD_Y + 110, 148, 76, { zone: '23', wing: 'DOM', detail: 'Maintains positive pressure envelope' }),
  r('f4-fan-kef', 'Kitchen & Toilet Exhaust (KEF / TEF)', 'KEF / TEF', 'plant', DOM_X + 162, BUILD_Y + 110, 146, 76, { zone: '24', wing: 'DOM' }),

  r('f4-cooling-tower', 'Cooling Tower Deck', 'COOLING TOWERS', 'plant', DOM_X + 8, BUILD_Y + 194, 300, 60, { zone: '13', wing: 'DOM', detail: 'Condenser water rejection, greywater make-up' }),
  r('f4-solar', 'Solar PV Array', 'SOLAR PV — 155 kWp', 'electrical', INTL_X + 8, BUILD_Y + 194, 340, 60, { zone: '14', wing: 'INTL', detail: '155 kWp installed · 148 MWh/yr · scaling to 1,047 kWp' }),
  r('f4-inverter', 'PV Inverter Room', 'INVERTERS', 'electrical', INTL_X + 354, BUILD_Y + 194, 150, 60, { zone: '15', wing: 'INTL' }),

  r('f4-lift', 'Lift Machine Rooms', 'LIFT MACHINE', 'plant', DOM_X + 8, BUILD_Y + 262, 300, 52, { zone: '32', wing: 'DOM', detail: 'Variable speed, stop-and-go configuration' }),
  r('f4-roof', 'Roof Access & Maintenance Deck', 'ROOF ACCESS', 'circulation', INTL_X + 8, BUILD_Y + 262, 496, 52, { zone: '33', wing: 'INTL' }),
];

export const LEVEL_ROOMS: Record<LevelKey, TerminalRoom[]> = {
  PIT: PIT_ROOMS,
  GF: GF_ROOMS,
  '1F': F1_ROOMS,
  '2F': F2_ROOMS,
  '3F': F3_ROOMS,
  '4F': F4_ROOMS,
};

/** Categories actually present on a level, for the legend. */
export function categoriesOn(level: LevelKey): RoomCategory[] {
  const seen = new Set<RoomCategory>();
  LEVEL_ROOMS[level].forEach((room) => seen.add(room.category));
  return Array.from(seen);
}

/** A room's centre as a percentage of the plan — the coordinate space every
 *  map pin in the port already works in. */
export function roomCentrePct(room: TerminalRoom) {
  return {
    xPct: ((room.x + room.w / 2) / PLAN_W) * 100,
    yPct: ((room.y + room.h / 2) / PLAN_H) * 100,
  };
}

/** Zone id → centre, for a given level. Zones are the rooms that carry one:
 *  the AHU pins hang off these, so the pin lands in the room it serves. */
export function zoneCentresFor(level: LevelKey): { zone: string; xPct: number; yPct: number }[] {
  const out: { zone: string; xPct: number; yPct: number }[] = [];
  const seen = new Set<string>();
  for (const room of LEVEL_ROOMS[level]) {
    if (!room.zone || seen.has(room.zone)) continue;
    seen.add(room.zone);
    out.push({ zone: room.zone, ...roomCentrePct(room) });
  }
  return out;
}

/** The room a zone maps to on a level — so a marker can name its room. */
export function roomForZone(level: LevelKey, zone: string): TerminalRoom | undefined {
  return LEVEL_ROOMS[level].find((room) => room.zone === zone);
}

/** The one level and zone carrying a live fault in the demo dataset — the
 *  AHU trip in the domestic check-in hall. Every other zone reads healthy, so
 *  the map shows one real problem rather than a field of red. */
export const ALERT_FLOOR: LevelKey = '1F';
export const ALERT_ZONE = '23';
