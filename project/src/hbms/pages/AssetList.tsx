import React, { useEffect, useMemo, useState } from 'react';
import { useHbmsStore } from '../store/useHbmsStore';
import { subsystemById } from '../subsystems/catalog';
import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ASSETS, Asset } from '../assets';
import { HBMS_SUBSYSTEMS } from '../subsystems/catalog';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'All' | 'Active' | 'Warning' | 'Inactive';
type SortKey = keyof Asset | null;
type SortDir = 'asc' | 'desc';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Active:   { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.3)',  dot: '#10b981' },
  Warning:  { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  Inactive: { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
};

// Same Open/Closed colors as the Supervisor view's pie charts, so a breaker's state
// reads consistently whether you're looking at the chart or the Asset Register row.
const BREAKER_STYLES: Record<'Open' | 'Closed', { bg: string; text: string; border: string }> = {
  Open:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  Closed: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
};

// Flagged sub-parameter badge (e.g. "Conn", "PSU Alm") — a fault tone distinct from
// the breaker colors, since the two never apply to the same asset.
const ISSUE_BADGE_STYLE = { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };

// ─── Component ────────────────────────────────────────────────────────────────

const AssetList: React.FC = () => {
  // Was `?subsystem=&type=&issue=`; the console store carries the same three
  // values, read once on arrival and then cleared.
  const [link] = useState(() => useHbmsStore.getState().assetLink);
  const consumeAssetLink = useHbmsStore((s) => s.consumeAssetLink);
  const openSubsystem = useHbmsStore((s) => s.openSubsystem);
  useEffect(() => { consumeAssetLink(); }, [consumeAssetLink]);

  const initialSubsystem = link?.subsystem ?? 'All';
  const initialType = link?.type ?? 'All';
  const initialIssue = link?.issue ?? '';

  const [search,          setSearch]          = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState<string>(initialSubsystem);
  const [statusFilter,    setStatusFilter]    = useState<StatusFilter>('All');
  const [typeFilter,      setTypeFilter]      = useState<string>(initialType);
  const [issueFilter,     setIssueFilter]     = useState<string>(initialIssue);
  const [sortKey,         setSortKey]         = useState<SortKey>(null);
  const [sortDir,         setSortDir]         = useState<SortDir>('asc');

  // Type options are scoped to the selected subsystem — SCADA alone has 15 device
  // types, so mixing in every other subsystem's types would make the dropdown unusable.
  const availableTypes = useMemo(() => {
    const pool = subsystemFilter === 'All' ? ASSETS : ASSETS.filter(a => a.subsystemAcronym === subsystemFilter);
    return Array.from(new Set(pool.map(a => a.type))).sort();
  }, [subsystemFilter]);

  const handleSubsystemClick = (acronym: string) => {
    const next = subsystemFilter === acronym ? 'All' : acronym;
    setSubsystemFilter(next);
    setTypeFilter('All');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = ASSETS;
    if (subsystemFilter !== 'All') list = list.filter(a => a.subsystemAcronym === subsystemFilter);
    if (statusFilter    !== 'All') list = list.filter(a => a.status === statusFilter);
    if (typeFilter      !== 'All') list = list.filter(a => a.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q),
      );
    }
    const statusOrder: Record<string, number> = { Inactive: 0, Warning: 1, Active: 2 };
    const breakerOrder: Record<string, number> = { Open: 0, Closed: 1 };
    list = [...list].sort((a, b) => {
      // Always surface inactive first, then warning, then active
      const sd = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (sd !== 0) return sd;
      // Within the same status, an open breaker is the one a supervisor needs to
      // check (normal position is closed/energized) — surface those next.
      const bd = (breakerOrder[a.breakerState ?? ''] ?? 2) - (breakerOrder[b.breakerState ?? ''] ?? 2);
      if (bd !== 0) return bd;
      // Arrived via a specific bar-chart issue (e.g. "Conn")? Surface the units
      // actually flagged with that exact issue above the rest of the same group.
      if (issueFilter) {
        const ai = a.paramIssues?.includes(issueFilter) ? 0 : 1;
        const bi = b.paramIssues?.includes(issueFilter) ? 0 : 1;
        if (ai !== bi) return ai - bi;
      }
      // Within the same status group, apply user column sort if set
      if (sortKey) {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return 0;
    });
    return list;
  }, [subsystemFilter, statusFilter, typeFilter, issueFilter, search, sortKey, sortDir]);

  const totalActive   = filtered.filter(a => a.status === 'Active').length;
  const totalWarning  = filtered.filter(a => a.status === 'Warning').length;
  const totalInactive = filtered.filter(a => a.status === 'Inactive').length;

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="text-slate-600 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="text-blue-400 ml-1 inline" />
      : <ChevronDown size={12} className="text-blue-400 ml-1 inline" />;
  };

  const Th: React.FC<{ label: string; col: SortKey; className?: string }> = ({ label, col, className }) => (
    <th
      className={`px-2 py-2.5 text-left cursor-pointer select-none hover:text-slate-200 transition-colors ${className ?? ''}`}
      onClick={() => handleSort(col)}
    >
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
        {label}<SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="h-full flex flex-col text-slate-100 overflow-hidden bg-primary-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-primary-600/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Asset Register</h1>
            <p className="text-sm text-text-muted mt-0.5">Long Thanh International Airport — HBMS</p>
          </div>

          {/* Summary tiles */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-primary-800/60 border-primary-600/40">
              <div className="w-2 h-2 rounded-full bg-status-success" />
              <span className="text-sm font-bold text-text-primary">{totalActive}</span>
              <span className="text-xs text-text-muted">Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-primary-800/60 border-primary-600/40">
              <div className="w-2 h-2 rounded-full bg-status-warning" />
              <span className="text-sm font-bold text-text-primary">{totalWarning}</span>
              <span className="text-xs text-text-muted">Warning</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-primary-800/60 border-primary-600/40">
              <div className="w-2 h-2 rounded-full bg-status-error" />
              <span className="text-sm font-bold text-text-primary">{totalInactive}</span>
              <span className="text-xs text-text-muted">Inactive</span>
            </div>
            <div className="px-2 py-1.5 rounded-lg border bg-primary-800/60 border-primary-600/40">
              <span className="text-sm font-bold text-text-primary">{filtered.length}</span>
              <span className="text-xs text-text-muted ml-1.5">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 px-4 py-2 space-y-2.5 border-b border-primary-600/20">

        {/* Search + type + status filters */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: '200px', maxWidth: '320px' }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, ID, serial, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none bg-primary-800 border border-primary-600 focus:border-accent-blue transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex gap-1.5">
            {(['All', 'Active', 'Warning', 'Inactive'] as StatusFilter[]).map(s => {
              const isAll = s === 'All';
              const st = isAll ? null : STATUS_STYLES[s];
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? (st ? st.bg : 'rgba(32, 120, 207,0.1)') : 'rgba(32, 120, 207,0.04)',
                    color:      active ? (st ? st.text : '#e2e8f0') : '#64748b',
                    border:     `1px solid ${active ? (st ? st.border : 'rgba(32, 120, 207,0.2)') : 'rgba(32, 120, 207,0.07)'}`,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Type filter dropdown */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="py-2 px-2 rounded-lg text-sm text-slate-300 outline-none cursor-pointer bg-primary-800 border border-primary-600 focus:border-accent-blue transition-colors"
          >
            <option value="All">All Types</option>
            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Issue chip — only present after arriving via a bar-chart sub-parameter click */}
          {issueFilter && (
            <button
              onClick={() => setIssueFilter('')}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: ISSUE_BADGE_STYLE.bg, color: ISSUE_BADGE_STYLE.text, border: `1px solid ${ISSUE_BADGE_STYLE.border}` }}
              title="Clear issue highlight"
            >
              Issue: {issueFilter} <X size={12} />
            </button>
          )}

          {/* Clear all */}
          {(subsystemFilter !== 'All' || statusFilter !== 'All' || typeFilter !== 'All' || issueFilter || search) && (
            <button
              onClick={() => { setSubsystemFilter('All'); setStatusFilter('All'); setTypeFilter('All'); setIssueFilter(''); setSearch(''); }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              style={{ background: 'rgba(32, 120, 207,0.05)', border: '1px solid rgba(32, 120, 207,0.08)' }}
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Subsystem filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => handleSubsystemClick('All')}
            className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: subsystemFilter === 'All' ? 'rgba(59,130,246,0.2)' : 'rgba(32, 120, 207,0.04)',
              color:      subsystemFilter === 'All' ? '#93c5fd' : '#64748b',
              border:     `1px solid ${subsystemFilter === 'All' ? 'rgba(59,130,246,0.4)' : 'rgba(32, 120, 207,0.07)'}`,
            }}
          >
            All Systems
          </button>
          {HBMS_SUBSYSTEMS.map(s => {
            const active = subsystemFilter === s.acronym;
            const count = ASSETS.filter(a => a.subsystemAcronym === s.acronym).length;
            return (
              <button
                key={s.id}
                onClick={() => handleSubsystemClick(s.acronym)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? `${s.color}22` : 'rgba(32, 120, 207,0.04)',
                  color:      active ? s.color : '#64748b',
                  border:     `1px solid ${active ? `${s.color}55` : 'rgba(32, 120, 207,0.07)'}`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: active ? s.color : '#475569' }} />
                {s.acronym}
                <span className="opacity-60 text-[length:calc(10px*var(--fs))]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse" style={{ minWidth: '760px' }}>
          <thead className="sticky top-0 z-10 bg-primary-800 border-b border-primary-600/40">
            <tr>
              <Th label="Asset ID"    col="id"                 className="pl-4 w-32" />
              <Th label="Name"        col="name"               className="min-w-[200px]" />
              <Th label="Subsystem"   col="subsystemAcronym"   className="w-28" />
              <Th label="Status"      col="status"             className="w-28" />
              <th className="px-2 py-2.5 w-28">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Condition</span>
              </th>
              <Th label="Type"        col="type"               className="w-40" />
              <Th label="Location"    col="location"           className="min-w-[160px]" />
              <Th label="Last Check"  col="lastChecked"        className="w-28" />
              <th className="px-2 py-2.5 w-20 pr-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Serial</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-slate-500 text-sm">
                  No assets match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((asset, idx) => {
                const ss = STATUS_STYLES[asset.status];
                const sub = HBMS_SUBSYSTEMS.find(s => s.id === asset.subsystemId);
                return (
                  <tr
                    key={asset.id}
                    className="border-b cursor-pointer group transition-colors"
                    style={{
                      borderColor: 'rgba(32, 120, 207,0.04)',
                      background: idx % 2 === 0 ? 'rgba(10,58,82,0.25)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(10,58,82,0.25)' : 'transparent')}
                    onClick={() => { const sub = subsystemById(asset.subsystemId); if (sub) openSubsystem(sub.code); }}
                  >
                    {/* ID */}
                    <td className="px-2 py-2 pl-4">
                      <span className="text-sm font-mono font-bold text-slate-300">{asset.id}</span>
                    </td>

                    {/* Name */}
                    <td className="px-2 py-2">
                      <span className="text-sm font-semibold text-slate-100">{asset.name}</span>
                    </td>

                    {/* Subsystem badge */}
                    <td className="px-2 py-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: `${asset.subsystemColor}18`, color: asset.subsystemColor, border: `1px solid ${asset.subsystemColor}33` }}
                      >
                        {sub && React.cloneElement(sub.icon as React.ReactElement, { className: 'w-3 h-3' })}
                        {asset.subsystemAcronym}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-2 py-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ss.dot }} />
                        {asset.status}
                      </span>
                    </td>

                    {/* Condition — breaker position or flagged sub-parameter, when applicable */}
                    <td className="px-2 py-2">
                      {asset.breakerState ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: BREAKER_STYLES[asset.breakerState].bg,
                            color: BREAKER_STYLES[asset.breakerState].text,
                            border: `1px solid ${BREAKER_STYLES[asset.breakerState].border}`,
                          }}
                        >
                          {asset.breakerState}
                        </span>
                      ) : asset.paramIssues?.length ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ background: ISSUE_BADGE_STYLE.bg, color: ISSUE_BADGE_STYLE.text, border: `1px solid ${ISSUE_BADGE_STYLE.border}` }}
                          title={asset.paramIssues.join(', ')}
                        >
                          {asset.paramIssues.join(', ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-2 py-2">
                      <span className="text-sm text-slate-400">{asset.type}</span>
                    </td>

                    {/* Location */}
                    <td className="px-2 py-2">
                      <span className="text-sm text-slate-300">{asset.location}</span>
                    </td>

                    {/* Last Checked */}
                    <td className="px-2 py-2">
                      <span className="text-sm text-slate-500 font-mono">{asset.lastChecked}</span>
                    </td>

                    {/* Serial */}
                    <td className="px-2 py-2 pr-4">
                      <span className="text-xs text-slate-600 font-mono">{asset.serialNumber}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(32, 120, 207,0.05)' }}>
        <span className="text-xs text-slate-600">Showing {filtered.length} of {ASSETS.length} assets</span>
        <span className="text-xs text-slate-600">Click any row to view subsystem details</span>
      </div>
    </div>
  );
};

export default AssetList;
