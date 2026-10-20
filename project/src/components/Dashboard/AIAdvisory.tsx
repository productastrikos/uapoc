import React from 'react';
import { Brain, Play, Eye, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { AIRecommendation } from '../../types';

interface AIAdvisoryProps {
  recommendations: AIRecommendation[];
}

const AIAdvisory: React.FC<AIAdvisoryProps> = ({ recommendations }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-status-error';
      case 'medium':
        return 'text-status-warning';
      default:
        return 'text-status-info';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-status-error bg-opacity-20 border-status-error';
      case 'medium':
        return 'bg-status-warning bg-opacity-20 border-status-warning';
      default:
        return 'bg-status-info bg-opacity-20 border-status-info';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airside':
        return '✈️';
      case 'terminal':
        return '🏢';
      case 'landside':
        return '🚗';
      case 'security':
        return '🛡️';
      case 'maintenance':
        return '🔧';
      case 'sustainability':
        return '🌱';
      default:
        return '💡';
    }
  };

  return (
    <div className="glass-panel rounded-lg p-6 border border-accent-blue border-opacity-30">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-accent-blue bg-opacity-20 rounded-lg">
          <Brain className="h-6 w-6 text-accent-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">AI Advisory System</h2>
          <p className="text-sm text-text-muted">Astrikos S!aP - Sense → Interpret → Act → Predict</p>
        </div>
        <div className="flex-1"></div>
        <div className="text-right">
          <div className="text-sm text-text-muted">Active Recommendations</div>
          <div className="text-2xl font-bold text-accent-blue">{recommendations.length}</div>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border border-opacity-30 ${getPriorityBg(rec.priority)}`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{getCategoryIcon(rec.category)}</div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{rec.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(rec.priority)} bg-opacity-20`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-text-secondary mb-3">{rec.description}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-accent-blue" />
                    <span className="text-xs text-text-muted">Confidence:</span>
                    <span className="text-sm font-medium text-text-primary">
                      {(rec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-accent-gold" />
                    <span className="text-xs text-text-muted">Impact:</span>
                    <span className="text-sm font-medium text-text-primary">{rec.impact}</span>
                  </div>
                  {rec.estimatedSavings && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-muted">Savings:</span>
                      <span className="text-sm font-medium text-status-success">{rec.estimatedSavings}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {rec.actionRequired && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-accent-blue hover:bg-accent-blueHover text-white rounded-lg font-medium transition-all"
                    >
                      <Play className="h-4 w-4" />
                      <span>Execute SOP</span>
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-text-primary rounded-lg transition-all"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Run Shadow</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No active recommendations at this time.</p>
          <p className="text-xs text-text-muted mt-1">AI systems are monitoring all operations.</p>
        </div>
      )}
    </div>
  );
};

export default AIAdvisory;
