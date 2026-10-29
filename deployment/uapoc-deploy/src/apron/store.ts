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

/**
 * The stand inventory, from the real aerodrome.
 *
 * Ngurah Rai has 40 surveyed parking positions — OSM `aeroway=parking_position`
 * refs 1-38 plus 2A and 3A. The console used to show six invented bays, which
 * made every capacity number on the screen fiction and the apron look like a
 * regional strip rather than the airport it is.
 *
 * The refs and the count are real. The contact/remote split and the terminal
 * each stand serves are inferred from stand numbering and apron position — DPS
 * does not publish a stand schedule — so treat those two attributes as a
 * plausible arrangement rather than surveyed fact.
 *
 * © OpenStreetMap contributors, ODbL.
 */
const STAND_REFS: string[] = [
  '1', '2', '2A', '3', '3A', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38',
];

/** Stands 1-16 sit on the international pier, 17-28 domestic; the rest remote. */
function standProfile(i: number): { terminal: 'T1' | 'T2'; contact: boolean } {
  if (i < 16) return { terminal: 'T2', contact: true };
  if (i < 28) return { terminal: 'T1', contact: true };
  return { terminal: i % 2 === 0 ? 'T1' : 'T2', contact: false };
}

/** Types that actually work DPS: narrowbodies on the pier, widebodies long-haul. */
const FLEET: AircraftType[] = ['A320', 'B737-800', 'A321', 'A330', 'B738 MAX', 'ATR 72'];

/** Garuda, Lion, Citilink, AirAsia, Batik, Jetstar, Singapore, Qatar, Scoot. */
const CALLSIGNS: string[] = [
  'GA402', 'JT12', 'QG684', 'QZ7511', 'ID6372', 'JQ36', 'SQ938', 'QR962',
  'TR280', 'GA254', 'JT918', 'QG901', 'ID6510', 'MH715', 'CX781', 'KE629',
];

function buildStands(): Stand[] {
  const seed = STAND_REFS.map((ref, i) => {
    const { terminal, contact } = standProfile(i);
    return { ref, name: `Stand ${ref}`, terminal, contact };
  });

  return seed.map((s, i) => {
    const n = s.ref.padStart(2, '0');
    // A plausible mid-morning bank: contact stands mostly working, remote
    // stands mostly empty. Deterministic so the console does not reshuffle
    // itself on every reload.
    const occupied = s.contact ? i % 3 !== 1 : i % 5 === 0;
    return {
      id: `STD-${n}`,
      name: s.name,
      terminal: s.terminal,
      contact: s.contact,
      occupied,
      aircraftType: occupied ? FLEET[i % FLEET.length] : null,
      // The carrier mix DPS actually sees, so the board reads like Denpasar
      // rather than like three flights repeated thirteen times.
      flight: occupied ? CALLSIGNS[i % CALLSIGNS.length] : null,
      docking: occupied ? ('docked' as DockingState) : ('idle' as DockingState),
      approach: occupied ? 1 : 0,
      chocksOn: occupied,
      chocksOnAt: occupied ? Date.now() - 1000 * 60 * (12 + i * 3) : null,
      chocksOffAt: null,
      maintenance: false,
      vdgs: {
        id: `STD${n}_VDGS_01`,
        // Contact stands get the full-capability unit; the remote stand the
        // entry-level one, which is how these are actually specified.
        model: s.contact ? 'ADB SAFEGATE Safedock X' : 'ADB SAFEGATE Safedock T1',
        status: 'active',
        closingDistance: occupied ? 0 : 0,
        azimuth: 0,
        message: occupied ? 'OK' : '—',
        expectedType: occupied ? FLEET[i % FLEET.length] : null,
      },
      equipment: EQUIPMENT_PLAN.filter((e) => s.contact || e.kind !== 'pbb').map((e) => ({
        id: `STD${n}_${e.kind.toUpperCase()}_01`,
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
              // Off chocks and into pushback. The stand stays occupied until the
              // aircraft has actually moved — see the `departing` branch in
              // `tick`, which walks it back down the lead-in line. Clearing
              // everything here is what made a departure read as a cut.
              docking: 'departing' as DockingState,
              chocksOn: false,
              chocksOffAt: Date.now(),
              vdgs: { ...st.vdgs, closingDistance: 0, azimuth: 0, message: 'OFF BLOCK' },
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
      /**
       * Pushback.
       *
       * The aircraft backs down the lead-in line over roughly eight seconds —
       * long enough to read as a movement, short enough not to hold up a demo.
       * The stand only empties once it has cleared, which is what makes the
       * bridge retract and the graphic drain rather than blink.
       */
      if (st.docking === 'departing') {
        changed = true;
        const approach = st.approach - dt * 0.13;
        if (approach > 0) {
          return { ...st, approach, vdgs: { ...st.vdgs, message: 'OFF BLOCK' } };
        }
        return {
          ...st,
          occupied: false,
          docking: 'idle' as DockingState,
          approach: 0,
          aircraftType: null,
          flight: null,
          vdgs: { ...st.vdgs, closingDistance: 0, azimuth: 0, message: '—', expectedType: null },
        };
      }

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
