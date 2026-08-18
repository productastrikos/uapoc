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

// Prediction Card Component
const PredictionCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  detail: string;
  color: 'yellow' | 'red' | 'green';
  onClick?: () => void;
}> = ({ icon: Icon, title, detail, color, onClick }) => {
  const colorClasses = {
    yellow: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/40',
    red: 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/40',
    green: 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/40'
  };

  const iconColors = {
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    green: 'text-green-400'
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
      }}
      onClick={onClick}
      className={`relative overflow-hidden p-4 rounded-xl border cursor-pointer transition-all duration-300 group backdrop-blur-sm shadow-2xl ${colorClasses[color]}`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={`w-5 h-5 ${iconColors[color]} drop-shadow-lg`} />
          <span className={`font-semibold ${iconColors[color]}`}>{title}</span>
        </div>
        <p className="text-gray-300 text-sm">{detail}</p>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1200"></div>
      </div>
    </motion.div>
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

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {kpiData.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ 
            scale: 1.05, 
            y: -4,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
          }}
          onClick={() => onSelect(stat)}
          className="relative overflow-hidden flex flex-col justify-between text-center p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700/50 cursor-pointer hover:border-teal-500/50 transition-all duration-300 group backdrop-blur-sm min-h-[120px]"
        >
          {/* Enhanced Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="h-5 w-5 text-teal-400 group-hover:scale-110 group-hover:text-teal-300 transition-all duration-300 drop-shadow-lg" />
              {stat.change && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full shadow-lg ${
                  stat.change.startsWith('+') ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 
                  stat.change.startsWith('-') ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 
                  stat.change === 'Alert' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                  'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold text-white group-hover:text-teal-100 transition-colors duration-300 mb-2 drop-shadow-md">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-tight font-medium">
                {stat.label}
              </div>
            </div>
            
            <div className={`mt-3 w-3 h-3 rounded-full mx-auto shadow-lg ${
              stat.status === 'good' ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-400/50' : 
              stat.status === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-yellow-400/50' : 
              'bg-gradient-to-r from-red-400 to-red-500 shadow-red-400/50'
            }`}></div>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </motion.div>
      ))}
    </div>
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'operational': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'maintenance': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSlaColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-400';
    if (compliance >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-2xl p-8 border border-primary-700/50 shadow-2xl backdrop-blur-sm"
      style={{
        boxShadow: "0 0 20px 5px rgba(34, 197, 94, 0.4), 0 0 40px 10px rgba(168, 85, 247, 0.3), 0 0 60px 15px rgba(59, 130, 246, 0.2)"
      }}
    >
      {/* COMPLETELY STATIC BACKGROUND - NO ANIMATIONS */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-gray-900/40 to-gray-800/30 rounded-2xl opacity-60"></div>
      
      {/* STATIC GLOWING ORBS - NO ANIMATIONS */}
      <div className="absolute top-8 left-12 w-40 h-40 bg-gradient-to-r from-cyan-500/30 via-teal-500/20 to-blue-500/30 rounded-full blur-3xl opacity-70"></div>
      <div className="absolute bottom-8 right-12 w-32 h-32 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-red-500/30 rounded-full blur-2xl opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-yellow-500/30 via-orange-500/20 to-red-500/30 rounded-full blur-xl opacity-50"></div>
      <div className="absolute top-1/4 right-1/3 w-28 h-28 bg-gradient-to-r from-green-500/25 via-emerald-500/15 to-teal-500/25 rounded-full blur-xl opacity-55"></div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-cyan-500/40 to-blue-600/30 rounded-xl shadow-lg backdrop-blur-sm">
            <Activity className="w-8 h-8 text-cyan-400 drop-shadow-lg" />
          </div>
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">Enhanced System Health Monitor</h3>
          <InfoButtonWithPortal description="Real-time monitoring of all 8 critical airport systems with enhanced visual indicators" />
          {(emergencyMode || operationsAlert || systemOptimized) && (
            <div className="ml-auto flex items-center space-x-3">
              {emergencyMode && <div className="px-3 py-1 bg-red-500/30 text-red-300 text-sm rounded-full animate-pulse shadow-lg border border-red-400/50">Emergency Mode</div>}
              {operationsAlert && <div className="px-3 py-1 bg-yellow-500/30 text-yellow-300 text-sm rounded-full animate-pulse shadow-lg border border-yellow-400/50">Operations Alert</div>}
              {systemOptimized && <div className="px-3 py-1 bg-blue-500/30 text-blue-300 text-sm rounded-full animate-pulse shadow-lg border border-blue-400/50">Optimized</div>}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.map((system, index) => (
            <motion.div
              key={system.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.08, 
                y: -6, 
                boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.4)" 
              }}
              onClick={() => onSystemClick(system)}
              className={`relative overflow-hidden p-6 rounded-2xl border-2 cursor-pointer transition-all duration-500 group hover:shadow-2xl backdrop-blur-sm ${getStatusColor(system.status)}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <system.icon className="h-6 w-6 group-hover:scale-110 transition-transform drop-shadow-sm" />
                    <span className="font-bold text-base drop-shadow-sm">{system.name}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 shadow-lg ${getStatusColor(system.status)}`}>
                    {system.status}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Uptime:</span>
                    <span className={`font-bold text-lg drop-shadow-sm ${getSlaColor(system.uptime)}`}>
                      {system.uptime}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700/60 rounded-full h-3 shadow-inner overflow-hidden border border-gray-600/50">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 shadow-lg relative ${
                        system.uptime >= 95 ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' : 
                        system.uptime >= 80 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600' : 
                        'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                      }`}
                      style={{ width: `${system.uptime}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-2000"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Performance</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${
                        system.uptime >= 95 ? 'bg-green-500 shadow-green-400/60' : 
                        system.uptime >= 80 ? 'bg-yellow-500 shadow-yellow-400/60' : 
                        'bg-red-500 shadow-red-400/60'
                      } animate-pulse`}></div>
                      <span className={`font-medium ${
                        system.uptime >= 95 ? 'text-green-400' : 
                        system.uptime >= 80 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {system.uptime >= 95 ? 'Excellent' : 
                         system.uptime >= 80 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Multi-layer shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/8 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-2000" style={{animationDelay: '0.5s'}}></div>
              </div>
            </motion.div>
          ))}
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
        case 'en route': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        case 'approaching': return 'bg-green-500/20 text-green-400 border-green-500/50';
        case 'boarding': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        case 'pre-boarding': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
        case 'delayed': return 'bg-red-500/20 text-red-400 border-red-500/50';
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
              className="h-2 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-300"
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
            className="w-[95vw] h-[95vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl border border-teal-500/30"
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
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-600/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Flight Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-400">5</div>
                        <div className="text-sm text-gray-400">Total Flights</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">3</div>
                        <div className="text-sm text-gray-400">On Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">1</div>
                        <div className="text-sm text-gray-400">Delayed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">1,008</div>
                        <div className="text-sm text-gray-400">Total Passengers</div>
                      </div>
                    </div>
                  </div>

                  {/* Airport Weather */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-600/50">
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
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-600/50 overflow-hidden">
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
                                    className="h-2 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-300"
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
        className="relative overflow-hidden bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-700/50 shadow-2xl backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-teal-600/5 rounded-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Live Flight Operations</h3>
              <InfoButtonWithPortal description="Real-time tracking of all flight movements, gate assignments, and operational status with AI-powered optimization recommendations" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFullscreen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-lg shadow-lg transition-all duration-300 font-medium"
            >
              <Maximize className="w-4 h-4" />
              <span>Full Screen</span>
            </motion.button>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 overflow-hidden">
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

        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1200"></div>
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
      {/* Enhanced Background with Irregular Live Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black"></div>
        {/* Multiple animated irregular gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/40 via-blue-600/30 to-teal-600/40 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-600/40 via-purple-600/30 to-blue-600/40 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-teal-600/40 via-green-600/30 to-blue-600/40 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/2 w-64 h-64 bg-gradient-to-r from-orange-600/40 via-red-600/30 to-pink-600/40 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>

      <div className="relative z-10 space-y-8 h-full overflow-y-auto no-scrollbar p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              U-APOC Dashboard
            </h1>
          </div>
          
          {/* Enhanced Emergency Actions */}
          <div className="flex space-x-3">
            <motion.button 
              onClick={handleEmergencyResponse}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                emergencyMode === 'emergency' 
                  ? 'bg-gradient-to-r from-red-700 via-red-600 to-pink-700 animate-pulse' 
                  : 'bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-700 hover:via-red-600 hover:to-pink-700'
              } text-white hover:shadow-red-500/50`}
            >
              {emergencyMode === 'emergency' ? 'Emergency Active' : 'Emergency Response'}
            </motion.button>
            
            <motion.button 
              onClick={handleOperationsAlert}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                operationsAlert 
                  ? 'bg-gradient-to-r from-orange-700 via-yellow-600 to-amber-700 animate-pulse' 
                  : 'bg-gradient-to-r from-orange-600 via-yellow-500 to-amber-600 hover:from-orange-700 hover:via-yellow-600 hover:to-amber-700'
              } text-white hover:shadow-orange-500/50`}
            >
              {operationsAlert ? 'Alert Active' : 'Operations Alert'}
            </motion.button>
            
            <motion.button 
              onClick={handleSystemOptimization}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all duration-300 transform shadow-2xl font-medium ${
                systemOptimized 
                  ? 'bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-700 animate-pulse' 
                  : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-700'
              } text-white hover:shadow-blue-500/50`}
            >
              {systemOptimized ? 'Optimization Active' : 'System Optimization'}
            </motion.button>
          </div>
        </div>

        {/* AI AOCC Predictions Panel */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-500/30 shadow-2xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-purple-600/20 rounded-xl blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-purple-400 drop-shadow-lg" />
              <h2 className="text-xl font-bold text-white drop-shadow-lg">AI U-APOC Predictions</h2>
              <InfoButtonWithPortal description="AI-powered predictions and recommendations for airport operations, weather impacts, and system optimization" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PredictionCard
                icon={AlertTriangle}
                title="Weather Impact Alert"
                detail="Thunderstorm system approaching from southeast may cause 45-minute delays starting 16:30"
                color="yellow"
                onClick={() => handleKPIClick({ name: "Weather Impact", value: "High", label: "Weather Impact Risk" })}
              />
              <PredictionCard
                icon={CheckCircle}
                title="Runway Optimization"
                detail="AI suggests runway 09/27 configuration for 18% efficiency improvement"
                color="green"
                onClick={() => handleKPIClick({ name: "Runway Optimization", value: "Available", label: "Runway Optimization" })}
              />
              <PredictionCard
                icon={Activity}
                title="System Performance"
                detail="All U-APOC systems operating at 98.7% efficiency with predictive maintenance scheduled"
                color="green"
                onClick={() => handleKPIClick({ name: "System Performance", value: "Optimal", label: "System Performance" })}
              />
            </div>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1200"></div>
          </div>
        </motion.div>

        {/* Digital Twin & KPI Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          {/* Left Side - Digital Twin */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-700/50 shadow-xl backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 via-transparent to-blue-600/10 rounded-xl"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white drop-shadow-md"> Digital Twin</h3>
                <InfoButtonWithPortal description="Real-time 3D visualization of airport operations synchronized with live operational data, passenger flow, and system status" />
              </div>
              <div className="flex-1">
                <Suspense fallback={<div className="animate-pulse bg-primary-700/30 h-full rounded-lg" />}>
                  <DigitalTwin />
                </Suspense>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1200"></div>
            </div>
          </motion.div>

          {/* Right Side - Enhanced KPI Cards */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-primary-800/50 to-primary-900/50 rounded-xl p-6 border border-primary-700/50 shadow-xl backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-teal-600/10 rounded-xl"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-xl font-bold text-white drop-shadow-md">Key Performance Indicators</h3>
                <InfoButtonWithPortal description="Real-time operational metrics and performance indicators for critical airport functions" />
              </div>
              
              <div className="flex-1">
                <KPIGrid
                  emergencyMode={emergencyMode}
                  operationsAlert={operationsAlert}
                  systemOptimized={systemOptimized}
                  onSelect={handleKPIClick}
                />
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1200"></div>
            </div>
          </motion.div>
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
