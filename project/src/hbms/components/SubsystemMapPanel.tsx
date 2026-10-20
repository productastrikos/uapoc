/**
 * Subsystem terminal map.
 *
 * Replaces the source's react-leaflet PASTerminalMap. The behaviour it stood
 * for is kept — per-subsystem device inventory, a device-type filter, status
 * colouring, click-to-inspect, and the PAS speaker-zone polygons — but drawn
 * as an SVG plant schematic, which is how every other map surface in TAMS is
 * built (see the airfield canvas and the BMS floor plan).
 *
 * Device coordinates are the original image-space pairs; they are normalised
 * into the viewBox here, so the data file stays a verbatim copy of the source.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Layers } from 'lucide-react';
import {
  SUBSYSTEM_DEVICES,
  SUBSYSTEM_DEVICE_TYPES,
  PAS_ZONES,
  type MapDevice,
} from '../terminalZones';

const STATUS_COLOR: Record<MapDevice['status'], string> = {
  active: '#34D399',
  warning: '#F59E0B',
  offline: '#EF4444',
};

const VB_W = 200;
const PAD = 12;

/** The panel is used in three very different shapes — a wide strip under the
 *  KPI grid, a narrow column in the supervisor layout, and a tall split-view
 *  pane on the alerts screen. A fixed viewBox letterboxes badly in the tall
 *  ones, so the height follows the container and the plan is re-normalised
 *  into it, filling whatever space it is given. */
function useViewBoxHeight(ref: React.RefObject<HTMLDivElement>) {
  const [h, setH] = useState(120);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setH(Math.max(60, Math.min(600, (height / width) * VB_W)));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

interface Props {
  subsystem: string;
  /** Hides the panel's own title strip, for the supervisor layout where the
   *  surrounding panel already carries a "Map" header. */
  compact?: boolean;
}

/** Projects image-space [y, x] into the viewBox, preserving relative layout. */
function makeProjector(points: [number, number][], vbH: number) {
  const ys = points.map((p) => p[0]);
  const xs = points.map((p) => p[1]);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const spanY = maxY - minY || 1;
  const spanX = maxX - minX || 1;
  return ([y, x]: [number, number]): [number, number] => [
    PAD + ((x - minX) / spanX) * (VB_W - PAD * 2),
    // Image space has y increasing upward; the viewBox has it increasing down.
    PAD + (1 - (y - minY) / spanY) * (vbH - PAD * 2),
  ];
}

const SubsystemMapPanel: React.FC<Props> = ({ subsystem, compact = false }) => {
  const devices = SUBSYSTEM_DEVICES[subsystem] ?? SUBSYSTEM_DEVICES.pas;
  const typeOptions = SUBSYSTEM_DEVICE_TYPES[subsystem] ?? SUBSYSTEM_DEVICE_TYPES.pas;
  const showZones = subsystem === 'pas';

  const [type, setType] = useState('all');
  const [selected, setSelected] = useState<MapDevice | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const vbH = useViewBoxHeight(hostRef);

  // One projection for the whole subsystem, so filtering the type list moves
  // nothing on the plan — the pins stay where the operator last saw them.
  const project = useMemo(() => {
    const pts: [number, number][] = devices.map((d) => d.pos);
    if (showZones) PAS_ZONES.forEach((z) => pts.push(...z.positions));
    return makeProjector(pts, vbH);
  }, [devices, showZones, vbH]);

  const shown = type === 'all' ? devices : devices.filter((d) => d.type === type);
  const offline = devices.filter((d) => d.status === 'offline').length;
  const warning = devices.filter((d) => d.status === 'warning').length;

  return (
    <div ref={hostRef} className="glass-panel relative w-full h-full overflow-hidden rounded-[10px]">
      <svg viewBox={`0 0 ${VB_W} ${vbH}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <pattern id="hbms-map-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="rgba(1,163,164,0.10)" strokeWidth="0.3" />
          </pattern>
        </defs>

        {/* Apron / terminal ground */}
        <rect x="0" y="0" width={VB_W} height={vbH} fill="url(#hbms-map-grid)" />
        <rect
          x={PAD - 6} y={PAD - 6} width={VB_W - (PAD - 6) * 2} height={vbH - (PAD - 6) * 2}
          rx="3" fill="rgba(8,32,58,0.55)" stroke="rgba(1,163,164,0.28)" strokeWidth="0.5"
        />

        {/* PAS speaker zones — the polygons the source drew over the floor plan */}
        {showZones && PAS_ZONES.map((zone) => {
          const pts = zone.positions.map(project).map(([x, y]) => `${x},${y}`).join(' ');
          const c = STATUS_COLOR[zone.status];
          return (
            <g key={zone.id}>
              <polygon points={pts} fill={`${c}1A`} stroke={c} strokeWidth="0.5" strokeDasharray="1.5 1" />
              <text
                x={project(zone.positions[0])[0] + 2}
                y={project(zone.positions[0])[1] - 1.5}
                fill={c} fontSize="3" fontWeight="700"
              >
                {zone.id}
              </text>
            </g>
          );
        })}

        {/* Devices */}
        {shown.map((d) => {
          const [x, y] = project(d.pos);
          const c = STATUS_COLOR[d.status];
          const isSel = selected?.id === d.id;
          return (
            <g
              key={d.id}
              onClick={() => setSelected((prev) => (prev?.id === d.id ? null : d))}
              style={{ cursor: 'pointer' }}
            >
              {d.status !== 'active' && (
                <circle cx={x} cy={y} r="4" fill="none" stroke={c} strokeWidth="0.4" opacity="0.5" />
              )}
              <circle cx={x} cy={y} r={isSel ? 2.8 : 2} fill={c} opacity={isSel ? 1 : 0.85} />
              {isSel && <circle cx={x} cy={y} r="5" fill="none" stroke={c} strokeWidth="0.6" />}
              <text x={x + 3.5} y={y + 1} fill="#B8C5D1" fontSize="2.6" fontWeight="600">
                {d.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Title strip */}
      {!compact && (
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5">
          <MapIcon className="w-3 h-3 text-accent-teal" />
          <span className="text-[length:calc(9px*var(--fs))] font-bold uppercase tracking-wider text-text-secondary">
            {subsystem.toUpperCase()} Terminal Layout
          </span>
        </div>
      )}

      {/* Health summary */}
      <div className="absolute top-1.5 right-2 flex items-center gap-1.5 text-[length:calc(9px*var(--fs))] font-bold">
        <span className="text-status-success">{devices.length - warning - offline} OK</span>
        {warning > 0 && <span className="text-status-warning">{warning} WARN</span>}
        {offline > 0 && <span className="text-status-error">{offline} OFF</span>}
      </div>

      {/* Device-type filter — the source's layer selector */}
      <div className="absolute bottom-1.5 left-2 flex items-center gap-1 flex-wrap max-w-[80%]">
        <Layers className="w-3 h-3 text-text-muted shrink-0" />
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            className={`chip px-1.5 py-0.5 text-[length:calc(8px*var(--fs))] font-bold uppercase tracking-wide ${
              type === opt.value ? 'chip-active' : ''
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Selected device readout */}
      {selected && (
        <div className="absolute bottom-1.5 right-2 rounded-md bg-primary-800/95 border border-primary-500/50 px-2 py-1.5 max-w-[45%]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: STATUS_COLOR[selected.status] }}
            />
            <span className="text-[length:calc(9px*var(--fs))] font-mono font-bold text-text-primary truncate">{selected.id}</span>
            <span
              className="text-[length:calc(8px*var(--fs))] font-bold uppercase ml-auto"
              style={{ color: STATUS_COLOR[selected.status] }}
            >
              {selected.status}
            </span>
          </div>
          <p className="text-[length:calc(8px*var(--fs))] text-text-muted truncate mt-0.5">{selected.name}</p>
        </div>
      )}
    </div>
  );
};

export default SubsystemMapPanel;
