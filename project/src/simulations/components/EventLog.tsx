import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Settings, Package, User } from 'lucide-react';

interface LogEvent {
  id: string;
  timestamp: Date;
  type: 'system' | 'manual' | 'alert' | 'maintenance';
  title: string;
  description: string;
  operator?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const EventLog: React.FC = () => {
  const [events, setEvents] = useState<LogEvent[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: 'system',
      title: 'Carousel #2 Assignment',
      description: 'Flight AI127 assigned to Carousel #2',
      severity: 'info'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'manual',
      title: 'Manual Override',
      description: 'Operator manually activated lighting system for Carousel #3',
      operator: 'John Smith',
      severity: 'info'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      type: 'alert',
      title: 'Baggage Jam Detected',
      description: 'Sensor detected potential jam in Carousel #1 - Manual intervention required',
      severity: 'warning'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      description: 'Carousel #1 taken offline for preventive maintenance',
      operator: 'Mike Johnson',
      severity: 'info'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'system',
      title: 'Flight BA200 Arrival',
      description: 'Flight BA200 baggage processing initiated on Carousel #4',
      severity: 'success'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'system' | 'manual' | 'alert' | 'maintenance'>('all');

  useEffect(() => {
    // Simulate new events
    const interval = setInterval(() => {
      const newEvent: LogEvent = {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        type: ['system', 'manual', 'alert'][Math.floor(Math.random() * 3)] as any,
        title: 'System Update',
        description: 'Carousel status updated',
        severity: 'info'
      };
      
      setEvents(prev => [newEvent, ...prev.slice(0, 19)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string, severity: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className={`w-4 h-4 ${severity === 'error' ? 'text-red-400' : 'text-simgold-400'}`} />;
      case 'manual':
        return <User className="w-4 h-4 text-simteal-400" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-simgold-400" />;
      case 'system':
        return severity === 'success' ? 
          <CheckCircle className="w-4 h-4 text-green-400" /> : 
          <Package className="w-4 h-4 text-simteal-400" />;
      default:
        return <Clock className="w-4 h-4 text-sim-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-500/50 bg-red-950/30';
      case 'warning': return 'border-simgold-500/50 bg-simgold-950/30';
      case 'success': return 'border-green-500/50 bg-green-950/30';
      default: return 'border-simteal-500/50 bg-simteal-950/30';
    }
  };

  const filteredEvents = filter === 'all' ? events : events.filter(event => event.type === filter);

  return (
    <div className="glass-card border border-sim-700/50 rounded-xl shadow-2xl">
      <div className="p-6 border-b border-sim-700/50 bg-gradient-to-r from-sim-800/50 to-sim-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-sim-100">Event Log</h3>
            <p className="text-sim-300">Live system activity feed</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-sim-800 border border-sim-600 rounded-lg px-3 py-2 text-sim-300 text-sm"
            >
              <option value="all">All Events</option>
              <option value="system">System</option>
              <option value="manual">Manual</option>
              <option value="alert">Alerts</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-sim-600 mx-auto mb-3" />
              <p className="text-sim-500">No events to display</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`border-l-4 rounded-r-lg p-4 transition-all duration-200 hover:shadow-lg ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getEventIcon(event.type, event.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sim-100">{event.title}</h4>
                      <span className="text-xs text-sim-500">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-sim-300 mt-1">{event.description}</p>
                    
                    {event.operator && (
                      <div className="mt-2 flex items-center space-x-2">
                        <User className="w-3 h-3 text-sim-400" />
                        <span className="text-xs text-sim-400">Operator: {event.operator}</span>
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'system' ? 'bg-simteal-900/30 text-simteal-400' :
                        event.type === 'manual' ? 'bg-simgold-900/30 text-simgold-400' :
                        event.type === 'alert' ? 'bg-simgold-900/30 text-simgold-400' :
                        'bg-simteal-900/30 text-simteal-400'
                      }`}>
                        {event.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-sim-500">
                        {Math.floor((Date.now() - event.timestamp.getTime()) / 60000)}m ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLog;