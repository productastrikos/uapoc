import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Zap } from "lucide-react";

import { getSubsystemById } from "./data/subsystems";
import { mockFlights } from "./data/mockData";
import { useAlertSystem } from "./hooks/useAlertSystem";

import KPICards from "./components/KPICards";
import ScenarioGrid from "./components/ScenarioGrid";
import LiveCharts from "./components/LiveCharts";
import NodeFlowView from "./components/NodeFlowView";
import { FlightOperations } from "./components/FlightOperations";
import FlightTimeline from "./components/FlightTimeline";
import { SecurityOperations } from "./components/SecurityOperations";
import BaggageSystemOverview from "./components/BaggageSystemOverview";
import EventLog from "./components/EventLog";
import AlertCenter from "./components/AlertCenter";

import "../styles/simulation.css";

/** The three AirOps subsystems that are surfaced as UPOC simulations. */
export type SimulationId = "flight-ops" | "security" | "baggage";

interface SimulationOverlayProps {
  /** Which AirOps subsystem to run. */
  simulationId: SimulationId;
  /** Headline shown in the overlay title bar, e.g. "Security Simulation". */
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Everything below the title bar. Kept as its own component so the alert
 * timers, live charts and simulation loops only run while the overlay is
 * actually open (it is unmounted on close).
 */
const SimulationBody: React.FC<{ simulationId: SimulationId; title: string; onClose: () => void }> = ({
  simulationId,
  title,
  onClose,
}) => {
  const subsystem = getSubsystemById(simulationId);
  const [showFlowView, setShowFlowView] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(false);

  const {
    alerts,
    newAlerts,
    resolvedAlerts,
    needsReviewAlerts,
    aiSolutions,
    alertCountdown,
    handleAlertAction,
    generateRandomAlert,
  } = useAlertSystem();

  /**
   * Fire an event on demand and show the operator the result.
   *
   * The button used to call the ambient generator, which rolls the scenario's
   * own probability and does nothing most of the time - so clicking it looked
   * broken. A manual trigger always produces an alert, and opens the centre so
   * the alert it just raised is actually visible.
   */
  const handleTriggerEvent = () => {
    generateRandomAlert({ force: true, category: subsystem?.id });
    setShowAlertCenter(true);
  };

  // Keyboard shortcuts, matching the original AirOps dashboard.
  //   Esc      -> close the simulation
  //   F        -> toggle the node flow view
  //   Ctrl+A   -> toggle the alert centre
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (showAlertCenter) setShowAlertCenter(false);
        else onClose();
        return;
      }

      if (isTyping) return;

      // Swallow the host application's Ctrl+<digit> module shortcuts. Without
      // this they would navigate the page behind the overlay, unmounting the
      // running simulation from under the user.
      if (event.ctrlKey && /^[0-9!@]$/.test(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.ctrlKey && (event.key === "a" || event.key === "A")) {
        event.preventDefault();
        setShowAlertCenter((prev) => !prev);
      } else if (!event.ctrlKey && !event.altKey && (event.key === "f" || event.key === "F")) {
        event.preventDefault();
        setShowFlowView((prev) => !prev);
      }
    };

    // Capture phase so the host application's own Ctrl+<n> module shortcuts
    // do not fire while the simulation is in front of the user.
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, showAlertCenter]);

  if (!subsystem) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        Unknown simulation: {simulationId}
      </div>
    );
  }

  return (
    <>
      {/* Title bar - UPOC/TAMS chrome */}
      <div className="flex-shrink-0 border-b border-primary-600/60 bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent-teal/25 to-accent-gold/10 border border-accent-teal/30 shadow-lg">
              <span className="text-2xl leading-none">{subsystem.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-text-primary truncate">{title}</h2>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent-gold/15 text-accent-gold border border-accent-gold/40">
                  Simulation
                </span>
              </div>
              <p className="text-sm text-text-muted truncate">
                {subsystem.name} &middot; {subsystem.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={handleTriggerEvent}
              title="Raise an incident for this subsystem and open the alert centre"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-gold/15 border border-accent-gold/40 text-accent-gold hover:bg-accent-gold/25 transition-all duration-200 shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span>Trigger Event</span>
            </button>

            <button
              onClick={() => setShowAlertCenter((prev) => !prev)}
              title="Alert centre (Ctrl+A)"
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 shadow-lg ${
                showAlertCenter
                  ? "bg-status-error/30 border-status-error text-white"
                  : "bg-status-error/15 border-status-error/40 text-status-error hover:bg-status-error/25"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alerts</span>
              {newAlerts.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-status-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {newAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              aria-label="Close simulation"
              title="Close simulation (Esc)"
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary bg-primary-900/60 border border-primary-600/60 hover:border-accent-teal/60 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Simulation content - identical composition to the AirOps subsystem page */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="w-full space-y-4 h-full">
            <KPICards kpis={subsystem.kpis} />

            {subsystem.id === "flight-ops" && (
              <FlightOperations
                onSimulationComplete={() => console.log("Flight simulation completed")}
                onPhaseChange={(phase, data) => console.log("Phase changed:", phase, data)}
              />
            )}
            {subsystem.id === "flight-ops" && <FlightTimeline flights={mockFlights} />}

            {subsystem.id === "security" && (
              <SecurityOperations
                onIncidentResolve={(incidentId) => console.log("Incident resolved:", incidentId)}
              />
            )}

            {subsystem.id === "baggage" && (
              <>
                <BaggageSystemOverview />
                {/* Paired rather than stacked - the event log on its own left
                    half the row empty under a very tall page. */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <EventLog />
                  <LiveCharts subsystemId={subsystem.id} alerts={alerts} />
                </div>
              </>
            )}

            {showFlowView &&
            subsystem.nodeFlow &&
            subsystem.id !== "flight-ops" &&
            subsystem.id !== "baggage" ? (
              <NodeFlowView nodeFlow={subsystem.nodeFlow} subsystemName={subsystem.name} />
            ) : (
              subsystem.id !== "baggage" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
                  <ScenarioGrid scenarios={subsystem.scenarios} category={subsystem.id} />
                  <LiveCharts subsystemId={subsystem.id} alerts={alerts} />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <AlertCenter
        isOpen={showAlertCenter}
        onClose={() => setShowAlertCenter(false)}
        newAlerts={newAlerts}
        resolvedAlerts={resolvedAlerts}
        needsReviewAlerts={needsReviewAlerts}
        aiSolutions={aiSolutions}
        alertCountdown={alertCountdown}
        onAlertAction={handleAlertAction}
      />
    </>
  );
};

const SimulationOverlay: React.FC<SimulationOverlayProps> = ({ simulationId, title, isOpen, onClose }) => {
  const scrollLockRef = useRef<string>("");

  // Lock background scrolling while the overlay is up.
  useEffect(() => {
    if (!isOpen) return;
    scrollLockRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = scrollLockRef.current;
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] bg-primary-900/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="sim-root sim-surface absolute inset-0 flex flex-col overflow-hidden"
          >
            <SimulationBody simulationId={simulationId} title={title} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SimulationOverlay;
