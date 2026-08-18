import React, { useState, useEffect } from 'react';
import { SecurityIncident, SecuritySOP } from '../types';
import { Shield, AlertTriangle, Camera, Lock, Clock, PlayCircle, X, Gauge, Activity } from 'lucide-react';
import CCTVFeed from './CCTVFeed';
import SOPPanel from './SOPPanel';
import IsoSecurityScene from '../scenes/IsoSecurityScene';
import { useManagedTimers } from '../scenes/motion';

interface SecurityOperationsProps {
  onIncidentResolve?: (incidentId: string) => void;
}

/**
 * Who owns each step of the unattended-baggage SOP. Kept beside the step list
 * so the panel next to the scene reads as a real procedure rather than a
 * progress bar.
 */
const STEP_OWNERS = [
  'Security Control',
  'CCTV Operator',
  'PA System',
  'Access Control',
  'Facilities',
  'Response Team',
];

export const SecurityOperations: React.FC<SecurityOperationsProps> = ({ onIncidentResolve }) => {
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [activeSOP, setActiveSOP] = useState<SecuritySOP | null>(null);
  const [sopProgress, setSOPProgress] = useState(0);
  const [activeFeed, setActiveFeed] = useState(0);
  const [alertMode, setAlertMode] = useState(false);
  /** Step index driving the isometric scene; -1 when no SOP is running. */
  const [sopStep, setSopStep] = useState(-1);
  /** Playback rate for the SOP walk-through; 1x is deliberately unhurried. */
  const [simSpeed, setSimSpeed] = useState(1);
  const { schedule, clearAll } = useManagedTimers();

  const [incidents] = useState<SecurityIncident[]>([
    {
      id: '1',
      type: 'Unattended Baggage',
      location: 'Gate 13 - Departure Area',
      severity: 'Critical',
      status: 'Active',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      description: 'Suspicious unattended bag detected by AI surveillance system',
      cameraId: 'CAM-13-A',
      aiConfidence: 94
    },
    {
      id: '2', 
      type: 'Perimeter Breach',
      location: 'Restricted Zone Alpha',
      severity: 'High',
      status: 'Investigating',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      cameraId: 'CAM-P-01'
    }
  ]);

  const mockSOP: SecuritySOP = {
    id: "SOP-001",
    trigger: "Unattended baggage detection",
    steps: [
      { id: 1, action: "Issue red alert to security department", duration: 5, status: 'pending' },
      { id: 2, action: "Activate all cameras to focus on incident area", duration: 8, status: 'pending' },
      { id: 3, action: "Broadcast PA system notification to personnel", duration: 12, status: 'pending' },
      { id: 4, action: "Lock down access points in affected zones", duration: 15, status: 'pending' },
      { id: 5, action: "Activate emergency lighting protocols", duration: 18, status: 'pending' },
      { id: 6, action: "Dispatch security team to investigate location", duration: 25, status: 'pending' }
    ],
    autoExecute: true,
    manualOverride: false,
    estimatedDuration: 90,
    currentStep: 0,
  };

  const feeds = [
    { id: 1, location: 'Gate 13 - Entrance', status: 'active', alert: true },
    { id: 2, location: 'Security Checkpoint A', status: 'active', alert: false },
    { id: 3, location: 'Baggage Claim Area', status: 'active', alert: false },
    { id: 4, location: 'Terminal Main Hall', status: 'active', alert: false },
    { id: 5, location: 'Restricted Access Zone', status: 'active', alert: false },
    { id: 6, location: 'Emergency Exit Corridor', status: 'maintenance', alert: false }
  ];

  useEffect(() => {
    // Simulate alert detection animation
    const interval = setInterval(() => {
      setAlertMode(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'High': return 'text-simgold-400 bg-simgold-400/10 border-simgold-400/30';
      case 'Medium': return 'text-simgold-400 bg-simgold-400/10 border-simgold-400/30';
      case 'Low': return 'text-simteal-400 bg-simteal-400/10 border-simteal-400/30';
      default: return 'text-sim-400 bg-sim-400/10 border-sim-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'Investigating': return 'text-simgold-400 bg-simgold-400/10 border-simgold-400/30';
      case 'Resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      default: return 'text-sim-400 bg-sim-400/10 border-sim-400/30';
    }
  };

  const executeSOP = (incident: SecurityIncident) => {
    if (activeSOP) return; // already running

    clearAll();
    setSopStep(0);
    setActiveSOP({
      ...mockSOP,
      trigger: `${incident.type} at ${incident.location}`,
      steps: mockSOP.steps.map(step => ({ ...step, status: 'pending' }))
    });
    setSOPProgress(0);

    // Execute SOP steps sequentially. Every timer is registered so closing the
    // simulation overlay mid-run tears the whole chain down instead of leaving
    // it firing setState against an unmounted component.
    const executeStep = (stepIndex: number) => {
      if (stepIndex >= mockSOP.steps.length) {
        schedule(() => {
          onIncidentResolve?.(incident.id);
          setActiveSOP(null);
          setSopStep(-1);
          setSOPProgress(100);
        }, 5000);
        return;
      }

      setSopStep(stepIndex);
      setSOPProgress(Math.round((stepIndex / mockSOP.steps.length) * 100));

      setActiveSOP(prev => prev ? {
        ...prev,
        currentStep: stepIndex,
        steps: prev.steps.map((step, index) =>
          index === stepIndex
            ? { ...step, status: 'in-progress' as const }
            : index < stepIndex
            ? { ...step, status: 'completed' as const }
            : step
        )
      } : null);

      schedule(() => {
        setActiveSOP(prev => prev ? {
          ...prev,
          steps: prev.steps.map((step, index) =>
            index === stepIndex
              ? { ...step, status: 'completed' as const, completedAt: new Date() }
              : step
          )
        } : null);

        schedule(() => executeStep(stepIndex + 1), 1400 / simSpeed);
        // Long enough that the scene change for each step - cameras slewing,
        // doors locking, the team walking in - can actually be watched.
      }, Math.max(3800, mockSOP.steps[stepIndex].duration * 320) / simSpeed);
    };

    executeStep(0);
  };

  const unattendedBagIncident = incidents[0];

  // Which subsystems the SOP has switched on so far. Both the isometric scene
  // and the flat zone map read these, so the two views can never disagree.
  const alertActive = !!activeSOP && sopStep >= 0;
  const camerasFocused = !!activeSOP && sopStep >= 1;
  const paActive = !!activeSOP && sopStep >= 2;
  const lockdownActive = !!activeSOP && sopStep >= 3;
  const emergencyLighting = !!activeSOP && sopStep >= 4;
  const teamDispatched = !!activeSOP && sopStep >= 5;

  return (
    <div className="space-y-6">
      {/* ================= Unattended Bag Response - isometric scene ================= */}
      <div className="hbms-control-panel p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/35">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-sim-100">
                Unattended Bag Response - Terminal Concourse
              </h3>
              <p className="text-xs md:text-sm text-sim-400">
                AI surveillance detection and automated SOP execution
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-sim-800/40 border border-sim-700/40 rounded-lg px-3 py-2">
              <Gauge className="w-4 h-4 text-simteal-400" />
              <label className="text-xs text-sim-400">Speed</label>
              <select
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                disabled={!!activeSOP}
                className="bg-sim-800 border border-sim-600 rounded px-2 py-1 text-sim-200 text-xs"
              >
                <option value={0.5}>0.5x — study</option>
                <option value={1}>1x — normal</option>
                <option value={2}>2x — fast</option>
              </select>
            </div>

            <button
              onClick={() => executeSOP(unattendedBagIncident)}
              disabled={!!activeSOP}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-xl ${
                activeSOP
                  ? 'bg-sim-700/50 text-sim-400 cursor-not-allowed border border-sim-600/40'
                  : 'bg-gradient-to-r from-red-600 via-red-500 to-simgold-600 hover:from-red-700 hover:via-red-600 hover:to-simgold-700 text-white'
              }`}
            >
              {activeSOP ? <Activity className="w-5 h-5 animate-pulse" /> : <PlayCircle className="w-5 h-5" />}
              <span>{activeSOP ? 'SOP executing…' : 'Simulate unattended bag incident'}</span>
            </button>
          </div>
        </div>

        {/* live readout strip, mirroring the airside / baggage simulations */}
        <div className="mb-4 bg-sim-800/30 rounded-lg p-3 border border-sim-700/30 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm min-w-max">
            <div className="text-sim-400">Incident:</div>
            <div className="text-red-400 font-medium">{unattendedBagIncident.type}</div>
            <div className="text-sim-400">|</div>
            <div className="text-simteal-400">{unattendedBagIncident.location}</div>
            <div className="text-sim-400">|</div>
            <div className="text-sim-400">AI Confidence:</div>
            <div className="text-emerald-400">{unattendedBagIncident.aiConfidence ?? 94}%</div>
            <div className="text-sim-400">|</div>
            <div className="text-sim-400">SOP Progress:</div>
            <div className="text-simgold-400">
              {activeSOP ? `Step ${Math.min(sopStep + 1, mockSOP.steps.length)} of ${mockSOP.steps.length}` : 'Standby'}
            </div>
          </div>
        </div>

        {/* The procedure and the concourse it is being executed in, side by
            side: whichever step is highlighted on the left is the change you
            are watching on the right. */}
        <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)] gap-4 items-stretch">
          <SOPPanel
            className="min-h-[340px]"
            accent="red"
            title="SOP-001 · Unattended Baggage"
            trigger={activeSOP?.trigger ?? `${unattendedBagIncident.type} at ${unattendedBagIncident.location}`}
            priority={unattendedBagIncident.severity}
            steps={mockSOP.steps.map((s, i) => ({
              action: s.action,
              duration: s.duration,
              responsible: STEP_OWNERS[i],
              critical: i === 0 || i === 3 || i === 5,
            }))}
            currentStep={sopStep}
            active={!!activeSOP}
            subtitle="Detection is automatic; every step below drives a visible change in the concourse."
          />

          <div className="flex rounded-xl border border-sim-700/50 bg-sim-900/70 overflow-hidden min-h-[320px]">
            <IsoSecurityScene
              sopActive={!!activeSOP}
              currentStep={sopStep}
              totalSteps={mockSOP.steps.length}
              incidentLocation={unattendedBagIncident.location}
              onElementClick={(type) => {
                if (type === 'unattended-bag' && !activeSOP) executeSOP(unattendedBagIncident);
              }}
            />
          </div>
        </div>

        {/* subsystem state, driven by the SOP step */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Red Alert', on: alertActive },
            { label: 'Camera Focus', on: camerasFocused },
            { label: 'PA Broadcast', on: paActive },
            { label: 'Access Lockdown', on: lockdownActive },
            { label: 'Emergency Lighting', on: emergencyLighting },
            { label: 'Team Dispatched', on: teamDispatched },
          ].map(s => (
            <div
              key={s.label}
              className={`rounded-lg border px-3 py-2 transition-all duration-500 ${
                s.on && activeSOP
                  ? 'border-red-500/50 bg-red-950/30'
                  : 'border-sim-700/40 bg-sim-800/20'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`hbms-status-dot ${s.on ? 'critical' : 'offline'}`}
                />
                <span className={`text-xs font-medium ${s.on ? 'text-red-300' : 'text-sim-400'}`}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CCTV Surveillance System */}
      <CCTVFeed />

      {/* Security Operations Header */}
      <div className="bg-sim-800/60 backdrop-blur border border-sim-600/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-sim-200">Security Operations Center</h2>
              <p className="text-sim-400">Automated incident response and monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-400">{incidents.filter(i => i.status === 'Active').length}</p>
            <p className="text-sim-400">Active Incidents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-sim-900/40 rounded-lg border border-sim-600/30">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-sim-200 font-medium">24/7 Monitoring</span>
              <div className="text-sim-400 text-xs">AI Detection Active</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sim-900/40 rounded-lg border border-sim-600/30">
            <Lock className="w-5 h-5 text-simteal-400" />
            <div>
              <span className="text-sim-200 font-medium">Access Control</span>
              <div className="text-sim-400 text-xs">45 Points Secured</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sim-900/40 rounded-lg border border-sim-600/30">
            <Clock className="w-5 h-5 text-simgold-400" />
            <div>
              <span className="text-sim-200 font-medium">Response Time</span>
              <div className="text-sim-400 text-xs">90s Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active incidents beside the live zone map - the map mirrors whatever
          the SOP has switched on, so the two halves stay in agreement. */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-sim-800/60 backdrop-blur border rounded-xl p-5 hover:bg-sim-700/40 transition-all duration-300 cursor-pointer ${getStatusColor(incident.status)} hover:border-simteal-400/40 shadow-lg`}
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2.5 rounded-lg border flex-shrink-0 ${getSeverityColor(incident.severity)}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sim-200 font-semibold">{incident.type}</h3>
                    <p className="text-sim-400 text-sm">{incident.location}</p>
                    {incident.description && (
                      <p className="text-sim-500 text-xs mt-1">{incident.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </div>
                  <p className="text-sim-400 text-xs mt-2">{incident.timestamp.toLocaleTimeString()}</p>
                  {incident.aiConfidence && (
                    <p className="text-simteal-400 text-xs">AI: {incident.aiConfidence}%</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </div>
                {incident.status === 'Active' && !activeSOP && (
                  <button
                    className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg transition-colors border border-red-500/40 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeSOP(incident);
                    }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Execute SOP
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="bg-sim-800/60 backdrop-blur border border-sim-600/40 rounded-xl p-5">
            <h3 className="text-sm font-bold text-sim-200 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-simteal-400" />
              Response Readiness
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Cameras online', '46 / 48', 'text-emerald-400'],
                ['Access points', lockdownActive ? 'LOCKED DOWN' : '45 secured', lockdownActive ? 'text-red-400' : 'text-emerald-400'],
                ['Response teams', teamDispatched ? 'On scene' : '2 available', teamDispatched ? 'text-simgold-400' : 'text-simteal-400'],
                ['Mean response', '90 s', 'text-simgold-400'],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex justify-between bg-sim-900/40 rounded-lg border border-sim-700/40 px-3 py-2">
                  <span className="text-sim-400">{label}</span>
                  <span className={tone}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live zone map - every element here is driven by the SOP step, so
            it is a second read-out of the same run, not decoration. */}
        <div className="bg-sim-800/60 backdrop-blur border border-sim-600/40 rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-sim-200 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-simteal-400" />
            Security Zone Overview
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
              alertActive ? 'border-red-500/50 text-red-300 bg-red-950/30' : 'border-emerald-500/40 text-emerald-300'
            }`}>
              {alertActive ? 'INCIDENT ACTIVE' : 'NORMAL'}
            </span>
          </h3>

          <div className="relative bg-sim-900/70 rounded-lg overflow-hidden border border-sim-700/50">
            <svg viewBox="0 0 400 300" className="w-full h-auto block">
              <defs>
                <pattern id="securityGrid" width="20" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 15" fill="none" stroke="#0E556A" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="400" height="300" fill="#061520" />
              <rect width="400" height="300" fill="url(#securityGrid)" opacity="0.25" />

              {/* Terminal Building */}
              <rect x="50" y="40" width="300" height="220" fill="#08203A" stroke="#0E556A" strokeWidth="2" rx="8" />
              <text x="200" y="60" textAnchor="middle" fill="#8A9BA8" fontSize="11" fontWeight="bold">
                TERMINAL SECURITY ZONE
              </text>

              {/* Gates */}
              <rect x="80" y="90" width="60" height="40" fill="#0A3A52" stroke="#14708A" strokeWidth="1" rx="4" />
              <text x="110" y="115" textAnchor="middle" fill="#8A9BA8" fontSize="8">Gate 12</text>

              <rect
                x="160" y="90" width="60" height="40" rx="4"
                fill={alertActive ? '#450a0a' : '#0A3A52'}
                stroke={alertActive ? '#dc2626' : '#14708A'}
                strokeWidth={alertActive ? 2 : 1}
              />
              <text x="190" y="110" textAnchor="middle" fill={alertActive ? '#fca5a5' : '#8A9BA8'} fontSize="8" fontWeight="bold">
                Gate 13
              </text>
              {alertActive && (
                <text x="190" y="124" textAnchor="middle" fill="#dc2626" fontSize="6">⚠ ALERT</text>
              )}

              <rect x="240" y="90" width="60" height="40" fill="#0A3A52" stroke="#14708A" strokeWidth="1" rx="4" />
              <text x="270" y="115" textAnchor="middle" fill="#8A9BA8" fontSize="8">Gate 14</text>

              {/* Cameras - the middle one slews onto the incident at step 2 */}
              {[110, 190, 270].map((cx, i) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy="76"
                  r="4"
                  fill={camerasFocused && i === 1 ? '#dc2626' : '#01A3A4'}
                  opacity="0.85"
                  className={camerasFocused && i === 1 ? 'animate-pulse' : ''}
                />
              ))}

              {/* Unattended bag */}
              <g>
                <rect x="175" y="164" width="12" height="8" rx="1" fill={alertActive ? '#dc2626' : '#E6B85C'} />
                {alertActive && (
                  <circle cx="181" cy="168" r="15" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.7">
                    <animate attributeName="r" values="15;26;15" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.25;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x="200" y="172" fill={alertActive ? '#dc2626' : '#8A9BA8'} fontSize="6" fontWeight="bold">
                  UNATTENDED BAG
                </text>
              </g>

              {/* Access control points */}
              {[120, 180, 240].map((x, i) => {
                const locked = lockdownActive && i < 2;
                return (
                  <g key={x}>
                    <rect
                      x={x} y="196" width="16" height="25"
                      fill={locked ? '#dc2626' : '#059669'}
                      stroke={locked ? '#dc2626' : '#10b981'}
                      strokeWidth="1"
                      className={locked ? 'animate-pulse' : ''}
                    />
                    <text x={x + 8} y="231" textAnchor="middle" fill={locked ? '#dc2626' : '#10b981'} fontSize="5">
                      {locked ? 'LOCKED' : 'OPEN'}
                    </text>
                  </g>
                );
              })}

              {/* Emergency lighting */}
              {[160, 190, 220].map((cx) => (
                <circle key={cx} cx={cx} cy="246" r="5" fill={emergencyLighting ? '#dc2626' : '#123246'} opacity={emergencyLighting ? 0.7 : 0.5}>
                  {emergencyLighting && (
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" />
                  )}
                </circle>
              ))}

              {/* Security personnel */}
              <circle cx={teamDispatched ? 210 : 320} cy={teamDispatched ? 186 : 180} r="6" fill="#01A3A4" stroke="#8A9BA8" strokeWidth="1"
                      style={{ transition: 'all 1.2s ease' }} />
              <text x={teamDispatched ? 210 : 320} y={teamDispatched ? 201 : 195} textAnchor="middle" fill="#8A9BA8" fontSize="6"
                    style={{ transition: 'all 1.2s ease' }}>
                {teamDispatched ? 'On scene' : 'Security'}
              </text>

              {paActive && (
                <g>
                  <rect x="118" y="266" width="164" height="18" rx="9" fill="#04101F" stroke="#E6B85C" strokeOpacity="0.6" />
                  <text x="200" y="278" textAnchor="middle" fill="#E6B85C" fontSize="8" fontWeight="bold">
                    PA BROADCAST LIVE
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedIncident(null)}>
          <div className="bg-sim-800/95 backdrop-blur border border-sim-600/50 rounded-xl p-6 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${getSeverityColor(selectedIncident.severity)}`}>
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-sim-200">{selectedIncident.type}</h2>
                  <p className="text-sim-400">{selectedIncident.location}</p>
                </div>
              </div>
              <button 
                className="text-sim-400 hover:text-white text-2xl p-2 hover:bg-sim-700/50 rounded-lg transition-colors"
                onClick={() => setSelectedIncident(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-sim-900/60 backdrop-blur p-4 rounded-lg border border-sim-600/40">
                  <h4 className="text-sim-400 text-sm mb-3">Threat Assessment</h4>
                  <div className={`px-4 py-3 rounded-lg text-center font-semibold border ${getSeverityColor(selectedIncident.severity)}`}>
                    {selectedIncident.severity} Risk Level
                  </div>
                  {selectedIncident.aiConfidence && (
                    <div className="mt-3 text-center">
                      <div className="text-simteal-400 font-semibold">AI Confidence</div>
                      <div className="text-2xl font-bold text-simteal-300">{selectedIncident.aiConfidence}%</div>
                    </div>
                  )}
                </div>
                <div className="bg-sim-900/60 backdrop-blur p-4 rounded-lg border border-sim-600/40">
                  <h4 className="text-sim-400 text-sm mb-3">Incident Status</h4>
                  <div className={`px-4 py-3 rounded-lg text-center font-semibold border ${getStatusColor(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sim-400">Detection Time</div>
                    <div className="text-sim-200 font-mono">{selectedIncident.timestamp.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="bg-sim-900/60 backdrop-blur p-4 rounded-lg border border-sim-600/40">
                <h4 className="text-sim-400 text-sm mb-3">Incident Details</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-sim-200"><span className="text-sim-400">Location:</span> {selectedIncident.location}</p>
                  <p className="text-sim-200"><span className="text-sim-400">Type:</span> {selectedIncident.type}</p>
                  <p className="text-sim-200"><span className="text-sim-400">Camera ID:</span> {selectedIncident.cameraId}</p>
                  {selectedIncident.description && (
                    <p className="text-sim-200"><span className="text-sim-400">Description:</span> {selectedIncident.description}</p>
                  )}
                </div>
              </div>

              <div className="bg-sim-900/60 backdrop-blur p-4 rounded-lg border border-sim-600/40">
                <h4 className="text-sim-400 text-sm mb-3">Automated Response Protocol</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sim-300">Security Department Alert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-simteal-400 rounded-full"></div>
                    <span className="text-sim-300">Camera System Focus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-simgold-400 rounded-full"></div>
                    <span className="text-sim-300">PA System Notification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-simgold-400 rounded-full"></div>
                    <span className="text-sim-300">Access Point Lockdown</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedIncident.status === 'Active' && !activeSOP && (
                  <button 
                    className="flex-1 bg-red-600/80 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors border border-red-500/40 font-medium"
                    onClick={() => {
                      executeSOP(selectedIncident);
                      setSelectedIncident(null);
                    }}
                  >
                    Execute Automated SOP
                  </button>
                )}
                <button 
                  className="flex-1 bg-sim-700/80 hover:bg-sim-600 text-white px-6 py-3 rounded-lg transition-colors border border-sim-600/40 font-medium"
                  onClick={() => {
                    onIncidentResolve?.(selectedIncident.id);
                    setSelectedIncident(null);
                  }}
                >
                  Manual Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
