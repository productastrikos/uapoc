import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useHbmsStore } from '../store/useHbmsStore';

// Types
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type WorkOrderStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
export type Category = 'Maintenance' | 'Repair' | 'Installation' | 'Inspection';

export interface WorkOrder {
  id: string;
  subsystemId: number;
  subsystemName: string;
  subsystemAcronym: string;
  priority: Priority;
  category: Category;
  title: string;
  description: string;
  assignedTo: string;
  createdDate: string;
  targetDate: string;
  completedDate?: string | null;
  status: WorkOrderStatus;
  linkedAlertId?: string | null;
  notes: string[];
  attachments: string[];
  statusHistory: Array<{
    timestamp: string;
    oldStatus: WorkOrderStatus | null;
    newStatus: WorkOrderStatus;
    changedBy: string;
  }>;
}

// All 13 Subsystems
const SUBSYSTEMS = [
  { id: 1, name: 'Security and Access Control System', acronym: 'SACS', color: '#DC2626' },
  { id: 2, name: 'Public Address System', acronym: 'PAS', color: '#016E70' },
  { id: 3, name: 'Fire Alarm System', acronym: 'FAS', color: '#DC2626' },
  { id: 4, name: 'Master Clock System', acronym: 'MCS', color: '#018587' },
  { id: 5, name: 'LBMS (HVAC)', acronym: 'LBMS', color: '#059669' },
  { id: 6, name: 'Integrated Aircraft Stand System', acronym: 'IASS', color: '#018587' },
  { id: 7, name: 'Visual Docking Guidance System', acronym: 'VDGS', color: '#5FDCDA' },
  { id: 8, name: 'Security Screening Equipment', acronym: 'SSE', color: '#DB2777' },
  { id: 9, name: 'Baggage Handling System', acronym: 'BHS', color: '#D97706' },
  { id: 10, name: 'Conveyor Monitoring System', acronym: 'CMS', color: '#EA580C' },
  { id: 11, name: 'Airfield Ground and Air Connectivity', acronym: 'AGAC', color: '#018587' },
  { id: 12, name: 'Lighting Control & Monitoring System', acronym: 'LCMS', color: '#F59E0B' },
  { id: 13, name: 'Supervisory Control and Data Acquisition', acronym: 'SCADA', color: '#016E70' },
];

const WorkOrderManager: React.FC = () => {
  // The source read these six values off the query string. With no router,
  // the console store carries the identical payload — a subsystem/status/
  // priority filter seed, plus the alert that a create-from-alert escalation
  // is pre-filling the form with. Read once on mount, then cleared, so
  // returning to this screen later does not re-open the create form.
  const [link] = useState(() => useHbmsStore.getState().workOrderLink);
  const consumeWorkOrderLink = useHbmsStore((s) => s.consumeWorkOrderLink);
  useEffect(() => { consumeWorkOrderLink(); }, [consumeWorkOrderLink]);

  const urlSubsystem = link?.subsystem ?? null;
  const urlStatus = link?.status ?? null;
  const urlPriority = link?.priority ?? null;

  const alertId = link?.alertId ?? null;
  const alertMessage = link?.message ?? null;
  const alertSeverity = link?.severity ?? null;

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubsystem, setFilterSubsystem] = useState<string>(urlSubsystem || 'all');
  const [filterStatus, setFilterStatus] = useState<string>(urlStatus || 'all');
  const [filterPriority, setFilterPriority] = useState<string>(urlPriority || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subsystemId: 0,
    subsystemName: '',
    subsystemAcronym: '',
    priority: 'Medium' as Priority,
    category: 'Maintenance' as Category,
    title: '',
    description: '',
    assignedTo: '',
    targetDate: '',
    linkedAlertId: ''
  });

  // Load work orders from localStorage on mount
  useEffect(() => {
    const loadWorkOrders = () => {
      try {
        const stored = localStorage.getItem('hbms_work_orders_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          setWorkOrders(parsed);
        } else {
          // Generate sample work orders for demonstration
          const sampleWOs = generateSampleWorkOrders();
          setWorkOrders(sampleWOs);
          localStorage.setItem('hbms_work_orders_v1', JSON.stringify(sampleWOs));
        }
      } catch (err) {
        console.error('Failed to load work orders', err);
      }
    };

    loadWorkOrders();
  }, []);

  // Handle alert data from URL parameters (when coming from AlertCenter)
  useEffect(() => {
    if (alertId && alertMessage) {
      // Find subsystem by acronym
      const subsystem = SUBSYSTEMS.find(s => s.acronym === urlSubsystem?.toUpperCase());

      if (subsystem) {
        // Pre-fill form with alert data
        setFormData({
          subsystemId: subsystem.id,
          subsystemName: subsystem.name,
          subsystemAcronym: subsystem.acronym,
          priority: (alertSeverity as Priority) || 'Medium',
          category: 'Repair' as Category, // Default to Repair for alerts
          title: `Alert: ${alertMessage.substring(0, 50)}${alertMessage.length > 50 ? '...' : ''}`,
          description: alertMessage,
          assignedTo: 'Maintenance Team',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          linkedAlertId: alertId
        });

        // Auto-open create form
        setShowCreateForm(true);
      }
    }
  }, [alertId, alertMessage, alertSeverity, urlSubsystem]);

  // Handle creating new work order
  const handleCreateWorkOrder = () => {
    if (!formData.subsystemId || !formData.title || !formData.description || !formData.targetDate) {
      alert('Please fill in all required fields');
      return;
    }

    const subsystem = SUBSYSTEMS.find(s => s.id === formData.subsystemId);
    if (!subsystem) {
      alert('Invalid subsystem selected');
      return;
    }

    const newWorkOrder: WorkOrder = {
      id: `WO-${subsystem.acronym}-${String(workOrders.length + 1).padStart(3, '0')}`,
      subsystemId: formData.subsystemId,
      subsystemName: subsystem.name,
      subsystemAcronym: subsystem.acronym,
      priority: formData.priority,
      category: formData.category,
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo || 'Unassigned',
      createdDate: new Date().toISOString(),
      targetDate: new Date(formData.targetDate).toISOString(),
      status: 'Open',
      linkedAlertId: formData.linkedAlertId || null,
      notes: [],
      attachments: [],
      statusHistory: [{
        timestamp: new Date().toISOString(),
        oldStatus: null,
        newStatus: 'Open',
        changedBy: 'System'
      }]
    };

    const updatedWorkOrders = [...workOrders, newWorkOrder];
    setWorkOrders(updatedWorkOrders);
    localStorage.setItem('hbms_work_orders_v1', JSON.stringify(updatedWorkOrders));

    // Reset form and close modal
    setShowCreateForm(false);
    setFormData({
      subsystemId: 0,
      subsystemName: '',
      subsystemAcronym: '',
      priority: 'Medium',
      category: 'Maintenance',
      title: '',
      description: '',
      assignedTo: '',
      targetDate: '',
      linkedAlertId: ''
    });

    // Show success message (you can replace with a toast notification)
    alert(`Work Order ${newWorkOrder.id} created successfully!`);
  };


  // Generate sample work orders
  const generateSampleWorkOrders = (): WorkOrder[] => {
    const samples: WorkOrder[] = [
      {
        id: 'WO-SACS-001',
        subsystemId: 1,
        subsystemName: 'Security and Access Control System',
        subsystemAcronym: 'SACS',
        priority: 'High',
        category: 'Maintenance',
        title: 'Security system firmware update',
        description: 'Update security access control firmware to latest version',
        assignedTo: 'Security Team',
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        notes: ['Firmware downloaded', 'Testing in progress'],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      },
      {
        id: 'WO-BHS-001',
        subsystemId: 9,
        subsystemName: 'Baggage Handling System',
        subsystemAcronym: 'BHS',
        priority: 'Critical',
        category: 'Repair',
        title: 'Clear conveyor jam in sorting unit 3',
        description: 'Conveyor jam detected in sorting unit 3 - IMMEDIATE ACTION REQUIRED',
        assignedTo: 'John Repair Team',
        createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        notes: ['Maintenance crew dispatched', 'Jam clearance in progress'],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      },
      {
        id: 'WO-SSE-001',
        subsystemId: 8,
        subsystemName: 'Security Screening Equipment',
        subsystemAcronym: 'SSE',
        priority: 'High',
        category: 'Repair',
        title: 'Repair X-ray scanner in lane 2',
        description: 'X-ray scanner malfunction detected in screening lane 2',
        assignedTo: 'Maintenance Team',
        createdDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        notes: ['Equipment vendor contacted'],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      },
      {
        id: 'WO-LCMS-001',
        subsystemId: 12,
        subsystemName: 'Lighting Control & Monitoring System',
        subsystemAcronym: 'LCMS',
        priority: 'High',
        category: 'Repair',
        title: 'Replace LED modules in apron zone 5',
        description: 'LED module failure detected in apron zone 5',
        assignedTo: 'Maintenance Team',
        createdDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        notes: ['Replacement parts ordered'],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      },
      {
        id: 'WO-PAS-001',
        subsystemId: 2,
        subsystemName: 'Public Address System',
        subsystemAcronym: 'PAS',
        priority: 'Medium',
        category: 'Inspection',
        title: 'Monthly audio system inspection',
        description: 'Scheduled monthly inspection of PA system components',
        assignedTo: 'Audio Team',
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Completed',
        notes: ['All systems checked', 'No issues found'],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      },
      {
        id: 'WO-VDGS-001',
        subsystemId: 7,
        subsystemName: 'Visual Docking Guidance System',
        subsystemAcronym: 'VDGS',
        priority: 'Medium',
        category: 'Maintenance',
        title: 'Display calibration - Stand A12',
        description: 'Calibrate VDGS display at aircraft stand A12',
        assignedTo: 'Tech Support',
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        targetDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Open',
        notes: [],
        attachments: [],
        statusHistory: [{
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          oldStatus: null,
          newStatus: 'Open',
          changedBy: 'System'
        }]
      }
    ];
    return samples;
  };

  // Helper functions
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-status-error bg-status-error/10 border-status-error/30';
      case 'High':
        return 'text-status-warning bg-status-warning/20 border-status-warning/40';
      case 'Medium':
        return 'text-status-warning bg-status-warning/10 border-status-warning/25';
      case 'Low':
        return 'text-accent-blue bg-accent-blue/10 border-accent-blue/30';
      default:
        return 'text-text-secondary bg-primary-600/30 border-primary-600/50';
    }
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Open':
        return 'text-accent-blue bg-accent-blue/10 border-accent-blue/30';
      case 'In Progress':
        return 'text-status-warning bg-status-warning/10 border-status-warning/30';
      case 'Completed':
        return 'text-status-neutral bg-status-neutral/10 border-status-neutral/30';
      case 'Cancelled':
        return 'text-text-secondary bg-primary-600/30 border-primary-600/50';
      default:
        return 'text-text-secondary bg-primary-600/30 border-primary-600/50';
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'Maintenance':
        return <RefreshCw className="w-4 h-4" />;
      case 'Repair':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Installation':
        return <Package className="w-4 h-4" />;
      case 'Inspection':
        return <Eye className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSubsystemColor = (subsystemId: number) => {
    const subsystem = SUBSYSTEMS.find(s => s.id === subsystemId);
    return subsystem?.color || '#8A9BA8';
  };

  // Filtered and sorted work orders
  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.subsystemAcronym.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Subsystem filter
    if (filterSubsystem !== 'all') {
      filtered = filtered.filter(wo => wo.subsystemAcronym.toLowerCase() === filterSubsystem.toLowerCase());
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(wo => wo.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(wo => wo.priority === filterPriority);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(wo => wo.category === filterCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'date') {
        compareValue = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'status') {
        const statusOrder = { 'In Progress': 0, 'Open': 1, 'Completed': 2, 'Cancelled': 3 };
        compareValue = statusOrder[a.status] - statusOrder[b.status];
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [workOrders, searchQuery, filterSubsystem, filterStatus, filterPriority, filterCategory, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: workOrders.length,
      open: workOrders.filter(wo => wo.status === 'Open').length,
      inProgress: workOrders.filter(wo => wo.status === 'In Progress').length,
      completed: workOrders.filter(wo => wo.status === 'Completed').length,
      critical: workOrders.filter(wo => wo.priority === 'Critical').length,
      high: workOrders.filter(wo => wo.priority === 'High').length,
    };
  }, [workOrders]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Subsystem', 'Title', 'Priority', 'Status', 'Category', 'Assigned To', 'Created Date', 'Target Date'];
    const rows = filteredWorkOrders.map(wo => [
      wo.id,
      wo.subsystemAcronym,
      wo.title,
      wo.priority,
      wo.status,
      wo.category,
      wo.assignedTo,
      new Date(wo.createdDate).toLocaleDateString(),
      new Date(wo.targetDate).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };


  return (
    <div
      className="h-full overflow-y-auto no-scrollbar text-text-primary overflow-x-hidden"
      style={{ background: 'var(--app-bg)' }}
    >
      <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-6">

        {/* ═══════════ HEADER ═══════════ */}
        <div
          className="glass-panel rounded-2xl px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ boxShadow: '0 4px 40px rgba(1,163,164,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#3B82F6', boxShadow: '0 4px 20px rgba(1,163,164,0.4)' }}
            >
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Work Order Manager</h1>
              <p className="text-xs text-text-secondary mt-0.5">Manage maintenance, repairs &amp; inspections across all subsystems</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-accent-blue/10 text-text-secondary hover:text-white transition-all"
              style={{ background: 'rgba(32, 120, 207,0.06)' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => {
                setFormData({ subsystemId: 0, subsystemName: '', subsystemAcronym: '', priority: 'Medium', category: 'Maintenance', title: '', description: '', assignedTo: '', targetDate: '', linkedAlertId: '' });
                setShowCreateForm(true);
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: '#3B82F6', boxShadow: '0 4px 16px rgba(1,163,164,0.3)' }}
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          </div>
        </div>

        {/* ═══════════ STATS CARDS ═══════════ */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: stats.total, color: '#8A9BA8', tint: 'glass-pill-neutral' },
            { label: 'Open', value: stats.open, color: '#3B82F6', tint: 'glass-pill-blue' },
            { label: 'In Progress', value: stats.inProgress, color: '#E6B85C', tint: 'glass-pill-violet' },
            { label: 'Completed', value: stats.completed, color: '#34D399', tint: 'glass-pill-teal' },
            { label: 'Critical', value: stats.critical, color: '#F87171', tint: 'glass-pill-blue' },
            { label: 'High', value: stats.high, color: '#E6B85C', tint: 'glass-pill-violet' },
          ].map((card, i) => (
            <div
              key={i}
              className={`glass-pill ${card.tint} p-3`}
            >
              <p className="text-xs text-text-secondary mb-2">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ═══════════ SEARCH & FILTERS ═══════════ */}
        <div className="glass-panel rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by ID, title, or subsystem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-primary-800 text-text-primary placeholder-text-muted border border-primary-600 focus:outline-none focus:border-accent-blue transition-colors"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, ord] = e.target.value.split('-');
                  setSortBy(by as 'date' | 'priority' | 'status');
                  setSortOrder(ord as 'asc' | 'desc');
                }}
                className="px-2 py-2.5 rounded-xl text-sm bg-primary-800 text-text-secondary border border-primary-600 focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="priority-asc">Priority: Critical→Low</option>
                <option value="status-asc">Status: Active→Done</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`chip px-3 py-2.5 text-sm ${showFilters ? 'chip-active' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-accent-blue/5">
              {[
                {
                  label: 'Subsystem', value: filterSubsystem, onChange: setFilterSubsystem,
                  options: [{ value: 'all', label: 'All Subsystems' }, ...SUBSYSTEMS.map(s => ({ value: s.acronym.toLowerCase(), label: `${s.acronym} - ${s.name.split(' ').slice(0,2).join(' ')}` }))]
                },
                {
                  label: 'Status', value: filterStatus, onChange: setFilterStatus,
                  options: [{ value: 'all', label: 'All Statuses' }, { value: 'Open', label: 'Open' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]
                },
                {
                  label: 'Priority', value: filterPriority, onChange: setFilterPriority,
                  options: [{ value: 'all', label: 'All Priorities' }, { value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]
                },
                {
                  label: 'Category', value: filterCategory, onChange: setFilterCategory,
                  options: [{ value: 'all', label: 'All Categories' }, { value: 'Maintenance', label: 'Maintenance' }, { value: 'Repair', label: 'Repair' }, { value: 'Installation', label: 'Installation' }, { value: 'Inspection', label: 'Inspection' }]
                },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wide">{f.label}</label>
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl text-sm bg-primary-800 text-text-secondary border border-primary-600 focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════ WORK ORDER LIST ═══════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Showing <span className="text-white font-medium">{filteredWorkOrders.length}</span> of <span className="text-white font-medium">{workOrders.length}</span> work orders
            </p>
          </div>

          {filteredWorkOrders.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{ background: 'rgba(7,16,40,0.6)', borderColor: 'rgba(32, 120, 207,0.06)' }}
            >
              <FileText size={40} className="mx-auto mb-3 text-text-muted" />
              <p className="text-text-secondary font-medium">No work orders found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredWorkOrders.map((wo) => {
              const subColor = getSubsystemColor(wo.subsystemId);
              return (
                <div
                  key={wo.id}
                  className="rounded-2xl border p-4 flex flex-col md:flex-row md:items-center gap-3 transition-all hover:border-accent-blue/20 cursor-pointer"
                  style={{
                    background: 'var(--app-surface)',
                    borderColor: 'rgba(32, 120, 207,0.06)',
                  }}
                  onClick={() => { setSelectedWorkOrder(wo); setShowDetailModal(true); }}
                >
                  {/* Subsystem color accent */}
                  <div className="w-1 self-stretch rounded-full hidden md:block flex-shrink-0" style={{ background: subColor, minHeight: '60px' }} />

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${subColor}18`, color: subColor }}
                  >
                    {getCategoryIcon(wo.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-bold text-text-secondary">{wo.id}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg border" style={{ color: subColor, background: `${subColor}15`, borderColor: `${subColor}30` }}>{wo.subsystemAcronym}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getPriorityColor(wo.priority)}`}>{wo.priority}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(wo.status)}`}>{wo.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary truncate">{wo.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-text-muted">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {wo.assignedTo}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(wo.createdDate)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(wo.targetDate).toLocaleDateString()}</span>
                      <span className="capitalize text-text-muted">{wo.category}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedWorkOrder(wo); setShowDetailModal(true); }}
                      className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium border transition-all hover:brightness-110"
                      style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)', color: '#8A9BA8' }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {wo.status !== 'Completed' && wo.status !== 'Cancelled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus: WorkOrderStatus = wo.status === 'Open' ? 'In Progress' : 'Completed';
                          const updated = workOrders.map(w => w.id === wo.id ? {
                            ...w, status: newStatus,
                            completedDate: newStatus === 'Completed' ? new Date().toISOString() : null,
                            statusHistory: [...w.statusHistory, { timestamp: new Date().toISOString(), oldStatus: w.status, newStatus, changedBy: 'User' }]
                          } : w);
                          setWorkOrders(updated);
                          localStorage.setItem('hbms_work_orders_v1', JSON.stringify(updated));
                        }}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 min-w-[5.5rem]"
                        style={{ background: wo.status === 'Open' ? '#F59E0B' : '#10B981' }}
                      >
                        {wo.status === 'Open' ? 'Start' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════ DETAIL MODAL ═══════════ */}
      {showDetailModal && selectedWorkOrder && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-3"
          style={{ background: 'rgba(4,16,31,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-surface rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ boxShadow: '0 0 80px rgba(1,163,164,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${getSubsystemColor(selectedWorkOrder.subsystemId)}18`, color: getSubsystemColor(selectedWorkOrder.subsystemId) }}
                >
                  {getCategoryIcon(selectedWorkOrder.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-sm font-bold text-text-secondary">{selectedWorkOrder.id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getPriorityColor(selectedWorkOrder.priority)}`}>{selectedWorkOrder.priority}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(selectedWorkOrder.status)}`}>{selectedWorkOrder.status}</span>
                  </div>
                  <p className="text-base font-bold text-white">{selectedWorkOrder.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-xl text-text-secondary hover:text-white transition-all"
                style={{ background: 'rgba(32, 120, 207,0.05)' }}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: 'Subsystem', value: `${selectedWorkOrder.subsystemAcronym} - ${selectedWorkOrder.subsystemName}` },
                { label: 'Category', value: selectedWorkOrder.category },
                { label: 'Assigned To', value: selectedWorkOrder.assignedTo },
                { label: 'Created', value: formatDate(selectedWorkOrder.createdDate) },
                { label: 'Target Date', value: new Date(selectedWorkOrder.targetDate).toLocaleDateString() },
                { label: 'Linked Alert', value: selectedWorkOrder.linkedAlertId || 'None' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-2" style={{ background: 'rgba(32, 120, 207,0.03)', border: '1px solid rgba(32, 120, 207,0.06)' }}>
                  <p className="text-xs text-text-muted mb-1">{item.label}</p>
                  <p className="text-sm text-text-primary font-medium truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(32, 120, 207,0.03)', border: '1px solid rgba(32, 120, 207,0.06)' }}>
              <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">Description</p>
              <p className="text-sm text-text-secondary">{selectedWorkOrder.description}</p>
            </div>

            {/* Notes */}
            {selectedWorkOrder.notes.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(32, 120, 207,0.03)', border: '1px solid rgba(32, 120, 207,0.06)' }}>
                <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">Notes</p>
                <ul className="space-y-1">
                  {selectedWorkOrder.notes.map((note, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-accent-blue flex-shrink-0">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {selectedWorkOrder.status !== 'Completed' && selectedWorkOrder.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    const newStatus: WorkOrderStatus = selectedWorkOrder.status === 'Open' ? 'In Progress' : 'Completed';
                    const updated = workOrders.map(w => w.id === selectedWorkOrder.id ? {
                      ...w, status: newStatus,
                      completedDate: newStatus === 'Completed' ? new Date().toISOString() : null,
                      statusHistory: [...w.statusHistory, { timestamp: new Date().toISOString(), oldStatus: w.status, newStatus, changedBy: 'User' }]
                    } : w);
                    setWorkOrders(updated);
                    localStorage.setItem('hbms_work_orders_v1', JSON.stringify(updated));
                    setSelectedWorkOrder({ ...selectedWorkOrder, status: newStatus });
                  }}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110"
                  style={{ background: selectedWorkOrder.status === 'Open' ? '#F59E0B' : '#10B981' }}
                >
                  {selectedWorkOrder.status === 'Open' ? 'Mark In Progress' : 'Mark Completed'}
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-accent-blue/10 text-text-secondary hover:text-white transition-all"
                style={{ background: 'rgba(32, 120, 207,0.05)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CREATE WORK ORDER MODAL ═══════════ */}
      {showCreateForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-3"
          style={{ background: 'rgba(4,16,31,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="modal-surface rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ boxShadow: '0 0 80px rgba(1,163,164,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3B82F6' }}>
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Work Order</h2>
                  <p className="text-xs text-text-secondary">HBMS &middot; Long Thanh International Airport</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-xl text-text-secondary hover:text-white transition-all"
                style={{ background: 'rgba(32, 120, 207,0.05)' }}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Subsystem */}
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">
                  Subsystem <span className="text-status-error">*</span>
                </label>
                <select
                  value={formData.subsystemId || ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const sub = SUBSYSTEMS.find(s => s.id === id);
                    if (sub) setFormData({ ...formData, subsystemId: id, subsystemName: sub.name, subsystemAcronym: sub.acronym });
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)', color: '#E6EEF6' }}
                >
                  <option value="">-- Select Subsystem --</option>
                  {SUBSYSTEMS.map(s => <option key={s.id} value={s.id}>{s.acronym} - {s.name}</option>)}
                </select>
              </div>

              {/* Priority + Category */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Priority', key: 'priority', value: formData.priority,
                    options: ['Critical', 'High', 'Medium', 'Low'],
                    onChange: (v: string) => setFormData({ ...formData, priority: v as Priority }),
                  },
                  {
                    label: 'Category', key: 'category', value: formData.category,
                    options: ['Maintenance', 'Repair', 'Installation', 'Inspection'],
                    onChange: (v: string) => setFormData({ ...formData, category: v as Category }),
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">
                      {field.label} <span className="text-status-error">*</span>
                    </label>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue"
                      style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)', color: '#E6EEF6' }}
                    >
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">
                  Title <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the work order"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue text-text-primary placeholder-text-muted"
                  style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">
                  Description <span className="text-status-error">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the issue and required work"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue text-text-primary placeholder-text-muted resize-none"
                  style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)' }}
                />
              </div>

              {/* Assigned To + Target Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">Assigned To</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="Team or person name"
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue text-text-primary placeholder-text-muted"
                    style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block uppercase tracking-wide">
                    Target Date <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-accent-blue text-text-primary"
                    style={{ background: 'rgba(32, 120, 207,0.05)', borderColor: 'rgba(32, 120, 207,0.08)' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-accent-blue/5">
                <button
                  onClick={handleCreateWorkOrder}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: '#3B82F6' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Work Order
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-accent-blue/10 text-text-secondary hover:text-white transition-all"
                  style={{ background: 'rgba(32, 120, 207,0.05)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderManager;
