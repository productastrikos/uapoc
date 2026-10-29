import React from "react";
import { motion } from "framer-motion";
import { DivideIcon as LucideIcon } from "lucide-react";
import InfoButton from "../UI/InfoButton";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  description?: string;
  status?: "good" | "warning" | "critical" | "neutral";
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  change,
  icon: Icon,
  description,
  status = "neutral",
  onClick
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "good": return "border-status-neutral/30";
      case "warning": return "border-status-warning/30";
      case "critical": return "border-status-error/30";
      default: return "border-accent-blue/15";
    }
  };

  const getTrendColor = () => {
    if (!change) return "";
    switch (change.trend) {
      case "up": return change.value > 0 ? "text-status-neutral" : "text-status-error";
      case "down": return change.value > 0 ? "text-status-error" : "text-status-neutral";
      default: return "text-text-muted";
    }
  };

  return (
    <motion.div
      className={`glass-panel relative overflow-hidden rounded-xl p-4 border transition-colors duration-300 cursor-pointer hover:border-accent-blue/50 ${getStatusColor()}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-accent-blue" />
            <InfoButton
              title={title}
              description={description || `Real-time monitoring of ${title.toLowerCase()} with current value: ${value}${unit || ''}`}
            />
          </div>
          {change && (
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'good' ? 'bg-status-neutral animate-pulse' :
            status === 'warning' ? 'bg-status-warning animate-pulse' :
            status === 'critical' ? 'bg-status-error animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="text-xs text-gray-400 capitalize">{status}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;