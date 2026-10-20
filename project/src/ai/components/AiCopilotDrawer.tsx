/**
 * The AI Advisory drawer.
 *
 * ── What this used to be, and why it changed ───────────────────────────────
 * It opened on everything: three severity counters, a pending/all toggle, and
 * thirteen domain chips wrapped over three rows — forty recommendations behind
 * a filter builder. An operator on the airfield lighting screen had to work out
 * which chip meant their screen before they could read a single sentence.
 *
 * The app already knows which console is open, so it does the filtering. The
 * drawer opens scoped to the active domain, leads with what that screen is
 * telling you, and everything from elsewhere is collapsed into one line the
 * operator can open if they want it. No chips, no toggles, no counters to
 * decode: a list of recommendations for where you are, worst first.
 *
 * ── The list is a list, not a table of cards ───────────────────────────────
 * Each row states the finding in one line. Opening a row is what reveals the
 * evidence, the model behind it and the actions — so the drawer answers "is
 * there anything I need to know?" at a glance, and "what exactly, and why?" on
 * demand, which is the order an operator actually asks those questions in.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, ChevronDown, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { AiDomain, AiInsight, AiSeverity, DOMAIN_LABEL } from '../types';
import { AI_CATALOGUE } from '../catalogue';
import { useAiStore } from '../store';
import AiInsightCard from './AiInsightCard';

const SEVERITY_RANK: Record<AiSeverity, number> = { critical: 0, warning: 1, opportunity: 2 };

const SEVERITY_DOT: Record<AiSeverity, string> = {
  critical: 'bg-status-error',
  warning: 'bg-status-warning',
  opportunity: 'bg-accent-teal',
};

const SEVERITY_LABEL: Record<AiSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  opportunity: 'Opportunity',
};

const SEVERITY_BADGE: Record<AiSeverity, string> = {
  critical: 'bg-status-error/15 text-status-error',
  warning: 'bg-status-warning/15 text-status-warning',
  opportunity: 'bg-accent-blue/15 text-accent-blue',
};

/** One recommendation, closed until asked. */
const Row: React.FC<{ insight: AiInsight; showDomain?: boolean }> = ({ insight, showDomain }) => {
  const [open, setOpen] = useState(false);
  const disposition = useAiStore((s) => s.dispositions[insight.id] ?? 'pending');

  return (
    <li className="border-b border-accent-blue/10 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent-blue/10"
        aria-expanded={open}
      >
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[insight.severity]}`} />

        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-text-primary leading-snug">
            {insight.title}
          </span>
          <span className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-text-muted">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide text-[10px] ${SEVERITY_BADGE[insight.severity]}`}>
              {SEVERITY_LABEL[insight.severity]}
            </span>
            <span>{insight.horizon}</span>
            {showDomain && (<><span>·</span><span>{DOMAIN_LABEL[insight.domain]}</span></>)}
            {disposition !== 'pending' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue capitalize">
                {disposition}
              </span>
            )}
          </span>
        </span>

        <ChevronDown
          className={`w-4 h-4 shrink-0 mt-1 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <AiInsightCard insight={insight} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const AiCopilotDrawer: React.FC = () => {
  const open = useAiStore((s) => s.drawerOpen);
  const close = useAiStore((s) => s.closeDrawer);
  const drawerDomain = useAiStore((s) => s.drawerDomain);
  const dispositions = useAiStore((s) => s.dispositions);
  const live = useAiStore((s) => s.liveInsights);

  const [showOthers, setShowOthers] = useState(false);

  const scope: AiDomain | null = drawerDomain;

  const rank = (list: AiInsight[]) =>
    [...list].sort((a, b) => {
      const aS = (dispositions[a.id] ?? 'pending') !== 'pending';
      const bS = (dispositions[b.id] ?? 'pending') !== 'pending';
      if (aS !== bS) return aS ? 1 : -1;
      const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      return s !== 0 ? s : b.confidence - a.confidence;
    });

  // A console that computes its own advisories wins over the written ones —
  // what the AGL screen shows is derived from its tags, not from a nice list.
  const forScope = useMemo(() => {
    if (!scope) return [];
    return rank(live[scope]?.length ? live[scope]! : AI_CATALOGUE.filter((i) => i.domain === scope));
  }, [scope, live, dispositions]);

  const elsewhere = useMemo(
    () => rank(AI_CATALOGUE.filter((i) => i.domain !== scope)),
    [scope, dispositions],
  );

  const pendingHere = forScope.filter((i) => (dispositions[i.id] ?? 'pending') === 'pending').length;
  const pendingElsewhere = elsewhere.filter((i) => (dispositions[i.id] ?? 'pending') === 'pending').length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fs-ai modal-surface fixed top-0 right-0 bottom-0 w-full max-w-[560px] z-[61] flex flex-col shadow-2xl"
          >
            {/* Header: what this is, and what it is about. Nothing to operate. */}
            <header className="shrink-0 px-4 py-3 border-b border-accent-blue/15 bg-primary-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-accent-blue/15 rounded-full">
                  <Brain className="w-5 h-5 text-accent-blue" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-text-primary leading-tight">AI Advisory</h2>
                  <p className="text-xs text-text-muted">
                    {scope ? DOMAIN_LABEL[scope] : 'All consoles'} · advisory only, operator confirms
                  </p>
                </div>
                <div className="flex-1" />
                <button
                  onClick={close}
                  className="p-1.5 rounded-full hover:bg-accent-blue/15 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Close AI Advisory"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* This screen */}
              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  {scope ? `On this screen — ${DOMAIN_LABEL[scope]}` : 'All recommendations'}
                </h3>
                <div className="flex-1" />
                <span className="px-2 py-0.5 rounded-full bg-accent-blue/10 text-xs text-accent-blue font-medium">
                  {pendingHere} awaiting review
                </span>
              </div>

              {forScope.length === 0 ? (
                <p className="px-4 py-8 text-sm text-text-muted text-center">
                  {scope
                    ? 'Nothing outstanding on this screen. Models are monitoring it continuously.'
                    : 'Open a console to see its recommendations.'}
                </p>
              ) : (
                <ul>
                  {forScope.map((i) => <Row key={i.id} insight={i} />)}
                </ul>
              )}

              {/* Everywhere else — one line, closed. The operator asked about
                  this screen; the rest of the estate is available, not offered. */}
              {scope && elsewhere.length > 0 && (
                <div className="mt-2 border-t border-accent-blue/15">
                  <button
                    onClick={() => setShowOthers((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-accent-blue/10 transition-colors"
                  >
                    <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${showOthers ? 'rotate-90' : ''}`} />
                    <span className="text-sm text-text-secondary">Other consoles</span>
                    <div className="flex-1" />
                    <span className="px-2 py-0.5 rounded-full bg-primary-700/60 text-xs text-text-muted">{pendingElsewhere} awaiting review</span>
                  </button>
                  {showOthers && <ul>{elsewhere.map((i) => <Row key={i.id} insight={i} showDomain />)}</ul>}
                </div>
              )}
            </div>

            <footer className="shrink-0 px-4 py-2.5 border-t border-accent-blue/15 bg-primary-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-blue shrink-0" />
              <p className="text-xs text-text-muted">
                Every recommendation is advisory. Nothing here changes the airfield until an
                operator confirms it.
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AiCopilotDrawer;
