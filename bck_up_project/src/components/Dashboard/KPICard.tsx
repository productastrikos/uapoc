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
      case "good": return "border-green-500/30 bg-green-500/5";
      case "warning": return "border-yellow-500/30 bg-yellow-500/5";
      case "critical": return "border-red-500/30 bg-red-500/5";
      default: return "border-primary-700/50 bg-primary-800/30";
    }
  };

  const getTrendColor = () => {
    if (!change) return "";
    switch (change.trend) {
      case "up": return change.value > 0 ? "text-green-400" : "text-red-400";
      case "down": return change.value > 0 ? "text-red-400" : "text-green-400";
      default: return "text-gray-400";
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl p-6 border transition-all duration-300 cursor-pointer animate-kpi-gradient hover:border-teal-500/50 hover:scale-105 ${getStatusColor()}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-gold-500/5 animate-pulse" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon className="w-6 h-6 text-teal-400" />
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

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'good' ? 'bg-green-500 animate-pulse' :
            status === 'warning' ? 'bg-yellow-500 animate-pulse' :
            status === 'critical' ? 'bg-red-500 animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="text-xs text-gray-400 capitalize">{status}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;