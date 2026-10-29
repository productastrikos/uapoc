/**
 * Serviceability rail.
 *
 * Two blocks, matching what the client has already seen: target vs present
 * value per lighting category, then a Total / Fail summary. The ICAO angle is
 * the addition — a category that drops below its Annex 14 serviceability target
 * is flagged as a compliance breach, not merely a red number, because that is
 * the threshold at which the runway's declared category is affected.
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAglStore, computeRollups } from '../store';

const KpiRail: React.FC = () => {
  const airfield = useAglStore((s) => s.airfield);
  const rollups = useMemo(() => computeRollups(airfield), [airfield]);
  const circuits = airfield.circuits;

  const breaches = rollups.filter((r) => r.breached);

  return (
    <div className="shrink-0 space-y-3">
      {/* Serviceability */}
      <section className="glass-panel rounded-lg overflow-hidden">
        <header className="px-2 py-2 border-b border-accent-blue/10 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            AGL KPI / Serviceability
          </h3>
          {breaches.length > 0 && (
            <span className="flex items-center gap-1 text-[length:calc(10px*var(--fs))] text-status-error">
              <AlertTriangle className="w-3 h-3" />
              {breaches.length}
            </span>
          )}
        </header>
        <table className="w-full text-[length:calc(11px*var(--fs))]">
          <thead>
            <tr className="text-text-muted border-b border-primary-500/30">
              <th className="text-left font-medium px-2 py-1">Category</th>
              <th className="text-center font-medium px-1 py-1 w-11">Tgt</th>
              <th className="text-right font-medium px-2 py-1 w-24">Present</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map((r) => (
              <tr key={r.id} className="border-b border-primary-600/20">
                <td className="px-2 py-1 text-text-secondary">{r.label}</td>
                <td className="px-1 py-1 text-center font-mono text-text-muted">{r.target}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-10 h-2.5 bg-primary-900/80 rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${r.breached ? 'bg-status-error' : 'bg-status-neutral'}`}
                        style={{ width: `${Math.max(2, r.serviceability)}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono tabular-nums ${
                        r.breached ? 'text-status-error font-semibold' : 'text-text-primary'
                      }`}
                    >
                      {r.serviceability.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Total / Fail summary */}
      <section className="glass-panel rounded-lg overflow-hidden">
        <header className="px-2 py-2 border-b border-accent-blue/10">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            Summary
          </h3>
        </header>
        <table className="w-full text-[length:calc(11px*var(--fs))]">
          <thead>
            <tr className="text-text-muted border-b border-primary-500/30">
              <th className="text-left font-medium px-2 py-1">Category</th>
              <th className="text-center font-medium px-2 py-1 w-14">Total</th>
              <th className="text-center font-medium px-2 py-1 w-14">Fail</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map((r) => (
              <tr key={r.id} className="border-b border-primary-600/20">
                <td className="px-2 py-1 text-text-secondary">{r.label}</td>
                <td className="px-2 py-1 text-center">
                  <span className="inline-block min-w-[2.2rem] bg-primary-900/70 border border-primary-500/40 rounded font-mono text-text-primary">
                    {r.total}
                  </span>
                </td>
                <td className="px-2 py-1 text-center">
                  <span
                    className={`inline-block min-w-[2.2rem] rounded font-mono border ${
                      r.failed > 0
                        ? 'bg-status-error/20 border-status-error/50 text-status-error'
                        : 'bg-primary-900/70 border-primary-500/40 text-text-primary'
                    }`}
                  >
                    {r.failed}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Constant current regulators */}
      <section className="glass-panel rounded-lg overflow-hidden">
        <header className="px-2 py-2 border-b border-accent-blue/10">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
            Regulators (CCR)
          </h3>
        </header>
        <div className="divide-y divide-primary-600/20 stagger-in">
          {circuits.map((c) => (
            <div key={c.id} className="px-2 py-1.5 flex items-center justify-between text-[length:calc(11px*var(--fs))]">
              <div className="min-w-0">
                <div className="font-mono text-text-primary">{c.id}</div>
                <div className="text-text-muted truncate">{c.name}</div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div
                  className={`font-mono ${c.faulted ? 'text-status-error font-semibold' : 'text-text-primary'}`}
                >
                  {c.outputCurrent.toFixed(1)} A
                </div>
                <div className="text-text-muted">Step {c.step}/5</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default KpiRail;
