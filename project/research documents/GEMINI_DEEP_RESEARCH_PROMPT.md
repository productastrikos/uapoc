# Gemini Deep Research Prompt — AI Use Cases for U-APOC / TAMS

> Paste everything below the line into Gemini Deep Research. Ask for a long report.
> Push back if it returns marketing copy instead of shipping systems.

---

## ROLE

You are an airport operations technology analyst. You advise a systems integrator
(Astrikos, partnered with AVEVA/Schneider) that is building a **Unified Airport
Operations Centre (U-APOC)** for small regional airports in **Indonesia** — a pilot
on 2 airports (10–15 flights/day each), expanding to 8 more of the same size, then
5 large airports, with ~200 ministry-owned airports across 150 islands as the
long-term estate. A comparable system (HBMS / terminal management) is already being
deployed at **Long Thanh, Vietnam**.

Your job is **not** to tell me AI is transformative. It is to tell me, use case by
use case, **what a real system can actually infer from the data an airport of this
size actually has**, what the named technique is, what it costs to be wrong, and
what a human operator does with the output.

## THE HARD CONSTRAINT — READ THIS FIRST

For every claim, separate these three tiers and **label each recommendation with its tier**:

- **TIER 1 — SHIPPING.** Deployed in named airports today with published results.
  Cite airport, vendor, year, and the measured number.
- **TIER 2 — CREDIBLE.** Technically sound, proven in adjacent industries (rail,
  utilities, process plants, data centres), not yet standard in aviation.
- **TIER 3 — ASPIRATIONAL.** Vendor marketing, pilots, or conference slideware with
  no operational evidence.

I will build demo screens from Tier 1 and Tier 2 only. Tier 3 is useful only so I
know what a customer may have been promised by a competitor. **Do not blur the
tiers.** If something is widely marketed but never actually deployed, say so.

Also flag, for each use case, the **small-airport reality check**: does this
technique still work at 10–15 flights/day, or does it need traffic volume / history
that a small airport does not have? Many ML approaches silently require years of
dense data. Say where that is the case, and say what the fallback is (rules, physics
models, transfer learning from a larger airport, vendor priors).

---

## PART A — THE PAIN POINTS TO SOLVE

These came out of a real customer/stakeholder review. Anchor the research in them.
For each: what AI could have done, at which point in the timeline, with what data,
and what the operator would have seen on screen.

**A1. The runway that closed for 5–6 hours.**
A power/signal cable between the airfield lighting control cabinet (CCR) and the
runway fixtures was cut somewhere along its run. The team assumed a PLC fault.
Nobody knew where the break was. The runway stayed closed 5–6 hours.

- How do operators actually localise a fault on a **series lighting circuit**
  (constant-current loop) today? Cover insulation resistance (megger) trending, TDR
  (time-domain reflectometry), earth-fault detection, per-fixture addressable feedback.
- What do ADB SAFEGATE, Honeywell, OCEM and ATG Airports actually expose over their
  control systems (ALCMS / ILCMS) — per-fixture status? current? lamp feedback?
  insulation trend?
- Can a monitoring layer above SCADA infer **"the cable is cut between C and D"** from
  which fixtures went silent together, versus a controller fault or a lamp-failure
  pattern? What is the actual inference — topology reasoning over the circuit graph?
  What confidence is defensible?
- The stakeholder's own suggested advisory was: *"if everything else looks good and
  the signals are not coming from the light to the controller, highlight that
  probability as an advisory."* Is that defensible? What would the evidence line say?
- Also: the airport had a **redundant/standby circuit and nobody switched to it,
  because nobody realised the duty unit had dropped out.** What is the standard
  pattern for surfacing an unused healthy standby? (This generalises far beyond
  lighting — it is the single most repeated failure in the transcript.)

**A2. Alarms that raise but never become work orders.**
A conveyor jam alert fired and just sat there. No escalation, no ownership, no work
order. The reviewer's exact complaint: *"this conveyor jam alert is not escalating."*

- Cover **alarm management standards**: EEMUA 191, ISA-18.2, IEC 62682. What are the
  accepted metrics (alarms per operator per hour, standing alarm count, chattering
  alarm rate, flood definition)?
- **Alarm rationalisation and root-cause collapse**: how do real systems collapse an
  alarm flood (200+) into a handful of root causes? Name the techniques — causal
  graphs, correlation over time windows, consequence trees, suppression on parent trip.
- **Escalation workflow / auto work-order raising**: what triggers an auto-WO in
  practice? Which CMMS/EAM integrations matter (SAP PM, IBM Maximo, AVEVA, Infor)?
  What are the guardrails against work-order spam?
- What escalation-ladder model do control rooms actually use (acknowledge → assign →
  escalate to supervisor → escalate to manager), and with what SLA clocks?

**A3. "What AI, exactly?" — the credibility question.**
The customer will ask what the model is. I need a **named technique per use case**,
not "AI". For each recommendation type below give the actual method family, the input
features, the training data volume needed, and realistic accuracy / lead time from
literature or vendor case studies:

- anomaly detection on OT time series (which: isolation forest? autoencoder? spectral
  residual? plain SPC with Western Electric run rules?)
- remaining-useful-life / failure prediction for rotating equipment (AHU fans,
  chillers, conveyor motors, baggage belts)
- queue / dwell forecasting from sensor counts
- delay propagation modelling
- computer vision for the specific airport tasks in Part B
- LLM / agentic layers — where they are genuinely useful (summarisation, SOP
  retrieval, shift handover, natural-language query over the historian) versus where
  they are dangerous (anything touching control or safety)

**A4. Cyber security of the platform itself.**
The customer asked: insider threat is handled by RBAC + audit trail, fine — but what
about an external actor taking control or disrupting the system?

- **IEC 62443** zones/conduits applied to an airport OT estate; Purdue-model placement
  of a monitoring layer above SCADA.
- Read-only / unidirectional gateways (data diodes) — when used, what they cost
  operationally.
- **Can AI actually help here?** OT anomaly detection on protocol traffic
  (Modbus/BACnet/OPC-UA), behavioural baselining of operator actions, detection of a
  compromised OT credential. Which of this is Tier 1?
- What extra investment/layer would an integrator honestly quote for this?
- Any published aviation OT incidents worth citing.

**A5. A-CDM as the extension story.**
The airports are too small for A-CDM today, but the customer wants to know the system
can extend to it, eventually across ~200 airports.

- The **16 A-CDM milestones** and which data sources feed each (AODB, ATS/ATC,
  A-SMGCS, ground-handler apps, ACARS/ADS-B).
- Where AI genuinely adds value in A-CDM — TOBT prediction, TSAT allocation, variable
  taxi-time estimation, turnaround-milestone prediction from vision.
- The **minimum viable A-CDM at a very small airport**, and the honest answer to "can
  this scale to 200 airports". Cover the multi-airport / network operations-centre
  pattern — which countries have done it (Avinor? AENA? Angkasa Pura?).

**A6. Centralised HMI / control.**
The reviewer asked whether we show AHU **user graphics / HMI screens**, and noted that
in Indonesia they are taking **centralised control wherever possible**.

- The industry line between **monitoring (read-only)** and **supervisory control
  (write)** for airport BMS / terminal systems. What is normally permitted?
- What a standard AHU faceplate/HMI actually shows and controls.
- Where an AI advisory sits relative to a control action — advisory-only,
  operator-confirms, closed-loop. What do real deployments allow, and what does the
  safety case require?

---

## PART B — USE CASES TO RESEARCH, DOMAIN BY DOMAIN

For **each** use case, return a structured entry:

```
USE CASE:           <name>
TIER:               1 / 2 / 3
PAIN IT SOLVES:     <one line>
AI CLASS:           detect | predict | prescribe | optimise
TECHNIQUE:          <named method, not "AI">
INPUT DATA:         <the actual tags/feeds, and the sampling rate>
DATA NEEDED:        <how much history before it works — the small-airport check>
LEAD TIME:          <how far ahead it sees>
TYPICAL ACCURACY:   <reported number + source>
OPERATOR SEES:      <the one sentence the screen shows>
EVIDENCE LINES:     <3-4 bullet facts that justify the recommendation to a sceptic>
RECOMMENDED ACTION: <what the operator is asked to do>
SOP TRIGGERED:      <named procedure + steps + who owns each step>
IF IGNORED:         <cost of doing nothing — money, minutes, or regulation>
INTEGRATION:        <which upstream system must be integrated>
STANDARD/REG:       <ICAO Annex 14, IATA Res 753, EEMUA 191, ASHRAE, etc.>
SOURCE:             <citation>
```

### B1. Airfield Ground Lighting (AGL) — highest priority

Integration target is **ADB SAFEGATE** (lighting + controllers + VDGS). Cover runway
edge/centreline, threshold, approach, PAPI, taxiway, stop bars, apron floodlighting.

- Per-fixture monitoring: what is actually measurable (lamp current, burn hours,
  measured intensity, comms health, insulation resistance per circuit)?
- **ICAO Annex 14 serviceability targets** per light category, and what happens
  operationally when a category falls below target (especially under LVP CAT I / CAT II).
- Predictive lamp/LED failure from burn hours + current drift — is this Tier 1?
- Constant-current regulator (CCR) health, brightness step control, standby changeover.
- Stop-bar / runway-incursion prevention logic.
- What a **faulty-light detail template** shows in a real ALCMS (the customer
  explicitly wants: click a faulty light → see its parameters).
- Find real ADB SAFEGATE / Honeywell / OCEM screenshots, videos and datasheets;
  describe the actual screen layout and terminology so a mock-up reads as authentic.

### B2. Terminal / Building Management (BMS, HBMS, LBMS)

- AHU/chiller fault detection & diagnostics (**ASHRAE Guideline 36**, AFDD),
  predictive maintenance on fans/motors/bearings, filter-clog prediction from
  differential pressure.
- HVAC energy optimisation against passenger load and flight schedule (pre-cooling a
  gate before an arrival bank — what is the real saving?).
- IAQ / CO₂-driven ventilation control.
- Zone comfort complaints predicted before they are logged.
- Standby/duty pump and AHU rotation — the "nobody switched to the standby" failure again.
- What KPIs a **terminal-management super-admin dashboard** actually carries. I need a
  defensible KPI list for an all-subsystems landing page.

### B3. Baggage Handling (BHS)

- Conveyor jam prediction, motor current signature analysis, belt-slip detection.
- **IATA Resolution 753** tracking and mishandled-bag risk scoring (SITA
  BagJourney-class). Actual mishandling rate and cost per bag.
- Early bag store optimisation; reclaim-belt allocation.
- The escalation failure from A2 lives here.

### B4. Security & Safety

- Unattended baggage detection (vision) — real false-positive rates, and the SOP it triggers.
- Perimeter intrusion, wrong-way / exit-lane breach detection.
- Queue-time prediction at screening; lane-opening recommendations.
- Access-control anomaly (tailgating, credential misuse, out-of-hours access).
- Fire / life-safety integration and the evacuation SOP.
- **Be specific about vision false-positive rates** — this is where demos lie.

### B5. Apron / Stand / Turnaround

- **VDGS** (ADB SAFEGATE Safedock) — what data it emits, docking accuracy, what a VDGS
  fault actually means operationally.
- Turnaround milestone detection from apron cameras (chocks on/off, GPU connect,
  fuelling, catering, boarding) — tier-check this hard.
- Stand allocation conflict prediction and re-allocation.
- FOD detection; jet-blast and ground-safety incidents.

### B6. Passenger Journey & Landside

- Queue / dwell / flow forecasting (Veovo, Xovis, Blip-class) — actual accuracy and lead time.
- Curbside congestion, car-park occupancy prediction.
- Passenger flow re-routing recommendations and the wayfinding / PA / FIDS actions.
- Biometrics / self-service throughput.

### B7. Sustainability, Energy, Commercial, Analytics

- Energy baseline + anomaly, peak-demand shaving, solar/BESS dispatch.
- Water and waste; carbon accounting (**Airport Carbon Accreditation** levels).
- Retail dwell → spend correlation; concession staffing recommendations.
- KPI drift detection using SPC run rules rather than threshold alarms.

---

## PART C — THE THING I MOST NEED: THE RESOLUTION FLOW

This is the centre of the whole request. My demo can inject faults, but it does not
yet show **how the problem gets solved**. For the **top 8–10 use cases across all
domains**, give me the complete end-to-end chain as an operator would live it:

```
1.  SIGNAL          — the raw tag/event that changes, with realistic values & units
2.  DETECTION       — how the system notices (threshold? model? correlation?), and in how long
3.  ENRICHMENT      — context pulled in (asset record, history, weather, schedule, similar past events)
4.  AI INFERENCE    — the named model, its output, its confidence, and what it is uncertain about
5.  PREDICTED       — what happens if nobody acts, with a timeline and a number
    CONSEQUENCE
6.  RECOMMENDATION  — the prescribed action, ranked against 1-2 alternatives it rejected, and WHY
7.  SOP             — the named procedure: numbered steps, role per step, minutes per step,
                      evidence captured per step, approval gates
8.  EXECUTION       — what is automated vs what a human must confirm; the audit record written
9.  VERIFICATION    — which tag must move to prove it worked, and the rollback if it does not
10. CLOSURE         — work order raised/closed, MTTR, what feeds back into the model
```

Show at least: **AGL circuit fault (the 5-hour runway)**, **AHU/chiller failure**,
**conveyor jam**, **unattended bag**, **stand conflict**, **security access anomaly**,
**energy peak**, and **a false positive that the operator correctly rejects** — I want
to demo the system being wrong gracefully, which is more credible than a system that
is always right.

For each, also give:

- The **"why this and not that"** line — what alternative the model rejected.
- The **predictive alert** version: the same event caught 20–60 minutes earlier, and
  what the earlier evidence looked like while it was still ambiguous.
- Realistic **MTTA / MTTR before and after**, with a source.

---

## PART D — SCREEN & UX EVIDENCE

- Find and describe real screenshots/videos of: **AVEVA System Platform / AVEVA
  Operations Control** airport dashboards, ADB SAFEGATE ALCMS, Honeywell airport suite,
  Siemens / Johnson Controls terminal BMS, Amadeus / SITA APOC, Veovo.
- The **actual information hierarchy** of a control-room screen — what is always
  visible, what is one click away, what lives in a modal.
- How mature products present an AI recommendation without making the operator
  distrust it (confidence display, evidence disclosure, shadow mode, override,
  feedback capture).
- Which **APOC / airport digital twin** deployments are real and citable (GMR
  Hyderabad, YVR, Schiphol, Changi, Incheon, HKIA, Zurich)? What did each actually
  claim as a measured benefit?
- Anti-patterns: what makes an ops dashboard get ignored in a real control room?

---

## PART E — DELIVERABLE FORMAT

1. **Executive summary** — 10 bullets, the honest state of AI in airport ops.
2. **The tier table** — every use case researched, one row each, tier-labelled,
   sortable by "credibility per unit of demo impact".
3. **Full use-case entries** (Part B format).
4. **The 8–10 resolution flows** (Part C format) — the most important section; do not
   compress it.
5. **Pain-point answers** — a direct, quotable answer to each of A1–A6, written so I
   can say it out loud in front of the customer.
6. **What to NOT claim** — the specific over-claims that will get the demo torn apart
   by a knowledgeable airport engineer, and the safer phrasing for each.
7. **Sources** — every citation with a link, grouped by tier.

Prefer primary sources: ICAO / IATA / ACI documents, vendor technical datasheets and
manuals, airport case studies with named airports and measured numbers, and
peer-reviewed papers. Treat vendor blog posts and press releases as Tier 3 unless a
named airport and a measured result are given.
