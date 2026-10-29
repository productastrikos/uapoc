/**
 * Terminal Building Management console.
 *
 * Floor plan on the left with a layer panel and floor selector, AHU fleet
 * summary and unit list on the right, the restricted parameter faceplate as a
 * drawer, and the shared alarm strip below.
 *
 * The fleet, the plan and the alarms are all views over one store, so the unit
 * in fault on 1F is the same unit everywhere it appears.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Building2, RotateCcw, Zap } from 'lucide-react';
import FloorPlan from './components/FloorPlan';
import AhuFaceplate from './components/AhuFaceplate';
import AlarmStrip from '../agl/components/AlarmStrip';
import { useBmsStore, computeFloorRollups, BmsFaultKind } from './store';
import { DEVICE_KINDS, FLOOR_LABELS, FLOOR_ORDER, sortAhus } from './assets';
import AiInsightPanel from '../ai/components/AiInsightPanel';

const FAULTS: { kind: BmsFaultKind; label: string }[] = [
  { kind: 'ahu_fan_trip', label: 'AHU Supply Fan Trip' },
  { kind: 'filter_blocked', label: 'Filter Blocked' },
  { kind: 'duct_smoke', label: 'Duct Smoke' },
  { kind: 'chw_valve_stuck', label: 'CHW Valve Stuck' },
];

const BmsScreen: React.FC = () => {
  const ahus = useBmsStore((s) => s.ahus);
  const floor = useBmsStore((s) => s.floor);
  const devices = useBmsStore((s) => s.devices);
  const alarms = useBmsStore((s) => s.alarms);
  const now = useBmsStore((s) => s.now);
  const selectedAhuId = useBmsStore((s) => s.selectedAhuId);
  const visibleKinds = useBmsStore((s) => s.visibleKinds);
  const setFloor = useBmsStore((s) => s.setFloor);
  const selectAhu = useBmsStore((s) => s.selectAhu);
  const toggleKind = useBmsStore((s) => s.toggleKind);
  const injectFault = useBmsStore((s) => s.injectFault);
  const clearFaults = useBmsStore((s) => s.clearFaults);
  const activeFaults = useBmsStore((s) => s.activeFaults);
  const ackAlarm = useBmsStore((s) => s.ackAlarm);
  const ackAll = useBmsStore((s) => s.ackAll);
  const tick = useBmsStore((s) => s.tick);

  const [alarmsCollapsed, setAlarmsCollapsed] = useState(false);

  useEffect(() => {
    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
  }, [tick]);

  const rollups = useMemo(() => computeFloorRollups(ahus), [ahus]);
  const total = ahus.length;
  const faults = ahus.filter((a) => a.status === 'Fault').length;

  // Fault units first, so the one real problem is at the top of the list.
  const floorUnits = useMemo(
    () => sortAhus(ahus.filter((a) => a.floor === floor)).slice(0, 40),
    [ahus, floor]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent-gold" />
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Terminal Building Management (LBMS)
            </h2>
            <p className="text-[length:calc(11px*var(--fs))] text-text-muted">
              {total} AHU · Building 1 · HVAC, VAV / CAV, FCU and exhaust
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">Fleet Health</div>
            <div
              className={`text-xl font-bold font-mono ${
                faults > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {(((total - faults) / total) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">In Fault</div>
            <div
              className={`text-xl font-bold font-mono ${
                faults > 0 ? 'text-red-400' : 'text-text-muted'
              }`}
            >
              {faults}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Plan + controls */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          <div className="flex-1 min-h-0 relative bg-primary-900/60 border border-primary-500/40 rounded-lg overflow-hidden">
            <FloorPlan
              devices={devices}
              visibleKinds={visibleKinds}
              selectedAhuId={selectedAhuId}
              onSelect={(d) => d.ahuId && selectAhu(d.ahuId)}
            />

            {/* Floor label */}
            <div className="absolute top-2 left-3 text-xs font-semibold text-text-primary">
              Building 1 — {FLOOR_LABELS[floor]}
            </div>

            {/* Layer panel, as on the reference schematic */}
            <div className="absolute top-2 right-2 bg-primary-800/90 border border-primary-500/50 rounded px-2 py-1.5">
              <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Layers</div>
              {DEVICE_KINDS.map((k) => (
                <label
                  key={k}
                  className="flex items-center gap-1.5 text-[length:calc(11px*var(--fs))] text-text-secondary cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={visibleKinds.includes(k)}
                    onChange={() => toggleKind(k)}
                    className="accent-teal-400"
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="shrink-0 bg-primary-800/70 border border-primary-500/40 rounded-lg px-3 py-2 flex items-start gap-4 flex-wrap">
            <div>
              <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">Floor</h4>
              <div className="flex gap-1">
                {FLOOR_ORDER.map((f) => {
                  const r = rollups.find((x) => x.floor === f);
                  return (
                    <button
                      key={f}
                      onClick={() => setFloor(f)}
                      className={`px-2.5 py-1.5 rounded text-[length:calc(11px*var(--fs))] border transition-colors ${
                        floor === f
                          ? 'bg-accent-teal/25 border-accent-teal/60 text-accent-teal'
                          : 'bg-primary-600/40 border-primary-500/40 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {f}
                      {r && r.fault > 0 && (
                        <span className="ml-1 text-red-400 font-semibold">{r.fault}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px self-stretch bg-primary-500/40" />

            <div className="flex-1 min-w-[260px]">
              <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted mb-1">
                Fault Injection
              </h4>
              <div className="flex flex-wrap gap-1">
                {FAULTS.map((f) => (
                  <button
                    key={f.kind}
                    onClick={() => injectFault(f.kind)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[length:calc(11px*var(--fs))] transition-colors ${
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
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-primary-600/50 border border-primary-500/50 text-[length:calc(11px*var(--fs))] text-text-secondary hover:text-text-primary"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet rail, led by the advisories drawn from it. */}
        <div className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          <AiInsightPanel domain="bms" variant="rail" />

          <section className="bg-primary-800/70 border border-primary-500/40 rounded-lg overflow-hidden">
            <header className="px-3 py-2 border-b border-primary-500/40">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                AHU Fleet by Floor
              </h3>
            </header>
            <table className="w-full text-[length:calc(11px*var(--fs))]">
              <thead>
                <tr className="text-text-muted border-b border-primary-500/30">
                  <th className="text-left font-medium px-2 py-1">Floor</th>
                  <th className="text-center font-medium px-2 py-1 w-14">Total</th>
                  <th className="text-center font-medium px-2 py-1 w-16">Working</th>
                  <th className="text-center font-medium px-2 py-1 w-12">Fault</th>
                </tr>
              </thead>
              <tbody>
                {rollups.map((r) => (
                  <tr
                    key={r.floor}
                    onClick={() => setFloor(r.floor)}
                    className={`border-b border-primary-600/20 cursor-pointer hover:bg-primary-700/40 ${
                      floor === r.floor ? 'bg-primary-700/30' : ''
                    }`}
                  >
                    <td className="px-2 py-1 text-text-secondary">{FLOOR_LABELS[r.floor]}</td>
                    <td className="px-2 py-1 text-center font-mono text-text-primary">{r.total}</td>
                    <td className="px-2 py-1 text-center font-mono text-emerald-300">
                      {r.working}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span
                        className={`inline-block min-w-[1.6rem] rounded font-mono ${
                          r.fault > 0
                            ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                            : 'text-text-primary'
                        }`}
                      >
                        {r.fault}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-primary-800/70 border border-primary-500/40 rounded-lg overflow-hidden">
            <header className="px-3 py-2 border-b border-primary-500/40 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Units — {floor}
              </h3>
              <span className="text-[length:calc(11px*var(--fs))] text-text-muted">
                showing {floorUnits.length}
              </span>
            </header>
            <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-primary-600/20">
              {floorUnits.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAhu(a.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-primary-700/40 ${
                    selectedAhuId === a.id ? 'bg-primary-700/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        a.status === 'Fault' ? 'bg-red-500' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-[length:calc(11px*var(--fs))] font-mono text-text-primary truncate">
                      {a.id}
                    </span>
                  </div>
                  <span className="text-[length:calc(11px*var(--fs))] font-mono text-text-muted shrink-0 ml-2">
                    {a.saTemp.toFixed(1)} °C
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <AnimatePresence>{selectedAhuId && <AhuFaceplate />}</AnimatePresence>
      </div>

      <div className="shrink-0 mt-3 -mx-6 -mb-6">
        <AlarmStrip
          collapsed={alarmsCollapsed}
          onToggle={() => setAlarmsCollapsed((c) => !c)}
          alarms={alarms}
          now={now}
          node="TAMS_LBMS"
          onAck={ackAlarm}
          onAckAll={ackAll}
          onEscalate={() => undefined}
          onSelect={(tag) => selectAhu(tag)}
        />
      </div>
    </div>
  );
};

export default BmsScreen;
