import { SimulationScenario } from '../types';

export const comprehensiveScenarios: SimulationScenario[] = [
  // Flight Operations Scenarios
  {
    id: 'flight-arrival-prep',
    name: 'Flight Arrival Preparation',
    description: 'AI detects inbound flight 30 minutes out, pre-conditions arrival systems',
    category: 'flight-ops',
    trigger: 'FIDS data: Flight 30min ETA',
    actions: [
      'Runway lighting → Sequential activation',
      'HVAC → Pre-cool gate area -2°C',
      'Baggage belt → Startup sequence',
      'Security → Enhanced monitoring',
      'Passenger flow → Route optimization'
    ],
    metrics: {
      'Energy Efficiency': '+15% optimized pre-conditioning',
      'Passenger Comfort': '94% satisfaction score',
      'Turnaround Time': '-8 minutes vs manual'
    },
    isActive: false,
    probability: 0.95,
    impact: 'medium',
    aiConfidence: 92,
    estimatedDuration: 45,
    costImpact: -150,
    energyImpact: 12
  },
  {
    id: 'gate-change-cascade',
    name: 'Dynamic Gate Change Cascade',
    description: 'Flight BA200 gate change triggers multi-system reconfiguration',
    category: 'flight-ops',
    trigger: 'FIDS update: Gate G5→G12',
    actions: [
      'Aircraft guidance → Taxiway lighting sequence',
      'G12 systems → Rapid activation',
      'Passenger displays → Route updates',
      'Security → Access reconfiguration',
      'Cleaning crew → Auto-dispatch to G5'
    ],
    metrics: {
      'Reconfiguration Speed': '65% faster than manual',
      'Energy Waste': '-40% during transition',
      'Passenger Confusion': '-78% incidents'
    },
    isActive: false,
    probability: 0.25,
    impact: 'high',
    aiConfidence: 89,
    estimatedDuration: 20,
    costImpact: -300,
    energyImpact: -8
  },
  {
    id: 'weather-delay-optimization',
    name: 'Weather Delay Energy Optimization',
    description: 'Storm delays 6 flights, AI optimizes terminal energy for extended operations',
    category: 'flight-ops',
    trigger: 'Weather alert + flight delays',
    actions: [
      'Non-essential lighting → 40% reduction',
      'HVAC → Adaptive scheduling',
      'Retail zones → Extended hours mode',
      'Passenger comfort → Priority zones',
      'Staff notifications → Delay protocols'
    ],
    metrics: {
      'Energy Savings': '35% during delay period',
      'Passenger Satisfaction': '87% despite delays',
      'Operational Cost': '-$2,400 per delay event'
    },
    isActive: false,
    probability: 0.15,
    impact: 'high',
    aiConfidence: 94,
    estimatedDuration: 180,
    costImpact: -2400,
    energyImpact: -45
  },

  // Passenger Flow Scenarios
  {
    id: 'security-queue-optimization',
    name: 'Security Queue Flow Optimization',
    description: 'AI detects queue buildup, dynamically opens additional lanes',
    category: 'passenger-flow',
    trigger: 'Queue sensors: >15min wait time',
    actions: [
      'Additional security lanes → Auto-open',
      'Staff notifications → Redeploy personnel',
      'Passenger routing → Dynamic signage',
      'Lighting → Guide flow patterns',
      'HVAC → Boost airflow in queue areas'
    ],
    metrics: {
      'Wait Time Reduction': '45% average decrease',
      'Passenger Throughput': '+30% efficiency',
      'Staff Utilization': '92% optimization'
    },
    isActive: false,
    probability: 0.40,
    impact: 'medium',
    aiConfidence: 91,
    estimatedDuration: 25,
    costImpact: -180,
    energyImpact: 8
  },
  {
    id: 'toilet-occupancy-management',
    name: 'Intelligent Toilet Facility Management',
    description: 'Per-cubicle occupancy triggers lighting, ventilation, and cleaning schedules',
    category: 'passenger-flow',
    trigger: 'Occupancy sensors + usage patterns',
    actions: [
      'Cubicle lighting → Motion-activated 100%',
      'Ventilation fans → Auto-boost on occupancy',
      'Cleaning alerts → Usage-based scheduling',
      'Maintenance → Predictive fault detection',
      'Passenger guidance → Availability displays'
    ],
    metrics: {
      'Energy Efficiency': '28% lighting/fan savings',
      'Cleanliness Score': '96% passenger rating',
      'Maintenance Cost': '-22% predictive approach'
    },
    isActive: false,
    probability: 0.90,
    impact: 'low',
    aiConfidence: 88,
    estimatedDuration: 15,
    costImpact: -85,
    energyImpact: -12
  },
  {
    id: 'passenger-journey-optimization',
    name: 'End-to-End Journey Optimization',
    description: 'AI tracks passenger from check-in to gate, optimizing each touchpoint',
    category: 'passenger-flow',
    trigger: 'Passenger tracking + flight schedule',
    actions: [
      'Check-in → Lighting ramp 20%→85%',
      'Security → Lane pre-allocation',
      'Retail → Personalized promotions',
      'Gate → Seating area preparation',
      'Boarding → Flow management'
    ],
    metrics: {
      'Journey Time': '-18% total duration',
      'Satisfaction Score': '9.2/10 average',
      'Revenue Impact': '+12% retail spending'
    },
    isActive: false,
    probability: 0.75,
    impact: 'high',
    aiConfidence: 93,
    estimatedDuration: 120,
    costImpact: -450,
    energyImpact: 15
  },

  // Energy Management Scenarios
  {
    id: 'peak-demand-shaving',
    name: 'Peak Demand Energy Shaving',
    description: 'AI predicts peak demand, pre-emptively reduces non-critical loads',
    category: 'energy',
    trigger: 'Energy forecast + demand prediction',
    actions: [
      'Non-critical lighting → 60% reduction',
      'HVAC → Thermal mass pre-conditioning',
      'Escalators → Demand-based operation',
      'Digital signage → Brightness optimization',
      'Battery storage → Peak shaving mode'
    ],
    metrics: {
      'Peak Demand': '-25% reduction',
      'Energy Cost': '-$1,800/day savings',
      'Grid Stability': '+15% contribution'
    },
    isActive: false,
    probability: 0.60,
    impact: 'high',
    aiConfidence: 96,
    estimatedDuration: 60,
    costImpact: -1800,
    energyImpact: -35
  },
  {
    id: 'renewable-integration',
    name: 'Smart Renewable Energy Integration',
    description: 'AI optimizes solar/wind integration with building loads',
    category: 'energy',
    trigger: 'Weather forecast + renewable output',
    actions: [
      'Solar prediction → Load scheduling',
      'Battery management → Optimal charging',
      'Grid interaction → Export optimization',
      'Load shifting → Non-critical systems',
      'Carbon tracking → Real-time optimization'
    ],
    metrics: {
      'Renewable Usage': '78% of total consumption',
      'Grid Independence': '6.5 hours average',
      'Carbon Reduction': '-45% emissions'
    },
    isActive: false,
    probability: 0.70,
    impact: 'high',
    aiConfidence: 91,
    estimatedDuration: 240,
    costImpact: -950,
    energyImpact: -28
  },

  // Security Scenarios
  {
    id: 'perimeter-breach-response',
    name: 'Perimeter Security Breach Response',
    description: 'AI detects unauthorized access, coordinates multi-system lockdown',
    category: 'security',
    trigger: 'CCTV AI + access control anomaly',
    actions: [
      'Zone lockdown → Immediate isolation',
      'Emergency lighting → Full activation',
      'HVAC → Ventilation isolation',
      'Security alerts → Multi-channel notification',
      'Camera tracking → Automated following'
    ],
    metrics: {
      'Response Time': '85% faster than manual',
      'False Positives': '<2% accuracy',
      'Containment Success': '98.5% effectiveness'
    },
    isActive: false,
    probability: 0.05,
    impact: 'critical',
    aiConfidence: 97,
    estimatedDuration: 10,
    costImpact: -5000,
    energyImpact: 25
  },
  {
    id: 'crowd-density-management',
    name: 'Crowd Density Safety Management',
    description: 'AI monitors crowd density, prevents dangerous overcrowding',
    category: 'security',
    trigger: 'Occupancy sensors + crowd analytics',
    actions: [
      'Flow control → Dynamic barriers',
      'Alternative routing → Digital signage',
      'Ventilation → Increased airflow',
      'Staff deployment → Crowd management',
      'Emergency protocols → Standby activation'
    ],
    metrics: {
      'Safety Incidents': '-92% reduction',
      'Crowd Flow': '+35% efficiency',
      'Emergency Readiness': '100% protocol compliance'
    },
    isActive: false,
    probability: 0.30,
    impact: 'high',
    aiConfidence: 94,
    estimatedDuration: 30,
    costImpact: -800,
    energyImpact: 12
  },

  // Baggage System Scenarios
  {
    id: 'baggage-jam-prediction',
    name: 'Predictive Baggage Jam Prevention',
    description: 'AI predicts belt jams 3 minutes before occurrence, prevents disruption',
    category: 'baggage',
    trigger: 'Vibration sensors + load analysis',
    actions: [
      'Belt speed → Gradual reduction',
      'Load balancing → Alternative routes',
      'Maintenance alert → Preventive action',
      'Passenger notification → Delay warning',
      'Staff dispatch → Proactive positioning'
    ],
    metrics: {
      'Jam Prevention': '87% success rate',
      'Downtime Reduction': '-65% maintenance time',
      'Passenger Impact': '-78% delay incidents'
    },
    isActive: false,
    probability: 0.35,
    impact: 'medium',
    aiConfidence: 89,
    estimatedDuration: 20,
    costImpact: -1200,
    energyImpact: -5
  },
  {
    id: 'baggage-sorting-optimization',
    name: 'AI-Driven Baggage Sorting Optimization',
    description: 'Machine learning optimizes baggage routing for fastest processing',
    category: 'baggage',
    trigger: 'Flight schedules + baggage volume',
    actions: [
      'Sorting algorithms → Dynamic optimization',
      'Belt coordination → Multi-system sync',
      'Priority handling → VIP/connecting flights',
      'Load balancing → Even distribution',
      'Quality control → Automated scanning'
    ],
    metrics: {
      'Processing Speed': '+42% throughput',
      'Mishandled Bags': '-68% incidents',
      'Energy Efficiency': '+25% per bag processed'
    },
    isActive: false,
    probability: 0.80,
    impact: 'medium',
    aiConfidence: 92,
    estimatedDuration: 45,
    costImpact: -650,
    energyImpact: -15
  },

  // Maintenance Scenarios
  {
    id: 'predictive-hvac-maintenance',
    name: 'Predictive HVAC Maintenance',
    description: 'AI detects chiller efficiency degradation, schedules optimal maintenance',
    category: 'maintenance',
    trigger: 'Performance analytics + trend analysis',
    actions: [
      'Efficiency monitoring → Trend analysis',
      'Maintenance scheduling → Optimal timing',
      'Backup systems → Seamless transition',
      'Parts ordering → Predictive inventory',
      'Technician dispatch → Skill matching'
    ],
    metrics: {
      'Unplanned Downtime': '-78% reduction',
      'Maintenance Cost': '-35% optimization',
      'System Lifespan': '+25% extension'
    },
    isActive: false,
    probability: 0.45,
    impact: 'high',
    aiConfidence: 95,
    estimatedDuration: 120,
    costImpact: -3500,
    energyImpact: -20
  },
  {
    id: 'escalator-predictive-maintenance',
    name: 'Escalator Predictive Maintenance',
    description: 'Vibration analysis predicts escalator failures before they occur',
    category: 'maintenance',
    trigger: 'Vibration sensors + usage patterns',
    actions: [
      'Vibration analysis → Fault prediction',
      'Usage optimization → Load balancing',
      'Maintenance windows → Off-peak scheduling',
      'Spare parts → Automated ordering',
      'Safety protocols → Proactive measures'
    ],
    metrics: {
      'Failure Prevention': '91% accuracy',
      'Passenger Disruption': '-85% incidents',
      'Maintenance Efficiency': '+60% planning'
    },
    isActive: false,
    probability: 0.25,
    impact: 'medium',
    aiConfidence: 88,
    estimatedDuration: 90,
    costImpact: -2200,
    energyImpact: -8
  },

  // Retail Optimization Scenarios
  {
    id: 'retail-environment-optimization',
    name: 'Retail Environment Optimization',
    description: 'AI adjusts lighting, temperature, and ambiance to maximize retail sales',
    category: 'retail',
    trigger: 'Passenger density + purchase analytics',
    actions: [
      'Lighting → Sales-optimized spectrum',
      'Temperature → Comfort zone targeting',
      'Music/ambiance → Mood enhancement',
      'Product placement → Dynamic recommendations',
      'Queue management → Checkout optimization'
    ],
    metrics: {
      'Sales Increase': '+18% revenue boost',
      'Dwell Time': '+25% in retail zones',
      'Customer Satisfaction': '94% positive feedback'
    },
    isActive: false,
    probability: 0.65,
    impact: 'medium',
    aiConfidence: 87,
    estimatedDuration: 60,
    costImpact: -400,
    energyImpact: 8
  },

  // Sustainability Scenarios
  {
    id: 'carbon-footprint-optimization',
    name: 'Real-Time Carbon Footprint Optimization',
    description: 'AI continuously optimizes operations to minimize carbon emissions',
    category: 'sustainability',
    trigger: 'Carbon tracking + operational data',
    actions: [
      'Energy sourcing → Renewable priority',
      'System efficiency → Carbon-optimized',
      'Waste management → Circular economy',
      'Transportation → Electric vehicle priority',
      'Reporting → Real-time carbon dashboard'
    ],
    metrics: {
      'Carbon Reduction': '-52% emissions',
      'Sustainability Score': '9.1/10 rating',
      'Cost Savings': '$4,200/month green incentives'
    },
    isActive: false,
    probability: 0.90,
    impact: 'high',
    aiConfidence: 93,
    estimatedDuration: 480,
    costImpact: -4200,
    energyImpact: -40
  }
];

export const getScenariosByCategory = (category: string): SimulationScenario[] => {
  return comprehensiveScenarios.filter(scenario => scenario.category === category);
};

export const getHighImpactScenarios = (): SimulationScenario[] => {
  return comprehensiveScenarios.filter(scenario => 
    scenario.impact === 'high' || scenario.impact === 'critical'
  );
};

export const getScenarioById = (id: string): SimulationScenario | undefined => {
  return comprehensiveScenarios.find(scenario => scenario.id === id);
};