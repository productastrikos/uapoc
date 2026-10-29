/**
 * Live Pantherlake unattended-baggage alerts, as they appear in the SOP
 * Console: each alert carries an Execute SOP action that opens the full
 * Unattended Baggage response — the same scene and SOP walk-through as the
 * Security console's version, driven by the real alert instead of a demo.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, PlayCircle, Radio, X } from 'lucide-react';
import {
  usePantherlakeStore,
  type PantherlakeBaggageAlert,
} from '../../services/pantherlakeMqtt';
import { capitalizeFirst, formatUnattended } from '../UI/PantherlakeAlertPopup';
import { UnattendedBagScene, useUnattendedBagSop } from '../../simulations/components/UnattendedBagScene';
import type { SecurityIncident } from '../../simulations/types';

const worstBag = (alert: PantherlakeBaggageAlert) =>
  alert.bags.reduce<PantherlakeBaggageAlert['bags'][number] | null>(
    (worst, b) => (!worst || b.unattendedSeconds > worst.unattendedSeconds ? b : worst),
    null
  );

const toIncident = (alert: PantherlakeBaggageAlert): SecurityIncident => ({
  id: alert.id,
  type: 'Unattended Baggage',
  location: `${alert.zoneLabel} - ${alert.cameraId}`,
  severity: 'Critical',
  status: 'Active',
  timestamp: new Date(alert.raisedAt),
  description: 'Unattended bag detected by Pantherlake edge AI',
  cameraId: alert.cameraId,
});

/** The full-size response, opened from an alert's Execute SOP. Starts the SOP
 *  run as soon as it opens — the operator already chose to execute it. */
const UnattendedBaggageResponse: React.FC<{ alertId: string; onClose: () => void }> = ({ alertId, onClose }) => {
  const alert = usePantherlakeStore((s) => s.baggageAlerts.find((a) => a.id === alertId));
  const setAlertStatus = usePantherlakeStore((s) => s.setAlertStatus);
  const resolvedRef = useRef(false);
  // Whole run ≈ 10s at 1x: six 1.5s steps plus a 1s hold before resolving.
  const sop = useUnattendedBagSop(
    () => {
      resolvedRef.current = true;
      setAlertStatus(alertId, 'resolved');
    },
    { stepMs: 1500, resolveHoldMs: 1000 }
  );

  // Auto-run once per open. Deliberately no "already started" ref guard: in
  // dev, React mounts → unmounts → remounts, and the unmount clears the SOP's
  // timers — a guard would then stop the remount from restarting it, leaving
  // the run stuck on step 1. Re-running on the remount is what recovers it.
  useEffect(() => {
    const current = usePantherlakeStore.getState().baggageAlerts.find((a) => a.id === alertId);
    if (!current) return;
    setAlertStatus(alertId, 'executing');
    sop.executeSOP(toIncident(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    // Closed mid-run: the procedure didn't finish, so the alert goes back to
    // open rather than staying stuck on "executing".
    if (!resolvedRef.current && alert?.status === 'executing') setAlertStatus(alertId, 'open');
    onClose();
  };

  if (!alert) return null;
  const bag = worstBag(alert);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="sim-root modal-surface relative w-full max-w-[1400px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl p-4"
      >
        <button
          onClick={close}
          title="Close"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-primary-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        <UnattendedBagScene
          sop={sop}
          incident={toIncident(alert)}
          title="Unattended Baggage - Terminal Concourse"
          subtitle="Pantherlake edge AI detection and automated SOP execution"
          actionLabel="Execute unattended baggage SOP"
          readout={{
            label: 'Unattended for:',
            value: bag ? formatUnattended(bag.unattendedSeconds) : '—',
          }}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
};

const STATUS_CHIP: Record<PantherlakeBaggageAlert['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-status-error/15 border-status-error/40 text-status-errorBright' },
  executing: { label: 'SOP executing', cls: 'bg-status-warning/15 border-status-warning/40 text-status-warning' },
  resolved: { label: 'Resolved', cls: 'bg-status-neutral/15 border-status-neutral/40 text-status-neutral' },
};

const PantherlakeAlertsPanel: React.FC = () => {
  const alerts = usePantherlakeStore((s) => s.baggageAlerts);
  const connected = usePantherlakeStore((s) => s.connected);
  const focusAlertId = usePantherlakeStore((s) => s.focusAlertId);
  const focusAlert = usePantherlakeStore((s) => s.focusAlert);
  const [responseFor, setResponseFor] = useState<string | null>(null);
  const focusedRef = useRef<HTMLDivElement>(null);

  // Arrived here from the corner popup — bring that alert into view.
  useEffect(() => {
    if (focusAlertId) focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusAlertId]);

  const openCount = alerts.filter((a) => a.status !== 'resolved').length;

  return (
    <div className="glass-panel-strong rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-status-error/10 border border-status-error/30">
            <AlertTriangle className="w-4 h-4 text-status-errorBright" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Live Alerts · Pantherlake</h2>
            <p className="text-xs text-text-muted">Unattended baggage detected by edge AI cameras</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            connected ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' : 'bg-primary-600/30 border-primary-500/40 text-text-muted'
          }`}
        >
          <Radio className="w-3 h-3" />
          {connected ? `${openCount} open` : 'Connecting…'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-text-muted py-3 text-center">No alerts — the feed is quiet.</p>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert) => {
            const bag = worstBag(alert);
            const chip = STATUS_CHIP[alert.status];
            const focused = alert.id === focusAlertId;
            const resolved = alert.status === 'resolved';
            return (
              <div
                key={alert.id}
                ref={focused ? focusedRef : undefined}
                onClick={() => focusAlert(alert.id)}
                className={`rounded-xl border p-3.5 flex items-center justify-between gap-4 transition-colors ${
                  resolved
                    ? 'border-primary-600/40 bg-primary-800/30'
                    : 'border-status-error/40 bg-status-error/[0.06]'
                } ${focused ? 'ring-2 ring-status-errorBright/60' : ''}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`shrink-0 p-2 rounded-lg border ${resolved ? 'bg-primary-700/40 border-primary-600/40' : 'bg-status-error/15 border-status-error/40'}`}>
                    {resolved
                      ? <CheckCircle2 className="w-5 h-5 text-status-neutral" />
                      : <AlertTriangle className={`w-5 h-5 text-status-errorBright ${alert.active ? 'animate-pulse' : ''}`} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">Unattended Baggage</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${chip.cls}`}>
                        {chip.label}
                      </span>
                      {!resolved && alert.active && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-status-errorBright">Live</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {alert.zoneLabel} · {alert.cameraId} · raised {new Date(alert.raisedAt).toLocaleTimeString()}
                    </p>
                    {bag && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {alert.bags.length > 1 ? `${alert.bags.length} bags · ` : ''}
                        {capitalizeFirst(bag.label)} unattended for {formatUnattended(bag.unattendedSeconds)}
                      </p>
                    )}
                  </div>
                </div>

                {!resolved && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setResponseFor(alert.id); }}
                    disabled={alert.status === 'executing'}
                    className={`btn shrink-0 min-w-[10rem] ${alert.status === 'executing' ? 'btn-danger-active cursor-not-allowed' : 'btn-danger'}`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    {alert.status === 'executing' ? 'Executing…' : 'Execute SOP'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {responseFor && (
          <UnattendedBaggageResponse key={responseFor} alertId={responseFor} onClose={() => setResponseFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PantherlakeAlertsPanel;
