/**
 * Conveyor routing for the baggage hall.
 *
 * Every bag travels along real belt geometry. The three outcome routes for a
 * tier share an identical prefix up to that tier's diverter, so when screening
 * rejects a bag mid-run we can swap its route without moving it - it simply
 * takes the other branch at the diverter, exactly like a real sorter.
 *
 * The reject branches are *chutes*: they leave the elevated sorter deck and
 * slide down to the hall floor. That descent is modelled here (not guessed
 * from a bag's y band) so the painted chute and the bag riding it use the same
 * height at every point, and a bag visibly rides down instead of teleporting
 * onto a belt drawn underneath it.
 */

import { sampleRoute, SampledRoute, routeAt } from './route';

export type RouteKind = 'cleared' | 'flagged' | 'anomaly';
/** The two branches that leave the sorter deck and drop to the floor. */
export type RejectKind = 'flagged' | 'anomaly';

/** Screen-space height of each conveyor tier above the hall floor. */
export const TIER_LIFT = [14, 34, 54];

const clampLevel = (level: number): number => (level >= 1 && level <= 3 ? Math.round(level) : 1);

export const tierLift = (level: number): number => TIER_LIFT[clampLevel(level) - 1];

/** Ground-plane position of each tier's diverter. */
export const DIVERTER_POS: Record<number, { x: number; y: number }> = {
  1: { x: 475, y: 350 },
  2: { x: 475, y: 250 },
  3: { x: 475, y: 150 },
};

/** Main run for each tier, from check-in through screening to the diverter. */
const TRUNK: Record<number, string> = {
  1: 'M100,400 L250,400 L250,350 L400,350 L475,350',
  2: 'M100,300 L250,300 L250,250 L400,250 L475,250',
  3: 'M100,200 L250,200 L250,150 L400,150 L475,150',
};

/** Continuation past the diverter for bags that pass screening. */
const CLEARED_TAIL: Record<number, string> = {
  1: 'L550,350 L550,300 L690,300',
  2: 'L550,250 L550,200 L690,200',
  3: 'L550,150 L550,100 L690,100',
};

/**
 * Reject chute down to the manual inspection bay.
 *
 * Every branch turns out of the run immediately, across the belt rather than
 * along it - a chute that first travelled down the cleared line would spend
 * its whole visible top section hidden underneath that belt, which is exactly
 * the "bags just appear on the lower belt" problem. Each tier then drops at
 * its own x, so the three chutes read as three separate structures, and the
 * upper ones pass *under* the lower decks on the way down.
 */
const FLAGGED_TAIL: Record<number, string> = {
  1: 'L477,368 L477,406 L545,406 L545,446',
  2: 'L493,268 L493,406 L545,406 L545,446',
  3: 'L509,168 L509,406 L545,406 L545,446',
};

/** Reject chute to the SOP response bay for anomalies - the other way out. */
const ANOMALY_TAIL: Record<number, string> = {
  1: 'L471,368 L471,390 L430,424 L400,432 L400,486',
  2: 'L457,268 L457,390 L430,424 L400,432 L400,486',
  3: 'L443,168 L443,390 L430,424 L400,432 L400,486',
};

const tailFor = (level: number, kind: RouteKind): string =>
  kind === 'cleared'
    ? CLEARED_TAIL[level]
    : kind === 'flagged'
    ? FLAGGED_TAIL[level]
    : ANOMALY_TAIL[level];

const buildPath = (level: number, kind: RouteKind): string => `${TRUNK[level]} ${tailFor(level, kind)}`;

const routeCache = new Map<string, SampledRoute>();

export function getBagRoute(level: number, kind: RouteKind): SampledRoute {
  const lv = clampLevel(level);
  const key = `${lv}:${kind}`;
  let r = routeCache.get(key);
  if (!r) {
    r = sampleRoute(buildPath(lv, kind), 2);
    routeCache.set(key, r);
  }
  return r;
}

/**
 * A reject branch on its own, starting at the diverter. The scene paints the
 * chute from this, and bag heights are measured along it, so the drawn ramp
 * and the bag on it can never disagree.
 */
const tailCache = new Map<string, SampledRoute>();

export function getTailRoute(level: number, kind: RejectKind): SampledRoute {
  const lv = clampLevel(level);
  const key = `${lv}:${kind}`;
  let r = tailCache.get(key);
  if (!r) {
    const d = DIVERTER_POS[lv];
    r = sampleRoute(`M${d.x},${d.y} ${tailFor(lv, kind)}`, 2);
    tailCache.set(key, r);
  }
  return r;
}

/** Path strings for painting the belts / branch chutes in the scene. */
export const routePaths = {
  trunk: TRUNK,
  cleared: (lv: number) => `${TRUNK[lv]} ${CLEARED_TAIL[lv]}`,
  flagged: (lv: number) => `${TRUNK[lv]} ${FLAGGED_TAIL[lv]}`,
  anomaly: (lv: number) => `${TRUNK[lv]} ${ANOMALY_TAIL[lv]}`,
};

const trunkLenCache = new Map<number, number>();

/**
 * Arc length of a tier's shared trunk - the stretch every bag rides before the
 * diverter. Machine stops are measured against THIS, not against the full
 * route: the cleared/flagged/anomaly variants have different total lengths, so
 * a fraction of the total lands in a different physical place on each branch,
 * which let bags be flagged after they had already passed the diverter.
 */
export function getTrunkLength(level: number): number {
  const lv = clampLevel(level);
  let v = trunkLenCache.get(lv);
  if (v === undefined) {
    v = sampleRoute(TRUNK[lv], 2).total;
    trunkLenCache.set(lv, v);
  }
  return v;
}

/**
 * How much chute a bag gets to lose its tier height over. Higher decks need a
 * longer slide, which is what stops the upper tiers from looking like they
 * drop straight through the floor.
 */
export const chuteRunLength = (level: number): number => tierLift(level) * 3;

const smoothstep = (t: number): number => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};

/**
 * Height above the hall floor at `dist` along a reject chute (measured from
 * the diverter). Full tier height at the top, floor level once the bag has
 * ridden the whole slide.
 */
export function chuteLiftAt(level: number, distAlongTail: number): number {
  const lift = tierLift(level);
  return lift * (1 - smoothstep(distAlongTail / chuteRunLength(level)));
}

/**
 * Height of a bag anywhere on its route. Cleared bags stay up on their deck;
 * rejected bags ride the chute down, so their height falls continuously from
 * the diverter onward instead of snapping between tiers.
 */
export function liftAlongRoute(level: number, kind: RouteKind, dist: number): number {
  const lv = clampLevel(level);
  if (kind === 'cleared') return tierLift(lv);
  const trunk = getTrunkLength(lv);
  if (dist <= trunk) return tierLift(lv);
  return chuteLiftAt(lv, dist - trunk);
}

/**
 * Where each screening machine sits, as a fraction of its tier's trunk, so a
 * bag stops and is scanned at the machine rather than at an arbitrary point.
 * The fractions are the machines' real distances along the trunk, so the bag
 * halts inside the tunnel it is being scanned by.
 */
export const MACHINE_STOPS: Record<number, Array<{ id: string; atTrunk: number }>> = {
  1: [
    { id: 'CTX-AI-001', atTrunk: 0.184 },
    { id: 'EDS-L3-001', atTrunk: 0.64 },
  ],
  2: [
    { id: 'CTX-5800-001', atTrunk: 0.184 },
    { id: 'XRAY-001', atTrunk: 0.64 },
  ],
  3: [{ id: 'CTX-9800-001', atTrunk: 0.184 }],
};

/** Absolute distance along a tier's route at which the diverter branches. */
export const diverterDistance = (level: number): number => getTrunkLength(level);

/** Convenience re-export so scenes can sample chutes without a second import. */
export { routeAt };
