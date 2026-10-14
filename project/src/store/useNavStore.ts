/**
 * Which console is on screen.
 *
 * Lifted out of `App` so that anything outside the module tree can navigate —
 * specifically the AI copilot drawer, which lists recommendations from every
 * domain and is worth very little if an operator cannot get from a
 * recommendation to the screen it belongs to.
 *
 * `subTab` addresses the consoles that carry their own sub-navigation (airside
 * → AGL / apron, terminal → building management). It is consumed once and then
 * cleared, so a later manual tab change is not undone by stale nav state.
 */

import { create } from 'zustand';

interface NavState {
  module: string;
  subTab: string | null;
  go: (module: string, subTab?: string | null) => void;
  clearSubTab: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  module: 'aocc',
  subTab: null,
  go: (module, subTab = null) => set({ module, subTab }),
  clearSubTab: () => set({ subTab: null }),
}));

/** Where a domain's recommendations live: module id and optional console tab. */
export const DOMAIN_ROUTE: Record<string, { module: string; subTab?: string }> = {
  aocc: { module: 'aocc' },
  airside: { module: 'airside', subTab: 'overview' },
  agl: { module: 'airside', subTab: 'agl' },
  apron: { module: 'airside', subTab: 'apron' },
  terminal: { module: 'terminal', subTab: 'overview' },
  bms: { module: 'terminal', subTab: 'bms' },
  landside: { module: 'landside' },
  security: { module: 'security' },
  maintenance: { module: 'maintenance' },
  commercial: { module: 'commercial' },
  sustainability: { module: 'sustainability' },
  passenger: { module: 'passenger-journey' },
  analytics: { module: 'reports' },
};
