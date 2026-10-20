// SubsystemPage — shared template for all HBMS subsystem detail pages.
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, FileDown, CheckCircle2, AlertTriangle, XCircle, Minus,
  Activity, Shield, Bell, Server, RefreshCw, X, Maximize2, Minimize2, Map as MapIcon,
} from 'lucide-react';
import TerminalMap from './TerminalMap';
import { useHbmsStore } from '../store/useHbmsStore';
import TrendAnalysisModal, { type TrendKpiSpec } from './TrendAnalysisModal';

// ── Exported types ────────────────────────────────────────────────────────────

export interface KPIData {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: 'green' | 'yellow' | 'red';
  comparison?: string;
  context?: string;
  sparkline?: number[];
  sla?: string;
  lastChecked?: string;
  yesterday?: number;
  weeklyAvg?: number;
  shifts?: [number, number, number];
  incidents?: number;
  trend?: number;
}

export type KPIItem = KPIData & { id: string };

export interface LiveAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  zone: string;
  message: string;
  ts: string;
  ack: boolean;
}

export interface SubsystemEvent {
  id: string;
  title: string;
  type: 'status_change' | 'maintenance' | 'alert' | 'system' | 'broadcast';
  severity?: 'info' | 'warn' | 'ok';
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  assignee: string;
  date: string;
}

export interface ComponentStatus {
  name: string;
  status: 'Operational' | 'Warning' | 'Critical';
  details: string;
}

export interface LogEntry { id: string; msg: string; ts: string; level: 'info' | 'warn' | 'err'; }
export interface IntegrationEntry { id: string; ref: string; msg: string; ts: string; status: 'synced' | 'updated' | 'broadcast' | 'ok' | 'err'; }

// ── Utility ───────────────────────────────────────────────────────────────────

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'green': case 'Operational': return <CheckCircle2 className="w-3 h-3 text-status-neutral" />;
    case 'yellow': case 'Warning':    return <AlertTriangle className="w-3 h-3 text-status-warning" />;
    case 'red':   case 'Critical':    return <XCircle       className="w-3 h-3 text-status-error" />;
    default: return <Minus className="w-3 h-3 text-text-secondary" />;
  }
};

const getRAGBg = (status: string) => {
  if (status === 'red'    || status === 'Critical') return { bg: 'var(--app-surface)', border: 'rgba(239,68,68,0.32)',   dot: 'var(--kpi-dot-red)' };
  if (status === 'yellow' || status === 'Warning')  return { bg: 'var(--app-surface)', border: 'rgba(245,158,11,0.22)',  dot: 'var(--kpi-dot-yellow)' };
  return { bg: 'var(--app-surface)', border: 'rgba(125,160,202,0.38)', dot: 'var(--kpi-dot-neutral)' };
};

// Concrete hex per RAG status — the trend modal needs a literal color (for
// `${color}NN` opacity-suffix tricks), not the CSS var used for theming.
const kpiStatusHex = (status: KPIData['status']) =>
  status === 'red' ? '#ef4444' : status === 'yellow' ? '#f59e0b' : '#7DA0CA';

const sevCfg = (sev: LiveAlert['severity']) => ({
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.30)'   },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.09)',  border: 'rgba(249,115,22,0.28)'  },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.09)',  border: 'rgba(245,158,11,0.26)'  },
  low:      { color: '#22C7C6', bg: 'rgba(1,163,164,0.07)',  border: 'rgba(1,163,164,0.22)'  },
})[sev];

// ── Sparkline ─────────────────────────────────────────────────────────────────

const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 52, h = 16;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`
  ).join(' ');
  const split = pts.split(' ');
  const [lx, ly] = (split[split.length - 1] ?? '').split(',');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
};

// ── Compact pie/bar for components section ────────────────────────────────────

const CompChart: React.FC<{ type: 'pie' | 'bar'; data: ComponentStatus[] }> = ({ type, data }) => {
  const groups = [
    { label: 'OK',   value: data.filter(c => c.status === 'Operational').length, color: '#10b981' },
    { label: 'Warn', value: data.filter(c => c.status === 'Warning').length,     color: '#f59e0b' },
    { label: 'Crit', value: data.filter(c => c.status === 'Critical').length,    color: '#ef4444' },
  ].filter(g => g.value > 0);
  const total = groups.reduce((s, g) => s + g.value, 0);
  if (!total) return null;

  if (type === 'bar') {
    return (
      <div className="flex items-end justify-center gap-1.5 px-1" style={{ height: 48, width: 48, flexShrink: 0 }}>
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <span style={{ fontSize: 7, fontWeight: 800, color: g.color }}>{g.value}</span>
            <div style={{ width: '100%', borderRadius: 2, height: `${Math.max((g.value / total) * 30, 4)}px`, background: g.color, opacity: 0.85 }} />
            <span style={{ fontSize: 5.5, fontWeight: 600, color: g.color }}>{g.label}</span>
          </div>
        ))}
      </div>
    );
  }

  const cx = 26, cy = 26, r = 21;
  let cum = -90;
  const paths = groups.length === 1
    ? [<circle key={0} cx={cx} cy={cy} r={r} fill={groups[0].color} opacity={0.88} />]
    : groups.map((g, i) => {
        const a = (g.value / total) * 360;
        const a1 = (cum * Math.PI) / 180, a2 = ((cum + a) * Math.PI) / 180;
        cum += a;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        return <path key={i} d={`M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`}
          fill={g.color} opacity={0.88} stroke="rgba(7,16,40,0.6)" strokeWidth="0.8" />;
      });

  return (
    <svg viewBox="0 0 52 52" style={{ width: 48, height: 48, flexShrink: 0 }}>
      {paths}
      <circle cx={cx} cy={cy} r={7} fill="rgba(7,16,40,0.8)" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#E6EEF6" fontSize="5.5" fontWeight="800">{total}</text>
    </svg>
  );
};

// ── FRS use-case mapping ──────────────────────────────────────────────────────

const getUCTag = (alert: LiveAlert): string => {
  const text = alert.message + ' ' + alert.zone;
  // Explicit UC tag embedded in message (e.g. "UC-SSE-04", "UC-AGAC-03", "UC-07")
  const m = text.match(/\bUC-([A-Z]+-\d+|\d+)\b/i);
  if (m) return 'UC-' + m[1].toUpperCase();
  // Legacy BHS keyword fallback
  const low = text.toLowerCase();
  if (low.includes('heartbeat') || low.includes('comms') || low.includes('timeout'))            return 'UC-07';
  if (low.includes('shutter') && (low.includes('sop') || low.includes('safety')))               return 'UC-06';
  if (low.includes('shutterstatus') && !low.includes('sop'))                                    return 'UC-05';
  if (low.includes('shutter onboard'))                                                           return 'UC-04';
  if (low.includes('stopped-safety') || low.includes('e-stop') || low.includes('safety stop')) return 'UC-03';
  if (low.includes('subsystemstatus') || low.includes('status update'))                         return 'UC-02';
  if (low.includes('onboard') || low.includes('logical object'))                                return 'UC-01';
  if (low.includes('technical-error') || low.includes('fault'))                                 return 'UC-03';
  return 'UC-08';
};

const UC_DESC: Record<string, string> = {
  // BHS (generic / legacy)
  'UC-01': 'Subsystem Onboarding',    'UC-02': 'Status Update',
  'UC-03': 'Fault / Safety Alarm',    'UC-04': 'Shutter Onboarding',
  'UC-05': 'Shutter Status Change',   'UC-06': 'Shutter Abnormal + SOP',
  'UC-07': 'Comms Loss / Recovery',   'UC-08': 'KPI Event',
  // SSE – Security Screening Equipment
  'UC-SSE-01': 'Device Onboarding',          'UC-SSE-02': 'Machine Health Monitoring',
  'UC-SSE-03': 'Operational State Change',   'UC-SSE-04': 'Event / Alarm Monitoring',
  'UC-SSE-05': 'SOP Execution',              'UC-SSE-06': 'KPI Generation',
  'UC-SSE-07': 'Entity Modification',        'UC-SSE-08': 'Entity Decommissioning',
  // VDGS – Visual Docking Guidance System
  'UC-VDGS-01': 'Device Onboarding',         'UC-VDGS-02': 'Device Modification',
  'UC-VDGS-03': 'Device Decommissioning',    'UC-VDGS-04': 'Docking Status Update',
  'UC-VDGS-05': 'Fault Alarm Handling',      'UC-VDGS-06': 'Communication Loss',
  'UC-VDGS-07': 'Recovery / Return-to-Service',
  // AGAC – Automatic Gate Access Control
  'UC-AGAC-01': 'Gate Device Onboarding',    'UC-AGAC-02': 'Gate Status Monitoring',
  'UC-AGAC-03': 'Gate Fault Alarm',          'UC-AGAC-04': 'Communication Loss',
  'UC-AGAC-05': 'Device Decommissioning',
  // CMS – Conveyance Monitoring System
  'UC-CMS-01': 'Subsystem Onboarding',       'UC-CMS-02': 'Asset Onboarding',
  'UC-CMS-03': 'Conveyance Status Update',   'UC-CMS-04': 'Fault / Alarm Handling',
  'UC-CMS-05': 'Mode / State Change',        'UC-CMS-06': 'Overload / Safety Alarm',
  'UC-CMS-07': 'Comms Loss & Recovery',      'UC-CMS-08': 'KPI Generation',
  // FAS – Fire Alarm System
  'UC-FAS-01': 'Device & Zone Onboarding',   'UC-FAS-02': 'Incremental Entity Addition',
  'UC-FAS-03': 'Entity Modification',        'UC-FAS-04': 'Entity Decommissioning',
  'UC-FAS-05': 'Fire Alarm Event',           'UC-FAS-06': 'Pre-Alarm Event',
  'UC-FAS-07': 'Fault Event',                'UC-FAS-08': 'Supervisory Event',
  'UC-FAS-09': 'Alarm Acknowledgment',       'UC-FAS-10': 'KPI Generation',
  // LBMS – Low Building Management System (HVAC)
  'UC-LBMS-01': 'Asset Onboarding',          'UC-LBMS-02': 'Asset Modification',
  'UC-LBMS-03': 'Asset Decommissioning',     'UC-LBMS-04': 'Aggregated Status Change',
  'UC-LBMS-05': 'Alarm Ingestion',           'UC-LBMS-06': 'Flight Schedule File',
  'UC-LBMS-07': 'KPI Generation',
  // MCS – Master Clock System
  'UC-MCS-01': 'Device Status Monitoring',   'UC-MCS-02': 'Alarm Monitoring',
  'UC-MCS-03': 'System Health Monitoring',   'UC-MCS-04': 'Communication Failure',
  // PAS – Public Address System
  'UC-PAS-01': 'PAS Entity Onboarding / TCP Session',  'UC-PAS-02': 'Incremental Entity / Subscription',
  'UC-PAS-03': 'Alarm Notification Handling',           'UC-PAS-04': 'Entity Decommission / Event Monitor',
  'UC-PAS-05': 'Emergency Evacuation / Announcement',   'UC-PAS-06': 'Operational Announcement / Heartbeat',
  'UC-PAS-07': 'Device Failure / Entity State Update',
  // SACS – Security Access Control System
  'UC-SACS-01': 'Device Onboarding',         'UC-SACS-02': 'Device Modification',
  'UC-SACS-03': 'Device Decommissioning',    'UC-SACS-04': 'Access Granted Event',
  'UC-SACS-05': 'Access Denied Event',       'UC-SACS-06': 'Forced Door Alarm',
  'UC-SACS-07': 'KPI Generation',
  // SCADA – Supervisory Control and Data Acquisition
  'UC-SCADA-01': 'Asset / Point Onboarding', 'UC-SCADA-02': 'OPC UA Session Establishment',
  'UC-SCADA-03': 'Equipment Status Update',  'UC-SCADA-04': 'Equipment Alarm Ingestion',
  'UC-SCADA-05': 'Comms Loss & Recovery',    'UC-SCADA-06': 'KPI Generation',
  'UC-SCADA-07': 'Critical Electrical Incident', 'UC-SCADA-08': 'Flight Info File Exchange',
};

// ── KPI card — full-height, all available data rendered ──────────────────────

export const KPIStripCard: React.FC<{ kpi: KPIData; onClick?: () => void }> = ({ kpi, onClick }) => {
  const rag = getRAGBg(kpi.status);
  const sparkColor = kpi.status === 'green' ? 'var(--kpi-spark-green)' : kpi.status === 'yellow' ? 'var(--kpi-spark-yellow)' : 'var(--kpi-spark-red)';
  const delta = kpi.yesterday !== undefined ? +(kpi.current - kpi.yesterday).toFixed(2) : null;
  const isGoodDelta = delta === null ? true : kpi.comparison === 'above' ? delta <= 0 : delta >= 0;
  const fmt = (v: number) => kpi.unit === '%' ? `${v}%` : kpi.unit === 'minutes' ? `${v}m` : `${v}`;

  return (
    <div
      onClick={onClick}
      title={onClick ? `${kpi.name} — click for trend analysis` : undefined}
      className={onClick ? 'kpi-strip-card-clickable' : undefined}
      style={{
      padding: '8px 10px',
      borderRadius: 10,
      background: rag.bg,
      border: `1px solid ${rag.border}`,
      borderLeft: `3px solid ${rag.dot}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : undefined,
      transition: 'transform 0.15s, filter 0.15s',
      minWidth: 0,
      height: '100%',
    }}>

      {/* ── Name + icon ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <p style={{
          fontSize: 8, color: 'var(--ds-text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.3, flex: 1,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {kpi.name}
        </p>
        <div style={{ flexShrink: 0, marginTop: 1 }}>{getStatusIcon(kpi.status)}</div>
      </div>

      {/* ── Current value (large) ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: rag.dot, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(kpi.current)}
        </span>
        {kpi.unit !== '%' && kpi.unit !== 'minutes' && (
          <span style={{ fontSize: 9, color: 'var(--ds-text-muted)' }}>{kpi.unit}</span>
        )}
      </div>

      {/* ── Sparkline trend ─────────────────────────────────────── */}
      {kpi.sparkline && kpi.sparkline.length > 1 && (
        <div style={{ marginTop: 4 }}>
          <MiniSparkline data={kpi.sparkline} color={sparkColor} />
        </div>
      )}

      {/* ── Stats row: Target / Yesterday / 7d Avg ──────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
        marginTop: 6, paddingTop: 6,
        borderTop: `1px solid ${rag.border}`,
      }}>
        {[
          { label: 'Target',  val: kpi.target    },
          { label: 'Yest',    val: kpi.yesterday  },
          { label: '7d Avg',  val: kpi.weeklyAvg  },
        ].map(({ label, val }) => val !== undefined && (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <span style={{ fontSize: 6.5, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ds-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(val)}</span>
          </div>
        ))}
      </div>

      {/* ── Shift mini-bars: Morning / Afternoon / Night ─────────── */}
      {kpi.shifts && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', marginTop: 6 }}>
          {(['M', 'A', 'N'] as const).map((lbl, i) => {
            const val = kpi.shifts![i];
            const lo = Math.min(...kpi.shifts!), hi = Math.max(...kpi.shifts!);
            const barH = 5 + Math.round(((val - lo) / (hi - lo || 1)) * 14);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: sparkColor, fontVariantNumeric: 'tabular-nums' }}>{fmt(val)}</span>
                <div style={{
                  width: '100%', height: barH, borderRadius: 2,
                  background: sparkColor,
                  opacity: i === 1 ? 1 : 0.30,
                  border: i === 1 ? `1px solid ${sparkColor}` : 'none',
                  transition: 'height 0.3s',
                }} />
                <span style={{ fontSize: 6, color: 'var(--ds-text-muted)', letterSpacing: '0.03em' }}>{lbl}</span>
              </div>
            );
          })}
          {/* Incidents badge */}
          {kpi.incidents !== undefined && kpi.incidents > 0 && (
            <span style={{
              alignSelf: 'center', marginLeft: 2, flexShrink: 0,
              fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 5,
              background: 'rgba(239,68,68,0.15)', color: 'var(--kpi-incidents)',
              border: '1px solid rgba(239,68,68,0.28)',
            }}>
              {kpi.incidents} inc
            </span>
          )}
        </div>
      )}

      {/* ── SLA badge + delta + last checked ────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
        {kpi.sla && (
          <span style={{
            fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
            background: kpi.status === 'green' ? 'rgba(125,160,202,0.22)' : kpi.status === 'yellow' ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.15)',
            color:      kpi.status === 'green' ? 'var(--kpi-dot-neutral)' : kpi.status === 'yellow' ? 'var(--kpi-dot-yellow)' : 'var(--kpi-dot-red)',
            border:     kpi.status === 'green' ? '1px solid rgba(125,160,202,0.40)' : kpi.status === 'yellow' ? '1px solid rgba(245,158,11,0.18)' : '1px solid rgba(239,68,68,0.25)',
          }}>
            SLA {kpi.sla}
          </span>
        )}
        {delta !== null && (
          <span style={{ fontSize: 7, fontWeight: 700, color: isGoodDelta ? 'var(--kpi-delta-good)' : 'var(--kpi-delta-bad)' }}>
            {delta >= 0 ? '▲' : '▼'}{Math.abs(delta).toFixed(1)}{kpi.unit === '%' ? 'pp' : ''} vs yest
          </span>
        )}
        {kpi.lastChecked && (
          <span style={{ marginLeft: 'auto', fontSize: 6.5, color: 'var(--ds-text-muted)', whiteSpace: 'nowrap' }}>
            ◷ {kpi.lastChecked}
          </span>
        )}
      </div>

      {/* ── Context note ────────────────────────────────────────── */}
      {kpi.context && (
        <p style={{
          fontSize: 7.5, lineHeight: 1.35, color: rag.dot, opacity: 0.85, marginTop: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {kpi.context}
        </p>
      )}
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface SubsystemPageProps {
  subsystemName: string;
  subsystemCode: string;
  operationalKPIs: KPIData[];
  systemKPIs: KPIData[];
  liveAlerts: LiveAlert[];
  systemLogs: LogEntry[];
  recentEvents: SubsystemEvent[];
  workOrders: WorkOrder[];
  componentStatuses: ComponentStatus[];
  integrationLog: IntegrationEntry[];          // kept for API compat — not rendered
  integrationLogTitle?: string;
  systemHealthPct?: number;
  systemHealthMetrics?: Array<{ label: string; value: string; color: string }>;
  systemHealthChips?: Array<{ label: string; ok: boolean }>;
  /** Replaces the default `<SubsystemMapPanel subsystem={subsystemCode}/>` in
   *  both the default layout's Map panel and the supervisor layout's
   *  renderMapPanel — e.g. LBMS passes its own grid-first map here so every
   *  map surface on the page matches its dedicated Map view tab. */
  mapComponent?: React.ReactNode;
  analyticsMetrics?: Array<{ label: string; value: string; sub: string; color: string; glow: string; trend: string }>;
  analyticsSeries?: Array<{ label: string; unit: string; color: string; data: number[] }>;
  shiftPerformance?: Array<{ shift: string; score: number; color: string }>;
  alertBreakdown?: Array<{ label: string; count: number; total: number; color: string }>;
  kpiCols?: number;
  /** Rendered just above the map (e.g. a view-toggle tab bar) */
  topTabs?: React.ReactNode;
  /** When provided, replaces the default Operational/System KPI grid below the map */
  kpiAreaOverride?: React.ReactNode;
  /** 'supervisor' swaps in the mission-control layout (big main panel + side Map/Alerts
   *  with maximize, Components/Work Orders strip below). Default layout is unchanged. */
  layout?: 'default' | 'supervisor';
}

// ── Main component ────────────────────────────────────────────────────────────

const SubsystemPage: React.FC<SubsystemPageProps> = ({
  subsystemName, subsystemCode,
  operationalKPIs, systemKPIs,
  liveAlerts, systemLogs, recentEvents, workOrders, componentStatuses,
  kpiCols = 5,
  topTabs, kpiAreaOverride, layout = 'default', mapComponent,
}) => {
  // Was react-router; the console store carries the same hand-off to the
  // work-order screen, subsystem filter included.
  const openWorkOrders = useHbmsStore((s) => s.openWorkOrders);

  // ── Core UI state ─────────────────────────────────────────────────────────
  const [dismissedNotifs,     setDismissedNotifs]     = useState<Set<string>>(new Set());
  const [secsSinceData,       setSecsSinceData]        = useState(0);
  const [showComponentsPopup, setShowComponentsPopup]  = useState(false);
  const [componentsChartType, setComponentsChartType]  = useState<'pie' | 'bar'>('pie');
  // Supervisor layout only — which side panel (if any) is taking over the full page
  const [maximized, setMaximized] = useState<'map' | 'alerts' | null>(null);
  const [activeTrendKpi, setActiveTrendKpi] = useState<TrendKpiSpec | null>(null);

  const openKpiTrend = (kpi: KPIData, idPrefix: string) => {
    setActiveTrendKpi({
      id: `${subsystemCode}-${idPrefix}-${kpi.name}`,
      label: kpi.name,
      value: kpi.current,
      unit: kpi.unit,
      color: kpiStatusHex(kpi.status),
      subtitle: kpi.context ?? `Target ${kpi.sla ?? kpi.target}`,
    });
  };

  // ── Toast / stack state ───────────────────────────────────────────────────
  // stackedIds: alerts that have completed their toast and now live in the sidebar
  const [stackedIds,   setStackedIds]   = useState<Set<string>>(new Set());
  const [activeToast,  setActiveToast]  = useState<LiveAlert | null>(null);
  const [toastIn,      setToastIn]      = useState(false);   // drives slide-in CSS transform
  const [highlightId,  setHighlightId]  = useState<string | null>(null); // brief glow on stack entry
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Last data received — counts up seconds since the last simulated data
  //    tick (instead of counting down to a next refresh), so the sidebar
  //    reads as a data-freshness indicator: >5s stale = amber, >10s = red.
  useEffect(() => {
    const tick = setInterval(() => setSecsSinceData(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNextTick = () => {
      const delay = 2000 + Math.random() * 9000; // 2-11s — occasionally crosses both thresholds
      timeout = setTimeout(() => { setSecsSinceData(0); scheduleNextTick(); }, delay);
    };
    scheduleNextTick();
    return () => clearTimeout(timeout);
  }, []);

  // ── Toast pop-up sequence ─────────────────────────────────────────────────
  // 5 s initial delay → each alert pops as a top-right toast for 2 s → slides into sidebar stack
  useEffect(() => {
    const alerts = [...liveAlerts];
    const add = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timerRefs.current.push(t);
    };

    const showNext = (idx: number, delay: number) => {
      if (idx >= alerts.length) return;
      const alert = alerts[idx];

      add(() => { setActiveToast(alert); setToastIn(true); }, delay);

      // Start slide-out after 3 s visible
      add(() => setToastIn(false), delay + 3000);

      // After slide-out (~350 ms), add to sidebar stack and queue next toast
      add(() => {
        setStackedIds(prev => new Set([...prev, alert.id]));
        setHighlightId(alert.id);
        setActiveToast(null);
        // Remove highlight after 1.5 s
        add(() => setHighlightId(null), 1500);
        // Next toast 10–15 s later (random gap)
        const gap = 10000 + Math.floor(Math.random() * 5001);
        showNext(idx + 1, gap);
      }, delay + 3350);
    };

    showNext(0, 5000);
    return () => { timerRefs.current.forEach(clearTimeout); timerRefs.current = []; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  // Sidebar shows only alerts that have completed their toast animation
  const sidebarNotifs = liveAlerts.filter(a => stackedIds.has(a.id) && !dismissedNotifs.has(a.id));

  const combinedLogs = [
    ...systemLogs.map(l => ({ id: l.id, msg: l.msg, ts: l.ts, tag: 'SYS', color: l.level === 'warn' ? '#f59e0b' : l.level === 'err' ? '#ef4444' : '#5FDCDA' })),
    ...recentEvents.map(e => ({ id: e.id, msg: e.title, ts: e.timestamp, tag: 'EVT', color: e.severity === 'warn' ? '#f59e0b' : e.severity === 'ok' ? '#34d399' : '#8A9BA8' })),
  ].slice(0, 5);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const dismissToast = () => {
    setToastIn(false);
    const t = setTimeout(() => setActiveToast(null), 350);
    timerRefs.current.push(t);
  };

  // ── Reusable panels — shared by the default layout and the supervisor layout ──
  const maximizeInlineBtn = (key: 'map' | 'alerts') => (
    <button
      onClick={() => setMaximized(m => m === key ? null : key)}
      title={maximized === key ? 'Restore' : 'Maximize'}
      style={{
        flexShrink: 0, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, cursor: 'pointer',
        background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.18)', color: 'var(--ds-text-muted)',
      }}
    >
      {maximized === key ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
    </button>
  );

  const renderMapPanel = (opts?: { maximizable?: boolean }) => (
    <div style={{
      height: '100%', width: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 10,
      border: '1px solid rgba(1,163,164,0.16)', background: 'var(--app-surface)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(1,163,164,0.10)' }}>
        <MapIcon style={{ width: 11, height: 11, color: '#22C7C6' }} />
        <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Map
        </span>
        {opts?.maximizable && <div style={{ marginLeft: 'auto' }}>{maximizeInlineBtn('map')}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {mapComponent ?? <TerminalMap subsystem={subsystemCode?.toUpperCase()} compact />}
      </div>
    </div>
  );

  const renderAlertsPanel = (opts?: { maximizable?: boolean }) => (
    <div style={{
      height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 10,
      border: '1px solid rgba(239,68,68,0.18)', background: 'var(--app-surface)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(239,68,68,0.10)', background: 'rgba(239,68,68,0.04)' }}>
        <Bell style={{ width: 11, height: 11, color: '#f87171' }} />
        <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          ALert Notifications
        </span>
        <div style={{ display: 'flex', gap: 3, marginLeft: 'auto', alignItems: 'center' }}>
          {(['critical','high','medium','low'] as const).map(sev => {
            const cnt = sidebarNotifs.filter(a => a.severity === sev).length;
            if (!cnt) return null;
            const c = sevCfg(sev);
            return <span key={sev} style={{ fontSize: 7.5, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{cnt}</span>;
          })}
          {sidebarNotifs.length > 0 && (
            <button onClick={() => setDismissedNotifs(new Set(sidebarNotifs.map(a => a.id)))}
              style={{ fontSize: 7, color: 'var(--ds-text-muted)', cursor: 'pointer', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)', background: 'rgba(128,128,128,0.07)' }}>
              Clear
            </button>
          )}
          {opts?.maximizable && maximizeInlineBtn('alerts')}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sidebarNotifs.length === 0 && (
          <p style={{ fontSize: 8.5, color: 'var(--ds-text-muted)', fontStyle: 'italic', padding: '6px 2px', opacity: 0.7 }}>
            Alerts will appear here…
          </p>
        )}
        {sidebarNotifs.slice(0, maximized === 'alerts' ? sidebarNotifs.length : 3).map(alert => {
          const ucTag = getUCTag(alert);
          const c = sevCfg(alert.severity);
          const isNew = highlightId === alert.id;
          return (
            <div key={alert.id} style={{
              borderRadius: 8, padding: '7px 8px',
              background: c.bg,
              border: `1px solid ${isNew ? c.color : c.border}`,
              boxShadow: isNew ? `0 0 12px ${c.color}33` : 'none',
              transition: 'border-color 0.5s, box-shadow 0.5s',
              display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 7.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{ucTag}</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: c.color, textTransform: 'uppercase' }}>{alert.severity}</span>
                <span style={{ marginLeft: 'auto', fontSize: 7, color: 'var(--ds-text-muted)' }}>{alert.ts}</span>
                <button onClick={() => setDismissedNotifs(prev => new Set([...prev, alert.id]))}
                  style={{ cursor: 'pointer', color: 'var(--ds-text-muted)', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
                  <X style={{ width: 9, height: 9 }} />
                </button>
              </div>
              <span style={{ fontSize: 7, color: 'var(--ds-text-muted)', fontWeight: 500 }}>{UC_DESC[ucTag]}</span>
              <p style={{ fontSize: 8.5, color: 'var(--ds-text)', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.zone}</p>
              <p style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{alert.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEventLogsPanel = () => (
    <div style={{
      height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 10,
      border: '1px solid rgba(1,163,164,0.15)', background: 'rgba(1,163,164,0.03)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(1,163,164,0.08)' }}>
        <Server style={{ width: 11, height: 11, color: '#5FDCDA' }} />
        <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>System &amp; Event Logs</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '3px 7px 5px', display: 'flex', flexDirection: 'column' }}>
        {combinedLogs.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, padding: '4px 0', borderBottom: '1px solid rgba(128,128,128,0.07)', flexShrink: 0 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: log.color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 8.5, color: 'var(--ds-text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.msg}</p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
                <span style={{ fontSize: 6, fontWeight: 700, textTransform: 'uppercase', color: log.color }}>{log.tag}</span>
                <span style={{ fontSize: 7, color: 'var(--ds-text-muted)' }}>{log.ts}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComponentsPanel = () => (
    <div style={{
      height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 10,
      border: '1px solid rgba(16,185,129,0.14)', background: 'var(--app-surface)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
        <Shield style={{ width: 11, height: 11, color: '#34d399' }} />
        <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Components</span>
        <span style={{ marginLeft: 'auto', fontSize: 7.5, color: 'var(--ds-text-muted)' }}>
          {componentStatuses.filter(c => c.status === 'Operational').length}/{componentStatuses.length} OK
        </span>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['pie', 'bar'] as const).map(t => (
            <button key={t} onClick={() => setComponentsChartType(t)} style={{
              padding: '2px 8px', borderRadius: 5, fontSize: 7.5, fontWeight: 600, cursor: 'pointer',
              background: componentsChartType === t ? 'rgba(16,185,129,0.18)' : 'rgba(128,128,128,0.07)',
              color: componentsChartType === t ? '#6ee7b7' : 'var(--ds-text-muted)',
              border: `1px solid ${componentsChartType === t ? 'rgba(16,185,129,0.30)' : 'rgba(128,128,128,0.15)'}`,
            }}>{t}</button>
          ))}
        </div>
        <CompChart type={componentsChartType} data={componentStatuses} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {[
            { label: 'Operational', count: componentStatuses.filter(c => c.status === 'Operational').length, color: '#10b981' },
            { label: 'Warning',     count: componentStatuses.filter(c => c.status === 'Warning').length,     color: '#f59e0b' },
            { label: 'Critical',    count: componentStatuses.filter(c => c.status === 'Critical').length,    color: '#ef4444' },
          ].map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: g.color }} />
              <span style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', flex: 1 }}>{g.label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: g.color, fontVariantNumeric: 'tabular-nums' }}>{g.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 7px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {componentStatuses.slice(0, 4).map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 7, padding: '4px 7px', background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.1)', flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: c.status === 'Operational' ? '#10b981' : c.status === 'Warning' ? '#f59e0b' : '#ef4444' }} />
            <span style={{ fontSize: 8.5, color: 'var(--ds-text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setShowComponentsPopup(true)} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 'calc(100% - 14px)', margin: '0 7px 6px', padding: '4px 0', borderRadius: 7,
        fontSize: 8, fontWeight: 600, cursor: 'pointer',
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', color: '#6ee7b7',
      }}>
        View all {componentStatuses.length} ›
      </button>
    </div>
  );

  const renderWorkOrdersPanel = () => (
    <div style={{
      height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 10,
      border: '1px solid rgba(1,163,164,0.16)', background: 'var(--app-surface)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', borderBottom: '1px solid rgba(1,163,164,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileDown style={{ width: 11, height: 11, color: '#22C7C6' }} />
          <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Work Orders</span>
        </div>
        <button onClick={() => openWorkOrders({ subsystem: subsystemCode })} style={{ fontSize: 8, color: '#22C7C6', cursor: 'pointer', background: 'none', border: 'none' }}>View all</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {workOrders.slice(0, 3).map((wo, i) => (
          <div key={i} style={{ borderRadius: 7, padding: '5px 7px', background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.1)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#22C7C6', flexShrink: 0 }}>{wo.id}</span>
              <span style={{ padding: '1px 4px', borderRadius: 4, fontSize: 6.5, fontWeight: 700, flexShrink: 0,
                ...(wo.status === 'Completed' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' } : wo.status === 'In Progress' ? { background: 'rgba(1,163,164,0.15)', color: '#9BEAE8' } : { background: 'rgba(245,158,11,0.15)', color: '#fde68a' }) }}>
                {wo.status}
              </span>
              <span style={{ padding: '1px 4px', borderRadius: 4, fontSize: 6.5, fontWeight: 700, flexShrink: 0,
                ...(wo.priority === 'High' ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' } : wo.priority === 'Medium' ? { background: 'rgba(245,158,11,0.15)', color: '#fde68a' } : { background: 'rgba(138,155,168,0.15)', color: '#8A9BA8' }) }}>
                {wo.priority}
              </span>
            </div>
            <p style={{ fontSize: 8.5, color: 'var(--ds-text)', lineHeight: 1.25, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</p>
          </div>
        ))}
      </div>
      <button onClick={() => openWorkOrders()} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        width: 'calc(100% - 14px)', margin: '0 7px 6px', padding: '4px 0', borderRadius: 7,
        fontSize: 8, fontWeight: 600, cursor: 'pointer',
        background: 'rgba(1,163,164,0.08)', border: '1px solid rgba(1,163,164,0.22)', color: '#5FDCDA',
      }}>
        <Plus style={{ width: 9, height: 9 }} /> New Work Order
      </button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Supervisor layout — mission-control wireframe: big main panel + side
  //    Map/Alerts (each maximizable to full page) + Components/Work Orders strip
  if (layout === 'supervisor') {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        {!maximized && <div className="px-2 pt-2 flex-shrink-0">{topTabs}</div>}

        <div className="flex-1 flex p-2 gap-2 overflow-hidden" style={{ minHeight: 0 }}>
          {maximized ? (
            <div style={{ flex: 1, minHeight: 0 }}>
              {maximized === 'map' ? renderMapPanel({ maximizable: true }) : renderAlertsPanel({ maximizable: true })}
            </div>
          ) : (
            <>
              {/* LEFT column — main equipment panel + Components/Work Orders/Event Logs strip */}
              <div className="flex flex-col gap-2" style={{ flex: 7, minWidth: 0, minHeight: 0 }}>
                <div className="kpi-zoom-sm" style={{
                  flex: '4 1 0%', minHeight: 0, borderRadius: 14,
                  background: 'var(--app-surface)', border: '1px solid rgba(32, 120, 207,0.08)',
                  padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {kpiAreaOverride}
                </div>
                <div className="flex gap-2 kpi-zoom-sm" style={{ flex: '1 1 0%', minHeight: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>{renderComponentsPanel()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>{renderWorkOrdersPanel()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>{renderEventLogsPanel()}</div>
                </div>
              </div>

              {/* RIGHT column — Map (top) + Alerts (bottom), each maximizable */}
              <div className="flex flex-col gap-2" style={{ flex: 2.3, minWidth: 0, minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0 }}>{renderMapPanel({ maximizable: true })}</div>
                <div className="kpi-zoom-sm" style={{ flex: 1, minHeight: 0 }}>{renderAlertsPanel({ maximizable: true })}</div>
              </div>
            </>
          )}
        </div>

        {/* ── Toast popup — anchored near the Alerts panel (bottom-right), not the
              map, which now sits in the top half of the same column ──────────── */}
        {activeToast && (() => {
          const ucTag = getUCTag(activeToast);
          const c = sevCfg(activeToast.severity);
          return (
            <div style={{
              position: 'fixed', bottom: 16, right: 16, width: 292, zIndex: 500,
              borderRadius: 14, padding: '12px 14px',
              background: 'var(--app-panel, #08203A)', border: `1px solid ${c.border}`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${c.color}18`,
              display: 'flex', flexDirection: 'column', gap: 6,
              transform: `translateX(${toastIn ? '0%' : '115%'})`,
              opacity: toastIn ? 1 : 0,
              transition: toastIn
                ? 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease'
                : 'transform 0.25s ease-in, opacity 0.25s ease-in',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.color, boxShadow: `0 0 0 3px ${c.color}33`, animation: 'hbms-pulse 1.4s ease-in-out infinite' }} />
                <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44`, letterSpacing: '0.04em' }}>{ucTag}</span>
                <span style={{ fontSize: 7.5, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeToast.severity}</span>
                <span style={{ marginLeft: 'auto', fontSize: 7.5, color: 'var(--ds-text-muted)' }}>{activeToast.ts}</span>
                <button onClick={dismissToast} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </div>
              <span style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>{UC_DESC[ucTag]}</span>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-text)', lineHeight: 1.2 }}>{activeToast.zone}</p>
              <p style={{ fontSize: 9, color: 'var(--ds-text-muted)', lineHeight: 1.4 }}>{activeToast.message}</p>
              <div style={{ height: 2, borderRadius: 1, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginTop: 2 }}>
                <div style={{ height: '100%', background: c.color, borderRadius: 1, animation: toastIn ? 'hbms-toastDrain 3s linear forwards' : 'none' }} />
              </div>
              <p style={{ fontSize: 7, color: 'var(--ds-text-muted)', opacity: 0.55, textAlign: 'right', marginTop: -2 }}>Stacking in sidebar →</p>
            </div>
          );
        })()}

        {/* ── Component status popup ────────────────────────────────────────── */}
        {showComponentsPopup && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(4,16,31,0.88)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowComponentsPopup(false)}
          >
            <div
              style={{ borderRadius: 16, border: '1px solid rgba(16,185,129,0.28)', boxShadow: '0 0 80px rgba(0,0,0,0.7)', background: 'var(--app-panel)', width: '100%', maxWidth: 480, overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(128,128,128,0.1)', background: 'rgba(16,185,129,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <Shield style={{ width: 14, height: 14, color: '#34d399' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-text)', lineHeight: 1.2 }}>Component Status</h3>
                    <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>
                      {subsystemName} · {componentStatuses.filter(c => c.status === 'Operational').length} of {componentStatuses.length} operational
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowComponentsPopup(false)} style={{ padding: '5px 7px', borderRadius: 8, cursor: 'pointer', background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.15)', color: 'var(--ds-text-muted)', fontSize: 11 }}>✕</button>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
                {componentStatuses.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: '10px 14px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.status === 'Operational' ? '#10b981' : c.status === 'Warning' ? '#f59e0b' : '#ef4444', boxShadow: c.status === 'Operational' ? '0 0 6px #10b981' : c.status === 'Warning' ? '0 0 6px #f59e0b' : '0 0 6px #ef4444' }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: 'var(--ds-text)', fontWeight: 500 }}>{c.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>{c.details}</p>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 7, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 14,
                      ...(c.status === 'Operational' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }
                        : c.status === 'Warning'     ? { background: 'rgba(245,158,11,0.15)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.25)' }
                        :                              { background: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }),
                    }}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Map + KPI 5×2 grid ─────────────────────────────────────── */}
        <div className="flex-[7] flex flex-col p-2 gap-2 overflow-hidden" style={{ minWidth: 0, position: 'relative' }}>

          {topTabs}

          {/* Map */}
          {/* The source ran full-viewport; inside the TAMS console chrome there
              is ~9rem less height, so the map gives some back to the KPI grid
              below it — otherwise the six-column layouts (LBMS) clip. */}
          <div style={{ flex: '0 0 46%', minHeight: 180, borderRadius: 14, overflow: 'hidden' }}>
            {mapComponent ?? <TerminalMap subsystem={subsystemCode?.toUpperCase()} />}
          </div>

          {/* KPI grid. Zoomed rather than re-typed: the cards carry inline
              pixel sizes from the port, which no class can override. */}
          <div className="kpi-zoom" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {kpiAreaOverride ? kpiAreaOverride : (
              <>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity style={{ width: 11, height: 11, color: '#22C7C6' }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    KPI Overview
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 7.5, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
                    {operationalKPIs.length} operational · {systemKPIs.length} system
                  </span>
                </div>

                {/* Row 1 — Operational */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols}, 1fr)`, gap: 5, flexShrink: 0 }}>
                  {operationalKPIs.slice(0, kpiCols).map((kpi, i) => <KPIStripCard key={i} kpi={kpi} onClick={() => openKpiTrend(kpi, 'op')} />)}
                </div>

                {/* Row 2 — System */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols}, 1fr)`, gap: 5, flexShrink: 0 }}>
                  {systemKPIs.slice(0, kpiCols).map((kpi, i) => <KPIStripCard key={i} kpi={kpi} onClick={() => openKpiTrend(kpi, 'sys')} />)}
                </div>
              </>
            )}
          </div>

          {/* Astrikos logo — bottom-left watermark overlay */}
          {/* <img
            src="/Astrikos_Logo_Transparent_perfect.png"
            alt="Astrikos"
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              height: 32,
              opacity: 0.50,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          /> */}
        </div>

        {/* ── RIGHT SIDEBAR — no scroll ────────────────────────────────────── */}
        <div style={{
          width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: 'var(--app-surface-soft)',
          borderLeft: '1px solid var(--app-border-soft, rgba(0,0,0,0.07))',
        }}>

          {/* Last data received — counts up since the last data tick;
              >5s stale = amber, >10s = red, otherwise normal. */}
          {(() => {
            const staleness = secsSinceData > 10 ? 'red' : secsSinceData > 5 ? 'amber' : 'ok';
            const color = staleness === 'red' ? '#f87171' : staleness === 'amber' ? '#fbbf24' : '#22C7C6';
            const borderColor = staleness === 'red' ? 'rgba(248,113,113,0.28)' : staleness === 'amber' ? 'rgba(251,191,36,0.22)' : 'rgba(1,163,164,0.15)';
            const bgColor = staleness === 'red' ? 'rgba(248,113,113,0.06)' : staleness === 'amber' ? 'rgba(251,191,36,0.05)' : 'rgba(1,163,164,0.05)';
            return (
              <div style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 10px',
                borderBottom: `1px solid ${borderColor}`,
                background: bgColor,
              }}>
                <RefreshCw style={{ width: 11, height: 11, color, flexShrink: 0 }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  Last Data Received
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color }}>
                  {secsSinceData === 0 ? 'Live' : `${secsSinceData}s ago`}
                </span>
                <div style={{ width: 48, height: 3, borderRadius: 2, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{
                    width: `${Math.min(100, (secsSinceData / 10) * 100)}%`, height: '100%', borderRadius: 2,
                    background: staleness === 'red' ? 'linear-gradient(90deg,#dc2626,#f87171)' : staleness === 'amber' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#018587,#22C7C6)',
                    transition: 'width 1s linear',
                  }} />
                </div>
              </div>
            );
          })()}

          {/* Sidebar content — NO scroll, flex column */}
          <div style={{ flex: 1, overflow: 'hidden', padding: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>

            {/* FRS Alert Stack */}
            <div style={{
              flex: '3 1 0', minHeight: 0, overflow: 'hidden', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.18)', background: 'var(--app-surface)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(239,68,68,0.10)', background: 'rgba(239,68,68,0.04)' }}>
                <Bell style={{ width: 11, height: 11, color: '#f87171' }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                  ALert Notifications
                </span>
                <div style={{ display: 'flex', gap: 3, marginLeft: 'auto', alignItems: 'center' }}>
                  {(['critical','high','medium','low'] as const).map(sev => {
                    const cnt = sidebarNotifs.filter(a => a.severity === sev).length;
                    if (!cnt) return null;
                    const c = sevCfg(sev);
                    return <span key={sev} style={{ fontSize: 7.5, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{cnt}</span>;
                  })}
                  {sidebarNotifs.length > 0 && (
                    <button onClick={() => setDismissedNotifs(new Set(sidebarNotifs.map(a => a.id)))}
                      style={{ fontSize: 7, color: 'var(--ds-text-muted)', cursor: 'pointer', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)', background: 'rgba(128,128,128,0.07)' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sidebarNotifs.length === 0 && (
                  <p style={{ fontSize: 8.5, color: 'var(--ds-text-muted)', fontStyle: 'italic', padding: '6px 2px', opacity: 0.7 }}>
                    Alerts will appear here…
                  </p>
                )}
                {sidebarNotifs.slice(0, 3).map(alert => {
                  const ucTag = getUCTag(alert);
                  const c = sevCfg(alert.severity);
                  const isNew = highlightId === alert.id;
                  return (
                    <div key={alert.id} style={{
                      borderRadius: 8, padding: '7px 8px',
                      background: c.bg,
                      border: `1px solid ${isNew ? c.color : c.border}`,
                      boxShadow: isNew ? `0 0 12px ${c.color}33` : 'none',
                      transition: 'border-color 0.5s, box-shadow 0.5s',
                      display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 7.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{ucTag}</span>
                        <span style={{ fontSize: 7, fontWeight: 700, color: c.color, textTransform: 'uppercase' }}>{alert.severity}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 7, color: 'var(--ds-text-muted)' }}>{alert.ts}</span>
                        <button onClick={() => setDismissedNotifs(prev => new Set([...prev, alert.id]))}
                          style={{ cursor: 'pointer', color: 'var(--ds-text-muted)', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
                          <X style={{ width: 9, height: 9 }} />
                        </button>
                      </div>
                      <span style={{ fontSize: 7, color: 'var(--ds-text-muted)', fontWeight: 500 }}>{UC_DESC[ucTag]}</span>
                      <p style={{ fontSize: 8.5, color: 'var(--ds-text)', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.zone}</p>
                      <p style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System & Event Logs */}
            <div style={{
              flex: '2 1 0', minHeight: 0, overflow: 'hidden', borderRadius: 10,
              border: '1px solid rgba(1,163,164,0.15)', background: 'rgba(1,163,164,0.03)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(1,163,164,0.08)' }}>
                <Server style={{ width: 11, height: 11, color: '#5FDCDA' }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>System &amp; Event Logs</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '3px 7px 5px', display: 'flex', flexDirection: 'column' }}>
                {combinedLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, padding: '4px 0', borderBottom: '1px solid rgba(128,128,128,0.07)', flexShrink: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: log.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 8.5, color: 'var(--ds-text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.msg}</p>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
                        <span style={{ fontSize: 6, fontWeight: 700, textTransform: 'uppercase', color: log.color }}>{log.tag}</span>
                        <span style={{ fontSize: 7, color: 'var(--ds-text-muted)' }}>{log.ts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Components */}
            <div style={{
              flex: '2.5 1 0', minHeight: 0, overflow: 'hidden', borderRadius: 10,
              border: '1px solid rgba(16,185,129,0.14)', background: 'var(--app-surface)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                <Shield style={{ width: 11, height: 11, color: '#34d399' }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Components</span>
                <span style={{ marginLeft: 'auto', fontSize: 7.5, color: 'var(--ds-text-muted)' }}>
                  {componentStatuses.filter(c => c.status === 'Operational').length}/{componentStatuses.length} OK
                </span>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {(['pie', 'bar'] as const).map(t => (
                    <button key={t} onClick={() => setComponentsChartType(t)} style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 7.5, fontWeight: 600, cursor: 'pointer',
                      background: componentsChartType === t ? 'rgba(16,185,129,0.18)' : 'rgba(128,128,128,0.07)',
                      color: componentsChartType === t ? '#6ee7b7' : 'var(--ds-text-muted)',
                      border: `1px solid ${componentsChartType === t ? 'rgba(16,185,129,0.30)' : 'rgba(128,128,128,0.15)'}`,
                    }}>{t}</button>
                  ))}
                </div>
                <CompChart type={componentsChartType} data={componentStatuses} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  {[
                    { label: 'Operational', count: componentStatuses.filter(c => c.status === 'Operational').length, color: '#10b981' },
                    { label: 'Warning',     count: componentStatuses.filter(c => c.status === 'Warning').length,     color: '#f59e0b' },
                    { label: 'Critical',    count: componentStatuses.filter(c => c.status === 'Critical').length,    color: '#ef4444' },
                  ].map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: g.color }} />
                      <span style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', flex: 1 }}>{g.label}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: g.color, fontVariantNumeric: 'tabular-nums' }}>{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 7px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {componentStatuses.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 7, padding: '4px 7px', background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.1)', flexShrink: 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: c.status === 'Operational' ? '#10b981' : c.status === 'Warning' ? '#f59e0b' : '#ef4444' }} />
                    <span style={{ fontSize: 8.5, color: 'var(--ds-text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowComponentsPopup(true)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 'calc(100% - 14px)', margin: '0 7px 6px', padding: '4px 0', borderRadius: 7,
                fontSize: 8, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', color: '#6ee7b7',
              }}>
                View all {componentStatuses.length} ›
              </button>
            </div>

            {/* Work Orders */}
            <div style={{
              flex: '2 1 0', minHeight: 0, overflow: 'hidden', borderRadius: 10,
              border: '1px solid rgba(1,163,164,0.16)', background: 'var(--app-surface)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', borderBottom: '1px solid rgba(1,163,164,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileDown style={{ width: 11, height: 11, color: '#22C7C6' }} />
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Work Orders</span>
                </div>
                <button onClick={() => openWorkOrders({ subsystem: subsystemCode })} style={{ fontSize: 8, color: '#22C7C6', cursor: 'pointer', background: 'none', border: 'none' }}>View all</button>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '4px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {workOrders.slice(0, 3).map((wo, i) => (
                  <div key={i} style={{ borderRadius: 7, padding: '5px 7px', background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.1)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#22C7C6', flexShrink: 0 }}>{wo.id}</span>
                      <span style={{ padding: '1px 4px', borderRadius: 4, fontSize: 6.5, fontWeight: 700, flexShrink: 0,
                        ...(wo.status === 'Completed' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' } : wo.status === 'In Progress' ? { background: 'rgba(1,163,164,0.15)', color: '#9BEAE8' } : { background: 'rgba(245,158,11,0.15)', color: '#fde68a' }) }}>
                        {wo.status}
                      </span>
                      <span style={{ padding: '1px 4px', borderRadius: 4, fontSize: 6.5, fontWeight: 700, flexShrink: 0,
                        ...(wo.priority === 'High' ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' } : wo.priority === 'Medium' ? { background: 'rgba(245,158,11,0.15)', color: '#fde68a' } : { background: 'rgba(138,155,168,0.15)', color: '#8A9BA8' }) }}>
                        {wo.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: 8.5, color: 'var(--ds-text)', lineHeight: 1.25, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => openWorkOrders()} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                width: 'calc(100% - 14px)', margin: '0 7px 6px', padding: '4px 0', borderRadius: 7,
                fontSize: 8, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(1,163,164,0.08)', border: '1px solid rgba(1,163,164,0.22)', color: '#5FDCDA',
              }}>
                <Plus style={{ width: 9, height: 9 }} /> New Work Order
              </button>
            </div>

          </div>{/* end sidebar content */}
        </div>{/* end right sidebar */}
      </div>{/* end main flex row */}

      {/* ── Toast popup — top-right, animates in/out ─────────────────────── */}
      {activeToast && (() => {
        const ucTag = getUCTag(activeToast);
        const c = sevCfg(activeToast.severity);
        return (
          <div style={{
            position: 'fixed',
            top: 74,
            right: 16,
            width: 292,
            zIndex: 500,
            borderRadius: 14,
            padding: '12px 14px',
            background: 'var(--app-panel, #08203A)',
            border: `1px solid ${c.border}`,
            boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${c.color}18`,
            
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            // slide-in from right with spring, slide-out fast
            transform: `translateX(${toastIn ? '0%' : '115%'})`,
            opacity: toastIn ? 1 : 0,
            transition: toastIn
              ? 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease'
              : 'transform 0.25s ease-in, opacity 0.25s ease-in',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Pulsing severity dot */}
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: c.color,
                boxShadow: `0 0 0 3px ${c.color}33`,
                animation: 'hbms-pulse 1.4s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44`, letterSpacing: '0.04em' }}>
                {ucTag}
              </span>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {activeToast.severity}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 7.5, color: 'var(--ds-text-muted)' }}>{activeToast.ts}</span>
              <button onClick={dismissToast} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                <X style={{ width: 11, height: 11 }} />
              </button>
            </div>

            {/* UC description */}
            <span style={{ fontSize: 7.5, color: 'var(--ds-text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              {UC_DESC[ucTag]}
            </span>

            {/* Zone */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-text)', lineHeight: 1.2 }}>
              {activeToast.zone}
            </p>

            {/* Message */}
            <p style={{ fontSize: 9, color: 'var(--ds-text-muted)', lineHeight: 1.4 }}>
              {activeToast.message}
            </p>

            {/* 2-second drain bar */}
            <div style={{ height: 2, borderRadius: 1, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginTop: 2 }}>
              <div style={{
                height: '100%',
                background: c.color,
                borderRadius: 1,
                // CSS keyframe: once visible, drains from 100% → 0% over 3s
                animation: toastIn ? 'hbms-toastDrain 3s linear forwards' : 'none',
              }} />
            </div>

            {/* "Stacking to sidebar" hint */}
            <p style={{ fontSize: 7, color: 'var(--ds-text-muted)', opacity: 0.55, textAlign: 'right', marginTop: -2 }}>
              Stacking in sidebar →
            </p>
          </div>
        );
      })()}

      {/* ── Component status popup ────────────────────────────────────────── */}
      {showComponentsPopup && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(4,16,31,0.88)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowComponentsPopup(false)}
        >
          <div
            style={{ borderRadius: 16, border: '1px solid rgba(16,185,129,0.28)', boxShadow: '0 0 80px rgba(0,0,0,0.7)', background: 'var(--app-panel)', width: '100%', maxWidth: 480, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(128,128,128,0.1)', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Shield style={{ width: 14, height: 14, color: '#34d399' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-text)', lineHeight: 1.2 }}>Component Status</h3>
                  <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>
                    {subsystemName} · {componentStatuses.filter(c => c.status === 'Operational').length} of {componentStatuses.length} operational
                  </p>
                </div>
              </div>
              <button onClick={() => setShowComponentsPopup(false)} style={{ padding: '5px 7px', borderRadius: 8, cursor: 'pointer', background: 'rgba(128,128,128,0.1)', border: '1px solid rgba(128,128,128,0.15)', color: 'var(--ds-text-muted)', fontSize: 11 }}>✕</button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
              {componentStatuses.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: '10px 14px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c.status === 'Operational' ? '#10b981' : c.status === 'Warning' ? '#f59e0b' : '#ef4444', boxShadow: c.status === 'Operational' ? '0 0 6px #10b981' : c.status === 'Warning' ? '0 0 6px #f59e0b' : '0 0 6px #ef4444' }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'var(--ds-text)', fontWeight: 500 }}>{c.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>{c.details}</p>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 7, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 14,
                    ...(c.status === 'Operational' ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }
                      : c.status === 'Warning'     ? { background: 'rgba(245,158,11,0.15)', color: '#fde68a', border: '1px solid rgba(245,158,11,0.25)' }
                      :                              { background: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }),
                  }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    {activeTrendKpi && (
      <TrendAnalysisModal kpi={activeTrendKpi} onClose={() => setActiveTrendKpi(null)} />
    )}
    </>
  );
};

export default SubsystemPage;
