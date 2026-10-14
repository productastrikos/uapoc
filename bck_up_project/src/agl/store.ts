/**
 * AGL tag engine.
 *
 * One store holds every fixture, circuit, alarm, advisory and work order, and
 * every screen reads from it. That is the point: a fault injected here shows up
 * on the airfield canvas, the KPI rail, the alarm strip, the advisory panel and
 * the maintenance work-order list at the same time, because they are all views
 * over the same tags rather than separate mock datasets.
 */

import { create } from 'zustand';
import {
  AglAlarm,
  AirfieldMode,
  AlarmConfigEntry,
  AlarmKind,
  AlarmPriority,
  CanvasOverlay,
  Circuit,
  FaultAdvisory,
  FaultKind,
  Fixture,
  WorkOrder,
} from './types';
import {
  Airfield,
  buildAirfield,
  CATEGORIES,
  NOMINAL_INTENSITY,
  spanBetween,
} from './airfield';

let alarmSeq = 0;
let woSeq = 1400;

const nextAlarmId = () => `ALM-${++alarmSeq}`;
const nextWorkOrderId = () => `WO26-${++woSeq}`;

/** Intensity step 1–5 as a fraction of the commanded setpoint. */
const STEP_FRACTION = [0, 0.01, 0.03, 0.1, 0.3, 1];

/** Alarm limits as a fraction of nominal intensity, per the ALCMS faceplate. */
const ALARM_FRACTION: Record<string, number> = {
  intensity_hihi: 1.15,
  intensity_hi: 1.08,
  intensity_lo: 0.85,
  intensity_lolo: 0.75,
};

export function alarmConfigFor(fixture: Fixture): AlarmConfigEntry[] {
  const nominal = NOMINAL_INTENSITY[fixture.category];
  return [
    { kind: 'intensity_hihi', label: 'Intensity High-High Alm', enabled: true, setpoint: Math.round(nominal * ALARM_FRACTION.intensity_hihi), unit: 'Cd', timeDelay: 0 },
    { kind: 'intensity_hi', label: 'Intensity High Alm', enabled: true, setpoint: Math.round(nominal * ALARM_FRACTION.intensity_hi), unit: 'Cd', timeDelay: 2 },
    { kind: 'intensity_lo', label: 'Intensity Lo Alm', enabled: true, setpoint: Math.round(nominal * ALARM_FRACTION.intensity_lo), unit: 'Cd', timeDelay: 2 },
    { kind: 'intensity_lolo', label: 'Intensity Lo Lo Alm', enabled: true, setpoint: Math.round(nominal * ALARM_FRACTION.intensity_lolo), unit: 'Cd', timeDelay: 0 },
    { kind: 'failure', label: 'Failure Alm', enabled: true, setpoint: 0, unit: 'Sec', timeDelay: 0 },
  ];
}

const PRIORITY_BY_KIND: Record<AlarmKind, AlarmPriority> = {
  intensity_hihi: 'high',
  intensity_hi: 'medium',
  intensity_lo: 'medium',
  intensity_lolo: 'high',
  failure: 'critical',
  comms: 'critical',
  circuit: 'critical',
  serviceability: 'critical',
};

export interface CategoryRollup {
  id: string;
  label: string;
  target: number;
  total: number;
  failed: number;
  /** Percentage of fixtures lit and reporting. */
  serviceability: number;
  /** True when serviceability has dropped below the ICAO target. */
  breached: boolean;
}

/**
 * Serviceability per lighting category.
 *
 * A standalone function rather than a store selector: it builds a fresh array
 * on every call, so used as a selector it would hand React a new snapshot each
 * render and trip the `getSnapshot` loop guard. Callers select `airfield` and
 * wrap this in `useMemo`.
 */
export function computeRollups(airfield: Airfield): CategoryRollup[] {
  return CATEGORIES.map((cat) => {
    const items = airfield.fixtures.filter((f) => f.category === cat.id);
    const failed = items.filter(
      (f) => f.state === 'failed' || f.comms === 'silent' || f.state === 'off'
    ).length;
    const total = items.length;
    const serviceability = total === 0 ? 100 : ((total - failed) / total) * 100;
    return {
      id: cat.id,
      label: cat.label,
      target: cat.target,
      total,
      failed,
      serviceability,
      breached: serviceability < cat.target,
    };
  });
}

interface AglState {
  airfield: Airfield;
  alarms: AglAlarm[];
  advisories: FaultAdvisory[];
  workOrders: WorkOrder[];
  mode: AirfieldMode;
  overlay: CanvasOverlay;
  selectedTag: string | null;
  /** Fault scenarios currently applied, so the dock can show what is active. */
  activeFaults: FaultKind[];
  /** Wall clock used for alarm durations, advanced by the ticker. */
  now: number;

  select: (tag: string | null) => void;
  setOverlay: (overlay: CanvasOverlay) => void;
  setMode: (mode: AirfieldMode) => void;

  setLampCommand: (tag: string, on: boolean) => void;
  setIntensitySetpoint: (tag: string, cd: number) => void;
  setMaintenanceMode: (tag: string, enabled: boolean) => void;
  setCircuitStep: (circuitId: string, step: number) => void;

  ackAlarm: (id: string) => void;
  shelveAlarm: (id: string) => void;
  ackAll: () => void;
  escalateToWorkOrder: (alarmId: string) => void;
  advanceWorkOrder: (id: string) => void;

  injectFault: (kind: FaultKind) => void;
  clearFaults: () => void;
  tick: () => void;

  rollups: () => CategoryRollup[];
  circuitFor: (tag: string) => Circuit | undefined;
}

/** Raise an alarm, collapsing duplicates on the same tag and kind. */
function raise(
  alarms: AglAlarm[],
  tag: string,
  group: string,
  kind: AlarmKind,
  description: string,
  limit: string,
  currentValue: string
): AglAlarm[] {
  const existing = alarms.find(
    (a) => a.tag === tag && a.kind === kind && a.state !== 'SHELVED'
  );
  if (existing) return alarms;
  return [
    {
      id: nextAlarmId(),
      tag,
      group,
      kind,
      description,
      priority: PRIORITY_BY_KIND[kind],
      state: 'UNACK',
      raisedAt: Date.now(),
      limit,
      currentValue,
    },
    ...alarms,
  ];
}

/**
 * Infer probable cable faults.
 *
 * A fixture that reports itself failed is a lamp problem. A *contiguous run* of
 * fixtures that stopped answering the LINC 360 poll, on a circuit whose CCR
 * still shows healthy output current, is the signature of a break in the series
 * loop — the fixtures beyond the break lose communication together.
 *
 * This narrows the fault to the span between the last fixture that answered and
 * the first that did not. It is inference, not reflectometry: it tells a crew
 * which span to walk, which is the difference between a five-hour runway
 * closure and a twenty-minute one.
 */
function computeAdvisories(airfield: Airfield): FaultAdvisory[] {
  const out: FaultAdvisory[] = [];

  for (const circuit of airfield.circuits) {
    // A tripped CCR explains silence on its own; no cable inference to make.
    if (circuit.faulted) continue;

    const ordered = circuit.fixtureIds.map((id) => airfield.byId[id]);
    const silent = ordered.map((f) => f.comms === 'silent');
    if (!silent.some(Boolean)) continue;

    // Find the longest contiguous run of silent fixtures on this loop.
    let bestStart = -1;
    let bestLen = 0;
    let start = -1;
    for (let i = 0; i <= silent.length; i += 1) {
      if (i < silent.length && silent[i]) {
        if (start === -1) start = i;
      } else if (start !== -1) {
        const len = i - start;
        if (len > bestLen) {
          bestLen = len;
          bestStart = start;
        }
        start = -1;
      }
    }

    // A single silent fixture is far more likely a dead comms module than a
    // severed cable. Only claim a cable fault once a run has formed.
    if (bestLen < 3) continue;

    const firstSilent = ordered[bestStart];
    const lastGood = ordered[bestStart - 1] ?? ordered[0];
    const span = spanBetween(lastGood, firstSilent);

    // Confidence rises with the length of the run and falls if the CCR current
    // has also sagged, which would point at the regulator instead.
    const currentHealthy = circuit.outputCurrent > circuit.ratedCurrent * 0.6;
    const confidence = Math.min(
      96,
      Math.round(55 + bestLen * 3 + (currentHealthy ? 12 : -15))
    );

    out.push({
      id: `ADV-${circuit.id}`,
      circuitId: circuit.id,
      lastGoodTag: lastGood.id,
      firstSilentTag: firstSilent.id,
      silentCount: bestLen,
      spanMetres: span,
      confidence,
      headline: `Probable series circuit break on ${circuit.id} between ${lastGood.id} and ${firstSilent.id}`,
      reasoning: [
        `${bestLen} consecutive fixtures on ${circuit.id} stopped responding to the LINC 360 poll simultaneously.`,
        `${lastGood.id} (seq ${lastGood.seq}) is the last fixture still reporting; ${firstSilent.id} (seq ${firstSilent.seq}) is the first silent.`,
        currentHealthy
          ? `${circuit.ccrModel} on ${circuit.id} still reports ${circuit.outputCurrent.toFixed(1)} A output — the regulator is healthy, so this is downstream of the CCR.`
          : `${circuit.id} output current has fallen to ${circuit.outputCurrent.toFixed(1)} A — regulator fault cannot be ruled out.`,
        `Lamps report no failure state, which argues against ${bestLen} simultaneous lamp failures.`,
      ],
      recommendation:
        `Inspect the series cable between ${lastGood.id} and ${firstSilent.id} — approximately ${span} m of loop. ` +
        `Confirm with a reflectometer at the ${circuit.aceUnit} vault termination before excavating.`,
    });
  }

  return out;
}

/** Re-evaluate alarms from current tag values. */
function evaluate(airfield: Airfield, alarms: AglAlarm[]): AglAlarm[] {
  let next = alarms;

  for (const f of airfield.fixtures) {
    if (f.state === 'failed') {
      next = raise(next, f.id, 'AGL', 'failure', 'Failure Alarm', 'Alarm', 'True');
    }
    if (f.comms === 'silent') {
      next = raise(next, f.id, 'AGL', 'comms', 'Communication Failure Alarm', 'No Reply', 'True');
    }
  }

  for (const c of airfield.circuits) {
    if (c.faulted) {
      next = raise(
        next,
        `${c.id}.OutputFail`,
        'CCR',
        'circuit',
        `${c.name} — regulator output failure`,
        `${c.ratedCurrent.toFixed(1)} A`,
        `${c.outputCurrent.toFixed(1)} A`
      );
    }
  }

  return next;
}

/** Pick fixtures matching a predicate and mark them failed or silent. */
function applyTo(
  airfield: Airfield,
  predicate: (f: Fixture) => boolean,
  change: (f: Fixture) => void
) {
  for (const f of airfield.fixtures) {
    if (predicate(f)) change(f);
  }
}

export const useAglStore = create<AglState>((set, get) => ({
  airfield: buildAirfield(),
  alarms: [],
  advisories: [],
  workOrders: [],
  mode: 'night',
  overlay: 'status',
  selectedTag: null,
  activeFaults: [],
  now: Date.now(),

  select: (tag) => set({ selectedTag: tag }),
  setOverlay: (overlay) => set({ overlay }),
  setMode: (mode) => {
    const { airfield } = get();
    // Low-visibility procedures drive the circuits to a higher brightness step.
    const step = mode === 'day' ? 5 : mode === 'night' ? 3 : 5;
    airfield.circuits.forEach((c) => {
      c.step = step;
      c.outputCurrent = c.faulted ? 0 : c.ratedCurrent * (0.5 + step * 0.1);
    });
    set({ mode, airfield: { ...airfield } });
  },

  setLampCommand: (tag, on) => {
    const { airfield } = get();
    const f = airfield.byId[tag];
    if (!f || f.state === 'failed') return;
    f.state = on ? 'on' : 'off';
    f.intensityActual = on ? f.intensitySetpoint : 0;
    set({ airfield: { ...airfield } });
  },

  setIntensitySetpoint: (tag, cd) => {
    const { airfield } = get();
    const f = airfield.byId[tag];
    if (!f) return;
    f.intensitySetpoint = cd;
    if (f.state === 'on') f.intensityActual = cd;
    set({ airfield: { ...airfield } });
  },

  setMaintenanceMode: (tag, enabled) => {
    const { airfield } = get();
    const f = airfield.byId[tag];
    if (!f) return;
    f.maintenanceMode = enabled;
    f.state = enabled ? 'maintenance' : 'on';
    set({ airfield: { ...airfield } });
  },

  setCircuitStep: (circuitId, step) => {
    const { airfield } = get();
    const c = airfield.circuits.find((x) => x.id === circuitId);
    if (!c) return;
    c.step = step;
    c.outputCurrent = c.faulted ? 0 : c.ratedCurrent * (0.5 + step * 0.1);
    for (const id of c.fixtureIds) {
      const f = airfield.byId[id];
      if (f.state === 'on') {
        f.intensityActual = Math.round(f.intensitySetpoint * STEP_FRACTION[step]);
      }
    }
    set({ airfield: { ...airfield } });
  },

  ackAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, state: 'ACK' as const, operator: 'Operator1' } : a
      ),
    })),

  shelveAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, state: 'SHELVED' as const, operator: 'Operator1' } : a
      ),
    })),

  ackAll: () =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.state === 'UNACK' ? { ...a, state: 'ACK' as const, operator: 'Operator1' } : a
      ),
    })),

  escalateToWorkOrder: (alarmId) => {
    const { alarms, workOrders } = get();
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm || alarm.workOrderId) return;

    const id = nextWorkOrderId();
    const wo: WorkOrder = {
      id,
      tag: alarm.tag,
      title: `${alarm.description} — ${alarm.tag}`,
      priority: alarm.priority,
      status: 'open',
      raisedAt: Date.now(),
      sourceAlarmId: alarm.id,
      history: [
        { at: Date.now(), note: `Auto-raised from alarm ${alarm.id} (${alarm.description}).` },
      ],
    };

    set({
      workOrders: [wo, ...workOrders],
      alarms: alarms.map((a) => (a.id === alarmId ? { ...a, workOrderId: id } : a)),
    });
  },

  advanceWorkOrder: (id) => {
    const order: Record<string, string> = {
      open: 'dispatched',
      dispatched: 'in_progress',
      in_progress: 'closed',
    };
    set((s) => ({
      workOrders: s.workOrders.map((w) => {
        if (w.id !== id) return w;
        const next = order[w.status];
        if (!next) return w;
        return {
          ...w,
          status: next as WorkOrder['status'],
          assignedTo: next === 'dispatched' ? 'AGL Crew 2' : w.assignedTo,
          history: [...w.history, { at: Date.now(), note: `Status → ${next.replace('_', ' ')}.` }],
        };
      }),
    }));
  },

  injectFault: (kind) => {
    const { airfield, alarms, activeFaults } = get();

    switch (kind) {
      case 'fail_papi':
        // Half the PAPI units on one end — the exact fault in the reference.
        applyTo(
          airfield,
          (f) => f.category === 'papi' && f.id.includes('RWY27') && f.seq % 2 === 1,
          (f) => {
            f.state = 'failed';
            f.intensityActual = 0;
          }
        );
        break;

      case 'fail_taxiway':
        applyTo(
          airfield,
          (f) => f.category === 'taxiway_centerline' && f.seq % 7 === 0,
          (f) => {
            f.state = 'failed';
            f.intensityActual = 0;
          }
        );
        break;

      case 'fail_runway_edge':
        applyTo(
          airfield,
          (f) => f.category === 'runway_edge' && f.seq % 9 === 0,
          (f) => {
            f.state = 'failed';
            f.intensityActual = 0;
          }
        );
        break;

      case 'fail_approach':
        applyTo(
          airfield,
          (f) => f.category === 'approach' && f.id.includes('RWY09') && f.seq % 3 === 0,
          (f) => {
            f.state = 'failed';
            f.intensityActual = 0;
          }
        );
        break;

      case 'fail_threshold':
        applyTo(
          airfield,
          (f) => f.category === 'runway_threshold' && f.seq % 4 === 0,
          (f) => {
            f.state = 'failed';
            f.intensityActual = 0;
          }
        );
        break;

      case 'cable_cut': {
        // Sever the taxiway centreline loop partway along: every fixture past
        // the break stops answering, while the CCR keeps driving current.
        //
        // The run is confined to the main parallel taxiway rather than the
        // whole circuit. CCR-09 also carries the connector centrelines, and a
        // break that straddles taxiway A and a connector produces a technically
        // correct but confusing advisory that names two different taxiways.
        const circuit = airfield.circuits.find((c) => c.id === 'CCR-09');
        if (circuit) {
          const mainLine = circuit.fixtureIds.filter((id) =>
            id.startsWith('TWY_A_Center_Light_')
          );
          const cutAt = Math.floor(mainLine.length * 0.55);
          mainLine.slice(cutAt, cutAt + 14).forEach((id) => {
            const f = airfield.byId[id];
            f.comms = 'silent';
            f.state = 'off';
            f.intensityActual = 0;
          });
          circuit.insulationResistance = 3;
        }
        break;
      }

      case 'ccr_trip': {
        const circuit = airfield.circuits.find((c) => c.id === 'CCR-04');
        if (circuit) {
          circuit.faulted = true;
          circuit.healthy = false;
          circuit.outputCurrent = 0;
          circuit.fixtureIds.forEach((id) => {
            const f = airfield.byId[id];
            f.state = 'off';
            f.intensityActual = 0;
          });
        }
        break;
      }
    }

    const nextAlarms = evaluate(airfield, alarms);
    set({
      airfield: { ...airfield },
      alarms: nextAlarms,
      advisories: computeAdvisories(airfield),
      activeFaults: activeFaults.includes(kind) ? activeFaults : [...activeFaults, kind],
    });
  },

  clearFaults: () => {
    const { airfield } = get();
    airfield.fixtures.forEach((f) => {
      f.state = f.maintenanceMode ? 'maintenance' : 'on';
      f.comms = 'reporting';
      f.intensityActual = Math.round(
        f.intensitySetpoint * (0.94 + Math.random() * 0.1)
      );
    });
    airfield.circuits.forEach((c) => {
      c.faulted = false;
      c.healthy = true;
      c.outputCurrent = c.ratedCurrent * (0.5 + c.step * 0.1);
      c.insulationResistance = 120 + Math.round(Math.random() * 60);
    });
    set({
      airfield: { ...airfield },
      alarms: [],
      advisories: [],
      activeFaults: [],
    });
  },

  tick: () => {
    const { airfield } = get();
    // Gentle jitter on measured intensity so trends and the intensity overlay
    // look like live instrumentation rather than constants.
    for (const f of airfield.fixtures) {
      if (f.state === 'on') {
        const drift = (Math.random() - 0.5) * f.intensitySetpoint * 0.02;
        f.intensityActual = Math.max(0, Math.round(f.intensityActual + drift));
      }
    }
    set({ airfield: { ...airfield }, now: Date.now() });
  },

  rollups: () => computeRollups(get().airfield),

  circuitFor: (tag) => {
    const { airfield } = get();
    const f = airfield.byId[tag];
    if (!f) return undefined;
    return airfield.circuits.find((c) => c.id === f.circuitId);
  },
}));
