import React, { useEffect, useState } from 'react';
import { LayoutGrid, User, Map as MapIcon } from 'lucide-react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';
import LBMSOperatorOverview from '../components/LBMSOperatorOverview';
import TerminalMap from '../components/TerminalMap';
import { AHU_TOTAL_COUNT, AHU_FAULT_COUNT } from '../lbmsAssets';
import { useHbmsStore } from '../store/useHbmsStore';

/** Deep-link into this page from elsewhere — pass as
 *  `openSubsystem('lbms', { openAhuGrid: true, ahuAssetId })`. Landing here
 *  always opens the Operator tab straight into the AHU grid, pre-filtered to
 *  one unit — that's the only focus flow this supports today. */
export interface LbmsFocusState {
  openAhuGrid?: boolean;
  ahuAssetId?: string;
}

// ── FRS KPIs (LBMS — Low Building Management System, HVAC via OPC UA/DDC) ──
// Executive (Supervisor view): Equipment Availability % — overall + per
// equipment type — straight from Documents/LBMS/LBMS_KPI_Specification.xlsx's
// "Executive" category rows (LBMS-KPI-E01..E03, LBMS-KPI-01/04/07/10/13/16/19/22/25).
// Operational category (Trip Count / Comm Failure Count) is shown in Operator
// view instead — see LBMSOperatorOverview's counter strip.

const ahuAvailability = Math.round(((AHU_TOTAL_COUNT - AHU_FAULT_COUNT) / AHU_TOTAL_COUNT) * 1000) / 10;

export const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Overall Equipment Availability', current: 97.1, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: 'All monitored LBMS equipment — ON/OFF vs TRIP/DISCONNECTED', sparkline: [98.2, 98.0, 97.8, 97.6, 97.4, 97.2, 97.1],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.5, weeklyAvg: 97.8, shifts: [97.5, 97.1, 96.9], incidents: 1, trend: -0.4 },
  { name: 'Overall Device Health', current: 97.8, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: 'Devices excluding TRIP/DISCONNECTED', sparkline: [98.5, 98.3, 98.1, 98.0, 97.9, 97.8, 97.8],
    sla: '≥98%', lastChecked: 'Live', yesterday: 98.0, weeklyAvg: 98.1, shifts: [98.0, 97.8, 97.6], incidents: 1, trend: -0.2 },
  { name: 'Overall Communication Availability', current: 99.2, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'Devices not in DISCONNECTED state', sparkline: [99.4, 99.4, 99.3, 99.3, 99.2, 99.2, 99.2],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.3, weeklyAvg: 99.3, shifts: [99.3, 99.2, 99.1], incidents: 0, trend: -0.1 },
  { name: 'AHU Equipment Availability', current: ahuAvailability, target: 98, unit: '%', status: ahuAvailability >= 98 ? 'green' : 'yellow', comparison: 'above',
    context: `${AHU_TOTAL_COUNT - AHU_FAULT_COUNT} of ${AHU_TOTAL_COUNT} AHUs ON/OFF (not TRIP)`, sparkline: [95.0, 94.8, 94.5, 94.2, 94.0, 93.9, ahuAvailability],
    sla: '≥98%', lastChecked: 'Live', yesterday: 94.0, weeklyAvg: 94.3, shifts: [94.5, ahuAvailability, 94.0], incidents: AHU_FAULT_COUNT, trend: -0.3 },
  { name: 'PAU Equipment Availability', current: 97.7, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '1 PAU unit in TRIP state (GF)', sparkline: [98.5, 98.3, 98.1, 98.0, 97.9, 97.8, 97.7],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.9, weeklyAvg: 98.0, shifts: [98.0, 97.7, 97.6], incidents: 1, trend: -0.2 },
  { name: 'MAU Equipment Availability', current: 99.4, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'All MAU units ON/OFF, none TRIP/DISCONNECTED', sparkline: [99.2, 99.3, 99.3, 99.4, 99.4, 99.4, 99.4],
    sla: '≥98%', lastChecked: 'Live', yesterday: 99.3, weeklyAvg: 99.3, shifts: [99.4, 99.4, 99.3], incidents: 0, trend: +0.1 },
];

export const SYSTEM_KPIS: KPIData[] = [
  { name: 'CRAH Equipment Availability', current: 93.9, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '3 of 23 CRAH-GF units offline — comm failure flagged', sparkline: [96.5, 96.0, 95.5, 95.0, 94.5, 94.1, 93.9],
    sla: '≥98%', lastChecked: 'Live', yesterday: 94.5, weeklyAvg: 95.2, shifts: [94.8, 93.9, 93.5], incidents: 1, trend: -1.1 },
  { name: 'FCU Equipment Availability', current: 99.6, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: '6 of 1,366 Fan Coil Units in fault', sparkline: [99.4, 99.4, 99.5, 99.5, 99.6, 99.6, 99.6],
    sla: '≥98%', lastChecked: 'Live', yesterday: 99.5, weeklyAvg: 99.5, shifts: [99.6, 99.6, 99.5], incidents: 1, trend: +0.1 },
  { name: 'VAV Equipment Availability', current: 99.1, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'All zone VAV controllers reporting nominal', sparkline: [98.8, 98.9, 99.0, 99.0, 99.1, 99.1, 99.1],
    sla: '≥98%', lastChecked: 'Live', yesterday: 99.0, weeklyAvg: 99.0, shifts: [99.1, 99.1, 99.0], incidents: 0, trend: +0.2 },
  { name: 'Chillers Equipment Availability', current: 98.5, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'All chiller plant units ON/OFF, none TRIP', sparkline: [98.2, 98.3, 98.3, 98.4, 98.4, 98.5, 98.5],
    sla: '≥98%', lastChecked: 'Live', yesterday: 98.4, weeklyAvg: 98.3, shifts: [98.5, 98.5, 98.4], incidents: 0, trend: +0.1 },
  { name: 'Plumbing Equipment Availability', current: 99.2, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'Hydraulic pumps + water meters — all reporting', sparkline: [99.0, 99.0, 99.1, 99.1, 99.2, 99.2, 99.2],
    sla: '≥98%', lastChecked: 'Live', yesterday: 99.1, weeklyAvg: 99.1, shifts: [99.2, 99.2, 99.1], incidents: 0, trend: +0.1 },
  { name: 'Fire Fighting Interfaces Availability', current: 100, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'FM200 + fire pump/nitrogen interfaces — all healthy', sparkline: [100, 100, 100, 100, 100, 100, 100],
    sla: '≥98%', lastChecked: 'Live', yesterday: 100, weeklyAvg: 100, shifts: [100, 100, 100], incidents: 0, trend: 0 },
];

// ── FRS Use-Cases: UC-LBMS-04/05 primary triggers; UC-LBMS-07 for KPI threshold ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'LBMS-001', severity: 'high',   zone: 'Terminal 1 — Departure Hall Zone D3',
    message: '[UC-LBMS-05] AHU-T1-D3 trip detected — HVAC offline, thermal compliance breach', ts: '09:22', ack: false },
  { id: 'LBMS-002', severity: 'high',   zone: 'Pier B — Boarding Zone B6',
    message: '[UC-LBMS-05] CO₂ level 1240 ppm in Zone B6 — IAQ threshold exceeded (SLA ≤800 ppm)', ts: '09:45', ack: false },
  { id: 'LBMS-003', severity: 'medium', zone: 'Terminal 2 — Check-in Area',
    message: '[UC-LBMS-04] AHU-T2-C1 aggregated status: Operational → Warning — efficiency drop', ts: '08:38', ack: true },
  { id: 'LBMS-004', severity: 'medium', zone: 'OPC UA Link — DDC Panel P07',
    message: '[UC-LBMS-05] DDC Panel P07 OPC UA link intermittent — data gaps detected', ts: '08:10', ack: true },
  { id: 'LBMS-005', severity: 'low',    zone: 'Terminal 1 — Zone T1-E2',
    message: '[UC-LBMS-07] Thermal comfort KPI breach — T1-E2 above setpoint +2.5°C for >30 min', ts: '07:50', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'OPC UA scan OK — 48 DDC panels, 320 points active',      ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'AHU-T1-D3 trip alarm received — zone offline',           ts: '09:22', level: 'err'  },
  { id: 'sl-3', msg: 'CO₂ alert Zone B6 — 1240 ppm, SLA breach',              ts: '09:45', level: 'err'  },
  { id: 'sl-4', msg: 'AHU-T2-C1 efficiency drop — warning status set',         ts: '08:38', level: 'warn' },
  { id: 'sl-5', msg: 'DDC P07 OPC UA intermittent — reconnect in progress',    ts: '08:10', level: 'warn' },
  { id: 'sl-6', msg: 'Daily energy report — 18.2 kWh/m² (below target)',       ts: '06:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-LBMS-05: AHU-T1-D3 trip — zone D3 offline',          type: 'alert',         severity: 'warn', timestamp: '09:22' },
  { id: 'e-2', title: 'UC-LBMS-05: CO₂ threshold breach Zone B6',              type: 'alert',         severity: 'warn', timestamp: '09:45' },
  { id: 'e-3', title: 'UC-LBMS-04: AHU-T2-C1 aggregated status Warning',       type: 'status_change', severity: 'warn', timestamp: '08:38' },
  { id: 'e-4', title: 'UC-LBMS-05: DDC P07 comms intermittent',                type: 'alert',         severity: 'warn', timestamp: '08:10' },
  { id: 'e-5', title: 'UC-LBMS-07: KPI report — energy 18.2 kWh/m²',          type: 'system',        severity: 'ok',   timestamp: '06:00' },
  { id: 'e-6', title: 'UC-LBMS-01: AHU-T3-A2 onboarded — new unit commissioned',type: 'system',      severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-LBMS-041', title: 'AHU-T1-D3 trip investigation & reset',         status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-LBMS-042', title: 'Zone B6 ventilation capacity review',           status: 'Open',        priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-LBMS-040', title: 'DDC P07 OPC UA link cable inspection',          status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-LBMS-038', title: 'Quarterly filter replacement — Terminal 1 AHUs',status: 'Completed',  priority: 'Low',    assignee: 'Nam Pham',    date: '3 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'AHU Units — Terminal 1 (T1-A01–08)', status: 'Critical',    details: 'T1-D3 tripped offline' },
  { name: 'AHU Units — Terminal 2 (T2-A01–08)', status: 'Warning',     details: 'T2-C1 efficiency warning' },
  { name: 'AHU Units — Pier B (B-A01–06)',       status: 'Operational', details: '6/6 units running' },
  { name: 'DDC Panels (P01–P48)',                status: 'Warning',     details: 'P07 OPC UA intermittent' },
  { name: 'VAV Controllers',                    status: 'Operational', details: 'All zones controlled' },
  { name: 'Air Quality Sensors',               status: 'Critical',    details: 'B6 CO₂ above threshold' },
  { name: 'OPC UA Integration',               status: 'Warning',     details: 'P07 link intermittent' },
  { name: 'BMS Alarm Engine',                status: 'Operational', details: 'All threshold alerts active' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'OPC UA',  msg: 'DDC scan — 320 HVAC points updated',        ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'AHU-T1-D3',msg: 'Trip alarm received — zone alarm raised',  ts: '09:22', status: 'updated' },
  { id: 'il-3', ref: 'B6/CO2',  msg: 'IAQ threshold breach — alert generated',    ts: '09:45', status: 'updated' },
  { id: 'il-4', ref: 'DDC-P07', msg: 'OPC UA timeout — reconnect attempted',      ts: '08:10', status: 'err'     },
  { id: 'il-5', ref: 'AHU-T2-C1',msg: 'Aggregated status Warning — updated',     ts: '08:38', status: 'updated' },
  { id: 'il-6', ref: 'LBMS',    msg: 'Nightly energy KPI generated',              ts: '00:00', status: 'synced'  },
];

const VIEW_TABS = [
  { key: 'supervisor', label: 'Supervisor', icon: User },
  { key: 'operator',   label: 'Operator',   icon: LayoutGrid },
  { key: 'map',        label: 'Map view',   icon: MapIcon },
] as const;

type LBMSView = (typeof VIEW_TABS)[number]['key'];

const LBMSDetails: React.FC = () => {
  const currentRole = useHbmsStore((s) => s.role);
  // Read once on arrival — a focused deep-link always wants the Operator
  // tab, regardless of what the role default would otherwise pick. The
  // payload used to ride on `location.state`; it now rides on the store.
  const [focus] = useState<LbmsFocusState | undefined>(() => useHbmsStore.getState().lbmsFocus ?? undefined);
  const consumeLbmsFocus = useHbmsStore((s) => s.consumeLbmsFocus);
  useEffect(() => { consumeLbmsFocus(); }, [consumeLbmsFocus]);
  // LBMS Admin's Supervisor KPI grid moved to the Dashboard (shown there
  // instead) — so this page only offers Operator + Map view for that role.
  // Super Admin (and everyone else) keeps all three tabs, unchanged.
  const isLbmsAdmin = currentRole === 'LBMS Admin';
  const visibleTabs = isLbmsAdmin ? VIEW_TABS.filter(t => t.key !== 'supervisor') : VIEW_TABS;
  const [view, setView] = useState<LBMSView>(focus ? 'operator' : isLbmsAdmin ? 'operator' : 'supervisor');

  const topTabs = (
    <div className="flex items-center gap-1 mb-2 flex-shrink-0">
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        const active = view === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider transition-all duration-150"
            style={{
              background: active ? 'rgba(16,185,129,0.18)' : 'rgba(32, 120, 207,0.04)',
              color: active ? '#34d399' : '#7C8FA0',
              border: `1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(32, 120, 207,0.06)'}`,
            }}
          >
            <Icon className="w-3 h-3" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  if (view === 'map') {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--app-bg)' }}>
        <div className="px-2 pt-2 flex-shrink-0">{topTabs}</div>
        <div className="flex-1 min-h-0 p-2">
          <div style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }}>
            <TerminalMap subsystem="LBMS" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SubsystemPage
      subsystemName="Low Building Management System"
      subsystemCode="lbms"
      operationalKPIs={OPERATIONAL_KPIS}
      systemKPIs={SYSTEM_KPIS}
      liveAlerts={LIVE_ALERTS}
      systemLogs={SYSTEM_LOGS}
      recentEvents={RECENT_EVENTS}
      workOrders={WORK_ORDERS}
      componentStatuses={COMPONENT_STATUS}
      integrationLog={INTEGRATION_LOG}
      topTabs={topTabs}
      kpiCols={6}
      kpiAreaOverride={view === 'operator' ? <LBMSOperatorOverview autoOpenGrid={focus?.openAhuGrid} focusAssetId={focus?.ahuAssetId} /> : undefined}
      layout={view === 'operator' ? 'supervisor' : 'default'}
      mapComponent={<TerminalMap subsystem="LBMS" />}
    />
  );
};

export default LBMSDetails;
