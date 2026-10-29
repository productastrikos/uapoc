import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Section 4: Availability, Downtime, Utilization, Fault Count, Line Readiness) ──

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Machine Availability', current: 94.8, target: 95, unit: '%', status: 'yellow', comparison: 'above',
    context: '2 of 18 machines in fault/maintenance', sparkline: [96.2, 95.8, 95.1, 94.9, 94.7, 94.8, 94.8],
    sla: '≥95%', lastChecked: 'Live', yesterday: 95.1, weeklyAvg: 95.3, shifts: [95.2, 94.8, 94.3], incidents: 3, trend: -0.5 },
  { name: 'Line Readiness', current: 88.9, target: 90, unit: '%', status: 'yellow', comparison: 'above',
    context: '8 of 9 screening lines operational', sparkline: [91.2, 90.5, 90.0, 89.5, 89.0, 88.9, 88.9],
    sla: '≥90%', lastChecked: 'Live', yesterday: 89.5, weeklyAvg: 90.1, shifts: [90.0, 88.9, 88.5], incidents: 2, trend: -1.3 },
  { name: 'Utilization Rate', current: 72.4, target: 70, unit: '%', status: 'green', comparison: 'above',
    context: 'Running vs idle across all screening lines', sparkline: [68.1, 69.5, 70.2, 71.0, 71.8, 72.1, 72.4],
    sla: '≥70%', lastChecked: '10:05', yesterday: 71.8, weeklyAvg: 70.9, shifts: [74.2, 72.4, 70.8], incidents: 0, trend: +2.2 },
  { name: 'Active Fault Count', current: 2, target: 0, unit: 'faults', status: 'yellow', comparison: 'above',
    context: 'SSE-04 & SSE-11 in fault state', sparkline: [0, 1, 1, 2, 2, 2, 2],
    sla: '0 faults', lastChecked: '09:55', yesterday: 1, weeklyAvg: 1.1, shifts: [1, 2, 2], incidents: 2, trend: -1.0 },
  { name: 'Downtime Duration', current: 18.5, target: 10, unit: 'minutes', status: 'yellow', comparison: 'below',
    context: 'Cumulative downtime this shift', sparkline: [5.0, 8.0, 10.5, 14.0, 16.0, 17.5, 18.5],
    sla: '≤10 min', lastChecked: '10:05', yesterday: 12.0, weeklyAvg: 11.3, shifts: [6.0, 18.5, 9.0], incidents: 2, trend: -4.1 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'Machine Health (Normal)', current: 88.9, target: 95, unit: '%', status: 'yellow', comparison: 'above',
    context: '16 of 18 machines in Normal health state', sparkline: [94.4, 92.2, 90.5, 89.6, 89.0, 88.9, 88.9],
    sla: '≥95%', lastChecked: 'Live', yesterday: 90.2, weeklyAvg: 91.3, shifts: [90.2, 89.1, 88.9], incidents: 2, trend: -1.5 },
  { name: 'Communication Uptime', current: 99.2, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'IB ↔ HBMS REST API link stable', sparkline: [98.8, 99.0, 99.1, 99.2, 99.2, 99.2, 99.2],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.1, weeklyAvg: 99.0, shifts: [99.3, 99.2, 99.1], incidents: 0, trend: +0.2 },
  { name: 'Safety Events (E-Stop)', current: 1, target: 0, unit: 'events', status: 'yellow', comparison: 'above',
    context: 'SSE-04 emergency stop active on Line 3', sparkline: [0, 0, 0, 0, 1, 1, 1],
    sla: '0 events', lastChecked: '09:31', yesterday: 0, weeklyAvg: 0.2, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
  { name: 'Screening Capacity', current: 88.9, target: 90, unit: '%', status: 'yellow', comparison: 'above',
    context: '8/9 lines operational — Line 3 blocked', sparkline: [100, 100, 100, 88.9, 88.9, 88.9, 88.9],
    sla: '≥90%', lastChecked: 'Live', yesterday: 100, weeklyAvg: 97.8, shifts: [100, 88.9, 88.9], incidents: 1, trend: -11.1 },
  { name: 'MTTR', current: 24.5, target: 30, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to restore faulted machine', sparkline: [32.0, 30.5, 28.0, 26.5, 25.0, 24.5, 24.5],
    sla: '≤30 min', lastChecked: '09:55', yesterday: 26.0, weeklyAvg: 28.1, shifts: [22.0, 24.5, 27.0], incidents: 0, trend: +5.8 },
];

// ── FRS Use-Case alerts (UC-SSE-02/03/04 are primary operational notification triggers) ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'SSE-001', severity: 'critical', zone: 'Line 3 — Screening Zone B',
    message: '[UC-SSE-04] Emergency stop activated on SSE-04 — conveyor blocked, safety alarm raised', ts: '09:31', ack: false },
  { id: 'SSE-002', severity: 'high',     zone: 'Terminal 1 — Gate A Checkpoint',
    message: '[UC-SSE-02] SSE-11 health state changed: Normal → Fault; machine offline', ts: '09:48', ack: false },
  { id: 'SSE-003', severity: 'high',     zone: 'Line 3 — Screening Zone B',
    message: '[UC-SSE-03] SSE-04 operational state: Running → Blocked — conveyor jam detected', ts: '09:31', ack: false },
  { id: 'SSE-004', severity: 'medium',   zone: 'IB ↔ HBMS Link',
    message: '[UC-SSE-04] Communication latency spike — REST API response 4.8s (SLA ≤5s)', ts: '08:52', ack: true },
  { id: 'SSE-005', severity: 'low',      zone: 'Line 6 — Outbound T2',
    message: '[UC-SSE-03] SSE-17 operational state: Running → Maintenance window started', ts: '08:15', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'IB heartbeat OK — 18/18 SSE machines reporting',            ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'SSE-04 e-stop signal received — critical alarm raised',     ts: '09:31', level: 'err'  },
  { id: 'sl-3', msg: 'SSE-11 health transition: Normal → Fault — WO raised',      ts: '09:48', level: 'warn' },
  { id: 'sl-4', msg: 'Line 3 capacity reduced — screening capacity recalculated', ts: '09:32', level: 'warn' },
  { id: 'sl-5', msg: 'SSE-17 entering scheduled maintenance window',              ts: '08:15', level: 'info' },
  { id: 'sl-6', msg: 'REST API poll success — all machine states refreshed',      ts: '07:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-SSE-04: Emergency stop on SSE-04 — Line 3 halted',      type: 'alert',         severity: 'warn', timestamp: '09:31' },
  { id: 'e-2', title: 'UC-SSE-02: SSE-11 machine health changed to Fault',        type: 'status_change', severity: 'warn', timestamp: '09:48' },
  { id: 'e-3', title: 'UC-SSE-03: Line 3 blocked — capacity recalculated',        type: 'status_change', severity: 'warn', timestamp: '09:32' },
  { id: 'e-4', title: 'UC-SSE-05: Operator acknowledged SSE-17 maintenance',      type: 'maintenance',   severity: 'ok',   timestamp: '08:20' },
  { id: 'e-5', title: 'UC-SSE-06: Morning KPI report generated',                  type: 'system',        severity: 'ok',   timestamp: '07:00' },
  { id: 'e-6', title: 'UC-SSE-01: SSE-18 onboarded — new machine commissioned',  type: 'system',        severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-SSE-014', title: 'SSE-04 e-stop investigation & conveyor clearance',   status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-SSE-015', title: 'SSE-11 fault diagnosis — sensor module replacement', status: 'Open',        priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-SSE-013', title: 'Line 3 conveyor belt alignment check',               status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-SSE-011', title: 'Quarterly calibration — Lines 1, 2, 4',             status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '3 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'SSE Machines — Line 1 (1–4)',   status: 'Operational', details: '4/4 units running' },
  { name: 'SSE Machines — Line 2 (5–8)',   status: 'Operational', details: '4/4 units running' },
  { name: 'SSE Machines — Line 3 (9–12)',  status: 'Critical',    details: 'SSE-04 e-stop active' },
  { name: 'SSE Machines — Line 4 (13–15)', status: 'Operational', details: '3/3 units running' },
  { name: 'SSE Machines — Line 5 (16–18)', status: 'Warning',     details: 'SSE-11 faulted, SSE-17 maintenance' },
  { name: 'Conveyor Network',              status: 'Warning',     details: 'Line 3 blocked' },
  { name: 'Integration Broker Link',       status: 'Operational', details: 'REST API active, 120ms latency' },
  { name: 'Alarm & SOP Subsystem',         status: 'Operational', details: 'All SOP workflows ready' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'IB/SSE', msg: 'Machine state poll — 18 records updated',           ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'SSE-04', msg: 'Safety event: E_STOP — critical alarm forwarded',   ts: '09:31', status: 'updated' },
  { id: 'il-3', ref: 'SSE-11', msg: 'Health state change: Fault — alarm created',        ts: '09:48', status: 'updated' },
  { id: 'il-4', ref: 'IB/SSE', msg: 'Line readiness recalculated — 8/9 lines OK',        ts: '09:32', status: 'updated' },
  { id: 'il-5', ref: 'SSE-17', msg: 'Maintenance window flag received — state updated',  ts: '08:15', status: 'ok'      },
  { id: 'il-6', ref: 'IB/SSE', msg: 'Nightly KPI aggregation complete',                  ts: '00:00', status: 'synced'  },
];

const SSEDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Security Screening Equipment"
    subsystemCode="sse"
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

export default SSEDetails;
