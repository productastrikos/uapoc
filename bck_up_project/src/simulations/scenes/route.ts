/**
 * Route sampling for the simulations.
 *
 * Vehicles and bags must follow the *actual* painted geometry - a taxiway
 * centreline, a conveyor belt - not a straight line between waypoints. This
 * turns an SVG path string into a polyline with cumulative arc lengths, so a
 * mover can be placed at any distance along it and its heading read from the
 * local tangent.
 *
 * Measurement uses a real SVGPathElement (`getPointAtLength`), which needs to
 * live in the document, so one hidden 1x1 host svg is created and reused.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface SampledRoute {
  pts: Pt[];
  /** cum[i] = arc length from the start up to pts[i]. */
  cum: number[];
  total: number;
}

let host: SVGSVGElement | null = null;

function getHost(): SVGSVGElement | null {
  if (typeof document === 'undefined') return null;
  if (host && host.isConnected) return host;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.overflow = 'hidden';
  svg.style.pointerEvents = 'none';
  document.body.appendChild(svg);
  host = svg;
  return svg;
}

const cache = new Map<string, SampledRoute>();

/**
 * Convert an SVG path `d` into an evenly sampled polyline.
 * @param d      path data, e.g. "M100,400 L250,400 Q..."
 * @param stepPx sampling interval in path units; smaller = smoother turns
 */
export function sampleRoute(d: string, stepPx = 3): SampledRoute {
  const key = `${d}|${stepPx}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const svg = getHost();
  const empty: SampledRoute = { pts: [{ x: 0, y: 0 }], cum: [0], total: 0 };
  if (!svg) return empty;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);

  let total = 0;
  try {
    total = path.getTotalLength();
  } catch {
    svg.removeChild(path);
    return empty;
  }

  if (!isFinite(total) || total <= 0) {
    svg.removeChild(path);
    return empty;
  }

  const n = Math.max(2, Math.ceil(total / stepPx));
  const pts: Pt[] = [];
  const cum: number[] = [];
  let acc = 0;

  for (let i = 0; i <= n; i++) {
    const p = path.getPointAtLength((i / n) * total);
    const pt = { x: p.x, y: p.y };
    if (i > 0) acc += Math.hypot(pt.x - pts[i - 1].x, pt.y - pts[i - 1].y);
    pts.push(pt);
    cum.push(acc);
  }

  svg.removeChild(path);

  const route: SampledRoute = { pts, cum, total: acc };
  cache.set(key, route);
  return route;
}

export interface RoutePose {
  pos: Pt;
  /** Unit tangent in ground space - project it to get a screen heading. */
  tan: Pt;
  /** 0-1 along the route. */
  t: number;
}

/** Pose at an absolute arc-length distance along the route. */
export function routeAt(route: SampledRoute, dist: number): RoutePose {
  const { pts, cum, total } = route;
  if (pts.length < 2 || total <= 0) {
    return { pos: pts[0] ?? { x: 0, y: 0 }, tan: { x: 1, y: 0 }, t: 0 };
  }

  const d = Math.max(0, Math.min(total, dist));

  // binary search for the segment containing d
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }

  const a = pts[lo];
  const b = pts[Math.min(lo + 1, pts.length - 1)];
  const segLen = Math.max(cum[Math.min(lo + 1, cum.length - 1)] - cum[lo], 1e-6);
  const f = Math.max(0, Math.min(1, (d - cum[lo]) / segLen));

  const pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };

  // Average the tangent over a short window so heading does not jitter.
  const look = 4;
  const i0 = Math.max(0, lo - look);
  const i1 = Math.min(pts.length - 1, lo + look);
  let tx = pts[i1].x - pts[i0].x;
  let ty = pts[i1].y - pts[i0].y;
  const mag = Math.hypot(tx, ty) || 1;
  tx /= mag;
  ty /= mag;

  return { pos, tan: { x: tx, y: ty }, t: d / total };
}

/** Convenience: pose at a 0-1 fraction of the route. */
export const routeAtFraction = (route: SampledRoute, t: number): RoutePose =>
  routeAt(route, Math.max(0, Math.min(1, t)) * route.total);

/**
 * Screen-space heading in degrees for a ground tangent under an affine
 * projection. Because the isometric transform is affine, projecting the
 * tangent as a direction vector gives the correct on-screen angle.
 */
export function screenHeading(tan: Pt, skew: number, squash: number): number {
  const sx = tan.x + skew * tan.y;
  const sy = squash * tan.y;
  return (Math.atan2(sy, sx) * 180) / Math.PI;
}
