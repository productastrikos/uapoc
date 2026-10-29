/**
 * Taxi routing over the surveyed taxiway network.
 *
 * Routes used to be hand-written waypoint lists that merely approximated the
 * taxiways. That broke in two ways at once: the aircraft cut across pavement it
 * was not actually on, and the lights it appeared to pass were not the lights
 * the route selected — so the guidance and the aircraft disagreed.
 *
 * The fix is to route on the real thing. Every surveyed taxiway centreline is
 * loaded into a graph, coincident endpoints are welded together, and a shortest
 * path is solved across it. The aircraft then follows genuine centreline
 * geometry, and the fixtures generated along that same geometry are, by
 * construction, exactly the ones that illuminate.
 */

import { TAXIWAY_LINES, isStandLeadIn, Pt } from './airfield';

/** Endpoints within this distance are treated as the same junction. */
const WELD = 12;

interface Edge {
  to: string;
  /** Centreline geometry from this node to `to`, in travel order. */
  points: Pt[];
  cost: number;
}

interface Graph {
  nodes: Map<string, Pt>;
  edges: Map<string, Edge[]>;
}

function polyLength(pts: Pt[]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i += 1) {
    n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return n;
}

let cached: Graph | null = null;

/**
 * Build the routable network.
 *
 * Stand lead-ins are included: an aircraft does taxi down them to reach a
 * stand, even though they carry paint rather than lighting.
 */
export function taxiGraph(): Graph {
  if (cached) return cached;

  const nodes = new Map<string, Pt>();
  const edges = new Map<string, Edge[]>();

  /**
   * Ways connect at INTERIOR vertices, not only at their endpoints — a stand
   * lead-in meets the middle of a taxilane, a rapid exit meets the middle of
   * the parallel taxiway. Joining endpoints alone left the network in
   * components of a dozen nodes and no route could ever be found.
   *
   * So: hash every vertex of every way into cells, find the vertices shared
   * between different ways, and split each way at those points. The spatial
   * hash checks the surrounding cells too, which avoids the boundary problem
   * that makes naive grid snapping miss genuine junctions.
   */
  const cell = (p: Pt) => `${Math.floor(p[0] / WELD)}:${Math.floor(p[1] / WELD)}`;
  const buckets = new Map<string, { way: number; idx: number; p: Pt }[]>();

  TAXIWAY_LINES.forEach((twy, wi) => {
    twy.points.forEach((p, idx) => {
      const k = cell(p);
      const list = buckets.get(k);
      const entry = { way: wi, idx, p };
      if (list) list.push(entry);
      else buckets.set(k, [entry]);
    });
  });

  /** Is this vertex shared with a different way? */
  const isJunction = (wi: number, p: Pt) => {
    const cx = Math.floor(p[0] / WELD);
    const cy = Math.floor(p[1] / WELD);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const e of buckets.get(`${cx + dx}:${cy + dy}`) ?? []) {
          if (e.way === wi) continue;
          if (Math.hypot(e.p[0] - p[0], e.p[1] - p[1]) <= WELD) return true;
        }
      }
    }
    return false;
  };

  const addNode = (p: Pt) => {
    const cx = Math.floor(p[0] / WELD);
    const cy = Math.floor(p[1] / WELD);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (const k of nodeCells.get(`${cx + dx}:${cy + dy}`) ?? []) {
          const q = nodes.get(k)!;
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= WELD) return k;
        }
      }
    }
    const k = `n${nodes.size}`;
    nodes.set(k, p);
    edges.set(k, []);
    const ck = `${cx}:${cy}`;
    const list = nodeCells.get(ck);
    if (list) list.push(k);
    else nodeCells.set(ck, [k]);
    return k;
  };
  const nodeCells = new Map<string, string[]>();

  TAXIWAY_LINES.forEach((twy, wi) => {
    const pts = twy.points;
    if (pts.length < 2) return;

    // Split points: both ends, plus every interior vertex shared with another way.
    const splits = [0];
    for (let i = 1; i < pts.length - 1; i += 1) {
      if (isJunction(wi, pts[i])) splits.push(i);
    }
    splits.push(pts.length - 1);

    // Stand lead-ins are traversable but discouraged, so a through route never
    // detours down a stand to save a few metres.
    const penalty = isStandLeadIn(pts) ? 3 : 1;

    for (let s = 1; s < splits.length; s += 1) {
      const seg = pts.slice(splits[s - 1], splits[s] + 1);
      if (seg.length < 2) continue;
      const a = addNode(seg[0]);
      const b = addNode(seg[seg.length - 1]);
      if (a === b) continue;
      const cost = polyLength(seg) * penalty;
      edges.get(a)!.push({ to: b, points: seg, cost });
      edges.get(b)!.push({ to: a, points: [...seg].reverse(), cost });
    }
  });

  cached = { nodes, edges };
  return cached;
}

/** Nearest graph node to a point. */
export function nearestNode(p: Pt): string | null {
  const g = taxiGraph();
  let best: string | null = null;
  let bestD = Infinity;
  for (const [k, q] of g.nodes) {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

/**
 * Shortest path between two points on the network, returned as centreline
 * geometry. Plain Dijkstra — the graph is a few hundred nodes, so the heap
 * that A* would save is not worth the code.
 */
export function routeBetween(from: Pt, to: Pt): Pt[] {
  const g = taxiGraph();
  const start = nearestNode(from);
  const goal = nearestNode(to);
  if (!start || !goal || start === goal) return [];

  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, { node: string; points: Pt[] }>();
  const visited = new Set<string>();

  for (;;) {
    let cur: string | null = null;
    let curD = Infinity;
    for (const [k, d] of dist) {
      if (!visited.has(k) && d < curD) {
        curD = d;
        cur = k;
      }
    }
    if (cur === null) break;
    if (cur === goal) break;
    visited.add(cur);

    for (const e of g.edges.get(cur) ?? []) {
      const nd = curD + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { node: cur, points: e.points });
      }
    }
  }

  if (!prev.has(goal) && start !== goal) return [];

  // Walk back, then stitch the per-edge geometry into one polyline.
  const chain: Pt[][] = [];
  let node = goal;
  while (node !== start) {
    const step = prev.get(node);
    if (!step) return [];
    chain.unshift(step.points);
    node = step.node;
  }

  const out: Pt[] = [];
  for (const seg of chain) {
    for (const p of seg) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.5) out.push(p);
    }
  }
  return out;
}

/** Diagnostics for the routing graph. */
export function graphStats() {
  const g = taxiGraph();
  let edgeCount = 0;
  for (const list of g.edges.values()) edgeCount += list.length;

  // Largest connected component, so a broken network is obvious.
  const seen = new Set<string>();
  let largest = 0;
  for (const k of g.nodes.keys()) {
    if (seen.has(k)) continue;
    let n = 0;
    const stack = [k];
    seen.add(k);
    while (stack.length) {
      const cur = stack.pop()!;
      n += 1;
      for (const e of g.edges.get(cur) ?? []) {
        if (!seen.has(e.to)) {
          seen.add(e.to);
          stack.push(e.to);
        }
      }
    }
    largest = Math.max(largest, n);
  }

  return { nodes: g.nodes.size, edges: edgeCount / 2, largestComponent: largest };
}
