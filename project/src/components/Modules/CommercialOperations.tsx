import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Star, Target, CreditCard, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { RevenueStream } from '../../types';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

const CommercialOperations: React.FC = () => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('commercial');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-accent-blue/15 rounded-lg">
          <DollarSign className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.commercial')}</h1>
          <p className="text-sm text-text-muted">{t('commercial.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t('commercial.total_revenue'), value: '$161.5K', icon: DollarSign, change: '+13.2%' },
          { label: t('commercial.avg_transaction'), value: '$24.80', icon: CreditCard, change: '+8.5%' },
          { label: t('commercial.conversion_rate'), value: '37.2%', icon: Target, change: '+2.1%' },
          { label: t('commercial.satisfaction'), value: '4.3/5', icon: Star, change: '+0.2' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
            onClick={() => handleRevenueClick(revenueStreams[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-text-muted" />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-status-neutral' : 'text-status-warning'}`}>
                {stat.change}
              </span>
            </div>
            <div className={`text-xl font-bold ${index === 0 || index === 2 ? 'glow-text' : 'text-text-primary'}`}>{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI recommendations for this domain. Sits under the KPI row so an
          operator reads the numbers first and the inference drawn from them
          second. */}
      <AiInsightPanel domain="commercial" />

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Revenue Streams */}
        <div className="col-span-8 space-y-4">
          {/* Revenue Stream Performance */}
          <div className="glass-panel-strong rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">{t('commercial.revenue_optimization')}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-neutral rounded-full"></div>
                  <span className="text-text-muted">{t('commercial.exceeding_target')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">{t('commercial.below_target')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {revenueStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer group`}
                  onClick={() => handleRevenueClick(stream)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-accent-blue/15 rounded-lg">
                        {stream.category === 'retail' ? <ShoppingBag className="h-5 w-5 text-accent-blue" /> :
                         stream.category === 'food_beverage' ? <BarChart3 className="h-5 w-5 text-accent-blue" /> :
                         stream.category === 'parking' ? <CreditCard className="h-5 w-5 text-accent-blue" /> :
                         <Star className="h-5 w-5 text-accent-blue" />}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors text-base mb-1.5">
                          {stream.name}
                        </h3>

                        <div className="grid grid-cols-4 gap-4 mb-2.5">
                          <div>
                            <div className="text-xl font-bold text-text-primary">
                              ${(stream.currentRevenue / 1000).toFixed(1)}K
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.current_revenue')}</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-text-primary">
                              ${(stream.targetRevenue / 1000).toFixed(1)}K
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.target')}</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-status-neutral">
                              +{stream.growth}%
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.growth')}</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-text-primary">
                              {stream.margin}%
                            </div>
                            <div className="text-sm text-text-muted">{t('commercial.margin')}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-primary-600 rounded-full h-2 mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stream.currentRevenue / stream.targetRevenue) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className={`h-2 rounded-full ${
                              stream.currentRevenue >= stream.targetRevenue
                                ? 'bg-status-neutral'
                                : 'bg-status-warning'
                            }`}
                          />
                        </div>

                        {/* Optimization Suggestions */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-text-secondary">{t('commercial.optimization_opportunities')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {stream.optimization.slice(0, 2).map((suggestion, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 bg-accent-blue/10 text-blue-200 border border-accent-blue/30 rounded-full text-xs"
                              >
                                {suggestion}
                              </span>
                            ))}
                            {stream.optimization.length > 2 && (
                              <span className="px-2.5 py-0.5 bg-primary-600/40 text-text-muted rounded-full text-xs">
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
          <div className="glass-panel-strong rounded-xl p-4">
            <h2 className="text-base font-semibold text-text-primary mb-3">{t('commercial.revenue_trends')}</h2>
            <div className="h-64">
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
            <div className="flex items-center justify-center space-x-4 mt-3 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-teal rounded-full"></div>
                <span className="text-text-muted">{t('commercial.retail')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">{t('commercial.fnb')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-neutral rounded-full"></div>
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
        <div className="col-span-4 space-y-4">
          {/* Customer Satisfaction */}
          <div className="glass-panel-strong rounded-xl p-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">{t('commercial.customer_satisfaction')}</h3>
            <div className="space-y-3">
              {customerSatisfaction.map((item, index) => (
                <motion.div
                  key={item.service}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
                  onClick={() => addToast({
                    type: 'info',
                    title: t('commercial.feedback_details'),
                    message: `${item.service}: ${item.score}/5 (${item.responses} responses)`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-primary font-medium">{item.service}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary font-semibold">{item.score}</span>
                    </div>
                  </div>
                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / 5) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-2 bg-accent-blue rounded-full"
                    />
                  </div>
                  <div className="text-xs text-text-muted">{item.responses} responses</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Conversion Rates */}
          <div className="glass-panel-strong rounded-xl p-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">{t('commercial.conversion_rates')}</h3>
            <div className="h-40">
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
            <div className="grid grid-cols-1 gap-2 mt-3 text-sm">
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
          <div className="glass-panel-strong rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-5 w-5 text-accent-blue" />
              <h3 className="text-base font-semibold text-text-primary">{t('commercial.revenue_opportunities')}</h3>
            </div>
            <div className="space-y-2">
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
                  whileHover={{ y: -2 }}
                  className={`glass-pill ${['glass-pill-blue', 'glass-pill-teal', 'glass-pill-violet', 'glass-pill-neutral'][index % 4]} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
                  onClick={() => addToast({
                    type: 'info',
                    title: t('commercial.opportunity_selected'),
                    message: `${opp.opportunity}: ${opp.impact}`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">{opp.opportunity}</span>
                    <span className="text-text-muted font-medium text-sm">{opp.confidence}%</span>
                  </div>
                  <div className="text-status-neutral text-xs font-medium mb-2">{opp.impact}</div>
                  <div className="w-full bg-primary-600 rounded-full h-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${opp.confidence}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-1 bg-accent-blue rounded-full"
                    />
                  </div>
                </motion.div>
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