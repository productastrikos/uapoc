/**
 * Ground-plane layout for the AO-S airport scene.
 *
 * Extracted from FlightOperations so both the simulation state machine and
 * the isometric renderer can share one source of truth. Coordinates are in
 * the original flat top-down space; IsoAirportScene projects them.
 */

export const AIRPORT_LAYOUT = {
  // Upper Runway 09/27
  runway1: {
    id: '09/27',
    centerline: { x: 350, y: 120 },
    length: 300,
    width: 35,
    approach: { x: 100, y: 120 },
    departure: { x: 600, y: 120 },
    active: true,
  },

  // Lower Runway 14/32
  runway2: {
    id: '14/32',
    centerline: { x: 350, y: 400 },
    length: 300,
    width: 35,
    approach: { x: 100, y: 400 },
    departure: { x: 600, y: 400 },
    active: true,
  },

  /**
   * Taxiway system.
   *
   * `M` is the parallel taxiway the arrival route actually uses; B and D are
   * the high-speed exits that feed it from each runway. Everything here is
   * geometry the aircraft can really be on, which is what lets the position
   * readout name the surface it is standing on.
   */
  taxiways: [
    { id: 'A', path: 'M350,155 L350,365', width: 24 },
    { id: 'M', path: 'M460,106 L460,414', width: 26 },
    { id: 'B', path: 'M418,120 Q460,120 460,160', width: 24 },
    { id: 'D', path: 'M418,400 Q460,400 460,360', width: 24 },
    { id: 'F', path: 'M350,200 Q400,222 430,240 L460,240', width: 20 },
    { id: 'G', path: 'M350,320 Q400,298 430,280 L460,280', width: 20 },
  ],

  /**
   * Stands sit close to their concourse, at STAND_X.
   *
   * They used to be parked out at x=500 with the terminals at x=706, which
   * made every jetbridge a ~150-unit gangway stretching across the apron, and
   * the 20-unit gate pitch projected to ~12 screen px - narrower than the
   * stand circle itself, so the parking positions smeared into one blur. The
   * stands are now pulled back against the buildings and pitched 30 apart, so
   * each circle reads separately.
   */
  terminalA: {
    position: { x: 706, y: 172 },
    width: 120,
    height: 82,
    gates: [
      { id: 'A1', position: { x: 596, y: 142 }, jetbridge: true, size: 'large' },
      { id: 'A2', position: { x: 596, y: 172 }, jetbridge: true, size: 'large' },
      { id: 'A3', position: { x: 596, y: 202 }, jetbridge: true, size: 'large' },
    ],
  },

  terminalB: {
    position: { x: 706, y: 262 },
    width: 120,
    height: 82,
    gates: [
      { id: 'B1', position: { x: 596, y: 232 }, jetbridge: false, size: 'medium' },
      { id: 'B2', position: { x: 596, y: 262 }, jetbridge: false, size: 'medium' },
      { id: 'B3', position: { x: 596, y: 292 }, jetbridge: false, size: 'medium' },
    ],
  },

  terminalC: {
    position: { x: 706, y: 352 },
    width: 120,
    height: 82,
    gates: [
      { id: 'C1', position: { x: 596, y: 322 }, jetbridge: true, size: 'large' },
      { id: 'C2', position: { x: 596, y: 352 }, jetbridge: true, size: 'large' },
      { id: 'C3', position: { x: 596, y: 382 }, jetbridge: true, size: 'large' },
    ],
  },

  /** Control tower - purely scenic, gives the apron a vertical landmark. */
  tower: { position: { x: 806, y: 486 }, height: 62 },
};

export type AirportLayout = typeof AIRPORT_LAYOUT;

export const getAllGates = () => [
  ...AIRPORT_LAYOUT.terminalA.gates,
  ...AIRPORT_LAYOUT.terminalB.gates,
  ...AIRPORT_LAYOUT.terminalC.gates,
];

export const getTerminals = () => [
  { key: 'A', ...AIRPORT_LAYOUT.terminalA },
  { key: 'B', ...AIRPORT_LAYOUT.terminalB },
  { key: 'C', ...AIRPORT_LAYOUT.terminalC },
];

/** Parallel taxiway that links the runway exits to the stands. */
export const TAXI_LANE_X = 460;
/** Where the aircraft leaves the runway centreline. */
export const RUNWAY_EXIT_X = 420;
/** Where the inbound aircraft starts, out on final approach. */
export const APPROACH_START_X = 48;

/**
 * Short lead-in lines from the parallel taxiway to each stand. Painting these
 * is what makes the stand circles read as parking positions served by a
 * taxiway rather than as loose markings on the apron.
 */
export const getStandLeadIns = () =>
  getAllGates().map(g => ({
    id: g.id,
    path: `M${TAXI_LANE_X},${g.position.y} L${g.position.x - 12},${g.position.y}`,
  }));

/**
 * Build the arrival route as a single SVG path: final approach along the
 * runway centreline, a curved high-speed exit onto the parallel taxiway, then
 * a curved turn onto the stand lead-in line.
 *
 * Returning real path data (with quadratic turns) rather than a list of
 * waypoints is what lets the aircraft track the painted centreline and bank
 * through the turns instead of sliding diagonally across the grass.
 */
export function buildArrivalRoute(
  runway: { centerline: { x: number; y: number }; length: number },
  gate: { position: { x: number; y: number } }
): string {
  const ry = runway.centerline.y;
  const gx = gate.position.x;
  const gy = gate.position.y;
  const lane = TAXI_LANE_X;

  // Direction the aircraft must travel down the taxiway to reach the stand.
  const goingSouth = gy > ry;
  // End of the runway-exit curve, clamped so it never overshoots the stand.
  const turnOut = goingSouth
    ? Math.min(ry + 35, gy - 10)
    : Math.max(ry - 35, gy + 10);
  // Point at which the aircraft begins its turn onto the stand.
  const turnIn = goingSouth ? gy - 10 : gy + 10;

  return [
    `M${APPROACH_START_X},${ry}`,
    `L${RUNWAY_EXIT_X},${ry}`,
    `Q${lane},${ry} ${lane},${turnOut}`,
    `L${lane},${turnIn}`,
    `Q${lane},${gy} ${lane + 35},${gy}`,
    `L${gx},${gy}`,
  ].join(' ');
}
