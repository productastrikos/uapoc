// ─────────────────────────────────────────────────────────────────────────────
// src/components/AHUParamsPanel.tsx
// The single restricted parameter view for an AHU asset — Run/Stop, Manual,
// Trip, RA Temp, SA Temp, FAN RPM, FAN, VSD-RPM, RA Pressure, Cooling Coil
// Valve %, Duct Smoke, Pre-Filter, Bag-Filter. Nothing else (per
// public/asset_details_card.png). Shared by AHUAssetCard (compact, in the
// paginated grid), AHUAssetDetailCard (large, modal) and ZoneAssetOverlay's
// map pin cards, so all three flows render literally the same markup.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { AHUAsset } from '../lbmsAssets';

const StatusDot: React.FC<{ on: boolean; size?: number }> = ({ on, size = 14 }) => (
  <span
    style={{
      width: size, height: size, borderRadius: '50%', display: 'inline-block',
      background: on ? 'radial-gradient(circle at 35% 30%, #6ee7b7, #10b981)' : 'radial-gradient(circle at 35% 30%, #fca5a5, #dc2626)',
      boxShadow: `0 0 ${size * 0.6}px ${on ? '#34d399' : '#ef4444'}90`,
      border: '1px solid rgba(0,0,0,0.25)',
    }}
  />
);

// Run/Stop is the one control an operator can actually act on (everything
// else here is read-only telemetry) — when a toggle handler is supplied this
// renders as a real (keyboard-reachable) control instead of a bare dot. A
// `role="button"` div rather than a `<button>` because every call site here
// can itself be nested inside a `<button>` (AHUAssetCard's whole card is one)
// and a `<button>` inside a `<button>` is invalid HTML.
const RunStopControl: React.FC<{ on: boolean; size: number; labelSize: number; onToggle?: () => void }> = ({ on, size, labelSize, onToggle }) => {
  const interactive = !!onToggle;
  const activate = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onToggle?.();
  };
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? on : undefined}
      title={interactive ? `Click to ${on ? 'stop' : 'start'} this AHU` : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); } } : undefined}
      className={interactive ? 'ahu-runstop-control' : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        cursor: interactive ? 'pointer' : undefined,
        borderRadius: 7, padding: 2, margin: -2,
      }}
    >
      <StatusDot on={on} size={size} />
      <span style={{ fontSize: labelSize, color: 'var(--ds-text-muted)', fontWeight: 600 }}>Run / Stop</span>
    </div>
  );
};

// Manual/Auto is its own clickable control (mirrors RunStopControl's
// dot-plus-label shape and bottom alignment) rather than a bare inline badge
// — the badge used to sit vertically centered in the row, which put it right
// on top of the Run/Stop dot above and its label below with almost no
// breathing room. Wrapping it in the same flex-column shape, bottom-aligned
// with the other two columns' captions, gives it the same clearance they get.
const ManualControl: React.FC<{ on: boolean; size: number; labelSize: number; onToggle?: () => void }> = ({ on, size, labelSize, onToggle }) => {
  const interactive = !!onToggle;
  const activate = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onToggle?.();
  };
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? on : undefined}
      title={interactive ? `Click to switch to ${on ? 'Auto' : 'Manual'}` : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); } } : undefined}
      className={interactive ? 'ahu-runstop-control' : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
        cursor: interactive ? 'pointer' : undefined,
        borderRadius: 8, padding: 2, margin: -2,
      }}
    >
      <span
        style={{
          fontSize: Math.round(labelSize * 1.2), fontWeight: 700,
          padding: `${Math.round(size * 0.22)}px ${Math.round(size * 0.55)}px`,
          borderRadius: 999, whiteSpace: 'nowrap',
          border: `1px solid ${on ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.15)'}`,
          color: on ? '#3B82F6' : 'var(--ds-text-muted)',
          background: on ? 'rgba(59,130,246,0.12)' : 'transparent',
        }}
      >
        {on ? 'Manual' : 'Auto'}
      </span>
      <span style={{ fontSize: labelSize, color: 'var(--ds-text-muted)', fontWeight: 600 }}>Mode</span>
    </div>
  );
};

const MiniBarChart: React.FC<{ raTemp: number; saTemp: number; scale: number }> = ({ raTemp, saTemp, scale }) => {
  const max = 30;
  const h = Math.round(64 * scale);
  const bars = [
    { label: 'RA Temp', value: raTemp, color: '#34d399' },
    { label: 'SA Temp', value: saTemp, color: '#34d399' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: Math.round(14 * scale), height: h + Math.round(20 * scale) }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: h, fontSize: Math.round(7.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>
        <span>25°</span><span>20°</span><span>15°</span><span>10°</span>
      </div>
      {bars.map(b => (
        <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(3 * scale) }}>
          <span style={{ fontSize: Math.round(10.5 * scale), fontWeight: 800, color: '#E6EEF6' }}>{b.value}°</span>
          <div style={{ width: Math.round(26 * scale), height: h, display: 'flex', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ width: '100%', height: `${Math.min(100, (b.value / max) * 100)}%`, background: 'linear-gradient(180deg,#4ade80,#16a34a)', borderRadius: '2px 2px 0 0' }} />
          </div>
          <span style={{ fontSize: Math.round(8.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
};

// Semicircular gauge — green→yellow→orange→red band, a clearly visible
// needle, and its numeric value shown big and colored by the band it's
// currently pointing into (not just a bare arc with no readout).
const GAUGE_BANDS = [
  { to: 25,  color: '#34d399' },
  { to: 50,  color: '#facc15' },
  { to: 75,  color: '#fb923c' },
  { to: 100, color: '#f87171' },
];
const bandColorFor = (pct: number) => (GAUGE_BANDS.find(b => pct <= b.to) ?? GAUGE_BANDS[GAUGE_BANDS.length - 1]).color;

const MiniGauge: React.FC<{ label: string; pct: number; scale: number }> = ({ label, pct, scale }) => {
  const clamped = Math.max(0, Math.min(100, pct));
  // Geometry is derived from what actually gets drawn instead of being guessed
  // at: the arc sits `strokeW/2` inside the top of the box and the hub sits on
  // the baseline, so the SVG viewport is exactly as tall as the dial. It used
  // to be shorter than the drawing with overflow:visible, which let the arc
  // and needle spill downwards over the value and label underneath.
  const size = Math.round(84 * scale);
  const strokeW = Math.max(4, size * 0.115);
  const r = size * 0.36;
  const cx = size / 2;
  const cy = strokeW / 2 + r + 1;
  const hubR = Math.max(3, size * 0.065);
  const boxH = Math.ceil(cy + hubR + 2);

  const angleFor = (p: number) => Math.PI - (p / 100) * Math.PI;
  const arcPoint = (p: number, radius: number) => {
    const ang = angleFor(p);
    return [cx + radius * Math.cos(ang), cy - radius * Math.sin(ang)];
  };

  const a = angleFor(clamped);
  const needleLen = r * 0.82;
  const nx = cx + needleLen * Math.cos(a);
  const ny = cy - needleLen * Math.sin(a);
  // Needle drawn as a thin wedge (not a bare line) so it reads clearly
  // against the colored band at any gauge size.
  const perp = a + Math.PI / 2;
  const baseHalfW = Math.max(1.4, size * 0.026);
  const b1x = cx + baseHalfW * Math.cos(perp), b1y = cy - baseHalfW * Math.sin(perp);
  const b2x = cx - baseHalfW * Math.cos(perp), b2y = cy + baseHalfW * Math.sin(perp);
  const valueColor = bandColorFor(clamped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(3 * scale), width: size }}>
      <svg
        width={size}
        height={boxH}
        viewBox={`0 0 ${size} ${boxH}`}
        role="img"
        aria-label={`${label}: ${Math.round(clamped)}%`}
      >
        {/* Faint full track behind the colored band for contrast */}
        {(() => {
          const [x1, y1] = arcPoint(0, r);
          const [x2, y2] = arcPoint(100, r);
          return <path d={`M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} strokeLinecap="round" />;
        })()}
        {GAUGE_BANDS.map((band, i) => {
          const from = i === 0 ? 0 : GAUGE_BANDS[i - 1].to;
          const [x1, y1] = arcPoint(from, r);
          const [x2, y2] = arcPoint(band.to, r);
          return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`} fill="none" stroke={band.color} strokeWidth={strokeW} strokeLinecap="butt" opacity={0.92} />;
        })}
        {/* Needle — a wedge with a dark outline so it stays visible over any band color */}
        <polygon
          points={`${b1x.toFixed(1)},${b1y.toFixed(1)} ${nx.toFixed(1)},${ny.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}`}
          fill="#f8fafc" stroke="#071028" strokeWidth={Math.max(0.5, size * 0.01)} strokeLinejoin="round"
        />
        <circle cx={cx} cy={cy} r={hubR} fill="#f8fafc" stroke="#071028" strokeWidth={Math.max(0.5, size * 0.012)} />
      </svg>
      <span style={{ fontSize: Math.round(13 * Math.min(scale, 1.2) * 10) / 10, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{Math.round(clamped)}%</span>
      <span style={{
        fontSize: Math.round(8.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600,
        textAlign: 'center', lineHeight: 1.25, maxWidth: '100%',
      }}>
        {label}
      </span>
    </div>
  );
};

interface AHUParamsPanelProps {
  asset: AHUAsset;
  /** 1 = full-size detail view; smaller (e.g. 0.55) for grid cards. */
  scale?: number;
  /** Present only where the caller has a live/shared asset to update (grid
   *  card, detail sidebar, map pin card) — omitted anywhere the panel is
   *  rendering a frozen snapshot, so Run/Stop falls back to a plain dot. */
  onToggleRunStop?: () => void;
  /** Same deal as onToggleRunStop, for the Manual/Auto control. */
  onToggleManual?: () => void;
}

const AHUParamsPanel: React.FC<AHUParamsPanelProps> = ({ asset, scale = 1, onToggleRunStop, onToggleManual }) => {
  const f = Math.round(11 * scale * 10) / 10;
  const fanRpmLabel = String(Math.round(asset.fanRpm)).padStart(4, '0');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(10 * scale), width: '100%' }}>
      {/* Run/Stop · Manual · Trip — evenly-weighted columns, bottom-aligned so
          all three controls' captions share one baseline regardless of each
          control's own height, and a wider gap so the Manual pill doesn't
          crowd the dots on either side of it. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end', justifyItems: 'center', gap: Math.round(10 * scale) }}>
        <RunStopControl on={asset.runStop} size={Math.round(14 * scale)} labelSize={Math.round(7.5 * scale)} onToggle={onToggleRunStop} />
        <ManualControl on={asset.manual} size={Math.round(14 * scale)} labelSize={Math.round(7.5 * scale)} onToggle={onToggleManual} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <StatusDot on={!asset.trip} size={Math.round(14 * scale)} />
          <span style={{ fontSize: Math.round(7.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>Trip</span>
        </div>
      </div>

      {/* RA/SA Temp bar chart */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MiniBarChart raTemp={asset.raTemp} saTemp={asset.saTemp} scale={scale} />
      </div>

      {/* FAN RPM · FAN · VSD-RPM — alignItems:'end' so the value/dot columns
          share a baseline with the (taller) gauge instead of centering
          against its full height, which used to read as uneven/unaligned. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end', justifyItems: 'center', gap: Math.round(4 * scale) }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: f, fontWeight: 800, color: '#E6EEF6', fontVariantNumeric: 'tabular-nums', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: `${Math.round(2*scale)}px ${Math.round(7*scale)}px` }}>{fanRpmLabel}</span>
          <span style={{ fontSize: Math.round(7.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>FAN RPM</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <StatusDot on={asset.fanOn} size={Math.round(15 * scale)} />
          <span style={{ fontSize: Math.round(7.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>FAN</span>
        </div>
        <MiniGauge label="VSD - RPM" pct={asset.vsdRpmPct} scale={scale} />
      </div>

      {/* RA Pressure · Cooling Coil Valve % */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', gap: Math.round(4 * scale) }}>
        <MiniGauge label="RA Pressure" pct={asset.raPressurePct} scale={scale} />
        <MiniGauge label="Cooling Coil Valve - %" pct={asset.coolingValvePct} scale={scale} />
      </div>

      {/* Duct Smoke · Pre-Filter · Bag-Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', justifyItems: 'center', gap: Math.round(4 * scale) }}>
        {[
          { label: 'Duct Smoke', ok: asset.ductSmokeOk },
          { label: 'Pre-Filter', ok: asset.preFilterOk },
          { label: 'Bag-Filter', ok: asset.bagFilterOk },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <StatusDot on={s.ok} size={Math.round(14 * scale)} />
            <span style={{ fontSize: Math.round(7.5 * scale), color: 'var(--ds-text-muted)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AHUParamsPanel;
