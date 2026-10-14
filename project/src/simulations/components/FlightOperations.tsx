import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane, Clock, Zap, Activity,
  Radio, Settings, Eye, Target, Gauge,
} from 'lucide-react';
import UniversalPopup from './UniversalPopup';
import SOPPanel, { SOPPanelStep } from './SOPPanel';
import { usePopup } from '../hooks/usePopup';
import { mockFlights } from '../data/mockData';
import IsoAirportScene from '../scenes/IsoAirportScene';
import {
  AIRPORT_LAYOUT,
  getAllGates,
  buildArrivalRoute,
  APPROACH_START_X,
  RUNWAY_EXIT_X,
  TAXI_LANE_X,
} from '../scenes/airportLayout';
import { useRouteFollower, useManagedTimers, RoutePhase } from '../scenes/motion';
import { sampleRoute } from '../scenes/route';

interface FlightOperationsProps {
  onSimulationComplete?: () => void;
  onPhaseChange?: (phase: string, data: any) => void;
}

/**
 * Base ground speed for the arrival, in layout units per second.
 *
 * Held deliberately low: the whole point of the screen is that an operator can
 * follow the aircraft from final approach onto the stand while reading the SOP
 * step beside it. At the previous 150 u/s the whole arrival was over in about
 * eight seconds.
 */
const ARRIVAL_SPEED = 30;

/**
 * The arrival procedure, shown beside the airfield. Each step lines up with a
 * phase the route follower reports, so the checklist and the aircraft on
 * screen are always describing the same moment.
 */
const ARRIVAL_SOP: SOPPanelStep[] = [
  { action: 'FIDS reports inbound flight — AO-S arrival sequence armed', duration: 20, responsible: 'AO-S Core', critical: false },
  { action: 'Approach lighting sequenced for the active runway', duration: 30, responsible: 'Airfield Lighting', critical: true },
  { action: 'Touchdown — runway edge and centreline lighting to full', duration: 25, responsible: 'Airfield Lighting', critical: true },
  { action: 'Rollout complete; high-speed exit cleared onto taxiway M', duration: 20, responsible: 'Apron Control', critical: true },
  { action: 'Taxi to stand — gate HVAC pre-conditioning and lounge prep', duration: 45, responsible: 'Building Systems', critical: false },
  { action: 'Stand entry — jetbridge released, baggage belts spun up', duration: 30, responsible: 'Ground Handling', critical: true },
  { action: 'On-blocks — doors open, disembarkation begins', duration: 40, responsible: 'Turnaround Coordinator', critical: false },
];

/** Which arrival step the reported phase corresponds to. */
const PHASE_TO_STEP: Record<string, number> = {
  standby: -1,
  'fids-trigger': 0,
  approaching: 1,
  landing: 2,
  'runway-exit': 3,
  taxi: 4,
  'parking-approach': 5,
  parked: 6,
  'at-terminal': 6,
};


/**
 * Reports which airfield surface the aircraft is standing on. Derived from the
 * shared layout rather than hard-coded boxes, which had drifted out of sync
 * with the geometry and reported "Invalid Position" almost everywhere.
 */
const describeSurface = (pos: { x: number; y: number }): string => {
  const onRunway = (rw: typeof AIRPORT_LAYOUT.runway1) =>
    pos.x >= rw.centerline.x - rw.length / 2 - 12 &&
    pos.x <= rw.centerline.x + rw.length / 2 + 12 &&
    Math.abs(pos.y - rw.centerline.y) <= rw.width / 2 + 8;

  if (onRunway(AIRPORT_LAYOUT.runway1)) return `Asphalt (Runway ${AIRPORT_LAYOUT.runway1.id})`;
  if (onRunway(AIRPORT_LAYOUT.runway2)) return `Asphalt (Runway ${AIRPORT_LAYOUT.runway2.id})`;

  // Stands sit 20 units apart, so pick the nearest rather than the first that
  // falls inside the tolerance - otherwise parking at A2 reported A1.
  const nearest = getAllGates()
    .map(g => ({ g, d: Math.hypot(g.position.x - pos.x, g.position.y - pos.y) }))
    .sort((a, b) => a.d - b.d)[0];
  if (nearest && nearest.d < 16) return `Concrete (Stand ${nearest.g.id})`;

  // Apron slab painted in the scene spans roughly x 466-792, y 102-432.
  if (pos.x >= 450 && pos.x <= 792 && pos.y >= 100 && pos.y <= 434) return 'Concrete (Apron)';
  if (pos.x >= 330 && pos.x <= 520 && pos.y >= 110 && pos.y <= 410) return 'Asphalt (Taxiway)';
  if (pos.x < 200) return 'Approach Corridor (Airborne)';
  return 'Airfield Grass';
};

export const FlightOperations: React.FC<FlightOperationsProps> = ({
  onSimulationComplete,
  onPhaseChange 
}) => {
  const [currentPhase, setCurrentPhase] = useState<string>('standby');
  const [isLanding, setIsLanding] = useState(false);
  const [systemsActive, setSystemsActive] = useState(false);
  const [timer, setTimer] = useState(240);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [aircraftPosition, setAircraftPosition] = useState({ x: 0, y: 150 });
  const [activeLights, setActiveLights] = useState<number[]>([]);
  /** Ground-space heading of the aircraft; the scene projects it to screen. */
  const [aircraftTangent, setAircraftTangent] = useState({ x: 1, y: 0 });
  const [selectedGate, setSelectedGate] = useState<string>('A2');
  const [selectedRunway, setSelectedRunway] = useState<string>('09/27');
  const [selectedAircraft, setSelectedAircraft] = useState<string>('AI127');
  const [simSpeed, setSimSpeed] = useState(1);
  const [flights] = useState(mockFlights);
  const { schedule, clearAll } = useManagedTimers();
  const { isOpen, popupData, position, openPopup, closePopup, generateSystemPopupData, generateAircraftPopupData } = usePopup();

  const [hbmsStatus, setHbmsStatus] = useState({
    FIDS: { status: 'active', lastUpdate: '14:32:15' },
    Lighting: { status: 'manual', power: 85 },
    HVAC: { status: 'pre-conditioning', temp: 22.5 },
    Access: { status: 'manual', gates: 3 },
    Baggage: { status: 'ready', belts: 2 }
  });

  const getCurrentRunway = () => {
    return selectedRunway === '09/27' ? AIRPORT_LAYOUT.runway1 : AIRPORT_LAYOUT.runway2;
  };

  const runwayCfg = getCurrentRunway();
  const gateCfg = getAllGates().find(g => g.id === selectedGate) ?? getAllGates()[0];

  /** Where the inbound aircraft holds before the run starts. */
  const holdPoint = { x: APPROACH_START_X, y: runwayCfg.centerline.y };

  /** The actual painted route: final approach -> runway -> taxiway -> stand. */
  const arrivalRoute = useMemo(
    () => sampleRoute(buildArrivalRoute(runwayCfg, gateCfg), 2),
    [runwayCfg.centerline.x, runwayCfg.centerline.y, runwayCfg.length, gateCfg.position.x, gateCfg.position.y]
  );

  /**
   * Phase boundaries are derived from where the route actually is, not from
   * guessed time offsets, so the reported phase always matches what the
   * aircraft is doing on screen.
   */
  const phaseMarks = useMemo(() => {
    const { pts, cum, total } = arrivalRoute;
    if (total <= 0) return [] as RoutePhase[];

    const ry = runwayCfg.centerline.y;
    const threshold = runwayCfg.centerline.x - runwayCfg.length / 2;
    const fracWhere = (test: (p: { x: number; y: number }) => boolean, fallback: number) => {
      for (let i = 0; i < pts.length; i++) if (test(pts[i])) return cum[i] / total;
      return fallback;
    };

    const tTouchdown = fracWhere(p => p.x >= threshold, 0.2);
    const tExit = fracWhere(p => p.x >= RUNWAY_EXIT_X, 0.5);
    const tOffRunway = fracWhere(p => Math.abs(p.y - ry) > 18, 0.6);
    const tStandTurn = fracWhere(
      p => Math.abs(p.y - gateCfg.position.y) < 6 && p.x > TAXI_LANE_X + 8,
      0.9
    );

    return [
      {
        at: 0,
        phase: 'approaching',
        onEnter: () => {
          activateLightGroup([0, 1, 2, 3, 4], 180);
          setHbmsStatus(prev => ({
            ...prev,
            FIDS: { status: 'active', lastUpdate: new Date().toLocaleTimeString('en-GB') },
            Lighting: { status: 'approach-seq', power: 92 },
          }));
          onPhaseChange?.('approaching', { runway: runwayCfg.id, distance: '5NM' });
        },
      },
      {
        at: tTouchdown,
        phase: 'landing',
        onEnter: () => {
          activateLightGroup([5, 6, 7, 8, 9, 10, 11, 12], 120);
          setHbmsStatus(prev => ({ ...prev, Lighting: { status: 'runway-active', power: 100 } }));
          onPhaseChange?.('landing', { runway: runwayCfg.id });
        },
      },
      {
        at: tExit,
        phase: 'runway-exit',
        onEnter: () => {
          activateLightGroup([13, 14, 15, 16, 17], 100);
          setHbmsStatus(prev => ({
            ...prev,
            Lighting: { status: 'taxi-guidance', power: 88 },
            HVAC: { status: 'pre-conditioning', temp: 23.4 },
          }));
        },
      },
      {
        at: tOffRunway,
        phase: 'taxi',
        onEnter: () => {
          setHbmsStatus(prev => ({
            ...prev,
            Access: { status: 'preparing', gates: 3 },
            Baggage: { status: 'spinning-up', belts: 1 },
          }));
          onPhaseChange?.('taxi', { gate: selectedGate });
        },
      },
      {
        at: tStandTurn,
        phase: 'parking-approach',
        onEnter: () => {
          setHbmsStatus(prev => ({
            ...prev,
            HVAC: { status: 'conditioning', temp: 22.1 },
            Access: { status: 'unlocking', gates: 3 },
          }));
        },
      },
    ] as RoutePhase[];
  }, [arrivalRoute, runwayCfg.id, runwayCfg.centerline.y, runwayCfg.centerline.x, runwayCfg.length, gateCfg.position.y, selectedGate]);

  const activateLightGroup = (ids: number[], stagger: number) => {
    ids.forEach((lightId, i) => {
      schedule(() => setActiveLights(prev => (prev.includes(lightId) ? prev : [...prev, lightId])), i * stagger);
    });
  };

  /**
   * The arrival is expressed as a route rather than a stack of setTimeouts, so
   * the aircraft actually flies/rolls/taxis between waypoints instead of
   * teleporting, and every leg advances the AO-S subsystem states it is
   * supposed to be orchestrating.
   */
  const follower = useRouteFollower({
    active: isLanding,
    route: arrivalRoute,
    // Ground units/second. Fast on final, braking through the rollout, then a
    // realistic taxi crawl into the stand.
    speed: ARRIVAL_SPEED * simSpeed,
    phases: phaseMarks,
    speedAt: (t) => {
      const marks = phaseMarks;
      const tExit = marks[2]?.at ?? 0.5;
      const tOff = marks[3]?.at ?? 0.6;
      const tStand = marks[4]?.at ?? 0.9;
      if (t < (marks[1]?.at ?? 0.2)) return 1;      // final approach
      if (t < tExit) return 0.62;                    // touchdown + rollout
      if (t < tOff) return 0.4;                      // high-speed turn off
      if (t < tStand) return 0.35;                   // taxi
      return 0.28;                                   // nosing onto the stand
    },
    onComplete: () => {
      setCurrentPhase('parked');
      setHbmsStatus(prev => ({
        ...prev,
        Lighting: { status: 'stand-lit', power: 74 },
        HVAC: { status: 'active', temp: 21.5 },
        Access: { status: 'open', gates: 3 },
        Baggage: { status: 'active', belts: 2 },
      }));
      onPhaseChange?.('parked', { gate: selectedGate, passengers: 156 });

      schedule(() => {
        setCurrentPhase('at-terminal');
        onPhaseChange?.('at-terminal', { gate: selectedGate, passengers: 156 });
      }, 2500);

      // Hold at the stand, then release the airfield back to standby.
      schedule(() => {
        setIsLanding(false);
        setIsTimerActive(false);
        setSystemsActive(false);
        setActiveLights([]);
        setCurrentPhase('standby');
        setHbmsStatus({
          FIDS: { status: 'active', lastUpdate: new Date().toLocaleTimeString('en-GB') },
          Lighting: { status: 'manual', power: 85 },
          HVAC: { status: 'idle', temp: 24.0 },
          Access: { status: 'manual', gates: 3 },
          Baggage: { status: 'ready', belts: 2 },
        });
        onSimulationComplete?.();
      }, 7000);
    },
  });

  // Mirror the animated pose into the state the rest of the panel reads.
  useEffect(() => {
    if (!isLanding) return;
    setAircraftPosition(follower.pos);
    setAircraftTangent(follower.tan);
    if (follower.phase && follower.phase !== 'standby') setCurrentPhase(follower.phase);
  }, [isLanding, follower.pos, follower.tan, follower.phase]);

  const simulateHBMSFlightOperation = () => {
    if (isLanding) return;

    clearAll();
    setActiveLights([]);
    setAircraftPosition(holdPoint);
    setAircraftTangent({ x: 1, y: 0 });
    setCurrentPhase('fids-trigger');
    setSystemsActive(true);
    setIsTimerActive(true);
    setTimer(240);
    setHbmsStatus(prev => ({
      ...prev,
      FIDS: { status: 'inbound-detected', lastUpdate: new Date().toLocaleTimeString('en-GB') },
    }));

    // Let the FIDS trigger read on screen before the aircraft starts moving.
    schedule(() => setIsLanding(true), 900);
  };

  const handleElementClick = (elementType: string, elementData: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };

    let popupData;
    switch (elementType) {
      case 'aircraft':
        const selectedFlight = flights.find(f => f.flightNumber === selectedAircraft);
        popupData = generateAircraftPopupData(selectedAircraft, {
          ...elementData,
          position: aircraftPosition,
          status: currentPhase === 'standby' ? 'parked' : 'operational',
          airline: selectedFlight?.airline || 'Air India',
          passengers: selectedFlight?.passengerLoad || 156,
          gate: selectedGate,
          runway: selectedRunway
        });
        break;
      case 'gate':
        popupData = generateSystemPopupData(`Gate ${elementData.id}`, {
          ...elementData,
          coordinates: elementData.position,
          status: elementData.id === selectedGate ? 'occupied' : 'available',
          capacity: elementData.size === 'large' ? 300 : 200
        });
        break;
      case 'runway':
        popupData = generateSystemPopupData(`Runway ${elementData.id}`, {
          coordinates: elementData.centerline,
          status: isLanding && selectedRunway === elementData.id ? 'occupied' : 'available',
          length: `${elementData.length * 10}m`,
          surface: 'Concrete'
        });
        break;
      default:
        popupData = generateSystemPopupData(elementType, elementData);
    }

    openPopup(popupData, clickPosition);
  };

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerActive, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /** Which arrival SOP step the aircraft's current position corresponds to. */
  const arrivalStep = PHASE_TO_STEP[currentPhase] ?? (isLanding ? 4 : -1);

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Flight Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="hbms-control-panel p-3 md:p-4 cursor-pointer hover:bg-sim-800/40 transition-colors"
             onClick={(e) => handleElementClick('aircraft', { phase: currentPhase }, e)}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-lg font-semibold text-sim-100">{selectedAircraft}</h3>
              <p className="text-xs md:text-sm text-sim-300">
                {flights.find(f => f.flightNumber === selectedAircraft)?.airline || 'Air India'}
              </p>
            </div>
            <Plane className={`h-5 w-5 md:h-6 md:w-6 ${isLanding ? 'text-simteal-400 animate-bounce' : 'text-sim-400'}`} />
          </div>
          <div className="mt-2 md:mt-3">
            <p className="text-xs text-sim-400">Flight Status</p>
            <p className="text-xs md:text-sm font-medium text-sim-100 capitalize">{currentPhase.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="hbms-control-panel p-3 md:p-4 cursor-pointer hover:bg-sim-800/40 transition-colors"
             onClick={(e) => handleElementClick('AO-S Core', { active: systemsActive }, e)}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-lg font-semibold text-sim-100">AO-S Core</h3>
              <p className="text-xs md:text-sm text-sim-300">System Integration</p>
            </div>
            <Activity className={`h-5 w-5 md:h-6 md:w-6 ${systemsActive ? 'text-emerald-400 animate-pulse' : 'text-sim-400'}`} />
          </div>
          <div className="mt-2 md:mt-3">
            <p className="text-xs text-sim-400">Integration Status</p>
            <p className="text-xs md:text-sm font-medium text-sim-100">{systemsActive ? 'Active' : 'Standby'}</p>
          </div>
        </div>

        <div className="hbms-control-panel p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-lg font-semibold text-sim-100">Operation Timer</h3>
              <p className="text-xs md:text-sm text-sim-300">Landing to Docking</p>
            </div>
            <Clock className={`h-5 w-5 md:h-6 md:w-6 ${isTimerActive ? 'text-simgold-400 animate-pulse' : 'text-sim-400'}`} />
          </div>
          <div className="mt-2 md:mt-3">
            <p className="text-xs text-sim-400">Time Remaining</p>
            <p className={`text-sm md:text-lg font-bold ${timer < 60 ? 'text-simgold-400' : 'text-simteal-400'}`}>
              {formatTime(timer)}
            </p>
          </div>
        </div>

        <div className="hbms-control-panel p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-lg font-semibold text-sim-100">Configuration</h3>
              <p className="text-xs md:text-sm text-sim-300">Flight Settings</p>
            </div>
            <Target className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
          </div>
          <div className="mt-2 md:mt-3 space-y-2">
            <div>
              <label className="text-xs text-sim-400">Aircraft:</label>
              <select 
                value={selectedAircraft} 
                onChange={(e) => setSelectedAircraft(e.target.value)}
                className="w-full bg-sim-800 border border-sim-600 rounded px-2 py-1 text-sim-200 text-xs relative z-10"
              >
                {flights.map(flight => (
                  <option key={flight.id} value={flight.flightNumber}>
                    {flight.flightNumber} - {flight.airline}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-sim-400">Runway:</label>
              <select 
                value={selectedRunway} 
                onChange={(e) => setSelectedRunway(e.target.value)}
                className="w-full bg-sim-800 border border-sim-600 rounded px-2 py-1 text-sim-200 text-xs relative z-10"
              >
                <option value="09/27">Runway 09/27 (Primary)</option>
                <option value="14/32">Runway 14/32 (Secondary)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-sim-400">Gate:</label>
              <select 
                value={selectedGate} 
                onChange={(e) => setSelectedGate(e.target.value)}
                className="w-full bg-sim-800 border border-sim-600 rounded px-2 py-1 text-sim-200 text-xs relative z-10"
              >
                {getAllGates().map(gate => (
                  <option key={gate.id} value={gate.id}>Gate {gate.id}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Digital Twin Airport Layout */}
      <div className="digital-twin-container w-full">
        <div className="relative z-10 p-4 md:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-bold text-sim-100 flex items-center space-x-3">
              <div className="p-2 bg-simteal-600/20 rounded-lg border border-simteal-500/30">
                <Eye className="h-5 w-5 text-simteal-400" />
              </div>
              <span>AO-S — Precision Airport Operations</span>
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-sim-800/40 border border-sim-700/40 rounded-lg px-3 py-2">
                <Gauge className="w-4 h-4 text-simteal-400" />
                <label className="text-xs text-sim-400">Speed</label>
                <select
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  disabled={isLanding}
                  className="bg-sim-800 border border-sim-600 rounded px-2 py-1 text-sim-200 text-xs"
                >
                  <option value={0.5}>0.5x — study</option>
                  <option value={1}>1x — normal</option>
                  <option value={2}>2x — fast</option>
                </select>
              </div>

              <button
                onClick={simulateHBMSFlightOperation}
                disabled={isLanding}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  isLanding
                    ? 'bg-sim-700/50 text-sim-400 cursor-not-allowed border border-sim-600/30'
                    : 'bg-gradient-to-r from-simteal-600 to-simgold-600 hover:from-simteal-700 hover:to-simgold-700 text-white shadow-lg border border-simteal-500/30'
                }`}
              >
                {isLanding ? 'AO-S operation in progress…' : 'Simulate AO-S flight operation'}
              </button>
            </div>
          </div>

          {/* Enhanced coordinate and surface validation */}
          <div className="bg-sim-800/30 rounded-lg p-3 border border-sim-700/30 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm min-w-max">
              <div className="text-sim-400">Aircraft position:</div>
              <div className="text-emerald-400 tabular-nums">X {aircraftPosition.x.toFixed(1)}</div>
              <div className="text-emerald-400 tabular-nums">Y {aircraftPosition.y.toFixed(1)}</div>
              <div className="text-sim-600">|</div>
              <div className="text-simteal-400">Surface: {describeSurface(aircraftPosition)}</div>
              <div className="text-sim-600">|</div>
              <div className="text-simgold-400">{selectedAircraft} → RW {selectedRunway} → Stand {selectedGate}</div>
              <div className="text-sim-600">|</div>
              <div className="text-sim-300">Phase: <span className="capitalize">{currentPhase.replace(/-/g, ' ')}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)] gap-4 items-stretch">
            {/* ---- left rail: arrival procedure + subsystem state ---- */}
            <div className="flex flex-col gap-4 min-w-0">
              <SOPPanel
                className="flex-1 min-h-[300px] max-h-[480px]"
                accent="teal"
                title="AO-S ARR · Arrival Sequence"
                trigger={`${selectedAircraft} inbound — RW ${selectedRunway} to stand ${selectedGate}`}
                priority="standard"
                steps={ARRIVAL_SOP}
                currentStep={arrivalStep}
                active={systemsActive || arrivalStep >= 0}
                subtitle="Each step is triggered by where the aircraft is on the airfield, not by a timer."
              />

              <div className="hbms-control-panel p-3">
                <h4 className="text-xs font-semibold text-sim-100 mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <Settings className="w-3.5 h-3.5 text-simteal-400" />
                  <span>AO-S System Status</span>
                </h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(hbmsStatus).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center cursor-pointer hover:bg-sim-800/40 px-1.5 py-1 rounded"
                      onClick={(e) => handleElementClick(key, value, e)}
                    >
                      <span className="text-sim-400 capitalize">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className={`hbms-status-dot ${value.status === 'active' ? 'operational' : 'warning'}`} />
                        <span className="text-sim-200 text-[length:calc(11px*var(--fs))]">{value.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ---- the airfield ---- */}
            <div className="relative flex bg-sim-900/90 rounded-xl overflow-hidden border border-sim-700/50 min-h-[320px]">
              <IsoAirportScene
                aircraftPosition={aircraftPosition}
                aircraftTangent={aircraftTangent}
                arrivalRoutePath={buildArrivalRoute(runwayCfg, gateCfg)}
                currentPhase={currentPhase}
                isLanding={isLanding}
                selectedGate={selectedGate}
                selectedRunway={selectedRunway}
                selectedAircraft={selectedAircraft}
                activeLights={activeLights}
                onElementClick={handleElementClick}
              />
            </div>
          </div>

          {/* AO-S System Integration Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="hbms-control-panel p-4 cursor-pointer hover:bg-sim-800/40 transition-colors"
                 onClick={(e) => handleElementClick('FIDS Integration', { status: systemsActive ? 'active' : 'standby' }, e)}>
              <div className="flex items-center space-x-3 mb-2">
                <Radio className="w-4 h-4 text-simteal-400" />
                <h4 className="font-semibold text-sim-200 text-sm">FIDS ↔ AO-S</h4>
              </div>
              <p className="text-xs text-sim-300 mb-2">Real-time flight data triggers building responses</p>
              <div className={`flex items-center space-x-2 ${systemsActive ? 'text-emerald-400' : 'text-sim-500'}`}>
                <div className={`hbms-status-dot ${systemsActive ? 'operational' : 'offline'}`} />
                <span className="text-xs">Data flow: {systemsActive ? 'Active' : 'Standby'}</span>
              </div>
            </div>

            <div className="hbms-control-panel p-4 cursor-pointer hover:bg-sim-800/40 transition-colors"
                 onClick={(e) => handleElementClick('Airfield Lighting', { activeLights: activeLights.length }, e)}>
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-4 h-4 text-simteal-400" />
                <h4 className="font-semibold text-sim-200 text-sm">Airfield Lighting</h4>
              </div>
              <p className="text-xs text-sim-300 mb-2">Approach, runway and taxi guidance to the stand</p>
              <div className={`flex items-center space-x-2 ${activeLights.length > 0 ? 'text-simgold-400' : 'text-sim-500'}`}>
                <div className={`hbms-status-dot ${activeLights.length > 0 ? 'operational' : 'offline'}`} />
                <span className="text-xs">Lights active: {activeLights.length}</span>
              </div>
            </div>

            <div className="hbms-control-panel p-4 cursor-pointer hover:bg-sim-800/40 transition-colors"
                 onClick={(e) => handleElementClick('Building Systems', { phase: currentPhase }, e)}>
              <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-sim-200 text-sm">Building Systems</h4>
              </div>
              <p className="text-xs text-sim-300 mb-2">HVAC, access control and energy optimisation</p>
              <div className={`flex items-center space-x-2 ${currentPhase === 'at-terminal' ? 'text-emerald-400' : 'text-sim-500'}`}>
                <div className={`hbms-status-dot ${currentPhase === 'at-terminal' ? 'operational' : 'warning'}`} />
                <span className="text-xs">Integration: {currentPhase === 'at-terminal' ? 'Complete' : 'Processing'}</span>
              </div>
            </div>

            <div className="hbms-control-panel p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-sim-200 text-sm">Runway Operations</h4>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { id: '09/27', label: 'Primary', len: '2500 m' },
                  { id: '14/32', label: 'Secondary', len: '2000 m' },
                ].map(rw => (
                  <button
                    key={rw.id}
                    onClick={() => !isLanding && setSelectedRunway(rw.id)}
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      selectedRunway === rw.id
                        ? 'border-simteal-400 bg-simteal-950/30'
                        : 'border-sim-600/60 bg-sim-800/30 hover:border-simteal-500/50'
                    }`}
                  >
                    <div className="font-medium text-sim-200">RW {rw.id} ({rw.label})</div>
                    <div className="text-sim-400">{rw.len} · {selectedRunway === rw.id ? 'In use' : 'Available'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Universal Popup */}
        <UniversalPopup
          isOpen={isOpen}
          data={popupData}
          onClose={closePopup}
          position={position}
        />
      </div>
    </div>
  );
};