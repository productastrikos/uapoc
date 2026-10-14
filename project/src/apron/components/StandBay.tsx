/**
 * One aircraft stand.
 *
 * The card: VDGS head, identity, the stand scene, and the equipment badges.
 *
 * The scene itself — apron, aircraft and the boarding bridge that docks to it —
 * is StandScene, one SVG in one coordinate space. It used to be a pile of
 * separately-positioned divs, which is why the bridge never met the aircraft
 * door; see that file for what changed and why.
 */

import React from 'react';
import {
  Plug,
  Wind,
  Fuel,
  Lightbulb,
  AlertOctagon,
  Flame,
  Wrench,
} from 'lucide-react';
import { EquipKind, EquipStatus, Stand } from '../types';
import VdgsDisplay from './VdgsDisplay';
import StandScene from './StandScene';

const ICON: Record<EquipKind, React.ElementType> = {
  vdgs: Plug,
  pbb: Wrench,
  gpu: Plug,
  pca: Wind,
  fuel: Fuel,
  flood: Lightbulb,
  estop: AlertOctagon,
  fire: Flame,
};

/** Equipment badge treatment. A fault glows and pulses rather than just changing colour. */
const STATUS_TONE: Record<EquipStatus, { bg: string; ring: string; icon: string; glow?: string }> = {
  active: { bg: 'rgba(16,185,129,0.16)', ring: 'rgba(52,211,153,0.6)', icon: '#6EE7B7' },
  standby: { bg: 'rgba(100,116,139,0.16)', ring: 'rgba(148,163,184,0.35)', icon: '#94A3B8' },
  fault: { bg: 'rgba(239,68,68,0.22)', ring: 'rgba(248,113,113,0.85)', icon: '#FCA5A5', glow: 'rgba(248,113,113,0.85)' },
  offline: { bg: 'rgba(51,65,85,0.3)', ring: 'rgba(71,85,105,0.45)', icon: '#475569' },
};

interface Props {
  stand: Stand;
  selected: boolean;
  onSelect: () => void;
}

const StandBay: React.FC<Props> = ({ stand, selected, onSelect }) => {
  const faults = stand.equipment.filter((e) => e.status === 'fault').length;
  const vdgsFault = stand.vdgs.status === 'fault';
  const alarming = faults > 0 || vdgsFault;

  // Aircraft travels from the bottom of the stand to its parked position.
  const travel = 1 - stand.approach;
  const pbbFault = stand.equipment.find((e) => e.kind === 'pbb')?.status === 'fault';
  const beaconOn = stand.occupied && stand.docking !== 'docked';

  return (
    <button
      onClick={onSelect}
      className={`group w-full flex flex-col text-left rounded-lg border transition-all duration-200 ${
        selected
          ? 'border-accent-teal/80 bg-primary-700/50 shadow-[0_0_0_1px_rgba(45,212,191,0.45),0_10px_24px_-10px_rgba(45,212,191,0.4)] -translate-y-0.5'
          : alarming
          ? 'border-red-500/50 bg-primary-800/50 shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_8px_18px_-10px_rgba(0,0,0,0.7)] hover:border-red-400'
          : 'border-primary-500/40 bg-primary-800/50 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.7)] hover:border-primary-400 hover:-translate-y-0.5'
      }`}
    >
      {/* VDGS head */}
      <div className="p-1.5 pb-0">
        <VdgsDisplay stand={stand} />
      </div>

      {/* Bay identity */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              alarming
                ? 'bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.65)]'
                : stand.maintenance
                ? 'bg-purple-400 shadow-[0_0_6px_2px_rgba(192,132,252,0.5)]'
                : stand.occupied
                ? 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-semibold text-text-primary">{stand.name}</span>
        </div>
        <span className="text-[length:calc(10px*var(--fs))] text-text-muted">
          {stand.terminal} · {stand.contact ? 'Contact' : 'Remote'}
        </span>
      </div>

      {/* Stand graphic */}
      <div
        className="relative mx-1.5 mb-1.5 rounded-md h-44 overflow-hidden border border-black/40"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        <StandScene stand={stand} travel={travel} pbbFault={pbbFault} beaconOn={beaconOn} />

        {/* Equipment — lit badges rather than flat icons, so status reads as a
            lamp. One row, never wrapping: wrapped they became two rows of large
            discs that covered the aircraft they are meant to annotate. */}
        <div className="absolute left-1.5 bottom-1.5 flex items-center gap-1 z-10 flex-nowrap max-w-[94%] overflow-hidden">
          {stand.equipment.map((e) => {
            const Icon = ICON[e.kind];
            const tone = STATUS_TONE[e.status];
            return (
              <span
                key={e.id}
                title={`${e.label} — ${e.status}${e.value ? ` (${e.value})` : ''}`}
                className="relative flex items-center justify-center w-4 h-4 shrink-0 rounded-full"
                style={{
                  background: tone.bg,
                  boxShadow: `0 0 0 1px ${tone.ring}, 0 1px 3px rgba(0,0,0,0.55)${
                    tone.glow ? `, 0 0 7px 1px ${tone.glow}` : ''
                  }`,
                }}
              >
                {e.status === 'fault' && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ boxShadow: `0 0 0 1px ${tone.ring}` }}
                  />
                )}
                <Icon className="w-2.5 h-2.5" style={{ color: tone.icon }} />
              </span>
            );
          })}
        </div>

        {/* Flight tag */}
        {stand.flight && (
          <div className="absolute right-1.5 top-1.5 px-1.5 py-0.5 rounded bg-primary-900/85 border border-primary-500/40 shadow-[0_2px_5px_rgba(0,0,0,0.5)] backdrop-blur-sm z-10">
            <span className="text-[length:calc(10px*var(--fs))] font-mono text-accent-teal">{stand.flight}</span>
          </div>
        )}

        {stand.maintenance && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-purple-900/45 z-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(250,204,21,0.14) 0px, rgba(250,204,21,0.14) 8px, rgba(0,0,0,0.18) 8px, rgba(0,0,0,0.18) 16px)',
            }}
          >
            <span className="px-2 py-0.5 rounded bg-black/50 text-[length:calc(10px*var(--fs))] font-semibold text-purple-100 uppercase tracking-wide shadow-lg">
              Maintenance
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default StandBay;
