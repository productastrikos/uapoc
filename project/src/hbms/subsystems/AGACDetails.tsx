import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Section: Gate Availability, Faulted Gates, Alarm Freq, Comm Status) ──

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Gate Availability', current: 96.1, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '2 of 52 gates in fault/maintenance', sparkline: [97.8, 97.5, 97.1, 96.8, 96.4, 96.1, 96.1],
    sla: '≥98%', lastChecked: 'Live', yesterday: 96.8, weeklyAvg: 97.2, shifts: [96.8, 96.1, 95.8], incidents: 3, trend: -0.9 },
  { name: 'Gates Operational', current: 50, target: 52, unit: 'gates', status: 'yellow', comparison: 'above',
    context: 'Gate B4 fault, Gate C7 maintenance', sparkline: [52, 52, 52, 51, 51, 50, 50],
    sla: '≥50 gates', lastChecked: 'Live', yesterday: 51, weeklyAvg: 51.5, shifts: [51, 50, 50], incidents: 2, trend: -2.0 },
  { name: 'Alarm Frequency', current: 3.2, target: 5, unit: 'alarms/hr', status: 'green', comparison: 'below',
    context: 'Average across all gate controllers', sparkline: [5.1, 4.8, 4.5, 4.0, 3.6, 3.4, 3.2],
    sla: '≤5/hr', lastChecked: '10:00', yesterday: 3.6, weeklyAvg: 4.1, shifts: [3.0, 3.2, 3.5], incidents: 0, trend: +21.9 },
  { name: 'Communication Uptime', current: 98.7, target: 99, unit: '%', status: 'yellow', comparison: 'above',
    context: 'Gate controller heartbeat success rate', sparkline: [99.5, 99.3, 99.1, 98.9, 98.8, 98.7, 98.7],
    sla: '≥99%', lastChecked: 'Live', yesterday: 98.9, weeklyAvg: 99.0, shifts: [98.9, 98.7, 98.5], incidents: 1, trend: -0.3 },
  { name: 'Gate Fault Rate', current: 3.8, target: 2, unit: '%', status: 'yellow', comparison: 'below',
    context: '2 gates faulted of 52 total', sparkline: [1.9, 2.3, 2.8, 3.2, 3.5, 3.8, 3.8],
    sla: '≤2%', lastChecked: '09:55', yesterday: 2.8, weeklyAvg: 2.6, shifts: [2.8, 3.8, 3.2], incidents: 2, trend: -1.9 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'Controller Health', current: 96.2, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '2 controllers in warning state', sparkline: [98.0, 97.8, 97.5, 97.0, 96.5, 96.2, 96.2],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.0, weeklyAvg: 97.4, shifts: [97.0, 96.2, 96.0], incidents: 2, trend: -0.8 },
  { name: 'MTTA', current: 3.5, target: 5, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to acknowledge gate alarms', sparkline: [6.2, 5.8, 5.2, 4.6, 4.0, 3.7, 3.5],
    sla: '≤5 min', lastChecked: '09:55', yesterday: 4.0, weeklyAvg: 4.8, shifts: [3.2, 3.5, 3.8], incidents: 0, trend: +30.0 },
  { name: 'MTTR', current: 42.0, target: 60, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to restore faulted gates', sparkline: [58.0, 54.0, 50.0, 47.0, 44.0, 42.0, 42.0],
    sla: '≤60 min', lastChecked: '09:55', yesterday: 45.0, weeklyAvg: 50.0, shifts: [40.0, 42.0, 44.0], incidents: 0, trend: +30.0 },
  { name: 'False Alarm Rate', current: 0.4, target: 1, unit: '%', status: 'green', comparison: 'below',
    context: 'False triggers vs total gate alarms', sparkline: [1.2, 1.0, 0.8, 0.6, 0.5, 0.4, 0.4],
    sla: '≤1%', lastChecked: '09:45', yesterday: 0.5, weeklyAvg: 0.7, shifts: [0.3, 0.4, 0.5], incidents: 0, trend: +50.0 },
  { name: 'Access Events / Hour', current: 412, target: 600, unit: 'events', status: 'green', comparison: 'below',
    context: 'Normal throughput — peak 09:00-10:00', sparkline: [380, 390, 400, 405, 410, 412, 412],
    sla: '≤600/hr', lastChecked: 'Live', yesterday: 398, weeklyAvg: 405, shifts: [420, 412, 380], incidents: 0, trend: +3.5 },
];

// ── FRS Use-Case alerts (UC-AGAC-02/03/04 primary notification triggers) ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'AGAC-001', severity: 'high',   zone: 'Gate B4 — Pier B Departures',
    message: '[UC-AGAC-03] Gate B4 controller fault — access control offline, manual override required', ts: '09:47', ack: false },
  { id: 'AGAC-002', severity: 'high',   zone: 'Gate C7 — International Terminal',
    message: '[UC-AGAC-04] Gate C7 heartbeat timeout — controller communication lost', ts: '09:28', ack: false },
  { id: 'AGAC-003', severity: 'medium', zone: 'Gate A12 — Domestic Terminal',
    message: '[UC-AGAC-02] Gate A12 health state: Normal → Warning — intermittent reader errors', ts: '08:41', ack: true },
  { id: 'AGAC-004', severity: 'low',    zone: 'Gate D2 — Cargo Terminal',
    message: '[UC-AGAC-03] Gate D2 door held open >30s — alert generated per policy', ts: '08:05', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'IB heartbeat OK — 52 gate controllers reporting',        ts: '10:02', level: 'info' },
  { id: 'sl-2', msg: 'Gate B4 controller fault detected — alarm raised',       ts: '09:47', level: 'err'  },
  { id: 'sl-3', msg: 'Gate C7 heartbeat timeout — comms alarm raised',         ts: '09:28', level: 'err'  },
  { id: 'sl-4', msg: 'Gate A12 intermittent reader error — warning logged',    ts: '08:41', level: 'warn' },
  { id: 'sl-5', msg: 'Gate D2 door-held event — policy alert triggered',       ts: '08:05', level: 'warn' },
  { id: 'sl-6', msg: 'Nightly gate availability report — 96.1% OK',            ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-AGAC-03: Gate B4 fault — access offline',           type: 'alert',         severity: 'warn', timestamp: '09:47' },
  { id: 'e-2', title: 'UC-AGAC-04: Gate C7 communication loss',               type: 'alert',         severity: 'warn', timestamp: '09:28' },
  { id: 'e-3', title: 'UC-AGAC-02: Gate A12 health degraded to Warning',      type: 'status_change', severity: 'warn', timestamp: '08:41' },
  { id: 'e-4', title: 'UC-AGAC-03: Gate D2 door-held open event logged',      type: 'alert',         severity: 'warn', timestamp: '08:05' },
  { id: 'e-5', title: 'UC-AGAC-01: Gate E8 onboarded — new installation',     type: 'system',        severity: 'ok',   timestamp: 'Yesterday' },
  { id: 'e-6', title: 'UC-AGAC-05: Gate F3 decommissioned — removed from ops',type: 'system',        severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-AGAC-022', title: 'Gate B4 controller board replacement',          status: 'In Progress', priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-AGAC-023', title: 'Gate C7 comms cable investigation',             status: 'Open',        priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-AGAC-021', title: 'Gate A12 reader module inspection',             status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-AGAC-019', title: 'Annual gate controller firmware update batch 1',status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '4 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'Gate Controllers — Pier A (A01–A15)', status: 'Operational', details: '15/15 controllers online' },
  { name: 'Gate Controllers — Pier B (B01–B12)', status: 'Critical',    details: 'B4 controller fault' },
  { name: 'Gate Controllers — Pier C (C01–C12)', status: 'Critical',    details: 'C7 comms loss' },
  { name: 'Gate Controllers — Domestic (D01–D08)',status: 'Warning',    details: 'D2 door-held event' },
  { name: 'Gate Controllers — Cargo (E01–E05)',  status: 'Operational', details: '5/5 controllers online' },
  { name: 'Card Reader Network',                 status: 'Warning',     details: 'A12 intermittent errors' },
  { name: 'IB Communication Link',              status: 'Operational', details: 'REST API stable — 98.7% uptime' },
  { name: 'Alarm & SOP Engine',                 status: 'Operational', details: 'All workflows armed' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'IB/AGAC', msg: 'Gate status poll — 52 controllers updated',       ts: '10:02', status: 'ok'      },
  { id: 'il-2', ref: 'B4',      msg: 'Fault event — access offline alarm forwarded',    ts: '09:47', status: 'updated' },
  { id: 'il-3', ref: 'C7',      msg: 'Heartbeat timeout — comms alarm generated',       ts: '09:28', status: 'updated' },
  { id: 'il-4', ref: 'A12',     msg: 'Warning state change — health update pushed',     ts: '08:41', status: 'updated' },
  { id: 'il-5', ref: 'D2',      msg: 'Door-held event delivered — alert acknowledged',  ts: '08:05', status: 'ok'      },
  { id: 'il-6', ref: 'IB/AGAC', msg: 'Nightly availability report generated',           ts: '00:00', status: 'synced'  },
];

const AGACDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Automatic Gate Access Control"
    subsystemCode="agac"
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

export default AGACDetails;
