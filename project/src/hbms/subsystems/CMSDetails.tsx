import React from 'react';
import SubsystemPage, {
  KPIData, LiveAlert, LogEntry, SubsystemEvent, WorkOrder, ComponentStatus, IntegrationEntry,
} from '../components/SubsystemPage';

// ── FRS KPIs (Conveyance Monitoring System — Elevators, Escalators, Moving Walks) ──
// Section 4: Operational Availability, Out-of-Service Duration, Fault Count, Overload Events, Emergency Incidents

const OPERATIONAL_KPIS: KPIData[] = [
  { name: 'Conveyance Availability', current: 96.4, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '3 units in maintenance / fault state', sparkline: [98.1, 97.8, 97.4, 97.0, 96.7, 96.4, 96.4],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.0, weeklyAvg: 97.3, shifts: [97.2, 96.4, 96.0], incidents: 3, trend: -0.6 },
  { name: 'Out-of-Service Duration', current: 28.5, target: 15, unit: 'minutes', status: 'yellow', comparison: 'below',
    context: 'Escalator T1-E03 unplanned shutdown', sparkline: [8.0, 10.0, 15.0, 18.0, 22.0, 26.0, 28.5],
    sla: '≤15 min', lastChecked: '09:55', yesterday: 18.0, weeklyAvg: 16.5, shifts: [5.0, 28.5, 10.0], incidents: 1, trend: -4.2 },
  { name: 'Active Fault Count', current: 2, target: 0, unit: 'faults', status: 'yellow', comparison: 'above',
    context: 'Elevator ELV-07 & Escalator T1-E03', sparkline: [0, 0, 1, 1, 2, 2, 2],
    sla: '0 faults', lastChecked: '09:55', yesterday: 1, weeklyAvg: 0.8, shifts: [0, 2, 1], incidents: 2, trend: -1.0 },
  { name: 'Overload Events', current: 1, target: 0, unit: 'events', status: 'yellow', comparison: 'above',
    context: 'ELV-07 overload condition triggered safety stop', sparkline: [0, 0, 0, 0, 0, 1, 1],
    sla: '0 events', lastChecked: '09:12', yesterday: 0, weeklyAvg: 0.1, shifts: [0, 1, 0], incidents: 1, trend: -1.0 },
  { name: 'Emergency / Fire Mode', current: 0, target: 0, unit: 'incidents', status: 'green', comparison: 'above',
    context: 'No emergency recall events this shift', sparkline: [0, 0, 0, 0, 0, 0, 0],
    sla: '0 incidents', lastChecked: 'Live', yesterday: 0, weeklyAvg: 0.0, shifts: [0, 0, 0], incidents: 0, trend: 0 },
];

const SYSTEM_KPIS: KPIData[] = [
  { name: 'MTTA', current: 4.8, target: 5, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to acknowledge conveyance alarms', sparkline: [6.5, 6.0, 5.8, 5.5, 5.2, 5.0, 4.8],
    sla: '≤5 min', lastChecked: '09:55', yesterday: 5.2, weeklyAvg: 5.5, shifts: [4.5, 4.8, 5.2], incidents: 0, trend: +13.5 },
  { name: 'MTTR', current: 52.0, target: 60, unit: 'minutes', status: 'green', comparison: 'below',
    context: 'Mean time to restore faulted equipment', sparkline: [68.0, 64.0, 60.0, 57.0, 54.0, 52.0, 52.0],
    sla: '≤60 min', lastChecked: '09:55', yesterday: 56.0, weeklyAvg: 60.0, shifts: [50.0, 52.0, 55.0], incidents: 0, trend: +13.3 },
  { name: 'Equipment Health', current: 96.4, target: 98, unit: '%', status: 'yellow', comparison: 'above',
    context: '53 of 55 conveyance units healthy', sparkline: [98.0, 97.5, 97.2, 96.8, 96.5, 96.4, 96.4],
    sla: '≥98%', lastChecked: 'Live', yesterday: 97.0, weeklyAvg: 97.2, shifts: [97.0, 96.4, 96.0], incidents: 2, trend: -0.6 },
  { name: 'Operating Time — Direction', current: 82.5, target: 80, unit: '%', status: 'green', comparison: 'above',
    context: 'Up/forward direction active time share', sparkline: [80.1, 80.5, 81.0, 81.5, 82.0, 82.3, 82.5],
    sla: '≥80%', lastChecked: 'Live', yesterday: 82.0, weeklyAvg: 81.3, shifts: [83.0, 82.5, 82.0], incidents: 0, trend: +0.6 },
  { name: 'Alarm Frequency', current: 2.4, target: 4, unit: 'alarms/hr', status: 'green', comparison: 'below',
    context: 'Average across all conveyance assets', sparkline: [4.2, 3.8, 3.5, 3.2, 2.8, 2.5, 2.4],
    sla: '≤4/hr', lastChecked: '10:00', yesterday: 2.8, weeklyAvg: 3.2, shifts: [2.2, 2.4, 2.7], incidents: 0, trend: +40.0 },
];

// ── FRS Use-Cases: UC-CMS-04/05/06/07 are primary notification triggers ──
const LIVE_ALERTS: LiveAlert[] = [
  { id: 'CMS-001', severity: 'critical', zone: 'Terminal 1 — Concourse B',
    message: '[UC-CMS-06] ELV-07 overload condition — safety stop activated, passengers evacuated', ts: '09:12', ack: false },
  { id: 'CMS-002', severity: 'high',     zone: 'Terminal 1 — Arrivals Hall',
    message: '[UC-CMS-04] Escalator T1-E03 fault — unplanned shutdown, out-of-service', ts: '09:38', ack: false },
  { id: 'CMS-003', severity: 'high',     zone: 'IB / GENESIS64 Link',
    message: '[UC-CMS-07] Communication loss — GENESIS64 data feed interrupted for 3 min', ts: '08:50', ack: false },
  { id: 'CMS-004', severity: 'medium',   zone: 'Pier C — Moving Walk MW-02',
    message: '[UC-CMS-05] Moving walk MW-02 mode change: Normal → Maintenance', ts: '08:22', ack: true },
  { id: 'CMS-005', severity: 'low',      zone: 'Terminal 2 — Elevator ELV-14',
    message: '[UC-CMS-03] ELV-14 direction mode updated: Bi-directional → Up only (scheduled)', ts: '07:45', ack: true },
];

const SYSTEM_LOGS: LogEntry[] = [
  { id: 'sl-1', msg: 'GENESIS64 poll OK — 55 conveyance assets updated',       ts: '10:05', level: 'info' },
  { id: 'sl-2', msg: 'ELV-07 overload event — critical alarm raised',          ts: '09:12', level: 'err'  },
  { id: 'sl-3', msg: 'T1-E03 fault received — escalator stopped, WO raised',  ts: '09:38', level: 'err'  },
  { id: 'sl-4', msg: 'GENESIS64 feed timeout — comms alarm generated',         ts: '08:50', level: 'warn' },
  { id: 'sl-5', msg: 'MW-02 maintenance mode flag set — dashboard updated',    ts: '08:22', level: 'info' },
  { id: 'sl-6', msg: 'Daily KPI aggregation complete — availability 96.4%',    ts: '00:00', level: 'info' },
];

const RECENT_EVENTS: SubsystemEvent[] = [
  { id: 'e-1', title: 'UC-CMS-06: ELV-07 overload — safety stop triggered',    type: 'alert',         severity: 'warn', timestamp: '09:12' },
  { id: 'e-2', title: 'UC-CMS-04: T1-E03 fault — escalator out-of-service',   type: 'alert',         severity: 'warn', timestamp: '09:38' },
  { id: 'e-3', title: 'UC-CMS-07: GENESIS64 comms loss — 3 min gap',          type: 'alert',         severity: 'warn', timestamp: '08:50' },
  { id: 'e-4', title: 'UC-CMS-05: MW-02 entered maintenance mode',            type: 'maintenance',   severity: 'ok',   timestamp: '08:22' },
  { id: 'e-5', title: 'UC-CMS-08: Morning KPI report generated',              type: 'system',        severity: 'ok',   timestamp: '07:00' },
  { id: 'e-6', title: 'UC-CMS-02: ELV-20 onboarded — new elevator commissioned',type: 'system',      severity: 'ok',   timestamp: 'Yesterday' },
];

const WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-CMS-031', title: 'ELV-07 overload relay inspection & reset',       status: 'In Progress', priority: 'High',   assignee: 'Minh Tran',   date: 'Due today' },
  { id: 'WO-CMS-032', title: 'T1-E03 escalator step/chain fault diagnosis',    status: 'Open',        priority: 'High',   assignee: 'Hieu Nguyen', date: 'Due today' },
  { id: 'WO-CMS-030', title: 'GENESIS64 IB link stability investigation',      status: 'Open',        priority: 'Medium', assignee: 'Binh Le',     date: 'Due Apr 18' },
  { id: 'WO-CMS-028', title: 'Quarterly lubrication — escalators Pier A',      status: 'Completed',   priority: 'Low',    assignee: 'Nam Pham',    date: '3 days ago' },
];

const COMPONENT_STATUS: ComponentStatus[] = [
  { name: 'Elevators — Terminal 1 (ELV-01–10)', status: 'Critical',    details: 'ELV-07 overload stop' },
  { name: 'Elevators — Terminal 2 (ELV-11–20)', status: 'Operational', details: '10/10 units running' },
  { name: 'Escalators — Terminal 1 (ESC-01–08)',status: 'Critical',    details: 'T1-E03 fault' },
  { name: 'Escalators — Terminal 2 (ESC-09–15)',status: 'Operational', details: '7/7 units running' },
  { name: 'Moving Walks (MW-01–07)',            status: 'Warning',     details: 'MW-02 maintenance mode' },
  { name: 'GENESIS64 Integration',             status: 'Warning',     details: 'Recent 3-min comms gap' },
  { name: 'IB Data Feed',                      status: 'Operational', details: 'Restored — feed stable' },
  { name: 'Alarm & SOP Engine',               status: 'Operational', details: 'All emergency workflows armed' },
];

const INTEGRATION_LOG: IntegrationEntry[] = [
  { id: 'il-1', ref: 'GENESIS64', msg: 'Asset state poll — 55 records updated',          ts: '10:05', status: 'ok'      },
  { id: 'il-2', ref: 'ELV-07',   msg: 'Overload safety event — critical alarm raised',   ts: '09:12', status: 'updated' },
  { id: 'il-3', ref: 'T1-E03',   msg: 'Fault event — escalator alarm created',           ts: '09:38', status: 'updated' },
  { id: 'il-4', ref: 'GENESIS64',msg: 'Feed timeout 3 min — comms alarm generated',      ts: '08:50', status: 'err'     },
  { id: 'il-5', ref: 'MW-02',    msg: 'Maintenance mode flag — dashboard updated',       ts: '08:22', status: 'updated' },
  { id: 'il-6', ref: 'IB/CMS',   msg: 'Nightly KPI aggregation complete',                ts: '00:00', status: 'synced'  },
];

const CMSDetails: React.FC = () => (
  <SubsystemPage
    subsystemName="Conveyance Monitoring System"
    subsystemCode="cms"
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

export default CMSDetails;
