/**
 * Fault localisation advisory.
 *
 * Built for a specific failure the airport has already lived through: a series
 * cable was cut somewhere between the vault and the runway, the fault was first
 * blamed on the PLC, and the runway stayed closed for five to six hours while
 * crews looked in the wrong place.
 *
 * The platform cannot locate a break the way a reflectometer can, and the panel
 * says so. What it can do is notice that a contiguous run of fixtures stopped
 * answering the LINC 360 poll while the regulator still shows healthy output
 * current, and name the span to walk first. That is the difference between
 * searching a whole circuit and searching a hundred metres of it.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Radar, ArrowRight, Wrench, MapPin } from 'lucide-react';
import { useAglStore } from '../store';

const AdvisoryPanel: React.FC = () => {
  const advisories = useAglStore((s) => s.advisories);
  const select = useAglStore((s) => s.select);
  const setOverlay = useAglStore((s) => s.setOverlay);
  const workOrders = useAglStore((s) => s.workOrders);
  const airfield = useAglStore((s) => s.airfield);

  if (advisories.length === 0) return null;

  return (
    <div className="space-y-2">
      {advisories.map((adv) => {
        const circuit = airfield.circuits.find((c) => c.id === adv.circuitId);
        const raised = workOrders.some((w) => w.tag === adv.firstSilentTag);

        return (
          <motion.section
            key={adv.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500/10 to-primary-800/80 border border-amber-500/40 rounded-lg overflow-hidden"
          >
            <header className="flex items-center justify-between px-3 py-2 border-b border-amber-500/30 bg-amber-500/10">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
                  Fault Localisation Advisory
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[10px] font-semibold text-amber-200">
                {adv.confidence}% confidence
              </span>
            </header>

            <div className="p-3 space-y-3">
              <p className="text-sm text-text-primary leading-snug">{adv.headline}</p>

              {/* The inferred span, drawn as the loop walk it implies. Tags are
                  long, so they stack rather than sitting either side of the
                  arrow — side-by-side overflows the rail. */}
              <div className="bg-primary-900/60 border border-primary-500/40 rounded px-3 py-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-text-muted shrink-0">Last reporting</span>
                  <button
                    onClick={() => select(adv.lastGoodTag)}
                    className="text-[11px] font-mono text-emerald-300 hover:underline text-right break-all"
                  >
                    {adv.lastGoodTag}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-emerald-500/60" />
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold shrink-0">
                    <ArrowRight className="w-3 h-3" />~{adv.spanMetres} m suspect span
                  </span>
                  <div className="flex-1 h-px bg-red-500/60" />
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-text-muted shrink-0">First silent</span>
                  <button
                    onClick={() => select(adv.firstSilentTag)}
                    className="text-[11px] font-mono text-red-300 hover:underline text-right break-all"
                  >
                    {adv.firstSilentTag}
                  </button>
                </div>
              </div>

              {/* Why the system believes this. */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
                  Evidence
                </h4>
                <ul className="space-y-1">
                  {adv.reasoning.map((r, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px] text-text-secondary leading-snug">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary-900/60 border-l-2 border-accent-teal px-3 py-2">
                <h4 className="text-[10px] uppercase tracking-wide text-accent-teal mb-1">
                  Recommended action
                </h4>
                <p className="text-[11px] text-text-secondary leading-snug">{adv.recommendation}</p>
              </div>

              {circuit && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-primary-900/50 rounded px-2 py-1.5">
                    <div className="text-[10px] text-text-muted">Silent fixtures</div>
                    <div className="text-sm font-mono text-red-300">{adv.silentCount}</div>
                  </div>
                  <div className="bg-primary-900/50 rounded px-2 py-1.5">
                    <div className="text-[10px] text-text-muted">CCR output</div>
                    <div className="text-sm font-mono text-emerald-300">
                      {circuit.outputCurrent.toFixed(1)} A
                    </div>
                  </div>
                  <div className="bg-primary-900/50 rounded px-2 py-1.5">
                    <div className="text-[10px] text-text-muted">Insulation</div>
                    <div
                      className={`text-sm font-mono ${
                        circuit.insulationResistance < 50 ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {circuit.insulationResistance} MΩ
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOverlay('comms');
                    select(adv.firstSilentTag);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-primary-600/60 border border-primary-500/50 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Show on comms overlay
                </button>
                <button
                  onClick={() => {
                    const alarm = useAglStore
                      .getState()
                      .alarms.find((a) => a.tag === adv.firstSilentTag);
                    if (alarm) useAglStore.getState().escalateToWorkOrder(alarm.id);
                  }}
                  disabled={raised}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-accent-teal/20 border border-accent-teal/50 text-[11px] text-accent-teal hover:bg-accent-teal/30 disabled:opacity-50 transition-colors"
                >
                  <Wrench className="w-3 h-3" />
                  {raised ? 'Work order raised' : 'Dispatch crew'}
                </button>
              </div>

              <p className="text-[10px] text-text-muted italic leading-snug">
                Inferred from communication loss pattern, not reflectometry. Confirm the exact break
                point on site before excavation.
              </p>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
};

export default AdvisoryPanel;
