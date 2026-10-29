export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  aircraftType: string;
  origin: string;
  destination: string;
  gate: string;
  stand: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  estimatedArrival?: string;
  estimatedDeparture?: string;
  status: 'On Time' | 'Delayed' | 'Boarding' | 'Departed' | 'Cancelled';
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  category: 'airside' | 'terminal' | 'landside' | 'security' | 'maintenance' | 'sustainability';
  priority: 'high' | 'medium' | 'low';
  estimatedSavings?: string;
  actionRequired: boolean;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'maintenance' | 'fault' | 'offline';
  health: number;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Incident {
  id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  location: string;
  reportedAt: string;
  assignedTo?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'AOCC_Operator' | 'Airside_Supervisor' | 'Terminal_Supervisor' | 'Landside_Supervisor' | 
        'Security_Manager' | 'Maintenance_Technician' | 'Commercial_Manager' | 'Sustainability_Manager' | 'System_Admin';
  avatar?: string;
}

export interface Language {
  code: 'en' | 'vi';
  name: string;
  nativeName: string;
}

export interface DetailModal {
  Overview: {
    title: string;
    status: 'normal' | 'warning' | 'critical';
    currentValue: number;
    unit: string;
    lastUpdated: string;
    description: string;
    keyMetrics: MetricCard[];
    relatedAssets: AssetReference[];
  };
  TrendsAnalysis: {
    historicalChart: ChartData;
    trendDirection: 'improving' | 'stable' | 'degrading';
    seasonalPatterns: PatternData[];
    correlationAnalysis: CorrelationData[];
    forecastData: PredictionData[];
    benchmarkComparison: BenchmarkData;
  };
  AIInsights: {
    confidenceScore: number;
    modelExplanation: string;
    contributingFactors: FactorData[];
    anomalyDetection: AnomalyData[];
    predictiveAlerts: PredictionAlert[];
    recommendationEngine: AIRecommendation[];
  };
  ActionItems: {
    primaryActions: ActionButton[];
    secondaryActions: ActionButton[];
    scheduledActions: ScheduledAction[];
    completedActions: ActionHistory[];
    approvalWorkflow: ApprovalData[];
    escalationPath: EscalationLevel[];
  };
  Evidence: {
    sourceData: DataSource[];
    attachments: FileAttachment[];
    auditTrail: AuditEntry[];
    relatedIncidents: IncidentReference[];
    maintenanceHistory: MaintenanceRecord[];
    complianceDocuments: ComplianceDoc[];
  };
}

export interface ActionButton {
  type: 'primary' | 'secondary' | 'tertiary';
  action: string;
  confidence: number;
  impact: {
    metric: string;
    expectedChange: number;
    confidenceInterval: [number, number];
  };
  reasoning: string;
  safetyLevel: 'routine' | 'elevated' | 'critical';
  approvalRequired: boolean;
  estimatedDuration: number;
  prerequisites: string[];
  rollbackPlan: string;
}

export interface MetricCard {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface AssetReference {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
}

export interface ChartData {
  timeRange: '24h' | '7d' | '30d' | '90d';
  data: Array<{ time: string; value: number; }>;
}

export interface PatternData {
  period: string;
  pattern: string;
  confidence: number;
}

export interface CorrelationData {
  metric: string;
  correlation: number;
  significance: number;
}

export interface PredictionData {
  time: string;
  predicted: number;
  confidence: [number, number];
}

export interface BenchmarkData {
  category: string;
  currentValue: number;
  benchmark: number;
  percentile: number;
}

export interface FactorData {
  factor: string;
  impact: number;
  confidence: number;
}

export interface AnomalyData {
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface PredictionAlert {
  id: string;
  type: string;
  probability: number;
  timeframe: string;
  mitigation: string;
}

export interface ScheduledAction {
  id: string;
  action: string;
  scheduledTime: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ActionHistory {
  id: string;
  action: string;
  executedAt: string;
  executedBy: string;
  result: string;
  evidence: string[];
}

export interface ApprovalData {
  id: string;
  requiredApprover: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  justification?: string;
}

export interface EscalationLevel {
  level: number;
  role: string;
  timeoutMinutes: number;
  notificationMethod: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  lastUpdate: string;
  quality: number;
  recordCount: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  ipAddress: string;
}

export interface IncidentReference {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  technician: string;
  description: string;
  partsUsed: string[];
  cost: number;
}

export interface ComplianceDoc {
  id: string;
  name: string;
  type: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface PassengerFlow {
  id: string;
  checkpoint: string;
  currentCount: number;
  averageWaitTime: number;
  throughputRate: number;
  predictedWaitTime: number;
  staffingLevel: number;
  recommendedStaffing: number;
}

export interface ParkingZone {
  id: string;
  name: string;
  totalSpaces: number;
  occupiedSpaces: number;
  revenue: number;
  averageSearchTime: number;
  dynamicPricing: boolean;
  currentRate: number;
  predictedDemand: number;
}

export interface SecurityIncident {
  id: string;
  type: 'access_violation' | 'suspicious_activity' | 'emergency' | 'system_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  assignedTo: string;
  cameraIds: string[];
  evidenceFiles: string[];
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  assetId: string;
  assetName: string;
  workType: 'preventive' | 'corrective' | 'predictive' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  scheduledDate: string;
  estimatedHours: number;
  actualHours?: number;
  partsRequired: string[];
  instructions: string;
  completionNotes?: string;
}

export interface RevenueStream {
  id: string;
  category: 'parking' | 'retail' | 'food_beverage' | 'lounges' | 'advertising' | 'other';
  name: string;
  currentRevenue: number;
  targetRevenue: number;
  growth: number;
  margin: number;
  optimization: string[];
}

export interface SustainabilityMetric {
  id: string;
  category: 'energy' | 'emissions' | 'waste' | 'water' | 'noise';
  name: string;
  currentValue: number;
  unit: string;
  target: number;
  deadline: string;
  trend: 'improving' | 'stable' | 'worsening';
  initiatives: string[];
}

export interface SOPPlaybook {
  id: string;
  name: string;
  version: string;
  domain: string;
  triggerConditions: string[];
  steps: SOPStep[];
  approvalRequired: boolean;
  safetyCritical: boolean;
  estimatedDuration: number;
  successRate: number;
  lastUpdated: string;
}

export interface SOPStep {
  id: string;
  order: number;
  action: string;
  description: string;
  responsible: string;
  estimatedMinutes: number;
  dependencies: string[];
  evidence: string[];
}