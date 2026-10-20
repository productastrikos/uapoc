import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Package, AlertTriangle, Activity, Shield, Eye,
  Plane, PlayCircle, PauseCircle, AlertOctagon,
  Layers, Target, Wifi, Monitor, Gauge,
} from 'lucide-react';
import UniversalPopup from './UniversalPopup';
import SOPPanel, { SOPPanelStep } from './SOPPanel';
import { usePopup } from '../hooks/usePopup';
import IsoBaggageScene from '../scenes/IsoBaggageScene';
import {
  getBagRoute,
  RouteKind,
  MACHINE_STOPS,
  getTrunkLength,
  liftAlongRoute,
} from '../scenes/baggageRoutes';
import { routeAt } from '../scenes/route';

interface BaggageOperationsProps {
  onSimulationComplete?: () => void;
  onPhaseChange?: (phase: string, data: any) => void;
  operationType?: 'departure' | 'arrival';
}

// Enhanced baggage system types with SOP integration
interface BagItem {
  id: string;
  flightNumber: string;
  passengerName: string;
  weight: number;
  contents: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'anomaly';
  screeningStatus: 'pending' | 'screening' | 'cleared' | 'flagged' | 'manual-check' | 'sop-triggered';
  position: { x: number; y: number };
  /** Which conveyor tier this bag is riding (1-3). */
  level?: number;
  /** Which branch out of the diverter this bag is taking. */
  routeKind?: RouteKind;
  /** Arc length travelled along its route, in belt units. */
  dist?: number;
  /** Height above the hall floor - full tier height on the deck, decaying
   *  down the reject chute so the bag visibly rides the slide. */
  lift?: number;
  /** Ground-space direction of travel, for orienting the bag on the belt. */
  heading?: { x: number; y: number };
  /** Set while the bag is stopped inside a scanner. */
  holdUntil?: number;
  /** How many scanner stops this bag has already been through. */
  clearedStops?: number;
  currentStation: string;
  anomalies: string[];
  processingTime: number;
  destination?: string;
  origin?: string;
  carouselNumber?: number;
  gateNumber?: string;
  sopTriggered?: boolean;
  threatLevel?: number;
}

interface ScreeningMachine {
  id: string;
  name: string;
  type: 'CTX-5800' | 'CTX-9800' | 'EDS-Level3' | 'X-Ray-Dual' | 'AI-Enhanced';
  status: 'operational' | 'failed' | 'maintenance' | 'overloaded';
  throughput: number;
  position: { x: number; y: number };
  currentBag?: string;
  processingQueue: string[];
  falseAlarmRate: number;
  detectionCapabilities: string[];
  lastMaintenance: Date;
  operationalHours: number;
  aiConfidence?: number;
}

interface SOPProtocol {
  id: string;
  trigger: string;
  type: 'security-anomaly' | 'explosive-detection' | 'prohibited-item' | 'system-failure';
  steps: Array<{
    action: string;
    duration: number;
    responsible: string;
    critical: boolean;
  }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  currentStep: number;
  isActive: boolean;
}

/**
 * Belt speed in ground units per second.
 *
 * Deliberately slow: the point of the screen is that a viewer can watch a bag
 * arrive at a scanner, get a verdict, and be thrown down the right chute. At
 * demo speed the sortation happened faster than it could be read.
 */
const BELT_SPEED = 24;
/** How long a bag sits inside a scanner tunnel, at 1x. */
const SCAN_DWELL_MS = 2400;
/** Where each tier's induction line sits, for bags still queued at check-in. */
const INDUCTION_Y: Record<number, number> = { 1: 400, 2: 300, 3: 200 };
/** Minimum gap between two bags on the same belt, in belt units. */
const HEADWAY = 26;

/**
 * Multi-level conveyor layout.
 *
 * The segment paths here are exactly the routes bags travel (trunk + cleared
 * branch from baggageRoutes), so a belt can never be painted somewhere a bag
 * does not go, or vice versa.
 */
const ENHANCED_BAGGAGE_LAYOUT = {
  levels: [
    {
      id: 'level-1',
      height: 50,
      color: '#045055',
      segments: [
        { id: 'L1-TRUNK', path: 'M100,400 L250,400 L250,350 L400,350 L475,350', width: 24, speed: 1.2 },
        { id: 'L1-CLEARED', path: 'M475,350 L550,350 L550,300 L690,300', width: 22, speed: 1.0 },
      ],
    },
    {
      id: 'level-2',
      height: 100,
      color: '#018587',
      segments: [
        { id: 'L2-TRUNK', path: 'M100,300 L250,300 L250,250 L400,250 L475,250', width: 24, speed: 1.5 },
        { id: 'L2-CLEARED', path: 'M475,250 L550,250 L550,200 L690,200', width: 22, speed: 1.3 },
      ],
    },
    {
      id: 'level-3',
      height: 150,
      color: '#01A3A4',
      segments: [
        { id: 'L3-TRUNK', path: 'M100,200 L250,200 L250,150 L400,150 L475,150', width: 24, speed: 1.8 },
        { id: 'L3-CLEARED', path: 'M475,150 L550,150 L550,100 L690,100', width: 22, speed: 1.6 },
      ],
    },
  ],

  // Enhanced screening stations with AI capabilities
  screeningStations: [
    { id: 'CTX-AI-001', position: { x: 178, y: 400 }, level: 1, type: 'AI-Enhanced', aiEnabled: true },
    { id: 'CTX-5800-001', position: { x: 178, y: 300 }, level: 2, type: 'CTX-5800', aiEnabled: false },
    { id: 'CTX-9800-001', position: { x: 178, y: 200 }, level: 3, type: 'CTX-9800', aiEnabled: true },
    { id: 'EDS-L3-001', position: { x: 322, y: 350 }, level: 1, type: 'EDS-Level3', aiEnabled: true },
    { id: 'XRAY-001', position: { x: 322, y: 250 }, level: 2, type: 'X-Ray-Dual', aiEnabled: false },
  ],

  // Smart diverters, sitting at the branch point of each tier's route
  diverters: [
    { id: 'SMART-DIV-001', position: { x: 475, y: 350 }, level: 1 },
    { id: 'SMART-DIV-002', position: { x: 475, y: 250 }, level: 2 },
    { id: 'SMART-DIV-003', position: { x: 475, y: 150 }, level: 3 },
  ],

  zones: {
    checkin: { x: 50, y: 300, width: 80, height: 200 },
    manualInspection: { x: 500, y: 400, width: 120, height: 100 },
    sopResponse: { x: 350, y: 450, width: 100, height: 80 },
    holdArea: { x: 200, y: 480, width: 140, height: 60 },
    approvedArea: { x: 650, y: 100, width: 100, height: 400 },
  },
};

// Enhanced SOP Protocols for baggage anomalies
const BAGGAGE_SOP_PROTOCOLS: SOPProtocol[] = [
  {
    id: 'SOP-001',
    trigger: 'Explosive Material Detected',
    type: 'explosive-detection',
    steps: [
      { action: 'Immediate bag isolation and conveyor stop', duration: 10, responsible: 'System Auto', critical: true },
      { action: 'Alert security team and bomb disposal unit', duration: 30, responsible: 'Security Control', critical: true },
      { action: 'Evacuate immediate area (50m radius)', duration: 60, responsible: 'Security Team', critical: true },
      { action: 'Manual inspection with protective equipment', duration: 300, responsible: 'Bomb Disposal', critical: true },
      { action: 'Passenger notification and enquiry', duration: 600, responsible: 'Security Officer', critical: false },
      { action: 'System reset and area clearance', duration: 120, responsible: 'Technical Team', critical: false },
    ],
    priority: 'critical',
    estimatedDuration: 1120,
    currentStep: 0,
    isActive: false,
  },
  {
    id: 'SOP-002',
    trigger: 'Prohibited Weapon Detected',
    type: 'prohibited-item',
    steps: [
      { action: 'Bag diversion to manual inspection', duration: 15, responsible: 'Diverter System', critical: true },
      { action: 'Security team notification', duration: 20, responsible: 'Control Center', critical: true },
      { action: 'Physical bag inspection', duration: 180, responsible: 'Security Officer', critical: true },
      { action: 'Passenger identification and screening', duration: 240, responsible: 'Security Team', critical: false },
      { action: 'Item confiscation or approval', duration: 60, responsible: 'Senior Officer', critical: false },
      { action: 'Bag reprocessing or rejection', duration: 90, responsible: 'Baggage Handler', critical: false },
    ],
    priority: 'high',
    estimatedDuration: 605,
    currentStep: 0,
    isActive: false,
  },
  {
    id: 'SOP-003',
    trigger: 'Unattended/Suspicious Package',
    type: 'security-anomaly',
    steps: [
      { action: 'Package location marking and isolation', duration: 30, responsible: 'Security Camera', critical: true },
      { action: 'Area monitoring and passenger identification', duration: 120, responsible: 'CCTV Operator', critical: true },
      { action: 'Public announcement for owner identification', duration: 180, responsible: 'PA System', critical: false },
      { action: 'K-9 unit deployment for inspection', duration: 240, responsible: 'Canine Team', critical: true },
      { action: 'Manual inspection if unclaimed', duration: 300, responsible: 'EOD Team', critical: true },
      { action: 'Package removal or destruction', duration: 180, responsible: 'Disposal Team', critical: false },
    ],
    priority: 'high',
    estimatedDuration: 1050,
    currentStep: 0,
    isActive: false,
  },
];

/**
 * The routine screening run, shown beside the scene whenever no incident SOP
 * is active. It is the same procedure the animation is executing, so a viewer
 * can read what the bags on screen are currently doing.
 */
const BHS_STANDARD_SOP: { trigger: string; priority: string; steps: SOPPanelStep[] } = {
  trigger: 'Hold-baggage screening & sortation run',
  priority: 'routine',
  steps: [
    { action: 'Induct bags at check-in; tag read and assigned to a screening tier', duration: 15, responsible: 'Check-in / BHS Control' },
    { action: 'Convey to screening deck along the assigned tier', duration: 25, responsible: 'Sorter PLC' },
    { action: 'Level-1 CT scan — automatic threat decision on each bag', duration: 30, responsible: 'Screening System', critical: true },
    { action: 'Level-2 EDS / X-ray re-scan for anything unresolved', duration: 35, responsible: 'Screening Operator', critical: true },
    { action: 'Diverter sortation — cleared bags run on, rejects pushed onto the chute', duration: 12, responsible: 'Sorter PLC', critical: true },
    { action: 'Cleared bags released to make-up for aircraft loading', duration: 25, responsible: 'Ground Handling' },
    { action: 'Rejects to manual inspection; anomalies to the SOP response bay', duration: 45, responsible: 'Security Officer', critical: true },
  ],
};

// Mock FIDS data
const mockFlights = [
  { flightNumber: 'AI127', airline: 'Air India', departure: '14:30', gate: 'A12', destination: 'DEL', status: 'Boarding' },
  { flightNumber: 'UK955', airline: 'Vistara', departure: '15:45', gate: 'B8', destination: 'BOM', status: 'Check-in' },
  { flightNumber: 'SG8157', airline: 'SpiceJet', departure: '16:20', gate: 'C3', destination: 'BLR', status: 'Delayed' },
  { flightNumber: 'AI348', airline: 'Air India', arrival: '14:15', carousel: 3, origin: 'BOM', status: 'Arrived' },
  { flightNumber: '6E2142', airline: 'IndiGo', arrival: '15:30', carousel: 1, origin: 'DEL', status: 'Baggage' },
];

export const BaggageOperations: React.FC<BaggageOperationsProps> = ({
  onSimulationComplete,
  onPhaseChange,
  operationType = 'departure',
}) => {
  const [currentPhase, setCurrentPhase] = useState<string>('standby');
  const [isSimulating, setIsSimulating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Enhanced baggage and system states
  const [bags, setBags] = useState<BagItem[]>([]);
  /**
   * Always-current view of `bags`. The simulation schedules work with
   * setTimeout, so any `bags` read from the enclosing closure is whatever
   * existed when the run started - which was the array from *before*
   * generateEnhancedBags() populated it, so screening iterated an empty list.
   */
  const bagsRef = useRef<BagItem[]>([]);
  useEffect(() => {
    bagsRef.current = bags;
  }, [bags]);
  const screeningMachinesRef = useRef<ScreeningMachine[]>([]);
  /** Verdicts produced inside the rAF loop, drained into stats on a timer. */
  const statsQueue = useRef<Array<'cleared' | 'flagged'>>([]);

  const [activeSOP, setActiveSOP] = useState<SOPProtocol | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalProcessed: 0,
    clearedBags: 0,
    flaggedBags: 0,
    sopTriggered: 0,
    avgProcessingTime: 0,
    systemEfficiency: 96.8,
    anomaliesDetected: 0,
    threatLevel: 1,
  });

  // Fold screening verdicts into the counters outside the animation frame, so
  // the rAF loop stays a pure position update.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!statsQueue.current.length) return;
      const batch = statsQueue.current.splice(0, statsQueue.current.length);
      setSystemStats(prev => ({
        ...prev,
        totalProcessed: prev.totalProcessed + batch.length,
        clearedBags: prev.clearedBags + batch.filter(v => v === 'cleared').length,
        flaggedBags: prev.flaggedBags + batch.filter(v => v === 'flagged').length,
      }));
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  const [screeningMachines] = useState<ScreeningMachine[]>([
    {
      id: 'CTX-AI-001',
      name: 'Enhanced CTX Scanner',
      type: 'AI-Enhanced',
      status: 'operational',
      throughput: 2400,
      position: { x: 178, y: 400 },
      processingQueue: [],
      falseAlarmRate: 0.005,
      detectionCapabilities: ['Explosives', 'Weapons', 'Liquids', 'AI Threat Analysis', 'Behavioral Patterns'],
      lastMaintenance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      operationalHours: 1247,
      aiConfidence: 98.7,
    },
    {
      id: 'CTX-5800-001',
      name: 'CTX-5800 Primary',
      type: 'CTX-5800',
      status: 'operational',
      throughput: 450,
      position: { x: 178, y: 300 },
      processingQueue: [],
      falseAlarmRate: 0.02,
      detectionCapabilities: ['Explosives', 'Weapons', 'Liquids'],
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      operationalHours: 2847,
    },
    {
      id: 'CTX-9800-001',
      name: 'CTX-9800 High-Speed',
      type: 'CTX-9800',
      status: 'operational',
      throughput: 1800,
      position: { x: 178, y: 200 },
      processingQueue: [],
      falseAlarmRate: 0.015,
      detectionCapabilities: ['Explosives', 'Weapons', 'Liquids', 'Electronics'],
      lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      operationalHours: 1523,
      aiConfidence: 94.2,
    },
    {
      id: 'EDS-L3-001',
      name: 'EDS Level-3',
      type: 'EDS-Level3',
      status: 'operational',
      throughput: 600,
      position: { x: 322, y: 350 },
      processingQueue: [],
      falseAlarmRate: 0.01,
      detectionCapabilities: ['Explosives', 'Chemical Threats', 'Dense Objects'],
      lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      operationalHours: 892,
      aiConfidence: 96.1,
    },
    {
      id: 'XRAY-001',
      name: 'X-Ray Dual Energy',
      type: 'X-Ray-Dual',
      status: 'maintenance',
      throughput: 300,
      position: { x: 322, y: 250 },
      processingQueue: [],
      falseAlarmRate: 0.08,
      detectionCapabilities: ['Organic Materials', 'Metals', 'Basic Threats'],
      lastMaintenance: new Date(),
      operationalHours: 3421,
    },
  ]);

  const [selectedFlight, setSelectedFlight] = useState<string>('AI127');

  const { isOpen, popupData, position, openPopup, closePopup, generateSystemPopupData } = usePopup();

  // Enhanced bag generation with potential anomalies
  const generateEnhancedBags = useCallback(() => {
    const sampleBags: BagItem[] = [
      {
        id: 'BAG-001',
        flightNumber: selectedFlight,
        passengerName: 'John Smith',
        weight: 23.5,
        contents: ['Clothes', 'Electronics', 'Documents'],
        riskLevel: 'low',
        screeningStatus: 'pending',
        position: { x: 100, y: 300 },
        level: 2,
        dist: 0,
        routeKind: 'cleared' as const,
        currentStation: 'check-in',
        anomalies: [],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        origin: operationType === 'arrival' ? 'BOM' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        carouselNumber: operationType === 'arrival' ? 1 : undefined,
        threatLevel: 1,
      },
      {
        id: 'BAG-002',
        flightNumber: selectedFlight,
        passengerName: 'Sarah Wilson',
        weight: 18.2,
        contents: ['Clothes', 'Liquids', 'Personal Items'],
        riskLevel: 'medium',
        screeningStatus: 'pending',
        position: { x: 100, y: 400 },
        level: 1,
        dist: 0,
        routeKind: 'cleared' as const,
        currentStation: 'check-in',
        anomalies: ['Liquid Volume Excess'],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        origin: operationType === 'arrival' ? 'BOM' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        carouselNumber: operationType === 'arrival' ? 1 : undefined,
        threatLevel: 3,
      },
      {
        id: 'BAG-003',
        flightNumber: selectedFlight,
        passengerName: 'Mike Johnson',
        weight: 25.8,
        contents: ['Clothes', 'Tools', 'Electronics'],
        riskLevel: 'high',
        screeningStatus: 'pending',
        position: { x: 100, y: 200 },
        level: 3,
        dist: 0,
        routeKind: 'cleared' as const,
        currentStation: 'check-in',
        anomalies: ['Dense Object Detected', 'Unusual Shape'],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        origin: operationType === 'arrival' ? 'BOM' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        carouselNumber: operationType === 'arrival' ? 1 : undefined,
        threatLevel: 6,
      },
      {
        id: 'BAG-004',
        flightNumber: selectedFlight,
        passengerName: 'Priya Nair',
        weight: 20.4,
        contents: ['Clothes', 'Books'],
        riskLevel: 'low',
        screeningStatus: 'pending',
        position: { x: 100, y: 400 },
        level: 1,
        dist: -70,
        routeKind: 'cleared' as const,
        currentStation: 'check-in',
        anomalies: [],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        threatLevel: 1,
      },
      {
        id: 'BAG-005',
        flightNumber: selectedFlight,
        passengerName: 'Daniel Roy',
        weight: 27.1,
        contents: ['Clothes', 'Camera Gear', 'Batteries'],
        riskLevel: 'medium',
        screeningStatus: 'pending',
        position: { x: 100, y: 300 },
        level: 2,
        dist: -110,
        routeKind: 'cleared' as const,
        currentStation: 'check-in',
        anomalies: ['Lithium Cells'],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        threatLevel: 2,
      },
    ];
    setBags(sampleBags);
  }, [selectedFlight, operationType]);

  /** Run token for the SOP walk-through, so a stale run cannot drive the panel. */
  const sopRunRef = useRef(0);

  // Execute SOP protocol steps
  const executeSOP = useCallback((sop: SOPProtocol) => {
    const run = ++sopRunRef.current;
    const isCurrent = () => sopRunRef.current === run;

    (async () => {
      for (let i = 0; i < sop.steps.length; i++) {
        if (!isCurrent()) return;
        const step = sop.steps[i];
        setActiveSOP(prev => (prev && prev.id === sop.id ? { ...prev, currentStep: i } : prev));

        // Real SOP steps run for minutes; compress them into a readable window
        // so the panel actually advances while the viewer is watching, without
        // flashing past faster than the text can be read.
        const ms = Math.max(3500, Math.min(step.duration, 14) * 1000) / simulationSpeed;
        await new Promise(resolve => setTimeout(resolve, ms));

        if (!isCurrent()) return;
        if (step.critical) setCurrentPhase(`sop-critical-${i}`);
      }

      setTimeout(() => {
        // A newer incident may have taken over while this one was finishing;
        // clearing unconditionally would blank the panel mid-run.
        if (!isCurrent()) return;
        setActiveSOP(null);
        setCurrentPhase('sop-completed');
        setSystemStats(prev => ({ ...prev, threatLevel: Math.max(1, prev.threatLevel - 2) }));
      }, 2500 / simulationSpeed);
    })();
  }, [simulationSpeed]);

  // Simulate anomaly detection with SOP trigger
  const simulateAnomalyDetection = useCallback((bagId: string, anomalyType: 'explosive' | 'weapon' | 'suspicious') => {
    const bag = bagsRef.current.find(b => b.id === bagId);
    if (!bag) return;

    setBags(prev => prev.map(b =>
      b.id === bagId
        ? {
            ...b,
            riskLevel: 'anomaly',
            screeningStatus: 'sop-triggered',
            sopTriggered: true,
            threatLevel: anomalyType === 'explosive' ? 10 : anomalyType === 'weapon' ? 8 : 6,
            anomalies: [...b.anomalies, `${anomalyType.toUpperCase()} DETECTED`],
          }
        : b
    ));

    const template =
      anomalyType === 'explosive' ? BAGGAGE_SOP_PROTOCOLS[0]
      : anomalyType === 'weapon' ? BAGGAGE_SOP_PROTOCOLS[1]
      : BAGGAGE_SOP_PROTOCOLS[2];

    const sopToTrigger: SOPProtocol = { ...template, isActive: true, currentStep: 0 };

    setActiveSOP(sopToTrigger);
    setCurrentPhase('sop-active');
    executeSOP(sopToTrigger);

    setSystemStats(prev => ({
      ...prev,
      sopTriggered: prev.sopTriggered + 1,
      anomaliesDetected: prev.anomaliesDetected + 1,
      threatLevel: Math.max(prev.threatLevel, sopToTrigger.priority === 'critical' ? 5 : 3),
    }));

    onPhaseChange?.('anomaly-detected', {
      bagId,
      anomalyType,
      sopId: sopToTrigger.id,
      threatLevel: bag.threatLevel,
    });
  }, [executeSOP, onPhaseChange]);

  /**
   * Phase timers for the run. Held so closing the simulation overlay tears the
   * whole schedule down instead of leaving it advancing phases against a
   * component that is no longer on screen.
   */
  const phaseTimers = useRef<number[]>([]);
  useEffect(() => () => {
    phaseTimers.current.forEach(t => window.clearTimeout(t));
    phaseTimers.current = [];
    sopRunRef.current += 1;
  }, []);

  // Enhanced simulation with multi-level processing
  const startEnhancedSimulation = useCallback(() => {
    if (isSimulating) return;

    setIsSimulating(true);
    setIsTimerActive(true);
    setTimer(0);
    setCurrentPhase('initializing');
    setSystemStats(prev => ({ ...prev, totalProcessed: 0, clearedBags: 0, flaggedBags: 0 }));

    generateEnhancedBags();

    phaseTimers.current.forEach(t => window.clearTimeout(t));
    phaseTimers.current = [];
    const at = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms / simulationSpeed);
      phaseTimers.current.push(id);
      return id;
    };

    at(1200, () => {
      setCurrentPhase('system-check');
      onPhaseChange?.('system-check', { machines: screeningMachines.length });
    });

    at(4000, () => {
      setCurrentPhase('multi-level-transport');
      setBags(prev => prev.map(bag => ({
        ...bag,
        currentStation: `level-${bag.level ?? 1}-transport`,
      })));
    });

    at(8000, () => {
      setCurrentPhase('ai-enhanced-screening');
      onPhaseChange?.('ai-screening-active', {
        machines: screeningMachines.filter(m => m.status === 'operational').length,
        aiEnabled: screeningMachines.filter(m => m.aiConfidence).length,
      });

      // Screening itself is no longer scheduled here: each bag is scanned when
      // it physically reaches a machine on its belt (see the transport loop),
      // which is what keeps the verdict and the on-screen position in step.
      // This phase only seeds the occasional anomaly so the SOP path gets
      // exercised; the diverter still decides where the bag goes.
      bagsRef.current.forEach((bag, index) => {
        at(index * 3200, () => {
          if (Math.random() < 0.3 && bag.riskLevel !== 'low') {
            const anomalyTypes: ('explosive' | 'weapon' | 'suspicious')[] = ['explosive', 'weapon', 'suspicious'];
            simulateAnomalyDetection(bag.id, anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)]);
          }
        });
      });
    });

    at(26000, () => {
      setCurrentPhase('smart-routing');
      onPhaseChange?.('smart-routing', { diverters: 3, paths: 4 });
    });

    at(52000, () => {
      setIsSimulating(false);
      setIsTimerActive(false);
      setCurrentPhase('completed');
      onSimulationComplete?.();
    });
  }, [isSimulating, screeningMachines, generateEnhancedBags, simulateAnomalyDetection, simulationSpeed, onPhaseChange, onSimulationComplete]);

  // Manual anomaly trigger buttons
  const triggerManualAnomaly = useCallback((type: 'explosive' | 'weapon' | 'suspicious') => {
    const availableBags = bagsRef.current.filter(b => !b.sopTriggered && b.screeningStatus !== 'sop-triggered');
    if (availableBags.length === 0) {
      const anomalyBag: BagItem = {
        id: `ANOMALY-${Date.now()}`,
        flightNumber: selectedFlight,
        passengerName: 'Unidentified Passenger',
        weight: 22.0,
        contents: ['Unknown Items'],
        riskLevel: 'anomaly',
        screeningStatus: 'pending',
        position: { x: 100, y: 400 },
        level: 1,
        dist: 0,
        routeKind: 'anomaly' as const,
        currentStation: 'check-in',
        anomalies: [`${type.toUpperCase()} MATERIAL SUSPECTED`],
        processingTime: 0,
        destination: operationType === 'departure' ? 'DEL' : undefined,
        origin: operationType === 'arrival' ? 'BOM' : undefined,
        gateNumber: operationType === 'departure' ? 'A12' : undefined,
        carouselNumber: operationType === 'arrival' ? 1 : undefined,
        threatLevel: type === 'explosive' ? 10 : type === 'weapon' ? 8 : 6,
      };

      setBags(prev => [...prev, anomalyBag]);
      // The run has to be live for the bag to travel to its chute.
      if (!isSimulating) {
        setIsSimulating(true);
        setIsTimerActive(true);
      }
      window.setTimeout(() => simulateAnomalyDetection(anomalyBag.id, type), 900);
    } else {
      const targetBag = availableBags[Math.floor(Math.random() * availableBags.length)];
      simulateAnomalyDetection(targetBag.id, type);
    }
  }, [selectedFlight, operationType, simulateAnomalyDetection, isSimulating]);

  // Handle element clicks for popup display
  const handleElementClick = useCallback((elementType: string, elementData: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickPosition = { x: event.clientX, y: event.clientY };

    let data;
    switch (elementType) {
      case 'bag':
        data = generateSystemPopupData(`Bag ${elementData.id}`, {
          coordinates: elementData.position,
          status: elementData.screeningStatus,
          description: `${elementData.flightNumber ?? ''} — ${elementData.passengerName ?? 'Passenger'}`,
          flight: elementData.flightNumber,
          passenger: elementData.passengerName,
          weight: elementData.weight,
          riskLevel: elementData.riskLevel,
          threatLevel: elementData.threatLevel ?? 1,
          currentStation: elementData.currentStation,
          tier: elementData.level,
          routedTo: elementData.routeKind,
          contents: elementData.contents,
          anomalies: elementData.anomalies?.length ? elementData.anomalies : ['None detected'],
          sopStatus: elementData.sopTriggered ? 'SOP ACTIVE' : 'Normal',
        });
        break;
      case 'screening-machine':
      case 'station': {
        const m = elementData.machine ?? elementData;
        data = generateSystemPopupData(m.name ?? elementData.id, {
          coordinates: m.position ?? elementData.position,
          status: m.status ?? 'operational',
          description: `${m.type ?? elementData.type} screening unit on tier ${elementData.level ?? '—'}`,
          throughput: m.throughput ? `${m.throughput} bags/hour` : undefined,
          aiConfidence: m.aiConfidence,
          falseAlarmRate: m.falseAlarmRate != null ? `${(m.falseAlarmRate * 100).toFixed(2)}%` : undefined,
          capabilities: m.detectionCapabilities,
          operationalHours: m.operationalHours ? `${m.operationalHours} h` : undefined,
          lastMaintenance: m.lastMaintenance,
        });
        break;
      }
      case 'diverter':
        data = generateSystemPopupData(elementData.id, {
          coordinates: elementData.position,
          status: elementData.throwing && elementData.throwing !== 'cleared' ? 'warning' : 'operational',
          description: `Tier ${elementData.level} sorter — pushes rejected bags off the deck onto the chute`,
          tier: elementData.level,
          currentSetting: elementData.throwing === 'anomaly' ? 'SOP response chute'
            : elementData.throwing === 'flagged' ? 'Manual inspection chute'
            : 'Straight through (cleared)',
          mechanism: 'High-speed pusher shoe',
        });
        break;
      case 'chute':
        data = generateSystemPopupData(
          `${elementData.kind === 'anomaly' ? 'SOP' : 'Reject'} chute — tier ${elementData.level}`,
          {
            status: 'operational',
            description: elementData.label,
            tier: elementData.level,
            dropsTo: elementData.kind === 'anomaly' ? 'SOP response bay' : 'Manual inspection bay',
            type: 'Gravity slide from the sorter deck to hall floor',
          }
        );
        break;
      case 'sop':
        data = generateSystemPopupData(`SOP ${elementData.id}`, {
          status: 'critical',
          description: elementData.trigger,
          priority: elementData.priority,
          currentStep: `${elementData.currentStep + 1}/${elementData.steps.length}`,
          estimatedDuration: `${elementData.estimatedDuration}s`,
          responsible: elementData.steps[elementData.currentStep]?.responsible ?? 'N/A',
        });
        break;
      default:
        data = generateSystemPopupData(
          elementData?.id ? String(elementData.id) : elementType,
          { ...elementData, description: `${elementType} detail` }
        );
    }

    openPopup(data, clickPosition);
  }, [generateSystemPopupData, openPopup]);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive) return;
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    screeningMachinesRef.current = screeningMachines;
  }, [screeningMachines]);

  /**
   * Belt transport. Every bag is advanced along its tier's conveyor route by
   * arc length, so it can only ever be somewhere the belt actually goes, and
   * its heading comes from the local tangent. Bags pause inside a scanner
   * (holdUntil), switch to the reject branch at the diverter when screening
   * has flagged them, and lose height continuously down the chute so the drop
   * off the deck is something you can watch happen.
   */
  useEffect(() => {
    if (!isSimulating) return;
    let raf = 0;
    let last = performance.now();
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      setBags(prev => {
        let changed = false;
        const next = prev.map(bag => {
          const level = bag.level ?? 1;
          const kind: RouteKind =
            bag.screeningStatus === 'sop-triggered'
              ? 'anomaly'
              : bag.screeningStatus === 'flagged' || bag.screeningStatus === 'manual-check'
              ? 'flagged'
              : 'cleared';

          const route = getBagRoute(level, kind);
          const d = bag.dist ?? 0;

          // Stop distances are measured along the shared trunk, so they mean
          // the same physical machine regardless of which branch the bag ends
          // up taking.
          const stops = MACHINE_STOPS[level] ?? [];
          const trunkLen = getTrunkLength(level);
          const doneStops = bag.clearedStops ?? 0;

          // Held inside a scanner - stay put but keep the route/branch current.
          if (bag.holdUntil && now < bag.holdUntil) {
            if (bag.routeKind === kind) return bag;
            changed = true;
            return { ...bag, routeKind: kind };
          }

          // Screening happens where the machine physically is: when the bag
          // reaches a scanner stop it halts inside the tunnel, then leaves with
          // a verdict that decides which way the diverter throws it.
          if (bag.holdUntil && now >= bag.holdUntil && bag.screeningStatus === 'screening') {
            const machine = screeningMachinesRef.current.find(m => m.id === bag.currentStation);
            const ai = machine?.aiConfidence ?? 0;
            const suspicious =
              bag.riskLevel === 'anomaly' ||
              bag.riskLevel === 'high' ||
              (bag.riskLevel === 'medium' && Math.random() > (ai > 95 ? 0.8 : 0.6)) ||
              (bag.anomalies.length > 0 && Math.random() > (ai > 95 ? 0.7 : 0.4)) ||
              Math.random() < (machine?.falseAlarmRate ?? 0.02);

            changed = true;

            // An alarm at an early machine is not a rejection: the bag is
            // unresolved and goes on to the next level for a re-scan. Only the
            // last machine on the tier produces a verdict the diverter acts on,
            // which is what the level-1 / level-2 steps of the procedure mean.
            if (suspicious && doneStops < stops.length) {
              return {
                ...bag,
                holdUntil: undefined,
                screeningStatus: 'pending' as const,
                currentStation: `re-scan at ${stops[doneStops].id}`,
                routeKind: 'cleared' as const,
              };
            }

            statsQueue.current.push(suspicious ? 'flagged' : 'cleared');
            const verdict: BagItem['screeningStatus'] = suspicious ? 'flagged' : 'cleared';
            const branch: RouteKind = suspicious ? 'flagged' : 'cleared';
            return {
              ...bag,
              holdUntil: undefined,
              screeningStatus: verdict,
              currentStation: suspicious ? 'manual-inspection' : 'smart-routing',
              routeKind: branch,
            };
          }

          const nextStop =
            doneStops < stops.length && d >= stops[doneStops].atTrunk * trunkLen
              ? stops[doneStops]
              : undefined;
          if (nextStop && bag.screeningStatus === 'pending') {
            const pose = routeAt(route, d);
            changed = true;
            return {
              ...bag,
              screeningStatus: 'screening' as const,
              currentStation: nextStop.id,
              clearedStops: doneStops + 1,
              holdUntil: now + SCAN_DWELL_MS / simulationSpeed,
              position: pose.pos,
              heading: pose.tan,
              lift: liftAlongRoute(level, kind, d),
              routeKind: kind,
            };
          }

          if (d >= route.total) {
            if (bag.routeKind === kind && bag.dist === route.total) return bag;
            const end = routeAt(route, route.total);
            changed = true;
            return {
              ...bag,
              routeKind: kind,
              dist: route.total,
              position: end.pos,
              heading: end.tan,
              lift: liftAlongRoute(level, kind, route.total),
            };
          }

          const speed = BELT_SPEED * simulationSpeed;

          // Headway. A bag may not close up on the one ahead of it on the same
          // tier, so when the lead bag halts inside a scanner the ones behind
          // form a queue back down the belt instead of driving into it. Only
          // applied on the shared trunk - past the diverter the branches
          // physically separate.
          let cap = route.total;
          if (d < trunkLen) {
            prev.forEach(other => {
              if (other.id === bag.id) return;
              if ((other.level ?? 1) !== level) return;
              const od = other.dist ?? 0;
              if (od <= d) return;
              cap = Math.min(cap, od - HEADWAY);
            });
          }

          const nd = Math.max(d, Math.min(route.total, d + speed * dt, cap));

          // Bags staggered behind the head of the queue start at a negative
          // distance; they queue back down the induction line at check-in
          // rather than piling up on top of the lead bag.
          const pose =
            nd < 0
              ? { pos: { x: 100 + nd * 0.4, y: INDUCTION_Y[level] ?? 400 }, tan: { x: 1, y: 0 } }
              : routeAt(route, nd);
          // Fully blocked by the bag ahead and nothing else to update.
          if (nd === d && bag.dist === d && bag.routeKind === kind) return bag;
          changed = true;
          return {
            ...bag,
            routeKind: kind,
            dist: nd,
            position: pose.pos,
            heading: pose.tan,
            lift: liftAlongRoute(level, kind, Math.max(0, nd)),
            holdUntil: undefined,
          };
        });
        return changed ? next : prev;
      });

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isSimulating, simulationSpeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeBagCount = bags.filter(b => (b.dist ?? 0) < (getBagRoute(b.level ?? 1, b.routeKind ?? 'cleared').total)).length;
  const onChute = bags.filter(b => b.routeKind && b.routeKind !== 'cleared' && (b.dist ?? 0) > getTrunkLength(b.level ?? 1)).length;

  /**
   * Which routine step the run is on. Derived from the phase the simulation
   * reports, so the checklist beside the scene tracks what is on screen.
   */
  const flowStep = useMemo(() => {
    switch (currentPhase) {
      case 'standby': return -1;
      case 'initializing':
      case 'system-check': return 0;
      case 'multi-level-transport': return 1;
      case 'ai-enhanced-screening':
        return bags.some(b => (b.clearedStops ?? 0) > 1) ? 3 : 2;
      case 'smart-routing': return onChute > 0 ? 6 : 4;
      case 'completed': return 6;
      default: return 5;
    }
  }, [currentPhase, bags, onChute]);

  const sopAccent = activeSOP
    ? activeSOP.priority === 'critical' ? 'red' : 'gold'
    : 'teal';

  return (
    <div className="w-full space-y-4">
      {/* ============ Run controls + anomaly injection ============ */}
      <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-error/10 rounded-lg border border-status-error/30">
              <AlertOctagon className="w-5 h-5 text-status-error" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Anomaly Detection Simulation</h3>
              <p className="text-xs text-text-muted">Inject a threat to exercise the sorter and the matching SOP</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerManualAnomaly('explosive')}
              className="btn bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/20"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Explosive</span>
            </button>
            <button
              onClick={() => triggerManualAnomaly('weapon')}
              className="btn bg-status-warning/10 border-status-warning/30 text-status-warning hover:bg-status-warning/20"
            >
              <Shield className="w-4 h-4" />
              <span>Weapon</span>
            </button>
            <button
              onClick={() => triggerManualAnomaly('suspicious')}
              className="btn bg-status-warning/10 border-status-warning/30 text-status-warning hover:bg-status-warning/20"
            >
              <Eye className="w-4 h-4" />
              <span>Suspicious</span>
            </button>

            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-primary-600/40">
              <Gauge className="w-4 h-4 text-accent-blue" />
              <label className="text-xs text-text-muted">Speed</label>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="bg-primary-900 border border-primary-600 rounded px-2 py-1.5 text-text-primary text-xs"
              >
                <option value={0.5}>0.5x — study</option>
                <option value={1}>1x — normal</option>
                <option value={2}>2x — fast</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Statistics strip ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Elapsed', value: formatTime(timer), tone: 'text-accent-blue' },
          { label: 'Bags Tracked', value: bags.length, tone: 'text-text-primary' },
          { label: 'In Transit', value: activeBagCount, tone: 'text-accent-blue' },
          { label: 'Screened', value: systemStats.totalProcessed, tone: 'text-status-success' },
          { label: 'Cleared', value: systemStats.clearedBags, tone: 'text-status-success' },
          { label: 'On Chute', value: onChute, tone: 'text-status-warning' },
          { label: 'SOPs Fired', value: systemStats.sopTriggered, tone: 'text-status-error' },
          {
            label: 'Threat Level',
            value: `${systemStats.threatLevel}/10`,
            tone: systemStats.threatLevel >= 5 ? 'text-status-error' : systemStats.threatLevel >= 3 ? 'text-status-warning' : 'text-status-success',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 text-center">
            <p className="text-[length:calc(10px*var(--fs))] uppercase tracking-wide text-text-muted">{stat.label}</p>
            <p className={`text-lg font-bold tabular-nums ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ============ Main visualisation: SOP rail beside the hall ============ */}
      <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl w-full">
        <div className="p-4 lg:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg lg:text-xl font-bold text-text-primary flex items-center gap-3">
              <div className="p-2 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
                <Layers className="h-5 w-5 text-accent-blue" />
              </div>
              <span>Enhanced Baggage Handling System</span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-primary-900/40 border border-primary-600/40 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-status-success animate-pulse' : 'bg-text-muted'}`} />
                  <span className={isSimulating ? 'text-status-success' : 'text-text-muted'}>
                    {isSimulating ? 'Sorting' : 'Standby'}
                  </span>
                </span>
                <span className="text-text-muted">|</span>
                <span className="flex items-center gap-1.5 text-accent-blue">
                  <Wifi className="w-3.5 h-3.5" />
                  {screeningMachines.filter(m => m.aiConfidence).length} AI units
                </span>
                <span className="text-text-muted">|</span>
                <span className="flex items-center gap-1.5 text-accent-blue">
                  <Target className="w-3.5 h-3.5" />
                  {selectedFlight}
                </span>
              </div>

              <button
                onClick={startEnhancedSimulation}
                disabled={isSimulating}
                className={`btn min-w-[15rem] py-3 ${
                  isSimulating
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isSimulating ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                <span>{isSimulating ? 'Simulation running…' : `Start ${operationType} simulation`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)] gap-4 items-stretch">
            {/* ---- left rail: the SOP being executed, plus machine health ----
                 flex-1 on the procedure lets the rail track the height of the
                 hall beside it, so neither column ends in dead space. */}
            <div className="flex flex-col gap-4 min-w-0">
              <SOPPanel
                className="flex-1 min-h-[300px] max-h-[520px]"
                accent={sopAccent as 'red' | 'gold' | 'teal'}
                title={activeSOP ? `${activeSOP.id} · Incident Response` : 'BHS-STD · Screening Run'}
                trigger={activeSOP ? activeSOP.trigger : BHS_STANDARD_SOP.trigger}
                priority={activeSOP ? activeSOP.priority : BHS_STANDARD_SOP.priority}
                steps={activeSOP ? activeSOP.steps : BHS_STANDARD_SOP.steps}
                currentStep={activeSOP ? activeSOP.currentStep : flowStep}
                active={activeSOP ? true : isSimulating || flowStep >= 0}
                subtitle={
                  activeSOP
                    ? 'Sorter is holding the bag on the SOP chute until the response team clears it.'
                    : 'Watch the same run on the right: bags stop inside a scanner, then the diverter shoe pushes rejects onto the chute.'
                }
              />

              <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3">
                <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-2 uppercase tracking-wide">
                  <Monitor className="w-3.5 h-3.5 text-accent-blue" />
                  <span>Screening Systems</span>
                </h4>
                <div className="space-y-1">
                  {screeningMachines.map((machine) => (
                    <div
                      key={machine.id}
                      className="flex justify-between items-center cursor-pointer hover:bg-primary-700/40 p-1.5 rounded transition-all duration-200"
                      onClick={(e) => handleElementClick('screening-machine', machine, e)}
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-text-primary font-medium truncate">{machine.name}</div>
                        <div className="text-[length:calc(10px*var(--fs))] text-text-muted">
                          {machine.type}
                          {machine.aiConfidence ? ` · AI ${machine.aiConfidence}%` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          machine.status === 'operational' ? 'bg-status-success animate-pulse'
                          : machine.status === 'failed' ? 'bg-status-error'
                          : 'bg-status-warning'
                        }`} />
                        <span className="text-[length:calc(10px*var(--fs))] capitalize text-text-muted">{machine.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ---- the hall itself ---- */}
            <div className="relative flex bg-primary-900/80 rounded-xl border border-primary-600/40 overflow-hidden min-h-[320px]">
              <IsoBaggageScene
                levels={ENHANCED_BAGGAGE_LAYOUT.levels}
                stations={ENHANCED_BAGGAGE_LAYOUT.screeningStations}
                diverters={ENHANCED_BAGGAGE_LAYOUT.diverters}
                zones={ENHANCED_BAGGAGE_LAYOUT.zones}
                bags={bags}
                machines={screeningMachines}
                isSimulating={isSimulating}
                onElementClick={handleElementClick}
              />
            </div>
          </div>

          {/* ============ Reference panels ============ */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <Plane className="w-4 h-4 text-accent-blue" />
                <span>Flight Configuration</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted">Selected flight</label>
                  <select
                    value={selectedFlight}
                    onChange={(e) => setSelectedFlight(e.target.value)}
                    className="w-full mt-1 bg-primary-900 border border-primary-600 rounded px-3 py-2 text-text-primary text-sm"
                    disabled={isSimulating}
                  >
                    {mockFlights.filter(f => (operationType === 'departure' ? f.departure : f.arrival)).map(flight => (
                      <option key={flight.flightNumber} value={flight.flightNumber}>
                        {flight.flightNumber} — {flight.airline} ({operationType === 'departure' ? flight.destination : flight.origin})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Operation</span>
                    <span className="text-text-primary capitalize">{operationType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{operationType === 'departure' ? 'Gate' : 'Carousel'}</span>
                    <span className="text-accent-blue">
                      {(() => {
                        const flight = mockFlights.find(f => f.flightNumber === selectedFlight);
                        return flight ? (operationType === 'departure' ? flight.gate : flight.carousel) : 'N/A';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-accent-blue" />
                <span>Sortation Outcome</span>
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Straight through (approved)', value: systemStats.clearedBags, color: 'text-status-success' },
                  { label: 'Pushed to inspection chute', value: systemStats.flaggedBags, color: 'text-status-warning' },
                  { label: 'Pushed to SOP chute', value: systemStats.sopTriggered, color: 'text-status-error' },
                  { label: 'Currently on a chute', value: onChute, color: 'text-accent-blue' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-text-muted">{row.label}</span>
                    <span className={`${row.color} tabular-nums font-medium`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-status-success" />
                <span>Detection Matrix</span>
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  ['Explosive detection', '99.97%', 'text-status-success'],
                  ['Weapon screening', '99.85%', 'text-status-success'],
                  ['Liquid analysis', '98.92%', 'text-status-success'],
                  ['Behavioural', '96.34%', 'text-accent-blue'],
                  ['False positive rate', '0.02%', 'text-status-warning'],
                ].map(([label, value, tone]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-text-muted">{label}</span>
                    <span className={tone}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-blue" />
                <span>System Performance</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Total throughput</span>
                  <span className="text-accent-blue">
                    {screeningMachines.filter(m => m.status === 'operational').reduce((acc, m) => acc + m.throughput, 0)} BPH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">System efficiency</span>
                  <span className="text-status-success">{systemStats.systemEfficiency.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Bags in transit</span>
                  <span className="text-accent-blue">{activeBagCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Belt speed</span>
                  <span className="text-accent-blue">{(BELT_SPEED * simulationSpeed).toFixed(0)} u/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Current phase</span>
                  <span className="text-text-primary capitalize">{currentPhase.replace(/-/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UniversalPopup isOpen={isOpen} data={popupData} onClose={closePopup} position={position} />
    </div>
  );
};

export default BaggageOperations;
