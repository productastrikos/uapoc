import React, { useState } from 'react';
import { FileText, Play, Pause, CheckCircle, AlertTriangle, Clock, Users, Settings, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar, Cell } from 'recharts';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';

interface SOPStep {
  id: string;
  order: number;
  action: string;
  description: string;
  responsible: string;
  estimatedMinutes: number;
  dependencies: string[];
  evidence: string[];
}

interface SOPPlaybook {
  id: string;
  name: string;
  version: string;
  domain: string;
  triggerConditions: string[];
  steps: SOPStep[];
  approvalRequired: boolean;
  safetyCritical: boolean;
  estimatedDuration: number;
  successRate: number;
  lastUpdated: string;
}

const SOPConsole: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedPlaybook, setSelectedPlaybook] = useState<SOPPlaybook | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const sopPlaybooks: SOPPlaybook[] = [
    {
      id: '1',
      name: 'Aircraft Ground Emergency Response',
      version: '2.4.1',
      domain: 'Emergency Response',
      triggerConditions: ['Aircraft emergency declared', 'Ground incident reported', 'Fire alarm activated'],
      steps: [
        {
          id: '1',
          order: 1,
          action: 'Alert Emergency Services',
          description: 'Immediately notify fire rescue, medical, and security teams',
          responsible: 'AOCC Operator',
          estimatedMinutes: 2,
          dependencies: [],
          evidence: ['Emergency dispatch log', 'Response team acknowledgment']
        },
        {
          id: '2',
          order: 2,
          action: 'Secure Area Perimeter',
          description: 'Establish safety perimeter around incident location',
          responsible: 'Security Supervisor',
          estimatedMinutes: 5,
          dependencies: ['1'],
          evidence: ['Perimeter establishment photo', 'Traffic control setup']
        },
        {
          id: '3',
          order: 3,
          action: 'Coordinate Response Teams',
          description: 'Direct emergency vehicles and coordinate multi-agency response',
          responsible: 'Emergency Manager',
          estimatedMinutes: 10,
          dependencies: ['1', '2'],
          evidence: ['Response coordination log', 'Team deployment status']
        }
      ],
      approvalRequired: false,
      safetyCritical: true,
      estimatedDuration: 30,
      successRate: 94.2,
      lastUpdated: '2025-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Runway Incursion Management',
      version: '1.8.3',
      domain: 'Air Traffic Safety',
      triggerConditions: ['Runway incursion detected', 'ATC alert received', 'Pilot reports conflict'],
      steps: [
        {
          id: '1',
          order: 1,
          action: 'Issue Immediate Stop',
          description: 'Command all aircraft and vehicles to stop movement immediately',
          responsible: 'Air Traffic Controller',
          estimatedMinutes: 1,
          dependencies: [],
          evidence: ['Radio transmission log', 'Radar track data']
        },
        {
          id: '2',
          order: 2,
          action: 'Assess Situation',
          description: 'Determine severity and type of incursion using surveillance data',
          responsible: 'Tower Supervisor',
          estimatedMinutes: 3,
          dependencies: ['1'],
          evidence: ['ASDE-X data', 'Video footage', 'Pilot reports']
        }
      ],
      approvalRequired: true,
      safetyCritical: true,
      estimatedDuration: 15,
      successRate: 98.7,
      lastUpdated: '2025-01-10T14:20:00Z'
    },
    {
      id: '3',
      name: 'Passenger Medical Emergency',
      version: '3.1.0',
      domain: 'Medical Response',
      triggerConditions: ['Medical emergency reported', 'Passenger collapse', 'AED activation'],
      steps: [
        {
          id: '1',
          order: 1,
          action: 'Dispatch Medical Team',
          description: 'Alert and dispatch airport medical response team to location',
          responsible: 'Medical Coordinator',
          estimatedMinutes: 2,
          dependencies: [],
          evidence: ['Dispatch timestamp', 'Team response confirmation']
        },
        {
          id: '2',
          order: 2,
          action: 'Secure Area',
          description: 'Clear area around patient and ensure privacy',
          responsible: 'Security Officer',
          estimatedMinutes: 1,
          dependencies: [],
          evidence: ['Area clearance confirmation']
        }
      ],
      approvalRequired: false,
      safetyCritical: false,
      estimatedDuration: 20,
      successRate: 96.1,
      lastUpdated: '2025-01-12T09:15:00Z'
    },
    {
      id: '4',
      name: 'Security Queue Surge Response',
      version: '1.2.4',
      domain: 'Passenger Operations',
      triggerConditions: ['Queue wait time > 15 minutes', 'Passenger flow bottleneck detected', 'AI prediction alert'],
      steps: [
        {
          id: '1',
          order: 1,
          action: 'Open Additional Security Lane',
          description: 'Activate standby security checkpoint lane',
          responsible: 'Security Supervisor',
          estimatedMinutes: 3,
          dependencies: [],
          evidence: ['Lane activation log', 'Staff assignment confirmation']
        },
        {
          id: '2',
          order: 2,
          action: 'Activate Fast Track Processing',
          description: 'Enable priority processing for eligible passengers',
          responsible: 'Checkpoint Coordinator',
          estimatedMinutes: 2,
          dependencies: [],
          evidence: ['Fast track activation', 'Passenger screening logs']
        }
      ],
      approvalRequired: false,
      safetyCritical: false,
      estimatedDuration: 8,
      successRate: 91.8,
      lastUpdated: '2025-01-18T11:45:00Z'
    }
  ];

  const executionData = [
    { time: '06:00', completed: 12, failed: 1, pending: 3 },
    { time: '08:00', completed: 18, failed: 0, pending: 5 },
    { time: '10:00', completed: 24, failed: 2, pending: 4 },
    { time: '12:00', completed: 31, failed: 1, pending: 7 },
    { time: '14:00', completed: 28, failed: 3, pending: 2 },
    { time: '16:00', completed: 22, failed: 1, pending: 6 },
  ];

  const performanceMetrics = [
    { name: 'Success Rate', value: 94.8, color: '#10B981' },
    { name: 'On-Time Execution', value: 87.3, color: '#01A3A4' },
    { name: 'Compliance Score', value: 99.2, color: '#3B82F6' },
    { name: 'User Satisfaction', value: 91.7, color: '#E6B85C' },
  ];

  const handlePlaybookClick = (playbook: SOPPlaybook) => {
    setSelectedPlaybook(playbook);
    setShowModal(true);
  };

  const handleExecuteSOP = (playbook: SOPPlaybook) => {
    setEmergencyMode(true);
    addToast({
      type: 'success',
      title: 'SOP Execution Started',
      message: `${playbook.name} v${playbook.version} is now executing`,
      duration: 5000
    });
    setTimeout(() => setEmergencyMode(false), 3000);
  };

  const handleEmergencyAction = (action: string) => {
    setEmergencyMode(true);
    addToast({
      type: 'warning',
      title: 'Emergency Action Initiated',
      message: `${action} protocol activated`,
      duration: 5000
    });
    setTimeout(() => setEmergencyMode(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 h-full overflow-y-auto no-scrollbar"
    >
      {/* Header with Emergency Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-accent-blue/15 rounded-lg">
            <FileText className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SOP Console</h1>
            <p className="text-sm text-text-muted">Standard Operating Procedure orchestration and automation</p>
          </div>
        </div>

        {/* Emergency Actions - Top Right */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEmergencyAction('Emergency SOP Override')}
            className="btn btn-danger"
          >
            Emergency Override
          </button>
        </div>
      </div>

      {/* AI Advisory Panel */}
      <div className="glass-panel-strong rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-5 w-5 text-accent-blue" />
          <h2 className="text-base font-semibold text-white">AI-Powered SOP Insights</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 stagger-in">
          <div className="glass-pill glass-pill-blue rounded-lg p-3">
            <div className="text-xl font-bold glow-text">94.8%</div>
            <div className="text-xs text-text-muted">Automation Success Rate</div>
          </div>
          <div className="glass-pill glass-pill-violet rounded-lg p-3">
            <div className="text-xl font-bold text-text-primary">3</div>
            <div className="text-xs text-text-muted">Critical SOPs Active</div>
          </div>
          <div className="glass-pill glass-pill-teal rounded-lg p-3">
            <div className="text-xl font-bold text-text-primary">18.3m</div>
            <div className="text-xs text-text-muted">Average Execution Time</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active SOPs', value: '24', icon: Play, change: '+3', tint: 'glass-pill-blue' },
          { label: 'Success Rate', value: '94.8%', icon: CheckCircle, change: '+1.2%', tint: 'glass-pill-teal' },
          { label: 'Avg Duration', value: '18.3m', icon: Clock, change: '-2.1m', tint: 'glass-pill-violet' },
          { label: 'Compliance', value: '99.2%', icon: Settings, change: '+0.3%', tint: 'glass-pill-neutral' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className={`glass-pill ${stat.tint} rounded-lg p-4 cursor-pointer`}
            onClick={() => handlePlaybookClick(sopPlaybooks[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-text-muted" />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-status-success' : 'text-status-warning'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - SOP Management */}
        <div className="col-span-8 space-y-6">
          {/* SOP Playbook Library */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">SOP Playbook Library</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-status-error rounded-full"></div>
                  <span className="text-text-muted">Safety Critical</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">Approval Required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">Ready to Execute</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {sopPlaybooks.map((playbook, index) => (
                <motion.div
                  key={playbook.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="p-4 glass-panel rounded-xl hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer group"
                  onClick={() => handlePlaybookClick(playbook)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-accent-blue/15">
                        <FileText className="h-5 w-5 text-accent-blue" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                            {playbook.name} v{playbook.version}
                          </h3>
                          {playbook.safetyCritical && (
                            <span className="text-xs px-2 py-0.5 bg-status-error/10 text-status-error border border-status-error/30 rounded-full font-medium">
                              SAFETY CRITICAL
                            </span>
                          )}
                          {playbook.approvalRequired && (
                            <span className="text-xs px-2 py-0.5 bg-status-warning/10 text-status-warning border border-status-warning/30 rounded-full font-medium">
                              APPROVAL REQUIRED
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-text-secondary mb-2">{playbook.domain}</p>

                        <div className="flex items-center space-x-6 text-sm text-text-muted mb-3">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{playbook.steps.length} steps</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{playbook.estimatedDuration}min duration</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>{playbook.successRate}% success rate</span>
                          </div>
                        </div>

                        {/* Trigger Conditions */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-text-secondary mb-1">Trigger Conditions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {playbook.triggerConditions.slice(0, 2).map((condition, i) => (
                              <span key={i} className="px-2 py-0.5 bg-primary-600/40 text-text-secondary rounded text-xs">
                                {condition}
                              </span>
                            ))}
                            {playbook.triggerConditions.length > 2 && (
                              <span className="px-2 py-0.5 bg-primary-600/40 text-text-muted rounded text-xs">
                                +{playbook.triggerConditions.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-text-muted">
                          Last updated: {new Date(playbook.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteSOP(playbook);
                        }}
                        className="btn btn-primary"
                      >
                        Execute SOP
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* SOP Execution Timeline */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">Daily SOP Execution Timeline</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionData}>
                  <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Bar dataKey="completed" stackId="execution" fill="#10B981" />
                  <Bar dataKey="pending" stackId="execution" fill="#F59E0B" />
                  <Bar dataKey="failed" stackId="execution" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-success rounded-full"></div>
                <span className="text-text-muted">Completed</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                <span className="text-text-muted">Pending</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-error rounded-full"></div>
                <span className="text-text-muted">Failed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="col-span-4 space-y-6">
          {/* Performance Metrics */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Performance Metrics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={performanceMetrics}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8">
                    {performanceMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }}></div>
                    <span className="text-text-muted">{metric.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{metric.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Executions */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Active Executions</h3>
            <div className="space-y-3">
              {[
                { sop: 'Medical Emergency', step: '2/4', progress: 50, eta: '8 min', status: 'running' },
                { sop: 'Security Alert', step: '3/5', progress: 60, eta: '12 min', status: 'running' },
                { sop: 'Weather Delay', step: '1/3', progress: 33, eta: '15 min', status: 'pending' },
              ].map((execution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 glass-panel rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{execution.sop}</span>
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4 text-accent-blue" />
                      <span className="text-sm text-text-muted">{execution.step}</span>
                    </div>
                  </div>
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${execution.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-2 bg-accent-blue rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>ETA: {execution.eta}</span>
                    <span className={execution.status === 'running' ? 'text-status-success' : 'text-status-warning'}>
                      {execution.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedPlaybook?.name || 'SOP Playbook Details'}
        data={{
          Overview: {
            title: selectedPlaybook?.name || '',
            status: selectedPlaybook?.safetyCritical ? 'critical' : 'normal',
            currentValue: selectedPlaybook?.successRate || 0,
            unit: '% success rate',
            lastUpdated: selectedPlaybook?.lastUpdated || new Date().toISOString(),
            description: `Standard Operating Procedure for ${selectedPlaybook?.domain} domain with ${selectedPlaybook?.steps.length} automated steps`,
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />
    </motion.div>
  );
};

export default SOPConsole;
