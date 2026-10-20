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
    { id: "aocc", label: "U-APOC Dashboard", icon: Monitor, shortcut: "Ctrl+1" },
    { id: "passenger-journey", label: "Passenger Journey", icon: Users, shortcut: "Ctrl+2" },
    { id: "passenger-systems", label: "Passenger Systems", icon: MapPin, shortcut: "Ctrl+3" },
    { id: "airside", label: "Airside Operations", icon: Plane, shortcut: "Ctrl+4" },
    { id: "terminal", label: "Terminal & Passenger", icon: Building, shortcut: "Ctrl+5" },
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
      className="fs-chrome bg-primary-700/80 backdrop-blur-sm border-r border-primary-500/50 transition-all duration-300 relative flex flex-col h-full"
      animate={{ width: collapsed ? 80 : 280 }}
      initial={{ width: 280 }}
    >
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
                    ? 'bg-accent-teal/15 text-white border border-accent-teal/40'
                    : 'text-gray-300 hover:bg-primary-600/50 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
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

      {/* Footer with NEGATIVE COLOR LOGO EFFECTS */}
      <div className="p-4 border-t border-primary-600/50">
        {!collapsed && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <span className="text-sm text-gray-400">Powered by</span>
            </div>
            <div className="flex items-center justify-center">
                

            <img 
                src="/Astrikos Logo Transparent perfect.png" 
                alt="Astrikos" 
                className="h-16 w-auto relative z-10"
                style={{
                  filter: 'brightness(1.3) contrast(1.2) saturate(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
                }}
              /> 

            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollapsibleSidebar;
