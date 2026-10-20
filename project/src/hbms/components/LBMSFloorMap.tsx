/**
 * LBMS's map, everywhere it appears — the dedicated "Map view" tab (full page)
 * and, via SubsystemPage's `mapComponent` prop, the small map panels on the
 * Supervisor and Operator tabs, so every map surface in LBMS is one component.
 *
 * Map-first, on real imagery. It used to open on a 3x2 grid of CAD floor-plan
 * images and only become a map once one was picked; that grid is gone, and so
 * is the schematic default — the map opens on a level directly, over
 * georeferenced satellite/dark tiles (`TerminalGeoMap`), because a zone marker
 * means nothing operationally until it sits on the ground the building actually
 * stands on. The schematic (`TerminalFloorPlan`) is still one click away on the
 * Plan/Geo toggle: it reads faster when the question is programme rather than
 * place, and it is the surface the zone drill-down animates over.
 *
 * From there the click flow is the source's exactly — pick a LEVEL on the floor
 * strip → click a ZONE marker (the view zooms towards the zone and the zone
 * detail takes the motion over, carrying that zone's AHU pins) → click an ASSET
 * pin (opens the restricted parameter faceplate, the same card the Operator grid
 * opens). Zone 23 on 1F is the one zone flagged with a real issue; every other
 * zone on every floor holds only Working assets — see lbmsAssets' zonesForFloor.
 *
 * The source drove the zoom with react-leaflet (CRS.Simple + flyTo). The
 * schematic path here has no map library under it, so the plan is a plain <img>
 * on a CSS-transformed stage: flyTo(target, zoom) becomes a transform to the
 * same point, with the easing and durations kept, plus wheel-zoom and drag-pan.
 * The zone handover, the pins and the cards were already plain DOM in the source
 * and are unchanged.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Compass, Globe, Maximize, Minus, Plus, Square } from 'lucide-react';
import {
  ALERT_ZONE, ALERT_FLOOR, LEVEL_LABELS, LEVEL_ORDER, LEVEL_PROGRAMME,
  PLAN_H, PLAN_W, ROOM_STYLES, categoriesOn, roomForZone,
  type LevelKey, type TerminalRoom,
} from '../terminalPlan';
import { AHU_FLOOR_ORDER, zonesForFloor, type AHUAsset, type FloorZone } from '../lbmsAssets';
import TerminalFloorPlan from './TerminalFloorPlan';
import TerminalGeoMap from './TerminalGeoMap';
import ZoneAssetOverlay, { type ZonePin } from './ZoneAssetOverlay';
import PanoramaViewer from './PanoramaViewer';
import NearbyCameras from './NearbyCameras';
import { sceneForRoom } from '../panorama';

/** Scale the plan settles at when a zone is focused, and the extra push it
 *  keeps making underneath the zone image so the handover reads as one
 *  uninterrupted move rather than a stall. Same intent as the source's
 *  FOCUS_ZOOM / FOCUS_ZOOM + 0.8. */
const FOCUS_SCALE = 2.6;
const DEEP_SCALE = 4.2;
const MIN_SCALE = 1;
const MAX_SCALE = 8;

/** Timings copied from the source so the drill-down feels identical. */
const ZONE_FLY_HANDOVER_MS = 620;
const ZONE_IMG_EXIT_MS = 400;

/** Where a zone's 1-2 AHUs sit within the opened room, as a percentage of the
 *  room detail view. */
const ZONE_IMAGE_PIN_POS = [{ xPct: 34, yPct: 46 }, { xPct: 62, yPct: 62 }];

/**
 * The opened zone, drawn large: the room's own footprint with its structural
 * grid, so the AHU pins sit on a drawing rather than a photograph. Replaces the
 * source's single `1F_zone_23.png`, which was reused for every zone on every
 * level and therefore told the operator nothing about where they were.
 *
 * The viewBox is fixed at 200 x 112 and the room is fitted inside it, so text
 * and line weights stay constant whatever the room's own proportions are.
 */
const RoomDetail: React.FC<{ room?: TerminalRoom }> = ({ room }) => {
  if (!room) return null;
  const style = ROOM_STYLES[room.category];

  const VB_W = 200;
  const VB_H = 112;
  const MARGIN = 16;

  // Fit the room's real aspect inside the frame rather than stretching it.
  const availW = VB_W - MARGIN * 2;
  const availH = VB_H - MARGIN * 2 - 8; // 8 leaves room for the caption
  const aspect = room.w / room.h;
  let rw = availW;
  let rh = rw / aspect;
  if (rh > availH) { rh = availH; rw = rh * aspect; }
  const rx = (VB_W - rw) / 2;
  const ry = MARGIN + 4;

  // Structural bays on a roughly 10-unit grid, as the real halls are framed.
  const cols = Math.max(2, Math.round(rw / 22));
  const rows = Math.max(2, Math.round(rh / 22));

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
      <defs>
        <pattern id="room-grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="rgba(37,99,235,0.07)" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#04101F" />
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#room-grid)" />

      {/* Room envelope */}
      <rect x={rx} y={ry} width={rw} height={rh} fill={style.fill} stroke={style.stroke} strokeWidth="0.8" rx="1" />

      {/* Structural grid + columns */}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = rx + ((i + 1) * rw) / cols;
        return <line key={`c${i}`} x1={x} y1={ry} x2={x} y2={ry + rh} stroke="rgba(37,99,235,0.14)" strokeWidth="0.25" strokeDasharray="1.5 1.5" />;
      })}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = ry + ((i + 1) * rh) / rows;
        return <line key={`r${i}`} x1={rx} y1={y} x2={rx + rw} y2={y} stroke="rgba(37,99,235,0.14)" strokeWidth="0.25" strokeDasharray="1.5 1.5" />;
      })}
      {Array.from({ length: cols - 1 }, (_, i) =>
        Array.from({ length: rows - 1 }, (_, j) => (
          <rect
            key={`p${i}-${j}`}
            x={rx + ((i + 1) * rw) / cols - 0.5}
            y={ry + ((j + 1) * rh) / rows - 0.5}
            width="1" height="1" fill="rgba(37,99,235,0.30)"
          />
        )),
      )}

      {/* Name plate */}
      <text x={rx} y={ry - 4} fill={style.text} fontSize="2.8" fontWeight="800" letterSpacing="0.4">
        {room.name.toUpperCase()}
      </text>
      {room.detail && (
        <text x={rx} y={ry + rh + 6} fill="rgba(184,197,209,0.7)" fontSize="2.4" letterSpacing="0.2">
          {room.detail}
        </text>
      )}
      <text x={rx + rw} y={ry - 3.5} fill="rgba(138,155,168,0.6)" fontSize="2.4" textAnchor="end" letterSpacing="0.3">
        {Math.round(room.w)} × {Math.round(room.h)} plan units
      </text>
    </svg>
  );
};

interface Transform { scale: number; x: number; y: number }
const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

const assetPinColor = (status: AHUAsset['status']) => (status === 'Fault' ? '#ef4444' : '#34d399');

interface Props {
  /** Level the map opens on. Defaults to the level carrying the seeded fault. */
  initialFloor?: LevelKey;
}

const LBMSFloorMap: React.FC<Props> = ({ initialFloor = ALERT_FLOOR }) => {
  // Always a level — there is no "no floor selected" state any more. The map
  // used to open on a 3x2 grid of CAD floor-plan images and only become a map
  // once one was picked; that grid is gone (real imagery only), so the map
  // opens on a level directly and the floor strip is how you change level.
  const [openFloor, setOpenFloor] = useState<LevelKey>(initialFloor);
  const [openZoneId, setOpenZoneId] = useState<string | null>(null);
  const [zoneImgMounted, setZoneImgMounted] = useState(false);
  const [zoneImgVisible, setZoneImgVisible] = useState(false);
  const [pendingAlertFocus, setPendingAlertFocus] = useState(false);
  // Both open over the map rather than replacing it — the operator keeps the
  // plan while looking closer at one room.
  const [showPano, setShowPano] = useState(false);
  const [cameraFocus, setCameraFocus] = useState<string | null>(null);
  const [showCameras, setShowCameras] = useState(false);
  // Real georeferenced imagery is the default surface everywhere in this
  // console now: a zone marker means nothing operationally until it is on the
  // ground the building actually stands on. The schematic is still one click
  // away — it reads faster when the question is programme rather than place.
  const [base, setBase] = useState<'plan' | 'geo'>('geo');

  // Closing clears openZoneId immediately so the plan can start moving back
  // out, but the image still has an exit to play — keep the last zone around
  // to render against until it has actually gone.
  const lastZoneRef = useRef<FloorZone | null>(null);

  // ── Pan / zoom stage ─────────────────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [tf, setTf] = useState<Transform>(IDENTITY);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [openFloor]);

  /** Where a [xPct, yPct] of the plan lands in stage pixels. The SVG is drawn
   *  with preserveAspectRatio="xMidYMid meet", so it letterboxes inside the
   *  stage exactly as `object-fit: contain` would, and markers compensate the
   *  same way. */
  const pointFor = useCallback(
    (xPct: number, yPct: number) => {
      if (!box.w || !box.h) return { x: 0, y: 0 };
      const planRatio = PLAN_W / PLAN_H;
      const boxRatio = box.w / box.h;
      const w = planRatio > boxRatio ? box.w : box.h * planRatio;
      const h = planRatio > boxRatio ? box.w / planRatio : box.h;
      const ox = (box.w - w) / 2;
      const oy = (box.h - h) / 2;
      return { x: ox + (xPct / 100) * w, y: oy + (yPct / 100) * h };
    },
    [box],
  );

  /** The source's flyTo(target, zoom): centre `target` and scale to `scale`. */
  const flyTo = useCallback(
    (xPct: number, yPct: number, scale: number) => {
      const p = pointFor(xPct, yPct);
      setTf({ scale, x: box.w / 2 - p.x * scale, y: box.h / 2 - p.y * scale });
    },
    [box, pointFor],
  );

  /** The source's flyToBounds(bounds): back out to the whole floor. */
  const flyToWhole = useCallback(() => setTf(IDENTITY), []);

  // A fresh floor always starts back at the zone-marker overview.
  useEffect(() => {
    setOpenZoneId(null);
    setTf(IDENTITY);
  }, [openFloor]);

  const activeFloor = openFloor;
  // zonesForFloor builds a fresh array on every call, so memoise it — the
  // effects below depend on these and would otherwise re-run forever.
  const zones = useMemo(
    () => (activeFloor && (AHU_FLOOR_ORDER as readonly string[]).includes(activeFloor)
      ? zonesForFloor(activeFloor as never)
      : []),
    [activeFloor],
  );
  const openZone = useMemo(
    () => (openZoneId ? zones.find((z) => z.zoneId === openZoneId) ?? null : null),
    [zones, openZoneId],
  );
  if (openZone) lastZoneRef.current = openZone;

  // Entering via the grid's alert marker opens 1F already zoomed onto Zone 23.
  useEffect(() => {
    if (!pendingAlertFocus || !zones.length || !box.w) return;
    const zone = zones.find((z) => z.zoneId === ALERT_ZONE) ?? zones.find((z) => z.hasIssue);
    if (zone) setOpenZoneId(zone.zoneId);
    setPendingAlertFocus(false);
  }, [pendingAlertFocus, zones, box.w]);

  // Opening a zone: let the zoom carry the eye in first, then hand over to the
  // zone image. Closing runs the same move backwards — the image shrinks and
  // fades while the plan moves back out, and only unmounts once it has.
  useEffect(() => {
    if (!openZoneId) {
      setShowPano(false);
      setShowCameras(false);
      setCameraFocus(null);
      setZoneImgVisible(false);
      const t = window.setTimeout(() => setZoneImgMounted(false), ZONE_IMG_EXIT_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setZoneImgMounted(true), ZONE_FLY_HANDOVER_MS);
    return () => window.clearTimeout(t);
  }, [openZoneId]);

  // Mount first, reveal on the next frame, so the CSS transition has a state
  // to animate from.
  useEffect(() => {
    if (!zoneImgMounted) return;
    const raf = requestAnimationFrame(() => setZoneImgVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [zoneImgMounted]);

  // Drive the stage: settle on the zone, keep pushing in once the image has
  // taken over, or back out to the whole floor.
  useEffect(() => {
    if (!box.w) return;
    if (!openZone) { flyToWhole(); return; }
    flyTo(openZone.xPct, openZone.yPct, zoneImgMounted ? DEEP_SCALE : FOCUS_SCALE);
  }, [openZone, zoneImgMounted, box.w, flyTo, flyToWhole]);

  const onWheel = (e: React.WheelEvent) => {
    if (openZone) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTf((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (e.deltaY < 0 ? 1.18 : 1 / 1.18)));
      const k = next / prev.scale;
      return { scale: next, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k };
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (openZone || tf.scale <= MIN_SCALE) return;
    e.preventDefault();
    dragRef.current = { x: e.clientX, y: e.clientY, tx: tf.x, ty: tf.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setTf((prev) => ({ ...prev, x: d.tx + (e.clientX - d.x), y: d.ty + (e.clientY - d.y) }));
    };
    const up = () => { dragRef.current = null; setDragging(false); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging]);

  const zoomBy = (k: number) =>
    setTf((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * k));
      const r = next / prev.scale;
      return { scale: next, x: box.w / 2 - (box.w / 2 - prev.x) * r, y: box.h / 2 - (box.h / 2 - prev.y) * r };
    });

  const zoneForImage = openZone ?? lastZoneRef.current;
  const imagePins: ZonePin[] = (zoneForImage?.assets ?? []).map((asset, i) => ({
    asset,
    ...(ZONE_IMAGE_PIN_POS[i] ?? ZONE_IMAGE_PIN_POS[ZONE_IMAGE_PIN_POS.length - 1]),
  }));

  const hudBg = 'rgba(8,32,58,0.92)';
  const hudBorder = 'rgba(37,99,235,0.28)';
  const hudTextMuted = '#8A9BA8';
  const hudAccent = '#3B82F6';

  /** A marker, positioned against the letterboxed drawing and scaled back
   *  down so it keeps its size as the plan zooms in. */
  const markerStyle = (xPct: number, yPct: number): React.CSSProperties => {
    const p = pointFor(xPct, yPct);
    return {
      position: 'absolute',
      left: p.x,
      top: p.y,
      transform: `translate(-50%, -50%) scale(${1 / tf.scale})`,
      transformOrigin: 'center center',
    };
  };

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#04101F' }}>
      {/* ── Real imagery: MapLibre over open tiles, our rooms on top ────── */}
      {base === 'geo' && !openZone && (
        <div className="absolute inset-0">
          <TerminalGeoMap
            level={activeFloor}
            zones={zones}
            openZoneId={openZoneId}
            onOpenZone={(id) => setOpenZoneId(id)}
          />
        </div>
      )}

      {/* ── The schematic pan/zoom stage ─────────────────────────────────── */}
      {(base === 'plan' || openZone) && (
      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        style={{ cursor: openZone ? 'default' : dragging ? 'grabbing' : tf.scale > MIN_SCALE ? 'grab' : 'default' }}
      >
        <div
          className={`floor-stage absolute inset-0${dragging ? ' is-dragging' : ''}`}
          style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.scale})` }}
        >
          <div className="absolute inset-0">
            <TerminalFloorPlan level={activeFloor} />
          </div>

          {/* Stage 1: zone markers across the whole floor — hidden once a
              zone is open, as in the source. */}
          {!openZone && zones.map((zone) => {
            const color = zone.hasIssue ? '#f97316' : '#34d399';
            const size = zone.hasIssue ? 18 : 13;
            const core = zone.hasIssue ? 14 : 10;
            return (
              <button
                key={zone.zoneId}
                onClick={(e) => { e.stopPropagation(); setOpenZoneId(zone.zoneId); }}
                title={`${zone.roomName} (Zone ${zone.zoneId}) — ${zone.hasIssue ? 'Issue detected' : 'All healthy'} · click to open`}
                className="flex items-center justify-center group"
                style={{ ...markerStyle(zone.xPct, zone.yPct), width: 38, height: 38, cursor: 'pointer' }}
              >
                {/* Only what needs attention pulses, so the animation stays a
                    genuine alarm signal on a map full of working equipment. */}
                {zone.hasIssue ? (
                  <>
                    <span className="absolute rounded-full" style={{ width: size, height: size, background: color, animation: 'hbms-zone-alert-pulse 1.8s ease-out infinite' }} />
                    <span className="absolute rounded-full" style={{ width: size, height: size, background: color, animation: 'hbms-zone-alert-pulse 1.8s ease-out infinite', animationDelay: '0.6s' }} />
                  </>
                ) : (
                  <span className="absolute rounded-full" style={{ width: size + 5, height: size + 5, background: `${color}2e` }} />
                )}
                <span
                  className="relative rounded-full border-2"
                  style={{
                    width: core, height: core, background: color, borderColor: '#071028',
                    boxShadow: `0 0 ${zone.hasIssue ? 12 : 7}px ${color}`,
                    ...(zone.hasIssue ? { animation: 'hbms-zone-alert-core-pulse 1.8s ease-in-out infinite', ['--pulse-color' as string]: color } : {}),
                  }}
                />
                <span
                  className="absolute whitespace-nowrap rounded px-1 py-0.5 text-[length:calc(8px*var(--fs))] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ top: -16, background: hudBg, border: `1px solid ${color}66`, color }}
                >
                  {zone.roomName}
                </span>
              </button>
            );
          })}

          {/* Stage 2: this zone's AHU asset pins, on the plan underneath the
              zone image while the handover plays. */}
          {openZone && openZone.assets.map((asset) => {
            const color = assetPinColor(asset.status);
            const isFault = asset.status === 'Fault';
            return (
              <span
                key={asset.id}
                className="flex items-center justify-center pointer-events-none"
                style={{ ...markerStyle(asset.xPct, asset.yPct), width: 30, height: 30 }}
              >
                <span
                  className="absolute rounded-full"
                  style={isFault
                    ? { width: 16, height: 16, background: color, animation: 'hbms-zone-alert-pulse 1.8s ease-out infinite' }
                    : { width: 19, height: 19, background: `${color}2e` }}
                />
                <span
                  className="relative rounded-full border-2"
                  style={{
                    width: 12, height: 12, background: color, borderColor: '#071028',
                    boxShadow: `0 0 ${isFault ? 10 : 7}px ${color}`,
                    ...(isFault ? { animation: 'hbms-zone-alert-core-pulse 1.8s ease-in-out infinite', ['--pulse-color' as string]: color } : {}),
                  }}
                />
              </span>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Zone image drill-down — stacked over the plan so it can take the
           zoom over with its own transform, independent of the stage. ───── */}
      {zoneImgMounted && zoneForImage && (
        <div
          className={`zone-drill-layer absolute inset-0 z-[60] flex items-center justify-center overflow-hidden${zoneImgVisible ? ' is-open' : ''}`}
          style={{ background: '#04101F', pointerEvents: zoneImgVisible ? 'auto' : 'none' }}
        >
          <div className="zone-drill-inner">
            {/* The opened zone, drawn from the plan rather than a second
                raster — the room's own footprint, enlarged, with its AHUs on
                it. The source reused one PNG for every zone on every floor;
                this shows the room the operator actually opened. */}
            <RoomDetail room={roomForZone(activeFloor, zoneForImage.zoneId)} />
            <ZoneAssetOverlay pins={imagePins} />
          </div>

          <button
            onClick={() => setOpenZoneId(null)}
            className="absolute top-4 left-4 z-[70] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:brightness-125"
            style={{ background: hudBg, borderColor: hudBorder, color: hudTextMuted, backdropFilter: 'blur(14px)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to floor plan
          </button>

          <div className="absolute top-4 right-4 z-[70] flex items-center gap-2">
            {sceneForRoom(zoneForImage.roomId ?? '') && (
              <button
                onClick={() => setShowPano((v) => !v)}
                title="Open the 360° view of this room"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[length:calc(10px*var(--fs))] font-bold transition-all hover:brightness-125"
                style={{
                  background: showPano ? 'rgba(37,99,235,0.28)' : hudBg,
                  borderColor: 'rgba(37,99,235,0.45)',
                  color: '#93C5FD',
                  backdropFilter: 'blur(14px)',
                }}
              >
                <Compass className="w-3 h-3" /> 360° view
              </button>
            )}
            <button
              onClick={() => setShowCameras((v) => !v)}
              title="Cameras covering this room"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[length:calc(10px*var(--fs))] font-bold transition-all hover:brightness-125"
              style={{
                background: showCameras ? 'rgba(59,130,246,0.24)' : hudBg,
                borderColor: 'rgba(59,130,246,0.42)',
                color: '#93C5FD',
                backdropFilter: 'blur(14px)',
              }}
            >
              <Camera className="w-3 h-3" /> Cameras
            </button>
            <div
              className="px-3 py-1.5 rounded-xl border text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-widest"
              style={{
                background: hudBg,
                borderColor: zoneForImage.hasIssue ? 'rgba(249,115,22,0.4)' : 'rgba(52,211,153,0.4)',
                color: zoneForImage.hasIssue ? '#f97316' : '#34d399',
                backdropFilter: 'blur(14px)',
              }}
            >
              {zoneForImage.roomName} — {LEVEL_LABELS[activeFloor] ?? activeFloor}
            </div>
          </div>

          {/* 360° room view — a panel over the map, maximisable, never a
              separate screen. */}
          {showPano && (() => {
            const scene = sceneForRoom(zoneForImage.roomId ?? '');
            if (!scene) return null;
            return (
              <PanoramaViewer
                scene={scene}
                onClose={() => setShowPano(false)}
                onOpenCamera={(cameraId) => { setCameraFocus(cameraId); setShowCameras(true); }}
              />
            );
          })()}

          {/* Cameras with a view of this room. */}
          {showCameras && (() => {
            const room = roomForZone(activeFloor, zoneForImage.zoneId);
            if (!room) return null;
            return (
              <NearbyCameras
                room={room}
                level={activeFloor}
                initialCameraId={cameraFocus}
                onClose={() => { setShowCameras(false); setCameraFocus(null); }}
              />
            );
          })()}
        </div>
      )}

      {/* Badge + zoom-out. The old "All floors" button led back to the grid of
          plan images, which no longer exists — the floor strip below is now the
          only thing that changes level, and it does it without leaving the map. */}
      <div className="absolute top-3 left-3 z-[40] flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium pointer-events-none"
          style={{ background: hudBg, borderColor: 'rgba(37,99,235,0.28)', backdropFilter: 'blur(14px)' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: '#2563EB', boxShadow: '0 0 6px #2563EB' }} />
          <span className="tracking-widest font-semibold uppercase text-[length:calc(10px*var(--fs))]" style={{ color: '#93C5FD' }}>
            DPS Terminal — {LEVEL_LABELS[activeFloor] ?? activeFloor}{openZone ? ` · ${openZone.roomName}` : ''}
          </span>
        </div>
        {openZone && (
          <button
            onClick={() => setOpenZoneId(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[length:calc(10px*var(--fs))] font-bold transition-all hover:brightness-125 animate-fade-in"
            style={{ background: hudBg, borderColor: 'rgba(52,211,153,0.4)', color: '#34d399', backdropFilter: 'blur(14px)' }}
          >
            <ArrowLeft className="w-3 h-3" /> Zoom out
          </button>
        )}
        {!openZone && (
          <div
            className="flex items-center gap-0.5 rounded-xl border px-1 py-1"
            style={{ background: hudBg, borderColor: hudBorder, backdropFilter: 'blur(14px)' }}
          >
            <button
              onClick={() => setBase('plan')}
              title="Schematic plan"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-colors"
              style={{ background: base === 'plan' ? 'rgba(37,99,235,0.22)' : 'transparent', color: base === 'plan' ? hudAccent : hudTextMuted }}
            >
              <Square className="w-3 h-3" /> Plan
            </button>
            <button
              onClick={() => setBase('geo')}
              title="Real imagery of the airport, with the rooms drawn on it"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-colors"
              style={{ background: base === 'geo' ? 'rgba(37,99,235,0.22)' : 'transparent', color: base === 'geo' ? hudAccent : hudTextMuted }}
            >
              <Globe className="w-3 h-3" /> Real map
            </button>
          </div>
        )}
      </div>

      {/* Zoom controls — Leaflet gave these for free; the stage needs its own. */}
      {!openZone && base === 'plan' && (
        <div
          className="absolute bottom-3 left-3 z-[40] flex flex-col rounded-xl border overflow-hidden"
          style={{ background: hudBg, borderColor: hudBorder, backdropFilter: 'blur(14px)' }}
        >
          <button onClick={() => zoomBy(1.4)} title="Zoom in" className="px-2 py-1.5 hover:brightness-125" style={{ color: hudTextMuted }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => zoomBy(1 / 1.4)} title="Zoom out" className="px-2 py-1.5 border-t hover:brightness-125" style={{ color: hudTextMuted, borderColor: hudBorder }}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={flyToWhole} title="Fit floor" className="px-2 py-1.5 border-t hover:brightness-125" style={{ color: hudTextMuted, borderColor: hudBorder }}>
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Legend — the plan uses colour to separate room categories, so it
           needs a key. Only the categories actually on this level are shown. */}
      {!openZone && base === 'plan' && (
        <div
          className="absolute z-[40] bottom-3 right-3 rounded-xl border px-2.5 py-2 max-w-[210px]"
          style={{ background: hudBg, borderColor: hudBorder, backdropFilter: 'blur(14px)' }}
        >
          <div className="text-[length:calc(8px*var(--fs))] font-bold uppercase tracking-widest mb-1.5" style={{ color: hudTextMuted }}>
            {LEVEL_PROGRAMME[activeFloor]}
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1">
            {categoriesOn(activeFloor).map((cat) => {
              const st = ROOM_STYLES[cat];
              return (
                <span key={cat} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-[2px] shrink-0"
                    style={{ background: st.fill, border: `1px solid ${st.stroke}` }}
                  />
                  <span className="text-[length:calc(8px*var(--fs))]" style={{ color: st.text }}>{st.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Level switcher — a strip in the HUD row rather than a right-hand
           panel, which used to sit over the easternmost aerobridge stands. */}
      <div
        className="absolute z-[40] top-3 right-3 flex items-center gap-0.5 rounded-xl border px-1 py-1"
        style={{ background: hudBg, borderColor: hudBorder, backdropFilter: 'blur(14px)' }}
      >
        {LEVEL_ORDER.map((floor) => {
          const active = activeFloor === floor;
          return (
            <button
              key={floor}
              onClick={() => setOpenFloor(floor)}
              title={`${LEVEL_LABELS[floor]} — ${LEVEL_PROGRAMME[floor]}`}
              className="relative px-2 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-colors"
              style={{
                background: active ? 'rgba(37,99,235,0.22)' : 'transparent',
                color: active ? hudAccent : hudTextMuted,
              }}
            >
              {floor}
              {floor === ALERT_FLOOR && (
                <span
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#f97316', boxShadow: '0 0 5px #f97316' }}
                />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default LBMSFloorMap;
