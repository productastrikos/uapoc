/**
 * The stand faceplate — what opens when an apron alarm is clicked.
 *
 * The airfield lighting console has had this since the start: click an alarm in
 * the strip and a panel slides in with the tag's state, its alarms, and the
 * procedure that clears them. The apron console had the alarm strip but nothing
 * behind it — an operator could see that Stand 3 had a PBB fault and had
 * nowhere to go from there.
 *
 * Same shape as `LampFaceplate` deliberately, and now the same *presentation*
 * too: a scrim over the console with the panel fixed to the right edge, rather
 * than a column inside the layout. A fault is a modal moment — you stop, read
 * it, act on it — and the apron should not behave differently from the airfield
 * for the same gesture.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, X } from 'lucide-react';
import { useApronStore } from '../store';
import type { EquipStatus, Stand } from '../types';
import FixPanel from '../../hbms/components/FixPanel';

const STATUS_TONE: Record<EquipStatus, { dot: string; text: string }> = {
  active: { dot: '#34d399', text: '#6EE7B7' },
  standby: { dot: '#64748B', text: '#94A3B8' },
  fault: { dot: '#ef4444', text: '#FCA5A5' },
  offline: { dot: '#475569', text: '#64748B' },
};

const DOCKING_LABEL: Record<Stand['docking'], string> = {
  idle: 'Stand clear',
  capturing: 'Capturing',
  aligning: 'Aligning',
  closing: 'Closing on stop bar',
  stopped: 'Stopped',
  docked: 'On chocks',
  departing: 'Pushing back',
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="text-xs text-text-muted">{label}</span>
    <span className="text-xs font-medium text-text-primary text-right">{value}</span>
  </div>
);

const StandDetailPanel: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const selectedStandId = useApronStore((s) => s.selectedStandId);
  const select = useApronStore((s) => s.select);
  const alarms = useApronStore((s) => s.alarms);
  const ackAlarm = useApronStore((s) => s.ackAlarm);
  const releaseStand = useApronStore((s) => s.releaseStand);
  const startDocking = useApronStore((s) => s.startDocking);

  const stand = stands.find((s) => s.id === selectedStandId);
  if (!stand) return null;

  const tagPrefix = stand.id.replace('-', '');
  const standAlarms = alarms.filter((a) => a.tag.startsWith(tagPrefix) && a.state !== 'SHELVED');
  const faults = stand.equipment.filter((e) => e.status === 'fault');
  const vdgsFault = stand.vdgs.status === 'fault';

  // What the fix panel is asked to solve: the loudest thing wrong on this stand.
  const problem = vdgsFault
    ? `VDGS fault on ${stand.name} — docking guidance display failed`
    : faults.length > 0
      ? `${faults[0].label} fault on ${stand.name}`
      : standAlarms[0]?.description ?? `${stand.name} status review`;

  return (
    <>
      {/* Scrim: dismisses the panel and separates it from the console. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => select(null)}
        className="fixed inset-0 z-[55] bg-black/45"
      />
      <motion.aside
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="modal-surface fixed right-0 top-0 bottom-0 z-[60] w-[420px] max-w-[92vw] flex flex-col border-l border-primary-500/60 shadow-[-16px_0_48px_rgba(0,0,0,0.65)]"
      >
      <header className="flex items-center gap-2 px-3 py-2 border-b border-primary-500/40 bg-primary-900/50 shrink-0">
        <Plane className="w-4 h-4 text-accent-blue shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-text-primary leading-tight truncate">{stand.name}</div>
          <div className="text-[length:calc(10px*var(--fs))] text-text-muted">
            {stand.terminal} · {stand.contact ? 'Contact' : 'Remote'} · {stand.vdgs.model}
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => select(null)}
          className="p-1 rounded hover:bg-primary-700 text-text-muted hover:text-text-primary"
          aria-label="Close stand panel"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 space-y-3">
        {/* State */}
        <section className="rounded-lg border border-primary-500/40 bg-primary-900/40 px-3 py-2">
          <Row label="Docking" value={DOCKING_LABEL[stand.docking]} />
          <Row label="Aircraft" value={stand.aircraftType ?? '—'} />
          <Row label="Flight" value={stand.flight ?? '—'} />
          <Row
            label="Closing distance"
            value={<span className="font-mono">{stand.vdgs.closingDistance.toFixed(1)} m</span>}
          />
          <Row
            label="Chocks"
            value={stand.chocksOn ? <span className="text-status-success">On</span> : <span className="text-text-muted">Off</span>}
          />
        </section>

        {/* Equipment */}
        <section>
          <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">
            Stand services
          </h4>
          <div className="space-y-1">
            {stand.equipment.map((e) => {
              const tone = STATUS_TONE[e.status];
              return (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1 rounded bg-primary-900/40 border border-primary-500/30">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone.dot }} />
                  <span className="text-xs text-text-secondary flex-1 min-w-0 truncate">{e.label}</span>
                  {e.value && <span className="text-[length:calc(10px*var(--fs))] font-mono text-text-muted">{e.value}</span>}
                  <span className="text-[length:calc(10px*var(--fs))] font-medium capitalize" style={{ color: tone.text }}>
                    {e.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Alarms */}
        <section>
          <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">
            Active alarms
          </h4>
          {standAlarms.length === 0 ? (
            <p className="text-xs text-text-muted py-1">No active alarms on this stand.</p>
          ) : (
            <div className="space-y-1.5">
              {standAlarms.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 bg-primary-900/50 border border-status-error/25">
                  <div className="min-w-0">
                    <div className="text-xs text-status-error truncate">{a.description}</div>
                    <div className="text-[length:calc(10px*var(--fs))] text-text-muted">
                      {a.state} · {new Date(a.raisedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => ackAlarm(a.id)}
                    disabled={a.state === 'ACK'}
                    className="shrink-0 px-2 py-0.5 text-[length:calc(10px*var(--fs))] rounded bg-primary-600/60 border border-primary-500/50 text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    Ack
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* The half that fixes it. */}
        <FixPanel
          alertText={problem}
          subsystem="VDGS"
          assetId={stand.id}
          severity={vdgsFault || faults.length > 0 ? 'HIGH' : 'MEDIUM'}
          compact
        />

        {/* Stand-level actions, so the panel can also just run the turnaround. */}
        <div className="flex items-center gap-1.5">
          {stand.occupied ? (
            <button
              onClick={() => releaseStand(stand.id)}
              disabled={stand.docking === 'departing'}
              className="flex-1 px-2 py-1.5 rounded bg-primary-600/60 border border-primary-500/60 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              {stand.docking === 'departing' ? 'Pushing back…' : 'Release stand'}
            </button>
          ) : (
            <button
              onClick={() => startDocking(stand.id)}
              disabled={stand.maintenance}
              className="flex-1 px-2 py-1.5 rounded bg-accent-teal/20 border border-accent-teal/60 text-xs text-accent-teal hover:bg-accent-teal/30 disabled:opacity-40"
            >
              Start docking
            </button>
          )}
        </div>
        </div>
      </motion.aside>
    </>
  );
};

export default StandDetailPanel;
