import React, { useEffect, useState } from 'react';
import { Search, Info, Plus, SlidersHorizontal, Map as MapIcon, X, Maximize2, AlertTriangle, AlertCircle, FileText, ChevronRight, ChevronLeft, CheckCircle, Download, UploadCloud } from 'lucide-react';
import TerminalMap from '../components/TerminalMap';
import FixPanel from '../components/FixPanel';
import { useHbmsStore } from '../store/useHbmsStore';

type MainTab = 'alerts' | 'incidents';
type SubsystemFilter = string; // 'all' or any HBMS acronym

const SUBSYSTEM_TABS = [
  { id: 'all',   label: 'All',   color: '#22C7C6' },
  { id: 'BHS',   label: 'BHS',   color: '#14B8A6' },
  { id: 'VDGS',  label: 'VDGS',  color: '#5FDCDA' },
  { id: 'CMS',   label: 'CMS',   color: '#14B8A6' },
  { id: 'SCADA', label: 'SCADA', color: '#01A3A4' },
  { id: 'SACS',  label: 'SACS',  color: '#DC2626' },
  { id: 'PAS',   label: 'PAS',   color: '#018587' },
  { id: 'FAS',   label: 'FAS',   color: '#EA580C' },
  { id: 'MCS',   label: 'MCS',   color: '#C09429' },
  { id: 'LBMS',  label: 'LBMS',  color: '#018587' },
  { id: 'IASS',  label: 'IASS',  color: '#059669' },
  { id: 'SSE',   label: 'SSE',   color: '#DB2777' },
  { id: 'AGAC',  label: 'AGAC',  color: '#01A3A4' },
];

const SAMPLE_ALERTS = [
  { id: 'ALLL20260417-074703932', category: 'Conveyor Jam',        subsystem: 'BHS',   subsystemLabel: 'BHS',   device: 'CONV-1 · Main Belt T1-A',      alias: 'Main Belt T1-A',      priority: 'HIGH',   status: 'In_progress', date: 'Apr 17, 2026', time: '1:17:03 PM' },
  { id: 'ALLL20260416-091234567', category: 'Scanner Offline',      subsystem: 'BHS',   subsystemLabel: 'BHS',   device: 'SCAN-1 · HBS Scanner S1',      alias: 'HBS Scanner S1',      priority: 'LOW',    status: 'In_progress', date: 'Apr 16, 2026', time: '11:29:55 AM' },
  { id: 'ALLL20260415-083001234', category: 'Access Denied Loop',   subsystem: 'SACS',  subsystemLabel: 'SACS',  device: 'RDR-2 · Biometric Reader B1',   alias: 'Biometric Reader B1', priority: 'HIGH',   status: 'In_progress', date: 'Apr 15, 2026', time: '10:59:01 AM' },
  { id: 'ALLL20260414-112345678', category: 'HVAC Temp Deviation',  subsystem: 'LBMS',  subsystemLabel: 'LBMS',  device: 'LBMS-HVAC-Z1 · Terminal Zone 1',alias: 'HVAC Zone 1',         priority: 'MEDIUM', status: 'Open',        date: 'Apr 14, 2026', time: '9:05:22 AM' },
  { id: 'ALLL20260413-074900001', category: 'Node Offline',         subsystem: 'SCADA', subsystemLabel: 'SCADA', device: 'SCADA-NODE-01 · Terminal Core',  alias: 'SCADA Core',         priority: 'HIGH',   status: 'Open',        date: 'Apr 13, 2026', time: '3:12:44 PM' },
  { id: 'ALLL20260412-083451001', category: 'Speaker Fault',        subsystem: 'PAS',   subsystemLabel: 'PAS',   device: 'SPK-A2 · Gate B Runway Spkr',   alias: 'Gate B Runway Spkr',  priority: 'MEDIUM', status: 'Open',        date: 'Apr 12, 2026', time: '8:34:51 AM' },
  { id: 'ALLL20260411-141023002', category: 'Smoke Detector Fault', subsystem: 'FAS',   subsystemLabel: 'FAS',   device: 'DET-3 · Beam Detector Z3',      alias: 'Beam Detector Z3',    priority: 'HIGH',   status: 'In_progress', date: 'Apr 11, 2026', time: '2:10:23 PM' },
  { id: 'ALLL20260410-092345003', category: 'Docking Timeout',      subsystem: 'VDGS',  subsystemLabel: 'VDGS',  device: 'VDG-D2 · VDGS Display B2',      alias: 'VDGS Display B2',     priority: 'MEDIUM', status: 'Open',        date: 'Apr 10, 2026', time: '9:23:45 AM' },
  { id: 'ALLL20260409-160023004', category: 'PTZ Camera Loss',      subsystem: 'SACS',  subsystemLabel: 'SACS',  device: 'CAM-S1 · PTZ Camera C1',        alias: 'PTZ Camera C1',       priority: 'LOW',    status: 'Open',        date: 'Apr 9, 2026',  time: '4:00:23 PM' },
  { id: 'ALLL20260408-113045005', category: 'Docking Guidance Err', subsystem: 'AGAC',  subsystemLabel: 'AGAC',  device: 'CTRL-G1 · Dock Control Unit A', alias: 'Dock Control A',      priority: 'MEDIUM', status: 'In_progress', date: 'Apr 8, 2026',  time: '11:30:45 AM' },
];

const SAMPLE_INCIDENTS = [
  { id: 'INC20260417-4759053998', title: 'Baggage Belt Jam — Terminal 1',  category: 'Equipment Fault', subsystem: 'BHS',   subsystemLabel: 'BHS',   severity: 'CRITICAL', status: 'In Progress', linked: 3, date: 'Apr 17, 2026', time: '1:19:40 PM', assignee: 'Nguyen Van A' },
  { id: 'INC20260416-8821034771', title: 'HVAC Overheat — Zone 1',         category: 'Environmental',   subsystem: 'LBMS',  subsystemLabel: 'LBMS',  severity: 'MEDIUM',   status: 'In Progress', linked: 1, date: 'Apr 16, 2026', time: '9:44:22 AM',  assignee: 'Tran Thi B' },
  { id: 'INC20260415-3302985114', title: 'SCADA Core Node Failure',        category: 'System Fault',    subsystem: 'SCADA', subsystemLabel: 'SCADA', severity: 'HIGH',     status: 'Resolved',    linked: 2, date: 'Apr 15, 2026', time: '3:05:17 PM',  assignee: 'Le Van C' },
  { id: 'INC20260414-7741209882', title: 'Biometric Reader Loop — B1',     category: 'Security',        subsystem: 'SACS',  subsystemLabel: 'SACS',  severity: 'MEDIUM',   status: 'In Progress', linked: 5, date: 'Apr 14, 2026', time: '10:22:08 AM', assignee: 'Pham Thi D' },
  { id: 'INC20260413-6612095001', title: 'Beam Detector False Trigger — Z3',category: 'Safety',         subsystem: 'FAS',   subsystemLabel: 'FAS',   severity: 'HIGH',     status: 'In Progress', linked: 2, date: 'Apr 13, 2026', time: '2:10:23 PM',  assignee: 'Hoang Van E' },
];

const priorityStyle = (p: string) => {
  if (p === 'CRITICAL' || p === 'HIGH') return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.3)' };
  if (p === 'MEDIUM') return { bg: 'rgba(245,158,11,0.15)', color: '#fde68a', border: 'rgba(245,158,11,0.3)' };
  return { bg: 'rgba(1,163,164,0.15)', color: '#9BEAE8', border: 'rgba(1,163,164,0.3)' };
};

const statusDot = (s: string) => {
  if (s === 'Open') return '#ef4444';
  if (s === 'In Progress' || s === 'In_progress') return '#f59e0b';
  if (s === 'Resolved') return '#10b981';
  return '#8A9BA8';
};

const inputCls = 'w-full px-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-accent-blue/50';
const inputStyle = { background: 'var(--app-surface-soft)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--app-text)' };

const AlertManagement: React.FC = () => {
  // Was react-router + the mock auth context; both now live in the console
  // store, with the ?subsystem= seed read once on mount and then cleared.
  const go = useHbmsStore((s) => s.go);
  const currentRole = useHbmsStore((s) => s.role);
  const [linkedSubsystem] = useState(() => useHbmsStore.getState().alertFilter);
  const consumeAlertFilter = useHbmsStore((s) => s.consumeAlertFilter);
  useEffect(() => { consumeAlertFilter(); }, [consumeAlertFilter]);
  // LBMS Admin is scoped to the LBMS subsystem only everywhere else in the
  // app (Sidebar, Dashboard) — this page used to leave that unenforced: the
  // full subsystem tab bar was always shown and every subsystem's alerts
  // stayed selectable regardless of role, a real cross-subsystem data leak.
  const isLbmsAdmin = currentRole === 'LBMS Admin';

  const [mainTab, setMainTab] = useState<MainTab>('alerts');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemFilter>(
    isLbmsAdmin ? 'LBMS' : (linkedSubsystem ?? 'all'),
  );
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<(typeof SAMPLE_ALERTS)[number] | null>(null);

  const openAlertDetails = (alert: (typeof SAMPLE_ALERTS)[number]) => {
    setSelectedAlert(alert);
    setShowAlertDetails(true);
  };
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showLinkedIncident, setShowLinkedIncident] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'split'>('split');
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; color: string } | null>(null);

  const showFeedback = (msg: string, color = '#34d399') => {
    setActionFeedback({ msg, color });
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const visibleTabs = isLbmsAdmin ? SUBSYSTEM_TABS.filter(t => t.id === 'LBMS') : SUBSYSTEM_TABS;
  const effectiveFilter: SubsystemFilter = subsystemFilter;

  // Scoped at the data level too, not just the tab bar — subsystemFilter
  // could otherwise still be forced to something else (a stale ?subsystem=
  // param, Reset Filters) and leak other subsystems' alerts through.
  const scopedAlerts = isLbmsAdmin ? SAMPLE_ALERTS.filter(a => a.subsystem === 'LBMS') : SAMPLE_ALERTS;
  const scopedIncidents = isLbmsAdmin ? SAMPLE_INCIDENTS.filter(i => i.subsystem === 'LBMS') : SAMPLE_INCIDENTS;

  const filteredAlerts = effectiveFilter === 'all'
    ? scopedAlerts
    : scopedAlerts.filter(a => a.subsystem === effectiveFilter);
  const filteredIncidents = effectiveFilter === 'all'
    ? scopedIncidents
    : scopedIncidents.filter(i => i.subsystem === effectiveFilter);

  return (
    <div className="h-full flex flex-col text-text-primary" style={{ background: 'var(--app-bg)' }}>

      {/* Header */}
      <div className="px-6 py-3 flex justify-between items-center flex-shrink-0" style={{ background: 'var(--app-panel)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg p-1 bg-primary-800/40">
            {(['alerts', 'incidents'] as MainTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                className={`chip capitalize ${mainTab === tab ? 'chip-active' : ''}`}
              >
                {tab === 'alerts' ? 'Alert Management' : 'Incident Management'}
              </button>
            ))}
          </div>
          <span className="text-xs text-text-muted flex items-center gap-1">
            Updated: {new Date().toLocaleTimeString()} <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="chip">
            <SlidersHorizontal className="w-4 h-4" />
            Configure Table View
          </button>
          {mainTab === 'incidents' && (
            <button className="chip">
              View Self
            </button>
          )}
          {mainTab === 'alerts' && (
            <button className="chip">
              Group
            </button>
          )}
          <button
            onClick={() => mainTab === 'alerts' ? setShowCreateAlert(true) : setShowCreateIncident(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent-blue hover:bg-accent-blueHover text-white rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {mainTab === 'alerts' ? 'Create Alert' : 'Create Incident'}
          </button>
          <button className="text-xs text-accent-blue font-medium hover:text-accent-blue transition-colors" onClick={() => setSubsystemFilter('all')}>Reset Filters</button>
        </div>
      </div>

      {/* Subsystem Tabs */}
      <div className="px-6 flex items-center gap-0 overflow-x-auto flex-shrink-0" style={{ background: 'var(--app-bg)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubsystemFilter(tab.id)}
            className={`text-xs font-bold whitespace-nowrap px-4 py-3 border-b-2 transition-colors`}
            style={effectiveFilter === tab.id
              ? { borderColor: tab.color, color: tab.color }
              : { borderColor: 'transparent', color: '#8A9BA8' }}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2">
          <span className="text-[length:calc(10px*var(--fs))] text-text-muted">
            {mainTab === 'alerts' ? `${filteredAlerts.length} alerts` : `${filteredIncidents.length} incidents`}
          </span>
        </div>
      </div>

      {/* Alerts Tab */}
      {mainTab === 'alerts' && (
        <>
          {/* Filters */}
          <div className="px-6 py-3 flex-shrink-0" style={{ background: 'var(--app-surface-soft)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[length:calc(10px*var(--fs))] font-semibold text-text-muted uppercase tracking-wider mb-2">Filters</div>
            <div className="grid grid-cols-5 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Search Device Name" className={`${inputCls} pl-9 w-full`} style={inputStyle} />
              </div>
              <input type="text" placeholder="Date Range" className={`${inputCls} w-full`} style={inputStyle} defaultValue="4/7/2026 - 4/21/2026" />
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Category</option><option>All</option></select>
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Priority</option><option>All</option></select>
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Status</option><option>All</option></select>
            </div>
          </div>

          {/* Table + Map */}
          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs font-semibold text-text-secondary uppercase sticky top-0 z-10" style={{ background: 'var(--app-panel)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <tr>
                      <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" style={{ accentColor: '#3B82F6' }} /></th>
                      <th className="px-4 py-3">Alert Category</th>
                      <th className="px-4 py-3">Device Name</th>
                      <th className="px-4 py-3">Subsystem</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Creation Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert, idx) => {
                      const ps = priorityStyle(alert.priority);
                      return (
                        <tr key={idx} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onClick={() => openAlertDetails(alert)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3"><input type="checkbox" className="rounded" style={{ accentColor: '#3B82F6' }} /></td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-text-primary">{alert.category}</div>
                            <div className="text-[length:calc(10px*var(--fs))] text-text-muted uppercase mt-0.5">{alert.subsystemLabel}</div>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{alert.device}</td>
                          <td className="px-4 py-3">
                            <span className="text-[length:calc(10px*var(--fs))] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(1,163,164,0.15)', color: '#5FDCDA', border: '1px solid rgba(1,163,164,0.25)' }}>{alert.subsystemLabel}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 font-bold text-[length:calc(10px*var(--fs))] rounded" style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{alert.priority}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs flex items-center gap-1.5 text-text-secondary">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusDot(alert.status) }} />
                              {alert.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            <div>{alert.date},</div>
                            <div>{alert.time}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-text-muted">
                            <button className="hover:text-text-primary mr-2" onClick={e => { e.stopPropagation(); openAlertDetails(alert); }}><Info className="w-4 h-4 inline" /></button>
                            <button className="hover:text-text-primary"><CheckCircle className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAlerts.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-text-muted text-sm">No alerts for this subsystem</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 flex justify-between items-center text-sm text-text-muted flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--app-panel)' }}>
                <div>Items per page <select className="ml-2 rounded px-1 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8A9BA8' }}><option>25</option></select></div>
                <div>1–{filteredAlerts.length} of {filteredAlerts.length}</div>
              </div>
            </div>

            {viewMode === 'split' && (
              <div className="w-1/3 relative" style={{ background: 'var(--app-surface-soft)' }}>
                <TerminalMap subsystem={subsystemFilter === 'all' ? 'LBMS' : subsystemFilter} compact />
                <button onClick={() => setViewMode('list')} className="absolute top-4 right-4 p-1.5 rounded-md shadow-md z-[1001] text-text-secondary hover:text-white" style={{ background: 'rgba(7,16,40,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Incidents Tab */}
      {mainTab === 'incidents' && (
        <>
          <div className="px-6 py-3 flex-shrink-0" style={{ background: 'var(--app-surface-soft)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[length:calc(10px*var(--fs))] font-semibold text-text-muted uppercase tracking-wider mb-2">Filters</div>
            <div className="grid grid-cols-5 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Search Incident Title" className={`${inputCls} pl-9 w-full`} style={inputStyle} />
              </div>
              <input type="text" placeholder="Date Range" className={`${inputCls} w-full`} style={inputStyle} defaultValue="4/7/2026 - 4/21/2026" />
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Category</option><option>Intrusion</option><option>Wrong Parking</option><option>Vandalism</option></select>
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Severity</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
              <select className={`${inputCls} w-full`} style={inputStyle}><option>Select Status</option><option>Open</option><option>In Progress</option><option>Resolved</option></select>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-semibold text-text-secondary uppercase sticky top-0 z-10" style={{ background: 'var(--app-panel)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" style={{ accentColor: '#3B82F6' }} /></th>
                    <th className="px-4 py-3">Incident ID</th>
                    <th className="px-4 py-3">Title / Category</th>
                    <th className="px-4 py-3">Sub System</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Linked Alerts</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc, idx) => {
                    const ps = priorityStyle(inc.severity);
                    return (
                      <tr key={idx} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onClick={() => setShowLinkedIncident(true)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3"><input type="checkbox" className="rounded" style={{ accentColor: '#3B82F6' }} /></td>
                        <td className="px-4 py-3 text-accent-blue font-mono text-xs">{inc.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-primary">{inc.title}</div>
                          <div className="text-[length:calc(10px*var(--fs))] text-text-muted uppercase mt-0.5">{inc.category}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[length:calc(10px*var(--fs))] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(1,163,164,0.15)', color: '#5FDCDA', border: '1px solid rgba(1,163,164,0.25)' }}>{inc.subsystemLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 font-bold text-[length:calc(10px*var(--fs))] rounded" style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{inc.severity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs flex items-center gap-1.5 text-text-secondary">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusDot(inc.status) }} />
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>{inc.linked}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          <div>{inc.date},</div>
                          <div>{inc.time}</div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{inc.assignee}</td>
                        <td className="px-4 py-3 text-right text-text-muted">
                          <button className="hover:text-text-primary mr-2" onClick={e => { e.stopPropagation(); setShowLinkedIncident(true); }}><ChevronRight className="w-4 h-4 inline" /></button>
                          <button className="hover:text-text-primary"><CheckCircle className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredIncidents.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-text-muted text-sm">No incidents for this subsystem</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 flex justify-between items-center text-sm text-text-muted flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--app-panel)' }}>
              <div>Items per page <select className="ml-2 rounded px-1 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8A9BA8' }}><option>25</option></select></div>
              <div>1–{filteredIncidents.length} of {filteredIncidents.length}</div>
            </div>
          </div>
        </>
      )}

      {/* Create Alert Panel */}
      {showCreateAlert && (
        <div className="fixed inset-0 z-[1100] flex justify-end" style={{ background: 'rgba(4,16,31,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[500px] h-full flex flex-col" style={{ background: 'var(--app-panel)', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>
            <div className="px-6 py-4 flex justify-between items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-bold text-text-primary">Create Alert</h2>
              <button onClick={() => setShowCreateAlert(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="rounded-md p-3 mb-6 flex gap-2 items-start text-sm" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93C5FD' }}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Mark the location manually or search for it if Longitude and Latitude values are unavailable.</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
                {[
                  { label: 'Sub System', required: true, type: 'select' },
                  { label: 'Device Name', required: true, type: 'select' },
                  { label: 'Device Category', required: true, type: 'select' },
                  { label: 'Location', required: true, type: 'input' },
                  { label: 'Alert Category', required: true, type: 'select' },
                  { label: 'Alert Priority', required: true, type: 'select' },
                  { label: 'Latitude', required: true, type: 'input' },
                  { label: 'Longitude', required: true, type: 'input' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {f.label} {f.required && <span className="text-status-error">*</span>}
                    </label>
                    {f.type === 'select'
                      ? <select className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary"><option></option></select>
                      : <input type="text" className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary" />}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Alert Description <span className="text-status-error">*</span></label>
                  <input type="text" className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Additional Information <span className="text-text-muted">(optional)</span></label>
                  <input type="text" className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary" />
                </div>
              </div>
              <button className="chip mb-6">
                <Plus className="w-4 h-4" />Add Element
              </button>
              <div className="h-48 rounded-md overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <TerminalMap subsystem={subsystemFilter === 'all' ? 'LBMS' : subsystemFilter} compact />
              </div>
            </div>
            <div className="p-4 flex justify-between flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'var(--app-bg)' }}>
              <button className="chip">Reset</button>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateAlert(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                <button onClick={() => { setShowCreateAlert(false); showFeedback('Alert created successfully', '#34d399'); }} className="px-4 py-2 rounded text-sm font-medium text-white bg-accent-blue hover:bg-accent-blueHover transition-colors">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Details Panel */}
      {showAlertDetails && (
        <div className="fixed inset-0 z-[1100] flex justify-end" style={{ background: 'rgba(4,16,31,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[600px] h-full flex flex-col" style={{ background: 'var(--app-panel)', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>
            <div className="px-6 py-4 flex justify-between items-start flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--app-bg)' }}>
              <div>
                <h2 className="text-base font-bold text-text-primary">Alert Details</h2>
                <div className="text-[length:calc(10px*var(--fs))] text-text-muted mt-1 font-mono">
                  {selectedAlert?.id ?? '—'}
                </div>
                <div className="text-xs text-text-muted mt-0.5 flex gap-4">
                  <span>{selectedAlert ? `${selectedAlert.date}, ${selectedAlert.time}` : ''}</span>
                  <span>{selectedAlert?.subsystemLabel}</span>
                </div>
              </div>
              <button onClick={() => setShowAlertDetails(false)} className="text-text-muted hover:text-text-primary mt-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-2 flex gap-3 items-center overflow-x-auto text-xs whitespace-nowrap flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {actionFeedback && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold animate-pulse flex-shrink-0" style={{ background: `${actionFeedback.color}20`, color: actionFeedback.color, border: `1px solid ${actionFeedback.color}40` }}>
                  {actionFeedback.msg}
                </span>
              )}
              {[
                { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Escalate Alert',    color: '#f87171', action: () => showFeedback('Alert escalated', '#f87171') },
                { icon: <FileText className="w-3.5 h-3.5" />,   label: 'Create SOP',         color: '#22C7C6', action: () => { setShowAlertDetails(false); go('sop'); } },
                { icon: <FileText className="w-3.5 h-3.5" />,   label: 'Change Priority',    color: '#8A9BA8', action: () => showFeedback('Priority updated', '#fbbf24') },
                { icon: <X className="w-3.5 h-3.5" />,          label: 'Reject Alert',       color: '#8A9BA8', action: () => { showFeedback('Alert rejected', '#8A9BA8'); setTimeout(() => setShowAlertDetails(false), 1200); } },
                { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Mark as Incident',  color: '#8A9BA8', action: () => showFeedback('Marked as incident', '#34d399') },
                { icon: <Download className="w-3.5 h-3.5" />,   label: 'Download Report',    color: '#8A9BA8', action: () => showFeedback('Report downloading…', '#22C7C6') },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors hover:bg-white/5" style={{ color: btn.color }}>
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>
            <div className="px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-start text-sm">
                {[
                  { label: 'Alert Category', val: selectedAlert?.category ?? '—' },
                  { label: 'Alert Priority', val: selectedAlert?.priority ?? '—', badge: true },
                  { label: 'Status', val: (selectedAlert?.status ?? '—').toUpperCase(), dot: '#f59e0b' },
                  { label: 'Device', val: selectedAlert?.alias ?? '—' },
                  { label: 'Subsystem', val: selectedAlert?.subsystemLabel ?? '—' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-[length:calc(10px*var(--fs))] font-semibold text-text-muted mb-1">{item.label}</div>
                    {item.badge
                      ? <span className="px-2 py-0.5 bg-status-error/20 text-status-error font-bold text-[length:calc(10px*var(--fs))] rounded">{item.val}</span>
                      : item.dot
                        ? <span className="text-xs font-medium text-text-secondary flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: item.dot }} />{item.val}</span>
                        : <div className="font-medium text-text-primary text-xs">{item.val}</div>
                    }
                  </div>
                ))}
              </div>
            </div>
            <div className="flex px-6 mt-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Location', 'Associated Alerts', 'Alert Facts'].map((t, i) => (
                <button key={i} className={`px-4 py-2 text-sm font-medium ${i === 0 ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
              ))}
            </div>
            <div className="p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {/* What to do about it, before where it is. The panel used to stop
                  at describing the fault — the complaint that started this work
                  was an alert that raised and never became owned work. */}
              {selectedAlert && (
                <div className="mb-5">
                  <FixPanel
                    alertText={`${selectedAlert.category} — ${selectedAlert.device}`}
                    subsystem={selectedAlert.subsystem}
                    assetId={selectedAlert.id}
                    severity={selectedAlert.priority}
                  />
                </div>
              )}

              <h3 className="text-xs font-semibold text-text-secondary mb-2 px-3 py-1.5 rounded uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Where it is
              </h3>
              <div className="h-[240px] rounded-lg overflow-hidden relative mb-6" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <TerminalMap subsystem={selectedAlert?.subsystem ?? 'LBMS'} compact />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-secondary mb-2 px-3 py-1.5 rounded uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>Linked Incident</h3>
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-left" style={{ background: 'rgba(1,163,164,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <tr>
                        <th className="px-4 py-2 font-medium text-text-secondary">Incident Name</th>
                        <th className="px-4 py-2 font-medium text-text-secondary">Created on</th>
                        <th className="px-4 py-2 font-medium text-text-secondary">Created by</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td className="px-4 py-3 text-accent-blue font-mono text-xs">INC20260417-4759053998</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">Apr 17, 2026, 1:19:40 PM</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">anjali</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Panel */}
      {showCreateIncident && (
        <div className="fixed inset-0 z-[1100] flex justify-end" style={{ background: 'rgba(4,16,31,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[520px] h-full flex flex-col" style={{ background: 'var(--app-panel)', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>
            <div className="px-6 py-4 flex justify-between items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--app-bg)' }}>
              <div>
                <h2 className="text-base font-bold text-text-primary">Create Incident</h2>
                <p className="text-xs text-text-muted mt-0.5">Group related alerts into a coordinated response</p>
              </div>
              <button onClick={() => setShowCreateIncident(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <div className="rounded-md p-3 mb-6 flex gap-2 items-start text-sm" style={{ background: 'rgba(1,163,164,0.1)', border: '1px solid rgba(1,163,164,0.25)', color: '#9BEAE8' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>An incident groups one or more related alerts into a coordinated response workflow.</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div className="col-span-2">
                  <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Incident Title <span className="text-status-error">*</span></label>
                  <input type="text" placeholder="e.g. Perimeter Breach — Sector 4" className="w-full text-sm py-1 outline-none bg-transparent text-text-primary" />
                </div>
                {[
                  { label: 'Sub System', type: 'select', opts: [ 'LBMS', 'BHS', 'VDGS', 'CMS', 'SCADA', 'SACS', 'PAS', 'FAS', 'MCS', 'IASS', 'SSE', 'AGAC'] },
                  { label: 'Incident Category', type: 'select', opts: ['Intrusion', 'Wrong Parking', 'Vandalism', 'Equipment Failure'] },
                  { label: 'Severity', type: 'select', opts: ['Critical', 'High', 'Medium', 'Low'] },
                  { label: 'Assign To', type: 'select', opts: ['Siti Aminah', 'Rajesh Kumar', 'Ahmad Fauzi', 'Nurul Hana'] },
                  { label: 'Location', type: 'input', opts: [] },
                  { label: 'Expected Resolution', type: 'date', opts: [] },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{f.label}</label>
                    {f.type === 'select'
                      ? <select className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary"><option></option>{f.opts.map(o => <option key={o}>{o}</option>)}</select>
                      : <input type={f.type} className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary" />}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-[length:calc(10px*var(--fs))] text-text-muted mb-1 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>Description <span className="text-status-error">*</span></label>
                  <textarea rows={3} className="w-full text-sm py-1 outline-none bg-transparent text-text-secondary resize-none" placeholder="Describe the incident..." />
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary uppercase tracking-wide">Link Alerts</label>
                  <button className="text-xs text-accent-blue hover:text-accent-blue">Browse Alerts</button>
                </div>
                <div className="rounded-md p-3 text-xs text-text-muted text-center" style={{ border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                  No alerts linked. Click "Browse Alerts" to attach related alerts.
                </div>
              </div>
              <div>
                <label className="text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Attachments</label>
                <div className="rounded-md p-4 flex flex-col items-center gap-1 cursor-pointer transition-colors hover:bg-white/5" style={{ border: '1px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.02)' }}>
                  <UploadCloud className="w-5 h-5 text-text-muted" />
                  <span className="text-xs text-text-muted">Drop files here or click to upload</span>
                  <span className="text-[length:calc(10px*var(--fs))] text-text-muted">PNG, JPG, PDF up to 10MB</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'var(--app-bg)' }}>
              <button className="chip">Reset</button>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateIncident(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                <button className="px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded text-sm font-medium transition-colors">Create Incident</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Incident Panel */}
      {showLinkedIncident && (
        <div className="fixed inset-0 z-[1100] flex justify-end" style={{ background: 'rgba(4,16,31,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[640px] h-full flex flex-col" style={{ background: 'var(--app-panel)', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>
            <div className="px-6 py-4 flex justify-between items-start flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--app-bg)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-accent-blue px-2 py-0.5 rounded" style={{ background: 'rgba(1,163,164,0.12)', border: '1px solid rgba(1,163,164,0.2)' }}>INC20260417-4759053998</span>
                  <span className="px-2 py-0.5 font-bold text-[length:calc(10px*var(--fs))] rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>CRITICAL</span>
                  <span className="text-xs flex items-center gap-1 text-text-secondary"><span className="w-2 h-2 rounded-full bg-accent-blue" /> In Progress</span>
                </div>
                <h2 className="text-base font-bold text-text-primary">Intrusion Detected — Perimeter Breach</h2>
                <div className="text-xs text-text-muted mt-1">Apr 17, 2026 · Siti Aminah · CCTV SERVICE</div>
              </div>
              <button onClick={() => setShowLinkedIncident(false)} className="text-text-muted hover:text-text-primary mt-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-2 flex gap-2 items-center overflow-x-auto text-xs whitespace-nowrap flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { icon: <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34d399' }} />, label: 'Resolve' },
                { icon: <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f87171' }} />, label: 'Escalate' },
                { icon: <FileText className="w-3.5 h-3.5" />, label: 'Download Report' },
                { icon: <ChevronLeft className="w-3.5 h-3.5" />, label: 'Reassign' },
              ].map((btn, i) => (
                <button key={i} className="chip">
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
              <div>
                <h3 className="text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  Linked Alerts
                  <span className="text-[length:calc(10px*var(--fs))] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>3</span>
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'ALLL20260417-074703932', cat: 'Perimeter Motion', dev: 'CAM-SECTOR-04A', p: 'HIGH' },
                    { id: 'ALLL20260417-074901124', cat: 'Low Battery', dev: 'CAM-SECTOR-04B', p: 'MEDIUM' },
                    { id: 'ALLL20260417-075012203', cat: 'Video Loss', dev: 'CAM-SECTOR-04C', p: 'HIGH' },
                  ].map((a, i) => {
                    const ps = priorityStyle(a.p);
                    return (
                      <div key={i} className="flex items-center justify-between rounded-md px-4 py-2.5 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <span className="text-accent-blue font-mono text-xs">{a.id}</span>
                          <div className="font-medium text-text-primary mt-0.5 text-xs">{a.cat} — {a.dev}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 font-bold text-[length:calc(10px*var(--fs))] rounded" style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{a.p}</span>
                          <span className="text-xs text-text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warning" />In Progress</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary uppercase tracking-wider mb-3">Incident Location</h3>
                <div className="h-[180px] rounded-lg overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <TerminalMap subsystem={subsystemFilter === 'all' ? 'LBMS' : subsystemFilter} compact />
                  <button className="absolute top-3 left-3 z-[1001] px-3 py-1 rounded shadow text-xs font-medium flex items-center gap-1 text-text-primary" style={{ background: 'rgba(7,16,40,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    Plot Area <MapIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary uppercase tracking-wider mb-3">Activity Log</h3>
                <div className="space-y-3">
                  {[
                    { time: '1:19 PM', user: 'Siti Aminah', action: 'Created incident and linked 3 alerts', color: '#01A3A4' },
                    { time: '1:24 PM', user: 'Rajesh Kumar', action: 'Assigned to response team Bravo-2', color: '#3B82F6' },
                    { time: '1:31 PM', user: 'Ahmad Fauzi', action: 'Dispatched security unit to Sector 4', color: '#3B82F6' },
                    { time: '1:45 PM', user: 'Siti Aminah', action: 'Awaiting on-site confirmation from field team', color: '#8A9BA8' },
                  ].map((log, i, arr) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: log.color }} />
                        {i < arr.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.08)' }} />}
                      </div>
                      <div className="pb-3">
                        <span className="font-semibold text-text-secondary">{log.user}</span>
                        <span className="text-text-muted"> — {log.action}</span>
                        <div className="text-[length:calc(10px*var(--fs))] text-text-muted mt-0.5">Apr 17, 2026, {log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input type="text" placeholder="Add a comment or update..." className="flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-accent-blue/50" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#E6EEF6' }} />
                  <button className="px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded-md text-sm font-medium transition-colors">Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;
