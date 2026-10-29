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
  CRITICAL: { bg: 'rgba(188,32,35,0.18)', color: '#EB442C', border: 'rgba(188,32,35,0.4)' },
  HIGH: { bg: 'rgba(188,32,35,0.12)', color: '#EB442C', border: 'rgba(188,32,35,0.3)' },
  MEDIUM: { bg: 'rgba(248,179,36,0.15)', color: '#F8B324', border: 'rgba(248,179,36,0.3)' },
  LOW: { bg: 'rgba(138,155,168,0.12)', color: '#B8C5D1', border: 'rgba(138,155,168,0.3)' },
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
    <div className="h-full flex flex-col text-text-primary bg-primary-900">
      {/* Header */}
      <div className="px-4 py-2 flex justify-between items-center flex-shrink-0 gap-3 flex-wrap bg-primary-800 border-b border-primary-600/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent-blue/15 rounded-lg text-accent-blue">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Standard Operating Procedures</h1>
            <p className="text-xs text-text-muted">
              {SOPS.length} procedures · every alarm this platform raises maps to one of them
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search procedures…"
              className="pl-9 pr-2 py-1.5 text-sm rounded-md outline-none bg-primary-800 border border-primary-600 focus:border-accent-blue transition-colors text-text-primary"
              style={{ width: 220 }}
            />
          </div>
          <button className="btn btn-secondary">
            <Plus className="w-4 h-4" />
            New procedure
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-2 p-2">
        {/* ── List ───────────────────────────────────────────────────────── */}
        <div className="w-[330px] shrink-0 overflow-y-auto no-scrollbar space-y-1.5">
          {list.map((s) => {
            const active = s.id === sop.id;
            const tone = PRIORITY_STYLE[s.priority];
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); setRunning(null); setDone([]); }}
                className={`w-full text-left rounded-lg border px-2 py-2.5 transition-colors ${
                  active
                    ? 'bg-accent-blue/10 border-accent-blue/50'
                    : 'bg-primary-800/60 border-primary-600/40 hover:border-primary-500/60'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-text-primary leading-snug">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-text-secondary font-mono">{s.id} · {s.subsystem}</span>
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[length:calc(9px*var(--fs))] font-bold shrink-0"
                    style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}
                  >
                    {s.priority}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[length:calc(10px*var(--fs))] text-text-muted">
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
        <div className="flex-1 min-w-0 overflow-y-auto no-scrollbar rounded-lg border p-3 bg-primary-800/60 border-primary-600/40">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-text-primary leading-tight">{sop.name}</h2>
              <p className="mt-0.5 text-xs text-text-secondary font-mono">
                {sop.id} · {sop.subsystem} · {sop.category}
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">Duration</div>
                <div className="text-base font-bold font-mono text-text-primary">~{sopDuration(sop.steps)}m</div>
              </div>
              <div>
                <div className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">Closed first time</div>
                <div className="text-base font-bold font-mono text-status-neutral">{sop.successRate}%</div>
              </div>
            </div>
          </div>

          {/* What raises it, and what the AI says about it. */}
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-md border px-2 py-2" style={{ borderColor: 'rgba(32, 120, 207,0.1)', background: 'rgba(32, 120, 207,0.03)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-status-warning" />
                <span className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">Triggered when</span>
              </div>
              <p className="text-xs text-text-primary leading-snug">{sop.trigger}</p>
            </div>

            <div className="rounded-md border border-accent-blue/40 px-2 py-2 bg-accent-blue/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3.5 h-3.5 text-accent-blue" />
                <span className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-accent-blue">What the AI advises</span>
              </div>
              <p className="text-xs text-text-primary leading-snug">{sop.aiSummary}</p>
            </div>
          </div>

          {sop.basis && (
            <p className="mt-2 flex items-center gap-1.5 text-[length:calc(10px*var(--fs))] text-text-muted italic">
              <FileText className="w-3 h-3" /> {sop.basis}
            </p>
          )}

          {/* Steps */}
          <div className="mt-4 flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Procedure</h3>
            <div className="flex-1 h-px" style={{ background: 'rgba(32, 120, 207,0.08)' }} />
            <button
              onClick={run}
              disabled={running === sop.id}
              className="btn btn-secondary justify-center min-w-[7.5rem] disabled:opacity-60"
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
                  className="flex gap-2.5 rounded-md border px-2 py-2 transition-colors"
                  style={{
                    background: ok ? 'rgba(125,160,202,0.08)' : 'rgba(32, 120, 207,0.02)',
                    borderColor: ok ? 'rgba(125,160,202,0.35)' : 'rgba(32, 120, 207,0.07)',
                  }}
                >
                  <span
                    className="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[length:calc(10px*var(--fs))] font-bold border"
                    style={
                      ok
                        ? { background: 'rgba(125,160,202,0.3)', borderColor: 'rgba(125,160,202,0.8)', color: '#7DA0CA' }
                        : { background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.14)', color: '#8A9BA8' }
                    }
                  >
                    {ok ? <CheckCircle2 className="w-3 h-3" /> : st.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-snug ${ok ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                      {st.action}
                    </p>
                    <p className="mt-0.5 text-[length:calc(10px*var(--fs))] text-text-muted">
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
              className="mt-3 rounded-md border px-2 py-2 flex items-center gap-2 flex-wrap"
              style={{ background: 'rgba(125,160,202,0.1)', borderColor: 'rgba(125,160,202,0.4)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-status-neutral" />
              <span className="text-xs text-status-neutral">
                Procedure complete — every step signed off with its evidence.
              </span>
              <div className="flex-1" />
              <button
                onClick={() => openWorkOrders({ subsystem: sop.subsystem, message: sop.name, priority: sop.priority, status: 'Open' })}
                className="btn btn-secondary !py-1"
              >
                Raise follow-up work order
              </button>
            </div>
          )}

          {/* Automation */}
          <h3 className="mt-4 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">
            Automation
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {AUTOMATION.map(({ key, label, hint, icon: Icon }) => {
              const on = Boolean(sop[key]);
              return (
                <div
                  key={key}
                  className={`rounded-md border px-2 py-2 ${
                    on ? 'bg-accent-blue/10 border-accent-blue/35' : 'bg-white/[0.02] border-primary-600/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${on ? 'text-accent-blue' : 'text-text-muted'}`} />
                    <span className={`text-xs font-medium ${on ? 'text-text-primary' : 'text-text-muted'}`}>{label}</span>
                  </div>
                  <p className="mt-1 text-[length:calc(10px*var(--fs))] text-text-muted leading-snug">{hint}</p>
                  <p className={`mt-1 text-[length:calc(10px*var(--fs))] font-bold ${on ? 'text-accent-blue' : 'text-text-muted'}`}>
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
