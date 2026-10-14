import React, { useState } from 'react';
import { Alert, AISolution } from '../types';
import { X, Bot, User, Clock, CheckCircle, AlertTriangle, Calendar, History } from 'lucide-react';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
  newAlerts: Alert[];
  resolvedAlerts: Alert[];
  needsReviewAlerts: Alert[];
  aiSolutions: AISolution[];
  alertCountdown: Record<string, number>;
  onAlertAction: (alertId: string, action: 'ai' | 'manual' | 'ignore') => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({
  isOpen,
  onClose,
  newAlerts,
  resolvedAlerts,
  needsReviewAlerts,
  aiSolutions,
  alertCountdown,
  onAlertAction
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'resolved' | 'needs-review' | 'ai-history'>('new');

  if (!isOpen) return null;

  // Dark-theme severity tints. The original used light `bg-*-50` utilities,
  // which the simulation stylesheet flattens to one card colour, so every
  // alert looked identical regardless of how serious it was.
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/50 bg-red-950/30';
      case 'high': return 'border-simgold-500/50 bg-simgold-950/30';
      case 'medium': return 'border-simteal-500/50 bg-simteal-950/30';
      default: return 'border-sim-600/50 bg-sim-800/30';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border border-red-500/40';
      case 'high': return 'bg-simgold-500/20 text-simgold-300 border border-simgold-500/40';
      default: return 'bg-simteal-500/20 text-simteal-300 border border-simteal-500/40';
    }
  };

  const CountdownRing: React.FC<{ countdown: number }> = ({ countdown }) => {
    const circumference = 2 * Math.PI * 16;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (countdown / 10) * circumference;

    return (
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#1E3A4A"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-simgold-400">{countdown}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-morphism shadow-2xl border-l border-sim-600/50 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sim-600/50 bg-gradient-to-r from-simgold-600/20 to-red-600/20 backdrop-blur">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-bold text-sim-100">Alert Center</h2>
            <p className="text-sm text-sim-300">Intelligent Incident Management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sim-700/50 rounded-lg transition-colors text-sim-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-sim-600/50 bg-sim-800/30">
        <nav className="flex">
          {[
            { id: 'new', label: 'New', count: newAlerts.length },
            { id: 'resolved', label: 'Resolved', count: resolvedAlerts.length },
            { id: 'needs-review', label: 'Needs Review', count: needsReviewAlerts.length },
            { id: 'ai-history', label: 'AI History', count: aiSolutions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'border-simteal-400 text-simteal-400 bg-simteal-500/10'
                  : 'border-transparent text-sim-400 hover:text-sim-200 hover:border-sim-500'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-sim-900/20">
        {activeTab === 'new' && (
          <div className="p-4 space-y-4">
            {newAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sim-400">No new alerts</p>
              </div>
            ) : (
              newAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-simgold-400 flex-shrink-0" />
                        <h4 className="font-semibold text-sim-100 text-sm">{alert.title}</h4>
                        <span className={`text-[length:calc(10px*var(--fs))] uppercase tracking-wide px-2 py-0.5 rounded-full ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-sim-300 leading-snug">{alert.description}</p>
                      <p className="text-[length:calc(10px*var(--fs))] text-sim-500 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {alertCountdown[alert.id] != null && (
                      <CountdownRing countdown={alertCountdown[alert.id]} />
                    )}
                  </div>

                  {alert.aiRecommendation && (
                    <div className="bg-simteal-500/10 border border-simteal-400/30 rounded-lg p-3 mb-3">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <Bot className="w-4 h-4 text-simteal-400" />
                        <span className="text-xs font-medium text-simteal-300">Recommended action</span>
                        <span className="text-[length:calc(10px*var(--fs))] bg-simteal-500/20 text-simteal-300 px-2 py-0.5 rounded border border-simteal-400/30">
                          {alert.aiRecommendation.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-simteal-100">{alert.aiRecommendation.action}</p>
                      <div className="text-[length:calc(10px*var(--fs))] text-simteal-300/80 mt-1">
                        Impact: {alert.aiRecommendation.estimatedImpact}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAlertAction(alert.id, 'ai')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors text-xs font-medium border border-emerald-500/40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Execute plan</span>
                    </button>
                    <button
                      onClick={() => onAlertAction(alert.id, 'manual')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sim-700/70 hover:bg-sim-600 text-sim-100 rounded-lg transition-colors text-xs font-medium border border-sim-600/50"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Manual</span>
                    </button>
                    <button
                      onClick={() => onAlertAction(alert.id, 'ignore')}
                      className="px-3 py-1.5 text-sim-400 hover:text-sim-100 hover:bg-sim-700/50 rounded-lg transition-colors text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'resolved' && (
          <div className="p-4 space-y-3">
            {resolvedAlerts.length === 0 ? (
              <p className="text-center text-sim-500 text-sm py-8">Nothing resolved yet</p>
            ) : resolvedAlerts.map(alert => (
              <div key={alert.id} className="border border-emerald-500/40 bg-emerald-950/25 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-semibold text-emerald-200 text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-sim-300">{alert.description}</p>
                <div className="text-[length:calc(10px*var(--fs))] text-sim-500 mt-1.5">
                  Resolved {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'needs-review' && (
          <div className="p-4 space-y-3">
            {needsReviewAlerts.length === 0 ? (
              <p className="text-center text-sim-500 text-sm py-8">Nothing needs review</p>
            ) : needsReviewAlerts.map(alert => (
              <div key={alert.id} className="border border-simgold-500/40 bg-simgold-950/25 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-simgold-400" />
                  <h4 className="font-semibold text-simgold-200 text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-sim-300 mb-2.5">{alert.description}</p>
                <button
                  onClick={() => onAlertAction(alert.id, 'manual')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-simgold-600/80 hover:bg-simgold-600 text-white rounded-lg transition-colors text-xs font-medium border border-simgold-500/40"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule maintenance</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ai-history' && (
          <div className="p-4 space-y-3">
            {aiSolutions.length === 0 ? (
              <p className="text-center text-sim-500 text-sm py-8">No actions executed yet</p>
            ) : aiSolutions.map((solution, index) => (
              <div key={index} className="border border-simteal-500/40 bg-simteal-950/25 rounded-lg p-3.5">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <History className="w-4 h-4 text-simteal-400" />
                  <h4 className="font-semibold text-simteal-200 text-sm">Plan executed</h4>
                  <span className={`text-[length:calc(10px*var(--fs))] px-2 py-0.5 rounded-full border ${
                    solution.success
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/15 text-red-300 border-red-500/40'
                  }`}>
                    {solution.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-xs text-sim-300 mb-2">{solution.action}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    [`${solution.timeSaved} min`, 'Time saved'],
                    [`$${solution.costSaved}`, 'Cost saved'],
                    [`${solution.confidence}%`, 'Confidence'],
                  ].map(([v, l]) => (
                    <div key={l} className="text-center bg-sim-900/40 rounded-lg py-1.5 border border-sim-700/40">
                      <div className="font-semibold text-simteal-200 text-xs">{v}</div>
                      <div className="text-[length:calc(10px*var(--fs))] text-sim-500">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCenter;