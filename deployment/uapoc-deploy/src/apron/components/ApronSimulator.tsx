/**
 * Stand simulator — one line.
 *
 * This was a table with a row per stand, then a table with one row, then a
 * table with one row and a lot of empty space around it. All of it existed to
 * drive one stand: pick a type, dock it, release it, take it out of service.
 * That is four controls, so it is one line.
 *
 * Fault injection used to live alongside it and has moved into the stand grid
 * (see FaultInjectionPanel) — it belongs next to the stands it acts on, and
 * moving it gave the alarms and events strip its room back.
 */

import React from 'react';
import { PlaneLanding, PlaneTakeoff, SlidersHorizontal } from 'lucide-react';
import { useApronStore, AIRCRAFT_TYPES } from '../store';
import type { AircraftType } from '../types';

const ApronSimulator: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const startDocking = useApronStore((s) => s.startDocking);
  const releaseStand = useApronStore((s) => s.releaseStand);
  const setMaintenance = useApronStore((s) => s.setMaintenance);
  const setAircraftType = useApronStore((s) => s.setAircraftType);
  const selectedStandId = useApronStore((s) => s.selectedStandId);

  const stand = stands.find((s) => s.id === selectedStandId) ?? null;

  return (
    <div className="flex items-center gap-3 flex-wrap rounded-lg glass-panel px-3 py-2">
      <span className="flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5 text-accent-teal" />
        <span className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">
          Stand Simulator
        </span>
      </span>

      {!stand ? (
        <span className="text-xs text-text-muted">
          Select a stand above to dock, release or take it out of service.
        </span>
      ) : (
        <>
          <span className="text-sm font-semibold text-text-primary shrink-0">{stand.name}</span>

          <select
            value={stand.vdgs.expectedType ?? ''}
            onChange={(e) => setAircraftType(stand.id, e.target.value as AircraftType)}
            className="bg-primary-900/80 border border-primary-500/50 rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-teal"
          >
            <option value="">— type —</option>
            {AIRCRAFT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {stand.occupied ? (
            <button
              onClick={() => releaseStand(stand.id)}
              disabled={stand.docking === 'departing'}
              className="chip min-w-[9rem] px-2.5 py-1 disabled:opacity-50"
            >
              <PlaneTakeoff className="w-3.5 h-3.5" />
              {stand.docking === 'departing' ? 'Pushing back…' : 'Release'}
            </button>
          ) : (
            <button
              onClick={() => startDocking(stand.id)}
              disabled={stand.maintenance}
              className="chip px-2.5 py-1 bg-accent-teal/20 text-accent-teal hover:bg-accent-teal/30 disabled:opacity-40"
            >
              <PlaneLanding className="w-3.5 h-3.5" />
              Dock
            </button>
          )}

          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={stand.maintenance}
              onChange={(e) => setMaintenance(stand.id, e.target.checked)}
              className="accent-blue-500"
            />
            Out of service
          </label>

          <span className="ml-auto text-[length:calc(10px*var(--fs))] text-text-muted">
            {stand.terminal} · {stand.contact ? 'Contact' : 'Remote'} · {stand.vdgs.model}
          </span>
        </>
      )}
    </div>
  );
};

export default ApronSimulator;
