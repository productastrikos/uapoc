/**
 * Simulation dock.
 *
 * Fault injection, operating mode and the two movement sequences. Everything
 * here writes to the same tag engine the rest of the screen reads from, so a
 * fault injected on this dock lands on the canvas, the serviceability rail, the
 * alarm strip and the work-order list at once.
 */

import React from 'react';
import { Play, RotateCcw, Plane } from 'lucide-react';
import { useAglStore } from '../store';
import { AirfieldMode, CanvasOverlay, FaultKind } from '../types';

const FAULTS: { kind: FaultKind; label: string }[] = [
  { kind: 'fail_papi', label: 'Fail PAPI Lighting' },
  { kind: 'fail_taxiway', label: 'Fail Taxiway Lighting' },
  { kind: 'fail_runway_edge', label: 'Fail Runway Lighting' },
  { kind: 'fail_approach', label: 'Fail Approach Lighting' },
  { kind: 'fail_threshold', label: 'Fail Threshold Lighting' },
  { kind: 'ccr_trip', label: 'CCR Output Failure' },
];

const OVERLAYS: { id: CanvasOverlay; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'circuit', label: 'Circuit' },
  { id: 'comms', label: 'Comms' },
  { id: 'intensity', label: 'Intensity' },
  { id: 'serviceability', label: 'Service' },
];

const MODES: { id: AirfieldMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'lvp_cat_i', label: 'LVP CAT I' },
  { id: 'lvp_cat_ii', label: 'LVP CAT II' },
];

const RATES = [1, 2, 4, 8, 16];

interface Props {
  onLanding: () => void;
  onTaxi: () => void;
  running: string | null;
  /** Playback multiplier over real-world speed. */
  rate: number;
  onRate: (r: number) => void;
}

const ScenarioDock: React.FC<Props> = ({ onLanding, onTaxi, running, rate, onRate }) => {
  const injectFault = useAglStore((s) => s.injectFault);
  const clearFaults = useAglStore((s) => s.clearFaults);
  const activeFaults = useAglStore((s) => s.activeFaults);
  const overlay = useAglStore((s) => s.overlay);
  const setOverlay = useAglStore((s) => s.setOverlay);
  const mode = useAglStore((s) => s.mode);
  const setMode = useAglStore((s) => s.setMode);

  return (
    <div className="bg-primary-800/70 border border-primary-500/40 rounded-lg px-3 py-2 flex flex-col gap-2">
      <div className="flex items-start gap-4 flex-wrap">
      {/* Movement sequences */}
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Sequences</h4>
        <div className="flex gap-1.5">
          <button
            onClick={onLanding}
            disabled={running !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-teal/15 border border-accent-teal/50 text-[length:calc(11px*var(--fs))] text-accent-teal hover:bg-accent-teal/25 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Plane className="w-3.5 h-3.5" />
            {running === 'landing' ? 'Landing…' : 'Arrival RWY 09'}
          </button>
          <button
            onClick={onTaxi}
            disabled={running !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/50 text-[length:calc(11px*var(--fs))] text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            {running === 'taxi' ? 'Departing…' : 'Departure RWY 27'}
          </button>
        </div>
      </div>

      {/* Playback rate. An aircraft taxis at about 8 m/s and lands at about
          70 m/s; at real time a taxi across this field takes minutes, so the
          demo needs a throttle rather than dishonest speeds baked into the
          sequence. */}
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Speed</h4>
        <div className="flex gap-1">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => onRate(r)}
              className={`px-2 py-1.5 rounded text-[length:calc(11px*var(--fs))] border transition-colors font-mono ${
                rate === r
                  ? 'bg-accent-gold/20 border-accent-gold/60 text-accent-gold'
                  : 'bg-primary-600/40 border-primary-500/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      <div className="w-px self-stretch bg-primary-500/40" />

      {/* Fault injection */}
      <div className="min-w-0">
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">
          Fault Injection
        </h4>
        {/* Never wraps. These read as one bank of controls; stacking them
            turned the dock into a column and stole height from the canvas. */}
        <div className="flex flex-nowrap gap-1 overflow-x-auto no-scrollbar">
          {FAULTS.map((f) => (
            <button
              key={f.kind}
              onClick={() => injectFault(f.kind)}
              className={`px-2 py-1.5 rounded border text-[length:calc(11px*var(--fs))] transition-colors whitespace-nowrap ${
                activeFaults.includes(f.kind)
                  ? 'bg-red-500/25 border-red-500/60 text-red-200'
                  : 'bg-primary-600/50 border-primary-500/50 text-text-secondary hover:text-text-primary hover:border-primary-400'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={clearFaults}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-primary-600/50 border border-primary-500/50 text-[length:calc(11px*var(--fs))] text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="w-px self-stretch bg-primary-500/40" />

      {/* Overlay */}
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Overlay</h4>
        <div className="flex gap-1">
          {OVERLAYS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOverlay(o.id)}
              className={`px-2 py-1.5 rounded text-[length:calc(11px*var(--fs))] border transition-colors ${
                overlay === o.id
                  ? 'bg-accent-teal/25 border-accent-teal/60 text-accent-teal'
                  : 'bg-primary-600/40 border-primary-500/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px self-stretch bg-primary-500/40" />

      {/* Operating mode 
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Mode</h4>
         <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-2 py-1.5 rounded text-[length:calc(11px*var(--fs))] border transition-colors whitespace-nowrap ${
                mode === m.id
                  ? 'bg-accent-gold/20 border-accent-gold/60 text-accent-gold'
                  : 'bg-primary-600/40 border-primary-500/40 text-text-secondary hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div> */}

      </div>

    </div>
  );
};

export default ScenarioDock;

