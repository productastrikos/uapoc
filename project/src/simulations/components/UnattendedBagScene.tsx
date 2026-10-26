/**
 * The unattended-baggage response: SOP step list beside the isometric
 * concourse, plus the subsystem-state strip. Shared by the Security
 * simulation and the live Pantherlake alert flow in the SOP Console, so the
 * two are the same code rather than a copy that drifts.
 *
 * State lives in useUnattendedBagSop so a host can also read it (the Security
 * console's zone map below the scene is driven by the same SOP step).
 */

import React, { useState } from 'react';
import { Shield, PlayCircle, Gauge, Activity } from 'lucide-react';
import { SecurityIncident, SecuritySOP } from '../types';
import SOPPanel from './SOPPanel';
import IsoSecurityScene from '../scenes/IsoSecurityScene';
import { useManagedTimers } from '../scenes/motion';

/** Who owns each step — keeps the panel reading as a real procedure. */
const STEP_OWNERS = [
  'Security Control',
  'CCTV Operator',
  'PA System',
  'Access Control',
  'Facilities',
  'Response Team',
];

const BASE_SOP: SecuritySOP = {
  id: 'SOP-001',
  trigger: 'Unattended baggage detection',
  steps: [
    { id: 1, action: 'Issue red alert to security department', duration: 5, status: 'pending' },
    { id: 2, action: 'Activate all cameras to focus on incident area', duration: 8, status: 'pending' },
    { id: 3, action: 'Broadcast PA system notification to personnel', duration: 12, status: 'pending' },
    { id: 4, action: 'Lock down access points in affected zones', duration: 15, status: 'pending' },
    { id: 5, action: 'Activate emergency lighting protocols', duration: 18, status: 'pending' },
    { id: 6, action: 'Dispatch security team to investigate location', duration: 25, status: 'pending' },
  ],
  autoExecute: true,
  manualOverride: false,
  estimatedDuration: 90,
  currentStep: 0,
};

export function useUnattendedBagSop(onResolve?: (incidentId: string) => void) {
  const [activeSOP, setActiveSOP] = useState<SecuritySOP | null>(null);
  /** Step index driving the isometric scene; -1 when no SOP is running. */
  const [sopStep, setSopStep] = useState(-1);
  /** Playback rate for the walk-through; 1x is deliberately unhurried. */
  const [speed, setSpeed] = useState(1);
  const { schedule, clearAll } = useManagedTimers();

  const executeSOP = (incident: SecurityIncident) => {
    if (activeSOP) return;

    clearAll();
    setSopStep(0);
    setActiveSOP({
      ...BASE_SOP,
      trigger: `${incident.type} at ${incident.location}`,
      steps: BASE_SOP.steps.map((step) => ({ ...step, status: 'pending' })),
    });

    // Every timer is registered so closing the host mid-run tears the chain
    // down instead of leaving it firing setState against an unmounted tree.
    const executeStep = (stepIndex: number) => {
      if (stepIndex >= BASE_SOP.steps.length) {
        schedule(() => {
          onResolve?.(incident.id);
          setActiveSOP(null);
          setSopStep(-1);
        }, 5000);
        return;
      }

      setSopStep(stepIndex);
      setActiveSOP((prev) => prev ? {
        ...prev,
        currentStep: stepIndex,
        steps: prev.steps.map((step, index) =>
          index === stepIndex
            ? { ...step, status: 'in-progress' as const }
            : index < stepIndex
            ? { ...step, status: 'completed' as const }
            : step
        ),
      } : null);

      schedule(() => {
        setActiveSOP((prev) => prev ? {
          ...prev,
          steps: prev.steps.map((step, index) =>
            index === stepIndex ? { ...step, status: 'completed' as const, completedAt: new Date() } : step
          ),
        } : null);
        schedule(() => executeStep(stepIndex + 1), 1400 / speed);
        // Long enough that each step's scene change — cameras slewing, doors
        // locking, the team walking in — can actually be watched.
      }, Math.max(3800, BASE_SOP.steps[stepIndex].duration * 320) / speed);
    };

    executeStep(0);
  };

  const running = !!activeSOP && sopStep >= 0;
  return {
    activeSOP,
    sopStep,
    speed,
    setSpeed,
    executeSOP,
    totalSteps: BASE_SOP.steps.length,
    alertActive: running,
    camerasFocused: running && sopStep >= 1,
    paActive: running && sopStep >= 2,
    lockdownActive: running && sopStep >= 3,
    emergencyLighting: running && sopStep >= 4,
    teamDispatched: running && sopStep >= 5,
  };
}

export type UnattendedBagSop = ReturnType<typeof useUnattendedBagSop>;

interface SceneProps {
  sop: UnattendedBagSop;
  incident: SecurityIncident;
  title: string;
  subtitle: string;
  /** Label on the run button while idle. */
  actionLabel: string;
  /** Third readout in the strip — defaults to the incident's AI confidence. */
  readout?: { label: string; value: string };
}

export const UnattendedBagScene: React.FC<SceneProps> = ({ sop, incident, title, subtitle, actionLabel, readout }) => {
  const { activeSOP, sopStep, speed, setSpeed, executeSOP, totalSteps } = sop;
  const stat = readout ?? { label: 'AI Confidence:', value: `${incident.aiConfidence ?? 94}%` };

  return (
    <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 md:p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2.5 rounded-lg bg-status-neutral/10 border border-status-neutral/35">
            <Shield className="w-5 h-5 text-status-neutral" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-text-primary">{title}</h3>
            <p className="text-xs md:text-sm text-text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-primary-900/40 border border-primary-600/40 rounded-lg px-2.5 py-2">
            <Gauge className="w-4 h-4 text-accent-blue" />
            <label className="text-xs text-text-muted">Speed</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={!!activeSOP}
              className="bg-primary-900 border border-primary-600 rounded px-2 py-1 text-text-primary text-xs"
            >
              <option value={0.5}>0.5x — study</option>
              <option value={1}>1x — normal</option>
              <option value={2}>2x — fast</option>
            </select>
          </div>

          <button
            onClick={() => executeSOP(incident)}
            disabled={!!activeSOP}
            className={`btn min-w-[20rem] py-2.5 ${activeSOP ? 'btn-danger-active cursor-not-allowed' : 'btn-danger'}`}
          >
            {activeSOP ? <Activity className="w-5 h-5 animate-pulse" /> : <PlayCircle className="w-5 h-5" />}
            <span>{activeSOP ? 'SOP executing…' : actionLabel}</span>
          </button>
        </div>
      </div>

      <div className="mb-3 bg-primary-900/40 rounded-lg p-2.5 border border-primary-600/40 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm min-w-max">
          <div className="text-text-muted">Incident:</div>
          <div className="text-status-error font-medium">{incident.type}</div>
          <div className="text-text-muted">|</div>
          <div className="text-accent-blue">{incident.location}</div>
          <div className="text-text-muted">|</div>
          <div className="text-text-muted">{stat.label}</div>
          <div className="text-status-neutral">{stat.value}</div>
          <div className="text-text-muted">|</div>
          <div className="text-text-muted">SOP Progress:</div>
          <div className="text-accent-blue">
            {activeSOP ? `Step ${Math.min(sopStep + 1, totalSteps)} of ${totalSteps}` : 'Standby'}
          </div>
        </div>
      </div>

      {/* The procedure and the concourse it's executed in, side by side:
          whichever step is highlighted on the left is the change on the right. */}
      <div className="grid grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)] gap-3 items-stretch">
        <SOPPanel
          className="min-h-[340px]"
          accent="red"
          title="SOP-001 · Unattended Baggage"
          trigger={activeSOP?.trigger ?? `${incident.type} at ${incident.location}`}
          priority={incident.severity}
          steps={BASE_SOP.steps.map((s, i) => ({
            action: s.action,
            duration: s.duration,
            responsible: STEP_OWNERS[i],
            critical: i === 0 || i === 3 || i === 5,
          }))}
          currentStep={sopStep}
          active={!!activeSOP}
          subtitle="Detection is automatic; every step below drives a visible change in the concourse."
        />

        <div className="flex rounded-xl border border-primary-600/40 bg-primary-900/70 overflow-hidden min-h-[320px]">
          <IsoSecurityScene
            sopActive={!!activeSOP}
            currentStep={sopStep}
            totalSteps={totalSteps}
            incidentLocation={incident.location}
            onElementClick={(type) => {
              if (type === 'unattended-bag' && !activeSOP) executeSOP(incident);
            }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: 'Red Alert', on: sop.alertActive },
          { label: 'Camera Focus', on: sop.camerasFocused },
          { label: 'PA Broadcast', on: sop.paActive },
          { label: 'Access Lockdown', on: sop.lockdownActive },
          { label: 'Emergency Lighting', on: sop.emergencyLighting },
          { label: 'Team Dispatched', on: sop.teamDispatched },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border px-2.5 py-2 transition-all duration-500 ${
              s.on && activeSOP ? 'border-status-error/50 bg-status-error/10' : 'border-primary-600/40 bg-primary-800/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${s.on ? 'bg-status-error' : 'bg-text-muted'}`} />
              <span className={`text-xs font-medium ${s.on ? 'text-status-error' : 'text-text-muted'}`}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnattendedBagScene;
