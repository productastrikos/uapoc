/**
 * Building 1 floor plan.
 *
 * An SVG schematic rather than a georeferenced map: this is a plant view, and
 * what matters is which device is in which room and what state it is in, not
 * survey-accurate geometry. It also keeps the console dependency-free and lets
 * the plan follow the building rather than a fixed set of photographs.
 *
 * Device classes can be switched off individually, which is how a BMS operator
 * actually works a floor — look at the AHUs, then the VAVs, then the exhaust.
 */

import React from 'react';
import { PLAN_CORRIDOR, PLAN_ROOMS, PlanDevice, DeviceKind } from '../assets';

const KIND_COLOUR: Record<DeviceKind, string> = {
  AHU: '#2DD4BF',
  VAV: '#60A5FA',
  CAV: '#34D399',
  FCU: '#A78BFA',
  EF: '#FBBF24',
  PACU: '#F472B6',
};

interface Props {
  devices: PlanDevice[];
  visibleKinds: DeviceKind[];
  selectedAhuId: string | null;
  onSelect: (device: PlanDevice) => void;
}

const FloorPlan: React.FC<Props> = ({ devices, visibleKinds, selectedAhuId, onSelect }) => {
  const shown = devices.filter((d) => visibleKinds.includes(d.kind));

  return (
    <svg
      viewBox="0 0 100 104"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ background: 'radial-gradient(ellipse at 45% 25%, #0A2036 0%, #050D18 75%)' }}
    >
      {/* Building outline */}
      <rect
        x={8}
        y={2}
        width={80}
        height={92}
        fill="#0C1E30"
        stroke="#2D5674"
        strokeWidth={0.5}
      />

      {/* Rooms */}
      {PLAN_ROOMS.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="#132B41"
            stroke="#3E6B8C"
            strokeWidth={0.35}
          />
          {r.label && (
            <text
              x={r.x + r.w / 2}
              y={r.y + r.h / 2}
              fill="#8FA9BF"
              fontSize={1.5}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {r.label}
            </text>
          )}
        </g>
      ))}

      {/* Corridor spine */}
      <rect
        x={PLAN_CORRIDOR.x}
        y={PLAN_CORRIDOR.y}
        width={PLAN_CORRIDOR.w}
        height={PLAN_CORRIDOR.h}
        fill="#102539"
        stroke="#3E6B8C"
        strokeWidth={0.35}
      />
      <text
        x={PLAN_CORRIDOR.x + PLAN_CORRIDOR.w / 2}
        y={PLAN_CORRIDOR.y + PLAN_CORRIDOR.h / 2}
        fill="#8FA9BF"
        fontSize={1.5}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {PLAN_CORRIDOR.label}
      </text>

      {/* Devices */}
      {shown.map((d) => {
        const colour = d.status === 'alarm' ? '#EF4444' : KIND_COLOUR[d.kind];
        const selected = d.ahuId != null && d.ahuId === selectedAhuId;
        const w = 7;
        const h = 3.6;

        return (
          <g
            key={d.id}
            transform={`translate(${d.x - w / 2} ${d.y - h / 2})`}
            onClick={() => onSelect(d)}
            style={{ cursor: d.kind === 'AHU' ? 'pointer' : 'default' }}
          >
            <rect
              width={w}
              height={h}
              rx={0.5}
              fill="#08203A"
              stroke={colour}
              strokeWidth={selected ? 0.9 : 0.45}
            />
            <text
              x={w / 2}
              y={h / 2}
              fill={colour}
              fontSize={1.5}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {d.kind}
            </text>
            {/* Tag beneath the box, so a device can be named on the plan the
                way it is named in the alarm list. */}
            <text x={w / 2} y={h + 1.9} fill="#7A93A8" fontSize={1.2} textAnchor="middle">
              {d.ahuId ? d.ahuId.slice(0, 11) : d.id.replace('BLD1_', '')}
            </text>
            {d.status === 'alarm' && (
              <rect
                x={-0.7}
                y={-0.7}
                width={w + 1.4}
                height={h + 1.4}
                rx={0.8}
                fill="none"
                stroke="#EF4444"
                strokeWidth={0.4}
                opacity={0.7}
              >
                <animate
                  attributeName="opacity"
                  values="0.15;0.85;0.15"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </rect>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default FloorPlan;
