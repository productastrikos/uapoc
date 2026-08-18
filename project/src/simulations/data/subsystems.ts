import { SubsystemCategory, NodeFlowData } from '../types';
import { getScenariosByCategory } from './scenarios';

export const subsystemCategories: SubsystemCategory[] = [
  {
    id: 'flight-ops',
    name: 'Flight Operations',
    icon: '✈️',
    description: 'Flight-dependent system orchestration and gate management',
    kpis: [
      { id: 'turnaround-time', name: 'Turnaround Time', value: 32, unit: 'min', trend: 'down', target: 30, status: 'good' },
      { id: 'gate-utilization', name: 'Gate Utilization', value: 87, unit: '%', trend: 'up', target: 85, status: 'good' },
      { id: 'flight-punctuality', name: 'On-Time Performance', value: 94, unit: '%', trend: 'up', target: 90, status: 'good' },
      { id: 'system-sync', name: 'System Sync Rate', value: 99.2, unit: '%', trend: 'stable', target: 99, status: 'good' }
    ],
    scenarios: getScenariosByCategory('flight-ops').slice(0, 3),
    nodeFlow: {
      nodes: [
        { id: 'fids', type: 'input', position: { x: 50, y: 100 }, data: { label: 'FIDS', status: 'active' } },
        { id: 'hbms', type: 'default', position: { x: 200, y: 100 }, data: { label: 'AO-S Core', status: 'active' } },
        { id: 'lighting', type: 'output', position: { x: 350, y: 50 }, data: { label: 'Lighting', status: 'active' } },
        { id: 'hvac', type: 'output', position: { x: 350, y: 100 }, data: { label: 'HVAC', status: 'active' } },
        { id: 'access', type: 'output', position: { x: 350, y: 150 }, data: { label: 'Access Control', status: 'active' } }
      ],
      edges: [
        { id: 'fids-hbms', source: 'fids', target: 'hbms', animated: true, data: { signal: 'data', timestamp: new Date().toISOString() } },
        { id: 'hbms-lighting', source: 'hbms', target: 'lighting', animated: true, data: { signal: 'command', timestamp: new Date().toISOString() } },
        { id: 'hbms-hvac', source: 'hbms', target: 'hvac', animated: true, data: { signal: 'command', timestamp: new Date().toISOString() } },
        { id: 'hbms-access', source: 'hbms', target: 'access', animated: true, data: { signal: 'command', timestamp: new Date().toISOString() } }
      ]
    }
  },
  {
    id: 'security',
    name: 'Security Systems',
    icon: '🔒',
    description: 'AI-powered threat detection and response coordination',
    kpis: [
      { id: 'threat-detection', name: 'Threat Detection', value: 99.8, unit: '%', trend: 'stable', target: 99.5, status: 'good' },
      { id: 'response-time', name: 'Response Time', value: 45, unit: 'sec', trend: 'down', target: 60, status: 'good' },
      { id: 'false-positives', name: 'False Positives', value: 1.2, unit: '%', trend: 'down', target: 2.0, status: 'good' },
      { id: 'coverage', name: 'Camera Coverage', value: 98.5, unit: '%', trend: 'stable', target: 98, status: 'good' }
    ],
    scenarios: getScenariosByCategory('security').slice(0, 2)
  },
  {
    id: 'baggage',
    name: 'Baggage Systems',
    icon: '🧳',
    description: 'Intelligent baggage handling and predictive maintenance',
    kpis: [
      { id: 'processing-speed', name: 'Processing Speed', value: 1850, unit: 'bags/hr', trend: 'up', target: 1800, status: 'good' },
      { id: 'mishandled-rate', name: 'Mishandled Rate', value: 0.8, unit: '%', trend: 'down', target: 1.0, status: 'good' },
      { id: 'system-uptime', name: 'System Uptime', value: 99.4, unit: '%', trend: 'stable', target: 99, status: 'good' },
      { id: 'jam-prevention', name: 'Jam Prevention', value: 87, unit: '%', trend: 'up', target: 85, status: 'good' }
    ],
    scenarios: getScenariosByCategory('baggage').slice(0, 2)
  }
];

export const getSubsystemById = (id: string): SubsystemCategory | undefined => {
  return subsystemCategories.find(subsystem => subsystem.id === id);
};