import React, { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
  Plane, 
  Users, 
  Clock, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  CheckCircle, 
  Server, 
  Database, 
  Camera, 
  Wifi, 
  Zap, 
  Monitor, 
  HardDrive, 
  Radio, 
  MapPin, 
  Cloud, 
  Eye,
  Brain,
  Info,
  X,
  Minus,
  Maximize,
  ExternalLink
} from "lucide-react";
import DigitalTwin from "../Dashboard/DigitalTwin";
import FlightTable from "../Dashboard/FlightTable";
import InfoButton from "../UI/InfoButton";
import DetailModal from '../UI/DetailModal';
import { useLanguage } from "../../hooks/useLanguage";
import { useToast } from "../../hooks/useToast";
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

// Enhanced Mock Flight Data with realistic details
const mockFlightData = [
  {
    id: 'VN-A321',
    flightNumber: 'VN1520',
    airline: 'Vietnam Airlines',
    aircraftType: 'Airbus A321-200',
    registration: 'VN-A588',
    route: 'SGN → PQC',
    origin: 'Ho Chi Minh City (SGN)',
    destination: 'Phu Quoc (PQC)',
    scheduledDeparture: '14:30',
    actualDeparture: '14:35',
    scheduledArrival: '15:45',
    estimatedArrival: '15:50',
    status: 'En Route',
    gate: 'A3',
    terminal: 'T1',
    passengers: 156,
    cargo: '2.3 tons',
    fuel: '4,200 kg',
    altitude: '35,000 ft',
    speed: '487 kts',
    progress: 75,
    delay: 5,
    weather: 'Clear',
    crew: 6,
    lastContact: '2 mins ago'
  },
  {
    id: 'JQ-A320',
    flightNumber: 'JQ560',
    airline: 'Jetstar Asia',
    aircraftType: 'Airbus A320-200',
    registration: 'VN-A976',
    route: 'HAN → PQC',
    origin: 'Hanoi (HAN)',
    destination: 'Phu Quoc (PQC)',
    scheduledDeparture: '16:15',
    actualDeparture: '16:20',
    scheduledArrival: '18:30',
    estimatedArrival: '18:25',
    status: 'Approaching',
    gate: 'B1',
    terminal: 'T1',
    passengers: 144,
    cargo: '1.8 tons',
    fuel: '3,800 kg',
    altitude: '8,000 ft',
    speed: '285 kts',
    progress: 95,
    delay: -5,
    weather: 'Light Rain',
    crew: 6,
    lastContact: '30 secs ago'
  },
  {
    id: 'VU-A330',
    flightNumber: 'VU142',
    airline: 'Vietravel Airlines',
    aircraftType: 'Airbus A330-200',
    registration: 'VN-A699',
    route: 'PQC → SGN',
    origin: 'Phu Quoc (PQC)',
    destination: 'Ho Chi Minh City (SGN)',
    scheduledDeparture: '19:00',
    actualDeparture: null,
    scheduledArrival: '20:15',
    estimatedArrival: '20:15',
    status: 'Boarding',
    gate: 'A5',
    terminal: 'T1',
    passengers: 198,
    cargo: '3.1 tons',
    fuel: '5,200 kg',
    altitude: '0 ft',
    speed: '0 kts',
    progress: 0,
    delay: 0,
    weather: 'Clear',
    crew: 8,
    lastContact: 'Now'
  },
  {
    id: 'QH-B787',
    flightNumber: 'QH1420',
    airline: 'Bamboo Airways',
    aircraftType: 'Boeing 787-9',
    registration: 'VN-A819',
    route: 'PQC → HAN',
    origin: 'Phu Quoc (PQC)',
    destination: 'Hanoi (HAN)',
    scheduledDeparture: '20:45',
    actualDeparture: null,
    scheduledArrival: '23:00',
    estimatedArrival: '23:00',
    status: 'Pre-boarding',
    gate: 'A7',
    terminal: 'T1',
    passengers: 234,
    cargo: '4.2 tons',
    fuel: '6,800 kg',
    altitude: '0 ft',
    speed: '0 kts',
    progress: 0,
    delay: 0,
    weather: 'Clear',
    crew: 10,
    lastContact: 'Now'
  },
  {
    id: 'VN-B777',
    flightNumber: 'VN1845',
    airline: 'Vietnam Airlines',
    aircraftType: 'Boeing 777-300ER',
    registration: 'VN-A865',
    route: 'ICN → PQC',
    origin: 'Seoul Incheon (ICN)',
    destination: 'Phu Quoc (PQC)',
    scheduledDeparture: '11:30',
    actualDeparture: '11:45',
    scheduledArrival: '15:15',
    estimatedArrival: '15:30',
    status: 'Delayed',
    gate: 'B3',
    terminal: 'T1',
    passengers: 276,
    cargo: '5.8 tons',
    fuel: '8,200 kg',
    altitude: '41,000 ft',
    speed: '523 kts',
    progress: 82,
    delay: 15,
    weather: 'Overcast',
    crew: 12,
    lastContact: '1 min ago'
  }
];

// Trend Arrow Component
const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('aocc');
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


// Enhanced KPI Grid Component
const KPIGrid: React.FC<{
  emergencyMode: string | null;
  operationsAlert: boolean;
  systemOptimized: boolean;
  onSelect: (item: any) => void;
}> = ({ emergencyMode, operationsAlert, systemOptimized, onSelect }) => {
  const kpiData = [
    { 
      value: emergencyMode === 'emergency' ? '18' : '24', 
      label: 'Active Flights', 
      icon: Plane, 
      change: emergencyMode === 'emergency' ? '-25%' : '+5.2%', 
      status: emergencyMode === 'emergency' ? 'critical' : 'good',
      description: 'Real-time count of all active flight operations'
    },
    { 
      value: '3,247', 
      label: 'Passengers Today', 
      icon: Users, 
      change: '+12.4%', 
      status: 'good',
      description: 'Total passenger throughput for today'
    },
    { 
      value: systemOptimized ? '91.8%' : '87.3%', 
      label: 'On-Time Performance', 
      icon: Clock, 
      change: systemOptimized ? '+4.5%' : '-2.1%', 
      status: systemOptimized ? 'good' : 'warning',
      description: 'Percentage of flights operating within schedule'
    },
    { 
      value: emergencyMode === 'emergency' ? '76.2%' : (systemOptimized ? '99.1%' : '98.5%'), 
      label: 'System Health', 
      icon: Activity, 
      change: emergencyMode === 'emergency' ? '-22.3%' : (systemOptimized ? '+0.6%' : ''), 
      status: emergencyMode === 'emergency' ? 'critical' : 'good',
      description: 'Overall operational system health'
    },
    { 
      value: systemOptimized ? '94.7%' : '89.2%', 
      label: 'Gate Utilization', 
      icon: MapPin, 
      change: systemOptimized ? '+5.5%' : '+2.8%', 
      status: 'good',
      description: 'Percentage of gates currently in active use'
    },
    { 
      value: operationsAlert ? 'Stormy' : 'Clear', 
      label: 'Weather Status', 
      icon: Cloud, 
      change: operationsAlert ? 'Alert' : 'Stable', 
      status: operationsAlert ? 'warning' : 'good',
      description: 'Current weather conditions affecting operations'
    },
  ];

  // Bento tiles: each KPI is its own grid cell (no wrapping panel), so it
  // sits directly alongside the Digital Twin hero in one asymmetric grid
  // instead of a uniform row of look-alike cards.
  return (
    <>
      {kpiData.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
          onClick={() => onSelect(stat)}
          className={`relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-colors duration-200 group glass-pill ${
            index % 4 === 0 ? 'glass-pill-blue' :
            index % 4 === 1 ? 'glass-pill-teal' :
            index % 4 === 2 ? 'glass-pill-violet' :
            'glass-pill-neutral'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="h-4 w-4 text-accent-blue" />
            {stat.change && (
              <span className={`text-xs font-medium ${
                stat.change.startsWith('+') ? 'text-status-success' :
                stat.change.startsWith('-') ? 'text-status-error' :
                stat.change === 'Alert' ? 'text-status-warning' :
                'text-text-muted'
              }`}>
                {stat.change}
              </span>
            )}
          </div>

          <div>
            <div className="glow-text text-xl font-bold mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-text-muted leading-tight">
              {stat.label}
            </div>
          </div>

          <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${
            stat.status === 'good' ? 'bg-status-success' :
            stat.status === 'warning' ? 'bg-status-warning' :
            'bg-status-error'
          }`} style={{ display: stat.change ? 'none' : 'block' }}></div>
        </motion.div>
      ))}
    </>
  );
};

// Enhanced System Health Panel Component - ALL BACKGROUND ANIMATIONS REMOVED
const SystemHealthPanel: React.FC<{
  data: any[];
  onSystemClick: (system: any) => void;
  emergencyMode: string | null;
  operationsAlert: boolean;
  systemOptimized: boolean;
}> = ({ data, onSystemClick, emergencyMode, operationsAlert, systemOptimized }) => {
  // Used only for the small status pill — the card itself stays a neutral
  // navy tile (matching the reference), so color marks the status rather
  // than washing the whole tile.
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-status-info/15 text-status-info border-status-info/40';
      case 'operational': return 'bg-status-success/15 text-status-success border-status-success/40';
      case 'warning': return 'bg-status-warning/15 text-status-warning border-status-warning/40';
      case 'maintenance': return 'bg-accent-gold/15 text-accent-gold border-accent-gold/40';
      case 'critical': return 'bg-status-error/15 text-status-error border-status-error/40';
      default: return 'bg-primary-600/30 text-text-muted border-primary-600/50';
    }
  };

  const getSlaColor = (compliance: number) => {
    if (compliance >= 95) return 'text-status-success';
    if (compliance >= 80) return 'text-status-warning';
    return 'text-status-error';
  };

  // Whichever system is furthest from healthy earns the wide tile; if
  // everything is fine, nothing is artificially singled out.
  const worst = data.reduce((acc, s, i) => (s.uptime < data[acc].uptime ? i : acc), 0);
  const featuredIndex = data[worst]?.uptime < 95 ? worst : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden glass-panel rounded-xl p-5"
    >
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2 bg-primary-700 rounded-lg">
            <Activity className="w-5 h-5 text-accent-teal" />
          </div>
          <h3 className="text-base font-semibold text-white">System Health Monitor</h3>
          <InfoButtonWithPortal description="Real-time monitoring of all 8 critical airport systems with enhanced visual indicators" />
          {(emergencyMode || operationsAlert || systemOptimized) && (
            <div className="ml-auto flex items-center space-x-2">
              {emergencyMode && <div className="px-2.5 py-1 bg-status-error/20 text-status-error text-xs rounded-full border border-status-error/40">Emergency Mode</div>}
              {operationsAlert && <div className="px-2.5 py-1 bg-status-warning/20 text-status-warning text-xs rounded-full border border-status-warning/40">Operations Alert</div>}
              {systemOptimized && <div className="px-2.5 py-1 bg-accent-teal/20 text-accent-teal text-xs rounded-full border border-accent-teal/40">Optimized</div>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map((system, index) => {
            // The system furthest from healthy gets a wider tile — the one
            // thing on this board worth a second glance stands out by size,
            // not just by a colored badge identical in weight to the rest.
            const isFeatured = index === featuredIndex;
            return (
            <motion.div
              key={system.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => onSystemClick(system)}
              className={`relative p-4 rounded-xl cursor-pointer transition-colors duration-200 group glass-pill ${
                index % 4 === 0 ? 'glass-pill-blue' :
                index % 4 === 1 ? 'glass-pill-teal' :
                index % 4 === 2 ? 'glass-pill-violet' :
                'glass-pill-neutral'
              } ${
                isFeatured ? 'col-span-2 ring-1 ring-accent-blue/30' : ''
              }`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <system.icon className="h-4 w-4 text-text-muted" />
                    <span className="font-medium text-sm text-text-primary">{system.name}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(system.status)}`}>
                    {system.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Uptime:</span>
                    <span className={`font-semibold text-sm ${getSlaColor(system.uptime)}`}>
                      {system.uptime}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700/60 rounded-full h-3 shadow-inner overflow-hidden border border-gray-600/50">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        system.uptime >= 95 ? 'bg-status-success' :
                        system.uptime >= 80 ? 'bg-status-warning' :
                        'bg-status-error'
                      }`}
                      style={{ width: `${system.uptime}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Performance</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${
                        system.uptime >= 95 ? 'bg-status-success shadow-status-success/60' :
                        system.uptime >= 80 ? 'bg-status-warning shadow-status-warning/60' :
                        'bg-status-error shadow-status-error/60'
                      } animate-pulse`}></div>
                      <span className={`font-medium ${
                        system.uptime >= 95 ? 'text-status-success' :
                        system.uptime >= 80 ? 'text-status-warning' :
                        'text-status-error'
                      }`}>
                        {system.uptime >= 95 ? 'Excellent' : 
                         system.uptime >= 80 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Flight Operations Section with Fullscreen capability
const FlightOperationsSection: React.FC<{ onSelect: (item: any) => void }> = ({ onSelect }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const FlightStatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status.toLowerCase()) {
        case 'en route': return 'bg-accent-blue/20 text-accent-blue border-accent-blue/50';
        case 'approaching': return 'bg-status-success/20 text-status-success border-status-success/50';
        case 'boarding': return 'bg-accent-gold/20 text-accent-gold border-accent-gold/50';
        case 'pre-boarding': return 'bg-accent-purple/20 text-accent-purple border-accent-purple/50';
        case 'delayed': return 'bg-status-error/20 text-status-error border-status-error/50';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  const FlightRow = ({ flight }: { flight: any }) => (
    <motion.tr
      whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}
      className="border-b border-gray-700/50 hover:bg-teal-500/5 transition-colors duration-200"
    >
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="font-semibold text-white">{flight.flightNumber}</span>
          <span className="text-xs text-gray-400">{flight.airline}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-white">{flight.route}</span>
          <span className="text-xs text-gray-400">{flight.aircraftType}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-white">{flight.scheduledDeparture}</span>
          {flight.actualDeparture && (
            <span className="text-xs text-teal-400">Act: {flight.actualDeparture}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-white">{flight.estimatedArrival}</span>
          <span className="text-xs text-gray-400">Gate: {flight.gate}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <FlightStatusBadge status={flight.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-full bg-gray-700/50 rounded-full h-2 shadow-inner">
            <div 
              className="h-2 bg-accent-teal rounded-full transition-all duration-300"
              style={{ width: `${flight.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 min-w-[3rem]">{flight.progress}%</span>
        </div>
      </td>
    </motion.tr>
  );

  const FullscreenModal = () => (
    <AnimatePresence>
      {showFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[99999] flex justify-center items-center"
          onClick={() => setShowFullscreen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[95vw] h-[95vh] bg-primary-900 rounded-xl overflow-hidden shadow-lg border border-primary-700/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Live Flight Operations - Full View</h2>
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                  {/* Flight Statistics */}
                  <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Flight Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-pill glass-pill-teal text-center py-4 rounded-xl">
                        <div className="text-2xl font-bold text-accent-teal">5</div>
                        <div className="text-sm text-gray-400">Total Flights</div>
                      </div>
                      <div className="glass-pill glass-pill-blue text-center py-4 rounded-xl">
                        <div className="text-2xl font-bold text-status-success">3</div>
                        <div className="text-sm text-gray-400">On Time</div>
                      </div>
                      <div className="glass-pill glass-pill-violet text-center py-4 rounded-xl">
                        <div className="text-2xl font-bold text-status-warning">1</div>
                        <div className="text-sm text-gray-400">Delayed</div>
                      </div>
                      <div className="glass-pill glass-pill-neutral text-center py-4 rounded-xl">
                        <div className="text-2xl font-bold text-accent-blue">1,008</div>
                        <div className="text-sm text-gray-400">Total Passengers</div>
                      </div>
                    </div>
                  </div>

                  {/* Airport Weather */}
                  <div className="glass-panel rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Weather Conditions</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Temperature:</span>
                        <span className="text-white">28°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Visibility:</span>
                        <span className="text-white">10+ km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wind:</span>
                        <span className="text-white">SE 8 kts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pressure:</span>
                        <span className="text-white">1013 hPa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Flight Table */}
                <div className="glass-panel rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Flight</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aircraft</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Route</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Departure</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Arrival</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Passengers</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {mockFlightData.map((flight) => (
                          <motion.tr
                            key={flight.id}
                            whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.1)' }}
                            className="hover:bg-teal-500/5 transition-colors duration-200"
                          >
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white">{flight.flightNumber}</span>
                                <span className="text-xs text-gray-400">{flight.registration}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-white">{flight.aircraftType}</span>
                                <span className="text-xs text-gray-400">{flight.airline}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-white">{flight.route}</span>
                                <span className="text-xs text-gray-400">Alt: {flight.altitude}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-white">{flight.scheduledDeparture}</span>
                                {flight.actualDeparture && (
                                  <span className="text-xs text-teal-400">Act: {flight.actualDeparture}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-white">{flight.estimatedArrival}</span>
                                <span className="text-xs text-gray-400">Gate: {flight.gate}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <FlightStatusBadge status={flight.status} />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-white">{flight.passengers}</span>
                                <span className="text-xs text-gray-400">Crew: {flight.crew}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-700/50 rounded-full h-2 shadow-inner">
                                  <div 
                                    className="h-2 bg-accent-teal rounded-full transition-all duration-300"
                                    style={{ width: `${flight.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{flight.progress}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
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
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden glass-panel rounded-xl p-6"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white">Live Flight Operations</h3>
              <InfoButtonWithPortal description="Real-time tracking of all flight movements, gate assignments, and operational status with AI-powered optimization recommendations" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFullscreen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <Maximize className="w-4 h-4" />
              <span>Full Screen</span>
            </motion.button>
          </div>
          
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Flight</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Departure</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Arrival</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {mockFlightData.slice(0, 3).map((flight) => (
                    <FlightRow key={flight.id} flight={flight} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <FullscreenModal />
    </>
  );
};

// Main AOCC Dashboard Component
const AOCCDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState<string | null>(null);
  const [operationsAlert, setOperationsAlert] = useState(false);
  const [systemOptimized, setSystemOptimized] = useState(false);

  // Enhanced System Health Data with realistic values
  const systemHealthData = [
    { 
      id: 'aodb', 
      name: 'AODB', 
      status: 'operational', 
      uptime: 99.9, 
      icon: Database,
      description: 'Airport Operational Database - Central data hub for all flight and operational information'
    },
    { 
      id: 'acdm', 
      name: 'A-CDM', 
      status: 'operational', 
      uptime: 98.7, 
      icon: Activity,
      description: 'Airport Collaborative Decision Making - Coordinated flight planning and resource management'
    },
    { 
      id: 'bhs', 
      name: 'BHS', 
      status: emergencyMode === 'emergency' ? 'critical' : 'maintenance', 
      uptime: emergencyMode === 'emergency' ? 45.2 : 89.2, 
      icon: Server,
      description: 'Baggage Handling System - Automated baggage processing and tracking system'
    },
    { 
      id: 'cctv', 
      name: 'CCTV', 
      status: 'operational', 
      uptime: 100, 
      icon: Camera,
      description: 'Closed Circuit Television - Security and surveillance monitoring system'
    },
    { 
      id: 'network', 
      name: 'Network', 
      status: systemOptimized ? 'optimal' : 'operational', 
      uptime: systemOptimized ? 99.9 : 99.5, 
      icon: Wifi,
      description: 'Network Infrastructure - Core communication and data transmission systems'
    },
    { 
      id: 'power', 
      name: 'Power', 
      status: 'operational', 
      uptime: 100, 
      icon: Zap,
      description: 'Power Systems - Electrical infrastructure and backup power management'
    },
    { 
      id: 'storage', 
      name: 'Storage', 
      status: systemOptimized ? 'optimal' : 'operational', 
      uptime: systemOptimized ? 99.8 : 97.3, 
      icon: HardDrive,
      description: 'Data Storage Systems - Critical data storage and backup infrastructure'
    },
    { 
      id: 'comms', 
      name: 'Communications', 
      status: operationsAlert ? 'warning' : 'operational', 
      uptime: operationsAlert ? 94.1 : 99.1, 
      icon: Radio,
      description: 'Communication Systems - Air traffic control and ground communication networks'
    },
  ];

  const handleKPIClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSystemClick = (system: any) => {
    setSelectedItem({
      ...system,
      label: system.name,
      value: system.uptime,
      type: 'system'
    });
    setShowModal(true);
  };

  // Emergency button handlers
  const handleEmergencyResponse = () => {
    setEmergencyMode(emergencyMode === 'emergency' ? null : 'emergency');
    addToast({
      type: emergencyMode === 'emergency' ? 'info' : 'error',
      title: emergencyMode === 'emergency' ? 'Emergency Mode Deactivated' : 'Emergency Response Activated',
      message: emergencyMode === 'emergency' ? 
        'Systems returning to normal operational status.' : 
        'All systems switched to emergency protocol. Critical systems monitoring engaged.',
      duration: 5000
    });
  };

  const handleOperationsAlert = () => {
    setOperationsAlert(!operationsAlert);
    addToast({
      type: 'warning',
      title: operationsAlert ? 'Operations Alert Cleared' : 'Operations Alert Activated',
      message: operationsAlert ? 
        'All operational alerts have been cleared. Systems returning to normal.' : 
        'Operations alert issued. Communication systems showing degraded performance.',
      duration: 4000
    });
  };

  const handleSystemOptimization = () => {
    setSystemOptimized(!systemOptimized);
    addToast({
      type: 'success',
      title: systemOptimized ? 'Optimization Disabled' : 'System Optimization Enabled',
      message: systemOptimized ? 
        'System optimization disabled. Performance returning to baseline.' : 
        'AI-powered optimization enabled. Network and storage performance enhanced.',
      duration: 4000
    });
  };

  // NO CSS KEYFRAMES - Removed completely
  useEffect(() => {
    // No animation styles injected
  }, []);

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

      <div className="relative z-10 space-y-6 h-full overflow-y-auto no-scrollbar p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              U-APOC Dashboard
            </h1>
          </div>

          {/* Emergency Actions. Color is reserved for actual state here: a
              button only takes on its "active" hue once the mode it names is
              actually engaged, so idle controls read as plain, equal-weight
              actions rather than three competing accents. */}
          <div className="flex space-x-2">
            <button
              onClick={handleEmergencyResponse}
              className={`btn ${emergencyMode === 'emergency' ? 'btn-danger-active' : 'btn-danger'}`}
            >
              {emergencyMode === 'emergency' ? 'Emergency Active' : 'Emergency Response'}
            </button>

            <button
              onClick={handleOperationsAlert}
              className={`btn ${operationsAlert ? 'btn-primary' : 'btn-secondary'}`}
            >
              {operationsAlert ? 'Alert Active' : 'Operations Alert'}
            </button>

            <button
              onClick={handleSystemOptimization}
              className={`btn ${systemOptimized ? 'btn-primary' : 'btn-secondary'}`}
            >
              {systemOptimized ? 'Optimization Active' : 'System Optimization'}
            </button>
          </div>
        </div>

        {/* Cross-domain AI recommendations for the operations centre. The
            copilot drawer in the header carries the same engine for every
            other console. */}
        <AiInsightPanel domain="aocc" title="AI U-APOC Advisory" />

        {/* Bento grid: the Digital Twin is the one deliberately oversized
            tile (spanning 2 columns and all 3 rows), and the six KPI tiles
            fill the remaining cells exactly — a 4x3 grid where one tile is
            big and the rest aren't, rather than two look-alike panels side
            by side. */}
        <div className="grid grid-cols-4 [grid-auto-rows:150px] gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-xl col-span-4 lg:col-span-2 row-span-3"
          >
            <Suspense fallback={<div className="animate-pulse bg-primary-700/30 h-full rounded-xl" />}>
              <DigitalTwin />
            </Suspense>
          </motion.div>

          <KPIGrid
            emergencyMode={emergencyMode}
            operationsAlert={operationsAlert}
            systemOptimized={systemOptimized}
            onSelect={handleKPIClick}
          />
        </div>

        {/* Enhanced System Health Monitor */}
        <SystemHealthPanel
          data={systemHealthData}
          onSystemClick={handleSystemClick}
          emergencyMode={emergencyMode}
          operationsAlert={operationsAlert}
          systemOptimized={systemOptimized}
        />

        {/* Enhanced Flight Operations Table with Full Screen */}
        <FlightOperationsSection onSelect={handleKPIClick} />

        {/* Enhanced Detail Modal */}
        <DetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedItem?.label || 'AOCC Details'}
          data={{
            Overview: {
              title: selectedItem?.label || '',
              status: selectedItem?.status || 'normal',
              currentValue: selectedItem?.value || selectedItem?.uptime || 0,
              unit: selectedItem?.label?.includes('%') || selectedItem?.type === 'system' ? '%' : '',
              lastUpdated: new Date().toISOString(),
              description: selectedItem?.description || `Detailed analytics for ${selectedItem?.label || 'selected metric'}`,
              keyMetrics: selectedItem?.type === 'system' ? [
                { id: '1', name: 'Uptime', value: selectedItem?.uptime || 0, unit: '%', trend: 'stable', changePercent: 0 },
                { id: '2', name: 'Performance', value: 94.2, unit: '%', trend: 'up', changePercent: 5.2 },
                { id: '3', name: 'Alerts', value: selectedItem?.status === 'maintenance' ? 1 : 0, unit: '', trend: 'down', changePercent: -10 },
              ] : [
                { id: '1', name: 'Performance', value: 94.2, unit: '%', trend: 'up', changePercent: 5.2 },
                { id: '2', name: 'Efficiency', value: 87.8, unit: '%', trend: 'stable', changePercent: 0 },
              ],
              relatedAssets: [
                { id: '1', name: 'Control Tower', type: 'Communication', status: 'operational', location: 'Central' },
                { id: '2', name: 'Radar System', type: 'Navigation', status: 'operational', location: 'Tower' },
              ]
            }
          }}
        />
      </div>
    </motion.div>
  );
};

export default AOCCDashboard;
