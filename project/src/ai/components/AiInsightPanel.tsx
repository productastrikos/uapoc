/**
 * The AI advisory panel a module drops in.
 *
 * Two variants over one component: `panel` for the wide dashboards, `rail` for
 * the 320 px console columns. Keeping them together means a change to how a
 * recommendation is framed lands everywhere at once, which is the whole point
 * of having a single advisory model.
 *
 * ── Why the panel is collapsed by default ──────────────────────────────────
 * A full advisory block on every subsystem page turned the AI into wallpaper:
 * eleven identical purple boxes, each several hundred pixels tall, pushing the
 * operational content the page actually exists for below the fold. It also
 * made the demo read as if the AI were shouting on every screen at once.
 *
 * So the panel is a single line until somebody asks for more. The line still
 * carries the headline — the operator can see *that* there is a recommendation
 * and *what* it is about without opening anything — and expands in place on
 * click. The rail variant stays open, because on the AGL and apron consoles the
 * advisory column is the feature being demonstrated, not a footnote to it.
 *
 * ── Why only two ───────────────────────────────────────────────────────────
 * The catalogue holds three or four per domain. Showing all of them invites the
 * operator to skim; showing the two that matter invites them to read. Ranked by
 * severity, then by whether anybody has dealt with them yet, so the line always
 * leads with the worst thing still outstanding.
 *
 * A console with live, state-derived insights passes them in `insights`; the
 * catalogue is only the fallback. That keeps the AGL screen honest — what it
 * shows is computed from its own tags, not from a list of nice sentences.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, ChevronDown, ShieldCheck } from 'lucide-react';
import { AiDomain, AiInsight, AiSeverity, DOMAIN_LABEL } from '../types';
import { insightsFor } from '../catalogue';
import { useAiStore } from '../store';
import AiInsightCard from './AiInsightCard';

interface Props {
  domain: AiDomain;
  /** Overrides the catalogue — used by consoles that compute their own. */
  insights?: AiInsight[];
  variant?: 'panel' | 'rail';
  /** Panel variant only: how many columns at large widths. */
  columns?: 1 | 2;
  title?: string;
  /** Panel variant only: start expanded. Off everywhere by default. */
  defaultOpen?: boolean;
}

/** Never more than this on a page. See the header comment. */
const MAX_SHOWN = 2;

const SEVERITY_RANK: Record<AiSeverity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
};

const AiInsightPanel: React.FC<Props> = ({
  domain,
  insights,
  variant = 'panel',
  columns = 2,
  title,
  defaultOpen = false,
}) => {
  const dispositions = useAiStore((s) => s.dispositions);
  const [open, setOpen] = useState(defaultOpen);

  const source = insights ?? insightsFor(domain);

  // Worst-first, and anything already dispositioned sinks — the collapsed line
  // shows one headline, so it had better be the one still needing an operator.
  const items = useMemo(() => {
    const ranked = [...source].sort((a, b) => {
      const aSettled = (dispositions[a.id] ?? 'pending') !== 'pending';
      const bSettled = (dispositions[b.id] ?? 'pending') !== 'pending';
      if (aSettled !== bSettled) return aSettled ? 1 : -1;
      const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (bySeverity !== 0) return bySeverity;
      return b.confidence - a.confidence;
    });
    return ranked.slice(0, MAX_SHOWN);
  }, [source, dispositions]);

  const pending = items.filter((i) => (dispositions[i.id] ?? 'pending') === 'pending').length;
  const heading = title ?? `AI Advisory — ${DOMAIN_LABEL[domain]}`;

  // Two side by side only when there are actually two; a lone card stretched
  // across a two-column grid looks like something failed to load.
  const gridCols = columns === 2 && items.length > 1 ? 'lg:grid-cols-2' : '';

  if (items.length === 0 && variant === 'rail') return null;

  // `shrink-0` on the rail section matters: the console rails are scrolling
  // flex columns, and without it this panel is squashed down to its header by
  // the taller blocks beneath it.
  if (variant === 'rail') {
    return (
      <section className="fs-ai shrink-0 bg-primary-800/70 border border-accent-blue/30 rounded-lg overflow-hidden">
        <header className="flex items-center gap-2 px-3 py-2 border-b border-accent-blue/20 bg-accent-blue/10">
          <Brain className="w-4 h-4 text-accent-blue" />
          <h3 className="text-xs font-semibold text-accent-blue uppercase tracking-wide">
            AI Advisory
          </h3>
          <div className="flex-1" />
          {pending > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-accent-blue/20 border border-accent-blue/40 text-[length:calc(10px*var(--fs))] font-mono text-accent-blue">
              {pending}
            </span>
          )}
        </header>
        <div className="p-2 space-y-2">
          {items.map((i) => (
            <AiInsightCard key={i.id} insight={i} compact />
          ))}
        </div>
      </section>
    );
  }

  const lead = items[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fs-ai glass-panel rounded-xl overflow-hidden"
    >
      {/* The one line. Everything needed to decide whether to open it: that the
          AI has something, how urgent, and what about. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={open ? 'Collapse AI advisory' : 'Expand AI advisory'}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-blue/10"
      >
        <div className="p-1.5 bg-accent-blue/15 rounded-lg shrink-0">
          <Brain className="w-4 h-4 text-accent-blue" />
        </div>

        <span className="text-sm font-bold uppercase tracking-wide text-accent-blue shrink-0">
          AI Advisory
        </span>

        <span className="hidden md:inline text-xs text-text-muted shrink-0">
          · {DOMAIN_LABEL[domain]}
        </span>

        {/* The headline itself, truncated rather than wrapped so the bar stays
            exactly one line tall whatever the insight is called. */}
        {lead && (
          <span className="hidden lg:block flex-1 min-w-0 truncate text-xs text-text-secondary">
            {lead.title}
          </span>
        )}

        <span className="flex-1 lg:hidden" />

        {pending > 0 && (
          <span
            title={`${pending} awaiting a decision`}
            className="shrink-0 min-w-[1.375rem] h-[1.375rem] px-1 flex items-center justify-center rounded-full bg-accent-blue text-white text-[11px] font-bold"
          >
            {pending}
          </span>
        )}

        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-accent-blue" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-accent-blue/15"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-bold text-text-primary leading-tight">{heading}</h2>
                <span className="text-xs text-text-muted">
                  Astrikos S!aP · Sense → Interpret → Act → Predict
                </span>
                <div className="flex-1" />
                {/* Every recommendation on this platform is advisory. Saying so
                    on the panel itself is worth more than a footnote nobody
                    reads, and it is the honest answer to "does it control
                    anything?" */}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-900/50 border border-primary-500/50 text-xs text-text-muted">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Advisory only · operator confirms every action
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">
                  No active recommendations. Models are monitoring this domain continuously.
                </p>
              ) : (
                <div className={`grid gap-3 ${gridCols}`}>
                  {items.map((i) => (
                    <AiInsightCard key={i.id} insight={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default AiInsightPanel;
