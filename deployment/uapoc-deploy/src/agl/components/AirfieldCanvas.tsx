/**
 * Airfield plan view — Ngurah Rai (WADD / DPS), Bali.
 *
 * True to scale in both axes, with pan and zoom, on the real surveyed pavement.
 * Professional airfield displays do not distort an axis to fit a panel, because
 * that turns the plan into a diagram; the operator zooms instead.
 *
 * The view is strictly 2D but is shaded to read as relief. A single fixed light
 * from the north-west drives every cue: buildings are extruded with cast
 * shadows and a rim highlight, pavement is bevelled and sits in its own contact
 * shadow, and lit fixtures bloom in proportion to their real photometric output.
 *
 * Design conventions follow the systems this replaces:
 *
 *   - Pavement is surface, not centreline strokes. Round joins give the flared
 *     junctions a real airfield has.
 *   - ISA-101 palette: desaturated greys, so the only saturated colour on
 *     screen is a light or an alarm.
 *   - A fault CHANGES SHAPE, never colour. Red is a valid photometric state for
 *     a runway end light, so a red "fault" would be ambiguous. Failures go
 *     hollow with a magenta box; a fixture that stopped answering gets a cross.
 *   - Barrettes, stop bars and crossbars render as bars, not dot clusters.
 *   - Level of detail: edge lighting, markings and labels drop out when zoomed
 *     out, where they would only be noise.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fixture, CanvasOverlay, LightColour } from '../types';
import { useAglStore } from '../store';
import { BLOOM, HEIGHTS, shadowTransform } from './depth';
import {
  AIRPORT,
  APRON_POLYGONS,
  EXTENT,
  OTHER_FEATURES,
  RUNWAY_CENTRELINE,
  RUNWAY_WIDTH,
  RUNWAY_LENGTH,
  TAXIWAY_LINES,
  TERMINAL_POLYGONS,
  isStandLeadIn,
  Pt,
} from '../airfield';

/* ── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  sky: '#06080A',
  grass: '#0C1210',
  grassLit: '#141C18',
  runway: '#414141',
  runwayLit: '#4E4E4E',
  taxiway: '#282828',
  taxiwayLit: '#333333',
  apron: '#1D2023',
  terminalRoof: '#232830',
  terminalRoofLit: '#2E353F',
  terminalSide: '#0E1114',
  building: '#1D2227',
  contact: '#000000',
  marking: '#D2D7DC',
  label: '#8FA3B0',
  labelBright: '#CFDDE6',
  fault: '#FF3EA5',
  silent: '#A7B2BC',
};

const PHOTOMETRIC: Record<LightColour, string> = {
  white: '#FFFFFF',
  yellow: '#FFD84D',
  green: '#33E572',
  red: '#FF4A4A',
  blue: '#4B86FF',
  red_white: '#FFFFFF',
};

const CIRCUIT_COLOURS = [
  '#22D3EE', '#F472B6', '#FBBF24', '#4ADE80', '#A78BFA', '#FB923C', '#38BDF8',
  '#F87171', '#34D399', '#E879F9', '#FACC15', '#818CF8', '#2DD4BF',
];

/**
 * Only the stop bar is drawn as a bar.
 *
 * A barrette is a GROUP of three lights, and three are already generated per
 * station — so drawing each individual lamp as a bar produced one fat pill per
 * lamp and three overlapping pills per barrette. Rendered as small points at
 * their true spacing, the three lamps form the barrette themselves, which is
 * both more accurate and much more legible. A stop bar genuinely is one
 * continuous illuminated bar across the taxiway, so it keeps the bar form.
 */
const BAR_CATEGORIES = new Set(['stopbar']);

const poly = (pts: Pt[]) => pts.map((p) => `${p[0]},${p[1]}`).join(' ');
const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');

interface View { x: number; y: number; w: number; h: number }

interface Props {
  overlay: CanvasOverlay;
  routeTags?: Set<string>;
  aircraft?: { x: number; y: number; heading: number } | null;
  papiWhite?: number;
}

const PAD = 140;
const FULL: View = {
  x: EXTENT.minX - PAD,
  y: -(EXTENT.maxY + PAD),
  w: EXTENT.maxX - EXTENT.minX + PAD * 2,
  h: EXTENT.maxY - EXTENT.minY + PAD * 2,
};

const AirfieldCanvas: React.FC<Props> = ({ overlay, routeTags, aircraft, papiWhite }) => {
  const airfield = useAglStore((s) => s.airfield);
  const selectedTag = useAglStore((s) => s.selectedTag);
  const select = useAglStore((s) => s.select);

  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(FULL);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const zoom = FULL.w / view.w;

  /**
   * Metres per CSS pixel. Symbols are specified in pixels and converted through
   * this, so a lamp stays the same size on screen at every zoom instead of
   * ballooning to metres across when zoomed in.
   */
  const [elWidth, setElWidth] = useState(1200);
  const mpp = view.w / elWidth;
  /** Pixels → world metres, so a lamp holds a constant size on screen. */
  const px = useCallback((n: number) => n * mpp, [mpp]);
  /** Legacy text scale, still keyed to the view so labels track zoom. */
  const k = view.w / 3800;

  const circuitIndex = useMemo(() => {
    const m: Record<string, number> = {};
    airfield.circuits.forEach((c, i) => { m[c.id] = i; });
    return m;
  }, [airfield.circuits]);

  /* ── Pan and zoom ──────────────────────────────────────────────────────── */

  /**
   * Wheel zoom, bound natively rather than through React's `onWheel`.
   *
   * React registers wheel listeners passively at the root, so `preventDefault`
   * inside a synthetic handler is ignored and the page scrolls behind the map.
   * A native listener with `{ passive: false }` is the only way to keep the
   * gesture inside the canvas.
   */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const p = {
        x: view.x + ((e.clientX - r.left) / r.width) * view.w,
        y: view.y + ((e.clientY - r.top) / r.height) * view.h,
      };
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
      const w = Math.max(120, Math.min(FULL.w * 1.4, view.w * factor));
      const h = w * (view.h / view.w);
      setView({
        w,
        h,
        x: p.x - ((p.x - view.x) / view.w) * w,
        y: p.y - ((p.y - view.y) / view.h) * h,
      });
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [view]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    // Snapshot the drag origin before updating state. The state updater runs
    // asynchronously, and a pointer-up between this call and React processing
    // it clears `drag.current` — reading it inside the updater then throws on
    // null. This was the "Cannot read properties of null (reading 'vx')" crash.
    const origin = drag.current;
    const dx = ((e.clientX - origin.x) / r.width) * view.w;
    const dy = ((e.clientY - origin.y) / r.height) * view.h;
    setView((v) => ({ ...v, x: origin.vx - dx, y: origin.vy - dy }));
  };

  const endDrag = () => { drag.current = null; };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        setElWidth(r.width);
        setView((v) => ({ ...v, h: v.w * (r.height / r.width) }));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Fixture appearance ────────────────────────────────────────────────── */

  const baseColour = (f: Fixture): string => {
    if (routeTags?.has(f.id)) return PHOTOMETRIC.green;
    if (routeTags && f.category === 'taxiway_centerline') return '#15532E';

    switch (overlay) {
      case 'circuit':
        return CIRCUIT_COLOURS[circuitIndex[f.circuitId] % CIRCUIT_COLOURS.length];
      case 'comms':
        return f.comms === 'silent' ? C.fault : '#2DD4BF';
      case 'intensity': {
        if (f.state !== 'on') return '#3A3A3A';
        const r = f.intensitySetpoint ? f.intensityActual / f.intensitySetpoint : 0;
        return r > 0.9 ? '#FFD84D' : r > 0.6 ? '#FB923C' : '#7C2D12';
      }
      case 'serviceability':
        return f.state === 'failed' || f.comms === 'silent' ? C.fault : PHOTOMETRIC.green;
      default:
        if (f.colour === 'red_white') return f.seq % 2 === 0 ? PHOTOMETRIC.red : PHOTOMETRIC.white;
        return PHOTOMETRIC[f.colour];
    }
  };

  const isLit = (f: Fixture) => {
    if (routeTags?.has(f.id)) return true;
    if (routeTags && f.category === 'taxiway_centerline') return false;
    return f.state === 'on' && f.comms === 'reporting';
  };

  /* ── Level of detail ─────────────────────────────────────────────────────
     Every fixture is drawn as its own lamp at every zoom — this is a lighting
     control display, and an operator reads it lamp by lamp. Legibility comes
     from keeping the lamp itself small and crisp and the halo tight, not from
     collapsing runs into lines. */
  const showEdgeLights = zoom > 1.5;
  const showLabels = zoom > 0.75;
  const showMarkings = zoom > 1.2;
  const showStandDetail = zoom > 3;

  const visible = useMemo(() => {
    const x0 = view.x - 200;
    const x1 = view.x + view.w + 200;
    const y0 = -(view.y + view.h) - 200;
    const y1 = -view.y + 200;
    return airfield.fixtures.filter((f) => {
      if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) return false;
      // Taxiway edge lighting is the one class held back when zoomed out — 95
      // blue lamps flanking every centreline is clutter at field scale. An
      // abnormal one is still shown, because a fault must never be hidden.
      const abnormal = f.state !== 'on' || f.comms === 'silent';
      if (!showEdgeLights && f.category === 'taxiway_edge' && !abnormal) return false;
      return true;
    });
  }, [airfield.fixtures, view, showEdgeLights]);

  const litFixtures = visible.filter(isLit);
  /** Only bright classes get the wide outer halo — see BLOOM. */
  const haloFixtures = litFixtures.filter((f) => (BLOOM[f.category] ?? 0) > 0.45);

  const resetView = () => setView(FULL);

  const runwayW = RUNWAY_WIDTH;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="w-full h-full touch-none"
        style={{ background: C.sky, cursor: drag.current ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <defs>
          {/* Ground mottle. One filter on one rect — cheap, unlike a filter per
              fixture, which is what makes these plans stutter. */}
          <filter id="groundTex" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={7} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope="0.055" /></feComponentTransfer>
          </filter>

          {/* Soft cast shadow used by raised structures. */}
          <filter id="castShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>

          {/* Runway surface, lit from the north-west. */}
          <linearGradient id="rwyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.runwayLit} />
            <stop offset="55%" stopColor={C.runway} />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>
          <linearGradient id="twyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.taxiwayLit} />
            <stop offset="60%" stopColor={C.taxiway} />
            <stop offset="100%" stopColor="#1E1E1E" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={C.terminalRoofLit} />
            <stop offset="100%" stopColor={C.terminalRoof} />
          </linearGradient>

          {/* Apron reads as floodlit rather than flat. */}
          <radialGradient id="apronLit" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0%" stopColor="#2A2F34" />
            <stop offset="100%" stopColor={C.apron} />
          </radialGradient>

          {/* Edge vignette, so the field sits in space rather than on a slab. */}
          <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.78">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* World is drawn in airfield metres with north up, so flip y once. */}
        <g transform="scale(1,-1)">
          {/* ── Ground ──────────────────────────────────────────────────── */}
          <rect
            x={EXTENT.minX - PAD * 3} y={EXTENT.minY - PAD * 3}
            width={EXTENT.maxX - EXTENT.minX + PAD * 6}
            height={EXTENT.maxY - EXTENT.minY + PAD * 6}
            fill={C.grass}
          />
          <rect
            x={EXTENT.minX - PAD * 3} y={EXTENT.minY - PAD * 3}
            width={EXTENT.maxX - EXTENT.minX + PAD * 6}
            height={EXTENT.maxY - EXTENT.minY + PAD * 6}
            fill={C.grassLit}
            filter="url(#groundTex)"
          />

          {/* ── Pavement ────────────────────────────────────────────────────
              Three passes give the slab relief: a blurred contact shadow that
              grounds it, the surface itself, then a fine rim on the lit edge. */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Contact shadow */}
            <g stroke={C.contact} opacity={0.55} filter="url(#castShadow)">
              {TAXIWAY_LINES.map((t, i) => (
                <path key={i} d={path(t.points)} strokeWidth={(t.lane ? 19 : 25) + 12} />
              ))}
              <path d={path(RUNWAY_CENTRELINE)} strokeWidth={runwayW + 16} strokeLinecap="butt" />
            </g>

            {/* Surface */}
            <g stroke="url(#twyGrad)">
              {TAXIWAY_LINES.map((t, i) => (
                <path key={i} d={path(t.points)} strokeWidth={t.lane ? 19 : 25} />
              ))}
            </g>

            {/* Rim light on the north-west edge */}
            <g stroke="#3E3E3E" opacity={0.55} transform="translate(-1.4 1.1)">
              {TAXIWAY_LINES.map((t, i) => (
                <path key={i} d={path(t.points)} strokeWidth={t.lane ? 19 : 25} />
              ))}
            </g>
            <g stroke="url(#twyGrad)">
              {TAXIWAY_LINES.map((t, i) => (
                <path key={i} d={path(t.points)} strokeWidth={(t.lane ? 19 : 25) - 2.4} />
              ))}
            </g>
          </g>

          {/* Aprons */}
          {APRON_POLYGONS.map((p, i) => (
            <g key={i}>
              <polygon points={poly(p)} fill={C.contact} opacity={0.5}
                       transform="translate(6 -6)" filter="url(#castShadow)" />
              <polygon points={poly(p)} fill="url(#apronLit)" stroke="#3A4048" strokeWidth={1.6} />
            </g>
          ))}

          {/* Stand lead-in lines — painted guidance to each stand. Drawn ON TOP
              of the apron surface, since they are markings on it. */}
          <g fill="none" stroke="#C4A24A" strokeWidth={1.4}
             strokeLinecap="round" opacity={0.7}>
            {TAXIWAY_LINES.map((t, i) =>
              isStandLeadIn(t.points) ? <path key={i} d={path(t.points)} /> : null
            )}
          </g>

          {/* ── Runway ──────────────────────────────────────────────────── */}
          <path d={path(RUNWAY_CENTRELINE)} fill="none" stroke="url(#rwyGrad)"
                strokeWidth={runwayW} strokeLinecap="butt" />
          {/* Shoulder bevel: light on the north side, dark on the south. */}
          <path d={path(RUNWAY_CENTRELINE)} fill="none" stroke="#5C5C5C"
                strokeWidth={2.4} strokeLinecap="butt"
                transform={`translate(0 ${runwayW / 2 - 1.2})`} opacity={0.8} />
          <path d={path(RUNWAY_CENTRELINE)} fill="none" stroke="#111111"
                strokeWidth={3} strokeLinecap="butt"
                transform={`translate(0 ${-runwayW / 2 + 1.5})`} opacity={0.75} />

          {/* ── Runway markings ─────────────────────────────────────────── */}
          {showMarkings && (
            <g>
              <path d={path(RUNWAY_CENTRELINE)} fill="none" stroke={C.marking}
                    strokeWidth={0.9} strokeDasharray="30 20" opacity={0.8} />
              {(['09', '27'] as const).map((rwy) => {
                const dir = rwy === '09' ? 1 : -1;
                const base = rwy === '09' ? 0 : RUNWAY_LENGTH;
                return (
                  <g key={rwy}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <rect key={i} x={base + dir * 12 - (dir < 0 ? 30 : 0)}
                            y={-19.5 + i * 5.4} width={30} height={1.8}
                            fill={C.marking} opacity={0.9} />
                    ))}
                    {[-1, 1].map((s) => (
                      <rect key={s} x={base + dir * 400 - (dir < 0 ? 45 : 0)}
                            y={s * 8 - 3} width={45} height={4}
                            fill={C.marking} opacity={0.8} />
                    ))}
                    {[150, 300, 600, 750].map((d) => [-1, 1].map((s) => (
                      <rect key={`${d}${s}`} x={base + dir * d - (dir < 0 ? 20 : 0)}
                            y={s * 15 - 1} width={20} height={1.6}
                            fill={C.marking} opacity={0.65} />
                    )))}
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Structures ──────────────────────────────────────────────────
              Extruded: a blurred cast shadow, then dark flanks smeared toward
              the light to fake the wall faces, then the roof on top. */}
          {TERMINAL_POLYGONS.map((p, i) => (
            <g key={`t${i}`}>
              <polygon points={poly(p)} fill={C.contact} opacity={0.62}
                       transform={shadowTransform(HEIGHTS.terminal, 1.35)}
                       filter="url(#castShadow)" />
              <polygon points={poly(p)} fill={C.terminalSide}
                       transform={shadowTransform(HEIGHTS.terminal, 0.42)} />
              <polygon points={poly(p)} fill="url(#roofGrad)"
                       stroke="#4A535E" strokeWidth={1.2} />
            </g>
          ))}

          {OTHER_FEATURES.map((o, i) => {
            const h = HEIGHTS[o.kind] ?? 8;
            return (
              <g key={`o${i}`}>
                <polygon points={poly(o.points)} fill={C.contact} opacity={0.6}
                         transform={shadowTransform(h, 1.35)} filter="url(#castShadow)" />
                <polygon points={poly(o.points)} fill={C.terminalSide}
                         transform={shadowTransform(h, 0.42)} />
                <polygon points={poly(o.points)}
                         fill={o.kind === 'jet_bridge' ? '#333A42' : C.building}
                         stroke="#4A535E" strokeWidth={0.9} />
              </g>
            );
          })}

          {/* ── Lighting ────────────────────────────────────────────────────
              Three passes: a wide halo for the bright classes only, a mid glow,
              then the lamp. Layered circles rather than a blur filter, because
              a filter region per fixture at two thousand lamps is what kills
              the frame rate. */}
          <g>
            <g opacity={0.22}>
              {haloFixtures.map((f) => (
                <circle key={`h${f.id}`} cx={f.x} cy={f.y}
                        r={px((f.category === 'papi' ? 3.2 : 4.2) * (BLOOM[f.category] ?? 0.5))}
                        fill={baseColour(f)} />
              ))}
            </g>
            <g opacity={0.38}>
              {litFixtures.map((f) => (
                <circle key={`m${f.id}`} cx={f.x} cy={f.y}
                        r={px((f.category === 'papi' ? 2.4 : 2.6) * (0.5 + (BLOOM[f.category] ?? 0.4)))}
                        fill={baseColour(f)} />
              ))}
            </g>

            {/* Guidance halo on the commanded route. The route is a linear run
                of fixtures along one taxiway centreline, supplied by the
                sequence — not a radius around the aircraft, which would light
                fixtures on taxiways the aircraft is not using. */}
            {routeTags && (
              <g>
                {litFixtures.map((f) =>
                  routeTags.has(f.id) ? (
                    <circle key={`i${f.id}`} cx={f.x} cy={f.y}
                            r={px(5)} fill={PHOTOMETRIC.green} opacity={0.45} />
                  ) : null
                )}
              </g>
            )}
          </g>

          <g>
            {visible.map((f) => {
              const col = baseColour(f);
              const lit = isLit(f);
              const failed = f.state === 'failed';
              const silent = f.comms === 'silent';
              const sel = selectedTag === f.id;
              const r = f.category === 'papi' ? px(1.9) : px(1.45);
              const bar = BAR_CATEGORIES.has(f.category);

              return (
                <g key={f.id} onClick={() => select(f.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={f.x} cy={f.y} r={r * 3.2} fill="transparent" />

                  {bar ? (
                    <rect x={f.x - r * 1.6} y={f.y - r * 0.6}
                          width={r * 3.2} height={r * 1.2}
                          fill={failed ? 'none' : col}
                          stroke={failed ? C.fault : 'none'} strokeWidth={r * 0.5}
                          opacity={lit || failed ? 1 : 0.4} />
                  ) : (
                    <circle cx={f.x} cy={f.y} r={r}
                            fill={failed ? C.sky : col}
                            stroke={failed ? C.fault : 'none'} strokeWidth={r * 0.55}
                            opacity={lit || failed ? 1 : 0.4} />
                  )}

                  {/* A failure changes shape and gains a magenta box. It is never
                      recoloured — red is a legitimate photometric state, so a red
                      "fault" would be indistinguishable from a healthy runway
                      end light. */}
                  {failed && (
                    <rect x={f.x - r * 2.4} y={f.y - r * 2.4}
                          width={r * 4.8} height={r * 4.8}
                          fill="none" stroke={C.fault} strokeWidth={r * 0.45} />
                  )}

                  {silent && (
                    <g stroke={C.silent} strokeWidth={r * 0.5} opacity={0.95}>
                      <line x1={f.x - r * 2} y1={f.y - r * 2} x2={f.x + r * 2} y2={f.y + r * 2} />
                      <line x1={f.x - r * 2} y1={f.y + r * 2} x2={f.x + r * 2} y2={f.y - r * 2} />
                    </g>
                  )}

                  {sel && (
                    <circle cx={f.x} cy={f.y} r={r * 4} fill="none"
                            stroke="#2DD4BF" strokeWidth={r * 0.6} />
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Aircraft, with its own contact shadow ───────────────────── */}
          {aircraft && (
            <>
              <g transform={`${shadowTransform(HEIGHTS.aircraft, 1.1)} translate(${aircraft.x} ${aircraft.y}) rotate(${-aircraft.heading}) scale(1,-1)`}>
                <path
                  d="M 0 -34 L 9 -6 L 46 10 L 46 20 L 9 12 L 9 26 L 20 34 L 20 40 L 0 35 L -20 40 L -20 34 L -9 26 L -9 12 L -46 20 L -46 10 L -9 -6 Z"
                  fill="#000000" opacity={0.6} filter="url(#castShadow)"
                  transform="rotate(90) scale(0.42)" />
              </g>
              <g transform={`translate(${aircraft.x} ${aircraft.y}) rotate(${-aircraft.heading}) scale(1,-1)`}>
                <path
                  d="M 0 -34 L 9 -6 L 46 10 L 46 20 L 9 12 L 9 26 L 20 34 L 20 40 L 0 35 L -20 40 L -20 34 L -9 26 L -9 12 L -46 20 L -46 10 L -9 -6 Z"
                  fill="#EDF2F7" stroke="#8A929B" strokeWidth={1.2}
                  transform="rotate(90) scale(0.42)" />
                <path
                  d="M 0 -34 L 9 -6 L 46 10 L 46 20 L 9 12 L 0 10 Z"
                  fill="#FFFFFF" opacity={0.35}
                  transform="rotate(90) scale(0.42)" />
              </g>
            </>
          )}
        </g>

        {/* Vignette, outside the flip so it tracks the viewport not the world. */}
        <rect x={view.x} y={view.y} width={view.w} height={view.h}
              fill="url(#vignette)" pointerEvents="none" />

        {/* ── Labels, unflipped so text is not mirrored ─────────────────── */}
        {showLabels && (
          <g pointerEvents="none">
            <text x={RUNWAY_LENGTH / 2} y={-46} fill={C.labelBright}
                  fontSize={13 * k} fontWeight={600} textAnchor="middle">
              {`RWY ${AIRPORT.runwayRef}  ·  ${AIRPORT.runwayLength} × ${AIRPORT.runwayWidth} m`}
            </text>
            {(['09', '27'] as const).map((rwy) => (
              <text key={rwy} x={rwy === '09' ? 175 : RUNWAY_LENGTH - 175} y={8 * k}
                    fill={C.labelBright} fontSize={22 * k} fontWeight={700}
                    textAnchor="middle" opacity={0.92}>
                {rwy}
              </text>
            ))}
            {(['09', '27'] as const).map((rwy) => {
              const x = rwy === '09' ? 300 : RUNWAY_LENGTH - 300;
              const s = rwy === '09' ? 1 : -1;
              return (
                <text key={`p${rwy}`} x={x} y={-s * 78 + (s > 0 ? -6 : 14) * k}
                      fill={C.label} fontSize={10 * k} textAnchor="middle">
                  {`PAPI ${rwy}`}{papiWhite !== undefined ? ` ${papiWhite}W/${4 - papiWhite}R` : ''}
                </text>
              );
            })}
            {showStandDetail && TERMINAL_POLYGONS.slice(0, 3).map((p, i) => {
              const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
              const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
              return (
                <text key={`t${i}`} x={cx} y={-cy} fill={C.label}
                      fontSize={9 * k} textAnchor="middle">TERMINAL</text>
              );
            })}
          </g>
        )}
      </svg>

      {/* ── Viewport chrome ─────────────────────────────────────────────── */}
      <div className="absolute top-2 left-3 pointer-events-none">
        <div className="text-xs font-semibold text-text-primary drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {AIRPORT.name}
        </div>
        <div className="text-[length:calc(10px*var(--fs))] text-text-muted font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {AIRPORT.icao} / {AIRPORT.iata} · {AIRPORT.city} · true heading {AIRPORT.headingDeg}°
        </div>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur border border-accent-blue/10 text-[length:calc(10px*var(--fs))] font-mono text-text-muted shadow-lg">
          {zoom < 1 ? `${zoom.toFixed(2)}×` : `${zoom.toFixed(1)}×`}
        </span>
        <button
          onClick={resetView}
          className="px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-accent-blue/10 text-[length:calc(10px*var(--fs))] text-text-secondary hover:text-text-primary shadow-lg"
        >
          Fit
        </button>
      </div>

      <ScaleBar metresPerView={view.w} />
      <MapLegend />
    </div>
  );
};

/** Scale bar sized to a round number of metres. */
const ScaleBar: React.FC<{ metresPerView: number }> = ({ metresPerView }) => {
  const target = metresPerView / 6;
  const nice = [10, 25, 50, 100, 250, 500, 1000, 2000].reduce((a, b) =>
    Math.abs(b - target) < Math.abs(a - target) ? b : a
  );
  const pct = (nice / metresPerView) * 100;
  return (
    <div className="absolute bottom-2.5 left-3 pointer-events-none">
      <div className="flex items-end gap-1.5">
        <div className="h-1.5 border-l border-r border-b border-accent-blue/40 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
             style={{ width: `${pct}%`, minWidth: 24 }} />
        <span className="text-[length:calc(10px*var(--fs))] font-mono text-text-muted leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {nice >= 1000 ? `${nice / 1000} km` : `${nice} m`}
        </span>
      </div>
    </div>
  );
};

/**
 * Map legend.
 *
 * The canvas draws ten light categories in five colours plus three fixture
 * states, and until now the only way to learn which was which was to click a
 * light and read its faceplate. On a wall display nobody does that — they ask
 * the person next to them. So the key is on the map.
 *
 * Colours are the real ICAO Annex 14 conventions, which is also why they are
 * worth naming: an operator who knows the standard reads this instantly, and
 * one who does not learns the right thing.
 */
const LEGEND_LIGHTS: { colour: string; label: string }[] = [
  { colour: '#FFFFFF', label: 'Runway edge / centreline' },
  { colour: '#34D399', label: 'Threshold · taxiway centreline' },
  { colour: '#F87171', label: 'Runway end · stop bar' },
  { colour: '#60A5FA', label: 'Taxiway edge' },
  { colour: '#FBBF24', label: 'PAPI · approach' },
];

const LEGEND_STATE: { colour: string; label: string; ring?: boolean }[] = [
  { colour: '#34D399', label: 'Serviceable' },
  { colour: '#F59E0B', label: 'Degraded' },
  { colour: '#EF4444', label: 'Failed / no comms', ring: true },
];

const MapLegend: React.FC = () => {
  // Closed by default. Expanded it covered the east taxiways and the 27 end —
  // a key that hides the thing it is describing is worse than no key.
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-2.5 right-3 z-20">
      <div
        className="rounded-lg border backdrop-blur-sm overflow-hidden"
        style={{ background: 'rgba(8,12,32,0.9)', borderColor: 'rgba(32, 120, 207,0.14)' }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white/5 transition-colors"
        >
          <span className="text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider text-text-muted">
            Legend
          </span>
          <span className="flex-1" />
          <span className="text-[length:calc(10px*var(--fs))] text-text-muted">{open ? '\u2013' : '+'}</span>
        </button>

        {open && (
          <div className="px-2.5 pb-2 pt-0.5 space-y-2" style={{ minWidth: 180 }}>
            <div className="space-y-1">
              {LEGEND_LIGHTS.map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: l.colour, boxShadow: `0 0 5px 1px ${l.colour}88` }}
                  />
                  <span className="text-[length:calc(10px*var(--fs))] text-text-secondary leading-tight">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-1.5 border-t border-accent-blue/10 space-y-1">
              {LEGEND_STATE.map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background: l.colour,
                      boxShadow: l.ring ? `0 0 0 2px ${l.colour}55` : undefined,
                    }}
                  />
                  <span className="text-[length:calc(10px*var(--fs))] text-text-secondary leading-tight">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-1.5 border-t border-accent-blue/10 flex items-center gap-2">
              <span className="w-4 h-[3px] rounded-sm shrink-0" style={{ background: '#FBBF24' }} />
              <span className="text-[length:calc(10px*var(--fs))] text-text-secondary leading-tight">
                Cleared route (follow-the-green)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirfieldCanvas;
