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
      case 'operational': return 'bg-status-neutral/15 border-status-neutral/30';
      case 'maintenance': return 'bg-status-warning/15 border-status-warning/30';
      case 'alert': return 'bg-status-error/15 border-status-error/30';
      case 'offline': return 'bg-primary-600/20 border-primary-600/40';
      default: return 'bg-accent-blue/15 border-accent-blue/30';
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
    if (percentage > 90) return 'text-status-error';
    if (percentage > 70) return 'text-status-warning';
    return 'text-status-neutral';
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
      <div className="bg-primary-900/95 backdrop-blur-xl border border-primary-600/40 w-full max-w-[95vw] max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-primary-800/90 border-b border-primary-600/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-status-neutral/15 border border-status-neutral/30 rounded-xl">
                <TrendingUp className="w-8 h-8 text-status-neutral" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Digital Twin ROI Dashboard</h2>
                <p className="text-text-secondary">Advanced Airport Intelligence & Analytics Platform- wait to sync data...</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-primary-800/60 rounded-lg p-2">
                <div className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></div>
                <span className="text-sm text-text-secondary">Live Data</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-primary-700/50 rounded-lg transition-colors text-text-secondary hover:text-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-3 bg-primary-900/50 rounded-lg p-1">
            {[
              { id: 'overview', label: 'ROI Overview', icon: <BarChart3 className="w-4 h-4" /> },
              //{ id: 'digital-twin', label: 'Digital Twin', icon: <Map className="w-4 h-4" /> },
              { id: 'predictive', label: 'Predictive Analytics', icon: <Activity className="w-4 h-4" /> },
              { id: 'environmental', label: 'Environmental', icon: <Leaf className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`btn min-w-[11rem] ${activeView === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 max-h-[calc(95vh-180px)] overflow-y-auto">
          {activeView === 'overview' && (
            <div className="space-y-4">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Cost Savings',
                    value: `$${roiMetrics.annualCostSavings.toLocaleString()}`,
                    subtitle: `Today: $${roiMetrics.totalCostSavings.toLocaleString()}`,
                    icon: <DollarSign className="w-8 h-8" />,
                    trend: '+23%'
                  },
                  {
                    title: 'Time Saved',
                    value: `${(roiMetrics.annualTimeSavings / 60).toLocaleString()} hrs`,
                    subtitle: `Today: ${roiMetrics.staffHoursSaved.toFixed(1)} hrs`,
                    icon: <Clock className="w-8 h-8" />,
                    trend: '+18%'
                  },
                  {
                    title: 'Energy Saved',
                    value: `${roiMetrics.annualEnergySavings.toLocaleString()} kWh`,
                    subtitle: `CO₂: -${roiMetrics.carbonReduction.toFixed(0)}kg`,
                    icon: <Zap className="w-8 h-8" />,
                    trend: '+31%'
                  },
                  {
                    title: 'AI Success Rate',
                    value: `${roiMetrics.successRate.toFixed(1)}%`,
                    subtitle: `${aiSolutions.filter(s => s.success).length} successful actions`,
                    icon: <Award className="w-8 h-8" />,
                    trend: '+12%'
                  }
                ].map((metric, index) => (
                  <div
                    key={index}
                    className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl transition-colors hover:border-primary-600/60"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-lg bg-primary-700/50 text-accent-blue">
                        {metric.icon}
                      </div>
                      <span className="text-sm font-medium text-status-neutral">
                        {metric.trend}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-secondary mb-2">{metric.title}</h3>
                      <div className="text-3xl font-bold text-text-primary mb-2">{metric.value}</div>
                      <p className="text-sm text-text-muted">{metric.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Investment Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl">
                  <h3 className="text-xl font-bold text-text-primary mb-4">Investment Analysis</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Implementation Cost', value: `$${roiMetrics.implementationCost.toLocaleString()}`, color: 'text-text-secondary' },
                      { label: 'Annual Savings', value: `$${roiMetrics.annualCostSavings.toLocaleString()}`, color: 'text-status-neutral' },
                      { label: 'Payback Period', value: `${roiMetrics.paybackMonths.toFixed(1)} months`, color: 'text-accent-blue' },
                      { label: 'ROI (5 years)', value: `${roiMetrics.roi.toFixed(0)}%`, color: 'text-status-neutral' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-primary-800/40 rounded-lg border border-primary-600/30">
                        <span className="text-text-secondary">{item.label}</span>
                        <span className={`font-bold text-xl ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl">
                  <h3 className="text-xl font-bold text-text-primary mb-4">Operational Benefits</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Passenger Satisfaction', value: `+${roiMetrics.passengerSatisfactionGain}%`, icon: <Users className="w-5 h-5 text-accent-blue" /> },
                      { label: 'Energy Efficiency', value: '+32%', icon: <Zap className="w-5 h-5 text-status-neutral" /> },
                      { label: 'Response Time', value: '-65%', icon: <Clock className="w-5 h-5 text-accent-blue" /> },
                      { label: 'System Uptime', value: '99.8%', icon: <Activity className="w-5 h-5 text-accent-blue" /> }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-primary-800/40 rounded-lg border border-primary-600/30">
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <span className="text-text-secondary">{item.label}</span>
                        </div>
                        <span className="font-bold text-xl text-text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'digital-twin' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataEnabled}
                      onChange={(e) => setLiveDataEnabled(e.target.checked)}
                      className="rounded border-primary-600 bg-primary-700 text-accent-blue"
                    />
                    <span className="text-text-secondary">Live Data</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded border-primary-600 bg-primary-700 text-accent-blue"
                    />
                    <span className="text-text-secondary">Heatmap</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-text-muted" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-primary-700 border border-primary-600 rounded-lg px-2.5 py-2 text-text-secondary text-sm"
                  >
                    <option value="all">All Zones</option>
                    <option value="critical">Critical</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="efficiency">Low Efficiency</option>
                  </select>
                </div>
              </div>

              {/* 3D Digital Twin Visualization */}
              <div className="digital-twin-3d p-6 relative">
                <div className="absolute top-4 left-4 bg-primary-900/80 backdrop-blur rounded-lg p-2.5 border border-primary-600/40">
                  <h4 className="text-text-primary font-semibold mb-2">Airport Overview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="text-text-secondary">Active Zones: {digitalTwinZones.filter(z => z.status === 'operational').length}</div>
                    <div className="text-text-secondary">Total Capacity: {digitalTwinZones.reduce((sum, z) => sum + z.capacity, 0).toLocaleString()}</div>
                    <div className="text-text-secondary">Current Load: {digitalTwinZones.reduce((sum, z) => sum + z.currentLoad, 0).toLocaleString()}</div>
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
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
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
                        fill={showHeatmap ? "url(#heatGradient)" : "rgba(59, 130, 246, 0.1)"}
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
                      <circle cx="100" cy="50" r="3" fill="#3B82F6" opacity="0.8">
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
                <div className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getZoneStatusColor(selectedZone.status)}`}>
                        {getZoneIcon(selectedZone.type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{selectedZone.name}</h3>
                        <p className="text-text-muted capitalize">{selectedZone.type} • {selectedZone.status}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Capacity</span>
                        <Users className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className={`text-2xl font-bold ${getCapacityColor(selectedZone.currentLoad, selectedZone.capacity)}`}>
                        {((selectedZone.currentLoad / selectedZone.capacity) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-text-muted">
                        {selectedZone.currentLoad} / {selectedZone.capacity}
                      </div>
                    </div>

                    <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Temperature</span>
                        <Thermometer className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className="text-2xl font-bold text-text-primary">
                        {selectedZone.temperature.toFixed(1)}°C
                      </div>
                      <div className="text-sm text-text-muted">Optimal: 22-24°C</div>
                    </div>

                    <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Efficiency</span>
                        <Target className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className={`text-2xl font-bold ${
                        selectedZone.efficiency > 90 ? 'text-status-neutral' :
                        selectedZone.efficiency > 70 ? 'text-status-warning' : 'text-status-error'
                      }`}>
                        {selectedZone.efficiency}%
                      </div>
                      <div className="text-sm text-text-muted">Target: {'>'}90%</div>
                    </div>

                    <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Energy Usage</span>
                        <Zap className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className="text-2xl font-bold text-text-primary">
                        {selectedZone.metrics.energyUsage}kW
                      </div>
                      <div className="text-sm text-text-muted">Live consumption</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'predictive' && (
            <div className="space-y-4">
              <div className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl">
                <h3 className="text-xl font-bold text-text-primary mb-3">Predictive Analytics Dashboard</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <h4 className="text-text-secondary font-semibold mb-3">Flight Delays Prediction</h4>
                    <div className="text-3xl font-bold text-accent-blue mb-2">23%</div>
                    <p className="text-sm text-text-muted">Probability of delays in next 2 hours</p>
                    <div className="mt-3 w-full bg-primary-700/50 rounded-full h-2">
                      <div className="bg-accent-blue h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>

                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <h4 className="text-text-secondary font-semibold mb-3">Passenger Flow Forecast</h4>
                    <div className="text-3xl font-bold text-status-neutral mb-2">+15%</div>
                    <p className="text-sm text-text-muted">Expected increase next hour</p>
                    <div className="mt-3 w-full bg-primary-700/50 rounded-full h-2">
                      <div className="bg-status-neutral h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <h4 className="text-text-secondary font-semibold mb-3">Maintenance Priority</h4>
                    <div className="text-3xl font-bold text-status-warning mb-2">High</div>
                    <p className="text-sm text-text-muted">Baggage Claim B requires attention</p>
                    <div className="mt-3 w-full bg-primary-700/50 rounded-full h-2">
                      <div className="bg-status-warning h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'environmental' && (
            <div className="space-y-4">
              <div className="bg-primary-800/60 border border-primary-600/40 p-4 rounded-xl">
                <h3 className="text-xl font-bold text-text-primary mb-3">Environmental Impact Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted">Carbon Footprint</span>
                      <Leaf className="w-4 h-4 text-status-neutral" />
                    </div>
                    <div className="text-2xl font-bold text-status-neutral">-52%</div>
                    <p className="text-sm text-text-muted">vs. last year</p>
                  </div>

                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted">Energy Efficiency</span>
                      <Zap className="w-4 h-4 text-status-neutral" />
                    </div>
                    <div className="text-2xl font-bold text-status-neutral">94.2%</div>
                    <p className="text-sm text-text-muted">Overall efficiency</p>
                  </div>

                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted">Waste Reduction</span>
                      <Activity className="w-4 h-4 text-status-neutral" />
                    </div>
                    <div className="text-2xl font-bold text-status-neutral">78%</div>
                    <p className="text-sm text-text-muted">Recycling rate</p>
                  </div>

                  <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted">Air Quality Index</span>
                      <Shield className="w-4 h-4 text-status-neutral" />
                    </div>
                    <div className="text-2xl font-bold text-status-neutral">Good</div>
                    <p className="text-sm text-text-muted">AQI: 42</p>
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
