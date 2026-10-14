/**
 * Airfield plan view.
 *
 * A 2D plan rather than an isometric or 3D scene: it is what airfield
 * electricians and tower staff actually read, and it stays legible with 800+
 * individually addressable fixtures on screen at once.
 *
 * Fixtures are drawn in their Annex 14 photometric colours by default — white
 * runway edges going yellow over the last 600 m, the centreline running white
 * then red/white then red, green thresholds, red ends, green taxiway centreline
 * and blue taxiway edge. Overlays re-colour the same geometry to answer
 * different questions (which circuit, what is still reporting, how bright).
 *
 * Pavement markings are real: threshold bars, designators, aiming points,
 * touchdown zone marks and displaced blast pads, so the plan reads as a runway
 * and not as a rectangle with dots on it.
 */

import React, { useMemo } from 'react';
import { Fixture, CanvasOverlay, LightColour } from '../types';
import { useAglStore } from '../store';
import {
  APRONS,
  RUNWAY_LENGTH,
  RUNWAY_WIDTH,
  TAXIWAYS,

  Pt,
} from '../airfield';

/**
 * Airfield metres → SVG units.
 *
 * Distances along the runway are true to scale. The cross-runway axis is not,
 * and cannot be: a runway is 3000 m long by 45 m wide, so at true aspect it
 * collapses to a hairline and the fixture pattern is unreadable.
 *
 * A single exaggeration factor does not work either. Enough magnification to
 * separate the edge, touchdown-zone and centreline lights (all inside ±25 m)
 * pushes the parallel taxiway at 300 m and the aprons at 660 m far off screen.
 * So the mapping is piecewise: strongly magnified across the runway itself,
 * then compressed almost to true scale beyond it. Near the runway — where every
 * fixture lives — spacing stays proportional, and the layout further out stays
 * on screen.
 */
const Y_BREAK = 80;
const Y_NEAR = 6.5;
const Y_FAR = 1.15;

function mapY(y: number): number {
  const a = Math.abs(y);
  const m = a <= Y_BREAK ? a * Y_NEAR : Y_BREAK * Y_NEAR + (a - Y_BREAK) * Y_FAR;
  return y < 0 ? -m : m;
}

const sx = (x: number) => x;
const sy = (y: number) => -mapY(y);
/** Screen height of the band between two airfield y values (yHi above yLo). */
const spanY = (yHi: number, yLo: number) => sy(yLo) - sy(yHi);
/** Local vertical scale at a given y, for sizing marks drawn at that position. */
const scaleAt = (y: number) => (Math.abs(y) <= Y_BREAK ? Y_NEAR : Y_FAR);

const PHOTOMETRIC: Record<LightColour, string> = {
  white: '#F1F5F9',
  yellow: '#FDE047',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
  red_white: '#F1F5F9',
};

/** Distinct hues for the circuit overlay, one per CCR. */
const CIRCUIT_COLOURS = [
  '#22D3EE', '#F472B6', '#FBBF24', '#4ADE80', '#A78BFA', '#FB923C',
  '#38BDF8', '#F87171', '#34D399', '#E879F9', '#FACC15', '#818CF8',
];

/** Screen-space polyline for a taxiway centreline. */
const pathOf = (points: Pt[]) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p[0])} ${sy(p[1])}`).join(' ');

interface Props {
  overlay: CanvasOverlay;
  routeTags?: Set<string>;
  aircraft?: { x: number; y: number; heading: number } | null;
  papiWhite?: number;
}

const AirfieldCanvas: React.FC<Props> = ({ overlay, routeTags, aircraft, papiWhite }) => {
  const airfield = useAglStore((s) => s.airfield);
  const selectedTag = useAglStore((s) => s.selectedTag);
  const select = useAglStore((s) => s.select);

  const circuitIndex = useMemo(() => {
    const map: Record<string, number> = {};
    airfield.circuits.forEach((c, i) => {
      map[c.id] = i;
    });
    return map;
  }, [airfield.circuits]);

  const fillFor = (f: Fixture): string => {
    // A fixture on the active taxi route always shows as commanded green — the
    // routing command overrides whatever the overlay would otherwise paint.
    if (routeTags?.has(f.id)) return '#22C55E';

    // While a route is lit, taxiway centreline off the route is held down. That
    // is what follow-the-green actually does — the green ahead of the aircraft
    // only means anything if the rest of the taxiway network is not also green.
    if (routeTags && f.category === 'taxiway_centerline') return '#14532D';

    switch (overlay) {
      case 'circuit':
        return CIRCUIT_COLOURS[circuitIndex[f.circuitId] % CIRCUIT_COLOURS.length];
      case 'comms':
        return f.comms === 'silent' ? '#EF4444' : '#2DD4BF';
      case 'intensity': {
        if (f.state !== 'on') return '#334155';
        const ratio = f.intensitySetpoint ? f.intensityActual / f.intensitySetpoint : 0;
        if (ratio > 0.9) return '#FDE047';
        if (ratio > 0.6) return '#FB923C';
        return '#7C2D12';
      }
      case 'serviceability':
        return f.state === 'failed' || f.comms === 'silent' ? '#EF4444' : '#22C55E';
      case 'status':
      default:
        if (f.state === 'failed') return '#EF4444';
        if (f.comms === 'silent') return '#F59E0B';
        if (f.state === 'maintenance') return '#A855F7';
        if (f.state === 'off') return '#475569';
        if (f.colour === 'red_white') return f.seq % 2 === 0 ? '#EF4444' : '#F1F5F9';
        return PHOTOMETRIC[f.colour];
    }
  };

  const isLit = (f: Fixture) => {
    if (routeTags?.has(f.id)) return true;
    // Held-down centreline gets no halo, so the route reads as the only lit path.
    if (routeTags && f.category === 'taxiway_centerline') return false;
    return f.state === 'on' && f.comms === 'reporting';
  };

  const radiusOf = (f: Fixture) => (f.category === 'papi' ? 11 : 5.5);

  /**
   * Fixtures are drawn as two passes — a soft wide halo behind, then the crisp
   * lamp on top. An SVG blur filter per fixture looks the same but costs a
   * filter region for each of 800 lights, which is what makes these plans
   * stutter when a scenario is running.
   */
  const lit = airfield.fixtures.filter(isLit);

  return (
    <svg
      viewBox="-1050 -560 4990 1950"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ background: 'radial-gradient(ellipse at 45% 25%, #0B2438 0%, #040C16 72%)' }}
    >
      <defs>
        <linearGradient id="pavement" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22415B" />
          <stop offset="100%" stopColor="#152B3D" />
        </linearGradient>
        <linearGradient id="taxipave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B3549" />
          <stop offset="100%" stopColor="#122536" />
        </linearGradient>
      </defs>

      {/* ================= Pavement ================= */}

      {/* Taxiways drawn as stroked polylines so the rapid exits keep their
          angle and the crossings read as real pavement intersections. */}
      {TAXIWAYS.map((t) => (
        <path
          key={`pave-${t.id}`}
          d={pathOf(t.points)}
          fill="none"
          stroke="url(#taxipave)"
          strokeWidth={t.width * Y_FAR}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ))}
      {TAXIWAYS.map((t) => (
        <path
          key={`edge-${t.id}`}
          d={pathOf(t.points)}
          fill="none"
          stroke="#2D5674"
          strokeWidth={2}
          strokeLinejoin="round"
          opacity={0.8}
        />
      ))}

      {/* Aprons */}
      {APRONS.map((a) => (
        <g key={a.id}>
          <rect
            x={sx(a.x)}
            y={sy(a.y)}
            width={a.w}
            height={spanY(a.y, a.y - a.h)}
            fill="#16293B"
            stroke="#2D5674"
            strokeWidth={2}
          />
          {Array.from({ length: a.stands }).map((_, k) => {
            const cx = a.x + (a.w / a.stands) * (k + 0.5);
            return (
              <g key={k}>
                {/* Stand lead-in line and stop bar */}
                <line
                  x1={sx(cx)}
                  y1={sy(a.y)}
                  x2={sx(cx)}
                  y2={sy(a.y) + spanY(a.y, a.y - a.h * 0.62)}
                  stroke="#E6B85C"
                  strokeWidth={2.5}
                  opacity={0.55}
                />
                <line
                  x1={sx(cx - 22)}
                  y1={sy(a.y) + spanY(a.y, a.y - a.h * 0.62)}
                  x2={sx(cx + 22)}
                  y2={sy(a.y) + spanY(a.y, a.y - a.h * 0.62)}
                  stroke="#E6B85C"
                  strokeWidth={3}
                  opacity={0.6}
                />
                <text
                  x={sx(cx)}
                  y={sy(a.y) + spanY(a.y, a.y - a.h * 0.62) + 44}
                  fill="#7A93A8"
                  fontSize={30}
                  textAnchor="middle"
                >
                  {`${a.id.split(' ')[1]}${k + 1}`}
                </text>
              </g>
            );
          })}
          <text
            x={sx(a.x + a.w / 2)}
            y={sy(a.y) + spanY(a.y, a.y - a.h) - 20}
            fill="#94A3B8"
            fontSize={40}
            textAnchor="middle"
          >
            {a.id}
          </text>
        </g>
      ))}

      {/* Blast pads / stopways, drawn as chevrons beyond each threshold */}
      {(['09', '27'] as const).map((rwy) => {
        const dir = rwy === '09' ? -1 : 1;
        const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
        return (
          <g key={`blast-${rwy}`} opacity={0.5}>
            {[0, 1, 2].map((i) => {
              const x0 = base + dir * (20 + i * 30);
              return (
                <path
                  key={i}
                  d={`M ${sx(x0)} ${sy(20)} L ${sx(x0 + dir * 22)} ${sy(0)} L ${sx(x0)} ${sy(-20)}`}
                  fill="none"
                  stroke="#7A93A8"
                  strokeWidth={3}
                />
              );
            })}
          </g>
        );
      })}

      {/* Runway */}
      <rect
        x={sx(0)}
        y={sy(RUNWAY_WIDTH / 2)}
        width={RUNWAY_LENGTH}
        height={spanY(RUNWAY_WIDTH / 2, -RUNWAY_WIDTH / 2)}
        fill="url(#pavement)"
        stroke="#3E6B8C"
        strokeWidth={2.5}
      />

      {/* Centreline dashes: 30 m stripe, 20 m gap */}
      <line
        x1={sx(150)}
        y1={sy(0)}
        x2={sx(RUNWAY_LENGTH - 150)}
        y2={sy(0)}
        stroke="#C9D6E2"
        strokeWidth={5}
        strokeDasharray="30 20"
        opacity={0.5}
      />

      {/* Threshold bars, aiming points and touchdown zone marks */}
      {(['09', '27'] as const).map((rwy) => {
        const dir = rwy === '09' ? 1 : -1;
        const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
        return (
          <g key={`marks-${rwy}`}>
            {/* Piano keys */}
            {Array.from({ length: 8 }).map((_, k) => (
              <rect
                key={k}
                x={sx(base + dir * 12) - (dir < 0 ? 45 : 0)}
                y={sy(19.5 - k * 5.4)}
                width={45}
                height={3.2 * scaleAt(0)}
                fill="#D8E3ED"
                opacity={0.72}
              />
            ))}
            {/* Aiming point: two broad bars at 400 m */}
            {[-1, 1].map((side) => (
              <rect
                key={side}
                x={sx(base + dir * 400) - (dir < 0 ? 60 : 0)}
                y={sy(side * 8)}
                width={60}
                height={6 * scaleAt(0)}
                fill="#D8E3ED"
                opacity={0.6}
              />
            ))}
            {/* Touchdown zone marks at 150 m intervals */}
            {[150, 300, 600, 750].map((d) =>
              [-1, 1].map((side) => (
                <rect
                  key={`${d}-${side}`}
                  x={sx(base + dir * d) - (dir < 0 ? 26 : 0)}
                  y={sy(side * 16)}
                  width={26}
                  height={2.6 * scaleAt(0)}
                  fill="#D8E3ED"
                  opacity={0.45}
                />
              ))
            )}
          </g>
        );
      })}

      {/* Runway designators */}
      <text x={sx(260)} y={sy(-16)} fill="#EAF2F8" fontSize={78} fontWeight={700} textAnchor="middle">
        09
      </text>
      <text
        x={sx(RUNWAY_LENGTH - 260)}
        y={sy(-16)}
        fill="#EAF2F8"
        fontSize={78}
        fontWeight={700}
        textAnchor="middle"
      >
        27
      </text>
      <text
        x={sx(RUNWAY_LENGTH / 2)}
        y={sy(34)}
        fill="#E6B85C"
        fontSize={52}
        fontWeight={600}
        textAnchor="middle"
        opacity={0.9}
      >
        Runway 09/27 · 3000 × 45 m
      </text>

      {/* Taxiway designators. The parallel taxiway is labelled at its western
          end so it does not sit on top of connector H, which terminates at the
          eastern end of the same line. */}
      {TAXIWAYS.filter((t) => t.label).map((t) => {
        const p = t.kind === 'parallel' ? t.points[0] : t.points[Math.min(1, t.points.length - 1)];
        return (
          <text
            key={`lbl-${t.id}`}
            x={sx(p[0]) + (t.kind === 'parallel' ? -58 : 46)}
            y={sy(p[1]) - 16}
            fill="#7DD3C0"
            fontSize={44}
            fontWeight={600}
          >
            {t.label}
          </text>
        );
      })}

      {/* Approach and PAPI annotations */}
      {(['09', '27'] as const).map((rwy) => {
        const dir = rwy === '09' ? -1 : 1;
        const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
        const side = rwy === '09' ? 1 : -1;
        return (
          <g key={`ann-${rwy}`}>
            <text
              x={sx(base + dir * 620)}
              y={sy(0) - 70}
              fill="#94A3B8"
              fontSize={38}
              textAnchor="middle"
            >
              {`Approach ${rwy}`}
            </text>
            {/* The PAPI sits 300 m INSIDE the runway from its threshold, not
                out along the approach — so it is offset against the landing
                direction, opposite to the approach annotation above. */}
            <text
              x={sx(base - dir * 300)}
              y={sy(side * 78) + (side > 0 ? -26 : 50)}
              fill="#E2E8F0"
              fontSize={34}
              textAnchor="middle"
              opacity={0.85}
            >
              {`PAPI ${rwy}`}
              {papiWhite !== undefined ? ` — ${papiWhite}W / ${4 - papiWhite}R` : ''}
            </text>
          </g>
        );
      })}

      {/* ================= Fixtures ================= */}

      {/* Halo pass */}
      <g opacity={0.32}>
        {lit.map((f) => (
          <circle
            key={`h-${f.id}`}
            cx={sx(f.x)}
            cy={sy(f.y)}
            r={radiusOf(f) * 2.6}
            fill={fillFor(f)}
          />
        ))}
      </g>

      {/* Lamp pass */}
      <g>
        {airfield.fixtures.map((f) => {
          const r = radiusOf(f);
          const selected = selectedTag === f.id;
          return (
            <g key={f.id}>
              {selected && (
                <circle
                  cx={sx(f.x)}
                  cy={sy(f.y)}
                  r={r + 20}
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth={5}
                />
              )}
              <circle
                cx={sx(f.x)}
                cy={sy(f.y)}
                r={r}
                fill={fillFor(f)}
                opacity={isLit(f) ? 1 : 0.5}
                style={{ cursor: 'pointer' }}
                onClick={() => select(f.id)}
              />
              {/* Silent fixtures get a ring so a comms loss stays visually
                  distinct from a failed lamp under any overlay. */}
              {f.comms === 'silent' && (
                <circle
                  cx={sx(f.x)}
                  cy={sy(f.y)}
                  r={r + 10}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={3.5}
                  strokeDasharray="7 6"
                />
              )}
            </g>
          );
        })}
      </g>

      {/* ================= Aircraft ================= */}
      {aircraft && (
        <g transform={`translate(${sx(aircraft.x)} ${sy(aircraft.y)}) rotate(${aircraft.heading})`}>
          <path
            d="M 0 -34 L 9 -6 L 46 10 L 46 20 L 9 12 L 9 26 L 20 34 L 20 40 L 0 35 L -20 40 L -20 34 L -9 26 L -9 12 L -46 20 L -46 10 L -9 -6 Z"
            fill="#F1F5F9"
            stroke="#0F172A"
            strokeWidth={2}
            transform="rotate(90) scale(2.4)"
          />
        </g>
      )}
    </svg>
  );
};

export default AirfieldCanvas;
