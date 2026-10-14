/**
 * The AI recommendation catalogue.
 *
 * Every insight here is modelled on something actually shipping in airport
 * operations rather than on generative-AI marketing — the distinction the
 * market research draws sharply, and the one the customer will probe first.
 * Queue forecasting is Veovo/Xovis-class flow management; bag-risk scoring is
 * SITA BagJourney against IATA Resolution 753; the digital-twin what-ifs are
 * the GMR Hyderabad / YVR APOC pattern; alarm rationalisation is EEMUA 191 and
 * ISA-18.2 applied to an OT alarm list.
 *
 * Several entries answer complaints raised directly in the AVEVA review: alarms
 * that raise but never escalate into a work order, a redundant unit nobody
 * switched to because nobody realised they needed to, and whether the platform
 * can say anything useful about an insider or a compromised OT credential.
 *
 * Deliberately static. Live, state-derived advisories belong to their own
 * console (see `src/agl/insights.ts`); mixing the two here would make it
 * impossible to tell which is which.
 */

import { AiDomain, AiInsight } from './types';

export const AI_CATALOGUE: AiInsight[] = [
  /* ------------------------------------------------------------------ AOCC */
  {
    id: 'aocc-wx-cascade',
    domain: 'aocc',
    kind: 'predict',
    severity: 'critical',
    title: 'Convective weather will cascade into stand contention',
    observation:
      'A thunderstorm cell tracking north-east reaches the aerodrome at 16:25. Six arrivals inside the window will hold, and three stands free up later than the departures rostered onto them.',
    evidence: [
      'METAR/TAF trend plus 10-minute radar echo-top motion vectors put cell arrival at 16:25 ±8 min.',
      'Six inbounds inside the affected sector already carry 4–11 min of airborne delay.',
      'Stands A3, A5 and B2 have a departure rostered within 20 min of a delayed arrival off-block.',
      'The same pattern on 14 Jul and 02 Aug produced 45 min of knock-on departure delay.',
    ],
    recommendation:
      'Pre-emptively re-sequence the three conflicting turnarounds onto B4/B6 and push the affected departures by 25 minutes now, while the slots are still tradeable.',
    impact: 'Avoids ~45 min of cascading departure delay and two stand-hold events',
    confidence: 84,
    horizon: 'next 90 min',
    model: 'Gradient-boosted delay-propagation model over AODB + MET feed',
    sources: ['AODB', 'MET / radar', 'A-SMGCS', 'Stand allocation'],
    action: 'Apply re-sequence plan',
    outcome: 'Re-sequence plan pushed to stand allocation and the departure sequencer.',
  },
  {
    id: 'aocc-twin-whatif',
    domain: 'aocc',
    kind: 'prescribe',
    severity: 'warning',
    title: 'Digital twin: runway configuration change pays for itself',
    observation:
      'Simulating the next four hours on the twin, a 09/27 configuration change at 15:00 clears the afternoon bank 18% faster than holding the current configuration.',
    evidence: [
      'Twin replayed the published schedule against live winds at 2,000 runs per configuration.',
      'Current configuration produces a 22-minute median taxi-out in the 16:00–18:00 bank.',
      'Switching adds a one-off 9-minute changeover cost, recovered by the third movement.',
      'Crosswind component stays inside limits across the whole simulated window.',
    ],
    recommendation:
      'Coordinate the configuration change with ATC for 15:00 and notify ground handling of the revised taxi routes.',
    impact: '18% faster bank clearance · ~1,240 kg fuel burn avoided',
    confidence: 79,
    horizon: 'next 4 h',
    model: 'Monte-Carlo digital-twin simulation (2,000 runs per configuration)',
    sources: ['Digital twin', 'ATC', 'MET', 'AODB'],
    action: 'Run full simulation',
    outcome: 'Configuration change simulated and staged for ATC coordination.',
  },
  {
    id: 'aocc-alarm-flood',
    domain: 'aocc',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Alarm flood: 212 alarms collapse to 9 root causes',
    observation:
      'The last 24 hours produced 212 OT alarms across 30 subsystems. Correlated by asset topology and time they resolve to 9 independent root causes; the rest are consequences.',
    evidence: [
      'EEMUA 191 targets fewer than 6 alarms per operator per hour in steady state; the current rate is 8.8.',
      '148 of the 212 alarms arrived within 90 s of a parent alarm on the same electrical or air-side branch.',
      'A chattering AHU-04-B2 supply-temperature alarm alone accounts for 31 entries.',
      'No alarm in the correlated set was acknowledged separately by an operator.',
    ],
    recommendation:
      'Enable correlated alarm grouping and apply a 60-second on-delay to the three chattering tags. Operators keep every alarm in the historian; only the presentation collapses.',
    impact: 'Operator alarm load −74% · faster root-cause identification',
    confidence: 91,
    horizon: 'continuous',
    model: 'Topology-aware alarm correlation (ISA-18.2 rationalisation)',
    sources: ['SCADA historian', 'Asset topology', 'Alarm & event log'],
    action: 'Enable alarm grouping',
    outcome: 'Correlated alarm grouping enabled. The historian retains every raw event.',
  },
  {
    id: 'aocc-acdm-tobt',
    domain: 'aocc',
    kind: 'predict',
    severity: 'warning',
    title: 'A-CDM readiness: three turnarounds will miss their TOBT',
    observation:
      'Modelled against live ground-handling progress, VN1546, VJ322 and QH1102 will not make their target off-block times. Two of the three are recoverable if resource moves now.',
    evidence: [
      'Fuelling on VN1546 started 11 min late; historic recovery from this point is 18%.',
      'Baggage make-up for VJ322 is one cart short with 22 min to off-block.',
      'The QH1102 cleaning crew is still committed to the previous turnaround.',
      'Model trained on 14 months of milestone timestamps from this stand group.',
    ],
    recommendation:
      'Re-assign the spare cleaning crew to QH1102 and release a second baggage cart to VJ322. Publish a revised TOBT for VN1546 rather than chasing it.',
    impact: '2 of 3 turnarounds recovered · protects the departure sequence',
    confidence: 82,
    horizon: 'next 45 min',
    model: 'Turnaround milestone survival model (A-CDM TOBT predictor)',
    sources: ['AODB', 'Ground handling', 'Stand systems', 'Fuel farm'],
    action: 'Re-allocate resource',
    outcome: 'Resource re-allocation dispatched to ground handling.',
  },

  /* --------------------------------------------------------------- Airside */
  {
    id: 'airside-taxi-route',
    domain: 'airside',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Hold-short conflict predicted at TWY B/C',
    observation:
      'Two departures and one arrival converge on the B/C intersection inside the same 90-second window. Routing the arrival via TWY D removes the conflict without lengthening its taxi.',
    evidence: [
      'A-SMGCS tracks put all three targets at the intersection between 14:32:10 and 14:33:40.',
      'TWY D adds 60 m of taxi distance but no additional hold.',
      'The same intersection generated 4 hold-short events in the last 7 days.',
    ],
    recommendation:
      'Issue the arrival a TWY D routing and set the Follow-the-Greens sequence to match.',
    impact: 'Removes one hold-short event · ~2 min taxi time saved',
    confidence: 88,
    horizon: 'next 15 min',
    model: 'Surface conflict detection over A-SMGCS track fusion',
    sources: ['A-SMGCS', 'AGL Follow-the-Greens', 'ATC'],
    action: 'Apply routing',
    outcome: 'Alternative routing staged and the Follow-the-Greens sequence updated.',
  },
  {
    id: 'airside-fod-risk',
    domain: 'airside',
    kind: 'predict',
    severity: 'warning',
    title: 'Runway inspection due earlier than scheduled',
    observation:
      'FOD risk on RWY 09/27 is elevated. Movement count since the last inspection, recent wind and two engine-change events on stand put the next inspection ahead of its rostered slot.',
    evidence: [
      '182 movements since the last recorded inspection against a 150-movement trigger.',
      'Sustained crosswind above 12 kt for 6 h moves debris off the shoulders onto the surface.',
      'Two engine changes on the north apron in the last 48 h.',
      'The wildlife log shows increased bird activity at dusk this week.',
    ],
    recommendation:
      'Bring the runway inspection forward into the 13:40–13:55 traffic gap rather than waiting for the 18:00 slot.',
    impact: 'Uses an existing traffic gap · avoids an unscheduled closure',
    confidence: 76,
    horizon: 'next 6 h',
    model: 'FOD-risk index (movement count × wind × works activity)',
    sources: ['A-SMGCS', 'MET', 'Works permits', 'Wildlife log'],
    action: 'Reschedule inspection',
    outcome: 'Runway inspection moved into the 13:40 traffic gap.',
  },
  {
    id: 'airside-power-peak',
    domain: 'airside',
    kind: 'predict',
    severity: 'opportunity',
    title: 'Ground-power demand peak forecast on the north apron',
    observation:
      'Four wide-body turnarounds overlap between 17:10 and 17:50, taking apron GPU/PCA demand to 94% of the substation feeder rating.',
    evidence: [
      'Scheduled overlap of four wide-bodies on stands A1, A3, A5 and B2.',
      'Feeder loading last reached 91% on 22 Aug with the same stand pattern.',
      'Ambient temperature forecast of 33 °C drives PCA duty toward its maximum.',
    ],
    recommendation:
      'Stagger PCA start-up across the four stands by 6 minutes each, or move one turnaround to B6 which sits on the second feeder.',
    impact: 'Keeps feeder loading below 85% · avoids a demand-charge peak',
    confidence: 87,
    horizon: 'next 3 h',
    model: 'Apron electrical demand forecast (stand schedule × ambient load curve)',
    sources: ['Stand allocation', 'Substation SCADA', 'MET'],
    action: 'Stagger PCA start',
    outcome: 'Staggered PCA start-up sequence applied to the north apron.',
  },

  /* ------------------------------------------------------------------ Apron */
  {
    id: 'apron-docking-anomaly',
    domain: 'apron',
    kind: 'detect',
    severity: 'warning',
    title: 'Docking approach speed above the learned profile on Stand 3',
    observation:
      'The current approach on Stand 3 is running 0.4 m/s faster than the learned profile for this aircraft type at this closing distance.',
    evidence: [
      'Safedock azimuth and closing-rate telemetry compared against 600 prior A321 dockings on this stand.',
      'Closing rate at 12 m is 1.4 m/s; the learned mean is 1.0 m/s.',
      'Two of the three fastest historical approaches on this stand ended in a stop command.',
    ],
    recommendation:
      'Display SLOW on the VDGS now rather than waiting for the fixed-distance trigger, and notify the marshaller.',
    impact: 'Reduces the chance of an aborted docking and a blocked stand',
    confidence: 81,
    horizon: 'live',
    model: 'Per-stand approach-profile anomaly detection',
    sources: ['ADB SAFEGATE Safedock VDGS', 'Stand sensors'],
    action: 'Send SLOW to VDGS',
    outcome: 'SLOW advisory pushed to the Stand 3 Safedock display.',
  },
  {
    id: 'apron-pbb-risk',
    domain: 'apron',
    kind: 'predict',
    severity: 'critical',
    title: 'PBB fault will hold Stand 5 beyond its next allocation',
    observation:
      'The Stand 5 passenger boarding bridge is drawing 18% more current on its lift motor than its own 30-day baseline. Time to failure is short enough to matter for the 16:40 allocation.',
    evidence: [
      'Lift-motor current trending up over 11 days with no change in cycle count.',
      'Drive temperature 6 °C above the fleet median for the same duty.',
      'Two comparable bridges in the fleet failed within 9 days of crossing this threshold.',
    ],
    recommendation:
      'Raise a work order for the bridge lift drive tonight and move the 16:40 allocation to Stand 6 as a precaution.',
    impact: 'Avoids a stand-out and a bussed disembarkation for ~180 passengers',
    confidence: 78,
    horizon: 'next 7 days',
    model: 'Motor-current signature analysis with fleet-relative baselining',
    sources: ['PBB drive telemetry', 'Stand allocation', 'CMMS'],
    action: 'Raise work order',
    outcome: 'Work order raised against the Stand 5 PBB lift drive.',
  },
  {
    id: 'apron-gse-position',
    domain: 'apron',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Ground support equipment staged against the wrong bank',
    observation:
      'GSE is pooled on the south apron while the next two hours of arrivals are weighted 70% to the north stands.',
    evidence: [
      'The 16:00–18:00 arrival schedule places 7 of 10 turnarounds on A-series stands.',
      'Current GSE positions average 480 m from those stands.',
      'Median first-response time for belt loaders was 6.2 min yesterday against a 4.0 min target.',
    ],
    recommendation:
      'Re-stage two belt loaders and one GPU to the north pool before 15:45.',
    impact: 'First-response back under target · ~2 min saved per turnaround',
    confidence: 85,
    horizon: 'next 2 h',
    model: 'GSE positioning optimiser over forecast stand demand',
    sources: ['GSE telematics', 'AODB', 'Stand allocation'],
    action: 'Issue re-staging plan',
    outcome: 'Re-staging plan sent to the GSE dispatcher.',
  },

  /* --------------------------------------------------------------- Terminal */
  {
    id: 'terminal-queue-forecast',
    domain: 'terminal',
    kind: 'predict',
    severity: 'critical',
    title: 'Security queue will breach the 15-minute SLA at 17:20',
    observation:
      'Three departures inside a 25-minute window push central search demand to 1,180 passengers per hour against a staffed capacity of 940. The breach starts at 17:20 and lasts about 35 minutes.',
    evidence: [
      'Xovis sensor counts plus check-in throughput give a 40-minute lead on arrivals at the search entrance.',
      'Show-up curves for the three flights overlap between T-120 and T-75.',
      'Only 4 of 7 lanes are rostered open for the window.',
      'Model error on this checkpoint over the last 30 days is ±6% at a 40-minute horizon.',
    ],
    recommendation:
      'Open lanes 5 and 6 from 17:05 and hold them until 18:05. Opening late costs roughly four minutes of recovery for every minute of delay.',
    impact: 'Peak queue 24 min → 11 min · SLA held',
    confidence: 89,
    horizon: 'next 40 min',
    model: 'Passenger show-up curve forecast (Veovo-class flow management)',
    sources: ['Xovis / Veovo sensors', 'DCS check-in', 'Roster', 'AODB'],
    action: 'Open lanes 5 & 6',
    outcome: 'Lane opening plan sent to the security duty manager for 17:05.',
  },
  {
    id: 'terminal-bag-risk',
    domain: 'terminal',
    kind: 'predict',
    severity: 'warning',
    title: '14 bags at risk of missing their connection',
    observation:
      'Fourteen transfer bags off VN213 are scored high-risk against their onward departures. Nine are recoverable if pulled to the priority chute now.',
    evidence: [
      'IATA Resolution 753 tracking points show the bags still at transfer-in with 38 min to gate close.',
      'Current sortation queue depth adds an estimated 11 min.',
      'Historic mishandle rate for this connection pair at this queue depth is 41%.',
    ],
    recommendation:
      'Flag the nine recoverable bags to the priority chute and notify the handling agent about the remaining five before those passengers land.',
    impact: '9 mishandles avoided · ~$1,150 of Res 753 claim exposure',
    confidence: 83,
    horizon: 'next 40 min',
    model: 'Bag-connection risk scoring (SITA BagJourney pattern)',
    sources: ['BHS sortation', 'IATA Res 753 tracking', 'DCS', 'AODB'],
    action: 'Prioritise 9 bags',
    outcome: 'Nine bags flagged to the priority chute; handling agent notified.',
  },
  {
    id: 'terminal-bhs-jam',
    domain: 'terminal',
    kind: 'detect',
    severity: 'critical',
    title: 'Conveyor jam on BHS line 2 — escalated automatically',
    observation:
      'Photo-eye dwell on carousel CV-207 has exceeded its threshold for 40 seconds with the drive still commanded. This is a jam, not a gap in the bag flow.',
    evidence: [
      'Downstream photo-eye count fell to zero while upstream induction continued.',
      'Drive current steady at 82% — the belt is loaded and stalled, not empty.',
      'Two comparable events this month each cost 18 minutes before manual escalation.',
    ],
    recommendation:
      'Stop the line, dispatch the BHS technician and hold induction upstream. A work order is raised and assigned rather than left as an alarm nobody owns.',
    impact: 'Escalation in seconds rather than the 18-minute manual average',
    confidence: 94,
    horizon: 'live',
    model: 'Conveyor stall detection (photo-eye dwell × drive current)',
    sources: ['BHS PLC', 'SCADA', 'CMMS work orders'],
    action: 'Escalate to work order',
    outcome: 'Line 2 stopped, technician dispatched and work order WO26-1487 raised.',
  },
  {
    id: 'terminal-gate-change',
    domain: 'terminal',
    kind: 'prescribe',
    severity: 'warning',
    title: 'Proposed gate change would strand PRM passengers',
    observation:
      'Moving VJ145 from Gate 4 to Gate 11 puts three booked wheelchair passengers 340 m further from their gate with 22 minutes to boarding.',
    evidence: [
      'Three PRM bookings against this flight in the assistance system.',
      'Assistance staffing at the far pier is one agent below roster for the window.',
      'Median PRM transfer time over that distance is 14 min, leaving no buffer.',
    ],
    recommendation:
      'Either hold the gate, or dispatch assistance now and delay boarding by 8 minutes. Notify the three passengers in-app before the board changes.',
    impact: 'Avoids 3 missed boardings and a PRM service complaint',
    confidence: 90,
    horizon: 'next 25 min',
    model: 'PRM impact assessment on gate reallocation',
    sources: ['Assistance booking', 'AODB', 'Gate allocation', 'Passenger app'],
    action: 'Dispatch assistance',
    outcome: 'Assistance dispatched and the three passengers notified in-app.',
  },

  /* -------------------------------------------------------------------- BMS */
  {
    id: 'bms-filter-loading',
    domain: 'bms',
    kind: 'predict',
    severity: 'warning',
    title: 'AHU-03-L1 filter loading will trip its differential switch',
    observation:
      'Filter differential pressure on AHU-03-L1 is rising twice as fast as the fleet median for the same run hours. It reaches the trip point in roughly nine days.',
    evidence: [
      'ΔP up 41 Pa over 14 days; the fleet median for equivalent hours is 19 Pa.',
      'Supply fan speed has crept up 7% to hold setpoint — the fan is compensating.',
      'The outside-air damper has sat at 100% since the 12 Aug schedule change.',
    ],
    recommendation:
      'Schedule a filter change inside the next maintenance window and review the outside-air schedule that is loading the filter early.',
    impact: 'Avoids an unplanned trip · ~1,800 kWh of avoidable fan energy',
    confidence: 86,
    horizon: 'next 9 days',
    model: 'Filter-loading regression with fleet-relative baselining',
    sources: ['LBMS / SCADA', 'AHU telemetry', 'CMMS'],
    action: 'Schedule filter change',
    outcome: 'Filter change scheduled and the outside-air schedule flagged for review.',
  },
  {
    id: 'bms-setpoint-optimise',
    domain: 'bms',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Chilled-water setpoint can rise 1.5 °C without comfort loss',
    observation:
      'Zone temperatures across the terminal hold 1.1 °C below setpoint on average while the chillers run at part load. The plant is over-cooling.',
    evidence: [
      'Zone deviation from setpoint negative in 26 of 32 zones for 6 consecutive days.',
      'No comfort complaints logged against any of those zones this month.',
      'Occupancy sensing shows the terminal at 63% of design load for the period.',
      'Chiller COP improves roughly 3% per °C of raised chilled-water setpoint.',
    ],
    recommendation:
      'Raise the chilled-water setpoint from 6.5 °C to 8.0 °C in 0.5 °C steps over three days, watching zone deviation after each step.',
    impact: '~4.5% chiller energy · ≈ 38 tCO₂e per year',
    confidence: 88,
    horizon: 'next 3 days',
    model: 'Chiller plant optimiser (load × COP curve × zone deviation)',
    sources: ['LBMS', 'Chiller plant', 'Zone sensors', 'Occupancy counting'],
    action: 'Stage setpoint change',
    outcome: 'Staged setpoint change loaded; the first step applies at 02:00.',
  },
  {
    id: 'bms-redundancy',
    domain: 'bms',
    kind: 'detect',
    severity: 'critical',
    title: 'Standby pump available but never called — duty unit in alarm',
    observation:
      'Chilled-water pump CHWP-02 has been in fault for 46 minutes. Its standby, CHWP-03, is healthy, in auto, and has not been called.',
    evidence: [
      'CHWP-02 drive fault active since 13:14 with no operator acknowledgement.',
      'CHWP-03 reports healthy, auto mode, 0 run hours today.',
      'Header differential pressure has fallen 18% since the fault.',
      'Changeover logic requires a manual confirm that has not been given.',
    ],
    recommendation:
      'Confirm the changeover to CHWP-03 now, then raise the work order against CHWP-02. The platform will not fail over on its own, but it will not let a healthy standby sit unnoticed either.',
    impact: 'Recovers header pressure in minutes rather than hours',
    confidence: 96,
    horizon: 'live',
    model: 'Redundancy-availability watchdog across duty/standby pairs',
    sources: ['LBMS', 'Pump VFDs', 'Alarm & event log'],
    action: 'Confirm changeover',
    outcome: 'Changeover to CHWP-03 confirmed; work order raised against CHWP-02.',
  },

  /* --------------------------------------------------------------- Landside */
  {
    id: 'landside-kerb-congestion',
    domain: 'landside',
    kind: 'predict',
    severity: 'warning',
    title: 'Kerbside saturates 20 minutes before the arrivals bank',
    observation:
      'Meeter-greeter traffic tracks arrivals with a 20-minute lead. Three wide-body arrivals between 18:05 and 18:35 take departures kerb occupancy past 100%.',
    evidence: [
      'ANPR counts at the access road are already 14% above the same weekday profile.',
      'Forecast dwell of 4.1 min per vehicle against a 3.2 min design assumption.',
      'The short-stay car park is at 88% — overflow will spill to the kerb.',
    ],
    recommendation:
      'Open the overflow kerb lane at 17:45 and push a free-15-minute short-stay offer into the passenger app to pull meeters off the kerb.',
    impact: 'Kerb occupancy peak 104% → 86% · no marshal escalation',
    confidence: 82,
    horizon: 'next 60 min',
    model: 'Kerb demand forecast from arrivals bank + ANPR lead indicator',
    sources: ['ANPR', 'Car park PARCS', 'AODB', 'Passenger app'],
    action: 'Open overflow lane',
    outcome: 'Overflow lane opened and the short-stay offer pushed to the app.',
  },
  {
    id: 'landside-parking-yield',
    domain: 'landside',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Long-stay parking under-priced for next weekend',
    observation:
      'Forward bookings for the coming weekend run 22% ahead of the same weekend last year while the tariff has not moved. Long-stay sells out by Friday at the current price.',
    evidence: [
      'Booking pace 22% ahead year-on-year and 31% ahead of the 8-week trailing mean.',
      'Two charter departures added to Saturday since the tariff was set.',
      'Price elasticity on this product measured at −0.6 over the last 12 months.',
    ],
    recommendation:
      'Raise the long-stay pre-book tariff 8% for Friday to Sunday and hold 40 bays back for walk-up at the premium rate.',
    impact: '≈ $11.4K incremental weekend revenue at unchanged occupancy',
    confidence: 80,
    horizon: 'next 7 days',
    model: 'Dynamic parking yield model (booking pace × measured elasticity)',
    sources: ['PARCS bookings', 'AODB schedule', 'Tariff engine'],
    action: 'Stage tariff change',
    outcome: 'Tariff change staged for approval by the commercial manager.',
  },
  {
    id: 'landside-taxi-supply',
    domain: 'landside',
    kind: 'prescribe',
    severity: 'warning',
    title: 'Taxi holding pool runs dry after the 22:40 bank',
    observation:
      'The late arrivals bank lands 640 passengers into a taxi pool holding 38 vehicles. At the current draw rate the pool empties at 23:05, about 25 minutes before the queue clears.',
    evidence: [
      'Pool occupancy falling 1.6 vehicles per minute against a 0.9 replenishment rate.',
      'The last two Thursdays produced a 19-minute average wait at the same point.',
      'Ride-hail surge is already active, which historically pulls drivers off the airport rank.',
    ],
    recommendation:
      'Send the pre-agreed recall to the off-airport holding area now — vehicles take 18 minutes to arrive, so the decision has to be made before the queue forms.',
    impact: 'Passenger wait 19 min → 6 min at the late bank',
    confidence: 85,
    horizon: 'next 45 min',
    model: 'Queue-depletion forecast over rank telemetry',
    sources: ['Taxi rank sensors', 'AODB', 'Ride-hail feed'],
    action: 'Recall taxi fleet',
    outcome: 'Recall issued to the off-airport taxi holding area.',
  },

  /* -------------------------------------------------------------- Security */
  {
    id: 'security-unattended-bag',
    domain: 'security',
    kind: 'detect',
    severity: 'critical',
    title: 'Unattended item at Departures Hall, camera 14',
    observation:
      'An object has been static in the departures hall for 4 minutes 20 seconds with no associated person inside a 3 m radius. The owner track was lost heading toward the retail concourse.',
    evidence: [
      'Object–person association broken at 14:12:40; the dwell timer is past the 4-minute policy threshold.',
      'Owner track re-identified at camera 19 moving away from the object.',
      'No cleaning or retail activity logged in that zone.',
      'The model rejected 31 similar candidate events today; this one cleared every gate.',
    ],
    recommendation:
      'Run the unattended-item SOP: cordon the zone, dispatch the nearest patrol, and pull the owner track from camera 19 to attempt reunification before escalating.',
    impact: 'Response starts ~6 min earlier than a manual CCTV sweep',
    confidence: 92,
    horizon: 'live',
    model: 'Object–person association tracking with re-identification',
    sources: ['CCTV / VMS', 'Video analytics', 'SOP engine'],
    action: 'Execute SOP',
    outcome: 'Unattended-item SOP executed; patrol dispatched and cameras slewed.',
  },
  {
    id: 'security-ot-anomaly',
    domain: 'security',
    kind: 'detect',
    severity: 'critical',
    title: 'OT account behaviour outside its learned pattern',
    observation:
      'An engineering account wrote setpoints to 14 AGL and BMS tags between 02:10 and 02:40 from an address outside the maintenance VLAN. The account has never previously operated outside 08:00–18:00.',
    evidence: [
      'Write operations at a time of day this account has not used in 12 months of audit history.',
      'Source address outside the assigned maintenance VLAN range.',
      'No change ticket open against any of the 14 tags.',
      'Write rate six times the account median.',
    ],
    recommendation:
      'Suspend the session, revert the 14 setpoints from the last known-good snapshot and raise a security incident. Role-based access records who did what; this catches the case where the credential is legitimate and the behaviour is not.',
    impact: 'Contains an insider or compromised-credential event at the first write burst',
    confidence: 87,
    horizon: 'live',
    model: 'User & entity behaviour analytics over the OT audit trail',
    sources: ['Audit trail', 'Identity provider', 'OT firewall', 'SCADA writes'],
    action: 'Suspend session',
    outcome: 'Session suspended, setpoints reverted and a security incident raised.',
  },
  {
    id: 'security-perimeter',
    domain: 'security',
    kind: 'detect',
    severity: 'warning',
    title: 'Perimeter intrusion candidate — fence line sector 7',
    observation:
      'A fence-line sensor triggered in sector 7 with a corroborating thermal track crossing to the sterile side. Two other sensors in the sector fired without corroboration and were suppressed.',
    evidence: [
      'The fibre disturbance signature matches a climb profile rather than the wind profile.',
      'A thermal camera track crosses the virtual tripwire 4 s after the sensor event.',
      'Wind speed 6 kt — below the level that produces the usual false-alarm cluster.',
      '87% of this sector’s alarms over 30 days were wind or wildlife; this one is not.',
    ],
    recommendation:
      'Dispatch the perimeter patrol to sector 7 and hold the thermal camera on the track. Notify ATC only if the track continues toward the movement area.',
    impact: 'False-alarm rate down 87% · genuine events reach a patrol faster',
    confidence: 84,
    horizon: 'live',
    model: 'Multi-sensor corroboration with wind/wildlife false-alarm suppression',
    sources: ['Perimeter fibre sensors', 'Thermal cameras', 'MET'],
    action: 'Dispatch patrol',
    outcome: 'Perimeter patrol dispatched to sector 7 with the thermal track held.',
  },
  {
    id: 'security-medical',
    domain: 'security',
    kind: 'prescribe',
    severity: 'critical',
    title: 'Medical incident: nearest AED and clearest route computed',
    observation:
      'A collapse has been reported at Pier B, gate 12. The nearest AED is 62 m away in the Pier B service corridor and the first responder is 90 seconds out via the staff corridor.',
    evidence: [
      'Incident located to within 4 m from the reporting device and indoor positioning beacons.',
      'AED cabinet B-04 was inspected 11 days ago and reports ready.',
      'Passenger flow modelling makes the public concourse route 40 s slower than the staff corridor.',
    ],
    recommendation:
      'Push the AED location and the staff-corridor route to the responder, alert the on-site medical team, and pre-notify the ambulance service with the gate-level location rather than the terminal address.',
    impact: 'Every minute to defibrillation is roughly 10% of survival probability',
    confidence: 93,
    horizon: 'live',
    model: 'Indoor routing over the terminal graph with live crowd density',
    sources: ['Indoor positioning', 'AED asset register', 'CAD dispatch', 'Crowd sensors'],
    action: 'Dispatch responders',
    outcome: 'Responder routed via the staff corridor; ambulance pre-notified with the gate location.',
  },

  /* ----------------------------------------------------------- Maintenance */
  {
    id: 'maint-batch-window',
    domain: 'maintenance',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Nine work orders can share one runway closure',
    observation:
      'Nine open airfield work orders each need a runway or taxiway closure. Scheduled individually they consume five closures; batched into Thursday 02:00–04:00 they need one.',
    evidence: [
      'All nine sit on RWY 09/27 or its parallel taxiway.',
      'Combined estimated duration 96 min against a 120-minute low-traffic window.',
      'Thursday 02:00–04:00 has two scheduled movements, both of which can be re-timed.',
      'Crew and parts availability confirmed for all nine.',
    ],
    recommendation:
      'Batch the nine work orders into a single Thursday closure and issue one NOTAM instead of five.',
    impact: '4 closures avoided · ~$18K in disruption cost',
    confidence: 90,
    horizon: 'next 7 days',
    model: 'Maintenance window packing over closure constraints',
    sources: ['CMMS', 'AODB schedule', 'NOTAM', 'Crew roster'],
    action: 'Batch into one window',
    outcome: 'Nine work orders batched into the Thursday 02:00 closure; NOTAM drafted.',
  },
  {
    id: 'maint-spares',
    domain: 'maintenance',
    kind: 'predict',
    severity: 'warning',
    title: 'Spares stockout predicted on LED fixture modules',
    observation:
      'AXON EQ LED module consumption is running ahead of the reorder assumption. At the current failure rate stock reaches zero 11 days before the next delivery.',
    evidence: [
      'Consumption 34 units in 90 days against a planning assumption of 22.',
      'Current stock 9 units; lead time 6 weeks.',
      'Failure rate rising with fleet age — 61% of the fleet is past 70% of rated life.',
    ],
    recommendation:
      'Raise an expedited order for 40 modules now and re-baseline the reorder point against the observed failure rate rather than the original planning figure.',
    impact: 'Avoids an 11-day stockout on a safety-critical spare',
    confidence: 88,
    horizon: 'next 45 days',
    model: 'Consumption forecast with Weibull failure-rate fit',
    sources: ['CMMS', 'Inventory', 'Asset register'],
    action: 'Raise expedited order',
    outcome: 'Expedited order raised for 40 AXON EQ modules; reorder point re-baselined.',
  },
  {
    id: 'maint-crew-routing',
    domain: 'maintenance',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Crew routing: 38% of shift time is travel',
    observation:
      'Today’s 12 open work orders are assigned in ticket order, which sends both crews across the site four times. Re-sequencing by location and skill removes most of that travel.',
    evidence: [
      'Measured travel time of 2 h 51 m across two crews on an 8-hour shift.',
      'Six of the twelve orders sit inside two clusters currently split across crews.',
      'Skill matching allows all six to be served by either crew.',
    ],
    recommendation:
      'Apply the clustered route: crew 1 takes the terminal cluster, crew 2 the airfield cluster, with the two escalation orders kept as interrupts.',
    impact: '1 h 40 m of wrench time recovered per shift',
    confidence: 86,
    horizon: 'today',
    model: 'Constrained vehicle routing with skill matching',
    sources: ['CMMS', 'Crew roster', 'Asset locations'],
    action: 'Apply route plan',
    outcome: 'Clustered route plan pushed to both maintenance crews.',
  },

  /* ------------------------------------------------------------ Commercial */
  {
    id: 'commercial-dwell-offer',
    domain: 'commercial',
    kind: 'prescribe',
    severity: 'opportunity',
    title: 'Delay creates a 40-minute dwell window worth targeting',
    observation:
      'VN1546’s 40-minute delay leaves 186 passengers airside with unplanned dwell. This cohort historically converts at 2.3× baseline on F&B when offered inside the first 10 minutes.',
    evidence: [
      'Delay confirmed in the AODB; gate area occupancy is already rising.',
      'The cohort skews business traveller, whose F&B basket runs 34% above terminal mean.',
      'Conversion decays sharply after the first 10 minutes of the dwell window.',
      'Pier B outlets are at 41% capacity and can absorb the demand.',
    ],
    recommendation:
      'Push a Pier B F&B offer to the 186 passengers now and alert the two outlets to staff up for the next 40 minutes.',
    impact: '≈ $4.2K incremental spend · measurably better delay experience',
    confidence: 77,
    horizon: 'next 40 min',
    model: 'Dwell-cohort propensity model over historical delay conversions',
    sources: ['AODB', 'Passenger app', 'POS', 'Footfall counting'],
    action: 'Push targeted offer',
    outcome: 'Offer pushed to 186 passengers; Pier B outlets notified.',
  },
  {
    id: 'commercial-underperform',
    domain: 'commercial',
    kind: 'detect',
    severity: 'warning',
    title: 'Unit 12 revenue per passenger has decoupled from footfall',
    observation:
      'Footfall past Unit 12 is up 9% month on month while its revenue per passenger is down 14%. The traffic is arriving and not converting.',
    evidence: [
      'Footfall and conversion have moved in opposite directions for 5 consecutive weeks.',
      'Comparable units in the same pier held conversion flat over the period.',
      'Queue dwell at the unit averages 4.8 min against a 2.1 min pier median.',
      'The change coincides with the unit’s revised opening hours from 02 Aug.',
    ],
    recommendation:
      'Review staffing against the revised opening hours before the lease review, and trial a second till during the 06:00–09:00 bank.',
    impact: 'Recovering half the gap is ≈ $92K annualised',
    confidence: 81,
    horizon: 'next 30 days',
    model: 'Conversion decomposition (footfall × capture × basket)',
    sources: ['POS', 'Footfall counting', 'Lease management'],
    action: 'Open review case',
    outcome: 'Review case opened against Unit 12 ahead of the lease review.',
  },
  {
    id: 'commercial-route-mix',
    domain: 'commercial',
    kind: 'predict',
    severity: 'opportunity',
    title: 'Winter schedule shifts the duty-free mix',
    observation:
      'The winter schedule adds two Korea rotations and drops one domestic. The resulting passenger mix moves duty-free demand toward cosmetics and away from confectionery.',
    evidence: [
      'Published winter schedule changes confirmed with the airlines.',
      'Korea-origin passengers index 2.1× on cosmetics and 0.6× on confectionery.',
      'The current stock plan is still weighted to the summer domestic mix.',
    ],
    recommendation:
      'Re-weight the winter stock plan and brief the concessionaire before their December order goes in.',
    impact: '≈ $63K of avoided markdown · better in-stock on the growing line',
    confidence: 79,
    horizon: 'next 90 days',
    model: 'Route-mix demand model over nationality-indexed basket data',
    sources: ['AODB schedule', 'POS', 'Concessionaire stock plan'],
    action: 'Brief concessionaire',
    outcome: 'Winter stock re-weighting briefed to the concessionaire.',
  },

  /* -------------------------------------------------------- Sustainability */
  {
    id: 'sustain-peak-shave',
    domain: 'sustainability',
    kind: 'optimise',
    severity: 'opportunity',
    title: 'Predicted demand peak can be shaved without touching comfort',
    observation:
      'Today’s peak is forecast at 16:40. Pre-cooling the terminal from 15:20 and trimming non-critical apron lighting across the peak keeps demand below the tariff threshold.',
    evidence: [
      'Load forecast puts the peak 4.2% above the demand-charge threshold.',
      'Thermal mass supports 40 minutes of pre-cool with under 0.4 °C of zone drift.',
      'Apron floodlighting on the south pool is at full output in daylight.',
      'The same strategy on 19 Aug held the peak 6% below threshold.',
    ],
    recommendation:
      'Start pre-cooling at 15:20 and drop the south apron floods to 40% until 17:15.',
    impact: '≈ $2.8K in demand charges · 1.9 tCO₂e',
    confidence: 87,
    horizon: 'today',
    model: 'Load forecast with thermal-mass pre-cool optimiser',
    sources: ['Substation SCADA', 'LBMS', 'AGL', 'MET'],
    action: 'Apply peak-shave plan',
    outcome: 'Pre-cool scheduled for 15:20 and apron flood dimming staged.',
  },
  {
    id: 'sustain-carbon-gap',
    domain: 'sustainability',
    kind: 'predict',
    severity: 'warning',
    title: 'Carbon target will be missed by 6.4% on current trajectory',
    observation:
      'Extrapolating the last six months, the airport lands at 1,596 tCO₂e against a 1,500 target. Three of the four committed initiatives are behind their assumed ramp.',
    evidence: [
      'Actual reduction 18.7% against a 24% plan at this point in the year.',
      'LED conversion at 61% of planned fixtures.',
      'Electric GSE transition delayed by charger commissioning.',
      'Solar generation 12% below modelled yield, tracking soiling losses.',
    ],
    recommendation:
      'Prioritise the remaining LED conversion — the cheapest tonne available — and add a panel-cleaning cycle. Together they close about 4.1% of the 6.4% gap.',
    impact: 'Gap 6.4% → 2.3% within the reporting year',
    confidence: 83,
    horizon: 'to year end',
    model: 'Emissions trajectory model with per-initiative ramp tracking',
    sources: ['Energy meters', 'Solar inverters', 'Fleet telematics', 'ACA reporting'],
    action: 'Re-prioritise initiatives',
    outcome: 'LED conversion re-prioritised and a panel-cleaning cycle scheduled.',
  },
  {
    id: 'sustain-water-leak',
    domain: 'sustainability',
    kind: 'detect',
    severity: 'warning',
    title: 'Overnight water baseline has risen — probable leak',
    observation:
      'Minimum night flow on the terminal main has risen from 1.9 to 4.6 m³/h over 12 days with no change in occupancy. That profile is a leak, not demand.',
    evidence: [
      'Minimum night flow rising steadily while daytime peaks are unchanged.',
      'The rise is localised to the Pier B sub-meter.',
      'No works permits are open in the affected zone.',
      'At the current rate the loss is roughly 23 m³ per day.',
    ],
    recommendation:
      'Send a leak-detection survey to the Pier B branch, starting at the irrigation tee where the sub-meter divergence begins.',
    impact: '≈ 8,400 m³ per year avoided if fixed this month',
    confidence: 89,
    horizon: 'live',
    model: 'Minimum-night-flow leak detection over zoned sub-metering',
    sources: ['Water sub-meters', 'LBMS', 'Works permits'],
    action: 'Dispatch leak survey',
    outcome: 'Leak-detection survey dispatched to the Pier B branch.',
  },

  /* -------------------------------------------------------------- Passenger */
  {
    id: 'pax-leave-home',
    domain: 'passenger',
    kind: 'predict',
    severity: 'opportunity',
    title: 'Personal leave-home time instead of "arrive 2 hours early"',
    observation:
      'Combining road conditions, forecast kerb dwell, the security queue prediction and walk time, each departing passenger can be given a personal leave-home time.',
    evidence: [
      'The security queue forecast carries ±6% error at a 40-minute horizon.',
      'Road travel times come from each passenger’s own origin, refreshed every 5 minutes.',
      'Walk times are measured per pier from the terminal graph.',
      'Auckland Airport measurably reduced passenger anxiety with the same feature.',
    ],
    recommendation:
      'Enable personalised departure timing in the app for tomorrow’s bank, with a conservative buffer for first-time and PRM travellers.',
    impact: 'Flattens the show-up curve · fewer both-tails arrivals at security',
    confidence: 85,
    horizon: 'next 24 h',
    model: 'Door-to-gate journey model (traffic × queue forecast × walk graph)',
    sources: ['Traffic API', 'Queue forecast', 'DCS', 'Passenger app'],
    action: 'Enable for tomorrow',
    outcome: 'Personalised leave-home timing enabled for tomorrow’s departures.',
  },
  {
    id: 'pax-misconnect',
    domain: 'passenger',
    kind: 'predict',
    severity: 'critical',
    title: '23 connecting passengers will miss their onward flight',
    observation:
      'Twenty-three passengers off the delayed VN213 cannot make VJ322 through immigration and security at current queue depths. Eleven make it if they are met and fast-tracked.',
    evidence: [
      'The inbound is now 34 min late; minimum connect time is 50 min and the gap is 41.',
      'The immigration queue is at 18 min and rising.',
      'Eleven of the 23 are seated forward of row 12 and will disembark early enough.',
      'The remaining twelve need rebooking regardless of what happens at the airport.',
    ],
    recommendation:
      'Meet the eleven at the airbridge with a fast-track escort and start rebooking the other twelve now, rather than after they miss the flight.',
    impact: '11 connections saved · 12 rebooked before the disruption is visible',
    confidence: 88,
    horizon: 'next 45 min',
    model: 'Connection feasibility model over live queue depths and seat map',
    sources: ['AODB', 'DCS seat map', 'Queue sensors', 'Immigration'],
    action: 'Dispatch escorts',
    outcome: 'Fast-track escorts dispatched; rebooking started for the remaining twelve.',
  },
  {
    id: 'pax-assistant',
    domain: 'passenger',
    kind: 'prescribe',
    severity: 'opportunity',
    title: 'Assistant handling 62% of information-desk queries',
    observation:
      'The conversational assistant resolved 62% of passenger queries without a human this week. The residual 38% clusters into four topics it cannot currently answer.',
    evidence: [
      'Top unresolved clusters: baggage claim status, prayer-room location, PRM booking changes, lost property.',
      'Escalation to a human averages 40 s, which passengers rate poorly mid-terminal.',
      'Physical desk volume is down 31% since launch.',
    ],
    recommendation:
      'Connect the assistant to the baggage tracking and lost-property systems — those two clusters alone are 24% of the residual.',
    impact: 'Automated resolution 62% → ~79% · desk load down further',
    confidence: 84,
    horizon: 'next 30 days',
    model: 'LLM assistant with retrieval over operational systems',
    sources: ['Passenger app', 'FIDS', 'Baggage tracking', 'Lost property'],
    action: 'Extend integrations',
    outcome: 'Baggage and lost-property integrations queued for the assistant.',
  },
  {
    id: 'pax-prm-demand',
    domain: 'passenger',
    kind: 'predict',
    severity: 'warning',
    title: 'PRM assistance demand exceeds rostered agents at 19:00',
    observation:
      'Booked and predicted unbooked wheelchair demand between 18:40 and 19:40 needs seven agents. Five are rostered.',
    evidence: [
      '14 booked assists in the window plus a predicted 5 unbooked, from route and demographic mix.',
      'Unbooked PRM demand on these routes runs at 34% of booked volume.',
      'Two agents are committed to arrivals at the far pier for most of the window.',
    ],
    recommendation:
      'Extend two afternoon agents by one hour rather than calling in overtime later, and pre-position two chairs at the far pier.',
    impact: 'Avoids ~25 min PRM waits and a likely service complaint',
    confidence: 86,
    horizon: 'next 3 h',
    model: 'PRM demand forecast (booked + unbooked propensity by route)',
    sources: ['Assistance booking', 'DCS', 'AODB', 'Roster'],
    action: 'Extend roster',
    outcome: 'Two agents extended and chairs pre-positioned at the far pier.',
  },

  /* -------------------------------------------------------------- Analytics */
  {
    id: 'analytics-tag-forecast',
    domain: 'analytics',
    kind: 'predict',
    severity: 'opportunity',
    title: 'Forecast band available on any historised tag',
    observation:
      'Every historised tag can carry a forward band alongside its trend, so a KPI chart shows where the value is heading rather than only where it has been.',
    evidence: [
      'Seasonal decomposition fitted per tag over 90 days of history.',
      'Backtest across 240 tags gives a median 7-day MAPE of 6.8%.',
      'Tags with insufficient history are excluded rather than extrapolated.',
    ],
    recommendation:
      'Turn the forecast band on for the reported KPI set first, then extend to the wider tag list once operators have calibrated their trust in it.',
    impact: 'Turns retrospective reporting into a forward view',
    confidence: 82,
    horizon: 'next 7–30 days',
    model: 'Per-tag seasonal decomposition with prediction intervals',
    sources: ['SCADA historian', 'KPI definitions'],
    action: 'Enable forecast band',
    outcome: 'Forecast band enabled across the reported KPI set.',
  },
  {
    id: 'analytics-report-narrative',
    domain: 'analytics',
    kind: 'prescribe',
    severity: 'opportunity',
    title: 'Monthly board report drafted from the operational record',
    observation:
      'The monthly operations report can be assembled directly from the historian, alarm log and work-order record, with every figure traceable back to its source tag.',
    evidence: [
      'All 34 reported figures already exist as historised tags or CMMS queries.',
      'Manual preparation currently takes about 11 hours per month across three people.',
      'The narrative is generated from the figures, not the other way round — no number is invented.',
    ],
    recommendation:
      'Generate the draft on the first working day of each month and route it for review rather than authoring from scratch.',
    impact: '≈ 11 hours per month recovered · consistent month-on-month framing',
    confidence: 88,
    horizon: 'monthly',
    model: 'Retrieval-grounded report generation over the operational record',
    sources: ['Historian', 'Alarm log', 'CMMS', 'AODB'],
    action: 'Generate draft report',
    outcome: 'Draft monthly report generated and routed for review.',
  },
  {
    id: 'analytics-drift',
    domain: 'analytics',
    kind: 'detect',
    severity: 'warning',
    title: 'Two KPIs drifting outside their control limits',
    observation:
      'Baggage delivery time and stand on-time performance have both drifted past their control limits over three weeks without breaching any single-point alarm.',
    evidence: [
      'Both metrics show 8 consecutive points on one side of the mean — a Western Electric run rule.',
      'Neither has crossed the absolute threshold that would raise an alarm.',
      'The drift starts the week the summer schedule loaded.',
    ],
    recommendation:
      'Review both against the schedule change before they cross their contractual thresholds. Drift caught by run rules is cheaper to fix than a breach caught by an alarm.',
    impact: 'Two SLA breaches headed off before they happen',
    confidence: 85,
    horizon: 'next 30 days',
    model: 'Statistical process control with Western Electric run rules',
    sources: ['Historian', 'KPI definitions', 'AODB'],
    action: 'Open review',
    outcome: 'Review opened against both drifting KPIs.',
  },
];

/** Insights for one console. */
export function insightsFor(domain: AiDomain): AiInsight[] {
  return AI_CATALOGUE.filter((i) => i.domain === domain);
}
