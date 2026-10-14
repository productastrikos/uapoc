/**
 * The map's default view: all six levels at once, three across each row.
 *
 * Each panel now draws that level's own plan (see terminalPlan.ts) rather than
 * six copies of one zone image, so the levels are distinguishable at a glance —
 * baggage and plant in the PIT, check-in on 1F, gates on 2F, AHU rooms on 4F.
 * The 1F panel carries the pulsing Zone 23 alert marker; clicking a panel opens
 * that level, clicking the marker opens 1F already zoomed onto the alert.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  ALERT_FLOOR, LEVEL_LABELS, LEVEL_ORDER, LEVEL_PROGRAMME,
  roomForZone, roomCentrePct, type LevelKey,
} from '../terminalPlan';
import TerminalFloorPlan from './TerminalFloorPlan';

const ALERT_ZONE = '23';

/** Where the Zone 23 alert sits on 1F, in plan percentages. Read from the
 *  plan itself so the marker follows the room if the layout is edited. */
const alertPct = (() => {
  const room = roomForZone(ALERT_FLOOR, ALERT_ZONE);
  return room ? roomCentrePct(room) : { xPct: 50, yPct: 50 };
})();

interface FloorThumbProps {
  level: LevelKey;
  hasAlert: boolean;
  /** true when opened via the alert marker itself. */
  onOpen: (focusAlert: boolean) => void;
}

const FloorThumb: React.FC<FloorThumbProps> = ({ level, hasAlert, onOpen }) => (
  <button
    onClick={() => onOpen(false)}
    title={`${LEVEL_LABELS[level]} — ${LEVEL_PROGRAMME[level]}`}
    className="relative rounded-xl overflow-hidden group transition-all hover:brightness-110"
    style={{
      background: '#04101F',
      border: hasAlert ? '1px solid rgba(249,115,22,0.55)' : '1px solid rgba(1,163,164,0.28)',
      minHeight: 0,
      minWidth: 0,
    }}
  >
    <div className="absolute inset-0">
      <TerminalFloorPlan level={level} variant="thumb" />
    </div>

    {/* Level label */}
    <div
      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none"
      style={{
        background: 'rgba(8,32,58,0.88)',
        border: `1px solid ${hasAlert ? 'rgba(249,115,22,0.5)' : 'rgba(1,163,164,0.28)'}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="text-[length:calc(9px*var(--fs))] font-bold" style={{ color: hasAlert ? '#f97316' : '#22C7C6' }}>{level}</span>
      <span className="text-[length:calc(8px*var(--fs))] text-text-muted">{LEVEL_LABELS[level]}</span>
    </div>

    {/* Alert badge */}
    {hasAlert && (
      <div
        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none"
        style={{ background: 'rgba(249,115,22,0.16)', border: '1px solid rgba(249,115,22,0.5)', backdropFilter: 'blur(8px)' }}
      >
        <AlertTriangle className="w-2.5 h-2.5" style={{ color: '#f97316' }} />
        <span className="text-[length:calc(8px*var(--fs))] font-bold" style={{ color: '#f97316' }}>Zone 23</span>
      </div>
    )}

    {/* Pulsing alert marker — its own click target, so clicking it jumps
        straight into the zoomed alert view. The plan is drawn with
        preserveAspectRatio="xMidYMid meet", so the marker compensates for the
        same letterboxing the SVG applies. */}
    {hasAlert && (
      <span
        role="button"
        title="Click to jump straight to the Zone 23 alert"
        onClick={(e) => { e.stopPropagation(); onOpen(true); }}
        className="absolute flex items-center justify-center cursor-pointer"
        style={{ left: `${alertPct.xPct}%`, top: `${alertPct.yPct}%`, width: 26, height: 26, marginLeft: -13, marginTop: -13 }}
      >
        <span className="absolute w-3 h-3 rounded-full pointer-events-none" style={{ background: '#f97316', animation: 'hbms-zone-alert-pulse 1.8s ease-out infinite' }} />
        <span className="absolute w-3 h-3 rounded-full pointer-events-none" style={{ background: '#f97316', animation: 'hbms-zone-alert-pulse 1.8s ease-out infinite', animationDelay: '0.6s' }} />
        <span
          className="relative w-2.5 h-2.5 rounded-full border-2 pointer-events-none"
          style={{ background: '#f97316', borderColor: '#fff7ed', boxShadow: '0 0 8px #f97316', animation: 'hbms-zone-alert-core-pulse 1.8s ease-in-out infinite' }}
        />
      </span>
    )}

    {/* Hover hint — carries what the level is for */}
    <div
      className="absolute inset-x-0 bottom-0 py-1 px-1.5 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: 'linear-gradient(to top, rgba(7,16,40,0.95), transparent)' }}
    >
      <span className="text-[length:calc(8px*var(--fs))] font-bold block truncate" style={{ color: hasAlert ? '#f97316' : '#9BEAE8' }}>
        {LEVEL_PROGRAMME[level]}
      </span>
    </div>
  </button>
);

interface FloorPlanGridProps {
  /** focusAlert is true only when the alert marker itself was clicked. */
  onOpenFloor: (level: LevelKey, focusAlert: boolean) => void;
}

const FloorPlanGrid: React.FC<FloorPlanGridProps> = ({ onOpenFloor }) => {
  const topRow = LEVEL_ORDER.slice(0, 3);
  const bottomRow = LEVEL_ORDER.slice(3);

  return (
    <div className="w-full h-full flex flex-col gap-1.5 p-1.5" style={{ background: '#04101F' }}>
      {[topRow, bottomRow].map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-1.5" style={{ flex: 1, minHeight: 0 }}>
          {row.map((level) => (
            <FloorThumb
              key={level}
              level={level}
              hasAlert={level === ALERT_FLOOR}
              onOpen={(focusAlert) => onOpenFloor(level, focusAlert)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default FloorPlanGrid;
