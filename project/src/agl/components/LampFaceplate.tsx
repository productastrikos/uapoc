/**
 * Fixture faceplate.
 *
 * Deliberately mirrors the ALCMS faceplate the client has already been shown —
 * Realtime Values, Control, Alarms with Ack/Shelve, and Alarm Configuration
 * with per-alarm setpoint, unit and time delay. Keeping the same information
 * architecture means the two demos map onto each other section for section,
 * while the circuit block underneath adds what the reference does not have:
 * which series loop the fixture sits on and where in that loop it lives.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Lightbulb, Wrench, Activity, Cable } from 'lucide-react';
import { useAglStore, alarmConfigFor } from '../store';
import FixPanel from '../../hbms/components/FixPanel';
import { CATEGORY_LABEL } from '../airfield';

const StateChip: React.FC<{ label: string; tone: 'good' | 'warn' | 'bad' | 'idle' }> = ({
  label,
  tone,
}) => {
  const tones = {
    good: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    bad: 'bg-red-500/15 text-red-300 border-red-500/40',
    idle: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
};

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 bg-primary-600/40 border-l-2 border-accent-teal px-3 py-1.5 mb-2">
      {icon}
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
    </div>
    <div className="px-3">{children}</div>
  </div>
);

const LampFaceplate: React.FC = () => {
  const selectedTag = useAglStore((s) => s.selectedTag);
  const airfield = useAglStore((s) => s.airfield);
  const alarms = useAglStore((s) => s.alarms);
  const select = useAglStore((s) => s.select);
  const setLampCommand = useAglStore((s) => s.setLampCommand);
  const setIntensitySetpoint = useAglStore((s) => s.setIntensitySetpoint);
  const setMaintenanceMode = useAglStore((s) => s.setMaintenanceMode);
  const ackAlarm = useAglStore((s) => s.ackAlarm);
  const shelveAlarm = useAglStore((s) => s.shelveAlarm);
  const escalate = useAglStore((s) => s.escalateToWorkOrder);

  const fixture = selectedTag ? airfield.byId[selectedTag] : null;
  const [draftSetpoint, setDraftSetpoint] = useState('0');

  useEffect(() => {
    if (fixture) setDraftSetpoint(String(fixture.intensitySetpoint));
  }, [fixture?.id, fixture?.intensitySetpoint]);

  if (!fixture) return null;

  const circuit = airfield.circuits.find((c) => c.id === fixture.circuitId);
  const tagAlarms = alarms.filter((a) => a.tag === fixture.id && a.state !== 'SHELVED');
  const config = alarmConfigFor(fixture);

  const stateTone =
    fixture.state === 'failed' || fixture.comms === 'silent'
      ? 'bad'
      : fixture.state === 'maintenance'
      ? 'warn'
      : fixture.state === 'on'
      ? 'good'
      : 'idle';

  return (
    <>
      {/* Scrim: dismisses the faceplate and separates it from the console. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => select(null)}
        className="fixed inset-0 z-[55] bg-black/45"
      />
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="fixed right-0 top-0 bottom-0 z-[60] w-[420px] max-w-[92vw] bg-primary-800/97 backdrop-blur-md border-l border-primary-500/60 shadow-[-16px_0_48px_rgba(0,0,0,0.65)] overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary-700/95 backdrop-blur px-3 py-2.5 border-b border-primary-500/50 flex items-start justify-between">
        <div>
          <div className="text-[length:calc(11px*var(--fs))] uppercase tracking-wide text-text-muted">Faceplate</div>
          <div className="text-sm font-mono font-semibold text-accent-teal break-all">
            {fixture.id}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="text-text-muted hover:text-text-primary p-1"
          aria-label="Close faceplate"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3">
        <div className="px-3 mb-3 space-y-1">
          <div className="text-xs text-text-secondary">{fixture.description}</div>
          <div className="text-[length:calc(11px*var(--fs))] text-text-muted">
            {CATEGORY_LABEL[fixture.category]} · {fixture.product}
          </div>
        </div>

        <Section title="Realtime Values" icon={<Activity className="w-3.5 h-3.5 text-accent-teal" />}>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <dt className="text-text-secondary">Light Status</dt>
              <dd>
                <StateChip
                  label={fixture.state === 'on' ? 'On' : fixture.state === 'failed' ? 'Failed' : fixture.state === 'maintenance' ? 'Maintenance' : 'Off'}
                  tone={stateTone}
                />
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-text-secondary">LINC 360 Comms</dt>
              <dd>
                <StateChip
                  label={fixture.comms === 'reporting' ? 'Reporting' : 'No Reply'}
                  tone={fixture.comms === 'reporting' ? 'good' : 'bad'}
                />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Luminous Intensity</dt>
              <dd className="text-text-primary font-mono">
                {fixture.intensityActual.toLocaleString()} Cd
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Maintenance Mode</dt>
              <dd className="text-text-primary">{fixture.maintenanceMode ? 'On' : 'Off'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Burn Hours</dt>
              <dd className="text-text-primary font-mono">
                {fixture.burnHours.toLocaleString()} h
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Control" icon={<Lightbulb className="w-3.5 h-3.5 text-accent-gold" />}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">On / Off Command</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setLampCommand(fixture.id, true)}
                  disabled={fixture.state === 'failed'}
                  className={`px-4 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    fixture.state === 'on'
                      ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-200'
                      : 'bg-primary-600/50 border-primary-500/50 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  On
                </button>
                <button
                  onClick={() => setLampCommand(fixture.id, false)}
                  disabled={fixture.state === 'failed'}
                  className={`px-4 py-1 text-xs rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    fixture.state === 'off'
                      ? 'bg-slate-500/25 border-slate-400/60 text-slate-200'
                      : 'bg-primary-600/50 border-primary-500/50 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Off
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Luminous Intensity Level</span>
              <div className="flex items-center gap-1">
                <input
                  value={draftSetpoint}
                  onChange={(e) => setDraftSetpoint(e.target.value)}
                  onBlur={() => {
                    const v = Number(draftSetpoint);
                    if (Number.isFinite(v) && v >= 0) setIntensitySetpoint(fixture.id, v);
                  }}
                  className="w-20 bg-primary-900/80 border border-accent-teal/40 rounded px-2 py-1 text-xs font-mono text-accent-teal text-right focus:outline-none focus:border-accent-teal"
                />
                <span className="text-xs text-text-muted">Cd</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Maintenance Mode</span>
              <button
                onClick={() => setMaintenanceMode(fixture.id, !fixture.maintenanceMode)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  fixture.maintenanceMode
                    ? 'bg-purple-500/25 border-purple-400/60 text-purple-200'
                    : 'bg-primary-600/50 border-primary-500/50 text-text-secondary hover:text-text-primary'
                }`}
              >
                {fixture.maintenanceMode ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="Alarms" icon={<Wrench className="w-3.5 h-3.5 text-red-400" />}>
          {tagAlarms.length === 0 ? (
            <p className="text-xs text-text-muted py-1">No active alarms on this tag.</p>
          ) : (
            <div className="space-y-1.5">
              {tagAlarms.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 bg-primary-900/50 border border-red-500/25 rounded px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-red-300 truncate">{a.description}</div>
                    <div className="text-[length:calc(10px*var(--fs))] text-text-muted">
                      {a.state} · {new Date(a.raisedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => ackAlarm(a.id)}
                      disabled={a.state === 'ACK'}
                      className="px-2 py-0.5 text-[length:calc(10px*var(--fs))] rounded bg-primary-600/60 border border-primary-500/50 text-text-secondary hover:text-text-primary disabled:opacity-40"
                    >
                      Ack
                    </button>
                    <button
                      onClick={() => shelveAlarm(a.id)}
                      className="px-2 py-0.5 text-[length:calc(10px*var(--fs))] rounded bg-primary-600/60 border border-primary-500/50 text-text-secondary hover:text-text-primary"
                    >
                      Shelve
                    </button>
                    <button
                      onClick={() => escalate(a.id)}
                      disabled={!!a.workOrderId}
                      className="px-2 py-0.5 text-[length:calc(10px*var(--fs))] rounded bg-accent-teal/20 border border-accent-teal/50 text-accent-teal hover:bg-accent-teal/30 disabled:opacity-40"
                    >
                      {a.workOrderId ?? 'Raise WO'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* What to do about it.
              The list above says what is wrong and lets the operator ack or
              shelve it — both of which make the alarm quieter without making
              the airfield better. This is the half that fixes it: the matched
              procedure, its steps, and the work order. */}
          {tagAlarms.length > 0 && (
            <div className="mt-2.5">
              <FixPanel
                alertText={tagAlarms[0].description}
                subsystem="AGL"
                assetId={fixture.id}
                severity={tagAlarms[0].priority}
                compact
              />
            </div>
          )}
        </Section>

        <Section title="Alarm Configuration">
          <table className="w-full text-[length:calc(11px*var(--fs))]">
            <thead>
              <tr className="text-text-muted border-b border-primary-500/40">
                <th className="text-left font-medium py-1">Description</th>
                <th className="text-center font-medium py-1 w-10">En</th>
                <th className="text-right font-medium py-1 w-20">Setpoint</th>
                <th className="text-right font-medium py-1 w-14">Delay</th>
              </tr>
            </thead>
            <tbody>
              {config.map((c) => (
                <tr key={c.kind} className="border-b border-primary-600/25">
                  <td className="py-1 text-text-secondary">{c.label}</td>
                  <td className="py-1 text-center">
                    <input type="checkbox" defaultChecked={c.enabled} className="accent-teal-400" />
                  </td>
                  <td className="py-1 text-right">
                    <span className="inline-block bg-primary-900/80 border border-accent-teal/30 rounded px-1.5 py-0.5 font-mono text-accent-teal">
                      {c.setpoint.toLocaleString()}
                    </span>
                    <span className="text-text-muted ml-1">{c.unit}</span>
                  </td>
                  <td className="py-1 text-right font-mono text-text-secondary">
                    {c.timeDelay.toFixed(2)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {circuit && (
          <Section title="Series Circuit" icon={<Cable className="w-3.5 h-3.5 text-accent-teal" />}>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Circuit</dt>
                <dd className="text-text-primary font-mono">
                  {circuit.id} — {circuit.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Regulator</dt>
                <dd className="text-text-primary">{circuit.ccrModel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Control Unit</dt>
                <dd className="text-text-primary font-mono">{circuit.aceUnit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Position in Loop</dt>
                <dd className="text-text-primary font-mono">
                  {fixture.seq} of {circuit.fixtureIds.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Brightness Step</dt>
                <dd className="text-text-primary font-mono">{circuit.step} / 5</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Output Current</dt>
                <dd className={`font-mono ${circuit.faulted ? 'text-red-400' : 'text-text-primary'}`}>
                  {circuit.outputCurrent.toFixed(1)} A
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Insulation Resistance</dt>
                <dd
                  className={`font-mono ${
                    circuit.insulationResistance < 50 ? 'text-amber-400' : 'text-text-primary'
                  }`}
                >
                  {circuit.insulationResistance} MΩ
                </dd>
              </div>
            </dl>
          </Section>
        )}
      </div>
    </motion.div>
    </>
  );
};

export default LampFaceplate;
