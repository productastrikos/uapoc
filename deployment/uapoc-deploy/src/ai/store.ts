/**
 * Disposition of AI recommendations, held once for the whole app.
 *
 * A recommendation accepted on the terminal console has to still read as
 * accepted when the operator comes back to it from the copilot drawer, so this
 * lives above the modules rather than inside each one.
 *
 * Shadow mode is the important one for a control room. An operator who does not
 * yet trust a model will not press Execute, but will happily let it run beside
 * them and be judged later — so every insight can be taken up without acting on
 * it, and the panel keeps score.
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { AiDisposition, AiDomain, AiInsight } from './types';
import { AI_CATALOGUE } from './catalogue';

interface AiState {
  /** Insight id → disposition. Absent means `pending`. */
  dispositions: Record<string, AiDisposition>;
  /** Copilot drawer visibility. */
  drawerOpen: boolean;
  /** Domain the drawer is filtered to, or null for everything. */
  drawerDomain: AiDomain | null;

  /**
   * The console the operator is actually looking at.
   *
   * The advisory drawer opens scoped to this. An operator on the airfield
   * lighting screen wants the lighting recommendations — offering them twelve
   * domains and a row of filter chips makes them do the filtering the app
   * already knows the answer to.
   */
  activeDomain: AiDomain | null;

  /**
   * Insights a console computes from its own live state, by domain.
   *
   * The catalogue is static prose; these are derived from real tags and change
   * as the plant does. A console registers them here so the drawer can show the
   * live ones instead of the written ones for the screen you are on.
   */
  liveInsights: Partial<Record<AiDomain, AiInsight[]>>;

  set: (id: string, disposition: AiDisposition) => void;
  reset: () => void;
  openDrawer: (domain?: AiDomain | null) => void;
  closeDrawer: () => void;
  setActiveDomain: (domain: AiDomain | null) => void;
  setLiveInsights: (domain: AiDomain, insights: AiInsight[]) => void;
}

export const useAiStore = create<AiState>((set) => ({
  dispositions: {},
  drawerOpen: false,
  drawerDomain: null,
  activeDomain: null,
  liveInsights: {},

  set: (id, disposition) =>
    set((s) => ({ dispositions: { ...s.dispositions, [id]: disposition } })),

  reset: () => set({ dispositions: {} }),

  // Defaulting to the active console rather than to "everything" is the whole
  // point: the button means "what does the AI say about this screen".
  openDrawer: (domain) =>
    set((s) => ({ drawerOpen: true, drawerDomain: domain === undefined ? s.activeDomain : domain })),
  closeDrawer: () => set({ drawerOpen: false }),

  setActiveDomain: (activeDomain) => set({ activeDomain }),
  setLiveInsights: (domain, insights) =>
    set((s) => ({ liveInsights: { ...s.liveInsights, [domain]: insights } })),
}));

/**
 * Declare which console is on screen, for the lifetime of the component.
 *
 * Clearing on unmount matters: without it, navigating from a console to a
 * screen that declares nothing would leave the drawer still scoped to wherever
 * the operator used to be.
 */
export function useAiDomain(domain: AiDomain, insights?: AiInsight[]): void {
  const setActiveDomain = useAiStore((s) => s.setActiveDomain);
  const setLiveInsights = useAiStore((s) => s.setLiveInsights);

  useEffect(() => {
    setActiveDomain(domain);
    return () => setActiveDomain(null);
  }, [domain, setActiveDomain]);

  useEffect(() => {
    if (insights) setLiveInsights(domain, insights);
  }, [domain, insights, setLiveInsights]);
}

/** Disposition of one insight, defaulting to pending. */
export function useDisposition(id: string): AiDisposition {
  return useAiStore((s) => s.dispositions[id] ?? 'pending');
}

/**
 * How many recommendations are still waiting on an operator.
 *
 * Counted over the catalogue rather than over the dispositions map, because an
 * insight nobody has touched yet has no entry in that map at all.
 */
export function usePendingCount(domain?: AiDomain): number {
  return useAiStore((s) =>
    AI_CATALOGUE.filter(
      (i) =>
        (domain === undefined || i.domain === domain) &&
        (s.dispositions[i.id] ?? 'pending') === 'pending'
    ).length
  );
}
