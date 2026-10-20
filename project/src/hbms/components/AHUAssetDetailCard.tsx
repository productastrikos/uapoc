// ─────────────────────────────────────────────────────────────────────────────
// src/components/AHUAssetDetailCard.tsx
// AHU asset detail — a right-side slide-in panel (matching PASTerminalMap's
// AssetDetailSidebar pattern), shared by the LBMS Operator view's card grid
// (AHUAssetCard) and the Map view's floor pins (LBMSFloorMap), so both
// click-through flows land on the exact same restricted parameter view
// (public/asset_details_card.png) with no Nameplate/Site/Maintenance/
// Registration sections.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AHUAsset } from '../lbmsAssets';
import AHUParamsPanel from './AHUParamsPanel';
import { useLiveAHUAsset } from '../AHURuntimeContext';

const AHUAssetDetailCard: React.FC<{ asset: AHUAsset; onClose: () => void }> = ({ asset: baseAsset, onClose }) => {
  const [asset, toggleRunStop, toggleManual] = useLiveAHUAsset(baseAsset);
  const color = asset.status === 'Fault' ? '#ef4444' : '#34d399';
  return createPortal(
    <div
      className="fixed inset-y-0 right-0 z-[2200] flex flex-col animate-slide-in-right"
      style={{ width: 'min(340px, 92vw)', background: 'rgba(5,8,18,0.98)', borderLeft: `1px solid ${color}55`, boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}
    >
      <div className="flex-shrink-0 px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold text-text-primary">{asset.id}</p>
            <span
              className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[length:calc(9px*var(--fs))] font-bold uppercase tracking-wide"
              style={{ background: `${color}20`, color, border: `1px solid ${color}55` }}
            >
              {asset.status}
            </span>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
        <AHUParamsPanel asset={asset} scale={1.15} onToggleRunStop={toggleRunStop} onToggleManual={toggleManual} />
      </div>
    </div>,
    document.body,
  );
};

export default AHUAssetDetailCard;
