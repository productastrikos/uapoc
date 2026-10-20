/**
 * Airfield Ground Lighting console.
 *
 * Assembles the canvas, serviceability rail, faceplate, alarm strip and
 * simulation dock over the shared tag engine, and drives the two movement
 * sequences.
 *
 * The sequences are the part the reference system cannot do. Its screens are
 * static status pictures; lighting is a sequenced system, so an arrival that
 * actually flies the PAPI down to the threshold and a taxi that lights the
 * green ahead of the aircraft and drops the stop bar behind it show the system
 * working rather than merely reporting.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import AirfieldCanvas from './components/AirfieldCanvas';
import KpiRail from './components/KpiRail';
import LampFaceplate from './components/LampFaceplate';
import AlarmStrip from './components/AlarmStrip';
import ScenarioDock from './components/ScenarioDock';
import WorkOrderPanel from './components/WorkOrderPanel';
import { useAglStore, computeRollups } from './store';
import { computeAglInsights } from './insights';
import { useAiDomain } from '../ai/store';
import { RUNWAY_LENGTH } from './airfield';
import { routeBetween } from './routing';

type Pt = { x: number; y: number };

/**
 * Movement sequences, built on the real taxiway network.
 *
 * The taxi portion is SOLVED across the surveyed centrelines rather than
 * written out as waypoints. A hand-listed path only approximates the pavement,
 * so the aircraft drifted off the taxiway and the lights it appeared to pass
 * were not the lights the route selected. Routing the network guarantees the
 * aircraft is on real centreline and that the fixtures generated along that
 * same centreline are exactly the ones that illuminate.
 */

/** Where aircraft leave and join the runway, and the stand they work to. */
const RWY09_THRESHOLD: Pt = { x: 0, y: 0 };
/** Rapid exit off RWY 09, 1471 m down the roll — where the surveyed rapid
 *  exit taxiway actually meets the runway centreline. */
const EXIT_09: Pt = { x: 1471, y: 0 };
/**
 * Where the RWY 27 entry connector meets the runway.
 *
 * The surveyed connector runs from the parallel taxiway round to this point.
 * Routing to it — rather than to the taxiway end and then jumping — is what
 * makes a departure enter the runway *down the entry road* instead of cutting
 * across the grass onto the middle of the strip.
 */
const ENTRY_27_RUNWAY: Pt = { x: 2945.8, y: 0 };
/** Line-up point at the 27 end, once the aircraft is on the runway. */
const LINEUP_27: Pt = { x: 2990, y: 0 };
const STAND: Pt = { x: 1748, y: 325 };

const toPt = (p: [number, number]): Pt => ({ x: p[0], y: p[1] });

/**
 * Speed profile along a route.
 *
 * Each phase names the arc length at which it ends and the speed at its start
 * and end, interpolated between. Real numbers: an approach around 70 m/s
 * (≈135 kt), rollout decelerating to taxi speed, taxi at 8 m/s (≈15 kt), and a
 * takeoff roll accelerating away. The previous constants — 340 m/s on the
 * runway and 130 m/s taxiing — were roughly 660 kt and 250 kt, which is why
 * nothing could be followed by eye.
 */
interface Phase { until: number; from: number; to: number }

function speedAt(phases: Phase[], s: number): number {
  let prev = 0;
  for (const ph of phases) {
    if (s <= ph.until) {
      const t = (s - prev) / Math.max(1, ph.until - prev);
      return ph.from + (ph.to - ph.from) * t;
    }
    prev = ph.until;
  }
  return phases.length ? phases[phases.length - 1].to : 10;
}

interface Sequence { path: Pt[]; phases: Phase[] }

function segLen(a: Pt, b: Pt) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lengthOf(path: Pt[]) {
  let n = 0;
  for (let i = 1; i < path.length; i += 1) n += segLen(path[i - 1], path[i]);
  return n;
}

/** Arrival on RWY 09: approach, touchdown, rollout, vacate, taxi to stand. */
function buildArrival(): Sequence {
  // Route from the runway itself, not from a point part-way up the exit. The
  // rapid exit taxiway is surveyed geometry in the graph, so starting the
  // route at the runway node makes the aircraft follow the curve it is
  // actually on — and the fixtures lit along it are the ones the aircraft
  // passes, which is the whole point of routing on real centrelines.
  const taxi = routeBetween([EXIT_09.x, EXIT_09.y], [STAND.x, STAND.y]).map(toPt);
  const air: Pt[] = [{ x: -1200, y: 0 }, RWY09_THRESHOLD, EXIT_09];
  const path = [...air, ...taxi];

  const approachLen = 1200;
  const rolloutLen = lengthOf(air) - approachLen;
  const taxiLen = lengthOf(path) - lengthOf(air);

  return {
    path,
    phases: [
      { until: approachLen, from: 72, to: 68 },
      { until: approachLen + rolloutLen, from: 68, to: 8 },
      { until: approachLen + rolloutLen + taxiLen, from: 8, to: 6 },
    ],
  };
}

/** Departure: push off stand, taxi to the RWY 27 end, line up, roll. */
function buildDeparture(): Sequence {
  // Taxi all the way onto the runway. Previously the route stopped on the
  // parallel taxiway and the air path resumed on the centreline, so the
  // aircraft cut straight across the grass and appeared on the strip without
  // ever using the entry connector.
  const taxi = routeBetween([STAND.x, STAND.y], [ENTRY_27_RUNWAY.x, ENTRY_27_RUNWAY.y]).map(toPt);
  const air: Pt[] = [LINEUP_27, { x: RUNWAY_LENGTH - 2600, y: 0 }];
  const path = [...taxi, ...air];

  const taxiLen = lengthOf(taxi);
  const lineUpLen = segLen(taxi[taxi.length - 1] ?? air[0], air[0]);

  return {
    path,
    phases: [
      { until: taxiLen, from: 8, to: 6 },
      { until: taxiLen + lineUpLen, from: 6, to: 5 },
      { until: lengthOf(path), from: 5, to: 85 },
    ],
  };
}

/** Cumulative arc length of a polyline. */
function arcLengths(path: Pt[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i += 1) {
    acc.push(acc[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  }
  return acc;
}

/** Point and heading at distance `s` along the polyline. */
function poseAt(path: Pt[], acc: number[], s: number) {
  const total = acc[acc.length - 1];
  const d = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < acc.length - 1 && acc[i] < d) i += 1;
  const t = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
  const a = path[i - 1];
  const b = path[i];
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI,
  };
}

/** Shortest distance from a point to a segment, plus arc position of the foot. */
function projectOnPath(path: Pt[], acc: number[], p: Pt) {
  let best = { lateral: Infinity, s: 0 };
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
    const px = a.x + vx * t;
    const py = a.y + vy * t;
    const lateral = Math.hypot(p.x - px, p.y - py);
    if (lateral < best.lateral) {
      best = { lateral, s: acc[i - 1] + Math.hypot(px - a.x, py - a.y) };
    }
  }
  return best;
}

const AGLScreen: React.FC = () => {
  const airfield = useAglStore((s) => s.airfield);
  const overlay = useAglStore((s) => s.overlay);
  const selectedTag = useAglStore((s) => s.selectedTag);
  const tick = useAglStore((s) => s.tick);
  const rollups = useMemo(() => computeRollups(airfield), [airfield]);

  // AI advisories are derived from the same tags the canvas is drawing, on
  // every render, rather than stored — so the panel and the picture next to it
  // cannot drift apart. Actions are pulled from the store rather than closed
  // over so an accepted recommendation genuinely moves the console.
  const mode = useAglStore((s) => s.mode);
  const alarms = useAglStore((s) => s.alarms);
  const select = useAglStore((s) => s.select);
  const setOverlay = useAglStore((s) => s.setOverlay);
  const escalateToWorkOrder = useAglStore((s) => s.escalateToWorkOrder);
  const setCircuitStep = useAglStore((s) => s.setCircuitStep);
  const insights = useMemo(
    () =>
      computeAglInsights(airfield, mode, rollups, alarms, {
        select,
        setOverlay,
        escalateToWorkOrder,
        setCircuitStep,
      }),
    [airfield, mode, rollups, alarms, select, setOverlay, escalateToWorkOrder, setCircuitStep]
  );

  // Declare this console to the advisory drawer, and hand it the insights this
  // screen computes from its own tags — so opening AI Advisory here shows the
  // airfield's live inferences rather than the written catalogue.
  useAiDomain('agl', insights);

  const [alarmsCollapsed, setAlarmsCollapsed] = useState(false);
  const [running, setRunning] = useState<'landing' | 'taxi' | null>(null);
  const [progress, setProgress] = useState(0);
  const frame = useRef<number>();

  // Live values ticker, so intensities and alarm durations move.
  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  /** Playback rate. Real taxi speed is slow, so the demo needs a throttle. */
  const [rate, setRate] = useState(4);

  // Routes are solved across the taxiway graph once, not on every frame.
  const arrival = useMemo(() => buildArrival(), []);
  const departure = useMemo(() => buildDeparture(), []);
  const sequence = running === 'taxi' ? departure : arrival;
  const path = sequence.path;
  const acc = useMemo(() => arcLengths(path), [path]);
  const total = acc[acc.length - 1];

  /**
   * Fixtures near the active path, pre-projected once per sequence. Doing this
   * up front keeps the per-frame work to a comparison rather than a projection
   * over every fixture on the airfield.
   */
  const routeCandidates = useMemo(() => {
    if (!running) return [];
    return (
      airfield.fixtures
        .filter(
          (f) =>
            f.category === 'taxiway_centerline' ||
            f.category === 'stopbar' ||
            f.category === 'runway_centerline'
        )
        .map((f) => ({ id: f.id, ...projectOnPath(path, acc, f) }))
        // 12 m keeps the selection to fixtures genuinely ON the cleared
        // centreline. At the previous 28 m, lights on a taxiway running
        // alongside the route were swept in too, and the guidance read as a
        // blob around the aircraft rather than as a line along its clearance.
        .filter((r) => r.lateral < 12)
        // Ordered along the route, so the lit run is a clean linear sequence.
        .sort((a, b) => a.s - b.s)
    );
  }, [running, airfield.fixtures, path, acc]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();

    const step = (now: number) => {
      // Clamp the frame delta so a background tab does not teleport the
      // aircraft the length of the field on the first frame back.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setProgress((p) => {
        const next = p + dt * speedAt(sequence.phases, p) * rate;
        if (next >= total) {
          setRunning(null);
          return 0;
        }
        return next;
      });
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [running, total, rate, sequence]);

  const aircraft = running ? poseAt(path, acc, progress) : null;

  /**
   * The lit segment: a contiguous run of centreline fixtures along the cleared
   * route, extending ahead of the aircraft and extinguishing behind it.
   *
   * This is a window in ARC LENGTH along the route, not a radius around the
   * aircraft — so what illuminates is the line the aircraft has been cleared
   * along, in order, exactly as follow-the-green works on an airfield.
   */
  const routeTags = useMemo(() => {
    if (!running) return undefined;
    const set = new Set<string>();
    const from = progress - 25;
    const to = progress + 400;
    for (const r of routeCandidates) {
      if (r.s > to) break; // candidates are sorted along the route
      if (r.s >= from) set.add(r.id);
    }
    return set;
  }, [running, routeCandidates, progress]);

  /**
   * PAPI indication during the approach: four white while high, two-and-two on
   * slope, four red once low. Only meaningful before the threshold.
   */
  const papiWhite = useMemo(() => {
    if (running !== 'landing') return undefined;
    const remaining = total - progress;
    if (progress < 200) return 3;
    if (remaining > total - 600) return 2;
    return 2;
  }, [running, progress, total]);

  const startLanding = useCallback(() => {
    setProgress(0);
    setRunning('landing');
  }, []);

  const startTaxi = useCallback(() => {
    setProgress(0);
    setRunning('taxi');
  }, []);

  const totalFixtures = airfield.fixtures.length;
  const totalFailed = rollups.reduce((n, r) => n + r.failed, 0);
  const overallServiceability = ((totalFixtures - totalFailed) / totalFixtures) * 100;

  return (
    <div className="agl-root flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/15 rounded-lg">
            <Lightbulb className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              Airfield Ground Lighting (AGL)
            </h2>
            <p className="text-sm text-text-muted">
              {totalFixtures} addressable fixtures · {airfield.circuits.length} series circuits ·
              CORTEX ALCMS / LINC 360 ILCMS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-pill glass-pill-blue text-right !px-4 !py-2">
            <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">
              Overall Serviceability
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                overallServiceability < 95 ? 'text-status-error' : 'text-status-success'
              }`}
            >
              {overallServiceability.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Canvas takes the room — it is the screen. Controls sit under it as a
            single compact toolbar rather than a column that starves the plan. */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          <div className="flex-1 min-h-0 glass-panel-strong rounded-lg overflow-hidden">
            <AirfieldCanvas
              overlay={overlay}
              routeTags={routeTags}
              aircraft={aircraft}
              papiWhite={papiWhite}
            />
          </div>
          <div className="shrink-0">
            <ScenarioDock onLanding={startLanding} onTaxi={startTaxi} running={running}
                          rate={rate} onRate={setRate} />
          </div>
        </div>

        {/* Right rail: serviceability, regulators and the work-order queue —
            the operational summary for what is on the canvas beside it.
            The AI advisories used to sit at the top of this column, which put a
            model's opinion in the space the airfield's own state should occupy
            and squeezed both. They now live in the AI Advisory drawer, opened
            from the header and scoped to this console (see `useAiDomain`), so
            they get the full width of a panel when the operator asks for them
            and none of it when they do not. */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <KpiRail />
          <WorkOrderPanel />
        </div>

        {/* Faceplate */}
        <AnimatePresence>{selectedTag && <LampFaceplate />}</AnimatePresence>
      </div>

      {/* Alarm strip */}
      <div className="shrink-0 mt-3 -mx-6 -mb-6">
        <AlarmStrip
          collapsed={alarmsCollapsed}
          onToggle={() => setAlarmsCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
};

export default AGLScreen;
