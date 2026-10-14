import React from 'react';
import { KPI } from '../types';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import UniversalPopup from './UniversalPopup';
import { usePopup } from '../hooks/usePopup';

interface KPICardsProps {
  kpis: KPI[];
}

const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const { isOpen, popupData, position, openPopup, closePopup, generateKPIPopupData } = usePopup();

  const handleKPIClick = (kpi: KPI, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };
    
    const popupData = generateKPIPopupData(kpi.name, kpi);
    openPopup(popupData, clickPosition);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-sim-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/10';
      case 'warning': return 'border-simgold-500/30 bg-simgold-950/20 shadow-simgold-500/10';
      case 'critical': return 'border-red-500/30 bg-red-950/20 shadow-red-500/10';
      default: return 'border-sim-600/30 bg-sim-900/20 shadow-sim-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-simgold-500" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-sim-500" />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map(kpi => (
          <div
            key={kpi.id}
            className={`hbms-metric-card p-5 cursor-pointer ${getStatusColor(kpi.status)}`}
            onClick={(e) => handleKPIClick(kpi, e)}
          >
            {/* status rail */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                kpi.status === 'good' ? 'bg-emerald-400' :
                kpi.status === 'warning' ? 'bg-simgold-500' :
                kpi.status === 'critical' ? 'bg-red-500' : 'bg-sim-500'
              }`}
            />

            <div className="relative flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 min-w-0">
                {getStatusIcon(kpi.status)}
                <h3 className="text-[length:calc(13px*var(--fs))] font-medium text-sim-300 truncate">{kpi.name}</h3>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                {getTrendIcon(kpi.trend)}
                <span className={`text-[length:calc(11px*var(--fs))] font-medium uppercase tracking-wide ${
                  kpi.trend === 'up' ? 'text-emerald-400' :
                  kpi.trend === 'down' ? 'text-red-400' : 'text-sim-400'
                }`}>
                  {kpi.trend}
                </span>
              </div>
            </div>

            <div className="relative flex items-baseline space-x-2 mb-4">
              <span className="text-[length:calc(34px*var(--fs))] leading-none font-bold text-sim-100 tabular-nums">
                {kpi.value.toFixed(kpi.value < 10 ? 1 : 0)}
              </span>
              <span className="text-xs font-medium text-sim-400 uppercase tracking-wide">{kpi.unit}</span>
            </div>

            {kpi.target && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-sim-500" />
                    <span className="text-sim-500">Target: {kpi.target}{kpi.unit}</span>
                  </div>
                  <span className={`font-medium ${
                    kpi.value >= kpi.target ? 'text-emerald-400' : 'text-simgold-400'
                  }`}>
                    {((kpi.value / kpi.target) * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="w-full bg-sim-800/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-1000 relative ${
                      kpi.status === 'good' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                      kpi.status === 'warning' ? 'bg-gradient-to-r from-simgold-600 to-simgold-400' : 
                      'bg-gradient-to-r from-red-600 to-red-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (kpi.value / (kpi.target || kpi.value)) * 100)}%`
                    }}
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Indicator */}
            <div className="mt-3 pt-3 border-t border-sim-700/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sim-500">Performance</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  kpi.status === 'good' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' :
                  kpi.status === 'warning' ? 'bg-simgold-900/30 text-simgold-400 border border-simgold-500/30' :
                  'bg-red-900/30 text-red-400 border border-red-500/30'
                }`}>
                  {kpi.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Universal Popup */}
      <UniversalPopup
        isOpen={isOpen}
        data={popupData}
        onClose={closePopup}
        position={position}
      />
    </>
  );
};

export default KPICards;