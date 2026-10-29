/**
 * The SOP library.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * The complaint that came out of the AVEVA review was not that the platform
 * missed alarms. It was that a conveyor jam alert raised, sat there, and never
 * became anything: no owner, no procedure, no work order. "This conveyor jam
 * alert is not escalating."
 *
 * A detail panel that only describes the fault repeats that failure in the UI.
 * So every alarm this platform raises has to be able to answer three questions
 * in one place — what is wrong, what should I do, and who does it — and the
 * answer to the second and third is a named procedure with numbered steps,
 * roles and minutes against each one.
 *
 * The SOPs below are written for an airport rather than adapted from a
 * smart-city template: they name real equipment, real roles, and the standards
 * that actually govern the decision (ICAO Annex 14 serviceability, IATA
 * Resolution 753, EEMUA 191 alarm handling).
 *
 * ── Matching ───────────────────────────────────────────────────────────────
 * `sopForAlert` scores an alarm's text and subsystem against each SOP's
 * keywords. Deliberately simple and inspectable — a demo that claims a
 * classifier here would be claiming something it cannot show. When nothing
 * matches well, it returns the subsystem's general fault procedure rather than
 * nothing, because "no procedure" is the state this module exists to remove.
 */

export type SopPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SopStep {
  order: number;
  action: string;
  /** Who owns this step. Named, because an unassigned step is not a step. */
  role: string;
  /** Realistic elapsed minutes, for the SLA clock on the SOP page. */
  minutes: number;
  /** What proves the step was done. */
  evidence?: string;
  /** Steps that must complete first. */
  after?: number[];
}

export interface Sop {
  id: string;
  name: string;
  subsystem: string;
  category: string;
  priority: SopPriority;
  /** The condition that raises this procedure. */
  trigger: string;
  /** Words that tie an alarm to this SOP. Lower case. */
  keywords: string[];
  /** One plain sentence: what is wrong and what the operator is about to do. */
  aiSummary: string;
  /** The standard or regulation behind the decision, when there is one. */
  basis?: string;
  steps: SopStep[];
  autoIncident: boolean;
  autoAssign: boolean;
  autoClose: boolean;
  /** Share of runs that closed without escalation. */
  successRate: number;
  runsThisMonth: number;
}

const totalMinutes = (steps: SopStep[]) => steps.reduce((n, s) => n + s.minutes, 0);
export const sopDuration = totalMinutes;

export const SOPS: Sop[] = [
  {
    id: 'SOP-AGL-01',
    name: 'Airfield lighting — multiple fixtures dark on one circuit',
    subsystem: 'AGL',
    category: 'Series circuit fault',
    priority: 'CRITICAL',
    trigger: 'Three or more fixtures on the same series circuit stop reporting within one minute',
    keywords: ['circuit', 'ccr', 'dark', 'series', 'output failure', 'cable', 'insulation', 'regulator'],
    aiSummary:
      'Several lights on one circuit went out at the same moment, which points at the power supply feeding them rather than at the lamps. Check the regulator and the standby before sending anyone down the runway.',
    basis: 'ICAO Annex 14 Vol I, 8.1 · ADB SAFEGATE ALCMS fault handling',
    steps: [
      { order: 1, action: 'Confirm the pattern: list every fixture that went silent and check they share one circuit', role: 'AGL Operator', minutes: 2, evidence: 'Fixture list with common circuit id' },
      { order: 2, action: 'Read the CCR output current and insulation resistance for that circuit', role: 'AGL Operator', minutes: 3, after: [1], evidence: 'CCR faceplate reading' },
      { order: 3, action: 'If a healthy standby regulator exists, change over to it and confirm the lights return', role: 'AGL Operator', minutes: 5, after: [2], evidence: 'Post-changeover serviceability rollup' },
      { order: 4, action: 'Advise ATC of the affected category and any resulting operational limit', role: 'AOCC Supervisor', minutes: 3, after: [2], evidence: 'ATC coordination log' },
      { order: 5, action: 'Raise a work order against the circuit for a megger test and cable route inspection', role: 'AGL Operator', minutes: 4, after: [3] },
      { order: 6, action: 'Dispatch the airfield crew with a cable fault locator if the changeover did not restore the lights', role: 'Maintenance Lead', minutes: 30, after: [5], evidence: 'Fault location report' },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: false,
    successRate: 92,
    runsThisMonth: 3,
  },
  {
    id: 'SOP-AGL-02',
    name: 'Lighting category below its serviceability target',
    subsystem: 'AGL',
    category: 'Compliance',
    priority: 'HIGH',
    trigger: 'A light category falls below the Annex 14 serviceability percentage for the approach in force',
    keywords: ['serviceability', 'annex 14', 'papi', 'threshold', 'approach', 'taxiway', 'below', 'target', 'out'],
    aiSummary:
      'Too many lights in one category are out, so the runway is below the standard it is certified to. The operational restriction has to be agreed with ATC before the next arrival, not after it.',
    basis: 'ICAO Annex 14 Vol I, Table 10-1 serviceability targets',
    steps: [
      { order: 1, action: 'Identify the failed fixtures and which circuits they sit on', role: 'AGL Operator', minutes: 3, evidence: 'Serviceability overlay screenshot' },
      { order: 2, action: 'Determine whether the shortfall limits the approach category currently in force', role: 'AGL Operator', minutes: 3, after: [1] },
      { order: 3, action: 'Notify ATC and issue a NOTAM if the category is limited', role: 'AOCC Supervisor', minutes: 8, after: [2], evidence: 'NOTAM reference' },
      { order: 4, action: 'Dispatch a crew to the affected loop before the next mode change', role: 'Maintenance Lead', minutes: 25, after: [1], evidence: 'Lamp replacement record' },
      { order: 5, action: 'Re-run the serviceability rollup and confirm compliance restored', role: 'AGL Operator', minutes: 2, after: [4] },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: true,
    successRate: 96,
    runsThisMonth: 7,
  },
  {
    id: 'SOP-BHS-01',
    name: 'Baggage conveyor jam',
    subsystem: 'BHS',
    category: 'Equipment fault',
    priority: 'CRITICAL',
    trigger: 'Photo-eye dwell exceeds threshold with the drive still commanded',
    keywords: ['conveyor', 'jam', 'baggage', 'belt', 'sorter', 'carousel', 'bhs'],
    aiSummary:
      'A bag is stuck on the belt and the drive is still trying to run it. Stop the section before the motor overheats, clear the bag, and reintroduce it so it is not left behind.',
    basis: 'IATA Resolution 753 baggage tracking · EEMUA 191 alarm response',
    steps: [
      { order: 1, action: 'Stop the affected conveyor section from the SCADA faceplate', role: 'BHS Operator', minutes: 1, evidence: 'Drive stopped confirmation' },
      { order: 2, action: 'Dispatch a handler to the jam location and confirm the section is isolated', role: 'BHS Operator', minutes: 4, after: [1], evidence: 'Isolation permit' },
      { order: 3, action: 'Clear the obstruction and inspect the belt and photo-eye for damage', role: 'Baggage Handler', minutes: 8, after: [2], evidence: 'Photo of cleared section' },
      { order: 4, action: 'Reconcile affected bags against the flight manifest and reintroduce them', role: 'BHS Operator', minutes: 6, after: [3], evidence: 'Res 753 reconciliation record' },
      { order: 5, action: 'Restart the section and confirm throughput returns to nominal', role: 'BHS Operator', minutes: 3, after: [3] },
      { order: 6, action: 'Raise a work order if the same section has jammed more than twice this week', role: 'Maintenance Lead', minutes: 3, after: [5] },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: false,
    successRate: 89,
    runsThisMonth: 11,
  },
  {
    id: 'SOP-LBMS-01',
    name: 'Air handling unit trip',
    subsystem: 'LBMS',
    category: 'HVAC fault',
    priority: 'HIGH',
    trigger: 'AHU reports trip or supply fan stops with the unit commanded to run',
    keywords: ['ahu', 'hvac', 'air handling', 'fan', 'trip', 'temperature', 'cooling', 'zone'],
    aiSummary:
      'An air handling unit has tripped, so the zone it serves is losing cooling. Switch to the standby unit if there is one, then find out why the duty unit stopped.',
    basis: 'ASHRAE Guideline 36 · terminal thermal comfort SLA',
    steps: [
      { order: 1, action: 'Confirm the trip on the AHU faceplate and note the zone affected', role: 'LBMS Operator', minutes: 2, evidence: 'AHU parameter snapshot' },
      { order: 2, action: 'Check whether a standby AHU is healthy and in auto; change over if so', role: 'LBMS Operator', minutes: 4, after: [1], evidence: 'Changeover confirmation' },
      { order: 3, action: 'Monitor zone temperature and CO2 for the next 20 minutes', role: 'LBMS Operator', minutes: 20, after: [2], evidence: 'Trend chart' },
      { order: 4, action: 'Raise a work order against the tripped unit for filter, belt and VSD inspection', role: 'LBMS Operator', minutes: 4, after: [1] },
      { order: 5, action: 'Escalate to the duty engineer if zone temperature exceeds the SLA band', role: 'Maintenance Lead', minutes: 5, after: [3] },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: true,
    successRate: 94,
    runsThisMonth: 6,
  },
  {
    id: 'SOP-SACS-01',
    name: 'Access control door or reader offline',
    subsystem: 'SACS',
    category: 'Security',
    priority: 'HIGH',
    trigger: 'A controlled door or card reader stops responding on the security network',
    keywords: ['door', 'reader', 'access', 'gate', 'offline', 'sacs', 'badge', 'controller'],
    aiSummary:
      'A controlled door has dropped off the network, so it is no longer being monitored. Post a guard on it while it is down — an unmonitored door in a restricted area is a security breach, not a maintenance issue.',
    basis: 'ICAO Annex 17 · airport security programme',
    steps: [
      { order: 1, action: 'Confirm the door state and whether it is fail-secure or fail-open', role: 'Security Operator', minutes: 2, evidence: 'Door status record' },
      { order: 2, action: 'Post a guard at the door if it serves a restricted area', role: 'Security Supervisor', minutes: 6, after: [1], evidence: 'Guard posting log' },
      { order: 3, action: 'Check the controller and network segment for a wider outage', role: 'Security Operator', minutes: 5, after: [1] },
      { order: 4, action: 'Raise a work order and restore the reader', role: 'Maintenance Lead', minutes: 20, after: [3], evidence: 'Reader test record' },
      { order: 5, action: 'Stand the guard down once the door reports online and a test badge passes', role: 'Security Supervisor', minutes: 3, after: [4] },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: false,
    successRate: 97,
    runsThisMonth: 4,
  },
  {
    id: 'SOP-VDGS-01',
    name: 'Visual docking guidance fault on an occupied stand',
    subsystem: 'VDGS',
    category: 'Apron',
    priority: 'HIGH',
    trigger: 'Safedock unit reports a fault or display failure while a stand is allocated',
    keywords: ['vdgs', 'docking', 'safedock', 'stand', 'display', 'brightness', 'apron'],
    aiSummary:
      'The docking guidance display on this stand has failed, so an arriving aircraft has nothing to fly to. Either put a marshaller on the stand or move the arrival to another one before it is on final.',
    basis: 'ADB SAFEGATE Safedock operations manual · apron safety procedure',
    steps: [
      { order: 1, action: 'Confirm the fault and whether an arrival is currently allocated to the stand', role: 'Apron Controller', minutes: 2 },
      { order: 2, action: 'Assign a marshaller to the stand, or reallocate the arrival', role: 'Apron Controller', minutes: 5, after: [1], evidence: 'Stand allocation change' },
      { order: 3, action: 'Set the stand to manual docking in the apron management system', role: 'Apron Controller', minutes: 2, after: [2] },
      { order: 4, action: 'Raise a work order against the Safedock unit', role: 'Maintenance Lead', minutes: 15, after: [1], evidence: 'Unit test record' },
      { order: 5, action: 'Return the stand to automatic docking after a successful self-test', role: 'Apron Controller', minutes: 3, after: [4] },
    ],
    autoIncident: false,
    autoAssign: true,
    autoClose: true,
    successRate: 95,
    runsThisMonth: 2,
  },
  {
    id: 'SOP-FAS-01',
    name: 'Fire detection zone fault or false trigger',
    subsystem: 'FAS',
    category: 'Life safety',
    priority: 'CRITICAL',
    trigger: 'A detection zone reports a fault, or a beam detector triggers without corroboration',
    keywords: ['fire', 'fas', 'beam', 'detector', 'smoke', 'alarm', 'zone'],
    aiSummary:
      'A fire detection zone is not reporting correctly. Treat it as a real detection until somebody has physically confirmed otherwise — a zone in fault is a zone that is not protecting anyone.',
    basis: 'NFPA 72 · airport fire safety plan',
    steps: [
      { order: 1, action: 'Verify against adjacent detectors and the nearest camera', role: 'Security Operator', minutes: 2, evidence: 'Camera still' },
      { order: 2, action: 'Dispatch the fire response team to the zone', role: 'Fire Officer', minutes: 5, after: [1], evidence: 'Attendance log' },
      { order: 3, action: 'Hold evacuation pending physical confirmation', role: 'Duty Manager', minutes: 3, after: [1] },
      { order: 4, action: 'If confirmed false, isolate the device and raise a work order', role: 'Maintenance Lead', minutes: 12, after: [2], evidence: 'Isolation record' },
      { order: 5, action: 'Restore the zone and log the event in the fire register', role: 'Fire Officer', minutes: 6, after: [4] },
    ],
    autoIncident: true,
    autoAssign: true,
    autoClose: false,
    successRate: 99,
    runsThisMonth: 1,
  },
  {
    id: 'SOP-GEN-01',
    name: 'General equipment fault — triage and escalate',
    subsystem: 'ALL',
    category: 'Fallback',
    priority: 'MEDIUM',
    trigger: 'Any alarm with no more specific procedure assigned',
    keywords: [],
    aiSummary:
      'There is no specific procedure for this alarm yet, so it follows the general one: confirm it is real, give it an owner, and raise a work order so it cannot be forgotten.',
    basis: 'EEMUA 191 alarm management',
    steps: [
      { order: 1, action: 'Acknowledge the alarm and confirm it is not chattering', role: 'Duty Operator', minutes: 2 },
      { order: 2, action: 'Check the asset record and recent history for the same fault', role: 'Duty Operator', minutes: 4, after: [1] },
      { order: 3, action: 'Assign an owner and raise a work order', role: 'Duty Operator', minutes: 3, after: [2], evidence: 'Work order reference' },
      { order: 4, action: 'Escalate to the duty engineer if unresolved within the SLA', role: 'Maintenance Lead', minutes: 5, after: [3] },
    ],
    autoIncident: false,
    autoAssign: false,
    autoClose: false,
    successRate: 88,
    runsThisMonth: 19,
  },
];

export const sopById = (id: string) => SOPS.find((s) => s.id === id);

/**
 * Best procedure for an alarm.
 *
 * Scores keyword hits, with a bonus for a subsystem match so a "fault" on BHS
 * does not pick up the HVAC procedure. Falls back to the general SOP rather
 * than to nothing.
 */
export function sopForAlert(text: string, subsystem?: string): Sop {
  const hay = `${text} ${subsystem ?? ''}`.toLowerCase();
  let best: Sop | null = null;
  let bestScore = 0;

  for (const sop of SOPS) {
    if (sop.keywords.length === 0) continue;
    let score = sop.keywords.reduce((n, k) => (hay.includes(k) ? n + 2 : n), 0);
    if (subsystem && sop.subsystem === subsystem) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = sop;
    }
  }

  return bestScore >= 2 && best ? best : SOPS[SOPS.length - 1];
}
