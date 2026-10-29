// components/SCADAEquipmentOverview.tsx
// Supervisor view for the SCADA KPI area — equipment status overview sourced from
// "Documents/Operational screen.xlsx" (device, qty, parameters, chart type per row).
import React from 'react';
import { useHbmsStore } from '../store/useHbmsStore';
import { Activity } from 'lucide-react';

type Param =
  | { kind: 'pie'; label: string; segments: { label: string; value: number; color: string }[]; filterType?: string; size?: number }
  | { kind: 'progress'; label: string; pct: number; sub?: string; filterType?: string }
  | { kind: 'bar'; label: string; ok: number; total: number; filterType?: string; orientation?: 'vertical' }
  | { kind: 'dot'; label: string; on: boolean; filterType?: string };

interface DeviceRow { code: string; name: string; qty: number; params: Param[] }

const OPEN_CLOSE = (open: number, close: number, size?: number): Param => ({
  kind: 'pie', label: 'Open / Close', size,
  segments: [{ label: 'Open', value: open, color: '#fbbf24' }, { label: 'Close', value: close, color: '#34d399' }],
});

// ── Sourced from Operational screen.xlsx (Device / Qty / Parameters / Chart Type) ──
const DEVICES: DeviceRow[] = [
  { code: 'TR',   name: 'Transformer',               qty: 12, params: [
      { kind: 'progress', label: 'Alarm-free', pct: 92, sub: '1 alarm: TR-T2-01' },
  ]},
  { code: 'VCB',  name: 'Vacuum Circuit Breaker',    qty: 33, params: [
      OPEN_CLOSE(3, 30),
      { kind: 'progress', label: 'Trip-free', pct: 97, sub: '1 tripped' },
  ]},
  { code: 'ACU',  name: 'Advanced Control Unit',    qty: 117, params: [
      { kind: 'bar', label: 'ACU Alm', ok: 113, total: 117 },
      { kind: 'bar', label: 'PSU Alm', ok: 115, total: 117 },
      { kind: 'bar', label: 'Conn',    ok: 112, total: 117 },
  ]},
  { code: 'AHF',  name: 'Active Harmonic Filter',   qty: 4, params: [
      { kind: 'bar', label: 'Run',   ok: 4, total: 4 },
      { kind: 'bar', label: 'Alarm', ok: 4, total: 4 },
      { kind: 'bar', label: 'Conn',  ok: 4, total: 4 },
  ]},
  { code: 'PFC',  name: 'Power Factor Correction',  qty: 12, params: [
      { kind: 'bar', label: 'Alarm-free', ok: 12, total: 12, orientation: 'vertical' },
      { kind: 'bar', label: 'Connection',  ok: 12, total: 12, orientation: 'vertical' },
  ]},
  { code: 'BC',   name: 'Battery Charger',          qty: 6, params: [
      { kind: 'bar', label: 'Run',        ok: 6, total: 6, orientation: 'vertical' },
      { kind: 'bar', label: 'Alarm-free', ok: 6, total: 6, orientation: 'vertical' },
  ]},
  { code: 'DM·PM·RDU', name: 'Digital / Power / Energy Meters', qty: 673, params: [
      { kind: 'bar', label: 'DM',  ok: 610, total: 622, filterType: 'Digital Meter' },
      { kind: 'bar', label: 'PM',  ok: 33,  total: 33,  filterType: 'Power Meter'  },
      { kind: 'bar', label: 'RDU', ok: 18,  total: 18,  filterType: 'Energy Meter' },
  ]},
  { code: 'PR',   name: 'Protection Relay',          qty: 46, params: [
      { kind: 'bar', label: 'Trip-free',  ok: 45, total: 46, orientation: 'vertical' },
      { kind: 'bar', label: 'Connection', ok: 45, total: 46, orientation: 'vertical' },
  ]},
  { code: 'UPS',  name: 'Uninterruptible Power Supply',                       qty: 8, params: [
      { kind: 'bar', label: 'Run',   ok: 8, total: 8 },
      { kind: 'bar', label: 'Alarm', ok: 8, total: 8 },
      { kind: 'bar', label: 'Conn',  ok: 8, total: 8 },
  ]},
  { code: 'SRF',  name: 'Surge Reduction Filter',    qty: 2, params: [
      { kind: 'bar', label: 'Run',        ok: 2, total: 2, orientation: 'vertical' },
      { kind: 'bar', label: 'Alarm-free', ok: 2, total: 2, orientation: 'vertical' },
  ]},
  { code: 'ACB',  name: 'Air Circuit Breaker',      qty: 100, params: [
      OPEN_CLOSE(8, 92, 84),
      { kind: 'bar', label: 'Trip-free',  ok: 99, total: 100 },
      { kind: 'bar', label: 'Connection', ok: 99, total: 100 },
  ]},
  { code: 'MCCB', name: 'Moulded Case Circuit Breaker', qty: 716, params: [
      OPEN_CLOSE(54, 662, 84),
      { kind: 'bar', label: 'Trip-free',  ok: 713, total: 716 },
      { kind: 'bar', label: 'Connection', ok: 711, total: 716 },
  ]},
  { code: 'LS',   name: 'Lighting Server',           qty: 1, params: [
      { kind: 'dot', label: 'On / Off', on: true },
  ]},
];

// Cards are grouped into rows, and within each row a card's width is weighted by
// its own param count — a 1-chart device gets less width, a 2-3-chart device gets
// more — so every row always fills 100% with zero leftover space.
const ROWS: DeviceRow[][] = [
  DEVICES.slice(0, 5),
  DEVICES.slice(5, 10),
  DEVICES.slice(10, 13),
];

// ── Chart primitives ──────────────────────────────────────────────────────────
const scaleFor = (count: number) => Math.min(2.6, 4.2 / count);

const PieMini: React.FC<{ segments: { label: string; value: number; color: string }[]; size?: number }> = ({ segments, size = 58 }) => {
  // default 58 (VCB); ACB/MCCB opt into a larger size since their bars are grouped
  // into one shared column, leaving the pie's own column free to grow into.
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  let cum = -90;
  const paths = segments.map((g, i) => {
    const a = (g.value / total) * 360;
    const a1 = (cum * Math.PI) / 180, a2 = ((cum + a) * Math.PI) / 180;
    cum += a;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    return <path key={i} d={`M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`} fill={g.color} opacity={0.95} stroke="rgba(7,16,40,0.6)" strokeWidth="0.6" />;
  });
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}>{paths}</svg>;
};

const pctColor = (pct: number) => (pct >= 98 ? '#34d399' : pct >= 90 ? '#fbbf24' : '#f87171');
const pctGradient = (pct: number) =>
  pct >= 98 ? 'linear-gradient(90deg,#059669,#34d399)' : pct >= 90 ? 'linear-gradient(90deg,#b45309,#fbbf24)' : 'linear-gradient(90deg,#b91c1c,#f87171)';

// A handful of failing units shouldn't read as alarming as a lot of them — only switch
// the badge to red once failures are a meaningful share of the total; a couple of strays
// out of hundreds stays amber.
const failBadgeColors = (pct: number) =>
  pct >= 90
    ? { background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.32)' }
    : { background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.32)' };

// Polished pill-style progress bar: rounded track, gradient fill, glow + glass highlight.
// Fills 100% of its flex parent so a card with few params stretches the bar to use the row.
const ProgressPill: React.FC<{ pct: number; height: number }> = ({ pct, height }) => {
  const color = pctColor(pct);
  return (
    <div style={{
      width: '100%', height, borderRadius: 99,
      background: 'rgba(32, 120, 207,0.08)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 99,
        background: pctGradient(pct),
        boxShadow: `0 0 8px ${color}88`,
        transition: 'width 0.4s ease',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 99,
          background: 'linear-gradient(180deg, rgba(32, 120, 207,0.35), rgba(32, 120, 207,0) 55%)',
        }} />
      </div>
    </div>
  );
};

// Horizontal stacked bar — OK and failing counts as two adjacent segments (not just a
// single partial fill), so a failing subset reads as its own colored chunk, not empty track.
const StackedBarMini: React.FC<{ ok: number; total: number; height: number }> = ({ ok, total, height }) => {
  const okPct = total > 0 ? (ok / total) * 100 : 0;
  const failPct = 100 - okPct;
  return (
    <div style={{
      width: '100%', height, borderRadius: 99, overflow: 'hidden', display: 'flex',
      background: 'rgba(32, 120, 207,0.08)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
    }}>
      {okPct > 0 && <div style={{ width: `${okPct}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#34d399)' }} />}
      {failPct > 0 && <div style={{ width: `${failPct}%`, height: '100%', background: 'linear-gradient(90deg,#b91c1c,#f87171)' }} />}
    </div>
  );
};

const ParamLabel: React.FC<{ children: React.ReactNode; scale: number }> = ({ children, scale }) => (
  <span style={{
    fontSize: Math.round(9 * Math.min(scale, 1.3) * 10) / 10, fontWeight: 600, color: 'var(--ds-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center', lineHeight: 1.15,
  }}>
    {children}
  </span>
);

// Every widget is independently clickable — clicking any pie/bar/progress/dot jumps
// straight to the Asset Register filtered to that exact device type.
const ClickableWidget: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
  <div
    title={title}
    onClick={e => { e.stopPropagation(); onClick(); }}
    style={{
      flex: 1, minWidth: 0, height: '100%', cursor: 'pointer', borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </div>
);

const ParamWidget: React.FC<{ param: Param; count: number; fallbackType: string; onSelect: (type: string, issue?: string) => void }> = ({ param, count, fallbackType, onSelect }) => {
  const scale = scaleFor(count);
  const type = param.filterType ?? fallbackType;
  const goToType = () => onSelect(type);

  if (param.kind === 'pie') {
    const tip = param.segments.map(s => `${s.label} ${s.value}`).join(' · ');
    return (
      <ClickableWidget title={`${type} — ${param.label}: ${tip} (click to view in Asset Register)`} onClick={goToType}>
        <PieMini segments={param.segments} size={param.size} />
        <ParamLabel scale={scale}>{param.label}</ParamLabel>
        <span style={{ fontSize: Math.round(10.5 * Math.min(scale, 1.3) * 10) / 10, fontWeight: 700, color: 'var(--ds-text-muted)', textAlign: 'center', maxWidth: '100%' }}>{tip}</span>
      </ClickableWidget>
    );
  }
  if (param.kind === 'progress') {
    return (
      <ClickableWidget title={`${type} — ${param.label} ${param.pct}%${param.sub ? ' — ' + param.sub : ''} (click to view in Asset Register)`} onClick={goToType}>
        <span style={{ fontSize: Math.round(17 * Math.min(scale, 1.4) * 10) / 10, fontWeight: 800, color: pctColor(param.pct), lineHeight: 1 }}>{param.pct}%</span>
        <ProgressPill pct={param.pct} height={Math.round(9 * Math.min(scale, 1.7))} />
        <ParamLabel scale={scale}>{param.label}</ParamLabel>
        {param.sub && <span style={{ fontSize: Math.round(10 * Math.min(scale, 1.3) * 10) / 10, color: 'var(--ds-text-muted)', textAlign: 'center', maxWidth: '100%' }}>{param.sub}</span>}
      </ClickableWidget>
    );
  }
  if (param.kind === 'bar') {
    const pct = Math.round((param.ok / param.total) * 100);
    // Bar charts stack multiple independent checks (e.g. UPS's Run/Alarm/Conn) on the
    // same physical units, so the type filter alone can't tell them apart — pass the
    // param's own label through as the "issue" so Asset Register can flag exactly
    // which units are failing THIS specific check.
    const goToIssue = () => onSelect(type, param.label);
    return (
      <ClickableWidget title={`${type} — ${param.label}: ${param.ok}/${param.total} OK (click to see which units in Asset Register)`} onClick={goToIssue}>
        <span style={{ fontSize: Math.round(16 * Math.min(scale, 1.4) * 10) / 10, fontWeight: 800, color: pctColor(pct), lineHeight: 1 }}>{pct}%</span>
        <StackedBarMini ok={param.ok} total={param.total} height={Math.round(9 * Math.min(scale, 1.7))} />
        <span style={{ fontSize: Math.round(13 * Math.min(scale, 1.3) * 10) / 10, fontWeight: 700, color: 'var(--ds-text-muted)', textAlign: 'center', maxWidth: '100%' }}>{param.ok}/{param.total}</span>
        <ParamLabel scale={scale}>{param.label}</ParamLabel>
      </ClickableWidget>
    );
  }
  const dotD = Math.round(16 * scale);
  return (
    <ClickableWidget title={`${type} — ${param.label}: ${param.on ? 'ON' : 'OFF'} (click to view in Asset Register)`} onClick={goToType}>
      <span style={{
        width: dotD, height: dotD, borderRadius: '50%',
        background: param.on ? 'radial-gradient(circle at 35% 30%, #6ee7b7, #10b981)' : 'radial-gradient(circle at 35% 30%, #fca5a5, #dc2626)',
        boxShadow: `0 0 ${Math.round(10 * scale)}px ${param.on ? '#34d399' : '#ef4444'}99`,
      }} />
      <span style={{ fontSize: Math.round(12.5 * Math.min(scale, 1.4) * 10) / 10, fontWeight: 800, color: param.on ? '#34d399' : '#f87171' }}>{param.on ? 'ON' : 'OFF'}</span>
      <ParamLabel scale={scale}>{param.label}</ParamLabel>
    </ClickableWidget>
  );
};

// ── Main panel ─────────────────────────────────────────────────────────────────

// A single horizontal bar row WITH its own X-axis scale line underneath — the
// building block for both BarChartMini (a whole card of these) and the grouped
// pie+bars cards (ACB/MCCB), where 2+ bars share a column instead of one each.
// Each row gets its own independent 0…total scale (not %), since sibling rows can
// represent very different population sizes (e.g. DM/PM/RDU: 622 vs 33 vs 18).
const BAR_LABEL_W = 50;
const BAR_VALUE_W = 100;

const AxisBarRow: React.FC<{
  param: Extract<Param, { kind: 'bar' }>;
  fallbackType: string;
  onSelect: (type: string, issue?: string) => void;
  barHeight?: number;
}> = ({ param: p, fallbackType, onSelect, barHeight = 10 }) => {
  const pct = Math.round((p.ok / p.total) * 100);
  const okShareOfBar = p.total > 0 ? (p.ok / p.total) * 100 : 0;
  const fail = p.total - p.ok;
  const type = p.filterType ?? fallbackType;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div
        onClick={() => onSelect(type, p.label)}
        title={`${type} — ${p.label}: ${p.ok}/${p.total} OK${fail > 0 ? `, ${fail} failing` : ''} (click to see which units in Asset Register)`}
        style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
      >
        {/* Y-axis category label */}
        <span style={{
          width: BAR_LABEL_W, flexShrink: 0, textAlign: 'right', fontSize: 9, fontWeight: 700,
          color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {p.label}
        </span>
        {/* Track with gridlines + stacked ok/fail fill, scaled to THIS row's own total */}
        <div style={{
          flex: 1, height: barHeight, borderRadius: 3, position: 'relative', overflow: 'hidden',
          backgroundColor: 'rgba(32, 120, 207,0.05)',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(32, 120, 207,0.12) 0, rgba(32, 120, 207,0.12) 1px, transparent 1px, transparent 25%)',
          borderLeft: '1px solid rgba(32, 120, 207,0.25)',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ width: `${okShareOfBar}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#34d399)' }} />
            {okShareOfBar < 100 && <div style={{ width: `${100 - okShareOfBar}%`, height: '100%', background: 'linear-gradient(90deg,#b91c1c,#f87171)' }} />}
          </div>
        </div>
        {/* Values, not percentages — the fail badge so a problem reads immediately,
            with no hover/click needed to find out "how many" (red only once failures
            are a meaningful share of the total; a couple of strays stays amber). */}
        <div style={{ width: BAR_VALUE_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: pctColor(pct), whiteSpace: 'nowrap' }}>{p.ok}/{p.total}</span>
          {fail > 0 && (
            <span style={{
              fontSize: 11.5, fontWeight: 800, padding: '1px 5px', borderRadius: 99, whiteSpace: 'nowrap',
              ...failBadgeColors(pct),
            }}>
              {fail} fail
            </span>
          )}
        </div>
      </div>
      {/* This row's own X-axis scale line — independent of the other rows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: BAR_LABEL_W, flexShrink: 0 }} />
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between',
          borderTop: '1px solid rgba(32, 120, 207,0.2)', paddingTop: 1,
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--ds-text-muted)' }}>0</span>
          <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--ds-text-muted)' }}>{p.total}</span>
        </div>
        <span style={{ width: BAR_VALUE_W, flexShrink: 0 }} />
      </div>
    </div>
  );
};

// Combined mini bar-chart — used when a card's parameters are ALL "bar" kind (ACU, AHF,
// UPS, DM·PM·RDU). Just stacks an AxisBarRow per param.
const BarChartMini: React.FC<{
  params: Extract<Param, { kind: 'bar' }>[];
  fallbackType: string;
  onSelect: (type: string, issue?: string) => void;
}> = ({ params, fallbackType, onSelect }) => (
  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
    {params.map((p, i) => <AxisBarRow key={i} param={p} fallbackType={fallbackType} onSelect={onSelect} />)}
  </div>
);

// 2+ bar params (e.g. ACB/MCCB's Trip-free + Connection) sharing ONE column instead
// of one column each, freeing the rest of the card (the pie) to grow into the space.
const StackedAxisBarGroup: React.FC<{
  params: Extract<Param, { kind: 'bar' }>[];
  fallbackType: string;
  onSelect: (type: string, issue?: string) => void;
}> = ({ params, fallbackType, onSelect }) => (
  <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
    {/* Taller bars than BarChartMini's default — this group only ever holds 2 rows
        sharing a column that's otherwise mostly empty space. */}
    {params.map((p, i) => <AxisBarRow key={i} param={p} fallbackType={fallbackType} onSelect={onSelect} barHeight={18} />)}
  </div>
);

// Vertical counterpart — used for cards whose params are flagged orientation:'vertical'
// (PR, BC, SRF, PFC): columns rise from a baseline, Y-axis is a real value scale on the
// left (not %), X-axis is the category labels along the bottom, each column double-stacked
// (OK segment + failing segment).
const VBAR_AXIS_W = 30;

const VerticalBarChartMini: React.FC<{
  params: Extract<Param, { kind: 'bar' }>[];
  fallbackType: string;
  onSelect: (type: string, issue?: string) => void;
}> = ({ params, fallbackType, onSelect }) => {
  const maxTotal = Math.max(1, ...params.map(p => p.total));
  const midTick = Math.round(maxTotal / 2);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Value labels — their own fixed-height row ABOVE the scaled plot area, so they
          never eat into the bars' height and the Y-axis ticks stay truly aligned with
          the bars' actual 0…max range (a 100% bar now reaches exactly the top tick). */}
      <div style={{ display: 'flex', flexShrink: 0, marginBottom: 2 }}>
        <span style={{ width: VBAR_AXIS_W, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-evenly', gap: 10 }}>
          {params.map((p, i) => {
            const fail = p.total - p.ok;
            const pct = Math.round((p.ok / p.total) * 100);
            return (
              <div key={i} style={{ flex: '0 1 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: pctColor(pct), whiteSpace: 'nowrap' }}>{p.ok}/{p.total}</span>
                {fail > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '0px 4px', borderRadius: 99, whiteSpace: 'nowrap',
                    ...failBadgeColors(pct),
                  }}>
                    {fail} fail
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Scaled plot area — Y-axis ticks and bars are direct siblings spanning the exact
          same height, so the tick positions and bar heights are guaranteed to match. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ width: VBAR_AXIS_W, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)', lineHeight: 1 }}>{maxTotal}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)', lineHeight: 1 }}>{midTick}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ds-text-muted)', lineHeight: 1 }}>0</span>
        </div>
        {/* Plot area: Y gridlines + double-stacked columns rising from the baseline */}
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-evenly', gap: 10,
          borderLeft: '1px solid rgba(32, 120, 207,0.25)', borderBottom: '1px solid rgba(32, 120, 207,0.25)',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(32, 120, 207,0.12) 0, rgba(32, 120, 207,0.12) 1px, transparent 1px, transparent 50%)',
        }}>
          {params.map((p, i) => {
            const fail = p.total - p.ok;
            const colHeightPct = (p.total / maxTotal) * 100;
            const okShareOfBar = p.total > 0 ? (p.ok / p.total) * 100 : 0;
            const type = p.filterType ?? fallbackType;
            return (
              <div
                key={i}
                onClick={() => onSelect(type, p.label)}
                title={`${type} — ${p.label}: ${p.ok}/${p.total} OK${fail > 0 ? `, ${fail} failing` : ''} (click to see which units in Asset Register)`}
                style={{ flex: '0 1 50px', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', cursor: 'pointer' }}
              >
                <div style={{ width: 20, height: `${colHeightPct}%`, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {okShareOfBar < 100 && <div style={{ width: '100%', height: `${100 - okShareOfBar}%`, background: 'linear-gradient(180deg,#f87171,#b91c1c)' }} />}
                  <div style={{ width: '100%', height: `${okShareOfBar}%`, background: 'linear-gradient(180deg,#34d399,#059669)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* X-axis category labels */}
      <div style={{ display: 'flex', flexShrink: 0, marginTop: 2 }}>
        <span style={{ width: VBAR_AXIS_W, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-evenly', gap: 10 }}>
          {params.map((p, i) => (
            <span key={i} style={{
              flex: '0 1 50px', textAlign: 'center', fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeviceCard: React.FC<{ d: DeviceRow; onSelect: (type: string, issue?: string) => void }> = ({ d, onSelect }) => {
  const allBars = d.params.every(p => p.kind === 'bar');
  const isVertical = allBars && (d.params[0] as Extract<Param, { kind: 'bar' }>).orientation === 'vertical';
  // 2+ bar params alongside other widgets (e.g. ACB/MCCB's pie + Trip-free + Connection)
  // collapse into one stacked column instead of one column each, so the card's width
  // weight should reflect the number of columns actually shown, not the raw param count.
  const barParams = d.params.filter((p): p is Extract<Param, { kind: 'bar' }> => p.kind === 'bar');
  const otherParams = d.params.filter(p => p.kind !== 'bar');
  const groupBars = !allBars && barParams.length >= 2;
  // A lone dot widget (LS) needs far less width than a lone bar/pie column, so it
  // gets a fractional slot instead of a full one — otherwise it sits mostly empty.
  const isSingleDot = d.params.length === 1 && d.params[0].kind === 'dot';
  const slotCount = isSingleDot ? 0.6 : groupBars ? otherParams.length + 1 : d.params.length;
  return (
    <div
      title={`${d.name} — Qty ${d.qty}`}
      style={{
        flex: `${slotCount} 1 0%`,
        borderRadius: 10, padding: '4px 10px 7px', overflow: 'hidden', minWidth: 0, minHeight: 0,
        background: 'var(--app-surface)', border: '1px solid rgba(32, 120, 207,0.08)',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      {/* Single top row, flush with the card's top edge: code left, full name centered, qty right */}
      <div style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', minHeight: 18 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 16.5, fontWeight: 800, color: '#3B82F6', position: 'relative', zIndex: 1, background: 'var(--app-surface)' }}>
          {d.code}
        </span>
        <span style={{
          position: 'absolute', left: 32, right: 32, top: 0, textAlign: 'center',
          fontSize: 12, color: 'var(--ds-text-muted)', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {d.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-muted)', position: 'relative', zIndex: 1, background: 'var(--app-surface)' }}>
          ×{d.qty}
        </span>
      </div>
      {allBars ? (
        isVertical
          ? <VerticalBarChartMini params={d.params as Extract<Param, { kind: 'bar' }>[]} fallbackType={d.name} onSelect={onSelect} />
          : <BarChartMini params={d.params as Extract<Param, { kind: 'bar' }>[]} fallbackType={d.name} onSelect={onSelect} />
      ) : groupBars ? (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flex: 1, minHeight: 0 }}>
          {/* The pie's own intrinsic size caps how much width it can use, so it gets a
              smaller flex share — the bars need the room far more (label + value + axis
              columns are fixed-width and otherwise starve the scale line of any space). */}
          <div style={{ flex: '0.8 1 0%', minWidth: 0, display: 'flex' }}>
            {otherParams.map((p, i) => <ParamWidget key={i} param={p} count={slotCount} fallbackType={d.name} onSelect={onSelect} />)}
          </div>
          <div style={{ flex: '1.2 1 0%', minWidth: 0, display: 'flex' }}>
            <StackedAxisBarGroup params={barParams} fallbackType={d.name} onSelect={onSelect} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flex: 1, minHeight: 0 }}>
          {d.params.map((p, i) => <ParamWidget key={i} param={p} count={d.params.length} fallbackType={d.name} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
};

const SCADAEquipmentOverview: React.FC = () => {
  const openAssets = useHbmsStore((s) => s.openAssets);
  const totalQty = DEVICES.reduce((s, d) => s + d.qty, 0);
  // The Asset Register always surfaces Inactive, then Warning, before Active (see
  // AssetList's statusOrder sort), so offline/warning devices land on top automatically.
  // An optional "issue" (set by bar-chart widgets) further highlights exactly which
  // units are failing that specific sub-parameter check.
  const onSelect = (type: string, issue?: string) =>
    openAssets({ subsystem: 'SCADA', type, issue });

  return (
    <>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity style={{ width: 12, height: 12, color: '#34d399' }} />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Operational Screen — Equipment Status
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 8.5, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
          {DEVICES.length} device types · {totalQty.toLocaleString()} assets
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ROWS.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
            {row.map(d => <DeviceCard key={d.code} d={d} onSelect={onSelect} />)}
          </div>
        ))}
      </div>
    </>
  );
};

export default SCADAEquipmentOverview;
