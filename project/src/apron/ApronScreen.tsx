/**
 * Apron Management System console.
 *
 * Six stands across the top with their Safedock displays, the simulator
 * underneath, apron status on the right and the shared alarm strip below.
 *
 * The docking clock runs in this screen and drives the store, so an approach
 * started here keeps progressing and the whole console — graphics, VDGS
 * numbers, equipment status and alarms — moves together.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ParkingSquare } from 'lucide-react';
import StandBay from './components/StandBay';
import StandDetailPanel from './components/StandDetailPanel';
import FaultInjectionPanel from './components/FaultInjectionPanel';
import ApronRail from './components/ApronRail';
import ApronSimulator from './components/ApronSimulator';
import AlarmStrip from '../agl/components/AlarmStrip';
import { useApronStore } from './store';
import { useAiDomain } from '../ai/store';

/**
 * Stands shown at once.
 *
 * Three, not four: the fourth cell of the grid is fault injection, which now
 * sits beside the stands it acts on instead of in a strip that pushed the alarm
 * list off the bottom of the console.
 */
const PAGE_SIZE = 3;

const ApronScreen: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const selectedStandId = useApronStore((s) => s.selectedStandId);
  const select = useApronStore((s) => s.select);
  const alarms = useApronStore((s) => s.alarms);
  const now = useApronStore((s) => s.now);
  const ackAlarm = useApronStore((s) => s.ackAlarm);
  const ackAll = useApronStore((s) => s.ackAll);
  const tick = useApronStore((s) => s.tick);

  // Scopes the AI Advisory drawer to this console. The advisories used to sit
  // in the right rail beside the stand graphics, which put a model's opinion
  // where the apron's own state belongs; they now open full-width from the
  // header button, the same way the airfield lighting console works.
  useAiDomain('apron');

  /**
   * Four stands at a time, paged.
   *
   * The board of forty tiles is gone: it answered "how full is the apron" but
   * not "what is happening on this stand", and the stand graphic — the aircraft
   * docking and the bridge reaching it — is the thing worth showing. Four fit
   * side by side at a readable size, so the console pages through them the same
   * way the LBMS operator view pages the AHU fleet.
   */
  const [page, setPage] = useState(0);
  const [alarmsCollapsed, setAlarmsCollapsed] = useState(false);
  const frame = useRef<number>();
  const last = useRef<number>(performance.now());

  // Docking clock. Runs continuously rather than only while a docking is
  // active, so a docking started from any panel keeps advancing.
  useEffect(() => {
    const step = (t: number) => {
      const dt = Math.min(0.1, (t - last.current) / 1000);
      last.current = t;
      tick(dt);
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [tick]);

  const docking = stands.filter(
    (s) => s.docking !== 'idle' && s.docking !== 'docked'
  ).length;
  const occupied = stands.filter((s) => s.occupied).length;
  const contact = stands.filter((s) => s.contact).length;
  const remote = stands.length - contact;
  const outOfService = stands.filter((s) => s.maintenance).length;
  const available = stands.length - occupied - outOfService;
  const utilisation = Math.round((occupied / Math.max(1, stands.length)) * 100);
  const faults = stands.filter((s) =>
    s.vdgs.status === 'fault' || s.equipment.some((e) => e.status === 'fault'),
  ).length;

  // Anything moving or broken first, then occupied, then free — so the first
  // page is always the one worth looking at.
  const ordered = useMemo(() => {
    const rank = (st: typeof stands[number]) => {
      if (st.docking !== 'idle' && st.docking !== 'docked') return 0;
      if (st.vdgs.status === 'fault' || st.equipment.some((e) => e.status === 'fault')) return 1;
      if (st.occupied) return 2;
      return 3;
    };
    return [...stands].sort((a, b) => rank(a) - rank(b));
  }, [stands]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageStands = ordered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <ParkingSquare className="w-5 h-5 text-accent-gold" />
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Apron Management System
            </h2>
            <p className="text-[length:calc(11px*var(--fs))] text-text-muted">
              {stands.length} parking positions · {contact} contact · {remote} remote ·
              ADB SAFEGATE Safedock VDGS
            </p>
          </div>
        </div>
        {/* Capacity at a glance. An apron controller's first question is how
            many stands they have left, not how many exist. */}
        <div className="flex items-center gap-4">
          {([
            ['Available', String(available), available > 4 ? 'text-emerald-300' : 'text-amber-300'],
            ['Occupied', `${occupied}/${stands.length}`, 'text-accent-teal'],
            ['Utilisation', `${utilisation}%`, utilisation > 85 ? 'text-amber-300' : 'text-text-primary'],
            ['Docking', String(docking), docking > 0 ? 'text-amber-300' : 'text-text-muted'],
            ['Faults', String(faults), faults > 0 ? 'text-red-300' : 'text-text-muted'],
          ] as const).map(([label, value, tone]) => (
            <div key={label} className="text-right">
              <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">
                {label}
              </div>
              <div className={`text-xl font-bold font-mono ${tone}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 gap-2 overflow-y-auto no-scrollbar">
          {/* Three stands and the fault bank, one row. Anything moving or
              broken sorts to the front, so a docking or a fault is on the first
              page rather than found by paging to it. */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
            {pageStands.map((st) => (
              <StandBay
                key={st.id}
                stand={st}
                selected={selectedStandId === st.id}
                onSelect={() => select(selectedStandId === st.id ? null : st.id)}
              />
            ))}
            <FaultInjectionPanel />
          </div>

          {/* Pager */}
          <div className="flex items-center gap-2 shrink-0 px-1">
            <button
              onClick={() => setPage((n) => Math.max(0, n - 1))}
              disabled={clampedPage === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-primary-500/50 bg-primary-700/50 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  title={`Stands ${i * PAGE_SIZE + 1}–${Math.min((i + 1) * PAGE_SIZE, ordered.length)}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === clampedPage ? 'bg-accent-teal' : 'bg-primary-500/60 hover:bg-primary-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setPage((n) => Math.min(totalPages - 1, n + 1))}
              disabled={clampedPage >= totalPages - 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-primary-500/50 bg-primary-700/50 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs text-text-muted">
              Stands {clampedPage * PAGE_SIZE + 1}–{Math.min((clampedPage + 1) * PAGE_SIZE, ordered.length)} of {ordered.length}
            </span>
          </div>

          <div className="shrink-0">
            <ApronSimulator />
          </div>
        </div>

        {/* Right rail: the apron's own state. The stand faceplate is an overlay
            now, not a column, so it no longer displaces this. */}
        <div className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <ApronRail />
        </div>
      </div>

      {/* Stand faceplate — over the console, dismissed by its scrim. */}
      <AnimatePresence>{selectedStandId && <StandDetailPanel />}</AnimatePresence>

      {/* Alarm strip, fed from the apron store */}
      <div className="shrink-0 mt-3 -mx-6 -mb-6">
        <AlarmStrip
          collapsed={alarmsCollapsed}
          onToggle={() => setAlarmsCollapsed((c) => !c)}
          alarms={alarms}
          now={now}
          node="TAMS_APRON"
          onAck={ackAlarm}
          onAckAll={ackAll}
          onEscalate={() => undefined}
          onSelect={(tag) => {
            const stand = stands.find((s) => tag.startsWith(s.id.replace('-', '')));
            if (stand) select(stand.id);
          }}
        />
      </div>
    </div>
  );
};

export default ApronScreen;
