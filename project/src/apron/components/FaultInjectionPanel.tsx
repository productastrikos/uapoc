/**
 * Fault injection, sized to sit in the stand grid.
 *
 * It used to live in a wide strip under the stands, which pushed the alarm
 * list off the bottom of the console. Taking the fourth grid cell instead puts
 * it beside the stands it acts on — inject a VDGS fault and the card two
 * columns to the left goes red without the eye having to travel — and gives the
 * alarms and events strip its room back.
 */

import React from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { useApronStore } from '../store';
import type { ApronFaultKind } from '../types';

const FAULTS: { kind: ApronFaultKind; label: string }[] = [
  { kind: 'vdgs_fault', label: 'VDGS Fault' },
  { kind: 'pbb_disconnect', label: 'PBB Disconnect' },
  { kind: 'gpu_overload', label: 'GPU Overload' },
  { kind: 'floodlight_low', label: 'Flood Light Lo-Lo' },
  { kind: 'estop_pressed', label: 'Emergency Stop' },
];

const FaultInjectionPanel: React.FC = () => {
  const injectFault = useApronStore((s) => s.injectFault);
  const clearFaults = useApronStore((s) => s.clearFaults);
  const activeFaults = useApronStore((s) => s.activeFaults);
  const selectedStandId = useApronStore((s) => s.selectedStandId);
  const stands = useApronStore((s) => s.stands);

  const target = stands.find((s) => s.id === selectedStandId) ?? stands.find((s) => s.occupied);

  return (
    <section className="flex flex-col rounded-lg glass-panel overflow-hidden">
      <header className="flex items-center gap-1.5 px-2.5 py-2 border-b border-white/10 shrink-0">
        <Zap className="w-3.5 h-3.5 text-accent-blue shrink-0" />
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-primary">
          Fault Injection
        </h3>
      </header>

      <div className="flex-1 min-h-0 flex flex-col gap-1.5 p-2.5 overflow-y-auto no-scrollbar">
        {FAULTS.map((f) => {
          const on = activeFaults.includes(f.kind);
          return (
            <button
              key={f.kind}
              onClick={() => injectFault(f.kind, selectedStandId ?? undefined)}
              className={`chip justify-start gap-2 px-2.5 py-2 text-left ${
                on ? 'bg-status-error/25 text-status-error hover:bg-status-error/30 hover:text-status-error' : ''
              }`}
            >
              <Zap className="w-3 h-3 shrink-0" />
              {f.label}
            </button>
          );
        })}

        <button
          onClick={clearFaults}
          className="chip justify-start gap-2 px-2.5 py-2"
        >
          <RotateCcw className="w-3 h-3 shrink-0" />
          Reset all
        </button>

        {/* Which stand the next fault lands on — the one thing that is easy to
            get wrong when the control is not on the stand it affects. */}
        <p className="mt-auto pt-1.5 text-[length:calc(10px*var(--fs))] text-text-muted leading-snug">
          Lands on <span className="text-accent-teal">{target?.name ?? 'the first occupied stand'}</span>.
          Select a stand to aim it.
        </p>
      </div>
    </section>
  );
};

export default FaultInjectionPanel;
