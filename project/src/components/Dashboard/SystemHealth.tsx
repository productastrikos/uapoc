import React from 'react';
import { Activity, Server, Wifi, Database, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const SystemHealth: React.FC = () => {
  const systems = [
    { name: 'AODB', status: 'operational', uptime: '99.9%', icon: Database },
    { name: 'A-CDM', status: 'operational', uptime: '98.7%', icon: Activity },
    { name: 'BHS', status: 'maintenance', uptime: '89.2%', icon: Server },
    { name: 'CCTV', status: 'operational', uptime: '100%', icon: Shield },
    { name: 'Network', status: 'operational', uptime: '99.5%', icon: Wifi },
    { name: 'Power', status: 'operational', uptime: '100%', icon: Zap },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-status-success';
      case 'maintenance':
        return 'text-status-warning';
      case 'fault':
        return 'text-status-error';
      default:
        return 'text-text-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-status-success bg-opacity-20 border-status-success';
      case 'maintenance':
        return 'bg-status-warning bg-opacity-20 border-status-warning';
      case 'fault':
        return 'bg-status-error bg-opacity-20 border-status-error';
      default:
        return 'bg-primary-600 border-primary-500';
    }
  };

  return (
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="h-6 w-6 text-accent-teal" />
        <h2 className="text-xl font-bold text-text-primary">System Health Monitor</h2>
        <div className="flex-1"></div>
        <div className="text-sm text-text-muted">Real-time status</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {systems.map((system, index) => {
          const Icon = system.icon;
          return (
            <motion.div
              key={system.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border border-opacity-30 ${getStatusBg(system.status)}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Icon className={`h-5 w-5 ${getStatusColor(system.status)}`} />
                <span className="font-semibold text-text-primary">{system.name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Status:</span>
                  <span className={`text-xs font-medium capitalize ${getStatusColor(system.status)}`}>
                    {system.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Uptime:</span>
                  <span className="text-xs font-medium text-text-primary">{system.uptime}</span>
                </div>
              </div>

              {/* Mini status indicator */}
              <div className="flex items-center space-x-1 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.1 }}
                    className={`w-2 h-2 rounded-full ${
                      i < 4 ? getStatusColor(system.status).replace('text-', 'bg-') : 'bg-primary-500'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Overall System Health:</span>
          <span className="text-status-success font-semibold">96.3% Operational</span>
        </div>
        <div className="w-full bg-primary-600 rounded-full h-2 mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '96.3%' }}
            transition={{ duration: 1.5 }}
            className="h-2 bg-status-success rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;