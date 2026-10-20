import React, { useState, useEffect } from 'react';
import { Alert } from '../types';
import { BarChart3, TrendingUp, Activity, Zap, Users, Thermometer } from 'lucide-react';
import UniversalPopup from './UniversalPopup';
import { usePopup } from '../hooks/usePopup';

interface LiveChartsProps {
  subsystemId: string;
  alerts: Alert[];
}

const LiveCharts: React.FC<LiveChartsProps> = ({ subsystemId, alerts }) => {
  const [energyData, setEnergyData] = useState<number[]>([]);
  const [passengerData, setPassengerData] = useState<number[]>([]);
  const [temperatureData, setTemperatureData] = useState<number[]>([]);
  const [alertHeatmap, setAlertHeatmap] = useState<Record<string, number>>({});
  const { isOpen, popupData, position, openPopup, closePopup, generateSystemPopupData } = usePopup();

  const handleChartClick = (chartType: string, data: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const clickPosition = {
      x: event.clientX,
      y: event.clientY
    };

    const popupData = generateSystemPopupData(`${chartType} Monitor`, {
      subsystem: subsystemId,
      data: data,
      status: 'operational',
      chartType
    });

    openPopup(popupData, clickPosition);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Update energy consumption data
      setEnergyData(prev => {
        const newData = [...prev, Math.random() * 100 + 200];
        return newData.slice(-20); // Keep last 20 points
      });

      // Update passenger flow data
      setPassengerData(prev => {
        const newData = [...prev, Math.random() * 50 + 100];
        return newData.slice(-20);
      });

      // Update temperature data
      setTemperatureData(prev => {
        const newData = [...prev, Math.random() * 4 + 20]; // 20-24°C
        return newData.slice(-20);
      });

      // Update alert heatmap
      const recentAlerts = alerts.slice(0, 10);
      const heatmap: Record<string, number> = {};
      recentAlerts.forEach(alert => {
        heatmap[alert.type] = (heatmap[alert.type] || 0) + 1;
      });
      setAlertHeatmap(heatmap);
    }, 2000);

    return () => clearInterval(interval);
  }, [alerts]);

  const maxEnergy = Math.max(...energyData, 300);
  const maxPassenger = Math.max(...passengerData, 150);
  const maxTemp = Math.max(...temperatureData, 25);

  return (
    <>
      <div className="space-y-4 h-full flex flex-col">
        {/* Temperature Monitoring */}
        <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl">
          <div className="p-6 border-b border-primary-600/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent-blue/15 rounded-lg border border-accent-blue/30">
                <Thermometer className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Temperature Control</h3>
                <p className="text-text-secondary text-sm">HVAC system monitoring</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div
              className="h-40 flex items-end space-x-1 bg-primary-900/40 rounded-lg p-4 cursor-pointer hover:bg-primary-800/40 transition-colors overflow-hidden"
              onClick={(e) => handleChartClick('Temperature Control', { current: temperatureData[temperatureData.length - 1], data: temperatureData }, e)}
            >
              {temperatureData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-accent-blue rounded-t transition-all duration-500 hover:opacity-80"
                  style={{ height: `${((value - 18) / 8) * 100}%` }} // Scale for 18-26°C range
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-muted">Zone temperature readings</span>
              <span className="font-medium text-text-primary">
                Current: <span className="text-accent-blue">{temperatureData[temperatureData.length - 1]?.toFixed(1) || 0}°C</span>
              </span>
            </div>

            {/* Temperature Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div
                className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 text-center cursor-pointer hover:bg-primary-700/40 transition-colors"
                onClick={(e) => handleChartClick('Target Temperature', { target: 22 }, e)}
              >
                <div className="text-accent-blue font-bold text-lg">22°C</div>
                <div className="text-xs text-text-muted">Target</div>
              </div>
              <div
                className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 text-center cursor-pointer hover:bg-primary-700/40 transition-colors"
                onClick={(e) => handleChartClick('Temperature Variance', { variance: '±0.5°C' }, e)}
              >
                <div className="text-status-success font-bold text-lg">±0.5°C</div>
                <div className="text-xs text-text-muted">Variance</div>
              </div>
              <div
                className="bg-primary-800/60 border border-primary-600/40 rounded-xl p-3 text-center cursor-pointer hover:bg-primary-700/40 transition-colors"
                onClick={(e) => handleChartClick('Humidity Control', { percentage: 45 }, e)}
              >
                <div className="text-accent-blue font-bold text-lg">45%</div>
                <div className="text-xs text-text-muted">Humidity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="bg-primary-800/60 border border-primary-600/40 rounded-xl">
          <div className="p-6 border-b border-primary-600/40">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-status-error/15 rounded-lg border border-status-error/30">
                <Activity className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Alert Distribution</h3>
                <p className="text-text-secondary text-sm">System notification heatmap</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(alertHeatmap).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center space-x-4 cursor-pointer hover:bg-primary-700/30 p-2 rounded transition-colors"
                  onClick={(e) => handleChartClick(`Alert Type: ${type}`, { type, count, alerts: alerts.filter(a => a.type === type) }, e)}
                >
                  <div className="w-24 text-sm text-text-secondary capitalize font-medium">{type.replace('-', ' ')}</div>
                  <div className="flex-1 bg-primary-900/40 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-status-error h-6 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-text-primary">{count} alerts</span>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm font-bold text-status-error">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(alertHeatmap).length === 0 && (
              <div
                className="text-center py-12 cursor-pointer hover:bg-primary-700/30 rounded transition-colors"
                onClick={(e) => handleChartClick('Alert System', { status: 'no-alerts' }, e)}
              >
                <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary text-lg">No recent alerts</p>
                <p className="text-text-muted text-sm">All systems operating normally</p>
              </div>
            )}
          </div>
        </div>
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

export default LiveCharts;
