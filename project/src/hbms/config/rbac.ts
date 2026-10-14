// ─────────────────────────────────────────────────────────────────────────────
// src/config/rbac.ts
// Mock Role-Based Access Control configuration for PoC.
// No real auth — roles are fixed constants that drive UI-level gating only.
// ─────────────────────────────────────────────────────────────────────────────

/** All valid roles in the system. Use this type everywhere for strict safety. */
export type UserRole =
  | 'Super Admin'
  | 'City Admin'
  | 'CCTV Operator'
  | 'Tax Officer'
  | 'Complaint Officer'
  | 'GIS Analyst'
  | 'Viewer'
  | 'LBMS Admin';

/** Tuple of every role — useful for iteration (e.g. a role-switcher dropdown). */
export const ALL_ROLES: readonly UserRole[] = [
  'Super Admin',
  'City Admin',
  'CCTV Operator',
  'Tax Officer',
  'Complaint Officer',
  'GIS Analyst',
  'Viewer',
  'LBMS Admin',
] as const;

// ─── Route / Domain Keys ──────────────────────────────────────────────────────

/**
 * Each string corresponds to a navigable domain in the app:
 *   - 'dashboard'     → main dashboard view
 *   - 'cctv'          → CCTV subsystem detail page (/subsystem/cctv-service)
 *   - 'gis'           → GIS subsystem detail page (/subsystem/gis-service)
 *   - 'tax'           → Tax subsystem detail page (/subsystem/tax-service)
 *   - 'advan'         → ADVAN subsystem detail page (/subsystem/advan)
 *   - 'lbms'          → LBMS (HVAC) subsystem detail page (/subsystem/5) — scoped
 *                       to the LBMS Admin role only
 *   - 'alerts'        → Alert Management (/alerts)
 *   - 'incidents'     → Incident Management (/incidents)
 *   - 'sop'           → SOP Management (/sop)
 *   - 'work-orders'   → Work Order Manager (/work-orders)
 *   - 'events'        → Event Log (/events)
 *   - 'analytics'     → Analytics Page (/analytics)
 *   - 'settings'      → (reserved) future settings page
 */
export type AccessDomain =
  | 'dashboard'
  | 'cctv'
  | 'gis'
  | 'tax'
  | 'advan'
  | 'lbms'
  | 'alerts'
  | 'incidents'
  | 'sop'
  | 'work-orders'
  | 'events'
  | 'analytics'
  | 'settings';

/** All domains, for reference/iteration. */
export const ALL_DOMAINS: readonly AccessDomain[] = [
  'dashboard',
  'cctv',
  'gis',
  'tax',
  'advan',
  'lbms',
  'alerts',
  'incidents',
  'sop',
  'work-orders',
  'events',
  'analytics',
  'settings',
] as const;

// ─── Permission Flags per Role ────────────────────────────────────────────────

/** Fine-grained action flags that can be checked inside a domain. */
export interface RolePermissions {
  /** Which top-level domains/pages this role can access. */
  allowedDomains: AccessDomain[];

  /**
   * Whether this role can perform write/mutating actions
   * (acknowledge alerts, close incidents, update work orders, etc.).
   */
  canWrite: boolean;

  /**
   * Whether this role can export data (CSV, PDF reports).
   */
  canExport: boolean;

  /**
   * Whether this role can manage (create/edit/delete) other user
   * records — only meaningful for Super Admin / City Admin.
   */
  canManageUsers: boolean;

  /**
   * Whether this role can configure system-wide settings.
   */
  canConfigureSystem: boolean;
}

// ─── Role → Permission Map ────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Readonly<Record<UserRole, RolePermissions>> = {
  'Super Admin': {
    allowedDomains: [
      'dashboard', 'cctv', 'gis', 'tax', 'advan',
      'alerts', 'incidents', 'sop', 'work-orders',
      'events', 'analytics', 'settings',
    ],
    canWrite: true,
    canExport: true,
    canManageUsers: true,
    canConfigureSystem: true,
  },

  'City Admin': {
    allowedDomains: [
      'dashboard', 'cctv', 'gis', 'tax', 'advan',
      'alerts', 'incidents', 'sop', 'work-orders',
      'events', 'analytics',
    ],
    canWrite: true,
    canExport: true,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  'CCTV Operator': {
    allowedDomains: [
      'dashboard', 'cctv', 'alerts', 'incidents', 'sop', 'events',
    ],
    canWrite: true,
    canExport: false,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  'Tax Officer': {
    allowedDomains: [
      'dashboard', 'tax', 'alerts', 'incidents', 'sop', 'analytics', 'events',
    ],
    canWrite: true,
    canExport: true,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  'Complaint Officer': {
    allowedDomains: [
      'dashboard', 'advan', 'alerts', 'incidents', 'sop', 'work-orders', 'events',
    ],
    canWrite: true,
    canExport: false,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  'GIS Analyst': {
    allowedDomains: [
      'dashboard', 'gis', 'analytics', 'events',
    ],
    canWrite: false,
    canExport: true,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  'Viewer': {
    allowedDomains: [
      'dashboard', 'cctv', 'gis', 'tax', 'advan',
      'alerts', 'incidents', 'events', 'analytics',
    ],
    canWrite: false,
    canExport: false,
    canManageUsers: false,
    canConfigureSystem: false,
  },

  /**
   * Scoped subsystem admin — sees ONLY the LBMS (HVAC) subsystem. Dashboard
   * and sidebar are restricted to LBMS-only data; every other subsystem,
   * page, and cross-subsystem view is hidden/blocked for this role.
   */
  'LBMS Admin': {
    allowedDomains: ['dashboard', 'lbms', 'alerts'],
    canWrite: true,
    canExport: false,
    canManageUsers: false,
    canConfigureSystem: false,
  },
} as const;

// ─── Helper Utilities ─────────────────────────────────────────────────────────

/**
 * Returns true if the given role is allowed to access the specified domain.
 *
 * @example
 * canAccess('CCTV Operator', 'tax')  // → false
 * canAccess('CCTV Operator', 'cctv') // → true
 */
export function canAccess(role: UserRole, domain: AccessDomain): boolean {
  return ROLE_PERMISSIONS[role].allowedDomains.includes(domain);
}

/**
 * Returns the full permissions object for a given role.
 */
export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}
