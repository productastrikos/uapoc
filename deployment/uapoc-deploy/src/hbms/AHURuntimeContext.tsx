// ─────────────────────────────────────────────────────────────────────────────
// AHURuntimeContext — AHU Run/Stop and Manual/Auto overrides shared by every
// Run/Stop is clickable on every AHU card (grid card, detail sidebar, map zone
// pin card) — all three render the SAME underlying ALL_AHU_ASSETS record, so a
// toggle needs to be visible everywhere that asset shows up, not just the card
// that was clicked. ALL_AHU_ASSETS itself stays a static/deterministic dataset
// (other code reads it directly for counts/sorting), so overrides live here as
// a small id → runStop map instead, applied on top of the base asset at render
// time via useLiveAHUAsset / getLiveAsset.
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AHUAsset } from './lbmsAssets';

interface AHURuntimeContextValue {
  getLiveAsset: (asset: AHUAsset) => AHUAsset;
  toggleRunStop: (asset: AHUAsset) => void;
  toggleManual: (asset: AHUAsset) => void;
}

const AHURuntimeContext = createContext<AHURuntimeContextValue | null>(null);

// Stable-ish per-asset fan values so a restarted unit doesn't flicker to a new
// RPM every re-render — derived from the id rather than Math.random().
const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

function applyOverride(base: AHUAsset, runStop: boolean): AHUAsset {
  if (runStop === base.runStop) return base;
  if (!runStop) {
    // Manually stopped — fan spins down. This is an operator action, not an
    // equipment fault, so `status`/`trip` (which drive the fault-red border,
    // grid sort, and quick-filters elsewhere) are deliberately left alone.
    return { ...base, runStop: false, fanOn: false, fanRpm: 0, vsdRpmPct: 0 };
  }
  // Manually started — restore a plausible running state even for a unit
  // whose base data was generated as Fault (fanRpm 0 at rest).
  const h = hashCode(base.id);
  return {
    ...base,
    runStop: true,
    fanOn: true,
    fanRpm: base.fanRpm > 0 ? base.fanRpm : 1000 + (h % 800),
    vsdRpmPct: base.vsdRpmPct > 0 ? base.vsdRpmPct : 35 + (h % 35),
  };
}

export const AHURuntimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  // Manual/Auto is a separate axis from Run/Stop — an operator can flip a
  // stopped unit to Auto or a running one to Manual independently — so it
  // gets its own override map rather than piggybacking on `overrides`.
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});

  const getLiveAsset = useCallback((asset: AHUAsset): AHUAsset => {
    const runStopOverride = overrides[asset.id];
    const base = runStopOverride === undefined ? asset : applyOverride(asset, runStopOverride);
    const manualOverride = manualOverrides[asset.id];
    return manualOverride === undefined ? base : { ...base, manual: manualOverride };
  }, [overrides, manualOverrides]);

  const toggleRunStop = useCallback((asset: AHUAsset) => {
    setOverrides(prev => {
      const current = prev[asset.id] ?? asset.runStop;
      return { ...prev, [asset.id]: !current };
    });
  }, []);

  const toggleManual = useCallback((asset: AHUAsset) => {
    setManualOverrides(prev => {
      const current = prev[asset.id] ?? asset.manual;
      return { ...prev, [asset.id]: !current };
    });
  }, []);

  const value = useMemo(() => ({ getLiveAsset, toggleRunStop, toggleManual }), [getLiveAsset, toggleRunStop, toggleManual]);

  return <AHURuntimeContext.Provider value={value}>{children}</AHURuntimeContext.Provider>;
};

export function useAHURuntime(): AHURuntimeContextValue {
  const ctx = useContext(AHURuntimeContext);
  if (!ctx) throw new Error('useAHURuntime must be used within an AHURuntimeProvider');
  return ctx;
}

/** Convenience: live asset + its Run/Stop and Manual/Auto toggle handlers in one call. */
export function useLiveAHUAsset(asset: AHUAsset): [AHUAsset, () => void, () => void] {
  const { getLiveAsset, toggleRunStop, toggleManual } = useAHURuntime();
  return [getLiveAsset(asset), () => toggleRunStop(asset), () => toggleManual(asset)];
}
