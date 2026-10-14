/**
 * The terminal map — one component, used by every building subsystem.
 *
 * ── The flow ───────────────────────────────────────────────────────────────
 *   overview  both terminals outlined on the real map; click one
 *   terminal  camera flies in along the building's own axis; zones appear
 *   zone      camera flies to the zone; its assets appear, and open on click
 *
 * Each step is a `flyTo`, not a swap: the operator keeps their bearings because
 * the ground never cuts. That was the point of dropping the old plan-image
 * hand-off — a drill-down that changes surface at every step makes people
 * re-orient three times to reach one asset.
 *
 * ── Why there is no schematic any more ─────────────────────────────────────
 * There used to be a plan view and a "zone image" behind the map. Both are
 * gone. Everything here is drawn on real imagery from real coordinates, so
 * what an operator points at on screen is where the thing actually is.
 *
 * ── Why assets cannot be in the wrong place ────────────────────────────────
 * Zones are polygons inside the OSM terminal hulls (see terminalAreas.ts) and
 * an asset is positioned by interpolating inside its zone's ring. There is no
 * projection from an uncalibrated plan space to get wrong: an asset is inside
 * its zone, and the zone is inside the terminal, by construction.
 *
 * ── Why the airport is drawn, not borrowed ────────────────────────
 * OSM's `building` layer renders every shed and shop around the aerodrome as an
 * identical box, and the terminal disappeared into the suburb. So there is no
 * building layer. The apron, the piers and the terminal come from the surveyed
 * outlines the airfield lighting console already draws (airfieldOverlay.ts),
 * which is why the two screens show the same building.
 *
 * The city itself stays — roads, water, land cover, place names — because an
 * operator needs to know where the airport sits. It just no longer competes
 * with it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { LayerSpecification, Map as MlMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Camera, Gauge, Map as MapIcon, Satellite } from 'lucide-react';

import {
  ALL_ZONES, LEVELS, TERMINAL_AREAS, levelByKey, scaleRing,
  type TerminalArea, type TerminalZone,
} from '../terminalAreas';
import { APRON_GEOJSON, STRUCTURE_GEOJSON, TERMINAL_GEOJSON } from '../airfieldOverlay';
import { ALL_AHU_ASSETS, type AHUAsset } from '../lbmsAssets';
import { ASSETS, type Asset } from '../assets';
import AHUAssetDetailCard from './AHUAssetDetailCard';
import PanoramaViewer from './PanoramaViewer';
import { PANO_SCENES } from '../panorama';

/* ─────────────────────────────────────────────────────── worker pool ───── */

/**
 * Keep MapLibre's shared worker pool alive for the page's lifetime.
 *
 * MapLibre parses vector tiles in Web Workers held in one pool shared by every
 * map instance, and that pool is destroyed when the last map is removed. React
 * StrictMode's dev double-mount does exactly that between the two mounts, and
 * the second map is then left talking to dead workers — tiles fetch with 200s
 * (that part is on the main thread) but nothing ever draws, no error, no `load`
 * event. `prewarm()` pins the pool so `remove()` cannot take it.
 */
maplibregl.prewarm();

/* ──────────────────────────────────────────────────────────── basemap ───── */

const GROUND = '#04101F';
const DARK_PREFIX = 'dk-';
const OMT_SOURCE = 'openmaptiles';

const SATELLITE = {
  tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  maxzoom: 19,
};

const darkLayer = (
  id: string,
  type: 'fill' | 'line' | 'symbol',
  sourceLayer: string,
  rest: Record<string, unknown>,
): LayerSpecification =>
  ({ id: `${DARK_PREFIX}${id}`, type, source: OMT_SOURCE, 'source-layer': sourceLayer, ...rest }) as LayerSpecification;

/**
 * A dark basemap written for this screen rather than borrowed.
 *
 * Keyless dark rasters were all wrong here — Esri's stops at zoom 16 with no
 * buildings, Carto's now stamps "API KEY REQUIRED" over every tile. Drawing it
 * from OpenFreeMap's vector planet means the palette is ours and the map shows
 * what an airport is made of: pavement, structure, water. Everything else is
 * deliberately near-invisible so the basemap stays a ground for the overlay.
 */
const DARK_LAYERS: LayerSpecification[] = [
  // Ground cover first, so the city reads as a place rather than as a void.
  darkLayer('landcover', 'fill', 'landcover', {
    paint: { 'fill-color': '#07182A', 'fill-opacity': 0.7 },
  }),
  darkLayer('landuse', 'fill', 'landuse', {
    paint: { 'fill-color': '#081B2C', 'fill-opacity': 0.6 },
  }),
  darkLayer('water', 'fill', 'water', { paint: { 'fill-color': '#052033' } }),

  // Airport pavement.
  darkLayer('aeroway-area', 'fill', 'aeroway', {
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: { 'fill-color': '#0B1B2B' },
  }),
  darkLayer('taxiway', 'line', 'aeroway', {
    filter: ['match', ['get', 'class'], ['taxiway'], true, false],
    paint: { 'line-color': '#123246', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 5, 18, 12] },
  }),
  darkLayer('runway', 'line', 'aeroway', {
    filter: ['match', ['get', 'class'], ['runway'], true, false],
    paint: { 'line-color': '#18425C', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 16, 16, 18, 40] },
  }),

  // Roads, with casing so the network reads at speed the way a real map does.
  darkLayer('road-casing', 'line', 'transportation', {
    filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
    paint: {
      'line-color': '#04101F',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.6, 16, 7, 18, 14],
    },
  }),
  darkLayer('road-minor', 'line', 'transportation', {
    minzoom: 13,
    filter: ['match', ['get', 'class'], ['minor', 'service', 'path'], true, false],
    paint: {
      'line-color': '#0D2135',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.4, 18, 3],
    },
  }),
  darkLayer('road', 'line', 'transportation', {
    filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
    paint: {
      'line-color': '#16324A',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 4.5, 18, 9],
    },
  }),

  // NOTE: there is deliberately no OSM `building` layer.
  //
  // At terminal zoom it drew every shed and shop around the aerodrome as an
  // identical little box, and the terminal was lost among them. The buildings
  // that matter are drawn instead from the surveyed airfield outlines the AGL
  // console uses - see AIRPORT_LAYERS below. The city still reads, through its
  // roads, water and land cover; it just no longer competes with the airport.

  darkLayer('place-label', 'symbol', 'place', {
    minzoom: 11,
    maxzoom: 15,
    filter: ['match', ['get', 'class'], ['city', 'town', 'suburb'], true, false],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.12,
    },
    paint: { 'text-color': '#3E5566', 'text-halo-color': GROUND, 'text-halo-width': 1.2 },
  }),
];

/**
 * The airport itself, drawn from the surveyed outlines.
 *
 * Same geometry the airfield lighting console renders, transformed back to
 * lng/lat (see airfieldOverlay.ts). Apron pavement underneath, terminal
 * buildings on top with a lit edge, so the one thing the operator is here for
 * is the one thing that glows.
 */
const AIRPORT_LAYERS: LayerSpecification[] = [
  {
    id: `${DARK_PREFIX}apron-fill`, type: 'fill', source: 'apron',
    paint: { 'fill-color': '#0E2436', 'fill-outline-color': '#1B4257' },
  },
  {
    id: `${DARK_PREFIX}structure-fill`, type: 'fill', source: 'structure',
    paint: { 'fill-color': '#123043', 'fill-outline-color': '#245A6E' },
  },
  {
    id: `${DARK_PREFIX}terminal-fill`, type: 'fill', source: 'terminal',
    paint: { 'fill-color': '#16455C', 'fill-opacity': 0.92 },
  },
  {
    id: `${DARK_PREFIX}terminal-edge`, type: 'line', source: 'terminal',
    paint: {
      'line-color': '#4FD2D3',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 16, 1.4, 18, 2.4],
      'line-opacity': 0.9,
    },
  },
];

const BASE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    [OMT_SOURCE]: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors',
    },
    'base-satellite': {
      type: 'raster', tiles: SATELLITE.tiles, tileSize: 256,
      maxzoom: SATELLITE.maxzoom, attribution: SATELLITE.attribution,
    },
    apron: { type: 'geojson', data: APRON_GEOJSON },
    structure: { type: 'geojson', data: STRUCTURE_GEOJSON },
    terminal: { type: 'geojson', data: TERMINAL_GEOJSON },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': GROUND } },
    ...DARK_LAYERS,
    ...AIRPORT_LAYERS,
    {
      id: 'base-satellite', type: 'raster', source: 'base-satellite',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.92, 'raster-brightness-max': 0.85 },
    },
  ],
};

/* ────────────────────────────────────────────────────────── placement ───── */

export interface MapAsset {
  id: string;
  name: string;
  status: 'Active' | 'Warning' | 'Inactive';
  zoneId: string;
  lng: number;
  lat: number;
  subsystem: string;
}

/** Stable hash, so a given asset always lands on the same spot. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
};

/**
 * Place a subsystem's assets into the zones of one terminal, on one level.
 *
 * Round-robin across zones rather than random, so every zone carries roughly
 * its share and no zone ends up empty; the offset within a zone is hashed from
 * the asset id, which keeps a unit in the same corner of the same room across
 * reloads. Both matter for a demo — an asset that teleports between refreshes
 * reads as a bug even when nothing is wrong.
 */
function placeAssets(assets: Asset[], zones: TerminalZone[], level: string): MapAsset[] {
  if (zones.length === 0) return [];
  return assets.map((a, i) => {
    const zone = zones[i % zones.length];
    const r = zone.ring;
    const cx = r.reduce((s, p) => s + p[0], 0) / r.length;
    const cy = r.reduce((s, p) => s + p[1], 0) / r.length;
    // Spread inside the zone, never against its edge.
    const t = hash(a.id + level);
    const u = hash(a.id + level + 'u');
    const spanX = (Math.max(...r.map((p) => p[0])) - Math.min(...r.map((p) => p[0]))) * 0.62;
    const spanY = (Math.max(...r.map((p) => p[1])) - Math.min(...r.map((p) => p[1]))) * 0.62;
    return {
      id: a.id,
      name: a.name,
      status: a.status as MapAsset['status'],
      zoneId: zone.id,
      lng: cx + (t - 0.5) * spanX,
      lat: cy + (u - 0.5) * spanY,
      subsystem: a.subsystemAcronym,
    };
  });
}

const STATUS_COLOR: Record<MapAsset['status'], string> = {
  Active: '#34d399',
  Warning: '#fbbf24',
  Inactive: '#f87171',
};

/* ─────────────────────────────────────────────────────────── component ──── */

/** Camera that frames both terminals and nothing else. */
const OVERVIEW = { center: [115.16360, -8.74310] as [number, number], zoom: 15.75 };

type Stage = 'terminal' | 'zone';
type Basemap = 'dark' | 'satellite';

interface Props {
  /** Subsystem acronym whose assets are pinned, e.g. 'LBMS'. */
  subsystem?: string;
  /** Shorter chrome for the small panels on Supervisor/Operator tabs. */
  compact?: boolean;
}

const TerminalMap: React.FC<Props> = ({ subsystem = 'LBMS', compact = false }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);

  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [basemap, setBasemap] = useState<Basemap>('dark');
  const [level, setLevel] = useState('GF');
  // One terminal, so there is nothing to choose: the map opens on it with its
  // zones already drawn. The old 'pick a terminal' stage existed only because
  // there used to be two invented hulls to pick between.
  const [areaId] = useState<string>(TERMINAL_AREAS[0].id);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [openAsset, setOpenAsset] = useState<MapAsset | null>(null);
  const [showPano, setShowPano] = useState(false);
  const [showFaceplate, setShowFaceplate] = useState(false);

  const stage: Stage = zoneId ? 'zone' : 'terminal';
  const area = TERMINAL_AREAS.find((a) => a.id === areaId) ?? null;
  const zone = zoneId ? ALL_ZONES.find((z) => z.id === zoneId) ?? null : null;
  const spec = levelByKey(level);

  // Assets for this subsystem, spread over the zones of whichever terminal is
  // open. Capped because a pin per unit is unreadable past a few dozen — the
  // register is the place to see all 209 of them.
  const assets = useMemo(() => {
    const pool = ASSETS.filter((a) => a.subsystemAcronym === subsystem);
    const target = area ?? TERMINAL_AREAS[0];
    const zones = zone ? [zone] : target.zones;
    const cap = zone ? 14 : 28;
    // Keep the faulted ones — an operator opens this map to find those.
    const ranked = [...pool].sort((a, b) => (a.status === 'Active' ? 1 : 0) - (b.status === 'Active' ? 1 : 0));
    return placeAssets(ranked.slice(0, cap), zones, level);
  }, [subsystem, area, zone, level]);

  /* ── map instance ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: BASE_STYLE,
      center: OVERVIEW.center,
      zoom: OVERVIEW.zoom,
      bearing: 0,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.on('load', () => setReady(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty('base-satellite', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
    const vis = basemap === 'dark' ? 'visible' : 'none';
    for (const l of map.getStyle().layers) {
      if (l.id.startsWith(DARK_PREFIX)) map.setLayoutProperty(l.id, 'visibility', vis);
    }
  }, [basemap, ready]);

  /* ── camera: one flyTo per stage, along the building's own axis ─────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ease = { duration: 1150, essential: true, curve: 1.3 } as const;
    if (stage === 'zone' && zone) {
      map.flyTo({ center: zone.centre, zoom: 18.4, bearing: (area?.bearingDeg ?? 90) - 90, pitch: 30, ...ease });
    } else if (area) {
      // Framed on the building itself — the request was for the building part
      // zoomed, with nothing outside it in the shot.
      map.flyTo({ center: area.centre, zoom: 17.1, bearing: area.bearingDeg - 90, pitch: 0, ...ease });
    }
  }, [stage, areaId, zoneId, ready]);

  /* ── project everything the overlay draws ───────────────────────────── */
  const [shapes, setShapes] = useState<{
    areas: { a: TerminalArea; pts: string; cx: number; cy: number }[];
    zones: { z: TerminalZone; pts: string; cx: number; cy: number }[];
    pins: { a: MapAsset; x: number; y: number }[];
  }>({ areas: [], zones: [], pins: [] });

  const reproject = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCanvas();
    setBox({ w: c.clientWidth, h: c.clientHeight });
    const xy = (ll: [number, number]) => {
      const p = map.project(ll);
      return { x: p.x, y: p.y };
    };
    const ring = (r: [number, number][]) => r.map((p) => { const q = xy(p); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(' ');
    const centreOf = (r: [number, number][]) => {
      const cx = r.reduce((s, p) => s + p[0], 0) / r.length;
      const cy = r.reduce((s, p) => s + p[1], 0) / r.length;
      return xy([cx, cy]);
    };

    const shownAreas = area ? [area] : [];
    setShapes({
      areas: shownAreas.map((a) => {
        const r = scaleRing(a.outline, spec.scale);
        const c2 = centreOf(r);
        return { a, pts: ring(r), cx: c2.x, cy: c2.y };
      }),
      zones: (zone ? [zone] : area?.zones ?? []).map((z) => {
        const r = scaleRing(z.ring, spec.scale);
        const c2 = centreOf(r);
        return { z, pts: ring(r), cx: c2.x, cy: c2.y };
      }),
      pins: assets.map((a) => {
        const q = xy([a.lng, a.lat]);
        return { a, x: q.x, y: q.y };
      }),
    });
  }, [area, zone, stage, spec.scale, assets]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    reproject();
    map.on('move', reproject);
    map.on('resize', reproject);
    return () => { map.off('move', reproject); map.off('resize', reproject); };
  }, [ready, reproject]);

  const ahu: AHUAsset | undefined = openAsset
    ? ALL_AHU_ASSETS.find((a) => a.id === openAsset.id)
    : undefined;

  const chip = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors';
  const hud = { background: 'rgba(8,12,32,0.92)', borderColor: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(14px)' };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      <div ref={hostRef} className="absolute inset-0" style={{ background: GROUND }} />

      {box.w > 0 && (
        <svg className="absolute inset-0" width={box.w} height={box.h} style={{ pointerEvents: 'none' }}>
          {/* Terminal outlines. In overview they are the click target; once one
              is open it stays as the boundary its zones sit inside. */}
          {shapes.areas.map(({ a, pts, cx, cy }) => {
            const hot = hoverId === a.id;
            const clickable = false;
            return (
              <g
                key={a.id}
                style={{ pointerEvents: clickable ? 'auto' : 'none', cursor: clickable ? 'pointer' : 'default' }}
                onMouseEnter={() => clickable && setHoverId(a.id)}
                onMouseLeave={() => setHoverId((h) => (h === a.id ? null : h))}
              >
                <polygon
                  points={pts}
                  fill={clickable ? (hot ? 'rgba(34,199,198,0.20)' : 'rgba(34,199,198,0.10)') : 'none'}
                  stroke="#22C7C6"
                  strokeWidth={hot ? 3 : 2}
                  strokeOpacity={0.9}
                />
                {clickable && (
                  <text
                    x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fontSize="13" fontWeight="800" fill="#CFF6F6"
                    stroke={GROUND} strokeWidth="3.5" paintOrder="stroke"
                  >
                    {a.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Zones */}
          {shapes.zones.map(({ z, pts, cx, cy }) => {
            const hot = hoverId === z.id;
            const clickable = stage === 'terminal';
            return (
              <g
                key={z.id}
                style={{ pointerEvents: clickable ? 'auto' : 'none', cursor: clickable ? 'pointer' : 'default' }}
                onMouseEnter={() => clickable && setHoverId(z.id)}
                onMouseLeave={() => setHoverId((h) => (h === z.id ? null : h))}
                onClick={() => clickable && setZoneId(z.id)}
              >
                <polygon
                  points={pts}
                  fill={hot ? 'rgba(230,184,92,0.26)' : 'rgba(34,199,198,0.13)'}
                  stroke={hot ? '#E6B85C' : '#22C7C6'}
                  strokeWidth={hot ? 2.4 : 1.4}
                  strokeOpacity={0.9}
                />
                <text
                  x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="700" fill="#E6EEF6"
                  stroke={GROUND} strokeWidth="3" paintOrder="stroke"
                >
                  {z.name}
                </text>
              </g>
            );
          })}

          {/* Assets. Only a faulted unit pulses, so the animation stays an
              alarm signal rather than decoration. */}
          {shapes.pins.map(({ a, x, y }) => {
            const color = STATUS_COLOR[a.status];
            return (
              <g key={a.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => setOpenAsset(a)}>
                <title>{a.id} — {a.name} · {a.status}</title>
                {a.status === 'Inactive' && (
                  <circle cx={x} cy={y} r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
                    <animate attributeName="r" values="7;15;7" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r="6.5" fill={color} stroke={GROUND} strokeWidth="2" />
                {stage === 'zone' && (
                  <text
                    x={x} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="700"
                    fill={color} stroke={GROUND} strokeWidth="2.5" paintOrder="stroke"
                  >
                    {a.id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div className="fs-chrome absolute top-3 left-3 z-[40] flex items-center gap-2 flex-wrap">
        {zoneId && (
          <button
            onClick={() => setZoneId(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold text-text-primary transition-all hover:brightness-125"
            style={hud}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All zones
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold text-text-primary" style={hud}>
          <span className="w-2 h-2 rounded-full bg-accent-teal" />
          {stage === 'terminal' && `${area?.name} · ${spec.label}`}
          {stage === 'zone' && `${zone?.name} · ${spec.label}`}
        </div>
      </div>

      {/* ── Level selector. Every level is offered at once; picking one flies
             into the terminal and redraws its footprint at that level's step. */}
      <div className="fs-chrome absolute top-3 right-14 z-[40] flex items-center gap-1 rounded-xl border p-1" style={hud}>
        {LEVELS.map((l) => (
          <button
            key={l.key}
            title={l.label}
            onClick={() => setLevel(l.key)}
            className={`${chip} ${level === l.key ? 'bg-accent-teal text-primary-900' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {l.key}
          </button>
        ))}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      {!compact && (
        <div className="fs-chrome absolute bottom-3 left-3 z-[40] rounded-xl border px-3 py-2" style={hud}>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
            {stage === 'terminal' ? 'Zones' : 'Assets'}
          </p>
          <div className="flex flex-col gap-1">
            {(['Active', 'Warning', 'Inactive'] as const).map((s) => (
              <span key={s} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                {s}
                <span className="text-text-muted">
                  · {assets.filter((a) => a.status === s).length}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Basemap + 360 ───────────────────────────────────────────────── */}
      <div className="fs-chrome absolute bottom-3 right-3 z-[40] flex items-center gap-1 rounded-xl border p-1" style={hud}>
        <button
          onClick={() => setBasemap('satellite')}
          className={`${chip} flex items-center gap-1.5 ${basemap === 'satellite' ? 'bg-accent-teal/25 text-accent-teal' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Satellite className="w-3.5 h-3.5" /> Satellite
        </button>
        <button
          onClick={() => setBasemap('dark')}
          className={`${chip} flex items-center gap-1.5 ${basemap === 'dark' ? 'bg-accent-teal/25 text-accent-teal' : 'text-text-muted hover:text-text-primary'}`}
        >
          <MapIcon className="w-3.5 h-3.5" /> Dark
        </button>
        <span className="w-px self-stretch bg-white/15 mx-0.5" />
        <button
          onClick={() => setShowPano(true)}
          title="Open 360° street view for this area"
          className={`${chip} flex items-center gap-1.5 text-text-muted hover:text-text-primary`}
        >
          <Camera className="w-3.5 h-3.5" /> 360°
        </button>
      </div>

      {/*
        Asset detail.

        Every asset opens the same card, whatever subsystem it belongs to.
        Previously an AHU went straight to its parameter faceplate, which has no
        360 control on it — so on the one subsystem with real per-unit data, the
        street view was unreachable. The card is now the landing point and
        carries both: 360 for everyone, and the full faceplate for the units
        that have one.
      */}
      {openAsset && !showPano && (
        <div
          className="absolute top-3 right-3 z-[90] w-[270px] rounded-xl border p-3"
          style={{ ...hud, borderColor: `${STATUS_COLOR[openAsset.status]}66` }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">{openAsset.id}</p>
              <p className="text-xs text-text-muted truncate">{openAsset.name}</p>
            </div>
            <button
              onClick={() => { setOpenAsset(null); setShowFaceplate(false); }}
              className="text-text-muted hover:text-text-primary text-sm"
              aria-label="Close asset"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: `${STATUS_COLOR[openAsset.status]}22`, color: STATUS_COLOR[openAsset.status] }}
            >
              {openAsset.status}
            </span>
            <span className="text-xs text-text-muted">{openAsset.subsystem}</span>
          </div>

          <p className="mt-2 text-xs text-text-secondary">
            {ALL_ZONES.find((z) => z.id === openAsset.zoneId)?.name}
          </p>

          <button
            onClick={() => setShowPano(true)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-accent-teal/50 bg-accent-teal/15 text-xs font-bold text-accent-teal hover:bg-accent-teal/25 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Open 360° view
          </button>

          {ahu && (
            <button
              onClick={() => setShowFaceplate(true)}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-primary-500/60 bg-primary-700/60 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Gauge className="w-3.5 h-3.5" /> Live parameters
            </button>
          )}
        </div>
      )}

      {openAsset && ahu && showFaceplate && !showPano && (
        <AHUAssetDetailCard asset={ahu} onClose={() => setShowFaceplate(false)} />
      )}

      {/* The viewer positions itself inside this panel and carries its own
          size control, so it opens large enough to orient in. Nothing else in
          the panel may sit above it — an overlay over the image is an overlay
          that eats the drag used to turn the view. */}
      {showPano && PANO_SCENES[0] && (
        <PanoramaViewer scene={PANO_SCENES[0]} onClose={() => setShowPano(false)} />
      )}

    </div>
  );
};

export default TerminalMap;
