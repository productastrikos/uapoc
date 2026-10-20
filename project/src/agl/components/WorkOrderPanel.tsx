/**
 * Work orders raised from AGL alarms.
 *
 * This closes the loop that a plain alarm list leaves open: an alarm is
 * escalated, assigned, worked and closed, and the trail stays attached to the
 * originating tag.
 */

import React from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { useAglStore } from '../store';
import { WorkOrderStatus } from '../types';

const STATUS_STYLE: Record<WorkOrderStatus, string> = {
  open: 'bg-status-error/20 border-status-error/50 text-status-error',
  dispatched: 'bg-status-warning/20 border-status-warning/50 text-status-warning',
  in_progress: 'bg-accent-blue/20 border-accent-blue/50 text-blue-300',
  closed: 'bg-status-success/20 border-status-success/50 text-status-success',
};

const NEXT_LABEL: Record<WorkOrderStatus, string | null> = {
  open: 'Dispatch',
  dispatched: 'Start',
  in_progress: 'Close',
  closed: null,
};

const WorkOrderPanel: React.FC = () => {
  const workOrders = useAglStore((s) => s.workOrders);
  const advance = useAglStore((s) => s.advanceWorkOrder);
  const select = useAglStore((s) => s.select);

  return (
    <section className="shrink-0 glass-panel rounded-lg overflow-hidden">
      <header className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-primary uppercase tracking-wide">
          <ClipboardList className="w-3.5 h-3.5 text-accent-teal" />
          Work Orders
        </h3>
        <span className="text-[length:calc(11px*var(--fs))] text-text-muted">
          {workOrders.filter((w) => w.status !== 'closed').length} open
        </span>
      </header>

      {workOrders.length === 0 ? (
        <p className="px-3 py-4 text-xs text-text-muted text-center">
          No work orders. Escalate an alarm to raise one.
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto no-scrollbar divide-y divide-primary-600/25">
          {workOrders.map((w) => (
            <div key={w.id} className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    onClick={() => select(w.tag)}
                    className="text-[length:calc(11px*var(--fs))] font-mono text-accent-teal hover:underline"
                  >
                    {w.id}
                  </button>
                  <div className="text-[length:calc(11px*var(--fs))] text-text-secondary truncate">{w.title}</div>
                  <div className="text-[length:calc(10px*var(--fs))] text-text-muted">
                    {new Date(w.raisedAt).toLocaleTimeString()}
                    {w.assignedTo ? ` · ${w.assignedTo}` : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[length:calc(10px*var(--fs))] font-semibold capitalize ${STATUS_STYLE[w.status]}`}
                  >
                    {w.status.replace('_', ' ')}
                  </span>
                  {NEXT_LABEL[w.status] && (
                    <button
                      onClick={() => advance(w.id)}
                      className="chip flex items-center gap-0.5 px-1.5 py-0.5 text-[length:calc(10px*var(--fs))]"
                    >
                      {NEXT_LABEL[w.status]}
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WorkOrderPanel;
