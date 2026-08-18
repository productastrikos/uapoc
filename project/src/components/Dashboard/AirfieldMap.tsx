import React from 'react';
import { MapPin, Plane, AlertTriangle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AirfieldMap: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-primary-800 to-primary-700 rounded-lg border border-primary-600 overflow-hidden h-96">
      <div className="p-6 border-b border-primary-600">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-accent-teal" />
          <h2 className="text-xl font-bold text-text-primary">Airfield Operations Map</h2>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-success rounded-full"></div>
              <span className="text-text-muted">Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-warning rounded-full"></div>
              <span className="text-text-muted">Caution</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-error rounded-full"></div>
              <span className="text-text-muted">Closed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-80 bg-primary-900 bg-runway-pattern">
        {/* Runways */}
        <div className="absolute inset-4">
          {/* Main Runway 27/09 */}
          <div className="absolute top-1/2 left-4 right-4 h-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-sm border-2 border-accent-gold border-opacity-50 transform -translate-y-1/2">
            <div className="absolute inset-0 bg-runway-pattern opacity-30"></div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-accent-gold font-bold">27</div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-accent-gold font-bold">09</div>
          </div>

          {/* Taxiways */}
          <div className="absolute top-16 left-1/4 right-1/4 h-4 bg-primary-600 rounded-sm border border-primary-500"></div>
          <div className="absolute bottom-16 left-1/4 right-1/4 h-14 bg-primary-600 rounded-sm border border-primary-500"></div>

          {/* Terminal Building */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg border border-accent-teal border-opacity-50">
            <div className="p-2">
              <div className="text-xs text-text-primary font-semibold">Terminal</div>
              <div className="text-xs text-text-muted">Gates A1-A12</div>
            </div>
          </div>

          {/* Aircraft Positions */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1/2 left-1/3 transform -translate-y-1/2"
          >
            <div className="relative">
              <Plane className="h-6 w-6 text-accent-teal" />
              <div className="absolute -top-8 -left-4 bg-primary-700 rounded px-2 py-1 text-xs text-text-primary border border-primary-600">
                VN1323
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-20 right-1/3 transform rotate-180"
          >
            <div className="relative">
              <Plane className="h-6 w-6 text-status-warning" />
              <div className="absolute -bottom-8 -left-4 bg-primary-700 rounded px-2 py-1 text-xs text-text-primary border border-primary-600 transform rotate-180">
                VJ142
              </div>
            </div>
          </motion.div>

          {/* Incident Markers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-20 right-1/4"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-status-warning rounded-full animate-pulse"></div>
              <div className="absolute -top-8 -left-8 bg-status-warning bg-opacity-20 rounded px-2 py-1 text-xs text-status-warning border border-status-warning">
                Ground Equipment
              </div>
            </div>
          </motion.div>

          {/* Weather Station */}
          <div className="absolute top-4 right-4">
            <div className="bg-primary-700 rounded-lg p-3 border border-primary-600">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-accent-gold" />
                <span className="text-xs text-text-primary font-semibold">METAR</span>
              </div>
              <div className="text-xs text-text-muted space-y-1">
                <div>Wind: 090/08 KT</div>
                <div>Vis: 10+ KM</div>
                <div>Temp: 28°C</div>
              </div>
            </div>
          </div>

          {/* Wind Direction Indicator */}
          <motion.div
            animate={{ rotate: 90 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-4 left-4"
          >
            <div className="w-8 h-8 bg-primary-700 rounded-full border border-accent-teal flex items-center justify-center">
              <div className="w-1 h-4 bg-accent-teal rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AirfieldMap;