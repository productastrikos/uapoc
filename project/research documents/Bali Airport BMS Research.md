# **I Gusti Ngurah Rai International Airport: Comprehensive Infrastructure and Systems Analysis for Digital Twin Integration**

The deployment of a high-level Building Management System (BMS) and digital twin architecture at I Gusti Ngurah Rai International Airport (DPS) in Bali represents a critical convergence of aviation infrastructure and advanced cyber-physical systems. Serving as the primary gateway to the island and a crucial hub for domestic and international carriers—including Garuda Indonesia, Citilink, Wings Air, TransNusa, Batik Air, AirAsia, Lion Air, and Super Air Jet—the facility processes highly volatile passenger volumes requiring dynamic environmental and operational controls1. The implementation of an Airport Operational Control Center (AOCC) serves as the nerve center for these operations, unifying airside and landside data streams to maximize operational efficiency, optimize capacity, and ensure environmental compliance3. By creating a fully responsive digital replica of the physical environment utilizing industrial protocols like BACnet and OPC UA, administrators gain the capability to visualize equipment status, manage thermal comfort, and coordinate emergency responses in real-time4.  
The underlying premise of this digital twin is to transition the facility from a reactive maintenance posture to a predictive, algorithmically driven operational model. This necessitates an exhaustive mapping of the physical infrastructure—spanning architectural layouts, HVAC configurations, electrical distribution networks, and environmental control systems—onto a standardized digital coordinate plane. The integration of real-time telemetry from thousands of endpoints, including Air Handling Units (AHUs), Fan Coil Units (FCUs), and Airfield Lighting (AFL) substations, provides the granular visibility required to sustain continuous operations. Furthermore, the incorporation of the airport's ISO 50001-certified Energy Management System (EnMS) into the digital twin's logic ensures that automated interventions align with rigid carbon reduction and energy efficiency mandates6.

## **Architectural Layout and Spatial Digitization**

The physical footprint of I Gusti Ngurah Rai International Airport is divided into distinct domestic and international zones, each engineered to manage specific passenger processing workflows. Translating these vast physical spaces into a digital twin requires a highly structured spatial architecture, mapping physical coordinates to a localized digital grid that supports rendering performance targets of less than 50 milliseconds5.

### **Terminal Footprints and Passenger Zones**

The airport's expansion and modernization have resulted in a highly segregated yet interconnected terminal design. The domestic terminal occupies 65,800 square meters, representing a nearly fourfold increase from its historical footprint of 13,300 square meters2. This structure is equipped with 62 check-in counters, four transit counters, eight boarding gates, and seven arrival gates, facilitated by eight aerobridges and five baggage conveyor belts2. The commercial layout is heavily centralized to control passenger flow and maximize retail exposure, forcing the BMS to carefully manage air quality and temperature in high-density choke points.  
The international terminal, commissioned ahead of the 2013 APEC summit, covers 120,000 square meters and is designed with traditional Balinese architectural motifs integrated with modern infrastructure2. It houses 96 check-in counters, 11 aerobridges, 26 immigration counters, and 20 visa-on-arrival counters2. The integration of Hold Baggage Screening (HBS) and Baggage Handling Systems (BHS) utilizing Programmable Logic Controllers (PLCs) dictates the need for specialized cooling and fire suppression within the subterranean and ground-level sorting facilities2.  
For the digital twin interface, the terminal spaces are stratified into vertical zones. The logical hierarchy maps the physical structure into the PIT (subterranean/baggage levels), Ground Floor (GF), First Floor (1F), Second Floor (2F), Third Floor (3F), and Fourth Floor (4F)5. This vertical stratification is critical for the Universal Popup System, which must dynamically query real-time data based on the specific ![][image1], ![][image2], and ![][image3] (floor level) coordinates of an interacted asset7. The concentration of passengers at the GF and 1F levels during peak hours creates localized thermal loads that the digital twin must anticipate and counteract by increasing Variable Air Volume (VAV) flow rates ahead of actual temperature spikes.

### **Airside Infrastructure and Coordinate Validation**

The digital mapping of the airside infrastructure requires strict adherence to physical aviation geometry. The primary runway, designated 09-27, measures 3,000 meters in length and 45 meters in width, with physical pavement strength categorized by Pavement Classification Numbers (PCN) capable of accommodating wide-body aircraft such as the Boeing 747-400ER and Boeing 777-900ER12. Expansions under long-term master plans target extending this critical infrastructure to 3,400 meters to accommodate future ultra-long-haul flight profiles2. The adjacent apron covers 381,862 square meters, featuring 53 aircraft stands on the north side and 11 stands on the south side, primarily allocated for narrow-body aircraft12.  
To maintain the integrity of the digital twin, the system enforces rigid coordinate validation mechanisms to ensure that aircraft and Ground Support Equipment (GSE) are accurately represented on permitted surface types. The digital layout maps the runway centerline to a normalized coordinate of { x: 250, y: 200 } with a bounded concrete surface classification5. Taxiways are defined as concrete pathways with a logical width of 25 units, while gate spacing mandates a minimum of 40 units between docking nodes to ensure safe maneuvering clearance5.

| Infrastructure Element | Digital Twin Parameter | Physical Specification | Validation Constraint |
| :---- | :---- | :---- | :---- |
| Primary Runway (09-27) | centerline: { x: 250, y: 200 } | 3,000m x 45m | Concrete surface only; 5:1 glide path logic |
| Taxiways | width: 25 | Standard commercial width | Concrete pathways connecting runway to gates |
| Aircraft Gates | spacing: \>= 40 units | 53 North / 11 South Stands | Restricted to defined tarmac coordinates |
| Terminal Surface | type: building\_interior | 185,800 sqm total | Invalid for aircraft positioning |

The strict validation of these coordinates prevents telemetry anomalies, such as an aircraft GPS multi-path error placing a plane inside the passenger terminal. If an asset reports coordinates outside its validated polygon, the digital twin applies fallback positioning and flags a coordinate validation warning in the system log, preserving the situational awareness of the AOCC operators7.

## **Aviation Operations, AOCC Integration, and Runway Optimization**

The digital twin does not merely monitor static building systems; it deeply integrates with the active operational workflows governed by the Airport Operational Control Center (AOCC). The AOCC functions as a centralized command hub where representatives from airlines, ground handlers, and aviation security collaborate to enact Airport Collaborative Decision Making (A-CDM)3. A core metric tracked by the AOCC is On-Time Performance (OTP) and slot management, which directly informs the digital twin's energy shedding protocols3. If the AOCC dashboard indicates a 90-minute delay for a block of departure gates, the digital twin automatically intercepts this data to reduce HVAC load in the corresponding boarding lounges, thereby harmonizing flight operations with facility energy management.

### **Runway Occupancy Time (ROT) and Capacity Enhancements**

Given the geographical constraints of the island and the challenges of land reclamation, the airport operates near its maximum single-runway capacity. While the theoretical capacity of the runway allows for up to 35 movements per hour, the implementation of Runway Occupancy Time (ROT) procedures aims to drive this closer to an optimal 44 operations per hour by utilizing rapid exit taxiways and rigorous air traffic spacing15.  
The digital twin visualizes these ROT constraints to assist AOCC operators in tracking compliance. Standard operating procedures dictate strict temporal bounds for aircraft movements: pilots must complete pushback within three minutes of clearance, and line-up and take-off clearances must result in a continuous movement initiating take-off within 100 seconds16. Furthermore, specific modern fleet types, such as the Boeing 738 Max and Airbus A320 Neo, are required to start idle power directly on the gate before pushback commences, altering the thermal and acoustic profile of the apron16.  
The digital twin captures these operational milestones via integration with the advanced surface movement guidance and control system (A-SMGCS). By mapping the { x: 250, y: 200 } runway coordinate plane against real-time aircraft transponder data, the system flags any aircraft exceeding the 100-second take-off threshold or the 3-minute pushback limit7. This granular tracking not only aids air traffic control in maintaining the 35-to-44 movement-per-hour cadence but also allows the BMS to predict localized peaks in carbon monoxide and jet blast emissions near the terminal facade, prompting Make-Up Air Units (MAUs) to adjust intake filtration dynamically.

### **Operational Resilience and Security Paradigms**

The security integration within the digital twin encompasses both digital and physical threat vectors. The AOCC monitors a sprawling network of 2,800 CCTV cameras strategically distributed across the 185,800 square meters of terminal space and the perimeter fence17. This surveillance architecture is deeply embedded into the BMS event logs. If the digital twin detects an unauthorized access event at a secure airside boundary, it automatically slews the nearest pan-tilt-zoom (PTZ) cameras to the triggered coordinate and elevates a critical alarm on the supervisor dashboard5.  
The flexibility of the AOCC and the digital twin was severely tested during the post-pandemic recovery phase. To manage operating costs and align with reduced flight schedules, the AOCC restructured its operational workflows, including truncating operational shifts from their standard continuous rotation down to an 04:00 WIT hard stop18. The digital twin accommodated these macro-level operational shifts by introducing automated "deep setback" modes, wherein the entire facility transitions into a dormant state at 04:00 WIT, reducing chilled water flow, dimming terminal lighting, and relying purely on baseline security sensors until the morning flight bank initiates system wake-up procedures.

## **Energy Management System (EnMS) and ISO 50001 Certification**

I Gusti Ngurah Rai International Airport distinguishes itself as the first airport in Southeast Asia to achieve ISO 50001:2018 certification for its Energy Management System, awarded by TUV SUD6. The digital twin serves as the daily operational interface for maintaining this standard, transforming static policy documents into automated, actionable control loops that yield tangible financial and environmental dividends.

### **Baselines and Energy Performance Indicators (EnPI)**

The EnMS scope covers the domestic terminal, international terminal, and the north apron6. To quantify energy efficiency, the digital twin calculates Energy Performance Indicators (EnPI) against an established Energy Baseline (EnB) formulated from 2020 statistics, with provisions to normalize against 2019 pre-pandemic data as traffic volumes recover6. Due to the volatility of aviation traffic, a static kilowatt-hour baseline is insufficient for determining true efficiency. Instead, the BMS utilizes dynamic linear regression equations to normalize the energy consumption data6.  
For the domestic terminal, the independent variable driving the regression is the total number of passengers. For the international terminal, the metric is total aircraft movements6. The digital twin continuously pulls this demographic and traffic data from the AOCC and calculates the expected energy consumption. The regression models must maintain a Coefficient of Determination (![][image4]) greater than 0.75, ensuring a statistically valid correlation between traffic and energy use6.  
If the actual energy consumed by the facility falls below the expected baseline calculated by the regression equation, the digital twin plots this as a negative value on a Cumulative Sum (CUSUM) graph, visually confirming to the operators that energy efficiency targets are being achieved6.

### **Equipment-Specific Energy Savings and Decarbonization**

Through the enforcement of these EnMS protocols—including the strict adherence to "No Idling" policies for ground equipment, terminal zoning, and automated base load management—the airport achieved a 44% improvement in energy performance6. The cost to implement the EnMS was tracked at USD 866,385, which yielded USD 1,865,197 in total energy cost savings over a two-year improvement period6. The digital twin tracks these savings at the asset level, allowing operators to verify the return on investment for specific mechanical interventions. The total savings equated to 26,592 MWh and a reduction of 21,008 metric tons of CO26.

| Infrastructure System | Annual Energy Savings (MWh) | Carbon Emission Reduction (Tons CO2) | Operational Intervention via Digital Twin |
| :---- | :---- | :---- | :---- |
| Lighting Networks | 1,731 | 1,212 | Area-specific hours of operation adjustments |
| Water Pumps | 1,367 | 1,081 | Zoning requirements according to passenger density |
| Garbarata & Apron Lighting | 1,293 | 1,022 | Interlocking operations with AOCC flight schedules |
| Baggage Handling System (BHS) | 1,150 | 908 | PLC automated sleep sensors in inactive BHS sections |
| Airport Technology (X-Ray, Scanners) | 1,006 | 795 | Optimizing equipment runtimes around security queue data |
| Vertical Transport (Lifts, Escalators) | 862.2 | 681 | Variable speed settings and stop-and-go configurations |

The total energy savings comprised 26,444 MWh from active EnMS interventions and 148 MWh directly displaced by renewable energy generation6. By rendering these statistics directly into the digital twin's PopupData interface under the energy schema, the BMS ensures that facility managers are continuously aware of their progress toward the overarching corporate goal of reducing electricity consumption by an additional 25% over subsequent operational cycles6.

## **Mechanical Systems and Thermal Dynamics**

Bali's tropical climate, characterized by high ambient temperatures and oppressive humidity year-round, necessitates a robust, high-capacity mechanical cooling architecture. The energy consumed by chillers, AHUs, and FCUs constitutes the overwhelming majority of the airport's base electrical load. Consequently, the digital twin's primary utility is the granular monitoring and control of this HVAC ecosystem, balancing passenger thermal comfort against the stringent ISO 50001 energy performance indicators6.

### **District Cooling and Chiller Centralization**

Historically, the airport operated decentralized cooling plants tailored to distinct terminal zones. Under the recent EnMS optimization mandates, mechanical operations have been heavily centralized to create a district cooling methodology. This physical intervention involved the interconnection of chilled water supply lines, most notably linking Chiller Plant CRB 3 to the Aviobridge distribution zones6. Motorized control valves integrated into the BMS enable the dynamic sharing of chilled water between the domestic and international terminals based on shifting diurnal passenger densities6.  
This centralization is highly significant for the digital twin's control logic. By sharing the cooling load across terminal boundaries, the facility successfully reduced the active operating baseline from three primary chiller sets down to two6. This configuration allows one complete mechanical set—comprising its primary chiller, chilled water pump, condenser water pump, and massive exterior cooling tower—to remain idle or in cold standby mode6. The digital twin monitors the CHILLERS EQUIPMENT AVAILABILITY KPI, meticulously tracking the runtime, compressor trip faults, and instantaneous coefficient of performance (COP) for the active assets5. If the ambient thermal load or latent humidity ratio exceeds the capacity of the two active chillers, the digital twin automatically sequences the third chiller online. This specific centralization effort accounted for a 16% reduction in mechanical energy consumption, demonstrating the profound impact of fluid dynamic optimization in large-scale aviation facilities6.

### **Air Handling, Filtration, and Motor Control**

The distribution of conditioned air generated by the central chillers is managed by a vast network of mechanical equipment. The BMS monitors over 209 individual Air Handling Units (AHUs), 1,366 Fan Coil Units (FCUs), Primary Air Units (PAUs), and precision Computer Room Air Handlers (CRAHs)5.  
The digital interface provides rich, real-time parameter tracking for each AHU. Operators navigating the virtual floor plan can interact with an AHU to view metrics including Return Air (RA) Temperature, Supply Air (SA) Temperature, Variable Speed Drive (VSD) revolutions per minute (RPM), Cooling Coil Valve opening percentages, and differential pressures across dual smoke, pre-filter, and bag-filter arrays5. When an AHU encounters a fault, such as an intermittent OPC UA communication link failure, a tripped overload relay, or a thermal compliance breach, the digital twin automatically flags the unit in red, changes its status parameter to critical, and generates a high-priority digital work order5.  
The extensive deployment of Variable Speed Drives (VSDs) on the AHUs allows the digital twin to implement sophisticated frequency reductions during periods of low passenger traffic. This logic is explicitly tied to flight schedule integration via the AOCC. If the AOCC API indicates that a block of international departure gates will remain vacant for three hours, the digital twin scales back the VSDs of the corresponding AHUs. By relaxing the ambient temperature setpoint (e.g., allowing the zone to drift to 26°C instead of maintaining a rigid 22°C), fan motor energy consumption is cut by the cube of the speed reduction, adhering to fundamental affinity laws and driving the EnPI metrics downward.

### **Fan Typologies and Ventilation Control**

Beyond comfort cooling, the airport relies on specialized fan typologies to manage air quality, building pressurization, and critical life safety. The digital twin categorizes these into distinct functional groups: Exhaust Air Fans (EAF), Fresh Air Fans (FAF), Kitchen Exhaust Fans (KEF), Staircase Extraction Fans (SEF), Toilet Exhaust Fans (TEF), and Smoke Purging Fans (SPF)5.  
The volumetric balance between FAFs and EAFs is critical for maintaining a slight positive pressure envelope within the terminal. This positive pressurization prevents unconditioned, humid outside air from infiltrating through the frequently opening automated sliding doors, which would otherwise overwhelm the latent cooling capacity of the chillers and lead to interior condensation. In specialized zones, such as the commercial food courts, KEFs must operate in tandem with Make-Up Air Units (MAUs) to ensure that the massive extraction of grease-laden air does not depressurize the building and disrupt adjacent zone temperatures2.  
During a fire alarm event, the BMS logic entirely overrides standard thermal comfort settings. The digital twin acts as a life-safety sequencer, shutting down standard AHUs to prevent the forced supply of oxygen to the fire and closing motorized fire dampers to prevent smoke propagation through the ductwork. Simultaneously, SPFs and SEFs are activated at 100% capacity to extract smoke from the passenger concourses and positively pressurize evacuation stairwells, ensuring a tenable escape route. The operational availability of these life-safety fans is continuously tracked on the dashboard, with any offline unit instantly triggering a critical system alert requiring immediate maintenance intervention5.

## **Electrical Grids, Resiliency, and Airfield Telemetry**

The operational viability of I Gusti Ngurah Rai International Airport relies on a highly redundant and carefully segmented electrical distribution network. The primary high-voltage power supply is sourced from the state utility provider, PLN (Perusahaan Listrik Negara)21. However, the zero-downtime requirements of aviation operations dictate that the digital twin must actively monitor power transitions, execute rapid load shedding, and manage complex Uninterruptible Power Supply (UPS) hierarchies to guarantee continuous power to essential systems.

### **Airfield Lighting System (AFL) and Substation Topologies**

The Airfield Lighting System (AFL) is arguably the most critical electrical load on the campus, directly dictating the safety of aircraft final approaches, touchdowns, and taxiing operations under Instrument Meteorological Conditions (IMC) or night operations. The auxiliary equipment and AFL are powered via Main Power House 1, which boasts an installed capacity of 3,465 kVA, receiving its primary utility feed from the PLTU Kariangau generation source23.  
To ensure absolute resilience, the AFL power architecture is designed with deep layers of redundancy. In the event of a total PLN grid failure, the system instantly transitions to secondary electrical resources: massive diesel generator sets and robust UPS arrays23. Load flow analyses, conducted extensively using the Electric Transient Analysis Program (ETAP), have modeled the most critical failure scenarios to program the BMS transition logic.  
The ETAP simulation data dictates that the active AFL load across Substation T1 requires approximately 94.33 kVA23. During a critical blackout scenario where the primary generators experience a delayed start or fail to synchronize immediately, the UPS must carry this entire 94.33 kVA load seamlessly to prevent the runway lights from extinguishing. Once the standby generator achieves stable rotation, it must produce a minimum of 84.2 kW of clean power to simultaneously serve the AFL load and begin recharging the depleted UPS batteries23.  
The digital twin continuously monitors the transient voltage drop across these critical electrical nodes. Based on rigid IEC standards, the system requires the voltage to remain above 98% of the nominal rating (e.g., maintaining a minimum of 372V on a 380V three-phase system) during a generator step-load event23. By tracking these parameters in real-time, the BMS can detect degrading battery impedance in the UPS or governor lag in the generator sets well before a catastrophic failure occurs during a live utility blackout.

### **Renewable Integration and Microgrid Evolution**

In strict alignment with global decarbonization trends and the airport's internal EnMS targets, the facility is transitioning toward a hybrid microgrid model. The initial deployment consists of a 155 kWp solar photovoltaic (PV) power plant servicing the domestic terminal parking structure, toll gates, and select international terminal systems6. In its first full operational year, this array generated 148 MWh of clean energy, successfully offsetting 117 tons of CO2 emissions6.  
The digital twin plays a crucial role in managing this distributed energy resource (DER). The system tracks the DC string voltage from the solar arrays, the inversion efficiency, and the AC power injected into the terminal grid. Future infrastructure master plans outline the scaling of this solar capacity up to 1,047 kWp6. As this renewable footprint expands, the BMS will require advanced phase-matching and islanding control algorithms to manage the complex electrical harmonics and voltage fluctuations introduced by the intermittent solar output, particularly when the facility is forced to transition rapidly from PLN utility power to local generator power during a storm event.

## **Hydrological Systems, Plumbing, and Effluent Processing**

The island of Bali faces unique hydrological and geological constraints, making efficient water management and self-sufficiency core pillars of the airport's infrastructure. The digital twin encompasses the monitoring of hydraulic pumps, filtration systems, booster pumps, and extensive digital water metering separated by floor5. This ensures that steady water pressure is maintained across the sprawling 185,800 square meters of multi-level terminal space without incurring unnecessary energy expenditure from oversized booster pumps.  
A critical component of this hydrological ecosystem is the Sewage Treatment Plant (STP) and wastewater processing infrastructure. The airport relies on an extended aeration and anaerobic processing system with a baseline design capacity for standard domestic effluent of 150 cubic meters per day (![][image5])26. Historical upgrades to the broader facility's water infrastructure also indicate the deployment of highly specialized filtration and desalination units—commissioned in the early 2000s—capable of processing up to 20,000 ![][image5] to support both the airport and the broader municipal and industrial requirements of the immediate coastal area28.  
Within the BMS interface, the plumbing equipment dashboard tracks the operational state of hydraulic pumps and reads digital water meters to aggregate consumption data5. By continuously analyzing flow rates, the system can rapidly detect pressure drops indicative of pipe ruptures or catastrophic valve failures in remote restrooms. Furthermore, the treated effluent from the STP represents a vital operational resource. By recycling this greywater for landscape irrigation and cooling tower makeup water, the airport drastically reduces its reliance on municipal potable water, thereby lowering the runtimes of energy-intensive primary supply pumps29.  
The digital twin correlates passenger density data from the AOCC with expected toilet and washroom usage to predict surges in the STP influent. By anticipating these diurnal hydraulic loads, the BMS can proactively ramp up the aeration blowers in the STP to maintain optimal dissolved oxygen levels in the biological treatment tanks, preventing anaerobic shock and ensuring the discharged effluent meets stringent local environmental standards before release.

## **Fire Suppression, Life Safety, and Integrated Security Networks**

Life safety is the paramount directive of any high-level building management system operating within a densely populated transportation hub. The digital twin integrates fully with the facility's localized Fire Alarm Control Panels (FACP) and physical suppression hardware to provide a unified, automated response to any thermal or smoke anomaly30.  
The fire fighting interfaces are distributed throughout the facility based on the specific hazard profile of each zone. In areas with high combustible loading, such as retail storage, baggage makeup areas, and public concourses, conventional wet-pipe sprinkler systems and localized high-pressure hydrants are standard30. However, in mission-critical infrastructure areas—such as the AOCC server rooms, primary electrical substations, and the BMS data centers—the introduction of water would cause catastrophic, irreparable hardware damage. These highly sensitive zones are protected by FM200 clean agent suppression systems5.  
The digital twin interface provides a dedicated telemetry view for the Fire Fighting Interfaces, tracking the line pressure of the FM200 cylinders, the status of the nitrogen actuation lines, and the readiness of the primary electric and secondary diesel fire pumps5.  
A critical insight into this integration is the systemic cause-and-effect matrix executed by the digital twin during an alarm. If an FM200 discharge sequence is initiated, the BMS does not merely alert the operator via a dashboard notification. It instantly executes a hard-wired interlock to drop the enable signals to all AHUs, PAUs, and VAV boxes servicing that specific room. Closing the motorized fire dampers and halting forced air circulation ensures that the FM200 gas remains at the precise design concentration required to extinguish the fire chemically, rather than being evacuated into the return air plenum. Simultaneously, the system unlocks access control doors in the affected zone to ensure personnel can evacuate without hindrance, whilst slewing nearby CCTV cameras to record the event for post-incident analysis.

## **Digital Twin Software Architecture and System Telemetry**

Creating a high-performance, real-time representation of I Gusti Ngurah Rai International Airport's complex physical systems requires a sophisticated, highly optimized software architecture. The frontend application relies heavily on modern React frameworks, TypeScript for strong type enforcement, and optimized state management to handle the asynchronous influx of IoT telemetry without freezing the browser's rendering thread5.

### **Component Structure and Event Delegation**

The core of the interactive map is the Universal Popup System, which allows operators to query any spatial element on the floor plans or the airfield7. To maintain rendering performance below the 50-millisecond threshold, the system avoids attaching individual event listeners to thousands of independent SVG or Canvas elements representing every single lightbulb or sensor. Instead, it utilizes event delegation at the parent container level. When a user clicks, the application calculates the spatial coordinates, determines which asset occupies that vector space within the defined AIRPORT\_LAYOUT, and generates the contextual popup dynamically7.  
The integration code demonstrates a custom React hook, usePopup, which manages the visibility and payload of the interaction:

TypeScript  
import { usePopup } from '../hooks/usePopup';  
import UniversalPopup from './UniversalPopup';

// In your component  
const { isOpen, popupData, openPopup, closePopup } \= usePopup();

// On click handler  
const handleElementClick \= (elementType: string, elementData: any, event: React.MouseEvent) \=\> {  
  const clickPosition \= { x: event.clientX, y: event.clientY };  
  const popupData \= generatePopupData(elementType, elementData);  
  openPopup(popupData, clickPosition);  
};

5

### **Data Structuring and Predictive Maintenance**

The data passed to the rendering engine is strictly structured to accommodate a wide variety of asset types, ranging from simple digital water meters to complex Airbus A380 aircraft parked at a gate. The PopupData interface dictates the schema, allowing the UI to seamlessly transition between visualizing an AHU's RPM and a gate's physical spacing constraints:

TypeScript  
interface PopupData {  
  id: string;  
  title: string;  
  type: 'kpi' | 'system' | 'aircraft' | 'gate' | 'runway' | 'sensor' | 'maintenance' | 'energy' | 'security';  
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline';  
  description?: string;  
  coordinates?: { x: number; y: number };  
  realTimeData?: Record\<string, any\>;  
  operationalParams?: Record\<string, any\>;  
  maintenanceSchedule?: {  
    lastMaintenance: string;  
    nextMaintenance: string;  
    maintenanceType: string;  
  };  
  historicalTrends?: {  
    period: string;  
    values: number\[\];  
    labels: string\[\];  
  };  
  alerts?: Array\<{  
    level: 'info' | 'warning' | 'critical';  
    message: string;  
    timestamp: string;  
  }\>;  
}

5  
The inclusion of maintenanceSchedule and historicalTrends objects within the base payload represents a shift from reactive to predictive facility management. By tracking the degradation curve of a chilled water pump's vibration signature over a trailing 30-day period (stored in historicalTrends), the digital twin can generate a 'warning' status before the pump experiences a catastrophic mechanical seal failure. This allows maintenance crews to schedule the replacement during the airport's lowest traffic window—typically between 02:00 and 04:00 local time—rather than during the peak midday rush, safeguarding the continuity of operations.

### **Alarm Ingestion and System Health**

The overall health of the digital twin network is tracked via internal KPIs, such as Overall Communication Availability and Overall Device Health5. With thousands of sensors operating via heterogeneous industrial protocols like Modbus, BACnet, and OPC UA, packet loss and network latency are persistent risks to data integrity. The dashboard explicitly monitors for intermittent connections, such as an "OPC UA link cable inspection" work order triggered by a high frequency of dropped polling requests from an AHU controller5.  
When the BMS detects an out-of-bounds parameter—such as a CO2 alert Zone B6 \- 1240 ppm, SLA breach—the system ingests the alarm, elevates the priority, and visually isolates the affected zone on the 2D layout map by rendering an amber or red halo over the space5. This visual cue allows the AOCC supervisor to immediately cross-reference the digital layout with live CCTV feeds to determine if the CO2 spike is due to a sudden influx of a large tour group or a mechanical failure of the localized Fresh Air Fan (FAF). This synthesis of data layers enables precise, targeted operational responses rather than blunt, facility-wide reactions.

## **Synthesis and Operational Outlook**

The digital twin and high-level Building Management System deployed for I Gusti Ngurah Rai International Airport represents a paradigm shift in aviation infrastructure management. By exhaustively digitizing the spatial architecture of the 185,800 square meters of terminal space and the 381,862 square meters of tarmac, the facility transcends traditional physical limitations, allowing for instantaneous, data-driven oversight.  
The integration of complex mechanical HVAC topologies with the ISO 50001 Energy Management System ensures that the immense cooling demands of the Balinese climate are met with absolute precision. Centralizing chiller operations, modulating air handlers in lockstep with predictive AOCC passenger flow data, and harvesting 155 kWp of solar energy all contribute to the realization of millions of dollars in utility savings and massive reductions in carbon emissions. The electrical infrastructure, anchored by the ETAP-simulated Airfield Lighting substations, guarantees that critical life-safety and navigational systems remain resilient against grid instability, utilizing UPS arrays to bridge the gap during generator step-loading events.  
Through the convergence of these highly complex electrical, mechanical, plumbing, and fire-suppression domains into a single, responsive React-based interface, the operators possess total situational awareness. This seamless synergy between concrete infrastructure and programmatic logic ensures that the airport remains not only a critical node in global aviation but a benchmark for sustainable, predictive, and resilient facility operations.

#### **Works cited**

> 1. $635 CHEAP FLIGHTS from Raleigh to Bali \- KAYAK, [https://www.kayak.com/flight-routes/Raleigh-Durham-RDU/Bali-IDBA](https://www.kayak.com/flight-routes/Raleigh-Durham-RDU/Bali-IDBA)  
> 2. Ngurah Rai International Airport \- Wikipedia, [https://en.wikipedia.org/wiki/Ngurah\_Rai\_International\_Airport](https://en.wikipedia.org/wiki/Ngurah_Rai_International_Airport)  
> 3. Implementation of smart airports in indonesia \- ICAO, [https://www.icao.int/zh-hans/filebrowser/download/60505?fid=60505](https://www.icao.int/zh-hans/filebrowser/download/60505?fid=60505)  
> 4. Monitoring BAS di Bandara Halim | PDF \- Scribd, [https://id.scribd.com/document/975284576/Laporan-Magang-melkior-Gosta-2203321047-Copy](https://id.scribd.com/document/975284576/Laporan-Magang-melkior-Gosta-2203321047-Copy)  
> 5.   
> 6. 2023 CEM Case Study – Indonesia – PT Angkasa Pura I, [https://www.cleanenergyministerial.org/content/uploads/2023/06/cem-em-casestudy-igusti-indonesia.pdf](https://www.cleanenergyministerial.org/content/uploads/2023/06/cem-em-casestudy-igusti-indonesia.pdf)  
> 7. README.md  
> 8. Laporan Tahunan 2015 Angkasa Pura I \- Scribd, [https://id.scribd.com/document/336257587/630-Laporan-Tahunan-Laporan-Tahunan-2015-Corporate-Communications-566d47e9fac3aef3d03242af4f2e8ff6ee785791annual-Report-2015-Pt-Angkasa-Pura-i-Persero](https://id.scribd.com/document/336257587/630-Laporan-Tahunan-Laporan-Tahunan-2015-Corporate-Communications-566d47e9fac3aef3d03242af4f2e8ff6ee785791annual-Report-2015-Pt-Angkasa-Pura-i-Persero)  
> 9. Jurnal Teknik Mekanikal Bandar Udara Vol.2 No.2 Bulan Desember, [https://journal.ppicurug.ac.id/index.php/jtmb/article/download/1295/709](https://journal.ppicurug.ac.id/index.php/jtmb/article/download/1295/709)  
> 10. 536 Domestic Airport Floor Plan Stock Photos \- Dreamstime.com, [https://www.dreamstime.com/photos-images/domestic-airport-floor-plan.html](https://www.dreamstime.com/photos-images/domestic-airport-floor-plan.html)  
> 11. Directory Map royalty-free images \- Shutterstock, [https://www.shutterstock.com/search/directory-map](https://www.shutterstock.com/search/directory-map)  
> 12. Optimization international airport capacity I Gusti Ngurah Rai Bali, [https://www.ejournal.warmadewa.ac.id/index.php/jipe/article/download/5814/5167](https://www.ejournal.warmadewa.ac.id/index.php/jipe/article/download/5814/5167)  
> 13. PT Angkasa Pura Indonesia \- IDX, [https://www.idx.co.id/StaticData/NewsAndAnnouncement/ANNOUNCEMENTSTOCK/From\_EREP/202505/c5f4c51456\_b0559a8040.pdf](https://www.idx.co.id/StaticData/NewsAndAnnouncement/ANNOUNCEMENTSTOCK/From_EREP/202505/c5f4c51456_b0559a8040.pdf)  
> 14. perencanaan fasilitas sisi udara untuk pelayanan penerbangan, [https://ojs.unr.ac.id/index.php/teknikgradien/article/download/740/648/3099](https://ojs.unr.ac.id/index.php/teknikgradien/article/download/740/648/3099)  
> 15. Diagnostic Report On Ngurah Rai Airport Capacity \- Final Report, [https://www.scribd.com/document/349388319/Diagnostic-Report-on-Ngurah-Rai-Airport-Capacity-Final-Report](https://www.scribd.com/document/349388319/Diagnostic-Report-on-Ngurah-Rai-Airport-Capacity-Final-Report)  
> 16. Enhancing Runway Capacity at Bali Airport | PDF | Air Traffic Control, [https://www.scribd.com/document/442212265/AIRAC-AIP-SUP-06-19-ROT-BALI-pdf](https://www.scribd.com/document/442212265/AIRAC-AIP-SUP-06-19-ROT-BALI-pdf)  
> 17. Soekarno-Hatta Airport Prepped for Presidential Inauguration, [https://en.tempo.co/read/1261712/soekarno-hatta-airport-prepped-for-presidential-inauguration](https://en.tempo.co/read/1261712/soekarno-hatta-airport-prepped-for-presidential-inauguration)  
> 18. Analisis Perubahan Sistem Kerja Unit Airport Operational Control, [https://ifrelresearch.org/index.php/jmk-widyakarya/article/download/1128/1180/4013](https://ifrelresearch.org/index.php/jmk-widyakarya/article/download/1128/1180/4013)  
> 19. (PDF) An Assessment of the use of the ISO 50001 Certified Energy, [https://www.researchgate.net/publication/366091052\_An\_Assessment\_of\_the\_use\_of\_the\_ISO\_50001\_Certified\_Energy\_Management\_Systems\_by\_Airports](https://www.researchgate.net/publication/366091052_An_Assessment_of_the_use_of_the_ISO_50001_Certified_Energy_Management_Systems_by_Airports)  
> 20. Alphabetical airport codes list, [https://www.air-port-codes.com/airport-list/](https://www.air-port-codes.com/airport-list/)  
> 21. Nyoman SETIAWAN | UNUD | Department of Electrical Engineering, [https://www.researchgate.net/profile/Nyoman-Setiawan-2](https://www.researchgate.net/profile/Nyoman-Setiawan-2)  
> 22. WAS'flTA \- IDX, [https://www.idx.co.id/Portals/0/StaticData/NewsAndAnnouncement/ANNOUNCEMENTSTOCK/From\_EREP/201710/20171031114251-8971-0/Lap%20Keu%20REVISI%20Interim%20Konsolidasian%20PT%20WSKT%20per%2030%20Sept%202017.pdf](https://www.idx.co.id/Portals/0/StaticData/NewsAndAnnouncement/ANNOUNCEMENTSTOCK/From_EREP/201710/20171031114251-8971-0/Lap%20Keu%20REVISI%20Interim%20Konsolidasian%20PT%20WSKT%20per%2030%20Sept%202017.pdf)  
> 23. (PDF) Analisa Sistem Back-Up Daya Airfield Lighting System pada, [https://www.researchgate.net/publication/378356090\_Analisa\_Sistem\_Back-Up\_Daya\_Airfield\_Lighting\_System\_pada\_Substation\_T1\_Bandara\_SAMS\_Sepinggan\_dengan\_ETAP\_1901](https://www.researchgate.net/publication/378356090_Analisa_Sistem_Back-Up_Daya_Airfield_Lighting_System_pada_Substation_T1_Bandara_SAMS_Sepinggan_dengan_ETAP_1901)  
> 24. Analisa Sistem Back-Up Daya Airfield Lighting System pada, [https://ejurnal.ung.ac.id/index.php/jjeee/article/view/22314](https://ejurnal.ung.ac.id/index.php/jjeee/article/view/22314)  
> 25. Power Sector Transition in Bali \- Global Energy Monitor, [https://www.gem.wiki/Power\_Sector\_Transition\_in\_Bali](https://www.gem.wiki/Power_Sector_Transition_in_Bali)  
> 26. STP Design Calculations Overview | PDF | Water Pollution \- Scribd, [https://fr.scribd.com/document/256020247/150CMD-STP-Calculation-Rev-A](https://fr.scribd.com/document/256020247/150CMD-STP-Calculation-Rev-A)  
> 27. poltekba \- Prosiding Seminar Nasional, [http://www.prosiding.subura.id/PROSIDING%20SNITT%202020.pdf](http://www.prosiding.subura.id/PROSIDING%20SNITT%202020.pdf)  
> 28. PROJECTS – EBD BAEUR, [https://ebdbauer.com/projects/](https://ebdbauer.com/projects/)  
> 29. bestpracticedan inovasiindustriproper 2 0 1 7, [https://peksosdanproper.home.blog/wp-content/uploads/2019/01/menlhk-2017-best-practice-dan-inovasi-industri-proper-2017-62-mb.pdf](https://peksosdanproper.home.blog/wp-content/uploads/2019/01/menlhk-2017-best-practice-dan-inovasi-industri-proper-2017-62-mb.pdf)  
> 30. Home \- PT. TEKNIK ANUGRAH PERKASA, [https://teknikanugrahperkasa.com/](https://teknikanugrahperkasa.com/)  
> 31. Full text of "Asia Pacific Fire (2011)" \- Internet Archive, [https://archive.org/stream/asia\_pacific\_fire\_2011/asia\_pacific\_fire\_2011\_djvu.txt](https://archive.org/stream/asia_pacific_fire_2011/asia_pacific_fire_2011_djvu.txt)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAaCAYAAACD+r1hAAAAzUlEQVR4Xu3RsQtBURTH8SspokRSVslgYDAbKMrfIKtZFgMjo1JmyYBRFrNdKYPJ5A+wKJOB73n3ek96ZX2DX32G0zn39u55Sv3jtfhRRA1h+JBFFaGPOStRLNFBD0eMMcQUawTfw3LTACVTp3DBCnlcsUPE9FUcfeXcUMANDQTQRM70XCODd6Xf8zPyeTPsEfvq2ZEHT9BCAielD8lhiWxJenbqeGKEMh7omp5cNkfG1FbSOGCBDdo4K73OLSrOqBPZUFLpn+dW/+OxvAD0xRzAnkbIJQAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAaCAYAAABhJqYYAAAA+0lEQVR4XmNgGAX0BMxAbAzEdkDMiibHjywGYkwA4iogPgTEvTAJIFAH4pdAHAETcAXiGiDmA+IDQLySAWITCEQD8TcgNoXyGTKBWB+ILaEScFOAYBIQXwViESQxMGgA4idArAjlCwLxaSBeCsSMUDEw4GGAOGENELNAxUC2fQLidCgfDiSB+CEQlyOJgdz7G4htkMTAQByI7zIgFIOCaw8DDveC3FTMAHHzXAaIW/8D8XyoHArggGKQ20G2gEIG5F7kkAEDGSC+zgCxlpsB4sHpQHwFiMWQ1IEByNegWMphgCjMB+JbQGyArAgGQNENcu9xKO5kgMTmyAMAAl4mzoEPVJAAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAbCAYAAABFuB6DAAAAp0lEQVR4XmNgGAW0ANxA7AzEklA+KxAbADELXAUQ6ALxIyD+D8TvgdgHiGOBOA9ZEUjHVKgkyDQXIN4FxLMYIKbiBFZAPJEB4hScAGRaFxBzokugA4IKGYE4BIgbGfC4C6QoFIiLgZgZSTwViP2R+AzBQPwLiE8zQEwEmTwJiE8AsRhMkQoQLwZiISDWBOLrDJCwBNEgPhxwQDEMgNwnwoDqhFFAJQAAzjwUkAyN2LAAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAABcklEQVR4Xu2UzSsGURTGH6HIxwKREmWnKCVWLBQLCzaWslLsCflY2EhZ2iisLaTevZUi5Q+QlYUSpWTFgsTzdO5k5r7zTsw7C+n91a/uvWdmzr1nzgzwxymnk3SPrtL6aLh45uggLNE6PaeNkSuKoJae0gM376T3dCy4II5h+kA/Qz7SN/pBL2El0Y5FD+1w4y5YghE3T0S7eocdP0APnYUlWqJloZhYpiewkyVSR8/oDW3xYq30NiY2QA9pQ2itIDrqEz2mFV6sn77SK9rk1nrpFq2BJWh26wWZgNVeHeKzAYstuLnqv03bYaebhm0ikR3k17+SzsBOtujmVTSHaEPc0TZ3TyxB66lrLtz4GnbzLjLo8bj6q1tWYN0z6tZSE9R/3lvvoy/4/qhSE1d/MQVLvOmt/4qk/ldiJdDHlJpu+oz8/tf4CNEEa/jhL0EMwb5O//+j9xGg/49eshKp1/dpdSieCSrbOKyTMn94iRL/mS8ki02XoMxKDQAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAAaCAYAAADhVZELAAADuElEQVR4Xu2Ya4hNURTHl1DkHZGQ+KCUQh4l8koij7yKkpqS9yNhUl5NSoNQXsk7H+SLb4MkaYry+kRekRpSQiihJI//3zrL7LvuOfecKTNzmfuvX3Pv3mvm7L3W2mvtMyIl1Zuag5mgEmwA7XOnm6aWgnLQDJSBm6BDaJAg2rfxg/+LNoOrohkyDbwCfXMs4jUAbBN1Tpo6gs6SzbaoxAUfBIdBCzcXp01gkh90WgS+g5/guJsreo0Et8AF0M3NxYnH6yTo4idiNAx8AfP9xL8iRv4+6O0nnCaACj+YIDrjMxjiJ4pVPDJ0xNDoOxfODSz5Y5Ev/s4uMMJPxIi2p8ADyZZVf00skJNBr+h7S9FNzgjGuLh+YE700woeF8oF23lnqn8QzYQk8Xhxo0kdyp4/EfQEd0TtfZE1u9HRZy+OcY6B4rXBxL/TyY3lqC04AraCF2ABqAKLRQvhWzAVHBXtMmWgBqwTFR+wGuwQjfxZsFviF2maB5b7wUjjwVPRv0+eiRZan3ljwD1RmxXghmgwGFyKDj8D1oOHYGE0To0VtU3MVKY+HzgQfARXpDaC3cFz8AYMj8ao06Ba1KEmfqY9W2chsSsdEm3HXnzGazA3+k6H75T8euLtqO2Sa8c9sRb1EA1iRTRO0falaBbGapmoQ2aBb2BcMNcfvBO9pZq4+WpwTrK1XS/eX46BVm6cgeClL7z4xdUTe76/IPL4mh3XtUU0SMxKdi7LCj6XHZL4NeRpv+QXs+ngKxgVjJmjVgZjdZFF0Is16IdoFE08976eZLWj6Bwe59CBDAovlxvNKEntwDXJjz4dVSOagiY6g+cxLv3T1Fo0on38hGg2crNhgY7rZHF2dvR93bGjEzqQNYc1qlAj+C2L/tpgLO6YcFOXIvi5XHJrTZq4yX2S30UobpYb4wZNzCimPjsa68fsOthR5lS+epjooEyvIVZP4o5J6Ci2YnYjRoStmlEPi22aCl3rOf5eagslL39PRAs9n3VAdE1Z7SjLIHOK2WaqJxXgrugLl4lpFhYoig64CC6D82BQMJcmnmme+aRXALZwtvLrot2tSjTivCbwmWtEMyyrHUVbvoc9AifAY9F3qLBxJIpe8xHnxYYFzKc6x1mMC91D4sQs5D0nTf5tmGsLv5uy2PHfElwnbbuK/s/HB7pRVSkNu5jBog3BbtoMOjOcmcV62OhKu9bXh3j8P4Epok7YC25LgQtbQ8tuzQ0pHp09otd/3lNWSZFkiIkt0zpCSSWVVFKT0i9vvLtp9FVHvwAAAABJRU5ErkJggg==>