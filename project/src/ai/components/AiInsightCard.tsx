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

/** Severity drives the card's accent; the class drives only the chip. */
const TONE: Record<AiSeverity, { border: string; wash: string; text: string; bar: string }> = {
  critical: {
    border: 'border-red-500/45',
    wash: 'from-red-500/10',
    text: 'text-red-300',
    bar: 'bg-red-400',
  },
  warning: {
    border: 'border-amber-500/45',
    wash: 'from-amber-500/10',
    text: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  opportunity: {
    border: 'border-accent-teal/45',
    wash: 'from-accent-teal/10',
    text: 'text-accent-teal',
    bar: 'bg-accent-teal',
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
      className={`bg-gradient-to-br ${tone.wash} to-primary-800/80 border ${tone.border} rounded-lg overflow-hidden`}
    >
      {/* Class, confidence and horizon. Everything an operator needs to triage
          the card before reading a word of the body. */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-primary-500/30 bg-primary-900/30">
        <Icon className={`w-4 h-4 shrink-0 ${tone.text}`} />
        <span className={`text-[length:calc(10px*var(--fs))] font-semibold uppercase tracking-wide ${tone.text}`}>
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

        {/* The prescription. Bordered so it reads as the actionable half of the
            card rather than more prose. */}
        <div className="bg-primary-900/50 border-l-2 border-accent-teal px-3 py-2">
          <h4 className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-accent-teal mb-1">
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
                <p className="mt-2 mb-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[length:calc(11px*var(--fs))] text-emerald-300">
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
                      <span className={`shrink-0 ${tone.text}`}>•</span>
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
                  ? 'text-emerald-300'
                  : disposition === 'shadow'
                  ? 'text-accent-teal'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-teal/20 border border-accent-teal/60 text-[length:calc(11px*var(--fs))] font-medium text-accent-teal hover:bg-accent-teal/30 transition-colors"
            >
              <Play className="w-3 h-3" />
              {insight.action}
            </button>
            <button
              onClick={shadow}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-primary-600/50 border border-primary-500/50 text-[length:calc(11px*var(--fs))] text-text-secondary hover:text-text-primary transition-colors"
            >
              <Eye className="w-3 h-3" />
              Just watch
            </button>
            <button
              onClick={dismiss}
              className="px-2 py-1.5 rounded text-[length:calc(11px*var(--fs))] text-text-muted hover:text-text-secondary transition-colors"
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
