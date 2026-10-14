import React from 'react';
import { ISO, iso, isoBox, isoMatrix, isoShadow } from './iso';
import {
  getTailRoute,
  chuteLiftAt,
  getTrunkLength,
  tierLift,
  TIER_LIFT,
  RejectKind,
  RouteKind,
} from './baggageRoutes';
import { routeAt } from './route';

/** Minimal structural shapes - avoids importing back into BaggageOperations. */
interface SceneBag {
  id: string;
  position: { x: number; y: number };
  /** Ground-space direction of travel along the belt. */
  heading?: { x: number; y: number };
  /** Height above the hall floor, computed from the route it is riding. */
  lift?: number;
  /** Tier the bag started on. */
  level?: number;
  /** Arc length travelled, used to spot bags that are at the diverter. */
  dist?: number;
  /** Branch the diverter is throwing it down. */
  routeKind?: RouteKind;
  riskLevel: 'low' | 'medium' | 'high' | 'anomaly';
  screeningStatus: 'pending' | 'screening' | 'cleared' | 'flagged' | 'manual-check' | 'sop-triggered';
  sopTriggered?: boolean;
}

interface SceneMachine {
  id: string;
  status: 'operational' | 'failed' | 'maintenance' | 'overloaded';
  position: { x: number; y: number };
  aiConfidence?: number;
}

interface LevelSegment {
  id: string;
  path: string;
  width: number;
  speed: number;
}

interface Level {
  id: string;
  height: number;
  color: string;
  segments: LevelSegment[];
}

interface Diverter {
  id: string;
  position: { x: number; y: number };
  level: number;
}

interface Station {
  id: string;
  position: { x: number; y: number };
  level: number;
  type: string;
  aiEnabled: boolean;
}

interface Zones {
  [k: string]: { x: number; y: number; width: number; height: number };
}

interface IsoBaggageSceneProps {
  levels: Level[];
  stations: Station[];
  diverters: Diverter[];
  zones: Zones;
  bags: SceneBag[];
  machines: SceneMachine[];
  isSimulating: boolean;
  onElementClick: (elementType: string, elementData: any, event: React.MouseEvent) => void;
}

const TEAL = '#01A3A4';
const GOLD = '#E6B85C';
const RED = '#EF4444';

const CHUTE_STYLE: Record<RejectKind, { bed: string; rail: string; label: string }> = {
  flagged: { bed: '#5A3D0B', rail: '#F59E0B', label: 'REJECT → INSPECTION' },
  anomaly: { bed: '#5C1414', rail: RED, label: 'SOP → RESPONSE BAY' },
};

/**
 * Fallback height for a bag that has not been given one by the simulation.
 * Real height comes from the route (see liftAlongRoute); this only keeps a
 * statically-rendered scene from collapsing everything onto the floor.
 */
const liftForY = (y: number): number => {
  if (y >= 305) return TIER_LIFT[0];
  if (y >= 205) return TIER_LIFT[1];
  return TIER_LIFT[2];
};

const bagFill = (b: SceneBag) =>
  b.screeningStatus === 'pending'
    ? '#8A9BA8'
    : b.screeningStatus === 'screening'
    ? TEAL
    : b.screeningStatus === 'cleared'
    ? '#10B981'
    : b.screeningStatus === 'flagged'
    ? '#F59E0B'
    : b.screeningStatus === 'sop-triggered'
    ? RED
    : '#F59E0B';

const riskFill = (b: SceneBag) =>
  b.riskLevel === 'anomaly'
    ? '#DC2626'
    : b.riskLevel === 'high'
    ? '#F59E0B'
    : b.riskLevel === 'medium'
    ? GOLD
    : '#10B981';

const ZONE_STYLE: Record<string, { label: string; color: string }> = {
  checkin: { label: 'CHECK-IN', color: TEAL },
  manualInspection: { label: 'MANUAL INSPECTION', color: '#F59E0B' },
  sopResponse: { label: 'SOP RESPONSE', color: RED },
  holdArea: { label: 'HOLD AREA', color: '#8A9BA8' },
  approvedArea: { label: 'APPROVED', color: '#10B981' },
};

/**
 * Screen-space polyline for a reject chute, sampled with its height decaying
 * along the slide. Returns the ramp itself, the floor track underneath it and
 * the support posts between the two, which together read as a structure the
 * bag can physically ride down rather than a line painted on the floor.
 */
interface ChuteGeometry {
  ramp: string;
  floor: string;
  posts: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  /** Screen point at the top of the slide, for the signage. */
  head: { x: number; y: number };
}

const buildChute = (level: number, kind: RejectKind): ChuteGeometry => {
  const route = getTailRoute(level, kind);
  const step = 4;
  const ramp: string[] = [];
  const floor: string[] = [];
  const posts: ChuteGeometry['posts'] = [];

  let head = { x: 0, y: 0 };
  let i = 0;
  for (let d = 0; d <= route.total; d += step, i++) {
    const g = routeAt(route, Math.min(d, route.total)).pos;
    const s = iso(g.x, g.y);
    const h = chuteLiftAt(level, d);
    const top = { x: s.x, y: s.y - h };
    if (i === 0) {
      head = top;
      ramp.push(`M${top.x.toFixed(1)},${top.y.toFixed(1)}`);
      floor.push(`M${s.x.toFixed(1)},${s.y.toFixed(1)}`);
    } else {
      ramp.push(`L${top.x.toFixed(1)},${top.y.toFixed(1)}`);
      floor.push(`L${s.x.toFixed(1)},${s.y.toFixed(1)}`);
    }
    // A post every ~20 units, but only while the slide is still off the floor.
    if (h > 2.5 && i % 5 === 0) {
      posts.push({ x1: top.x, y1: top.y + 1, x2: s.x, y2: s.y });
    }
  }

  return { ramp: ramp.join(' '), floor: floor.join(' '), posts, head };
};

/** Cached so the sampling work happens once, not on every animation frame. */
const chuteCache = new Map<string, ChuteGeometry>();
const getChute = (level: number, kind: RejectKind): ChuteGeometry => {
  const key = `${level}:${kind}`;
  let c = chuteCache.get(key);
  if (!c) {
    c = buildChute(level, kind);
    chuteCache.set(key, c);
  }
  return c;
};

const IsoBaggageScene: React.FC<IsoBaggageSceneProps> = ({
  levels,
  stations,
  diverters,
  zones,
  bags,
  machines,
  isSimulating,
  onElementClick,
}) => {
  /** Depth-sorted list of everything standing off the floor. */
  const props3d: Array<{ y: number; key: string; node: React.ReactNode }> = [];

  /**
   * Which way each diverter is currently throwing. A bag counts as "at the
   * diverter" from shortly before the branch point until it is clear of the
   * machine, which is the window the pusher has to be extended for.
   */
  const diverterState = (level: number): { kind: RouteKind; armed: boolean } => {
    const trunk = getTrunkLength(level);
    let kind: RouteKind = 'cleared';
    let armed = false;
    bags.forEach((b) => {
      if ((b.level ?? 1) !== level) return;
      const d = b.dist ?? 0;
      const near = d >= trunk - 46 && d <= trunk + 30;
      if (!near) return;
      const k = b.routeKind ?? 'cleared';
      if (k !== 'cleared') {
        kind = k;
        armed = true;
      }
    });
    return { kind, armed };
  };

  // ------------------------------------------------------------- zones
  Object.entries(zones).forEach(([key, z]) => {
    const style = ZONE_STYLE[key] ?? { label: key.toUpperCase(), color: TEAL };
    const cx = z.x + z.width / 2;
    const cy = z.y + z.height / 2;
    const box = isoBox(cx, cy, z.width, z.height, 10);
    props3d.push({
      y: cy - 0.6, // sit behind machines that share the band
      key: `zone-${key}`,
      node: (
        <g className="cursor-pointer" onClick={(e) => onElementClick('zone', { id: key, ...z }, e)}>
          <polygon points={box.ground} fill={style.color} opacity="0.09" />
          <polygon points={box.right} fill="#04141D" opacity="0.85" />
          <polygon points={box.front} fill="#06202C" opacity="0.9" />
          <polygon
            points={box.top}
            fill={style.color}
            fillOpacity="0.13"
            stroke={style.color}
            strokeOpacity="0.7"
            strokeWidth="1.4"
            strokeDasharray="7,5"
          />
          <text
            x={box.topCenter.x}
            y={box.topCenter.y + 3}
            textAnchor="middle"
            fill={style.color}
            fontSize="8.5"
            fontWeight="800"
            letterSpacing="1.1"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="3"
          >
            {style.label}
          </text>
        </g>
      ),
    });
  });

  // ------------------------------------------------- screening machines
  stations.forEach((st) => {
    const m = machines.find((mm) => mm.id === st.id);
    const status = m?.status ?? 'operational';
    const lift = tierLift(st.level);
    // The box is a fixed-height cabinet; the tier it sits on is applied as a
    // translate, not extra extrusion, otherwise upper-tier units stretch into
    // pillars instead of standing on their deck.
    const box = isoBox(st.position.x, st.position.y, 46, 34, 26);
    const statusColor =
      status === 'operational' ? '#10B981' : status === 'maintenance' ? GOLD : status === 'overloaded' ? '#F59E0B' : RED;

    props3d.push({
      y: st.position.y,
      key: `st-${st.id}`,
      node: (
        <g
          className="cursor-pointer"
          transform={`translate(0, ${-lift})`}
          onClick={(e) => onElementClick('station', { ...st, machine: m }, e)}
        >
          {/* support pedestal down to the hall floor */}
          <polygon
            points={box.ground}
            fill="#04141D"
            opacity="0.9"
            transform={`translate(0, ${lift})`}
          />
          <line
            x1={box.frontCenter.x}
            y1={box.frontCenter.y + 13}
            x2={box.frontCenter.x}
            y2={box.frontCenter.y + 13 + lift}
            stroke="#04141D"
            strokeWidth="20"
            opacity="0.75"
          />
          <polygon points={box.ground} fill="#000" opacity="0.4" filter="url(#bg-blur)" />
          <polygon points={box.right} fill="url(#bg-mach-right)" />
          <polygon points={box.front} fill="url(#bg-mach-front)" />
          <polygon points={box.top} fill="url(#bg-mach-top)" stroke={statusColor} strokeOpacity="0.75" strokeWidth="1.4" />
          {/* scanner aperture glow on the roof */}
          <ellipse
            cx={box.topCenter.x}
            cy={box.topCenter.y}
            rx="13"
            ry="7"
            fill={statusColor}
            opacity={isSimulating ? 0.45 : 0.22}
            className={isSimulating ? 'animate-pulse' : ''}
          />
          {st.aiEnabled && (
            <text
              x={box.topCenter.x}
              y={box.topCenter.y + 3}
              textAnchor="middle"
              fill="#04101F"
              fontSize="7.5"
              fontWeight="900"
              style={{ pointerEvents: 'none' }}
            >
              AI
            </text>
          )}
          <text
            x={box.frontCenter.x}
            y={box.frontCenter.y + 20}
            textAnchor="middle"
            fill="#B8C5D1"
            fontSize="7.5"
            fontWeight="700"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="2.5"
          >
            {st.id}
          </text>
          <circle cx={box.topCenter.x + 20} cy={box.topCenter.y - 9} r="2.4" fill={statusColor} filter="url(#bg-glow)" />
        </g>
      ),
    });
  });

  // ------------------------------------------------------- diverters
  diverters.forEach((d) => {
    const lift = tierLift(d.level);
    const box = isoBox(d.position.x, d.position.y, 34, 30, 14);
    const state = diverterState(d.level);
    const throwing = state.kind !== 'cleared';
    const armColor = state.kind === 'anomaly' ? RED : state.kind === 'flagged' ? '#F59E0B' : TEAL;

    // The pusher travels in the +y ground direction; projecting that vector
    // gives the screen offset, so the paddle slides across the belt rather
    // than straight down the screen.
    const stroke = throwing ? 17 : 0;
    const pushX = ISO.skew * stroke;
    const pushY = ISO.squash * stroke;

    const pad = isoBox(d.position.x, d.position.y - 22, 26, 8, 11);

    props3d.push({
      y: d.position.y - 0.2,
      key: `dv-${d.id}`,
      node: (
        <g
          className="cursor-pointer"
          transform={`translate(0, ${-lift})`}
          onClick={(e) => onElementClick('diverter', { ...d, throwing: state.kind }, e)}
        >
          <polygon points={box.ground} fill="#000" opacity="0.35" filter="url(#bg-blur)" transform={`translate(0, ${lift})`} />
          <polygon points={box.right} fill="#062231" />
          <polygon points={box.front} fill="#0A3346" />
          <polygon
            points={box.top}
            fill="#0E556A"
            stroke={throwing ? armColor : GOLD}
            strokeOpacity="0.9"
            strokeWidth={throwing ? 2 : 1.3}
          />

          {/* Rail the shoe runs along, drawn first so the shoe rides on it. */}
          {[-15, 15].map((off) => {
            const a = iso(d.position.x + off, d.position.y - 24);
            const b = iso(d.position.x + off, d.position.y + 16);
            return (
              <line
                key={`rail-${off}`}
                x1={a.x}
                y1={a.y - 4}
                x2={b.x}
                y2={b.y - 4}
                stroke="#0A3346"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Sorter shoe: parks behind the belt and shoves the bag onto the
              chute when the diverter is throwing a reject. */}
          <g
            transform={`translate(${pushX.toFixed(2)}, ${pushY.toFixed(2)})`}
            style={{ transition: 'transform 0.28s cubic-bezier(0.3, 0, 0.2, 1)' }}
          >
            <polygon points={pad.right} fill="#0B3D52" />
            <polygon points={pad.front} fill={throwing ? armColor : '#12607A'} opacity={throwing ? 0.85 : 1} />
            <polygon points={pad.top} fill={throwing ? armColor : '#1A7C93'} stroke="#04101F" strokeWidth="0.8" />
          </g>

          {/* Which way this sorter is set, right now. */}
          <g transform={`translate(${box.topCenter.x}, ${box.topCenter.y})`}>
            <polygon
              points={throwing ? '-3,-6 3,6 -3,6' : '-6,-3 6,0 -6,3'}
              fill={armColor}
              opacity="0.95"
            />
          </g>
          <text
            x={box.topCenter.x}
            y={box.topCenter.y - 15}
            textAnchor="middle"
            fill={throwing ? armColor : GOLD}
            fontSize="7"
            fontWeight="700"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="2.5"
          >
            {d.id.replace('SMART-', '')}
            {throwing ? ` · ${state.kind === 'anomaly' ? 'SOP' : 'REJECT'}` : ''}
          </text>
          {throwing && (
            <ellipse
              cx={box.topCenter.x}
              cy={box.topCenter.y}
              rx="20"
              ry="12"
              fill="none"
              stroke={armColor}
              strokeWidth="1.4"
              opacity="0.7"
              className="animate-ping"
            />
          )}
        </g>
      ),
    });
  });

  // ------------------------------------------------------------- bags
  bags.forEach((b) => {
    const lift = b.lift ?? liftForY(b.position.y);
    const p = iso(b.position.x, b.position.y);
    const sh = isoShadow(b.position.x, b.position.y, 8, 6);
    const box = isoBox(b.position.x, b.position.y, 15, 11, 9);
    props3d.push({
      y: b.position.y + 0.4,
      key: `bag-${b.id}`,
      node: (
        <g
          className="cursor-pointer"
          transform={`translate(0, ${-lift})`}
          onClick={(e) => onElementClick('bag', b, e)}
          filter={b.sopTriggered ? 'url(#bg-glow-strong)' : undefined}
        >
          <ellipse cx={sh.cx} cy={sh.cy} rx={sh.rx} ry={sh.ry} fill="#000" opacity="0.45" transform={`translate(0, ${lift})`} />
          <polygon points={box.right} fill={bagFill(b)} opacity="0.55" />
          <polygon points={box.front} fill={bagFill(b)} opacity="0.8" />
          <polygon
            points={box.top}
            fill={bagFill(b)}
            stroke={riskFill(b)}
            strokeWidth={b.sopTriggered ? 2 : 1}
          />
          <circle
            cx={box.topCenter.x + 7}
            cy={box.topCenter.y - 3}
            r="1.9"
            fill={riskFill(b)}
            className={b.screeningStatus === 'screening' || b.sopTriggered ? 'animate-pulse' : ''}
          />
          {b.sopTriggered && (
            <circle
              cx={p.x}
              cy={p.y - 8}
              r="14"
              fill="none"
              stroke={RED}
              strokeWidth="1.6"
              opacity="0.7"
              className="animate-ping"
            />
          )}
        </g>
      ),
    });
  });

  props3d.sort((a, b) => a.y - b.y);

  return (
    <svg viewBox="0 0 1000 470" className="w-full h-full" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071028" />
          <stop offset="100%" stopColor="#04101F" />
        </linearGradient>
        <linearGradient id="bg-floor" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#0A2C3E" />
          <stop offset="100%" stopColor="#051724" />
        </linearGradient>
        <linearGradient id="bg-mach-top" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#15637D" />
          <stop offset="100%" stopColor="#0B3D52" />
        </linearGradient>
        <linearGradient id="bg-mach-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0C3546" />
          <stop offset="100%" stopColor="#061C28" />
        </linearGradient>
        <linearGradient id="bg-mach-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#082735" />
          <stop offset="100%" stopColor="#04141D" />
        </linearGradient>
        <radialGradient id="bg-halo" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.14" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-vignette" cx="50%" cy="45%" r="72%">
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>

        {/* animated belt tread */}
        <pattern id="bg-tread" patternUnits="userSpaceOnUse" width="18" height="10">
          <rect width="18" height="10" fill="#1D6A80" />
          <rect x="0" y="0" width="9" height="10" fill="#15505F" />
          {isSimulating && (
            <animateTransform
              attributeName="patternTransform"
              type="translate"
              from="0 0"
              to="18 0"
              dur="0.9s"
              repeatCount="indefinite"
            />
          )}
        </pattern>

        <filter id="bg-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bg-glow-strong" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bg-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1000" height="470" fill="url(#bg-sky)" />
      <ellipse cx="500" cy="380" rx="600" ry="200" fill="url(#bg-halo)" />

      {/* ======================= hall floor ======================= */}
      <g transform={isoMatrix}>
        <polygon
          points="30,70 770,70 770,560 30,560"
          fill="url(#bg-floor)"
          stroke="#0E556A"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <g stroke={TEAL} strokeOpacity="0.06" strokeWidth="1">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`fv-${i}`} x1={30 + i * 49} y1="70" x2={30 + i * 49} y2="560" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`fh-${i}`} x1="30" y1={70 + i * 49} x2="770" y2={70 + i * 49} />
          ))}
        </g>
        {/* floor hazard striping along the inspection corridor */}
        <rect x="330" y="430" width="300" height="6" fill={GOLD} opacity="0.14" />
      </g>

      {/* ================= reject chutes =================
          Drawn in screen space, not on the floor: each one starts at its
          diverter up on the deck and slides down to the hall floor, with
          support posts underneath, so a bag leaving the main run is visibly
          riding a structure down rather than dropping onto a belt below. */}
      {[1, 2, 3].map((lv) =>
        (['anomaly', 'flagged'] as RejectKind[]).map((kind) => {
          const c = getChute(lv, kind);
          const style = CHUTE_STYLE[kind];
          return (
            <g key={`chute-${lv}-${kind}`}>
              {/* footprint on the floor, so the slide reads as leaving the deck */}
              <path
                d={c.floor}
                fill="none"
                stroke="#000"
                strokeOpacity="0.35"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* support posts down to the floor */}
              {c.posts.map((p, i) => (
                <line
                  key={`post-${lv}-${kind}-${i}`}
                  x1={p.x1}
                  y1={p.y1}
                  x2={p.x2}
                  y2={p.y2}
                  stroke="#04141D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              ))}
              {/* chute bed */}
              <path
                d={c.ramp}
                fill="none"
                stroke="#04161F"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={c.ramp}
                fill="none"
                stroke={style.bed}
                strokeOpacity="0.9"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cursor-pointer"
                onClick={(e) => onElementClick('chute', { level: lv, kind, label: style.label }, e)}
              />
              {/* side rails */}
              <path
                d={c.ramp}
                fill="none"
                stroke={style.rail}
                strokeOpacity="0.55"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* travel direction down the slide */}
              <path
                d={c.ramp}
                fill="none"
                stroke={style.rail}
                strokeOpacity={isSimulating ? 0.85 : 0.35}
                strokeWidth="2"
                strokeDasharray="5,13"
                strokeLinecap="round"
              >
                {isSimulating && (
                  <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />
                )}
              </path>
            </g>
          );
        })
      )}

      {/* =================== conveyor tiers =================== */}
      {levels.map((level, li) => {
        const lift = TIER_LIFT[li];
        return (
          <g key={level.id} transform={`translate(0, ${-lift})`}>
            <g transform={isoMatrix}>
              {level.segments.map((seg) => (
                <g key={seg.id}>
                  {/* support legs cast down to the floor */}
                  <path
                    d={seg.path}
                    fill="none"
                    stroke="#04141D"
                    strokeWidth={seg.width + 8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.55"
                    transform={`translate(0, ${lift / 0.6})`}
                  />
                  {/* bed underside */}
                  <path
                    d={seg.path}
                    fill="none"
                    stroke="#04161F"
                    strokeWidth={seg.width + 7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0, 5)"
                  />
                  {/* belt */}
                  <path
                    d={seg.path}
                    fill="none"
                    stroke="url(#bg-tread)"
                    strokeWidth={seg.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer"
                    onClick={(e) => onElementClick('conveyor', { ...seg, level: level.id }, e)}
                  />
                  {/* side rails */}
                  <path
                    d={seg.path}
                    fill="none"
                    stroke={level.color}
                    strokeOpacity="0.85"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* flow direction ticks */}
                  <path
                    d={seg.path}
                    fill="none"
                    stroke={GOLD}
                    strokeOpacity={isSimulating ? 0.7 : 0.25}
                    strokeWidth="1.6"
                    strokeDasharray="4,16"
                    strokeLinecap="round"
                  >
                    {isSimulating && (
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.7s" repeatCount="indefinite" />
                    )}
                  </path>
                </g>
              ))}
            </g>
          </g>
        );
      })}

      {/* =================== depth-sorted props =================== */}
      {props3d.map((p) => (
        <g key={p.key}>{p.node}</g>
      ))}

      {/* ============ live diversion callout ============
          Only shown while a sorter is actually throwing, so it reads as an
          event ("this bag is being pushed down the chute") rather than as
          permanent labelling. */}
      {[1, 2, 3].map((lv) => {
        const state = diverterState(lv);
        if (!state.armed) return null;
        const c = getChute(lv, state.kind === 'anomaly' ? 'anomaly' : 'flagged');
        const tone = state.kind === 'anomaly' ? RED : '#F59E0B';
        return (
          <g key={`sign-${lv}`} style={{ pointerEvents: 'none' }} transform={`translate(${c.head.x + 62}, ${c.head.y - 26})`}>
            <line x1="-52" y1="6" x2="-24" y2="18" stroke={tone} strokeOpacity="0.6" strokeWidth="1" />
            <rect x="-52" y="-9" width="104" height="17" rx="4" fill="#04101F" opacity="0.92" stroke={tone} strokeOpacity="0.75" />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill={state.kind === 'anomaly' ? '#FCA5A5' : '#FCD34D'}
              fontSize="8"
              fontWeight="800"
              letterSpacing="0.4"
            >
              {state.kind === 'anomaly' ? 'DIVERTING → SOP BAY' : 'DIVERTING → INSPECTION'}
            </text>
          </g>
        );
      })}

      {/* =================== tier legend =================== */}
      <g style={{ pointerEvents: 'none' }} transform="translate(820, 18)">
        <rect x="0" y="0" width="164" height="106" rx="8" fill="#04101F" opacity="0.88" stroke={TEAL} strokeOpacity="0.32" />
        <text x="12" y="17" fill="#8A9BA8" fontSize="8" fontWeight="700" letterSpacing="1.4">
          SORTER LEGEND
        </text>
        {levels.map((lv, i) => (
          <g key={`lg-${lv.id}`} transform={`translate(12, ${30 + i * 13})`}>
            <rect x="0" y="-6" width="16" height="7" rx="1.5" fill={lv.color} />
            <text x="24" y="0" fill="#B8C5D1" fontSize="8.5" fontWeight="600">
              Tier {i + 1}
            </text>
            <text x="70" y="0" fill="#8A9BA8" fontSize="8">
              +{TIER_LIFT[i]} deck
            </text>
          </g>
        ))}
        <g transform="translate(12, 82)">
          <rect x="0" y="-6" width="16" height="7" rx="1.5" fill="#F59E0B" />
          <text x="24" y="0" fill="#B8C5D1" fontSize="8">
            Reject chute
          </text>
        </g>
        <g transform="translate(12, 96)">
          <rect x="0" y="-6" width="16" height="7" rx="1.5" fill={RED} />
          <text x="24" y="0" fill="#B8C5D1" fontSize="8">
            SOP chute
          </text>
        </g>
      </g>

      {/* =================== status ribbon =================== */}
      <g style={{ pointerEvents: 'none' }}>
        <rect x="18" y="432" width="290" height="24" rx="12" fill="#04101F" opacity="0.85" stroke={TEAL} strokeOpacity="0.35" />
        <circle cx="36" cy="444" r="4" fill={isSimulating ? '#10B981' : '#8A9BA8'} className={isSimulating ? 'animate-pulse' : ''} />
        <text x="50" y="448" fill="#B8C5D1" fontSize="10.5" fontWeight="600" letterSpacing="0.7">
          {isSimulating ? 'SORTING ACTIVE' : 'SYSTEM STANDBY'} &middot; {bags.length} BAGS TRACKED
        </text>
      </g>

      <rect x="0" y="0" width="1000" height="470" fill="url(#bg-vignette)" style={{ pointerEvents: 'none' }} />
    </svg>
  );
};

export default IsoBaggageScene;
