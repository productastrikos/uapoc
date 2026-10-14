import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Section 4: VDGS Availability, Fault Frequency, MTTA, MTTR, Stand Readiness) ──

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'VDGS Availability', current: 97.2, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '2 stands in scheduled maintenance', sparkline: [98.1, 97.9, 97.7, 97.5, 97.3, 97.2, 97.2],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.6, weeklyAvg: 97.8, shifts: [97.5, 97.2, 97.0], incidents: 2, trend: -0.6 },
  { name: 'Stand Readiness Rate', current: 94.3, target: 95, unit: '%', status: 'yellow', comparison: 'above',
    context: '33 of 35 stands VDGS-ready for docking', sparkline: [96.0, 95.5, 95.1, 94.8, 94.5, 94.3, 94.3],
    sla: '≥95%', lastChecked: 'Live', yesterday: 94.8, weeklyAvg: 95.1, shifts: [95.0, 94.3, 94.0], incidents: 2, trend: -0.8 },
  { name: 'Docking Accuracy', current: 99.8, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'All active stands within ±5cm tolerance', sparkline: [99.2, 99.4, 99.5, 99.6, 99.7, 99.8, 99.8],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.7, weeklyAvg: 99.5, shifts: [99.8, 99.9, 99.7], incidents: 0, trend: +0.3 },
  { name: 'Guidance Activation Time', current: 2.1, target: 3, unit: 'seconds', status: 'green', comparison: 'below',
    context: 'Display activates on gate assignment from AODB', sparkline: [2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1],
    sla: '≤3s', lastChecked: '10:01', yesterday: 2.3, weeklyAvg: 2.5, shifts: [2.1, 2.0, 2.2], incidents: 0, trend: +8.0 },
  { name: 'Fault Frequency', current: 0.8, target: 1, unit: 'faults/stand', status: 'green', comparison: 'below',
    context: '2 open faults across 35 stands this week', sparkline: [1.4, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8],
    sla: '≤1/stand', lastChecked: '09:55', yesterday: 0.9, weeklyAvg: 1.0, shifts: [0.8, 0.8, 0.9], incidents: 2, trend: +11.1 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'MTTA', current: 4.2, target: 5, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to acknowledge VDGS alarms', sparkline: [6.0, 5.5, 5.2, 4.8, 4.5, 4.3, 4.2],
    sla: '≤5 min', lastChecked: '09:55', yesterday: 4.5, weeklyAvg: 5.0, shifts: [4.0, 4.2, 4.5], incidents: 0, trend: +16.0 },
  { name: 'MTTR', current: 38.5, target: 60, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to resolve VDGS faults', sparkline: [55.0, 50.0, 46.0, 42.0, 40.0, 39.0, 38.5],
    sla: '≤60 min', lastChecked: '09:55', yesterday: 42.0, weeklyAvg: 46.0, shifts: [35.0, 38.5, 42.0], incidents: 0, trend: +35.8 },
  { name: 'Display Faults', current: 1, target: 0, unit: 'units', status: 'yellow', comparison: 'above',
    context: 'Stand G12 display brightness fault open', sparkline: [0, 0, 0, 1, 1, 1, 1],
    sla: '0 units', lastChecked: '09:15', yesterday: 0, weeklyAvg: 0.3, shifts: [0, 1, 1], incidents: 1, trend: -1.0 },
  { name: 'Network Latency', current: 12, target: 20, unit: 'ms', status: 'green', comparison: 'below',
    context: 'All VDGS nodes on dedicated VLAN', sparkline: [18, 16, 15, 14, 13, 12, 12],
    sla: '≤20ms', lastChecked: 'Live', yesterday: 13, weeklyAvg: 15, shifts: [12, 11, 13], incidents: 0, trend: +7.7 },
  { name: 'IB Communication Uptime', current: 99.7, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'IB ↔ HBMS REST API — all VDGS events received', sparkline: [99.1, 99.3, 99.5, 99.6, 99.7, 99.7, 99.7],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.6, weeklyAvg: 99.4, shifts: [99.7, 99.7, 99.6], incidents: 0, trend: +0.3 },
];

// ── FRS Use-Case alerts (UC-VDGS-04/05/06 are primary notification triggers) ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'VDGS-001', severity: 'high',   zone: 'Stand G12 — Apron West',
    message: '[UC-VDGS-05] Display brightness fault — docking guidance degraded on Stand G12', ts: '09:15', ack: false },
  { id: 'VDGS-002', severity: 'high',   zone: 'Stand B08 — Pier B',
    message: '[UC-VDGS-06] VDGS communication loss — heartbeat timeout on Stand B08 controller', ts: '09:42', ack: false },
  { id: 'VDGS-003', severity: 'medium', zone: 'Stand A03 — Terminal 1',
    message: '[UC-VDGS-04] Docking status anomaly — guidance active but no aircraft detected', ts: '08:55', ack: true },
  { id: 'VDGS-004', severity: 'low',    zone: 'Stand C11 — Pier C',
    message: '[UC-VDGS-05] Laser sensor calibration drift (+3mm) — within tolerance, WO raised', ts: 'Yesterday', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'IB poll OK — 35/35 VDGS stand states refreshed',         ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'Stand G12 brightness fault detected — alarm raised',      ts: '09:15', level: 'warn' },
  { id: 'sl-3', msg: 'Stand B08 heartbeat timeout — comms alarm raised',        ts: '09:42', level: 'err'  },
  { id: 'sl-4', msg: 'Stand A03 guidance anomaly logged — operator notified',   ts: '08:55', level: 'warn' },
  { id: 'sl-5', msg: 'AODB sync OK — gate assignment data refreshed',           ts: '08:00', level: 'info' },
  { id: 'sl-6', msg: 'Nightly stand readiness check — 33/35 OK',               ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-VDGS-05: Stand G12 display fault — WO raised',           type: 'alert',         severity: 'warn', timestamp: '09:15' },
  { id: 'e-2', title: 'UC-VDGS-06: Stand B08 communication loss — alarm active',   type: 'alert',         severity: 'warn', timestamp: '09:42' },
  { id: 'e-3', title: 'UC-VDGS-04: Stand A03 docking anomaly logged',              type: 'status_change', severity: 'warn', timestamp: '08:55' },
  { id: 'e-4', title: 'UC-VDGS-07: Stand B05 returned to service after repair',    type: 'status_change', severity: 'ok',   timestamp: '08:10' },
  { id: 'e-5', title: 'UC-VDGS-01: Stand T04 VDGS unit onboarded',                type: 'system',        severity: 'ok',   timestamp: 'Yesterday' },
  { id: 'e-6', title: 'UC-VDGS-07: Morning KPI report — 97.2% availability',      type: 'system',        severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-VDGS-012', title: 'Stand G12 display unit replacement',              status: 'In Progress', priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-VDGS-013', title: 'Stand B08 controller comms investigation',        status: 'Open',        priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-VDGS-011', title: 'Stand C11 laser sensor recalibration',            status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-VDGS-009', title: 'Quarterly VDGS firmware update — Pier A stands',  status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '5 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'VDGS Units — Terminal 1 (T01–T10)',  status: 'Operational', details: '10/10 stands active' },
  { name: 'VDGS Units — Pier A (A01–A08)',      status: 'Operational', details: '8/8 stands active' },
  { name: 'VDGS Units — Pier B (B01–B09)',      status: 'Critical',    details: 'B08 comms loss' },
  { name: 'VDGS Units — Pier C (C01–C08)',      status: 'Warning',     details: 'C11 calibration drift' },
  { name: 'Display Controllers',               status: 'Warning',     details: 'G12 display fault' },
  { name: 'Laser Sensor Array',               status: 'Operational', details: 'All sensors within tolerance' },
  { name: 'AODB Integration',                 status: 'Operational', details: 'Gate assignments synced' },
  { name: 'IB Communication Link',            status: 'Operational', details: 'REST API — 12ms latency' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'IB/VDGS', msg: 'Stand state poll — 35 records updated',            ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'B08',     msg: 'Heartbeat timeout — comms alarm generated',        ts: '09:42', status: 'updated' },
  { id: 'il-3', ref: 'G12',     msg: 'Fault event received — display alarm raised',      ts: '09:15', status: 'updated' },
  { id: 'il-4', ref: 'AODB',    msg: 'Gate assignment push — 12 stands updated',         ts: '09:00', status: 'synced'  },
  { id: 'il-5', ref: 'B05',     msg: 'Return-to-service confirmed — alarm cleared',      ts: '08:10', status: 'ok'      },
  { id: 'il-6', ref: 'IB/VDGS', msg: 'Nightly availability report generated',            ts: '00:00', status: 'synced'  },
];

const VDGSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Visual Docking Guidance System"
    subsystemCode="vdgs"
    operationalKPIs={OPERATIONAL_KPIS}
    systemKPIs={SYSTEM_KPIS}
    liveAlerts={LIVE_ALERTS}
    systemLogs={SYSTEM_LOGS}
    recentEvents={RECENT_EVENTS}
    workOrders={WORK_ORDERS}
    componentStatuses={COMPONENT_STATUS}
    integrationLog={INTEGRATION_LOG}
  />
);

export default VDGSDetails;
