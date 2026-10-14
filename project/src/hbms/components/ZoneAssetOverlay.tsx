// ─────────────────────────────────────────────────────────────────────────────
// src/components/ZoneAssetOverlay.tsx
// The asset layer that sits on a zone image — the pins plus the detail cards
// they open. Shared by the Dashboard map (PASTerminalMap's Zone 23 drill-down)
// and the LBMS map (LBMSFloorMap's zone drill-down), so both open the exact
// same card: the restricted AHU parameter view (AHUParamsPanel), the same one
// the LBMS Operator grid opens.
//
// The card is an in-map tooltip, not a portal'd full-height sidebar: it lives
// inside the map div and nothing dismisses it except its own X — no
// outside-click, no Escape, no auto-close when another one is opened. That way
// several assets can be open at once and compared side by side. Each card
// opens in its own slot across the map width so they don't land on top of each
// other, and can be dragged anywhere inside the map by its header.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import type { AHUAsset } from '../lbmsAssets';
import AHUParamsPanel from './AHUParamsPanel';
import { useAHURuntime } from '../AHURuntimeContext';

export interface ZonePin {
  asset: AHUAsset;
  /** Position on the zone image, as a % of its width/height. */
  xPct: number;
  yPct: number;
}

const CARD_W = 220;
/** The faulted (pulsing) pin reads as sitting slightly left of the equipment
 *  symbol it marks on the drawing — nudge it right to sit on it. */
const FAULT_PIN_NUDGE_X = 4.5;

const statusColor = (status: AHUAsset['status']) => (status === 'Fault' ? '#ef4444' : '#34d399');
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Only a Fault pulses — a healthy unit gets a static halo, so the animation
 *  stays a real alarm signal rather than background noise. */
const Pin: React.FC<{ pin: ZonePin; open: boolean; onClick: () => void }> = ({ pin, open, onClick }) => {
  const { asset, xPct, yPct } = pin;
  const color = statusColor(asset.status);
  const isFault = asset.status === 'Fault';
  return (
    <button
      onClick={onClick}
      title={`${asset.id} — ${asset.status} (click for details)`}
      className="absolute flex items-center justify-center"
      style={{
        left: `${xPct}%`, top: `${yPct}%`, width: 34, height: 34,
        marginLeft: -17 + (isFault ? FAULT_PIN_NUDGE_X : 0), marginTop: -17,
        pointerEvents: 'auto',
      }}
    >
      {/* Ring marking the pin whose card is currently open — stands in for a
          leader line back to the card. */}
      {open && (
        <span className="absolute rounded-full" style={{ width: 27, height: 27, border: `1.5px solid ${color}`, opacity: 0.85 }} />
      )}
      <span
        className="absolute rounded-full"
        style={isFault
          ? { width: 14, height: 14, background: color, animation: 'hbms-zone-alert-pulse 1.6s ease-out infinite' }
          : { width: 17, height: 17, background: `${color}2e` }}
      />
      <span
        className="relative rounded-full border-2"
        style={{
          width: 11, height: 11, background: color,
          borderColor: '#071028',
          boxShadow: `0 0 ${isFault ? 10 : 7}px ${color}`,
          ...(isFault ? { animation: 'hbms-zone-alert-core-pulse 1.6s ease-in-out infinite', ['--pulse-color' as string]: color } : {}),
        }}
      />
    </button>
  );
};

const ZoneAssetOverlay: React.FC<{ pins: ZonePin[] }> = ({ pins }) => {
  const { getLiveAsset, toggleRunStop, toggleManual } = useAHURuntime();
  const wrapRef = useRef<HTMLDivElement>(null);
  // Open order doubles as stacking order — the most recently touched card is
  // on top.
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [dragged, setDragged] = useState<Record<string, { leftPct: number; topPct: number }>>({});
  const drag = useRef<{ id: string; dxPct: number; dyPct: number } | null>(null);

  /** Cards open in evenly spread slots rather than on top of their pin: the
   *  whole point of opening several is comparing them, and pins in one zone
   *  sit close together. Dragging overrides the slot. */
  const posFor = (id: string) => {
    if (dragged[id]) return dragged[id];
    const i = Math.max(0, pins.findIndex(p => p.asset.id === id));
    // topPct clears the map's own top-left HUD row (back button / zone badge)
    return { leftPct: 2.5 + i * (92 / Math.max(pins.length, 1)), topPct: 12 };
  };

  const bringToFront = (id: string) => setOpenIds(ids => (ids.includes(id) ? [...ids.filter(x => x !== id), id] : [...ids, id]));
  const closeCard = (id: string) => setOpenIds(ids => ids.filter(x => x !== id));

  const startDrag = (id: string) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    bringToFront(id);
    const cur = posFor(id);
    drag.current = {
      id,
      dxPct: ((e.clientX - rect.left) / rect.width) * 100 - cur.leftPct,
      dyPct: ((e.clientY - rect.top) / rect.height) * 100 - cur.topPct,
    };
    const onMove = (ev: MouseEvent) => {
      const d = drag.current;
      const r = wrapRef.current?.getBoundingClientRect();
      if (!d || !r) return;
      setDragged(prev => ({
        ...prev,
        [d.id]: {
          leftPct: clamp(((ev.clientX - r.left) / r.width) * 100 - d.dxPct, -2, 97),
          topPct: clamp(((ev.clientY - r.top) / r.height) * 100 - d.dyPct, 0, 90),
        },
      }));
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    // Transparent to the pointer so only the pins and cards are clickable.
    <div ref={wrapRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {pins.map(pin => (
        <Pin
          key={pin.asset.id}
          pin={pin}
          open={openIds.includes(pin.asset.id)}
          onClick={() => bringToFront(pin.asset.id)}
        />
      ))}

      {openIds.map((id, i) => {
        const pin = pins.find(p => p.asset.id === id);
        if (!pin) return null;
        const asset = getLiveAsset(pin.asset);
        const color = statusColor(asset.status);
        const { leftPct, topPct } = posFor(id);
        return (
          <div
            key={id}
            onMouseDown={() => bringToFront(id)}
            className="absolute rounded-xl border overflow-hidden flex flex-col animate-fade-in"
            style={{
              left: `${leftPct}%`, top: `${topPct}%`, width: CARD_W, maxHeight: '84%',
              zIndex: 20 + i, pointerEvents: 'auto',
              background: 'rgba(7,16,40,0.98)',
              borderColor: `${color}55`,
              boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
            }}
          >
            <div
              onMouseDown={startDrag(id)}
              className="flex items-center gap-1.5 px-2.5 py-2 flex-shrink-0"
              style={{
                borderBottom: '1px solid rgba(1,163,164,0.20)',
                cursor: 'grab', userSelect: 'none',
              }}
              title="Drag to move"
            >
              <GripHorizontal className="w-3 h-3 flex-shrink-0" style={{ color: '#8A9BA8' }} />
              <span
                className="text-[length:calc(10px*var(--fs))] font-extrabold truncate"
                style={{ fontFamily: 'monospace', color: '#E6EEF6' }}
                title={asset.id}
              >
                {asset.id}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[length:calc(8px*var(--fs))] font-bold uppercase tracking-wide flex-shrink-0"
                style={{ background: `${color}20`, color, border: `1px solid ${color}55` }}
              >
                {asset.status}
              </span>
              <button
                onClick={() => closeCard(id)}
                onMouseDown={e => e.stopPropagation()}
                className="ml-auto flex-shrink-0 transition-colors"
                style={{ color: '#8A9BA8' }}
                aria-label={`Close ${asset.id}`}
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'thin' }}>
              <AHUParamsPanel asset={asset} scale={0.72} onToggleRunStop={() => toggleRunStop(pin.asset)} onToggleManual={() => toggleManual(pin.asset)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ZoneAssetOverlay;
