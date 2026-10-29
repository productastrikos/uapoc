import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Public Address System — REST API vol.1 + TCP/OIP vol.2 merged) ──
// Operational: Audible Coverage, Correct Delivery, Passenger Response, Emergency Broadcast, Zone Coverage
// System: System Uptime, Non-functional Speakers, Message Delay, TCP/REST Sync, Backup Activation

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Audible Announcement Coverage', current: 99.2, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'All 8 speaker zones confirmed audible', sparkline: [98.1, 98.5, 98.8, 99.0, 98.9, 99.1, 99.2],
    sla: '≥98%', lastChecked: 'Live',
    yesterday: 99.0, weeklyAvg: 98.9, shifts: [99.0, 99.3, 99.2], incidents: 0, trend: +0.3 },
  { name: 'Correct Delivery Rate', current: 99.5, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'FIDS integration verified, 0 mis-routes', sparkline: [97.9, 98.3, 98.7, 99.1, 99.3, 99.4, 99.5],
    sla: '≥98%', lastChecked: 'Live',
    yesterday: 99.3, weeklyAvg: 99.1, shifts: [99.4, 99.5, 99.6], incidents: 0, trend: +0.4 },
  { name: 'Passenger Response Rate', current: 94.1, target: 90, unit: '%', status: 'green', comparison: 'above',
    context: 'Gate boarding compliance above SLA', sparkline: [91.0, 91.8, 92.4, 93.1, 93.5, 93.8, 94.1],
    sla: '≥90%', lastChecked: '09:52',
    yesterday: 93.5, weeklyAvg: 92.8, shifts: [94.0, 93.8, 94.5], incidents: 2, trend: +1.4 },
  { name: 'Emergency Broadcast Time', current: 1.2, target: 2, unit: 'seconds', status: 'green', comparison: 'below',
    context: 'Last drill: 1.1s — within CAA limit', sparkline: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2, 1.2],
    sla: '≤2s CAA', lastChecked: '09:31',
    yesterday: 1.3, weeklyAvg: 1.5, shifts: [1.2, 1.2, 1.1], incidents: 0, trend: +6.5 },
  { name: 'Zone Coverage', current: 98.7, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: '8 of 8 broadcast zones active', sparkline: [98.2, 98.4, 98.5, 98.6, 98.6, 98.7, 98.7],
    sla: '≥98%', lastChecked: 'Live',
    yesterday: 98.5, weeklyAvg: 98.4, shifts: [98.7, 98.7, 98.6], incidents: 0, trend: +0.2 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'System Operational Uptime', current: 98.0, target: 99, unit: '%', status: 'yellow', comparison: 'above',
    context: 'TCP session loss 09:15 caused 14 min downtime', sparkline: [97.2, 97.5, 97.8, 98.0, 98.1, 98.0, 98.0],
    sla: '≥99%', lastChecked: 'Live',
    yesterday: 98.2, weeklyAvg: 97.7, shifts: [98.5, 97.8, 98.0], incidents: 1, trend: +0.3 },
  { name: 'Non-functional Speakers', current: 1, target: 0, unit: 'units', status: 'yellow', comparison: 'above',
    context: 'Gate B7 speaker offline — WO raised', sparkline: [0, 0, 0, 1, 1, 1, 1],
    sla: '0 units', lastChecked: '09:41',
    yesterday: 0, weeklyAvg: 0.3, shifts: [0, 1, 1], incidents: 1, trend: -1.0 },
  { name: 'Message Playback Delay', current: 0.8, target: 1, unit: 'seconds', status: 'green', comparison: 'below',
    context: 'Network latency nominal across all zones', sparkline: [0.95, 0.90, 0.88, 0.85, 0.82, 0.80, 0.80],
    sla: '≤1s', lastChecked: 'Live',
    yesterday: 0.9, weeklyAvg: 0.87, shifts: [0.8, 0.9, 0.7], incidents: 0, trend: +8.0 },
  { name: 'TCP/REST Sync Success', current: 99.7, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'Dual-integration health — TCP/OIP + REST API', sparkline: [99.1, 99.3, 99.4, 99.5, 99.6, 99.7, 99.7],
    sla: '≥99%', lastChecked: 'Live',
    yesterday: 99.6, weeklyAvg: 99.4, shifts: [99.7, 99.7, 99.8], incidents: 0, trend: +0.3 },
  { name: 'Backup Activation Success', current: 99.2, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: 'Backup amplifier ready for all zones', sparkline: [99.0, 99.1, 99.2, 99.2, 99.1, 99.2, 99.2],
    sla: '≥98%', lastChecked: 'Live',
    yesterday: 99.0, weeklyAvg: 99.1, shifts: [99.2, 99.3, 99.1], incidents: 0, trend: +0.2 },
];

// ── FRS Use-Cases: REST API (UC-PAS-05/06/07) + TCP/OIP (UC-PAS-01/02/03/06/07) as notification triggers ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'PAS-001', severity: 'high',   zone: 'Gate B7 — Pier B',
    message: '[UC-PAS-07] PAS controller fault — Gate B7 speaker offline, passenger info gap at boarding gate', ts: '09:41', ack: false },
  { id: 'PAS-002', severity: 'high',   zone: 'PAS TCP/OIP Integration',
    message: '[UC-PAS-01] TCP session lost — HBMS-PAS link dropped, announcement stream interrupted, reconnecting', ts: '09:15', ack: false },
  { id: 'PAS-003', severity: 'medium', zone: 'PAS Server — Heartbeat Monitor',
    message: '[UC-PAS-06] Heartbeat missed (2 consecutive) — PAS communication health degraded, reconnection initiated', ts: '08:52', ack: false },
  { id: 'PAS-004', severity: 'medium', zone: 'Terminal 2 — Zone T2-D',
    message: '[UC-PAS-03] Alarm notification received — Zone T2-D controller fault mapped to HBMS alarm lifecycle', ts: '09:41', ack: true },
  { id: 'PAS-005', severity: 'medium', zone: 'Terminal 1 — All Zones',
    message: '[UC-PAS-05] Emergency evacuation broadcast triggered — all zones activated, CAA ≤2s SLA met (1.2s)', ts: '09:31', ack: true },
  { id: 'PAS-006', severity: 'low',    zone: 'Apron W2',
    message: '[UC-PAS-06] Operational announcement latency spike: 1.4s (SLA ≤1s) — broadcast delay logged in SOE', ts: '08:27', ack: true },
  { id: 'PAS-007', severity: 'low',    zone: 'Departure Zone D3',
    message: '[UC-PAS-07] Entity state update — Zone D3 resource status: Active → Standby (TCP NotifyResourceState)', ts: '07:45', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'PAS TCP session restored — subscriptions re-initialized', ts: '09:45', level: 'info' },
  { id: 'sl-2', msg: 'Zone B7 speaker fault — alarm raised, WO created',        ts: '09:41', level: 'err'  },
  { id: 'sl-3', msg: 'TCP/OIP session loss detected — comms alarm generated',   ts: '09:15', level: 'warn' },
  { id: 'sl-4', msg: 'Emergency drill broadcast complete — 1.2s, all zones OK', ts: '09:31', level: 'info' },
  { id: 'sl-5', msg: 'PAS heartbeat timeout (x2) — health alarm raised',        ts: '08:52', level: 'warn' },
  { id: 'sl-6', msg: 'Daily entity sync — 8 zones, 245 speakers confirmed',     ts: '06:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-PAS-07: Gate B7 speaker fault — controller offline',     type: 'alert',         severity: 'warn', timestamp: '09:41' },
  { id: 'e-2', title: 'UC-PAS-01: TCP session lost — HBMS reconnecting',           type: 'alert',         severity: 'warn', timestamp: '09:15' },
  { id: 'e-3', title: 'UC-PAS-05: Emergency broadcast drill completed OK',          type: 'maintenance',   severity: 'ok',   timestamp: '09:31' },
  { id: 'e-4', title: 'UC-PAS-06: Heartbeat miss x2 — comms alarm raised',         type: 'alert',         severity: 'warn', timestamp: '08:52' },
  { id: 'e-5', title: 'UC-PAS-02: Subscriptions re-initialized after session restore', type: 'system',    severity: 'ok',   timestamp: '09:45' },
  { id: 'e-6', title: 'UC-PAS-06: Operational announcement latency spike logged',   type: 'status_change', severity: 'warn', timestamp: '08:27' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-PAS-023', title: 'Gate B7 speaker unit replacement',               status: 'In Progress', priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-PAS-024', title: 'TCP/OIP session stability investigation',        status: 'Open',        priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-PAS-022', title: 'Latency investigation — Apron W2 zone',         status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-PAS-020', title: 'Annual acoustic calibration — Terminals 1 & 2', status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '3 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'PAS Main Server (Primary)',             status: 'Operational', details: 'TCP/OIP + REST services active' },
  { name: 'PAS Server (Secondary)',                status: 'Operational', details: 'Hot standby, synced' },
  { name: 'Speaker Zones — Terminal 1 (T1-01–04)',  status: 'Operational', details: '4/4 zones active' },
  { name: 'Speaker Zones — Terminal 2 (T2-01–04)',  status: 'Critical',    details: 'B7 speaker fault' },
  { name: 'Speaker Zones — Piers A/B/C',           status: 'Operational', details: 'All zones audible' },
  { name: 'PAS Controllers (PA-01–08)',            status: 'Warning',     details: 'PA-B7 fault state' },
  { name: 'TCP/OIP Integration Link',              status: 'Warning',     details: 'Reconnected — monitoring' },
  { name: 'REST API Integration',                  status: 'Operational', details: 'Entity sync stable' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'PAS/TCP',   msg: 'Session restored — 8 zone subscriptions re-initialized', ts: '09:45', status: 'ok'      },
  { id: 'il-2', ref: 'PA-B7',     msg: 'Controller fault — alarm raised, entity state updated',  ts: '09:41', status: 'updated' },
  { id: 'il-3', ref: 'PAS/TCP',   msg: 'Session loss alarm generated — stream interrupted',      ts: '09:15', status: 'err'     },
  { id: 'il-4', ref: 'EMERGENCY', msg: 'Evacuation drill broadcast completed — 1.2s latency',    ts: '09:31', status: 'ok'      },
  { id: 'il-5', ref: 'PAS/REST',  msg: 'Entity sync — 8 zones, 245 speakers confirmed',          ts: '06:00', status: 'synced'  },
  { id: 'il-6', ref: 'FIDS/PAS',  msg: 'Flight data sync — 0 missed announcements',              ts: '00:00', status: 'synced'  },
];

const PASDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Public Address System"
    subsystemCode="pas"
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

export default PASDetails;
