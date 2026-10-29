/**
 * Corner popup for a live unattended-baggage alert from Pantherlake. Shown on
 * every console; clicking it takes the operator to the SOP Console with that
 * alert focused, where the response SOP can be executed.
 *
 * Stays up until clicked or dismissed — an unattended bag shouldn't time out
 * of view on its own.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { usePantherlakeStore } from '../../services/pantherlakeMqtt';
import { useNavStore } from '../../store/useNavStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatUnattended(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

const PantherlakeAlertPopup: React.FC = () => {
  const alert = usePantherlakeStore((s) => s.baggageAlerts.find((a) => a.id === s.toastAlertId) ?? null);
  // Settings → "Live alert popups". Off hides only the corner popup; the alert
  // itself still lands in the SOP Console.
  const popupsOn = useSettingsStore((s) => s.showAlertPopups);
  const dismissToast = usePantherlakeStore((s) => s.dismissToast);
  const focusAlert = usePantherlakeStore((s) => s.focusAlert);
  const go = useNavStore((s) => s.go);

  const worstBag = alert?.bags.reduce<typeof alert.bags[number] | null>(
    (worst, b) => (!worst || b.unattendedSeconds > worst.unattendedSeconds ? b : worst),
    null
  );

  const open = () => {
    if (!alert) return;
    focusAlert(alert.id);
    go('sops');
  };

  return (
    <AnimatePresence>
      {alert && popupsOn && (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="fixed bottom-5 right-5 z-[70] w-[22rem]"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(); }}
            className="glass-panel-strong relative cursor-pointer rounded-2xl border border-status-error/50 p-4 shadow-[0_0_40px_rgba(188,32,35,0.35)] hover:border-status-errorBright transition-colors"
          >
            <button
              onClick={(e) => { e.stopPropagation(); dismissToast(); }}
              title="Dismiss — the alert stays in the SOP Console"
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-primary-700/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3 pr-5">
              <div className="relative shrink-0 p-2 rounded-xl bg-status-error/15 border border-status-error/40">
                <span className="absolute inset-0 rounded-xl bg-status-error/30 animate-ping" />
                <AlertTriangle className="relative w-5 h-5 text-status-errorBright" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-status-errorBright">
                  Pantherlake · Live alert
                </p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">Unattended baggage detected</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {alert.zoneLabel} · {alert.cameraId}
                </p>
                {worstBag && (
                  <p className="text-xs text-text-muted mt-1">
                    {capitalizeFirst(worstBag.label)} unattended for {formatUnattended(worstBag.unattendedSeconds)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-accent-blue">
              Open in SOP Console
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PantherlakeAlertPopup;
