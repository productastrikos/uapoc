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
      case 'critical': return 'border-status-error/40 bg-primary-800/60 hover:border-status-error/60';
      case 'high': return 'border-status-warning/40 bg-primary-800/60 hover:border-status-warning/60';
      case 'medium': return 'border-accent-blue/40 bg-primary-800/60 hover:border-accent-blue/60';
      default: return 'border-primary-600/40 bg-primary-800/60 hover:border-primary-600/60';
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
    if (probability >= 0.8) return 'text-status-error';
    if (probability >= 0.4) return 'text-status-warning';
    return 'text-status-success';
  };

  return (
    <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl h-full flex flex-col">
      <div className="p-4 border-b border-primary-600/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">AO-S Simulation Scenarios</h3>
            <p className="text-text-muted">AI-driven automation demonstrations</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Activity className="w-4 h-4 text-accent-blue" />
            <span className="text-text-muted">{scenarios.length} scenarios available</span>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-hidden">
        <div className="space-y-2 h-full overflow-y-auto no-scrollbar stagger-in">
          {scenarios.map(scenario => {
            const isRunning = runningScenarios.has(scenario.id);
            const isCompleted = completedScenarios.has(scenario.id);

            return (
              <div
                key={scenario.id}
                className={`border rounded-xl p-4 transition-colors duration-200 ${
                  isCompleted ? 'border-status-success/50 bg-primary-800/60' :
                  isRunning ? 'border-accent-blue/50 bg-primary-800/60' :
                  getImpactColor(scenario.impact)
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-3xl">{getScenarioIcon(scenario.id)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-text-primary text-lg">{scenario.name}</h4>
                        {isCompleted && <CheckCircle className="w-5 h-5 text-status-success" />}
                      </div>
                      <p className="text-text-muted mb-3 leading-relaxed">{scenario.description}</p>

                      <div className="flex flex-wrap gap-2.5 text-xs">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-primary-900/50 rounded-full border border-primary-600/40">
                          <Clock className="w-3 h-3 text-accent-blue" />
                          <span className="text-text-secondary">{scenario.estimatedDuration}min</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-primary-900/50 rounded-full border border-primary-600/40">
                          <TrendingUp className="w-3 h-3 text-accent-blue" />
                          <span className="text-text-secondary">{scenario.aiConfidence}% AI</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-primary-900/50 rounded-full border border-primary-600/40">
                          <AlertTriangle className="w-3 h-3 text-status-warning" />
                          <span className="text-text-secondary capitalize">{scenario.impact}</span>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 bg-primary-900/50 rounded-full border border-primary-600/40`}>
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
                    className={`btn min-w-[7.5rem] ${
                      isCompleted
                        ? 'bg-status-success/10 text-status-success border-status-success/30 cursor-default'
                        : isRunning
                        ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 cursor-not-allowed'
                        : 'btn-primary'
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

                {/* Metrics preview */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-4 h-4 text-status-success" />
                      <span className="text-lg font-bold text-status-success">
                        ${Math.abs(scenario.costImpact).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">Cost Impact</div>
                  </div>
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Zap className="w-4 h-4 text-accent-blue" />
                      <span className="text-lg font-bold text-accent-blue">
                        {Math.abs(scenario.energyImpact)}kW
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">Energy Impact</div>
                  </div>
                  <div className="bg-primary-900/50 border border-primary-600/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-status-warning" />
                      <span className="text-lg font-bold text-status-warning">
                        {(scenario.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">Probability</div>
                  </div>
                </div>

                {/* Running actions */}
                {isRunning && (
                  <div className="mt-3 pt-3 border-t border-accent-blue/30">
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-accent-blue mb-2">AO-S Actions Executing:</h5>
                      <div className="space-y-2">
                        {scenario.actions.slice(0, 3).map((action, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="hbms-status-dot operational"></div>
                            <span className="text-text-secondary">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-primary-900/50 rounded-full h-2 overflow-hidden">
                      <div className="bg-accent-blue h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                )}

                {/* Completion status */}
                {isCompleted && (
                  <div className="mt-3 pt-3 border-t border-status-success/30">
                    <div className="flex items-center space-x-2 text-status-success">
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