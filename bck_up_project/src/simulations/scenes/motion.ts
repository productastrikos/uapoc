import { useEffect, useRef, useState } from 'react';
import { SampledRoute, routeAt, Pt } from './route';

export interface Vec2 {
  x: number;
  y: number;
}

/** A named checkpoint at a fraction along a route. */
export interface RoutePhase {
  /** 0-1 along the route at which this phase begins. */
  at: number;
  phase: string;
  onEnter?: () => void;
}

export interface RouteFollowState {
  pos: Vec2;
  tan: Pt;
  t: number;
  phase: string;
  done: boolean;
}

interface UseRouteFollowerOptions {
  active: boolean;
  route: SampledRoute;
  /** Ground units per second. */
  speed: number;
  phases?: RoutePhase[];
  /** Optional per-fraction speed multiplier (e.g. slow down for turns). */
  speedAt?: (t: number) => number;
  onComplete?: () => void;
}

/**
 * Walks a mover along a sampled route at a given ground speed, reporting its
 * pose and firing phase callbacks at fractional checkpoints.
 *
 * This is what makes the aircraft follow the taxiway centreline and bags stay
 * on the belt: position always comes from the geometry, never from lerping
 * between arbitrary waypoints.
 */
export function useRouteFollower({
  active,
  route,
  speed,
  phases = [],
  speedAt,
  onComplete,
}: UseRouteFollowerOptions): RouteFollowState {
  const initial = routeAt(route, 0);
  const [state, setState] = useState<RouteFollowState>({
    pos: initial.pos,
    tan: initial.tan,
    t: 0,
    phase: phases[0]?.phase ?? 'standby',
    done: false,
  });

  const routeRef = useRef(route);
  const phasesRef = useRef(phases);
  const speedAtRef = useRef(speedAt);
  const onCompleteRef = useRef(onComplete);
  routeRef.current = route;
  phasesRef.current = phases;
  speedAtRef.current = speedAt;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return;

    const r = routeRef.current;
    if (!r || r.total <= 0) return;

    let raf = 0;
    let cancelled = false;
    let dist = 0;
    let last = performance.now();
    let announced = -1;

    const step = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const pose = routeAt(r, dist);
      const mult = speedAtRef.current ? speedAtRef.current(pose.t) : 1;
      dist += speed * mult * dt;

      const clamped = Math.min(dist, r.total);
      const p = routeAt(r, clamped);
      const t = r.total > 0 ? clamped / r.total : 1;

      // fire the latest phase checkpoint we have passed
      const list = phasesRef.current;
      let idx = -1;
      for (let i = 0; i < list.length; i++) if (t >= list[i].at) idx = i;
      if (idx !== announced && idx >= 0) {
        announced = idx;
        list[idx].onEnter?.();
      }

      const finished = dist >= r.total;
      setState({
        pos: p.pos,
        tan: p.tan,
        t,
        phase: idx >= 0 ? list[idx].phase : 'standby',
        done: finished,
      });

      if (finished) {
        onCompleteRef.current?.();
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [active, speed]);

  return state;
}

/** One stage of a scripted journey. */
export interface Leg {
  /** Phase name reported while this leg is running. */
  phase: string;
  /** Ground-space point this leg travels to. */
  to: Vec2;
  /** Duration in ms at speed 1. */
  ms: number;
  /** Fired once, when the leg starts. */
  onEnter?: () => void;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ease-in-out so vehicles do not start and stop abruptly. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface UseJourneyOptions {
  active: boolean;
  from: Vec2;
  legs: Leg[];
  speed?: number;
  onPhase?: (phase: string, legIndex: number) => void;
  onComplete?: () => void;
}

interface JourneyState {
  position: Vec2;
  phase: string;
  legIndex: number;
  /** 0-1 across the whole journey. */
  progress: number;
}

/**
 * Drives a point along a list of legs using requestAnimationFrame.
 *
 * The original simulations moved things by firing a stack of setTimeouts that
 * each assigned a new position, so vehicles teleported between waypoints and
 * the timers kept running after the component unmounted. This replaces that
 * with a single rAF loop that interpolates continuously and is torn down with
 * the component.
 */
export function useJourney({
  active,
  from,
  legs,
  speed = 1,
  onPhase,
  onComplete,
}: UseJourneyOptions): JourneyState {
  const [state, setState] = useState<JourneyState>({
    position: from,
    phase: 'standby',
    legIndex: -1,
    progress: 0,
  });

  // Keep callbacks in refs so changing them mid-flight does not restart the run.
  const onPhaseRef = useRef(onPhase);
  const onCompleteRef = useRef(onComplete);
  const legsRef = useRef(legs);
  const fromRef = useRef(from);
  onPhaseRef.current = onPhase;
  onCompleteRef.current = onComplete;
  legsRef.current = legs;
  fromRef.current = from;

  useEffect(() => {
    if (!active) return;

    const runLegs = legsRef.current;
    if (!runLegs.length) return;

    let raf = 0;
    let cancelled = false;
    let legIndex = 0;
    let legStart = performance.now();
    let origin = fromRef.current;
    let announced = -1;

    const totalMs = runLegs.reduce((sum, l) => sum + l.ms, 0) / Math.max(speed, 0.01);
    let elapsedBefore = 0;

    const step = (now: number) => {
      if (cancelled) return;

      const leg = runLegs[legIndex];
      const legMs = Math.max(leg.ms / Math.max(speed, 0.01), 16);
      const t = Math.min(1, (now - legStart) / legMs);

      if (announced !== legIndex) {
        announced = legIndex;
        leg.onEnter?.();
        onPhaseRef.current?.(leg.phase, legIndex);
      }

      const e = easeInOut(t);
      const position = {
        x: lerp(origin.x, leg.to.x, e),
        y: lerp(origin.y, leg.to.y, e),
      };

      setState({
        position,
        phase: leg.phase,
        legIndex,
        progress: Math.min(1, (elapsedBefore + t * legMs) / totalMs),
      });

      if (t >= 1) {
        elapsedBefore += legMs;
        origin = leg.to;
        legIndex += 1;
        legStart = now;

        if (legIndex >= runLegs.length) {
          onCompleteRef.current?.();
          return;
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // `legs` and `from` are read through refs so a parent re-render mid-journey
    // does not restart it; only toggling `active` or `speed` does.
  }, [active, speed]);

  return state;
}

/**
 * Eases a set of tracked points toward their individual targets every frame.
 *
 * Used by the baggage hall, where each bag is independently assigned a new
 * destination by the sorting logic and should glide there along the belt
 * instead of jumping.
 */
export function useEasedPositions<T extends { id: string; position: Vec2; target?: Vec2 }>(
  items: T[],
  setItems: (updater: (prev: T[]) => T[]) => void,
  active: boolean,
  /** Ground units per second. */
  unitsPerSecond = 110
) {
  const setItemsRef = useRef(setItems);
  setItemsRef.current = setItems;

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let last = performance.now();
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      setItemsRef.current((prev) => {
        let changed = false;
        const next = prev.map((it) => {
          const target = it.target;
          if (!target) return it;

          const dx = target.x - it.position.x;
          const dy = target.y - it.position.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.6) {
            if (dist === 0) return it;
            changed = true;
            return { ...it, position: { ...target } };
          }

          const move = Math.min(dist, unitsPerSecond * dt);
          changed = true;
          return {
            ...it,
            position: {
              x: it.position.x + (dx / dist) * move,
              y: it.position.y + (dy / dist) * move,
            },
          };
        });
        return changed ? next : prev;
      });

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [active, unitsPerSecond]);
}

/**
 * setTimeout with automatic cleanup on unmount.
 *
 * Returns a `schedule` function and cancels everything still pending when the
 * component goes away - the simulations previously leaked timers that kept
 * firing setState after the overlay was closed.
 */
export function useManagedTimers() {
  const timers = useRef<number[]>([]);

  const clearAll = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => clearAll, []);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  return { schedule, clearAll };
}
