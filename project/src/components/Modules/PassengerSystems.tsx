import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  Server, 
  Database, 
  Wifi, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Brain,
  Zap,
  BarChart3,
  Clock,
  Users,
  Globe,
  Cpu,
  Eye,
  Target,
  Lightbulb
} from "lucide-react";
import InfoButton from "../UI/InfoButton";
import DetailModal from '../UI/DetailModal';
import { useToast } from "../../hooks/useToast";

// Trend Arrow Component for Data Visualization
const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable'; value?: number }> = ({ trend, value }) => {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-green-400 inline ml-1" />;
  } else if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-red-400 inline ml-1" />;
  }
  return <Minus className="w-4 h-4 text-gray-400 inline ml-1" />;
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
        className="text-gray-400 hover:text-white transition-colors p-1"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {showTooltip && createPortal(
        <div
          className="fixed z-[99999] bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>,
        document.body
      )}
    </>
  );
};

interface SystemHealth {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  uptime: number;
  responseTime: number;
  throughput: string;
  lastUpdate: string;
  description: string;
  passengersProcessed: number;
  transactionsCompleted: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  securityLevel: 'High' | 'Medium' | 'Low';
  alerts: Array<{ id: string; severity: 'critical' | 'warning' | 'info'; message: string; time: string }>;
  performance: {
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
}

interface SystemComponent {
  id: string;
  name: string;
  layer: string;
  description: string;
  status: 'operational' | 'warning' | 'critical';
  metrics?: {
    dataFlow?: string;
    apiCalls?: string;
  };
  detailedMetrics: {
    processedItems: number;
    successRate: number;
    avgProcessingTime: number;
    queueLength: number;
    throughputTrend: 'up' | 'down' | 'stable';
    errorCount: number;
    lastMaintenance: string;
  };
}

const PassengerSystems: React.FC = () => {
  const { addToast } = useToast();
  const [selectedSystem, setSelectedSystem] = useState<SystemHealth | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<SystemComponent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showAIAdvisoryModal, setShowAIAdvisoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemRestarting, setSystemRestarting] = useState(false);
  const [backupActive, setBackupActive] = useState(false);
  const [healthCheckActive, setHealthCheckActive] = useState(false);
  const [executedSOPs, setExecutedSOPs] = useState<{[key: string]: boolean}>({});
  const [aiRecommendationExecuted, setAiRecommendationExecuted] = useState(false);

  // Enhanced System Architecture Components
  const systemComponents: SystemComponent[] = [
    { 
      id: 'cupps', 
      name: 'CUPPS', 
      layer: 'processing', 
      description: 'Common Use Passenger Processing System - Centralized check-in and processing', 
      status: 'operational',
      detailedMetrics: {
        processedItems: 3247,
        successRate: 99.2,
        avgProcessingTime: 145,
        queueLength: 12,
        throughputTrend: 'up',
        errorCount: 3,
        lastMaintenance: '2024-08-15'
      }
    },
    { 
      id: 'cuss', 
      name: 'CUSS', 
      layer: 'processing', 
      description: 'Common Use Self Service - Self-service kiosks for passenger check-in', 
      status: 'operational',
      detailedMetrics: {
        processedItems: 2156,
        successRate: 97.8,
        avgProcessingTime: 89,
        queueLength: 8,
        throughputTrend: 'stable',
        errorCount: 7,
        lastMaintenance: '2024-08-18'
      }
    },
    { 
      id: 'pts', 
      name: 'PTS', 
      layer: 'processing', 
      description: 'Passenger Tracking System - Real-time passenger flow monitoring', 
      status: 'warning',
      detailedMetrics: {
        processedItems: 1892,
        successRate: 94.5,
        avgProcessingTime: 234,
        queueLength: 23,
        throughputTrend: 'down',
        errorCount: 15,
        lastMaintenance: '2024-08-10'
      }
    },
    { 
      id: 'bhs', 
      name: 'BHS', 
      layer: 'processing', 
      description: 'Baggage Handling System - Automated baggage processing', 
      status: 'operational',
      detailedMetrics: {
        processedItems: 2847,
        successRate: 98.7,
        avgProcessingTime: 198,
        queueLength: 15,
        throughputTrend: 'up',
        errorCount: 2,
        lastMaintenance: '2024-08-16'
      }
    },
    { 
      id: 'sacs', 
      name: 'SACS', 
      layer: 'security', 
      description: 'Security Access Control System - Access management and control', 
      status: 'operational',
      detailedMetrics: {
        processedItems: 4521,
        successRate: 99.9,
        avgProcessingTime: 76,
        queueLength: 3,
        throughputTrend: 'stable',
        errorCount: 1,
        lastMaintenance: '2024-08-19'
      }
    },
    { 
      id: 'pcds', 
      name: 'PCDS', 
      layer: 'security', 
      description: 'Passport Control Display System - Immigration processing', 
      status: 'critical',
      detailedMetrics: {
        processedItems: 0,
        successRate: 0,
        avgProcessingTime: 0,
        queueLength: 47,
        throughputTrend: 'down',
        errorCount: 23,
        lastMaintenance: '2024-08-05'
      }
    },
    { 
      id: 'dataflow', 
      name: 'Data Flow Rate', 
      layer: 'integration', 
      description: 'Real-time data processing and flow management', 
      status: 'operational', 
      metrics: { dataFlow: '2.4 GB/hr' },
      detailedMetrics: {
        processedItems: 45200,
        successRate: 99.8,
        avgProcessingTime: 12,
        queueLength: 156,
        throughputTrend: 'up',
        errorCount: 5,
        lastMaintenance: '2024-08-17'
      }
    },
    { 
      id: 'apicalls', 
      name: 'API Calls', 
      layer: 'integration', 
      description: 'API gateway and service integration management', 
      status: 'operational', 
      metrics: { apiCalls: '45.2K/min' },
      detailedMetrics: {
        processedItems: 271200,
        successRate: 99.5,
        avgProcessingTime: 25,
        queueLength: 89,
        throughputTrend: 'stable',
        errorCount: 12,
        lastMaintenance: '2024-08-18'
      }
    },
  ];

  // Enhanced Systems with Comprehensive Data
  const systems: SystemHealth[] = [
    {
      id: 'cupps',
      name: 'Common Use Passenger Processing System (CUPPS)',
      status: systemRestarting ? 'warning' : 'online',
      uptime: systemRestarting ? 87.3 : 99.8,
      responseTime: systemRestarting ? 245 : 145,
      throughput: systemRestarting ? '1.8k req/min' : '2.4k req/min',
      lastUpdate: '2 seconds ago',
      description: 'Centralized passenger processing system enabling multiple airlines to use common check-in counters and gates',
      passengersProcessed: 3247,
      transactionsCompleted: 4521,
      errorRate: 0.8,
      cpuUsage: 67,
      memoryUsage: 78,
      diskUsage: 45,
      networkLatency: 23,
      securityLevel: 'High',
      alerts: [
        { id: 'a1', severity: 'warning', message: 'High memory usage detected', time: '5 min ago' },
        { id: 'a2', severity: 'info', message: 'System optimization completed', time: '15 min ago' }
      ],
      performance: { trend: 'up', changePercent: 8.5 }
    },
    {
      id: 'cuss',
      name: 'Common Use Self Service (CUSS)',
      status: backupActive ? 'warning' : 'online',
      uptime: backupActive ? 94.2 : 99.5,
      responseTime: backupActive ? 156 : 89,
      throughput: backupActive ? '1.4k req/min' : '1.8k req/min',
      lastUpdate: '5 seconds ago',
      description: 'Self-service kiosks allowing passengers to check-in, print boarding passes, and manage baggage tags',
      passengersProcessed: 2156,
      transactionsCompleted: 3248,
      errorRate: 2.2,
      cpuUsage: 52,
      memoryUsage: 61,
      diskUsage: 38,
      networkLatency: 18,
      securityLevel: 'High',
      alerts: [
        { id: 'a3', severity: 'info', message: 'Kiosk maintenance scheduled', time: '1 hour ago' }
      ],
      performance: { trend: 'stable', changePercent: 1.2 }
    },
    {
      id: 'pts',
      name: 'Passenger Tracking System (PTS)',
      status: healthCheckActive ? 'online' : 'warning',
      uptime: healthCheckActive ? 99.1 : 97.2,
      responseTime: healthCheckActive ? 156 : 234,
      throughput: healthCheckActive ? '1.1k req/min' : '850 req/min',
      lastUpdate: '12 seconds ago',
      description: 'Real-time passenger flow monitoring and tracking system for security and operational efficiency',
      passengersProcessed: 1892,
      transactionsCompleted: 2456,
      errorRate: 5.5,
      cpuUsage: 84,
      memoryUsage: 89,
      diskUsage: 67,
      networkLatency: 45,
      securityLevel: 'Medium',
      alerts: [
        { id: 'a4', severity: 'warning', message: 'Performance degradation detected', time: '8 min ago' },
        { id: 'a5', severity: 'critical', message: 'Queue length exceeding threshold', time: '12 min ago' }
      ],
      performance: { trend: 'down', changePercent: -12.3 }
    },
    {
      id: 'sacs',
      name: 'Security Access Control System (SACS)',
      status: 'online',
      uptime: 99.9,
      responseTime: 76,
      throughput: '3.2k req/min',
      lastUpdate: '1 second ago',
      description: 'Advanced security access control managing passenger and staff access to restricted areas',
      passengersProcessed: 4521,
      transactionsCompleted: 6847,
      errorRate: 0.1,
      cpuUsage: 34,
      memoryUsage: 42,
      diskUsage: 29,
      networkLatency: 12,
      securityLevel: 'High',
      alerts: [
        { id: 'a6', severity: 'info', message: 'Security scan completed successfully', time: '30 min ago' }
      ],
      performance: { trend: 'stable', changePercent: 0.8 }
    },
    {
      id: 'bhs',
      name: 'Baggage Handling System (BHS)',
      status: 'online',
      uptime: 98.7,
      responseTime: 198,
      throughput: '1.2k req/min',
      lastUpdate: '8 seconds ago',
      description: 'Automated baggage sorting, tracking, and delivery system from check-in to aircraft',
      passengersProcessed: 2847,
      transactionsCompleted: 3921,
      errorRate: 1.3,
      cpuUsage: 58,
      memoryUsage: 65,
      diskUsage: 52,
      networkLatency: 28,
      securityLevel: 'High',
      alerts: [
        { id: 'a7', severity: 'info', message: 'Conveyor belt maintenance completed', time: '2 hours ago' }
      ],
      performance: { trend: 'up', changePercent: 5.7 }
    },
    {
      id: 'pcds',
      name: 'Passport Control Display System (PCDS)',
      status: 'offline',
      uptime: 0,
      responseTime: 0,
      throughput: '0 req/min',
      lastUpdate: '2 minutes ago',
      description: 'Immigration and passport control display system for passenger processing at border control',
      passengersProcessed: 0,
      transactionsCompleted: 0,
      errorRate: 100,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 95,
      networkLatency: 999,
      securityLevel: 'Low',
      alerts: [
        { id: 'a8', severity: 'critical', message: 'System offline - requires immediate attention', time: '2 min ago' },
        { id: 'a9', severity: 'critical', message: 'Connection to immigration database lost', time: '5 min ago' }
      ],
      performance: { trend: 'down', changePercent: -100 }
    }
  ];

  // AI Advisory Data with detailed metrics
  const aiAdvisoryData = {
    apiSuccessRate: aiRecommendationExecuted ? 99.9 : 99.8,
    apiSuccessRateTrend: aiRecommendationExecuted ? 'up' : 'stable' as 'up' | 'down' | 'stable',
    avgResponseTime: aiRecommendationExecuted ? 132 : 145,
    responseTimeTrend: aiRecommendationExecuted ? 'down' : 'stable' as 'up' | 'down' | 'stable',
    activeConnections: aiRecommendationExecuted ? '9.2k' : '8.7k',
    connectionsTrend: aiRecommendationExecuted ? 'up' : 'stable' as 'up' | 'down' | 'stable',
    dataProcessed: aiRecommendationExecuted ? '2.8GB' : '2.4GB',
    dataProcessedTrend: aiRecommendationExecuted ? 'up' : 'stable' as 'up' | 'down' | 'stable',
    cpuUsage: aiRecommendationExecuted ? '58%' : '67%',
    cpuUsageTrend: aiRecommendationExecuted ? 'down' : 'stable' as 'up' | 'down' | 'stable',
    recommendations: [
      'Optimize PTS queue processing algorithms for 15% performance improvement',
      'Scale up CUPPS instances during peak hours (8-11 AM)',
      'Implement proactive maintenance for PCDS system recovery',
      'Deploy ML-based predictive analytics for baggage flow optimization',
      'Enhance security protocols with behavioral analysis integration'
    ]
  };

  // Button handlers
  const handleSystemRestart = () => {
    setSystemRestarting(!systemRestarting);
    addToast({
      type: systemRestarting ? 'info' : 'warning',
      title: systemRestarting ? 'System Restart Cancelled' : 'System Restart Initiated',
      message: systemRestarting ? 
        'System restart procedure cancelled. All systems returning to normal operation.' : 
        'CUPPS system restart initiated. Performance temporarily degraded during restart sequence.',
      duration: 5000
    });

    if (!systemRestarting) {
      setTimeout(() => {
        setSystemRestarting(false);
        addToast({
          type: 'success',
          title: 'System Restart Complete',
          message: 'CUPPS system restart completed successfully. All systems operational.',
          duration: 4000
        });
      }, 15000);
    }
  };

  const handleActivateBackup = () => {
    setBackupActive(!backupActive);
    addToast({
      type: backupActive ? 'info' : 'success',
      title: backupActive ? 'Backup Systems Deactivated' : 'Backup Systems Activated',
      message: backupActive ? 
        'Primary systems restored. Backup systems returned to standby mode.' : 
        'CUSS backup systems activated. Redundant processing enabled for increased reliability.',
      duration: 4000
    });
  };

  const handleHealthCheck = () => {
    setHealthCheckActive(!healthCheckActive);
    addToast({
      type: healthCheckActive ? 'info' : 'success',
      title: healthCheckActive ? 'Health Check Complete' : 'Health Check Started',
      message: healthCheckActive ? 
        'System health check completed. All diagnostics returned to normal monitoring.' : 
        'Comprehensive system health check initiated. PTS performance optimization in progress.',
      duration: 4000
    });

    if (!healthCheckActive) {
      setTimeout(() => {
        setHealthCheckActive(false);
        addToast({
          type: 'success',
          title: 'Health Check Complete',
          message: 'System health check completed. PTS performance optimized successfully.',
          duration: 3000
        });
      }, 12000);
    }
  };

  // AI Advisory Click Handler
  const handleAIAdvisoryClick = () => {
    setShowAIAdvisoryModal(true);
    setActiveTab('overview');
  };

  const handleAIRecommendationExecute = () => {
    setAiRecommendationExecuted(!aiRecommendationExecuted);
    addToast({
      type: aiRecommendationExecuted ? 'info' : 'success',
      title: aiRecommendationExecuted ? 'AI Optimization Disabled' : 'AI Recommendations Executed',
      message: aiRecommendationExecuted ? 
        'AI optimization disabled. Systems returned to baseline performance.' : 
        'AI-powered optimization applied. System performance enhanced across all components.',
      duration: 5000
    });
  };

  const handleSystemClick = (system: SystemHealth) => {
    setSelectedSystem(system);
    setActiveTab('overview');
    setShowModal(true);
  };

  const handleComponentClick = (component: SystemComponent) => {
    setSelectedComponent(component);
    setActiveTab('overview');
    setShowComponentModal(true);
  };

  const handleExecuteSOP = (componentId: string, componentName: string) => {
    setExecutedSOPs(prev => ({
      ...prev,
      [componentId]: true
    }));

    setShowComponentModal(false);
    setSelectedComponent(null);

    addToast({
      type: 'success',
      title: 'SOP Executed Successfully',
      message: `Standard Operating Procedure executed for ${componentName}. System optimization in progress.`,
      duration: 5000
    });

    setTimeout(() => {
      setExecutedSOPs(prev => ({
        ...prev,
        [componentId]: false
      }));
      
      addToast({
        type: 'info',
        title: 'SOP Execution Complete',
        message: `${componentName} optimization completed. System returned to normal monitoring.`,
        duration: 3000
      });
    }, 30000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-lg" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400 drop-shadow-lg" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-400 drop-shadow-lg" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400 drop-shadow-lg" />;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'border-green-500/50 bg-gradient-to-br from-green-500/20 to-green-600/10';
      case 'warning':
        return 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-500/10';
      case 'offline':
        return 'border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10';
      default:
        return 'border-gray-500/50 bg-gradient-to-br from-gray-500/20 to-gray-600/10';
    }
  };

  const getComponentStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'from-green-400 to-green-500';
      case 'warning':
        return 'from-yellow-400 to-yellow-500';
      case 'critical':
        return 'from-red-400 to-red-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  // Component Modal
  const ComponentModal = () => (
    <AnimatePresence>
      {showComponentModal && selectedComponent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
          onClick={() => setShowComponentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-primary-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedComponent.name}</h2>
              <button
                onClick={() => setShowComponentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex space-x-1 mb-6 bg-primary-700/30 p-1 rounded-lg">
              {['overview', 'trends', 'insights', 'actions', 'evidence'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-accent-teal text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-primary-600/50'
                  }`}
                >
                  {tab === 'actions' ? 'Action Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary-700/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Status</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getComponentStatusColor(selectedComponent.status)}`}></div>
                        <span className={`font-medium ${getStatusTextColor(selectedComponent.status)}`}>
                          {selectedComponent.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-primary-700/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Success Rate</h4>
                      <span className="text-white font-medium flex items-center">
                        {selectedComponent.detailedMetrics.successRate}%
                        <TrendArrow trend={selectedComponent.detailedMetrics.successRate > 95 ? 'stable' : 'down'} />
                      </span>
                    </div>
                    <div className="bg-primary-700/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Queue Length</h4>
                      <span className="text-white font-medium flex items-center">
                        {selectedComponent.detailedMetrics.queueLength}
                        <TrendArrow trend={selectedComponent.detailedMetrics.queueLength > 20 ? 'up' : 'stable'} />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/30 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">Primary Actions</h4>
                    <div className="space-y-4">
                      <div className="border-b border-primary-600 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-medium">Execute Optimization SOP</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-accent-teal">Confidence: 99%</span>
                            <span className="text-xs text-green-400">Routine</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          Implement AI-recommended optimization with expected {selectedComponent.status === 'warning' ? '25%' : '8%'} performance improvement
                        </p>
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleExecuteSOP(selectedComponent.id, selectedComponent.name)}
                            disabled={executedSOPs[selectedComponent.id]}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              executedSOPs[selectedComponent.id]
                                ? 'bg-green-600/30 text-green-300 cursor-not-allowed'
                                : 'bg-accent-teal hover:bg-accent-teal/80 text-white'
                            }`}
                          >
                            {executedSOPs[selectedComponent.id] ? '✓ SOP Executed' : 'Execute SOP'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && activeTab !== 'actions' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Content for {activeTab} tab will be displayed here.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // AI Advisory Modal (Similar to other system modals)
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
            className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-primary-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">AI Advisory & Recommendations</h2>
              <button
                onClick={() => setShowAIAdvisoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex space-x-1 mb-6 bg-primary-700/30 p-1 rounded-lg">
              {['overview', 'analytics', 'predictions', 'actions', 'execution'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-accent-teal text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-primary-600/50'
                  }`}
                >
                  {tab === 'actions' ? 'Action Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* AI Status Display */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-primary-700/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Status</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
                        <span className="text-green-400 font-medium">OPERATIONAL</span>
                      </div>
                    </div>
                    <div className="bg-primary-700/30 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Confidence Level</h4>
                      <span className="text-white font-medium">97.5%</span>
                    </div>
                  </div>

                  {/* Key Metrics Grid - NOW 5 COLUMNS */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                      <div className="text-xl font-bold text-green-400 flex items-center">
                        {aiAdvisoryData.apiSuccessRate}%
                        <TrendArrow trend={aiAdvisoryData.apiSuccessRateTrend} />
                      </div>
                      <div className="text-xs text-gray-400">API Success</div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                      <div className="text-xl font-bold text-blue-400 flex items-center">
                        {aiAdvisoryData.avgResponseTime}ms
                        <TrendArrow trend={aiAdvisoryData.responseTimeTrend} />
                      </div>
                      <div className="text-xs text-gray-400">Response Time</div>
                    </div>
                    <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                      <div className="text-xl font-bold text-purple-400 flex items-center">
                        {aiAdvisoryData.activeConnections}
                        <TrendArrow trend={aiAdvisoryData.connectionsTrend} />
                      </div>
                      <div className="text-xs text-gray-400">Connections</div>
                    </div>
                    <div className="bg-teal-500/10 p-4 rounded-lg border border-teal-500/30">
                      <div className="text-xl font-bold text-teal-400 flex items-center">
                        {aiAdvisoryData.dataProcessed}
                        <TrendArrow trend={aiAdvisoryData.dataProcessedTrend} />
                      </div>
                      <div className="text-xs text-gray-400">Data/hr</div>
                    </div>
                    <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                      <div className="text-xl font-bold text-yellow-400 flex items-center">
                        {aiAdvisoryData.cpuUsage}
                        <TrendArrow trend={aiAdvisoryData.cpuUsageTrend} />
                      </div>
                      <div className="text-xs text-gray-400">CPU Usage</div>
                    </div>
                  </div>

                  {/* AI Analysis Summary */}
                  <div className="bg-primary-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Analysis Summary</h4>
                    <p className="text-gray-300">
                      AI-powered analysis of passenger system performance indicates optimal operational efficiency across most components. 
                      PCDS system requires immediate attention. PTS performance can be improved through algorithm optimization.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/30 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">AI Recommendations</h4>
                    
                    <div className="space-y-4">
                      {aiAdvisoryData.recommendations.map((recommendation, index) => (
                        <div key={index} className="border-b border-primary-600 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">Recommendation #{index + 1}</h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-accent-teal">High Priority</span>
                              <span className="text-xs text-green-400">AI Generated</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'execution' && (
                <div className="space-y-6">
                  <div className="bg-primary-700/30 p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">Execute AI Recommendations</h4>
                    
                    <div className="space-y-4">
                      <div className="border-b border-primary-600 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-medium">System-wide AI Optimization</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-accent-teal">Confidence: 97.5%</span>
                            <span className="text-xs text-green-400">Safe</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          Apply AI-powered optimizations across all passenger systems with expected 23% overall performance improvement
                        </p>
                        
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAIRecommendationExecute}
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                              aiRecommendationExecuted
                                ? 'bg-green-600/30 text-green-300'
                                : 'bg-accent-teal hover:bg-accent-teal/80 text-white'
                            }`}
                          >
                            <Zap className="w-5 h-5" />
                            <span>{aiRecommendationExecuted ? '✓ AI Optimization Active' : 'Execute AI Optimization'}</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Execution Status */}
                      {aiRecommendationExecuted && (
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            <div>
                              <h6 className="text-green-300 font-medium">AI Optimization Executed Successfully</h6>
                              <p className="text-green-400/80 text-sm">System performance enhanced across all components</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && activeTab !== 'actions' && activeTab !== 'execution' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-400">AI {activeTab} content will be displayed here.</p>
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
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black"></div>
        <div className="absolute top-1/3 left-1/5 w-80 h-80 bg-gradient-to-r from-purple-600/25 via-blue-600/15 to-teal-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/5 w-96 h-96 bg-gradient-to-r from-green-600/25 via-teal-600/15 to-blue-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/2 w-72 h-72 bg-gradient-to-r from-pink-600/25 via-purple-600/15 to-indigo-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>

      <div className="relative z-10 space-y-6 p-6">
        {/* FULL WIDTH AI Advisory - Now Clickable with 5 KPI Cards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={handleAIAdvisoryClick}
          whileHover={{ 
            scale: 1.01, 
            y: -2,
            boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.4)"
          }}
          whileTap={{ scale: 0.99 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-purple-950/60 to-violet-950/60 rounded-xl p-4 border border-indigo-800/50 backdrop-blur-sm shadow-2xl cursor-pointer transition-all duration-300 group w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-violet-900/30 rounded-xl"></div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-indigo-400 drop-shadow-lg" />
                <h3 className="text-lg font-semibold text-white drop-shadow-md">AI Advisory & Recommendations</h3>
                <InfoButtonWithPortal description="AI-powered analysis providing real-time recommendations for system optimization. Click to view detailed insights and execute recommendations." />
              </div>
            </div>
            
            {/* Compact Metrics Display - NOW 5 COLUMNS */}
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/30">
                <div className="text-xl font-bold text-green-400 flex items-center justify-center">
                  {aiAdvisoryData.apiSuccessRate}%
                  <TrendArrow trend={aiAdvisoryData.apiSuccessRateTrend} />
                </div>
                <div className="text-xs text-gray-400">API Success</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/30">
                <div className="text-xl font-bold text-blue-400 flex items-center justify-center">
                  {aiAdvisoryData.avgResponseTime}ms
                  <TrendArrow trend={aiAdvisoryData.responseTimeTrend} />
                </div>
                <div className="text-xs text-gray-400">Response Time</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/30">
                <div className="text-xl font-bold text-purple-400 flex items-center justify-center">
                  {aiAdvisoryData.activeConnections}
                  <TrendArrow trend={aiAdvisoryData.connectionsTrend} />
                </div>
                <div className="text-xs text-gray-400">Connections</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-teal-500/20 to-teal-600/10 rounded-lg border border-teal-500/30">
                <div className="text-xl font-bold text-teal-400 flex items-center justify-center">
                  {aiAdvisoryData.dataProcessed}
                  <TrendArrow trend={aiAdvisoryData.dataProcessedTrend} />
                </div>
                <div className="text-xs text-gray-400">Data/hr</div>
              </div>
              {/* NEW 5TH KPI CARD - CPU USAGE */}
              <div className="text-center p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg border border-yellow-500/30">
                <div className="text-xl font-bold text-yellow-400 flex items-center justify-center">
                  {aiAdvisoryData.cpuUsage}
                  <TrendArrow trend={aiAdvisoryData.cpuUsageTrend} />
                </div>
                <div className="text-xs text-gray-400">CPU Usage</div>
              </div>
            </div>

            {/* Click to view hint */}
            <div className="mt-3 text-center">
             {/*} <div className="inline-flex items-center space-x-2 text-indigo-300 text-sm bg-indigo-800/30 px-3 py-1 rounded-full border border-indigo-500/50">
                 <Eye className="w-3 h-3" />
                <span>Click to view detailed AI insights and execute recommendations</span>
              </div>*/}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Header - MOVED AFTER AI Advisory */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl shadow-lg backdrop-blur-sm">
              <Server className="w-7 h-7 text-purple-400 drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Passenger Systems</h1>
              <p className="text-gray-400 text-lg">Technical System Monitoring & Integration Health</p>
            </div>
            <InfoButtonWithPortal description="Monitor and manage all passenger processing systems including CUPPS, CUSS, PTS, SACS, BHS, and PCDS. Track system health, performance metrics, and integration status in real-time." />
          </div>
          
          {/* Enhanced Emergency Actions */}
          <div className="flex space-x-3">
            <motion.button 
              onClick={handleSystemRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                systemRestarting 
                  ? 'bg-gradient-to-r from-red-700 via-red-600 to-pink-700 animate-pulse' 
                  : 'bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-700 hover:via-red-600 hover:to-pink-700'
              } text-white hover:shadow-red-500/50`}
            >
              <span>{systemRestarting ? 'Restarting...' : 'System Restart'}</span>
            </motion.button>

            <motion.button 
              onClick={handleActivateBackup}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                backupActive 
                  ? 'bg-gradient-to-r from-orange-700 via-yellow-600 to-amber-700 animate-pulse' 
                  : 'bg-gradient-to-r from-orange-600 via-yellow-500 to-amber-600 hover:from-orange-700 hover:via-yellow-600 hover:to-amber-700'
              } text-white hover:shadow-orange-500/50`}
            >
              <span>{backupActive ? 'Backup Active' : 'Activate Backup'}</span>
            </motion.button>

            <motion.button 
              onClick={handleHealthCheck}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                healthCheckActive 
                  ? 'bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-700 animate-pulse' 
                  : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-700'
              } text-white hover:shadow-blue-500/50`}
            >
              <span>{healthCheckActive ? 'Checking...' : 'Health Check'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* System Health Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-blue-600/5 rounded-xl blur-xl"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((system, index) => (
              <motion.div
                key={system.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden p-6 rounded-xl border cursor-pointer transition-all duration-300 group backdrop-blur-sm shadow-2xl ${getStatusColor(system.status)} hover:scale-105 hover:shadow-2xl`}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
                }}
                onClick={() => handleSystemClick(system)}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(system.status)}
                      <span className="text-sm font-medium text-white uppercase drop-shadow-sm">{system.id}</span>
                      <InfoButtonWithPortal description={`${system.name} - Monitor performance, uptime, and integration status. Click for detailed metrics and controls.`} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      system.status === 'online' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                      system.status === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                      'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                      {system.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-md group-hover:text-teal-100 transition-colors duration-300">{system.name}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white font-medium drop-shadow-sm flex items-center">
                        {system.uptime}%
                        <TrendArrow trend={system.performance.trend} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Response Time</span>
                      <span className="text-white font-medium drop-shadow-sm">{system.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Throughput</span>
                      <span className="text-white font-medium drop-shadow-sm">{system.throughput}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Passengers Processed</span>
                      <span className="text-white font-medium drop-shadow-sm">{system.passengersProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Error Rate</span>
                      <span className={`font-medium drop-shadow-sm ${
                        system.errorRate < 2 ? 'text-green-400' : 
                        system.errorRate < 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{system.errorRate}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-700/50 rounded-full h-2 shadow-inner overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 shadow-sm relative ${
                          system.uptime >= 99 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                          system.uptime >= 95 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${system.uptime}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Architecture Diagram */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-8 border border-gray-600/50 backdrop-blur-sm shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 via-transparent to-blue-600/10 rounded-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <Database className="w-6 h-6 text-teal-400 drop-shadow-lg" />
              <h3 className="text-xl font-semibold text-white drop-shadow-md">System Architecture</h3>
              <InfoButtonWithPortal description="Visual representation of passenger system architecture showing data flow between CUPPS, CUSS, PTS, SACS, BHS, and PCDS components. Click on any component for detailed information and actions." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-teal-400 mb-4 drop-shadow-md">Passenger Processing Layer</h4>
                <div className="space-y-3">
                  {systemComponents.filter(comp => comp.layer === 'processing').map((component) => (
                    <motion.div 
                      key={component.id} 
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-700/30 to-primary-800/30 rounded-lg shadow-lg backdrop-blur-sm cursor-pointer hover:bg-primary-600/40 transition-all duration-300 group border border-primary-600/30"
                      onClick={() => handleComponentClick(component)}
                    >
                      <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{component.name}</span>
                      <div className="flex items-center space-x-2">
                        {executedSOPs[component.id] && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                        <span className={`w-3 h-3 bg-gradient-to-r ${getComponentStatusColor(component.status)} rounded-full animate-pulse shadow-lg`}></span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-blue-400 mb-4 drop-shadow-md">Security & Control Layer</h4>
                <div className="space-y-3">
                  {systemComponents.filter(comp => comp.layer === 'security').map((component) => (
                    <motion.div 
                      key={component.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-700/30 to-primary-800/30 rounded-lg shadow-lg backdrop-blur-sm cursor-pointer hover:bg-primary-600/40 transition-all duration-300 group border border-primary-600/30"
                      onClick={() => handleComponentClick(component)}
                    >
                      <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{component.name}</span>
                      <div className="flex items-center space-x-2">
                        {executedSOPs[component.id] && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                        <span className={`w-3 h-3 bg-gradient-to-r ${getComponentStatusColor(component.status)} rounded-full animate-pulse shadow-lg`}></span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-purple-400 mb-4 drop-shadow-md">Integration Layer</h4>
                <div className="space-y-3">
                  {systemComponents.filter(comp => comp.layer === 'integration').map((component) => (
                    <motion.div 
                      key={component.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="p-4 bg-gradient-to-r from-primary-700/30 to-primary-800/30 rounded-lg text-center shadow-lg backdrop-blur-sm cursor-pointer hover:bg-primary-600/40 transition-all duration-300 group border border-primary-600/30"
                      onClick={() => handleComponentClick(component)}
                    >
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors block mb-1">{component.name.replace(' Rate', '').replace(' Calls', '')}</span>
                      <div className="text-lg font-bold text-white drop-shadow-md group-hover:text-teal-300 transition-colors">
                        {component.metrics?.dataFlow || component.metrics?.apiCalls || 'N/A'}
                      </div>
                      {executedSOPs[component.id] && (
                        <CheckCircle className="w-3 h-3 text-green-400 mx-auto mt-1" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced System Detail Modal */}
        <DetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedSystem?.name || 'System Details'}
          data={{
            Overview: {
              title: selectedSystem?.name || '',
              status: selectedSystem?.status || 'normal',
              currentValue: selectedSystem?.uptime || 0,
              unit: '%',
              lastUpdated: new Date().toISOString(),
              description: selectedSystem?.description || 'System monitoring and performance analytics',
              keyMetrics: [
                { id: '1', name: 'Uptime', value: selectedSystem?.uptime || 0, unit: '%', trend: selectedSystem?.performance.trend || 'stable', changePercent: selectedSystem?.performance.changePercent || 0 },
                { id: '2', name: 'Response Time', value: selectedSystem?.responseTime || 0, unit: 'ms', trend: 'down', changePercent: -5.2 },
                { id: '3', name: 'Throughput', value: parseFloat(selectedSystem?.throughput?.replace(/[^\d.]/g, '') || '0'), unit: 'req/min', trend: 'up', changePercent: 8.4 },
                { id: '4', name: 'Passengers Processed', value: selectedSystem?.passengersProcessed || 0, unit: '', trend: 'up', changePercent: 15.7 },
                { id: '5', name: 'Error Rate', value: selectedSystem?.errorRate || 0, unit: '%', trend: selectedSystem?.errorRate && selectedSystem.errorRate > 5 ? 'up' : 'down', changePercent: -2.1 },
                { id: '6', name: 'CPU Usage', value: selectedSystem?.cpuUsage || 0, unit: '%', trend: 'stable', changePercent: 1.2 },
              ],
              relatedAssets: [
                { id: '1', name: 'Primary Server', type: 'Hardware', status: selectedSystem?.status === 'online' ? 'operational' : 'degraded', location: 'Data Center A' },
                { id: '2', name: 'Backup Server', type: 'Hardware', status: backupActive ? 'active' : 'standby', location: 'Data Center B' },
                { id: '3', name: 'Load Balancer', type: 'Network', status: 'operational', location: 'Edge Network' },
                { id: '4', name: 'Security Module', type: 'Security', status: selectedSystem?.securityLevel === 'High' ? 'operational' : 'warning', location: 'Security Zone' },
              ],
              alerts: selectedSystem?.alerts || []
            }
          }}
        />

        {/* Component Modal with Enhanced Data */}
        <ComponentModal />

        {/* AI Advisory Modal */}
        <AIAdvisoryModal />
      </div>
    </motion.div>
  );
};

export default PassengerSystems;
