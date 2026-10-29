import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Users, Zap, Activity, Clock, AlertTriangle,
  CheckCircle, XCircle, Plane, ArrowRight, Settings,
  Monitor, RotateCcw, Eye, Target, Scan, Shield
} from 'lucide-react';
import BaggageOperations from './BaggageOperations';
import UniversalPopup from './UniversalPopup';
import { usePopup } from '../hooks/usePopup';

// Enhanced types for the overview system
interface Carousel {
  id: number;
  status: 'active' | 'inactive' | 'maintenance' | 'loading' | 'unloading';
  assignedFlight: string;
  currentLoad: number;
  maxCapacity: number;
  estimatedCompletionTime: Date | null;
  energyConsumption: number;
  uptime: number;
  lastMaintenance: Date;
  totalBagsProcessed: number;
  averageUnloadTime: number;
  alerts: string[];
}

interface SystemMetrics {
  totalBagsProcessed: number;
  bagsInSystem: number;
  averageProcessingTime: number;
  systemEfficiency: number;
  energyConsumption: number;
  activeCarousels: number;
  maintenanceAlerts: number;
  customerSatisfaction: number;
}

interface FlightSchedule {
  flightNumber: string;
  airline: string;
  type: 'departure' | 'arrival';
  scheduledTime: string;
  actualTime: string;
  gate?: string;
  carousel?: number;
  status: string;
  passengerCount: number;
  baggageCount: number;
}

const BaggageSystemOverview: React.FC = () => {
  // Navigation and view states
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'monitoring'>('overview');
  const [operationType, setOperationType] = useState<'departure' | 'arrival'>('departure');
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // System data states
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalBagsProcessed: 3247,
    bagsInSystem: 156,
    averageProcessingTime: 4.2,
    systemEfficiency: 96.8,
    energyConsumption: 2450,
    activeCarousels: 4,
    maintenanceAlerts: 1,
    customerSatisfaction: 4.6
  });

  const [carousels, setCarousels] = useState<Carousel[]>([
    {
      id: 1,
      status: 'active',
      assignedFlight: 'AI348 (BOM)',
      currentLoad: 156,
      maxCapacity: 300,
      estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000),
      energyConsumption: 450,
      uptime: 98.5,
      lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      totalBagsProcessed: 2847,
      averageUnloadTime: 3.2,
      alerts: []
    },
    {
      id: 2,
      status: 'loading',
      assignedFlight: '6E2142 (DEL)',
      currentLoad: 89,
      maxCapacity: 250,
      estimatedCompletionTime: new Date(Date.now() + 8 * 60 * 1000),
      energyConsumption: 380,
      uptime: 97.2,
      lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalBagsProcessed: 1956,
      averageUnloadTime: 2.8,
      alerts: []
    },
    {
      id: 3,
      status: 'inactive',
      assignedFlight: 'Available',
      currentLoad: 0,
      maxCapacity: 300,
      estimatedCompletionTime: null,
      energyConsumption: 120,
      uptime: 99.1,
      lastMaintenance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      totalBagsProcessed: 3421,
      averageUnloadTime: 3.5,
      alerts: []
    },
    {
      id: 4,
      status: 'maintenance',
      assignedFlight: 'Under Maintenance',
      currentLoad: 0,
      maxCapacity: 250,
      estimatedCompletionTime: new Date(Date.now() + 45 * 60 * 1000),
      energyConsumption: 0,
      uptime: 85.3,
      lastMaintenance: new Date(),
      totalBagsProcessed: 1632,
      averageUnloadTime: 4.1,
      alerts: ['Motor bearing replacement', 'Belt tension adjustment']
    },
    {
      id: 5,
      status: 'active',
      assignedFlight: 'UK955 (BLR)',
      currentLoad: 203,
      maxCapacity: 300,
      estimatedCompletionTime: new Date(Date.now() + 22 * 60 * 1000),
      energyConsumption: 520,
      uptime: 96.7,
      lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      totalBagsProcessed: 2756,
      averageUnloadTime: 3.7,
      alerts: ['High load detected']
    }
  ]);

  const [selectedCarousel, setSelectedCarousel] = useState<Carousel>(carousels[0]);
  const [flightSchedule] = useState<FlightSchedule[]>([
    {
      flightNumber: 'AI127',
      airline: 'Air India',
      type: 'departure',
      scheduledTime: '14:30',
      actualTime: '14:30',
      gate: 'A12',
      status: 'Boarding',
      passengerCount: 156,
      baggageCount: 145
    },
    {
      flightNumber: 'AI348',
      airline: 'Air India',
      type: 'arrival',
      scheduledTime: '14:15',
      actualTime: '14:12',
      carousel: 1,
      status: 'Baggage Claim',
      passengerCount: 178,
      baggageCount: 156
    },
    {
      flightNumber: '6E2142',
      airline: 'IndiGo',
      type: 'arrival',
      scheduledTime: '15:30',
      actualTime: '15:25',
      carousel: 2,
      status: 'Arrived',
      passengerCount: 134,
      baggageCount: 89
    },
    {
      flightNumber: 'UK955',
      airline: 'Vistara',
      type: 'departure',
      scheduledTime: '15:45',
      actualTime: '15:45',
      gate: 'B8',
      status: 'Check-in',
      passengerCount: 189,
      baggageCount: 203
    }
  ]);

  const { isOpen, popupData, position, openPopup, closePopup, generateSystemPopupData } = usePopup();

  // Calculated metrics
  const activeCarousels = carousels.filter(c => c.status === 'active' || c.status === 'loading').length;
  const totalMaintenanceAlerts = carousels.reduce((acc, c) => acc + c.alerts.length, 0);
  const averageUptime = carousels.reduce((acc, c) => acc + c.uptime, 0) / carousels.length;

  // Handle carousel selection
  const handleCarouselSelect = useCallback((carousel: Carousel, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCarousel(carousel);

    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };

    const popupData = generateSystemPopupData(`Carousel ${carousel.id}`, {
      ...carousel,
      coordinates: { x: carousel.id * 100, y: 200 },
      flightInfo: carousel.assignedFlight,
      loadPercentage: `${Math.round((carousel.currentLoad / carousel.maxCapacity) * 100)}%`,
      nextMaintenance: new Date(carousel.lastMaintenance.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      alertCount: carousel.alerts.length
    });

    openPopup(popupData, clickPosition);
  }, [generateSystemPopupData, openPopup]);

  // Handle simulation events from BaggageOperations
  const handleSimulationComplete = useCallback(() => {
    setSystemMetrics(prev => ({
      ...prev,
      totalBagsProcessed: prev.totalBagsProcessed + Math.floor(Math.random() * 20) + 10,
      systemEfficiency: Math.min(99.9, prev.systemEfficiency + Math.random() * 0.5)
    }));
    setLastUpdateTime(new Date());
  }, []);

  const handlePhaseChange = useCallback((phase: string, data: any) => {
    // Update system metrics based on simulation phase
    if (phase === 'screening-active') {
      setSystemMetrics(prev => ({
        ...prev,
        bagsInSystem: prev.bagsInSystem + (data.bagCount || 0)
      }));
    } else if (phase === 'completed') {
      setSystemMetrics(prev => ({
        ...prev,
        bagsInSystem: Math.max(0, prev.bagsInSystem - (data.processedBags || 0))
      }));
    }
  }, []);

  // System status update effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setCarousels(prev => prev.map(carousel => ({
        ...carousel,
        energyConsumption: carousel.status === 'active' || carousel.status === 'loading'
          ? carousel.energyConsumption + (Math.random() - 0.5) * 20
          : carousel.energyConsumption,
        currentLoad: carousel.status === 'loading' && carousel.currentLoad < carousel.maxCapacity
          ? Math.min(carousel.maxCapacity, carousel.currentLoad + Math.floor(Math.random() * 3))
          : carousel.currentLoad
      })));

      setSystemMetrics(prev => ({
        ...prev,
        bagsInSystem: Math.max(0, prev.bagsInSystem + (Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0)),
        energyConsumption: carousels.reduce((acc, c) => acc + c.energyConsumption, 0)
      }));

      setLastUpdateTime(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [carousels]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-neutral';
      case 'loading': return 'text-accent-blue';
      case 'unloading': return 'text-accent-blue';
      case 'maintenance': return 'text-status-warning';
      case 'inactive': return 'text-text-muted';
      default: return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'loading': return <ArrowRight className="w-4 h-4 animate-pulse" />;
      case 'unloading': return <Package className="w-4 h-4 animate-bounce" />;
      case 'maintenance': return <Settings className="w-4 h-4 animate-spin" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    // No min-h-screen: this panel lives inside the simulation overlay, which
    // already owns the viewport. Forcing a full screen here is what left a
    // band of empty gradient under every tab.
    <div className="w-full">
      <div className="w-full space-y-3">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-1 flex items-center space-x-2">
              <div className="p-2 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
                <Package className="h-6 w-6 text-accent-blue" />
              </div>
              <span>Baggage Handling System Overview</span>
            </h1>
            <p className="text-sm text-text-muted">
              Comprehensive baggage management and real-time monitoring · updated {lastUpdateTime.toLocaleTimeString()}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-primary-800/50 rounded-lg p-1 border border-primary-600/40">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-700/50'
              }`}
            >
              <Monitor className="w-4 h-4 inline-block mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'operations'
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-700/50'
              }`}
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Operations
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'monitoring'
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-primary-700/50'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-2" />
              Real-time
            </button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Total Processed</h3>
              <Package className="h-6 w-6 text-status-neutral" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-bold text-status-neutral">
                {systemMetrics.totalBagsProcessed.toLocaleString()}
              </p>
              <p className="text-sm text-text-muted">Bags handled today</p>
              <div className="flex items-center text-xs text-status-neutral">
                <ArrowRight className="w-3 h-3 mr-1" />
                +{Math.floor(Math.random() * 50) + 20} in last hour
              </div>
            </div>
          </div>

          <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">System Efficiency</h3>
              <Activity className="h-6 w-6 text-accent-blue" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-bold text-accent-blue">
                {systemMetrics.systemEfficiency.toFixed(2)}%
              </p>
              <p className="text-sm text-text-muted">Overall performance</p>
              <div className="w-full bg-primary-900/50 rounded-full h-2">
                <div
                  className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${systemMetrics.systemEfficiency}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Active Carousels</h3>
              <RotateCcw className={`h-6 w-6 text-accent-blue ${activeCarousels > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-bold text-accent-blue">
                {activeCarousels}/5
              </p>
              <p className="text-sm text-text-muted">Operational units</p>
              <p className="text-xs text-accent-blue">
                Avg uptime: {averageUptime.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">Maintenance</h3>
              <AlertTriangle className={`h-6 w-6 ${totalMaintenanceAlerts > 0 ? 'text-status-warning animate-pulse' : 'text-text-muted'}`} />
            </div>
            <div className="space-y-2">
              <p className={`text-2xl md:text-3xl font-bold ${totalMaintenanceAlerts > 0 ? 'text-status-warning' : 'text-status-neutral'}`}>
                {totalMaintenanceAlerts}
              </p>
              <p className="text-sm text-text-muted">Active alerts</p>
              <p className="text-xs text-text-muted">
                Next: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area - Tab Based */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Carousel Status Panel */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
                <h3 className="text-xl font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 text-accent-blue" />
                  <span>Carousel Management</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {carousels.map((carousel) => (
                    <div
                      key={carousel.id}
                      onClick={(e) => handleCarouselSelect(carousel, e)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:bg-primary-700/40 ${
                        selectedCarousel.id === carousel.id
                          ? 'border-accent-blue bg-accent-blue/10'
                          : 'border-primary-600/40 bg-primary-800/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-text-secondary">Carousel {carousel.id}</h4>
                        <div className={`flex items-center space-x-2 ${getStatusColor(carousel.status)}`}>
                          {getStatusIcon(carousel.status)}
                          <span className="text-sm capitalize">{carousel.status}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Flight:</span>
                          <span className="text-text-secondary font-medium">{carousel.assignedFlight}</span>
                        </div>

                        {carousel.status !== 'inactive' && carousel.status !== 'maintenance' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Load:</span>
                              <span className="text-accent-blue">
                                {carousel.currentLoad}/{carousel.maxCapacity}
                              </span>
                            </div>

                            <div className="w-full bg-primary-900/50 rounded-full h-2">
                              <div
                                className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(carousel.currentLoad / carousel.maxCapacity) * 100}%` }}
                              ></div>
                            </div>

                            {carousel.estimatedCompletionTime && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted">Est. completion:</span>
                                <span className="text-accent-blue">
                                  {Math.max(0, Math.floor((carousel.estimatedCompletionTime.getTime() - Date.now()) / 60000))} min left
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {carousel.alerts.length > 0 && (
                          <div className="mt-2 p-2 bg-status-warning/10 border border-status-warning/30 rounded">
                            <div className="flex items-center space-x-2 text-status-warning text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{carousel.alerts.length} alert(s)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Carousel Details */}
            <div className="space-y-3">
              <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  Carousel {selectedCarousel.id} Details
                </h3>

                <div className="space-y-3">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getStatusColor(selectedCarousel.status)}`}>
                      {selectedCarousel.status.toUpperCase()}
                    </div>
                    <p className="text-text-muted">{selectedCarousel.assignedFlight}</p>
                    {selectedCarousel.estimatedCompletionTime && (
                      <p className="text-sm text-accent-blue mt-1">
                        Estimated completion: {selectedCarousel.estimatedCompletionTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2.5 bg-primary-900/40 rounded-lg">
                      <p className="text-text-muted">Power</p>
                      <p className="text-lg font-bold text-accent-blue">
                        {selectedCarousel.energyConsumption.toFixed(1)}W
                      </p>
                    </div>
                    <div className="text-center p-2.5 bg-primary-900/40 rounded-lg">
                      <p className="text-text-muted">Uptime</p>
                      <p className="text-lg font-bold text-status-neutral">
                        {selectedCarousel.uptime.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Processed:</span>
                      <span className="text-text-primary">{selectedCarousel.totalBagsProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Avg Unload Time:</span>
                      <span className="text-text-primary">{selectedCarousel.averageUnloadTime}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Last Maintenance:</span>
                      <span className="text-text-primary">{selectedCarousel.lastMaintenance.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {selectedCarousel.alerts.length > 0 && (
                    <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-2.5">
                      <h4 className="text-status-warning font-medium mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Active Alerts
                      </h4>
                      <ul className="space-y-1 text-sm text-status-warning">
                        {selectedCarousel.alerts.map((alert, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-status-warning rounded-full mr-2"></span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-center text-xs text-text-muted border-t border-primary-600/40 pt-2.5">
                    Carousel is under {selectedCarousel.status === 'maintenance' ? 'maintenance' : 'automated'} control.
                    {selectedCarousel.status === 'maintenance' ? ' Manual operation required.' : ' Automated systems enabled.'}
                  </div>
                </div>
              </div>

              {/* Flight Schedule */}
              <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <Plane className="w-5 h-5 text-accent-blue" />
                  <span>Flight Schedule</span>
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {flightSchedule.map((flight) => (
                    <div key={flight.flightNumber} className="p-2.5 bg-primary-800/40 rounded-lg border border-primary-600/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-text-secondary">{flight.flightNumber}</h4>
                          <p className="text-xs text-text-muted">{flight.airline}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          flight.type === 'departure' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-primary-600/30 text-text-secondary'
                        }`}>
                          {flight.type}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-text-muted">Time:</span>
                          <span className="text-text-primary ml-1">{flight.scheduledTime}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">{flight.type === 'departure' ? 'Gate:' : 'Carousel:'}</span>
                          <span className="text-accent-blue ml-1">{flight.gate || flight.carousel}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Passengers:</span>
                          <span className="text-text-primary ml-1">{flight.passengerCount}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Baggage:</span>
                          <span className="text-status-neutral ml-1">{flight.baggageCount}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          flight.status === 'Boarding' || flight.status === 'Check-in' ? 'bg-accent-blue/10 text-accent-blue' :
                          flight.status === 'Arrived' || flight.status === 'Baggage Claim' ? 'bg-status-neutral/10 text-status-neutral' :
                          'bg-primary-600/30 text-text-secondary'
                        }`}>
                          {flight.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Tab - Integrated BaggageOperations Component */}
        {activeTab === 'operations' && (
          <div className="space-y-3">

            {/* What this simulation shows */}
            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <h3 className="text-base font-semibold text-text-primary flex items-center space-x-2">
                  <Target className="w-5 h-5 text-accent-blue" />
                  <span>Baggage Operations Simulation</span>
                </h3>
                <p className="text-xs text-text-muted lg:max-w-3xl lg:text-right">
                  Check-in induction → multi-tier screening → diverter sortation →{' '}
                  {operationType === 'departure' ? 'make-up and gate loading' : 'carousel delivery'}.
                  Rejected bags are pushed off the sorter deck and ride a chute down to the
                  inspection or SOP bay; the procedure beside the hall tracks each step.
                </p>
              </div>
            </div>

            {/* Integrated BaggageOperations Component */}
            <BaggageOperations
              operationType={operationType}
              onSimulationComplete={handleSimulationComplete}
              onPhaseChange={handlePhaseChange}
            />
          </div>
        )}


        {/* Real-time Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">

            {/* System Metrics Chart */}
            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-accent-blue" />
                <span>Real-time Metrics</span>
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-primary-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-accent-blue">{systemMetrics.bagsInSystem}</div>
                    <div className="text-sm text-text-muted">Bags in System</div>
                    <div className="w-full bg-primary-900/50 rounded-full h-2 mt-2">
                      <div className="bg-accent-blue h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (systemMetrics.bagsInSystem / 500) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-primary-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-accent-blue">{systemMetrics.averageProcessingTime.toFixed(1)}min</div>
                    <div className="text-sm text-text-muted">Avg Processing</div>
                    <div className="w-full bg-primary-900/50 rounded-full h-2 mt-2">
                      <div className="bg-accent-blue h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (systemMetrics.averageProcessingTime / 10) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-sm">
                  <div className="text-center p-2.5 bg-primary-900/30 rounded-lg">
                    <div className="text-lg font-bold text-accent-blue">{Math.round(systemMetrics.energyConsumption)}kW</div>
                    <div className="text-xs text-text-muted">Power Usage</div>
                  </div>
                  <div className="text-center p-2.5 bg-primary-900/30 rounded-lg">
                    <div className="text-lg font-bold text-accent-blue">{systemMetrics.customerSatisfaction}</div>
                    <div className="text-xs text-text-muted">Satisfaction</div>
                  </div>
                  <div className="text-center p-2.5 bg-primary-900/30 rounded-lg">
                    <div className="text-lg font-bold text-accent-blue">{totalMaintenanceAlerts}</div>
                    <div className="text-xs text-text-muted">Alerts</div>
                  </div>
                </div>
              </div>
            </div>



            {/* Per-carousel load, so the numbers above have somewhere to land */}
            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-accent-blue" />
                <span>Carousel Load</span>
              </h3>

              <div className="space-y-2">
                {carousels.map((c) => {
                  const pct = Math.round((c.currentLoad / c.maxCapacity) * 100);
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">
                          Carousel {c.id}
                          <span className="text-text-muted ml-2">{c.assignedFlight}</span>
                        </span>
                        <span className={getStatusColor(c.status)}>{pct}%</span>
                      </div>
                      <div className="w-full bg-primary-800/60 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            c.status === 'maintenance'
                              ? 'bg-status-warning'
                              : c.status === 'inactive'
                              ? 'bg-primary-600'
                              : 'bg-accent-blue'
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[length:calc(10px*var(--fs))] text-text-muted mt-0.5">
                        <span>{c.currentLoad}/{c.maxCapacity} bags</span>
                        <span>{c.energyConsumption.toFixed(0)} W · {c.uptime.toFixed(1)}% uptime</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-accent-blue" />
                <span>Live Activity</span>
              </h3>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                <div className="p-2.5 bg-status-neutral/10 border border-status-neutral/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></div>
                      <span className="text-sm text-status-neutral">Carousel 1 - Bag unloaded</span>
                    </div>
                    <span className="text-xs text-text-muted">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 ml-4">Flight AI348 - 156 bags remaining</p>
                </div>

                <div className="p-2.5 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse"></div>
                      <span className="text-sm text-accent-blue">Screening system - CTX online</span>
                    </div>
                    <span className="text-xs text-text-muted">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 ml-4">Departure processing active</p>
                </div>

                <div className="p-2.5 bg-status-neutral/10 border border-status-neutral/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></div>
                      <span className="text-sm text-status-neutral">Maintenance scheduled</span>
                    </div>
                    <span className="text-xs text-text-muted">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 ml-4">Carousel 4 - Motor bearing replacement</p>
                </div>

                <div className="p-2.5 bg-status-neutral/10 border border-status-neutral/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></div>
                      <span className="text-sm text-status-neutral">System optimization</span>
                    </div>
                    <span className="text-xs text-text-muted">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 ml-4">Route efficiency improved by 2.3%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Universal Popup */}
        <UniversalPopup
          isOpen={isOpen}
          data={popupData}
          onClose={closePopup}
          position={position}
        />
      </div>
    </div>
  );
};

export default BaggageSystemOverview;
