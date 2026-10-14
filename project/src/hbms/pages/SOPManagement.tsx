/**
 * The SOP library.
 *
 * ── What this replaced ─────────────────────────────────────────────────────
 * A table of four smart-city procedures — SMART TRAFFIC, CCTV SERVICE,
 * ASSESSMENT TAX, FEEDBACK — carried over from the template this console was
 * built from. On an airport demo they were worse than nothing: they told a
 * visitor the platform had never been pointed at an airport.
 *
 * This is the real library (see sops.ts): the procedures that actually
 * discharge the alarms this platform raises, each with numbered steps, the role
 * that owns each one, the minutes it takes, and the evidence that proves it was
 * done. It is the same library `FixPanel` matches an alarm against, so what an
 * operator is shown beside an alarm and what they find here are the same
 * document.
 *
 * ── The shape ──────────────────────────────────────────────────────────────
 * List on the left, the selected procedure in full on the right. A procedure is
 * a thing you read end to end before you commit to running it, so the detail
 * panel shows every step rather than a summary and a link.
 */

import React, { useMemo, useState } from 'react';
import {
  Bot, CheckCircle2, ClipboardList, Clock, FileText, Plus, Search, Shield, Users, Zap,
} from 'lucide-react';
import { SOPS, sopDuration, type Sop } from '../sops';
import { useHbmsStore } from '../store/useHbmsStore';

const PRIORITY_STYLE: Record<Sop['priority'], { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.35)' },
  HIGH: { bg: 'rgba(249,115,22,0.15)', color: '#fdba74', border: 'rgba(249,115,22,0.35)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#fde68a', border: 'rgba(245,158,11,0.3)' },
  LOW: { bg: 'rgba(1,163,164,0.15)', color: '#9BEAE8', border: 'rgba(1,163,164,0.3)' },
};

/** The automation switches, named so an operator can tell what they do. */
const AUTOMATION: { key: keyof Sop; label: string; hint: string; icon: React.ElementType }[] = [
  { key: 'autoIncident', label: 'Raise incident automatically', hint: 'An incident record is opened the moment this procedure starts', icon: Shield },
  { key: 'autoAssign', label: 'Assign owner automatically', hint: 'The first step is assigned to the on-shift role without waiting', icon: Users },
  { key: 'autoClose', label: 'Close alarm on clear', hint: 'The alarm closes itself once the underlying tag returns to normal', icon: CheckCircle2 },
];

const SOPManagement: React.FC = () => {
  const openWorkOrders = useHbmsStore((s) => s.openWorkOrders);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(SOPS[0].id);
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<number[]>([]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SOPS;
    return SOPS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.subsystem.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [query]);

  const sop = SOPS.find((s) => s.id === selectedId) ?? SOPS[0];

  const run = () => {
    setRunning(sop.id);
    setDone([]);
    sop.steps.forEach((s, i) => {
      window.setTimeout(() => setDone((d) => [...d, s.order]), 450 * (i + 1));
    });
  };

  const complete = running === sop.id && done.length === sop.steps.length;

  return (
    <div className="h-full flex flex-col text-sim-100" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <div
        className="px-5 py-3 flex justify-between items-center flex-shrink-0 gap-4 flex-wrap"
        style={{ background: 'var(--app-panel)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(1,163,164,0.15)', color: '#22C7C6' }}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sim-100 leading-tight">Standard Operating Procedures</h1>
            <p className="text-xs text-sim-400">
              {SOPS.length} procedures · every alarm this platform raises maps to one of them
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sim-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search procedures…"
              className="pl-9 pr-3 py-1.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-simteal-500/50"
              style={{ background: 'var(--app-surface-soft)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--app-text)', width: 220 }}
            />
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-sim-300 hover:text-sim-100 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
          >
            <Plus className="w-4 h-4" />
            New procedure
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 p-3">
        {/* ── List ───────────────────────────────────────────────────────── */}
        <div className="w-[330px] shrink-0 overflow-y-auto no-scrollbar space-y-1.5">
          {list.map((s) => {
            const active = s.id === sop.id;
            const tone = PRIORITY_STYLE[s.priority];
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); setRunning(null); setDone([]); }}
                className="w-full text-left rounded-lg border px-3 py-2.5 transition-all hover:brightness-125"
                style={{
                  background: active ? 'rgba(1,163,164,0.12)' : 'var(--app-surface)',
                  borderColor: active ? 'rgba(1,163,164,0.6)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-sim-100 leading-snug">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-sim-400 font-mono">{s.id} · {s.subsystem}</span>
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[length:calc(9px*var(--fs))] font-bold shrink-0"
                    style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}
                  >
                    {s.priority}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[length:calc(10px*var(--fs))] text-sim-500">
                  <span>{s.steps.length} steps</span>
                  <span>·</span>
                  <span>~{sopDuration(s.steps)} min</span>
                  <span>·</span>
                  <span>{s.runsThisMonth} runs</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Detail ─────────────────────────────────────────────────────── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto no-scrollbar rounded-lg border p-4"
          style={{ background: 'var(--app-surface)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-sim-100 leading-tight">{sop.name}</h2>
              <p className="mt-0.5 text-xs text-sim-400 font-mono">
                {sop.id} · {sop.subsystem} · {sop.category}
              </p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-sim-500">Duration</div>
                <div className="text-base font-bold font-mono text-sim-100">~{sopDuration(sop.steps)}m</div>
              </div>
              <div>
                <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-sim-500">Closed first time</div>
                <div className="text-base font-bold font-mono text-emerald-300">{sop.successRate}%</div>
              </div>
            </div>
          </div>

          {/* What raises it, and what the AI says about it. */}
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-md border px-3 py-2" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-sim-500">Triggered when</span>
              </div>
              <p className="text-xs text-sim-200 leading-snug">{sop.trigger}</p>
            </div>

            <div className="rounded-md border border-ai-500/40 px-3 py-2 bg-ai-900/25">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3.5 h-3.5 text-ai-300" />
                <span className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-ai-200">What the AI advises</span>
              </div>
              <p className="text-xs text-sim-200 leading-snug">{sop.aiSummary}</p>
            </div>
          </div>

          {sop.basis && (
            <p className="mt-2 flex items-center gap-1.5 text-[length:calc(10px*var(--fs))] text-sim-500 italic">
              <FileText className="w-3 h-3" /> {sop.basis}
            </p>
          )}

          {/* Steps */}
          <div className="mt-4 flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-sim-500">Procedure</h3>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <button
              onClick={run}
              disabled={running === sop.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: 'rgba(1,163,164,0.2)', border: '1px solid rgba(1,163,164,0.6)', color: '#22C7C6' }}
            >
              <Clock className="w-3 h-3" />
              {complete ? 'Complete' : running === sop.id ? 'Running…' : 'Run procedure'}
            </button>
          </div>

          <ol className="mt-2 space-y-1.5">
            {sop.steps.map((st) => {
              const ok = running === sop.id && done.includes(st.order);
              return (
                <li
                  key={st.order}
                  className="flex gap-2.5 rounded-md border px-3 py-2 transition-colors"
                  style={{
                    background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: ok ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <span
                    className="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[length:calc(10px*var(--fs))] font-bold border"
                    style={
                      ok
                        ? { background: 'rgba(16,185,129,0.25)', borderColor: 'rgba(52,211,153,0.7)', color: '#6EE7B7' }
                        : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.14)', color: '#8A9BA8' }
                    }
                  >
                    {ok ? <CheckCircle2 className="w-3 h-3" /> : st.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-snug ${ok ? 'text-sim-400 line-through' : 'text-sim-200'}`}>
                      {st.action}
                    </p>
                    <p className="mt-0.5 text-[length:calc(10px*var(--fs))] text-sim-500">
                      {st.role} · {st.minutes} min
                      {st.after?.length ? ` · after step ${st.after.join(', ')}` : ''}
                      {st.evidence ? ` · evidence: ${st.evidence}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {complete && (
            <div
              className="mt-3 rounded-md border px-3 py-2 flex items-center gap-2 flex-wrap"
              style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span className="text-xs text-emerald-200">
                Procedure complete — every step signed off with its evidence.
              </span>
              <div className="flex-1" />
              <button
                onClick={() => openWorkOrders({ subsystem: sop.subsystem, message: sop.name, priority: sop.priority, status: 'Open' })}
                className="px-2.5 py-1 rounded text-xs font-medium"
                style={{ background: 'rgba(1,163,164,0.2)', border: '1px solid rgba(1,163,164,0.6)', color: '#22C7C6' }}
              >
                Raise follow-up work order
              </button>
            </div>
          )}

          {/* Automation */}
          <h3 className="mt-4 mb-2 text-xs font-bold uppercase tracking-widest text-sim-500">
            Automation
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {AUTOMATION.map(({ key, label, hint, icon: Icon }) => {
              const on = Boolean(sop[key]);
              return (
                <div
                  key={key}
                  className="rounded-md border px-3 py-2"
                  style={{
                    background: on ? 'rgba(1,163,164,0.08)' : 'rgba(255,255,255,0.02)',
                    borderColor: on ? 'rgba(1,163,164,0.35)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${on ? 'text-accent-teal' : 'text-sim-500'}`} />
                    <span className={`text-xs font-medium ${on ? 'text-sim-100' : 'text-sim-500'}`}>{label}</span>
                  </div>
                  <p className="mt-1 text-[length:calc(10px*var(--fs))] text-sim-500 leading-snug">{hint}</p>
                  <p className={`mt-1 text-[length:calc(10px*var(--fs))] font-bold ${on ? 'text-accent-teal' : 'text-sim-500'}`}>
                    {on ? 'ON' : 'OFF'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOPManagement;
