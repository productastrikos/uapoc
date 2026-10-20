import React, { useEffect, useRef } from 'react';
import { CheckCircle, Circle, ClipboardList, ShieldAlert, User } from 'lucide-react';

/**
 * A single procedure step as the operator sees it.
 *
 * `duration` is the nominal time the real SOP allows for the step; it is shown
 * as guidance and is deliberately not tied to the simulation clock.
 */
export interface SOPPanelStep {
  action: string;
  duration?: number;
  responsible?: string;
  critical?: boolean;
}

export type SOPAccent = 'red' | 'gold' | 'teal';

interface SOPPanelProps {
  /** Which procedure this is, e.g. "SOP-003 · Suspicious Package". */
  title: string;
  /** What set the procedure off. */
  trigger: string;
  priority?: string;
  steps: SOPPanelStep[];
  /** Index of the step being executed; -1 (or `active: false`) when idle. */
  currentStep: number;
  active: boolean;
  accent?: SOPAccent;
  /** Shown under the header - the live state of the thing being simulated. */
  subtitle?: string;
  className?: string;
}

// Legacy prop values (`red` / `gold` / `teal`) are kept for API compatibility
// with callers elsewhere in the simulation subsystem; they now map onto the
// app's three semantic tones instead of the old sim/simgold/simteal ramp.
const ACCENT: Record<SOPAccent, { text: string; border: string; bg: string; barClass: string; spin: string }> = {
  red: {
    text: 'text-status-error',
    border: 'border-status-error/45',
    bg: 'bg-status-error/10',
    barClass: 'bg-status-error',
    spin: 'border-status-error',
  },
  gold: {
    text: 'text-status-warning',
    border: 'border-status-warning/45',
    bg: 'bg-status-warning/10',
    barClass: 'bg-status-warning',
    spin: 'border-status-warning',
  },
  teal: {
    text: 'text-accent-blue',
    border: 'border-accent-blue/45',
    bg: 'bg-accent-blue/10',
    barClass: 'bg-accent-blue',
    spin: 'border-accent-blue',
  },
};

/**
 * The standard-operating-procedure rail that sits beside every simulation.
 *
 * The point is that the picture on the right and the checklist on the left are
 * the same run: whatever the scene is doing right now is the highlighted step
 * here, with who owns it and what happens next, so a viewer can follow the
 * procedure instead of guessing at the animation.
 */
const SOPPanel: React.FC<SOPPanelProps> = ({
  title,
  trigger,
  priority,
  steps,
  currentStep,
  active,
  accent = 'teal',
  subtitle,
  className = '',
}) => {
  const tone = ACCENT[accent];
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  const clamped = Math.max(-1, Math.min(currentStep, steps.length - 1));
  const completed = active ? Math.max(0, clamped) : 0;
  const progress = steps.length ? (active ? ((clamped + 1) / steps.length) * 100 : 0) : 0;

  // Keep the running step in view without scrolling the page behind the panel.
  useEffect(() => {
    const el = activeRef.current;
    const box = listRef.current;
    if (!active || !el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    box.scrollTo({ top: top - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [clamped, active]);

  return (
    <div className={`hbms-control-panel flex flex-col ${className}`}>
      {/* Header */}
      <div className={`p-3 border-b border-primary-600/40 ${active ? tone.bg : ''}`}>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg border ${
                active ? `${tone.border} ${tone.bg}` : 'border-primary-600/40 bg-primary-800/40'
              }`}
            >
              {active ? (
                <ShieldAlert className={`w-4 h-4 ${tone.text}`} />
              ) : (
                <ClipboardList className="w-4 h-4 text-text-muted" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-text-primary truncate">{title}</h4>
              <p className="text-[length:calc(11px*var(--fs))] text-text-muted truncate">{trigger}</p>
            </div>
          </div>
          <span
            className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[length:calc(10px*var(--fs))] font-bold uppercase tracking-wider border ${
              active ? `${tone.border} ${tone.text} ${tone.bg}` : 'border-primary-600/40 text-text-muted'
            }`}
          >
            {active ? 'Running' : 'Standby'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[length:calc(11px*var(--fs))]">
          <span className="text-text-muted">
            {priority ? (
              <>
                Priority: <span className={tone.text}>{priority.toUpperCase()}</span>
              </>
            ) : (
              'Procedure ready'
            )}
          </span>
          <span className="text-text-secondary font-medium tabular-nums">
            Step {active ? Math.min(clamped + 1, steps.length) : 0}/{steps.length}
          </span>
        </div>

        <div className="mt-2 w-full bg-primary-800/60 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${tone.barClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {subtitle && <p className="mt-2 text-[length:calc(11px*var(--fs))] text-text-muted leading-snug">{subtitle}</p>}
      </div>

      {/* Steps */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-2.5 min-h-0">
        <ol className="space-y-2">
          {steps.map((step, i) => {
            const isDone = active && i < completed;
            const isNow = active && i === clamped;
            return (
              <li
                key={`${i}-${step.action}`}
                ref={isNow ? activeRef : undefined}
                className={`rounded-lg border p-2.5 transition-all duration-500 ${
                  isNow
                    ? `${tone.border} ${tone.bg}`
                    : isDone
                    ? 'border-status-success/30 bg-status-success/10'
                    : 'border-primary-700/40 bg-primary-800/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-status-success" />
                    ) : isNow ? (
                      <div className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${tone.spin}`} />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug ${
                        isNow ? 'text-text-primary font-semibold' : isDone ? 'text-text-secondary' : 'text-text-muted'
                      }`}
                    >
                      <span className="text-text-muted tabular-nums mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                      {step.action}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:calc(10px*var(--fs))]">
                      {step.responsible && (
                        <span className="flex items-center gap-1 text-text-muted">
                          <User className="w-3 h-3" />
                          {step.responsible}
                        </span>
                      )}
                      {step.duration != null && (
                        <span className="text-text-muted tabular-nums">{step.duration}s</span>
                      )}
                      {step.critical && (
                        <span className="px-1.5 py-0.5 rounded bg-status-error/10 border border-status-error/30 text-status-error font-semibold">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default SOPPanel;
