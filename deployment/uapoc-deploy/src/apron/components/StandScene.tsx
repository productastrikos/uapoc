/**
 * The stand, drawn as one scene.
 *
 * ── Why this is a single SVG ───────────────────────────────────────────────
 * The aircraft and the airbridge used to be separate DOM elements: the aircraft
 * a silhouette that slid down the stand, the bridge a rigid bar rotated by a
 * fixed number of degrees. They lived in different coordinate spaces, so the
 * bridge could never actually reach the aircraft door — it swung to a hardcoded
 * angle and stopped wherever that put it, which is exactly the "not attaching
 * properly" the operator saw.
 *
 * Here both are in one space, so the bridge is *solved* rather than posed: the
 * L1 door position is computed from where the aircraft actually is, and the
 * bridge geometry is derived from the line between the rotunda and that door.
 * Dock a different aircraft type, or catch it mid-approach, and the bridge is
 * still pointing at the door because there is nothing else it can do.
 *
 * ── The bridge is a real mechanism ─────────────────────────────────────────
 * A passenger boarding bridge is not one beam. It is a rotunda fixed to the
 * terminal, two telescoping tunnel sections, a lift column carrying the outer
 * section, and a cab at the end that rotates independently to square up to the
 * fuselage. Each of those is drawn, and the telescope extends by the amount the
 * distance actually demands — so a stand that is parked reads as retracted, and
 * one that is working reads as extended.
 *
 * Plan view, light from the top-left, matching the AGL airfield plan so the two
 * consoles shade the world the same way.
 */

import React from 'react';
import type { Stand } from '../types';

/**
 * Scene box.
 *
 * Landscape, and drawn to the card's real proportions. It was portrait and
 * stretched to fit, which widened the aeroplane by about two to one — the
 * single biggest reason the old graphic looked wrong. `preserveAspectRatio` is
 * left at its default now, so nothing is distorted.
 */
const W = 200;
const H = 104;

/** Stand centreline, and where the nose stops. */
const CX = 122;
const STOP_Y = 14;

/** Terminal face runs down the left edge; the rotunda is fixed to it. */
const ROTUNDA = { x: 20, y: 34 };

/** Aircraft plan-view scale, local units → scene units. */
const K = 0.58;

/**
 * Wingspan and length by type, to scale.
 *
 * An A330 on a stand should visibly be a bigger aeroplane than an ATR 72 — it
 * is the whole reason stand allocation exists, and drawing every type at one
 * size quietly throws that away.
 */
const TYPE_SIZE: Record<string, { span: number; len: number }> = {
  'ATR 72': { span: 0.62, len: 0.66 },
  'A320': { span: 0.86, len: 0.88 },
  'A321': { span: 0.86, len: 1 },
  'B737-800': { span: 0.84, len: 0.9 },
  'B738 MAX': { span: 0.88, len: 0.92 },
  'A330': { span: 1.18, len: 1.24 },
};

interface Props {
  stand: Stand;
  /** 0 = on stand, 1 = at the start of the approach. */
  travel: number;
  pbbFault: boolean;
  beaconOn: boolean;
}

const StandScene: React.FC<Props> = ({ stand, travel, pbbFault, beaconOn }) => {
  const size = TYPE_SIZE[stand.aircraftType ?? 'A320'] ?? TYPE_SIZE.A320;
  const sx = K * size.span;
  const sy = K * size.len;

  // Nose sits on the stop bar when parked and backs down the lead-in line as
  // the approach runs.
  const noseY = STOP_Y + travel * 48;
  const acY = noseY + 40 * sy;

  // L1 door: forward, port side. In the aircraft's own frame the fuselage runs
  // -40 (nose) to +32 (tail) and is about 9 wide.
  const doorX = CX - 4.6 * sx;
  const doorY = acY - 24 * sy;

  // ── Bridge solve ─────────────────────────────────────────────────────────
  // Docked: reach the door. Otherwise: parked along the terminal face, short.
  const docked = stand.contact && stand.occupied && stand.chocksOn;
  const targetX = docked ? doorX : ROTUNDA.x + 24;
  const targetY = docked ? doorY : ROTUNDA.y + 22;

  const dx = targetX - ROTUNDA.x;
  const dy = targetY - ROTUNDA.y;
  const reach = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // The cab stops short of the fuselage skin — a bridge docks against the door
  // surround, it does not overlap the aeroplane.
  const tunnelLen = Math.max(16, reach - 5);
  const fixedLen = Math.min(tunnelLen * 0.58, 26);
  const extLen = Math.max(6, tunnelLen - fixedLen);

  const bridgeSkin = pbbFault ? '#FCA5A5' : '#D7DEE6';
  const bridgeShade = pbbFault ? '#B03B3B' : '#8A98A6';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="ss-apron" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#1E4260" />
          <stop offset="45%" stopColor="#17324A" />
          <stop offset="100%" stopColor="#0B1620" />
        </linearGradient>
        <linearGradient id="ss-tunnel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="45%" stopColor={bridgeSkin} />
          <stop offset="100%" stopColor={bridgeShade} />
        </linearGradient>
        <linearGradient id="ss-fuse" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E4EAF1" />
          <stop offset="100%" stopColor="#AEBAC7" />
        </linearGradient>
        <filter id="ss-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#ss-apron)" />

      {/* Terminal face — the thing the bridge is bolted to. */}
      <rect x={0} y={0} width={16} height={H} fill="#0C1A28" />
      <rect x={15} y={0} width={1.4} height={H} fill="#2A6E80" opacity={0.55} />

      {/* Painted bay number, sunk into the tarmac. */}
      <text
        x={CX} y={H * 0.74} textAnchor="middle" fontSize={40} fontWeight={900}
        fill="#FFFFFF" opacity={0.04} style={{ letterSpacing: '-2px' }}
      >
        {(stand.name.replace(/\D/g, '') || '0').padStart(2, '0')}
      </text>

      {/* Lead-in line and stop bar. */}
      <line x1={CX} y1={STOP_Y} x2={CX} y2={H - 4} stroke="#000" strokeOpacity={0.5} strokeWidth={1.6} strokeDasharray="5 4" transform="translate(1 1)" />
      <line x1={CX} y1={STOP_Y} x2={CX} y2={H - 4} stroke="#C9B37A" strokeOpacity={0.7} strokeWidth={1.2} strokeDasharray="5 4" />
      <rect x={CX - 11} y={STOP_Y - 1.4} width={22} height={2.8} rx={1} fill="#000" opacity={0.5} transform="translate(1 1)" />
      <rect x={CX - 11} y={STOP_Y - 1.4} width={22} height={2.8} rx={1} fill="#FBBF24" />

      {/* ── Aircraft ────────────────────────────────────────────────────────
          Drawn as an airliner rather than a single silhouette path: fuselage,
          swept wing, underslung nacelles, tailplane and fin. It is a plan view,
          so it reads at this size the way an apron camera would show it. */}
      {stand.occupied && (
        <g transform={`translate(${CX} ${acY}) scale(${sx} ${sy})`}>
          {/* cast shadow */}
          <g transform="translate(3 4)" opacity={0.45} filter="url(#ss-soft)">
            <path d="M -46 12 L -8 2 L -8 -30 L 0 -41 L 8 -30 L 8 2 L 46 12 L 46 19 L 8 11 L 8 24 L 20 33 L 20 38 L 0 33 L -20 38 L -20 33 L -8 24 L -8 11 L -46 19 Z" fill="#000" />
          </g>

          {/* wing */}
          <path d="M -46 12 L -8 -2 L 8 -2 L 46 12 L 46 19 L 8 8 L -8 8 L -46 19 Z" fill="#CBD5E1" stroke="#334155" strokeWidth={1.1} />
          <path d="M -46 12 L -8 -2 L 8 -2 L 46 12 L 46 14 L 8 2 L -8 2 L -46 14 Z" fill="#FFFFFF" opacity={0.42} />

          {/* engines */}
          {[-24, 24].map((ex) => (
            <g key={ex}>
              <rect x={ex - 4} y={2} width={8} height={12} rx={3.4} fill="#94A3B8" stroke="#334155" strokeWidth={0.9} />
              <rect x={ex - 4} y={2} width={8} height={4} rx={2} fill="#FFFFFF" opacity={0.4} />
            </g>
          ))}

          {/* tailplane */}
          <path d="M -17 30 L 0 24 L 17 30 L 17 34 L 0 30 L -17 34 Z" fill="#CBD5E1" stroke="#334155" strokeWidth={1} />

          {/* fuselage */}
          <path
            d="M 0 -41 C 4.6 -36 6 -30 6 -24 L 6 26 C 6 30 4 33 0 34 C -4 33 -6 30 -6 26 L -6 -24 C -6 -30 -4.6 -36 0 -41 Z"
            fill="url(#ss-fuse)" stroke="#334155" strokeWidth={1.2}
          />
          {/* cabin windows, as one dashed line — individual circles turn to mush */}
          <line x1={0} y1={-22} x2={0} y2={20} stroke="#5B7186" strokeWidth={1.4} strokeDasharray="1.4 2.6" opacity={0.7} />

          {/* fin */}
          <path d="M 0 20 L 3.2 34 L 0 36 L -3.2 34 Z" fill="#E2E8F0" stroke="#334155" strokeWidth={0.9} />

          {/* L1 door — the thing the bridge aims at */}
          <rect x={-6.4} y={-26} width={1.8} height={5} rx={0.7} fill={docked ? '#34D399' : '#64748B'} />

          {/* nav lights and anti-collision beacon */}
          <circle cx={-46} cy={15.5} r={2} fill="#EF4444" />
          <circle cx={46} cy={15.5} r={2} fill="#22C55E" />
          {beaconOn && <circle cx={0} cy={0} r={2.4} fill="#FBBF24" className="animate-pulse" />}
        </g>
      )}

      {/* ── Passenger boarding bridge ───────────────────────────────────────
          Rotunda, fixed tunnel, telescoping outer tunnel, lift column, cab.
          Everything is derived from `reach`, so the mechanism extends and
          swings to wherever the door actually is. */}
      {stand.contact && (
        <g transform={`translate(${ROTUNDA.x} ${ROTUNDA.y}) rotate(${angle})`} style={{ transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)' }}>
          {/* cast shadow for the whole assembly */}
          <g transform="translate(2.5 3.5)" opacity={0.5} filter="url(#ss-soft)">
            <rect x={0} y={-3.6} width={tunnelLen} height={7.2} rx={1.6} fill="#000" />
          </g>

          {/* fixed tunnel, from the rotunda */}
          <rect x={0} y={-3.6} width={fixedLen} height={7.2} rx={1.6} fill="url(#ss-tunnel)" stroke="#2B3947" strokeWidth={0.7} />
          {/* telescoping outer tunnel, slightly narrower so the overlap reads */}
          <rect
            x={fixedLen - 3} y={-2.8} width={extLen + 3} height={5.6} rx={1.3}
            fill="url(#ss-tunnel)" stroke="#2B3947" strokeWidth={0.7}
            style={{ transition: 'width 700ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* bellows joint where the two sections meet */}
          <rect x={fixedLen - 3.4} y={-3} width={2.2} height={6} fill={bridgeShade} opacity={0.85} />

          {/* lift column carrying the outer tunnel — the bogie under a real PBB */}
          <g transform={`translate(${fixedLen + extLen * 0.5} 0)`}>
            <rect x={-1.2} y={3.2} width={2.4} height={4.4} fill="#5A6675" />
            <rect x={-3.4} y={7.2} width={6.8} height={2.4} rx={1.2} fill="#3F4A57" stroke="#22303C" strokeWidth={0.5} />
          </g>

          {/* rotunda at the terminal end */}
          <circle r={5} fill={pbbFault ? '#EF4444' : '#CBD5E1'} stroke="#2B3947" strokeWidth={0.9} />
          <circle r={2.2} fill="#8A98A6" opacity={0.9} />

          {/* cab — rotates back square to the fuselage, as the real one does */}
          <g transform={`translate(${tunnelLen} 0) rotate(${-angle})`} style={{ transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)' }}>
            <rect x={-4} y={-5} width={8} height={10} rx={2} fill={bridgeSkin} stroke="#2B3947" strokeWidth={0.8} />
            <rect x={-4} y={-5} width={8} height={3.4} rx={1.6} fill="#FFFFFF" opacity={0.45} />
            {/* canopy seal that presses onto the door surround */}
            <rect x={2.6} y={-3.4} width={2.4} height={6.8} rx={1} fill={docked ? '#34D399' : '#64748B'} opacity={0.95} />
          </g>
        </g>
      )}

      {/* Equipment ground marks, so the apron is not empty tarmac. */}
      <g opacity={0.5}>
        <rect x={CX + 44} y={H - 30} width={10} height={5} rx={1.2} fill="#26405A" stroke="#0B1620" strokeWidth={0.6} />
        <rect x={CX + 44} y={H - 21} width={10} height={5} rx={1.2} fill="#26405A" stroke="#0B1620" strokeWidth={0.6} />
      </g>
    </svg>
  );
};

export default StandScene;
