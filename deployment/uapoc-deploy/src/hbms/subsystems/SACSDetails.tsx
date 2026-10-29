import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Security Access Control System — via Information Broker / AMQP+REST) ──
// Operational: Unknown Card Rate, Void Card Rate, Expired Card Rate, Door Forced Freq, Door Held Freq
// System: SignalR Delivery, Alarm Detection Time, Controller Availability, Unauthorized Access, MTTA

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Unknown Card Attempt Rate', current: 0.8, target: 1, unit: '%', status: 'green', comparison: 'below',
    context: 'Cards not found in SACS database this shift', sparkline: [1.4, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8],
    sla: '≤1%', lastChecked: 'Live', yesterday: 0.9, weeklyAvg: 1.0, shifts: [0.7, 0.8, 0.9], incidents: 0, trend: +11.1 },
  { name: 'Void Card Attempt Rate', current: 0.3, target: 0.5, unit: '%', status: 'green', comparison: 'below',
    context: 'Permanently disabled cards attempted entry', sparkline: [0.6, 0.5, 0.5, 0.4, 0.4, 0.3, 0.3],
    sla: '≤0.5%', lastChecked: 'Live', yesterday: 0.4, weeklyAvg: 0.4, shifts: [0.2, 0.3, 0.4], incidents: 0, trend: +25.0 },
  { name: 'Expired Card Attempt Rate', current: 1.4, target: 1, unit: '%', status: 'yellow', comparison: 'below',
    context: '3 expired card attempts this shift — staff notification pending', sparkline: [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4],
    sla: '≤1%', lastChecked: '09:55', yesterday: 1.1, weeklyAvg: 1.0, shifts: [1.2, 1.4, 1.1], incidents: 3, trend: -0.8 },
  { name: 'Door Forced Event Frequency', current: 1, target: 0, unit: 'events', status: 'yellow', comparison: 'above',
    context: 'Door FD-T1-C03 forced open — SOP initiated', sparkline: [0, 0, 0, 0, 1, 1, 1],
    sla: '0 events', lastChecked: '09:33', yesterday: 0, weeklyAvg: 0.2, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
  { name: 'Door Held Open Frequency', current: 3, target: 5, unit: 'events/day', status: 'green', comparison: 'below',
    context: 'Doors held open beyond configured threshold', sparkline: [5, 5, 4, 4, 3, 3, 3],
    sla: '≤5/day', lastChecked: '09:55', yesterday: 4, weeklyAvg: 4.2, shifts: [1, 3, 2], incidents: 0, trend: +25.0 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'SignalR Event Delivery', current: 99.6, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'Real-time SACS→HBMS event stream success rate', sparkline: [98.8, 99.0, 99.1, 99.3, 99.4, 99.5, 99.6],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.4, weeklyAvg: 99.2, shifts: [99.7, 99.6, 99.5], incidents: 0, trend: +0.5 },
  { name: 'Alarm Detection Time', current: 2.8, target: 5, unit: 'seconds', status: 'green', comparison: 'below',
    context: 'Avg time from event to HBMS alarm display', sparkline: [4.5, 4.0, 3.8, 3.5, 3.2, 3.0, 2.8],
    sla: '≤5s', lastChecked: '09:55', yesterday: 3.2, weeklyAvg: 3.5, shifts: [2.6, 2.8, 3.0], incidents: 0, trend: +12.5 },
  { name: 'Controller Availability', current: 97.8, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '1 door controller offline — maintenance scheduled', sparkline: [98.5, 98.4, 98.2, 98.0, 97.9, 97.8, 97.8],
    sla: '≥98%', lastChecked: 'Live', yesterday: 98.2, weeklyAvg: 98.3, shifts: [98.1, 97.8, 97.6], incidents: 1, trend: -0.4 },
  { name: 'Unauthorized Reader Attempts', current: 0.2, target: 0.5, unit: '%', status: 'green', comparison: 'below',
    context: 'Valid card used at unauthorized door/reader', sparkline: [0.5, 0.4, 0.4, 0.3, 0.3, 0.2, 0.2],
    sla: '≤0.5%', lastChecked: '09:45', yesterday: 0.3, weeklyAvg: 0.3, shifts: [0.1, 0.2, 0.3], incidents: 0, trend: +33.3 },
  { name: 'MTTA', current: 2.1, target: 5, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to acknowledge SACS security alarms', sparkline: [4.2, 3.8, 3.4, 3.0, 2.6, 2.3, 2.1],
    sla: '≤5 min', lastChecked: '09:55', yesterday: 2.5, weeklyAvg: 3.1, shifts: [1.9, 2.1, 2.4], incidents: 0, trend: +16.0 },
];

// ── FRS Use-Cases: UC-SACS-04/05/06 are primary notification triggers; UC-SACS-07 for KPI ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'SACS-001', severity: 'critical', zone: 'Terminal 1 — Door FD-T1-C03',
    message: '[UC-SACS-06] Forced door alarm — Door FD-T1-C03 forced open, critical alarm raised, SOP initiated', ts: '09:33', ack: false },
  { id: 'SACS-002', severity: 'high',     zone: 'Pier B — Card Reader RD-P-B12',
    message: '[UC-SACS-05] Access denied threshold exceeded — RD-P-B12: 5 denied attempts in 10 min, escalation triggered', ts: '09:47', ack: false },
  { id: 'SACS-003', severity: 'high',     zone: 'Gate B4 — Airside Entry',
    message: '[UC-SACS-05] Lost/stolen card CRD-5821 attempted entry at Gate B4 — security alert raised', ts: '09:18', ack: false },
  { id: 'SACS-004', severity: 'medium',   zone: 'IB → HBMS SignalR Link',
    message: '[UC-SACS-04] SignalR delivery lag detected — access event stream delayed >3s, real-time gap flagged', ts: '08:55', ack: true },
  { id: 'SACS-005', severity: 'medium',   zone: 'Terminal 2 — Controller DC-T2-08',
    message: '[UC-SACS-01] Controller DC-T2-08 offline — device decommission flag received from IB', ts: '08:22', ack: true },
  { id: 'SACS-006', severity: 'low',      zone: 'Cargo Terminal — Door DH-C-F01',
    message: '[UC-SACS-06] Door DH-C-F01 held open 95s (threshold 60s) — held-door alarm generated', ts: '07:48', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'IB/AMQP event stream OK — 52 controllers active',       ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'Forced door FD-T1-C03 — critical alarm, SOP launched',  ts: '09:33', level: 'err'  },
  { id: 'sl-3', msg: 'Access denied escalation RD-P-B12 — 5 attempts',        ts: '09:47', level: 'err'  },
  { id: 'sl-4', msg: 'Lost card CRD-5821 detected at Gate B4 — alert raised', ts: '09:18', level: 'warn' },
  { id: 'sl-5', msg: 'SignalR lag 3.4s — event buffer flushed, resolved',     ts: '08:55', level: 'warn' },
  { id: 'sl-6', msg: 'Daily KPI aggregation — 99.6% delivery, 0.8% unknown',  ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-SACS-06: Forced door FD-T1-C03 — SOP initiated',      type: 'alert',         severity: 'warn', timestamp: '09:33' },
  { id: 'e-2', title: 'UC-SACS-05: RD-P-B12 access denied threshold exceeded',  type: 'alert',         severity: 'warn', timestamp: '09:47' },
  { id: 'e-3', title: 'UC-SACS-05: Lost card CRD-5821 entry attempt at B4',     type: 'alert',         severity: 'warn', timestamp: '09:18' },
  { id: 'e-4', title: 'UC-SACS-04: SignalR delivery lag — event gap detected',  type: 'alert',         severity: 'warn', timestamp: '08:55' },
  { id: 'e-5', title: 'UC-SACS-03: DC-T2-08 decommissioned — removed from ops', type: 'system',        severity: 'ok',   timestamp: '08:22' },
  { id: 'e-6', title: 'UC-SACS-07: KPI report — 99.6% delivery, 2.1 min MTTA', type: 'system',        severity: 'ok',   timestamp: '00:00' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-SACS-031', title: 'Door FD-T1-C03 forced entry investigation',   status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-SACS-032', title: 'Card CRD-5821 lost/stolen incident review',   status: 'Open',        priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-SACS-030', title: 'DC-T2-08 controller replacement commissioning',status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-SACS-028', title: 'Expired card bulk notification — staff update', status: 'Completed',  priority: 'Low',    assignee: 'Nam Pham',    date: '3 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'Door Controllers — Terminal 1 (DC-T1-01–18)', status: 'Critical',    details: 'FD-T1-C03 forced alarm active' },
  { name: 'Door Controllers — Terminal 2 (DC-T2-01–16)', status: 'Warning',     details: 'DC-T2-08 offline' },
  { name: 'Card Readers — Pier A/B/C (RD-PA/B/C)',       status: 'Warning',     details: 'RD-P-B12 escalation active' },
  { name: 'Card Readers — Cargo/Apron',                  status: 'Operational', details: 'All readers online' },
  { name: 'Biometric Readers',                          status: 'Operational', details: '12/12 units functional' },
  { name: 'Turnstiles / Speed Gates',                   status: 'Operational', details: 'All 8 gates operational' },
  { name: 'IB / AMQP Event Stream',                    status: 'Operational', details: '99.6% delivery rate' },
  { name: 'SignalR Real-Time Link',                     status: 'Operational', details: 'Stream restored — monitoring' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'IB/AMQP',  msg: 'Event stream OK — 52 controllers, 412 events',     ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'FD-T1-C03',msg: 'Forced door alarm forwarded — SOP launched',        ts: '09:33', status: 'updated' },
  { id: 'il-3', ref: 'RD-P-B12', msg: 'Access denied escalation — 5 attempts flagged',     ts: '09:47', status: 'updated' },
  { id: 'il-4', ref: 'CRD-5821', msg: 'Lost card alert — security event raised',           ts: '09:18', status: 'updated' },
  { id: 'il-5', ref: 'SignalR',  msg: 'Delivery lag resolved — stream buffer flushed',     ts: '08:55', status: 'ok'      },
  { id: 'il-6', ref: 'IB/SACS',  msg: 'Nightly KPI aggregation complete',                 ts: '00:00', status: 'synced'  },
];

const SACSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Security Access Control System"
    subsystemCode="sacs"
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

export default SACSDetails;
