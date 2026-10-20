/**
 * One AI recommendation.
 *
 * The card is built around the three questions an operator asks before they
 * will press a button that changes the airfield: what did it see, why does it
 * believe that, and what happens if I agree. Observation and recommendation are
 * always visible; the evidence, the named model and the systems it consumed sit
 * behind a disclosure so the card stays scannable without hiding its working.
 *
 * Shadow mode is a first-class action rather than a footnote. A control room
 * adopts this kind of advice by watching it be right for a few weeks first, and
 * a panel that only offers Execute and Dismiss has nowhere to put that.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  TrendingUp,
  ClipboardCheck,
  Sparkles,
  ChevronDown,
  Play,
  Eye,
  X,
  Check,
  Cpu,
  Plug,
  Clock,
} from 'lucide-react';
import { AiClass, AiInsight, AiSeverity, DOMAIN_LABEL } from '../types';
import { useAiStore, useDisposition } from '../store';
import { useToast } from '../../hooks/useToast';

/** Plain words for the severity, in place of the model's own taxonomy. */
const SEVERITY_WORD: Record<AiSeverity, string> = {
  critical: 'Needs attention now',
  warning: 'Worth a look',
  opportunity: 'Opportunity',
};

const CLASS_ICON: Record<AiClass, React.ElementType> = {
  detect: Radar,
  predict: TrendingUp,
  prescribe: ClipboardCheck,
  optimise: Sparkles,
};

/* The card itself stays the one AI-blue identity regardless of severity —
 * only the small badge in the header carries the severity color, as a quiet
 * signal rather than a wash across the whole card. A "critical" and an
 * "opportunity" card should look like the same product, not three different
 * alert skins glued together. */
const TONE: Record<AiSeverity, { badgeBg: string; badgeText: string; bullet: string }> = {
  critical: {
    badgeBg: 'bg-status-error/15 border-status-error/35',
    badgeText: 'text-status-error',
    bullet: 'text-status-error',
  },
  warning: {
    badgeBg: 'bg-status-warning/15 border-status-warning/35',
    badgeText: 'text-status-warning',
    bullet: 'text-status-warning',
  },
  opportunity: {
    badgeBg: 'bg-accent-blue/15 border-accent-blue/35',
    badgeText: 'text-accent-blue',
    bullet: 'text-accent-blue',
  },
};

interface Props {
  insight: AiInsight;
  /** Rail variant: tighter padding and type, for the 320 px console columns. */
  compact?: boolean;
  /** Show which console the insight belongs to — used by the copilot drawer. */
  showDomain?: boolean;
}

const AiInsightCard: React.FC<Props> = ({ insight, compact = false, showDomain = false }) => {
  const [open, setOpen] = useState(false);
  const disposition = useDisposition(insight.id);
  const setDisposition = useAiStore((s) => s.set);
  const { addToast } = useToast();

  const tone = TONE[insight.severity];
  const Icon = CLASS_ICON[insight.kind];
  const settled = disposition !== 'pending';

  const accept = () => {
    insight.run?.();
    setDisposition(insight.id, 'accepted');
    addToast({ type: 'success', title: insight.action, message: insight.outcome });
  };

  const shadow = () => {
    setDisposition(insight.id, 'shadow');
    addToast({
      type: 'info',
      title: 'Running in shadow',
      message: `${insight.title} — the model will act on paper only; outcomes are logged for comparison.`,
    });
  };

  const dismiss = () => {
    setDisposition(insight.id, 'dismissed');
    addToast({
      type: 'warning',
      title: 'Recommendation dismissed',
      message: 'Logged as operator-rejected and fed back into model calibration.',
    });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: disposition === 'dismissed' ? 0.45 : 1, y: 0 }}
      className="glass-panel rounded-2xl overflow-hidden"
    >
      {/* Class, confidence and horizon. Everything an operator needs to triage
          the card before reading a word of the body. Severity is a small
          badge, not a wash across the header — the card is still visibly
          "the AI panel" first, "a critical one" second. */}
      <header className="flex items-center gap-2 px-3.5 py-2.5 border-b border-accent-blue/15">
        <Icon className="w-4 h-4 shrink-0 text-accent-blue" />

        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[length:calc(10px*var(--fs))] font-semibold uppercase tracking-wide ${tone.badgeBg} ${tone.badgeText}`}>
          {SEVERITY_WORD[insight.severity]}
        </span>

        {showDomain && (
          <span className="text-[length:calc(10px*var(--fs))] text-text-muted truncate">
            · {DOMAIN_LABEL[insight.domain]}
          </span>
        )}

        <div className="flex-1" />

        <span className="hidden sm:flex items-center gap-1 text-[length:calc(10px*var(--fs))] text-text-muted shrink-0">
          <Clock className="w-3 h-3" />
          {insight.horizon}
        </span>

        {/* Confidence lives in Details. On the face of the card a percentage
            invites an argument about the number instead of a decision about the
            recommendation. */}
      </header>

      <div className={compact ? 'p-2.5 space-y-2' : 'p-4 space-y-3'}>
        <h3
          className={`font-semibold text-text-primary leading-snug ${
            compact ? 'text-[length:calc(12px*var(--fs))]' : 'text-sm'
          }`}
        >
          {insight.title}
        </h3>

        <p
          className={`text-text-secondary leading-snug ${compact ? 'text-[length:calc(11px*var(--fs))]' : 'text-[length:calc(13px*var(--fs))]'}`}
        >
          {insight.plain ?? insight.observation}
        </p>

        {/* The prescription — a glass chip of its own rather than a flat,
            hard-edged box, so it reads as part of the same card instead of a
            pasted-on callout. */}
        <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl px-3 py-2">
          <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-accent-blue mb-1 font-semibold">
            What to do
          </h4>
          <p className={`text-text-secondary leading-snug ${compact ? 'text-[length:calc(11px*var(--fs))]' : 'text-xs'}`}>
            {insight.recommendation}
          </p>
        </div>

        {/* Working. Collapsed by default; an operator who has already decided
            does not need it, and one who has not needs all of it. */}
        <div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            />
            Details
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-2 mb-2 px-2 py-1 rounded bg-status-success/10 border border-status-success/30 text-[length:calc(11px*var(--fs))] text-status-success">
                  {insight.impact}
                </p>

                {/* The engineering wording, kept — it is what makes the claim
                    checkable, and the plain line above is what makes it read. */}
                {insight.plain && (
                  <p className="mb-2 text-[length:calc(11px*var(--fs))] text-text-secondary leading-snug">
                    {insight.observation}
                  </p>
                )}

                <ul className="mt-2 space-y-1">
                  {insight.evidence.map((e, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[length:calc(11px*var(--fs))] text-text-secondary leading-snug"
                    >
                      <span className={`shrink-0 ${tone.bullet}`}>•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 pt-2 border-t border-primary-500/30 space-y-1.5">
                  <div className="flex gap-1.5 text-[length:calc(10px*var(--fs))] text-text-muted">
                    <Cpu className="w-3 h-3 shrink-0 mt-px" />
                    <span>{insight.model} · {insight.confidence}% confidence</span>
                  </div>
                  <div className="flex gap-1.5 text-[length:calc(10px*var(--fs))] text-text-muted">
                    <Plug className="w-3 h-3 shrink-0 mt-px" />
                    <span>{insight.sources.join(' · ')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disposition. Once settled the buttons collapse to a status line —
            re-offering Execute on something already executed is how demos end
            up firing the same SOP three times. */}
        {settled ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span
              className={`flex items-center gap-1.5 text-[length:calc(11px*var(--fs))] font-medium ${
                disposition === 'accepted'
                  ? 'text-status-success'
                  : disposition === 'shadow'
                  ? 'text-accent-blue'
                  : 'text-text-muted'
              }`}
            >
              {disposition === 'accepted' && <Check className="w-3.5 h-3.5" />}
              {disposition === 'shadow' && <Eye className="w-3.5 h-3.5" />}
              {disposition === 'dismissed' && <X className="w-3.5 h-3.5" />}
              {disposition === 'accepted'
                ? 'Done'
                : disposition === 'shadow'
                ? 'Watching only'
                : 'Dismissed'}
            </span>
            <button
              onClick={() => setDisposition(insight.id, 'pending')}
              className="text-[length:calc(10px*var(--fs))] text-text-muted hover:text-text-secondary transition-colors"
            >
              Undo
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <button
              onClick={accept}
              className="btn btn-primary text-[length:calc(11px*var(--fs))] py-1"
            >
              <Play className="w-3 h-3" />
              {insight.action}
            </button>
            <button
              onClick={shadow}
              className="btn btn-secondary text-[length:calc(11px*var(--fs))] py-1"
            >
              <Eye className="w-3 h-3" />
              Just watch
            </button>
            <button
              onClick={dismiss}
              className="px-2 py-1.5 rounded-full text-[length:calc(11px*var(--fs))] text-text-muted hover:text-text-secondary transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default AiInsightCard;
