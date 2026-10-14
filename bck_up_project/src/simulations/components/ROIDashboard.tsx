import React, { useMemo, useState, useEffect } from 'react';
import { Alert, AISolution } from '../types';
import { 
  X, TrendingUp, DollarSign, Clock, Zap, Users, Award, 
  BarChart3, PieChart, Activity, Target, Layers, Map,
  Eye, Maximize, Filter, Download, RefreshCw, Settings,
  Cpu, Database, Wifi, Shield, Thermometer, Plane,
  Building, Car, ShoppingBag, Leaf, AlertTriangle,
  Package // used by getZoneIcon('baggage'); missing in the original AirOps file
} from 'lucide-react';

interface ROIDashboardProps {
  onClose: () => void;
  aiSolutions: AISolution[];
  alerts: Alert[];
}

interface DigitalTwinZone {
  id: string;
  name: string;
  type: 'terminal' | 'gate' | 'runway' | 'parking' | 'security' | 'baggage' | 'retail';
  status: 'operational' | 'maintenance' | 'alert' | 'offline';
  capacity: number;
  currentLoad: number;
  temperature: number;
  efficiency: number;
  coordinates: { x: number; y: number; width: number; height: number };
  metrics: {
    energyUsage: number;
    passengerFlow: number;
    incidents: number;
    uptime: number;
  };
}

const ROIDashboard: React.FC<ROIDashboardProps> = ({ onClose, aiSolutions, alerts }) => {
  const [activeView, setActiveView] = useState<'overview' | 'digital-twin' | 'predictive' | 'environmental'>('overview');
  const [selectedZone, setSelectedZone] = useState<DigitalTwinZone | null>(null);
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'critical' | 'maintenance' | 'efficiency'>('all');

  // Enhanced Digital Twin Zones Data
  const [digitalTwinZones, setDigitalTwinZones] = useState<DigitalTwinZone[]>([
    {
      id: 'terminal-a',
      name: 'Terminal A',
      type: 'terminal',
      status: 'operational',
      capacity: 5000,
      currentLoad: 3247,
      temperature: 22.5,
      efficiency: 94,
      coordinates: { x: 150, y: 100, width: 200, height: 150 },
      metrics: { energyUsage: 847, passengerFlow: 1250, incidents: 0, uptime: 99.8 }
    },
    {
      id: 'gate-12',
      name: 'Gate 12',
      type: 'gate',
      status: 'operational',
      capacity: 300,
      currentLoad: 245,
      temperature: 23.1,
      efficiency: 87,
      coordinates: { x: 200, y: 80, width: 40, height: 30 },
      metrics: { energyUsage: 156, passengerFlow: 245, incidents: 1, uptime: 98.5 }
    },
    {
      id: 'runway-09-27',
      name: 'Runway 09/27',
      type: 'runway',
      status: 'operational',
      capacity: 45,
      currentLoad: 28,
      temperature: 18.7,
      efficiency: 92,
      coordinates: { x: 50, y: 300, width: 400, height: 60 },
      metrics: { energyUsage: 234, passengerFlow: 0, incidents: 0, uptime: 100 }
    },
    {
      id: 'security-checkpoint-a',
      name: 'Security Checkpoint A',
      type: 'security',
      status: 'alert',
      capacity: 600,
      currentLoad: 523,
      temperature: 24.2,
      efficiency: 76,
      coordinates: { x: 120, y: 180, width: 80, height: 40 },
      metrics: { energyUsage: 198, passengerFlow: 523, incidents: 3, uptime: 96.2 }
    },
    {
      id: 'baggage-claim-b',
      name: 'Baggage Claim B',
      type: 'baggage',
      status: 'maintenance',
      capacity: 800,
      currentLoad: 0,
      temperature: 21.8,
      efficiency: 0,
      coordinates: { x: 300, y: 200, width: 100, height: 60 },
      metrics: { energyUsage: 45, passengerFlow: 0, incidents: 1, uptime: 0 }
    }
  ]);

  const roiMetrics = useMemo(() => {
    const totalCostSavings = aiSolutions.reduce((sum, solution) => sum + solution.costSaved, 0);
    const totalTimeSaved = aiSolutions.reduce((sum, solution) => sum + solution.timeSaved, 0);
    const totalEnergySaved = aiSolutions.reduce((sum, solution) => sum + solution.energySaved, 0);
    const successfulSolutions = aiSolutions.filter(s => s.success).length;
    const successRate = aiSolutions.length > 0 ? (successfulSolutions / aiSolutions.length) * 60 : 0;

    const dailyMultiplier = 365;
    const annualCostSavings = totalCostSavings * dailyMultiplier;
    const annualTimeSavings = totalTimeSaved * dailyMultiplier;
    const annualEnergySavings = totalEnergySaved * dailyMultiplier;

    const implementationCost = 2500000;
    const paybackMonths = annualCostSavings > 0 ? (implementationCost / (annualCostSavings / 12)) : 0;
    const roi = annualCostSavings > 0 ? ((annualCostSavings - implementationCost) / implementationCost) * 100 : 0;

    return {
      totalCostSavings,
      totalTimeSaved,
      totalEnergySaved,
      successRate,
      annualCostSavings,
      annualTimeSavings,
      annualEnergySavings,
      implementationCost,
      paybackMonths,
      roi,
      staffHoursSaved: totalTimeSaved / 60,
      passengerSatisfactionGain: 15,
      carbonReduction: totalEnergySaved * 0.5
    };
  }, [aiSolutions]);

  // Live data simulation
  useEffect(() => {
    if (!liveDataEnabled) return;

    const interval = setInterval(() => {
      setDigitalTwinZones(prev => prev.map(zone => ({
        ...zone,
        currentLoad: Math.max(0, zone.currentLoad + (Math.random() - 0.5) * 50),
        temperature: zone.temperature + (Math.random() - 0.5) * 0.5,
        efficiency: Math.max(0, Math.min(100, zone.efficiency + (Math.random() - 0.5) * 5)),
        metrics: {
          ...zone.metrics,
          energyUsage: Math.max(0, zone.metrics.energyUsage + (Math.random() - 0.5) * 20),
          passengerFlow: Math.max(0, zone.metrics.passengerFlow + (Math.random() - 0.5) * 30)
        }
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [liveDataEnabled]);

  const getZoneStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'from-emerald-500/20 to-emerald-600/30 border-emerald-400/50';
      case 'maintenance': return 'from-simgold-500/20 to-simgold-600/30 border-simgold-400/50';
      case 'alert': return 'from-red-500/20 to-red-600/30 border-red-400/50';
      case 'offline': return 'from-sim-500/20 to-sim-600/30 border-sim-400/50';
      default: return 'from-simteal-500/20 to-simteal-600/30 border-simteal-400/50';
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'terminal': return <Building className="w-4 h-4" />;
      case 'gate': return <Plane className="w-4 h-4" />;
      case 'runway': return <Plane className="w-4 h-4" />;
      case 'parking': return <Car className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'baggage': return <Package className="w-4 h-4" />;
      case 'retail': return <ShoppingBag className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCapacityColor = (currentLoad: number, capacity: number) => {
    const percentage = (currentLoad / capacity) * 100;
    if (percentage > 90) return 'text-red-400';
    if (percentage > 70) return 'text-simgold-400';
    return 'text-emerald-400';
  };

  const filteredZones = digitalTwinZones.filter(zone => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'critical') return zone.status === 'alert' || zone.currentLoad / zone.capacity > 0.9;
    if (filterCategory === 'maintenance') return zone.status === 'maintenance';
    if (filterCategory === 'efficiency') return zone.efficiency < 80;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-morphism w-full max-w-[95vw] max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-sim-800/90 to-sim-700/90 border-b border-sim-600/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-400/50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-sim-100">Digital Twin ROI Dashboard</h2>
                <p className="text-sim-300">Advanced Airport Intelligence & Analytics Platform- wait to sync data...</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-sim-800/60 rounded-lg p-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-sim-300">Live Data</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-sim-700/50 rounded-lg transition-colors text-sim-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-3 bg-sim-900/50 rounded-lg p-1">
            {[
              { id: 'overview', label: 'ROI Overview', icon: <BarChart3 className="w-4 h-4" /> },
              //{ id: 'digital-twin', label: 'Digital Twin', icon: <Map className="w-4 h-4" /> },
              { id: 'predictive', label: 'Predictive Analytics', icon: <Activity className="w-4 h-4" /> },
              { id: 'environmental', label: 'Environmental', icon: <Leaf className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeView === tab.id
                    ? 'bg-sim-700/80 text-sim-100 shadow-lg'
                    : 'text-sim-400 hover:text-sim-200 hover:bg-sim-800/30'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[calc(95vh-180px)] overflow-y-auto">
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Enhanced Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Cost Savings',
                    value: `$${roiMetrics.annualCostSavings.toLocaleString()}`,
                    subtitle: `Today: $${roiMetrics.totalCostSavings.toLocaleString()}`,
                    icon: <DollarSign className="w-8 h-8" />,
                    color: 'emerald',
                    trend: '+23%'
                  },
                  {
                    title: 'Time Saved',
                    value: `${(roiMetrics.annualTimeSavings / 60).toLocaleString()} hrs`,
                    subtitle: `Today: ${roiMetrics.staffHoursSaved.toFixed(1)} hrs`,
                    icon: <Clock className="w-8 h-8" />,
                    color: 'blue',
                    trend: '+18%'
                  },
                  {
                    title: 'Energy Saved',
                    value: `${roiMetrics.annualEnergySavings.toLocaleString()} kWh`,
                    subtitle: `CO₂: -${roiMetrics.carbonReduction.toFixed(0)}kg`,
                    icon: <Zap className="w-8 h-8" />,
                    color: 'purple',
                    trend: '+31%'
                  },
                  {
                    title: 'AI Success Rate',
                    value: `${roiMetrics.successRate.toFixed(1)}%`,
                    subtitle: `${aiSolutions.filter(s => s.success).length} successful actions`,
                    icon: <Award className="w-8 h-8" />,
                    color: 'amber',
                    trend: '+12%'
                  }
                ].map((metric, index) => (
                  <div
                    key={index}
                    className={`glass-card p-6 rounded-xl border-2 hover:shadow-2xl transition-all duration-300 ${
                      metric.color === 'emerald' ? 'border-emerald-400/30 hover:border-emerald-400/50' :
                      metric.color === 'blue' ? 'border-simteal-400/30 hover:border-simteal-400/50' :
                      metric.color === 'purple' ? 'border-simgold-400/30 hover:border-simgold-400/50' :
                      'border-simgold-400/30 hover:border-simgold-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        metric.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                        metric.color === 'blue' ? 'bg-simteal-500/20 text-simteal-400' :
                        metric.color === 'purple' ? 'bg-simgold-500/20 text-simgold-400' :
                        'bg-simgold-500/20 text-simgold-400'
                      }`}>
                        {metric.icon}
                      </div>
                      <span className={`text-sm font-medium ${
                        metric.color === 'emerald' ? 'text-emerald-400' :
                        metric.color === 'blue' ? 'text-simteal-400' :
                        metric.color === 'purple' ? 'text-simgold-400' :
                        'text-simgold-400'
                      }`}>
                        {metric.trend}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-sim-300 mb-2">{metric.title}</h3>
                      <div className="text-3xl font-bold text-sim-100 mb-2">{metric.value}</div>
                      <p className="text-sm text-sim-400">{metric.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Investment Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-xl border border-sim-600/30">
                  <h3 className="text-xl font-bold text-sim-200 mb-6">Investment Analysis</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Implementation Cost', value: `$${roiMetrics.implementationCost.toLocaleString()}`, color: 'text-sim-300' },
                      { label: 'Annual Savings', value: `$${roiMetrics.annualCostSavings.toLocaleString()}`, color: 'text-emerald-400' },
                      { label: 'Payback Period', value: `${roiMetrics.paybackMonths.toFixed(1)} months`, color: 'text-simteal-400' },
                      { label: 'ROI (5 years)', value: `${roiMetrics.roi.toFixed(0)}%`, color: 'text-emerald-400' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-sim-800/30 rounded-lg border border-sim-700/30">
                        <span className="text-sim-300">{item.label}</span>
                        <span className={`font-bold text-xl ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-sim-600/30">
                  <h3 className="text-xl font-bold text-sim-200 mb-6">Operational Benefits</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Passenger Satisfaction', value: `+${roiMetrics.passengerSatisfactionGain}%`, icon: <Users className="w-5 h-5 text-simteal-400" /> },
                      { label: 'Energy Efficiency', value: '+32%', icon: <Zap className="w-5 h-5 text-emerald-400" /> },
                      { label: 'Response Time', value: '-65%', icon: <Clock className="w-5 h-5 text-simgold-400" /> },
                      { label: 'System Uptime', value: '99.8%', icon: <Activity className="w-5 h-5 text-simgold-400" /> }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-sim-800/30 rounded-lg border border-sim-700/30">
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span className="text-sim-300">{item.label}</span>
                        </div>
                        <span className="font-bold text-xl text-sim-100">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'digital-twin' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataEnabled}
                      onChange={(e) => setLiveDataEnabled(e.target.checked)}
                      className="rounded border-sim-600 bg-sim-700 text-simteal-500"
                    />
                    <span className="text-sim-300">Live Data</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded border-sim-600 bg-sim-700 text-simteal-500"
                    />
                    <span className="text-sim-300">Heatmap</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-sim-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-sim-700 border border-sim-600 rounded-lg px-3 py-2 text-sim-300 text-sm"
                  >
                    <option value="all">All Zones</option>
                    <option value="critical">Critical</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="efficiency">Low Efficiency</option>
                  </select>
                </div>
              </div>

              {/* 3D Digital Twin Visualization */}
              <div className="digital-twin-3d p-8 relative">
                <div className="absolute top-4 left-4 bg-sim-900/80 backdrop-blur rounded-lg p-3 border border-sim-600/50">
                  <h4 className="text-sim-200 font-semibold mb-2">Airport Overview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="text-sim-300">Active Zones: {digitalTwinZones.filter(z => z.status === 'operational').length}</div>
                    <div className="text-sim-300">Total Capacity: {digitalTwinZones.reduce((sum, z) => sum + z.capacity, 0).toLocaleString()}</div>
                    <div className="text-sim-300">Current Load: {digitalTwinZones.reduce((sum, z) => sum + z.currentLoad, 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* SVG Airport Layout */}
                <svg viewBox="0 0 600 400" className="w-full h-full min-h-96">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    {showHeatmap && (
                      <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                        <stop offset="50%" stopColor="rgba(245, 158, 11, 0.4)" />
                        <stop offset="100%" stopColor="rgba(1, 163, 164, 0.2)" />
                      </radialGradient>
                    )}
                  </defs>

                  {filteredZones.map(zone => (
                    <g key={zone.id}>
                      {/* Zone Shape */}
                      <rect
                        x={zone.coordinates.x}
                        y={zone.coordinates.y}
                        width={zone.coordinates.width}
                        height={zone.coordinates.height}
                        fill={showHeatmap ? "url(#heatGradient)" : "rgba(1, 163, 164, 0.1)"}
                        stroke={
                          zone.status === 'operational' ? '#10b981' :
                          zone.status === 'maintenance' ? '#f59e0b' :
                          zone.status === 'alert' ? '#ef4444' : '#8A9BA8'
                        }
                        strokeWidth="2"
                        rx="8"
                        className="cursor-pointer interactive-hotspot"
                        filter={zone.status === 'alert' ? 'url(#glow)' : 'none'}
                        onClick={() => setSelectedZone(zone)}
                      />
                      
                      {/* Zone Label */}
                      <text
                        x={zone.coordinates.x + zone.coordinates.width/2}
                        y={zone.coordinates.y + zone.coordinates.height/2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#D6E2EC"
                        fontSize="12"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {zone.name}
                      </text>

                      {/* Status Indicator */}
                      <circle
                        cx={zone.coordinates.x + zone.coordinates.width - 15}
                        cy={zone.coordinates.y + 15}
                        r="6"
                        fill={
                          zone.status === 'operational' ? '#10b981' :
                          zone.status === 'maintenance' ? '#f59e0b' :
                          zone.status === 'alert' ? '#ef4444' : '#8A9BA8'
                        }
                        className={zone.status === 'operational' ? 'animate-pulse' : ''}
                      />

                      {/* Capacity Indicator */}
                      <rect
                        x={zone.coordinates.x + 5}
                        y={zone.coordinates.y + zone.coordinates.height - 15}
                        width={zone.coordinates.width - 10}
                        height="4"
                        fill="rgba(255, 255, 255, 0.2)"
                        rx="2"
                      />
                      <rect
                        x={zone.coordinates.x + 5}
                        y={zone.coordinates.y + zone.coordinates.height - 15}
                        width={(zone.coordinates.width - 10) * (zone.currentLoad / zone.capacity)}
                        height="4"
                        fill={
                          (zone.currentLoad / zone.capacity) > 0.9 ? '#ef4444' :
                          (zone.currentLoad / zone.capacity) > 0.7 ? '#f59e0b' : '#10b981'
                        }
                        rx="2"
                      />
                    </g>
                  ))}

                  {/* Live Data Streams */}
                  {liveDataEnabled && (
                    <g>
                      <circle cx="100" cy="50" r="3" fill="#01A3A4" opacity="0.8">
                        <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="300" cy="80" r="3" fill="#10b981" opacity="0.8">
                        <animate attributeName="r" values="3;8;3" dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="500" cy="120" r="3" fill="#f59e0b" opacity="0.8">
                        <animate attributeName="r" values="3;8;3" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}
                </svg>
              </div>

              {/* Zone Details Panel */}
              {selectedZone && (
                <div className="glass-card p-6 rounded-xl border border-sim-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getZoneStatusColor(selectedZone.status)}`}>
                        {getZoneIcon(selectedZone.type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-sim-200">{selectedZone.name}</h3>
                        <p className="text-sim-400 capitalize">{selectedZone.type} • {selectedZone.status}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="text-sim-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sim-400">Capacity</span>
                        <Users className="w-4 h-4 text-sim-400" />
                      </div>
                      <div className={`text-2xl font-bold ${getCapacityColor(selectedZone.currentLoad, selectedZone.capacity)}`}>
                        {((selectedZone.currentLoad / selectedZone.capacity) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-sim-500">
                        {selectedZone.currentLoad} / {selectedZone.capacity}
                      </div>
                    </div>

                    <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sim-400">Temperature</span>
                        <Thermometer className="w-4 h-4 text-sim-400" />
                      </div>
                      <div className="text-2xl font-bold text-sim-200">
                        {selectedZone.temperature.toFixed(1)}°C
                      </div>
                      <div className="text-sm text-sim-500">Optimal: 22-24°C</div>
                    </div>

                    <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sim-400">Efficiency</span>
                        <Target className="w-4 h-4 text-sim-400" />
                      </div>
                      <div className={`text-2xl font-bold ${
                        selectedZone.efficiency > 90 ? 'text-emerald-400' :
                        selectedZone.efficiency > 70 ? 'text-simgold-400' : 'text-red-400'
                      }`}>
                        {selectedZone.efficiency}%
                      </div>
                      <div className="text-sm text-sim-500">Target: {'>'}90%</div>
                    </div>

                    <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sim-400">Energy Usage</span>
                        <Zap className="w-4 h-4 text-sim-400" />
                      </div>
                      <div className="text-2xl font-bold text-sim-200">
                        {selectedZone.metrics.energyUsage}kW
                      </div>
                      <div className="text-sm text-sim-500">Live consumption</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'predictive' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl border border-sim-600/30">
                <h3 className="text-xl font-bold text-sim-200 mb-4">Predictive Analytics Dashboard</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <h4 className="text-sim-300 font-semibold mb-3">Flight Delays Prediction</h4>
                    <div className="text-3xl font-bold text-simteal-400 mb-2">23%</div>
                    <p className="text-sm text-sim-400">Probability of delays in next 2 hours</p>
                    <div className="mt-3 w-full bg-sim-700/50 rounded-full h-2">
                      <div className="bg-simteal-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>

                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <h4 className="text-sim-300 font-semibold mb-3">Passenger Flow Forecast</h4>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">+15%</div>
                    <p className="text-sm text-sim-400">Expected increase next hour</p>
                    <div className="mt-3 w-full bg-sim-700/50 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <h4 className="text-sim-300 font-semibold mb-3">Maintenance Priority</h4>
                    <div className="text-3xl font-bold text-simgold-400 mb-2">High</div>
                    <p className="text-sm text-sim-400">Baggage Claim B requires attention</p>
                    <div className="mt-3 w-full bg-sim-700/50 rounded-full h-2">
                      <div className="bg-simgold-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'environmental' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl border border-sim-600/30">
                <h3 className="text-xl font-bold text-sim-200 mb-4">Environmental Impact Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sim-400">Carbon Footprint</span>
                      <Leaf className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">-52%</div>
                    <p className="text-sm text-sim-500">vs. last year</p>
                  </div>

                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sim-400">Energy Efficiency</span>
                      <Zap className="w-4 h-4 text-simteal-400" />
                    </div>
                    <div className="text-2xl font-bold text-simteal-400">94.2%</div>
                    <p className="text-sm text-sim-500">Overall efficiency</p>
                  </div>

                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sim-400">Waste Reduction</span>
                      <Activity className="w-4 h-4 text-simgold-400" />
                    </div>
                    <div className="text-2xl font-bold text-simgold-400">78%</div>
                    <p className="text-sm text-sim-500">Recycling rate</p>
                  </div>

                  <div className="bg-sim-800/30 rounded-lg p-4 border border-sim-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sim-400">Air Quality Index</span>
                      <Shield className="w-4 h-4 text-simgold-400" />
                    </div>
                    <div className="text-2xl font-bold text-simgold-400">Good</div>
                    <p className="text-sm text-sim-500">AQI: 42</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ROIDashboard;