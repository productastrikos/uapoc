import { FlightInfo, SystemStatus, Alert, SimulationScenario, TerminalZone } from '../types';

export const mockFlights: FlightInfo[] = [
  {
    id: '1',
    flightNumber: 'AI127',
    airline: 'Air India',
    gate: 'A2',
    scheduledTime: '06:00',
    actualTime: '06:00',
    status: 'parked',
    passengerLoad: 156,
    phase: { current: 'Parked', progress: 75, nextPhase: 'Deboard', estimatedTime: 3 }
  },
  {
    id: '2',
    flightNumber: 'BA200',
    airline: 'British Airways',
    gate: 'B1',
    scheduledTime: '14:30',
    status: 'boarding',
    passengerLoad: 250,
    phase: { current: 'Boarding', progress: 60, nextPhase: 'Pushback', estimatedTime: 15 }
  },
  {
    id: '3',
    flightNumber: 'DL350',
    airline: 'Delta',
    gate: 'C3',
    scheduledTime: '22:15',
    status: 'scheduled',
    passengerLoad: 195,
    phase: { current: 'Inbound', progress: 25, nextPhase: 'Landed', estimatedTime: 45 }
  }
];

export const mockSystems: SystemStatus[] = [
  {
    id: 'lighting',
    name: 'Lighting Control (LBMS)',
    status: 'online',
    lastUpdate: new Date().toISOString(),
    metrics: { brightness: 85, energyUsage: 120, zones: 24 }
  },
  {
    id: 'hvac',
    name: 'HVAC & Energy (SCADA/BMS)',
    status: 'online',
    lastUpdate: new Date().toISOString(),
    metrics: { temperature: 22, humidity: 45, energyUsage: 340 }
  },
  {
    id: 'access',
    name: 'Access Control (ACS)',
    status: 'online',
    lastUpdate: new Date().toISOString(),
    metrics: { doorsActive: 156, alertLevel: 0, accessEvents: 892 }
  },
  {
    id: 'cctv',
    name: 'CCTV & Incident Detection',
    status: 'warning',
    lastUpdate: new Date().toISOString(),
    metrics: { camerasOnline: 298, incidentsToday: 3, aiConfidence: 94 }
  }
];

export const mockScenarios: SimulationScenario[] = [
  {
    id: 'morning-arrival',
    name: 'Morning Flight Arrival',
    description: 'Flight AA100 lands at 06:00 (FIDS→AO-S)',
    trigger: 'Flight arrival detected',
    actions: [
      'Lighting→100% brightness in arrival zone',
      'HVAC→pre-condition gate area +2°C',
      'ACS→enable mobile boarding gates',
      'CCTV→focus on arrival corridor'
    ],
    metrics: {
      setupSpeed: '35% faster vs. manual',
      energyIncrease: '+5% for 30 min',
      passengerFlow: '25% improvement'
    },
    isActive: false
  },
  {
    id: 'off-peak',
    name: 'No-Flight Off-Peak Mode',
    description: 'No flights between 02:00–04:00',
    trigger: 'Schedule gap detected',
    actions: [
      'Lighting→dim to 20%, motion-activated',
      'HVAC→reduce airflow by 50%',
      'Baggage carousels→standby'
    ],
    metrics: {
      energySavings: '40% overnight savings',
      maintenanceWindow: '2 hours available',
      securityLevel: 'Enhanced patrol mode'
    },
    isActive: false
  },
  {
    id: 'gate-change',
    name: 'Gate Change Event',
    description: 'Flight BA200 gate changes from G5→G12',
    trigger: 'FIDS update received',
    actions: [
      'G5 systems→power down lighting/HVAC',
      'G12 systems→power up lighting/HVAC',
      'ACS→unlock G12 gates',
      'CCTV→activate G12 presets'
    ],
    metrics: {
      reconfigTime: '30% reduction',
      passengerRedirect: '8 min vs 15 min manual',
      systemSync: '99.2% success'
    },
    isActive: false
  },
  {
    id: 'security-breach',
    name: 'Security Breach',
    description: 'CCTV AI detects unauthorized access',
    trigger: 'AI threat detection',
    actions: [
      'ACS→lockdown area',
      'Lighting→full emergency illumination',
      'HVAC→ventilation isolation',
      'Ops popup→SOP steps'
    ],
    metrics: {
      responseTime: '2 min vs 8 min manual',
      lockdownSpeed: '80% faster',
      falsePositives: '<2%'
    },
    isActive: false
  },
  {
    id: 'bms-fault',
    name: 'BMS Fault Event',
    description: 'Chiller temperature spike detected',
    trigger: 'SCADA alert threshold',
    actions: [
      'HVAC→switch secondary chiller on',
      'Work order→auto-created',
      'Energy optimizer→adjust setpoints'
    ],
    metrics: {
      uptime: '90% maintained',
      faultResolution: '25% fewer outages',
      energyImpact: 'Minimal deviation'
    },
    isActive: false
  },
  {
    id: 'retail-peak',
    name: 'Retail Zone Peak Demand',
    description: 'Passenger count >500 in retail zone',
    trigger: 'Occupancy sensors threshold',
    actions: [
      'Lighting→increase brightness by 15%',
      'HVAC→boost airflow by 20%',
      'Energy alert→popup with override option'
    ],
    metrics: {
      comfortScore: '95% passenger satisfaction',
      energyIncrease: '+8% controlled',
      retailSales: '+12% during peak'
    },
    isActive: false
  }
];

export const mockTerminalZones: TerminalZone[] = [
  {
    id: 'gate-g5',
    name: 'Gate G5',
    type: 'gate',
    coordinates: { x: 150, y: 200, width: 80, height: 60 },
    systems: { lighting: 100, hvac: 75, security: 'armed', occupancy: 45 }
  },
  {
    id: 'gate-g8',
    name: 'Gate G8',
    type: 'gate',
    coordinates: { x: 300, y: 200, width: 80, height: 60 },
    systems: { lighting: 85, hvac: 72, security: 'armed', occupancy: 30 }
  },
  {
    id: 'gate-g12',
    name: 'Gate G12',
    type: 'gate',
    coordinates: { x: 450, y: 200, width: 80, height: 60 },
    systems: { lighting: 95, hvac: 78, security: 'armed', occupancy: 80 }
  },
  {
    id: 'security-checkpoint',
    name: 'Security Checkpoint',
    type: 'security',
    coordinates: { x: 200, y: 100, width: 200, height: 40 },
    systems: { lighting: 100, hvac: 70, security: 'armed', occupancy: 120 }
  },
  {
    id: 'retail-central',
    name: 'Central Retail Zone',
    type: 'retail',
    coordinates: { x: 250, y: 320, width: 150, height: 100 },
    systems: { lighting: 90, hvac: 75, security: 'armed', occupancy: 450 }
  },
  {
    id: 'baggage-claim',
    name: 'Baggage Claim',
    type: 'baggage',
    coordinates: { x: 100, y: 450, width: 200, height: 80 },
    systems: { lighting: 80, hvac: 68, security: 'armed', occupancy: 60 }
  }
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'flight',
    title: 'Flight AA100 Arrival',
    description: 'Flight AA100 has landed and passengers are disembarking',
    severity: 'medium',
    status: 'resolved',
    aiRecommendation: {
      action: 'Auto-adjust arrival zone systems',
      confidence: 92,
      reasoning: 'Historical data shows 35% efficiency improvement with automated response'
    },
    metrics: {
      passengerLoad: 180,
      expectedDuration: 30,
      energyImpact: 5
    }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    type: 'security',
    title: 'Unauthorized Access Detected',
    description: 'CCTV AI detected potential unauthorized access in restricted zone',
    severity: 'high',
    status: 'acknowledged',
    aiRecommendation: {
      action: 'Execute lockdown protocol',
      confidence: 87,
      reasoning: 'Pattern matches known security threats with 98% accuracy'
    }
  },
  {
    id: '3',
    timestamp: new Date().toISOString(),
    type: 'fault',
    title: 'Chiller Temperature Spike',
    description: 'Primary chiller showing temperature anomaly',
    severity: 'critical',
    status: 'new',
    aiRecommendation: {
      action: 'Switch to secondary chiller and create work order',
      confidence: 95,
      reasoning: 'Immediate action required to maintain system uptime'
    }
  }
];