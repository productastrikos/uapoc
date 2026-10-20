import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, FileText, Calendar, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

interface OperationalReport {
  id: string;
  name: string;
  type: 'operational' | 'regulatory' | 'financial' | 'executive';
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastGenerated: string;
  nextDue: string;
  compliance: number;
  automation: number;
}

const AnalyticsReporting: React.FC = () => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('analytics');
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<OperationalReport | null>(null);
  const [showModal, setShowModal] = useState(false);

  const reports: OperationalReport[] = [
    {
      id: '1',
      name: 'Daily Operations Summary',
      type: 'operational',
      schedule: 'daily',
      lastGenerated: '2025-01-19T06:00:00Z',
      nextDue: '2025-01-20T06:00:00Z',
      compliance: 98.5,
      automation: 100
    },
    {
      id: '2',
      name: 'Safety Performance Indicators',
      type: 'regulatory',
      schedule: 'weekly',
      lastGenerated: '2025-01-15T09:00:00Z',
      nextDue: '2025-01-22T09:00:00Z',
      compliance: 100,
      automation: 95
    },
    {
      id: '3',
      name: 'Revenue & Cost Analysis',
      type: 'financial',
      schedule: 'monthly',
      lastGenerated: '2025-01-01T00:00:00Z',
      nextDue: '2025-02-01T00:00:00Z',
      compliance: 97.2,
      automation: 88
    },
    {
      id: '4',
      name: 'Executive Dashboard',
      type: 'executive',
      schedule: 'weekly',
      lastGenerated: '2025-01-15T10:00:00Z',
      nextDue: '2025-01-22T10:00:00Z',
      compliance: 99.1,
      automation: 92
    }
  ];

  const kpiTrends = [
    { month: 'Jan', onTime: 87.3, satisfaction: 4.2, efficiency: 89.1, safety: 99.8 },
    { month: 'Feb', onTime: 89.1, satisfaction: 4.3, efficiency: 91.2, safety: 99.9 },
    { month: 'Mar', onTime: 91.2, satisfaction: 4.4, efficiency: 92.8, safety: 99.7 },
    { month: 'Apr', onTime: 88.9, satisfaction: 4.1, efficiency: 88.9, safety: 99.8 },
    { month: 'May', onTime: 92.1, satisfaction: 4.5, efficiency: 94.2, safety: 99.9 },
    { month: 'Jun', onTime: 94.3, satisfaction: 4.6, efficiency: 95.1, safety: 100 },
  ];

  const benchmarkData = [
    { category: 'On-Time Performance', current: 94.3, benchmark: 85.0, industry: 82.5 },
    { category: 'Passenger Satisfaction', current: 4.6, benchmark: 4.2, industry: 3.9 },
    { category: 'Energy Efficiency', current: 95.1, benchmark: 88.0, industry: 85.2 },
    { category: 'Safety Rating', current: 100, benchmark: 98.5, industry: 96.8 },
  ];

  const dataSourceHealth = [
    { name: 'AODB', status: 99.9, records: 1247892, quality: 98.7 },
    { name: 'BHS', status: 97.8, records: 456123, quality: 96.2 },
    { name: 'Security Systems', status: 98.9, records: 2891456, quality: 94.8 },
    { name: 'Revenue Systems', status: 99.5, records: 234567, quality: 99.1 },
    { name: 'Environmental', status: 96.2, records: 789012, quality: 97.3 },
  ];

  const predictiveInsights = [
    { name: 'Passenger Flow', value: 85, color: '#01A3A4', trend: 'increasing' },
    { name: 'Equipment Health', value: 92, color: '#10B981', trend: 'stable' },
    { name: 'Revenue Growth', value: 78, color: '#E6B85C', trend: 'increasing' },
    { name: 'Compliance Risk', value: 15, color: '#EF4444', trend: 'decreasing' },
  ];

  const handleReportClick = (report: OperationalReport) => {
    setSelectedReport(report);
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
          <BarChart3 className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.reports')}</h1>
          <p className="text-sm text-text-muted">Comprehensive analytics, reporting, and business intelligence</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Reports', value: '47', icon: FileText, change: '+5', tint: 'glass-pill-blue' },
          { label: 'Data Sources', value: '23', icon: Eye, change: '+2', tint: 'glass-pill-teal' },
          { label: 'Automation Rate', value: '94.2%', icon: TrendingUp, change: '+3.1%', tint: 'glass-pill-violet' },
          { label: 'Compliance Score', value: '98.7%', icon: Calendar, change: '+0.5%', tint: 'glass-pill-neutral' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className={`glass-pill ${stat.tint} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
            onClick={() => handleReportClick(reports[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-text-muted" />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-status-success' : 'text-status-warning'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI recommendations for this domain. Sits under the KPI row so an
          operator reads the numbers first and the inference drawn from them
          second. */}
      <AiInsightPanel domain="analytics" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Reports & Analytics */}
        <div className="col-span-8 space-y-6">
          {/* Operational Dashboard */}
          <div className="glass-panel-strong rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">Executive Performance Dashboard</h2>
            </div>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kpiTrends}>
                  <XAxis dataKey="month" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Area type="monotone" dataKey="onTime" fill="#01A3A4" fillOpacity={0.3} stroke="#01A3A4" />
                  <Bar dataKey="satisfaction" fill="#E6B85C" />
                  <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={3} />
                  <Line type="monotone" dataKey="safety" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-teal rounded-full"></div>
                <span className="text-text-muted">On-Time Performance</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">Satisfaction Score</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-status-success rounded-full"></div>
                <span className="text-text-muted">Efficiency</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-status-error rounded-full" style={{borderStyle: 'dashed'}}></div>
                <span className="text-text-muted">Safety Rating</span>
              </div>
            </div>
          </div>

          {/* Report Management */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">Automated Report Management</h2>

            <div className="space-y-4">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="p-4 glass-panel rounded-xl hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer group"
                  onClick={() => handleReportClick(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-accent-blue/15">
                        {report.type === 'regulatory' ? <FileText className="h-5 w-5 text-accent-blue" /> :
                         report.type === 'executive' ? <TrendingUp className="h-5 w-5 text-accent-blue" /> :
                         report.type === 'financial' ? <BarChart3 className="h-5 w-5 text-accent-blue" /> :
                         <PieChart className="h-5 w-5 text-accent-blue" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                            {report.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-accent-blue/10 text-blue-200 border border-accent-blue/30">
                            {report.type.toUpperCase()}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-primary-600/40 text-text-muted rounded-full">
                            {report.schedule}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-text-muted">Last Generated</div>
                            <div className="text-text-primary font-medium">
                              {new Date(report.lastGenerated).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-muted">Next Due</div>
                            <div className="text-text-primary font-medium">
                              {new Date(report.nextDue).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-muted">Compliance</div>
                            <div className="text-text-primary font-medium">{report.compliance}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-text-muted">Automation</div>
                            <div className="text-text-primary font-medium">{report.automation}%</div>
                          </div>
                        </div>

                        {/* Progress indicators */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>Compliance Score</span>
                            <span>{report.compliance}%</span>
                          </div>
                          <div className="w-full bg-primary-600 rounded-full h-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${report.compliance}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                              className="h-1 bg-accent-blue rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Benchmarking Analysis */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">Industry Benchmarking</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} layout="horizontal">
                  <XAxis type="number" stroke="#8A9BA8" fontSize={12} />
                  <YAxis dataKey="category" type="category" stroke="#8A9BA8" fontSize={12} width={120} />
                  <Bar dataKey="current" fill="#01A3A4" />
                  <Bar dataKey="benchmark" fill="#E6B85C" />
                  <Bar dataKey="industry" fill="#8A9BA8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-teal rounded-full"></div>
                <span className="text-text-muted">Phú Quốc Airport</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">Target Benchmark</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-text-muted rounded-full"></div>
                <span className="text-text-muted">Industry Average</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="col-span-4 space-y-6">
          {/* Data Source Health */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Data Source Health</h3>
            <div className="space-y-4">
              {dataSourceHealth.map((source, index) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`p-3 glass-pill ${
                    index % 3 === 0 ? 'glass-pill-blue' : index % 3 === 1 ? 'glass-pill-teal' : 'glass-pill-violet'
                  } hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
                  onClick={() => addToast({
                    type: 'info',
                    title: 'Data Source Details',
                    message: `${source.name}: ${source.records} records, ${source.quality}% quality`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{source.name}</span>
                    <span className={`text-sm font-semibold ${
                      source.status > 98 ? 'text-status-success' :
                      source.status > 95 ? 'text-status-warning' : 'text-status-error'
                    }`}>
                      {source.status}%
                    </span>
                  </div>

                  <div className="w-full bg-primary-600 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.status}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-2 rounded-full ${
                        source.status > 98 ? 'bg-status-success' :
                        source.status > 95 ? 'bg-status-warning' :
                        'bg-status-error'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{source.records.toLocaleString()} records</span>
                    <span>{source.quality}% quality</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Predictive Analytics */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">AI Predictive Insights</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={predictiveInsights}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {predictiveInsights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {predictiveInsights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: insight.color }}></div>
                    <span className="text-text-muted">{insight.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-text-primary font-medium">{insight.value}%</span>
                    <span className={`text-xs ${
                      insight.trend === 'increasing' ? 'text-status-success' :
                      insight.trend === 'decreasing' ? 'text-status-error' : 'text-status-warning'
                    }`}>
                      {insight.trend === 'increasing' ? '↗' : insight.trend === 'decreasing' ? '↘' : '→'}
                    </span>
                  </div>
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
        title={selectedReport?.name || 'Analytics Report Details'}
        data={{
          Overview: {
            title: selectedReport?.name || '',
            status: selectedReport && selectedReport.compliance > 95 ? 'normal' : 'warning',
            currentValue: selectedReport?.compliance || 0,
            unit: '% compliance',
            lastUpdated: selectedReport?.lastGenerated || new Date().toISOString(),
            description: `Automated ${selectedReport?.type} report with ${selectedReport?.automation}% automation rate`,
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />
    </motion.div>
  );
};

export default AnalyticsReporting;