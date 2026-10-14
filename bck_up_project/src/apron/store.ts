/**
 * Apron Management System engine.
 *
 * Same shape as the AGL engine: one store of stands and equipment, with alarms
 * derived from equipment state so the alarm strip, the stand graphics and the
 * status rail can never disagree with each other.
 *
 * The docking sequence is driven here rather than in the component so that a
 * stand keeps progressing while the operator is looking at a different panel,
 * and so injected faults can interrupt a docking mid-approach.
 */

import { create } from 'zustand';
import { AglAlarm, AlarmKind, AlarmPriority } from '../agl/types';
import {
  AircraftType,
  ApronFaultKind,
  DockingState,
  EquipKind,
  Equipment,
  Stand,
} from './types';

let alarmSeq = 5000;
const nextAlarmId = () => `APR-${++alarmSeq}`;

export const AIRCRAFT_TYPES: AircraftType[] = [
  'A320',
  'A321',
  'B737-800',
  'B738 MAX',
  'ATR 72',
  'A330',
];

/** Services fitted to every stand, in the order they appear on the graphic. */
const EQUIPMENT_PLAN: { kind: EquipKind; label: string }[] = [
  { kind: 'pbb', label: 'Passenger Boarding Bridge' },
  { kind: 'gpu', label: 'Ground Power Unit' },
  { kind: 'pca', label: 'Pre-Conditioned Air' },
  { kind: 'fuel', label: 'Fuel Pit' },
  { kind: 'flood', label: 'Apron Flood Light' },
  { kind: 'estop', label: 'Emergency Stop Button' },
  { kind: 'fire', label: 'Fire Manual Call Point' },
];

const PRIORITY: Record<string, AlarmPriority> = {
  vdgs: 'critical',
  pbb: 'high',
  gpu: 'high',
  pca: 'medium',
  fuel: 'high',
  flood: 'medium',
  estop: 'critical',
  fire: 'critical',
};

function buildStands(): Stand[] {
  const seed: { name: string; terminal: 'T1' | 'T2'; contact: boolean }[] = [
    { name: 'Bay 1', terminal: 'T1', contact: true },
    { name: 'Bay 2', terminal: 'T1', contact: true },
    { name: 'Bay 3', terminal: 'T1', contact: true },
    { name: 'Bay 4', terminal: 'T2', contact: true },
    { name: 'Bay 5', terminal: 'T2', contact: true },
    { name: 'Bay 6', terminal: 'T2', contact: false },
  ];

  return seed.map((s, i) => {
    const n = String(i + 1).padStart(2, '0');
    const occupied = i === 0 || i === 2 || i === 4;
    return {
      id: `BAY-${n}`,
      name: s.name,
      terminal: s.terminal,
      contact: s.contact,
      occupied,
      aircraftType: occupied ? (['A320', 'B737-800', 'A321'] as AircraftType[])[i % 3] : null,
      flight: occupied ? ['VN1546', 'VJ322', 'QH1421'][i % 3] : null,
      docking: occupied ? ('docked' as DockingState) : ('idle' as DockingState),
      approach: occupied ? 1 : 0,
      chocksOn: occupied,
      chocksOnAt: occupied ? Date.now() - 1000 * 60 * (12 + i * 3) : null,
      chocksOffAt: null,
      maintenance: false,
      vdgs: {
        id: `BAY${n}_VDGS_01`,
        // Contact stands get the full-capability unit; the remote stand the
        // entry-level one, which is how these are actually specified.
        model: s.contact ? 'ADB SAFEGATE Safedock X' : 'ADB SAFEGATE Safedock T1',
        status: 'active',
        closingDistance: occupied ? 0 : 0,
        azimuth: 0,
        message: occupied ? 'OK' : '—',
        expectedType: occupied ? (['A320', 'B737-800', 'A321'] as AircraftType[])[i % 3] : null,
      },
      equipment: EQUIPMENT_PLAN.filter((e) => s.contact || e.kind !== 'pbb').map((e) => ({
        id: `BAY${n}_${e.kind.toUpperCase()}_01`,
        kind: e.kind,
        label: e.label,
        status:
          e.kind === 'pbb' || e.kind === 'gpu' || e.kind === 'pca'
            ? occupied
              ? 'active'
              : 'standby'
            : 'active',
        value:
          e.kind === 'gpu' && occupied
            ? '112 A'
            : e.kind === 'pca' && occupied
            ? '18 °C'
            : e.kind === 'flood'
            ? '92 %'
            : undefined,
      })),
    };
  });
}

function raise(
  alarms: AglAlarm[],
  tag: string,
  kind: AlarmKind,
  description: string,
  limit: string,
  currentValue: string,
  priority: AlarmPriority
): AglAlarm[] {
  if (alarms.some((a) => a.tag === tag && a.state !== 'SHELVED')) return alarms;
  return [
    {
      id: nextAlarmId(),
      tag,
      group: 'Apron',
      kind,
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

export interface ApronRollup {
  kind: EquipKind;
  label: string;
  total: number;
  active: number;
  fail: number;
}

const KIND_LABEL: Record<EquipKind, string> = {
  vdgs: 'VDGS',
  pbb: 'PBB',
  gpu: 'GPU',
  pca: 'PCA',
  fuel: 'Fuel Pit',
  flood: 'Flood Light',
  estop: 'Emergency Stop Button',
  fire: 'Fire Manual Call Point',
};

/** Equipment totals for the System Status block. */
export function computeApronRollups(stands: Stand[]): ApronRollup[] {
  const kinds: EquipKind[] = ['vdgs', 'pbb', 'gpu', 'pca', 'fuel', 'flood', 'estop', 'fire'];
  return kinds.map((kind) => {
    if (kind === 'vdgs') {
      return {
        kind,
        label: KIND_LABEL[kind],
        total: stands.length,
        active: stands.filter((s) => s.vdgs.status === 'active').length,
        fail: stands.filter((s) => s.vdgs.status === 'fault' || s.vdgs.status === 'offline').length,
      };
    }
    const items = stands.flatMap((s) => s.equipment.filter((e) => e.kind === kind));
    return {
      kind,
      label: KIND_LABEL[kind],
      total: items.length,
      active: items.filter((e) => e.status === 'active').length,
      fail: items.filter((e) => e.status === 'fault' || e.status === 'offline').length,
    };
  });
}

interface ApronState {
  stands: Stand[];
  alarms: AglAlarm[];
  selectedStandId: string | null;
  now: number;
  activeFaults: ApronFaultKind[];

  select: (id: string | null) => void;
  setAircraftType: (standId: string, type: AircraftType) => void;
  setMaintenance: (standId: string, on: boolean) => void;
  startDocking: (standId: string) => void;
  releaseStand: (standId: string) => void;
  setChocks: (standId: string, on: boolean) => void;
  setEquipmentStatus: (standId: string, kind: EquipKind, status: Equipment['status']) => void;

  injectFault: (kind: ApronFaultKind, standId?: string) => void;
  clearFaults: () => void;

  ackAlarm: (id: string) => void;
  ackAll: () => void;

  /** Advances every docking in progress. Called once per animation tick. */
  tick: (dtSeconds: number) => void;
}

/** Stop distance in metres at which each docking phase begins. */
const PHASE = {
  capture: 30,
  align: 18,
  close: 8,
  stop: 0.2,
};

export const useApronStore = create<ApronState>((set, get) => ({
  stands: buildStands(),
  alarms: [],
  selectedStandId: null,
  now: Date.now(),
  activeFaults: [],

  select: (id) => set({ selectedStandId: id }),

  setAircraftType: (standId, type) =>
    set((s) => ({
      stands: s.stands.map((st) =>
        st.id === standId
          ? { ...st, vdgs: { ...st.vdgs, expectedType: type }, aircraftType: type }
          : st
      ),
    })),

  setMaintenance: (standId, on) =>
    set((s) => ({
      stands: s.stands.map((st) => (st.id === standId ? { ...st, maintenance: on } : st)),
    })),

  startDocking: (standId) =>
    set((s) => ({
      stands: s.stands.map((st) => {
        if (st.id !== standId || st.maintenance) return st;
        const type = st.vdgs.expectedType ?? 'A320';
        return {
          ...st,
          occupied: true,
          aircraftType: type,
          flight: st.flight ?? 'VN1820',
          docking: 'capturing',
          approach: 0,
          chocksOn: false,
          chocksOnAt: null,
          chocksOffAt: null,
          vdgs: {
            ...st.vdgs,
            closingDistance: PHASE.capture + 6,
            // Start off centreline so the azimuth guidance has something to do.
            azimuth: 1.4,
            message: type,
            expectedType: type,
          },
        };
      }),
    })),

  releaseStand: (standId) =>
    set((s) => ({
      stands: s.stands.map((st) =>
        st.id === standId
          ? {
              ...st,
              occupied: false,
              docking: 'idle',
              approach: 0,
              aircraftType: null,
              flight: null,
              chocksOn: false,
              chocksOffAt: Date.now(),
              vdgs: { ...st.vdgs, closingDistance: 0, azimuth: 0, message: '—' },
              equipment: st.equipment.map((e) =>
                e.kind === 'pbb' || e.kind === 'gpu' || e.kind === 'pca'
                  ? { ...e, status: 'standby' as const }
                  : e
              ),
            }
          : st
      ),
    })),

  setChocks: (standId, on) =>
    set((s) => ({
      stands: s.stands.map((st) =>
        st.id === standId
          ? {
              ...st,
              chocksOn: on,
              chocksOnAt: on ? Date.now() : st.chocksOnAt,
              chocksOffAt: on ? null : Date.now(),
            }
          : st
      ),
    })),

  setEquipmentStatus: (standId, kind, status) =>
    set((s) => ({
      stands: s.stands.map((st) =>
        st.id === standId
          ? {
              ...st,
              equipment: st.equipment.map((e) => (e.kind === kind ? { ...e, status } : e)),
            }
          : st
      ),
    })),

  injectFault: (kind, standId) => {
    const { stands, alarms, activeFaults } = get();
    // Default to a stand that is actually occupied, so the fault has
    // operational consequence rather than landing on an empty bay.
    const target =
      stands.find((s) => s.id === standId) ?? stands.find((s) => s.occupied) ?? stands[0];

    let nextStands = stands;
    let nextAlarms = alarms;

    const patch = (fn: (s: Stand) => Stand) => {
      nextStands = nextStands.map((s) => (s.id === target.id ? fn(s) : s));
    };

    switch (kind) {
      case 'vdgs_fault':
        patch((s) => ({
          ...s,
          docking: s.docking === 'docked' ? s.docking : 'idle',
          vdgs: { ...s.vdgs, status: 'fault', message: 'FAULT' },
        }));
        nextAlarms = raise(
          nextAlarms,
          target.vdgs.id,
          'failure',
          'VDGS Unit Failure',
          'Healthy',
          'Fault',
          PRIORITY.vdgs
        );
        break;

      case 'pbb_disconnect':
        patch((s) => ({
          ...s,
          equipment: s.equipment.map((e) =>
            e.kind === 'pbb' ? { ...e, status: 'fault' as const } : e
          ),
        }));
        nextAlarms = raise(
          nextAlarms,
          `${target.id.replace('-', '')}_PBB_01`,
          'failure',
          'PBB Disconnect',
          'Connected',
          'Not Connected',
          PRIORITY.pbb
        );
        break;

      case 'gpu_overload':
        patch((s) => ({
          ...s,
          equipment: s.equipment.map((e) =>
            e.kind === 'gpu' ? { ...e, status: 'fault' as const, value: '186 A' } : e
          ),
        }));
        nextAlarms = raise(
          nextAlarms,
          `${target.id.replace('-', '')}_GPU_01`,
          'intensity_hihi',
          'GPU Overload',
          '140 A',
          '186 A',
          PRIORITY.gpu
        );
        break;

      case 'floodlight_low':
        // Floodlighting is apron-wide, so this one hits every stand.
        nextStands = nextStands.map((s) => ({
          ...s,
          equipment: s.equipment.map((e) =>
            e.kind === 'flood' ? { ...e, status: 'fault' as const, value: '18 %' } : e
          ),
        }));
        for (const s of nextStands) {
          nextAlarms = raise(
            nextAlarms,
            `${s.id.replace('-', '')}_FLOOD_01`,
            'intensity_lolo',
            'Luminous Intensity Level Alarm',
            '20 %',
            '18 %',
            PRIORITY.flood
          );
        }
        break;

      case 'estop_pressed':
        patch((s) => ({
          ...s,
          docking: 'stopped',
          vdgs: { ...s.vdgs, message: 'STOP' },
          equipment: s.equipment.map((e) =>
            e.kind === 'estop' ? { ...e, status: 'fault' as const } : e
          ),
        }));
        nextAlarms = raise(
          nextAlarms,
          `${target.id.replace('-', '')}_ESTOP_01`,
          'failure',
          'Emergency Stop Activated',
          'Released',
          'Pressed',
          PRIORITY.estop
        );
        break;
    }

    set({
      stands: nextStands,
      alarms: nextAlarms,
      activeFaults: activeFaults.includes(kind) ? activeFaults : [...activeFaults, kind],
    });
  },

  clearFaults: () =>
    set((s) => ({
      alarms: [],
      activeFaults: [],
      stands: s.stands.map((st) => ({
        ...st,
        vdgs: {
          ...st.vdgs,
          status: 'active',
          message: st.occupied ? 'OK' : '—',
        },
        equipment: st.equipment.map((e) => ({
          ...e,
          status:
            e.kind === 'pbb' || e.kind === 'gpu' || e.kind === 'pca'
              ? st.occupied
                ? ('active' as const)
                : ('standby' as const)
              : ('active' as const),
          value:
            e.kind === 'gpu' && st.occupied
              ? '112 A'
              : e.kind === 'pca' && st.occupied
              ? '18 °C'
              : e.kind === 'flood'
              ? '92 %'
              : undefined,
        })),
      })),
    })),

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

  tick: (dt) => {
    const { stands } = get();
    let changed = false;

    const next = stands.map((st) => {
      if (st.docking === 'idle' || st.docking === 'docked' || st.docking === 'stopped') {
        return st;
      }
      changed = true;

      // Slow down as the aircraft closes on the stop bar, the way a real
      // approach does — most of the time is spent in the last few metres.
      const speed = st.vdgs.closingDistance > PHASE.align ? 6 : 2.2;
      const distance = Math.max(0, st.vdgs.closingDistance - speed * dt);

      // Azimuth converges to the centreline during the alignment phase.
      const azimuth =
        distance > PHASE.align
          ? st.vdgs.azimuth
          : Number((st.vdgs.azimuth * 0.92).toFixed(2));

      let docking: DockingState = st.docking;
      let message = st.vdgs.message;

      if (distance <= PHASE.stop) {
        docking = 'docked';
        message = 'OK';
      } else if (distance <= PHASE.close) {
        docking = 'closing';
        message = 'SLOW';
      } else if (distance <= PHASE.align) {
        docking = 'aligning';
        message = st.vdgs.expectedType ?? 'ALIGN';
      } else {
        docking = 'capturing';
      }

      const docked = docking === 'docked';

      return {
        ...st,
        docking,
        // Stand graphic fills in as the aircraft closes.
        approach: 1 - distance / (PHASE.capture + 6),
        chocksOn: docked ? true : st.chocksOn,
        chocksOnAt: docked && !st.chocksOn ? Date.now() : st.chocksOnAt,
        vdgs: {
          ...st.vdgs,
          closingDistance: Number(distance.toFixed(1)),
          azimuth: docked ? 0 : azimuth,
          message,
        },
        // Ground services come online once the aircraft is on chocks.
        equipment: docked
          ? st.equipment.map((e) =>
              e.kind === 'pbb' || e.kind === 'gpu' || e.kind === 'pca'
                ? {
                    ...e,
                    status: e.status === 'fault' ? e.status : ('active' as const),
                    value:
                      e.kind === 'gpu' ? '112 A' : e.kind === 'pca' ? '18 °C' : e.value,
                  }
                : e
            )
          : st.equipment,
      };
    });

    if (changed) set({ stands: next, now: Date.now() });
    else set({ now: Date.now() });
  },
}));
