import React, { useState } from "react";
import { motion } from "framer-motion";
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
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`${label} — opens the AirOps simulation`}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 shadow-2xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-700 hover:shadow-teal-500/50 ${className}`}
        style={{
          boxShadow: `
            0 4px 20px rgba(1, 163, 164, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
        }}
      >
        <PlayCircle className="w-5 h-5" />
        <span>{label}</span>
      </motion.button>

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
