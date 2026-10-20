// ─────────────────────────────────────────────────────────────────────────────
// src/components/LBMSAHUGrid.tsx
// Paginated, filterable AHU card grid for the LBMS Operator view
// (public/all_asset_view.png style) — 209 AHUs across GF/1F/2F/3F, fault/
// inactive units sorted to the top (sortAssetsForDisplay), paged with
// Prev/Next. Only ever shown on demand (covering the Operator view's chart
// dashboard), so it gets the full panel area to itself.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Fan, Search, X } from 'lucide-react';
import {
  ALL_AHU_ASSETS, AHU_TOTAL_COUNT, AHU_FAULT_COUNT, AHU_FLOOR_ORDER,
  sortAssetsForDisplay, type AHUAsset, type AHUFloor,
} from '../lbmsAssets';
import AHUAssetCard from './AHUAssetCard';
import AHUAssetDetailCard from './AHUAssetDetailCard';

const PAGE_SIZE = 14; // 2 rows x 7, matching public/all_asset_view.png

type StatusFilter = 'all' | 'Working' | 'Fault';
type QuickFilter = 'manual' | 'trip' | 'ductSmoke' | 'preFilter' | 'bagFilter';

const QUICK_FILTERS: { key: QuickFilter; label: string; test: (a: AHUAsset) => boolean }[] = [
  { key: 'manual',    label: 'Manual mode',        test: a => a.manual },
  { key: 'trip',      label: 'Tripped',            test: a => a.trip },
  { key: 'ductSmoke', label: 'Duct smoke fault',   test: a => !a.ductSmokeOk },
  { key: 'preFilter', label: 'Pre-filter fault',   test: a => !a.preFilterOk },
  { key: 'bagFilter', label: 'Bag-filter fault',   test: a => !a.bagFilterOk },
];

// Native <select> popups render with the OS/browser's own light chrome,
// which clashed hard against this dark panel — a custom dropdown instead so
// the open list matches the rest of the app.
const Dropdown: React.FC<{ value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDocPointer);
    return () => document.removeEventListener('mousedown', onDocPointer);
  }, [open]);

  const current = options.find(o => o.value === value) ?? options[0];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5"
        style={{
          fontSize: 10.5, fontWeight: 600, padding: '5px 8px', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--ds-text)',
        }}
      >
        {current?.label}
        <ChevronDown className="w-3 h-3" style={{ color: 'var(--ds-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50, minWidth: '100%', borderRadius: 10,
            overflow: 'hidden', background: '#0b1220', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '6px 12px', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                color: o.value === value ? '#93C5FD' : 'var(--ds-text)',
                background: o.value === value ? 'rgba(59,130,246,0.14)' : 'transparent',
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="flex-shrink-0 transition-all"
    style={{
      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
      background: active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)',
      color: active ? '#93C5FD' : 'var(--ds-text-muted)',
      border: `1px solid ${active ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}`,
    }}
  >
    {children}
  </button>
);

interface LBMSAHUGridProps {
  /** Arrived via a deep-link (Dashboard alert / Supervisor KPI card) pointed
   *  at one specific unit — pre-filter the grid to just it and pop its
   *  detail card open immediately, so "click the alert" lands on "here's the
   *  one with the issue" in one step. A "Clear" chip (existing filter-bar
   *  affordance) gets back to browsing the full fleet. */
  focusAssetId?: string;
}

const LBMSAHUGrid: React.FC<LBMSAHUGridProps> = ({ focusAssetId }) => {
  const [search, setSearch] = useState(focusAssetId ?? '');
  const [floor, setFloor] = useState<'all' | AHUFloor>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [quick, setQuick] = useState<Set<QuickFilter>>(new Set());
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AHUAsset | null>(
    focusAssetId ? ALL_AHU_ASSETS.find(a => a.id === focusAssetId) ?? null : null,
  );

  const toggleQuick = (key: QuickFilter) => {
    setPage(0);
    setQuick(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const activeQuick = QUICK_FILTERS.filter(f => quick.has(f.key));
    return ALL_AHU_ASSETS.filter(a => {
      if (q && !a.id.toLowerCase().includes(q)) return false;
      if (floor !== 'all' && a.floor !== floor) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (activeQuick.length > 0 && !activeQuick.every(f => f.test(a))) return false;
      return true;
    });
  }, [search, floor, status, quick]);

  const sorted = useMemo(() => sortAssetsForDisplay(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const hasActiveFilters = search !== '' || floor !== 'all' || status !== 'all' || quick.size > 0;
  const clearFilters = () => { setSearch(''); setFloor('all'); setStatus('all'); setQuick(new Set()); setPage(0); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Fan style={{ width: 12, height: 12, color: '#34d399' }} />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Air Handling Units
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 8.5, color: 'var(--ds-text-muted)', fontStyle: 'italic' }}>
          {sorted.length} of {AHU_TOTAL_COUNT} AHUs · {AHU_FAULT_COUNT} in fault
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: '0 1 160px' }}>
          <Search style={{ width: 11, height: 11, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-text-muted)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search AHU ID…"
            style={{
              width: '100%', fontSize: 10.5, padding: '5px 8px 5px 24px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--ds-text)',
            }}
          />
        </div>

        <Dropdown
          value={floor}
          onChange={v => { setFloor(v as 'all' | AHUFloor); setPage(0); }}
          options={[{ value: 'all', label: 'All floors' }, ...AHU_FLOOR_ORDER.map(f => ({ value: f, label: f }))]}
        />

        <Dropdown
          value={status}
          onChange={v => { setStatus(v as StatusFilter); setPage(0); }}
          options={[{ value: 'all', label: 'All statuses' }, { value: 'Working', label: 'Working' }, { value: 'Fault', label: 'Fault' }]}
        />

        {QUICK_FILTERS.map(f => (
          <FilterChip key={f.key} active={quick.has(f.key)} onClick={() => toggleQuick(f.key)}>{f.label}</FilterChip>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 flex items-center gap-1 transition-all hover:brightness-125"
            style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 99, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <X className="w-2.5 h-2.5" /> Clear
          </button>
        )}
      </div>

      {pageItems.length === 0 ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, color: 'var(--ds-text-muted)' }}>
          No AHUs match these filters.
        </div>
      ) : (
        // gridAutoRows uses a capped minmax (not a bare 1fr) — 1fr divides
        // ALL leftover container height across however many rows exist, so
        // a filtered-down result with only 1-2 cards (e.g. the alert deep-
        // link's single-asset search) stretched each row to the ENTIRE
        // available height, blowing individual cards up to an absurd size.
        // Capping the max means rows grow to fill space when there's a full
        // page of them, but never past a normal card height when there
        // aren't. The floor under the minmax is what stops a short container
        // (this grid sits in a console panel, not a full page as it did in
        // the source app) from squashing rows below the faceplate's own
        // height, which made cards overlap. overflowY:auto carries the rest.
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(292px, 320px)', gap: 8 }}>
          {pageItems.map(asset => (
            <AHUAssetCard key={asset.id} asset={asset} onClick={() => setSelected(asset)} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2, flexShrink: 0 }}>
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={clampedPage === 0}
          className="btn btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: 10.5 }}
        >
          <ChevronLeft className="w-3 h-3" /> Prev
        </button>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ds-text-muted)' }}>
          Page {clampedPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={clampedPage >= totalPages - 1}
          className="btn btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontSize: 10.5 }}
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {selected && <AHUAssetDetailCard asset={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default LBMSAHUGrid;
