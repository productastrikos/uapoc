/**
 * Persistent alarm banner.
 *
 * Column set and state vocabulary follow the SCADA convention the client is
 * already reading (UNACK / ACK / UNACK_RTN, node, group, tag, comment, limit,
 * current value, duration, operator) so the screen is recognisable to an
 * operations team.
 *
 * The addition over the reference is the last column: an alarm escalates into a
 * work order in place, which is the gap called out in review — an alarm that
 * cannot be escalated is a notification, not a workflow.
 */

import React from 'react';
import { Bell, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import { useAglStore } from '../store';
import { AglAlarm } from '../types';

const stateColour: Record<string, string> = {
  UNACK: 'text-red-400',
  UNACK_RTN: 'text-amber-400',
  ACK: 'text-emerald-400',
  SHELVED: 'text-slate-500',
};

/** Duration since the alarm was raised, in the SCADA ddd hh:mm:ss.mmm form. */
function duration(alarm: AglAlarm, now: number): string {
  const ms = Math.max(0, now - alarm.raisedAt);
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const mmm = String(ms % 1000).padStart(3, '0');
  const ddd = String(Math.floor(s / 86400)).padStart(3, '0');
  return `${ddd} ${hh}:${mm}:${ss}.${mmm}`;
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  /**
   * Alarm source. Defaults to the AGL engine so the lighting console needs no
   * wiring; the apron console passes its own so both get the same strip without
   * the two stores having to know about each other.
   */
  alarms?: AglAlarm[];
  now?: number;
  node?: string;
  onAck?: (id: string) => void;
  onAckAll?: () => void;
  onEscalate?: (id: string) => void;
  onSelect?: (tag: string) => void;
}

const AlarmStrip: React.FC<Props> = ({
  collapsed,
  onToggle,
  alarms: alarmsProp,
  now: nowProp,
  node = 'TAMS_AGL',
  onAck,
  onAckAll,
  onEscalate,
  onSelect,
}) => {
  const storeAlarms = useAglStore((s) => s.alarms);
  const storeNow = useAglStore((s) => s.now);
  const storeAck = useAglStore((s) => s.ackAlarm);
  const storeAckAll = useAglStore((s) => s.ackAll);
  const storeEscalate = useAglStore((s) => s.escalateToWorkOrder);
  const storeSelect = useAglStore((s) => s.select);

  const alarms = alarmsProp ?? storeAlarms;
  const now = nowProp ?? storeNow;
  const ackAlarm = onAck ?? storeAck;
  const ackAll = onAckAll ?? storeAckAll;
  const escalate = onEscalate ?? storeEscalate;
  const select = onSelect ?? storeSelect;

  const visible = alarms.filter((a) => a.state !== 'SHELVED');
  const unack = visible.filter((a) => a.state === 'UNACK').length;

  return (
    <div className="border-t border-primary-500/50 bg-primary-900/95 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary-600/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <Bell className={`w-3.5 h-3.5 ${unack > 0 ? 'text-red-400' : 'text-text-muted'}`} />
            Alarms &amp; Events
          </span>
          <span className="text-[length:calc(11px*var(--fs))] text-text-muted">
            Displaying {visible.length} of {alarms.length} alarms · Query: Default · Filter: Active
          </span>
          {unack > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-[length:calc(10px*var(--fs))] font-semibold text-red-300">
              {unack} UNACK
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={ackAll}
            disabled={unack === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-600/60 border border-primary-500/50 text-[length:calc(11px*var(--fs))] text-text-secondary hover:text-text-primary disabled:opacity-40"
          >
            <CheckCheck className="w-3 h-3" />
            Ack All
          </button>
          <button
            onClick={onToggle}
            className="text-text-muted hover:text-text-primary p-0.5"
            aria-label={collapsed ? 'Expand alarms' : 'Collapse alarms'}
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-[168px] overflow-y-auto no-scrollbar">
          {visible.length === 0 ? (
            <p className="px-3 py-4 text-xs text-text-muted text-center">
              No active alarms. Inject a fault from the simulation dock to raise one.
            </p>
          ) : (
            <table className="w-full text-[length:calc(11px*var(--fs))]">
              <thead className="sticky top-0 bg-primary-700/95">
                <tr className="text-text-muted">
                  {['Ack', 'State', 'Node', 'Group', 'Name', 'Alarm Comment', 'Type', 'Time (UTC)', 'Limit', 'Current', 'Duration', 'Operator', ''].map(
                    (h) => (
                      <th key={h} className="text-left font-medium px-2 py-1 whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => select(a.tag)}
                    className="border-b border-primary-700/40 hover:bg-primary-700/40 cursor-pointer"
                  >
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={a.state === 'ACK'}
                        onChange={(e) => {
                          e.stopPropagation();
                          ackAlarm(a.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-teal-400"
                      />
                    </td>
                    <td className={`px-2 py-1 font-semibold ${stateColour[a.state]}`}>{a.state}</td>
                    <td className="px-2 py-1 text-text-muted">{node}</td>
                    <td className="px-2 py-1 text-text-secondary">{a.group}</td>
                    <td className="px-2 py-1 font-mono text-text-primary whitespace-nowrap">
                      {a.tag}
                    </td>
                    <td className="px-2 py-1 text-red-300 whitespace-nowrap">{a.description}</td>
                    <td className="px-2 py-1 text-text-muted">DSC</td>
                    <td className="px-2 py-1 text-text-secondary whitespace-nowrap">
                      {new Date(a.raisedAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-2 py-1 text-text-secondary">{a.limit}</td>
                    <td className="px-2 py-1 text-text-secondary">{a.currentValue}</td>
                    <td className="px-2 py-1 font-mono text-text-muted whitespace-nowrap">
                      {duration(a, now)}
                    </td>
                    <td className="px-2 py-1 text-text-muted">{a.operator ?? '—'}</td>
                    <td className="px-2 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          escalate(a.id);
                        }}
                        disabled={!!a.workOrderId}
                        className="px-2 py-0.5 rounded bg-accent-teal/20 border border-accent-teal/50 text-[length:calc(10px*var(--fs))] text-accent-teal hover:bg-accent-teal/30 disabled:opacity-50 whitespace-nowrap"
                      >
                        {a.workOrderId ?? 'Escalate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AlarmStrip;
