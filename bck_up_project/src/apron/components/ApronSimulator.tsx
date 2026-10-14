/**
 * Apron simulator.
 *
 * Per-stand docking and maintenance controls plus apron-wide fault injection,
 * matching the simulator panel in the reference system but driving the same
 * store the graphics and alarms read from.
 */

import React from 'react';
import { PlaneLanding, PlaneTakeoff, RotateCcw, Zap } from 'lucide-react';
import { useApronStore, AIRCRAFT_TYPES } from '../store';
import { AircraftType, ApronFaultKind } from '../types';

const FAULTS: { kind: ApronFaultKind; label: string }[] = [
  { kind: 'vdgs_fault', label: 'VDGS Fault' },
  { kind: 'pbb_disconnect', label: 'PBB Disconnect' },
  { kind: 'gpu_overload', label: 'GPU Overload' },
  { kind: 'floodlight_low', label: 'Flood Light Lo-Lo' },
  { kind: 'estop_pressed', label: 'Emergency Stop' },
];

const ApronSimulator: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const startDocking = useApronStore((s) => s.startDocking);
  const releaseStand = useApronStore((s) => s.releaseStand);
  const setMaintenance = useApronStore((s) => s.setMaintenance);
  const setAircraftType = useApronStore((s) => s.setAircraftType);
  const injectFault = useApronStore((s) => s.injectFault);
  const clearFaults = useApronStore((s) => s.clearFaults);
  const activeFaults = useApronStore((s) => s.activeFaults);
  const selectedStandId = useApronStore((s) => s.selectedStandId);

  return (
    <div className="bg-primary-800/70 border border-primary-500/40 rounded-lg px-3 py-2">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Per-stand controls */}
        <div className="flex-1 min-w-[520px]">
          <h4 className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
            Stand Simulator
          </h4>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left font-medium pb-1">Bay</th>
                <th className="text-left font-medium pb-1">Aircraft Type</th>
                <th className="text-center font-medium pb-1">Docking</th>
                <th className="text-center font-medium pb-1">Maint.</th>
              </tr>
            </thead>
            <tbody>
              {stands.map((s) => (
                <tr
                  key={s.id}
                  className={selectedStandId === s.id ? 'bg-primary-700/40' : undefined}
                >
                  <td className="py-0.5 pr-2 text-text-secondary whitespace-nowrap">{s.name}</td>
                  <td className="py-0.5 pr-2">
                    <select
                      value={s.vdgs.expectedType ?? ''}
                      onChange={(e) =>
                        setAircraftType(s.id, e.target.value as AircraftType)
                      }
                      className="bg-primary-900/80 border border-primary-500/50 rounded px-1 py-0.5 text-[11px] text-text-primary focus:outline-none focus:border-accent-teal"
                    >
                      <option value="">—</option>
                      {AIRCRAFT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-0.5 text-center">
                    {s.occupied ? (
                      <button
                        onClick={() => releaseStand(s.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-600/60 border border-primary-500/50 text-[10px] text-text-secondary hover:text-text-primary"
                      >
                        <PlaneTakeoff className="w-3 h-3" />
                        Release
                      </button>
                    ) : (
                      <button
                        onClick={() => startDocking(s.id)}
                        disabled={s.maintenance}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-teal/20 border border-accent-teal/50 text-[10px] text-accent-teal hover:bg-accent-teal/30 disabled:opacity-40"
                      >
                        <PlaneLanding className="w-3 h-3" />
                        Dock
                      </button>
                    )}
                  </td>
                  <td className="py-0.5 text-center">
                    <input
                      type="checkbox"
                      checked={s.maintenance}
                      onChange={(e) => setMaintenance(s.id, e.target.checked)}
                      className="accent-purple-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-px self-stretch bg-primary-500/40" />

        {/* Fault injection */}
        <div className="min-w-[200px]">
          <h4 className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
            Fault Injection
          </h4>
          <div className="flex flex-col gap-1">
            {FAULTS.map((f) => (
              <button
                key={f.kind}
                onClick={() => injectFault(f.kind, selectedStandId ?? undefined)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[11px] transition-colors ${
                  activeFaults.includes(f.kind)
                    ? 'bg-red-500/25 border-red-500/60 text-red-200'
                    : 'bg-primary-600/50 border-primary-500/50 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Zap className="w-3 h-3" />
                {f.label}
              </button>
            ))}
            <button
              onClick={clearFaults}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-primary-600/50 border border-primary-500/50 text-[11px] text-text-secondary hover:text-text-primary"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
          <p className="mt-1 text-[9px] text-text-muted leading-tight">
            Faults land on the selected bay, or the first occupied bay if none is selected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApronSimulator;
