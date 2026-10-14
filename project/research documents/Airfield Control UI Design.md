# **Architectural and Visual Design of Airport Surface Operations Control Interfaces**

## **Introduction**

The orchestration of airport surface operations demands a flawless synthesis of human cognition, industrial automation, and highly specialized surveillance technologies. In modern air traffic control (ATC) environments, apron management facilities, and airport operations centres (APOC), operators interact with an interlocking ecosystem of control-room software to manage the intricate choreography of aircraft, ground support equipment, and airfield infrastructure. These systems encompass Advanced Surface Movement Guidance and Control Systems (A-SMGCS), Airfield Lighting Control and Monitoring Systems (ALCMS), Airport Operational Databases (AODB), and the rapidly emerging field of Remote and Digital Tower platforms.  
The graphical user interfaces (GUIs) driving these platforms—developed by industry leaders such as Saab, Frequentis, Indra, ATRiCS, Searidge, Honeywell, ADB SAFEGATE, OCEM, ATG Airports, SITA, Amadeus, AVEVA, and Siemens—are not the product of arbitrary graphic design. Rather, they are the result of rigorous human factors engineering, heavily constrained by a matrix of international aviation mandates and industrial process standards. The primary directive of these interfaces is the maximization of operator situational awareness and the minimization of cognitive load, ensuring that critical anomalies, from degraded runway lighting to impending runway incursions, are recognized pre-attentively within seconds1.  
Designing these systems requires reconciling a fundamental tension: the need to present thousands of highly dynamic, safety-critical data points—often dictating the use of exact photometric colors mapped to the physical world—against the modern HMI philosophy of suppressing color to highlight only abnormal states. This exhaustive report analyzes the architectural, visual, and interaction design of professional surface operations software, detailing the exact graphic treatments, symbology, color palettes, and interaction models that constitute current industry best practices.

## **Regulatory Frameworks and HMI Design Standards**

The visual language of surface operations displays is synthesized from stringent aviation safety requirements and industrial automation standards. Modern HMI development sits exactly at the intersection of civil aviation authorities (ICAO, FAA, EUROCAE) and industrial instrumentation bodies (ISA, EEMUA). Understanding the visual layout of any ALCMS or A-SMGCS requires first understanding the constraints imposed by these regulatory frameworks.

### **ISA-101 and the High-Performance HMI Philosophy**

The International Society of Automation (ISA) standard 101, titled "Human Machine Interfaces for Process Automation Systems," fundamentally redefined control room design3. Earlier generations of software relied on highly saturated, skeuomorphic graphics, often featuring black or bright blue backgrounds with vividly colored mimics of physical infrastructure. This approach led to chronic "alarm masking," a cognitive failure where operators, overwhelmed by visual clutter, could not quickly discern new alarms from the background noise1.  
The ISA-101 High-Performance HMI (HPHMI) methodology dictates that the primary purpose of any display is the immediate detection of abnormal situations1. To achieve this, modern control room displays utilize subdued, low-contrast gray backgrounds. Typical base colors span 60% to 70% gray, rendering the display as a neutral visual field1. Process equipment, pavement outlines, and non-critical status indicators are rendered in desaturated tones—light grays, subdued blues, or muted charcoal2. Crucially, ISA-101 mandates that highly saturated colors must be reserved exclusively for abnormal states, deviations, and active alarms6. Furthermore, the standard requires the implementation of a strict Level 1 through Level 4 display hierarchy, ensuring that operators can transition smoothly from macro-level situational awareness to micro-level equipment diagnostics without losing their mental model of the system2.

### **EEMUA 191, ISA-18.2, and Alarm Management**

Operating concurrently with ISA-101 is EEMUA 191 (Alarm Systems: A Guide to Design, Management, and Procurement) and the aligned ISA-18.2 standard7. In the context of an ALCMS or an interconnected A-SMGCS, a localized power fluctuation or a network failure could theoretically trigger thousands of individual lamp fault alarms simultaneously. EEMUA 191 provides the framework for alarm rationalization, state transitions, and presentation to prevent these cognitive "alarm floods"2.  
The standard dictates specific visual and geometric treatments for different alarm priorities, ensuring that alarms are perceptible regardless of operator color vision deficiencies3. Industry practice universally divides alarms into distinct priority bands associated with specific hues and shapes. Priority 4 (Highest/Critical) utilizes high-saturation red paired with specific geometries, such as flashing squares or triangles. Priority 3 (High) utilizes yellow or amber. Priority 2 (Normal) relies on orange, Priority 1 (Low) on magenta, and Priority 0 is reserved for blue diagnostic events6. By binding shape alteration to color, EEMUA 191 ensures that an unacknowledged alarm flashes dynamically, transitioning to a solid state only once the controller has acknowledged the event, yet still commanding visual priority until the underlying fault is resolved1.

### **ICAO Doc 9830 and EUROCAE ED-87**

The operational functionality and visual presentation of Advanced Surface Movement Guidance and Control Systems (A-SMGCS) are governed by ICAO Doc 9830 (A-SMGCS Manual) and EUROCAE ED-87 (Minimum Aviation System Performance Specification for A-SMGCS)10. These documents segment A-SMGCS into distinct services: Surveillance, Airport Safety Support, Routing, and Guidance10.  
ED-87 mandates precisely what information must be presented to the controller. This includes accurate geographic layouts, runway and taxiway status (e.g., active, closed), and the electronic identification of targets11. More critically, it defines the Stages of Alert for the Airport Safety Support Service. For example, if an aircraft breaches a protected area, ED-87 requires the system to escalate through informational alerts to critical warnings, dictating that the HMI must visually emphasize conflicts like Runway Incursions or Taxiway Type alarms above all other display elements10. The standard also dictates the necessity of standardized symbology to differentiate visually between positively identified transponder-equipped aircraft, unidentified primary radar tracks, and specialized ground vehicles.

### **FAA Advisory Circulars and ICAO Annex 14**

While ISA-101 advocates for the suppression of color, Airfield Lighting Control and Monitoring Systems (ALCMS) face a contradictory requirement. The physical visual aids on an aerodrome are strictly governed by ICAO Annex 14 Volume 1 and Federal Aviation Administration (FAA) Advisory Circulars, most notably AC 150/5340-30 (Design and Installation Details for Airport Visual Aids) and the 150/5345 series12.  
These directives dictate the exact photometric output of lighting fixtures. Taxiway edge lights must be aviation blue; taxiway centerlines must be aviation green; runway guard lights must be flashing yellow; and runway centerlines must alternate red and white in the final touchdown zones12. Consequently, ALCMS interface designers must utilize these exact, highly saturated photometric colors to represent the physical lights on the screen. This creates an inherent conflict with the ISA-101 principle of reserving bright colors solely for alarms. Resolving this tension—allowing the operator to view a mathematically precise, brilliantly colored representation of the airfield lighting while still being able to instantly detect a localized lamp failure—is the defining architectural challenge of ALCMS display engineering.

## **Topography and Airfield Surface Rendering**

In both high-fidelity A-SMGCS platforms (such as Saab's TRADIS, Indra's InNOVA, and Frequentis's surface managers) and top-tier ALCMS solutions (such as ADB SAFEGATE's CORTEX), the physical layout of the aerodrome serves as the foundational visual canvas19. The transition from legacy monochromatic radar screens to modern digital displays has fundamentally revolutionized how this surface topography is drawn and managed.

### **Polygonal Rendering vs. Vector Centerlines**

Historically, airfield displays rendered the environment using simple vector line data, where a taxiway was merely a 10-pixel-wide line drawn over a black background. Modern professional systems ingest highly detailed Aerodrome Mapping Databases (AMDBs) to render the pavement as true geographic polygons.  
This architectural shift is not merely an aesthetic enhancement; it is a mathematical and operational necessity. When a system renders a taxiway as an exact polygon that includes precise fillets (the flared, curved pavement transitions at runway intersections), it enables advanced spatial algorithms. A-SMGCS routing logic and runway incursion algorithms calculate wingtip clearances, protected area boundaries, and Stop Bar proximities based on the actual physical edges of the pavement10. Visually, rendering true polygons allows the GUI to seamlessly highlight a specific taxiway segment by flooding the polygon with a low-opacity color without the highlight bleeding over into adjacent, non-cleared intersections23.

### **Stroke, Fill, and Texture Treatments**

The rendering of the surface adheres strictly to the low-contrast, minimal-glare principles of high-performance HMI6. The visual treatment prioritizes the contrast of active elements—moving targets and energized lighting—by pushing the physical infrastructure into the perceptual background.  
Runways are typically represented with a slightly lighter fill than the surrounding taxiways to establish an immediate visual hierarchy1. The stroke (outline) is rendered as a crisp, 1-pixel solid line, usually in a darker gray or black. Runway centerlines, threshold markings, and touchdown zone indicators are rendered using precise dashed vector lines overlaid on the polygon. Taxiways and aprons are rendered in neutral, mid-to-dark grays. Aprons may utilize a subtly different hue or transparency level to differentiate them from active movement areas, ensuring controllers recognize where ATC jurisdiction ends and apron management begins.  
Non-load-bearing surfaces, shoulders, and blast pads are visually distinguished from load-bearing pavement, often rendered using a subtle diagonal hatching or a semi-transparent fill. This provides a semantic indication of restricted areas. Grass and unpaved off-field areas present a specific challenge. While legacy systems utilized bright, saturated greens to mimic grass, ISA-101-compliant systems recognize that a vast field of green creates overwhelming color competition with critical green taxiway centerline lights. Therefore, modern systems render grass as a highly desaturated, dark olive-gray, or simply leave it as the negative space of the base background color, ensuring it recedes entirely from the operator's attention1.

### **Color Palettes: Day, Night, and Low-Visibility Modes**

Control room ambient lighting varies drastically depending on the time of day, the weather, and the architectural design of the control tower. To prevent operator fatigue, glare, or the destruction of night vision, professional displays offer instantaneous mode switching.

| Surface Element | Day Mode (Hex / Tone) | Night Mode (Hex / Tone) | Rationale (ISA-101 & Ergonomics) |
| :---- | :---- | :---- | :---- |
| **Base Background** | \#969696 (Mid Gray) | \#121212 (Near Black) | Minimizes glare; provides a neutral field allowing dynamic targets and alarms to contrast sharply1. |
| **Runway Fill** | \#B0B0B0 (Light Gray) | \#3A3A3A (Dark Gray) | Ensures highest baseline contrast among pavement types for rapid operator orientation. |
| **Taxiway Fill** | \#808080 (Dim Gray) | \#252525 (Very Dark Gray) | Clearly distinguishes active movement areas from the non-paved background. |
| **Grass / Off-field** | \#8A938A (Desat. Olive) | \#080A08 (Deep Charcoal) | Recedes visually; prevents color competition with photometric green lights1. |
| **Non-Movement Area** | \#757575 with \#606060 hatch | \#1E1E1E with \#151515 hatch | Semantic indication of non-ATC controlled or non-load-bearing areas. |

During Low-Visibility Procedures (LVP), the contrast ratio between active routing paths and the background is often artificially heightened. For instance, if an aircraft is guided by an automated "Follow the Greens" (FtG) service, the active taxiway polygon might be subtly illuminated with a low-opacity green wash (e.g., \#004400 in night mode) to reinforce the centerline lighting route10.

## **Airfield Lighting Control and Monitoring Systems (ALCMS)**

Specialized systems such as ADB SAFEGATE’s CORTEX ALCMS and COSAL, OCEM's control architectures, and ATG Airports' interfaces are tasked with the manipulation and real-time monitoring of thousands of individual lighting fixtures21. The HMI must allow operators to issue macro-commands (switching entire categories of lights, such as all taxiway edge lights), micro-commands (controlling individual Constant Current Regulators in a series circuit), and manage granular Individual Light Control and Monitoring Systems (ILCMS)18.

### **Symbolization of Lighting Fixtures**

Because ALCMS interfaces map directly to physical visual aids mandated by FAA AC 150/5340-30 and ICAO Annex 14, the symbology is highly standardized and exact12. A single pixel inaccuracy can misrepresent the airfield state to the controller.

* **Omnidirectional Lights (e.g., Taxiway Edge):** Elevated or in-pavement edge lights, which shine in all directions, are symbolized as simple solid dots or small 3x3 to 5x5 pixel circles. The fill color perfectly matches the photometric output (e.g., \#0000FF for aviation blue).  
* **Directional Lights (e.g., Runway Edge, Centerline):** Lights intended to be viewed from a specific approach vector are symbolized as chevrons, teardrops, or semi-circles, with the apex pointing in the direction of the photometric beam. This ensures the controller knows exactly which way the light is casting.  
* **Bars and Barrettes (e.g., Stop Bars, Approach Lights):** A physical Stop Bar is not drawn as a series of individual dots; it is rendered as a continuous, thick (typically 4-pixel) red line drawn precisely across the taxiway polygon at the holding point18. Approach lighting systems (ALSF-1/2) are rendered as a series of barrettes—short, thick rectangular blocks that mimic the physical transverse crossbars extending into the approach path.  
* **Bidirectional and Split-Color Fixtures:** Runway centerline lights alternate white and red towards the termination of the runway. Taxiway lead-off lights alternate green and yellow16. In the ALCMS GUI, these complex fixtures are handled by rendering a split circle or back-to-back chevrons. The software ingests the active runway direction state; the half of the symbol facing the active approach direction is illuminated (filled with white or green), while the trailing half is rendered as inactive (hollow or dark gray). This guarantees the controller's mental model matches exactly what the pilot sees on the surface.

### **Circuit, Loop, and CCR Visual Grouping**

An ALCMS does not merely display geographic locations; it must accurately visualize electrical topology. Airfield lights are powered by series circuits driven by Constant Current Regulators (CCRs) located in field substations27. When a maintenance operator interacts with the ALCMS, they need to visualize these electrical groupings to isolate faults.  
When an operator hovers over or clicks a CCR icon in the equipment panel, the HMI temporarily overrides the standard view. All lighting fixtures powered by that specific loop illuminate at full brightness on the geographic display, while all unrelated lights dim to a low-opacity state. Furthermore, the subterranean cable routing connecting these lights is often overlaid as a dashed line.  
This visualization is critical for interleaved circuits. Stop bars and critical runway centerlines are often powered by interleaved loops (e.g., Circuit A powers lights 1, 3, 5; Circuit B powers lights 2, 4, 6\) to ensure redundancy if one CCR fails. The HMI represents this seamlessly: toggling "Circuit A" instantly illuminates every alternate dot on the screen, allowing the operator to visually verify the interleaved engineering design.

### **Alarm and Fault State Presentation**

A critical challenge in ALCMS design is indicating a fault (such as a lamp failure, earth fault, or communication loss) without violating the photometric color scheme or ISA-101 principles1. If an aviation red runway edge light burns out, changing its icon to "red" to indicate a fault is useless and dangerously ambiguous, as red is the light's normal operational state.  
Professional systems resolve this through shape alteration, animation, and secondary graphical indicators:

* **Lamp Failure:** If the ILCMS detects a burnt-out lamp, the solid filled dot becomes hollow (matching the background color), and is surrounded by a high-contrast magenta (Priority 1\) or yellow (Priority 3\) square outline, depending on the criticality of the fixture. This shape change indicates a "loss of state" without altering the color identity of surrounding active lights6.  
* **Communication Loss:** Modern systems rely on smart remotes (like ADB SAFEGATE's LINC 360 module, communicating via power line telemetry31). If a remote stops responding, the specific light symbol is overlaid with a standard gray diagonal cross (an 'X'), and a Priority 3 alarm is logged in the system's global alarm banner.  
* **Unintended Illumination:** If an operator commands a light OFF, but the monitoring sensor detects current flow, the symbol flashes rapidly between its photometric color and a high-contrast warning state. This represents a severe safety risk (e.g., a green lead-on light remaining energized across an active runway), demanding immediate visual precedence.

### **Faceplates and Interaction Panels**

Clicking a CCR, a circuit block, or a specific lighting segment on the overview map opens a "Faceplate"—a dedicated modal detail panel2. Following ISA-101, faceplate designs are rigidly standardized across the application1.  
A standard CCR faceplate features an analog-style dial or a vertical bar graph showing the exact current output (e.g., 6.6 Amps). This is preferred over a simple digital numeric readout because it allows the operator to pre-attentively grasp where the current sits relative to the normal operating band, which is demarcated by a light gray or pale blue background zone on the gauge1. Control actions are facilitated by explicit step-control buttons (e.g., OFF, Step 1, Step 2, Step 3, Step 4, Step 5\) utilizing high-contrast, bold text. Additionally, a localized alarm banner resides within the faceplate, displaying specific telemetry such as insulation resistance measurements (measured by systems like the COSAL IME26) and lamp failure percentages specific to that individual circuit.

## **Advanced Surface Movement Guidance and Control Systems (A-SMGCS)**

A-SMGCS displays—typified by Saab’s I-ATS (TRADIS), Indra’s InNOVA, Frequentis’s surface managers, ATRiCS solutions, and Honeywell's tower information systems—are the primary tactical instruments for air traffic controllers19. These systems fuse raw and processed data from Surface Movement Radar (SMR), Multilateration (MLAT) networks, and Automatic Dependent Surveillance-Broadcast (ADS-B) to provide an unambiguous, real-time picture of all moving targets on the surface38.

### **Target Rendering and Symbology**

The rendering of aircraft and vehicles is heavily constrained by EUROCAE ED-87, ensuring standard symbology across different ANSP implementations10.  
A correlated aircraft—one that is actively transmitting a squawk code linked to a known flight plan—is drawn as a sharp, directional chevron or a stylized delta wing, indicating its exact heading23. The fill color is typically distinct and high-contrast relative to the gray background (e.g., bright cyan, pure white, or light green for arrivals vs departures). Conversely, uncorrelated tracks (returns generated purely by primary surface radar without secondary identification) are drawn as simple squares or circles. Because their heading is mathematically inferred rather than broadcast, the non-directional shape prevents the controller from assuming a false orientation.  
Ground vehicles (tugs, fire trucks, follow-me cars) are distinguished entirely by shape, typically rendered as hollow squares or diamonds. To aid controllers in predicting movement, active targets feature a "leader line" protruding from the nose, indicating the vehicle's projected position in 10, 30, or 60 seconds based on its current velocity vector. Furthermore, a brief trail of fading dots (termed "history hits") follows the target, providing instant, intuitive visual feedback on acceleration, braking, or turning dynamics39.

### **Target Labels (Data Blocks)**

Every identified target is tethered to a dynamic label block, commonly referred to as a tag. Because a busy hub airport can have hundreds of targets active simultaneously, labels are a primary source of visual clutter. Modern A-SMGCS GUIs implement sophisticated, physics-based anti-overlap algorithms37. Labels are connected to their respective targets by a thin, flexible leader line. As targets converge, the labels automatically repel each other to prevent occlusion, ensuring text remains readable at all times.

* **Content:** A standard Level 2 label contains the core tactical data: Callsign (e.g., BAW124), Aircraft Type (B77W), and Ground Speed (15 kt).  
* **Interaction:** Hovering over a label with the cursor expands it to Level 3, revealing detailed route clearances, assigned stands, and the discrete squawk code. Controllers can click and drag labels to manually pin them in uncluttered areas of the screen, overriding the anti-overlap algorithm for specific critical flights.

### **Routing, Clearances, and "Follow the Greens" (FtG)**

Modern A-SMGCS implementations include automated Routing and Guidance services10. When a controller clears an aircraft to a gate, the system computes the optimal taxi route based on current runway configurations and traffic density.  
The cleared route is rendered on the HMI as a thick, semi-transparent colored line (often green or blue) layered directly over the taxiway polygon, connecting the aircraft symbol to its destination23. In advanced implementations equipped with ILCMS (such as ADB SAFEGATE's RELIANCE system18), the A-SMGCS route is electronically synchronized with the ALCMS. This enables "Follow the Greens" (FtG) operations. As the aircraft moves, the A-SMGCS dynamically commands the physical green taxiway centerline lights to illuminate ahead of the aircraft and deactivate behind it. On the HMI, the controller sees a real-time visualization of this exact behavior—a "light bubble" physically moving with the aircraft icon across the digital map.

### **Conflict Resolution and Safety Alerts**

If the system's routing logic detects a spatial conflict (e.g., two aircraft routed to the same intersection simultaneously), it generates predictive alerts. A "GIVE WAY" or "HOLD SHORT" symbol is dynamically generated at the specific conflict node on the map. Research into Airborne Separation Routing (ABSR) has demonstrated that integrating voice-recognized commands directly into the A-SMGCS visual output—for example, automatically highlighting the aircraft symbol and projecting the text "GIVE\_WAY" based on the controller's radio transmission—significantly reduces controller workload and radio congestion23.  
When an imminent safety violation occurs, such as an aircraft breaching an active Stop Bar or entering a runway without clearance, ED-87 dictates an immediate Stage 3 (Critical) Alarm10. The system reacts violently to ensure detection: the entire runway polygon flashes red, the offending aircraft target turns red, and a highly visible visual and audible alert dominates the GUI. This behavior supersedes all other ISA-101 display hierarchy rules, as it represents a direct threat to life6.

## **Airport Operational Databases (AODB) and Operations Centre Displays**

While ATC focuses exclusively on tactical movement, the Airport Operations Centre (APOC) manages turnaround, resource allocation, and terminal operations using sophisticated management systems from vendors like SITA, Amadeus, AVEVA, or Siemens. These displays transition fundamentally from geographic representations (scaled maps) to schematic layouts (Gantt charts and logical, top-down workflows).

### **Stand, Gate, and Docking Representation**

On an APOC overview display, the airport apron is abstracted to maximize data density. Each parking stand is represented as a tile or a highly simplified footprint. The color of this tile is driven purely by ISA-101 state logic, not physical geography. A neutral gray tile indicates an unoccupied stand. A subdued blue or neutral fill indicates an occupied stand operating within normal parameters. An amber or yellow tile indicates a turnaround delay or a resource conflict1.  
Advanced Visual Docking Guidance Systems (A-VDGS), such as ADB SAFEGATE's Safedock FleX, are deeply integrated into the AODB18. On the HMI, clicking a stand tile opens a miniature faceplate for the gate. This displays real-time telemetry from the A-VDGS: the expected aircraft type, the countdown to block-on, and the physical state of the laser scanner tracking the incoming nose wheel. When the aircraft successfully docks and engines are cut, the UI registers a precise "Block-On" timestamp, and the stand icon updates to show the chocked state, triggering the start of the turnaround timer.

### **Turnaround Resource Visualization**

APOC HMIs rely heavily on Level 2 and Level 3 dashboards2. A gate turnaround involves a complex orchestration of fueling, catering, cleaning, and baggage handling. These distinct activities are presented via nested timelines (Gantt charts) embedded within the stand faceplate. Small, desaturated icons representing ground support equipment (GSE) populate around the schematic aircraft symbol as telematics report their arrival at the gate. If a critical path item (e.g., fueling) exceeds its allocated time block, its specific progress bar turns amber. This triggers a localized deviation alert, drawing the apron manager's attention without flooding the entire screen in red, adhering perfectly to high-performance HMI philosophies1.

## **Remote and Digital Tower Systems**

One of the most profound architectural shifts in surface operations HMI is the advent of Digital/Remote Towers. Pioneered by companies like Searidge Technologies, Frequentis (smartVISION), Saab Digital Air Traffic Solutions, and Indra, the HMI in a digital tower is no longer a purely synthetic graphical map35. Instead, it is a live video feed fundamentally augmented with digital telemetry overlays.

### **Video Underlay and Symbology Overlay**

Digital towers utilize an array of high-definition optical and infrared cameras stitched together to create a seamless, 360-degree panoramic view of the airfield. This panorama is displayed on a semi-circle of large-format, high-resolution monitors surrounding the controller's working position42. The primary HMI challenge in this environment is maintaining the readability of text and symbology against a highly dynamic, unpredictable background (e.g., a bright sky, a dark tarmac, fog, rain, or sun glare).  
To ensure target labels (callsigns, speeds, aircraft types) remain legible regardless of the background, the HMI applies dynamic contrasting techniques. Text is rendered in pure white but features a sharp, 1- or 2-pixel black halo or drop shadow. In some vendor systems, a semi-transparent, dark gradient bounding box is placed behind the text block to guarantee a minimum contrast ratio.  
The system ingests A-SMGCS radar and MLAT data and algorithmically binds the digital labels to the physical pixels of the aircraft in the video feed42. As the plane physically taxis across the camera's field of view, the label follows it seamlessly.

### **Augmented Reality (AR) Geography**

To aid controllers in low visibility or at night, the software draws virtual boundaries directly over the video feed. Virtual stop bars, taxiway edges, and restricted airspace zones are rendered as colored vector lines draped mathematically over the physical video geometry42. If a physical aircraft obscures the location of the virtual line, advanced depth-mapping algorithms may mask the vector so it appears *behind* the aircraft, maintaining spatial realism and preventing the illusion of the aircraft floating.

### **Pan-Tilt-Zoom (PTZ) and Video Interaction**

While traditional SMR interfaces rely on mouse panning across a 2D map, digital towers incorporate physical and digital Pan-Tilt-Zoom (PTZ) camera controls directly into the GUI workflow42. If an operator needs to visually inspect a landing gear or a runway intersection, they use the HMI to draw a bounding box around the area of interest on the main panorama. A dedicated, high-optical-zoom PTZ camera automatically slews to that coordinate, opening a high-definition feed in a Picture-in-Picture (PiP) window or on a secondary detail monitor. The HMI also provides discrete toggles for visual enhancements, allowing the operator to activate infrared mode, low-light amplification, or algorithmic rain/fog filtering, which digitally adjusts the gamma and contrast curves of the base video layer to penetrate poor weather conditions42.

## **Level of Detail (LOD) and Interaction Paradigms**

Given the sheer density of information active on a modern airport surface, control room software cannot display every detail simultaneously without inducing cognitive overload. Software architects employ strict Level of Detail (LOD) strategies and semantic zooming to manage the flow of information2.

### **Semantic Zooming Strategies**

Unlike simple optical zooming (which merely scales up pixels), semantic zooming dictates that *what* information is rendered changes based on the zoom depth.

* **LOD 1 (Overview \- The entire airport):** Only the main runways and major taxiway outlines are visible. Lighting symbols are completely hidden. Aircraft are shown as small, unlabelled dots or primary chevrons. If an area is in alarm (e.g., a total power failure at Substation 3), a glowing amber or red macro-indicator is superimposed over the geographic region, guiding the operator's attention without rendering the specifics2.  
* **LOD 2 (Sector/Area Level):** As the operator scrolls the mouse wheel to zoom into a specific area (e.g., the North Apron), alphanumeric taxiway designations (e.g., "A", "B1") smoothly fade in. Aircraft labels appear in a minimized state, showing only the callsign. Critical elements like active Stop Bars become visible.  
* **LOD 3 (Tactical Level):** Zooming into a specific intersection causes individual lighting fixture symbols (dots, chevrons, barrettes) to render. Aircraft labels expand to show full data blocks (Type, Speed, Cleared Route). Sensor hits and MLAT raw footprints may become visible for diagnostic tracking.  
* **LOD 4 (Diagnostic Level):** Zooming directly onto a single Constant Current Regulator icon or a specific gate stand icon causes the HMI to transition from geographic mapping to a localized schematic. It opens the component's detailed faceplate, displaying electrical values, IP addresses of ILCMS nodes, and historical maintenance logs2.

### **Interaction Behaviors: Pan, Click, Hover**

Navigation is standardized to ensure muscle memory across different platforms. Panning is typically accomplished via a middle-mouse click-and-drag or right-click-and-drag motion. Panning algorithms are optimized to maintain a minimum frame rate (typically 60Hz) to prevent motion sickness and ensure continuous, stutter-free tracking of fast-moving targets.  
Hovering over a target or light fixture instantly triggers a tooltip or highlights the associated data in a secondary panel. In A-SMGCS, hovering over an aircraft highlights its cleared route polygon, temporarily dimming all other routes to isolate the visual focus for the controller.  
Left-clicking an object "pins" it. Selecting a taxiway segment opens a rapid context menu, allowing the controller to immediately block the taxiway (which renders a red "closed" crosshatch over the polygon) or manually override the automated lighting states for that segment.

### **Layer Toggling and Decluttering**

Control room interfaces feature a dedicated layer management panel, operating similarly to Geographic Information Systems (GIS). Operators can toggle specific datasets on or off based on their current task39. Layers are strictly Z-ordered (ranked from bottom to top) to ensure critical safety data is never obscured by background elements39:

> 1. Background (Gray canvas)  
> 2. Maps (Runway/Taxiway polygons)  
> 3. Radar Video (Raw sensor returns)  
> 4. Annotations (Text labels, taxiway names)  
> 5. Tracks (Processed aircraft/vehicle symbols)  
> 6. Dialogue Windows and Alarm Banners (Topmost layer)

During a high-workload scenario, an air traffic controller might trigger a "Declutter" button. This macro instantly disables layers 3 and 4, collapses all Level 3 tags back to Level 2, and hides non-essential ground vehicles (like baggage tugs). This allows the controller to focus exclusively on active aircraft and imminent conflict resolution, shedding extraneous cognitive load.

## **Conclusion**

The architectural, visual, and interaction design of airfield surface operations control software is a highly specialized discipline where complex software engineering meets exacting human factors psychology. The graphical user interfaces developed by Saab, Indra, Frequentis, ADB SAFEGATE, Searidge, and others are strictly governed by a rigid matrix of international mandates—balancing the photometric fidelity demanded by FAA AC 150/5340-30 and ICAO Annex 14, against the routing safety logic of EUROCAE ED-87, and the cognitive load management principles codified in ISA-101 and EEMUA 191\.  
By employing true polygon rendering techniques, semantic Level of Detail zooming, muted base palettes with aggressively reserved alarm colors, and intelligent layer management, these interfaces solve the profound challenge of presenting thousands of dynamic, safety-critical data points in a comprehensible manner. Whether a maintenance engineer is managing a legacy series-circuit lighting system via an ALCMS faceplate, an air traffic controller is resolving a taxiway conflict via an A-SMGCS routing overlay, or an apron manager is monitoring turnaround times via an AODB dashboard, the objective remains absolute: empowering operators to maintain complete situational awareness and ensure the safe, expeditious flow of surface traffic under any conditions.

#### **Works cited**

> 1. High Performance HMI (ISA-101) | Principles & Design, [https://plcprogramming.io/blog/high-performance-hmi-isa-101](https://plcprogramming.io/blog/high-performance-hmi-isa-101)  
> 2. HMI Design Best Practices: ISA-101 Screens & Checklist, [https://plcprogramming.io/blog/hmi-design-best-practices-complete-guide](https://plcprogramming.io/blog/hmi-design-best-practices-complete-guide)  
> 3. SCADA/HMI Design : r/PLC \- Reddit, [https://www.reddit.com/r/PLC/comments/1on0fnw/scadahmi\_design/](https://www.reddit.com/r/PLC/comments/1on0fnw/scadahmi_design/)  
> 4. Distributed Control System (DCS) | Yokogawa America, [https://www.yokogawa.com/us/solutions/products-and-services/control/control-and-safety-system/distributed-control-systems-dcs/](https://www.yokogawa.com/us/solutions/products-and-services/control/control-and-safety-system/distributed-control-systems-dcs/)  
> 5. Isa 101 \- PDFCOFFEE.COM, [https://pdfcoffee.com/isa-101-pdf-free.html](https://pdfcoffee.com/isa-101-pdf-free.html)  
> 6. ISA 101 High Performance HMI \- Adroit Technologies, [https://adroit-europe.com/hphmi](https://adroit-europe.com/hphmi)  
> 7. Understanding and Applying The ANSI/ ISA 18.2 Alarm ... \- Scribd, [https://www.scribd.com/document/391167335/Studies-in-Surface-Science-and-Catalysis-B-Delmon-G-F-Froment-P-Grange-Hydrotreatment-and-Hydrocracking-of-Oil-Fractions-Elsevier-Academic-Pre](https://www.scribd.com/document/391167335/Studies-in-Surface-Science-and-Catalysis-B-Delmon-G-F-Froment-P-Grange-Hydrotreatment-and-Hydrocracking-of-Oil-Fractions-Elsevier-Academic-Pre)  
> 8. (PDF) Automation and autonomous systems: Human-centred design, [https://www.researchgate.net/publication/351935418\_Automation\_and\_autonomous\_systems\_Human-centred\_design](https://www.researchgate.net/publication/351935418_Automation_and_autonomous_systems_Human-centred_design)  
> 9. Chemical Engineering \- Instrumentation (Improving Plant Operation, [https://www.scribd.com/document/361085005/Chemical-Engineering-Instrumentation-Improving-Plant-Operation-Safety-and-Control-Volume-2-pdf](https://www.scribd.com/document/361085005/Chemical-Engineering-Instrumentation-Improving-Plant-Operation-Safety-and-Control-Volume-2-pdf)  
> 10. EUROCONTROL Specification for A-SMGCS Services, [https://www.eurocontrol.int/sites/default/files/2020-01/eurocontrol-specification-for-asmgcs-draft-2-0.pdf](https://www.eurocontrol.int/sites/default/files/2020-01/eurocontrol-specification-for-asmgcs-draft-2-0.pdf)  
> 11. A-SMGCS Technical Requirements \- Ground, [https://elib.dlr.de/63292/1/2-D112a\_ATR-GND\_V1.0.pdf](https://elib.dlr.de/63292/1/2-D112a_ATR-GND_V1.0.pdf)  
> 12. Airport & Transportation Hub LED Lighting Guide: Terminal, Hangar, [https://ksimpexp.com/airport-transportation-hub-lighting-guide/](https://ksimpexp.com/airport-transportation-hub-lighting-guide/)  
> 13. L-852T(L) / ITEL-L \- Airport Lights, [https://www.airportlights.com/wp-content/uploads/2023/03/3813\_fdc719fe-da9b-4072-81cd-5d063fdaf817.pdf](https://www.airportlights.com/wp-content/uploads/2023/03/3813_fdc719fe-da9b-4072-81cd-5d063fdaf817.pdf)  
> 14. Instruction Manual 1324 \- Eaton, [https://www.eaton.com/content/dam/eaton/products/lighting-and-controls/crouse-hinds-alp/instruction-sheets/crouse-hinds-1324-instruction-manual.pdf](https://www.eaton.com/content/dam/eaton/products/lighting-and-controls/crouse-hinds-alp/instruction-sheets/crouse-hinds-1324-instruction-manual.pdf)  
> 15. hastings municipal airport (hsi), [https://www.cityofhastings.org/assets/site/bids/2026/HSI%20BOX%20HANGAR\_IFB%20PLANS\_compressed%20(1).pdf](https://www.cityofhastings.org/assets/site/bids/2026/HSI%20BOX%20HANGAR_IFB%20PLANS_compressed%20\(1\).pdf)  
> 16. State-Managed Airport Handbook \- wsdot, [https://www.wsdot.wa.gov/publications/manuals/fulltext/m3072/airporthandbook.pdf](https://www.wsdot.wa.gov/publications/manuals/fulltext/m3072/airporthandbook.pdf)  
> 17. User Manual \- Airport Lights, [https://www.airportlights.com/wp-content/uploads/2023/03/3813\_1475ce0b-c071-4bbe-b671-6ddac7c93831.pdf](https://www.airportlights.com/wp-content/uploads/2023/03/3813_1475ce0b-c071-4bbe-b671-6ddac7c93831.pdf)  
> 18. RELIANCE Intelligent Lighting \- Individual Light Control and, [https://adbsafegate.com/products/airfield/control-monitoring/reliance-intelligent-lighting-individual-light-control-and-monitoring-system/](https://adbsafegate.com/products/airfield/control-monitoring/reliance-intelligent-lighting-individual-light-control-and-monitoring-system/)  
> 19. Integrated ATC Suite (I-ATS) Overview | PDF | Air Traffic Control, [https://www.scribd.com/document/985329818/i-Ats-a-Smgcs-Overview](https://www.scribd.com/document/985329818/i-Ats-a-Smgcs-Overview)  
> 20. LSSIP 2024 \- FRANCE \- Eurocontrol, [https://www.eurocontrol.int/sites/default/files/2025-07/eurocontrol-lssip-2024-france.pdf](https://www.eurocontrol.int/sites/default/files/2025-07/eurocontrol-lssip-2024-france.pdf)  
> 21. Airfield lighting \- ADB SAFEGATE, [https://adbsafegate.com/products/airfield/](https://adbsafegate.com/products/airfield/)  
> 22. CORTEX ALCMS \- Airfield Lighting Control System \- ADB SAFEGATE, [https://adbsafegate.com/products/airfield/control-monitoring/cortex-alcms-airfield-lighting-control-system/](https://adbsafegate.com/products/airfield/control-monitoring/cortex-alcms-airfield-lighting-control-system/)  
> 23. Safety Aspects of Supporting Apron Controllers with Automatic, [https://www.mdpi.com/2226-4310/10/7/596](https://www.mdpi.com/2226-4310/10/7/596)  
> 24. If we're doing SCADA reviews, would love some feedback ... \- Reddit, [https://www.reddit.com/r/PLC/comments/16mbz3u/if\_were\_doing\_scada\_reviews\_would\_love\_some/](https://www.reddit.com/r/PLC/comments/16mbz3u/if_were_doing_scada_reviews_would_love_some/)  
> 25. What's that extra thing you do to make your SCADA stand out? \- Reddit, [https://www.reddit.com/r/PLC/comments/x2mx4a/whats\_that\_extra\_thing\_you\_do\_to\_make\_your\_scada/](https://www.reddit.com/r/PLC/comments/x2mx4a/whats_that_extra_thing_you_do_to_make_your_scada/)  
> 26. COSAL \- Airfield Lighting Control System \- ADB Safegate, [https://adbsafegate.com/products/airfield/control-monitoring/cosal-airfield-lighting-control-system/](https://adbsafegate.com/products/airfield/control-monitoring/cosal-airfield-lighting-control-system/)  
> 27. COSAL \- Constant Current Regulator \- ADB SAFEGATE, [https://adbsafegate.com/products/airfield/power-equipment/cosal-constant-current-regulator/](https://adbsafegate.com/products/airfield/power-equipment/cosal-constant-current-regulator/)  
> 28. Airport Lighting \- City Electric Supply, [https://media.cityelectricsupply.com/cesonline/ces\_catalogs/coopcrouseHinds6-24-11.pdf](https://media.cityelectricsupply.com/cesonline/ces_catalogs/coopcrouseHinds6-24-11.pdf)  
> 29. AXON EQ ADAL \- Adaptive Airfield Lighting \- adb safegate, [https://adbsafegate.com/products/airfield/taxiway-lighting/axon-eq-adal-adaptive-airfield-lighting/](https://adbsafegate.com/products/airfield/taxiway-lighting/axon-eq-adal-adaptive-airfield-lighting/)  
> 30. SGRS-ALSRA \- Airfield Lighting Switchgear Regulator Assembly, [https://adbsafegate.com/products/airfield/power-equipment/sgrs-alsra-airfield-lighting-switchgear-regulator-assembly/](https://adbsafegate.com/products/airfield/power-equipment/sgrs-alsra-airfield-lighting-switchgear-regulator-assembly/)  
> 31. ADB SAFEGATE's LINC 360 communication platform boosts airfield, [https://adbsafegate.com/news-events/press-releases/adb-safegate-s-linc-360-communication-platform-boosts-airfield-situational-awareness-with-two-way-asset-communication/](https://adbsafegate.com/news-events/press-releases/adb-safegate-s-linc-360-communication-platform-boosts-airfield-situational-awareness-with-two-way-asset-communication/)  
> 32. Ace 2 | PDF | Electrical Wiring | Safety \- Scribd, [https://www.scribd.com/document/582851964/ACE-2](https://www.scribd.com/document/582851964/ACE-2)  
> 33. Manual CCT With Ace3 | PDF \- Scribd, [https://www.scribd.com/document/693423114/Manual-Cct-With-Ace3](https://www.scribd.com/document/693423114/Manual-Cct-With-Ace3)  
> 34. A3000 A-SMGCS Operational Manual | PDF \- Scribd, [https://www.scribd.com/document/872585236/a3000-manual-1](https://www.scribd.com/document/872585236/a3000-manual-1)  
> 35. ASW today, [https://airspaceworld.com/blog/asw-today/airspace-world-today-wednesday-14-may-2025/](https://airspaceworld.com/blog/asw-today/airspace-world-today-wednesday-14-may-2025/)  
> 36. Grant Agreement number: 874477 — PJ02-W2 AART, [https://kozadat.hungarocontrol.hu/download/22d2ba2e24e9c515e4b2985ccdf8fee1.s2020-w2-pj02-tsz.pdf](https://kozadat.hungarocontrol.hu/download/22d2ba2e24e9c515e4b2985ccdf8fee1.s2020-w2-pj02-tsz.pdf)  
> 37. FAA sustaining Airport Surface Surveillance systems, [http://spendergast.blogspot.com/2016/07/faa-sustaining-airport-surface.html](http://spendergast.blogspot.com/2016/07/faa-sustaining-airport-surface.html)  
> 38. Global Action Plan for the Prevention of Runway Incursions, [https://www.caa.md/sites/default/files/users-media/media-13/Cadrul%20Normativ/Circulare/Circulara%20nr.01\_2025\_compressed.pdf](https://www.caa.md/sites/default/files/users-media/media-13/Cadrul%20Normativ/Circulare/Circulara%20nr.01_2025_compressed.pdf)  
> 39. ASMGCS Overview for Airport Operations | PDF | Air Traffic Control, [https://www.scribd.com/presentation/335056608/Asmgcs-Kolkata](https://www.scribd.com/presentation/335056608/Asmgcs-Kolkata)  
> 40. A-SMGCS Services, Procedures, and Operational Requirements, [https://elib.dlr.de/56498/1/2-D111\_SPOR\_V1.0.pdf](https://elib.dlr.de/56498/1/2-D111_SPOR_V1.0.pdf)  
> 41. CNS SG/25 Meeting Report Summary | PDF \- Scribd, [https://www.scribd.com/document/779747764/Final-Report-of-CNS-SG25](https://www.scribd.com/document/779747764/Final-Report-of-CNS-SG25)  
> 42. (PDF) Synthesis of Remote Air Traffic Control System and Air Traffic, [https://www.researchgate.net/publication/334109325\_Synthesis\_of\_Remote\_Air\_Traffic\_Control\_System\_and\_Air\_Traffic\_Controllers'\_Perceptions](https://www.researchgate.net/publication/334109325_Synthesis_of_Remote_Air_Traffic_Control_System_and_Air_Traffic_Controllers'_Perceptions)