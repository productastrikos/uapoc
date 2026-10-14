import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'CCTV Coverage', current: 99.3, target: 98, unit: '%', status: 'green', comparison: 'above',
    context: '587/591 cameras online', sparkline: [98.5, 98.7, 98.9, 99.0, 99.1, 99.2, 99.3],
    sla: '≥98%', lastChecked: 'Live', yesterday: 99.1, weeklyAvg: 98.9, shifts: [99.3, 99.4, 99.2], incidents: 1, trend: +0.4 },
  { name: 'Access Control Response', current: 0.9, target: 2, unit: 'seconds', status: 'green', comparison: 'below',
    context: 'Card reader auth time avg', sparkline: [1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9],
    sla: '≤2s', lastChecked: 'Live', yesterday: 1.0, weeklyAvg: 1.2, shifts: [0.9, 0.8, 1.0], incidents: 0, trend: +10.0 },
  { name: 'Perimeter Integrity', current: 100, target: 100, unit: '%', status: 'green', comparison: 'above',
    context: 'All fence sensors and gates armed', sparkline: [100, 100, 100, 100, 100, 100, 100],
    sla: '100%', lastChecked: 'Live', yesterday: 100, weeklyAvg: 100, shifts: [100, 100, 100], incidents: 0, trend: 0 },
  { name: 'Intrusion Detection Rate', current: 99.7, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: '0 undetected events in 7d', sparkline: [99.2, 99.3, 99.4, 99.5, 99.6, 99.7, 99.7],
    sla: '≥99%', lastChecked: '09:50', yesterday: 99.6, weeklyAvg: 99.4, shifts: [99.7, 99.8, 99.6], incidents: 0, trend: +0.3 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'VMS Server Uptime', current: 99.8, target: 99, unit: '%', status: 'green', comparison: 'above',
    context: 'Video management system healthy', sparkline: [99.4, 99.5, 99.6, 99.7, 99.7, 99.8, 99.8],
    sla: '≥99%', lastChecked: 'Live', yesterday: 99.7, weeklyAvg: 99.6, shifts: [99.9, 99.8, 99.8], incidents: 0, trend: +0.2 },
  { name: 'Camera Offline Count', current: 4, target: 0, unit: 'units', status: 'yellow', comparison: 'above',
    context: '⚠ 4 cameras under maintenance', sparkline: [2, 2, 3, 4, 4, 4, 4],
    sla: '0 units', lastChecked: '09:10', yesterday: 3, weeklyAvg: 2.9, shifts: [3, 4, 4], incidents: 4, trend: -2.0 },
  { name: 'Storage Utilisation', current: 71.2, target: 85, unit: '%', status: 'green', comparison: 'below',
    context: 'NVR storage 71% — 14-day retention', sparkline: [73.5, 73.0, 72.5, 72.0, 71.8, 71.5, 71.2],
    sla: '≤85%', lastChecked: 'Live', yesterday: 71.5, weeklyAvg: 72.5, shifts: [71.0, 71.2, 71.5], incidents: 0, trend: +3.0 },
  { name: 'Access Events/hr', current: 1240, target: 1500, unit: 'events', status: 'green', comparison: 'below',
    context: 'Current throughput well within peak', sparkline: [1380, 1360, 1340, 1310, 1280, 1260, 1240],
    sla: '≤1500', lastChecked: 'Live', yesterday: 1280, weeklyAvg: 1310, shifts: [1180, 1240, 1300], incidents: 0, trend: +4.6 },
];

const LIVE_ALERTS: LiveAlert[] = [
  { id: 'IAS-001', severity: 'medium', zone: 'Airside Pier B – Cam B12', message: 'Camera offline — lens obstruction', ts: '09:10', ack: false },
  { id: 'IAS-002', severity: 'medium', zone: 'Security Gate S3', message: 'Card reader firmware update pending', ts: '08:45', ack: false },
  { id: 'IAS-003', severity: 'low', zone: 'NVR Rack 2', message: 'Storage at 71% — expansion scheduled', ts: '08:00', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'VMS heartbeat OK — 587/591 cameras active', ts: '10:03', level: 'info' },
  { id: 'sl-2', msg: 'Camera B12 offline — ticket auto-created', ts: '09:10', level: 'warn' },
  { id: 'sl-3', msg: 'Access control sync OK — 1,240 events/hr', ts: '09:00', level: 'info' },
  { id: 'sl-4', msg: 'Perimeter fence sensor poll OK — all zones', ts: '08:30', level: 'info' },
  { id: 'sl-5', msg: 'NVR storage check — 71.2% utilisation', ts: '08:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e1', title: 'Camera B12 offline — auto-ticket raised', type: 'alert', severity: 'warn', timestamp: '09:10' },
  { id: 'e2', title: 'Access control sync OK — no tailgating events', type: 'system', severity: 'ok', timestamp: '09:00' },
  { id: 'e3', title: 'Perimeter patrol scan passed — all zones clear', type: 'maintenance', severity: 'ok', timestamp: '08:30' },
  { id: 'e4', title: 'IASS weekly security audit — all clear', type: 'status_change', severity: 'ok', timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-IAS-021', title: 'Camera B12 lens cleaning / replacement', status: 'In Progress', priority: 'Medium', assignee: 'Kim Ly', date: 'Due today' },
  { id: 'WO-IAS-022', title: 'Security Gate S3 firmware update', status: 'Open', priority: 'Medium', assignee: 'Ha Tran', date: 'Due May 22' },
  { id: 'WO-IAS-019', title: 'Annual access card audit', status: 'Completed', priority: 'Low', assignee: 'Kim Ly', date: '5 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'CCTV Cameras',       status: 'Warning',     details: '587/591 online' },
  { name: 'VMS Servers',        status: 'Operational', details: 'Primary + redundant OK' },
  { name: 'NVR Storage',        status: 'Operational', details: '71% used, 14d retention' },
  { name: 'Access Card Readers', status: 'Operational', details: '98 readers active' },
  { name: 'Perimeter Sensors',  status: 'Operational', details: 'All fence zones armed' },
  { name: 'Security Gates',     status: 'Operational', details: '24/24 lanes OK' },
  { name: 'Control Room',       status: 'Operational', details: 'Staffed 24/7' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'SACS',  msg: 'Alarm zone states synced', ts: '10:03', status: 'synced' },
  { id: 'il-2', ref: 'AODB',  msg: 'VIP passenger pre-clearance data', ts: '09:45', status: 'updated' },
  { id: 'il-3', ref: 'Cam-B12', msg: 'Camera offline flag sent to SACS', ts: '09:10', status: 'err' },
  { id: 'il-4', ref: 'SCADA', msg: 'Access event rate exported', ts: '09:00', status: 'ok' },
];

const IASSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Integrated Airport Security System"
    subsystemCode="iass"
    operationalKPIs={OPERATIONAL_KPIS}
    systemKPIs={SYSTEM_KPIS}
    liveAlerts={LIVE_ALERTS}
    systemLogs={SYSTEM_LOGS}
    recentEvents={RECENT_EVENTS}
    workOrders={WORK_ORDERS}
    componentStatuses={COMPONENT_STATUS}
    integrationLog={INTEGRATION_LOG}
    integrationLogTitle="Security Systems Integration"
    kpiCols={4}
    systemHealthPct={97}
    systemHealthMetrics={[
      { label: 'VMS Uptime',        value: '99.8%', color: '#34d399' },
      { label: 'Cameras Offline',  value: '4 units', color: '#fbbf24' },
      { label: 'Storage Used',     value: '71.2%',  color: '#9BEAE8' },
      { label: 'Access Events',    value: '1240/hr', color: '#34d399' },
    ]}
    systemHealthChips={[
      { label: 'CCTV Coverage', ok: false }, { label: 'VMS Servers', ok: true },
      { label: 'NVR Storage', ok: true },    { label: 'Card Readers', ok: true },
      { label: 'Perimeter', ok: true },      { label: 'Control Room', ok: true },
    ]}
  />
);

export default IASSDetails;
