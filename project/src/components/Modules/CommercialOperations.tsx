import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Users, Star, Target, CreditCard, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { RevenueStream } from '../../types';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';

const CommercialOperations: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueStream | null>(null);
  const [showModal, setShowModal] = useState(false);

  const revenueStreams: RevenueStream[] = [
    {
      id: '1',
      category: 'retail',
      name: 'Terminal Retail Stores',
      currentRevenue: 45600,
      targetRevenue: 50000,
      growth: 12.3,
      margin: 28.5,
      optimization: ['Extend operating hours', 'Add premium brands', 'Implement dynamic pricing']
    },
    {
      id: '2',
      category: 'food_beverage',
      name: 'Food & Beverage Outlets',
      currentRevenue: 67800,
      targetRevenue: 70000,
      growth: 8.7,
      margin: 35.2,
      optimization: ['Introduce local cuisine', 'Add grab-and-go options', 'Optimize menu pricing']
    },
    {
      id: '3',
      category: 'parking',
      name: 'Parking Services',
      currentRevenue: 28900,
      targetRevenue: 32000,
      growth: 15.6,
      margin: 78.4,
      optimization: ['Dynamic pricing implementation', 'Premium spot reservations', 'EV charging stations']
    },
    {
      id: '4',
      category: 'lounges',
      name: 'VIP Lounges',
      currentRevenue: 19200,
      targetRevenue: 25000,
      growth: 22.1,
      margin: 68.9,
      optimization: ['Expand capacity', 'Add spa services', 'Corporate membership packages']
    }
  ];

  const monthlyRevenue = [
    { month: 'Jan', retail: 42, fnb: 65, parking: 28, lounges: 18, advertising: 12 },
    { month: 'Feb', retail: 38, fnb: 58, parking: 25, lounges: 16, advertising: 11 },
    { month: 'Mar', retail: 45, fnb: 68, parking: 29, lounges: 19, advertising: 13 },
    { month: 'Apr', retail: 48, fnb: 72, parking: 31, lounges: 21, advertising: 14 },
    { month: 'May', retail: 44, fnb: 67, parking: 28, lounges: 18, advertising: 12 },
    { month: 'Jun', retail: 46, fnb: 68, parking: 29, lounges: 19, advertising: 13 },
  ];

  const customerSatisfaction = [
    { service: 'Retail', score: 4.2, responses: 1247 },
    { service: 'F&B', score: 4.5, responses: 1856 },
    { service: 'Parking', score: 3.8, responses: 892 },
    { service: 'Lounges', score: 4.7, responses: 456 },
  ];

  const conversionRates = [
    { name: 'Retail', value: 23.5, color: '#01A3A4' },
    { name: 'F&B', value: 67.2, color: '#E6B85C' },
    { name: 'Services', value: 45.8, color: '#10B981' },
    { name: 'Premium', value: 12.3, color: '#3B82F6' },
  ];

  const handleRevenueClick = (revenue: RevenueStream) => {
    setSelectedRevenue(revenue);
    setShowModal(true);
  };

  const handleOptimizationAction = (action: string, revenue: RevenueStream) => {
    addToast({
      type: 'success',
      title: t('commercial.optimization_applied'),
      message: `${action} implemented for ${revenue.name}`,
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
        <DollarSign className="h-8 w-8 text-accent-teal" />
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('nav.commercial')}</h1>
          <p className="text-text-muted">{t('commercial.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: t('commercial.total_revenue'), value: '$161.5K', icon: DollarSign, color: 'text-status-success', change: '+13.2%' },
          { label: t('commercial.avg_transaction'), value: '$24.80', icon: CreditCard, color: 'text-accent-teal', change: '+8.5%' },
          { label: t('commercial.conversion_rate'), value: '37.2%', icon: Target, color: 'text-accent-gold', change: '+2.1%' },
          { label: t('commercial.satisfaction'), value: '4.3/5', icon: Star, color: 'text-status-info', change: '+0.2' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="commercial-gradient rounded-lg p-6 border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer hover:shadow-2xl"
            onClick={() => handleRevenueClick(revenueStreams[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-status-success' : 'text-status-warning'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Revenue Streams */}
        <div className="col-span-8 space-y-8">
          {/* Revenue Stream Performance */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{t('commercial.revenue_optimization')}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">{t('commercial.exceeding_target')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">{t('commercial.below_target')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {revenueStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 8 }}
                  className="p-6 bg-gradient-to-r from-primary-800 to-primary-700 rounded-xl border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer group"
                  onClick={() => handleRevenueClick(stream)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-accent-teal bg-opacity-20 rounded-lg">
                        {stream.category === 'retail' ? <ShoppingBag className="h-6 w-6 text-accent-teal" /> :
                         stream.category === 'food_beverage' ? <BarChart3 className="h-6 w-6 text-accent-gold" /> :
                         stream.category === 'parking' ? <CreditCard className="h-6 w-6 text-status-success" /> :
                         <Star className="h-6 w-6 text-status-info" />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-colors text-lg mb-2">
                          {stream.name}
                        </h3>
                        
                        <div className="grid grid-cols-4 gap-6 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-accent-teal">
                              ${(stream.currentRevenue / 1000).toFixed(1)}K
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.current_revenue')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-text-primary">
                              ${(stream.targetRevenue / 1000).toFixed(1)}K
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.target')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-status-success">
                              +{stream.growth}%
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.growth')}</div>
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-accent-gold">
                              {stream.margin}%
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.margin')}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-primary-600 rounded-full h-3 mb-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stream.currentRevenue / stream.targetRevenue) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className={`h-3 rounded-full ${
                              stream.currentRevenue >= stream.targetRevenue 
                                ? 'bg-gradient-to-r from-status-success to-accent-teal' 
                                : 'bg-gradient-to-r from-accent-gold to-status-warning'
                            }`}
                          />
                        </div>

                        {/* Optimization Suggestions */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-text-secondary">{t('commercial.optimization_opportunities')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {stream.optimization.slice(0, 2).map((suggestion, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOptimizationAction(suggestion, stream);
                                }}
                                className="px-3 py-1 bg-accent-teal bg-opacity-20 text-accent-teal rounded-full text-xs hover:bg-opacity-30 transition-colors"
                              >
                                {suggestion}
                              </motion.button>
                            ))}
                            {stream.optimization.length > 2 && (
                              <span className="px-3 py-1 bg-primary-600 text-text-muted rounded-full text-xs">
                                +{stream.optimization.length - 2} more
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

          {/* Monthly Revenue Trends */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('commercial.revenue_trends')}</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Bar dataKey="retail" stackId="revenue" fill="#01A3A4" />
                  <Bar dataKey="fnb" stackId="revenue" fill="#E6B85C" />
                  <Bar dataKey="parking" stackId="revenue" fill="#10B981" />
                  <Bar dataKey="lounges" stackId="revenue" fill="#3B82F6" />
                  <Bar dataKey="advertising" stackId="revenue" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-teal rounded-full"></div>
                <span className="text-text-muted">{t('commercial.retail')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">{t('commercial.fnb')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-success rounded-full"></div>
                <span className="text-text-muted">{t('commercial.parking')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-info rounded-full"></div>
                <span className="text-text-muted">{t('commercial.lounges')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="col-span-4 space-y-8">
          {/* Customer Satisfaction */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('commercial.customer_satisfaction')}</h3>
            <div className="space-y-4">
              {customerSatisfaction.map((item, index) => (
                <motion.div
                  key={item.service}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-primary-700 rounded-lg border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('commercial.feedback_details'),
                    message: `${item.service}: ${item.score}/5 (${item.responses} responses)`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-primary font-medium">{item.service}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-accent-gold" />
                      <span className="text-accent-gold font-semibold">{item.score}</span>
                    </div>
                  </div>
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / 5) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-2 bg-gradient-to-r from-accent-gold to-accent-teal rounded-full"
                    />
                  </div>
                  <div className="text-xs text-text-muted">{item.responses} responses</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Conversion Rates */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('commercial.conversion_rates')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversionRates}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {conversionRates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {conversionRates.map((rate, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rate.color }}></div>
                    <span className="text-text-muted">{rate.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{rate.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Opportunities */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-accent-teal animate-pulse" />
              <h3 className="text-lg font-semibold text-text-primary">{t('commercial.revenue_opportunities')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { opportunity: t('commercial.premium_services'), impact: '+$8.2K/month', confidence: 85 },
                { opportunity: t('commercial.loyalty_program'), impact: '+12% retention', confidence: 78 },
                { opportunity: t('commercial.digital_marketing'), impact: '+18% awareness', confidence: 92 },
                { opportunity: t('commercial.space_optimization'), impact: '+$5.4K/month', confidence: 67 },
              ].map((opp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-primary-700 rounded-lg border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('commercial.opportunity_selected'),
                    message: `${opp.opportunity}: ${opp.impact}`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">{opp.opportunity}</span>
                    <span className="text-accent-gold font-medium text-sm">{opp.confidence}%</span>
                  </div>
                  <div className="text-status-success text-xs font-medium mb-2">{opp.impact}</div>
                  <div className="w-full bg-primary-600 rounded-full h-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${opp.confidence}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-1 bg-gradient-to-r from-accent-teal to-accent-gold rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="commercial-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('commercial.quick_actions')}</h3>
            <div className="space-y-3">
              {[
                { action: t('commercial.launch_promotion'), icon: Target },
                { action: t('commercial.adjust_pricing'), icon: DollarSign },
                { action: t('commercial.analyze_trends'), icon: BarChart3 },
                { action: t('commercial.customer_survey'), icon: Users },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToast({
                    type: 'success',
                    title: t('commercial.action_initiated'),
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
        title={selectedRevenue?.name || t('commercial.revenue_details')}
        data={{
          Overview: {
            title: selectedRevenue?.name || '',
            status: selectedRevenue && selectedRevenue.currentRevenue >= selectedRevenue.targetRevenue ? 'normal' : 'warning',
            currentValue: selectedRevenue?.currentRevenue || 0,
            unit: 'USD',
            lastUpdated: new Date().toISOString(),
            description: `Revenue stream analysis for ${selectedRevenue?.category} operations`,
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />
    </motion.div>
  );
};

export default CommercialOperations;