import React, { useState } from "react";
import {
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

/* A fixed-width icon rail, matching the Nest/CCMS sidebar: no expand/collapse
 * state, so toggling never resizes the content area. Labels surface only as a
 * hover tooltip, keeping the rail's footprint constant at all times.
 *
 * The tooltip is rendered as a `fixed`-position element positioned from the
 * hovered button's own bounding box, rather than an absolutely-positioned
 * child of the nav. The nav scrolls (`overflow-y-auto`), and per the CSS spec
 * that forces its `overflow-x` to compute as `auto` too, so anything
 * absolutely positioned outside the rail's own width was being silently
 * clipped instead of floating beside the icon. */
const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  activeModule,
  onModuleChange,
}) => {
  const [hovered, setHovered] = useState<{ label: string; top: number } | null>(null);

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

  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHovered({ label, top: rect.top + rect.height / 2 });
  };

  return (
    <div className="fs-chrome w-16 shrink-0 bg-primary-800 border-r border-primary-600/50 flex flex-col items-center h-full relative">
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                onMouseEnter={(e) => showTooltip(e, item.label)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "text-text-muted hover:bg-primary-700 hover:text-text-primary"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer - Powered by Astrikos */}
      <div
        className="py-3"
        onMouseEnter={(e) => showTooltip(e, "Powered by Astrikos")}
        onMouseLeave={() => setHovered(null)}
      >
        <img
          src="/Astrikos_solo_logo.png"
          alt="Astrikos"
          className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity"
          style={{ filter: 'brightness(1.6) contrast(1.1)' }}
        />
      </div>

      {/* Single shared tooltip, positioned in the viewport so it is never
          clipped by the nav's scroll container. */}
      {hovered && (
        <div
          className="fixed left-16 ml-2 px-2 py-1 bg-primary-700 text-text-primary text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none -translate-y-1/2"
          style={{ top: hovered.top }}
        >
          {hovered.label}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSidebar;
