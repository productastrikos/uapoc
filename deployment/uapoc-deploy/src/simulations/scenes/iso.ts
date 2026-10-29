/**
 * Shared 2.5D projection helpers for the simulation scenes.
 *
 * Both the airport (AO-S) and the baggage hall are authored in plain
 * "ground plane" coordinates - the same coordinates the original flat
 * top-down diagrams used - and then projected with a single oblique
 * (cavalier) transform:
 *
 *     x' = x + skew * y + ox
 *     y' =     squash * y + oy
 *
 * Because that is an affine map it can be expressed as an SVG matrix, so
 * flat ground geometry (runways, taxiways, conveyor belts, floor markings)
 * can simply be wrapped in one <g transform={isoMatrix}> and keeps its
 * original path data untouched.
 *
 * Anything that must stand UP off the floor - buildings, machines, aircraft,
 * lights, and every text label - is instead positioned by calling iso()
 * directly and drawn outside that group, so it stays upright and unsheared.
 * Vertical extrusion is then just a screen-space offset on y, which is what
 * makes isoBox() cheap.
 */

export interface ISOConfig {
  skew: number;
  squash: number;
  ox: number;
  oy: number;
}

export const ISO: ISOConfig = {
  skew: -0.55, // how far the far edge slides left
  squash: 0.6, // vertical foreshortening of the floor
  ox: 250,
  oy: 60,
};

export interface Pt {
  x: number;
  y: number;
}

/** Project a ground-plane point to screen space. */
export const iso = (x: number, y: number): Pt => ({
  x: x + y * ISO.skew + ISO.ox,
  y: y * ISO.squash + ISO.oy,
});

/** The same projection as an SVG transform, for flat ground geometry. */
export const isoMatrix = `matrix(1, 0, ${ISO.skew}, ${ISO.squash}, ${ISO.ox}, ${ISO.oy})`;

/** Project a list of ground points into an SVG polygon `points` string. */
export const isoPoly = (pts: Array<[number, number]>): string =>
  pts
    .map(([x, y]) => {
      const p = iso(x, y);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

const poly = (pts: Pt[]): string => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

export interface IsoBox {
  /** Footprint on the floor (useful for contact shadows). */
  ground: string;
  /** Roof polygon. */
  top: string;
  /** The +y wall, i.e. the one facing the viewer. */
  front: string;
  /** The +x wall. */
  right: string;
  /** Screen-space centre of the roof, for labels. */
  topCenter: Pt;
  /** Screen-space centre of the front wall, for signage. */
  frontCenter: Pt;
  /** Roof corners, if you want to stack another volume on top. */
  topPts: Pt[];
}

/**
 * Extrude an axis-aligned ground rectangle into a 3-face box.
 *
 * @param cx ground centre x
 * @param cy ground centre y
 * @param w  size along the x axis
 * @param d  size along the y axis (depth)
 * @param h  height, in screen pixels
 */
export function isoBox(cx: number, cy: number, w: number, d: number, h: number): IsoBox {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - d / 2;
  const y1 = cy + d / 2;

  const backLeft = iso(x0, y0);
  const backRight = iso(x1, y0);
  const frontRight = iso(x1, y1);
  const frontLeft = iso(x0, y1);

  const up = (p: Pt): Pt => ({ x: p.x, y: p.y - h });

  const topPts = [up(backLeft), up(backRight), up(frontRight), up(frontLeft)];

  return {
    ground: poly([backLeft, backRight, frontRight, frontLeft]),
    top: poly(topPts),
    front: poly([frontLeft, frontRight, up(frontRight), up(frontLeft)]),
    right: poly([backRight, frontRight, up(frontRight), up(backRight)]),
    topCenter: {
      x: (topPts[0].x + topPts[2].x) / 2,
      y: (topPts[0].y + topPts[2].y) / 2,
    },
    frontCenter: {
      x: (frontLeft.x + frontRight.x) / 2,
      y: (frontLeft.y + frontRight.y) / 2 - h / 2,
    },
    topPts,
  };
}

/**
 * A soft elliptical contact shadow under an object at ground (x, y).
 * Radii are in ground units; the projection squashes ry automatically.
 */
export const isoShadow = (x: number, y: number, rx: number, ry = rx) => {
  const p = iso(x, y);
  return { cx: p.x, cy: p.y, rx, ry: ry * ISO.squash };
};

/** Depth sort key - higher means nearer the viewer, so paint it later. */
export const depth = (y: number): number => y;
