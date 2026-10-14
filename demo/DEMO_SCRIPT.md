# U-APOC POC Walkthrough — Demo Script

**Meeting:** Technical Discussion with DBU & Eltran — Next Step, Palu & Samarinda AMS Project
**Your role:** POC walkthrough only. Not deep technical.
**Client's two focus points:**
1. Real-Time Airfield Lighting Monitoring (live demo preferred)
3. Passenger Experience and Operational Efficiency (live demo preferred)

---

## 0. What they actually want to hear

From the earlier call with Sayaji, this is what is really behind the two written points:

| They wrote | What they mean |
|---|---|
| "Monitor the status of each airfield lighting asset in detail and in real time" | *Click one light. Show me its data like a real device page.* Sayaji asked for a "light template", the same way we show the AHU faceplate. |
| "Considering the existing airport lighting infrastructure" | *We are not replacing ADB SAFEGATE. Show me you can sit on top of it.* Palu/Samarinda use ADB for airfield lighting and for VDGS. |
| (unwritten, but the real driver) | **The cable-cut incident.** A cable between the controller and the runway lights was cut. They thought it was a PLC fault. **The runway was closed 5–6 hours** because nobody knew where the fault was. A standby path existed and nobody noticed it had not switched over. |
| "Improve passenger comfort, service quality, operational efficiency" | *Show the system doing something about a problem, not just drawing a graph.* |
| "From aircraft arrival and disembarkation to baggage claim and exit" | They want the **arrival** side, not only departures. |

**Also remember from the last call:**
- Small airports — one runway, 10–15 flights a day. Palu and Samarinda are the trial. If it works: 8 more, then 5 big airports, potentially ~200 across Indonesia.
- Do **not** say "HBMS" in front of the customer. Sayaji corrected this. Say **"Terminal Management"** or **"Building Management"**.
- Say clearly: this is already being deployed in **Vietnam**. Not slideware.
- Cyber security **will** come up. Ajit has slides. Park it, do not improvise.
- A-CDM will come up. Answer: not needed at this size today, but the platform extends to it. Sayaji is writing that note.

---

## 1. Before you start — 5 minute checklist

| # | Check |
|---|---|
| 1 | Run the app: `cd project && npm run dev`. Full screen, browser zoom 100%. |
| 2 | Login: user `admin`, password `Astrikos2026`. |
| 3 | Go to **Airside Operations → Airfield Ground Lighting**. Click **Reset** in Fault Injection. Serviceability must read **100.0%**. |
| 4 | Set **Speed** to **4×**. At 1× an aircraft takes minutes to taxi. |
| 5 | Go to **Airside Operations → Apron Management**. Make sure at least one stand is free so you can dock an aircraft live. |
| 6 | Close any open faceplate panel before you start. |
| 7 | Keep this script on a second screen or phone. Do not read it from the demo screen. |

**If the live demo fails:** screenshots are in `project/_shots/`. Say: *"Let me show you the captured screens, and we will do the live session right after."* Do not debug on the call.

---

# SHORT SCRIPT (10–12 minutes)

> Use this first. Simple, fast, confident. Stop after this. Go deeper only if they ask.

## Opening — 45 seconds

> "Thank you. Before the two points you asked for, one line about what you are looking at.
>
> This is **U-APOC — the Unified Airport Operations Center**. Today an airport runs on many separate systems. Airfield lighting is one system. The building is another. Baggage is another. Security is another. Each one has its own screen, its own vendor, its own room.
>
> U-APOC puts all of them on **one screen, one login, one URL**. The operator does not change systems. The operator changes tabs.
>
> On the left you see the areas — Airside, Terminal, Landside, Security, Maintenance, Commercial. Let me start with airfield lighting, which is your first question."

*Click: **Airside Operations** → tab **Airfield Ground Lighting**.*

---

## POINT 1 — Real-Time Airfield Lighting Monitoring (4–5 min)

### 1.1 The whole airfield at once — 45 sec

> "This is the airfield. One runway, 3000 metres. Taxiways. Three aprons with the parking stands.
>
> Every dot you see is **one real light**. Not a group. Not an average. One light.
>
> At the top it says **898 addressable fixtures on 12 series circuits**. On the right, **overall serviceability is 100 percent** — everything is working right now.
>
> Very important: we are **not replacing your lighting system**. Your airfield uses **ADB SAFEGATE**. We read from the ADB control system — CORTEX, and the LINC 360 lamp monitoring. Your lighting keeps working exactly as today. We sit on top and give you the picture."

### 1.2 One light in detail — 60 sec ⭐ *this is what they asked for*

*Click any light on the runway edge. A panel opens.*

> "You asked to see each lighting asset in detail. This is one light.
>
> This is its tag name — the same name your ADB system uses. Here is the type, and the actual ADB product.
>
> Real-time values:
> - **Light Status** — is it on.
> - **LINC 360 Comms** — is the light still answering. This is different from 'on'. A light can be dead, or a light can simply stop talking. Those are two different problems.
> - **Luminous Intensity** — how bright it actually is, in candela. Not the command. The measurement.
> - **Burn Hours** — how many hours this lamp has run. This is how we predict a failure before it happens.
>
> And we do not only read. From here the operator can switch it **on or off**, change the **brightness setpoint**, or put it in **maintenance mode** so it stops raising alarms while a technician works on it.
>
> Below, the **alarm settings for this single light** — the limits, and the delay before an alarm is raised.
>
> At the bottom, the **series circuit** this light sits on: which regulator feeds it, which ACE3 unit monitors it, the current, and the **insulation resistance**. I will come back to that number — it is important for you."

*Close the panel.*

### 1.3 Lighting is not a picture — it is a sequence — 60 sec

> "One more thing before faults. Airfield lighting is not a static status board. It is a **sequence**. Let me show you an aircraft."

*Click **Arrival RWY 09**. Speed is on 4×.*

> "The aircraft is on approach. Watch the **PAPI** — the glide slope indicator for the pilot.
>
> Touchdown. Rollout. It vacates the runway.
>
> Now watch the **green lights ahead of the aircraft**, and the lights **going off behind it**. This is **follow-the-green**. The taxiway lighting guides the aircraft to the stand and closes behind it.
>
> So we are not only telling you which lamp is broken. We show the lighting **doing its job**."

### 1.4 A fault — 45 sec

*Click **Fail Threshold Lighting**.*

> "Now let us break something. I have failed the threshold lighting — the green bar at the start of the runway.
>
> Three things happened at the same time, with no delay:
> - The lights turned **red on the map**. You see exactly which ones and exactly where.
> - On the right, **Runway Threshold Lighting** dropped below its target. The target is **100 percent**, because that is the ICAO Annex 14 requirement. It is now below.
> - At the bottom, the **alarms** came in.
>
> And the operator does not just look at it —"

*Click **Escalate** on one alarm.*

> "— one click, and it becomes a **work order** with a number. Now it is somebody's job, not just a red light on a screen."

### 1.5 The cable-cut story — 90 sec ⭐⭐ *the most important 90 seconds*

*Click **Reset**, then click **CCR Output Failure**.*

> "Now the case you told us about.
>
> You had a cable cut between the controller and the runway lights. Your team thought it was the PLC. **The runway was closed for five to six hours**, because nobody knew where the problem was.
>
> Look at the screen now. A whole group of lights went dark **at the same second**. Look at the alarm list — it is full. If I am the operator at 2 a.m., I am now reading a hundred and fifty alarms and I do not know where to start.
>
> This is where the system helps."

*Click **AI Advisory** in the top bar.*

> "One card. In plain language:
>
> *'These lights went dark together on this circuit. That usually means the power supply feeding them has failed — not this many separate bulbs.'*
>
> And it shows **why** it thinks so:
> - The regulator is reporting an output failure.
> - Every light lost communication in the **same second** — they lost the signal together with the power.
> - **Not one light** reported a lamp failure of its own first.
> - The insulation reading is normal, so this is probably **not** a cable fault.
> - The other circuits are fine, so it is **not** a whole-vault power problem.
>
> Then the recommendation — this is the part that answers your incident directly:
>
> ***'Check whether the standby regulator actually took over. A changeover that did not happen looks exactly the same as having no backup at all, from this screen.'***
>
> That is the five hours. Not the repair — the **searching**. The system does not fix the cable. It tells the crew **where to look first**, in the first minute instead of the fifth hour."

*Click the action button on the card.*

> "And it is not just text. One click puts the circuit on the map and selects it. The operator always confirms. The system advises. The human decides."

### 1.6 Close point 1 — 30 sec

*Click **Reset**.*

> "Two last things quickly.
>
> **Burn hours** — the system tells you which lamps are near the end of their life, so you replace them in a planned night shift, not during an aircraft movement.
>
> **Insulation resistance** — the number I mentioned. Cable insulation falls slowly before a cable actually fails. We watch that trend on every circuit. That is how you catch the next cable problem **before** it closes your runway.
>
> That is airfield lighting. Any questions before I move to passengers?"

---

## POINT 3 — Passenger Experience and Operational Efficiency (4–5 min)

> "Your second point is the passenger journey — from the aircraft arriving, to the passenger leaving the airport. Let me follow one arriving passenger."

### 3.1 The aircraft arrives — 60 sec

*Stay in **Airside Operations** → tab **Apron Management**.*

> "The passenger journey does not start in the terminal. It starts here, at the stand.
>
> These are the parking stands with their **ADB Safedock** docking displays — the screen the pilot looks at. Same vendor as the lighting, so one integration covers both.
>
> Let me dock an aircraft."

*Select a free stand → choose aircraft type **A320** → click **Dock**.*

> "Watch the docking display. It is capturing the aircraft, aligning it, and counting the metres to the stop point. Now — **STOP**. The aircraft is on the stand.
>
> The moment the chocks go on, that time is recorded. **That timestamp is the clock everybody works to** — the bridge, the fuel, the ground power, the baggage team.
>
> Around the stand you see the equipment: passenger boarding bridge, ground power, pre-conditioned air, fuel, floodlights, emergency stop. All live."

*Click **PBB Disconnect** in Fault Injection.*

> "Now the airbridge has a problem. The stand goes red immediately.
>
> Why does this matter for passenger experience? The passengers are sitting inside the aircraft. Nobody in the terminal knows yet. Here, the operations centre knows **now** — and can tell the terminal team before 180 people start waiting."

*Click **Reset all**.*

### 3.2 Inside the terminal — comfort and the building — 45 sec

*Go to **Terminal & Passenger** → tab **Building Management**.*

> "Now the passenger is inside the building.
>
> Comfort is not a feeling — it is the building working properly. Here are the **subsystems of the terminal**: air conditioning, baggage handling, docking, electrical, SCADA, access control, public address, fire alarm, clocks, stands, screening, gate access.
>
> Each one shows availability and open alerts. If the air conditioning in the Arrivals Hall is failing, the passenger feels it as heat — and here it appears as an alert **before** it becomes a complaint.
>
> And it is not only alerts. There are tabs for **Alerts, Incidents, SOPs, Work Orders and the Asset Register** — so the problem becomes an action with an owner."

### 3.3 Baggage claim — 45 sec

*Go to tab **Terminal Overview** → click **Baggage Simulation**.*

> "Next: baggage. This is where passengers judge an airport, because they are standing and waiting.
>
> This is the baggage system live. You see the flight, the carousel, and the bags moving — bags tracked, in transit, screened, cleared.
>
> If a jam happens, we do not wait for a phone call. The system raises it and runs the SOP."

*Close the simulation.*

### 3.4 Queues and congestion — 60 sec ⭐

*Go to **Passenger Journey** in the left menu.*

> "Now the whole journey in one view. Every checkpoint the passenger passes.
>
> Green is fine. Yellow is getting busy. Red is a problem now.
>
> Look at **Security Screening** — red. **67 people in the queue, 18 minutes waiting, SLA at 68 percent** — and the important number: **12 staff on duty, 16 recommended**.
>
> That last line is the difference between a dashboard and an operations system. A dashboard tells you the queue is long. This tells you **why**, and **what to do**.
>
> Same at **Baggage Drop** — 42 waiting, 12 minutes, 4 staff where 6 are needed. And at the **Boarding Gate** — 89 waiting."

*Click **Security Screening**, show the tabs.*

> "Click any checkpoint and you get the detail: current numbers, trends over time, what the system thinks, the recommended actions, and the evidence behind it."

*Go back and click **Execute AI Recommendations** (or **Flow Optimization**).*

> "When the operator accepts, the numbers move. Flow efficiency up, journey time down, SLA up. The operator stays in control — the system only proposes."

### 3.5 Out of the airport — 30 sec

*Go to **Landside & Transport**.*

> "Last step — the passenger leaves. Parking zones, how full each one is, and how people are actually leaving: private car, taxi, ride-share, bus.
>
> The average time to find a parking space is here too. This is the last thing the passenger remembers about your airport."

### 3.6 Close point 3 — 20 sec

> "So that is the full journey — **aircraft on the stand, into the terminal, through baggage, and out the door** — on one screen, in one system."

---

## Closing — 45 seconds

> "To summarise the two points.
>
> **Airfield lighting** — every single light monitored in real time, on top of your existing ADB system. One click gives you the full detail of one light. When something fails, the system does not give you two hundred alarms. It tells you the one thing that is probably wrong, and where to look first.
>
> **Passenger experience** — the full journey from the aircraft to the exit door, with queue and congestion visible live, and the system recommending the action, not only showing the problem.
>
> Everything you saw is **one platform, one login**. It is not integrated later. It is one system.
>
> This same platform is already being deployed in **Vietnam**.
>
> Happy to go deeper on any screen you would like to see again."

---
---

# LONG SCRIPT (25–30 minutes)

> Use this **after** the short script, only if they say "show us more". Same order. Everything below is **additional** depth to layer in.

## L0. Extended opening — the operations problem (2 min)

> "One minute of context before the screens, because it explains every design choice you will see.
>
> A small airport today has maybe fifteen to twenty separate systems. Lighting has a system. The building has a system. Baggage, access control, fire, public address, docking — every one has a vendor, a screen, often its own room and its own operator.
>
> Three problems come from this:
>
> **One — nobody sees the whole airport.** When something goes wrong, three people in three rooms each see one piece.
>
> **Two — alarms, not answers.** Every one of those systems can produce hundreds of alarms. None of them can tell you which alarm is the cause and which are the effects.
>
> **Three — nothing becomes a job.** An alarm is seen, acknowledged, forgotten. No work order, no owner, no record.
>
> U-APOC is built for exactly these three: **one picture, one cause, one owner.**
>
> The left menu is the airport, not the software: Airside, Terminal and Passenger, Landside, Security, Maintenance, Commercial, Sustainability, SOPs, Analytics. An operator's role decides what they can see and do — and every action is recorded with the user and the time."

## L1. Airfield lighting — extended (10–12 min)

### L1.1 The map, properly (2 min)

Point at each part of the airfield as you speak.

> "Let me name what you are looking at, because this is your airfield, not a generic picture.
>
> The runway, 09 and 27 at the two ends, 3000 by 45 metres.
>
> **Approach lighting** at both ends — the lights the pilot sees before the runway.
>
> **PAPI** at both ends — four lights that tell the pilot if the approach angle is correct.
>
> On the runway itself: **edge lighting** in white down both sides, **centreline** down the middle, **touchdown zone** lighting, **threshold** in green at the start, **runway end** in red.
>
> Then the **taxiways** — green centreline, blue edge — with **stop bars** in red where a taxiway meets the runway.
>
> And three aprons with the parking stands.
>
> Every one of these is a separate light in the system, on its own address."

### L1.2 The serviceability rail — the compliance answer (1.5 min)

> "On the right is the part your regulator cares about.
>
> Each category has a **target** and a **present value**. The targets are not our numbers — they are **ICAO Annex 14**. Runway edge and centreline: 95 percent. Threshold, runway end, PAPI, stop bars: **100 percent** — safety-critical patterns, where one failure matters.
>
> Below that is the count: how many lights exist in each category, and how many have failed.
>
> This matters because of one question: **is my runway still legal to operate right now?** Today that is answered by a person walking the runway with a checklist. Here it is answered continuously — and the moment it stops being true, you know."

### L1.3 The four overlays (2 min)

Click each one as you explain it.

> "The same map answers four different questions. This is the **Overlay** control.
>
> **Status** — the normal view. What is on, what is off, what has failed.
>
> **Circuit** — colour the lights by which regulator feeds them. This is the maintenance view. When a whole colour goes dark, you are not looking at lamps. You are looking at one supply.
>
> **Comms** — who is still answering. This is the diagnostic view, and it is the important distinction I mentioned. A **failed** light says 'I am broken'. A **silent** light says nothing at all. Silent lights in a group means the problem is **upstream**, not in the lamps.
>
> **Intensity** — how bright each light actually is against what was commanded. Lights get dirty and get old. They dim slowly and nobody notices, until the day the runway is below its category. Here you see the drift.
>
> **Service** — which categories are below their ICAO target."

### L1.4 The faceplate, section by section (2.5 min)

Click one light and go through the panel slowly.

> "You asked to see each asset in detail. Let me go through the whole page.
>
> **The header** — the tag name, exactly as it exists in your ADB system, the description, the category, and the ADB product family. So when your maintenance team reads this and when they read the ADB system, it is the same name.
>
> **Realtime Values:**
> - Light status.
> - LINC 360 communication — is this light still answering the poll on the power line.
> - Luminous intensity, in candela. A **measurement**, not the command.
> - Maintenance mode.
> - Burn hours.
>
> **Control** — a real control, not a display:
> - On and off command.
> - Brightness setpoint in candela.
> - Maintenance mode, so a technician working on this light does not flood the control room with alarms.
>
> **Alarms** — what is active on this specific light.
>
> **Alarm Configuration** — the part your engineers will ask about. For each alarm type: the limit, the unit, and the **time delay** before it is raised. So one flicker does not become an alarm. You tune it per light.
>
> **Series Circuit** — the electrical picture:
> - The regulator model feeding this light.
> - The ACE3 monitoring unit.
> - The brightness step, 1 to 5 — what your operators actually use.
> - Rated current against measured current. The standard is 6.6 amps.
> - And the **insulation resistance**, in megohms.
>
> That last number is worth thirty seconds on its own."

### L1.5 Insulation — how you prevent the next cable cut (1 min)

> "Insulation resistance is the health of the cable itself.
>
> A cable does not usually fail suddenly. Water gets in, the insulation degrades, the resistance falls — over weeks. Then one day it fails, and the runway closes.
>
> We read this value on every circuit, every day. When one circuit starts falling behind the others, the system raises it as an advisory: *'cable insulation is worst on this circuit.'*
>
> That is a planned night-shift job. Not a five-hour runway closure."

### L1.6 Both movement sequences (2 min)

Run **Arrival RWY 09**, then **Departure RWY 27**.

> "Arrival first. Approach, PAPI on the glide slope, touchdown, rollout, vacating at the rapid exit, then follow-the-green all the way to the stand.
>
> Now the departure. The aircraft leaves the stand, taxis along the real taxiway to the runway 27 end, enters through the connector, lines up, and rolls.
>
> I want to be precise about something. The aircraft is not following a drawn line. It is being **routed across the actual taxiway centrelines** of this airfield. So the lights that turn green are genuinely the lights that aircraft passes. That is why this is worth watching — it behaves like the airfield, not like an animation."

### L1.7 The full fault set (2 min)

Go through several faults, resetting between each.

> "You can break anything here, and each one behaves differently, because each one *is* different.
>
> **Fail PAPI** — the glide slope indicator. Target 100 percent. Immediate operational impact on the approach.
>
> **Fail Threshold** — also a 100 percent target.
>
> **Fail Runway Lighting** — scattered edge failures. Watch the serviceability drop gradually rather than fall off a cliff. Different problem, different response.
>
> **Fail Taxiway** — lower target, 90 percent, because a taxiway failure is a delay, not a safety event.
>
> **Fail Approach Lighting.**
>
> And **CCR Output Failure** — the one we discussed. A whole loop, at once.
>
> Notice the pattern: **scattered failures mean the lamps. Simultaneous failures mean the supply.** That single distinction is the difference between sending a crew to a hundred and fifty lights and sending them to one cabinet."

### L1.8 Alarm to work order to close-out (1.5 min)

> "Let me follow one alarm to the end.
>
> Here is the alarm. Priority, the tag it belongs to, the limit that was broken, the value now, and how long it has been active.
>
> The operator **acknowledges** it — recorded, with who and when.
>
> Then **escalate** — and it becomes a work order with a number, a priority, and a status.
>
> On the right, the work order queue: open, dispatched, in progress, closed. Each one carries its history.
>
> One design decision worth mentioning. When a whole circuit fails, we do **not** raise a hundred and fifty work orders. We raise **one work order for the loop**. A crew visits that loop once. A hundred and fifty tickets is a worse backlog than none."

### L1.9 The AI advisory drawer in full (2 min)

> "Let me open the advisory drawer properly.
>
> It is scoped to the screen you are on. On the airfield console it shows what the **airfield's own live data** says — not a written list of demo text.
>
> Each card has the same structure, and the structure is deliberate:
> - **What it saw** — the observation.
> - **In plain words** — because the night operator is not an engineer.
> - **The evidence** — every point it used. You can check each one yourself on this screen.
> - **The recommendation** — what to do first.
> - **The confidence**, and **which systems the data came from**.
> - An **action button** that actually moves the console.
>
> The cards include:
> - A category below its ICAO target.
> - A whole loop dark, with the standby-changeover check.
> - Serious alarms nobody has been assigned.
> - Lamps near end of life, grouped into one batch job.
> - The cable insulation trend.
> - Lights dimmer than commanded.
> - Circuits running too bright for daylight — energy and lamp life.
>
> One principle, please note it: **advisory only, operator confirms**. The system never acts on the airfield by itself. Every recommendation waits for a human."

## L3. Passenger experience — extended (10–12 min)

### L3.1 Frame the journey properly (1 min)

> "Let me set this up as a journey, because that is how you asked for it.
>
> The passenger arrives on an aircraft. The aircraft parks. The bridge connects. The passenger walks into the terminal, goes through immigration, waits for a bag, clears customs, leaves the building.
>
> Every one of those steps is a different system in a normal airport. I will walk the same path in one screen."

### L3.2 The stand and the turnaround clock (2.5 min)

In **Apron Management**:

> "The stand view. Six stands, each with its Safedock docking display, ADB SAFEGATE — the same vendor as your lighting.
>
> Let me dock an aircraft and talk through the sequence.
>
> **Capturing** — the system has found the aircraft. **Aligning** — checking it is on the centreline of the stand. **Closing** — counting down the metres. **Stopped** — the pilot has hit the stop position. **Docked**.
>
> Now the equipment around that stand: passenger boarding bridge, ground power unit, pre-conditioned air, fuel, apron floodlighting, emergency stop, fire call point.
>
> Two of those matter directly to passenger comfort. **Pre-conditioned air** is the air conditioning of the aircraft while it is on the ground. **Ground power** keeps the lights and air on inside the cabin. If either fails, passengers feel it inside the aircraft within minutes.
>
> And the chocks-on time. That is the start of the turnaround clock. Everything after it — disembarkation, baggage, cleaning, fuel, boarding — is measured from that moment.
>
> Let me inject a fault."

Inject **PBB Disconnect**, then **GPU Overload**:

> "Bridge disconnected. Ground power overloaded. The stand goes red, the alarm is raised, and the terminal side knows before the first passenger complains.
>
> This is what 'operational efficiency' means in practice — not a report at the end of the month, but the terminal team knowing thirty seconds after the apron team."

### L3.3 The terminal building — comfort as engineering (2.5 min)

In **Terminal & Passenger → Building Management**:

> "Passenger comfort in a terminal comes from three things: temperature, information, and not standing in a queue. Let me take the first.
>
> These are the terminal subsystems. Each card shows availability and open alerts:
> - **HVAC** — the air conditioning.
> - **Baggage Handling.**
> - **Visual Docking Guidance.**
> - **Central electrical monitoring.**
> - **SCADA** — the supervisory layer.
> - **Security and Access Control.**
> - **Public Address** — how you speak to passengers.
> - **Fire Alarm.**
> - **Master Clock.**
> - **Aircraft Stand System.**
> - **Security Screening.**
> - **Gate Access Control.**
>
> Click into any one and you get its KPIs against target, its alerts, its equipment list, its work orders, and its communication log with the field devices.
>
> The zone map shows the terminal by area and by floor — Kerbside, Check-in halls, Security, Departure Lounge, Boarding Gates, Arrivals Hall, Baggage Reclaim, Immigration, Customs, and the plant rooms.
>
> So when a passenger says 'the arrivals hall is hot', you do not send someone to walk around. You look at the zone, find the air handling unit serving it, and see whether it is running, what it is delivering, and whether it has an open alert.
>
> Across the top: **Alerts, Incidents, SOPs, Work Orders, Asset Register.** An alert becomes an incident, an incident runs an SOP, the SOP produces a work order. That chain is the whole point."

### L3.4 Baggage in depth (2 min)

Open the **Baggage Simulation** from Terminal Overview:

> "Baggage. This is where an airport is judged, because it is the only part of the journey where the passenger has nothing to do but wait.
>
> This is the baggage system running. You see the arriving flights, which carousel each one is assigned to, and the bags moving through the system.
>
> The counters: bags tracked, in transit, screened, cleared, on chute, and SOPs fired.
>
> Screening is here too — the scanners and their status.
>
> If a bag is flagged, or a conveyor jams, or a bag is unattended, the SOP fires automatically and you can watch the steps being executed. That was a specific point raised earlier — an alarm must escalate into a workflow, not just sit in a list. It does."

### L3.5 The journey board and congestion (3 min)

In **Passenger Journey**:

> "Now the whole journey as one board. Every checkpoint, with the same five numbers:
>
> - How many people are in the queue **now**.
> - The average wait.
> - **SLA compliance** — are we meeting our own service promise.
> - Throughput — people per hour.
> - Staff on duty **against staff recommended**.
>
> Let me read the board as an operator would.
>
> **Terminal Entry** — green. 15 waiting, 2 minutes. Fine.
>
> **Check-in** — green. 23 waiting, 8 minutes, 94 percent SLA.
>
> **Baggage Drop** — yellow. 42 waiting, 12 minutes, SLA down to 78 percent. Four staff, six recommended. This is where it started.
>
> **Security Screening** — red. 67 waiting, 18 minutes, SLA 68 percent, twelve staff against sixteen recommended. And the trend is down 15 percent.
>
> **Immigration** — green, because it has the staff it needs.
>
> **Boarding Gate** — yellow. 89 people.
>
> Now read it as a story instead of six numbers. Baggage drop was slow. That pushed people late into security. Security is now the bottleneck. And that will hit the boarding gates in twenty minutes. **One under-staffed position at 6 a.m. becomes a delayed departure at 8 a.m.**
>
> That is what congestion management means, and it is why the staffing recommendation sits on the same card as the queue length.
>
> Click into any checkpoint and you get five tabs: the current picture, trends over time, the system's reading, recommended actions, and the evidence behind each one."

Then click **Execute AI Recommendations**:

> "And when the operator accepts the recommendations, the board responds. Flow efficiency up. Journey time down. SLA up. Bottlenecks down.
>
> And nothing happened until a person clicked."

### L3.6 The systems behind the journey (1.5 min)

In **Passenger Systems**:

> "One level down, for completeness. These are the IT systems the journey depends on:
>
> **CUPPS** — the common-use check-in desks. **CUSS** — the self-service kiosks. **PTS** — passenger tracking. **BHS** — baggage. **SACS** — security access. **PCDS** — the passport control displays.
>
> Look at this one — passport control is **offline**, and it has lost the connection to the immigration database.
>
> This is why we show it. The queue at immigration will grow in the next ten minutes, and the reason is not staffing and not passengers. It is a system. The operations centre sees the cause and the effect on the same screen."

### L3.7 Landside — the exit (1 min)

In **Landside & Transport**:

> "And the passenger leaves.
>
> Parking by zone, how full each one is, and the revenue.
>
> How people actually leave: private car 45 percent, taxi 28, ride-share 18, bus and shuttle 9. That mix decides how you design the kerbside.
>
> And the average time to find a parking space — currently 4.6 minutes, and rising.
>
> The airport's job does not end at the terminal door, and neither does this screen."

### L3.8 Analytics — the management view (1 min)

In **Analytics & Reporting**:

> "Finally, the layer above the operator. Everything you have seen is recorded — every alarm, every acknowledgement, every work order, every queue reading.
>
> So the monthly management question stops being an opinion. How many times was the runway lighting below its ICAO target? How long did we take to close work orders? What was the actual average wait at security last Tuesday between six and eight in the morning?
>
> The operations screen answers 'what is happening now'. This answers 'are we getting better'."

## L4. Extended close (1.5 min)

> "Let me close with three things.
>
> **First — one platform, not an integration project.** Airfield lighting, the apron, the terminal building, baggage, passengers, landside. One login, one URL. You are not buying six systems and a middleware layer.
>
> **Second — we sit on top of what you already own.** ADB SAFEGATE for lighting and docking. Your SCADA. Your existing controllers. Nothing gets replaced. We read, we correlate, and we give you one picture.
>
> **Third — the system tells you the cause, not the symptoms.** Two hundred alarms is not information. 'This one regulator failed and your standby may not have taken over' is information. That is the difference between a dashboard and an operations centre.
>
> And this is running today, being deployed in Vietnam. Palu and Samarinda would not be an experiment.
>
> What would you like to see again?"

---
---

# Q&A — expected questions and short answers

Keep answers short. If it goes deep technical, hand it to Ajit or park it.

| They ask | You say |
|---|---|
| **"Is this real data or a simulation?"** | "Today it is a simulation, because your lighting system is not connected yet. But the data model is built on the real ADB SAFEGATE structure — the tags, the circuits, the ACE3 units, the LINC 360 monitoring. When we connect to your system, the screens do not change. Only the source of the numbers changes." |
| **"Will you integrate with ADB SAFEGATE?"** | "Yes. That is the design. We read from the ADB CORTEX control system. Same for the Safedock docking displays. One vendor, one integration." |
| **"Can you detect exactly where a cable is cut?"** | *Be honest — honesty scored well on this last time.* "Not the exact metre. Finding the exact point on a cable needs a special instrument — a physical test, and no monitoring software can do it. What we do is narrow it down, and more importantly tell you the fault is **in the supply, not in the lamps**, in the first minute. And we check whether your standby actually took over. In your incident, that is where the hours went." |
| **"Do you control, or only monitor?"** | "Both. From the light faceplate you can switch on and off, change the brightness setpoint, and set maintenance mode. But every AI recommendation is advisory — the operator confirms. We do not let a model command the airfield." |
| **"What about centralised HMI control?"** | "Control screens are here at the asset level. For a full centralised HMI, that is a scope discussion — Ajit and Sayaji can confirm what is included for Palu and Samarinda." *Do not over-promise.* |
| **"What about cyber security?"** | "A proper question, and we have prepared it separately. Role-based access and a full audit trail — who logged in, when, and what they changed — is built in. For network and threat protection, Ajit has slides. Can we take that as the next item?" |
| **"Can this do A-CDM?"** | "Not needed at fifteen flights a day, and we are not proposing it now. But yes, the platform extends to it — as long as we get data from the tower and the AODB, the logic can be built on top of what you saw. Sayaji is preparing a short note on that." |
| **"Is this live anywhere?"** | "Yes. It is being deployed in Vietnam. This is not a concept." |
| **"How long to deploy at Palu and Samarinda?"** | "That is a scoping answer, not a demo answer — it depends on how the ADB system and the terminal systems expose their data. Can we take it offline with the commercial team?" |
| **"Can it work if we add more airports later?"** | "Yes. That is the point of building it this way — same platform, same screens, a different airfield layout and asset list. That is how ten airports become two hundred without ten different systems." |
| **"What if the network goes down?"** | "The lighting keeps working. We are a monitoring and supervisory layer on top of the ADB system — we do not sit in the safety path. If we lose the link, your lighting is unaffected, and we show the link as lost, which is itself an alarm." |

---

# Language notes — say this, not that

| Say | Do not say |
|---|---|
| Terminal Management / Building Management | HBMS *(Sayaji corrected this explicitly)* |
| Unified Airport Operations Center / U-APOC | "the tool", "the app" |
| "We sit on top of your ADB system" | "We replace your system" |
| "The system recommends, the operator decides" | "The AI does it automatically" |
| "One light", "one circuit", "one regulator" | "assets", "nodes", "entities" |
| "It is being deployed in Vietnam" | "We could build this" |
| "That is a scoping question, let us take it offline" | Guessing at timelines or prices |

**Speaking style for this audience:** short sentences. One idea per sentence. Pause after each screen change. Do not read numbers faster than they can look at them. Ask "any questions on this before I move on?" after each of the two points — it gives them permission to engage, and it tells you whether to open the long script.

---

# One-page cheat sheet (print this)

```
LOGIN            admin / Astrikos2026
BEFORE START     AGL tab -> Reset -> 100.0%  ·  Speed 4x  ·  close panels

POINT 1 - AIRFIELD LIGHTING        Airside Operations -> Airfield Ground Lighting
  1  Map + "898 lights, 12 circuits, on top of ADB"      45s
  2  Click a light -> faceplate detail                   60s   <- what they asked for
  3  Arrival RWY 09 -> PAPI, touchdown, follow-the-green 60s
  4  Fail Threshold -> red map, target breach, escalate  45s
  5  Reset -> CCR Output Failure -> AI Advisory          90s   <- THE CABLE-CUT STORY
  6  Burn hours + insulation = prevent the next one      30s

POINT 3 - PASSENGER                Airside -> Apron Mgmt, then Terminal & Passenger
  1  Dock A320 -> Safedock STOP -> chocks clock          60s
     PBB Disconnect -> terminal knows before passengers
  2  Building Management -> 12 subsystems -> comfort     45s
  3  Terminal Overview -> Baggage Simulation             45s
  4  Passenger Journey -> Security RED 67/18min/12-of-16 60s   <- congestion + staffing
     -> Execute AI Recommendations -> numbers move
  5  Landside -> parking, taxi/bus mix, exit             30s

CLOSE            one platform · on top of ADB · cause not symptoms · live in Vietnam
```
