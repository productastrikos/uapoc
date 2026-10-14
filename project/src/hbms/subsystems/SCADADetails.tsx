import React, { useState } from 'react';
import { LayoutGrid, User } from 'lucide-react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';
import SCADAEquipmentOverview from '../components/SCADAEquipmentOverview';

// ── FRS KPIs (SCADA — Electrical Distribution via OPC UA) ──
// Operational: Elec. Equipment Availability, Feeder/Breaker Trip Count, Critical Alarm Backlog, Alarm Freq, Comm Loss Duration
// System: MTTA, MTTR, OPC UA Session Health, OPC UA Nodes Active, Downtime Duration

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Electrical Equipment Availability', current: 96.8, target: 95, unit: '%', status: 'green', comparison: 'above',
    context: 'MV/LV equipment in Healthy/On/Normal state', sparkline: [95.2, 95.5, 95.8, 96.0, 96.3, 96.5, 96.8],
    sla: '≥95%', lastChecked: 'Live', yesterday: 96.5, weeklyAvg: 96.1, shifts: [97.0, 96.8, 96.5], incidents: 0, trend: +0.5 },
  { name: 'Feeder / Breaker Trip Count', current: 1, target: 0, unit: 'trips', status: 'yellow', comparison: 'above',
    context: 'Feeder FDR-T1-MV03 trip this shift — SOP active', sparkline: [0, 0, 0, 0, 0, 1, 1],
    sla: '0 trips', lastChecked: '09:44', yesterday: 0, weeklyAvg: 0.3, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
  { name: 'Critical Alarm Backlog', current: 2, target: 0, unit: 'alarms', status: 'yellow', comparison: 'above',
    context: 'FDR-T1-MV03 trip + TR-T2-01 temperature alarm unacked', sparkline: [0, 0, 0, 1, 1, 2, 2],
    sla: '0 alarms', lastChecked: '09:55', yesterday: 0, weeklyAvg: 0.4, shifts: [0, 2, 0], incidents: 2, trend: -1.0 },
  { name: 'Alarm Frequency', current: 3.2, target: 5, unit: 'alarms/day', status: 'green', comparison: 'below',
    context: 'Rolling 7-day avg across all SCADA equipment', sparkline: [5.5, 5.0, 4.6, 4.2, 3.8, 3.5, 3.2],
    sla: '≤5/day', lastChecked: '09:55', yesterday: 3.5, weeklyAvg: 4.1, shifts: [1.5, 3.2, 2.8], incidents: 0, trend: +35.6 },
  { name: 'Comm Loss Duration', current: 8, target: 0, unit: 'minutes', status: 'yellow', comparison: 'above',
    context: 'OPC UA session loss 09:05 — recovered, 8 min total', sparkline: [0, 0, 0, 0, 5, 8, 8],
    sla: '0 min', lastChecked: '09:15', yesterday: 0, weeklyAvg: 1.1, shifts: [0, 8, 0], incidents: 1, trend: -1.0 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'MTTA', current: 4.1, target: 5, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to acknowledge SCADA electrical alarms', sparkline: [6.5, 6.0, 5.5, 5.2, 4.8, 4.5, 4.1],
    sla: '≤5 min', lastChecked: '09:55', yesterday: 4.5, weeklyAvg: 5.1, shifts: [3.8, 4.1, 4.5], incidents: 0, trend: +18.0 },
  { name: 'MTTR', current: 45.0, target: 60, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to restore from alarm to clearance', sparkline: [68.0, 64.0, 58.0, 54.0, 50.0, 47.0, 45.0],
    sla: '≤60 min', lastChecked: '09:55', yesterday: 50.0, weeklyAvg: 55.0, shifts: [42.0, 45.0, 48.0], incidents: 0, trend: +25.0 },
  { name: 'OPC UA Session Health', current: 99.5, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'HBMS↔SCADA OPC UA session uptime this week', sparkline: [99.8, 99.8, 99.7, 99.6, 99.5, 99.5, 99.5],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.6, weeklyAvg: 99.6, shifts: [99.5, 99.5, 99.6], incidents: 0, trend: -0.1 },
  { name: 'OPC UA Nodes Active', current: 98.2, target: 95, unit: '%', status: 'green', comparison: 'above',
    context: '541 of 551 equipment nodes publishing status', sparkline: [97.5, 97.7, 97.8, 98.0, 98.1, 98.2, 98.2],
    sla: '≥95%', lastChecked: 'Live', yesterday: 98.0, weeklyAvg: 97.8, shifts: [98.3, 98.2, 98.0], incidents: 0, trend: +0.4 },
  { name: 'Downtime Duration', current: 0.4, target: 1, unit: 'hours', status: 'green', comparison: 'below',
    context: 'Cumulative equipment downtime this shift', sparkline: [0.8, 0.7, 0.6, 0.5, 0.5, 0.4, 0.4],
    sla: '≤1 hr', lastChecked: '09:55', yesterday: 0.6, weeklyAvg: 0.5, shifts: [0.2, 0.4, 0.5], incidents: 0, trend: +20.0 },
];

// ── FRS Use-Cases: UC-SCADA-03/04/05/07 are primary notification triggers ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'SCADA-001', severity: 'critical', zone: 'Terminal 1 — MV Feeder FDR-T1-MV03',
    message: '[UC-SCADA-07] Feeder FDR-T1-MV03 trip — critical alarm raised, SOP workflow initiated, team notified', ts: '09:44', ack: false },
  { id: 'SCADA-002', severity: 'high',     zone: 'Terminal 2 — Transformer TR-T2-01',
    message: '[UC-SCADA-04] TR-T2-01 temperature alarm — OPC UA alarm ingested, severity: High, operator action required', ts: '09:38', ack: false },
  { id: 'SCADA-003', severity: 'high',     zone: 'HBMS ↔ SCADA OPC UA Link',
    message: '[UC-SCADA-05] OPC UA session loss 8 min — affected equipment marked Unknown/Unreliable, recovered 09:15', ts: '09:05', ack: true },
  { id: 'SCADA-004', severity: 'medium',   zone: 'Pier B — LV Panel LVP-P-B07',
    message: '[UC-SCADA-03] Equipment status update — LVP-P-B07 breaker B07-F3 state: Normal → Faulted', ts: '08:52', ack: true },
  { id: 'SCADA-005', severity: 'low',      zone: 'Terminal 3 — Substation SS-T3',
    message: '[UC-SCADA-03] SS-T3 ATS source change detected — mains to generator, status update published', ts: '08:20', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'OPC UA session active — 551 nodes, 541 publishing',       ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'Feeder FDR-T1-MV03 trip alarm — critical, SOP launched', ts: '09:44', level: 'err'  },
  { id: 'sl-3', msg: 'TR-T2-01 temperature alarm — High severity received',     ts: '09:38', level: 'err'  },
  { id: 'sl-4', msg: 'OPC UA session recovered — nodes refreshed after 8 min', ts: '09:15', level: 'warn' },
  { id: 'sl-5', msg: 'LVP-P-B07 breaker fault — status update ingested',        ts: '08:52', level: 'warn' },
  { id: 'sl-6', msg: 'Daily KPI report — 96.8% availability, 3.2 alarms/day',  ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-SCADA-07: FDR-T1-MV03 trip — SOP initiated',          type: 'alert',         severity: 'warn', timestamp: '09:44' },
  { id: 'e-2', title: 'UC-SCADA-04: TR-T2-01 temperature alarm ingested',        type: 'alert',         severity: 'warn', timestamp: '09:38' },
  { id: 'e-3', title: 'UC-SCADA-05: OPC UA session loss 8 min — recovered',      type: 'alert',         severity: 'warn', timestamp: '09:05' },
  { id: 'e-4', title: 'UC-SCADA-03: LVP-P-B07 breaker status: Normal → Faulted',type: 'status_change', severity: 'warn', timestamp: '08:52' },
  { id: 'e-5', title: 'UC-SCADA-03: SS-T3 ATS source change — mains to gen',    type: 'status_change', severity: 'ok',   timestamp: '08:20' },
  { id: 'e-6', title: 'UC-SCADA-06: Daily KPI report — 96.8% availability',      type: 'system',        severity: 'ok',   timestamp: '00:00' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-SCADA-041', title: 'FDR-T1-MV03 feeder trip root cause analysis', status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-SCADA-042', title: 'TR-T2-01 transformer cooling system inspection',status: 'Open',       priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-SCADA-040', title: 'OPC UA session stability — certificate review', status: 'Open',       priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-SCADA-038', title: 'Annual MV switchgear inspection — Terminal 1',  status: 'Completed',  priority: 'Low',    assignee: 'Nam Pham',    date: '4 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'MV Feeders — Terminal 1 (FDR-T1-MV01–05)', status: 'Critical',    details: 'MV03 trip active' },
  { name: 'MV Feeders — Terminal 2 (FDR-T2-MV01–04)', status: 'Operational', details: '4/4 feeders healthy' },
  { name: 'Transformers — Terminal 1 (TR-T1-01–04)',   status: 'Operational', details: '4/4 transformers normal' },
  { name: 'Transformers — Terminal 2 (TR-T2-01–04)',   status: 'Warning',     details: 'TR-T2-01 temperature alarm' },
  { name: 'LV Distribution Panels',                   status: 'Warning',     details: 'LVP-P-B07 breaker faulted' },
  { name: 'ATS / Generator Systems',                  status: 'Operational', details: 'SS-T3 ATS transfer logged' },
  { name: 'OPC UA Session (HBMS Client)',             status: 'Operational', details: 'Session active — recovered' },
  { name: 'SCADA OPC UA Server',                      status: 'Operational', details: '541/551 nodes publishing' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'OPC UA',      msg: 'Node scan — 551 points, 541 publishing',              ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'FDR-T1-MV03', msg: 'Trip alarm received — critical SOP launched',         ts: '09:44', status: 'updated' },
  { id: 'il-3', ref: 'TR-T2-01',    msg: 'Temperature alarm ingested — High severity set',      ts: '09:38', status: 'updated' },
  { id: 'il-4', ref: 'OPC UA',      msg: 'Session recovery — nodes refreshed after 8 min loss', ts: '09:15', status: 'ok'      },
  { id: 'il-5', ref: 'LVP-P-B07',  msg: 'Breaker fault status update published',               ts: '08:52', status: 'updated' },
  { id: 'il-6', ref: 'SCADA',      msg: 'Nightly KPI aggregation complete',                     ts: '00:00', status: 'synced'  },
];

const VIEW_TABS = [
  { key: 'supervisor', label: 'Operator',   icon: LayoutGrid },
  { key: 'operator',   label: 'Supervisor', icon: User },
] as const;

const SCADADetails: React.FC = () => {
  const [view, setView] = useState<'supervisor' | 'operator'>('supervisor');

  const topTabs = (
    <div className="flex items-center gap-1 mb-2 flex-shrink-0">
      {VIEW_TABS.map(tab => {
        const Icon = tab.icon;
        const active = view === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex items-center gap-2 px-4 py-1 rounded-lg text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider transition-all duration-150"
            style={{
              background: active ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
              color: active ? '#34d399' : '#7C8FA0',
              border: `1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <Icon className="w-3 h-3" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <SubsystemPage
      subsystemName="SCADA – Electrical Supervisory Control"
      subsystemCode="scada"
      operationalKPIs={OPERATIONAL_KPIS}
      systemKPIs={SYSTEM_KPIS}
      liveAlerts={LIVE_ALERTS}
      systemLogs={SYSTEM_LOGS}
      recentEvents={RECENT_EVENTS}
      workOrders={WORK_ORDERS}
      componentStatuses={COMPONENT_STATUS}
      integrationLog={INTEGRATION_LOG}
      topTabs={topTabs}
      kpiAreaOverride={view === 'supervisor' ? <SCADAEquipmentOverview /> : undefined}
      layout={view === 'supervisor' ? 'supervisor' : 'default'}
    />
  );
};

export default SCADADetails;
