/**
 * All twelve building subsystems at once — the landing view of the Subsystems
 * tab, and what Super Admin saw first in the source app's dashboard.
 *
 * Ported from the source's "Building Subsystems" grid: one card per subsystem
 * with its availability bar, primary KPI, live Last-Data-Received badge and the
 * segmented asset bar. The card opens the subsystem's detail page; the alert
 * count opens that subsystem's alerts, and the asset bar opens the register
 * filtered to it — the same three destinations the source card had.
 *
 * Each card runs its own refresh countdown, because subsystems poll at
 * different real-world rates (life safety fast, master clock slow) — one shared
 * tick would make them all blink together, which is not what the wall looks
 * like.
 */

import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { HBMS_SUBSYSTEMS, type SubsystemEntry } from '../subsystems/catalog';
import { SUBSYSTEM_ASSET_COUNTS } from '../assets';
import { useHbmsStore } from '../store/useHbmsStore';

/** Primary KPI line per subsystem, as the source dashboard showed it. */
const SUBSYSTEM_KPI: Record<number, string> = {
  9: 'Alert: Conveyor Belt C3 running at reduced speed',
  7: 'All docking systems operational',
  11: 'All monitoring systems operational',
  10: 'Warning: High temperature detected in Zone B2',
  1: 'Alert: Door sensor offline at Gate 7',
  2: 'All announcement systems operational',
  3: 'All fire detection systems operational',
  4: 'Time sync accuracy at 99.9%',
  5: 'Warning: HVAC Unit 3 temperature deviation',
  6: 'Alert: Stand 12 status sensor offline',
  8: 'Alert: Scanner #5 requires calibration',
  13: 'Warning: Gate 15 access control delayed response',
};

const availabilityStyle = (avail: number) => {
  if (avail >= 97) return { color: '#34d399', bar: '#10b981' };
  if (avail >= 93) return { color: '#fbbf24', bar: '#f59e0b' };
  return { color: '#f87171', bar: '#ef4444' };
};

// How reliably a subsystem's link reports in. Most stay green; the two known
// noisy ones dip amber, and LBMS occasionally touches red — which is why its
// AHU trip is the alert the rest of the console is built around.
type SignalProfile = 'stable' | 'flaky' | 'unstable';
const SIGNAL_PROFILE: Partial<Record<string, SignalProfile>> = {
  LBMS: 'unstable',
  SACS: 'unstable',
  SSE: 'flaky',
};

const pickCycleBound = (profile: SignalProfile) => {
  if (profile === 'stable') return 3 + Math.floor(Math.random() * 3);
  if (profile === 'flaky') return 6 + Math.floor(Math.random() * 4);
  return Math.random() < 0.15 ? 12 + Math.floor(Math.random() * 3) : 6 + Math.floor(Math.random() * 4);
};

/** Isolated so its once-a-second re-render never touches the card's own DOM. */
const LastDataReceivedBadge: React.FC<{ acronym: string; forcedDown?: boolean }> = ({ acronym, forcedDown }) => {
  const profile = SIGNAL_PROFILE[acronym] ?? 'stable';
  const [elapsed, setElapsed] = useState(0);
  const [justReceived, setJustReceived] = useState(false);
  const cycleBoundRef = useRef(pickCycleBound(profile));

  useEffect(() => {
    if (forcedDown) return;
    const timer = window.setInterval(() => {
      setElapsed((n) => {
        if (n >= cycleBoundRef.current - 1) {
          cycleBoundRef.current = pickCycleBound(profile);
          setJustReceived(true);
          window.setTimeout(() => setJustReceived(false), 700);
          return 0;
        }
        return n + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [profile, forcedDown]);

  useEffect(() => { if (!forcedDown) setElapsed(0); }, [forcedDown]);

  if (forcedDown) {
    return (
      <span
        title="Subsystem manually taken offline (demo)"
        className="flex items-center gap-0.5 text-[length:calc(9px*var(--fs))] font-bold tabular-nums flex-shrink-0"
        style={{ color: '#f87171' }}
      >
        <RefreshCw className="w-2.5 h-2.5" /> Offline
      </span>
    );
  }

  const staleness = elapsed > 10 ? 'red' : elapsed > 5 ? 'amber' : 'ok';
  const color = justReceived ? '#34d399' : staleness === 'red' ? '#f87171' : staleness === 'amber' ? '#fbbf24' : '#8A9BA8';

  return (
    <span
      title="Seconds since this subsystem last reported"
      className="flex items-center gap-0.5 text-[length:calc(9px*var(--fs))] font-bold tabular-nums flex-shrink-0"
      style={{ color }}
    >
      <RefreshCw className="w-2.5 h-2.5" />
      {elapsed === 0 ? 'Live' : `${elapsed}s`}
    </span>
  );
};

interface CardProps {
  subsystem: SubsystemEntry;
  forcedDown?: boolean;
}

const SubsystemGridCard: React.FC<CardProps> = ({ subsystem, forcedDown }) => {
  const openSubsystem = useHbmsStore((s) => s.openSubsystem);
  const openAlerts = useHbmsStore((s) => s.openAlerts);
  const openAssets = useHbmsStore((s) => s.openAssets);

  const av = availabilityStyle(subsystem.availability);
  const ac = SUBSYSTEM_ASSET_COUNTS[subsystem.acronym] ?? { active: 0, warning: 0, inactive: 0, total: 0 };
  const pct = (n: number) => (ac.total > 0 ? (n / ac.total) * 100 : 0);

  return (
    <button
      onClick={() => openSubsystem(subsystem.code)}
      title={`${subsystem.name} — open subsystem`}
      className="glass-panel rounded-xl p-2.5 text-left transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] flex flex-col"
      style={{
        boxShadow: forcedDown || subsystem.alertCount > 0 ? 'inset 0 0 0 1px rgba(248,113,113,0.4)' : 'inset 0 0 0 1px rgba(1,163,164,0.22)',
      }}
    >
      {/* Identity + status */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${subsystem.color}18`, color: subsystem.color }}
        >
          {subsystem.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: subsystem.color }}>
            {subsystem.acronym}
          </p>
          <p className="text-[length:calc(10px*var(--fs))] truncate leading-tight" style={{ color: '#8A9BA8' }}>{subsystem.name}</p>
        </div>
        <span
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (subsystem.alertCount > 0) openAlerts(subsystem.acronym);
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: av.color }} />
          {subsystem.alertCount > 0 && (
            <span
              title={`${subsystem.alertCount} open alert${subsystem.alertCount > 1 ? 's' : ''} — open alert management`}
              className="px-1.5 py-0.5 rounded text-[length:calc(10px*var(--fs))] font-bold bg-status-error/20 text-status-error cursor-pointer hover:bg-status-error/40"
            >
              {subsystem.alertCount}
            </span>
          )}
        </span>
      </div>

      {/* Availability */}
      <div className="mb-1">
        <div className="flex justify-between text-[length:calc(10px*var(--fs))] mb-0.5">
          <span style={{ color: '#8A9BA8' }}>Avail.</span>
          <span className="font-bold" style={{ color: av.color }}>{subsystem.availability}%</span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-1.5 rounded-full" style={{ width: `${subsystem.availability}%`, background: av.bar }} />
        </div>
      </div>

      {/* Primary KPI + freshness */}
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[length:calc(10px*var(--fs))] truncate flex-1 min-w-0" style={{ color: '#8A9BA8' }}>
          {SUBSYSTEM_KPI[subsystem.id] ?? 'System operational'}
        </p>
        <LastDataReceivedBadge acronym={subsystem.acronym} forcedDown={forcedDown} />
      </div>

      {/* Assets — opens the register filtered to this subsystem */}
      {ac.total > 0 && (
        <span
          className="mt-2 pt-2 rounded-lg px-1.5 py-1.5 transition-all hover:brightness-125 block"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.03)',
            marginLeft: -4,
            marginRight: -4,
          }}
          onClick={(e) => { e.stopPropagation(); openAssets({ subsystem: subsystem.acronym }); }}
          title={`View ${ac.total} assets — ${ac.active} active, ${ac.warning} warning, ${ac.inactive} inactive`}
        >
          <span className="flex justify-between text-[length:calc(10px*var(--fs))] mb-1">
            <span style={{ color: '#8A9BA8' }}>Assets</span>
            <span className="font-bold" style={{ color: '#22C7C6' }}>{ac.active}/{ac.total} →</span>
          </span>
          <span className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <span style={{ width: `${pct(ac.active)}%`, background: '#10b981' }} />
            <span style={{ width: `${pct(ac.warning)}%`, background: '#f59e0b' }} />
            <span style={{ width: `${pct(ac.inactive)}%`, background: '#ef4444' }} />
          </span>
        </span>
      )}
    </button>
  );
};

interface Props {
  /** Subsystems a Super Admin has manually flipped offline in the topology. */
  forcedDown?: Record<number, 'ok' | 'down'>;
}

const SubsystemOverviewGrid: React.FC<Props> = ({ forcedDown = {} }) => {
  const role = useHbmsStore((s) => s.role);

  // LBMS Admin is scoped to its own subsystem everywhere in the source.
  const shown = role === 'LBMS Admin'
    ? HBMS_SUBSYSTEMS.filter((s) => s.acronym === 'LBMS')
    : HBMS_SUBSYSTEMS;

  // Availability only, deliberately — the same rule the dashboard's System
  // Health tile uses. Counting an open alert as "not operational" made this
  // header read 3/12 while the tile beside it read 11 OK, and two numbers
  // disagreeing on one screen costs more trust than either is worth. An alert
  // is a thing to action; it is not the same claim as the system being down.
  const operational = shown.filter((s) => s.availability >= 95).length;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BA8' }}>
          Building Subsystems
        </p>
        <span className="text-xs" style={{ color: '#8A9BA8' }}>
          {operational}/{shown.length} operational
        </span>
      </div>
      <div className="fs-subsystem-cards grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 stagger-in">
        {shown.map((s) => (
          <SubsystemGridCard key={s.id} subsystem={s} forcedDown={forcedDown[s.id] === 'down'} />
        ))}
      </div>
    </div>
  );
};

export default SubsystemOverviewGrid;
