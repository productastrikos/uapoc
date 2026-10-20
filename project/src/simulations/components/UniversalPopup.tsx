import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, Activity, AlertTriangle, Clock, Zap, Shield, Plane } from 'lucide-react';

export interface PopupData {
  id: string;
  title: string;
  type: 'kpi' | 'system' | 'aircraft' | 'gate' | 'runway' | 'sensor' | 'maintenance' | 'energy' | 'security';
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'offline';
  description?: string;
  coordinates?: { x: number; y: number };
  realTimeData?: Record<string, any>;
  operationalParams?: Record<string, any>;
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    maintenanceType: string;
  };
  historicalTrends?: {
    period: string;
    values: number[];
    labels: string[];
  };
  alerts?: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

interface UniversalPopupProps {
  isOpen: boolean;
  data: PopupData | null;
  onClose: () => void;
  position?: { x: number; y: number };
}

const PANEL_W = 460;
const MARGIN = 14;

const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const formatValue = (key: string, value: any): string => {
  if (value == null) return '—';
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    const n = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    if (/temperature/i.test(key)) return `${n}°C`;
    if (/power|consumption/i.test(key)) return `${n} kW`;
    if (/percent|efficiency|confidence/i.test(key)) return `${n}%`;
    return n;
  }
  return String(value);
};

const UniversalPopup: React.FC<UniversalPopupProps> = ({ isOpen, data, onClose, position }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number; maxHeight: number }>({
    left: 0,
    top: 0,
    maxHeight: 520,
  });

  /**
   * Anchor the panel near the click but always fully on screen.
   *
   * The old build positioned it with `fixed` + `translate(-50%, -50%)` from
   * inside `.digital-twin-container`, which sets `perspective` and therefore
   * becomes the containing block for fixed descendants - so the popup was
   * measured against that box and clipped by its `overflow: hidden`. It now
   * renders through a portal on <body> and is clamped to the viewport.
   */
  useLayoutEffect(() => {
    if (!isOpen) return;

    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const anchorX = position?.x ?? vw / 2;
      const anchorY = position?.y ?? vh / 2;

      const width = Math.min(PANEL_W, vw - MARGIN * 2);
      const measured = panelRef.current?.scrollHeight ?? 0;
      const maxHeight = Math.min(Math.max(measured, 280), vh - MARGIN * 2, 620);

      // Prefer opening to the right of / below the click, flip when it would
      // overflow, then clamp so it can never leave the viewport.
      let left = anchorX + 18;
      if (left + width > vw - MARGIN) left = anchorX - 18 - width;
      left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));

      let top = anchorY - 40;
      if (top + maxHeight > vh - MARGIN) top = vh - MARGIN - maxHeight;
      top = Math.max(MARGIN, top);

      setPlacement({ left, top, maxHeight });
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [isOpen, position?.x, position?.y, data?.id]);

  // Esc closes the popup before it reaches the simulation overlay's own
  // handler, which would otherwise close the whole simulation.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  if (!isOpen || !data || typeof document === 'undefined') return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-status-success bg-status-success/10 border-status-success/40';
      case 'warning': return 'text-status-warning bg-status-warning/10 border-status-warning/40';
      case 'critical': return 'text-status-error bg-status-error/10 border-status-error/40';
      case 'maintenance': return 'text-accent-blue bg-accent-blue/10 border-accent-blue/40';
      case 'offline': return 'text-text-muted bg-primary-800/40 border-primary-600/40';
      default: return 'text-text-muted bg-primary-800/40 border-primary-600/40';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aircraft': return <Plane className="w-5 h-5" />;
      case 'runway': return <TrendingUp className="w-5 h-5" />;
      case 'maintenance': return <AlertTriangle className="w-5 h-5" />;
      case 'energy': return <Zap className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const section = (
    title: string,
    icon: React.ReactNode,
    entries: Array<[string, any]>
  ) =>
    entries.length > 0 && (
      <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/40">
        <h4 className="text-xs font-semibold text-text-secondary mb-2.5 flex items-center space-x-2 uppercase tracking-wide">
          {icon}
          <span>{title}</span>
        </h4>
        <div className="grid grid-cols-1 gap-1.5">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start gap-4">
              <span className="text-xs text-text-muted">{formatKey(key)}</span>
              <span className="text-xs font-medium text-text-secondary text-right break-words max-w-[62%]">
                {formatValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

  return createPortal(
    // `sim-root` re-establishes the simulation subsystem's CSS scope: this
    // panel is portaled onto <body>, outside the DOM subtree that normally
    // carries that class, so anything here relying on scoped tokens would
    // otherwise lose them.
    <div className="sim-root" style={{ position: 'fixed', inset: 0, zIndex: 10050 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
        className="absolute flex flex-col rounded-xl shadow-2xl modal-surface overflow-hidden"
        style={{
          left: placement.left,
          top: placement.top,
          width: Math.min(PANEL_W, window.innerWidth - MARGIN * 2),
          maxHeight: placement.maxHeight,
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-primary-600/40 bg-primary-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`p-2 rounded-lg border flex-shrink-0 ${getStatusColor(data.status)}`}>
                {getTypeIcon(data.type)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-text-primary truncate">{data.title}</h3>
                <p className="text-xs text-text-muted capitalize truncate">
                  {data.type} • {data.status}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close details"
              className="p-2 hover:bg-primary-700/50 rounded-lg transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {data.description && <p className="text-xs text-text-secondary mt-2 leading-snug">{data.description}</p>}
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0">
          {data.coordinates && typeof data.coordinates.x === 'number' && (
            <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/40">
              <h4 className="text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Location</h4>
              <div className="text-xs text-text-muted tabular-nums">
                X: {data.coordinates.x.toFixed(1)} &nbsp;|&nbsp; Y: {data.coordinates.y.toFixed(1)}
              </div>
            </div>
          )}

          {data.realTimeData &&
            section(
              'Real-time Data',
              <Activity className="w-3.5 h-3.5 text-accent-blue" />,
              Object.entries(data.realTimeData)
            )}

          {data.operationalParams &&
            section(
              'Operational Parameters',
              <TrendingUp className="w-3.5 h-3.5 text-status-success" />,
              Object.entries(data.operationalParams)
            )}

          {data.maintenanceSchedule &&
            section('Maintenance', <Clock className="w-3.5 h-3.5 text-status-warning" />, [
              ['lastMaintenance', data.maintenanceSchedule.lastMaintenance],
              ['nextMaintenance', data.maintenanceSchedule.nextMaintenance],
              ['maintenanceType', data.maintenanceSchedule.maintenanceType],
            ])}

          {data.historicalTrends && data.historicalTrends.values.length > 0 && (
            <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/40">
              <h4 className="text-xs font-semibold text-text-secondary mb-2.5 flex items-center space-x-2 uppercase tracking-wide">
                <TrendingUp className="w-3.5 h-3.5 text-accent-blue" />
                <span>Trend ({data.historicalTrends.period})</span>
              </h4>
              <div className="h-16 flex items-end space-x-1">
                {data.historicalTrends.values.map((value, index) => {
                  const maxValue = Math.max(...data.historicalTrends!.values) || 1;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-accent-blue rounded-t transition-all duration-300 min-h-[3px]"
                      style={{ height: `${(value / maxValue) * 100}%` }}
                      title={`${data.historicalTrends!.labels[index]}: ${value.toFixed(1)}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[length:calc(10px*var(--fs))] text-text-muted mt-1.5">
                <span>{data.historicalTrends.labels[0]}</span>
                <span>{data.historicalTrends.labels[data.historicalTrends.labels.length - 1]}</span>
              </div>
            </div>
          )}

          {data.alerts && data.alerts.length > 0 && (
            <div className="bg-primary-800/40 rounded-lg p-3 border border-primary-600/40">
              <h4 className="text-xs font-semibold text-text-secondary mb-2.5 flex items-center space-x-2 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-status-error" />
                <span>Alerts</span>
              </h4>
              <div className="space-y-2">
                {data.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border-l-2 ${
                      alert.level === 'critical'
                        ? 'border-status-error bg-status-error/10'
                        : alert.level === 'warning'
                        ? 'border-status-warning bg-status-warning/10'
                        : 'border-accent-blue bg-accent-blue/10'
                    }`}
                  >
                    <p className="text-xs text-text-secondary">{alert.message}</p>
                    <p className="text-[length:calc(10px*var(--fs))] text-text-muted mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-primary-600/40 bg-primary-800/30 flex-shrink-0">
          <div className="flex justify-between items-center text-[length:calc(10px*var(--fs))] text-text-muted">
            <span>Updated {new Date().toLocaleTimeString()}</span>
            <span className="truncate ml-3">ID: {data.id}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UniversalPopup;
