/**
 * The building-management landing dashboard — what a Super Admin sees first.
 *
 * This is the Long Thanh HBMS dashboard rebuilt for TAMS: the same information
 * architecture the customer has already signed off on, so the two demos read as
 * one product rather than two projects that happen to share a logo.
 *
 *   left  (7fr)  real map on top, all twelve subsystem cards under it
 *   right (2fr)  live toast · recent alerts · comms topology · two KPI tiles
 *
 * ── What changed from Long Thanh, and why ──────────────────────────────────
 * Long Thanh opened on `FloorPlanGrid` — five CAD floor plans as images, one
 * clickable per floor, handing over to a Leaflet CRS.Simple canvas and then to
 * a single reused `1F_zone_23.png` for every zone on every level. That was
 * agreed to be dropped here: this console uses the real georeferenced map
 * shared `TerminalMap` instead — real vector basemap, real terminal outlines
 * from OSM, and an overview -> terminal -> zone -> asset drill-down, so a pin
 * sits on actual ground rather than on a drawing.
 *
 * Everything else is deliberately the same shape as the source: the alert list
 * deep-links into the subsystem that raised it (and, when the alert names one
 * unit, straight to that unit); Super Admin gets the network topology widget
 * and everyone else the single LBMS pipe; and the two summary tiles are System
 * Health — which opens the formula behind it, because a headline number nobody
 * can derive is a number nobody trusts — and Alerts, which is a shortcut to the
 * list rather than a trend.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Maximize2, Minimize2, X } from 'lucide-react';

import { HBMS_SUBSYSTEMS } from '../subsystems/catalog';
import { useHbmsStore } from '../store/useHbmsStore';
import TerminalMap from './TerminalMap';
import CommChannelStatus from './CommChannelStatus';
import HBMSNetworkTopology from './HBMSNetworkTopology';
import SubsystemOverviewGrid from './SubsystemOverviewGrid';

interface DashboardAlert {
  id: string;
  subsystemId: number;
  subsystem: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  /** Minutes ago, so the list ages as the demo runs rather than sitting still. */
  minutesAgo: number;
  /** Set when the alert traces to one unit — the click then lands on that unit
   *  in the LBMS AHU grid rather than on the subsystem's front page. */
  assetId?: string;
}

/**
 * ALT-004 names a real unit in the AHU fleet, so the alert list and the map's
 * asset pins agree on which thing is broken. Everything else is background noise, which is
 * what a real alert list mostly is.
 */
const RECENT_ALERTS: DashboardAlert[] = [
  { id: 'ALT-001', subsystemId: 9,  subsystem: 'BHS',   severity: 'Critical', message: 'Conveyor jam detected in sorting unit 3', minutesAgo: 5 },
  { id: 'ALT-002', subsystemId: 9,  subsystem: 'BHS',   severity: 'Critical', message: 'Baggage tag scan failure rate >5% threshold', minutesAgo: 8 },
  { id: 'ALT-003', subsystemId: 10, subsystem: 'SCADA', severity: 'High',     message: 'Lighting control fault in apron zone 5 (SCADA)', minutesAgo: 12 },
  { id: 'ALT-004', subsystemId: 5,  subsystem: 'LBMS',  severity: 'High',     message: 'AHU-306-1F-EXT1 trip detected — Zone 23, 1st Floor (HVAC offline)', minutesAgo: 18, assetId: 'AHU-306-1F-EXT1' },
  { id: 'ALT-005', subsystemId: 10, subsystem: 'SCADA', severity: 'Medium',   message: 'Power consumption spike in HDR-12 (>92% capacity)', minutesAgo: 25 },
];

const SEVERITY_STYLES: Record<DashboardAlert['severity'], { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5', border: 'rgba(239,68,68,0.3)',  dot: '#ef4444' },
  High:     { bg: 'rgba(249,115,22,0.12)', text: '#fdba74', border: 'rgba(249,115,22,0.3)', dot: '#f97316' },
  Medium:   { bg: 'rgba(234,179,8,0.12)',  text: '#fde047', border: 'rgba(234,179,8,0.3)',  dot: '#eab308' },
  Low:      { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', border: 'rgba(59,130,246,0.3)', dot: '#3b82f6' },
};

/* ------------------------------------------------------------------ modal */

/**
 * The arithmetic behind the System Health headline.
 *
 * Worth a modal of its own: the first question anyone senior asks a dashboard
 * is where its top-line number came from, and "the mean of twelve subsystem
 * availabilities, here they are" is a much better answer than a tooltip.
 */
const SystemHealthFormulaModal: React.FC<{ value: number; onClose: () => void }> = ({ value, onClose }) => (
  <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div
      className="w-full max-w-lg rounded-2xl border border-accent-teal/40 bg-primary-800 p-5 max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-lg font-bold text-text-primary">How System Health is calculated</h3>
        <div className="flex-1" />
        <button onClick={onClose} className="p-1 rounded hover:bg-primary-700 text-text-muted hover:text-text-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-3">
        The unweighted mean of every monitored subsystem's availability over the
        last 24 hours. Unweighted deliberately — a fire alarm system carries the
        same weight as a master clock, because a single figure that quietly
        discounts life safety is worse than no figure at all.
      </p>

      <div className="rounded-lg border border-primary-500/50 bg-primary-900/50 p-3 mb-3 font-mono text-xs text-accent-teal">
        health = Σ(availability) ÷ {HBMS_SUBSYSTEMS.length} = {value.toFixed(2)}%
      </div>

      <div className="space-y-1">
        {HBMS_SUBSYSTEMS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span className="w-16 font-semibold" style={{ color: s.color }}>{s.acronym}</span>
            <span className="flex-1 text-text-muted truncate">{s.name}</span>
            <span className="font-mono text-text-secondary">{s.availability.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------- dashboard */

const HbmsDashboard: React.FC = () => {
  const role = useHbmsStore((s) => s.role);
  const openSubsystem = useHbmsStore((s) => s.openSubsystem);
  const openAlerts = useHbmsStore((s) => s.openAlerts);

  const [mapMaximized, setMapMaximized] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const [showHealthFormula, setShowHealthFormula] = useState(false);
  const [forcedDown, setForcedDown] = useState<Record<number, 'ok' | 'down'>>({});

  // LBMS Admin is scoped to its own subsystem everywhere in the source app, and
  // that scoping has to reach the alert list too or the role leaks.
  const isLbmsAdmin = role === 'LBMS Admin';
  const subsystems = useMemo(
    () => (isLbmsAdmin ? HBMS_SUBSYSTEMS.filter((s) => s.acronym === 'LBMS') : HBMS_SUBSYSTEMS),
    [isLbmsAdmin],
  );
  const alerts = useMemo(
    () => (isLbmsAdmin ? RECENT_ALERTS.filter((a) => a.subsystem === 'LBMS') : RECENT_ALERTS),
    [isLbmsAdmin],
  );

  useEffect(() => {
    if (!showToast) return;
    const t = window.setTimeout(() => setShowToast(false), 10000);
    return () => window.clearTimeout(t);
  }, [showToast]);

  // Escape leaves fullscreen. Unwinding the map's own drill-down is the map's
  // job now — it owns that state, and its breadcrumb is the way back out.
  useEffect(() => {
    if (!mapMaximized) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapMaximized(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [mapMaximized]);

  const total = subsystems.length;
  const health = subsystems.reduce((sum, s) => sum + s.availability, 0) / total;
  const operational = subsystems.filter((s) => s.availability >= 95).length;
  const warning = subsystems.filter((s) => s.availability >= 90 && s.availability < 95).length;
  const down = total - operational - warning;

  const totalAlerts = subsystems.reduce((sum, s) => sum + s.alertCount, 0);
  const critical = alerts.filter((a) => a.severity === 'Critical').length;
  const high = alerts.filter((a) => a.severity === 'High').length;
  const medium = alerts.filter((a) => a.severity === 'Medium').length;

  const openAlert = (alert: DashboardAlert) => {
    const entry = HBMS_SUBSYSTEMS.find((s) => s.id === alert.subsystemId);
    if (!entry) return;
    openSubsystem(
      entry.code,
      alert.assetId ? { openAhuGrid: true, ahuAssetId: alert.assetId } : undefined,
    );
  };

  const map = (
    <div className="w-full h-full relative">
      {/* The shared terminal map — the same component, and the same
          overview -> terminal -> zone -> asset flow, that every subsystem page
          now gets. It owns its own level selector, legend and basemap toggle,
          so the dashboard only adds the one control that is about the panel
          rather than the map. */}
      <TerminalMap subsystem="LBMS" />

      <button
        onClick={() => setMapMaximized((m) => !m)}
        title={mapMaximized ? 'Minimize map (Esc)' : 'Maximize map'}
        className="fs-chrome absolute z-[1002] bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:brightness-125"
        style={{ background: 'rgba(8,12,32,0.92)', borderColor: 'rgba(255,255,255,0.12)', color: '#e2e8f0', backdropFilter: 'blur(14px)' }}
      >
        {mapMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        {mapMaximized ? 'Minimize' : 'Maximize'}
      </button>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden gap-2">

      {/* ── Left: map over the subsystem grid ── */}
      <div className="flex-[7] min-w-0 flex flex-col overflow-hidden">
        <div
          className={mapMaximized ? 'fixed inset-0 z-[2000] overflow-hidden' : 'rounded-2xl overflow-hidden shrink-0 relative'}
          style={mapMaximized ? undefined : { flex: '0 0 58%' }}
        >
          {map}
        </div>

        {!mapMaximized && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-2">
            <SubsystemOverviewGrid forcedDown={forcedDown} />
          </div>
        )}
      </div>

      {/* ── Right: alerts, comms, summary ── */}
      <div className="flex-[2] shrink-0 flex flex-col gap-2 overflow-hidden" style={{ minWidth: 260, maxWidth: 340 }}>

        {showToast && alerts[0] && (
          <div
            className="shrink-0 flex items-start gap-2 rounded-xl p-2.5 border relative"
            style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-red-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-300">Just now — {alerts[0].subsystem}</p>
              <p className="text-xs text-text-muted leading-snug truncate">{alerts[0].message}</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-text-muted hover:text-text-primary shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-text-primary">Recent Alerts</span>
            {totalAlerts > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(239,68,68,0.8)' }}>
                {totalAlerts}
              </span>
            )}
          </div>
          <button
            onClick={() => openAlerts(isLbmsAdmin ? 'LBMS' : undefined)}
            className="fs-chrome text-xs text-accent-teal hover:brightness-125 font-medium"
          >
            All →
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-1 space-y-1.5">
          {alerts.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No active alerts for LBMS</p>
          )}
          {alerts.slice(0, 5).map((alert) => {
            const s = SEVERITY_STYLES[alert.severity];
            return (
              <button
                key={alert.id}
                onClick={() => openAlert(alert)}
                title={alert.assetId ? `View ${alert.assetId}` : `View ${alert.subsystem}`}
                className="w-full flex items-start gap-2 rounded-xl p-2.5 border text-left transition-all hover:brightness-125"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-sm font-bold text-text-primary">{alert.subsystem}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-snug">{alert.message}</p>
                  <p className="text-xs text-text-muted mt-0.5">{alert.minutesAgo}m ago</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="shrink-0">
          {role === 'Super Admin'
            ? <HBMSNetworkTopology subsystems={HBMS_SUBSYSTEMS} onStatusChange={setForcedDown} />
            : <CommChannelStatus
                lbmsAvailability={HBMS_SUBSYSTEMS.find((s) => s.acronym === 'LBMS')!.availability}
                lbmsAlertCount={HBMS_SUBSYSTEMS.find((s) => s.acronym === 'LBMS')!.alertCount}
              />}
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowHealthFormula(true)}
            title="View the formula and data sources behind this number"
            className="rounded-xl p-3 border text-left transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Sys Health</p>
            <p className="text-2xl font-bold text-emerald-400">{health.toFixed(1)}%</p>
            <div className="mt-2 w-full h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${(operational / total) * 100}%`, background: '#10b981' }} />
              <div style={{ width: `${(warning / total) * 100}%`, background: '#f59e0b' }} />
              <div style={{ width: `${(down / total) * 100}%`, background: '#ef4444' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-emerald-500 font-semibold">{operational} OK</span>
              <span className="text-xs text-red-400 font-semibold">{down} down</span>
            </div>
          </button>

          <button
            onClick={() => openAlerts(isLbmsAdmin ? 'LBMS' : undefined)}
            title="View all alerts"
            className="rounded-xl p-3 border text-left transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.4)' }}
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Alerts</p>
            <p className="text-2xl font-bold text-red-400">{totalAlerts}</p>
            <div className="mt-2 w-full h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${(critical / Math.max(alerts.length, 1)) * 100}%`, background: '#ef4444' }} />
              <div style={{ width: `${(high / Math.max(alerts.length, 1)) * 100}%`, background: '#f97316' }} />
              <div style={{ width: `${(medium / Math.max(alerts.length, 1)) * 100}%`, background: '#eab308' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-red-400 font-semibold">{critical} crit</span>
              <span className="text-xs text-yellow-400 font-semibold">{medium} med</span>
            </div>
          </button>
        </div>
      </div>

      {showHealthFormula && (
        <SystemHealthFormulaModal value={health} onClose={() => setShowHealthFormula(false)} />
      )}
    </div>
  );
};

export default HbmsDashboard;
