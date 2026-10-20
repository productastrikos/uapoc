/**
 * The 360 view, with asset markers over it.
 *
 * ── Interaction ────────────────────────────────────────────────────────────
 * The embed handles its own dragging. An earlier version took pointer events
 * away from the iframe so the heading was always known and markers could track
 * the image exactly — correct, and much worse to use: every turn had to reload
 * the embed, so a drag did nothing until you let go and then took a second to
 * catch up. Native drag is instant and smooth, so it wins.
 *
 * The trade is that Street View is cross-origin: once you drag inside it we
 * cannot read where you ended up, so a marker is positioned for the heading the
 * app last *commanded* — the alert chip, a hotspot in the rail, or a turn
 * button — and will not line up after a free drag. That is the agreed trade:
 * the marker exists to say which unit is in alarm and roughly where it sits,
 * and it does that whenever the view is aimed by the app.
 *
 * ── Markers are off until asked for ────────────────────────────────────────
 * Pins over every asset turn a photograph into a diagram, so the view opens
 * clean and "Assets" reveals them. The alarm is the exception — it stays on a
 * chip at the top, and taking that chip aims the view at the unit and switches
 * the markers on.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, EyeOff, Wind,
} from 'lucide-react';
import { streetViewEmbedUrl, type PanoHotspot, type PanoScene } from '../panorama';

/**
 * Horizontal field of view the embed shows, in degrees.
 *
 * Google does not publish this and the embed's `!5f` term is a zoom factor, not
 * an angle, so it is calibrated by eye. A hotspot the view is aimed at sits
 * dead centre whatever this is; it only affects how far off-centre the others
 * are drawn.
 */
const FOV = 88;

/** Beyond this the marker is behind you; drawing it would be a lie. */
const VISIBLE_MARGIN = 8;

const PITCH_LIMIT = 30;
const TURN_STEP = 30;
const PITCH_STEP = 12;

const KIND_STYLE: Record<PanoHotspot['kind'], { colour: string; Icon: React.ElementType }> = {
  alert: { colour: '#f97316', Icon: AlertTriangle },
  asset: { colour: '#34d399', Icon: Wind },
  camera: { colour: '#3B82F6', Icon: Camera },
};

/** Signed difference from→to, wrapped to [-180, 180]. */
const angleDelta = (from: number, to: number) => {
  const d = ((to - from + 540) % 360) - 180;
  return d === -180 ? 180 : d;
};

const norm = (deg: number) => ((deg % 360) + 360) % 360;

const HUD_BG = 'rgba(7,16,40,0.82)';
const HUD_BORDER = '1px solid rgba(255,255,255,0.16)';
const HUD_FG = '#B8C5D1';

interface Props {
  scene: PanoScene;
  heading: number;
  pitch: number;
  onPov: (heading: number, pitch: number) => void;
  selected: PanoHotspot | null;
  onSelect: (hotspot: PanoHotspot) => void;
}

const PanoStage: React.FC<Props> = ({ scene, heading, pitch, onPov, selected, onSelect }) => {
  const [showAssets, setShowAssets] = useState(false);

  /**
   * Built only when the point of view actually changes.
   *
   * `streetViewEmbedUrl` stamps `Date.now()` into the URL as a cache-buster, so
   * calling it during render gives a different `src` every render — the iframe
   * reloads constantly and the panel is black most of the time. Memoising it is
   * what keeps the embed stable.
   */
  const src = useMemo(() => streetViewEmbedUrl(scene, heading, pitch), [scene, heading, pitch]);

  const turn = useCallback(
    (deg: number) => onPov(norm(heading + deg), pitch),
    [heading, pitch, onPov],
  );
  const tilt = useCallback(
    (deg: number) => onPov(heading, Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + deg))),
    [heading, pitch, onPov],
  );

  /** The alarm this scene exists to show, if it has one. */
  const alertSpot = scene.hotspots.find((h) => h.kind === 'alert') ?? null;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#02080F' }}>
      {/* The image, dragged natively. */}
      <iframe
        key={scene.panoId}
        src={src}
        title={`${scene.title} — Street View`}
        className="absolute w-full h-full"
        style={{
          border: 0,
          // Crop Google's own chrome out of the frame.
          top: -58, left: 0, height: 'calc(100% + 92px)', width: 'calc(100% + 62px)',
        }}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {/* Markers, placed for the heading the app last aimed at. Positioned in
          percentages so nothing has to measure the box. */}
      {showAssets && scene.hotspots.map((h) => {
        const dx = angleDelta(heading, h.heading);
        if (Math.abs(dx) > FOV / 2 + VISIBLE_MARGIN) return null;

        const { colour, Icon } = KIND_STYLE[h.kind];
        const isSel = selected?.id === h.id;
        const isAlert = h.kind === 'alert';
        const leftPct = 50 + (dx / FOV) * 100;
        const topPct = 50 - (((h.pitch ?? 0) - pitch) / FOV) * 100;
        const edge = Math.max(0, Math.abs(dx) - FOV / 2);

        return (
          <button
            key={h.id}
            onClick={() => onSelect(h)}
            title={`${h.label}${h.detail ? ` — ${h.detail}` : ''}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
            style={{ left: `${leftPct}%`, top: `${topPct}%`, opacity: 1 - edge / VISIBLE_MARGIN }}
          >
            <span className="relative flex items-center justify-center">
              {isAlert && (
                <span
                  className="absolute w-11 h-11 rounded-full animate-ping"
                  style={{ background: `${colour}33`, border: `1px solid ${colour}` }}
                />
              )}
              <span
                className="relative flex items-center justify-center rounded-full border-2"
                style={{
                  width: isSel ? 36 : 30,
                  height: isSel ? 36 : 30,
                  background: `${colour}33`,
                  borderColor: colour,
                  boxShadow: `0 0 16px 3px ${colour}88, 0 2px 6px rgba(0,0,0,0.7)`,
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: colour }} />
              </span>
            </span>
            <span className="w-px h-4" style={{ background: `${colour}AA` }} />
            <span
              className="px-1.5 py-0.5 rounded whitespace-nowrap text-[length:calc(9px*var(--fs))] font-bold font-mono"
              style={{
                background: 'rgba(7,16,40,0.94)',
                border: `1px solid ${colour}66`,
                color: colour,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {h.label}
            </span>
          </button>
        );
      })}

      {/* Look controls, laid out as the directions they are: left on the left
          edge, right on the right, up at the top, down at the bottom. */}
      <button
        onClick={() => turn(-TURN_STEP)}
        title={`Turn left ${TURN_STEP}°`}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-14 rounded-lg flex items-center justify-center hover:brightness-125"
        style={{ background: HUD_BG, border: HUD_BORDER, color: HUD_FG }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => turn(TURN_STEP)}
        title={`Turn right ${TURN_STEP}°`}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-14 rounded-lg flex items-center justify-center hover:brightness-125"
        style={{ background: HUD_BG, border: HUD_BORDER, color: HUD_FG }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => tilt(PITCH_STEP)}
        title={`Look up ${PITCH_STEP}°`}
        disabled={pitch >= PITCH_LIMIT}
        className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-14 h-9 rounded-lg flex items-center justify-center hover:brightness-125 disabled:opacity-40"
        style={{ background: HUD_BG, border: HUD_BORDER, color: HUD_FG }}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <button
        onClick={() => tilt(-PITCH_STEP)}
        title={`Look down ${PITCH_STEP}°`}
        disabled={pitch <= -PITCH_LIMIT}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-14 h-9 rounded-lg flex items-center justify-center hover:brightness-125 disabled:opacity-40"
        style={{ background: HUD_BG, border: HUD_BORDER, color: HUD_FG }}
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      {/* Reveal the asset pins. Off by default. */}
      <button
        onClick={() => setShowAssets((v) => !v)}
        title={showAssets ? 'Hide asset markers' : 'Show asset markers in this view'}
        className="absolute right-2 bottom-2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:brightness-125"
        style={{
          background: showAssets ? 'rgba(37,99,235,0.28)' : HUD_BG,
          border: `1px solid ${showAssets ? 'rgba(59,130,246,0.7)' : 'rgba(255,255,255,0.16)'}`,
          color: showAssets ? '#93C5FD' : HUD_FG,
        }}
      >
        {showAssets ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        Assets <span className="opacity-70">({scene.hotspots.length})</span>
      </button>

      {/* The alarm, pinned to the top whatever the marker toggle says — it is
          why this panel was opened. Taking it aims the view and shows the pins. */}
      {alertSpot && (
        <button
          onClick={() => { setShowAssets(true); onSelect(alertSpot); }}
          title={alertSpot.detail ?? `Face ${alertSpot.label}`}
          className="absolute top-2 left-2 z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:brightness-125"
          style={{ background: 'rgba(7,16,40,0.92)', border: '1px solid rgba(249,115,22,0.6)' }}
        >
          <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#f9731688' }} />
            <span className="relative w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
          </span>
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#fdba74' }} />
          <span className="text-xs font-bold font-mono" style={{ color: '#fdba74' }}>{alertSpot.label}</span>
          <span className="text-xs" style={{ color: '#8A9BA8' }}>· show in view</span>
        </button>
      )}
    </div>
  );
};

export default PanoStage;
