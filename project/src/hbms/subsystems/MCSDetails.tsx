import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Master Clock System — via NMS / Bodet SNMP) ──
// Section 4: Device Availability, Sync Status, Active Alarms, Alarm Freq, Comm Uptime

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Device Availability', current: 98.1, target: 99, unit: '%', status: 'yellow', comparison: 'above',
    context: '2 secondary clocks offline — pending maintenance', sparkline: [99.2, 99.0, 98.8, 98.5, 98.3, 98.2, 98.1],
    sla: '≥99%', lastChecked: 'Live', yesterday: 98.4, weeklyAvg: 98.6, shifts: [98.4, 98.1, 97.9], incidents: 2, trend: -0.3 },
  { name: 'Synchronization Status', current: 99.4, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: '6 of 108 clocks synced to GPS primary', sparkline: [98.5, 98.8, 99.0, 99.2, 99.3, 99.4, 99.4],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.2, weeklyAvg: 99.1, shifts: [99.5, 99.4, 99.3], incidents: 0, trend: +0.5 },
  { name: 'Active Alarm Count', current: 2, target: 0, unit: 'alarms', status: 'yellow', comparison: 'above',
    context: 'CLK-T2-14 offline + GPS secondary fault', sparkline: [0, 0, 1, 1, 2, 2, 2],
    sla: '0 alarms', lastChecked: '09:52', yesterday: 1, weeklyAvg: 0.6, shifts: [0, 2, 1], incidents: 2, trend: -1.0 },
  { name: 'Alarm Frequency', current: 0.4, target: 1, unit: 'alarms/day', status: 'green', comparison: 'below',
    context: 'Rolling 7-day avg across NMS devices', sparkline: [1.2, 1.0, 0.8, 0.7, 0.5, 0.4, 0.4],
    sla: '≤1/day', lastChecked: '09:55', yesterday: 0.5, weeklyAvg: 0.7, shifts: [0.3, 0.4, 0.5], incidents: 0, trend: +60.0 },
  { name: 'Communication Uptime', current: 99.6, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'NMS ↔ HBMS SNMP/Trap link stable', sparkline: [99.0, 99.2, 99.3, 99.4, 99.5, 99.6, 99.6],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.5, weeklyAvg: 99.3, shifts: [99.7, 99.6, 99.5], incidents: 0, trend: +0.6 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'Devices Online', current: 106, target: 108, unit: 'devices', status: 'yellow', comparison: 'above',
    context: '106/108 clock devices reporting to NMS', sparkline: [108, 108, 108, 107, 107, 106, 106],
    sla: '≥106', lastChecked: 'Live', yesterday: 107, weeklyAvg: 107.3, shifts: [107, 106, 106], incidents: 2, trend: -1.9 },
  { name: 'Devices Offline', current: 2, target: 0, unit: 'devices', status: 'yellow', comparison: 'above',
    context: 'CLK-T2-14 (power), CLK-P-B02 (maintenance)', sparkline: [0, 0, 0, 1, 1, 2, 2],
    sla: '0 devices', lastChecked: 'Live', yesterday: 1, weeklyAvg: 0.8, shifts: [0, 2, 2], incidents: 2, trend: -1.0 },
  { name: 'Time Sync Accuracy', current: 8, target: 10, unit: 'ms', status: 'green', comparison: 'below',
    context: 'Max deviation from GPS primary reference', sparkline: [15, 13, 12, 11, 10, 9, 8],
    sla: '≤10ms', lastChecked: 'Live', yesterday: 9, weeklyAvg: 11, shifts: [8, 8, 9], incidents: 0, trend: +20.0 },
  { name: 'NMS Health', current: 99.8, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'Bodet NMS server uptime this week', sparkline: [99.5, 99.6, 99.7, 99.8, 99.8, 99.8, 99.8],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.8, weeklyAvg: 99.7, shifts: [99.8, 99.8, 99.8], incidents: 0, trend: +0.3 },
  { name: 'MTTR', current: 35.0, target: 60, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Avg restore time for offline clock devices', sparkline: [55.0, 52.0, 48.0, 44.0, 40.0, 37.0, 35.0],
    sla: '≤60 min', lastChecked: '09:55', yesterday: 40.0, weeklyAvg: 45.0, shifts: [32.0, 35.0, 38.0], incidents: 0, trend: +36.4 },
];

// ── FRS Use-Cases: UC-MCS-01/02/03/04 as notification triggers ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'MCS-001', severity: 'high',   zone: 'Terminal 2 — Gate T2-14',
    message: '[UC-MCS-02] CLK-T2-14 offline alarm — NMS HealthTrap received, device unreachable', ts: '09:52', ack: false },
  { id: 'MCS-002', severity: 'high',   zone: 'GPS Reference — Secondary Server',
    message: '[UC-MCS-03] GPS secondary reference fault — NMS health degraded, sync accuracy at risk', ts: '09:35', ack: false },
  { id: 'MCS-003', severity: 'medium', zone: 'NMS ↔ HBMS Link',
    message: '[UC-MCS-04] NMS communication timeout 2 min — SNMP trap delivery delayed', ts: '08:45', ack: true },
  { id: 'MCS-004', severity: 'low',    zone: 'Pier B — Boarding Gate B02',
    message: '[UC-MCS-01] CLK-P-B02 status change: Online → Maintenance scheduled', ts: '07:30', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'NMS poll OK — 106 devices reporting, 2 offline',       ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'CLK-T2-14 HealthTrap received — offline alarm raised', ts: '09:52', level: 'err'  },
  { id: 'sl-3', msg: 'GPS secondary fault — NMS system health warning',       ts: '09:35', level: 'warn' },
  { id: 'sl-4', msg: 'NMS SNMP timeout 2 min — comms alarm generated',       ts: '08:45', level: 'warn' },
  { id: 'sl-5', msg: 'CLK-P-B02 maintenance flag set — device paused',       ts: '07:30', level: 'info' },
  { id: 'sl-6', msg: 'Nightly sync accuracy check — max deviation 8ms',      ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-MCS-02: CLK-T2-14 offline — alarm raised',          type: 'alert',         severity: 'warn', timestamp: '09:52' },
  { id: 'e-2', title: 'UC-MCS-03: GPS secondary fault — NMS health degraded', type: 'alert',         severity: 'warn', timestamp: '09:35' },
  { id: 'e-3', title: 'UC-MCS-04: NMS comms timeout — SNMP delayed',          type: 'alert',         severity: 'warn', timestamp: '08:45' },
  { id: 'e-4', title: 'UC-MCS-01: CLK-P-B02 entered maintenance mode',        type: 'maintenance',   severity: 'ok',   timestamp: '07:30' },
  { id: 'e-5', title: 'UC-MCS-03: System health check — 99.8% NMS uptime',   type: 'system',        severity: 'ok',   timestamp: '06:00' },
  { id: 'e-6', title: 'UC-MCS-01: CLK-T3-22 returned to service',            type: 'status_change', severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-MCS-018', title: 'CLK-T2-14 power supply investigation',          status: 'In Progress', priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-MCS-019', title: 'GPS secondary reference server replacement',    status: 'Open',        priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-MCS-017', title: 'NMS SNMP configuration audit',                  status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-MCS-015', title: 'Annual clock battery replacement — Terminal 1', status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '5 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'Primary GPS Reference',            status: 'Operational', details: 'Stratum 1 — 8ms accuracy' },
  { name: 'Secondary GPS Reference',          status: 'Critical',    details: 'Fault state — fallback active' },
  { name: 'NMS Server (Bodet)',              status: 'Operational', details: '99.8% uptime' },
  { name: 'Clock Devices — Terminal 1',      status: 'Operational', details: '42/42 devices online' },
  { name: 'Clock Devices — Terminal 2',      status: 'Critical',    details: 'CLK-T2-14 offline' },
  { name: 'Clock Devices — Piers A/B/C',     status: 'Warning',     details: 'B02 in maintenance' },
  { name: 'SNMP / NMS ↔ HBMS Link',         status: 'Operational', details: 'Trap delivery stable' },
  { name: 'Time Distribution Network',       status: 'Operational', details: 'All zones synchronized' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'NMS',       msg: 'Status poll — 106 devices updated',              ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'CLK-T2-14', msg: 'HealthTrap offline — alarm forwarded to HBMS',  ts: '09:52', status: 'updated' },
  { id: 'il-3', ref: 'GPS-SEC',   msg: 'Fault state — NMS health alarm raised',          ts: '09:35', status: 'updated' },
  { id: 'il-4', ref: 'SNMP',      msg: 'Trap timeout 2 min — comms alarm raised',        ts: '08:45', status: 'err'     },
  { id: 'il-5', ref: 'CLK-P-B02', msg: 'Maintenance flag received — device paused',      ts: '07:30', status: 'updated' },
  { id: 'il-6', ref: 'NMS',       msg: 'Nightly sync accuracy report generated',         ts: '00:00', status: 'synced'  },
];

const MCSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Master Clock System"
    subsystemCode="mcs"
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

export default MCSDetails;
