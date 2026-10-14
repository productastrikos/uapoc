import React, { useState } from 'react';
import { Wrench, PenTool as Tool, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';
import { WorkOrder } from '../../types';
import DetailModal from '../UI/DetailModal';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

const MaintenanceOperations: React.FC = () => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('maintenance');
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const workOrders: WorkOrder[] = [
    {
      id: '1',
      woNumber: 'WO-2025-0819-001',
      assetId: 'BHS-BELT-A2',
      assetName: 'Baggage Belt A2 Motor',
      workType: 'predictive',
      priority: 'high',
      status: 'assigned',
      description: 'Vibration analysis indicates bearing replacement needed within 72 hours',
      createdBy: 'AI Predictive System',
      assignedTo: 'Maintenance Team Alpha',
      createdAt: '2025-01-19T06:30:00Z',
      scheduledDate: '2025-01-19T14:00:00Z',
      estimatedHours: 4,
      partsRequired: ['SKF Bearing 6308-2Z', 'Loctite 262'],
      instructions: 'Follow PM-BHS-002 procedure. Ensure belt is fully stopped and locked out.'
    },
    {
      id: '2',
      woNumber: 'WO-2025-0819-002',
      assetId: 'HVAC-CH-03',
      assetName: 'Terminal B Chiller Unit 3',
      workType: 'preventive',
      priority: 'medium',
      status: 'in_progress',
      description: 'Monthly refrigerant level check and filter replacement',
      createdBy: 'Operations Manager',
      assignedTo: 'HVAC Technician',
      createdAt: '2025-01-19T05:15:00Z',
      scheduledDate: '2025-01-19T08:00:00Z',
      estimatedHours: 2,
      actualHours: 1.5,
      partsRequired: ['Air Filter AF-300', 'R-410A Refrigerant'],
      instructions: 'Standard monthly PM checklist. Record pressure readings.'
    },
    {
      id: '3',
      woNumber: 'WO-2025-0819-003',
      assetId: 'SEC-GATE-12',
      assetName: 'Security Gate SG-12',
      workType: 'corrective',
      priority: 'critical',
      status: 'open',
      description: 'Gate malfunction causing passenger flow bottleneck',
      createdBy: 'Security Supervisor',
      assignedTo: 'Electronics Team',
      createdAt: '2025-01-19T03:45:00Z',
      scheduledDate: '2025-01-19T09:00:00Z',
      estimatedHours: 6,
      partsRequired: ['Control Board CB-SG12', 'Actuator Motor'],
      instructions: 'Emergency repair - bypass if necessary to maintain passenger flow'
    }
  ];

  const assetHealth = [
    { name: 'BHS Systems', health: 87, trend: 'improving' },
    { name: 'HVAC Equipment', health: 94, trend: 'stable' },
    { name: 'Security Systems', health: 76, trend: 'declining' },
    { name: 'Lighting Systems', health: 91, trend: 'stable' },
    { name: 'Power Systems', health: 98, trend: 'improving' },
  ];

  const maintenanceCosts = [
    { month: 'Jan', preventive: 45, corrective: 78, emergency: 23 },
    { month: 'Feb', preventive: 52, corrective: 65, emergency: 19 },
    { month: 'Mar', preventive: 48, corrective: 71, emergency: 15 },
    { month: 'Apr', preventive: 55, corrective: 58, emergency: 12 },
    { month: 'May', preventive: 49, corrective: 62, emergency: 18 },
    { month: 'Jun', preventive: 51, corrective: 55, emergency: 14 },
  ];

  const handleWorkOrderClick = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowModal(true);
  };

  const handleExecuteAction = (actionType: string, workOrder: WorkOrder) => {
    const actionMap = {
      'schedule': {
        title: t('maintenance.action_scheduled'),
        message: `${workOrder.description} scheduled for ${new Date(workOrder.scheduledDate).toLocaleDateString()}`
      },
      'assign': {
        title: t('maintenance.technician_assigned'),
        message: `Work order assigned to ${workOrder.assignedTo}`
      },
      'complete': {
        title: t('maintenance.work_completed'),
        message: `${workOrder.assetName} maintenance completed successfully`
      }
    };

    const action = actionMap[actionType as keyof typeof actionMap];
    if (action) {
      addToast({
        type: 'success',
        title: action.title,
        message: action.message,
        duration: 5000
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Wrench className="h-8 w-8 text-accent-teal" />
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t('nav.maintenance')}</h1>
          <p className="text-text-muted">{t('maintenance.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: t('maintenance.active_work_orders'), value: '12', icon: Tool, color: 'text-accent-teal', change: '+3' },
          { label: t('maintenance.asset_health'), value: '89.2%', icon: TrendingUp, color: 'text-status-success', change: '+2.1%' },
          { label: t('maintenance.mtbf'), value: '8,760h', icon: Clock, color: 'text-accent-gold', change: '+240h' },
          { label: t('maintenance.cost_savings'), value: '$24.5K', icon: CheckCircle, color: 'text-status-info', change: '+12%' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="maintenance-gradient rounded-lg p-6 border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer hover:shadow-2xl"
            onClick={() => handleWorkOrderClick(workOrders[0])}
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

      {/* AI recommendations for this domain. Sits under the KPI row so an
          operator reads the numbers first and the inference drawn from them
          second. */}
      <AiInsightPanel domain="maintenance" />

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Work Orders */}
        <div className="col-span-8 space-y-8">
          {/* Active Work Orders */}
          <div className="maintenance-gradient rounded-xl border border-primary-600 p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{t('maintenance.work_order_management')}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-error rounded-full animate-pulse"></div>
                  <span className="text-text-muted">{t('maintenance.critical')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">{t('maintenance.high_priority')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">{t('maintenance.in_progress')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {workOrders.map((workOrder, index) => (
                <motion.div
                  key={workOrder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 8 }}
                  className="p-6 bg-gradient-to-r from-primary-800 to-primary-700 rounded-xl border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer group"
                  onClick={() => handleWorkOrderClick(workOrder)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        workOrder.priority === 'critical' ? 'bg-status-error bg-opacity-20' :
                        workOrder.priority === 'high' ? 'bg-status-warning bg-opacity-20' :
                        'bg-status-info bg-opacity-20'
                      }`}>
                        {workOrder.workType === 'emergency' ? <AlertTriangle className="h-5 w-5 text-status-error" /> :
                         workOrder.workType === 'predictive' ? <TrendingUp className="h-5 w-5 text-accent-teal" /> :
                         workOrder.workType === 'preventive' ? <Calendar className="h-5 w-5 text-status-success" /> :
                         <Wrench className="h-5 w-5 text-status-warning" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-teal transition-colors">
                            {workOrder.woNumber} - {workOrder.assetName}
                          </h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            workOrder.priority === 'critical' ? 'bg-status-error text-white' :
                            workOrder.priority === 'high' ? 'bg-status-warning text-black' :
                            'bg-status-info text-white'
                          }`}>
                            {workOrder.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-text-secondary mb-3">{workOrder.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-text-muted mb-3">
                          <div className="flex items-center space-x-1">
                            <Tool className="h-4 w-4" />
                            <span>{workOrder.workType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{workOrder.estimatedHours}h estimated</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(workOrder.scheduledDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            workOrder.status === 'completed' ? 'bg-status-success bg-opacity-20 text-status-success' :
                            workOrder.status === 'in_progress' ? 'bg-status-info bg-opacity-20 text-status-info' :
                            workOrder.status === 'assigned' ? 'bg-status-warning bg-opacity-20 text-status-warning' :
                            'bg-primary-600 text-text-muted'
                          }`}>
                            {workOrder.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-text-muted">
                            Assigned to: {workOrder.assignedTo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {workOrder.status === 'assigned' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteAction('schedule', workOrder);
                          }}
                          className="px-4 py-2 bg-accent-teal hover:bg-opacity-80 text-white rounded-lg font-medium transition-colors"
                        >
                          {t('maintenance.start_work')}
                        </motion.button>
                      )}
                      
                      {workOrder.status === 'in_progress' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteAction('complete', workOrder);
                          }}
                          className="px-4 py-2 bg-status-success hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          {t('maintenance.complete')}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Asset Health Dashboard */}
          <div className="maintenance-gradient rounded-xl border border-primary-600 p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">{t('maintenance.asset_health_monitoring')}</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {assetHealth.map((asset, index) => (
                <motion.div
                  key={asset.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="p-6 bg-primary-700 rounded-xl border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('maintenance.asset_selected'),
                    message: `${asset.name} detailed analysis opened`
                  })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">{asset.name}</h3>
                    <div className="flex items-center space-x-2">
                      {asset.trend === 'improving' ? <TrendingUp className="h-4 w-4 text-status-success" /> :
                       asset.trend === 'declining' ? <TrendingUp className="h-4 w-4 text-status-error rotate-180" /> :
                       <div className="w-4 h-4 rounded-full bg-accent-gold"></div>}
                      <span className="text-lg font-bold text-accent-teal">{asset.health}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-primary-600 rounded-full h-3 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.health}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-3 rounded-full ${
                        asset.health > 90 ? 'bg-gradient-to-r from-status-success to-accent-teal' :
                        asset.health > 75 ? 'bg-gradient-to-r from-accent-gold to-status-warning' :
                        'bg-gradient-to-r from-status-error to-red-600'
                      }`}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className={`${
                      asset.trend === 'improving' ? 'text-status-success' :
                      asset.trend === 'declining' ? 'text-status-error' : 'text-text-muted'
                    }`}>
                      {asset.trend}
                    </span>
                    <span className="text-text-muted">
                      {asset.health > 90 ? t('maintenance.excellent') :
                       asset.health > 75 ? t('maintenance.good') :
                       asset.health > 60 ? t('maintenance.fair') : t('maintenance.poor')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="col-span-4 space-y-8">
          {/* Maintenance Cost Trends */}
          <div className="maintenance-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('maintenance.cost_analysis')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintenanceCosts}>
                  <XAxis dataKey="month" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Line type="monotone" dataKey="preventive" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="corrective" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="emergency" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center space-x-4 mt-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-success rounded-full"></div>
                <span className="text-text-muted">{t('maintenance.preventive')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-accent-gold rounded-full"></div>
                <span className="text-text-muted">{t('maintenance.corrective')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-status-error rounded-full"></div>
                <span className="text-text-muted">{t('maintenance.emergency')}</span>
              </div>
            </div>
          </div>

          {/* Predictive Alerts */}
          <div className="maintenance-gradient rounded-xl border border-primary-600 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-accent-teal animate-pulse" />
              <h3 className="text-lg font-semibold text-text-primary">{t('maintenance.predictive_alerts')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { asset: 'Chiller Unit 2', prediction: 'Filter replacement in 3 days', confidence: 94, priority: 'medium' },
                { asset: 'Gate Motor B5', prediction: 'Bearing failure within 48h', confidence: 87, priority: 'high' },
                { asset: 'Lighting Circuit L1', prediction: 'Ballast replacement needed', confidence: 76, priority: 'low' },
              ].map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-primary-700 rounded-lg border border-primary-600 hover:border-accent-teal transition-all duration-300 cursor-pointer"
                  onClick={() => addToast({
                    type: 'info',
                    title: t('maintenance.alert_details'),
                    message: `${alert.asset}: ${alert.prediction}`
                  })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">{alert.asset}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.priority === 'high' ? 'bg-status-error bg-opacity-20 text-status-error' :
                      alert.priority === 'medium' ? 'bg-status-warning bg-opacity-20 text-status-warning' :
                      'bg-status-info bg-opacity-20 text-status-info'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mb-2">{alert.prediction}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{t('maintenance.confidence')}</span>
                    <span className="text-accent-teal font-medium text-sm">{alert.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="maintenance-gradient rounded-xl border border-primary-600 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('maintenance.quick_actions')}</h3>
            <div className="space-y-3">
              {[
                { action: t('maintenance.create_work_order'), icon: Tool },
                { action: t('maintenance.schedule_pm'), icon: Calendar },
                { action: t('maintenance.parts_inventory'), icon: CheckCircle },
                { action: t('maintenance.technician_dispatch'), icon: Zap },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToast({
                    type: 'success',
                    title: t('maintenance.action_initiated'),
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
        title={selectedWorkOrder?.woNumber || t('maintenance.work_order_details')}
        data={{
          Overview: {
            title: selectedWorkOrder?.assetName || '',
            status: selectedWorkOrder?.priority === 'critical' ? 'critical' : 'normal',
            currentValue: selectedWorkOrder?.estimatedHours || 0,
            unit: 'hours',
            lastUpdated: selectedWorkOrder?.createdAt || new Date().toISOString(),
            description: selectedWorkOrder?.description || '',
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />
    </motion.div>
  );
};

export default MaintenanceOperations;