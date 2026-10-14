// ─────────────────────────────────────────────────────────────────────────────
// src/components/LBMSOperatorOverview.tsx
// LBMS Operator view — recreates the Plumbing / Firefighting Services / MVAC
// System per-floor Working/Fault bar-chart dashboard supplied as
// public/operator_view_kpis_design.png. Charts only — no KPI counter strip
// above them; the panels are named for the equipment types in
// LBMS_KPI_Specification.xlsx (AHU, PAU, CRAH, FCU, Chillers, Plumbing
// Equipment, Fire Fighting Interfaces) and each carries the KPI IDs it rolls
// up to, so the view still lines up with the sheet.
// Clicking the "Air Handling Unit (AHU)" panel swaps this whole dashboard
// area for the full paginated AHU card grid (LBMSAHUGrid) — the 209 AHU
// cards only ever cover this same area on demand, they're never shown
// alongside the charts.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AHU_FLOOR_COUNTS } from '../lbmsAssets';
import LBMSAHUGrid from './LBMSAHUGrid';

interface LBMSOperatorOverviewProps {
  /** Land straight in the AHU grid instead of the chart dashboard — set by a
   *  deep-link (Dashboard alert / Supervisor KPI card) arriving via LBMSDetails. */
  autoOpenGrid?: boolean;
  /** Passed through to LBMSAHUGrid to pre-filter to one unit. */
  focusAssetId?: string;
}

interface Category { label: string; working: number; fault: number }
/** `title` is the equipment type exactly as the KPI sheet names it; `spec`
 *  carries the KPI IDs it rolls up to and what the bars actually break down
 *  by, so renaming to the sheet's vocabulary doesn't lose the detail. */
interface BarPanelProps { title: string; spec?: string; categories: Category[]; yMax: number; onClick?: () => void }

const BarPanel: React.FC<BarPanelProps> = ({ title, spec, categories, yMax, onClick }) => {
  const ticks = [yMax, Math.round(yMax / 2), 0];
  return (
    <div
      onClick={onClick}
      title={onClick ? `${title} — click to view all AHU units` : undefined}
      style={{
        flex: 1, minWidth: 0, borderRadius: 10, padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6,
        background: 'var(--app-surface)', border: `1px solid ${onClick ? 'rgba(34,199,198,0.35)' : 'rgba(255,255,255,0.08)'}`,
        cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={onClick ? (e => { e.currentTarget.style.transform = 'translateY(-2px)'; }) : undefined}
      onMouseLeave={onClick ? (e => { e.currentTarget.style.transform = 'translateY(0)'; }) : undefined}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: onClick ? '#22C7C6' : 'var(--ds-text)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {title}
        </p>
        {spec && (
          <p style={{ fontSize: 7.5, fontWeight: 600, color: 'var(--ds-text-muted)', textAlign: 'center', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spec}>
            {spec}
          </p>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 60, display: 'flex' }}>
        <div style={{ width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 3 }}>
          {ticks.map(t => <span key={t} style={{ fontSize: 8, color: 'var(--ds-text-muted)', lineHeight: 1 }}>{t}</span>)}
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-evenly', gap: 4,
          borderLeft: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 50%)',
        }}>
          {categories.map(c => {
            const total = c.working + c.fault;
            const hPct = Math.min(100, (total / yMax) * 100);
            const faultShare = total > 0 ? (c.fault / total) * 100 : 0;
            return (
              <div key={c.label} style={{ flex: '0 1 34px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: c.fault > 0 ? '#f87171' : 'var(--ds-text-muted)' }}>{c.fault}</span>
                <div style={{ width: 18, height: `${hPct}%`, minHeight: total > 0 ? 3 : 0, borderRadius: '2px 2px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 1 }}>
                  {faultShare > 0 && <div style={{ width: '100%', height: `${faultShare}%`, background: 'linear-gradient(180deg,#f87171,#b91c1c)' }} />}
                  <div style={{ width: '100%', height: `${100 - faultShare}%`, background: 'linear-gradient(180deg,#4ade80,#16a34a)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, fontWeight: 800, color: '#052e16', marginTop: 1 }}>{c.working}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        {categories.map(c => (
          <span key={c.label} style={{ flex: '0 1 34px', textAlign: 'center', fontSize: 7.5, fontWeight: 700, color: 'var(--ds-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
        ))}
      </div>
      {onClick && (
        <p style={{ fontSize: 8.5, fontWeight: 700, color: '#22C7C6', textAlign: 'center', marginTop: 1 }}>
          Click here to view all AHU →
        </p>
      )}
    </div>
  );
};

const PiePanel: React.FC<{ title: string; spec?: string; working: number; fault: number }> = ({ title, spec, working, fault }) => {
  const total = working + fault || 1;
  const faultAngle = (fault / total) * 360;
  const r = 30, cx = 34, cy = 34;
  const a1 = -90 * Math.PI / 180, a2 = (-90 + faultAngle) * Math.PI / 180;
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  const largeArc = faultAngle > 180 ? 1 : 0;
  return (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 10, padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
      background: 'var(--app-surface)', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</p>
        {spec && (
          <p style={{ fontSize: 7.5, fontWeight: 600, color: 'var(--ds-text-muted)', textAlign: 'center', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spec}>
            {spec}
          </p>
        )}
      </div>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx={cx} cy={cy} r={r} fill="#16a34a" />
        {fault > 0 && <path d={`M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`} fill="#dc2626" />}
      </svg>
      <div style={{ display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80' }}>{working} OK</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#f87171' }}>{fault} Fault</span>
      </div>
    </div>
  );
};

const SectionFrame: React.FC<{ title: string; spec?: string; children: React.ReactNode }> = ({ title, spec, children }) => (
  <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-text)', textAlign: 'center' }}>{title}</p>
    {spec && <p style={{ fontSize: 8, fontWeight: 600, color: 'var(--ds-text-muted)', textAlign: 'center', marginTop: -6 }}>{spec}</p>}
    <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

const { GF, '1F': F1, '2F': F2, '3F': F3 } = AHU_FLOOR_COUNTS;

const LBMSOperatorOverview: React.FC<LBMSOperatorOverviewProps> = ({ autoOpenGrid, focusAssetId }) => {
  const [showAHUGrid, setShowAHUGrid] = useState(!!autoOpenGrid);

  // Only reacts to autoOpenGrid actually changing (deep-link arriving) — a
  // manual "Back to overview" click afterwards isn't forced back open, since
  // the prop value itself doesn't change again for the rest of this mount.
  useEffect(() => {
    if (autoOpenGrid) setShowAHUGrid(true);
  }, [autoOpenGrid]);

  if (showAHUGrid) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <button
          onClick={() => setShowAHUGrid(false)}
          className="flex-shrink-0 flex items-center gap-1.5 self-start px-2.5 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-all hover:brightness-125"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#9BEAE8', border: '1px solid rgba(34,199,198,0.3)' }}
        >
          <ArrowLeft className="w-3 h-3" /> Back to overview
        </button>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <LBMSAHUGrid focusAssetId={focusAssetId} />
        </div>
      </div>
    );
  }

  return (
    // Rows share the height rather than sitting at a fixed 150px with a gap
    // below them: each grows from a 0 basis, and minHeight keeps them readable
    // on a short viewport (where the container scrolls instead).
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, minHeight: 0 }}>
      {/* Plumbing + Firefighting Services */}
      <div style={{ display: 'flex', gap: 10, flex: '1 1 0', minHeight: 150 }}>
        <SectionFrame title="Plumbing Equipment" spec="LBMS-KPI-23 / 24 · Trip + Communication Failure Count">
          <BarPanel title="Hydraulic Pumps" spec="Filtration + booster" yMax={25} categories={[
            { label: 'Filtration Pump', working: 4, fault: 0 },
            { label: 'Booster Pump', working: 20, fault: 0 },
          ]} />
          <BarPanel title="Water Meters" spec="by floor" yMax={80} categories={[
            { label: 'GF', working: 70, fault: 5 }, { label: '1F', working: 15, fault: 0 },
            { label: '2F', working: 4, fault: 0 }, { label: '3F', working: 21, fault: 0 },
          ]} />
        </SectionFrame>
        <SectionFrame title="Fire Fighting Interfaces" spec="LBMS-KPI-26 / 27 · Trip + Communication Failure Count">
          <BarPanel title="FM 200" spec="by floor" yMax={120} categories={[
            { label: 'GF', working: 102, fault: 0 }, { label: '1F', working: 50, fault: 0 },
            { label: '2F', working: 18, fault: 0 }, { label: '3F', working: 35, fault: 0 },
            { label: '4F', working: 6, fault: 0 },
          ]} />
          <BarPanel title="Fire Pump + Nitrogen" spec="by equipment" yMax={40} categories={[
            { label: 'Fire Pump', working: 9, fault: 0 }, { label: 'Nitrogen', working: 37, fault: 0 },
          ]} />
        </SectionFrame>
      </div>

      {/* MVAC System */}
      <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, flex: '2.1 1 0', minHeight: 320 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ds-text)', textAlign: 'center' }}>MVAC System</p>
        <p style={{ fontSize: 8, fontWeight: 600, color: 'var(--ds-text-muted)', textAlign: 'center', marginTop: -6 }}>
          AHU · PAU · MAU · CRAH · FCU · VAV · Chillers — LBMS-KPI-02 → 21
        </p>
        <div style={{ display: 'flex', gap: 8, flex: '1 1 0', minHeight: 150 }}>
          <BarPanel title="AHU" spec="LBMS-KPI-02 / 03 · by floor" yMax={120} onClick={() => setShowAHUGrid(true)} categories={[
            { label: 'GF', working: GF.working, fault: GF.fault }, { label: '1F', working: F1.working, fault: F1.fault },
            { label: '2F', working: F2.working, fault: F2.fault }, { label: '3F', working: F3.working, fault: F3.fault },
          ]} />
          <BarPanel title="PAU" spec="LBMS-KPI-05 / 06 · by floor" yMax={16} categories={[
            { label: 'GF', working: 13, fault: 1 }, { label: '1F', working: 6, fault: 0 },
            { label: '2F', working: 6, fault: 0 }, { label: '3F', working: 2, fault: 0 },
          ]} />
          <BarPanel title="MAU" spec="LBMS-KPI-08 / 09 · by floor" yMax={10} categories={[
            { label: 'GF', working: 8, fault: 0 }, { label: '1F', working: 5, fault: 0 },
            { label: '2F', working: 3, fault: 0 }, { label: '3F', working: 2, fault: 0 },
          ]} />
          <PiePanel title="CRAH" spec="LBMS-KPI-11 / 12 · Ground floor" working={20} fault={3} />
          <BarPanel title="FCU" spec="LBMS-KPI-14 / 15 · by floor" yMax={700} categories={[
            { label: 'GF', working: 573, fault: 1 }, { label: '1F', working: 238, fault: 0 },
            { label: '2F', working: 325, fault: 0 }, { label: '3F', working: 230, fault: 5 },
          ]} />
          <BarPanel title="VAV" spec="LBMS-KPI-17 / 18 · by floor" yMax={350} categories={[
            { label: 'GF', working: 320, fault: 0 }, { label: '1F', working: 180, fault: 0 },
            { label: '2F', working: 145, fault: 0 }, { label: '3F', working: 110, fault: 0 },
          ]} />
          <PiePanel title="Chillers" spec="LBMS-KPI-20 / 21 · GF chilled water pumps" working={10} fault={2} />
        </div>
        <div style={{ display: 'flex', gap: 8, flex: '1 1 0', minHeight: 150 }}>
          <BarPanel title="Ground Floor Fans" spec="by fan type" yMax={140} categories={[
            { label: 'EAF', working: 111, fault: 5 }, { label: 'FAF', working: 27, fault: 0 },
            { label: 'KEF', working: 18, fault: 0 }, { label: 'LPF', working: 27, fault: 3 },
            { label: 'SEF', working: 18, fault: 0 }, { label: 'SPF', working: 13, fault: 0 },
            { label: 'TEF', working: 8, fault: 0 }, { label: 'BPF', working: 8, fault: 0 },
          ]} />
          <BarPanel title="1st Floor Fans" spec="by fan type" yMax={40} categories={[
            { label: 'EAF', working: 26, fault: 0 }, { label: 'KEF', working: 27, fault: 7 },
            { label: 'LPF', working: 1, fault: 0 }, { label: 'SEF', working: 11, fault: 0 },
            { label: 'TEF', working: 16, fault: 0 },
          ]} />
          <BarPanel title="2nd Floor Fans" spec="by fan type" yMax={30} categories={[
            { label: 'EAF', working: 5, fault: 0 }, { label: 'KEF', working: 4, fault: 0 },
            { label: 'LPF', working: 0, fault: 0 }, { label: 'SEF', working: 24, fault: 0 },
            { label: 'TEF', working: 4, fault: 0 },
          ]} />
          <BarPanel title="3rd Floor Fans" spec="by fan type" yMax={18} categories={[
            { label: 'EAF', working: 9, fault: 0 }, { label: 'KEF', working: 12, fault: 0 },
            { label: 'LPF', working: 6, fault: 0 }, { label: 'SEF', working: 17, fault: 0 },
            { label: 'SPF', working: 4, fault: 0 }, { label: 'TEF', working: 7, fault: 0 },
          ]} />
          <BarPanel title="4th Floor Fans" spec="by fan type" yMax={12} categories={[
            { label: 'KEF', working: 4, fault: 0 }, { label: 'SEF', working: 10, fault: 0 },
            { label: 'TEF', working: 10, fault: 0 },
          ]} />
        </div>
      </div>
    </div>
  );
};

export default LBMSOperatorOverview;
