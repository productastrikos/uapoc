/**
 * "How do I fix this?"
 *
 * Everywhere this platform shows a fault it has to answer three questions, not
 * one: what is wrong, what should I do, and who does it. A detail panel that
 * only describes the fault is exactly the failure the customer called out in
 * the AVEVA review — an alert that raises, sits there, and never becomes an
 * owned piece of work.
 *
 * So this block is shared by every surface that opens on an alarm: the airfield
 * lighting faceplate, the alert list, the asset panel. It matches the alarm to
 * a procedure (see sops.ts), shows the plain-language advisory, and gives the
 * operator the two buttons that actually discharge it — run the procedure, or
 * raise the work order.
 *
 * The steps are shown, not hidden behind a link. An operator deciding whether
 * to run a procedure wants to see what it will make them do first, and a
 * procedure nobody can preview is a procedure nobody trusts.
 */

import React, { useState } from 'react';
import { Brain, Check, ChevronDown, ClipboardList, Play, Wrench } from 'lucide-react';
import { sopForAlert, sopDuration, type Sop } from '../sops';
import { useHbmsStore } from '../store/useHbmsStore';

interface Props {
  /** The alarm text the procedure is matched against. */
  alertText: string;
  subsystem?: string;
  /** Tag or asset the work order should be raised against. */
  assetId?: string;
  severity?: string;
  /** Extra action offered by the host console, e.g. "Show affected fixtures". */
  onLocate?: () => void;
  locateLabel?: string;
  compact?: boolean;
}

const PRIORITY_TONE: Record<Sop['priority'], string> = {
  CRITICAL: 'text-status-error border-status-error/50 bg-status-error/10',
  HIGH: 'text-status-warning border-status-warning/50 bg-status-warning/20',
  MEDIUM: 'text-status-warning border-status-warning/50 bg-status-warning/10',
  LOW: 'text-accent-blue border-accent-blue/50 bg-accent-blue/10',
};

const FixPanel: React.FC<Props> = ({
  alertText, subsystem, assetId, severity, onLocate, locateLabel = 'Show on map', compact = false,
}) => {
  const sop = sopForAlert(alertText, subsystem);
  const openWorkOrders = useHbmsStore((s) => s.openWorkOrders);
  const go = useHbmsStore((s) => s.go);

  const [stepsOpen, setStepsOpen] = useState(!compact);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<number[]>([]);

  const runSop = () => {
    setRunning(true);
    setStepsOpen(true);
    // Walk the steps so the operator can watch the procedure discharge rather
    // than being told it happened. Timed off each step's own duration, scaled
    // to demo speed.
    sop.steps.forEach((s, i) => {
      window.setTimeout(() => setDone((d) => [...d, s.order]), 450 * (i + 1));
    });
  };

  const raiseWorkOrder = () => {
    openWorkOrders({
      subsystem: subsystem ?? sop.subsystem,
      alertId: assetId,
      message: alertText,
      severity,
      priority: sop.priority,
      status: 'Open',
    });
  };

  return (
    <section className="glass-panel rounded-lg overflow-hidden">
      <header className="flex items-center gap-2 px-3 py-2 border-b border-primary-600/40 bg-primary-700/40">
        <div className="p-1 bg-accent-blue/15 rounded">
          <Brain className="w-3.5 h-3.5 text-accent-blue shrink-0" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-white">
          AI advisory &amp; fix
        </h4>
        <div className="flex-1" />
        <span className={`px-1.5 py-0.5 rounded border text-[length:calc(10px*var(--fs))] font-bold ${PRIORITY_TONE[sop.priority]}`}>
          {sop.priority}
        </span>
      </header>

      <div className="p-3 space-y-2.5">
        {/* The advisory, in plain words. */}
        <p className="text-xs text-text-secondary leading-snug">{sop.aiSummary}</p>

        {/* The procedure this maps to. */}
        <div className="rounded-md border border-primary-500/50 bg-primary-900/40 px-2.5 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ClipboardList className="w-3.5 h-3.5 text-accent-blue shrink-0" />
            <span className="text-xs font-semibold text-text-primary">{sop.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-[length:calc(10px*var(--fs))] text-text-muted">
            <span className="font-mono">{sop.id}</span>
            <span>·</span>
            <span>{sop.steps.length} steps</span>
            <span>·</span>
            <span>~{sopDuration(sop.steps)} min</span>
            <span>·</span>
            <span>{sop.successRate}% closed without escalation</span>
          </div>
          {sop.basis && (
            <p className="mt-1 text-[length:calc(10px*var(--fs))] text-text-muted italic">{sop.basis}</p>
          )}
        </div>

        {/* Steps. Visible by default on a full panel — see the header note. */}
        <div>
          <button
            onClick={() => setStepsOpen((v) => !v)}
            className="flex items-center gap-1 text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted hover:text-text-secondary transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${stepsOpen ? 'rotate-180' : ''}`} />
            Procedure steps
          </button>

          {stepsOpen && (
            <ol className="mt-2 space-y-1.5">
              {sop.steps.map((st) => {
                const complete = done.includes(st.order);
                return (
                  <li key={st.order} className="flex gap-2">
                    <span
                      className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[length:calc(9px*var(--fs))] font-bold border transition-colors ${
                        complete
                          ? 'bg-status-neutral/25 border-status-neutral/70 text-status-neutral'
                          : 'bg-primary-700/60 border-primary-500/60 text-text-muted'
                      }`}
                    >
                      {complete ? <Check className="w-2.5 h-2.5" /> : st.order}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-xs leading-snug ${complete ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                        {st.action}
                      </span>
                      <span className="block text-[length:calc(10px*var(--fs))] text-text-muted">
                        {st.role} · {st.minutes} min
                        {st.evidence ? ` · evidence: ${st.evidence}` : ''}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* The two things that actually discharge the alarm. */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <button
            onClick={runSop}
            disabled={running}
            className="btn btn-primary min-w-[10.5rem] disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            {running ? (done.length === sop.steps.length ? 'Procedure complete' : 'Running…') : 'Run this SOP'}
          </button>

          <button
            onClick={raiseWorkOrder}
            className="btn btn-secondary"
          >
            <Wrench className="w-3 h-3" />
            Raise work order
          </button>

          {onLocate && (
            <button
              onClick={onLocate}
              className="px-2 py-1.5 rounded text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {locateLabel}
            </button>
          )}

          <button
            onClick={() => go('sop')}
            className="px-2 py-1.5 rounded text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Open SOP library
          </button>
        </div>

        {running && done.length === sop.steps.length && (
          <p className="text-[length:calc(10px*var(--fs))] text-status-neutral">
            All {sop.steps.length} steps signed off. {sop.autoIncident ? 'An incident was raised automatically. ' : ''}
            {sop.autoClose ? 'The alarm will close once the tag clears.' : 'Close the alarm once the work order is complete.'}
          </p>
        )}
      </div>
    </section>
  );
};

export default FixPanel;
