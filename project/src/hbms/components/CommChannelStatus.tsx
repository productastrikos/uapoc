// ─────────────────────────────────────────────────────────────────────────────
// src/components/CommChannelStatus.tsx
// Dashboard widget: visualizes the communication path between the LBMS
// subsystem and the central HBMS platform as two endpoint "rectangles"
// connected by a "pipe". Binary health only (green/red, no amber) — any LBMS
// issue reads as fully down, and takes the link down with it (and vice
// versa): from HBMS's point of view there's no meaningful middle ground
// between "fine" and "can't be trusted right now".
//
// LBMS-scoped roles only (LBMS Admin, and any non-Super-Admin role) — Super
// Admin gets the full multi-subsystem view instead, in
// HBMSNetworkTopology.tsx, which puts HBMS at the center with every
// subsystem as its own node rather than one aggregate box.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Wind, Server, Radio, AlertTriangle } from 'lucide-react';

export type SegmentHealth = 'ok' | 'down';
type Scenario = 'auto' | 'lbms' | 'channel' | 'hbms' | 'clear';

interface CommChannelStatusProps {
  /** Current LBMS availability % — used to auto-derive LBMS-side health. */
  lbmsAvailability: number;
  /** Current LBMS open alert count — used to auto-derive LBMS-side health. */
  lbmsAlertCount: number;
  className?: string;
}

const HEALTH_STYLE: Record<SegmentHealth, { color: string; bg: string; border: string; label: string }> = {
  ok:   { color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.32)', label: 'Healthy' },
  down: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)',  label: 'Down' },
};

// Binary on purpose — any shortfall (availability dip or an open alert) reads
// as down. No amber middle state. Exported so HBMSNetworkTopology derives
// each subsystem node's default health the same way before any manual
// demo override is applied.
export const deriveHealth = (availability: number, alertCount: number): SegmentHealth =>
  (availability < 97 || alertCount >= 1) ? 'down' : 'ok';

const SCENARIOS: { key: Scenario; label: string; title: string }[] = [
  { key: 'auto',    label: 'Auto',    title: 'Follow live LBMS telemetry' },
  { key: 'lbms',    label: 'LBMS',    title: 'Preview: LBMS subsystem issue' },
  { key: 'channel', label: 'Link',    title: 'Preview: communication link issue' },
  { key: 'hbms',    label: 'HBMS',    title: 'Preview: HBMS platform issue' },
  { key: 'clear',   label: 'Clear',   title: 'Preview: everything healthy' },
];

const CommChannelStatus: React.FC<CommChannelStatusProps> = ({ lbmsAvailability, lbmsAlertCount, className }) => {
  const autoLeftHealth = deriveHealth(lbmsAvailability, lbmsAlertCount);

  // Each scenario isolates exactly one segment as the culprit so the "which
  // box changes color" diagnosis reads cleanly — the other two stay healthy
  // rather than all three moving together.
  const [scenario, setScenario] = useState<Scenario>('auto');
  const baseLeftHealth: SegmentHealth    = scenario === 'lbms'    ? 'down' : scenario === 'clear' ? 'ok' : scenario === 'auto' ? autoLeftHealth : 'ok';
  const baseChannelHealth: SegmentHealth = scenario === 'channel' ? 'down' : 'ok';
  const hbmsHealth: SegmentHealth        = scenario === 'hbms'    ? 'down' : 'ok';

  // LBMS and the link are coupled, in both directions: any LBMS issue can't
  // be reached through a "healthy" link (so the link reads down too), and a
  // down link means LBMS's own health can no longer be confirmed (so IT
  // reads down too) — either one hitting 'down' takes both down together.
  // HBMS never joins this cascade: this dashboard is HBMS looking at itself,
  // so it only ever shows unhealthy via the manual "HBMS" preview, never as
  // a side effect of LBMS or the link.
  const cascadeDown = baseLeftHealth === 'down' || baseChannelHealth === 'down';
  const leftHealth: SegmentHealth    = cascadeDown ? 'down' : 'ok';
  const channelHealth: SegmentHealth = cascadeDown ? 'down' : 'ok';

  const lbms = HEALTH_STYLE[leftHealth];
  const channel = HEALTH_STYLE[channelHealth];
  const hbms = HEALTH_STYLE[hbmsHealth];

  // Where's the issue? A cascade takes both LBMS and the link down together,
  // so that combined case is named first; otherwise HBMS is the only other
  // segment that can ever be non-ok.
  const diagnosis = cascadeDown
    ? { text: `LBMS is unreachable — the communication link is down, so the subsystem can't be confirmed healthy either`, color: '#ef4444' }
    : hbmsHealth !== 'ok'
    ? { text: `HBMS platform is reporting the issue — LBMS and the link are unaffected`, color: hbms.color }
    : null;

  // Simulated link metrics that drift slightly over time within the
  // channel's current health band — gives the widget a "live" feel.
  const [latency, setLatency] = useState(12);
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    const tick = () => {
      setLatency(channelHealth === 'ok' ? 8 + Math.random() * 14 : NaN);
      setLastSync(0);
    };
    tick();
    const interval = setInterval(tick, 4000);
    return () => clearInterval(interval);
  }, [channelHealth]);

  useEffect(() => {
    const t = setInterval(() => setLastSync((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const flowing = channelHealth !== 'down';

  return (
    <div
      className={`rounded-xl border p-3 flex-shrink-0 ${className ?? ''}`}
      style={{ background: 'var(--app-surface)', borderColor: 'rgba(255,255,255,0.14)', minWidth: 0, maxWidth: '100%' }}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio className="w-3.5 h-3.5 flex-shrink-0" style={{ color: diagnosis?.color ?? '#10b981' }} />
          <span className="text-xs font-bold text-text-primary truncate">Comm. Channel</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-md p-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {SCENARIOS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setScenario(opt.key)}
              title={opt.title}
              className="px-1 py-0.5 rounded text-[length:calc(7px*var(--fs))] font-bold uppercase tracking-wide transition-all leading-none"
              style={{
                background: scenario === opt.key ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: scenario === opt.key ? '#E6EEF6' : '#8A9BA8',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── The visualization: rectangle — pipe — rectangle, each independently colored ── */}
      <div className="flex items-stretch gap-0">
        {/* LBMS endpoint */}
        <div
          className="flex-1 rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1 transition-colors duration-500"
          style={{ background: lbms.bg, borderColor: lbms.color, minWidth: 0 }}
        >
          <Wind className="w-4 h-4 transition-colors duration-500" style={{ color: lbms.color }} />
          <span className="text-[length:calc(11px*var(--fs))] font-bold transition-colors duration-500 text-center leading-tight" style={{ color: lbms.color }}>LBMS</span>
          <span className="text-[length:calc(8px*var(--fs))] text-text-muted leading-tight text-center">HVAC / Lighting</span>
          {leftHealth !== 'ok' && (
            <span className="text-[length:calc(7px*var(--fs))] font-bold uppercase tracking-wide" style={{ color: lbms.color }}>{lbms.label}</span>
          )}
        </div>

        {/* Pipe */}
        <div className="flex-[1.3] flex flex-col items-center justify-center relative px-1" style={{ minWidth: '64px' }}>
          <svg viewBox="0 0 100 24" className="w-full" style={{ height: 24, overflow: 'visible' }}>
            {/* pipe casing */}
            <line x1="2" y1="12" x2="98" y2="12" stroke={channel.color} strokeOpacity={0.22} strokeWidth={8} strokeLinecap="round" />
            {/* live signal line */}
            {flowing ? (
              <line
                x1="2" y1="12" x2="98" y2="12"
                stroke={channel.color} strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray="6 6"
                className="animate-pipe-flow"
              />
            ) : (
              <line x1="2" y1="12" x2="98" y2="12" stroke={channel.color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="3 5" className="animate-comm-fault" />
            )}
            {/* break marker when down */}
            {channelHealth === 'down' && (
              <g className="animate-comm-fault">
                <circle cx="50" cy="12" r="7" fill="#071028" stroke={channel.color} strokeWidth={2} />
                <line x1="46.5" y1="8.5" x2="53.5" y2="15.5" stroke={channel.color} strokeWidth={2} strokeLinecap="round" />
                <line x1="53.5" y1="8.5" x2="46.5" y2="15.5" stroke={channel.color} strokeWidth={2} strokeLinecap="round" />
              </g>
            )}
          </svg>
          <span
            className="mt-1 px-1.5 py-0.5 rounded-full text-[length:calc(8px*var(--fs))] font-bold whitespace-nowrap transition-colors duration-500"
            style={{ background: channel.bg, color: channel.color, border: `1px solid ${channel.color}` }}
          >
            {channelHealth === 'ok' ? 'Connected' : 'Link Down'}
          </span>
        </div>

        {/* HBMS endpoint */}
        <div
          className="flex-1 rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1 transition-colors duration-500"
          style={{ background: hbms.bg, borderColor: hbms.color, minWidth: 0 }}
        >
          <Server className="w-4 h-4 transition-colors duration-500" style={{ color: hbms.color }} />
          <span className="text-[length:calc(11px*var(--fs))] font-bold transition-colors duration-500" style={{ color: hbms.color }}>HBMS</span>
          <span className="text-[length:calc(8px*var(--fs))] text-text-muted leading-tight text-center">Central Platform</span>
          {hbmsHealth !== 'ok' && (
            <span className="text-[length:calc(7px*var(--fs))] font-bold uppercase tracking-wide" style={{ color: hbms.color }}>{hbms.label}</span>
          )}
        </div>
      </div>

      {/* ── Diagnosis footer — names exactly which segment has the issue ───── */}
      <div className="flex items-start justify-between gap-2 mt-2 pt-2 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {diagnosis ? (
          <span className="flex items-start gap-1 text-[length:calc(9px*var(--fs))] font-semibold min-w-0" style={{ color: diagnosis.color }}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" />
            <span>{diagnosis.text}</span>
          </span>
        ) : (
          <span className="text-[length:calc(9px*var(--fs))] text-text-muted flex-shrink-0">
            All segments healthy · Latency <span className="font-semibold" style={{ color: channel.color }}>{latency.toFixed(0)}ms</span>
          </span>
        )}
        {(() => {
          const staleness = lastSync > 10 ? 'red' : lastSync > 5 ? 'amber' : 'ok';
          const color = staleness === 'red' ? '#f87171' : staleness === 'amber' ? '#fbbf24' : '#8A9BA8';
          return (
            <span className="text-[length:calc(9px*var(--fs))] flex-shrink-0" style={{ color: '#8A9BA8' }} title="Last data refreshed">
              Last data refreshed <span className="font-semibold tabular-nums" style={{ color }}>{lastSync === 0 ? 'live' : `${lastSync}s ago`}</span>
            </span>
          );
        })()}
      </div>
    </div>
  );
};

export default CommChannelStatus;
