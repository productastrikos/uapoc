import React, { useState } from 'react';
import { SimulationScenario } from '../types';
import { Play, Clock, TrendingUp, DollarSign, Zap, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface ScenarioGridProps {
  scenarios: SimulationScenario[];
  category: string;
}

const ScenarioGrid: React.FC<ScenarioGridProps> = ({ scenarios, category }) => {
  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set());
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());

  const handleRunScenario = (scenario: SimulationScenario) => {
    setRunningScenarios(prev => new Set(prev).add(scenario.id));
    
    // Simulate scenario execution
    setTimeout(() => {
      setRunningScenarios(prev => {
        const newSet = new Set(prev);
        newSet.delete(scenario.id);
        return newSet;
      });
      
      setCompletedScenarios(prev => new Set(prev).add(scenario.id));
      
      // Auto-remove from completed after some time
      setTimeout(() => {
        setCompletedScenarios(prev => {
          const newSet = new Set(prev);
          newSet.delete(scenario.id);
          return newSet;
        });
      }, 5000);
    }, scenario.estimatedDuration * 100); // Scale down for demo
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-red-500/40 bg-red-950/30 hover:border-red-400/60 shadow-red-500/20';
      case 'high': return 'border-simgold-500/40 bg-simgold-950/30 hover:border-simgold-400/60 shadow-simgold-500/20';
      case 'medium': return 'border-simteal-500/40 bg-simteal-950/30 hover:border-simteal-400/60 shadow-simteal-500/20';
      default: return 'border-sim-600/40 bg-sim-900/30 hover:border-sim-500/60 shadow-sim-500/10';
    }
  };

  const getScenarioIcon = (id: string) => {
    if (id.includes('flight')) return '✈️';
    if (id.includes('security')) return '🔒';
    if (id.includes('energy')) return '⚡';
    if (id.includes('baggage')) return '🧳';
    if (id.includes('passenger')) return '🚶';
    if (id.includes('maintenance')) return '🔧';
    if (id.includes('retail')) return '🛍️';
    if (id.includes('sustainability')) return '🌱';
    return '📊';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-400';
    if (probability >= 0.6) return 'text-simgold-400';
    if (probability >= 0.4) return 'text-simgold-400';
    return 'text-emerald-400';
  };

  return (
    <div className="glass-card border border-sim-700/50 rounded-xl shadow-2xl h-full flex flex-col">
      <div className="p-6 border-b border-sim-700/50 bg-gradient-to-r from-sim-800/50 to-sim-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-sim-100">AO-S Simulation Scenarios</h3>
            <p className="text-sim-300">AI-driven automation demonstrations</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Activity className="w-4 h-4 text-simteal-400" />
            <span className="text-sim-300">{scenarios.length} scenarios available</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-hidden">
        <div className="space-y-3 h-full overflow-y-auto no-scrollbar">
          {scenarios.map(scenario => {
            const isRunning = runningScenarios.has(scenario.id);
            const isCompleted = completedScenarios.has(scenario.id);
            
            return (
              <div
                key={scenario.id}
                className={`border-2 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  isCompleted ? 'border-emerald-500/50 bg-emerald-950/30 shadow-emerald-500/20' :
                  isRunning ? 'border-simteal-500/50 bg-simteal-950/30 shadow-simteal-500/30' : 
                  getImpactColor(scenario.impact)
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-3xl">{getScenarioIcon(scenario.id)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-sim-100 text-lg">{scenario.name}</h4>
                        {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <p className="text-sim-300 mb-3 leading-relaxed">{scenario.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-sim-800/50 rounded-full border border-sim-700/50">
                          <Clock className="w-3 h-3 text-simteal-400" />
                          <span className="text-sim-300">{scenario.estimatedDuration}min</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-sim-800/50 rounded-full border border-sim-700/50">
                          <TrendingUp className="w-3 h-3 text-simteal-400" />
                          <span className="text-sim-300">{scenario.aiConfidence}% AI</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-sim-800/50 rounded-full border border-sim-700/50">
                          <AlertTriangle className="w-3 h-3 text-simgold-400" />
                          <span className="text-sim-300 capitalize">{scenario.impact}</span>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 bg-sim-800/50 rounded-full border border-sim-700/50`}>
                          <div className={`w-2 h-2 rounded-full ${getProbabilityColor(scenario.probability)}`}></div>
                          <span className={`${getProbabilityColor(scenario.probability)}`}>
                            {(scenario.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRunScenario(scenario)}
                    disabled={isRunning || isCompleted}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 min-w-[100px] justify-center ${
                      isCompleted
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : isRunning
                        ? 'bg-simteal-900/30 text-simteal-400 cursor-not-allowed border border-simteal-500/30'
                        : 'bg-gradient-to-r from-simteal-600 to-simgold-600 text-white hover:from-simteal-700 hover:to-simgold-700 hover:shadow-xl border border-simteal-500/30'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </>
                    ) : isRunning ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Running</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Execute</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Enhanced Metrics Preview */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-lg font-bold text-emerald-400">
                        ${Math.abs(scenario.costImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-sim-400">Cost Impact</div>
                  </div>
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Zap className="w-4 h-4 text-simteal-400" />
                      <span className="text-lg font-bold text-simteal-400">
                        {Math.abs(scenario.energyImpact)}kW
                      </span>
                    </div>
                    <div className="text-xs text-sim-400">Energy Impact</div>
                  </div>
                  <div className="hbms-metric-card p-3 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-simgold-400" />
                      <span className="text-lg font-bold text-simgold-400">
                        {(scenario.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-sim-400">Probability</div>
                  </div>
                </div>

                {/* Running Animation with Actions */}
                {isRunning && (
                  <div className="mt-4 pt-4 border-t border-simteal-500/30">
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-simteal-300 mb-2">AO-S Actions Executing:</h5>
                      <div className="space-y-2">
                        {scenario.actions.slice(0, 3).map((action, index) => (
                          <div key={index} className="flex items-center space-x-3 text-sm">
                            <div className="hbms-status-dot operational animate-pulse"></div>
                            <span className="text-sim-200">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="w-full bg-sim-800/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-simteal-500 to-simgold-500 h-2 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Completion Status */}
                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/30">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Scenario executed successfully</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScenarioGrid;