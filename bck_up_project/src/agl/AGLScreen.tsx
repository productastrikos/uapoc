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
import AdvisoryPanel from './components/AdvisoryPanel';
import WorkOrderPanel from './components/WorkOrderPanel';
import { useAglStore, computeRollups } from './store';
import { RUNWAY_LENGTH, TAXIWAY_Y } from './airfield';

type Pt = { x: number; y: number };

/**
 * Arrival on RWY 27: approach from the east, touch down at the threshold, roll
 * out to 1600 m, vacate left onto rapid exit C, then taxi to Apron 2.
 *
 * C is the exit built for 27 landings — it leaves the runway at a shallow angle
 * trailing back the way the aircraft came, which is why an aircraft can take it
 * without slowing to walking pace.
 */
const ARRIVAL_PATH: Pt[] = [
  { x: RUNWAY_LENGTH + 900, y: 0 },
  { x: RUNWAY_LENGTH, y: 0 },
  { x: 1600, y: 0 },
  { x: 1420, y: -150 },
  { x: 1189, y: TAXIWAY_Y },
  { x: 1500, y: TAXIWAY_Y },
  { x: 1500, y: -470 },
];

/**
 * Departure: off Apron 2, east along taxiway A, up connector H to the RWY 27
 * holding point, then line up.
 */
const DEPARTURE_PATH: Pt[] = [
  { x: 1500, y: -470 },
  { x: 1500, y: TAXIWAY_Y },
  { x: 2790, y: TAXIWAY_Y },
  { x: 2790, y: -95 },
  { x: 2790, y: 0 },
];

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

  const [alarmsCollapsed, setAlarmsCollapsed] = useState(false);
  const [running, setRunning] = useState<'landing' | 'taxi' | null>(null);
  const [progress, setProgress] = useState(0);
  const frame = useRef<number>();

  // Live values ticker, so intensities and alarm durations move.
  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  const path = running === 'taxi' ? DEPARTURE_PATH : ARRIVAL_PATH;
  const acc = useMemo(() => arcLengths(path), [path]);
  const total = acc[acc.length - 1];

  /**
   * Fixtures near the active path, pre-projected once per sequence. Doing this
   * up front keeps the per-frame work to a comparison rather than a projection
   * over every fixture on the airfield.
   */
  const routeCandidates = useMemo(() => {
    if (!running) return [];
    return airfield.fixtures
      .filter(
        (f) =>
          f.category === 'taxiway_centerline' ||
          f.category === 'stopbar' ||
          f.category === 'runway_centerline'
      )
      .map((f) => ({ id: f.id, ...projectOnPath(path, acc, f) }))
      .filter((r) => r.lateral < 28);
  }, [running, airfield.fixtures, path, acc]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const speed = running === 'landing' ? 340 : 130; // metres per second on screen

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress((p) => {
        const next = p + dt * speed;
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
  }, [running, total]);

  const aircraft = running ? poseAt(path, acc, progress) : null;

  /** Green carpet: light the segment just ahead of the aircraft. */
  const routeTags = useMemo(() => {
    if (!running) return undefined;
    const set = new Set<string>();
    for (const r of routeCandidates) {
      if (r.s > progress - 40 && r.s < progress + 380) set.add(r.id);
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
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent-gold" />
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Airfield Ground Lighting (AGL)
            </h2>
            <p className="text-[11px] text-text-muted">
              {totalFixtures} addressable fixtures · {airfield.circuits.length} series circuits ·
              CORTEX ALCMS / LINC 360 ILCMS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">
              Overall Serviceability
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                overallServiceability < 95 ? 'text-red-400' : 'text-emerald-400'
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
          <div className="flex-1 min-h-0 bg-primary-900/60 border border-primary-500/40 rounded-lg overflow-hidden">
            <AirfieldCanvas
              overlay={overlay}
              routeTags={routeTags}
              aircraft={aircraft}
              papiWhite={papiWhite}
            />
          </div>
          <div className="shrink-0">
            <ScenarioDock onLanding={startLanding} onTaxi={startTaxi} running={running} />
          </div>
        </div>

        {/* Right rail: the advisory sits above the KPI blocks so a live fault
            inference is the first thing an operator's eye lands on. */}
        <div className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <AdvisoryPanel />
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
