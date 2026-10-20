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
        return <AlertTriangle className={`w-4 h-4 ${severity === 'error' ? 'text-status-error' : 'text-status-warning'}`} />;
      case 'manual':
        return <User className="w-4 h-4 text-accent-blue" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-status-warning" />;
      case 'system':
        return severity === 'success' ?
          <CheckCircle className="w-4 h-4 text-status-success" /> :
          <Package className="w-4 h-4 text-accent-blue" />;
      default:
        return <Clock className="w-4 h-4 text-text-muted" />;
    }
  };

  // Small severity dot shown beside the event icon - the only place colour
  // carries meaning here, so the list itself stays a neutral, scannable feed
  // rather than a card per colour.
  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-status-error';
      case 'warning': return 'bg-status-warning';
      case 'success': return 'bg-status-success';
      default: return 'bg-accent-blue';
    }
  };

  const filteredEvents = filter === 'all' ? events : events.filter(event => event.type === filter);

  return (
    <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl shadow-2xl">
      <div className="p-6 border-b border-primary-600/40">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Event Log</h3>
            <p className="text-text-muted">Live system activity feed</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-primary-900 border border-primary-600 rounded-lg px-3 py-2 text-text-secondary text-sm"
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
              <Clock className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <p className="text-text-muted">No events to display</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="border border-primary-700/40 bg-primary-800/40 rounded-lg p-4 transition-colors duration-200 hover:border-primary-600/60"
              >
                <div className="flex items-start space-x-3">
                  <div className="relative mt-0.5">
                    {getEventIcon(event.type, event.severity)}
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${getSeverityDot(event.severity)}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-text-primary">{event.title}</h4>
                      <span className="text-xs text-text-muted">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{event.description}</p>

                    {event.operator && (
                      <div className="mt-2 flex items-center space-x-2">
                        <User className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">Operator: {event.operator}</span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center space-x-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-700/40 text-text-secondary border border-primary-600/40">
                        {event.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-text-muted">
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
