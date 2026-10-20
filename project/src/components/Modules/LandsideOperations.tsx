import React, { useState } from 'react';
import { Car, MapPin, DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ParkingZone } from '../../types';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

const LandsideOperations: React.FC = () => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('landside');
  const { t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [showModal, setShowModal] = useState(false);

  const parkingZones: ParkingZone[] = [
    {
      id: '1',
      name: 'Zone A - Premium',
      totalSpaces: 200,
      occupiedSpaces: 178,
      revenue: 12450,
      averageSearchTime: 2.3,
      dynamicPricing: true,
      currentRate: 25000,
      predictedDemand: 95
    },
    {
      id: '2',
      name: 'Zone B - Standard',
      totalSpaces: 500,
      occupiedSpaces: 423,
      revenue: 18960,
      averageSearchTime: 4.7,
      dynamicPricing: true,
      currentRate: 15000,
      predictedDemand: 88
    },
    {
      id: '3',
      name: 'Zone C - Economy',
      totalSpaces: 800,
      occupiedSpaces: 567,
      revenue: 8520,
      averageSearchTime: 6.8,
      dynamicPricing: false,
      currentRate: 10000,
      predictedDemand: 72
    }
  ];

  const revenueData = [
    { time: '06:00', parking: 45, taxi: 32, rideshare: 28 },
    { time: '09:00', parking: 89, taxi: 67, rideshare: 45 },
    { time: '12:00', parking: 134, taxi: 89, rideshare: 67 },
    { time: '15:00', parking: 156, taxi: 112, rideshare: 78 },
    { time: '18:00', parking: 198, taxi: 134, rideshare: 89 },
    { time: '21:00', parking: 145, taxi: 98, rideshare: 56 },
  ];

  const trafficData = [
    { zone: 'Departure Drop-off', utilization: 78, avgTime: 3.2 },
    { zone: 'Arrival Pick-up', utilization: 92, avgTime: 5.7 },
    { zone: 'Taxi Queue', utilization: 67, avgTime: 8.4 },
    { zone: 'Ride-share Hub', utilization: 84, avgTime: 4.1 },
  ];

  const transportMix = [
    { name: 'Private Vehicle', value: 45, color: '#01A3A4' },
    { name: 'Taxi', value: 28, color: '#E6B85C' },
    { name: 'Ride-share', value: 18, color: '#10B981' },
    { name: 'Bus/Shuttle', value: 9, color: '#3B82F6' },
  ];

  const handleZoneClick = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setShowModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-accent-blue/15 rounded-lg">
          <Car className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.landside')}</h1>
          <p className="text-sm text-text-muted">Kerbside management, parking optimization, and transport coordination</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: '2,847', icon: Car, change: '+18%' },
          { label: 'Parking Revenue', value: '$39.9K', icon: DollarSign, change: '+12%' },
          { label: 'Avg Search Time', value: '4.6m', icon: Clock, change: '+0.8m' },
          { label: 'Utilization Rate', value: '81.2%', icon: TrendingUp, change: '+5%' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} p-4 cursor-pointer transition-colors duration-200`}
            onClick={() => handleZoneClick(parkingZones[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-text-muted" />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-status-success' : 'text-status-warning'}`}>
                {stat.change}
              </span>
            </div>
            <div className={`text-xl font-bold ${index === 0 || index === 1 ? 'glow-text' : 'text-text-primary'}`}>{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI recommendations for this domain. Sits under the KPI row so an
          operator reads the numbers first and the inference drawn from them
          second. */}
      <AiInsightPanel domain="landside" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Kerbside & Parking Management */}
        <div className="col-span-8 space-y-6">
          {/* Kerbside Congestion Map */}
          <div className="glass-panel rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-text-primary">Kerbside Operations & Dynamic Pricing</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">Normal Flow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">Congested</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-error rounded-full"></div>
                  <span className="text-text-muted">Critical</span>
                </div>
              </div>
            </div>

            {/* Landside Layout Visualization */}
            <div className="relative h-80 bg-primary-900 rounded-lg overflow-hidden">
              <div className="absolute inset-4">
                {/* Terminal building */}
                <div className="absolute top-4 left-1/3 right-1/3 h-16 bg-primary-700 rounded-lg border border-primary-500 flex items-center justify-center">
                  <span className="text-text-primary font-semibold">Terminal Building</span>
                </div>

                {/* Departure drop-off */}
                <div className="absolute top-24 left-4 right-4 h-10 bg-status-warning bg-opacity-20 rounded-lg border border-status-warning flex items-center justify-center">
                  <span className="text-status-warning font-semibold">Departure Drop-off (78% utilization)</span>
                </div>

                {/* Arrival pick-up */}
                <div className="absolute top-40 left-4 right-4 h-10 bg-status-error bg-opacity-20 rounded-lg border border-status-error flex items-center justify-center">
                  <span className="text-status-error font-semibold">Arrival Pick-up (92% utilization)</span>
                </div>

                {/* Parking zones */}
                <div className="absolute bottom-24 left-4 w-24 h-16 bg-accent-blue/15 rounded-lg border border-accent-blue/40 flex items-center justify-center">
                  <span className="text-blue-200 font-semibold text-sm">Zone A</span>
                </div>
                <div className="absolute bottom-24 left-32 w-32 h-16 bg-accent-blue/15 rounded-lg border border-accent-blue/40 flex items-center justify-center">
                  <span className="text-blue-200 font-semibold text-sm">Zone B</span>
                </div>
                <div className="absolute bottom-24 left-68 w-40 h-16 bg-accent-blue/15 rounded-lg border border-accent-blue/40 flex items-center justify-center">
                  <span className="text-blue-200 font-semibold text-sm">Zone C</span>
                </div>

                {/* Transport areas */}
                <div className="absolute bottom-4 left-4 w-28 h-12 bg-primary-700 rounded-lg border border-primary-500 flex items-center justify-center">
                  <span className="text-text-primary font-semibold text-sm">Taxi Queue</span>
                </div>
                <div className="absolute bottom-4 right-4 w-32 h-12 bg-primary-700 rounded-lg border border-primary-500 flex items-center justify-center">
                  <span className="text-text-primary font-semibold text-sm">Ride-share Hub</span>
                </div>

                {/* Dynamic pricing indicators */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className="absolute w-3 h-3 bg-accent-blue rounded-full"
                    style={{
                      left: `${15 + i * 12}%`,
                      bottom: '45%',
                    }}
                  >
                    <div className="absolute -top-8 -left-4 bg-primary-700 rounded px-2 py-1 text-xs text-blue-200 border border-accent-blue/30">
                      ${(15 + Math.random() * 10).toFixed(0)}K
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Parking Zone Management */}
          <div className="glass-panel rounded-lg p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">Parking Zone Performance & Optimization</h2>
            
            <div className="space-y-4">
              {parkingZones.map((zone, index) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="p-4 bg-primary-800/60 rounded-lg border border-primary-600/40 hover:border-accent-blue/40 transition-colors cursor-pointer"
                  onClick={() => handleZoneClick(zone)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary flex items-center space-x-2">
                        <span>{zone.name}</span>
                        {zone.dynamicPricing && (
                          <span className="text-xs px-2 py-0.5 bg-accent-blue/10 text-blue-200 border border-accent-blue/30 rounded-full">
                            Dynamic
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <span>Occupancy: {zone.occupiedSpaces}/{zone.totalSpaces}</span>
                        <span>Revenue: ${zone.revenue.toLocaleString()}</span>
                        <span>Search Time: {zone.averageSearchTime}m</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-text-primary">{Math.round((zone.occupiedSpaces / zone.totalSpaces) * 100)}%</div>
                      <div className="text-sm text-text-muted">Utilization</div>
                      <div className="text-sm font-medium text-text-muted">
                        ${(zone.currentRate / 1000).toFixed(0)}K VND/h
                      </div>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mt-3">
                    <div className="w-full bg-primary-600 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(zone.occupiedSpaces / zone.totalSpaces) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                        className={`h-2 rounded-full ${
                          zone.occupiedSpaces / zone.totalSpaces > 0.9 ? 'bg-status-error' :
                          zone.occupiedSpaces / zone.totalSpaces > 0.75 ? 'bg-status-warning' : 'bg-accent-blue'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Predicted demand */}
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-text-muted">Predicted demand: {zone.predictedDemand}%</span>
                    <span className={`${
                      zone.predictedDemand > 90 ? 'text-status-error' :
                      zone.predictedDemand > 75 ? 'text-status-warning' : 'text-status-success'
                    }`}>
                      {zone.predictedDemand > 90 ? 'High demand expected' :
                       zone.predictedDemand > 75 ? 'Moderate demand' : 'Normal demand'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics & Transport */}
        <div className="col-span-4 space-y-6">
          {/* Revenue Trends */}
          <div className="glass-panel rounded-lg p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Revenue by Service (24h)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Line type="monotone" dataKey="parking" stroke="#01A3A4" strokeWidth={2} />
                  <Line type="monotone" dataKey="taxi" stroke="#E6B85C" strokeWidth={2} />
                  <Line type="monotone" dataKey="rideshare" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-teal rounded-full"></div>
                <span className="text-text-muted">Parking</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">Taxi</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-success rounded-full"></div>
                <span className="text-text-muted">Ride-share</span>
              </div>
            </div>
          </div>

          {/* Traffic Flow Analysis */}
          <div className="glass-panel rounded-lg p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Traffic Flow Analysis</h3>
            <div className="space-y-3">
              {trafficData.map((traffic, index) => (
                <motion.div
                  key={traffic.zone}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-primary text-sm">{traffic.zone}</span>
                    <span className="text-text-primary font-semibold">{traffic.utilization}%</span>
                  </div>
                  
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${traffic.utilization}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-2 rounded-full ${
                        traffic.utilization > 85 ? 'bg-status-error' : 
                        traffic.utilization > 70 ? 'bg-status-warning' : 'bg-accent-blue'
                      }`}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Avg Time: {traffic.avgTime}m</span>
                    <span>{traffic.utilization > 85 ? 'Congested' : 'Normal'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transport Mode Distribution */}
          <div className="glass-panel rounded-lg p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Transport Mode Mix</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transportMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {transportMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {transportMix.map((mode, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.color }}></div>
                  <span className="text-text-muted">{mode.name}</span>
                  <span className="text-text-primary">{mode.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Optimization Recommendations */}
          <div className="glass-panel-strong rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
              <h3 className="text-base font-semibold text-text-primary">Revenue Optimization</h3>
            </div>
            <div className="space-y-3 stagger-in">
              {[
                {
                  priority: 'High',
                  action: 'Increase Zone A pricing to $30K',
                  impact: '+$2.4K revenue', 
                  confidence: 89 
                },
                { 
                  priority: 'Medium', 
                  action: 'Redirect to Zone C during peak', 
                  impact: 'Reduce search time by 40%', 
                  confidence: 76 
                },
                { 
                  priority: 'Low', 
                  action: 'Optimize taxi queue management', 
                  impact: '+12% customer satisfaction', 
                  confidence: 82 
                },
              ].map((rec, index) => (
                <div key={index} className={`glass-pill ${['glass-pill-blue', 'glass-pill-violet', 'glass-pill-teal'][index % 3]} p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      rec.priority === 'High' ? 'bg-status-error/10 text-status-error border-status-error/30' :
                      rec.priority === 'Medium' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                      'bg-accent-blue/10 text-blue-200 border-accent-blue/30'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs text-text-muted">
                      {rec.confidence}% confidence
                    </span>
                  </div>
                  <div className="text-text-primary text-sm mb-1">{rec.action}</div>
                  <div className="text-text-muted text-xs">Impact: {rec.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedZone?.name || 'Landside Operations Detail'}
        data={{
          Overview: {
            title: selectedZone?.name || 'Landside Operations',
            status: selectedZone && (selectedZone.occupiedSpaces / selectedZone.totalSpaces) > 0.9 ? 'critical' : 'normal',
            currentValue: selectedZone?.occupiedSpaces || 0,
            unit: 'vehicles',
            lastUpdated: new Date().toISOString(),
            description: 'Real-time parking zone analysis with dynamic pricing optimization and revenue forecasting.',
            keyMetrics: [
              { id: '1', name: 'Utilization', value: selectedZone ? Math.round((selectedZone.occupiedSpaces / selectedZone.totalSpaces) * 100) : 0, unit: '%', trend: 'up', changePercent: 8.5 },
              { id: '2', name: 'Revenue', value: selectedZone?.revenue || 0, unit: '$', trend: 'up', changePercent: 12.3 },
            ],
            relatedAssets: [
              { id: '1', name: 'Entry Gate A1', type: 'Access Control', status: 'operational', location: selectedZone?.name || 'Zone A' },
              { id: '2', name: 'Payment Kiosk 3', type: 'Payment Terminal', status: 'operational', location: selectedZone?.name || 'Zone A' },
            ]
          }
        }}
      />
    </motion.div>
  );
};

export default LandsideOperations;