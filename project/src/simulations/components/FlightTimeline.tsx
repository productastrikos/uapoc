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

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'Inbound': return <Plane className="w-3 h-3" />;
      case 'Landed': return <Activity className="w-3 h-3" />;
      case 'Taxi': return <MapPin className="w-3 h-3" />;
      case 'Parked': return <Clock className="w-3 h-3" />;
      case 'Deboard': return <Users className="w-3 h-3" />;
      case 'Cleaning': return <Zap className="w-3 h-3" />;
      case 'Boarding': return <Users className="w-3 h-3" />;
      case 'Pushback': return <Plane className="w-3 h-3" />;
      case 'Departed': return <Plane className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className="w-full">
      <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl">
        <div className="p-3 md:p-4 border-b border-primary-600/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
              <Plane className="w-5 h-5 md:w-6 md:h-6 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-text-primary">Flight Timeline</h3>
              <p className="text-sm md:text-base text-text-secondary">End-to-end flight phase tracking with AO-S automation</p>
            </div>
          </div>
        </div>

        <div className="p-3 md:p-4">
          <div className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto">
            {flights.map(flight => (
              <div key={flight.id} className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
                {/* Flight Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 space-y-3 md:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-900/50 rounded-xl flex items-center justify-center border border-primary-600/40">
                      <Plane className="w-5 h-5 md:w-6 md:h-6 text-accent-blue" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold text-text-primary">{flight.flightNumber}</h4>
                      <p className="text-sm md:text-base text-text-secondary">{flight.airline}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:items-end md:gap-1">
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Gate {flight.gate}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-text-secondary">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{flight.passengerLoad} passengers</span>
                    </div>
                  </div>
                </div>

                {/* Current Phase Status */}
                <div className="mb-3 md:mb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 space-y-2 md:space-y-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-text-secondary">Current Phase:</span>
                      <div className="flex items-center space-x-2 text-accent-blue">
                        {getPhaseIcon(flight.phase.current)}
                        <span className="text-base md:text-lg font-bold text-text-primary">{flight.phase.current}</span>
                      </div>
                    </div>
                    <span className="text-sm text-text-muted">
                      Next: <span className="text-text-secondary">{flight.phase.nextPhase}</span> in {flight.phase.estimatedTime}min
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-primary-900/50 rounded-full h-3 md:h-4 overflow-hidden border border-primary-600/40">
                      <div
                        className="h-full bg-accent-blue transition-all duration-1000"
                        style={{ width: `${flight.phase.progress}%` }}
                      />
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-text-primary drop-shadow">{Math.round(flight.phase.progress)}%</span>
                    </div>
                  </div>
                </div>

                {/* Phase Timeline */}
                <div className="mb-3 md:mb-4 overflow-x-auto">
                  <div className="flex justify-between items-center relative min-w-[600px] px-3">
                    {/* Connection Line */}
                    <div className="absolute top-6 left-8 right-8 h-0.5 bg-primary-600/40"></div>

                    {flightPhases.map((phase, index) => {
                      const currentIndex = flightPhases.indexOf(flight.phase.current);
                      const isActive = index === currentIndex;
                      const isCompleted = index < currentIndex;
                      const isNext = index === currentIndex + 1;

                      return (
                        <div
                          key={phase}
                          className={`flex flex-col items-center space-y-2 relative z-10 ${
                            isActive ? 'text-accent-blue' :
                            isCompleted ? 'text-status-success' :
                            isNext ? 'text-text-secondary' :
                            'text-text-muted'
                          } transition-all duration-500`}
                        >
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                            isActive ? 'bg-accent-blue/10 border-accent-blue' :
                            isCompleted ? 'bg-status-success/10 border-status-success' :
                            isNext ? 'bg-primary-700/40 border-primary-600' :
                            'bg-primary-800/50 border-primary-600/40'
                          }`}>
                            {getPhaseIcon(phase)}
                          </div>
                          <span className="text-xs font-medium text-center max-w-16 leading-tight">{phase}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AO-S System Automation Status */}
                <div className="bg-primary-900/50 rounded-lg p-2.5 md:p-3 border border-primary-600/40">
                  <h5 className="text-text-secondary font-semibold mb-3 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-accent-blue" />
                    <span>AO-S Automated System Responses</span>
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-status-success"></div>
                      <span className="text-xs text-text-secondary">Lighting: Manual</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-status-success"></div>
                      <span className="text-xs text-text-secondary">HVAC: Optimized</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-status-success"></div>
                      <span className="text-xs text-text-secondary">Access: Manual</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-status-success"></div>
                      <span className="text-xs text-text-secondary">Baggage: Ready</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="mt-3 grid grid-cols-3 gap-2.5 md:gap-3">
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Thermometer className="w-4 h-4 md:w-5 md:h-5 text-accent-blue" />
                    </div>
                    <div className="text-xs text-text-muted">Gate Temp</div>
                    <div className="text-sm md:text-lg font-bold text-text-primary">22.5°C</div>
                  </div>
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-status-success" />
                    </div>
                    <div className="text-xs text-text-muted">Energy Use</div>
                    <div className="text-sm md:text-lg font-bold text-text-primary">156kW</div>
                  </div>
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-accent-blue" />
                    </div>
                    <div className="text-xs text-text-muted">Efficiency</div>
                    <div className="text-sm md:text-lg font-bold text-text-primary">94%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 md:p-4 flex-1 overflow-hidden">
        <div className="space-y-4 md:space-y-6 h-full overflow-y-auto">
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline;
