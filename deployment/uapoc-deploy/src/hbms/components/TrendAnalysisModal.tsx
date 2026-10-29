// ─────────────────────────────────────────────────────────────────────────────
// src/components/TrendAnalysisModal.tsx
// Click-through trend analysis for a dashboard KPI tile. Shows a historical
// line/area chart with a time-range switcher plus a "brush" selector below
// it — drag the handles to zoom into a window, then the main chart expands
// and becomes horizontally scrollable within that selection.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, ZoomOut, Play, Pause, CalendarRange } from 'lucide-react';

export interface TrendKpiSpec {
  id: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  subtitle?: string;
}

interface TrendAnalysisModalProps {
  kpi: TrendKpiSpec;
  onClose: () => void;
}

type RangeKey = '1H' | '24H' | '7D' | '30D' | 'Custom';
type PresetKey = Exclude<RangeKey, 'Custom'>;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

// Presets are just spans ending "now" — a custom from/to window is the same
// shape with different endpoints, so both go through one code path.
const RANGE_CONFIG: Record<PresetKey, { points: number; spanMs: number }> = {
  '1H':  { points: 60, spanMs: HOUR_MS },
  '24H': { points: 48, spanMs: 24 * HOUR_MS },
  '7D':  { points: 56, spanMs: 7 * DAY_MS },
  '30D': { points: 60, spanMs: 30 * DAY_MS },
};
const PRESET_KEYS: PresetKey[] = ['1H', '24H', '7D', '30D'];

/** Axis ticks read as clock time for windows of about a day or less, and as
 *  calendar dates beyond that. */
const fmtTick = (t: number, spanMs: number) =>
  spanMs <= 36 * HOUR_MS
    ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date(t).toLocaleDateString([], { day: '2-digit', month: 'short' });

const fmtStamp = (t: number) =>
  new Date(t).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Local calendar date for <input type="date"> — toISOString() would shift the
 *  day for anyone east or west of UTC. */
const toInputDate = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface TimeWindow { key: string; points: number; startMs: number; endMs: number; endsNow: boolean }

// Deterministic seeded PRNG (mulberry32) so the "history" doesn't jump
// around on every re-render/hover.
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

interface Point { x: number; value: number; label: string; t: number }

function generateSeries(kpi: TrendKpiSpec, win: TimeWindow): Point[] {
  const rand = seededRandom(hashString(kpi.id + win.key));
  const N = Math.max(8, win.points);
  // Volatility scaled relative to the KPI's magnitude so % KPIs and count
  // KPIs both look sensible.
  const magnitude = Math.max(Math.abs(kpi.value), 1);
  const volatility = magnitude * 0.05;
  const spanMs = Math.max(1, win.endMs - win.startMs);
  const points: Point[] = [];
  let v = kpi.value - (rand() - 0.5) * volatility * 3;
  for (let i = 0; i < N; i++) {
    const drift = (rand() - 0.5) * volatility;
    const pull = (kpi.value - v) * 0.06; // gentle mean-reversion toward current value
    v = v + drift + pull;
    if (v < 0) v = Math.abs(v) * 0.4;
    const t = win.startMs + (i / (N - 1)) * spanMs;
    points.push({ x: i / (N - 1), value: v, label: fmtTick(t, spanMs), t });
  }
  // Only a window that runs up to now ends on the KPI's live value; a
  // historical window has no reason to.
  if (win.endsNow) points[N - 1] = { ...points[N - 1], value: kpi.value, label: 'Now' };
  return points;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4];
/** Points advanced per second at 1x. Deliberately unhurried — the playback is
 *  there to be watched point by point, so a 48-point day takes ~16s at 1x
 *  (~64s at 0.25x, ~4s at 4x for a quick scrub). */
const PLAY_POINTS_PER_SEC = 3;

const TrendAnalysisModal: React.FC<TrendAnalysisModalProps> = ({ kpi, onClose }) => {
  const [range, setRange] = useState<RangeKey>('24H');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 1 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // "Now" is pinned for the modal's lifetime so the window (and with it the
  // generated history) doesn't drift under the user mid-session.
  const nowRef = useRef(Date.now());
  const [fromDate, setFromDate] = useState(() => toInputDate(nowRef.current - 6 * DAY_MS));
  const [toDate, setToDate] = useState(() => toInputDate(nowRef.current));

  // Timeline playback: a playhead sweeps the window and reveals the series as
  // it goes, at whatever speed the user picks.
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playIdx, setPlayIdx] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ mode: 'left' | 'right' | 'move' | null; startX: number; startSel: { start: number; end: number } }>({ mode: null, startX: 0, startSel: { start: 0, end: 1 } });

  const win = useMemo<TimeWindow>(() => {
    const now = nowRef.current;
    if (range !== 'Custom') {
      const cfg = RANGE_CONFIG[range];
      return { key: range, points: cfg.points, startMs: now - cfg.spanMs, endMs: now, endsNow: true };
    }
    // Custom window, defended against every way two date inputs can be wrong:
    // unparseable, reversed, in the future, or too short to plot.
    let startMs = new Date(`${fromDate}T00:00:00`).getTime();
    let endMs = new Date(`${toDate}T23:59:59`).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      startMs = now - 7 * DAY_MS;
      endMs = now;
    }
    if (endMs < startMs) [startMs, endMs] = [endMs, startMs];
    endMs = Math.min(endMs, now);
    if (endMs - startMs < HOUR_MS) endMs = startMs + DAY_MS;
    return { key: `custom-${startMs}-${endMs}`, points: 60, startMs, endMs, endsNow: now - endMs < 60_000 };
  }, [range, fromDate, toDate]);

  const series = useMemo(() => generateSeries(kpi, win), [kpi, win]);
  const N = series.length;

  // A new window resets both the zoom and the playhead
  useEffect(() => { setSelection({ start: 0, end: 1 }); setPlayIdx(0); setPlaying(false); }, [win]);

  // Playback clock — advances the playhead by wall-clock time, so a chosen
  // speed means the same thing regardless of frame rate.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setPlayIdx(prev => Math.min(N - 1, prev + dt * PLAY_POINTS_PER_SEC * speed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, N]);

  // Stop at the end — kept out of the setState updater above so that stays pure
  useEffect(() => { if (playing && playIdx >= N - 1) setPlaying(false); }, [playing, playIdx, N]);

  const togglePlay = () => {
    if (!playing && playIdx >= N - 1) setPlayIdx(0); // parked at the end -> replay
    setPlaying(p => !p);
  };
  const setCustomDate = (which: 'from' | 'to') => (value: string) => {
    if (!value) return;
    if (which === 'from') setFromDate(value); else setToDate(value);
    setRange('Custom');
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const first = values[0];
  const last = values[values.length - 1];
  const changePct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  const pad = (max - min) * 0.15 || 1;
  const yMin = min - pad;
  const yMax = max + pad;

  const zoomFactor = Math.min(8, Math.max(1, 1 / Math.max(selection.end - selection.start, 0.02)));
  const CHART_H = 220;
  const [containerW, setContainerW] = useState(600);

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = containerW * zoomFactor;

  const xFor = (idx: number) => (idx / (N - 1)) * innerW;
  const yFor = (val: number) => CHART_H - ((val - yMin) / (yMax - yMin)) * CHART_H;

  const linePath = useMemo(
    () => series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p.value).toFixed(1)}`).join(' '),
    [series, innerW, yMin, yMax], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const areaPath = `${linePath} L ${innerW} ${CHART_H} L 0 ${CHART_H} Z`;

  // Scroll the main chart so the selected window is in view whenever the
  // selection (or zoom) changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = selection.start * innerW;
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [selection, innerW]);

  // ── Brush drag handling ──────────────────────────────────────────────────
  const clampSel = (s: number, e: number) => {
    const minGap = 0.05;
    let ns = Math.max(0, Math.min(s, 1 - minGap));
    let ne = Math.min(1, Math.max(e, ns + minGap));
    if (ne - ns < minGap) { ne = Math.min(1, ns + minGap); ns = Math.max(0, ne - minGap); }
    return { start: ns, end: ne };
  };

  const startDrag = (mode: 'left' | 'right' | 'move') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragState.current = { mode, startX: e.clientX, startSel: selection };
    const onMove = (ev: MouseEvent) => {
      const rect = brushRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dxFrac = (ev.clientX - dragState.current.startX) / rect.width;
      const { start, end } = dragState.current.startSel;
      if (dragState.current.mode === 'left') setSelection(clampSel(start + dxFrac, end));
      else if (dragState.current.mode === 'right') setSelection(clampSel(start, end + dxFrac));
      else if (dragState.current.mode === 'move') {
        const width = end - start;
        let ns = start + dxFrac;
        ns = Math.max(0, Math.min(ns, 1 - width));
        setSelection({ start: ns, end: ns + width });
      }
    };
    const onUp = () => {
      dragState.current.mode = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleBrushTrackClick = (e: React.MouseEvent) => {
    if (e.target !== brushRef.current) return;
    const rect = brushRef.current.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const width = selection.end - selection.start;
    const ns = Math.max(0, Math.min(frac - width / 2, 1 - width));
    setSelection({ start: ns, end: ns + width });
  };

  const fmtValue = (v: number) => `${v.toFixed(kpi.unit === '%' ? 1 : v >= 100 ? 0 : 1)}${kpi.unit ? ` ${kpi.unit}` : ''}`;

  const TrendIcon = changePct > 0.5 ? TrendingUp : changePct < -0.5 ? TrendingDown : Minus;
  const trendColor = changePct > 0.5 ? '#34d399' : changePct < -0.5 ? '#f87171' : '#8A9BA8';

  // Mini sparkline path for the brush track (fixed width, full range)
  const BRUSH_W = 1000; // viewBox units — scales with container via preserveAspectRatio
  const BRUSH_H = 40;
  const brushYFor = (val: number) => BRUSH_H - ((val - yMin) / (yMax - yMin)) * BRUSH_H;
  const brushPath = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${((i / (N - 1)) * BRUSH_W).toFixed(1)} ${brushYFor(p.value).toFixed(1)}`).join(' ');

  // Hover wins over the playhead; otherwise the playhead is the active point.
  const playIdxRounded = Math.min(N - 1, Math.round(playIdx));
  const activeIdx = hoverIdx ?? (playIdx > 0 ? playIdxRounded : null);
  const hoverPoint = activeIdx !== null ? series[activeIdx] : null;
  // Mid-playback the line ahead of the playhead is dimmed, so playing reads as
  // the history arriving over time rather than just a marker sliding along.
  const revealing = playIdx > 0 && playIdx < N - 1;
  const revealPath = revealing
    ? series.slice(0, playIdxRounded + 1).map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(pt.value).toFixed(1)}`).join(' ')
    : null;

  const dateInputStyle: React.CSSProperties = {
    background: 'var(--app-surface-soft)', border: '1px solid rgba(32, 120, 207,0.10)', borderRadius: 8,
    color: '#B8C5D1', fontSize: 10, fontWeight: 600, padding: '4px 6px', colorScheme: 'dark',
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-2xl border overflow-hidden flex flex-col animate-slide-up"
        style={{ maxWidth: '920px', maxHeight: '88vh', background: 'var(--app-bg-elevated)', borderColor: 'rgba(32, 120, 207,0.10)', boxShadow: '0 25px 60px rgba(0,0,0,0.55)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(32, 120, 207,0.08)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${kpi.color}22`, color: kpi.color }}>
              <TrendIcon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-text-primary truncate">{kpi.label} — Trend Analysis</h2>
              <p className="text-[length:calc(11px*var(--fs))] text-text-muted truncate">{kpi.subtitle ?? 'Historical performance over time'}</p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin' }}>
          {/* Stat row */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Current', v: fmtValue(last), color: kpi.color },
              { label: 'Average', v: fmtValue(avg), color: '#8A9BA8' },
              { label: 'Min', v: fmtValue(min), color: '#22C7C6' },
              { label: 'Max', v: fmtValue(max), color: '#fbbf24' },
              { label: 'Change', v: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`, color: trendColor },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: 'var(--app-surface-soft)', border: '1px solid rgba(32, 120, 207,0.05)' }}>
                <p className="text-[length:calc(9px*var(--fs))] font-semibold text-text-muted uppercase tracking-wide mb-0.5">{s.label}</p>
                <p className="text-xs font-bold" style={{ color: s.color }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Range tabs + zoom reset */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--app-surface-soft)' }}>
              {PRESET_KEYS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="px-2.5 py-1 rounded-md text-[length:calc(10px*var(--fs))] font-bold transition-all"
                  style={{
                    background: range === r ? kpi.color : 'transparent',
                    color: range === r ? '#071028' : '#8A9BA8',
                  }}
                >
                  {r}
                </button>
              ))}
              <span className="w-px h-4 mx-0.5 flex-shrink-0" style={{ background: 'rgba(32, 120, 207,0.12)' }} />
              <button
                onClick={() => setRange('Custom')}
                className="px-2.5 py-1 rounded-md text-[length:calc(10px*var(--fs))] font-bold transition-all"
                style={{
                  background: range === 'Custom' ? kpi.color : 'transparent',
                  color: range === 'Custom' ? '#071028' : '#8A9BA8',
                }}
                title="Use the from/to dates below"
              >
                Custom
              </button>
            </div>
            {(selection.start > 0.001 || selection.end < 0.999) && (
              <button
                onClick={() => setSelection({ start: 0, end: 1 })}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[length:calc(10px*var(--fs))] font-semibold text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: 'var(--app-surface-soft)' }}
              >
                <ZoomOut className="w-3 h-3" /> Reset zoom
              </button>
            )}
          </div>

          {/* Playback + custom date window */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[length:calc(10px*var(--fs))] font-bold transition-all min-w-[4.5rem]"
              style={{
                background: playing ? `${kpi.color}22` : 'var(--app-surface-soft)',
                border: `1px solid ${playing ? `${kpi.color}66` : 'rgba(32, 120, 207,0.08)'}`,
                color: playing ? kpi.color : '#B8C5D1',
              }}
              title={playing ? 'Pause the timeline' : 'Play the timeline'}
            >
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {playing ? 'Pause' : playIdx >= N - 1 ? 'Replay' : 'Play'}
            </button>

            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'var(--app-surface-soft)' }} title="Playback speed">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeed(sp)}
                  className="px-1.5 py-1 rounded-md text-[length:calc(9px*var(--fs))] font-bold transition-all"
                  style={{
                    background: speed === sp ? `${kpi.color}28` : 'transparent',
                    color: speed === sp ? kpi.color : '#8A9BA8',
                  }}
                >
                  {sp}x
                </button>
              ))}
            </div>

            <span className="text-[length:calc(9px*var(--fs))] font-semibold tabular-nums" style={{ color: playIdx > 0 ? kpi.color : '#7C8FA0' }}>
              {fmtStamp(series[playIdxRounded].t)}
              <span style={{ color: '#7C8FA0' }}> · {Math.round((playIdx / Math.max(1, N - 1)) * 100)}%</span>
            </span>

            <div className="flex items-center gap-1.5 ml-auto">
              <CalendarRange className="w-3 h-3 flex-shrink-0" style={{ color: range === 'Custom' ? kpi.color : '#8A9BA8' }} />
              <input
                type="date"
                value={fromDate}
                max={toInputDate(nowRef.current)}
                onChange={(e) => setCustomDate('from')(e.target.value)}
                style={dateInputStyle}
                aria-label="From date"
                title="From date"
              />
              <span className="text-[length:calc(10px*var(--fs))] text-text-muted">to</span>
              <input
                type="date"
                value={toDate}
                max={toInputDate(nowRef.current)}
                onChange={(e) => setCustomDate('to')(e.target.value)}
                style={dateInputStyle}
                aria-label="To date"
                title="To date"
              />
            </div>
          </div>

          {/* Main chart — scrolls horizontally when zoomed in via the brush below */}
          <div
            ref={chartWrapRef}
            className="relative rounded-xl overflow-hidden"
            style={{ background: 'var(--app-surface-soft)', border: '1px solid rgba(32, 120, 207,0.06)' }}
          >
            <div ref={scrollRef} className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              <svg
                width={innerW}
                height={CHART_H + 28}
                viewBox={`0 0 ${innerW} ${CHART_H + 28}`}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                  const xInSvg = e.clientX - rect.left;
                  const idx = Math.round((xInSvg / innerW) * (N - 1));
                  setHoverIdx(Math.max(0, Math.min(N - 1, idx)));
                }}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                  <line key={f} x1={0} x2={innerW} y1={CHART_H * f} y2={CHART_H * f} stroke="rgba(32, 120, 207,0.06)" strokeWidth={1} />
                ))}
                <path d={areaPath} fill="url(#trendFill)" opacity={revealing ? 0.3 : 1} />
                <path d={linePath} fill="none" stroke={kpi.color} strokeWidth={2} strokeOpacity={revealing ? 0.22 : 1} strokeLinejoin="round" strokeLinecap="round" />
                {/* played-so-far overlay + playhead */}
                {revealPath && (
                  <>
                    <path d={revealPath} fill="none" stroke={kpi.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                    <line x1={xFor(playIdxRounded)} x2={xFor(playIdxRounded)} y1={0} y2={CHART_H} stroke={kpi.color} strokeWidth={1.5} strokeOpacity={0.75} />
                  </>
                )}
                {/* hover / playhead crosshair */}
                {hoverPoint && activeIdx !== null && (
                  <>
                    <line x1={xFor(activeIdx)} x2={xFor(activeIdx)} y1={0} y2={CHART_H} stroke={kpi.color} strokeOpacity={0.4} strokeDasharray="3 3" />
                    <circle cx={xFor(activeIdx)} cy={yFor(hoverPoint.value)} r={4} fill={kpi.color} stroke="#071028" strokeWidth={1.5} />
                  </>
                )}
                {/* x-axis labels (sparse) — anchor the edge labels inward so they don't clip off the chart bounds */}
                {series.filter((_, i) => i % Math.ceil(N / Math.max(4, Math.round(8 / zoomFactor))) === 0).map((p) => {
                  const i = series.indexOf(p);
                  const anchor = i < N * 0.04 ? 'start' : i > N * 0.96 ? 'end' : 'middle';
                  return (
                    <text key={i} x={xFor(i)} y={CHART_H + 18} fontSize={9} fill="#8A9BA8" textAnchor={anchor}>{p.label}</text>
                  );
                })}
              </svg>
            </div>

            {/* Y-axis labels — fixed, outside the scroll area */}
            <div className="absolute left-0 top-0 bottom-7 flex flex-col justify-between py-0.5 pointer-events-none px-1.5">
              <span className="text-[length:calc(9px*var(--fs))] font-semibold px-1 rounded" style={{ color: '#8A9BA8', background: 'var(--app-surface-soft)' }}>{fmtValue(yMax)}</span>
              <span className="text-[length:calc(9px*var(--fs))] font-semibold px-1 rounded" style={{ color: '#8A9BA8', background: 'var(--app-surface-soft)' }}>{fmtValue((yMax + yMin) / 2)}</span>
              <span className="text-[length:calc(9px*var(--fs))] font-semibold px-1 rounded" style={{ color: '#8A9BA8', background: 'var(--app-surface-soft)' }}>{fmtValue(yMin)}</span>
            </div>

            {/* Tooltip */}
            {hoverPoint && (
              <div
                className="absolute top-2 right-2 rounded-lg px-2.5 py-1.5 pointer-events-none"
                style={{ background: 'rgba(7,16,40,0.94)', border: `1px solid ${kpi.color}55`, backdropFilter: 'blur(8px)' }}
              >
                <p className="text-[length:calc(9px*var(--fs))] text-text-muted">{hoverPoint.label === 'Now' ? 'Now' : fmtStamp(hoverPoint.t)}</p>
                <p className="text-xs font-bold" style={{ color: kpi.color }}>{fmtValue(hoverPoint.value)}</p>
              </div>
            )}

            {zoomFactor > 1.05 && (
              <div className="absolute bottom-1 right-2 text-[length:calc(9px*var(--fs))] font-semibold text-text-muted pointer-events-none">
                {zoomFactor.toFixed(1)}× zoom · scroll to explore →
              </div>
            )}
          </div>

          {/* Brush / range selector — drag the side handles to resize the
              selected window, drag the middle to pan it, or just click
              anywhere on the track to recenter. */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[length:calc(9px*var(--fs))] font-semibold text-text-muted uppercase tracking-wide">Drag handles to resize the selected range</p>
              <p className="text-[length:calc(9px*var(--fs))] font-semibold text-text-muted tabular-nums">{Math.round((selection.end - selection.start) * 100)}% of range</p>
            </div>
            <div
              ref={brushRef}
              onClick={handleBrushTrackClick}
              className="relative rounded-lg cursor-pointer select-none"
              style={{ height: 56, background: 'var(--app-surface-soft)', border: '1px solid rgba(32, 120, 207,0.06)', touchAction: 'none' }}
            >
              <svg width="100%" height={56} viewBox={`0 0 ${BRUSH_W} ${BRUSH_H}`} preserveAspectRatio="none" className="absolute inset-0 pointer-events-none" style={{ padding: 2 }}>
                <path d={brushPath} fill="none" stroke={kpi.color} strokeOpacity={0.55} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </svg>
              {/* dimmed regions outside selection */}
              <div className="absolute top-0 bottom-0 left-0 rounded-l-lg pointer-events-none" style={{ width: `${selection.start * 100}%`, background: 'rgba(0,0,0,0.55)' }} />
              <div className="absolute top-0 bottom-0 right-0 rounded-r-lg pointer-events-none" style={{ width: `${(1 - selection.end) * 100}%`, background: 'rgba(0,0,0,0.55)' }} />
              {/* selection window */}
              <div
                onMouseDown={startDrag('move')}
                className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${selection.start * 100}%`,
                  width: `${(selection.end - selection.start) * 100}%`,
                  border: `1.5px solid ${kpi.color}`,
                  background: `${kpi.color}14`,
                }}
              >
                {/* Resize handles — generous hit zone (w-5 = 20px) well beyond
                    the visible grip so they're easy to grab precisely. */}
                <div
                  onMouseDown={(e) => { e.stopPropagation(); startDrag('left')(e); }}
                  className="absolute left-0 top-0 bottom-0 w-5 -ml-2.5 cursor-ew-resize flex items-center justify-center group/handle z-10"
                >
                  <div
                    className="w-2.5 h-8 rounded-full flex items-center justify-center gap-[2px] transition-transform group-hover/handle:scale-110"
                    style={{ background: kpi.color, boxShadow: `0 0 8px ${kpi.color}88` }}
                  >
                    <span className="w-px h-3.5 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }} />
                    <span className="w-px h-3.5 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }} />
                  </div>
                </div>
                <div
                  onMouseDown={(e) => { e.stopPropagation(); startDrag('right')(e); }}
                  className="absolute right-0 top-0 bottom-0 w-5 -mr-2.5 cursor-ew-resize flex items-center justify-center group/handle z-10"
                >
                  <div
                    className="w-2.5 h-8 rounded-full flex items-center justify-center gap-[2px] transition-transform group-hover/handle:scale-110"
                    style={{ background: kpi.color, boxShadow: `0 0 8px ${kpi.color}88` }}
                  >
                    <span className="w-px h-3.5 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }} />
                    <span className="w-px h-3.5 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisModal;
