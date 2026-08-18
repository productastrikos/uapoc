import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  Users,
  Building,
  Car,
  Shield,
  Wrench,
  DollarSign,
  Leaf,
  FileText,
  BarChart3,
  Monitor,
  MapPin
} from "lucide-react";

interface CollapsibleSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  activeModule,
  onModuleChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: "aocc", label: "UAOC Dashboard", icon: Monitor, shortcut: "Ctrl+1" },
    { id: "passenger-journey", label: "Passenger Journey", icon: Users, shortcut: "Ctrl+2" },
    { id: "passenger-systems", label: "Passenger Systems", icon: MapPin, shortcut: "Ctrl+3" },
    { id: "terminal", label: "Terminal & Passenger", icon: Building, shortcut: "Ctrl+4" },
    { id: "airside", label: "Airside Operations", icon: Plane, shortcut: "Ctrl+5" },
    { id: "landside", label: "Landside & Transport", icon: Car, shortcut: "Ctrl+6" },
    { id: "security", label: "Security & Safety", icon: Shield, shortcut: "Ctrl+7" },
    { id: "maintenance", label: "Maintenance & Engineering", icon: Wrench, shortcut: "Ctrl+8" },
    { id: "commercial", label: "Commercial & Revenue", icon: DollarSign, shortcut: "Ctrl+9" },
    { id: "sustainability", label: "Sustainability & Environment", icon: Leaf, shortcut: "Ctrl+Shift+1" },
    { id: "sops", label: "SOP Console", icon: FileText, shortcut: "Ctrl+Shift+2" },
    { id: "reports", label: "Analytics & Reporting", icon: BarChart3, shortcut: "Ctrl+0" }
  ];

  return (
    <motion.div
      className="bg-primary-700/80 backdrop-blur-sm border-r border-primary-500/50 transition-all duration-300 relative flex flex-col h-full"
      animate={{ width: collapsed ? 80 : 280 }}
      initial={{ width: 280 }}
    >
      {/* Shimmer Effect Border */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/10 to-transparent animate-shimmer" />
      
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-primary-700 border border-primary-500/50 rounded-full p-1 hover:bg-primary-600 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-teal-400" /> : <ChevronLeft className="w-4 h-4 text-teal-400" />}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar mt-4">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border border-teal-500/50' 
                    : 'text-gray-300 hover:bg-primary-600/50 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active item shimmer effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/20 to-transparent animate-shimmer" />
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-400' : 'text-gray-400 group-hover:text-teal-400'}`} />
                
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 relative z-10">{item.label}</span>
                    <span className="text-xs text-gray-500 relative z-10">{item.shortcut}</span>
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-primary-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    {item.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-primary-800"></div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Footer - Powered by Astrikos */}
      <div className="mt-auto p-4 border-t border-primary-600/50">
        {collapsed ? (
          <div className="flex justify-center group relative">
            <img
              src="/Astrikos_solo_logo.png"
              alt="Astrikos"
              className="h-11 w-auto opacity-90 hover:opacity-100 transition-opacity"
              style={{ filter: 'brightness(1.6) contrast(1.1)' }}
            />
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
              Powered by Astrikos
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-gray-500">Powered by</span>
            <img
              src="/Astrikos Logo Transparent Horizontal.png"
              alt="Astrikos"
              className="h-14 w-auto max-w-[210px] object-contain opacity-95 hover:opacity-100 transition-opacity"
              style={{
                filter: 'brightness(1.9) contrast(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
  
};

export default CollapsibleSidebar;
