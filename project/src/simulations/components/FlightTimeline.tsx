import React, { useState, useEffect } from 'react';
import { FlightInfo } from '../types';
import { Plane, Clock, Users, MapPin, Zap, Thermometer, Activity } from 'lucide-react';

interface FlightTimelineProps {
  flights?: FlightInfo[];
}

const FlightTimeline: React.FC<FlightTimelineProps> = ({ flights: propFlights }) => {
  const [flights, setFlights] = useState<FlightInfo[]>(propFlights || [
    {
      id: '1',
      flightNumber: 'AI127',
      airline: 'Air India',
      gate: 'A2',
      scheduledTime: '14:30',
      status: 'parked',
      passengerLoad: 156,
      phase: { current: 'Parked', progress: 75, nextPhase: 'Deboard', estimatedTime: 3 }
    },
    {
      id: '2',
      flightNumber: 'BA200',
      airline: 'British Airways',
      gate: 'B1',
      scheduledTime: '15:45',
      status: 'boarding',
      passengerLoad: 250,
      phase: { current: 'Boarding', progress: 60, nextPhase: 'Pushback', estimatedTime: 15 }
    },
    {
      id: '3',
      flightNumber: 'DL350',
      airline: 'Delta',
      gate: 'C3',
      scheduledTime: '16:20',
      status: 'scheduled',
      passengerLoad: 195,
      phase: { current: 'Inbound', progress: 25, nextPhase: 'Landed', estimatedTime: 45 }
    }
  ]);

  const flightPhases = [
    'Inbound', 'Landed', 'Taxi', 'Parked', 'Deboard', 'Cleaning', 'Boarding', 'Pushback', 'Departed'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFlights(prev => prev.map(flight => {
        const currentPhaseIndex = flightPhases.indexOf(flight.phase.current);
        let newProgress = flight.phase.progress + Math.random() * 5;
        let newPhase = flight.phase.current;
        let nextPhase = flight.phase.nextPhase;
        let estimatedTime = flight.phase.estimatedTime;

        if (newProgress >= 100 && currentPhaseIndex < flightPhases.length - 1) {
          newProgress = 0;
          newPhase = flightPhases[currentPhaseIndex + 1];
          nextPhase = currentPhaseIndex + 2 < flightPhases.length 
            ? flightPhases[currentPhaseIndex + 2] 
            : 'Complete';
          estimatedTime = Math.floor(Math.random() * 30) + 10;
        }

        return {
          ...flight,
          phase: {
            current: newPhase,
            progress: Math.min(100, newProgress),
            nextPhase,
            estimatedTime: Math.max(1, estimatedTime - 1)
          }
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Inbound': return 'from-simteal-600 to-simteal-500';
      case 'Landed': return 'from-emerald-600 to-emerald-500';
      case 'Taxi': return 'from-simgold-600 to-simgold-500';
      case 'Parked': return 'from-simgold-600 to-simgold-500';
      case 'Deboard': return 'from-simgold-600 to-simgold-500';
      case 'Cleaning': return 'from-pink-600 to-pink-500';
      case 'Boarding': return 'from-simteal-600 to-simteal-500';
      case 'Pushback': return 'from-red-600 to-red-500';
      case 'Departed': return 'from-sim-600 to-sim-500';
      default: return 'from-sim-600 to-sim-500';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'Inbound': return <Plane className="w-3 h-3 text-simteal-400" />;
      case 'Landed': return <Activity className="w-3 h-3 text-emerald-400" />;
      case 'Taxi': return <MapPin className="w-3 h-3 text-simgold-400" />;
      case 'Parked': return <Clock className="w-3 h-3 text-simgold-400" />;
      case 'Deboard': return <Users className="w-3 h-3 text-simgold-400" />;
      case 'Cleaning': return <Zap className="w-3 h-3 text-pink-400" />;
      case 'Boarding': return <Users className="w-3 h-3 text-simteal-400" />;
      case 'Pushback': return <Plane className="w-3 h-3 text-red-400" />;
      case 'Departed': return <Plane className="w-3 h-3 text-sim-400" />;
      default: return <Activity className="w-3 h-3 text-sim-400" />;
    }
  };

  return (
    <div className="w-full">
      <div className="glass-card border border-sim-700/50 rounded-xl shadow-2xl">
        <div className="p-4 md:p-6 border-b border-sim-700/50 bg-gradient-to-r from-sim-800/50 to-sim-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-simteal-600/20 rounded-lg border border-simteal-500/30">
              <Plane className="w-5 h-5 md:w-6 md:h-6 text-simteal-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-sim-100">Flight Timeline</h3>
              <p className="text-sm md:text-base text-sim-300">End-to-end flight phase tracking with AO-S automation</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto">
            {flights.map(flight => (
              <div key={flight.id} className="hbms-control-panel p-4 md:p-6">
                {/* Flight Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-sim-800/80 rounded-xl flex items-center justify-center border border-sim-600/50">
                      <Plane className="w-5 h-5 md:w-6 md:h-6 text-simteal-400" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold text-sim-100">{flight.flightNumber}</h4>
                      <p className="text-sm md:text-base text-sim-300">{flight.airline}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:flex md:flex-col md:items-end md:gap-1">
                    <div className="flex items-center space-x-2 text-sim-300">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Gate {flight.gate}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sim-300">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{flight.passengerLoad} passengers</span>
                    </div>
                  </div>
                </div>

                {/* Current Phase Status */}
                <div className="mb-4 md:mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 space-y-2 md:space-y-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-sim-300">Current Phase:</span>
                      <div className="flex items-center space-x-2">
                        {getPhaseIcon(flight.phase.current)}
                        <span className="text-base md:text-lg font-bold text-sim-100">{flight.phase.current}</span>
                      </div>
                    </div>
                    <span className="text-sm text-sim-400">
                      Next: <span className="text-sim-200">{flight.phase.nextPhase}</span> in {flight.phase.estimatedTime}min
                    </span>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-sim-800/50 rounded-full h-3 md:h-4 overflow-hidden border border-sim-700/50">
                      <div
                        className={`h-full bg-gradient-to-r ${getPhaseColor(flight.phase.current)} transition-all duration-1000 relative`}
                        style={{ width: `${flight.phase.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-white drop-shadow-lg">{Math.round(flight.phase.progress)}%</span>
                    </div>
                  </div>
                </div>

                {/* Phase Timeline */}
                <div className="mb-4 md:mb-6 overflow-x-auto">
                  <div className="flex justify-between items-center relative min-w-[600px] px-4">
                    {/* Connection Line */}
                    <div className="absolute top-6 left-8 right-8 h-0.5 bg-sim-700/50"></div>
                    
                    {flightPhases.map((phase, index) => {
                      const currentIndex = flightPhases.indexOf(flight.phase.current);
                      const isActive = index === currentIndex;
                      const isCompleted = index < currentIndex;
                      const isNext = index === currentIndex + 1;
                      
                      return (
                        <div
                          key={phase}
                          className={`flex flex-col items-center space-y-2 relative z-10 ${
                            isActive ? 'text-simteal-400 scale-110' : 
                            isCompleted ? 'text-emerald-400' : 
                            isNext ? 'text-simgold-400' :
                            'text-sim-500'
                          } transition-all duration-500`}
                        >
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                            isActive ? 'bg-simteal-600/20 border-simteal-400 shadow-lg shadow-simteal-500/30' :
                            isCompleted ? 'bg-emerald-600/20 border-emerald-400' :
                            isNext ? 'bg-simgold-600/20 border-simgold-400' :
                            'bg-sim-800/50 border-sim-600'
                          }`}>
                            {getPhaseIcon(phase)}
                          </div>
                          <span className="text-xs font-medium text-center max-w-16 leading-tight">{phase}</span>
                          
                          {/* Pulse animation for active phase */}
                          {isActive && (
                            <div className="absolute inset-0 rounded-full border-2 border-simteal-400 animate-ping opacity-30"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AO-S System Automation Status */}
                <div className="bg-sim-900/30 rounded-lg p-3 md:p-4 border border-sim-700/50">
                  <h5 className="text-sim-200 font-semibold mb-3 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-simteal-400" />
                    <span>AO-S Automated System Responses</span>
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="hbms-status-dot operational"></div>
                      <span className="text-xs text-sim-300">Lighting: Manual</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="hbms-status-dot operational"></div>
                      <span className="text-xs text-sim-300">HVAC: Optimized</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="hbms-status-dot operational"></div>
                      <span className="text-xs text-sim-300">Access: Manual</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="hbms-status-dot operational"></div>
                      <span className="text-xs text-sim-300">Baggage: Ready</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-3 md:gap-4">
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Thermometer className="w-4 h-4 md:w-5 md:h-5 text-simteal-400" />
                    </div>
                    <div className="text-xs text-sim-400">Gate Temp</div>
                    <div className="text-sm md:text-lg font-bold text-sim-100">22.5°C</div>
                  </div>
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    </div>
                    <div className="text-xs text-sim-400">Energy Use</div>
                    <div className="text-sm md:text-lg font-bold text-sim-100">156kW</div>
                  </div>
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-simgold-400" />
                    </div>
                    <div className="text-xs text-sim-400">Efficiency</div>
                    <div className="text-sm md:text-lg font-bold text-sim-100">94%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 flex-1 overflow-hidden">
        <div className="space-y-6 md:space-y-8 h-full overflow-y-auto">
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline;