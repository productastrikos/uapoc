import React, { useState } from "react";
import { PlayCircle } from "lucide-react";

import SimulationOverlay, { SimulationId } from "./SimulationOverlay";

interface SimulationLauncherProps {
  /** Which AirOps subsystem this page launches. */
  simulationId: SimulationId;
  /** Button text and overlay headline, e.g. "Security Simulation". */
  label: string;
  className?: string;
}

/**
 * Drop-in launcher for the AirOps simulations.
 *
 * Renders a UPOC/TAMS styled button and owns the full-screen overlay it opens,
 * so a module page only needs a single line in its header row:
 *
 *   <SimulationLauncher simulationId="security" label="Security Simulation" />
 */
const SimulationLauncher: React.FC<SimulationLauncherProps> = ({ simulationId, label, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title={`${label} — opens the AirOps simulation`}
        className={`btn btn-secondary ${className}`}
      >
        <PlayCircle className="w-4 h-4" />
        <span>{label}</span>
      </button>

      <SimulationOverlay
        simulationId={simulationId}
        title={label}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default SimulationLauncher;
