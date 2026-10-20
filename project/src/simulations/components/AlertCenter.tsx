import React, { useState } from 'react';
import { Alert, AISolution } from '../types';
import { X, Bot, User, CheckCircle, AlertTriangle, Calendar, History } from 'lucide-react';

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-status-error/40 bg-primary-800/60';
      case 'high': return 'border-status-warning/40 bg-primary-800/60';
      case 'medium': return 'border-accent-blue/40 bg-primary-800/60';
      default: return 'border-primary-600/40 bg-primary-800/60';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-status-error/10 text-status-error border border-status-error/30';
      case 'high': return 'bg-status-warning/10 text-status-warning border border-status-warning/30';
      default: return 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30';
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
            stroke="#0A3A52"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-status-warning">{countdown}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 modal-surface shadow-2xl border-l border-primary-600/40 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary-600/40 bg-primary-800">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-status-warning" />
          <div>
            <h2 className="text-lg font-bold text-text-primary">Alert Center</h2>
            <p className="text-sm text-text-muted">Intelligent Incident Management</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-primary-700/50 rounded-lg transition-colors text-text-muted hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-primary-600/40 bg-primary-800/30">
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
              className={`flex-1 py-2.5 px-2 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-primary-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-status-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-primary-900/20">
        {activeTab === 'new' && (
          <div className="p-3 space-y-3">
            {newAlerts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-status-success mx-auto mb-3" />
                <p className="text-text-muted">No new alerts</p>
              </div>
            ) : (
              newAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />
                        <h4 className="font-semibold text-text-primary text-sm">{alert.title}</h4>
                        <span className={`text-[length:calc(10px*var(--fs))] uppercase tracking-wide px-2 py-0.5 rounded-full ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted leading-snug">{alert.description}</p>
                      <p className="text-[length:calc(10px*var(--fs))] text-text-muted/70 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {alertCountdown[alert.id] != null && (
                      <CountdownRing countdown={alertCountdown[alert.id]} />
                    )}
                  </div>

                  {alert.aiRecommendation && (
                    <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-2.5 mb-3">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <Bot className="w-4 h-4 text-accent-blue" />
                        <span className="text-xs font-medium text-accent-blue">Recommended action</span>
                        <span className="text-[length:calc(10px*var(--fs))] bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded border border-accent-blue/30">
                          {alert.aiRecommendation.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-text-primary">{alert.aiRecommendation.action}</p>
                      <div className="text-[length:calc(10px*var(--fs))] text-text-muted mt-1">
                        Impact: {alert.aiRecommendation.estimatedImpact}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAlertAction(alert.id, 'ai')}
                      className="btn btn-primary"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Execute plan</span>
                    </button>
                    <button
                      onClick={() => onAlertAction(alert.id, 'manual')}
                      className="btn btn-secondary"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Manual</span>
                    </button>
                    <button
                      onClick={() => onAlertAction(alert.id, 'ignore')}
                      className="px-2.5 py-1.5 text-text-muted hover:text-text-primary hover:bg-primary-700/50 rounded-lg transition-colors text-xs"
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
          <div className="p-3 space-y-2">
            {resolvedAlerts.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-6">Nothing resolved yet</p>
            ) : resolvedAlerts.map(alert => (
              <div key={alert.id} className="border border-status-success/40 bg-primary-800/60 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <h4 className="font-semibold text-text-primary text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-text-muted">{alert.description}</p>
                <div className="text-[length:calc(10px*var(--fs))] text-text-muted mt-1.5">
                  Resolved {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'needs-review' && (
          <div className="p-3 space-y-2">
            {needsReviewAlerts.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-6">Nothing needs review</p>
            ) : needsReviewAlerts.map(alert => (
              <div key={alert.id} className="border border-status-warning/40 bg-primary-800/60 rounded-lg p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-status-warning" />
                  <h4 className="font-semibold text-text-primary text-sm">{alert.title}</h4>
                </div>
                <p className="text-xs text-text-muted mb-2.5">{alert.description}</p>
                <button
                  onClick={() => onAlertAction(alert.id, 'manual')}
                  className="btn btn-primary"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule maintenance</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ai-history' && (
          <div className="p-3 space-y-2">
            {aiSolutions.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-6">No actions executed yet</p>
            ) : aiSolutions.map((solution, index) => (
              <div key={index} className="border border-accent-blue/40 bg-primary-800/60 rounded-lg p-3.5">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <History className="w-4 h-4 text-accent-blue" />
                  <h4 className="font-semibold text-text-primary text-sm">Plan executed</h4>
                  <span className={`text-[length:calc(10px*var(--fs))] px-2 py-0.5 rounded-full border ${
                    solution.success
                      ? 'bg-status-success/15 text-status-success border-status-success/40'
                      : 'bg-status-error/15 text-status-error border-status-error/40'
                  }`}>
                    {solution.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-2">{solution.action}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    [`${solution.timeSaved} min`, 'Time saved'],
                    [`$${solution.costSaved}`, 'Cost saved'],
                    [`${solution.confidence}%`, 'Confidence'],
                  ].map(([v, l]) => (
                    <div key={l} className="text-center bg-primary-900/40 rounded-lg py-1.5 border border-primary-700/40">
                      <div className="font-semibold text-accent-blue text-xs">{v}</div>
                      <div className="text-[length:calc(10px*var(--fs))] text-text-muted">{l}</div>
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
