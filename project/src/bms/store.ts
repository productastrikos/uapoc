/**
 * Terminal BMS engine.
 *
 * Same pattern as the AGL and apron engines: one store, alarms derived from
 * asset state, and every panel a view over it. Run/Stop and Manual/Auto are the
 * two controls an operator can genuinely act on from this console, so those are
 * the two that write back.
 */

import { create } from 'zustand';
import { AglAlarm, AlarmPriority } from '../agl/types';
import {
  AhuAsset,
  ALL_AHUS,
  buildPlanDevices,
  DeviceKind,
  Floor,
  PlanDevice,
} from './assets';

let alarmSeq = 9000;
const nextAlarmId = () => `BMS-${++alarmSeq}`;

export type BmsFaultKind =
  | 'ahu_fan_trip'
  | 'filter_blocked'
  | 'duct_smoke'
  | 'chw_valve_stuck';

function raise(
  alarms: AglAlarm[],
  tag: string,
  description: string,
  limit: string,
  currentValue: string,
  priority: AlarmPriority
): AglAlarm[] {
  if (alarms.some((a) => a.tag === tag && a.description === description && a.state !== 'SHELVED')) {
    return alarms;
  }
  return [
    {
      id: nextAlarmId(),
      tag,
      group: 'LBMS',
      kind: 'failure',
      description,
      priority,
      state: 'UNACK',
      raisedAt: Date.now(),
      limit,
      currentValue,
    },
    ...alarms,
  ];
}

/** Alarms implied by the current state of the fleet. */
function deriveAlarms(ahus: AhuAsset[], existing: AglAlarm[]): AglAlarm[] {
  let next = existing;
  for (const a of ahus) {
    if (a.trip) {
      next = raise(next, a.id, 'AHU Supply Fan Trip', 'Running', 'Tripped', 'critical');
    }
    if (!a.preFilterOk) {
      next = raise(next, a.id, 'Pre-Filter Differential High', 'Clean', 'Blocked', 'medium');
    }
    if (!a.bagFilterOk) {
      next = raise(next, a.id, 'Bag-Filter Differential High', 'Clean', 'Blocked', 'medium');
    }
    if (!a.ductSmokeOk) {
      next = raise(next, a.id, 'Duct Smoke Detected', 'Clear', 'Smoke', 'critical');
    }
  }
  return next;
}

interface BmsState {
  ahus: AhuAsset[];
  floor: Floor;
  devices: PlanDevice[];
  alarms: AglAlarm[];
  selectedAhuId: string | null;
  /** Device classes currently drawn on the plan. */
  visibleKinds: DeviceKind[];
  now: number;
  activeFaults: BmsFaultKind[];

  setFloor: (floor: Floor) => void;
  selectAhu: (id: string | null) => void;
  toggleKind: (kind: DeviceKind) => void;

  toggleRunStop: (id: string) => void;
  toggleManual: (id: string) => void;

  injectFault: (kind: BmsFaultKind) => void;
  clearFaults: () => void;

  ackAlarm: (id: string) => void;
  ackAll: () => void;
  tick: () => void;
}

const INITIAL_FLOOR: Floor = '1F';

export const useBmsStore = create<BmsState>((set, get) => ({
  ahus: ALL_AHUS.map((a) => ({ ...a })),
  floor: INITIAL_FLOOR,
  devices: buildPlanDevices(INITIAL_FLOOR),
  // Seed with the alarms the fleet already implies, so the console opens
  // showing the one real fault rather than an artificially clean board.
  alarms: deriveAlarms(ALL_AHUS, []),
  selectedAhuId: null,
  visibleKinds: ['AHU', 'VAV', 'CAV', 'FCU', 'EF', 'PACU'],
  now: Date.now(),
  activeFaults: [],

  setFloor: (floor) => set({ floor, devices: buildPlanDevices(floor), selectedAhuId: null }),

  selectAhu: (id) => set({ selectedAhuId: id }),

  toggleKind: (kind) =>
    set((s) => ({
      visibleKinds: s.visibleKinds.includes(kind)
        ? s.visibleKinds.filter((k) => k !== kind)
        : [...s.visibleKinds, kind],
    })),

  toggleRunStop: (id) =>
    set((s) => {
      const ahus = s.ahus.map((a) => {
        if (a.id !== id || a.trip) return a;
        const runStop = !a.runStop;
        return {
          ...a,
          runStop,
          fanOn: runStop,
          fanRpm: runStop ? Math.max(1000, a.fanRpm || 1200) : 0,
          vsdRpmPct: runStop ? Math.max(35, a.vsdRpmPct || 45) : 0,
        };
      });
      return { ahus, devices: refreshDevices(s.devices, ahus) };
    }),

  toggleManual: (id) =>
    set((s) => ({
      ahus: s.ahus.map((a) => (a.id === id ? { ...a, manual: !a.manual } : a)),
    })),

  injectFault: (kind) => {
    const { ahus, alarms, activeFaults, devices } = get();
    // Target a healthy unit on the floor being viewed, so the fault is visible
    // on the plan the operator is already looking at.
    const floor = get().floor;
    const target =
      ahus.find((a) => a.floor === floor && a.status === 'Working') ?? ahus[0];

    const nextAhus = ahus.map((a) => {
      if (a.id !== target.id) return a;
      switch (kind) {
        case 'ahu_fan_trip':
          return {
            ...a,
            status: 'Fault' as const,
            trip: true,
            runStop: false,
            fanOn: false,
            fanRpm: 0,
            vsdRpmPct: 0,
          };
        case 'filter_blocked':
          return { ...a, preFilterOk: false, bagFilterOk: false };
        case 'duct_smoke':
          return { ...a, status: 'Fault' as const, ductSmokeOk: false };
        case 'chw_valve_stuck':
          return { ...a, coolingValvePct: 100, saTemp: Math.round((a.saTemp + 7) * 10) / 10 };
        default:
          return a;
      }
    });

    let nextAlarms = deriveAlarms(nextAhus, alarms);
    if (kind === 'chw_valve_stuck') {
      nextAlarms = raise(
        nextAlarms,
        target.id,
        'Cooling Coil Valve Stuck Open',
        '85 %',
        '100 %',
        'high'
      );
    }

    set({
      ahus: nextAhus,
      alarms: nextAlarms,
      devices: refreshDevices(devices, nextAhus),
      activeFaults: activeFaults.includes(kind) ? activeFaults : [...activeFaults, kind],
    });
  },

  clearFaults: () => {
    const fresh = ALL_AHUS.map((a) => ({ ...a }));
    set({
      ahus: fresh,
      alarms: deriveAlarms(fresh, []),
      devices: buildPlanDevices(get().floor),
      activeFaults: [],
    });
  },

  ackAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, state: 'ACK' as const, operator: 'Operator1' } : a
      ),
    })),

  ackAll: () =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.state === 'UNACK' ? { ...a, state: 'ACK' as const, operator: 'Operator1' } : a
      ),
    })),

  tick: () =>
    set((s) => ({
      now: Date.now(),
      // Light drift on the running units so the readings look instrumented.
      ahus: s.ahus.map((a) =>
        a.runStop
          ? {
              ...a,
              raTemp: Math.round((a.raTemp + (Math.random() - 0.5) * 0.2) * 10) / 10,
              saTemp: Math.round((a.saTemp + (Math.random() - 0.5) * 0.2) * 10) / 10,
              fanRpm: Math.max(0, Math.round(a.fanRpm + (Math.random() - 0.5) * 12)),
            }
          : a
      ),
    })),
}));

/** Keep plan device status in step with the AHU fleet behind it. */
function refreshDevices(devices: PlanDevice[], ahus: AhuAsset[]): PlanDevice[] {
  return devices.map((d) => {
    if (!d.ahuId) return d;
    const a = ahus.find((x) => x.id === d.ahuId);
    if (!a) return d;
    return {
      ...d,
      status: a.status === 'Fault' ? 'alarm' : 'normal',
      value: `${a.saTemp.toFixed(1)} °C`,
    };
  });
}

export interface FloorRollup {
  floor: Floor;
  total: number;
  working: number;
  fault: number;
}

export function computeFloorRollups(ahus: AhuAsset[]): FloorRollup[] {
  const floors: Floor[] = ['GF', '1F', '2F', '3F'];
  return floors.map((floor) => {
    const items = ahus.filter((a) => a.floor === floor);
    return {
      floor,
      total: items.length,
      working: items.filter((a) => a.status === 'Working').length,
      fault: items.filter((a) => a.status === 'Fault').length,
    };
  });
}
