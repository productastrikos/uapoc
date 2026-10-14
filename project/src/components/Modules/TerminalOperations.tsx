import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import SimulationLauncher from "../../simulations/SimulationLauncher";
import { 
  Users, MapPin, Clock, TrendingUp, TrendingDown, Minus, Info, Brain, Zap, 
  AlertTriangle, CheckCircle, XCircle, Eye, Target, Activity, X, Camera, 
  Wifi, Shield, Thermometer, Wind, RefreshCw, Settings, Download, Upload, 
  BarChart3, PieChart, Monitor, Database, FileText, Plane, Lightbulb,
  PlayCircle, Pause, FastForward, RotateCcw, Star, Award, Gauge,
  Navigation, Radio, Satellite, Radar, Bell, MessageSquare, Phone,
  ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight, Layers,
  Cpu, HardDrive, Network, Lock, Unlock, Calendar, Timer, UserCheck,
  Globe, Signal, Battery, Zap as Lightning, Sparkles
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, 
  ComposedChart, Bar, Tooltip, Legend, ReferenceLine
} from 'recharts';
import InfoButton from "../UI/InfoButton";
import DetailModal from '../UI/DetailModal';
import { useToast } from "../../hooks/useToast";
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

// Custom debounce hook
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) return;
    
    callback(...args);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay]);
};

// Enhanced InfoButton with Portal
const InfoButtonWithPortal: React.FC<{ description: string }> = ({ description }) => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('terminal');
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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

// Trend Arrow Component
const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable'; value?: number }> = ({ trend, value }) => {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-green-400 inline ml-1" />;
  } else if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-red-400 inline ml-1" />;
  }
  return <Minus className="w-4 h-4 text-gray-400 inline ml-1" />;
};

// Enhanced Terminal Zone Interface
interface TerminalZone {
  id: string;
  name: string;
  area: string;
  currentOccupancy: number;
  maxCapacity: number;
  avgDwellTime: string;
  waitTime: string;
  throughputRate: number;
  temperature: number;
  airQuality: number;
  biometricScanRate: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  coordinates: { x: number; y: number };
  trend: 'up' | 'down' | 'stable';
  aiRecommendations: string[];
  realTimeAlerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    actionable: boolean;
    predictedImpact: string;
    recommendedAction: string;
    estimatedResolutionTime: string;
    potentialCost: string;
  }>;
}

// Mock Data with realistic values
const terminalZones: TerminalZone[] = [
  {
    id: 'security-a',
    name: 'Security Checkpoint Alpha',
    area: 'Departure Hall - International Wing',
    currentOccupancy: 127,
    maxCapacity: 150,
    avgDwellTime: '14.2 min',
    waitTime: '18 min',
    throughputRate: 95,
    temperature: 24.5,
    airQuality: 87,
    biometricScanRate: 94.2,
    alertLevel: 'critical',
    coordinates: { x: 25, y: 35 },
    trend: 'up',
    aiRecommendations: [
      'Deploy 2 additional TSA officers to reduce queue processing time by 35%',
      'Activate Premium/FastTrack lane to handle business class passengers',
      'Implement overflow diversion to Security Checkpoint Beta within 10 minutes'
    ],
    realTimeAlerts: [
      {
        id: 'sec-a-001',
        severity: 'critical',
        message: 'Queue length exceeding SLA threshold - 18min wait time vs 12min target',
        timestamp: '2 min ago',
        actionable: true,
        predictedImpact: 'Flight QR814 (156 pax) may experience boarding delays if not resolved',
        recommendedAction: 'Deploy staff from Security Checkpoint Charlie immediately',
        estimatedResolutionTime: '8-12 minutes',
        potentialCost: '$47,000 per delayed flight'
      }
    ]
  },
  {
    id: 'immigration-intl',
    name: 'Immigration Control Center',
    area: 'International Arrivals - Customs Hall',
    currentOccupancy: 89,
    maxCapacity: 120,
    avgDwellTime: '8.3 min',
    waitTime: '5 min',
    throughputRate: 240,
    temperature: 23.8,
    airQuality: 92,
    biometricScanRate: 98.7,
    alertLevel: 'normal',
    coordinates: { x: 65, y: 55 },
    trend: 'stable',
    aiRecommendations: [
      'Optimal performance maintained - biometric systems exceeding 98% accuracy',
      'Consider consolidating to 6 booths during off-peak hours (2:00-4:00 AM)',
      'Preventive maintenance window available for Booth #4 at 03:30 AM'
    ],
    realTimeAlerts: []
  },
  {
    id: 'retail-concourse',
    name: 'Duty-Free & Retail Concourse',
    area: 'Departure Lounge - Central Plaza',
    currentOccupancy: 312,
    maxCapacity: 400,
    avgDwellTime: '42.1 min',
    waitTime: '0 min',
    throughputRate: 520,
    temperature: 25.2,
    airQuality: 89,
    biometricScanRate: 0,
    alertLevel: 'normal',
    coordinates: { x: 45, y: 25 },
    trend: 'up',
    aiRecommendations: [
      'High passenger dwell time indicates optimal retail engagement - revenue opportunity',
      'Deploy targeted promotions for delayed QR814 passengers (156 pax, 45min delay)',
      'Activate additional seating near Gates 12-15 for passenger comfort during peak'
    ],
    realTimeAlerts: []
  },
  
  {
    id: 'baggage-claim',
    name: 'Baggage Reclaim Center',
    area: 'Arrivals Hall - Carousels 1-4',
    currentOccupancy: 156,
    maxCapacity: 200,
    avgDwellTime: '16.8 min',
    waitTime: '8 min',
    throughputRate: 180,
    temperature: 23.5,
    airQuality: 85,
    biometricScanRate: 0,
    alertLevel: 'warning',
    coordinates: { x: 85, y: 75 },
    trend: 'down',
    aiRecommendations: [
      'Carousel #3 belt speed optimization required - 25% below normal throughput',
      'QR456 (Mumbai-Doha) passengers experiencing extended wait - investigate BHS',
      'Deploy additional customer service staff with ETA information updates'
    ],
    realTimeAlerts: [
      {
        id: 'bag-001',
        severity: 'high',
        message: 'Carousel #3 baggage delivery rate 25% below SLA - affecting 180 passengers',
        timestamp: '7 min ago',
        actionable: true,
        predictedImpact: 'Customer satisfaction impact for QR456 passengers',
        recommendedAction: 'Coordinate with ground handling for expedited bag delivery',
        estimatedResolutionTime: '10-15 minutes',
        potentialCost: '$12,000 in compensation claims'
      }
    ]
  }
];

// Enhanced AI Advisory Data with Strategic Insights
const aiAdvisoryData = {
  overallEfficiency: 89.2,
  efficiencyTrend: 'up' as 'up' | 'down' | 'stable',
  avgJourneyTime: '78 min',
  journeyTimeTrend: 'stable' as 'up' | 'down' | 'stable',
  activePassengers: '1,247',
  passengersTrend: 'up' as 'up' | 'down' | 'stable',
  criticalAlerts: '3',
  alertsTrend: 'down' as 'up' | 'down' | 'stable',
  biometricSuccess: '96.8%',
  biometricTrend: 'up' as 'up' | 'down' | 'stable',
  strategicInsights: [
    {
      id: 'long-term-1',
      category: 'Infrastructure Optimization',
      title: 'Terminal Capacity Expansion Planning',
      description: 'Based on 12-month passenger flow analysis, Security Checkpoint Alpha consistently operates at >85% capacity during peak hours. Recommend infrastructure expansion or additional checkpoint deployment.',
      impact: 'High',
      timeframe: '6-12 months',
      investmentRequired: '$2.4M - $3.8M',
      expectedROI: '285% over 5 years',
      keyMetrics: ['Reduce avg wait time by 45%', 'Increase throughput by 60%', 'Improve passenger satisfaction by 23%'],
      actionItems: [
        'Conduct detailed architectural assessment for expansion feasibility',
        'Secure budget approval for Q2 2026 implementation',
        'Coordinate with TSA for additional security equipment procurement',
        'Plan phased rollout to minimize operational disruption'
      ]
    },
    {
      id: 'long-term-2',
      category: 'Technology Integration',
      title: 'Biometric Processing Enhancement',
      description: 'Current biometric success rate of 96.8% can be improved to >99.2% through advanced facial recognition and iris scanning technology integration.',
      impact: 'Medium',
      timeframe: '3-6 months',
      investmentRequired: '$850K - $1.2M',
      expectedROI: '165% over 3 years',
      keyMetrics: ['Reduce processing time by 35%', 'Increase accuracy to 99.2%', 'Decrease manual interventions by 78%'],
      actionItems: [
        'Evaluate next-generation biometric technology vendors',
        'Pilot program implementation at Immigration Control Center',
        'Staff training program for new biometric systems',
        'Integration with existing passenger management systems'
      ]
    },
    {
      id: 'long-term-3',
      category: 'Operational Excellence',
      title: 'AI-Driven Staff Optimization',
      description: 'Implement machine learning algorithms for predictive staff scheduling based on flight schedules, seasonal patterns, and real-time passenger flow data.',
      impact: 'High',
      timeframe: '2-4 months',
      investmentRequired: '$450K - $650K',
      expectedROI: '320% over 2 years',
      keyMetrics: ['Reduce staffing costs by 18%', 'Improve SLA compliance to 97%', 'Decrease overtime expenses by 42%'],
      actionItems: [
        'Deploy advanced workforce analytics platform',
        'Integrate with existing HR and scheduling systems',
        'Create predictive models for passenger flow patterns',
        'Establish automated alert system for staffing adjustments'
      ]
    }
  ],
  predictiveInsights: [
    {
      title: 'Imminent Bottleneck Prediction',
      description: 'Security Checkpoint Alpha will reach critical capacity (150 pax) in next 12 minutes based on current arrival rate of 2.3 passengers/minute',
      confidence: 94,
      impact: 'High',
      timeframe: '12 minutes',
      affectedFlights: ['QR814', 'QR902', 'QR156'],
      recommendedActions: ['Deploy 2 additional officers', 'Activate FastTrack lane', 'Divert to Checkpoint Beta']
    },
    {
      title: 'Cascade Delay Risk Analysis',
      description: 'QR814 boarding delay will cascade to 6 subsequent departures (QR902, EK411, TK701, MS987, AI131, 9W501) if not resolved within 15 minutes',
      confidence: 89,
      impact: 'Critical',
      timeframe: '15 minutes',
      affectedFlights: ['QR902', 'EK411', 'TK701', 'MS987', 'AI131', '9W501'],
      recommendedActions: ['Priority boarding protocol', 'Additional ground crew', 'Gate reassignment if needed']
    }
  ],
  emergencyProtocols: [
    {
      protocol: 'IMMEDIATE-SEC-001',
      title: 'Security Checkpoint Critical Overload',
      description: 'Deploy 2 additional TSA officers to Security Checkpoint Alpha within 5 minutes',
      triggerConditions: 'Wait time >15min AND occupancy >90%',
      estimatedImpact: '35% reduction in processing time',
      executionTime: '3-5 minutes',
      cost: '$180/hour additional staffing'
    },
    {
      protocol: 'URGENT-GATE-002', 
      title: 'Boarding Delay Cascade Prevention',
      description: 'Activate priority boarding protocol for wide-body aircraft (A350/B777/A380)',
      triggerConditions: 'Boarding delay >10min AND downstream flights <30min',
      estimatedImpact: 'Prevents cascade delays affecting 6+ flights',
      executionTime: '8-12 minutes',
      cost: '$89,000 avoided delay costs'
    }
  ]
};

// Enhanced Flow Data
const passengerFlowData = [
  { time: '00:00', security: 23, immigration: 12, retail: 45, gates: 34, baggage: 18, efficiency: 95, incidents: 0 },
  { time: '02:00', security: 12, immigration: 8, retail: 21, gates: 15, baggage: 9, efficiency: 98, incidents: 0 },
  { time: '04:00', security: 45, immigration: 28, retail: 67, gates: 56, baggage: 32, efficiency: 89, incidents: 0 },
  { time: '06:00', security: 89, immigration: 67, retail: 156, gates: 123, baggage: 67, efficiency: 82, incidents: 1 },
  { time: '08:00', security: 127, immigration: 89, retail: 234, gates: 189, baggage: 78, efficiency: 76, incidents: 2 },
  { time: '10:00', security: 98, immigration: 72, retail: 198, gates: 156, baggage: 89, efficiency: 84, incidents: 1 },
  { time: '12:00', security: 156, immigration: 95, retail: 312, gates: 234, baggage: 123, efficiency: 82, incidents: 1 },
  { time: '14:00', security: 134, immigration: 78, retail: 298, gates: 221, baggage: 156, efficiency: 88, incidents: 0 },
  { time: '16:00', security: 167, immigration: 123, retail: 345, gates: 267, baggage: 134, efficiency: 79, incidents: 2 },
  { time: '18:00', security: 189, immigration: 134, retail: 398, gates: 312, baggage: 167, efficiency: 75, incidents: 3 },
  { time: '20:00', security: 98, immigration: 67, retail: 178, gates: 145, baggage: 89, efficiency: 91, incidents: 0 },
  { time: '22:00', security: 56, immigration: 34, retail: 89, gates: 67, baggage: 45, efficiency: 94, incidents: 0 }
];

// FIXED: Reduced Congestion Data (removed 3-4 items to match graph size)
const congestionHeatmapData = [
  
  { zone: 'Immigration', congestion: 35, temperature: 'normal',  alerts: 0, throughput: 240 },
  { zone: 'Retail Plaza', congestion: 60, temperature: 'warm', alerts: 0, throughput: 520 },
  { zone: 'Gates 8-12', congestion: 75, temperature: 'hot', alerts: 1, throughput: 145 }
];

const TerminalOperations: React.FC = () => {
  const { addToast } = useToast();
  
  // State management
  const [selectedZone, setSelectedZone] = useState<TerminalZone | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showAIAdvisoryModal, setShowAIAdvisoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Debounced handlers
  const handleZoneClick = useDebounce(useCallback((zone: TerminalZone) => {
    if (!showZoneModal) {
      setSelectedZone(zone);
      setActiveTab('overview');
      setShowZoneModal(true);
    }
  }, [showZoneModal]), 300);

  const handleAIAdvisoryClick = useDebounce(useCallback(() => {
    if (!showAIAdvisoryModal) {
      setShowAIAdvisoryModal(true);
      setActiveTab('predictions');
    }
  }, [showAIAdvisoryModal]), 300);

  // Close handlers
  const handleCloseZoneModal = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowZoneModal(false);
    setTimeout(() => setSelectedZone(null), 200);
  }, []);

  const handleCloseAIModal = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowAIAdvisoryModal(false);
  }, []);

  const handleModalContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Simulate live data updates
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    let dataInterval: NodeJS.Timeout;
    if (liveDataEnabled) {
      dataInterval = setInterval(() => {
        terminalZones.forEach(zone => {
          const fluctuation = Math.floor(Math.random() * 6) - 3;
          zone.currentOccupancy = Math.max(0, Math.min(zone.maxCapacity, zone.currentOccupancy + fluctuation));
        });
      }, 10000);
    }

    return () => {
      clearInterval(timeInterval);
      if (dataInterval) clearInterval(dataInterval);
    };
  }, [liveDataEnabled]);

  const handleExecuteAction = useCallback((alertId: string, actionType: string) => {
    addToast({
      type: 'success',
      title: 'AI Action Executed',
      message: `Successfully executed ${actionType} for alert ${alertId}`,
      duration: 3000
    });
    
    if (selectedZone) {
      selectedZone.realTimeAlerts = selectedZone.realTimeAlerts.filter(alert => alert.id !== alertId);
    }
  }, [selectedZone, addToast]);

  const handleExecuteStrategicAction = useCallback((insightId: string, actionItem: string) => {
    addToast({
      type: 'success',
      title: 'Strategic Action Initiated',
      message: `Initiated: ${actionItem.substring(0, 50)}...`,
      duration: 4000
    });
  }, [addToast]);

  const handleExecuteProtocol = useCallback((protocolId: string, protocolTitle: string) => {
    addToast({
      type: 'success',
      title: 'Emergency Protocol Activated',
      message: `Executing: ${protocolTitle}`,
      duration: 5000
    });
  }, [addToast]);

  const getZoneStatusColor = useCallback((alertLevel: string, occupancyRate: number) => {
    if (alertLevel === 'critical') return 'bg-red-500/30 border-red-500/50';
    if (alertLevel === 'warning') return 'bg-yellow-500/30 border-yellow-500/50';
    if (occupancyRate > 0.8) return 'bg-orange-500/30 border-orange-500/50';
    return 'bg-green-500/30 border-green-500/50';
  }, []);

  const getOccupancyRate = useCallback((zone: TerminalZone) => {
    return (zone.currentOccupancy / zone.maxCapacity) * 100;
  }, []);

  // COMPLETE AI Advisory Modal with Strategic Insights
  const AIAdvisoryModal = () => (
    <AnimatePresence mode="wait" initial={false}>
      {showAIAdvisoryModal && (
        <motion.div
          key="ai-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9998] backdrop-blur-sm"
          onClick={handleCloseAIModal}
        >
          <motion.div
            key="ai-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-primary-800/95 to-primary-900/95 rounded-2xl p-8 w-full max-w-7xl max-h-[95vh] overflow-hidden border border-primary-600/50 shadow-2xl backdrop-blur-lg"
            onClick={handleModalContentClick}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl backdrop-blur-sm">
                  <Brain className="w-8 h-8 text-blue-400 drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">AI Terminal Intelligence Center</h2>
                  <p className="text-gray-400 text-lg">Predictive Analytics & Autonomous Response Protocol</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Live Data Stream</div>
                  <div className="text-lg text-green-400 font-mono">{currentTime.toLocaleTimeString()}</div>
                </div>
                <button
                  onClick={handleCloseAIModal}
                  className="text-gray-400 hover:text-white transition-colors p-3 rounded-xl hover:bg-white/10 backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-primary-700/20 p-1 rounded-xl backdrop-blur-sm border border-primary-600/30">
              {[
                { id: 'predictions', icon: Brain, label: 'AI Predictions' },
                { id: 'protocols', icon: Shield, label: 'Emergency Protocols' },
                { id: 'analytics', icon: BarChart3, label: 'Advanced Analytics' },
                { id: 'simulation', icon: PlayCircle, label: 'Scenario Simulation' },
                { id: 'insights', icon: Lightbulb, label: 'Strategic Insights' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-primary-600/50'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Enhanced Content Area */}
            <div className="h-[60vh] overflow-y-auto pr-4 space-y-6">
              {activeTab === 'predictions' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {aiAdvisoryData.predictiveInsights.map((insight, index) => (
                      <motion.div 
                        key={`insight-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              insight.impact === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              insight.impact === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              <Brain className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">{insight.title}</h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  insight.impact === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                  insight.impact === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                  'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                }`}>
                                  {insight.impact} Impact
                                </span>
                                <span className="text-xs text-gray-400 flex items-center">
                                  <Timer className="w-3 h-3 mr-1" />
                                  {insight.timeframe}
                                </span>
                                <span className="text-xs text-green-400 flex items-center">
                                  <Target className="w-3 h-3 mr-1" />
                                  {insight.confidence}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">{insight.description}</p>
                        
                        {insight.affectedFlights.length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-xs font-medium text-yellow-400 mb-2 flex items-center">
                              <Plane className="w-3 h-3 mr-1" />
                              AFFECTED FLIGHTS
                            </h6>
                            <div className="flex flex-wrap gap-2">
                              {insight.affectedFlights.map((flight, idx) => (
                                <span key={`flight-${idx}`} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs font-mono border border-yellow-500/30">
                                  {flight}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <h6 className="text-xs font-medium text-blue-400 mb-2 flex items-center">
                            <Lightning className="w-3 h-3 mr-1" />
                            AI RECOMMENDED ACTIONS
                          </h6>
                          {insight.recommendedActions.map((action, idx) => (
                            <div key={`action-${idx}`} className="flex items-center justify-between bg-primary-600/20 p-3 rounded-lg border border-primary-500/30">
                              <span className="text-sm text-gray-300">{action}</span>
                              <button 
                                onClick={() => handleExecuteProtocol(`pred-${index}-${idx}`, action)}
                                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center space-x-1"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Execute</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'protocols' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-6 rounded-xl border border-red-500/30 backdrop-blur-sm">
                    <h4 className="text-xl font-semibold text-white mb-2 flex items-center">
                      <Shield className="w-6 h-6 mr-2 text-red-400" />
                      Emergency Response Protocols
                    </h4>
                    <p className="text-gray-300 text-sm">Automated protocols ready for immediate deployment based on current operational conditions</p>
                  </div>
                  
                  <div className="grid gap-6">
                    {aiAdvisoryData.emergencyProtocols.map((protocol, index) => (
                      <motion.div 
                        key={`protocol-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              protocol.protocol.startsWith('IMMEDIATE') ? 'bg-red-500/20 text-red-400' :
                              protocol.protocol.startsWith('URGENT') ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs text-gray-400 font-mono">{protocol.protocol}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  protocol.protocol.startsWith('IMMEDIATE') ? 'bg-red-600 text-white' :
                                  protocol.protocol.startsWith('URGENT') ? 'bg-orange-600 text-white' :
                                  'bg-blue-600 text-white'
                                }`}>
                                  {protocol.protocol.split('-')[0]}
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold text-white">{protocol.title}</h4>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleExecuteProtocol(protocol.protocol, protocol.title)}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm transition-colors flex items-center space-x-2 shadow-lg"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>EXECUTE</span>
                          </button>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4">{protocol.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-primary-600/20 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">TRIGGER CONDITIONS</div>
                            <div className="text-sm text-white">{protocol.triggerConditions}</div>
                          </div>
                          <div className="bg-primary-600/20 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">EXECUTION TIME</div>
                            <div className="text-sm text-white">{protocol.executionTime}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-400">Expected Impact: </span>
                            <span className="text-green-400">{protocol.estimatedImpact}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">Cost: </span>
                            <span className="text-yellow-400">{protocol.cost}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Congestion Heatmap */}
                    <div className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Radar className="w-5 h-5 mr-2 text-purple-400" />
                        Real-time Congestion Analysis
                      </h4>
                      <div className="space-y-3">
                        {congestionHeatmapData.map((zone, index) => (
                          <div key={`congestion-${index}`} className="flex items-center justify-between p-3 bg-primary-600/20 rounded-lg">
                            <span className="text-sm text-white font-medium">{zone.zone}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-20 h-3 bg-primary-700 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${zone.congestion}%` }}
                                  transition={{ delay: index * 0.1, duration: 1 }}
                                  className={`h-full rounded-full ${
                                    zone.temperature === 'critical' ? 'bg-red-500' :
                                    zone.temperature === 'hot' ? 'bg-orange-500' :
                                    zone.temperature === 'warm' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-8 text-right">{zone.congestion}%</span>
                              <div className="text-xs text-gray-500">{zone.throughput}/hr</div>
                              {zone.alerts > 0 && (
                                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">{zone.alerts}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Gauge className="w-5 h-5 mr-2 text-blue-400" />
                        Performance Dashboard
                      </h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Overall Terminal Efficiency', value: 89, color: 'green' },
                          { label: 'Passenger Satisfaction Score', value: 94, color: 'blue' },
                          { label: 'SLA Compliance Rate', value: 76, color: 'yellow' },
                          { label: 'Resource Utilization', value: 82, color: 'purple' }
                        ].map((metric, index) => (
                          <div key={`metric-${index}`} className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">{metric.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-primary-600 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${metric.value}%` }}
                                  transition={{ delay: index * 0.2, duration: 1 }}
                                  className={`h-full rounded-full ${
                                    metric.color === 'green' ? 'bg-green-400' :
                                    metric.color === 'blue' ? 'bg-blue-400' :
                                    metric.color === 'yellow' ? 'bg-yellow-400' :
                                    'bg-purple-400'
                                  }`}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${
                                metric.color === 'green' ? 'text-green-400' :
                                metric.color === 'blue' ? 'text-blue-400' :
                                metric.color === 'yellow' ? 'text-yellow-400' :
                                'text-purple-400'
                              }`}>
                                {metric.value}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Chart */}
                  <div className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-teal-400" />
                      24-Hour Advanced Flow Analytics
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={passengerFlowData}>
                          <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                          <YAxis stroke="#8A9BA8" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="security" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="immigration" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="retail" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                          <Line type="monotone" dataKey="efficiency" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 4 }} />
                          <Bar dataKey="incidents" fill="#DC2626" opacity={0.8} />
                          <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'simulation' && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl mb-6">
                    <PlayCircle className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Advanced Scenario Simulation</h3>
                  <p className="text-gray-400 text-lg mb-8">
                    Real-time scenario simulation and predictive modeling capabilities available in full deployment
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {[
                      'AI-Powered Forecasting',
                      'Multi-Variable Analysis', 
                      'Automated Optimization',
                      'Risk Assessment',
                      'Resource Planning',
                      'Performance Benchmarking'
                    ].map((feature, index) => (
                      <div key={`sim-feature-${index}`} className="p-4 bg-primary-700/20 rounded-lg border border-primary-600/30">
                        <div className="text-sm text-gray-300">{feature}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                    <h4 className="text-xl font-semibold text-white mb-2 flex items-center">
                      <Lightbulb className="w-6 h-6 mr-2 text-purple-400" />
                      Strategic Long-Term Insights
                    </h4>
                    <p className="text-gray-300 text-sm">AI-generated strategic recommendations for operational excellence and infrastructure optimization</p>
                  </div>
                  
                  <div className="space-y-6">
                    {aiAdvisoryData.strategicInsights.map((insight, index) => (
                      <motion.div 
                        key={`strategic-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15, duration: 0.4 }}
                        className="bg-gradient-to-br from-primary-700/40 to-primary-800/40 p-6 rounded-xl border border-primary-600/40 backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-xl ${
                              insight.impact === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              <Target className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs text-purple-400 font-medium bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">
                                  {insight.category}
                                </span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  insight.impact === 'High' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                  {insight.impact} Impact
                                </span>
                              </div>
                              <h4 className="text-xl font-semibold text-white">{insight.title}</h4>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-400 flex items-center">
                                  <Timer className="w-4 h-4 mr-1" />
                                  {insight.timeframe}
                                </span>
                                <span className="text-sm text-green-400 flex items-center">
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  {insight.expectedROI}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">{insight.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-primary-600/20 p-4 rounded-lg border border-primary-500/30">
                            <h6 className="text-sm font-medium text-blue-400 mb-3">FINANCIAL IMPACT</h6>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Investment Required:</span>
                                <span className="text-xs text-white font-semibold">{insight.investmentRequired}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Expected ROI:</span>
                                <span className="text-xs text-green-400 font-semibold">{insight.expectedROI}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-primary-600/20 p-4 rounded-lg border border-primary-500/30">
                            <h6 className="text-sm font-medium text-green-400 mb-3">KEY PERFORMANCE METRICS</h6>
                            <div className="space-y-1">
                              {insight.keyMetrics.map((metric, idx) => (
                                <div key={idx} className="text-xs text-gray-300 flex items-center">
                                  <CheckCircle className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                                  {metric}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h6 className="text-sm font-medium text-yellow-400 mb-3 flex items-center">
                            <Lightning className="w-4 h-4 mr-1" />
                            STRATEGIC ACTION ITEMS
                          </h6>
                          {insight.actionItems.map((actionItem, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-primary-600/20 p-4 rounded-lg border border-primary-500/30">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-blue-400 font-semibold">{idx + 1}</span>
                                </div>
                                <span className="text-sm text-gray-300">{actionItem}</span>
                              </div>
                              <button 
                                onClick={() => handleExecuteStrategicAction(insight.id, actionItem)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Initiate</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Zone Modal
  const ZoneModal = () => (
    <AnimatePresence mode="wait" initial={false}>
      {showZoneModal && selectedZone && (
        <motion.div
          key="zone-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
          onClick={handleCloseZoneModal}
        >
          <motion.div
            key="zone-modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden border border-primary-600 shadow-2xl"
            onClick={handleModalContentClick}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedZone.name}</h2>
              <button
                onClick={handleCloseZoneModal}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="h-96 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-4 rounded-lg backdrop-blur-sm border border-primary-600/30">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-teal-400" />
                    Live Alerts & Predictive Actions
                  </h4>
                  <div className="space-y-3">
                    {selectedZone.realTimeAlerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                        alert.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                        alert.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-600 text-white' :
                            alert.severity === 'high' ? 'bg-orange-600 text-white' :
                            alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{alert.timestamp}</span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-primary-600/20 p-3 rounded-lg">
                            <h6 className="text-xs font-medium text-yellow-400 mb-1">PREDICTED IMPACT</h6>
                            <p className="text-xs text-gray-300">{alert.predictedImpact}</p>
                          </div>
                          <div className="bg-primary-600/20 p-3 rounded-lg">
                            <h6 className="text-xs font-medium text-blue-400 mb-1">AI RECOMMENDED ACTION</h6>
                            <p className="text-xs text-gray-300">{alert.recommendedAction}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>Est. Resolution: {alert.estimatedResolutionTime}</span>
                          <span>Potential Cost: {alert.potentialCost}</span>
                        </div>
                        
                        {alert.actionable && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleExecuteAction(alert.id, 'resolve')}
                              className="px-3 py-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded text-xs hover:from-teal-700 hover:to-teal-800 transition-colors"
                            >
                              Execute AI Action
                            </button>
                            <button 
                              onClick={() => handleExecuteAction(alert.id, 'acknowledge')}
                              className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded text-xs hover:from-gray-700 hover:to-gray-800 transition-colors"
                            >
                              Acknowledge Alert
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedZone.realTimeAlerts.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-gray-400">No active alerts - optimal performance maintained</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen"
      >
        {/* Enhanced Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black"></div>
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/25 via-teal-600/15 to-cyan-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/25 via-indigo-600/15 to-blue-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-r from-teal-600/25 via-cyan-600/15 to-blue-600/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '6s'}}></div>
        </div>

        {/* Container with proper spacing */}
        <div className="relative z-10 w-full px-4 md:px-6 py-6 space-y-6">
          {/* Enhanced Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/30 to-cyan-600/20 rounded-xl shadow-lg backdrop-blur-sm">
                <Users className="w-7 h-7 text-cyan-400 drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Terminal Operations Command Center</h1>
                <p className="text-gray-400 text-lg">AI-Enhanced Passenger Flow & Predictive Management</p>
              </div>
              <InfoButtonWithPortal description="Advanced terminal operations monitoring with AI-powered predictions, real-time passenger flow optimization, and automated response protocols for operational excellence." />
            </div>
            
            <div className="flex space-x-3">
              <SimulationLauncher simulationId="baggage" label="Baggage Simulation" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLiveDataEnabled(!liveDataEnabled)}
                className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                  liveDataEnabled 
                    ? 'bg-gradient-to-r from-green-600 via-green-500 to-teal-600' 
                    : 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
                } text-white hover:shadow-green-500/50`}
              >
                <span>{liveDataEnabled ? 'Live Data: ACTIVE' : 'Live Data: PAUSED'}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* AI Advisory Full Width */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleAIAdvisoryClick}
            whileHover={{ 
              scale: 1.01, 
              y: -2,
              boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
            }}
            whileTap={{ scale: 0.99 }}
            className="w-full relative overflow-hidden bg-gradient-to-br from-blue-950/60 via-indigo-950/60 to-cyan-950/60 rounded-xl p-6 border border-blue-800/50 backdrop-blur-sm shadow-2xl cursor-pointer transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-cyan-900/30 rounded-xl"></div>
            
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-blue-400 drop-shadow-lg" />
                  <h3 className="text-xl font-semibold text-white drop-shadow-md">AI Terminal Intelligence Center</h3>
                  <InfoButtonWithPortal description="AI-powered predictive analysis with actionable recommendations for optimizing terminal operations and preventing bottlenecks before they occur." />
                </div>
                {/*} <div className="flex items-center space-x-2 text-blue-300 text-sm bg-blue-800/30 px-4 py-2 rounded-full border border-blue-500/50">
                  <Eye className="w-4 h-4" />
                  <span>Click for Advanced AI Analytics & Protocols</span>
                </div>*/}
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400 flex items-center justify-center">
                    {aiAdvisoryData.overallEfficiency}%
                    <TrendArrow trend={aiAdvisoryData.efficiencyTrend} />
                  </div>
                  <div className="text-xs text-gray-400">Terminal Efficiency</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400 flex items-center justify-center">
                    {aiAdvisoryData.avgJourneyTime}
                    <TrendArrow trend={aiAdvisoryData.journeyTimeTrend} />
                  </div>
                  <div className="text-xs text-gray-400">Average Journey</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400 flex items-center justify-center">
                    {aiAdvisoryData.activePassengers}
                    <TrendArrow trend={aiAdvisoryData.passengersTrend} />
                  </div>
                  <div className="text-xs text-gray-400">Active Passengers</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center">
                    {aiAdvisoryData.criticalAlerts}
                    <TrendArrow trend={aiAdvisoryData.alertsTrend} />
                  </div>
                  <div className="text-xs text-gray-400">Critical Alerts</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-500/20 to-teal-600/10 rounded-lg border border-teal-500/30">
                  <div className="text-2xl font-bold text-teal-400 flex items-center justify-center">
                    {aiAdvisoryData.biometricSuccess}
                    <TrendArrow trend={aiAdvisoryData.biometricTrend} />
                  </div>
                  <div className="text-xs text-gray-400">Biometric Success</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal AI recommendations — queue forecasting, bag-connection risk
              and BHS escalation, each with its evidence attached. */}
          <AiInsightPanel domain="terminal" />

          {/* Map (70%) and Quick Actions (30%) Side by Side */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full grid grid-cols-10 gap-6"
          >
            {/* Real-time Terminal Map - 70% */}
            <div className="col-span-7 relative overflow-hidden bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-600 backdrop-blur-sm shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 via-transparent to-blue-600/10 rounded-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6 text-teal-400 drop-shadow-lg" />
                    <h3 className="text-xl font-bold text-white drop-shadow-md">Real-time Terminal Operations Map</h3>
                    <InfoButtonWithPortal description="Interactive terminal visualization showing real-time passenger density, operational status, and AI-predicted bottlenecks across all processing zones." />
                  </div>
                  <div className="flex space-x-2">
                    <span className="flex items-center space-x-1 text-sm text-gray-400">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Optimal</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sm text-gray-400">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Warning</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sm text-gray-400">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Critical</span>
                    </span>
                  </div>
                </div>

                {/* Interactive Terminal Map */}
                <div className="relative h-96 bg-primary-900/50 rounded-lg overflow-hidden border border-primary-700/50 backdrop-blur-sm">
                  <div className="absolute inset-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-800/30 to-primary-900/30 rounded-lg">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <rect x="10" y="10" width="80" height="80" fill="none" stroke="#334155" strokeWidth="0.5" />
                        <line x1="10" y1="30" x2="90" y2="30" stroke="#334155" strokeWidth="0.3" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="0.3" />
                        <line x1="10" y1="70" x2="90" y2="70" stroke="#334155" strokeWidth="0.3" />
                        <line x1="30" y1="10" x2="30" y2="90" stroke="#334155" strokeWidth="0.3" />
                        <line x1="70" y1="10" x2="70" y2="90" stroke="#334155" strokeWidth="0.3" />
                      </svg>
                    </div>

                    {/* Dynamic Zone Markers */}
                    {terminalZones.map((zone, index) => {
                      const occupancyRate = getOccupancyRate(zone);
                      const pulseIntensity = zone.alertLevel === 'critical' ? 'animate-pulse' : 
                                           zone.alertLevel === 'warning' ? 'animate-pulse' : '';
                      
                      return (
                        <motion.div
                          key={zone.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.2 }}
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          className={`absolute cursor-pointer group ${pulseIntensity}`}
                          style={{ 
                            left: `${zone.coordinates.x}%`, 
                            top: `${zone.coordinates.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onClick={() => handleZoneClick(zone)}
                        >
                          <div className={`relative w-16 h-16 rounded-full border-2 transition-all duration-300 group-hover:scale-110 ${getZoneStatusColor(zone.alertLevel, occupancyRate / 100)} backdrop-blur-sm`}>
                            <div 
                              className={`absolute inset-2 rounded-full transition-all duration-500 ${
                                zone.alertLevel === 'critical' ? 'bg-red-400/60' :
                                zone.alertLevel === 'warning' ? 'bg-yellow-400/60' :
                                'bg-green-400/60'
                              }`}
                              style={{ 
                                transform: `scale(${Math.max(0.3, occupancyRate / 100)})`
                              }}
                            />
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                              {zone.id.includes('security') && <Shield className="w-6 h-6 text-white drop-shadow-lg" />}
                              {zone.id.includes('immigration') && <Camera className="w-6 h-6 text-white drop-shadow-lg" />}
                              {zone.id.includes('retail') && <Users className="w-6 h-6 text-white drop-shadow-lg" />}
                              {zone.id.includes('boarding') && <Plane className="w-6 h-6 text-white drop-shadow-lg" />}
                              {zone.id.includes('baggage') && <Database className="w-6 h-6 text-white drop-shadow-lg" />}
                            </div>

                            {zone.realTimeAlerts.length > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-xs text-white font-bold">{zone.realTimeAlerts.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Hover Info Card */}
                          <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 bg-gray-800/95 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none min-w-64 z-20 backdrop-blur-sm border border-gray-600">
                            <h4 className="text-sm font-semibold text-white mb-2">{zone.name}</h4>
                            <div className="text-xs text-gray-300 space-y-1">
                              <div className="flex justify-between">
                                <span>Occupancy:</span>
                                <span className="font-medium">{zone.currentOccupancy}/{zone.maxCapacity} ({occupancyRate.toFixed(0)}%)</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Wait Time:</span>
                                <span className="font-medium">{zone.waitTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Throughput:</span>
                                <span className="font-medium">{zone.throughputRate} pax/hr</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`font-medium ${
                                  zone.alertLevel === 'critical' ? 'text-red-400' :
                                  zone.alertLevel === 'warning' ? 'text-yellow-400' :
                                  'text-green-400'
                                }`}>
                                  {zone.alertLevel.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Passenger Flow Vectors */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#01A3A4" opacity="0.6" />
                        </marker>
                      </defs>
                      <line x1="25" y1="35" x2="40" y2="35" stroke="#01A3A4" strokeWidth="0.5" markerEnd="url(#arrowhead)" opacity="0.6" />
                      <line x1="65" y1="55" x2="75" y2="25" stroke="#01A3A4" strokeWidth="0.5" markerEnd="url(#arrowhead)" opacity="0.6" />
                      <line x1="85" y1="75" x2="75" y2="60" stroke="#01A3A4" strokeWidth="0.5" markerEnd="url(#arrowhead)" opacity="0.6" />
                    </svg>
                  </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {terminalZones.map((zone) => (
                    <div key={zone.id} className="text-center p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                      <div className="text-sm font-medium text-white">{zone.name.split(' ')[0]}</div>
                      <div className={`text-xs ${
                        zone.alertLevel === 'critical' ? 'text-red-400' :
                        zone.alertLevel === 'warning' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {getOccupancyRate(zone).toFixed(0)}% capacity
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FIXED: Quick Actions Panel - 30% - Enhanced to fix visibility issue */}
            <div className="col-span-3 relative bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-600 backdrop-blur-sm shadow-2xl z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-transparent to-red-600/5 rounded-xl pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
                  Critical Operational Alerts
                  <span className="ml-auto text-xs bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">LIVE</span>
                </h3>
                <div className="space-y-4  overflow-y-auto">
                  {terminalZones
                    .filter(zone => zone.realTimeAlerts.length > 0)
                    .slice(0, 6)
                    .map((zone) => (
                      <motion.div 
                        key={zone.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gradient-to-r from-primary-700/50 to-primary-800/30 rounded-lg cursor-pointer hover:bg-primary-600/60 transition-all duration-300 border border-primary-600/40 backdrop-blur-sm shadow-lg hover:shadow-xl"
                        onClick={() => handleZoneClick(zone)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-white">{zone.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium animate-pulse ${
                              zone.alertLevel === 'critical' ? 'bg-red-600 text-white shadow-red-500/50' :
                              zone.alertLevel === 'warning' ? 'bg-yellow-600 text-white shadow-yellow-500/50' :
                              'bg-blue-600 text-white shadow-blue-500/50'
                            } shadow-lg`}>
                              {zone.realTimeAlerts.length} alert{zone.realTimeAlerts.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-300 mb-2 line-clamp-2">
                          <span className="text-yellow-400 font-medium">Latest:</span> {zone.realTimeAlerts[0]?.message.substring(0, 70)}...
                        </div>
                        <div className="text-xs text-orange-300 mb-3 line-clamp-2">
                          <span className="text-red-400 font-medium">Impact:</span> {zone.realTimeAlerts[0]?.predictedImpact.substring(0, 65)}...
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-primary-800/50 p-2 rounded border border-primary-600/30">
                            <div className="text-gray-400">Cost Impact</div>
                            <div className="text-red-300 font-semibold">{zone.realTimeAlerts[0]?.potentialCost}</div>
                          </div>
                          <div className="bg-primary-800/50 p-2 rounded border border-primary-600/30">
                            <div className="text-gray-400">Resolution ETA</div>
                            <div className="text-blue-300 font-semibold">{zone.realTimeAlerts[0]?.estimatedResolutionTime}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <span className="text-xs text-cyan-400 flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            Click for details
                          </span>
                        </div>
                      </motion.div>
                  ))}
                  {terminalZones.filter(zone => zone.realTimeAlerts.length > 0).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No critical alerts - operations optimal</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <div className="text-xs text-gray-400">System Health</div>
                          <div className="text-lg text-green-400 font-bold">98.2%</div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <div className="text-xs text-gray-400">SLA Compliance</div>
                          <div className="text-lg text-blue-400 font-bold">94.1%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Analytics Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* 24-Hour Flow Chart */}
            <div className="bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-600 backdrop-blur-sm shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-teal-400" />
                24-Hour Passenger Flow Analytics
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={passengerFlowData}>
                    <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                    <YAxis stroke="#8A9BA8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="security" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="immigration" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="retail" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="efficiency" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 4 }} />
                    <Bar dataKey="incidents" fill="#DC2626" opacity={0.8} />
                    <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FIXED: Advanced Congestion Heatmap - Reduced to 5 items to match graph */}
            <div className="bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-600 backdrop-blur-sm shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Radar className="w-5 h-5 mr-2 text-purple-400" />
                Real-time Congestion Matrix
              </h3>
              <div className="space-y-4">
                {congestionHeatmapData.map((zone, index) => (
                  <motion.div 
                    key={`congestion-zone-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-primary-600/20 rounded-lg hover:bg-primary-600/30 transition-colors"
                  >
                    <span className="text-sm text-white font-medium min-w-[100px]">{zone.zone}</span>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-24 h-3 bg-primary-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${zone.congestion}%` }}
                          transition={{ delay: index * 0.1, duration: 1 }}
                          className={`h-full rounded-full ${
                            zone.temperature === 'critical' ? 'bg-red-500' :
                            zone.temperature === 'hot' ? 'bg-orange-500' :
                                                        zone.temperature === 'warm' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{zone.congestion}%</span>
                      <div className="text-xs text-gray-500 w-12 text-right">{zone.throughput}/hr</div>
                      {zone.alerts > 0 && (
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">{zone.alerts}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Mini Performance Dashboard */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg border border-green-500/30">
                  <div className="text-xs text-gray-400 mb-1">Terminal Efficiency</div>
                  <div className="text-xl font-bold text-green-400">89.2%</div>
                  <div className="text-xs text-green-300">+2.1% from yesterday</div>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/30">
                  <div className="text-xs text-gray-400 mb-1">SLA Compliance</div>
                  <div className="text-xl font-bold text-blue-400">94.1%</div>
                  <div className="text-xs text-blue-300">Target: 95%</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Modals */}
          <ZoneModal />
          <AIAdvisoryModal />
        </div>
      </motion.div>
    </div>
  );
};

export default TerminalOperations;

