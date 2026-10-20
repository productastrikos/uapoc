/**
 * Real 360° Street View of the room, as a panel over the map.
 *
 * Deliberately not full screen: the operator is working the plan, and the
 * panorama is a way of looking closer without losing it. Maximize steps the
 * panel up to fill the map, then the console.
 *
 * The panorama is Google's keyless Maps Embed, so it is a cross-origin iframe:
 * nothing can be drawn inside it and its camera cannot be read. Hotspots
 * therefore live in a rail beside the image — an alert row pulses, selecting a
 * row turns the panorama to face that equipment, and clicking one opens its
 * detail card over the panel, which is the same rule the zone map follows.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Camera, Compass, ExternalLink, Eye, Maximize2, Minimize2, Video, X,
} from 'lucide-react';
import type { PanoHotspot, PanoScene } from '../panorama';
import PanoStage from './PanoStage';

const HOTSPOT_STYLE: Record<PanoHotspot['kind'], { color: string; ring: string; label: string }> = {
  alert: { color: '#f97316', ring: 'rgba(249,115,22,0.30)', label: 'Alert' },
  asset: { color: '#34d399', ring: 'rgba(52,211,153,0.26)', label: 'Asset' },
  camera: { color: '#3B82F6', ring: 'rgba(59,130,246,0.26)', label: 'Camera' },
};

interface Props {
  scene: PanoScene;
  onClose: () => void;
  /** Called when a hotspot that maps to a real asset is opened. */
  onOpenAsset?: (assetId: string) => void;
  /** Called when a camera hotspot is opened, so the console can show the feed. */
  onOpenCamera?: (cameraId: string) => void;
}

const PanoramaViewer: React.FC<Props> = ({ scene, onClose, onOpenAsset, onOpenCamera }) => {
  const [heading, setHeading] = useState(scene.heading);
  const [pitch, setPitch] = useState(scene.pitch ?? 0);
  // Opens at map size, not as a thumbnail in the corner. A 360 scene shown
  // small is not something anyone can orient themselves in, and it was easy to
  // miss it had opened at all.
  const [size, setSize] = useState<'panel' | 'map' | 'full'>('map');
  const [selected, setSelected] = useState<PanoHotspot | null>(null);

  useEffect(() => {
    setHeading(scene.heading);
    setPitch(scene.pitch ?? 0);
    setSelected(null);
  }, [scene.id, scene.heading, scene.pitch]);

  const lookAt = (h: PanoHotspot) => {
    setHeading(h.heading);
    setPitch(h.pitch ?? 0);
    setSelected((s) => (s?.id === h.id ? s : h));
  };

  const sizeClass =
    size === 'full' ? 'inset-2'
    : size === 'map' ? 'inset-4'
    : 'left-4 bottom-4 w-[620px] h-[310px]';

  const alerts = scene.hotspots.filter((h) => h.kind === 'alert').length;

  return (
    <div
      className={`absolute ${sizeClass} z-[80] rounded-xl border overflow-hidden flex flex-col animate-fade-in`}
      style={{
        background: 'rgba(7,16,40,0.97)',
        borderColor: alerts > 0 ? 'rgba(249,115,22,0.45)' : 'rgba(37,99,235,0.42)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(37,99,235,0.22)', background: 'rgba(8,32,58,0.9)' }}
      >
        <Compass className="w-3.5 h-3.5 shrink-0" style={{ color: '#3B82F6' }} />
        <div className="min-w-0">
          <div className="text-[length:calc(11px*var(--fs))] font-bold text-text-primary leading-tight truncate">{scene.title}</div>
          {scene.vantage && (
            <div className="text-[8.5px] truncate" style={{ color: '#8A9BA8' }}>{scene.vantage}</div>
          )}
        </div>
        <span
          className="text-[length:calc(9px*var(--fs))] px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: 'rgba(37,99,235,0.18)', color: '#93C5FD' }}
        >
          Street View
        </span>
        {alerts > 0 && (
          <span
            className="flex items-center gap-1 text-[length:calc(9px*var(--fs))] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(249,115,22,0.18)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.4)' }}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {alerts} alert{alerts > 1 ? 's' : ''}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&pano=${scene.panoId}&heading=${heading}`}
            target="_blank"
            rel="noreferrer"
            title="Open in Google Maps"
            className="p-1 rounded hover:bg-white/10"
            style={{ color: '#8A9BA8' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setSize((s) => (s === 'panel' ? 'map' : s === 'map' ? 'full' : 'panel'))}
            title={size === 'panel' ? 'Expand' : size === 'map' ? 'Fill console' : 'Restore'}
            className="p-1 rounded hover:bg-white/10"
            style={{ color: '#8A9BA8' }}
          >
            {size === 'full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} title="Close" className="p-1 rounded hover:bg-white/10" style={{ color: '#8A9BA8' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* The panorama itself */}
        <div className="relative flex-1 min-w-0" style={{ background: '#02080F' }}>
          <PanoStage
            scene={scene}
            heading={heading}
            pitch={pitch}
            onPov={(h, pv) => { setHeading(h); setPitch(pv); }}
            selected={selected}
            onSelect={(h) => lookAt(h)}
          />

          <div
            className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg pointer-events-none"
            style={{ background: 'rgba(7,16,40,0.82)', border: '1px solid rgba(37,99,235,0.24)' }}
          >
            <Compass className="w-3 h-3" style={{ color: '#8A9BA8' }} />
            <span className="text-[length:calc(9px*var(--fs))] font-mono" style={{ color: '#B8C5D1' }}>
              {Math.round(((heading % 360) + 360) % 360).toString().padStart(3, '0')}°
            </span>
            <span className="text-[length:calc(8px*var(--fs))]" style={{ color: '#8A9BA8' }}>drag inside to look around</span>
            <span className="text-[length:calc(8px*var(--fs))]" style={{ color: '#5C7A8C' }}></span>
          </div>
        </div>

        {/* Hotspot rail — the panorama is cross-origin, so the pins live here
            rather than on the image, and selecting one turns the view. */}
        <div
          className="w-[192px] shrink-0 flex flex-col min-h-0"
          style={{ borderLeft: '1px solid rgba(37,99,235,0.22)', background: 'rgba(5,12,28,0.85)' }}
        >
          <div className="px-2 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(37,99,235,0.16)' }}>
            <div className="text-[length:calc(9px*var(--fs))] font-bold uppercase tracking-wider" style={{ color: '#8A9BA8' }}>
              In this view
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-1.5 space-y-1">
            {scene.hotspots.map((h) => {
              const st = HOTSPOT_STYLE[h.kind];
              const isSel = selected?.id === h.id;
              const Icon = h.kind === 'camera' ? Video : h.kind === 'alert' ? AlertTriangle : Eye;
              return (
                <button
                  key={h.id}
                  onClick={() => lookAt(h)}
                  title={`Turn the view to ${h.label}`}
                  className="w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg border text-left transition-colors"
                  style={{
                    background: isSel ? `${st.color}1f` : 'rgba(255,255,255,0.03)',
                    borderColor: isSel ? `${st.color}88` : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
                    {h.kind === 'alert' && (
                      <span
                        className="absolute rounded-full"
                        style={{ width: 12, height: 12, background: st.color, animation: 'hbms-zone-alert-pulse 1.7s ease-out infinite' }}
                      />
                    )}
                    <Icon className="relative w-3 h-3" style={{ color: st.color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9.5px] font-bold font-mono truncate" style={{ color: '#E6EEF6' }}>
                      {h.label}
                    </span>
                    <span className="block text-[length:calc(8px*var(--fs))]" style={{ color: '#8A9BA8' }}>
                      {st.label} · {Math.round(h.heading)}°
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail card for the selected hotspot — over the panel, as the
              zone map's asset cards are over the plan. */}
          {selected && (
            <div
              className="shrink-0 p-1.5 animate-fade-in"
              style={{ borderTop: `1px solid ${HOTSPOT_STYLE[selected.kind].color}44` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: HOTSPOT_STYLE[selected.kind].color }} />
                <span className="text-[9.5px] font-mono font-bold truncate" style={{ color: '#E6EEF6' }}>{selected.label}</span>
                <button onClick={() => setSelected(null)} className="ml-auto shrink-0" style={{ color: '#8A9BA8' }} aria-label="Close">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[8.5px] leading-relaxed mb-1.5" style={{ color: '#B8C5D1' }}>
                {selected.detail ?? 'No further detail recorded.'}
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {selected.assetId && onOpenAsset && (
                  <button
                    onClick={() => onOpenAsset(selected.assetId!)}
                    className="text-[length:calc(8px*var(--fs))] font-bold px-1.5 py-0.5 rounded border"
                    style={{ background: 'rgba(37,99,235,0.16)', borderColor: 'rgba(37,99,235,0.45)', color: '#93C5FD' }}
                  >
                    Open asset
                  </button>
                )}
                {selected.kind === 'camera' && onOpenCamera && (
                  <button
                    onClick={() => onOpenCamera(selected.label)}
                    className="flex items-center gap-1 text-[length:calc(8px*var(--fs))] font-bold px-1.5 py-0.5 rounded border"
                    style={{ background: 'rgba(59,130,246,0.16)', borderColor: 'rgba(59,130,246,0.45)', color: '#93C5FD' }}
                  >
                    <Camera className="w-2.5 h-2.5" /> View feed
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanoramaViewer;
