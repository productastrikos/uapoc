/**
 * Real 360° scenes — Google Street View panoramas at Ngurah Rai (DPS).
 *
 * These are genuine Google panoramas, embedded through the keyless Maps Embed
 * URL (`/maps/embed?pb=…`) — the "Share → Embed" link. No API key, no billing.
 *
 * ── The constraint this shape exists to handle ─────────────────────────────
 * The embed is a cross-origin iframe. We cannot draw inside it and we cannot
 * read where the viewer has panned, so a hotspot pinned onto a piece of
 * equipment is not possible on this path. Instead each scene carries its
 * hotspots as *headings*: the viewer lists them beside the panorama, and
 * selecting one rebuilds the embed URL at that heading, so the panorama turns
 * to face the equipment. Clicking a hotspot still opens its detail card.
 *
 * With a Maps JavaScript API key, `StreetViewPanorama` exposes `pov_changed`
 * and custom overlays, and the hotspots could move inside the image instead;
 * the data below already carries everything that would need.
 *
 * ── Adding a scene ─────────────────────────────────────────────────────────
 * In Google Maps, drop Pegman where you want, then Share → Embed a map, and
 * copy the `pb=` value out of the iframe src. Its parts:
 *   !1s<panoId>  !2m2!1d<lat>!2d<lng>  !3f<heading>  !4f<pitch>  !5f<fov>
 * Put the pano id, lat, lng and default heading here; the viewer builds the
 * rest.
 */

import type { LevelKey } from './terminalPlan';

export interface PanoHotspot {
  id: string;
  /** Compass heading to face for this hotspot, in degrees. */
  heading: number;
  /** Pitch, in degrees. Positive looks up. */
  pitch?: number;
  kind: 'asset' | 'alert' | 'camera';
  label: string;
  /** AHU / device id this hotspot stands for, when it maps to a real asset. */
  assetId?: string;
  detail?: string;
}

export interface PanoScene {
  id: string;
  title: string;
  level: LevelKey;
  roomId: string;
  /** Google Street View panorama id, from the embed's `!1s` field. */
  panoId: string;
  lat: number;
  lng: number;
  /** Heading the scene opens at. */
  heading: number;
  pitch?: number;
  /** The embed's `!5f` zoom term. Lower is wider. */
  fov?: number;
  /** Where the panorama actually stands, when that is not the room itself. */
  vantage?: string;
  hotspots: PanoHotspot[];
}

/**
 * Street View covers the landside frontage and, usefully, the concourse
 * interior at DPS — Google has indoor coverage inside the terminal.
 * It does not cover plant rooms — there will never be a Google panorama inside
 * a chiller hall — so those rooms carry no scene and the viewer says so rather
 * than showing a stand-in.
 */
export const PANO_SCENES: PanoScene[] = [
  {
    id: 'pano-dps-frontage',
    title: 'Terminal Concourse — Ngurah Rai',
    level: '1F',
    roomId: 'f1-checkin-dom',
    panoId: '6d4nK9cLzyZGKRm9faUYFg',
    lat: -8.744905866675607,
    lng: 115.1663632413581,
    heading: 193.55893880609986,
    pitch: 0,
    fov: 0.7820865974627469,
    vantage: 'Google indoor Street View, concourse level near the gates',
    hotspots: [
      { id: 'hs-ahu-fault', heading: 193, kind: 'alert', label: 'AHU-306-1F-EXT1', assetId: 'AHU-306-1F-EXT1', detail: 'Supply fan tripped — zone offline, thermal compliance breach. Serves this concourse and the check-in hall beyond it.' },
      { id: 'hs-ahu-ok', heading: 250, kind: 'asset', label: 'AHU-301-1F-EXT1', assetId: 'AHU-301-1F-EXT1', detail: 'Running · auto mode' },
      { id: 'hs-intake', heading: 120, kind: 'asset', label: 'Fresh air intake louvres', detail: 'FAF intake serving this zone — maintains the positive pressure envelope' },
      { id: 'hs-cam-1', heading: 60, kind: 'camera', label: 'CAM-1F-214', detail: 'Check-in row 12 overview' },
      { id: 'hs-cam-2', heading: 330, kind: 'camera', label: 'CAM-1F-218', detail: 'Hall east entrance' },
    ],
  },
];

export const sceneForRoom = (roomId: string): PanoScene | undefined =>
  PANO_SCENES.find((s) => s.roomId === roomId);

export const sceneForLevel = (level: LevelKey): PanoScene | undefined =>
  PANO_SCENES.find((s) => s.level === level);

/**
 * Builds the keyless Maps Embed URL for a scene at a given heading.
 *
 * `pb` is Google's own positional encoding; the fields we vary are the pano
 * id, the position and the heading. `!4v<ms>` is a cache-buster, and it has to
 * change for the iframe to re-render at a new heading.
 */
export function streetViewEmbedUrl(
  scene: PanoScene,
  heading = scene.heading,
  pitch = scene.pitch ?? 0,
): string {
  const v = Date.now();
  const fov = scene.fov ?? 0.78;
  const pb =
    `!4v${v}!6m8!1m7` +
    `!1s${scene.panoId}` +
    `!2m2!1d${scene.lat}!2d${scene.lng}` +
    `!3f${heading}` +
    `!4f${pitch}` +
    `!5f${fov}`;
  return `https://www.google.com/maps/embed?pb=${pb}`;
}
