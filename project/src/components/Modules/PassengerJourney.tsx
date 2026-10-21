import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Clock,
  Users, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Luggage, 
  Shield, 
  Import as Passport,
  Plane,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Brain,
  Zap,
  BarChart3,
  Eye,
  Target,
  Activity,
  X,
  Server,
  RefreshCw,
  Upload,
  Database,
  Wifi,
  Cpu,
  HardDrive,
  Network,
  Lock,
  Unlock,
  Camera,
  Monitor,
  FileText,
  PieChart,
  LineChart
} from "lucide-react";
import InfoButton from "../UI/InfoButton";
import DetailModal from '../UI/DetailModal';
import { useToast } from "../../hooks/useToast";
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

// Trend Arrow Component
const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable'; value?: number }> = ({ trend, value }) => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('passenger');
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-status-neutral inline ml-1" />;
  } else if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-status-error inline ml-1" />;
  }
  return <Minus className="w-4 h-4 text-text-muted inline ml-1" />;
};

// Enhanced InfoButton with Portal
const InfoButtonWithPortal: React.FC<{ description: string }> = ({ description }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowTooltip(true);
  };

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
      >
        <Info className="w-4 h-4" />
      </button>

      {showTooltip && createPortal(
        <div
          className="fixed z-[99999] glass-panel-strong text-text-primary text-sm px-3 py-2 rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-primary-800"></div>
        </div>,
        document.body
      )}
    </>
  );
};

interface CheckpointData {
  id: string;
  name: string;
  icon: any;
  status: 'optimal' | 'congested' | 'critical';
  currentQueue: number;
  avgWaitTime: string;
  slaCompliance: number;
  throughputRate: number;
  staffingLevel: number;
  recommendedStaffing: number;
  passengersProcessed: number;
  errorRate: number;
  lastMaintenance: string;
  description: string;
  performance: {
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
}

// Enhanced checkpoint data
const checkpoints: CheckpointData[] = [
  {
    id: 'terminal-entry',
    name: 'Terminal Entry',
    icon: MapPin,
    status: 'optimal',
    currentQueue: 15,
    avgWaitTime: '2 min',
    slaCompliance: 98,
    throughputRate: 450,
    staffingLevel: 6,
    recommendedStaffing: 6,
    passengersProcessed: 2847,
    errorRate: 0.2,
    lastMaintenance: '2024-08-19',
    description: 'Main terminal entry checkpoint with automated screening and temperature monitoring',
    performance: { trend: 'stable', changePercent: 1.2 }
  },
  {
    id: 'check-in',
    name: 'Check-in/Kiosk',
    icon: CheckCircle,
    status: 'optimal',
    currentQueue: 23,
    avgWaitTime: '8 min',
    slaCompliance: 94,
    throughputRate: 320,
    staffingLevel: 8,
    recommendedStaffing: 8,
    passengersProcessed: 3421,
    errorRate: 1.1,
    lastMaintenance: '2024-08-18',
    description: 'Automated check-in counters and self-service kiosks for boarding pass issuance',
    performance: { trend: 'up', changePercent: 5.7 }
  },
  {
    id: 'baggage-drop',
    name: 'Baggage Drop',
    icon: Luggage,
    status: 'congested',
    currentQueue: 42,
    avgWaitTime: '12 min',
    slaCompliance: 78,
    throughputRate: 180,
    staffingLevel: 4,
    recommendedStaffing: 6,
    passengersProcessed: 2156,
    errorRate: 3.4,
    lastMaintenance: '2024-08-17',
    description: 'Baggage drop-off and automated sorting system integration point',
    performance: { trend: 'down', changePercent: -8.3 }
  },
  {
    id: 'security',
    name: 'Security Screening',
    icon: Shield,
    status: 'critical',
    currentQueue: 67,
    avgWaitTime: '18 min',
    slaCompliance: 68,
    throughputRate: 95,
    staffingLevel: 12,
    recommendedStaffing: 16,
    passengersProcessed: 1892,
    errorRate: 5.8,
    lastMaintenance: '2024-08-16',
    description: 'TSA security checkpoint with X-ray screening and metal detection',
    performance: { trend: 'down', changePercent: -15.2 }
  },
  {
    id: 'immigration',
    name: 'Immigration/Passport',
    icon: Passport,
    status: 'optimal',
    currentQueue: 12,
    avgWaitTime: '5 min',
    slaCompliance: 96,
    throughputRate: 240,
    staffingLevel: 10,
    recommendedStaffing: 10,
    passengersProcessed: 1674,
    errorRate: 0.8,
    lastMaintenance: '2024-08-19',
    description: 'Immigration control and passport verification for international passengers',
    performance: { trend: 'stable', changePercent: 0.5 }
  },
  {
    id: 'customs',
    name: 'Customs',
    icon: CheckCircle,
    status: 'optimal',
    currentQueue: 8,
    avgWaitTime: '3 min',
    slaCompliance: 99,
    throughputRate: 380,
    staffingLevel: 5,
    recommendedStaffing: 5,
    passengersProcessed: 1203,
    errorRate: 0.1,
    lastMaintenance: '2024-08-18',
    description: 'Customs declaration and inspection checkpoint for arriving passengers',
    performance: { trend: 'up', changePercent: 3.1 }
  },
  {
    id: 'airside',
    name: 'Airside/Retail',
    icon: ShoppingBag,
    status: 'optimal',
    currentQueue: 34,
    avgWaitTime: '0 min',
    slaCompliance: 100,
    throughputRate: 520,
    staffingLevel: 15,
    recommendedStaffing: 15,
    passengersProcessed: 4521,
    errorRate: 0.0,
    lastMaintenance: '2024-08-20',
    description: 'Secure airside area with retail, dining, and passenger amenities',
    performance: { trend: 'up', changePercent: 7.8 }
  },
  {
    id: 'boarding-gate',
    name: 'Boarding Gate',
    icon: Plane,
    status: 'congested',
    currentQueue: 89,
    avgWaitTime: '15 min',
    slaCompliance: 82,
    throughputRate: 125,
    staffingLevel: 6,
    recommendedStaffing: 8,
    passengersProcessed: 2847,
    errorRate: 2.7,
    lastMaintenance: '2024-08-17',
    description: 'Aircraft boarding gates with biometric verification and boarding pass scanning',
    performance: { trend: 'down', changePercent: -6.4 }
  },
  {
    id: 'aircraft-entry',
    name: 'Aircraft Entry',
    icon: Plane,
    status: 'optimal',
    currentQueue: 6,
    avgWaitTime: '4 min',
    slaCompliance: 95,
    throughputRate: 280,
    staffingLevel: 4,
    recommendedStaffing: 4,
    passengersProcessed: 2634,
    errorRate: 1.2,
    lastMaintenance: '2024-08-19',
    description: 'Final passenger verification before aircraft boarding',
    performance: { trend: 'stable', changePercent: -1.1 }
  },
  {
    id: 'cabin-process',
    name: 'Cabin Process',
    icon: Users,
    status: 'optimal',
    currentQueue: 0,
    avgWaitTime: '0 min',
    slaCompliance: 100,
    throughputRate: 450,
    staffingLevel: 8,
    recommendedStaffing: 8,
    passengersProcessed: 2634,
    errorRate: 0.0,
    lastMaintenance: '2024-08-20',
    description: 'Final cabin seating and safety briefing process',
    performance: { trend: 'stable', changePercent: 0.0 }
  },
];

const PassengerJourney: React.FC = () => {
  const { addToast } = useToast();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAIAdvisoryModal, setShowAIAdvisoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Emergency states
  const [evacuationActive, setEvacuationActive] = useState(false);
  const [surgeResponseActive, setSurgeResponseActive] = useState(false);
  const [optimizationActive, setOptimizationActive] = useState(false);
  const [aiOptimizationExecuted, setAiOptimizationExecuted] = useState(false);
  const [executedSOPs, setExecutedSOPs] = useState<{[key: string]: boolean}>({});

  // AI Advisory Data. Trends always point somewhere — before AI optimization
  // is executed they show the baseline drifting the wrong way (the reason to
  // act), and flip to improving once it is, rather than sitting on 'stable'
  // (which renders as a flat dash with nothing to compare it to).
  const aiAdvisoryData = {
    flowEfficiency: aiOptimizationExecuted ? 94.8 : 89.2,
    flowEfficiencyTrend: aiOptimizationExecuted ? 'up' : 'down' as 'up' | 'down' | 'stable',
    avgJourneyTime: aiOptimizationExecuted ? '68 min' : '78 min',
    journeyTimeTrend: aiOptimizationExecuted ? 'down' : 'up' as 'up' | 'down' | 'stable',
    slaCompliance: aiOptimizationExecuted ? '95.2%' : '89.2%',
    slaComplianceTrend: aiOptimizationExecuted ? 'up' : 'down' as 'up' | 'down' | 'stable',
    activePassengers: aiOptimizationExecuted ? '1,485' : '1,247',
    passengersTrend: 'up' as 'up' | 'down' | 'stable',
    bottleneckAlerts: aiOptimizationExecuted ? '1' : '3',
    bottleneckTrend: aiOptimizationExecuted ? 'down' : 'up' as 'up' | 'down' | 'stable',
    recommendations: [
      'Deploy additional staff to Security Screening (4 additional officers needed)',
      'Activate alternative baggage drop lanes to reduce queue by 35%',
      'Implement dynamic gate allocation for Flight QH305 passengers',
      'Enable express security lane for premium passengers during peak hours',
      'Activate backup immigration kiosks for international passenger surge'
    ]
  };

  // Button handlers with realistic state changes
  const handleEmergencyEvacuation = () => {
    setEvacuationActive(!evacuationActive);
    addToast({
      type: evacuationActive ? 'info' : 'warning',
      title: evacuationActive ? 'Evacuation Protocol Deactivated' : 'Terminal Evacuation Initiated',
      message: evacuationActive ? 
        'Normal passenger flow resumed. All checkpoints returning to standard operations.' : 
        'Emergency evacuation protocol activated. All passengers being directed to emergency exits.',
      duration: 6000
    });

    if (!evacuationActive) {
      setTimeout(() => {
        setEvacuationActive(false);
        addToast({
          type: 'success',
          title: 'Evacuation Complete',
          message: 'All passengers safely evacuated. Terminal ready for normal operations.',
          duration: 4000
        });
      }, 20000);
    }
  };

  const handleQueueSurgeResponse = () => {
    setSurgeResponseActive(!surgeResponseActive);
    addToast({
      type: surgeResponseActive ? 'info' : 'success',
      title: surgeResponseActive ? 'Surge Response Deactivated' : 'Queue Surge Response Activated',
      message: surgeResponseActive ? 
        'Standard checkpoint operations resumed. Additional lanes deactivated.' : 
        'Additional security lanes activated. Express processing enabled for queue management.',
      duration: 5000
    });
  };

  const handleFlowOptimization = () => {
    setOptimizationActive(!optimizationActive);
    addToast({
      type: optimizationActive ? 'info' : 'success',
      title: optimizationActive ? 'Flow Optimization Disabled' : 'Flow Optimization Activated',
      message: optimizationActive ? 
        'Standard passenger flow algorithms restored.' : 
        'AI-powered flow optimization active. Dynamic routing and queue balancing enabled.',
      duration: 4000
    });
  };

  const handleAIOptimizationExecute = () => {
    setAiOptimizationExecuted(!aiOptimizationExecuted);
    addToast({
      type: aiOptimizationExecuted ? 'info' : 'success',
      title: aiOptimizationExecuted ? 'AI Optimization Disabled' : 'AI Recommendations Executed',
      message: aiOptimizationExecuted ? 
        'AI optimization disabled. Passenger flow returned to baseline metrics.' : 
        'AI-powered optimization applied. Journey time reduced by 13%, SLA compliance improved to 95.2%.',
      duration: 6000
    });
  };

  const handleCheckpointClick = (checkpoint: CheckpointData) => {
    setSelectedCheckpoint(checkpoint);
    setActiveTab('overview');
    setShowModal(true);
  };

  const handleAIAdvisoryClick = () => {
    setShowAIAdvisoryModal(true);
    setActiveTab('overview');
  };

  const handleExecuteSOP = (checkpointId: string, checkpointName: string) => {
    setExecutedSOPs(prev => ({
      ...prev,
      [checkpointId]: true
    }));

    setShowModal(false);
    setSelectedCheckpoint(null);

    addToast({
      type: 'success',
      title: 'SOP Executed Successfully',
      message: `Optimization SOP executed for ${checkpointName}. Performance improvements in progress.`,
      duration: 5000
    });

    setTimeout(() => {
      setExecutedSOPs(prev => ({
        ...prev,
        [checkpointId]: false
      }));
      
      addToast({
        type: 'info',
        title: 'SOP Execution Complete',
        message: `${checkpointName} optimization completed. Monitoring resumed.`,
        duration: 3000
      });
    }, 25000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-status-neutral/10 text-status-neutral border-status-neutral/30';
      case 'congested': return 'bg-status-warning/10 text-status-warning border-status-warning/30';
      case 'critical': return 'bg-status-error/10 text-status-error border-status-error/30';
      default: return 'bg-primary-600/30 text-text-muted border-primary-600/50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-status-neutral';
      case 'congested': return 'text-status-warning';
      case 'critical': return 'text-status-error';
      default: return 'text-text-muted';
    }
  };

  // Enhanced Component Modal with ALL TABS FUNCTIONAL
  const CheckpointModal = () => (
    <AnimatePresence>
      {showModal && selectedCheckpoint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="modal-surface rounded-xl p-5 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(96, 165, 250, 0.08),
                inset 0 1px 0 rgba(147, 197, 253, 0.12)
              `
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedCheckpoint.name}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-accent-blue/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex space-x-1 mb-4 bg-primary-700/30 p-1 rounded-lg backdrop-blur-sm">
              {['overview', 'trends', 'insights', 'actions', 'evidence'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
                    activeTab === tab
                      ? 'bg-accent-blue text-white shadow-2xl'
                      : 'text-text-muted hover:text-text-primary hover:bg-primary-600/50'
                  }`}
                  style={activeTab === tab ? {
                    boxShadow: `
                      0 4px 20px rgba(59, 130, 246, 0.4),
                      inset 0 1px 0 rgba(191, 219, 254, 0.22)
                    `
                  } : {}}
                >
                  <span className="relative z-10">
                    {tab === 'actions' ? 'Action Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto pr-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-text-muted mb-2">Status</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusTextColor(selectedCheckpoint.status).replace('text-', 'bg-')} animate-pulse`}></div>
                        <span className={`font-medium ${getStatusTextColor(selectedCheckpoint.status)}`}>
                          {selectedCheckpoint.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-text-muted mb-2">Queue Length</h4>
                      <span className="text-white font-medium flex items-center">
                        {selectedCheckpoint.currentQueue}
                        <TrendArrow trend={selectedCheckpoint.currentQueue > 30 ? 'up' : 'stable'} />
                      </span>
                    </div>
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-text-muted mb-2">SLA Compliance</h4>
                      <span className={`font-medium flex items-center ${getStatusTextColor(selectedCheckpoint.status)}`}>
                        {selectedCheckpoint.slaCompliance}%
                        <TrendArrow trend={selectedCheckpoint.performance.trend} />
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-sm font-semibold text-text-muted mb-2">Description</h4>
                    <p className="text-text-secondary">{selectedCheckpoint.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-text-muted mb-3">Performance Metrics</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Throughput Rate:</span>
                          <span className="text-white font-medium">{selectedCheckpoint.throughputRate} pax/hr</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Passengers Processed:</span>
                          <span className="text-white font-medium">{selectedCheckpoint.passengersProcessed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Error Rate:</span>
                          <span className={selectedCheckpoint.errorRate > 3 ? 'text-status-error' : 'text-status-neutral'}>
                            {selectedCheckpoint.errorRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-text-muted mb-3">Staffing Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Current Staff:</span>
                          <span className="text-white font-medium">{selectedCheckpoint.staffingLevel}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Recommended:</span>
                          <span className={selectedCheckpoint.recommendedStaffing > selectedCheckpoint.staffingLevel ? 'text-status-warning' : 'text-status-neutral'}>
                            {selectedCheckpoint.recommendedStaffing}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-muted">Last Maintenance:</span>
                          <span className="text-white font-medium">{selectedCheckpoint.lastMaintenance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <LineChart className="w-5 h-5 mr-2 text-teal-400" />
                        Performance Trends (7 Days)
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Queue Length</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">{selectedCheckpoint.currentQueue}</span>
                            <TrendArrow trend={selectedCheckpoint.currentQueue > 30 ? 'up' : selectedCheckpoint.currentQueue < 10 ? 'down' : 'stable'} />
                            <span className="text-xs text-text-muted ml-2">vs. avg 28</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Wait Time</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">{selectedCheckpoint.avgWaitTime}</span>
                            <TrendArrow trend={selectedCheckpoint.performance.trend} />
                            <span className="text-xs text-text-muted ml-2">-{Math.abs(selectedCheckpoint.performance.changePercent)}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">SLA Compliance</span>
                          <div className="flex items-center">
                            <span className={`font-medium mr-2 ${getStatusTextColor(selectedCheckpoint.status)}`}>
                              {selectedCheckpoint.slaCompliance}%
                            </span>
                            <TrendArrow trend={selectedCheckpoint.slaCompliance > 90 ? 'up' : selectedCheckpoint.slaCompliance < 80 ? 'down' : 'stable'} />
                            <span className="text-xs text-text-muted ml-2">vs. target 95%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-accent-blue" />
                        Operational Metrics
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Throughput</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">{selectedCheckpoint.throughputRate}/hr</span>
                            <TrendArrow trend={selectedCheckpoint.throughputRate > 300 ? 'up' : selectedCheckpoint.throughputRate < 150 ? 'down' : 'stable'} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Error Rate</span>
                          <div className="flex items-center">
                            <span className={`font-medium mr-2 ${selectedCheckpoint.errorRate > 3 ? 'text-status-error' : 'text-status-neutral'}`}>
                              {selectedCheckpoint.errorRate}%
                            </span>
                            <TrendArrow trend={selectedCheckpoint.errorRate > 3 ? 'up' : 'down'} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Efficiency</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">{100 - selectedCheckpoint.errorRate * 10}%</span>
                            <TrendArrow trend={selectedCheckpoint.errorRate < 2 ? 'up' : selectedCheckpoint.errorRate > 4 ? 'down' : 'stable'} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="bg-accent-blue/10 p-5 rounded-lg backdrop-blur-sm border border-accent-blue/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-accent-blue" />
                      AI-Powered Insights
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-accent-blue/10 p-4 rounded-lg">
                        <h5 className="text-accent-blue font-medium mb-2">Predictive Analysis</h5>
                        <p className="text-text-secondary text-sm mb-3">
                          {selectedCheckpoint.status === 'critical' 
                            ? `Critical bottleneck detected. Queue length expected to increase by 45% in next 2 hours without intervention. Immediate staffing increase recommended.`
                            : selectedCheckpoint.status === 'congested'
                            ? `Moderate congestion pattern identified. Peak hour optimization can reduce wait times by 25-30%. Consider dynamic lane allocation.`
                            : `Optimal performance maintained. Current efficiency at 94%. Preventive maintenance window available during low-traffic periods.`
                          }
                        </p>
                        <div className="flex items-center text-xs text-accent-blue">
                          <Target className="w-3 h-3 mr-1" />
                          Confidence: {selectedCheckpoint.status === 'critical' ? '96%' : selectedCheckpoint.status === 'congested' ? '89%' : '94%'}
                        </div>
                      </div>

                      <div className="bg-blue-800/30 p-4 rounded-lg">
                        <h5 className="text-blue-300 font-medium mb-2">Optimization Opportunities</h5>
                        <ul className="text-text-secondary text-sm space-y-2">
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            {selectedCheckpoint.recommendedStaffing > selectedCheckpoint.staffingLevel 
                              ? `Deploy ${selectedCheckpoint.recommendedStaffing - selectedCheckpoint.staffingLevel} additional staff members during peak hours`
                              : 'Current staffing levels are optimal for demand patterns'
                            }
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            Implement dynamic queue management to reduce wait times by 15-20%
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            {selectedCheckpoint.errorRate > 2 
                              ? 'Enhanced training protocols recommended to reduce processing errors'
                              : 'Error rates within acceptable parameters - maintain current procedures'
                            }
                          </li>
                        </ul>
                      </div>

                      <div className="bg-status-neutral/10 p-4 rounded-lg">
                        <h5 className="text-status-neutral font-medium mb-2">Performance Indicators</h5>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-status-neutral">{selectedCheckpoint.slaCompliance}%</div>
                            <div className="text-xs text-text-muted">SLA Compliance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-status-neutral">{selectedCheckpoint.throughputRate}</div>
                            <div className="text-xs text-text-muted">Hourly Throughput</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/40 p-5 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-status-warning" />
                      Available Actions
                    </h4>
                    <div className="space-y-4">
                      <div className="border-b border-primary-600/50 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">Execute Optimization SOP</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-accent-teal bg-accent-teal/20 px-2 py-1 rounded-full">
                              Confidence: {selectedCheckpoint.status === 'critical' ? '95%' : '92%'}
                            </span>
                            <span className="text-xs text-status-neutral bg-status-neutral/20 px-2 py-1 rounded-full">Safe</span>
                          </div>
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          {selectedCheckpoint.status === 'critical' 
                            ? `Deploy emergency staffing and activate backup processing lanes. Expected 40% improvement in queue processing.`
                            : `Apply AI-recommended optimization for ${selectedCheckpoint.name}. Expected ${selectedCheckpoint.status === 'congested' ? '25%' : '8%'} performance improvement.`
                          }
                        </p>
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleExecuteSOP(selectedCheckpoint.id, selectedCheckpoint.name)}
                            disabled={executedSOPs[selectedCheckpoint.id]}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                              executedSOPs[selectedCheckpoint.id]
                                ? 'bg-status-neutral/20 text-status-neutral cursor-not-allowed'
                                : 'bg-accent-blue hover:bg-accent-blueHover text-white shadow-lg'
                            }`}
                            style={!executedSOPs[selectedCheckpoint.id] ? {
                              boxShadow: `
                                0 4px 20px rgba(59, 130, 246, 0.3),
                                inset 0 1px 0 rgba(191, 219, 254, 0.22)
                              `
                            } : {}}
                          >
                            <Zap className="w-4 h-4" />
                            <span>{executedSOPs[selectedCheckpoint.id] ? '✓ SOP Executed' : 'Execute SOP'}</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/40 p-5 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-accent-blue" />
                      System Evidence & Logs
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-accent-blue/10 p-4 rounded-lg">
                        <h5 className="text-accent-blue font-medium mb-3 flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          Performance Data Sources
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-2 bg-primary-600/30 rounded">
                            <span className="text-text-secondary">Queue Sensors</span>
                            <span className="text-status-neutral flex items-center">
                              <div className="w-2 h-2 bg-status-neutral rounded-full mr-2 animate-pulse"></div>
                              Active
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary-600/30 rounded">
                            <span className="text-text-secondary">Processing Timers</span>
                            <span className="text-status-neutral flex items-center">
                              <div className="w-2 h-2 bg-status-neutral rounded-full mr-2 animate-pulse"></div>
                              Active
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary-600/30 rounded">
                            <span className="text-text-secondary">Staff Terminals</span>
                            <span className="text-status-neutral flex items-center">
                              <div className="w-2 h-2 bg-status-neutral rounded-full mr-2 animate-pulse"></div>
                              Connected
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-800/30 p-4 rounded-lg">
                        <h5 className="text-blue-300 font-medium mb-3 flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Recent Activity Log
                        </h5>
                        <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                          <div className="flex items-center text-text-secondary p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-text-muted mr-3">{new Date().toLocaleTimeString()}</span>
                            <span>Passenger processed successfully - ID: PAX{Math.floor(Math.random() * 10000)}</span>
                          </div>
                          <div className="flex items-center text-text-secondary p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-text-muted mr-3">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                            <span>Queue length updated: {selectedCheckpoint.currentQueue} passengers</span>
                          </div>
                          <div className="flex items-center text-text-secondary p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-text-muted mr-3">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                            <span>SLA compliance check: {selectedCheckpoint.slaCompliance}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-status-neutral/10 p-4 rounded-lg">
                        <h5 className="text-status-neutral font-medium mb-3 flex items-center">
                          <Camera className="w-4 h-4 mr-2" />
                          Monitoring Systems
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-primary-600/30 p-3 rounded text-center">
                            <Monitor className="w-6 h-6 text-status-neutral mx-auto mb-2" />
                            <div className="text-sm text-white font-medium">Video Feed</div>
                            <div className="text-xs text-status-neutral">Live</div>
                          </div>
                          <div className="bg-primary-600/30 p-3 rounded text-center">
                            <Wifi className="w-6 h-6 text-status-neutral mx-auto mb-2" />
                            <div className="text-sm text-white font-medium">Network</div>
                            <div className="text-xs text-status-neutral">Connected</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // AI Advisory Modal with ALL TABS FUNCTIONAL
  const AIAdvisoryModal = () => (
    <AnimatePresence>
      {showAIAdvisoryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
          onClick={() => setShowAIAdvisoryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="modal-surface rounded-xl p-5 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(96, 165, 250, 0.08),
                inset 0 1px 0 rgba(147, 197, 253, 0.12)
              `
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">AI Passenger Flow Advisory</h2>
              <button
                onClick={() => setShowAIAdvisoryModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-accent-blue/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex space-x-1 mb-4 bg-primary-700/30 p-1 rounded-lg backdrop-blur-sm">
              {['overview', 'analytics', 'predictions', 'actions', 'execution'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
                    activeTab === tab
                      ? 'bg-accent-blue text-white shadow-2xl'
                      : 'text-text-muted hover:text-text-primary hover:bg-primary-600/50'
                  }`}
                  style={activeTab === tab ? {
                    boxShadow: `
                      0 4px 20px rgba(59, 130, 246, 0.4),
                      inset 0 1px 0 rgba(191, 219, 254, 0.22)
                    `
                  } : {}}
                >
                  <span className="relative z-10">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto pr-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-status-neutral/10 p-4 rounded-lg border border-status-neutral/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-status-neutral flex items-center justify-center">
                        {aiAdvisoryData.flowEfficiency}%
                        <TrendArrow trend={aiAdvisoryData.flowEfficiencyTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Flow Efficiency</div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-blue-400 flex items-center justify-center">
                        {aiAdvisoryData.avgJourneyTime}
                        <TrendArrow trend={aiAdvisoryData.journeyTimeTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Journey Time</div>
                    </div>
                    <div className="bg-accent-blue/10 p-4 rounded-lg border border-accent-blue/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-accent-blue flex items-center justify-center">
                        {aiAdvisoryData.slaCompliance}
                        <TrendArrow trend={aiAdvisoryData.slaComplianceTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">SLA Compliance</div>
                    </div>
                    <div className="bg-teal-500/10 p-4 rounded-lg border border-teal-500/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-teal-400 flex items-center justify-center">
                        {aiAdvisoryData.activePassengers}
                        <TrendArrow trend={aiAdvisoryData.passengersTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Active Passengers</div>
                    </div>
                    <div className="bg-status-warning/10 p-4 rounded-lg border border-status-warning/30 backdrop-blur-sm">
                      <div className="text-xl font-bold text-status-warning flex items-center justify-center">
                        {aiAdvisoryData.bottleneckAlerts}
                        <TrendArrow trend={aiAdvisoryData.bottleneckTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Bottlenecks</div>
                    </div>
                  </div>

                  <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-sm font-semibold text-text-muted mb-2">AI Analysis Summary</h4>
                    <p className="text-text-secondary">
                      AI analysis indicates significant bottlenecks at Security Screening and Baggage Drop checkpoints. 
                      Passenger flow efficiency can be improved by 23% through strategic staff reallocation and 
                      activation of express processing lanes. Current SLA compliance is below target across 3 checkpoints.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-accent-blue" />
                        Passenger Distribution
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Terminal Entry</span>
                          <span className="text-white font-medium">15 passengers</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Security Queue</span>
                          <span className="text-status-error font-medium">67 passengers</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Boarding Gates</span>
                          <span className="text-status-warning font-medium">89 passengers</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-text-secondary">Airside Retail</span>
                          <span className="text-status-neutral font-medium">34 passengers</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-primary-700/40 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <LineChart className="w-5 h-5 mr-2 text-teal-400" />
                        Flow Patterns
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-primary-600/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-text-secondary">Peak Hour Flow</span>
                            <span className="text-teal-400">8:00-11:00 AM</span>
                          </div>
                          <div className="w-full bg-primary-700 rounded-full h-2">
                            <div className="bg-teal-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                        <div className="p-3 bg-primary-600/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-text-secondary">Evening Rush</span>
                            <span className="text-status-warning">5:00-8:00 PM</span>
                          </div>
                          <div className="w-full bg-primary-700 rounded-full h-2">
                            <div className="bg-status-warning h-2 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                        </div>
                        <div className="p-3 bg-primary-600/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-text-secondary">Off-Peak</span>
                            <span className="text-status-neutral">12:00-4:00 PM</span>
                          </div>
                          <div className="w-full bg-primary-700 rounded-full h-2">
                            <div className="bg-status-neutral h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'predictions' && (
                <div className="space-y-6">
                  <div className="bg-accent-blue/10 p-5 rounded-lg backdrop-blur-sm border border-accent-blue/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-accent-blue" />
                      Predictive Analytics
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-accent-blue/10 p-4 rounded-lg">
                        <h5 className="text-accent-blue font-medium mb-2">Next Hour Forecast</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-primary-600/30 rounded-lg">
                            <div className="text-2xl font-bold text-status-warning">+32%</div>
                            <div className="text-xs text-text-muted">Queue Growth</div>
                          </div>
                          <div className="text-center p-3 bg-primary-600/30 rounded-lg">
                            <div className="text-2xl font-bold text-status-error">-15%</div>
                            <div className="text-xs text-text-muted">SLA Risk</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-800/30 p-4 rounded-lg">
                        <h5 className="text-blue-300 font-medium mb-2">4-Hour Outlook</h5>
                        <p className="text-text-secondary text-sm mb-3">
                          Expected passenger volume increase of 45% during evening rush (5-8 PM). 
                          Security checkpoint wait times may exceed 25 minutes without intervention.
                        </p>
                        <div className="flex items-center text-xs text-blue-400">
                          <Target className="w-3 h-3 mr-1" />
                          Prediction Accuracy: 94.2%
                        </div>
                      </div>

                      <div className="bg-status-neutral/10 p-4 rounded-lg">
                        <h5 className="text-status-neutral font-medium mb-2">Optimization Potential</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm">Wait Time Reduction</span>
                            <span className="text-status-neutral font-medium">up to 35%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm">Throughput Increase</span>
                            <span className="text-status-neutral font-medium">up to 28%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm">SLA Improvement</span>
                            <span className="text-status-neutral font-medium">up to 12%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/40 p-5 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-status-warning" />
                      AI Recommendations
                    </h4>
                    
                    <div className="space-y-4">
                      {aiAdvisoryData.recommendations.map((recommendation, index) => (
                        <div key={index} className="border-b border-primary-600/50 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">Recommendation #{index + 1}</h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-accent-teal bg-accent-teal/20 px-2 py-1 rounded-full">High Priority</span>
                              <span className="text-xs text-status-neutral bg-status-neutral/20 px-2 py-1 rounded-full">AI Generated</span>
                            </div>
                          </div>
                          <p className="text-sm text-text-muted mb-3">
                            {recommendation}
                          </p>
                          <div className="flex space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-4 py-2 rounded-lg font-medium bg-primary-700 hover:bg-primary-600 text-white shadow-lg transition-all duration-300"
                              style={{
                                boxShadow: `
                                  0 4px 20px rgba(59, 130, 246, 0.3),
                                  inset 0 1px 0 rgba(191, 219, 254, 0.22)
                                `
                              }}
                            >
                              Execute
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="px-4 py-2 rounded-lg font-medium bg-primary-700 hover:bg-primary-600 text-white shadow-lg transition-all duration-300"
                            >
                              Review
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'execution' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/40 p-5 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-status-warning" />
                      Execute AI Optimization
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="border-b border-primary-600/50 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">Journey Flow AI Enhancement</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-accent-teal bg-accent-teal/20 px-2 py-1 rounded-full">Confidence: 96.7%</span>
                            <span className="text-xs text-status-neutral bg-status-neutral/20 px-2 py-1 rounded-full">Safe</span>
                          </div>
                        </div>
                        <p className="text-sm text-text-muted mb-4">
                          Apply comprehensive AI optimization across all passenger journey checkpoints. 
                          Expected improvements: 13% journey time reduction, 6% SLA compliance increase, 
                          35% reduction in bottleneck alerts.
                        </p>
                        
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAIOptimizationExecute}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                              aiOptimizationExecuted
                                ? 'bg-status-neutral/20 text-status-neutral'
                                : 'bg-accent-teal hover:bg-teal-600 text-white shadow-lg'
                            }`}
                            style={!aiOptimizationExecuted ? {
                              boxShadow: `
                                0 4px 20px rgba(20, 184, 166, 0.3),
                                inset 0 1px 0 rgba(191, 219, 254, 0.22)
                              `
                            } : {}}
                          >
                            <Zap className="w-5 h-5" />
                            <span>
                              {aiOptimizationExecuted ? '✓ AI Optimization Active' : 'Execute AI Optimization'}
                            </span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 rounded-lg font-medium bg-primary-700 hover:bg-primary-600 text-white shadow-lg transition-all duration-300 flex items-center space-x-2"
                            style={{
                              boxShadow: `
                                0 4px 20px rgba(147, 51, 234, 0.3),
                                inset 0 1px 0 rgba(191, 219, 254, 0.22)
                              `
                            }}
                          >
                            <RefreshCw className="w-5 h-5" />
                            <span>Simulate Changes</span>
                          </motion.button>
                        </div>
                      </div>

                      {aiOptimizationExecuted && (
                        <div className="bg-status-neutral/10 rounded-lg p-4 border border-status-neutral/30 backdrop-blur-sm">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-6 h-6 text-status-neutral" />
                            <div>
                              <h6 className="text-status-neutral font-medium">AI Optimization Successfully Applied</h6>
                              <p className="text-status-neutral/80 text-sm">
                                Passenger journey performance enhanced across all checkpoints. Real-time monitoring active.
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-status-neutral/15 rounded-lg">
                              <div className="text-lg font-bold text-status-neutral">-13%</div>
                              <div className="text-xs text-text-muted">Journey Time</div>
                            </div>
                            <div className="text-center p-3 bg-status-neutral/15 rounded-lg">
                              <div className="text-lg font-bold text-status-neutral">+6%</div>
                              <div className="text-xs text-text-muted">SLA Compliance</div>
                            </div>
                            <div className="text-center p-3 bg-status-neutral/15 rounded-lg">
                              <div className="text-lg font-bold text-status-neutral">-67%</div>
                              <div className="text-xs text-text-muted">Bottlenecks</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden"
    >
      <div className="relative z-10 space-y-4 p-4">
        {/* Enhanced AI Advisory Panel - Clickable */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={handleAIAdvisoryClick}
          whileHover={{
            scale: 1.01,
            y: -2,
            boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
          }}
          whileTap={{ scale: 0.99 }}
          className="relative overflow-hidden glass-panel-strong rounded-xl p-4 shadow-2xl cursor-pointer transition-all duration-300 group w-full"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-accent-blue drop-shadow-lg" />
                <h3 className="text-lg font-semibold text-white drop-shadow-md">AI Passenger Flow Predictions</h3>
                <InfoButtonWithPortal description="AI-powered passenger flow analysis with predictive bottleneck detection, journey optimization recommendations, and real-time SLA monitoring." />
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {[
                { value: `${aiAdvisoryData.flowEfficiency}%`, trend: aiAdvisoryData.flowEfficiencyTrend, label: 'Flow Efficiency' },
                { value: aiAdvisoryData.avgJourneyTime, trend: aiAdvisoryData.journeyTimeTrend, label: 'Journey Time' },
                { value: aiAdvisoryData.slaCompliance, trend: aiAdvisoryData.slaComplianceTrend, label: 'SLA Compliance' },
                { value: aiAdvisoryData.activePassengers, trend: aiAdvisoryData.passengersTrend, label: 'Active Passengers' },
                { value: aiAdvisoryData.bottleneckAlerts, trend: aiAdvisoryData.bottleneckTrend, label: 'Bottlenecks' },
              ].map((tile) => (
                <div key={tile.label} className="text-center p-3 bg-primary-800/60 rounded-lg border border-primary-600/40">
                  <div className={`text-xl font-bold flex items-center justify-center ${
                    tile.label === 'Flow Efficiency' || tile.label === 'SLA Compliance' ? 'glow-text' : 'text-text-primary'
                  }`}>
                    {tile.value}
                    <TrendArrow trend={tile.trend} />
                  </div>
                  <div className="text-xs text-text-muted">{tile.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-accent-blue/15 rounded-lg">
              <Users className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Passenger Journey Analytics</h1>
              <p className="text-text-muted text-sm">End-to-end passenger experience tracking & flow optimization</p>
            </div>
            <InfoButtonWithPortal description="Comprehensive passenger journey monitoring with 10-step checkpoint analysis, real-time bottleneck prediction, SLA compliance tracking, and AI-powered flow optimization." />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleEmergencyEvacuation}
              className={`btn min-w-[11rem] ${evacuationActive ? 'btn-danger-active' : 'btn-danger'}`}
            >
              {evacuationActive ? 'Evacuating...' : 'Terminal Evacuation'}
            </button>
            <button
              onClick={handleQueueSurgeResponse}
              className={`btn min-w-[11rem] ${surgeResponseActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              {surgeResponseActive ? 'Response Active' : 'Queue Surge Response'}
            </button>
            <button
              onClick={handleFlowOptimization}
              className={`btn min-w-[11rem] ${optimizationActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              {optimizationActive ? 'Optimizing...' : 'Flow Optimization'}
            </button>
          </div>
        </motion.div>

        {/* Passenger-facing AI recommendations, sitting with the journey they
            act on. */}
        <AiInsightPanel domain="passenger" />

        {/* Digital Twin Visualization */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-primary-800/50 rounded-xl p-5 border border-teal-500/30 backdrop-blur-sm shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white drop-shadow-md">Passenger Journey Digital Twin</h3>
                <InfoButtonWithPortal description="Interactive 3D visualization of terminal passenger flow with real-time occupancy data, journey tracking, emergency routing, and predictive analytics." />
              </div>
            </div>

            <div className="sketchfab-embed-wrapper rounded-lg overflow-hidden border border-teal-500/20">
              <iframe 
                title="Airport Check-in Building 01" 
                frameBorder="0" 
                allowFullScreen 
                mozAllowFullScreen={true}
                webkitAllowFullScreen={true}
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/82ae6c35eec446b49100da2039f3af57/embed?autostart=1&camera=0&preload=1&transparent=1&ui_infos=0"
                className="w-full h-96"
              />
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex space-x-4">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></span>
                  <span className="text-text-secondary">Low Density</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-status-warning rounded-full animate-pulse"></span>
                  <span className="text-text-secondary">Medium Density</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-status-error rounded-full animate-pulse"></span>
                  <span className="text-text-secondary">High Density</span>
                </span>
              </div>
              <div className="text-text-muted">Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced 10-Step Journey Visualization */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative"
        >
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {checkpoints.map((checkpoint, index) => {
              const Icon = checkpoint.icon;
              const isActive = selectedCheckpoint?.id === checkpoint.id;
              
              return (
                <motion.div
                  key={checkpoint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`relative overflow-hidden bg-primary-800/60 rounded-xl p-4 border cursor-pointer transition-colors duration-200 group ${
                    isActive ? 'border-accent-blue/60 ring-1 ring-accent-blue/30' : 'border-primary-600/40 hover:border-accent-blue/40'
                  }`}
                  onClick={() => handleCheckpointClick(checkpoint)}
                  style={{
                    boxShadow: `
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(147, 197, 253, 0.15)
                    `
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-teal-400 drop-shadow-lg" />
                        <InfoButtonWithPortal description={`${checkpoint.name}: ${checkpoint.description}. Current metrics: ${checkpoint.currentQueue} passengers, ${checkpoint.avgWaitTime} wait time, ${checkpoint.slaCompliance}% SLA compliance.`} />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border shadow-lg ${getStatusColor(checkpoint.status)}`}>
                        {checkpoint.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 className="text-white font-semibold text-sm mb-3 drop-shadow-md group-hover:text-teal-100 transition-colors duration-300">
                      {checkpoint.name}
                    </h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Queue:</span>
                        <span className="text-white font-semibold drop-shadow-sm">
                          {checkpoint.currentQueue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Wait Time:</span>
                        <span className="text-white font-semibold drop-shadow-sm">{checkpoint.avgWaitTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">SLA:</span>
                        <span className={`font-semibold drop-shadow-sm flex items-center ${getStatusTextColor(checkpoint.status)}`}>
                          {checkpoint.slaCompliance}%
                          <TrendArrow trend={checkpoint.performance.trend} />
                        </span>
                      </div>

                      <div className="w-full bg-primary-700/50 rounded-full h-2 shadow-inner overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 shadow-sm relative ${
                            checkpoint.status === 'optimal' ? 'bg-status-neutral' :
                            checkpoint.status === 'congested' ? 'bg-status-warning' :
                            'bg-status-error'
                          }`}
                          style={{ width: `${checkpoint.slaCompliance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Modals */}
        <CheckpointModal />
        <AIAdvisoryModal />
      </div>
    </motion.div>
  );
};

export default PassengerJourney;
