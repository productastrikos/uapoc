import { useCallback, useState } from 'react';
import { PopupData } from '../components/UniversalPopup';

/** Keys that are plumbing, not something an operator wants to read. */
const HIDDEN_KEYS = new Set([
  'id',
  'position',
  'coordinates',
  'target',
  'heading',
  'dist',
  'lift',
  'routeKind',
  'holdUntil',
  'clearedStops',
  'processingQueue',
  'machine',
  'steps',
  'segments',
  'nodeFlow',
  'kpis',
  'scenarios',
]);

const POPUP_STATUSES = ['operational', 'warning', 'critical', 'maintenance', 'offline'] as const;
type PopupStatus = (typeof POPUP_STATUSES)[number];

/**
 * Map whatever status the source object carries onto the five the popup
 * renders. Simulation objects use their own vocabulary ("flagged", "loading",
 * "sop-triggered", ...), and without this every popup rendered as "offline".
 */
const toPopupStatus = (raw: unknown): PopupStatus => {
  const s = String(raw ?? '').toLowerCase();
  if (!s) return 'operational';
  if ((POPUP_STATUSES as readonly string[]).includes(s)) return s as PopupStatus;
  if (/(fail|critical|breach|sop|anomaly|explosive|locked)/.test(s)) return 'critical';
  if (/(flag|warn|delay|overload|high|suspicious|manual)/.test(s)) return 'warning';
  if (/(maint|service|calibrat)/.test(s)) return 'maintenance';
  if (/(inactive|offline|standby|available|pending)/.test(s)) return 'offline';
  return 'operational';
};

/** Split an arbitrary payload into the two readable sections of the popup. */
const partition = (data: Record<string, any>) => {
  const live: Record<string, any> = {};
  const params: Record<string, any> = {};

  Object.entries(data ?? {}).forEach(([key, value]) => {
    if (HIDDEN_KEYS.has(key)) return;
    if (value == null || typeof value === 'function') return;
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) return;
    if (Array.isArray(value) && value.some((v) => v && typeof v === 'object')) return;

    if (/(load|throughput|efficiency|confidence|uptime|power|energy|temp|speed|rate|level|count|weight|queue)/i.test(key)) {
      live[key] = value;
    } else {
      params[key] = value;
    }
  });

  return { live, params };
};

export const usePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const openPopup = useCallback((data: PopupData, clickPosition?: { x: number; y: number }) => {
    setPopupData(data);
    if (clickPosition) setPosition(clickPosition);
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setPopupData(null);
  }, []);

  const generateKPIPopupData = useCallback(
    (kpiName: string, kpiData: any): PopupData => ({
      id: `kpi-${kpiName.toLowerCase().replace(/\s+/g, '-')}`,
      title: kpiName,
      type: 'kpi',
      status: kpiData?.status === 'good' ? 'operational' : toPopupStatus(kpiData?.status),
      description: `Performance indicator tracking ${kpiName.toLowerCase()}`,
      realTimeData: {
        currentValue: kpiData?.value,
        unit: kpiData?.unit,
        target: kpiData?.target,
        trend: kpiData?.trend,
      },
      operationalParams: {
        threshold: kpiData?.target,
        alertLevel: kpiData?.status,
        updateFrequency: '30 seconds',
      },
      historicalTrends: {
        period: 'Last 12 hours',
        values: Array.from({ length: 12 }, (_, i) => {
          const base = Number(kpiData?.value) || 50;
          return base * (0.88 + 0.24 * Math.abs(Math.sin(i * 0.9)));
        }),
        labels: Array.from({ length: 12 }, (_, i) => `${((new Date().getHours() - 11 + i) + 24) % 24}:00`),
      },
    }),
    []
  );

  /**
   * Build a popup from any simulation object.
   *
   * Everything the caller passes in is surfaced - the previous version threw
   * the payload away and rendered random numbers, so clicking a scanner, a bag
   * and a carousel all produced the same meaningless panel.
   */
  const generateSystemPopupData = useCallback((systemName: string, systemData: any): PopupData => {
    const { live, params } = partition(systemData ?? {});
    return {
      id: `system-${String(systemName).toLowerCase().replace(/\s+/g, '-')}`,
      title: systemName,
      type: 'system',
      status: toPopupStatus(systemData?.status),
      description: systemData?.description ?? `Live state for ${systemName}`,
      coordinates: systemData?.coordinates ?? systemData?.position,
      realTimeData: Object.keys(live).length ? live : undefined,
      operationalParams: Object.keys(params).length ? params : undefined,
      maintenanceSchedule: systemData?.lastMaintenance
        ? {
            lastMaintenance: new Date(systemData.lastMaintenance).toLocaleDateString(),
            nextMaintenance: new Date(
              new Date(systemData.lastMaintenance).getTime() + 30 * 24 * 60 * 60 * 1000
            ).toLocaleDateString(),
            maintenanceType: systemData?.maintenanceType ?? 'Preventive',
          }
        : undefined,
      alerts: Array.isArray(systemData?.alerts) && systemData.alerts.length
        ? systemData.alerts.map((a: any) => ({
            level: typeof a === 'string' ? ('warning' as const) : a.level ?? 'warning',
            message: typeof a === 'string' ? a : a.message,
            timestamp: typeof a === 'string' ? new Date().toISOString() : a.timestamp ?? new Date().toISOString(),
          }))
        : undefined,
    };
  }, []);

  const generateAircraftPopupData = useCallback((aircraftId: string, aircraftData: any): PopupData => {
    const { params } = partition(aircraftData ?? {});
    return {
      id: `aircraft-${aircraftId}`,
      title: `Aircraft ${aircraftId}`,
      type: 'aircraft',
      status: toPopupStatus(aircraftData?.status),
      description: `Commercial aircraft — ${aircraftData?.airline || 'Unknown Airline'}`,
      coordinates: aircraftData?.position,
      realTimeData: {
        phase: aircraftData?.phase ?? 'standby',
        altitude: aircraftData?.altitude ?? 0,
        speed: aircraftData?.speed ?? 0,
        heading: aircraftData?.heading ?? 0,
      },
      operationalParams: {
        flightNumber: aircraftId,
        aircraft: aircraftData?.aircraftType || 'A320',
        gate: aircraftData?.gate || 'TBD',
        runway: aircraftData?.runway ?? '—',
        passengers: aircraftData?.passengers ?? 0,
        ...params,
      },
    };
  }, []);

  return {
    isOpen,
    popupData,
    position,
    openPopup,
    closePopup,
    generateKPIPopupData,
    generateSystemPopupData,
    generateAircraftPopupData,
  };
};
