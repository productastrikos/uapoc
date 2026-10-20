import React from 'react';
import { Plane, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Flight } from '../../types';
import { format } from 'date-fns';

interface FlightTableProps {
  flights: Flight[];
}

const FlightTable: React.FC<FlightTableProps> = ({ flights }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time':
        return 'text-status-neutral bg-status-neutral bg-opacity-20';
      case 'Delayed':
        return 'text-status-warning bg-status-warning bg-opacity-20';
      case 'Boarding':
        return 'text-status-info bg-status-info bg-opacity-20';
      case 'Departed':
        return 'text-text-muted bg-primary-600';
      case 'Cancelled':
        return 'text-status-error bg-status-error bg-opacity-20';
      default:
        return 'text-text-muted bg-primary-600';
    }
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <div className="p-6 border-b border-primary-600">
        <div className="flex items-center space-x-3">
          <Plane className="h-6 w-6 text-accent-teal" />
          <h2 className="text-xl font-bold text-text-primary">Live Flight Operations</h2>
          <div className="flex-1"></div>
          <div className="text-sm text-text-muted">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-700">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Flight</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Route</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Aircraft</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Gate/Stand</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Schedule</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, index) => (
              <motion.tr
                key={flight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-primary-600 hover:bg-primary-700 transition-colors"
              >
                <td className="p-4">
                  <div>
                    <div className="font-semibold text-text-primary">{flight.flightNumber}</div>
                    <div className="text-sm text-text-muted">{flight.airline}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-text-primary">{flight.origin}</span>
                    <Plane className="h-3 w-3 text-text-muted" />
                    <span className="text-text-primary">{flight.destination}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-text-primary">{flight.aircraftType}</span>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <div className="text-text-primary">Gate {flight.gate}</div>
                    <div className="text-text-muted">Stand {flight.stand}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {flight.scheduledArrival && (
                      <div className="text-text-primary">ARR: {flight.scheduledArrival}</div>
                    )}
                    {flight.scheduledDeparture && (
                      <div className="text-text-primary">DEP: {flight.scheduledDeparture}</div>
                    )}
                    {flight.estimatedArrival && flight.estimatedArrival !== flight.scheduledArrival && (
                      <div className="text-status-warning">EST: {flight.estimatedArrival}</div>
                    )}
                    {flight.estimatedDeparture && flight.estimatedDeparture !== flight.scheduledDeparture && (
                      <div className="text-status-warning">EST: {flight.estimatedDeparture}</div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
                    {flight.status === 'Delayed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {flight.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <button className="text-accent-blue hover:text-accent-blueHover text-xs transition-colors">
                      Track
                    </button>
                    <button className="text-accent-blue hover:text-accent-blueHover text-xs transition-colors">
                      Optimize
                    </button>
                    <button className="text-text-muted hover:text-text-primary text-xs transition-colors">
                      Details
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlightTable;