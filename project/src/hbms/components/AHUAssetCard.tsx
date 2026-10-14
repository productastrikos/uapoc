// ─────────────────────────────────────────────────────────────────────────────
// src/components/AHUAssetCard.tsx
// Compact grid-cell card for the LBMS Operator view's paginated AHU grid
// (public/all_asset_view.png style) — clicking opens AHUAssetDetailCard with
// the same restricted parameter set rendered by AHUParamsPanel.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { AHUAsset } from '../lbmsAssets';
import AHUParamsPanel from './AHUParamsPanel';
import { useLiveAHUAsset } from '../AHURuntimeContext';

const AHUAssetCard: React.FC<{ asset: AHUAsset; onClick: () => void }> = ({ asset: baseAsset, onClick }) => {
  const [asset, toggleRunStop, toggleManual] = useLiveAHUAsset(baseAsset);
  const faultColor = asset.status === 'Fault';
  return (
    <button
      onClick={onClick}
      title={`${asset.id} — ${asset.status} (click for details)`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: '100%', overflow: 'hidden', padding: '10px 6px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
        background: 'var(--app-surface)',
        border: `1px solid ${faultColor ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: faultColor ? '0 0 0 1px rgba(239,68,68,0.15) inset' : 'none',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10.5, fontWeight: 800, color: faultColor ? '#f87171' : '#9BEAE8' }}>{asset.id}</span>
      </div>
      <AHUParamsPanel asset={asset} scale={0.7} onToggleRunStop={toggleRunStop} onToggleManual={toggleManual} />
    </button>
  );
};

export default AHUAssetCard;
