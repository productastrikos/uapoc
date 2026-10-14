/**
 * The terminal on the real map.
 *
 * MapLibre GL over open data — a purpose-written dark vector basemap for
 * working, satellite imagery for checking against the actual building. No API
 * key and no billing: the library is BSD, the vector tiles are OpenFreeMap's
 * keyless OpenMapTiles planet, the imagery is Esri's keyless ArcGIS service,
 * and attribution is shown as the licences require.
 *
 * ── What the map draws, and what it deliberately does not ──────────────────
 * The basemap carries the ground truth: runway, taxiway and apron surfaces,
 * and real building footprints — the terminal's actual shape rather than a
 * rectangle somebody drew. Over it sits one line, the terminal boundary.
 *
 * The schematic room layer is off by default. It is a useful reading of the
 * building's programme, but drawn over the map it covers the footprint the map
 * exists to show, so it lives behind the "Rooms" toggle along with the stand
 * markers that belong to the same drawing.
 *
 * ── Why the rooms are an SVG overlay, not GeoJSON layers ───────────────────
 * Historically because they had to be. Anything MapLibre parses in a Web
 * Worker — vector tiles, GeoJSON — sat unloaded forever here, with no error
 * raised, so the overlay was built to avoid the worker entirely. That turned
 * out to be two independent faults stacked on each other:
 *
 *   1. Vite's dependency pre-bundling split maplibre-gl v6's worker chunk from
 *      the shared chunk it imports, so the worker could not start at all.
 *      Fixed by `optimizeDeps.exclude` in vite.config.ts.
 *   2. React StrictMode's dev double-mount destroyed the shared worker pool
 *      between the two mounts. Fixed by `prewarm()` below.
 *
 * Both had to go before a vector source would load, which is why this looked
 * for so long like a library defect rather than two lifecycle bugs — and
 * fixing them is what makes the vector basemap below possible at all.
 *
 * The overlay stays SVG regardless. Projecting with `map.project()` on each
 * camera move gives the rooms ordinary DOM hit-testing, hover state and React
 * event handlers, which a GeoJSON layer would trade for `queryRenderedFeatures`
 * plumbing without drawing anything the operator could tell apart.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { LayerSpecification, Map as MlMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Satellite, Map as MapIcon } from 'lucide-react';
import { DPS_CENTER, pctToLngLat, planToLngLat, roomRing } from '../geo';
import { LEVEL_ROOMS, ROOM_STYLES, SHELL, STANDS, type LevelKey, type TerminalRoom } from '../terminalPlan';
import type { FloorZone } from '../lbmsAssets';
import { TERMINAL_OUTLINE } from '../terminalOutline';

/**
 * Keep MapLibre's shared worker pool alive for the life of the page.
 *
 * This is what made every non-raster source appear broken. MapLibre parses
 * vector and GeoJSON tiles in Web Workers held in one pool shared by all map
 * instances, and that pool is torn down when the last map is removed. Under
 * React StrictMode the dev double-mount does exactly that: effect creates a
 * map → cleanup calls `map.remove()` and the pool is destroyed → the effect
 * runs again and the second map is left talking to dead workers. Tiles are
 * still fetched (that happens on the main thread, so the network tab looks
 * healthy), they are handed to the worker, and no answer ever comes back — no
 * error, no `load` event, `isStyleLoaded()` stuck false, nothing drawn.
 *
 * Raster kept working throughout because raster tiles are decoded on the main
 * thread, which is why this read for so long as "vector sources are broken in
 * this build" rather than as a lifecycle bug.
 *
 * `prewarm()` pins the pool up front so `remove()` cannot take it away.
 */
maplibregl.prewarm();

type Basemap = 'dark' | 'satellite';

/**
 * Satellite imagery — Esri's keyless ArcGIS service, attributed as its licence
 * requires. Kept for checking the plan against the real building.
 */
const SATELLITE = {
  tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  maxzoom: 19,
};

/**
 * The dark basemap is drawn here rather than pulled from a vendor.
 *
 * Every keyless dark raster available was wrong for this screen in the same
 * way: Esri's World Dark Gray stops at zoom 16 and carries no building
 * footprints, so the terminal was a featureless grey smear exactly where the
 * operator needs to see structure; Carto's dark_all — the obvious choice, and
 * the one that does draw buildings — now stamps "API KEY REQUIRED" across
 * every tile.
 *
 * OpenFreeMap serves the full OpenMapTiles planet as vector tiles, keyless and
 * without a rate limit, so the style below is written directly against that
 * schema. Being vector means the palette is ours: an airport basemap that
 * shows what an airport is made of — runway, taxiway and apron surfaces, and
 * building footprints with an outline strong enough to read as walls — in the
 * console's own colours, and legible at zoom 18 where a raster would be a
 * blur.
 *
 * Nothing here is decoration. Anything that is not pavement, structure or
 * water is deliberately near-invisible, because the map's job is to be a
 * ground for the operational overlay, not to compete with it.
 */
const OMT_SOURCE = 'openmaptiles';
const VECTOR_TILE_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const OMT_ATTRIBUTION =
  '© <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · © OpenMapTiles · © OpenStreetMap contributors';

/** Every dark-basemap layer id starts with this, so the two basemaps can be
 *  toggled as groups without naming each layer at the call site. */
const DARK_PREFIX = 'dk-';

const GROUND = '#04101F';

const darkLayer = (
  id: string,
  type: 'fill' | 'line' | 'symbol',
  sourceLayer: string,
  rest: Record<string, unknown>,
): LayerSpecification =>
  ({
    id: `${DARK_PREFIX}${id}`,
    type,
    source: OMT_SOURCE,
    'source-layer': sourceLayer,
    ...rest,
  }) as LayerSpecification;

const DARK_LAYERS: LayerSpecification[] = [
  // Water first — the aerodrome sits on a spit, and the coastline is the one
  // piece of natural geography that helps an operator orient.
  darkLayer('water', 'fill', 'water', { paint: { 'fill-color': '#061B2E' } }),

  // Airport pavement. `aeroway` polygons are the aprons, taxiways and runway
  // surfaces — the shapes that make the map legible as an airfield at a glance.
  darkLayer('aeroway-area', 'fill', 'aeroway', {
    filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
    paint: { 'fill-color': '#0C1E30' },
  }),
  darkLayer('taxiway', 'line', 'aeroway', {
    filter: ['match', ['get', 'class'], ['taxiway'], true, false],
    paint: {
      'line-color': '#123449',
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 16, 5, 18, 12],
    },
  }),
  darkLayer('runway', 'line', 'aeroway', {
    filter: ['match', ['get', 'class'], ['runway'], true, false],
    paint: {
      'line-color': '#1A4560',
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 16, 16, 18, 40],
    },
  }),

  // Roads, kept deliberately quiet — landside context, not the subject.
  darkLayer('roads', 'line', 'transportation', {
    filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary'], true, false],
    paint: {
      'line-color': '#0E2438',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 16, 3, 18, 6],
    },
  }),

  // The point of the whole style: building footprints, with an outline that
  // survives being zoomed into. This is the structure the operator was asking
  // to see — the terminal's real shape, its piers, and the plant blocks around
  // it, rather than a rectangle somebody drew.
  darkLayer('buildings', 'fill', 'building', {
    minzoom: 13,
    paint: {
      'fill-color': '#15384C',
      'fill-outline-color': '#2E7F92',
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.45, 16, 0.85],
    },
  }),

  // One label, for orientation. Any more and the basemap starts arguing with
  // the overlay it exists to carry.
  darkLayer('aerodrome-label', 'symbol', 'aerodrome_label', {
    minzoom: 11,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-max-width': 8,
    },
    paint: {
      'text-color': '#5C7A8C',
      'text-halo-color': GROUND,
      'text-halo-width': 1.4,
    },
  }),
];

/** One style carrying both basemaps, switched by visibility — calling
 *  `setStyle` per swap tore everything down and never settled. */
const BASE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    [OMT_SOURCE]: { type: 'vector', url: VECTOR_TILE_URL, attribution: OMT_ATTRIBUTION },
    'base-satellite': {
      type: 'raster', tiles: SATELLITE.tiles, tileSize: 256,
      maxzoom: SATELLITE.maxzoom, attribution: SATELLITE.attribution,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': GROUND } },
    ...DARK_LAYERS,
    // Satellite starts hidden — dark is the default basemap (see `basemap`
    // state below). Setting the initial visibility to match avoids a frame of
    // imagery flashing before the sync effect runs. It sits above the vector
    // layers so that switching to it covers them rather than blending with them.
    {
      id: 'base-satellite',
      type: 'raster',
      source: 'base-satellite',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.94, 'raster-brightness-max': 0.88 },
    },
  ],
};

interface Props {
  level: LevelKey;
  zones: FloorZone[];
  openZoneId: string | null;
  onOpenZone: (zoneId: string) => void;
  onRoomClick?: (room: TerminalRoom) => void;
}

/** A room, projected to screen space for the SVG overlay. */
interface ProjectedRoom {
  room: TerminalRoom;
  points: string;
  cx: number;
  cy: number;
}

const TerminalGeoMap: React.FC<Props> = ({ level, zones, openZoneId, onOpenZone, onRoomClick }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  // Dark is the working basemap: the console is read in a dimmed control room,
  // and room outlines, zone pins and alarm colours all have to win against the
  // ground behind them — which they do not over satellite imagery. Satellite
  // stays one click away, for checking the plan against the real building.
  const [basemap, setBasemap] = useState<Basemap>('dark');
  // Off by default. The schematic room rectangles were covering the very thing
  // the map is for — the real terminal footprint underneath them. The map now
  // opens as pure ground plus the terminal boundary; "Rooms" puts the
  // programme layer back for anyone who wants to read zones off it.
  const [showRooms, setShowRooms] = useState(false);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const [rooms, setRooms] = useState<ProjectedRoom[]>([]);
  const [shell, setShell] = useState('');
  const [stands, setStands] = useState<{ id: string; x: number; y: number }[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Held in a ref so the marker effect does not depend on a caller-supplied
  // arrow that changes identity every render — reprojection re-renders on
  // every camera move, which would otherwise rebuild all markers each frame.
  const onOpenZoneRef = useRef(onOpenZone);
  onOpenZoneRef.current = onOpenZone;

  // ── Map instance ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: BASE_STYLE,
      center: [DPS_CENTER.lng, DPS_CENTER.lat],
      zoom: 15.6,
      // Turned so the terminal runs across the view rather than diagonally.
      bearing: -15,
      pitch: 0,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.on('load', () => setReady(true));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Basemap is a visibility switch, so nothing else on the map is torn down.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty('base-satellite', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
    // The dark basemap is a group of vector layers rather than one raster, so
    // it toggles by prefix. Driven off the live style so a layer added to
    // DARK_LAYERS is picked up without touching this.
    const vis = basemap === 'dark' ? 'visible' : 'none';
    for (const layer of map.getStyle().layers) {
      if (layer.id.startsWith(DARK_PREFIX)) map.setLayoutProperty(layer.id, 'visibility', vis);
    }
  }, [basemap, ready]);

  // ── Project the plan into screen space, and keep it there ────────────────
  const reproject = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCanvas();
    setBox({ w: c.clientWidth, h: c.clientHeight });

    const xy = (lngLat: [number, number]) => {
      const p = map.project(lngLat);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    };

    setRooms(
      LEVEL_ROOMS[level].map((room) => {
        const points = roomRing(room).slice(0, 4).map(xy).join(' ');
        const centre = map.project(planToLngLat(room.x + room.w / 2, room.y + room.h / 2));
        return { room, points, cx: centre.x, cy: centre.y };
      }),
    );

    // The terminal boundary comes from OSM, in real coordinates, so it traces
    // the actual building rather than the plan's uncalibrated shell rectangle.
    setShell(TERMINAL_OUTLINE.map(xy).join(' '));

    setStands(
      STANDS.map((s) => {
        const p = map.project(planToLngLat(s.x, SHELL.building.y - 30));
        return { id: s.id, x: p.x, y: p.y };
      }),
    );
  }, [level]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    reproject();
    map.on('move', reproject);
    map.on('resize', reproject);
    return () => { map.off('move', reproject); map.off('resize', reproject); };
  }, [ready, reproject]);

  // Zone pins are projected into the same overlay as the rooms. As MapLibre
  // Markers they sat inside the map container, which this overlay — a sibling
  // painted after it — covered completely, so they were present but invisible
  // under the room fills.
  const [pins, setPins] = useState<{ zone: FloorZone; x: number; y: number }[]>([]);

  const reprojectPins = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setPins(zones.map((zone) => {
      const p = map.project(pctToLngLat(zone.xPct, zone.yPct));
      return { zone, x: p.x, y: p.y };
    }));
  }, [zones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    reprojectPins();
    map.on('move', reprojectPins);
    map.on('resize', reprojectPins);
    return () => { map.off('move', reprojectPins); map.off('resize', reprojectPins); };
  }, [ready, reprojectPins]);

  return (
    <div className="relative w-full h-full">
      <div ref={hostRef} className="absolute inset-0" style={{ background: '#04101F' }} />

      {/* Room layer — projected onto the imagery, synced to the camera */}
      {box.w > 0 && (
        <svg className="absolute inset-0" width={box.w} height={box.h} style={{ pointerEvents: 'none' }}>
          {/* The terminal's boundary, and by default the only thing drawn over
              the map. It is an outline, not a filled box: the basemap now draws
              the real building footprint underneath, and covering that with a
              wash would hide the structure this map exists to show. */}
          <polygon points={shell} fill="none" stroke="#22C7C6" strokeWidth="2" strokeOpacity={0.85} />

          {showRooms && rooms.map(({ room, points, cx, cy }) => {
            const st = ROOM_STYLES[room.category];
            const hot = hoverId === room.id;
            return (
              <g key={room.id} style={{ pointerEvents: 'auto', cursor: onRoomClick ? 'pointer' : 'default' }}>
                <title>{room.name}{room.detail ? ` — ${room.detail}` : ''}</title>
                <polygon
                  points={points}
                  fill={st.text}
                  fillOpacity={hot ? 0.68 : 0.46}
                  stroke="#E6EEF6"
                  strokeOpacity={0.8}
                  strokeWidth={hot ? 1.8 : 1}
                  onMouseEnter={() => setHoverId(room.id)}
                  onMouseLeave={() => setHoverId((h) => (h === room.id ? null : h))}
                  onClick={() => onRoomClick?.(room)}
                />
                <text
                  x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fill="#04101F"
                  stroke="rgba(230,238,246,0.9)" strokeWidth="2.4" paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {room.short}
                </text>
              </g>
            );
          })}
          {/* Stands belong to the schematic, so they come and go with it —
              on the bare map they were just another row of boxes and labels
              between the operator and the ground. */}
          {showRooms && stands.map((s) => (
            <g key={s.id} style={{ pointerEvents: 'none' }}>
              <circle cx={s.x} cy={s.y} r="4" fill="#22C7C6" stroke="#04101F" strokeWidth="1.2" />
              <text
                x={s.x} y={s.y - 8} textAnchor="middle" fontSize="8.5" fontWeight="700"
                fill="#7FCFD0" stroke="#04101F" strokeWidth="2" paintOrder="stroke"
              >
                {s.id}
              </text>
            </g>
          ))}

          {/* Zone pins — only a zone with a fault pulses, so the animation
              stays an alarm signal rather than decoration. */}
          {pins.map(({ zone, x, y }) => {
            const color = zone.hasIssue ? '#f97316' : '#34d399';
            const open = openZoneId === zone.zoneId;
            return (
              <g
                key={zone.zoneId}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onOpenZoneRef.current(zone.zoneId); }}
              >
                <title>
                  {zone.roomName} (Zone {zone.zoneId}) — {zone.hasIssue ? 'Issue detected' : 'All healthy'} · click to open
                </title>
                {zone.hasIssue ? (
                  <>
                    <circle cx={x} cy={y} r="8" fill={color} className="hbms-svg-pulse" />
                    <circle cx={x} cy={y} r="8" fill={color} className="hbms-svg-pulse hbms-svg-pulse-delay" />
                  </>
                ) : (
                  <circle cx={x} cy={y} r="10" fill={color} fillOpacity="0.22" />
                )}
                {open && <circle cx={x} cy={y} r="13" fill="none" stroke={color} strokeWidth="1.6" />}
                <circle
                  cx={x} cy={y} r={zone.hasIssue ? 7 : 5.5}
                  fill={color} stroke="#071028" strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Layer controls — bottom-right, clear of the map view's own HUD row */}
      <div
        className="absolute bottom-3 right-3 z-[5] flex items-center gap-0.5 rounded-xl border px-1 py-1"
        style={{ background: 'rgba(8,32,58,0.92)', borderColor: 'rgba(1,163,164,0.28)', backdropFilter: 'blur(14px)' }}
      >
        {(['satellite', 'dark'] as Basemap[]).map((b) => (
          <button
            key={b}
            onClick={() => setBasemap(b)}
            title={b === 'satellite' ? 'Satellite imagery' : 'Dark basemap'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-colors"
            style={{
              background: basemap === b ? 'rgba(1,163,164,0.22)' : 'transparent',
              color: basemap === b ? '#22C7C6' : '#8A9BA8',
            }}
          >
            {b === 'satellite' ? <Satellite className="w-3 h-3" /> : <MapIcon className="w-3 h-3" />}
            {b === 'satellite' ? 'Satellite' : 'Dark'}
          </button>
        ))}
        <span className="w-px self-stretch mx-0.5" style={{ background: 'rgba(1,163,164,0.28)' }} />
        <button
          onClick={() => setShowRooms((v) => !v)}
          title="Show the building's room layer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-colors"
          style={{
            background: showRooms ? 'rgba(1,163,164,0.22)' : 'transparent',
            color: showRooms ? '#22C7C6' : '#8A9BA8',
          }}
        >
          <Layers className="w-3 h-3" /> Rooms
        </button>
      </div>
    </div>
  );
};

export default TerminalGeoMap;
