/**
 * One aircraft stand.
 *
 * The aircraft slides up the stand centreline as the docking progresses and the
 * airbridge swings out to meet it once the aircraft is on chocks, so the state
 * of the turnaround is legible from the picture alone rather than only from the
 * numbers beside it.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  Wind,
  Fuel,
  Lightbulb,
  AlertOctagon,
  Flame,
  Wrench,
} from 'lucide-react';
import { EquipKind, Stand } from '../types';
import VdgsDisplay from './VdgsDisplay';

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

const STATUS_COLOUR = {
  active: 'text-emerald-400',
  standby: 'text-slate-500',
  fault: 'text-red-400',
  offline: 'text-slate-600',
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

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col text-left rounded-lg border transition-colors ${
        selected
          ? 'border-accent-teal bg-primary-700/50'
          : alarming
          ? 'border-red-500/50 bg-primary-800/50 hover:border-red-400'
          : 'border-primary-500/40 bg-primary-800/50 hover:border-primary-400'
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
                ? 'bg-red-500'
                : stand.maintenance
                ? 'bg-purple-400'
                : stand.occupied
                ? 'bg-emerald-400'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-semibold text-text-primary">{stand.name}</span>
        </div>
        <span className="text-[10px] text-text-muted">
          {stand.terminal} · {stand.contact ? 'Contact' : 'Remote'}
        </span>
      </div>

      {/* Stand graphic */}
      <div className="relative mx-1.5 mb-1.5 rounded bg-[#152C40] border border-primary-500/30 h-40 overflow-hidden">
        {/* Stand centreline and stop bar */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 border-l border-dashed border-slate-500/50" />
        <div className="absolute left-1/2 top-7 w-8 h-0.5 -translate-x-1/2 bg-amber-400/80" />

        {/* Airbridge, parked until the aircraft is on chocks */}
        {stand.contact && (
          <motion.div
            className="absolute left-0 top-9 origin-left"
            animate={{
              rotate: stand.chocksOn ? -18 : -46,
              scaleX: stand.chocksOn ? 1 : 0.66,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 90 }}
          >
            <div
              className={`h-2 w-16 rounded-sm ${
                stand.equipment.find((e) => e.kind === 'pbb')?.status === 'fault'
                  ? 'bg-red-500/70'
                  : 'bg-slate-400/80'
              }`}
            />
          </motion.div>
        )}

        {/* Aircraft */}
        {stand.occupied && (
          <motion.svg
            viewBox="-50 -50 100 100"
            className="absolute left-1/2 w-16 h-16 -translate-x-1/2"
            animate={{ top: `${18 + travel * 62}%` }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
          >
            <path
              d="M 0 -34 L 9 -6 L 46 10 L 46 20 L 9 12 L 9 26 L 20 34 L 20 40 L 0 35 L -20 40 L -20 34 L -9 26 L -9 12 L -46 20 L -46 10 L -9 -6 Z"
              fill="#E2E8F0"
              stroke="#0F172A"
              strokeWidth={2}
            />
          </motion.svg>
        )}

        {/* Equipment status column */}
        <div className="absolute left-1 bottom-1 flex flex-col gap-0.5">
          {stand.equipment.map((e) => {
            const Icon = ICON[e.kind];
            return (
              <span
                key={e.id}
                title={`${e.label} — ${e.status}${e.value ? ` (${e.value})` : ''}`}
                className={STATUS_COLOUR[e.status]}
              >
                <Icon className="w-3 h-3" />
              </span>
            );
          })}
        </div>

        {/* Flight tag */}
        {stand.flight && (
          <div className="absolute right-1 top-1 px-1.5 py-0.5 rounded bg-primary-900/80 border border-primary-500/40">
            <span className="text-[10px] font-mono text-accent-teal">{stand.flight}</span>
          </div>
        )}

        {stand.maintenance && (
          <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-purple-200 uppercase tracking-wide">
              Maintenance
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default StandBay;
