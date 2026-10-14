/**
 * AHU faceplate — the restricted parameter view.
 *
 * The field list is the agreed LBMS scope and is deliberately not extended:
 * Run/Stop, Manual, Trip, RA Temp, SA Temp, FAN RPM, FAN, VSD-RPM, RA Pressure,
 * Cooling Coil Valve %, Duct Smoke, Pre-Filter, Bag-Filter.
 *
 * Run/Stop and Manual/Auto are live controls; everything else is monitoring.
 * The layout follows the same section rhythm as the airfield lighting faceplate
 * so both consoles present an asset the same way.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Gauge, Fan, Filter } from 'lucide-react';
import { useBmsStore } from '../store';
import { FLOOR_LABELS } from '../assets';

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 bg-primary-600/40 border-l-2 border-accent-teal px-3 py-1.5 mb-2">
      {icon}
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
    </div>
    <div className="px-3">{children}</div>
  </div>
);

/** Semicircular gauge for the percentage parameters. */
const MiniGauge: React.FC<{ label: string; pct: number }> = ({ label, pct }) => {
  const clamped = Math.max(0, Math.min(100, pct));
  // Needle sweeps 180°, from pointing left at 0% to right at 100%.
  const angle = -90 + (clamped / 100) * 180;
  const tone = clamped > 85 ? '#F87171' : clamped > 65 ? '#FBBF24' : '#34D399';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 56" className="w-20 h-11">
        <path
          d="M 8 50 A 42 42 0 0 1 92 50"
          fill="none"
          stroke="#0A3A52"
          strokeWidth={9}
          strokeLinecap="round"
        />
        <path
          d="M 8 50 A 42 42 0 0 1 92 50"
          fill="none"
          stroke={tone}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * 132} 132`}
        />
        <g transform={`rotate(${angle} 50 50)`}>
          <line x1={50} y1={50} x2={50} y2={16} stroke="#E6EEF6" strokeWidth={2.5} />
        </g>
        <circle cx={50} cy={50} r={4} fill="#E6EEF6" />
      </svg>
      <span className="text-sm font-mono font-semibold text-text-primary leading-none">
        {Math.round(clamped)}%
      </span>
      <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
    </div>
  );
};

const StatusDot: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div className="flex flex-col items-center gap-1">
    <span
      className={`w-3.5 h-3.5 rounded-full ${
        ok ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`}
    />
    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
  </div>
);

const AhuFaceplate: React.FC = () => {
  const selectedAhuId = useBmsStore((s) => s.selectedAhuId);
  const ahus = useBmsStore((s) => s.ahus);
  const alarms = useBmsStore((s) => s.alarms);
  const select = useBmsStore((s) => s.selectAhu);
  const toggleRunStop = useBmsStore((s) => s.toggleRunStop);
  const toggleManual = useBmsStore((s) => s.toggleManual);

  const asset = ahus.find((a) => a.id === selectedAhuId);
  if (!asset) return null;

  const tagAlarms = alarms.filter((a) => a.tag === asset.id && a.state !== 'SHELVED');
  const maxTemp = Math.max(asset.raTemp, asset.saTemp, 1);

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="w-[380px] shrink-0 bg-primary-800/95 backdrop-blur border-l border-primary-500/50 overflow-y-auto no-scrollbar"
    >
      <div className="sticky top-0 z-10 bg-primary-700/95 backdrop-blur px-3 py-2.5 border-b border-primary-500/50 flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted">Faceplate</div>
          <div className="text-sm font-mono font-semibold text-accent-teal break-all">
            {asset.id}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="text-text-muted hover:text-text-primary p-1"
          aria-label="Close faceplate"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3">
        <div className="px-3 mb-3 flex items-center justify-between">
          <span className="text-xs text-text-secondary">{FLOOR_LABELS[asset.floor]}</span>
          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
              asset.status === 'Fault'
                ? 'bg-red-500/15 border-red-500/50 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
            }`}
          >
            {asset.status}
          </span>
        </div>

        <Section title="Control" icon={<Fan className="w-3.5 h-3.5 text-accent-gold" />}>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => toggleRunStop(asset.id)}
              disabled={asset.trip}
              className="flex flex-col items-center gap-1.5 py-2 rounded border border-primary-500/40 bg-primary-900/40 hover:border-accent-teal/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={asset.trip ? 'Unit is tripped — reset required before starting' : undefined}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  asset.runStop ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'
                }`}
              />
              <span className="text-[10px] text-text-muted font-semibold">Run / Stop</span>
            </button>

            <button
              onClick={() => toggleManual(asset.id)}
              className="flex flex-col items-center gap-1.5 py-2 rounded border border-primary-500/40 bg-primary-900/40 hover:border-accent-teal/60 transition-colors"
            >
              <span
                className={`px-1.5 rounded text-[11px] font-bold ${
                  asset.manual ? 'text-amber-300' : 'text-accent-teal'
                }`}
              >
                {asset.manual ? 'Manual' : 'Auto'}
              </span>
              <span className="text-[10px] text-text-muted font-semibold">Mode</span>
            </button>

            <div className="flex flex-col items-center gap-1.5 py-2 rounded border border-primary-500/40 bg-primary-900/40">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  asset.trip ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-600'
                }`}
              />
              <span className="text-[10px] text-text-muted font-semibold">Trip</span>
            </div>
          </div>
        </Section>

        <Section title="Air Temperatures" icon={<Gauge className="w-3.5 h-3.5 text-accent-teal" />}>
          <div className="flex items-end justify-center gap-8 h-24">
            {[
              { label: 'RA Temp', value: asset.raTemp },
              { label: 'SA Temp', value: asset.saTemp },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1">
                <span className="text-sm font-mono font-semibold text-text-primary">
                  {b.value.toFixed(1)} °C
                </span>
                <div
                  className="w-9 bg-emerald-400/80 rounded-t"
                  style={{ height: `${(b.value / maxTemp) * 56}px` }}
                />
                <span className="text-[10px] text-text-muted font-semibold">{b.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Fan">
          <div className="grid grid-cols-3 items-end gap-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-mono font-semibold text-text-primary">
                {asset.fanRpm}
              </span>
              <span className="text-[10px] text-text-muted font-semibold">FAN RPM</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  asset.fanOn ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'
                }`}
              />
              <span className="text-[10px] text-text-muted font-semibold">FAN</span>
            </div>
            <MiniGauge label="VSD - RPM" pct={asset.vsdRpmPct} />
          </div>
        </Section>

        <Section title="Air & Coil">
          <div className="grid grid-cols-2 gap-2">
            <MiniGauge label="RA Pressure" pct={asset.raPressurePct} />
            <MiniGauge label="Cooling Coil Valve - %" pct={asset.coolingValvePct} />
          </div>
        </Section>

        <Section title="Safety & Filters" icon={<Filter className="w-3.5 h-3.5 text-accent-teal" />}>
          <div className="grid grid-cols-3 gap-2 py-1">
            <StatusDot ok={asset.ductSmokeOk} label="Duct Smoke" />
            <StatusDot ok={asset.preFilterOk} label="Pre-Filter" />
            <StatusDot ok={asset.bagFilterOk} label="Bag-Filter" />
          </div>
        </Section>

        {tagAlarms.length > 0 && (
          <Section title="Alarms">
            <div className="space-y-1.5">
              {tagAlarms.map((a) => (
                <div
                  key={a.id}
                  className="bg-primary-900/50 border border-red-500/25 rounded px-2 py-1.5"
                >
                  <div className="text-xs text-red-300">{a.description}</div>
                  <div className="text-[10px] text-text-muted">
                    {a.state} · {new Date(a.raisedAt).toLocaleTimeString()} · limit {a.limit} ·
                    current {a.currentValue}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
};

export default AhuFaceplate;
