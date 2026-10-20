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
    <div className="glass-panel rounded-lg px-3 py-2 flex flex-col gap-2">
      <div className="flex items-start gap-4 flex-wrap">
      {/* Movement sequences */}
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Sequences</h4>
        <div className="flex gap-1.5">
          <button
            onClick={onLanding}
            disabled={running !== null}
            className={`chip min-w-[10rem] text-[length:calc(11px*var(--fs))] disabled:opacity-40 disabled:cursor-not-allowed ${
              running === 'landing' ? 'chip-active' : ''
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            {running === 'landing' ? 'Landing…' : 'Arrival RWY 09'}
          </button>
          <button
            onClick={onTaxi}
            disabled={running !== null}
            className={`chip min-w-[10.5rem] text-[length:calc(11px*var(--fs))] disabled:opacity-40 disabled:cursor-not-allowed ${
              running === 'taxi' ? 'chip-active' : ''
            }`}
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
              className={`chip text-[length:calc(11px*var(--fs))] font-mono ${rate === r ? 'chip-active' : ''}`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      <div className="w-px self-stretch bg-white/10" />

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
              className={`chip text-[length:calc(11px*var(--fs))] whitespace-nowrap ${
                activeFaults.includes(f.kind)
                  ? 'bg-status-error/25 text-status-error hover:bg-status-error/30 hover:text-status-error'
                  : ''
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={clearFaults}
            className="chip text-[length:calc(11px*var(--fs))] whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="w-px self-stretch bg-white/10" />

      {/* Overlay */}
      <div>
        <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Overlay</h4>
        <div className="flex gap-1">
          {OVERLAYS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOverlay(o.id)}
              className={`chip text-[length:calc(11px*var(--fs))] ${overlay === o.id ? 'chip-active' : ''}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      </div>

    </div>
  );
};

export default ScenarioDock;

