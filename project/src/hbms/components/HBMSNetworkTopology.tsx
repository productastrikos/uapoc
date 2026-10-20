// ─────────────────────────────────────────────────────────────────────────────
// src/components/HBMSNetworkTopology.tsx
// Super Admin's right-sidebar communication widget — HBMS sits at the center
// with every subsystem drawn as its own node around it (as opposed to
// CommChannelStatus's LBMS-only two-box pipe, which every other role keeps
// seeing). A node's health is binary (green/red, same SegmentHealth
// convention as CommChannelStatus), and EVERY node starts green — this
// widget is explicitly a demo prop (click a node to show it going down),
// not a second readout of the subsystem's real availability. It used to
// default a node's color from its availability (first against
// CommChannelStatus's alertCount-based deriveHealth, then against the
// Building Subsystems grid's >=95% cutoff), but every threshold tried still
// disagreed with what the subsystem's own grid card shows somewhere on that
// card (LBMS at 94% availability reads there as "still running, one
// warning, 210/212 assets on" — not remotely "down" — while this widget's
// binary math had no room for that nuance and painted it solid red,
// "inactive"). Starting everything green sidesteps the mismatch entirely:
// nothing here is ever red unless a click put it there.
// A click flips a node to an explicit manual override — demo-only, kept in
// local component state and never written back to any subsystem's real data
// — so a presenter can show the network reacting to an outage live. The
// override is also reported up via onStatusChange so the subsystem grid
// cards' "Last Data Received" badges can flip to Offline in the same moment
// the node goes red, instead of drifting into it on their own schedule.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import { Server, Radio } from 'lucide-react';
import type { HBMSSubsystem } from '../subsystems/catalog';
import type { SegmentHealth } from './CommChannelStatus';

interface HBMSNetworkTopologyProps {
  subsystems: HBMSSubsystem[];
  className?: string;
  /** Fires whenever the manual-override map changes, keyed by subsystem id.
   *  Only holds subsystems the admin has explicitly clicked at least once
   *  (forced to whatever health that click landed on) — anything never
   *  clicked is absent and still tracks its derived health. */
  onStatusChange?: (overrides: Record<number, SegmentHealth>) => void;
}

const HEALTH_COLOR: Record<SegmentHealth, string> = { ok: '#10b981', down: '#ef4444' };

// Angle 0 points straight up, then clockwise — reads naturally left-to-right
// across the top the way a clock face does.
const angleFor = (i: number, n: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

const HBMSNetworkTopology: React.FC<HBMSNetworkTopologyProps> = ({ subsystems, className, onStatusChange }) => {
  // Manual demo overrides only — anything not in this map falls back to its
  // derived health, so toggling never needs to know the "real" value ahead
  // of time, just what it's currently showing.
  const [overrides, setOverrides] = useState<Record<number, SegmentHealth>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const effective = useMemo(
    () => subsystems.map((s) => ({
      sub: s,
      health: overrides[s.id] ?? 'ok' as SegmentHealth,
    })),
    [subsystems, overrides],
  );

  useEffect(() => { onStatusChange?.(overrides); }, [overrides, onStatusChange]);

  const toggle = (sub: HBMSSubsystem, current: SegmentHealth) => {
    setOverrides((prev) => ({ ...prev, [sub.id]: current === 'down' ? 'ok' : 'down' }));
    setSelectedId(sub.id);
  };

  const downCount = effective.filter((e) => e.health === 'down').length;
  const selected = effective.find((e) => e.sub.id === selectedId) ?? null;

  // Layout geometry — a square SVG viewBox with HBMS at its center and every
  // subsystem node placed on a ring around it; percentages below reuse the
  // same 0-100 frame for the absolutely-positioned node buttons so the two
  // layers (lines drawn in SVG, nodes drawn as real DOM buttons for
  // click/hover/focus) stay perfectly aligned.
  const N = subsystems.length;
  const CENTER = 50;
  const RADIUS = 38;

  return (
    <div
      className={`rounded-xl border p-3 flex-shrink-0 ${className ?? ''}`}
      style={{ background: 'var(--app-surface)', borderColor: 'rgba(255,255,255,0.14)', minWidth: 0, maxWidth: '100%' }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio className="w-3.5 h-3.5 flex-shrink-0" style={{ color: downCount > 0 ? '#ef4444' : '#10b981' }} />
          <span className="text-xs font-bold text-text-primary truncate">HBMS Network</span>
        </div>
        <span className="text-[length:calc(9px*var(--fs))] font-bold flex-shrink-0" style={{ color: downCount > 0 ? '#f87171' : '#34d399' }}>
          {N - downCount}/{N} online
        </span>
      </div>

      {/* Radial diagram — lines in an SVG layer, nodes as real buttons positioned on the same ring */}
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          {effective.map(({ sub, health }, i) => {
            const a = angleFor(i, N);
            const x = CENTER + RADIUS * Math.cos(a);
            const y = CENTER + RADIUS * Math.sin(a);
            return (
              <line
                key={sub.id}
                x1={CENTER} y1={CENTER} x2={x} y2={y}
                stroke={HEALTH_COLOR[health]} strokeOpacity={health === 'down' ? 0.75 : 0.35}
                strokeWidth={selectedId === sub.id ? 1.6 : 1}
                strokeDasharray={health === 'down' ? '2 2' : undefined}
              />
            );
          })}
        </svg>

        {/* HBMS hub */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-full"
          style={{
            left: `${CENTER}%`, top: `${CENTER}%`, width: 44, height: 44, marginLeft: -22, marginTop: -22,
            background: 'rgba(37,99,235,0.14)', border: '2px solid #2563EB', boxShadow: '0 0 12px rgba(37,99,235,0.35)',
          }}
          title="HBMS — Central Platform"
        >
          <Server className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
          <span className="text-[length:calc(7px*var(--fs))] font-bold" style={{ color: '#93C5FD' }}>HBMS</span>
        </div>

        {/* Subsystem nodes */}
        {effective.map(({ sub, health }, i) => {
          const a = angleFor(i, N);
          const x = CENTER + RADIUS * Math.cos(a);
          const y = CENTER + RADIUS * Math.sin(a);
          const color = HEALTH_COLOR[health];
          return (
            <button
              key={sub.id}
              onClick={() => toggle(sub, health)}
              title={`${sub.acronym} — ${sub.name} (${health === 'ok' ? 'Healthy' : 'Down'}) · click to toggle (demo)`}
              className="absolute flex flex-col items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{
                left: `${x}%`, top: `${y}%`, width: 30, height: 30, marginLeft: -15, marginTop: -15,
                background: `${color}22`, border: `2px solid ${color}`,
                boxShadow: selectedId === sub.id ? `0 0 0 3px ${color}33` : 'none',
              }}
            >
              <span style={{ color }}>{React.cloneElement(sub.icon as React.ReactElement, { className: 'w-3 h-3' })}</span>
              <span className="text-[length:calc(6px*var(--fs))] font-bold leading-none mt-px" style={{ color }}>{sub.acronym}</span>
            </button>
          );
        })}
      </div>

      {/* Selected-node detail / legend footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {selected ? (
          <span className="text-[length:calc(9px*var(--fs))] font-semibold" style={{ color: HEALTH_COLOR[selected.health] }}>
            {selected.sub.acronym} — {selected.sub.name} · {selected.health === 'ok' ? 'Healthy' : 'Down'}
          </span>
        ) : (
          <span className="text-[length:calc(9px*var(--fs))] text-text-muted">Click a node to toggle its status (demo)</span>
        )}
      </div>
    </div>
  );
};

export default HBMSNetworkTopology;
