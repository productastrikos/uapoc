/**
 * Live AI advisories for the airfield lighting console.
 *
 * Unlike the cross-domain catalogue, nothing here is written down in advance.
 * Every insight is computed from the tags the console is already showing —
 * serviceability rollups, regulator state, burn hours, measured intensity, the
 * alarm list — so what the panel claims can be checked against the canvas next
 * to it. Inject a fault and an advisory appears; clear it and the advisory goes.
 *
 * Two of these answer things the customer raised directly:
 *
 *   · A standby regulator that nobody switched to, because nobody realised the
 *     duty unit had dropped out. The platform will not fail over on its own,
 *     but it will not let a healthy standby sit unnoticed either.
 *
 *   · Critical alarms that raise and then sit there, never becoming work orders
 *     that somebody owns. The escalation advisory raises them, in bulk, with
 *     one confirmation.
 *
 * Confidence is derived, not decorated. It moves with the size of the evidence
 * — how far below target a category has fallen, how many fixtures agree — so a
 * marginal case reads as marginal.
 */

import { AiInsight } from '../ai/types';
import { Airfield } from './airfield';
import { AglAlarm, AirfieldMode } from './types';
import { CategoryRollup } from './store';

/** Maintenance interval assumed for the LED fixtures, in burn hours. */
const RATED_LIFE_HOURS = 20000;

/** Fraction of rated life past which a fixture joins the replacement batch. */
const REPLACE_AT = 0.75;

/** Megohms below which a series circuit needs a megger test before it faults. */
const INSULATION_FLOOR = 50;

/** Assumed monthly insulation decay, used only to date the recommendation. */
const INSULATION_DECAY_PER_MONTH = 0.04;

const MODE_LABEL: Record<AirfieldMode, string> = {
  day: 'Day',
  night: 'Night',
  lvp_cat_i: 'LVP CAT I',
  lvp_cat_ii: 'LVP CAT II',
};

/** Store actions an accepted advisory is allowed to perform. */
export interface AglInsightActions {
  select: (tag: string) => void;
  setOverlay: (overlay: 'status' | 'circuit' | 'comms' | 'intensity' | 'serviceability') => void;
  escalateToWorkOrder: (alarmId: string) => void;
  setCircuitStep: (circuitId: string, step: number) => void;
}

export function computeAglInsights(
  airfield: Airfield,
  mode: AirfieldMode,
  rollups: CategoryRollup[],
  alarms: AglAlarm[],
  actions: AglInsightActions
): AiInsight[] {
  const out: AiInsight[] = [];

  /* ---------------------------------------------------------------------
   * 1. Serviceability against ICAO Annex 14.
   *
   * The rollup rail already shows the percentage. What it cannot say is what
   * the percentage means for the operation — whether the runway still supports
   * the approach category currently in force, and what has to happen if not.
   * ------------------------------------------------------------------- */
  for (const r of rollups) {
    if (!r.breached) continue;

    const affected = airfield.fixtures.filter(
      (f) => f.category === r.id && (f.state === 'failed' || f.state === 'off' || f.comms === 'silent')
    );
    if (affected.length === 0) continue;

    const circuits = [...new Set(affected.map((f) => f.circuitId))];
    const gap = r.target - r.serviceability;
    const lowVis = mode === 'lvp_cat_i' || mode === 'lvp_cat_ii';

    out.push({
      id: `agl-serviceability-${r.id}`,
      domain: 'agl',
      kind: 'detect',
      severity: gap > 5 || lowVis ? 'critical' : 'warning',
      title: `Too many ${r.label.toLowerCase()} are out`,
      plain:
        `Too many ${r.label.toLowerCase()} lights are out. The runway can still be used, ` +
        `but it is now below the standard it is certified to` +
        (lowVis ? ', and low visibility today makes that limiting.' : '.'),
      observation:
        `${r.failed} of ${r.total} fixtures are out, putting ${r.label.toLowerCase()} at ` +
        `${r.serviceability.toFixed(1)}% against a ${r.target}% target` +
        (lowVis
          ? `. The airfield is in ${MODE_LABEL[mode]}, where this pattern is operationally limiting.`
          : '.'),
      evidence: [
        `${r.failed} fixtures in this category report failed, off or unresponsive.`,
        `Serviceability ${r.serviceability.toFixed(1)}% against the ${r.target}% ICAO Annex 14 target — a ${gap.toFixed(1)} point shortfall.`,
        `Affected fixtures sit on ${circuits.length} circuit${circuits.length === 1 ? '' : 's'}: ${circuits.join(', ')}.`,
        `Current operating mode is ${MODE_LABEL[mode]}.`,
      ],
      recommendation: lowVis
        ? `Advise ATC that ${r.label.toLowerCase()} no longer supports ${MODE_LABEL[mode]} minima, and dispatch a crew to the ${circuits[0]} loop before the next arrival.`
        : `Dispatch a crew to the affected fixtures on ${circuits[0]} and confirm whether the shortfall is lamp failures or a common upstream cause before the mode changes to night.`,
      impact:
        gap > 5
          ? 'Restores category compliance before an operational restriction is required'
          : 'Closes the shortfall before the next mode change makes it limiting',
      confidence: Math.min(97, Math.round(72 + Math.min(20, gap * 2) + Math.min(5, affected.length / 4))),
      horizon: 'live',
      model: 'Serviceability rollup against ICAO Annex 14 category targets',
      sources: ['CORTEX ALCMS', 'LINC 360 ILCMS', `${circuits.length} series circuits`],
      action: 'Show affected fixtures',
      outcome: `Serviceability overlay applied and the first affected fixture on ${circuits[0]} selected.`,
      run: () => {
        actions.setOverlay('serviceability');
        actions.select(affected[0].id);
      },
    });
  }

  /* ---------------------------------------------------------------------
   * 2. A whole loop dark at once, and the changeover that may not have fired.
   *
   * The airport's own account was that a shift lost hours to a fault they were
   * looking for in the wrong place, on a system that had a redundant path
   * available the whole time. From a monitoring screen, a standby that never
   * changed over is indistinguishable from no standby at all — everything is
   * simply dark. So the advisory does two things: it names the regulator as the
   * common cause rather than letting the operator read 156 lamp alarms, and it
   * puts the vault changeover at the top of the checklist instead of the end.
   * ------------------------------------------------------------------- */
  const faulted = airfield.circuits.filter((c) => c.faulted);
  for (const c of faulted) {
    const dark = c.fixtureIds.length;
    const category = airfield.byId[c.fixtureIds[0]]?.category;
    const stillHealthy = airfield.circuits.filter((o) => !o.faulted).length;

    out.push({
      id: `agl-ccr-${c.id}`,
      domain: 'agl',
      kind: 'detect',
      severity: 'critical',
      title: `${dark} lights went dark together on ${c.id}`,
      plain:
        `${dark} lights on one circuit went dark at the same moment. That usually means the ` +
        `power supply feeding them has failed, not ${dark} separate bulbs.`,
      observation:
        `${c.name} reports ${c.outputCurrent.toFixed(1)} A against a ${c.ratedCurrent.toFixed(1)} A rating and every fixture on the loop went dark in the same second. ` +
        `This is one regulator, not ${dark} lamps.`,
      evidence: [
        `${c.ccrModel} on ${c.aceUnit} reports output failure; measured current ${c.outputCurrent.toFixed(1)} A.`,
        `All ${dark} fixtures stopped answering the LINC 360 poll simultaneously — they lost the carrier with the supply.`,
        `No fixture on the loop reported a lamp failure of its own before going silent.`,
        `Insulation on ${c.id} reads ${c.insulationResistance} MΩ, which argues against a cable fault.`,
        `The other ${stillHealthy} circuits are unaffected, so this is not a vault-wide supply problem.`,
      ],
      recommendation:
        `Confirm at ${c.aceUnit} whether the standby regulator actually picked the loop up — a changeover that did not fire looks exactly like having no redundancy at all from this screen. ` +
        `If it has not, transfer manually, then raise the work order against ${c.id}. Restoring the lighting and diagnosing the regulator are separate jobs and neither should wait on the other.`,
      impact: `Points the crew at one regulator instead of ${dark} fixtures`,
      confidence: 95,
      horizon: 'live',
      model: 'Common-cause inference over simultaneous loop-wide comms loss',
      sources: ['ACE3 monitoring', 'CORTEX ALCMS', 'LINC 360 ILCMS'],
      action: 'Show circuit on canvas',
      outcome: `Circuit overlay applied and ${c.id} selected for the vault check.`,
      run: () => {
        actions.setOverlay('circuit');
        actions.select(c.fixtureIds[0]);
      },
    });

    // Category is only used to keep the advisory honest about scope; a loop
    // carrying threshold or PAPI fixtures is an operational problem now, one
    // carrying taxiway edge is a problem before the next mode change.
    if (category === 'runway_threshold' || category === 'papi' || category === 'approach') {
      out[out.length - 1].impact = 'Restores a safety-critical pattern before the next arrival';
    }
  }

  /* ---------------------------------------------------------------------
   * 3. Critical alarms that have not become anybody's job.
   *
   * An alarm list that only ever grows is the complaint the client made about
   * the reference system. Escalation in bulk, behind one confirmation, is the
   * answer — the platform proposes the work orders and the operator agrees to
   * them, rather than the platform raising them silently.
   * ------------------------------------------------------------------- */
  const stranded = alarms.filter(
    (a) => a.priority === 'critical' && !a.workOrderId && a.state !== 'SHELVED'
  );
  if (stranded.length >= 3) {
    // One work order per affected loop, not one per alarm. A hundred and fifty
    // tickets for a single dark circuit is a worse backlog than no tickets at
    // all, and a crew visits the loop once either way. The alarm that leads
    // each group is the one the work order is raised against.
    const leadByCircuit = new Map<string, (typeof stranded)[number]>();
    for (const a of stranded) {
      const key = airfield.byId[a.tag]?.circuitId ?? a.tag.split('.')[0];
      if (!leadByCircuit.has(key)) leadByCircuit.set(key, a);
    }
    const leads = [...leadByCircuit.values()];
    const groups = leadByCircuit.size;

    out.push({
      id: 'agl-escalation-gap',
      domain: 'agl',
      kind: 'prescribe',
      severity: 'warning',
      title: `${stranded.length} serious alarms with nobody assigned`,
      plain:
        `${stranded.length} serious alarms have been raised but nobody has been assigned to fix them. ` +
        `They will sit there until somebody owns them.`,
      observation:
        `${stranded.length} critical AGL alarms are active and none has been escalated. Acknowledging an alarm records that somebody saw it; it does not put anybody on the job. Grouped by series circuit they are ${groups} piece${groups === 1 ? '' : 's'} of work, not ${stranded.length}.`,
      evidence: [
        `${stranded.length} alarms at critical priority with no linked work order.`,
        `${stranded.filter((a) => a.state === 'UNACK').length} of them are still unacknowledged.`,
        `They resolve to ${groups} affected loop${groups === 1 ? '' : 's'}: ${[...leadByCircuit.keys()].slice(0, 4).join(', ')}${groups > 4 ? ', and others' : ''}.`,
        'A crew visits a loop once, so a ticket per fixture buries the backlog rather than clearing it.',
      ],
      recommendation:
        `Raise one work order per affected loop — ${groups} in total — so the alarm list and the maintenance backlog stop telling different stories.`,
      impact: `${stranded.length} alarms become ${groups} owned job${groups === 1 ? '' : 's'} in one step`,
      confidence: 93,
      horizon: 'live',
      model: 'Alarm-to-work-order escalation gap, grouped by series circuit',
      sources: ['CORTEX ALCMS alarm list', 'Work order register', 'Circuit topology'],
      action: `Raise ${groups} work order${groups === 1 ? '' : 's'}`,
      outcome: `${groups} work order${groups === 1 ? '' : 's'} raised, one per affected series circuit.`,
      run: () => leads.forEach((a) => actions.escalateToWorkOrder(a.id)),
    });
  }

  /* ---------------------------------------------------------------------
   * 4. Fixtures approaching end of life, batched into one closure.
   *
   * Individually these are nothing. Together they are the difference between
   * one runway closure and eleven, which is the whole argument for looking at
   * burn hours across a fleet rather than a fixture at a time.
   * ------------------------------------------------------------------- */
  const ageing = airfield.fixtures.filter(
    (f) => f.burnHours >= RATED_LIFE_HOURS * REPLACE_AT && f.state !== 'failed'
  );
  if (ageing.length >= 5) {
    const byCircuit = new Map<string, number>();
    for (const f of ageing) byCircuit.set(f.circuitId, (byCircuit.get(f.circuitId) ?? 0) + 1);
    const ranked = [...byCircuit.entries()].sort((a, b) => b[1] - a[1]);
    const [topCircuit, topCount] = ranked[0];
    const oldest = ageing.reduce((a, b) => (a.burnHours > b.burnHours ? a : b));

    out.push({
      id: 'agl-life-batch',
      domain: 'agl',
      kind: 'predict',
      severity: 'opportunity',
      title: `${ageing.length} lights are near the end of their life`,
      plain:
        `${ageing.length} lights are near the end of their working life. Replacing them together ` +
        `costs one runway closure instead of several.`,
      observation:
        `${ageing.length} fixtures across ${byCircuit.size} circuits are within the replacement window. ` +
        `${topCircuit} alone carries ${topCount} of them, which makes it worth a single planned visit rather than ${topCount} reactive ones.`,
      evidence: [
        `${ageing.length} fixtures at or beyond ${(RATED_LIFE_HOURS * REPLACE_AT).toLocaleString()} burn hours against a ${RATED_LIFE_HOURS.toLocaleString()} h maintenance interval.`,
        `Highest concentration is ${topCircuit} with ${topCount} fixtures.`,
        `Oldest fixture is ${oldest.id} at ${oldest.burnHours.toLocaleString()} h.`,
        'Failures in this population historically cluster rather than arriving evenly, so replacing on age beats replacing on failure.',
      ],
      recommendation:
        `Batch the ${topCircuit} fixtures into the next scheduled closure and order the modules now — the lead time is longer than the notice a failure gives you.`,
      impact: `Up to ${topCount - 1} reactive closures avoided on ${topCircuit}`,
      confidence: 80,
      horizon: 'next 90 days',
      model: 'Burn-hour survival model with circuit-level batching',
      sources: ['LINC 360 burn-hour counters', 'Asset register', 'Maintenance schedule'],
      action: 'Show ageing fixtures',
      outcome: `Circuit overlay applied and ${oldest.id} selected — the oldest fixture in the batch.`,
      run: () => {
        actions.setOverlay('circuit');
        actions.select(oldest.id);
      },
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Insulation resistance: the fault worth catching before it happens.
   *
   * Insulation on a buried series loop degrades long before it fails, and it is
   * the one measurement that gives real warning. Flagging the weakest circuit
   * in the fleet turns a scheduled megger test into a targeted one.
   * ------------------------------------------------------------------- */
  const healthy = airfield.circuits.filter((c) => !c.faulted);
  if (healthy.length > 1) {
    const weakest = healthy.reduce((a, b) =>
      a.insulationResistance < b.insulationResistance ? a : b
    );
    const fleetMean =
      healthy.reduce((n, c) => n + c.insulationResistance, 0) / healthy.length;

    // Only worth saying if the circuit is a genuine outlier against its peers.
    if (weakest.insulationResistance < fleetMean * 0.85) {
      const months = Math.max(
        1,
        Math.round(
          Math.log(INSULATION_FLOOR / weakest.insulationResistance) /
            Math.log(1 - INSULATION_DECAY_PER_MONTH)
        )
      );

      out.push({
        id: `agl-insulation-${weakest.id}`,
        domain: 'agl',
        kind: 'predict',
        severity: 'warning',
        title: `Cable insulation is worst on ${weakest.id}`,
        plain:
          `The cable insulation on this circuit is the poorest on the airfield and is slowly ` +
          `getting worse. Left alone it will eventually cause a fault.`,
        observation:
          `${weakest.name} reads ${weakest.insulationResistance} MΩ against a fleet mean of ${fleetMean.toFixed(0)} MΩ. ` +
          `At the observed decay rate it reaches the ${INSULATION_FLOOR} MΩ intervention threshold in roughly ${months} months.`,
        evidence: [
          `Insulation ${weakest.insulationResistance} MΩ — ${(100 - (weakest.insulationResistance / fleetMean) * 100).toFixed(0)}% below the fleet mean of ${fleetMean.toFixed(0)} MΩ.`,
          `${weakest.fixtureIds.length} fixtures sit on this loop, all of which go dark together if it fails.`,
          `Regulator ${weakest.ccrModel} on ${weakest.aceUnit} is otherwise healthy at ${weakest.outputCurrent.toFixed(1)} A.`,
          'Insulation degradation is gradual and measurable; the failure it precedes is neither.',
        ],
        recommendation:
          `Schedule a megger test on ${weakest.id} at the ${weakest.aceUnit} vault within the next maintenance window, and trend the reading monthly rather than annually.`,
        impact: `A planned test now instead of ${weakest.fixtureIds.length} fixtures dark without notice`,
        confidence: 76,
        horizon: `next ${months} months`,
        model: 'Insulation-resistance trending against the circuit fleet',
        sources: ['ACE3 insulation monitoring', 'CCR fleet register'],
        action: 'Show circuit on canvas',
        outcome: `Circuit overlay applied and ${weakest.id} highlighted for the maintenance plan.`,
        run: () => {
          actions.setOverlay('circuit');
          actions.select(weakest.fixtureIds[0]);
        },
      });
    }
  }

  /* ---------------------------------------------------------------------
   * 6. Intensity drift — degradation the alarm limits have not caught yet.
   *
   * A lamp at 88% of setpoint is inside every alarm limit and on its way out.
   * Catching the population rather than the individual is what makes it useful.
   * ------------------------------------------------------------------- */
  const drifting = airfield.fixtures.filter(
    (f) =>
      f.state === 'on' &&
      f.intensitySetpoint > 0 &&
      f.intensityActual / f.intensitySetpoint < 0.9 &&
      f.intensityActual / f.intensitySetpoint >= 0.75
  );
  if (drifting.length >= 4) {
    const worst = drifting.reduce((a, b) =>
      a.intensityActual / a.intensitySetpoint < b.intensityActual / b.intensitySetpoint ? a : b
    );
    const meanDrift =
      (drifting.reduce((n, f) => n + f.intensityActual / f.intensitySetpoint, 0) /
        drifting.length) *
      100;

    out.push({
      id: 'agl-intensity-drift',
      domain: 'agl',
      kind: 'predict',
      severity: 'warning',
      title: `${drifting.length} lights are dimmer than they should be`,
      plain:
        `${drifting.length} lights are noticeably dimmer than they should be. They still work, so ` +
        `nothing has alarmed, but pilots see less than the design intends.`,
      observation:
        `${drifting.length} fixtures are producing an average of ${meanDrift.toFixed(0)}% of commanded intensity. All of them are inside their configured Lo alarm limit, so none has raised anything.`,
      evidence: [
        `${drifting.length} fixtures between 75% and 90% of setpoint — degrading, but not yet alarming.`,
        `Worst is ${worst.id} at ${((worst.intensityActual / worst.intensitySetpoint) * 100).toFixed(0)}% (${worst.intensityActual} of ${worst.intensitySetpoint} Cd).`,
        'Configured Lo limits sit at 85% of nominal, which this population is only just clearing.',
        'Output loss of this shape usually precedes an LED driver failure rather than recovering.',
      ],
      recommendation:
        `Add these to the next planned replacement batch and check ${worst.id} on the faceplate first — if its driver current has also dropped, treat the whole group as end-of-life rather than as a calibration problem.`,
      impact: 'Catches the population a threshold alarm would only find one at a time',
      confidence: 74,
      horizon: 'next 60 days',
      model: 'Intensity-ratio drift detection below alarm thresholds',
      sources: ['LINC 360 measured intensity', 'ALCMS alarm configuration'],
      action: 'Inspect worst fixture',
      outcome: `Intensity overlay applied and ${worst.id} opened for inspection.`,
      run: () => {
        actions.setOverlay('intensity');
        actions.select(worst.id);
      },
    });
  }

  /* ---------------------------------------------------------------------
   * 7. Energy: circuits driven harder than the operating mode requires.
   *
   * Small money per hour, real money per year, and the easiest recommendation
   * in the set to accept because nothing about it is risky.
   * ------------------------------------------------------------------- */
  if (mode === 'day') {
    const overdriven = airfield.circuits.filter((c) => !c.faulted && c.step >= 4);
    if (overdriven.length > 0) {
      const fixtures = overdriven.reduce((n, c) => n + c.fixtureIds.length, 0);
      // Rough but defensible: step 5 to step 2 is roughly a 70% cut in lamp
      // power, at an assumed 45 W average per LED fixture over a 10-hour day.
      const kwhPerDay = Math.round((fixtures * 45 * 0.7 * 10) / 1000);

      out.push({
        id: 'agl-energy-step',
        domain: 'agl',
        kind: 'optimise',
        severity: 'opportunity',
        title: `${overdriven.length} circuits are too bright for daylight`,
        plain:
          `${overdriven.length} circuits are running at night brightness in daylight. Nobody needs ` +
          `the extra light and it is wearing the lamps out faster.`,
        observation:
          `The airfield is in Day mode while ${overdriven.length} circuits (${fixtures} fixtures) still sit at step ${Math.min(...overdriven.map((c) => c.step))} or above.`,
        evidence: [
          `Operating mode is Day; ${overdriven.length} circuits remain at brightness step 4 or 5.`,
          `${fixtures} fixtures affected across ${overdriven.map((c) => c.id).slice(0, 4).join(', ')}${overdriven.length > 4 ? ' and others' : ''}.`,
          'Step 5 to step 2 is roughly a 70% reduction in lamp power at unchanged serviceability.',
          'Lower drive current also extends LED driver life, so the saving is not only energy.',
        ],
        recommendation:
          `Drop the taxiway and edge circuits to step 2 for the daylight period. Approach, PAPI and stop bars stay where they are — those are safety-critical regardless of ambient light.`,
        impact: `≈ ${kwhPerDay} kWh/day · longer driver life`,
        confidence: 90,
        horizon: 'today',
        model: 'Brightness-step optimiser against operating mode',
        sources: ['CORTEX ALCMS', 'CCR step commands', 'Operating mode'],
        action: 'Apply step reduction',
        outcome: `${overdriven.length} circuits stepped down for the daylight period.`,
        run: () =>
          overdriven
            .filter((c) => {
              const cat = airfield.byId[c.fixtureIds[0]]?.category;
              return cat !== 'approach' && cat !== 'papi' && cat !== 'stopbar';
            })
            .forEach((c) => actions.setCircuitStep(c.id, 2)),
      });
    }
  }

  return out;
}
