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
      case 'up': return <TrendingUp className="w-4 h-4 text-status-neutral" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-status-error" />;
      default: return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'border-primary-600/40';
      case 'warning': return 'border-primary-600/40';
      case 'critical': return 'border-primary-600/40';
      default: return 'border-primary-600/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-5 h-5 text-status-neutral" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-status-warning" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-status-error" />;
      default: return <Minus className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
        {kpis.map(kpi => (
          <div
            key={kpi.id}
            className={`relative bg-primary-800/60 border rounded-xl p-4 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 ${getStatusColor(kpi.status)}`}
            onClick={(e) => handleKPIClick(kpi, e)}
          >
            {/* status rail */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${
                kpi.status === 'good' ? 'bg-status-neutral' :
                kpi.status === 'warning' ? 'bg-status-warning' :
                kpi.status === 'critical' ? 'bg-status-error' : 'bg-text-muted'
              }`}
            />

            <div className="relative flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 min-w-0">
                {getStatusIcon(kpi.status)}
                <h3 className="text-[length:calc(13px*var(--fs))] font-medium text-text-secondary truncate">{kpi.name}</h3>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                {getTrendIcon(kpi.trend)}
                <span className={`text-[length:calc(11px*var(--fs))] font-medium uppercase tracking-wide ${
                  kpi.trend === 'up' ? 'text-status-neutral' :
                  kpi.trend === 'down' ? 'text-status-error' : 'text-text-muted'
                }`}>
                  {kpi.trend}
                </span>
              </div>
            </div>

            <div className="relative flex items-baseline space-x-2 mb-3">
              <span className="text-[length:calc(34px*var(--fs))] leading-none font-bold text-text-primary tabular-nums">
                {kpi.value.toFixed(kpi.value < 10 ? 1 : 0)}
              </span>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{kpi.unit}</span>
            </div>

            {kpi.target && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-text-muted" />
                    <span className="text-text-muted">Target: {kpi.target}{kpi.unit}</span>
                  </div>
                  <span className={`font-medium ${
                    kpi.value >= kpi.target ? 'text-status-neutral' : 'text-status-warning'
                  }`}>
                    {((kpi.value / kpi.target) * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-primary-900/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-1000 ${
                      kpi.status === 'good' ? 'bg-status-neutral' :
                      kpi.status === 'warning' ? 'bg-status-warning' :
                      'bg-status-error'
                    }`}
                    style={{
                      width: `${Math.min(100, (kpi.value / (kpi.target || kpi.value)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Performance Indicator */}
            <div className="mt-3 pt-2.5 border-t border-primary-600/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Performance</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  kpi.status === 'good' ? 'bg-status-neutral/10 text-status-neutral border-status-neutral/30' :
                  kpi.status === 'warning' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                  'bg-status-error/10 text-status-error border-status-error/30'
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