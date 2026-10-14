import React, { useState } from 'react';
import { Leaf, Zap, Droplets, Wind, Recycle, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar, Cell } from 'recharts';
import { SustainabilityMetric } from '../../types';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';

const SustainabilityOperations: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedMetric, setSelectedMetric] = useState<SustainabilityMetric | null>(null);
  const [showModal, setShowModal] = useState(false);

  const sustainabilityMetrics: SustainabilityMetric[] = [
    {
      id: '1',
      category: 'energy',
      name: 'Total Energy Consumption',
      currentValue: 2456,
      unit: 'MWh',
      target: 2200,
      deadline: '2025-12-31',
      trend: 'improving',
      initiatives: ['LED Lighting Conversion', 'Smart HVAC Controls', 'Solar Panel Installation']
    },
    {
      id: '2',
      category: 'emissions',
      name: 'Carbon Footprint',
      currentValue: 1847,
      unit: 'tCO2e',
      target: 1500,
      deadline: '2025-12-31',
      trend: 'improving',
      initiatives: ['Renewable Energy', 'Electric Ground Vehicles', 'Carbon Offset Programs']
    },
    {
      id: '3',
      category: 'waste',
      name: 'Waste Diversion Rate',
      currentValue: 67.5,
      unit: '%',
      target: 80,
      deadline: '2025-06-30',
      trend: 'stable',
      initiatives: ['Recycling Program Expansion', 'Compost Initiative', 'Single-use Plastic Reduction']
    },
    {
      id: '4',
      category: 'water',
      name: 'Water Consumption',
      currentValue: 15420,
      unit: 'kL',
      target: 14000,
      deadline: '2025-12-31',
      trend: 'worsening',
      initiatives: ['Rainwater Harvesting', 'Low-flow Fixtures', 'Greywater Recycling']
    }
  ];

  const energyData = [
    { month: 'Jan', consumption: 2180, renewable: 420, target: 2200 },
    { month: 'Feb', consumption: 2050, renewable: 380, target: 2200 },
    { month: 'Mar', consumption: 2290, renewable: 450, target: 2200 },
    { month: 'Apr', consumption: 2150, renewable: 520, target: 2200 },
    { month: 'May', consumption: 2350, renewable: 610, target: 2200 },
    { month: 'Jun', consumption: 2456, renewable: 678, target: 2200 },
  ];

  const emissionsBreakdown = [
    { name: 'Electricity', value: 45.2, color: '#EF4444' },
    { name: 'Heating/Cooling', value: 28.7, color: '#F59E0B' },
    { name: 'Transportation', value: 15.3, color: '#3B82F6' },
    { name: 'Other', value: 10.8, color: '#8B5CF6' },
  ];

  const wasteData = [
    { category: 'Recyclables', current: 34.2, target: 40 },
    { category: 'Compost', current: 18.5, target: 25 },
    { category: 'Landfill', current: 32.5, target: 20 },
    { category: 'Hazardous', current: 14.8, target: 15 },
  ];

  const handleMetricClick = (metric: SustainabilityMetric) => {
    setSelectedMetric(metric);
    setShowModal(true);
  };

  const handleInitiativeAction = (initiative: string, metric: SustainabilityMetric) => {
    addToast({
      type: 'success',
      title: t('sustainability.initiative_activated'),
      message: `${initiative} project initiated for ${metric.name}`,
      duration: 5000
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Leaf className="h-8 w-8 text-accent-teal" />
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('nav.sustainability')}</h1>
          <p className="text-text-muted">{t('sustainability.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: t('sustainability.energy_savings'), value: '12.3%', icon: Zap, color: 'text-accent-teal', change: '+2.1%' },
          { label: t('sustainability.carbon_reduction'), value: '18.7%', icon: Wind, color: 'text-status-success', change: '+4.3%' },
          { label: t('sustainability.waste_diverted'), value: '67.5%', icon: Recycle, color: 'text-accent-gold', change: '+1.2%' },
          { label: t('sustainability.water_saved'), value: '8.9%', icon: Droplets, color: 'text-status-info', change: '-2.1%' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="sustainability-gradient rounded-lg p-6 border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer hover:shadow-2xl"
            onClick={() => handleMetricClick(sustainabilityMetrics[index])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-status-success' : 
                stat.change.startsWith('-') && stat.label.includes('saved') ? 'text-status-error' : 'text-status-success'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Sustainability Metrics */}
        <div className="col-span-8 space-y-8">
          {/* Environmental KPIs */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{t('sustainability.environmental_kpis')}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">{t('sustainability.on_track')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">{t('sustainability.needs_attention')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-error rounded-full"></div>
                  <span className="text-text-muted">{t('sustainability.off_track')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {sustainabilityMetrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 8 }}
                  className="p-6 bg-gradient-to-r from-primary-800 to-primary-700 rounded-xl border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer group"
                  onClick={() => handleMetricClick(metric)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        metric.trend === 'improving' ? 'bg-status-success bg-opacity-20' :
                        metric.trend === 'stable' ? 'bg-status-warning bg-opacity-20' :
                        'bg-status-error bg-opacity-20'
                      }`}>
                        {metric.category === 'energy' ? <Zap className="h-6 w-6 text-accent-teal" /> :
                         metric.category === 'emissions' ? <Wind className="h-6 w-6 text-status-info" /> :
                         metric.category === 'waste' ? <Recycle className="h-6 w-6 text-accent-gold" /> :
                         <Droplets className="h-6 w-6 text-status-success" />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-colors text-lg mb-2">
                          {metric.name}
                        </h3>
                        
                        <div className="grid grid-cols-4 gap-6 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-accent-teal">
                              {metric.currentValue.toLocaleString()}
                            </div>
                            <div className="text-sm text-text-muted">{metric.unit} current</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-text-primary">
                              {metric.target.toLocaleString()}
                            </div>
                            <div className="text-sm text-text-muted">{metric.unit} target</div>
                          </div>
                          <div>
                            <div className={`text-xl font-semibold ${
                              metric.trend === 'improving' ? 'text-status-success' :
                              metric.trend === 'stable' ? 'text-status-warning' : 'text-status-error'
                            }`}>
                              {metric.trend === 'improving' ? '↗' : metric.trend === 'stable' ? '→' : '↘'} {metric.trend}
                            </div>
                            <div className="text-sm text-text-muted">{t('sustainability.trend')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-accent-gold">
                              {new Date(metric.deadline).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-text-muted">{t('sustainability.deadline')}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-primary-600 rounded-full h-3 mb-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((metric.currentValue / metric.target) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className={`h-3 rounded-full ${
                              metric.currentValue >= metric.target 
                                ? 'bg-gradient-to-r from-status-success to-accent-teal' 
                                : metric.trend === 'improving'
                                ? 'bg-gradient-to-r from-accent-teal to-status-success'
                                : 'bg-gradient-to-r from-status-warning to-status-error'
                            }`}
                          />
                        </div>

                        {/* Active Initiatives */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-text-secondary">{t('sustainability.active_initiatives')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {metric.initiatives.slice(0, 2).map((initiative, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInitiativeAction(initiative, metric);
                                }}
                                className="px-3 py-1 bg-accent-teal bg-opacity-20 text-accent-teal rounded-full text-xs hover:bg-opacity-30 transition-colors"
                              >
                                {initiative}
                              </motion.button>
                            ))}
                            {metric.initiatives.length > 2 && (
                              <span className="px-3 py-1 bg-primary-600 text-text-muted rounded-full text-xs">
                                +{metric.initiatives.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Energy Consumption Trends */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('sustainability.energy_trends')}</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyData}>
                  <XAxis dataKey="month" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Area 
                    type="monotone" 
                    dataKey="consumption" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="renewable" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.8}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#E6B85C" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-info rounded-full"></div>
                <span className="text-text-muted">{t('sustainability.total_consumption')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-success rounded-full"></div>
                <span className="text-text-muted">{t('sustainability.renewable_energy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">{t('sustainability.target')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="col-span-4 space-y-8">
          {/* Carbon Footprint Breakdown */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('sustainability.emissions_breakdown')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={emissionsBreakdown}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8">
                    {emissionsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {emissionsBreakdown.map((emission, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emission.color }}></div>
                    <span className="text-text-muted">{emission.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{emission.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Waste Management */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('sustainability.waste_management')}</h3>
            <div className="space-y-4">
              {wasteData.map((waste, index) => (
                <motion.div
                  key={waste.category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-primary-700 rounded-lg border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('sustainability.waste_details'),
                    message: `${waste.category}: ${waste.current}% current vs ${waste.target}% target`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-primary font-medium">{waste.category}</span>
                    <span className="text-accent-teal font-semibold">{waste.current}%</span>
                  </div>
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((waste.current / waste.target) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-2 rounded-full ${
                        waste.current >= waste.target 
                          ? 'bg-gradient-to-r from-status-success to-accent-teal' 
                          : 'bg-gradient-to-r from-accent-gold to-status-warning'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{t('sustainability.current')}: {waste.current}%</span>
                    <span>{t('sustainability.target')}: {waste.target}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sustainability Goals */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-accent-teal animate-pulse" />
              <h3 className="text-lg font-semibold text-text-primary">{t('sustainability.goals_2025')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { goal: t('sustainability.carbon_neutral'), progress: 73, deadline: 'Dec 2025' },
                { goal: t('sustainability.renewable_50'), progress: 28, deadline: 'Jun 2025' },
                { goal: t('sustainability.zero_waste'), progress: 67, deadline: 'Sep 2025' },
                { goal: t('sustainability.water_reduction'), progress: 45, deadline: 'Dec 2025' },
              ].map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-primary-700 rounded-lg border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('sustainability.goal_details'),
                    message: `${goal.goal}: ${goal.progress}% complete by ${goal.deadline}`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">{goal.goal}</span>
                    <span className="text-accent-teal font-semibold text-sm">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-2 bg-gradient-to-r from-accent-teal to-status-success rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{t('sustainability.deadline')}: {goal.deadline}</span>
                    <span>{100 - goal.progress}% remaining</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sustainability-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('sustainability.quick_actions')}</h3>
            <div className="space-y-3">
              {[
                { action: t('sustainability.energy_audit'), icon: Zap },
                { action: t('sustainability.waste_assessment'), icon: Recycle },
                { action: t('sustainability.emissions_report'), icon: Wind },
                { action: t('sustainability.water_monitoring'), icon: Droplets },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToast({
                    type: 'success',
                    title: t('sustainability.action_initiated'),
                    message: `${item.action} process started`
                  })}
                  className="w-full flex items-center space-x-3 p-4 bg-primary-700 rounded-lg hover:bg-primary-600 transition-all duration-300 group"
                >
                  <item.icon className="h-5 w-5 text-accent-teal group-hover:scale-110 transition-transform" />
                  <span className="text-text-primary text-sm font-medium">{item.action}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedMetric?.name || t('sustainability.metric_details')}
        data={{
          Overview: {
            title: selectedMetric?.name || '',
            status: selectedMetric?.trend === 'improving' ? 'normal' : selectedMetric?.trend === 'stable' ? 'warning' : 'critical',
            currentValue: selectedMetric?.currentValue || 0,
            unit: selectedMetric?.unit || '',
            lastUpdated: new Date().toISOString(),
            description: `Sustainability metric tracking for ${selectedMetric?.category} management`,
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />
    </motion.div>
  );
};

export default SustainabilityOperations;