/**
 * Building Systems (HBMS) console.
 *
 * Home for the ported HBMS screens. The source was a routed SPA with a
 * left rail of subsystems and separate /alerts, /incidents, /sop,
 * /work-orders and /assets routes; here those become console tabs and a
 * subsystem strip, driven by the HBMS store rather than a router, so the
 * screens keep addressing each other exactly as they did — an alert can
 * still open the SOP library, a KPI card still opens the work-order screen
 * filtered to its subsystem, and SCADA's equipment overview still drills
 * into the asset register filtered by device type.
 *
 * Everything renders inside `.hbms-root`, which is where the HBMS design
 * tokens are redefined in TAMS colours (see hbms.css).
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Boxes, FileText, Grid3x3, LayoutGrid, ShieldAlert, Wrench } from 'lucide-react';

import './hbms.css';
import { useNavStore } from '../store/useNavStore';
import { useHbmsStore, type HbmsView } from './store/useHbmsStore';
import { AHURuntimeProvider } from './AHURuntimeContext';
import { HBMS_SUBSYSTEMS, subsystemByCode } from './subsystems/catalog';

import AlertManagement from './pages/AlertManagement';
import IncidentManagement from './pages/IncidentManagement';
import SOPManagement from './pages/SOPManagement';
import AssetList from './pages/AssetList';
import WorkOrderManager from './components/WorkOrderManager';
import CommChannelStatus from './components/CommChannelStatus';
import HBMSNetworkTopology from './components/HBMSNetworkTopology';
import HbmsDashboard from './components/HbmsDashboard';

interface HbmsTab {
  id: HbmsView;
  label: string;
  icon: React.ElementType;
}

const TABS: HbmsTab[] = [
  { id: 'subsystems', label: 'Subsystems', icon: LayoutGrid },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { id: 'sop', label: 'SOPs', icon: FileText },
  { id: 'work-orders', label: 'Work Orders', icon: Wrench },
  { id: 'assets', label: 'Asset Register', icon: Boxes },
];

/** The subsystem strip — the source's left rail, laid out horizontally so the
 *  detail page below keeps the full width it was designed against. */
const SubsystemStrip: React.FC = () => {
  const code = useHbmsStore((s) => s.subsystem);
  const openSubsystem = useHbmsStore((s) => s.openSubsystem);
  const showAllSubsystems = useHbmsStore((s) => s.showAllSubsystems);
  const role = useHbmsStore((s) => s.role);

  // LBMS Admin is scoped to its own subsystem everywhere in the source; the
  // strip enforces the same scoping the sidebar used to.
  const shown = role === 'LBMS Admin'
    ? HBMS_SUBSYSTEMS.filter((s) => s.acronym === 'LBMS')
    : HBMS_SUBSYSTEMS;

  return (
    <div className="fs-chrome flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 pb-1.5">
      {/* The console lands on all twelve; this chip is the way back to them. */}
      <button
        onClick={showAllSubsystems}
        title="All building subsystems"
        className={`chip text-[length:calc(11px*var(--fs))] font-semibold whitespace-nowrap ${code === null ? 'chip-active' : ''}`}
      >
        <Grid3x3 className="w-3.5 h-3.5" />
        All
      </button>
      <span className="w-px self-stretch bg-primary-500/40 mx-0.5 shrink-0" />
      {shown.map((s) => {
        const active = s.code === code;
        return (
          <button
            key={s.id}
            onClick={() => openSubsystem(s.code)}
            title={`${s.name} — ${s.availability}% availability`}
            className={`chip text-[length:calc(11px*var(--fs))] font-semibold whitespace-nowrap ${active ? 'chip-active' : ''}`}
          >
            <span style={{ color: active ? undefined : s.color }}>{s.icon}</span>
            {s.acronym}
            {s.alertCount > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-status-error/20 text-status-error text-[length:calc(9px*var(--fs))] font-bold">
                {s.alertCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/** Right-hand comms widget — the source showed the multi-subsystem topology
 *  to Super Admin and the LBMS-only pipe to everyone else. */
const CommsWidget: React.FC<{ onStatusChange?: (o: Record<number, 'ok' | 'down'>) => void }> = ({ onStatusChange }) => {
  const role = useHbmsStore((s) => s.role);
  const lbms = HBMS_SUBSYSTEMS.find((s) => s.acronym === 'LBMS')!;

  return role === 'Super Admin'
    ? <HBMSNetworkTopology subsystems={HBMS_SUBSYSTEMS} onStatusChange={onStatusChange} />
    : <CommChannelStatus lbmsAvailability={lbms.availability} lbmsAlertCount={lbms.alertCount} />;
};

/** The console's own tab bar. The shared ConsoleTabs portals into the
 *  header's single slot, which the Terminal console this sits inside already
 *  owns — so this renders inline, in the same pill style. */
const HbmsTabs: React.FC<{ active: HbmsView; onChange: (id: HbmsView) => void }> = ({ active, onChange }) => (
  <nav className="fs-chrome flex items-center gap-1 rounded-full bg-primary-700/95 backdrop-blur border border-primary-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.45)] px-1.5 py-1 self-start shrink-0">
    {TABS.map(({ id, label, icon: Icon }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`relative flex items-center gap-2 px-3.5 py-1 rounded-full text-[length:calc(13px*var(--fs))] whitespace-nowrap transition-colors ${
            isActive ? 'text-primary-900 font-semibold' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="hbms-tab"
              className="absolute inset-0 rounded-full bg-accent-blue"
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            />
          )}
          <Icon className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">{label}</span>
        </button>
      );
    })}
  </nav>
);

const HbmsConsole: React.FC = () => {
  // The network topology widget's demo-only "take a subsystem offline"
  // overrides now live in HbmsDashboard, next to the subsystem cards whose
  // Last-Data-Received badges they flip — the two have to move together, and
  // holding the state up here only worked while the cards were up here too.
  const view = useHbmsStore((s) => s.view);
  const go = useHbmsStore((s) => s.go);
  const code = useHbmsStore((s) => s.subsystem);

  // Same one-shot hand-off from the AI copilot as the other consoles.
  const subTab = useNavStore((s) => s.subTab);
  const clearSubTab = useNavStore((s) => s.clearSubTab);
  useEffect(() => {
    if (subTab && TABS.some((t) => t.id === subTab)) {
      go(subTab as HbmsView);
      clearSubTab();
    }
  }, [subTab, clearSubTab, go]);

  const entry = code ? subsystemByCode(code) : undefined;
  const Detail = entry?.component;

  return (
    <AHURuntimeProvider>
      <div className="hbms-root flex flex-col h-full min-h-0 gap-2">
        <HbmsTabs active={view} onChange={go} />

        {view === 'subsystems' && (
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-start gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <SubsystemStrip />
              </div>
            </div>
            {/* The detail template manages its own internal scroll regions and
                expects to own the full remaining height, as it did in the
                source app's content area. With nothing selected the console
                lands on the full dashboard — real map, subsystem grid, alert
                rail and summary tiles — which is the Long Thanh landing view
                rebuilt here (see HbmsDashboard). */}
            <div className="flex-1 min-h-0">
              {Detail && entry
                ? <Detail key={entry.code} />
                : <HbmsDashboard />}
            </div>
          </div>
        )}

        {view === 'alerts' && (
          <div className="flex-1 min-h-0 flex gap-3">
            <div className="flex-1 min-w-0"><AlertManagement /></div>
            <div className="w-[260px] shrink-0 overflow-y-auto no-scrollbar"><CommsWidget /></div>
          </div>
        )}

        {view === 'incidents' && <div className="flex-1 min-h-0"><IncidentManagement /></div>}
        {view === 'sop' && <div className="flex-1 min-h-0"><SOPManagement /></div>}
        {view === 'work-orders' && <div className="flex-1 min-h-0"><WorkOrderManager /></div>}
        {view === 'assets' && <div className="flex-1 min-h-0"><AssetList /></div>}
      </div>
    </AHURuntimeProvider>
  );
};

export default HbmsConsole;
