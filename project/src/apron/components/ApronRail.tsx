/**
 * Apron status rail.
 *
 * Mirrors the blocks the client has already been shown — movement counts, bay
 * performance, availability, an hourly bay-utilisation profile and the
 * equipment Total / Active / Fail grid.
 */

import React, { useMemo } from 'react';
import { useApronStore, computeApronRollups } from '../store';

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-primary-800/70 border border-primary-500/40 rounded-lg overflow-hidden">
    <header className="px-3 py-2 border-b border-primary-500/40">
      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">{title}</h3>
    </header>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string; unit?: string; tone?: string }> = ({
  label,
  value,
  unit,
  tone = 'text-text-primary',
}) => (
  <div className="bg-primary-900/50 border border-primary-500/30 rounded px-2 py-1.5">
    <div className="text-[length:calc(10px*var(--fs))] text-text-muted leading-tight">{label}</div>
    <div className={`text-lg font-bold font-mono leading-tight ${tone}`}>{value}</div>
    {unit && <div className="text-[length:calc(9px*var(--fs))] text-text-muted">{unit}</div>}
  </div>
);

/** Hourly bay-utilisation profile, as in the reference chart. */
const PROFILE = [
  { key: 'B1', label: 'Total Number of Bays', value: 6 },
  { key: 'B2', label: 'Contact Bays Occupied', value: 3 },
  { key: 'B3', label: 'Remote Bays Occupied', value: 1 },
  { key: 'B4', label: 'Cargo Bays Occupied', value: 0 },
  { key: 'B5', label: 'Bays Unserviceable', value: 1 },
  { key: 'B6', label: 'Ops Equipment Failures', value: 0 },
  { key: 'B7', label: 'Incidents / Accidents per day', value: 0 },
];

const ApronRail: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const rollups = useMemo(() => computeApronRollups(stands), [stands]);

  const occupied = stands.filter((s) => s.occupied).length;
  const unserviceable = stands.filter(
    (s) => s.maintenance || s.vdgs.status === 'fault'
  ).length;
  const serviceability = ((stands.length - unserviceable) / stands.length) * 100;

  const t1 = stands.filter((s) => s.terminal === 'T1' && !s.occupied).length;
  const t2 = stands.filter((s) => s.terminal === 'T2' && !s.occupied).length;

  const maxProfile = Math.max(...PROFILE.map((p) => p.value), 1);

  return (
    <div className="shrink-0 space-y-3">
      <Block title="Apron Management System">
        <div className="grid grid-cols-3 gap-1.5 p-2">
          <Stat label="Total Flight Delays" value="4" unit="per day" tone="text-amber-300" />
          <Stat label="UnScheduled Flights" value="2" unit="per day" />
          <Stat label="Scheduled Flights" value="82" unit="per day" />
        </div>
      </Block>

      <Block title="Bay Performance">
        <div className="grid grid-cols-3 gap-1.5 p-2">
          <Stat
            label="Bay Serviceability"
            value={`${serviceability.toFixed(0)}%`}
            tone={serviceability < 90 ? 'text-red-400' : 'text-emerald-400'}
          />
          <Stat label="Incidents / Accidents" value="0" unit="today" />
          <Stat label="SLA Target" value="92%" tone="text-accent-teal" />
        </div>
      </Block>

      <Block title="Apron / Bay Status">
        <div className="divide-y divide-primary-600/25 text-[length:calc(11px*var(--fs))]">
          {[
            ['Terminal 1 — Apron Bay Availability', t1],
            ['Terminal 2 — Apron Bay Availability', t2],
            ['Bays Occupied', occupied],
            ['Total Bays', stands.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between px-2 py-1.5">
              <span className="text-text-secondary">{label}</span>
              <span className="font-mono text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Bay Utilisation (avg. per hour)">
        <div className="p-2">
          <div className="flex items-end gap-1.5 h-20 mb-1.5">
            {PROFILE.map((p) => (
              <div key={p.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent-teal/70 rounded-sm min-h-[2px]"
                  style={{ height: `${(p.value / maxProfile) * 100}%` }}
                  title={`${p.label}: ${p.value}`}
                />
                <span className="text-[length:calc(9px*var(--fs))] text-text-muted">{p.key}</span>
              </div>
            ))}
          </div>
          <ul className="space-y-0.5">
            {PROFILE.map((p) => (
              <li key={p.key} className="text-[length:calc(9px*var(--fs))] text-text-muted leading-tight">
                <span className="text-text-secondary font-mono">{p.key}</span> — {p.label}
              </li>
            ))}
          </ul>
        </div>
      </Block>

      <Block title="System Status">
        <table className="w-full text-[length:calc(11px*var(--fs))]">
          <thead>
            <tr className="text-text-muted border-b border-primary-500/30">
              <th className="text-left font-medium px-2 py-1">Device</th>
              <th className="text-center font-medium px-1 py-1 w-12">Total</th>
              <th className="text-center font-medium px-1 py-1 w-12">Active</th>
              <th className="text-center font-medium px-1 py-1 w-12">Fail</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map((r) => (
              <tr key={r.kind} className="border-b border-primary-600/20">
                <td className="px-2 py-1 text-text-secondary">{r.label}</td>
                <td className="px-1 py-1 text-center font-mono text-text-primary">{r.total}</td>
                <td className="px-1 py-1 text-center font-mono text-emerald-300">{r.active}</td>
                <td className="px-1 py-1 text-center">
                  <span
                    className={`inline-block min-w-[1.6rem] rounded font-mono ${
                      r.fail > 0
                        ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                        : 'text-text-primary'
                    }`}
                  >
                    {r.fail}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
    </div>
  );
};

export default ApronRail;
