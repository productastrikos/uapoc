export interface FlightInfo {
  id: string;
  flightNumber: string;
  airline: string;
  gate: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'scheduled' | 'boarding' | 'delayed' | 'departed' | 'arrived' | 'landed' | 'taxi' | 'parked' | 'deboard' | 'cleaning' | 'pushback';
  passengerLoad: number;
  phase: FlightPhase;
}

export interface FlightPhase {
  current: string;
  progress: number;
  nextPhase: string;
  estimatedTime: number;
}

export interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  lastUpdate: string;
  metrics: Record<string, number>;
  subsystems?: SubSystem[];
}

export interface SubSystem {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'fault';
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Command {
  id: string;
  timestamp: string;
  target: string;
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  executionTime?: number;
}

export interface SystemAcknowledgment {
  commandId: string;
  timestamp: string;
  confirmation: boolean;
  success: boolean;
  executionTime: number;
  metadata: Record<string, any>;
}

export interface Alert {
  id: string;
  timestamp: string;
  type: 'flight' | 'security' | 'fault' | 'energy' | 'occupancy' | 'baggage' | 'maintenance' | 'passenger-flow' | 'retail' | 'sustainability';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved' | 'ai-solving' | 'needs-review';
  aiRecommendation?: {
    action: string;
    confidence: number;
    reasoning: string;
    estimatedImpact: string;
    costSaving?: number;
    energySaving?: number;
  };
  metrics?: Record<string, number>;
  countdown?: number;
  autoSolveEnabled?: boolean;
  manualOverride?: boolean;
  aiSolutionHistory?: AISolution[];
}

export interface SecurityIncident {
  id: string;
  type: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Investigating' | 'Resolved';
  timestamp: Date;
  description?: string;
  cameraId?: string;
  aiConfidence?: number;
}

export interface SOPStep {
  id: number;
  action: string;
  duration: number;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: Date;
}

export interface SecuritySOP {
  id: string;
  trigger: string;
  steps: SOPStep[];
  autoExecute: boolean;
  manualOverride: boolean;
  estimatedDuration: number;
  currentStep: number;
}

export interface AISolution {
  timestamp: string;
  action: string;
  success: boolean;
  timeSaved: number;
  energySaved: number;
  costSaved: number;
  confidence: number;
}

export interface UserJourney {
  alertId: string;
  steps: {
    timestamp: string;
    action: string;
    operator?: string;
    details: string;
    aiConfidence?: number;
  }[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  category: 'flight-ops' | 'passenger-flow' | 'energy' | 'security' | 'baggage' | 'maintenance' | 'retail' | 'sustainability';
  trigger: string;
  actions: string[];
  metrics: Record<string, string>;
  isActive: boolean;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  aiConfidence: number;
  estimatedDuration: number;
  costImpact: number;
  energyImpact: number;
}

export interface PerformanceMetrics {
  energySavings: number;
  responseTimeReduction: number;
  aiAutoExecutionRate: number;
  operatorOverrideRate: number;
  systemUptime: number;
  passengerComfortIndex: number;
  costSavings: number;
  co2Reduction: number;
  staffHoursSaved: number;
  paybackPeriod: number;
}

export interface TerminalZone {
  id: string;
  name: string;
  type: 'gate' | 'security' | 'retail' | 'baggage' | 'arrival' | 'departure' | 'toilet' | 'checkin' | 'customs';
  coordinates: { x: number; y: number; width: number; height: number };
  systems: {
    lighting: number;
    hvac: number;
    security: 'armed' | 'disarmed' | 'alert';
    occupancy: number;
    maxOccupancy: number;
  };
  passengerFlow?: {
    current: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface PassengerJourney {
  id: string;
  flightId: string;
  currentZone: string;
  journeySteps: {
    zone: string;
    entryTime: string;
    exitTime?: string;
    duration?: number;
    satisfaction: number;
  }[];
  totalJourneyTime: number;
  satisfactionScore: number;
}

export interface NodeFlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status: 'active' | 'idle' | 'error';
    metrics?: Record<string, any>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style?: Record<string, any>;
  data?: {
    signal: 'command' | 'ack' | 'data';
    timestamp: string;
  };
}

export interface ROIMetrics {
  totalSavings: number;
  energyCostSavings: number;
  staffCostSavings: number;
  maintenanceSavings: number;
  passengerSatisfactionGain: number;
  implementationCost: number;
  paybackMonths: number;
  roi: number;
}

export interface SubsystemCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  kpis: KPI[];
  scenarios: SimulationScenario[];
  nodeFlow?: NodeFlowData;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface ToiletSystem {
  id: string;
  cubicleId: string;
  occupied: boolean;
  lightLevel: number;
  fanSpeed: number;
  lastCleaned: string;
  usageCount: number;
  maintenanceRequired: boolean;
}

export interface BaggageSystem {
  id: string;
  beltId: string;
  status: 'running' | 'stopped' | 'jammed' | 'maintenance';
  speed: number;
  bagsProcessed: number;
  jamProbability: number;
  lastMaintenance: string;
}

export interface EnergyOptimization {
  id: string;
  zone: string;
  currentConsumption: number;
  optimizedConsumption: number;
  savingsPotential: number;
  aiRecommendation: string;
  implementationTime: number;
}