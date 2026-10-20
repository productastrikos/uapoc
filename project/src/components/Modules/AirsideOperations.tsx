import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import SimulationLauncher from "../../simulations/SimulationLauncher";
import { 
  Plane, 
  Clock, 
  Wind, 
  Thermometer, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Activity, 
  X, 
  Zap, 
  BarChart3, 
  Brain, 
  Target, 
  Settings, 
  CheckCircle,
  AlertTriangle, 
  Database, 
  Wifi, 
  Monitor, 
  Camera, 
  FileText, 
  PieChart
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';
import InfoButton from "../UI/InfoButton";
import DetailModal from '../UI/DetailModal';
import { useToast } from "../../hooks/useToast";
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

// Trend Arrow Component
const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable'; value?: number }> = ({ trend, value }) => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('airside');
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-status-success inline ml-1" />;
  } else if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-status-error inline ml-1" />;
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

interface Aircraft {
  id: string;
  x: string;
  y: string;
  heading: number;
  status: 'operational' | 'warning' | 'critical';
  altitude: number;
  speed: number;
  flightPlan: string;
  nextWaypoint: string;
  fuel: number;
  passengers: number;
  description: string;
  performance: {
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
}

const taxiTimeData = [
  { time: '06:00', value: 14 },
  { time: '07:00', value: 16 },
  { time: '08:00', value: 18 },
  { time: '09:00', value: 15 },
  { time: '10:00', value: 13 },
  { time: '11:00', value: 12 },
];

const runwayOccupancy = [
  { name: '27', value: 75, color: '#01A3A4' },
  { name: '09', value: 45, color: '#E6B85C' },
];

// Enhanced aircraft data
const aircraftPositions: Aircraft[] = [
  {
    id: 'VN1323',
    x: '30%',
    y: '45%',
    heading: 90,
    status: 'operational',
    altitude: 35000,
    speed: 450,
    flightPlan: 'VVNB-VVTS',
    nextWaypoint: 'BEKOL',
    fuel: 12500,
    passengers: 189,
    description: 'Vietnam Airlines Boeing 787-9 en route from Noi Bai to Tan Son Nhat',
    performance: { trend: 'stable', changePercent: 1.2 }
  },
  {
    id: 'VJ142',
    x: '60%',
    y: '55%',
    heading: 270,
    status: 'warning',
    altitude: 0,
    speed: 15,
    flightPlan: 'TAXI-A1',
    nextWaypoint: 'RWY27',
    fuel: 8900,
    passengers: 180,
    description: 'VietJet Airbus A321neo taxiing to runway 27 for departure',
    performance: { trend: 'down', changePercent: -5.7 }
  },
  {
    id: 'QH207',
    x: '20%',
    y: '65%',
    heading: 45,
    status: 'critical',
    altitude: 0,
    speed: 0,
    flightPlan: 'HOLD-G1',
    nextWaypoint: 'GATE-12',
    fuel: 15600,
    passengers: 156,
    description: 'Bamboo Airways Boeing 787-8 on ground hold due to technical issue',
    performance: { trend: 'down', changePercent: -15.3 }
  },
];

const AirsideOperations: React.FC = () => {
  const { addToast } = useToast();
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAIAdvisoryModal, setShowAIAdvisoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Emergency states
  const [groundStopActive, setGroundStopActive] = useState(false);
  const [runwayClosureActive, setRunwayClosureActive] = useState(false);
  const [weatherRedirectActive, setWeatherRedirectActive] = useState(false);
  const [aiOptimizationExecuted, setAiOptimizationExecuted] = useState(false);
  const [executedSOPs, setExecutedSOPs] = useState<{[key: string]: boolean}>({});

  // AI Advisory Data (Dynamic based on optimizations)
  const [aiAdvisoryData, setAiAdvisoryData] = useState({
    runwayEfficiency: 87.5,
    runwayEfficiencyTrend: 'stable' as 'up' | 'down' | 'stable',
    avgTaxiTime: '14.2 min',
    taxiTimeTrend: 'stable' as 'up' | 'down' | 'stable',
    activeMovements: '23',
    movementsTrend: 'stable' as 'up' | 'down' | 'stable',
    fuelSavings: '1.2k L',
    fuelSavingsTrend: 'stable' as 'up' | 'down' | 'stable',
    weatherImpact: 'Medium',
    weatherImpactTrend: 'stable' as 'up' | 'down' | 'stable',
    recommendations: [
      'Optimize runway 27 departure sequence to reduce taxi delays by 25%',
      'Implement dynamic gate allocation for arriving international flights',
      'Activate secondary taxiway A2 during peak traffic hours',
      'Coordinate with approach control for optimized approach spacing',
      'Enable ground radar enhancement for improved surface movement tracking'
    ]
  });

  // Simulate real-time data updates
useEffect(() => {
  const interval = setInterval(() => {
    setAiAdvisoryData(prev => {
      const newEfficiency = prev.runwayEfficiency + (Math.random() - 0.5) * 2;
      return {
        ...prev,
        runwayEfficiency: Math.min(100, Math.max(0, newEfficiency.toFixed(2))),
        avgTaxiTime: `${(
          parseFloat(prev.avgTaxiTime) + (Math.random() - 0.5) * 0.5
        ).toFixed(2)} min`,
        activeMovements: `${(
          parseInt(prev.activeMovements) + Math.floor(Math.random() * 3 - 1)
        ).toFixed(2)}`,
        fuelSavings: `${(
          parseFloat(prev.fuelSavings) + (Math.random() - 0.5) * 0.2
        ).toFixed(2)}k L`
      };
    });
  }, 5000);

  return () => clearInterval(interval);
}, []);


  // Button handlers with enhanced functionality
  const handleGroundStop = () => {
    setGroundStopActive(!groundStopActive);
    addToast({
      type: groundStopActive ? 'info' : 'warning',
      title: groundStopActive ? 'Ground Stop Lifted' : 'Ground Stop Initiated',
      message: groundStopActive ? 
        'Normal aircraft movements resumed. All ground operations returning to standard procedures.' : 
        'All aircraft ground movements halted. Emergency ground stop protocol activated.',
      duration: 6000
    });

    // Simulate API call
    console.log('Ground Stop API called:', !groundStopActive);
  };

  const handleRunwayClosure = () => {
    setRunwayClosureActive(!runwayClosureActive);
    addToast({
      type: runwayClosureActive ? 'info' : 'warning',
      title: runwayClosureActive ? 'Runway Reopened' : 'Runway Closure Activated',
      message: runwayClosureActive ? 
        'Runway 27 reopened for normal operations. Aircraft cleared for takeoff and landing.' : 
        'Runway 27 closed for emergency maintenance. All traffic diverted to runway 09.',
      duration: 5000
    });

    // Simulate API call
    console.log('Runway Closure API called:', !runwayClosureActive);
  };

  const handleWeatherRedirect = () => {
    setWeatherRedirectActive(!weatherRedirectActive);
    addToast({
      type: weatherRedirectActive ? 'info' : 'warning',
      title: weatherRedirectActive ? 'Weather Alert Cleared' : 'Weather Redirect Activated',
      message: weatherRedirectActive ? 
        'Weather conditions improved. Normal arrival patterns restored.' : 
        'Severe weather detected. Incoming flights redirected to alternate airports.',
      duration: 5000
    });

    // Simulate API call
    console.log('Weather Redirect API called:', !weatherRedirectActive);
  };

  const handleAIOptimizationExecute = () => {
    setAiOptimizationExecuted(!aiOptimizationExecuted);
    addToast({
      type: aiOptimizationExecuted ? 'info' : 'success',
      title: aiOptimizationExecuted ? 'AI Optimization Disabled' : 'AI Optimization Executed',
      message: aiOptimizationExecuted ? 
        'AI optimization disabled. Airside operations returned to manual control.' : 
        'AI-powered optimization applied. Runway efficiency improved by 8%, taxi times reduced by 21%.',
      duration: 6000
    });

    // Update advisory data dynamically
    setAiAdvisoryData(prev => ({
      ...prev,
      runwayEfficiency: aiOptimizationExecuted ? 87.5 : 94.8,
      runwayEfficiencyTrend: aiOptimizationExecuted ? 'stable' : 'up',
      avgTaxiTime: aiOptimizationExecuted ? '14.2 min' : '11.2 min',
      taxiTimeTrend: aiOptimizationExecuted ? 'stable' : 'down',
      activeMovements: aiOptimizationExecuted ? '23' : '31',
      movementsTrend: aiOptimizationExecuted ? 'stable' : 'up',
      fuelSavings: aiOptimizationExecuted ? '1.2k L' : '2.8k L',
      fuelSavingsTrend: aiOptimizationExecuted ? 'stable' : 'up',
      weatherImpact: aiOptimizationExecuted ? 'Medium' : 'Low',
      weatherImpactTrend: aiOptimizationExecuted ? 'stable' : 'down'
    }));

    // Simulate API call
    console.log('AI Optimization API called:', !aiOptimizationExecuted);
  };

  const handleAircraftClick = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
    setActiveTab('overview');
    setShowModal(true);
  };

  const handleAIAdvisoryClick = () => {
    setShowAIAdvisoryModal(true);
    setActiveTab('overview');
  };

  const handleExecuteSOP = (aircraftId: string, aircraftName: string) => {
    if (executedSOPs[aircraftId]) return;

    setExecutedSOPs(prev => ({
      ...prev,
      [aircraftId]: true
    }));

    addToast({
      type: 'success',
      title: 'Emergency SOP Executed',
      message: `Emergency procedure executed for ${aircraftName}. Ground crew dispatched immediately.`,
      duration: 5000
    });

    // Simulate timer for SOP completion
    setTimeout(() => {
      setExecutedSOPs(prev => ({
        ...prev,
        [aircraftId]: false
      }));
      
      addToast({
        type: 'info',
        title: 'Emergency Response Complete',
        message: `${aircraftName} emergency response completed. Aircraft cleared for normal operations.`,
        duration: 3000
      });
    }, 30000);

    // Simulate API call
    console.log('SOP Execution API called for:', aircraftId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'border-status-success/50 bg-status-success/10';
      case 'warning': return 'border-status-warning/50 bg-status-warning/10';
      case 'critical': return 'border-status-error/50 bg-status-error/10';
      default: return 'border-accent-blue/20 bg-primary-600/20';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-status-success';
      case 'warning': return 'text-status-warning';
      case 'critical': return 'text-status-error';
      default: return 'text-gray-400';
    }
  };

  // Enhanced Aircraft Modal with all tabs functional
  const AircraftModal = () => (
    <AnimatePresence>
      {showModal && selectedAircraft && (
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
            className="bg-primary-800 rounded-xl p-5 max-w-6xl w-full max-h-[90vh] overflow-hidden border border-primary-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Aircraft {selectedAircraft.id}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-accent-blue/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex space-x-1 mb-6 bg-primary-700/30 p-1 rounded-lg backdrop-blur-sm">
              {['overview', 'trends', 'insights', 'actions', 'evidence'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
                    activeTab === tab
                      ? 'bg-accent-blue text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-primary-600/50'
                  }`}
                >
                  <span className="relative z-10">
                    {tab === 'actions' ? 'Action Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto pr-2">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Status</h4>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusTextColor(selectedAircraft.status).replace('text-', 'bg-')}`}></div>
                        <span className={`font-medium ${getStatusTextColor(selectedAircraft.status)}`}>
                          {selectedAircraft.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Speed</h4>
                      <span className="text-white font-medium flex items-center">
                        {selectedAircraft.speed} kt
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Altitude</h4>
                      <span className="text-white font-medium flex items-center">
                        {selectedAircraft.altitude} ft
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Description</h4>
                    <p className="text-gray-300">{selectedAircraft.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Flight Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Flight Plan:</span>
                          <span className="text-white font-medium">{selectedAircraft.flightPlan}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Next Waypoint:</span>
                          <span className="text-white font-medium">{selectedAircraft.nextWaypoint}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Passengers:</span>
                          <span className="text-white font-medium">{selectedAircraft.passengers}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Fuel & Performance</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Fuel Remaining:</span>
                          <span className="text-white font-medium">{selectedAircraft.fuel.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Performance:</span>
                          <span className={`font-medium flex items-center ${selectedAircraft.performance.changePercent > 0 ? 'text-status-success' : 'text-status-error'}`}>
                            {selectedAircraft.performance.changePercent > 0 ? '+' : ''}{selectedAircraft.performance.changePercent}%
                            <TrendArrow trend={selectedAircraft.performance.trend} />
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Heading:</span>
                          <span className="text-white font-medium">{selectedAircraft.heading}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'trends' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-accent-blue" />
                        Flight Performance (24h)
                      </h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={taxiTimeData}>
                            <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                            <YAxis stroke="#8A9BA8" fontSize={12} />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#01A3A4" 
                              strokeWidth={3}
                              dot={{ fill: '#01A3A4', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-accent-blue" />
                        Operational Metrics
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">Fuel Efficiency</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">{(selectedAircraft.fuel / selectedAircraft.passengers * 100).toFixed(1)} kg/pax</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">On-Time Performance</span>
                          <div className="flex items-center">
                            <span className="text-status-success font-medium mr-2">94.2%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">Communication Quality</span>
                          <div className="flex items-center">
                            <span className="text-white font-medium mr-2">Excellent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div className="glass-panel-strong p-4 rounded-lg">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-accent-blue" />
                      AI Flight Analysis
                    </h4>

                    <div className="space-y-4">
                      <div className="bg-accent-blue/10 p-4 rounded-lg">
                        <h5 className="text-accent-blue font-medium mb-2">Performance Assessment</h5>
                        <p className="text-gray-300 text-sm mb-3">
                          {selectedAircraft.status === 'critical'
                            ? `Critical situation detected. Aircraft experiencing technical difficulties requiring immediate ground assistance and priority handling.`
                            : selectedAircraft.status === 'warning'
                            ? `Minor delays detected in taxi operations. Recommend expedited ground handling to minimize further delays.`
                            : `Optimal flight performance maintained. Aircraft operating within all safety parameters and scheduled timeline.`
                          }
                        </p>
                        <div className="flex items-center text-xs text-accent-blue">
                          <Target className="w-3 h-3 mr-1" />
                          Analysis Confidence: {selectedAircraft.status === 'critical' ? '98%' : selectedAircraft.status === 'warning' ? '89%' : '96%'}
                        </div>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-2">Operational Recommendations</h5>
                        <ul className="text-gray-300 text-sm space-y-2">
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            {selectedAircraft.status === 'critical' 
                              ? 'Deploy emergency response team and prepare backup aircraft for passenger transfer'
                              : selectedAircraft.status === 'warning'
                              ? 'Expedite ground handling operations and provide priority taxiway access'
                              : 'Continue standard operations with routine monitoring and maintenance checks'
                            }
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            Monitor weather conditions and adjust flight path if necessary
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                            {selectedAircraft.fuel < 10000 
                              ? 'Monitor fuel levels closely and coordinate refueling if required'
                              : 'Fuel levels optimal for planned flight duration'
                            }
                          </li>
                        </ul>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-2">Safety Indicators</h5>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-text-primary">{selectedAircraft.status === 'operational' ? '100%' : selectedAircraft.status === 'warning' ? '85%' : '60%'}</div>
                            <div className="text-xs text-gray-400">Safety Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-text-primary">{selectedAircraft.passengers}</div>
                            <div className="text-xs text-gray-400">Passengers Safe</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-4 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-accent-blue" />
                      Available Actions
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="border-b border-primary-600/50 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">
                            {selectedAircraft.status === 'critical' ? 'Execute Emergency SOP' : 'Request Priority Handling'}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-blue-200 bg-accent-blue/10 border border-accent-blue/30 px-2 py-1 rounded-full">
                              Priority: {selectedAircraft.status === 'critical' ? 'Emergency' : 'High'}
                            </span>
                            <span className="text-xs text-status-success bg-status-success/10 border border-status-success/30 px-2 py-1 rounded-full">ATC Approved</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          {selectedAircraft.status === 'critical'
                            ? `Initiate emergency response protocol for ${selectedAircraft.id}. Ground crews and medical assistance will be dispatched immediately.`
                            : `Request priority ground handling and expedited taxi clearance for ${selectedAircraft.id} to minimize delays.`
                          }
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleExecuteSOP(selectedAircraft.id, selectedAircraft.id)}
                            disabled={executedSOPs[selectedAircraft.id]}
                            className={`btn min-w-[11rem] ${
                              executedSOPs[selectedAircraft.id]
                                ? 'btn-secondary cursor-not-allowed opacity-70'
                                : selectedAircraft.status === 'critical'
                                ? 'btn-danger'
                                : 'btn-primary'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                            <span>{executedSOPs[selectedAircraft.id] ? '✓ Protocol Executed' : 'Execute Protocol'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-4 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-accent-blue" />
                      Flight Data & Evidence
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-3 flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          Flight Data Sources
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-2 bg-primary-600/20 rounded">
                            <span className="text-gray-300">Transponder Signal</span>
                            <span className="text-status-success flex items-center">
                              <div className="w-2 h-2 bg-status-success rounded-full mr-2"></div>
                              Strong
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary-600/20 rounded">
                            <span className="text-gray-300">Radio Communication</span>
                            <span className="text-status-success flex items-center">
                              <div className="w-2 h-2 bg-status-success rounded-full mr-2"></div>
                              Clear
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-primary-600/20 rounded">
                            <span className="text-gray-300">Radar Contact</span>
                            <span className="text-status-success flex items-center">
                              <div className="w-2 h-2 bg-status-success rounded-full mr-2"></div>
                              Positive
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-3 flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Recent Communications
                        </h5>
                        <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                          <div className="flex items-center text-gray-300 p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-gray-500 mr-3">{new Date().toLocaleTimeString()}</span>
                            <span>{selectedAircraft.id}: "Request taxi clearance to runway 27"</span>
                          </div>
                          <div className="flex items-center text-gray-300 p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-gray-500 mr-3">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                            <span>ATC: "{selectedAircraft.id} cleared for taxi via taxiway Alpha"</span>
                          </div>
                          <div className="flex items-center text-gray-300 p-2 bg-primary-600/20 rounded">
                            <span className="text-xs text-gray-500 mr-3">{new Date(Date.now() - 240000).toLocaleTimeString()}</span>
                            <span>{selectedAircraft.id}: "Ready for departure, all systems normal"</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-3 flex items-center">
                          <Monitor className="w-4 h-4 mr-2" />
                          Surveillance Systems
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-primary-600/30 p-3 rounded text-center">
                            <Camera className="w-6 h-6 text-status-success mx-auto mb-2" />
                            <div className="text-sm text-white font-medium">Ground Radar</div>
                            <div className="text-xs text-gray-400">Tracking</div>
                          </div>
                          <div className="bg-primary-600/30 p-3 rounded text-center">
                            <Wifi className="w-6 h-6 text-status-success mx-auto mb-2" />
                            <div className="text-sm text-white font-medium">ADS-B Signal</div>
                            <div className="text-xs text-gray-400">Received</div>
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
            className="bg-primary-800 rounded-xl p-5 max-w-6xl w-full max-h-[90vh] overflow-hidden border border-primary-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">AI Airside Advisory</h2>
              <button
                onClick={() => setShowAIAdvisoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-accent-blue/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex space-x-1 mb-6 bg-primary-700/30 p-1 rounded-lg backdrop-blur-sm">
              {['overview', 'analytics', 'predictions', 'actions', 'execution'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
                    activeTab === tab
                      ? 'bg-accent-blue text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-primary-600/50'
                  }`}
                >
                  <span className="relative z-10">
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            <div className="h-96 overflow-y-auto pr-2">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="glass-pill glass-pill-blue p-3">
                      <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                        {aiAdvisoryData.runwayEfficiency}%
                        <TrendArrow trend={aiAdvisoryData.runwayEfficiencyTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Runway Efficiency</div>
                    </div>
                    <div className="glass-pill glass-pill-teal p-3">
                      <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                        {aiAdvisoryData.avgTaxiTime}
                        <TrendArrow trend={aiAdvisoryData.taxiTimeTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Avg Taxi Time</div>
                    </div>
                    <div className="glass-pill glass-pill-violet p-3">
                      <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                        {aiAdvisoryData.activeMovements}
                        <TrendArrow trend={aiAdvisoryData.movementsTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Active Movements</div>
                    </div>
                    <div className="glass-pill glass-pill-neutral p-3">
                      <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                        {aiAdvisoryData.fuelSavings}
                        <TrendArrow trend={aiAdvisoryData.fuelSavingsTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Fuel Savings</div>
                    </div>
                    <div className="glass-pill glass-pill-blue p-3">
                      <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                        {aiAdvisoryData.weatherImpact}
                        <TrendArrow trend={aiAdvisoryData.weatherImpactTrend} />
                      </div>
                      <div className="text-xs text-text-muted text-center">Weather Impact</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Analysis Summary</h4>
                    <p className="text-gray-300">
                      Current airside operations show optimal performance across most metrics. Runway efficiency at 87.5% with potential for 8% improvement through AI optimization. 
                      Weather conditions favorable with minimal impact on operations. Critical aircraft QH207 requires immediate attention.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-accent-blue" />
                        Runway Utilization
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">Runway 27</span>
                          <span className="text-text-primary font-medium">75% utilization</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">Runway 09</span>
                          <span className="text-text-primary font-medium">45% utilization</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary-600/30 rounded-lg">
                          <span className="text-gray-300">Taxiway Alpha</span>
                          <span className="text-text-primary font-medium">68% utilization</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-3 rounded-lg backdrop-blur-sm border border-primary-600/30">
                      <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-accent-blue" />
                        Traffic Patterns
                      </h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={taxiTimeData}>
                            <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                            <YAxis stroke="#8A9BA8" fontSize={12} />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#01A3A4" 
                              strokeWidth={3}
                              dot={{ fill: '#01A3A4', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'predictions' && (
                <div className="space-y-4">
                  <div className="glass-panel-strong p-4 rounded-lg">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-accent-blue" />
                      Predictive Analytics
                    </h4>

                    <div className="space-y-4">
                      <div className="bg-accent-blue/10 p-4 rounded-lg">
                        <h5 className="text-accent-blue font-medium mb-2">Next 2 Hours Forecast</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-primary-600/30 rounded-lg">
                            <div className="text-xl font-bold text-text-primary">+18%</div>
                            <div className="text-xs text-gray-400">Traffic Increase</div>
                          </div>
                          <div className="text-center p-3 bg-primary-600/30 rounded-lg">
                            <div className="text-xl font-bold text-text-primary">-8%</div>
                            <div className="text-xs text-gray-400">Efficiency Drop</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-2">Weather Impact Prediction</h5>
                        <p className="text-gray-300 text-sm mb-3">
                          Incoming weather system at 15:30 local time may impact visibility by 20%. 
                          Recommend switching to ILS approaches and extending separation minimums.
                        </p>
                        <div className="flex items-center text-xs text-blue-400">
                          <Target className="w-3 h-3 mr-1" />
                          Weather Model Accuracy: 91.7%
                        </div>
                      </div>

                      <div className="bg-primary-700/30 border border-primary-600/40 p-3 rounded-lg">
                        <h5 className="text-text-primary font-medium mb-2">Optimization Potential</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Taxi Time Reduction</span>
                            <span className="text-status-success font-medium">up to 21%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Fuel Efficiency Gain</span>
                            <span className="text-status-success font-medium">up to 15%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Runway Throughput</span>
                            <span className="text-status-success font-medium">up to 12%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-4 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-accent-blue" />
                      AI Recommendations
                    </h4>
                    
                    <div className="space-y-4">
                      {aiAdvisoryData.recommendations.map((recommendation, index) => (
                        <div key={index} className="border-b border-primary-600/50 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">Recommendation #{index + 1}</h5>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-blue-200 bg-accent-blue/10 border border-accent-blue/30 px-2 py-1 rounded-full">High Priority</span>
                              <span className="text-xs text-status-success bg-status-success/10 border border-status-success/30 px-2 py-1 rounded-full">AI Generated</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {recommendation}
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                addToast({
                                  type: 'success',
                                  title: 'Recommendation Executed',
                                  message: `AI recommendation #${index + 1} applied successfully.`,
                                  duration: 3000
                                });
                                console.log('Executed recommendation:', recommendation);
                              }}
                              className="btn btn-secondary text-xs px-2.5 py-1"
                            >
                              Execute
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'execution' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary-700/50 to-primary-800/30 p-4 rounded-lg backdrop-blur-sm border border-primary-600/30">
                    <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-accent-blue" />
                      Execute AI Optimization
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="border-b border-primary-600/50 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-medium">Airside AI Enhancement</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-blue-200 bg-accent-blue/10 border border-accent-blue/30 px-2 py-1 rounded-full">Confidence: 94.2%</span>
                            <span className="text-xs text-status-success bg-status-success/10 border border-status-success/30 px-2 py-1 rounded-full">ATC Approved</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          Apply comprehensive AI optimization across all airside operations. 
                          Expected improvements: 21% taxi time reduction, 8% runway efficiency increase, 
                          15% fuel savings across all active aircraft.
                        </p>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleAIOptimizationExecute}
                            className={`btn min-w-[13rem] ${aiOptimizationExecuted ? 'btn-secondary' : 'btn-primary'}`}
                          >
                            <Zap className="w-4 h-4" />
                            <span>
                              {aiOptimizationExecuted ? '✓ AI Optimization Active' : 'Execute AI Optimization'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {aiOptimizationExecuted && (
                        <div className="bg-primary-800/60 rounded-lg p-4 border border-primary-600/40">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-status-success" />
                            <div>
                              <h6 className="text-text-primary font-medium">AI Optimization Successfully Applied</h6>
                              <p className="text-text-muted text-sm">
                                Airside operations enhanced across all aircraft and ground systems. Real-time monitoring active.
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-primary-700/40 rounded-lg">
                              <div className="text-lg font-bold text-text-primary">-21%</div>
                              <div className="text-xs text-gray-400">Taxi Time</div>
                            </div>
                            <div className="text-center p-3 bg-primary-700/40 rounded-lg">
                              <div className="text-lg font-bold text-text-primary">+8%</div>
                              <div className="text-xs text-text-muted">Runway Efficiency</div>
                            </div>
                            <div className="text-center p-3 bg-primary-700/40 rounded-lg">
                              <div className="text-lg font-bold text-text-primary">+15%</div>
                              <div className="text-xs text-text-muted">Fuel Savings</div>
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
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-primary-900"></div>
      </div>

      <div className="relative z-10 space-y-4 p-4">
        {/* Enhanced AI Advisory Panel */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={handleAIAdvisoryClick}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden glass-panel-strong rounded-xl p-4 hover:border-accent-blue/40 cursor-pointer transition-colors duration-200 group w-full"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-accent-blue" />
                <h3 className="text-base font-semibold text-white">AI Airside Operations Advisory</h3>
                <InfoButtonWithPortal description="AI-powered airside operations analysis with runway efficiency optimization, taxi time reduction, and fuel savings recommendations." />
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              <div className="text-center glass-pill glass-pill-blue p-3">
                <div className="glow-text text-xl font-bold flex items-center justify-center">
                  {aiAdvisoryData.runwayEfficiency}%
                  <TrendArrow trend={aiAdvisoryData.runwayEfficiencyTrend} />
                </div>
                <div className="text-xs text-text-muted">Runway Efficiency</div>
              </div>
              <div className="text-center glass-pill glass-pill-teal p-3">
                <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                  {aiAdvisoryData.avgTaxiTime}
                  <TrendArrow trend={aiAdvisoryData.taxiTimeTrend} />
                </div>
                <div className="text-xs text-text-muted">Avg Taxi Time</div>
              </div>
              <div className="text-center glass-pill glass-pill-violet p-3">
                <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                  {aiAdvisoryData.activeMovements}
                  <TrendArrow trend={aiAdvisoryData.movementsTrend} />
                </div>
                <div className="text-xs text-text-muted">Active Movements</div>
              </div>
              <div className="text-center glass-pill glass-pill-neutral p-3">
                <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                  {aiAdvisoryData.fuelSavings}
                  <TrendArrow trend={aiAdvisoryData.fuelSavingsTrend} />
                </div>
                <div className="text-xs text-text-muted">Fuel Savings</div>
              </div>
              <div className="text-center glass-pill glass-pill-blue p-3">
                <div className="text-xl font-bold text-text-primary flex items-center justify-center">
                  {aiAdvisoryData.weatherImpact}
                  <TrendArrow trend={aiAdvisoryData.weatherImpactTrend} />
                </div>
                <div className="text-xs text-text-muted">Weather Impact</div>
              </div>
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
              <Plane className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Airside Operations</h1>
              <p className="text-text-muted text-sm">Real-time runway and taxiway management</p>
            </div>
            <InfoButtonWithPortal description="Comprehensive airside operations monitoring including aircraft movements, runway utilization, taxi optimization, and ground control coordination." />
          </div>
          
          {/* Enhanced Emergency Actions */}
          <div className="flex space-x-2">
            <SimulationLauncher simulationId="flight-ops" label="Flight Operations Simulation" />

            <button
              onClick={handleGroundStop}
              className={`btn min-w-[10rem] ${groundStopActive ? 'btn-danger-active' : 'btn-danger'}`}
            >
              <span>{groundStopActive ? 'Ground Stop Active' : 'Ground Stop'}</span>
            </button>

            <button
              onClick={handleRunwayClosure}
              className={`btn min-w-[9rem] ${runwayClosureActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>{runwayClosureActive ? 'Runway Closed' : 'Close Runway'}</span>
            </button>

            <button
              onClick={handleWeatherRedirect}
              className={`btn min-w-[12rem] ${weatherRedirectActive ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>{weatherRedirectActive ? 'Weather Alert Active' : 'Weather Redirect'}</span>
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active Movements', value: aiAdvisoryData.activeMovements, icon: Plane, color: 'text-accent-blue', trend: aiAdvisoryData.movementsTrend, change: aiOptimizationExecuted ? 34.8 : 0, tint: 'glass-pill-blue' },
            { label: 'Avg Taxi Time', value: aiAdvisoryData.avgTaxiTime, icon: Clock, color: 'text-accent-blue', trend: aiAdvisoryData.taxiTimeTrend, change: aiOptimizationExecuted ? -21.1 : 0, tint: 'glass-pill-teal' },
            { label: 'Wind Speed', value: '8 KT', icon: Wind, color: 'text-accent-blue', trend: 'stable', change: 0, tint: 'glass-pill-violet' },
            { label: 'Temperature', value: '28°C', icon: Thermometer, color: 'text-accent-blue', trend: 'up', change: 2.1, tint: 'glass-pill-neutral' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-pill ${stat.tint} rounded-lg p-3 transition-colors duration-200 group`}
            >
              <div className="relative z-10">
                <div className="flex items-center space-x-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <div className={`text-xl font-bold flex items-center ${index === 0 ? 'glow-text' : 'text-text-primary'}`}>
                      {stat.value}
                      <TrendArrow trend={stat.trend} />
                      {stat.change !== 0 && (
                        <span className={`text-sm ml-2 ${stat.change > 0 ? 'text-status-success' : 'text-status-error'}`}>
                          {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">{stat.label}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Airside AI recommendations. The advisory strip above summarises the
              models; this is what they are actually asking for. */}
        <AiInsightPanel domain="airside" />

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column */}
          <div className="col-span-8 space-y-4">
            {/* Surface Movement Control */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-primary-800/60 rounded-lg border border-primary-600/40 p-4"
            >
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-text-primary">Surface Movement Control</h2>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-accent-blue" />
                    <span className="text-sm text-text-muted">A-SMGCS Active</span>
                    <InfoButtonWithPortal description="Advanced Surface Movement Guidance and Control System provides real-time aircraft tracking and collision avoidance on airport surface." />
                  </div>
                </div>

                <div className="relative h-80 bg-primary-900/50 rounded-lg overflow-hidden border border-primary-700/50 backdrop-blur-sm">
                  <div className="absolute inset-4">
                    {/* Main Runway */}
                    <div className="absolute top-1/2 left-4 right-4 h-12 bg-primary-600 rounded-sm border-2 border-accent-gold border-opacity-50 transform -translate-y-1/2 shadow-lg">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-accent-gold font-bold">27</div>
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-accent-gold font-bold">09</div>
                    </div>

                    {/* Taxiways */}
                    <div className="absolute top-20 left-1/4 right-1/4 h-6 bg-primary-600/80 rounded-sm border border-primary-500 shadow-md"></div>
                    <div className="absolute bottom-20 left-1/4 right-1/4 h-6 bg-primary-600/80 rounded-sm border border-primary-500 shadow-md"></div>

                    {/* Aircraft positions with enhanced styling */}
                    {aircraftPositions.map((aircraft, index) => (
                      <motion.div
                        key={aircraft.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.3 }}
                        whileHover={{ scale: 1.2, zIndex: 10 }}
                        className="absolute cursor-pointer group"
                        style={{ left: aircraft.x, top: aircraft.y, transform: `rotate(${aircraft.heading}deg)` }}
                        onClick={() => handleAircraftClick(aircraft)}
                      >
                        <div className="relative">
                          <Plane className={`h-6 w-6 transition-all duration-300 ${
                            aircraft.status === 'operational' ? 'text-accent-teal' :
                            aircraft.status === 'warning' ? 'text-status-warning' : 'text-status-error'
                          } group-hover:scale-125`} />
                          
                          <div className="absolute -top-8 -left-6 bg-primary-700 rounded px-2 py-1 text-xs text-text-primary border border-primary-600 transform -rotate-90 shadow-lg">
                            {aircraft.id}
                          </div>
                          
                          {/* Enhanced movement trail */}
                          <motion.div
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            transition={{ duration: 2, delay: index * 0.5 }}
                            className={`absolute -left-20 top-2 w-20 h-1 rounded-full shadow-lg ${
                              aircraft.status === 'operational' ? 'bg-gradient-to-r from-transparent to-accent-teal' :
                              aircraft.status === 'warning' ? 'bg-gradient-to-r from-transparent to-status-warning' :
                              'bg-gradient-to-r from-transparent to-status-error'
                            }`}
                          />
                        </div>
                      </motion.div>
                    ))}

                    {/* Enhanced conflict zones */}
                    <div className="absolute top-1/3 right-1/3 w-8 h-8 border-2 border-status-warning border-dashed rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* TOBT/TSAT Optimization */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden bg-primary-800/60 rounded-lg border border-primary-600/40 p-4"
            >
              
              <div className="relative z-10">
                <h2 className="text-base font-semibold text-text-primary mb-4">TOBT/TSAT Optimization Timeline</h2>
                
                <div className="space-y-4">
                  {[
                    { flight: 'VN1323', currentTOBT: '10:25', optimizedTOBT: '10:28', savings: '45L', confidence: 89 },
                    { flight: 'VJ142', currentTOBT: '11:45', optimizedTOBT: '11:42', savings: '32L', confidence: 76 },
                    { flight: 'QH207', currentTOBT: '14:20', optimizedTOBT: '14:20', savings: '0L', confidence: 95 },
                  ].map((opt, index) => (
                    <motion.div
                      key={opt.flight}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="flex items-center space-x-4 p-3 bg-primary-800/60 rounded-lg border border-primary-600/40 hover:border-accent-blue/40 transition-colors duration-200 group"
                    >
                      <div className="relative z-10 w-16 text-text-primary font-semibold">{opt.flight}</div>
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <span className="text-text-muted">Current:</span>
                            <span className="text-text-primary ml-1 font-medium">{opt.currentTOBT}</span>
                          </div>
                          <div className="text-text-muted">→</div>
                          <div className="text-sm">
                            <span className="text-text-muted">Optimal:</span>
                            <span className="text-accent-blue ml-1 font-semibold">{opt.optimizedTOBT}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-text-muted">Savings:</span>
                            <span className="text-status-success ml-1 font-medium">{opt.savings}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 text-right">
                        <div className="text-sm text-text-muted">Confidence</div>
                        <div className="text-text-primary font-semibold">{opt.confidence}%</div>
                      </div>
                      <button
                        onClick={() => {
                          addToast({
                            type: 'success',
                            title: 'Optimization Applied',
                            message: `TOBT/TSAT optimized for ${opt.flight}. Savings: ${opt.savings}`,
                            duration: 3000
                          });
                          console.log('Optimized TOBT/TSAT for:', opt.flight);
                        }}
                        className="relative z-10 btn btn-secondary text-xs px-2.5 py-1"
                      >
                        Apply
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-4">
            {/* Taxi Time Trends */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden bg-primary-800/60 rounded-lg border border-primary-600/40 p-4"
            >
              
              <div className="relative z-10">
                <h3 className="text-base font-semibold text-text-primary mb-4">Taxi Time Trends</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taxiTimeData}>
                      <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                      <YAxis stroke="#8A9BA8" fontSize={12} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#01A3A4" 
                        strokeWidth={3}
                        dot={{ fill: '#01A3A4', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#01A3A4', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Runway Occupancy */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden bg-primary-800/60 rounded-lg border border-primary-600/40 p-4"
            >
              
              <div className="relative z-10">
                <h3 className="text-base font-semibold text-text-primary mb-4">Runway Occupancy</h3>
                <div className="space-y-4">
                  {runwayOccupancy.map((runway, index) => (
                    <div key={runway.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-text-primary font-medium">Runway {runway.name}</span>
                        <span className="text-text-primary font-semibold">{runway.value}%</span>
                      </div>
                      <div className="w-full bg-primary-600/50 rounded-full h-3 shadow-inner overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${runway.value}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: runway.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Enhanced Weather Conditions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden bg-primary-800/60 rounded-lg border border-primary-600/40 p-4"
            >
              
              <div className="relative z-10">
                <h3 className="text-base font-semibold text-text-primary mb-4">Weather Conditions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                    <span className="text-text-muted">Wind:</span>
                    <span className="text-text-primary font-medium">090° / 8 KT</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                    <span className="text-text-muted">Visibility:</span>
                    <span className="text-text-primary font-medium">10+ KM</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                    <span className="text-text-muted">Cloud:</span>
                    <span className="text-text-primary font-medium">FEW 2500</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                    <span className="text-text-muted">Temperature:</span>
                    <span className="text-text-primary font-medium">28°C / 82°F</span>
                  </div>
                  <div className="flex justify-between p-2 bg-primary-700/30 rounded-lg backdrop-blur-sm">
                    <span className="text-text-muted">Pressure:</span>
                    <span className="text-text-primary font-medium">1013 hPa</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Modals */}
        <AircraftModal />
        <AIAdvisoryModal />
      </div>
    </motion.div>
  );
};

export default AirsideOperations;
