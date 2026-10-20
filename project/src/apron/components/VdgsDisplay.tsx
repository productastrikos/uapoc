/**
 * Safedock visual docking guidance display.
 *
 * This is the unit the pilot actually flies to: aircraft type on top, lateral
 * guidance chevrons that close in as the aircraft comes onto the stand
 * centreline, closing distance in metres, and the command line — the type while
 * capturing, SLOW on short final, STOP at the mark, OK once on chocks.
 *
 * Rendered as an LED matrix on black rather than as a dashboard card, because
 * that is what it is, and because the difference between a working stand and a
 * failed one has to be readable across a control room.
 */

import React from 'react';
import { Stand } from '../types';

const MESSAGE_COLOUR: Record<string, string> = {
  STOP: 'text-status-error',
  SLOW: 'text-status-warning',
  OK: 'text-status-neutral',
  FAULT: 'text-status-error',
  '—': 'text-slate-600',
};

/**
 * Chevrons point the pilot back toward the centreline.
 *
 * Drawn as SVG rather than with the ◀ ▶ characters: several fonts render those
 * as colour emoji, which lights every chevron on the display regardless of what
 * the guidance is actually indicating.
 */
const AzimuthBar: React.FC<{ azimuth: number; live: boolean }> = ({ azimuth, live }) => {
  // Positive azimuth means the aircraft is right of the centreline, so the
  // pilot is told to come left and the lit chevrons appear on the left.
  const magnitude = Math.min(3, Math.ceil(Math.abs(azimuth) * 2));
  const left = live && azimuth > 0.15;
  const right = live && azimuth < -0.15;
  const centred = live && Math.abs(azimuth) <= 0.15;

  const DARK = '#1E293B';
  const LIT = '#FCD34D';

  return (
    <svg viewBox="0 0 100 14" className="w-full h-3.5">
      {/* Left-hand chevrons, outermost first */}
      {[0, 1, 2].map((i) => (
        <path
          key={`l${i}`}
          d={`M ${28 - i * 9} 2 L ${20 - i * 9} 7 L ${28 - i * 9} 12 Z`}
          fill={left && magnitude > i ? LIT : DARK}
        />
      ))}

      {/* Centreline capture indicator */}
      <rect
        x={47}
        y={2}
        width={6}
        height={10}
        fill={centred ? '#34D399' : DARK}
      />

      {/* Right-hand chevrons */}
      {[0, 1, 2].map((i) => (
        <path
          key={`r${i}`}
          d={`M ${72 + i * 9} 2 L ${80 + i * 9} 7 L ${72 + i * 9} 12 Z`}
          fill={right && magnitude > i ? LIT : DARK}
        />
      ))}
    </svg>
  );
};

const timeOf = (t: number | null) =>
  t ? new Date(t).toLocaleTimeString('en-GB', { hour12: false }) : '';

interface Props {
  stand: Stand;
}

const VdgsDisplay: React.FC<Props> = ({ stand }) => {
  const { vdgs } = stand;
  const faulted = vdgs.status === 'fault' || vdgs.status === 'offline';
  const live = !faulted && stand.docking !== 'idle';

  return (
    <div
      className={`rounded border overflow-hidden ${
        faulted ? 'border-status-error/60' : 'border-primary-500/50'
      }`}
    >
      {/* Chocks status — the operational record of the turnaround */}
      <div className="bg-primary-700/60 px-2 py-1 text-[length:calc(10px*var(--fs))] space-y-0.5">
        <div className="flex justify-between">
          <span className="text-text-secondary">Chocks-On</span>
          <span className="font-mono text-text-primary">{timeOf(stand.chocksOnAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Chocks-Off</span>
          <span className="font-mono text-text-primary">{timeOf(stand.chocksOffAt)}</span>
        </div>
      </div>

      {/* The display itself */}
      <div className="bg-black px-2 py-2 space-y-1">
        <div className="text-center text-[length:calc(10px*var(--fs))] font-mono tracking-widest text-slate-500">
          {vdgs.expectedType ?? '----'}
        </div>

        <AzimuthBar azimuth={vdgs.azimuth} live={live} />

        <div className="text-center">
          <span
            className={`font-mono font-bold tabular-nums text-2xl ${
              faulted
                ? 'text-status-error'
                : live
                ? 'text-status-neutral'
                : 'text-slate-700'
            }`}
          >
            {live ? vdgs.closingDistance.toFixed(1) : '--.-'}
          </span>
          <span className="text-[length:calc(10px*var(--fs))] text-slate-600 ml-1">m</span>
        </div>

        <div
          className={`text-center font-mono font-bold text-sm tracking-wider ${
            MESSAGE_COLOUR[vdgs.message] ?? 'text-status-neutral'
          }`}
        >
          {faulted ? 'FAULT' : vdgs.message}
        </div>
      </div>
    </div>
  );
};

export default VdgsDisplay;
