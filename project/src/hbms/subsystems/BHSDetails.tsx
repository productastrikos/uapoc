import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── Operational KPIs — FRS §4 (availability & safety focus) ─────────────────
const OPERATIONAL_KPIS: KPIData[] = [
  {
    name: 'Subsystem Availability (OPERATIONAL)',
    current: 94.6, target: 98, unit: '%', status: 'yellow', comparison: 'below',
    context: '⚠ 18/24 subsystems OPERATIONAL via OPC UA SubSystemStatus',
    sparkline: [97.2, 96.8, 96.4, 96.0, 95.5, 95.0, 94.6],
    sla: '≥98%', lastChecked: 'Live', yesterday: 95.8, weeklyAvg: 96.2,
    shifts: [95.2, 94.6, 94.1], incidents: 3, trend: -1.3,
  },
  {
    name: 'Safety Downtime (STOPPED-SAFETY)',
    current: 1.2, target: 1, unit: '%', status: 'yellow', comparison: 'above',
    context: '⚠ SS-04 E-stop active — sorting Zone B since 09:31',
    sparkline: [0.4, 0.5, 0.6, 0.8, 0.9, 1.1, 1.2],
    sla: '≤1%', lastChecked: 'Live', yesterday: 0.9, weeklyAvg: 0.6,
    shifts: [0.8, 1.2, 1.4], incidents: 2, trend: -33.3,
  },
  {
    name: 'Shutter Availability (OPEN)',
    current: 98.2, target: 99, unit: '%', status: 'yellow', comparison: 'below',
    context: '⚠ FS-01 ERROR, FSS-03 Unknown — 22/24 shutters OPEN',
    sparkline: [99.8, 99.7, 99.5, 99.3, 98.9, 98.5, 98.2],
    sla: '≥99%', lastChecked: 'Live', yesterday: 98.6, weeklyAvg: 99.1,
    shifts: [98.5, 98.2, 98.0], incidents: 2, trend: -0.4,
  },
  {
    name: 'Shutter Fault Rate (ERROR)',
    current: 0.6, target: 0, unit: '%', status: 'yellow', comparison: 'above',
    context: '⚠ FS-01 T1-ZoneA Fire Shutter in ERROR — SOP-BHS-003 active',
    sparkline: [0.0, 0.0, 0.1, 0.2, 0.3, 0.5, 0.6],
    sla: '0%', lastChecked: '09:48', yesterday: 0.3, weeklyAvg: 0.1,
    shifts: [0.2, 0.6, 0.8], incidents: 1, trend: -100.0,
  },
  {
    name: 'Error Resolution Time (MTTR)',
    current: 8.4, target: 15, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Avg restart time after STOPPED-DUE-TO-ERROR — improving',
    sparkline: [14.2, 13.8, 13.0, 12.2, 11.0, 9.8, 8.4],
    sla: '≤15 min', lastChecked: '09:00', yesterday: 9.8, weeklyAvg: 11.8,
    shifts: [9.2, 8.4, 8.1], incidents: 0, trend: +14.3,
  },
];

// ── System KPIs — FRS §4 (fault & service breakdown) ─────────────────────────
const SYSTEM_KPIS: KPIData[] = [
  {
    name: 'Out-of-Service Rate (OUT-OF-SERVICE)',
    current: 2.4, target: 3, unit: '%', status: 'green', comparison: 'below',
    context: '3 subsystems in planned maintenance window',
    sparkline: [2.8, 2.7, 2.6, 2.5, 2.5, 2.4, 2.4],
    sla: '≤3%', lastChecked: 'Live', yesterday: 2.5, weeklyAvg: 2.6,
    shifts: [2.4, 2.4, 2.5], incidents: 0, trend: +4.0,
  },
  {
    name: 'Technical Fault Rate (TECHNICAL-ERROR)',
    current: 2.6, target: 2, unit: '%', status: 'yellow', comparison: 'above',
    context: '⚠ 3 subsystems in TECHNICAL-ERROR — above SLA threshold',
    sparkline: [1.8, 1.9, 2.0, 2.2, 2.4, 2.5, 2.6],
    sla: '≤2%', lastChecked: 'Live', yesterday: 2.4, weeklyAvg: 2.1,
    shifts: [2.2, 2.6, 2.8], incidents: 3, trend: -8.3,
  },
  {
    name: 'Operational Error Rate (OPERATIONAL-ERROR)',
    current: 0.8, target: 1.5, unit: '%', status: 'green', comparison: 'below',
    context: 'Bag-jam events contributing — within SLA',
    sparkline: [1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8],
    sla: '≤1.5%', lastChecked: 'Live', yesterday: 0.9, weeklyAvg: 1.0,
    shifts: [0.8, 0.8, 0.9], incidents: 0, trend: +11.1,
  },
  {
    name: 'Occupancy Rate (ENTRY-TEMP-NOT-AVAIL)',
    current: 3.2, target: 5, unit: '%', status: 'green', comparison: 'below',
    context: 'Make-up belt T2 at 68% capacity — within limit',
    sparkline: [3.5, 3.4, 3.3, 3.3, 3.2, 3.2, 3.2],
    sla: '≤5%', lastChecked: 'Live', yesterday: 3.3, weeklyAvg: 3.4,
    shifts: [3.1, 3.2, 3.3], incidents: 0, trend: +3.0,
  },
  {
    name: 'Shutter Downtime (CLOSED)',
    current: 1.2, target: 2, unit: '%', status: 'green', comparison: 'below',
    context: '2 shutters CLOSED outside fire event window — within limit',
    sparkline: [0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.2],
    sla: '≤2%', lastChecked: 'Live', yesterday: 1.1, weeklyAvg: 0.9,
    shifts: [1.0, 1.2, 1.3], incidents: 0, trend: -9.1,
  },
];

// ── Live Alerts — UC-07 (comms loss) + UC-06 (shutter SOP) + UC-03 (safety) ──
const LIVE_ALERTS: LiveAlert[] = [
  {
    id: 'BHS-001', severity: 'high', zone: 'Pier-B OPC UA Segment',
    message: 'Heartbeat timeout — 3 subsystems marked Unknown (UC-07). Comms partially restored.',
    ts: '09:12', ack: true,
  },
  {
    id: 'BHS-002', severity: 'high', zone: 'T1-ZoneA — FS-01 Fire Shutter',
    message: 'ShutterStatus → ERROR via OPC UA. SOP-BHS-003 triggered — safety team notified (UC-06).',
    ts: '09:48', ack: false,
  },
  {
    id: 'BHS-003', severity: 'high', zone: 'BHS Area B — SS-04 Sorting',
    message: 'SubSystemStatus → STOPPED-SAFETY. E-stop activated Zone B sorting area (UC-03).',
    ts: '09:31', ack: false,
  },
  {
    id: 'BHS-004', severity: 'low', zone: 'BHS Area C — SS-11 Outbound',
    message: 'SubSystemStatus → TECHNICAL-ERROR. WO auto-raised via CMMS.',
    ts: '08:55', ack: false,
  },
];

// ── System Logs — OPC UA event-driven updates ─────────────────────────────────
const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'OPC UA subscription OK — SubSystemStatus nodes: 24/24 active', ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'ShutterStatus FS-01 (T1-ZoneA) → ERROR — SOP-BHS-003 initiated', ts: '09:48', level: 'warn' },
  { id: 'sl-3', msg: 'SubSystemStatus SS-04 → STOPPED-SAFETY — E-stop Zone B', ts: '09:31', level: 'warn' },
  { id: 'sl-4', msg: 'OPC UA Pier-B comms restored — 3 node statuses refreshed', ts: '09:25', level: 'info' },
  { id: 'sl-5', msg: 'OPC UA Pier-B heartbeat timeout — nodes marked Unknown', ts: '09:12', level: 'warn' },
  { id: 'sl-6', msg: 'SubSystemStatus SS-11 → TECHNICAL-ERROR — WO auto-created', ts: '08:55', level: 'warn' },
  { id: 'sl-7', msg: 'OPC UA ShutterStatus poll: 24/24 nodes active — pre-shift check', ts: '08:00', level: 'info' },
];

// ── Recent Events ─────────────────────────────────────────────────────────────
const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e1', title: 'FS-01 ShutterStatus → ERROR — SOP-BHS-003 active', type: 'alert', severity: 'warn', timestamp: '09:48' },
  { id: 'e2', title: 'SS-04 SubSystemStatus → STOPPED-SAFETY — Zone B isolated', type: 'alert', severity: 'warn', timestamp: '09:31' },
  { id: 'e3', title: 'OPC UA Pier-B recovered — Unknown nodes refreshed', type: 'system', severity: 'ok', timestamp: '09:25' },
  { id: 'e4', title: 'OPC UA Pier-B heartbeat lost — UC-07 alarm raised', type: 'alert', severity: 'warn', timestamp: '09:12' },
  { id: 'e5', title: 'BHS daily OPC UA node integrity check — 24/24 OK', type: 'maintenance', severity: 'ok', timestamp: 'Yesterday' },
];

// ── Work Orders ───────────────────────────────────────────────────────────────
const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-BHS-031', title: 'FS-01 Fire Shutter actuator inspection & repair', status: 'In Progress', priority: 'High', assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-BHS-032', title: 'SS-04 E-stop investigation — Zone B sorting', status: 'Open', priority: 'High', assignee: 'Minh Tran', date: 'Due today' },
  { id: 'WO-BHS-033', title: 'OPC UA Pier-B node reconciliation & cert check', status: 'Open', priority: 'Medium', assignee: 'Binh Le', date: 'Due May 22' },
  { id: 'WO-BHS-029', title: 'BHS OPC UA annual certificate renewal', status: 'Completed', priority: 'Medium', assignee: 'Binh Le', date: '4 days ago' },
];

// ── Component Status — BHS Subsystems + Fire Shutters + Fire/Security Shutters
const COMPONENT_STATUS: ComponentStatus[] = [
  // BHS Subsystems (FR-02 hierarchy: Terminal → Area → Subsystem)
  { name: 'Inbound Subsystems (T1)',    status: 'Operational', details: '6/6 OPERATIONAL — SubSystemStatus OK' },
  { name: 'Sorting / HLC (T1)',         status: 'Warning',     details: '⚠ SS-04 STOPPED-SAFETY — E-stop Zone B' },
  { name: 'HBS Screening',             status: 'Operational', details: '4/4 OPERATIONAL — no faults' },
  { name: 'Outbound Subsystems (T2)',   status: 'Warning',     details: '⚠ SS-11 TECHNICAL-ERROR — WO open' },
  { name: 'Make-up Carousels',         status: 'Operational', details: '8/8 OPERATIONAL — T2 at 68% cap.' },
  // Fire Shutters (FR-09/FR-10: states — Open, Closed, Error, Unknown)
  { name: 'T1-ZoneA Fire Shutter (FS-01)', status: 'Critical', details: 'ShutterStatus → ERROR — SOP active' },
  { name: 'T1-ZoneB Fire Shutter (FS-02)', status: 'Operational', details: 'ShutterStatus → CLOSED (normal)' },
  { name: 'T2-ZoneA Fire Shutter (FS-03)', status: 'Operational', details: 'ShutterStatus → OPEN' },
  { name: 'T2-ZoneB Fire Shutter (FS-04)', status: 'Operational', details: 'ShutterStatus → OPEN' },
  // Fire/Security Shutters (FR-09/FR-10)
  { name: 'T1-ZoneA F/S Shutter (FSS-01)', status: 'Operational', details: 'ShutterStatus → OPEN' },
  { name: 'T2-ZoneB F/S Shutter (FSS-02)', status: 'Operational', details: 'ShutterStatus → OPEN' },
  { name: 'Pier-B F/S Shutter (FSS-03)',   status: 'Warning',     details: 'ShutterStatus → UNKNOWN — Pier-B recovery' },
];

// ── Integration Log — Direct OPC UA (FR-05, FR-06) ───────────────────────────
const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'OPC UA / SubSys', msg: 'SubSystemStatus subscription heartbeat OK — 24 nodes', ts: '10:05', status: 'ok' },
  { id: 'il-2', ref: 'OPC UA / FS-01',  msg: 'ShutterStatus → ERROR received — alarm raised', ts: '09:48', status: 'err' },
  { id: 'il-3', ref: 'OPC UA / SS-04',  msg: 'SubSystemStatus → STOPPED-SAFETY — UC-03 flow', ts: '09:31', status: 'err' },
  { id: 'il-4', ref: 'OPC UA / Pier-B', msg: 'Comms restored — 3 Unknown nodes refreshed (UC-07)', ts: '09:25', status: 'ok' },
  { id: 'il-5', ref: 'OPC UA / Pier-B', msg: 'Heartbeat timeout — nodes marked Unknown (UC-07)', ts: '09:12', status: 'err' },
  { id: 'il-6', ref: 'OPC UA / Shutter', msg: 'ShutterStatus subscription active — 24/24 nodes', ts: '08:00', status: 'synced' },
];

// ── Page Component ────────────────────────────────────────────────────────────
const BHSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Baggage Handling System"
    subsystemCode="bhs"
    operationalKPIs={OPERATIONAL_KPIS}
    systemKPIs={SYSTEM_KPIS}
    liveAlerts={LIVE_ALERTS}
    systemLogs={SYSTEM_LOGS}
    recentEvents={RECENT_EVENTS}
    workOrders={WORK_ORDERS}
    componentStatuses={COMPONENT_STATUS}
    integrationLog={INTEGRATION_LOG}
    integrationLogTitle="Direct OPC UA — BHS/HBMS"
    systemHealthPct={87}
    systemHealthMetrics={[
      { label: 'Availability',   value: '94.6%',  color: '#fbbf24' },
      { label: 'Safety Stops',  value: '1 active', color: '#fbbf24' },
      { label: 'Shutter Errors', value: '1 unit',  color: '#fbbf24' },
      { label: 'OPC UA Uptime', value: '99.7%',   color: '#9BEAE8' },
    ]}
    systemHealthChips={[
      { label: 'OPC UA Link',   ok: true  },  { label: 'Inbound (T1)', ok: true  },
      { label: 'Sorting SS-04', ok: false },  { label: 'Fire Shutters', ok: false },
      { label: 'F/S Shutters',  ok: true  },  { label: 'Screening',    ok: true  },
    ]}
  />
);

export default BHSDetails;
