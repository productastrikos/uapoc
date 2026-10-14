/**
 * HBMS console navigation and session state.
 *
 * The source app was a routed SPA: screens addressed each other with
 * `navigate('/sop')`, `navigate('/work-orders?subsystem=pas&alertId=…')` and
 * `navigate('/subsystem/5', { state: { lbmsFocus } })`. TAMS has no router —
 * modules are switched from a store — so every one of those hand-offs is
 * modelled here instead, keeping the original workflow intact:
 *
 *   • `view`          — which HBMS screen is on top (was the route path)
 *   • `subsystem`     — which subsystem detail page (was `/subsystem/:id`)
 *   • `workOrderLink` — the six query params WorkOrderManager reads to seed
 *                       its filters and pre-fill a new order (was `?…`)
 *   • `alertFilter`   — AlertManagement's `?subsystem=` seed
 *   • `lbmsFocus`     — LBMSDetails' `location.state.lbmsFocus`
 *
 * Deep-link payloads are consumed once and cleared, so returning to a screen
 * later does not re-apply a stale hand-off — the same one-shot discipline the
 * TAMS nav store already uses for console sub-tabs.
 */

import { create } from 'zustand';
import type { UserRole } from '../config/rbac';
import { canAccess, getPermissions, type AccessDomain, type RolePermissions } from '../config/rbac';

export type HbmsView = 'subsystems' | 'alerts' | 'incidents' | 'sop' | 'work-orders' | 'assets';

/** The `?subsystem=&status=&priority=&alertId=&message=&severity=` payload. */
export interface WorkOrderLink {
  subsystem?: string;
  status?: string;
  priority?: string;
  alertId?: string;
  message?: string;
  severity?: string;
}

/** SCADA's equipment overview drills into the asset register filtered by
 *  device type — was `/assets?subsystem=SCADA&type=…&issue=…`. */
export interface AssetLink {
  subsystem?: string;
  type?: string;
  issue?: string;
}

/** Was `navigate('/subsystem/5', { state: { lbmsFocus } })`. */
export interface LbmsFocus {
  openAhuGrid?: boolean;
  ahuAssetId?: string;
}

interface HbmsState {
  view: HbmsView;
  /** Subsystem code, e.g. 'pas' — the old `/subsystem/:id` param. `null`
   *  shows the all-subsystems grid, which is where the console lands. */
  subsystem: string | null;
  workOrderLink: WorkOrderLink | null;
  alertFilter: string | null;
  assetLink: AssetLink | null;
  lbmsFocus: LbmsFocus | null;

  /** Mock session role — drives the same UI gating as the source's RBAC. */
  role: UserRole;

  go: (view: HbmsView) => void;
  openSubsystem: (code: string, focus?: LbmsFocus) => void;
  showAllSubsystems: () => void;
  openWorkOrders: (link?: WorkOrderLink) => void;
  openAlerts: (subsystem?: string) => void;
  openAssets: (link?: AssetLink) => void;
  setRole: (role: UserRole) => void;

  consumeWorkOrderLink: () => void;
  consumeAlertFilter: () => void;
  consumeAssetLink: () => void;
  consumeLbmsFocus: () => void;
}

export const useHbmsStore = create<HbmsState>((set) => ({
  view: 'subsystems',
  subsystem: null,
  workOrderLink: null,
  alertFilter: null,
  assetLink: null,
  lbmsFocus: null,
  role: 'Super Admin',

  go: (view) => set({ view }),
  openSubsystem: (code, focus) => set({ view: 'subsystems', subsystem: code, lbmsFocus: focus ?? null }),
  showAllSubsystems: () => set({ view: 'subsystems', subsystem: null }),
  openWorkOrders: (link) => set({ view: 'work-orders', workOrderLink: link ?? null }),
  openAlerts: (subsystem) => set({ view: 'alerts', alertFilter: subsystem ?? null }),
  openAssets: (link) => set({ view: 'assets', assetLink: link ?? null }),
  setRole: (role) => set({ role }),

  consumeWorkOrderLink: () => set({ workOrderLink: null }),
  consumeAlertFilter: () => set({ alertFilter: null }),
  consumeAssetLink: () => set({ assetLink: null }),
  consumeLbmsFocus: () => set({ lbmsFocus: null }),
}));

/** Convenience selectors mirroring the source's `useMockAuth()` helpers. */
export const useHbmsRole = (): UserRole => useHbmsStore((s) => s.role);
export const useHbmsPermissions = (): RolePermissions => getPermissions(useHbmsStore((s) => s.role));
export const useHbmsAccess = (domain: AccessDomain): boolean => canAccess(useHbmsStore((s) => s.role), domain);
