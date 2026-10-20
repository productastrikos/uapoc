import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Brain, Play, Eye, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetailModal as DetailModalType } from '../../types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Partial<DetailModalType>;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data }) => {
  const [activeTab, setActiveTab] = useState<keyof DetailModalType>('Overview');

  const tabs = [
    { key: 'Overview', label: 'Overview', icon: FileText },
    { key: 'TrendsAnalysis', label: 'Trends & Analysis', icon: TrendingUp },
    { key: 'AIInsights', label: 'AI Insights', icon: Brain },
    { key: 'ActionItems', label: 'Action Items', icon: Play },
    { key: 'Evidence', label: 'Evidence & Audit', icon: Shield },
  ];

  const mockHistoricalData = [
    { time: '00:00', value: 85 },
    { time: '04:00', value: 87 },
    { time: '08:00', value: 92 },
    { time: '12:00', value: 89 },
    { time: '16:00', value: 91 },
    { time: '20:00', value: 88 },
  ];

  const renderOverview = () => {
    const overview = data.Overview || {
      title,
      status: 'normal' as const,
      currentValue: 0,
      unit: '',
      lastUpdated: new Date().toISOString(),
      description: 'No description available',
      keyMetrics: [],
      relatedAssets: []
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${
            overview.status === 'normal' ? 'bg-status-neutral' :
            overview.status === 'warning' ? 'bg-status-warning' : 'bg-status-error'
          }`} />
          <div>
            <h3 className="text-2xl font-bold text-text-primary">{overview.title}</h3>
            <p className="text-text-muted">Last updated: {new Date(overview.lastUpdated).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-lg p-3">
            <div className="text-3xl font-bold text-accent-teal">{overview.currentValue}</div>
            <div className="text-sm text-text-muted">{overview.unit}</div>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <div className="text-lg font-semibold text-text-primary">Status</div>
            <div className={`text-sm capitalize ${
              overview.status === 'normal' ? 'text-status-neutral' :
              overview.status === 'warning' ? 'text-status-warning' : 'text-status-error'
            }`}>{overview.status}</div>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-3">
          <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
          <p className="text-text-secondary">{overview.description}</p>
        </div>

        {overview.keyMetrics && overview.keyMetrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-text-primary">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {overview.keyMetrics.map((metric) => (
                <div key={metric.id} className="bg-primary-700/60 rounded-lg p-3 border border-primary-600">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">{metric.name}</span>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-status-neutral" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-status-error" />
                    ) : null}
                  </div>
                  <div className="text-xl font-bold text-text-primary">{metric.value} {metric.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrendsAnalysis = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-3">
        <h4 className="text-lg font-semibold text-text-primary mb-4">24-Hour Trend</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHistoricalData}>
              <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
              <YAxis stroke="#8A9BA8" fontSize={12} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#01A3A4" 
                strokeWidth={3}
                dot={{ fill: '#01A3A4', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-lg p-3">
          <h4 className="text-lg font-semibold text-text-primary mb-2">Trend Direction</h4>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-status-neutral" />
            <span className="text-status-neutral">Improving</span>
          </div>
        </div>
        <div className="glass-panel rounded-lg p-3">
          <h4 className="text-lg font-semibold text-text-primary mb-2">Forecast</h4>
          <div className="text-accent-teal">95.2% (±2.1%)</div>
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-primary">AI Confidence Score</h4>
          <div className="text-2xl font-bold text-accent-teal">87%</div>
        </div>
        <div className="w-full bg-primary-600 rounded-full h-3">
          <div className="h-3 bg-accent-teal rounded-full" style={{ width: '87%' }} />
        </div>
      </div>

      <div className="glass-panel rounded-lg p-3">
        <h4 className="text-lg font-semibold text-text-primary mb-2">Model Explanation</h4>
        <p className="text-text-secondary">
          Based on historical patterns, current weather conditions, and flight schedule analysis, 
          the system predicts optimal performance with high confidence. Key contributing factors 
          include stable meteorological conditions and efficient resource allocation.
        </p>
      </div>

      <div className="glass-panel rounded-lg p-3">
        <h4 className="text-lg font-semibold text-text-primary mb-3">Contributing Factors</h4>
        <div className="space-y-2">
          {[
            { factor: 'Weather Conditions', impact: 0.8, confidence: 0.92 },
            { factor: 'Resource Availability', impact: 0.7, confidence: 0.85 },
            { factor: 'Historical Performance', impact: 0.6, confidence: 0.89 },
          ].map((item) => (
            <div key={item.factor} className="flex items-center justify-between">
              <span className="text-text-secondary">{item.factor}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-primary-600 rounded-full h-2">
                  <div 
                    className="h-2 bg-accent-teal rounded-full" 
                    style={{ width: `${item.impact * 100}%` }}
                  />
                </div>
                <span className="text-sm text-accent-gold">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActionItems = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-text-primary">Primary Actions</h4>
        <div className="glass-panel rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-text-primary">Execute Optimization SOP</h5>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-accent-teal">Confidence: 89%</span>
              <span className="px-2 py-1 bg-status-neutral bg-opacity-20 text-status-neutral text-xs rounded-full">
                Routine
              </span>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            Implement AI-recommended optimization with expected 8% performance improvement
          </p>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg transition-colors">
              <Play className="h-4 w-4" />
              <span>Execute SOP</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-text-primary rounded-lg transition-colors">
              <Eye className="h-4 w-4" />
              <span>Run Shadow</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-text-primary">Action History</h4>
        <div className="space-y-2">
          {[
            { action: 'Optimization Applied', time: '2 hours ago', result: 'Success', user: 'System' },
            { action: 'Manual Override', time: '6 hours ago', result: 'Success', user: 'Operator Nam' },
            { action: 'Preventive Check', time: '1 day ago', result: 'Completed', user: 'Maintenance Team' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-primary-700 rounded-lg">
              <div>
                <div className="text-text-primary font-medium">{item.action}</div>
                <div className="text-sm text-text-muted">by {item.user}</div>
              </div>
              <div className="text-right">
                <div className="text-status-neutral text-sm">{item.result}</div>
                <div className="text-xs text-text-muted">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6">
      <div className="glass-panel rounded-lg p-3">
        <h4 className="text-lg font-semibold text-text-primary mb-3">Data Sources</h4>
        <div className="space-y-2">
          {[
            { name: 'AODB System', quality: 98.5, records: 1247, lastUpdate: '2 min ago' },
            { name: 'Weather Station', quality: 99.1, records: 3456, lastUpdate: '1 min ago' },
            { name: 'Sensor Network', quality: 96.8, records: 8932, lastUpdate: '30 sec ago' },
          ].map((source) => (
            <div key={source.name} className="flex items-center justify-between p-2 bg-primary-700 rounded">
              <div>
                <div className="text-text-primary">{source.name}</div>
                <div className="text-xs text-text-muted">{source.records} records</div>
              </div>
              <div className="text-right">
                <div className="text-status-neutral text-sm">{source.quality}%</div>
                <div className="text-xs text-text-muted">{source.lastUpdate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-lg p-3">
        <h4 className="text-lg font-semibold text-text-primary mb-3">Audit Trail</h4>
        <div className="space-y-2">
          {[
            { timestamp: '14:23:15', action: 'Data Retrieved', user: 'AI System', ip: '10.1.1.100' },
            { timestamp: '14:23:10', action: 'Analysis Started', user: 'AI System', ip: '10.1.1.100' },
            { timestamp: '14:20:05', action: 'Modal Opened', user: 'Capt. Nam', ip: '10.1.2.50' },
          ].map((entry, index) => (
            <div key={index} className="text-sm p-2 bg-primary-700 rounded">
              <div className="flex items-center justify-between">
                <span className="text-text-primary">{entry.timestamp} - {entry.action}</span>
                <span className="text-text-muted">{entry.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Overview':
        return renderOverview();
      case 'TrendsAnalysis':
        return renderTrendsAnalysis();
      case 'AIInsights':
        return renderAIInsights();
      case 'ActionItems':
        return renderActionItems();
      case 'Evidence':
        return renderEvidence();
      default:
        return renderOverview();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] mx-4 modal-surface rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-accent-blue/15 bg-primary-800">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-accent-blue/15 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as keyof DetailModalType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activeTab === key
                      ? 'bg-accent-blue text-white'
                      : 'text-text-muted hover:bg-accent-blue/10 hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {renderActiveTab()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailModal;