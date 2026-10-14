/**
 * Airfield Ground Lighting (AGL) — domain types.
 *
 * Modelled on the ADB SAFEGATE airfield stack so the demo reads as a real
 * integration rather than a mock-up:
 *
 *   CORTEX ALCMS (L-890)  — control & monitoring head-end, what TAMS talks to
 *   ACE3 (L-827 / L-829)  — distributed control & monitoring unit in the vault
 *   ASG8000i / CHF        — constant current regulators driving each series circuit
 *   LINC 360 (ILCMS)      — individual lamp control & monitoring over the series
 *                           circuit using OFDM powerline carrier
 *   AXON EQ               — LED fixtures with the LINC comms module integrated
 *   RELIANCE PAPI Gen2    — L-880(L) precision approach path indicator
 */

/** Photometric colour a fixture shows when lit. Drives the canvas palette. */
export type LightColour =
  | 'white'
  | 'yellow'
  | 'green'
  | 'red'
  | 'blue'
  | 'red_white'; // alternating centreline in the 900–300 m band

export type FixtureCategory =
  | 'runway_edge'
  | 'runway_centerline'
  | 'runway_tdz'
  | 'runway_threshold'
  | 'runway_end'
  | 'approach'
  | 'papi'
  | 'taxiway_centerline'
  | 'taxiway_edge'
  | 'stopbar'
  | 'runway_guard';

/** Category grouping used by the KPI / serviceability rail. */
export interface CategoryMeta {
  id: FixtureCategory;
  /** Label as the client saw it in the AVEVA reference. */
  label: string;
  colour: LightColour;
  /** ICAO Annex 14 serviceability target, % of fixtures that must be lit. */
  target: number;
}

/** Operational state of a single lamp. */
export type LampState =
  | 'on'
  | 'off'
  | 'failed'
  | 'standby'
  | 'maintenance';

/**
 * Whether the fixture is still answering the LINC 360 poll.
 *
 * The distinction between `failed` (lamp reports itself dead) and `silent`
 * (fixture stopped answering entirely) is what makes cable-fault localisation
 * possible — a contiguous run of `silent` fixtures on a healthy circuit is the
 * signature of a break in the series loop, not of failed lamps.
 */
export type CommState = 'reporting' | 'silent';

export interface Fixture {
  /** Tag name, e.g. `RWY27_TouchDwn_Light_010`. */
  id: string;
  category: FixtureCategory;
  /** Human description shown on the faceplate. */
  description: string;
  /** Position in airfield metres; runway centreline is y = 0. */
  x: number;
  y: number;
  colour: LightColour;
  /** Series circuit this fixture sits on. */
  circuitId: string;
  /** Ordinal position along the series loop — the basis of fault localisation. */
  seq: number;
  /** ADB SAFEGATE product family. */
  product: string;
  state: LampState;
  comms: CommState;
  /** Commanded intensity in candela. */
  intensitySetpoint: number;
  /** Measured intensity in candela. */
  intensityActual: number;
  maintenanceMode: boolean;
  /** Cumulative burn hours, drives the predictive-maintenance view. */
  burnHours: number;
}

/** A constant current regulator and the series loop it drives. */
export interface Circuit {
  id: string;
  name: string;
  /** ADB CCR model. */
  ccrModel: string;
  /** ACE3 unit providing L-827/L-829 monitoring for this circuit. */
  aceUnit: string;
  /** Brightness step 1–5, the control operators actually use. */
  step: number;
  /** Rated series current in amps at step 5 (6.6 A is the ICAO standard). */
  ratedCurrent: number;
  /** Measured output current in amps. */
  outputCurrent: number;
  /** Insulation resistance in megohms — degrades before a cable fault. */
  insulationResistance: number;
  healthy: boolean;
  /** Set when the CCR itself has tripped or lost output. */
  faulted: boolean;
  fixtureIds: string[];
}

export type AlarmPriority = 'critical' | 'high' | 'medium' | 'low';

export type AlarmState =
  | 'UNACK'
  | 'ACK'
  | 'UNACK_RTN'
  | 'SHELVED';

/** Alarm classes configured per fixture, mirroring the ALCMS faceplate. */
export type AlarmKind =
  | 'intensity_hihi'
  | 'intensity_hi'
  | 'intensity_lo'
  | 'intensity_lolo'
  | 'failure'
  | 'comms'
  | 'circuit'
  | 'serviceability';

export interface AglAlarm {
  id: string;
  /** Tag the alarm is raised against. */
  tag: string;
  /** Alarm group, e.g. `AGL`, `CCR`. */
  group: string;
  kind: AlarmKind;
  description: string;
  priority: AlarmPriority;
  state: AlarmState;
  /** Epoch millis when the alarm was raised. */
  raisedAt: number;
  /** Configured limit that was breached, as displayed text. */
  limit: string;
  currentValue: string;
  operator?: string;
  /** Set once escalated into a work order. */
  workOrderId?: string;
}

/** Per-fixture alarm configuration, cloned from the ALCMS faceplate. */
export interface AlarmConfigEntry {
  kind: AlarmKind;
  label: string;
  enabled: boolean;
  setpoint: number;
  unit: string;
  /** Debounce in seconds before the alarm asserts. */
  timeDelay: number;
}

/**
 * Inferred cable-fault advisory.
 *
 * This is deliberately probabilistic. Locating a physical cable break needs a
 * time-domain reflectometer; what the platform can legitimately do is observe
 * that a contiguous run of fixtures stopped answering the LINC 360 poll while
 * the CCR still reports healthy current, and narrow the fault to the span
 * between the last fixture that answered and the first that did not.
 */
export interface FaultAdvisory {
  id: string;
  circuitId: string;
  /** Tag of the last fixture still reporting before the gap. */
  lastGoodTag: string;
  /** Tag of the first fixture that went silent. */
  firstSilentTag: string;
  /** Number of consecutive silent fixtures. */
  silentCount: number;
  /** Approximate span between the two fixtures, in metres. */
  spanMetres: number;
  confidence: number;
  headline: string;
  reasoning: string[];
  recommendation: string;
}

export type WorkOrderStatus = 'open' | 'dispatched' | 'in_progress' | 'closed';

export interface WorkOrder {
  id: string;
  tag: string;
  title: string;
  priority: AlarmPriority;
  status: WorkOrderStatus;
  raisedAt: number;
  /** Alarm that escalated into this work order. */
  sourceAlarmId?: string;
  assignedTo?: string;
  /** Free-text trail shown in the escalation drawer. */
  history: { at: number; note: string }[];
}

/** Operating mode; changes intensity steps and which patterns are required. */
export type AirfieldMode = 'day' | 'night' | 'lvp_cat_i' | 'lvp_cat_ii';

/** Canvas overlay — how fixtures are coloured on the airfield plan. */
export type CanvasOverlay =
  | 'status'
  | 'circuit'
  | 'comms'
  | 'intensity'
  | 'serviceability';

/** Fault-injection scenarios exposed on the simulation dock. */
export type FaultKind =
  | 'fail_papi'
  | 'fail_taxiway'
  | 'fail_runway_edge'
  | 'fail_approach'
  | 'fail_threshold'
  | 'cable_cut'
  | 'ccr_trip';
