import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Fire Alarm System — BACnet Life Safety integration) ──
// Section 4: MTTA, MTTR, Fault Rate + UC-FAS-05/06/07/08 events as notifications

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Fire Alarm Response (MTTA)', current: 0.8, target: 2, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Avg operator response — all zones staffed', sparkline: [1.8, 1.5, 1.3, 1.1, 1.0, 0.9, 0.8],
    sla: '≤2 min CAA', lastChecked: 'Live', yesterday: 1.0, weeklyAvg: 1.2, shifts: [0.7, 0.8, 0.9], incidents: 0, trend: +20.0 },
  { name: 'Zone Coverage', current: 100, target: 100, unit: '%', status: 'green', comparison: 'above',
    context: 'All 64 fire safety zones monitored', sparkline: [100, 100, 100, 100, 100, 100, 100],
    sla: '100%', lastChecked: 'Live', yesterday: 100, weeklyAvg: 100, shifts: [100, 100, 100], incidents: 0, trend: 0 },
  { name: 'False Alarm Rate', current: 0.3, target: 1, unit: '%', status: 'green', comparison: 'below',
    context: '1 false alarm in last 7 days', sparkline: [0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3],
    sla: '≤1%', lastChecked: '09:45', yesterday: 0.4, weeklyAvg: 0.5, shifts: [0.2, 0.3, 0.4], incidents: 0, trend: +25.0 },
  { name: 'Evacuation Drill Score', current: 98.2, target: 95, unit: '%', status: 'green', comparison: 'above',
    context: 'Last drill 09:31 — all zones cleared OK', sparkline: [96.0, 96.5, 97.0, 97.5, 97.8, 98.0, 98.2],
    sla: '≥95%', lastChecked: '09:31', yesterday: 98.0, weeklyAvg: 97.2, shifts: [98.5, 98.2, 97.8], incidents: 0, trend: +1.0 },
  { name: 'Pre-Alarm Events', current: 1, target: 0, unit: 'events', status: 'yellow', comparison: 'above',
    context: 'Zone T2-North — smoke detector pre-alarm', sparkline: [0, 0, 0, 0, 0, 1, 1],
    sla: '0 events', lastChecked: '09:58', yesterday: 0, weeklyAvg: 0.1, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'Alarm Panel Uptime', current: 99.9, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: '7d avg — 0 unplanned panel outages', sparkline: [99.7, 99.8, 99.8, 99.9, 99.9, 99.9, 99.9],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.9, weeklyAvg: 99.8, shifts: [99.9, 99.9, 99.9], incidents: 0, trend: +0.1 },
  { name: 'Sensor Faults', current: 1, target: 0, unit: 'units', status: 'yellow', comparison: 'above',
    context: 'Detector D-T2-N12 showing fault state', sparkline: [0, 0, 0, 0, 0, 1, 1],
    sla: '0 units', lastChecked: '09:58', yesterday: 0, weeklyAvg: 0.1, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
  { name: 'Battery Backup', current: 99.2, target: 95, unit: '%', status: 'green', comparison: 'above',
    context: 'All panel batteries >95% charge', sparkline: [98.5, 98.7, 98.9, 99.0, 99.1, 99.2, 99.2],
    sla: '≥95%', lastChecked: 'Live', yesterday: 99.0, weeklyAvg: 98.8, shifts: [99.2, 99.3, 99.1], incidents: 0, trend: +0.4 },
  { name: 'MTTR', current: 18.5, target: 30, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to clear fault/alarm conditions', sparkline: [28.0, 26.0, 24.0, 22.0, 20.0, 19.0, 18.5],
    sla: '≤30 min', lastChecked: '09:55', yesterday: 20.0, weeklyAvg: 22.5, shifts: [17.0, 18.5, 20.0], incidents: 0, trend: +38.3 },
  { name: 'Supervisory Events', current: 2, target: 2, unit: 'events', status: 'green', comparison: 'above',
    context: 'Sprinkler valve supervision points OK', sparkline: [1, 1, 2, 2, 2, 2, 2],
    sla: '≤5 events', lastChecked: 'Live', yesterday: 2, weeklyAvg: 1.8, shifts: [2, 2, 2], incidents: 0, trend: 0 },
];

// ── FRS Use-Cases: UC-FAS-05/06/07/08 are primary notification triggers ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'FAS-001', severity: 'critical', zone: 'Terminal 2 — North Concourse',
    message: '[UC-FAS-06] Pre-alarm detected on detector D-T2-N12 — smoke level 68% threshold', ts: '09:58', ack: false },
  { id: 'FAS-002', severity: 'high',     zone: 'Terminal 2 — North Concourse',
    message: '[UC-FAS-07] Detector D-T2-N12 fault state — BACnet Life Safety Point offline', ts: '09:58', ack: false },
  { id: 'FAS-003', severity: 'medium',   zone: 'Baggage Hall — Zone B12',
    message: '[UC-FAS-08] Supervisory event — sprinkler valve V-B12 tamper switch triggered', ts: '08:33', ack: true },
  { id: 'FAS-004', severity: 'low',      zone: 'Pier A — Gate A04',
    message: '[UC-FAS-07] Annual sensor self-test failure on detector D-A04-11', ts: '07:15', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'BACnet scan OK — 64 zones, 312 sensors reporting',        ts: '10:00', level: 'info' },
  { id: 'sl-2', msg: 'Pre-alarm raised on D-T2-N12 — smoke 68% threshold',      ts: '09:58', level: 'warn' },
  { id: 'sl-3', msg: 'Fault state on D-T2-N12 — BACnet point offline',          ts: '09:58', level: 'err'  },
  { id: 'sl-4', msg: 'Sprinkler tamper event V-B12 — supervisory alarm raised', ts: '08:33', level: 'warn' },
  { id: 'sl-5', msg: 'Evacuation drill complete — all 64 zones cleared',        ts: '09:31', level: 'info' },
  { id: 'sl-6', msg: 'Battery backup test passed — all panels >95%',           ts: '06:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-FAS-06: Pre-alarm on D-T2-N12 — zone T2-North',       type: 'alert',       severity: 'warn', timestamp: '09:58' },
  { id: 'e-2', title: 'UC-FAS-07: Sensor fault D-T2-N12 — BACnet offline',      type: 'alert',       severity: 'warn', timestamp: '09:58' },
  { id: 'e-3', title: 'UC-FAS-05: Evacuation drill completed successfully',      type: 'maintenance', severity: 'ok',   timestamp: '09:31' },
  { id: 'e-4', title: 'UC-FAS-08: Supervisory V-B12 tamper event',              type: 'alert',       severity: 'warn', timestamp: '08:33' },
  { id: 'e-5', title: 'UC-FAS-09: Alarm A-T1-W01 acknowledged & closed',        type: 'system',      severity: 'ok',   timestamp: '07:50' },
  { id: 'e-6', title: 'UC-FAS-10: Morning KPI report — 100% zone coverage',     type: 'system',      severity: 'ok',   timestamp: '07:00' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-FAS-018', title: 'D-T2-N12 sensor replacement — pre-alarm fault',   status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-FAS-019', title: 'V-B12 sprinkler valve tamper investigation',      status: 'Open',        priority: 'Medium', assignee: 'Hieu Nguyen', date: 'Due Apr 18' },
  { id: 'WO-FAS-017', title: 'Annual sensor self-test — Pier A detectors',      status: 'Open',        priority: 'Low',    assignee: 'Binh Le',     date: 'Due Apr 20' },
  { id: 'WO-FAS-015', title: 'Panel battery replacement — Control Room 2',      status: 'Completed',   priority: 'Medium', assignee: 'Nam Pham',    date: '4 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'Fire Alarm Panels (FAP-01–08)',     status: 'Operational', details: '8/8 panels online' },
  { name: 'Smoke Detectors — Terminal 1',      status: 'Operational', details: '112 units nominal' },
  { name: 'Smoke Detectors — Terminal 2',      status: 'Critical',    details: 'D-T2-N12 fault' },
  { name: 'Heat Detectors — All Zones',        status: 'Operational', details: '48 units nominal' },
  { name: 'Sprinkler Supervision Points',      status: 'Warning',     details: 'V-B12 tamper event' },
  { name: 'Evacuation Sounders',              status: 'Operational', details: 'All 64 zones ready' },
  { name: 'BACnet Integration',              status: 'Operational', details: 'All life safety points active' },
  { name: 'Alarm & SOP Engine',             status: 'Operational', details: 'Emergency SOPs armed' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'BACnet',   msg: 'Life safety point scan — 312 sensors OK',         ts: '10:00', status: 'ok'      },
  { id: 'il-2', ref: 'D-T2-N12', msg: 'Pre-alarm state — alarm raised in HBMS',          ts: '09:58', status: 'updated' },
  { id: 'il-3', ref: 'D-T2-N12', msg: 'Fault state BACnet — alarm escalated',            ts: '09:58', status: 'updated' },
  { id: 'il-4', ref: 'V-B12',    msg: 'Supervisory tamper event — SOP triggered',        ts: '08:33', status: 'updated' },
  { id: 'il-5', ref: 'FAP-01',   msg: 'Panel heartbeat OK — all zones confirmed',        ts: '06:00', status: 'ok'      },
  { id: 'il-6', ref: 'BACnet',   msg: 'Nightly zone audit complete — 100% coverage',     ts: '00:00', status: 'synced'  },
];

const FASDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Fire Alarm System"
    subsystemCode="fas"
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

export default FASDetails;
