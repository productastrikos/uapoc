import React, { useState } from 'react';
import { Shield, Eye, AlertTriangle, Users, Camera, Lock, Phone, MapPin, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { SecurityIncident } from '../../types';
import DetailModal from '../UI/DetailModal';
import SimulationLauncher from '../../simulations/SimulationLauncher';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import AiInsightPanel from '../../ai/components/AiInsightPanel';
import { useAiDomain } from '../../ai/store';

const SecurityOperations: React.FC = () => {
  // Scopes the AI Advisory drawer to this console.
  useAiDomain('security');
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState<any>(null);
  const [recordingFeeds, setRecordingFeeds] = useState<Record<string, boolean>>({});

  const securityIncidents: SecurityIncident[] = [
    {
      id: '1',
      type: 'access_violation',
      severity: 'high',
      location: 'Terminal A - Checkpoint 3',
      description: 'Unauthorized access attempt detected via proximity card reader',
      reportedAt: '2025-01-19T08:23:15Z',
      status: 'investigating',
      assignedTo: 'Security Team Alpha',
      cameraIds: ['CAM-003', 'CAM-007'],
      evidenceFiles: ['evidence_001.mp4', 'access_log_20250119.csv']
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'medium',
      location: 'Parking Zone B',
      description: 'Individual observed loitering near restricted area for 25+ minutes',
      reportedAt: '2025-01-19T07:45:32Z',
      status: 'resolved',
      assignedTo: 'Security Team Beta',
      cameraIds: ['CAM-021', 'CAM-022'],
      evidenceFiles: ['footage_021_20250119.mp4']
    },
    {
      id: '3',
      type: 'emergency',
      severity: 'critical',
      location: 'Gate A12',
      description: 'Medical emergency - passenger collapse during boarding',
      reportedAt: '2025-01-19T06:12:08Z',
      status: 'resolved',
      assignedTo: 'Medical Response Team',
      cameraIds: ['CAM-A12'],
      evidenceFiles: ['incident_report_A12.pdf', 'medical_response.mp4']
    }
  ];

  const threatLevels = [
    { time: '06:00', level: 2 },
    { time: '08:00', level: 4 },
    { time: '10:00', level: 3 },
    { time: '12:00', level: 5 },
    { time: '14:00', level: 3 },
    { time: '16:00', level: 2 },
  ];

  const incidentTypes = [
    { name: 'Access Violations', value: 45, color: '#EF4444' },
    { name: 'Suspicious Activity', value: 28, color: '#F59E0B' },
    { name: 'Emergency Response', value: 18, color: '#3B82F6' },
    { name: 'System Breach', value: 9, color: '#8B5CF6' },
  ];

  // CCTV Feeds Data with YouTube videos (3x2 grid = 6 cameras)
  const cctvFeeds = [
    { id: 'CAM-001', location: 'Terminal 1 Main Entrance', status: 'active', alerts: 0, recording: true, videoUrl: 'https://www.youtube.com/embed/MjD3gnNFYUo?si=uyKfO4rbSdzJn8HX&autoplay=1&mute=1' },
    { id: 'CAM-002', location: 'Security Checkpoint A', status: 'active', alerts: 1, recording: true, videoUrl: 'https://www.youtube.com/embed/lOP1y48sInY?si=6POuqFWNQ6WEpE8p&autoplay=1&mute=1' },
    { id: 'CAM-003', location: 'Baggage Claim Area', status: 'maintenance', alerts: 0, recording: false, videoUrl: 'https://www.youtube.com/embed/vwLPQLcGhRM?si=ELtfE8GRxUsyZD9v&autoplay=1&mute=1' },
    { id: 'CAM-004', location: 'Parking Structure P1', status: 'active', alerts: 2, recording: true, videoUrl: 'https://www.youtube.com/embed/sRjbbHl3gV0?si=czw-TybzEh0aIfl9&autoplay=1&mute=1' },


    
    { id: 'CAM-005', location: 'Perimeter Fence East', status: 'active', alerts: 3, recording: true, videoUrl: 'https://www.youtube.com/embed/MjD3gnNFYUo?si=uyKfO4rbSdzJn8HX&autoplay=1&mute=1' },
    { id: 'CAM-006', location: 'Airside Apron Area', status: 'active', alerts: 0, recording: true, videoUrl: 'https://www.youtube.com/embed/lOP1y48sInY?si=6POuqFWNQ6WEpE8p&autoplay=1&mute=1' },
  ];

  const handleIncidentClick = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setShowModal(true);
  };

  const handleEmergencyResponse = (incident: SecurityIncident) => {
    addToast({
      type: 'success',
      title: t('security.emergency_dispatched'),
      message: `Emergency response team dispatched to ${incident.location}`,
      duration: 5000
    });
  };

  const handleCameraControl = (cameraId: string) => {
    addToast({
      type: 'info',
      title: t('security.camera_control'),
      message: `Camera ${cameraId} PTZ control activated`,
      duration: 3000
    });
  };

  const handleCameraClick = (feed: any) => {
    addToast({
      type: 'info',
      title: 'Camera Selected',
      message: `${feed.id} - ${feed.location} feed activated`,
      duration: 3000
    });
  };

  const handleFullscreenCamera = (feed: any) => {
    setFullscreenCamera(feed);
  };

  const closeFullscreen = () => {
    setFullscreenCamera(null);
  };

  const toggleRecording = (cameraId: string) => {
    setRecordingFeeds(prev => ({
      ...prev,
      [cameraId]: !prev[cameraId]
    }));
    
    addToast({
      type: recordingFeeds[cameraId] ? 'info' : 'success',
      title: recordingFeeds[cameraId] ? 'Recording Stopped' : 'Recording Started',
      message: `Camera ${cameraId} ${recordingFeeds[cameraId] ? 'stopped' : 'started'} recording`,
      duration: 3000
    });
  };

  // Enhanced Fullscreen Camera Modal
  const FullscreenCameraModal = ({ camera }: { camera: any }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2"
        onClick={closeFullscreen}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="modal-surface rounded-xl w-[95vw] h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary-600 bg-primary-900">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-accent-blue/15 rounded-lg">
                <Camera className="h-5 w-5 text-accent-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">{camera.id}</h3>
                <p className="text-sm text-text-muted">{camera.location}</p>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                camera.status === 'active' ? 'bg-status-success bg-opacity-20' : 'bg-status-error bg-opacity-20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  camera.status === 'active' ? 'bg-status-success' : 'bg-status-error'
                }`}></div>
                <span className={`text-xs font-medium ${
                  camera.status === 'active' ? 'text-status-success' : 'text-status-error'
                }`}>
                  {camera.status.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={closeFullscreen}
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-text-primary" />
            </button>
          </div>

          {/* Enhanced Camera Feed Area */}
          <div className="flex-1 relative bg-black">
            {camera.videoUrl ? (
              <iframe
                src={camera.videoUrl}
                title={`${camera.id} Live Feed`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className={`w-20 h-20 mx-auto mb-4 ${camera.status === 'active' ? 'text-accent-blue' : 'text-text-muted'}`} />
                  <p className="text-text-muted text-lg">No video feed available</p>
                </div>
              </div>
            )}

            {/* Enhanced Recording Indicator */}
            {(recordingFeeds[camera.id] || camera.recording) && (
              <div className="absolute top-4 left-4 flex items-center space-x-3 bg-status-error/90 px-4 py-2 rounded-lg border border-status-error">
                <div className="w-4 h-4 bg-status-error rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-lg tracking-wider">● REC</span>
              </div>
            )}

            {/* Status Overlays */}
            {camera.status === 'maintenance' && (
              <div className="absolute inset-0 bg-status-error bg-opacity-30 flex items-center justify-center">
                <div className="text-center bg-black bg-opacity-60 p-6 rounded-xl">
                  <AlertTriangle className="w-16 h-16 text-status-error mx-auto mb-4" />
                  <p className="text-status-error font-bold text-xl">Camera Under Maintenance</p>
                </div>
              </div>
            )}

            {camera.alerts > 0 && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-status-error bg-opacity-90 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="text-white font-bold">{camera.alerts} Alert(s)</span>
              </div>
            )}
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center justify-between p-6 bg-primary-900 border-t border-primary-600">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleRecording(camera.id)}
                className={`btn min-w-[8.5rem] ${recordingFeeds[camera.id] ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span>{recordingFeeds[camera.id] ? 'Stop Recording' : 'Start Recording'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-text-muted">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
                <span>Live Feed</span>
              </div>
              <span>|</span>
              <span>Quality: HD 1080p</span>
              <span>|</span>
              <span>FPS: 30</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-accent-blue/15 rounded-lg">
            <Shield className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('nav.security')}</h1>
            <p className="text-sm text-text-muted">{t('security.subtitle')}</p>
          </div>
        </div>

        <SimulationLauncher simulationId="security" label="Security Simulation" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: t('security.active_incidents'), value: '3', icon: AlertTriangle, color: 'text-status-error', change: '+1', tint: 'glass-pill-blue' },
          { label: t('security.cameras_online'), value: '96/98', icon: Eye, color: 'text-status-success', change: '+2', tint: 'glass-pill-teal' },
          { label: t('security.response_time'), value: '2.3m', icon: Phone, color: 'text-accent-blue', change: '-0.5m', tint: 'glass-pill-violet' },
          { label: t('security.threat_level'), value: 'Medium', icon: Shield, color: 'text-status-warning', change: 'Stable', tint: 'glass-pill-neutral' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className={`glass-pill ${stat.tint} hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer`}
            onClick={() => handleIncidentClick(securityIncidents[0])}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="h-5 w-5 text-text-muted" />
              <span className={`text-sm font-medium ${stat.change.startsWith('+') && stat.change !== '+2' ? 'text-status-error' : 'text-status-success'}`}>
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
      <AiInsightPanel domain="security" />

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Incident Management */}
        <div className="col-span-8 space-y-8">
          {/* Live Incident Board */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-text-primary">{t('security.incident_management')}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-error rounded-full"></div>
                  <span className="text-text-muted">{t('security.critical')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-warning rounded-full"></div>
                  <span className="text-text-muted">{t('security.investigating')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-status-success rounded-full"></div>
                  <span className="text-text-muted">{t('security.resolved')}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {securityIncidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-primary-800/60 rounded-xl border border-primary-600/40 hover:border-accent-blue/40 transition-colors duration-200 cursor-pointer group"
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        incident.severity === 'critical' ? 'bg-status-error bg-opacity-20' :
                        incident.severity === 'high' ? 'bg-status-warning bg-opacity-20' :
                        'bg-status-info bg-opacity-20'
                      }`}>
                        {incident.type === 'emergency' ? <Phone className="h-5 w-5 text-status-error" /> :
                         incident.type === 'access_violation' ? <Lock className="h-5 w-5 text-status-warning" /> :
                         <Eye className="h-5 w-5 text-status-info" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                            {incident.description}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            incident.severity === 'critical' ? 'bg-status-error/10 text-status-error border-status-error/30' :
                            incident.severity === 'high' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                            'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
                          }`}>
                            {incident.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-text-muted mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{incident.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{incident.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Camera className="h-4 w-4" />
                            <span>{incident.cameraIds.length} cameras</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            incident.status === 'resolved' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                            incident.status === 'investigating' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                            'bg-status-error/10 text-status-error border-status-error/30'
                          }`}>
                            {incident.status}
                          </span>
                          <span className="text-xs text-text-muted">
                            {new Date(incident.reportedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {incident.severity === 'critical' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmergencyResponse(incident);
                          }}
                          className="btn btn-danger text-xs px-2.5 py-1"
                        >
                          {t('security.emergency_response')}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCameraControl(incident.cameraIds[0]);
                        }}
                        className="btn btn-secondary text-xs px-2.5 py-1"
                      >
                        {t('security.view_cameras')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CCTV Control Matrix - 3x2 Grid with YouTube Videos */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">{t('security.cctv_monitoring')}</h2>
            
            {/* 3x2 CCTV Grid with Embedded Videos */}
            <div className="grid grid-cols-3 grid-rows-2 gap-6">
              {cctvFeeds.map((feed, index) => (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className={`relative p-4 bg-primary-800/60 rounded-xl border transition-colors duration-200 cursor-pointer ${
                    feed.status === 'maintenance' ? 'border-status-error/30' : 'border-primary-600/40 hover:border-accent-blue/40'
                  }`}
                  onClick={() => handleCameraClick(feed)}
                >
                  {/* Camera Display with YouTube Video */}
                  <div className="bg-primary-900 rounded-lg aspect-video mb-3 relative overflow-hidden">
                    {feed.videoUrl ? (
                      <iframe
                        src={feed.videoUrl}
                        title={`${feed.id} Feed`}
                        className="w-full h-full rounded-lg"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className={`w-8 h-8 ${feed.status === 'active' ? 'text-accent-blue' : 'text-text-muted'}`} />
                      </div>
                    )}

                    {/* Recording Indicator */}
                    {(recordingFeeds[feed.id] || feed.recording) && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-status-error rounded-full animate-pulse"></div>
                    )}

                    {/* Maintenance Overlay */}
                    {feed.status === 'maintenance' && (
                      <div className="absolute inset-0 bg-status-error bg-opacity-20 flex items-center justify-center rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-status-error" />
                      </div>
                    )}
                    
                    {/* Fullscreen Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFullscreenCamera(feed);
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-lg transition-colors"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  
                  {/* Camera Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text-primary">{feed.id}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        feed.status === 'active' ? 'bg-status-success' : 'bg-status-error'
                      }`}></div>
                    </div>
                    <p className="text-xs text-text-muted truncate">{feed.location}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        feed.status === 'active' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                        'bg-status-error/10 text-status-error border-status-error/30'
                      }`}>
                        {feed.status}
                      </span>
                      {feed.alerts > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-status-error/10 text-status-error border border-status-error/30 font-medium">
                          {feed.alerts}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics (Rearranged) */}
        <div className="col-span-4 space-y-8">
          {/* Threat Level Trends */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">{t('security.threat_trends')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={threatLevels}>
                  <XAxis dataKey="time" stroke="#8A9BA8" fontSize={12} />
                  <YAxis stroke="#8A9BA8" fontSize={12} />
                  <Line 
                    type="monotone" 
                    dataKey="level" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incident Distribution */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">{t('security.incident_types')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {incidentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {incidentTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                    <span className="text-text-muted">{type.name}</span>
                  </div>
                  <span className="text-text-primary font-medium">{type.value}%</span>
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
        title={selectedIncident?.description || t('security.incident_details')}
        data={{
          Overview: {
            title: selectedIncident?.description || '',
            status: selectedIncident?.severity === 'critical' ? 'critical' : 'warning',
            currentValue: selectedIncident ? 1 : 0,
            unit: 'incident',
            lastUpdated: selectedIncident?.reportedAt || new Date().toISOString(),
            description: selectedIncident?.description || '',
            keyMetrics: [],
            relatedAssets: []
          }
        }}
      />

      {/* Enhanced Fullscreen Camera Modal */}
      {fullscreenCamera && <FullscreenCameraModal camera={fullscreenCamera} />}
    </motion.div>
  );
};

export default SecurityOperations;
