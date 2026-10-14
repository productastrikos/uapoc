/**
 * The airport floor plan, drawn from `terminalPlan.ts`.
 *
 * Replaces the flat `zone_map_all_floor.jpg` the port inherited — that was one
 * undifferentiated drawing reused for all six levels, so nothing on it told an
 * operator which room a fault was in. Here every level draws its own room
 * schedule: the halls, plant rooms, substations and gate lounges are real
 * shapes with real names, and a zone marker sits in the room it serves.
 *
 * Rendered as SVG so it scales into a 200px thumbnail and a full-screen plan
 * from one source, and so rooms are hit-testable without an image map.
 */

import React from 'react';
import {
  LEVEL_ROOMS, PLAN_H, PLAN_W, ROOM_STYLES, SHELL, STANDS,
  type LevelKey, type TerminalRoom,
} from '../terminalPlan';

interface Props {
  level: LevelKey;
  /** Thumbnails drop the room labels and the airside/landside detail. */
  variant?: 'full' | 'thumb';
  /** Room the pointer or selection is on, drawn highlighted. */
  activeRoomId?: string | null;
  onRoomClick?: (room: TerminalRoom) => void;
  /** Extra layers (zone markers, asset pins) drawn over the plan in the same
   *  coordinate space. */
  children?: React.ReactNode;
}

/** Labels are only drawn when the room can actually hold them at this size. */
const labelFor = (room: TerminalRoom, variant: 'full' | 'thumb') => {
  if (variant === 'thumb') return null;
  if (room.w < 52 || room.h < 26) return null;
  return room.short;
};

const TerminalFloorPlan: React.FC<Props> = ({
  level, variant = 'full', activeRoomId = null, onRoomClick, children,
}) => {
  const rooms = LEVEL_ROOMS[level];
  const isThumb = variant === 'thumb';

  return (
    <svg
      viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full select-none"
      style={{ display: 'block' }}
    >
      <defs>
        <pattern id={`apron-hatch-${level}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 14 L14 0" stroke="rgba(138,155,168,0.13)" strokeWidth="1" />
        </pattern>
        <linearGradient id={`shell-grad-${level}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(10,58,82,0.55)" />
          <stop offset="100%" stopColor="rgba(7,16,40,0.75)" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="0" y="0" width={PLAN_W} height={PLAN_H} fill="#04101F" />

      {/* ── Airside: apron, stand lead-in lines, aerobridge fingers ───────── */}
      <rect {...SHELL.apron} fill={`url(#apron-hatch-${level})`} />
      <rect {...SHELL.apron} fill="rgba(1,163,164,0.03)" />
      {!isThumb && (
        <>
          {/* Taxiway centreline running along the apron head */}
          <line
            x1="0" y1="26" x2={PLAN_W} y2="26"
            stroke="rgba(230,184,92,0.45)" strokeWidth="1.6" strokeDasharray="16 12"
          />
          {/* In the gap between the taxiway line and the stand labels —
              clear of both the fingers and the map's own top-left HUD row. */}
          <text x="10" y="44" fill="rgba(230,184,92,0.72)" fontSize="9" fontWeight="700" letterSpacing="1.2">
            TAXIWAY — APRON NORTH
          </text>
          <text x="10" y="56" fill="rgba(230,184,92,0.45)" fontSize="7.5" letterSpacing="0.8">
            381,862 m² · 53 N / 11 S STANDS
          </text>
        </>
      )}

      {/* Aerobridge fingers: 8 domestic + 11 international */}
      {STANDS.map((stand) => (
        <g key={stand.id}>
          <rect
            x={stand.x - 5} y={SHELL.building.y - 26} width="10" height="26"
            fill="rgba(1,163,164,0.22)" stroke="rgba(1,163,164,0.5)" strokeWidth="0.8"
          />
          <circle cx={stand.x} cy={SHELL.building.y - 32} r="3.4" fill="rgba(1,163,164,0.35)" stroke="#22C7C6" strokeWidth="0.9" />
          {!isThumb && (
            <text x={stand.x} y={SHELL.building.y - 40} fill="#7FCFD0" fontSize="8" fontWeight="700" textAnchor="middle">
              {stand.id}
            </text>
          )}
        </g>
      ))}

      {/* ── Landside: kerb, forecourt, car park ──────────────────────────── */}
      <rect {...SHELL.landside} fill="rgba(7,16,40,0.6)" />
      {!isThumb && (
        <>
          <line
            x1="0" y1={SHELL.landside.y + 22} x2={PLAN_W} y2={SHELL.landside.y + 22}
            stroke="rgba(138,155,168,0.35)" strokeWidth="1.4"
          />
          <line
            x1="0" y1={SHELL.landside.y + 74} x2={PLAN_W} y2={SHELL.landside.y + 74}
            stroke="rgba(138,155,168,0.22)" strokeWidth="1" strokeDasharray="10 8"
          />
          <text x="12" y={SHELL.landside.y + 15} fill="#8A9BA8" fontSize="9" fontWeight="700" letterSpacing="1.2">
            DEPARTURE KERB · ARRIVAL KERB · GROUND TRANSPORT
          </text>
          <text x="12" y={SHELL.landside.y + 96} fill="rgba(138,155,168,0.55)" fontSize="8" letterSpacing="1">
            CAR PARK — 155 kWp SOLAR PV CANOPY
          </text>
        </>
      )}

      {/* ── Terminal shell ───────────────────────────────────────────────── */}
      <rect
        {...SHELL.building}
        fill={`url(#shell-grad-${level})`}
        stroke="rgba(1,163,164,0.55)"
        strokeWidth={isThumb ? 1.4 : 2}
        rx="3"
      />

      {/* Wing split lines */}
      <line
        x1={SHELL.link.x} y1={SHELL.building.y} x2={SHELL.link.x} y2={SHELL.building.y + SHELL.building.h}
        stroke="rgba(1,163,164,0.4)" strokeWidth="1.2"
      />
      <line
        x1={SHELL.international.x} y1={SHELL.building.y} x2={SHELL.international.x} y2={SHELL.building.y + SHELL.building.h}
        stroke="rgba(1,163,164,0.4)" strokeWidth="1.2"
      />

      {/* ── Rooms ────────────────────────────────────────────────────────── */}
      {rooms.map((room) => {
        const style = ROOM_STYLES[room.category];
        const active = activeRoomId === room.id;
        const label = labelFor(room, variant);
        return (
          <g
            key={room.id}
            onClick={onRoomClick ? () => onRoomClick(room) : undefined}
            style={{ cursor: onRoomClick ? 'pointer' : 'default' }}
          >
            <title>
              {room.name}
              {room.detail ? ` — ${room.detail}` : ''}
            </title>
            <rect
              x={room.x} y={room.y} width={room.w} height={room.h}
              fill={active ? style.stroke.replace(/[\d.]+\)$/, '0.26)') : style.fill}
              stroke={style.stroke}
              strokeWidth={active ? 2 : isThumb ? 0.7 : 1.1}
              rx="2"
            />
            {label && (
              <text
                x={room.x + room.w / 2}
                y={room.y + room.h / 2 + 3}
                fill={style.text}
                fontSize={room.w > 200 ? 9.5 : room.w > 110 ? 8.5 : 7.5}
                fontWeight="700"
                textAnchor="middle"
                letterSpacing="0.6"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* Wing captions — the two terminals, with their real footprints */}
      {!isThumb && (
        <>
          <text
            x={SHELL.domestic.x + SHELL.domestic.w / 2} y={SHELL.landside.y + 56}
            fill="#9BEAE8" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="1.6"
          >
            DOMESTIC TERMINAL — 65,800 m²
          </text>
          <text
            x={SHELL.international.x + SHELL.international.w / 2} y={SHELL.landside.y + 56}
            fill="#9BEAE8" fontSize="10" fontWeight="800" textAnchor="middle" letterSpacing="1.6"
          >
            INTERNATIONAL TERMINAL — 120,000 m²
          </text>
        </>
      )}

      {/* Overlays (zone markers, asset pins) share this coordinate space */}
      {children}
    </svg>
  );
};

export default TerminalFloorPlan;
