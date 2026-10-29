/**
 * "Live Zones" on the main dashboard: the Pantherlake live feeds as they
 * arrive, one zone per use case, no interpretation layered on top —
 *   queue length (Zone A) and the zone a bag is currently in.
 * Reads from the same store as the rest of the Pantherlake UI; nothing here
 * feeds back into the queue cards or the alert flow.
 */

import React, { useEffect, useState } from 'react';
import { Luggage, Users } from 'lucide-react';
import { usePantherlakeStore } from '../../services/pantherlakeMqtt';
import { capitalizeFirst, formatUnattended } from '../UI/PantherlakeAlertPopup';

/** Re-renders every second so "2s ago" stays true between messages. */
const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const ago = (from: number, now: number) => `${Math.max(0, Math.round((now - from) / 1000))}s ago`;

/** A feed counts as live while its last message is under 15s old. */
const STALE_MS = 15_000;

const Tile: React.FC<{
  icon: React.ElementType;
  label: string;
  zone: string;
  live: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, label, zone, live, children }) => (
  <div className="rounded-lg border border-primary-600/40 bg-primary-700/30 p-3">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-teal-400" />
        <span className="text-xs font-semibold text-text-primary">{label}</span>
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-accent-teal animate-pulse' : 'bg-text-muted'}`} />
        {zone}
      </span>
    </div>
    <div className="text-xs leading-tight">{children}</div>
  </div>
);

const Waiting = () => <span className="text-text-muted">Waiting for the live feed…</span>;

const QueueTile: React.FC<{ now: number }> = ({ now }) => {
  const reading = usePantherlakeStore((s) => s.queues['camera_01']);
  const live = !!reading && now - reading.receivedAt < STALE_MS;
  return (
    <Tile icon={Users} label="Queue length" zone="Zone A" live={live}>
      {reading ? (
        <>
          <span className="text-xl font-bold text-white">{reading.queueLength}</span>
          <span className="text-text-muted"> in queue · {ago(reading.receivedAt, now)}</span>
        </>
      ) : (
        <Waiting />
      )}
    </Tile>
  );
};

const BagTile: React.FC<{ now: number }> = ({ now }) => {
  const feeds = usePantherlakeStore((s) => s.bagFeeds);

  // One zone: whichever is flagged, else whichever has a bag, else Zone A.
  const cameras = Object.values(feeds).sort((a, b) => a.cameraId.localeCompare(b.cameraId));
  const zone =
    cameras.find((c) => c.bags.some((b) => b.alert)) ??
    cameras.find((c) => c.bagCount > 0) ??
    feeds['camera_01'] ??
    null;
  const live = !!zone && now - zone.receivedAt < STALE_MS;
  const worst = zone?.bags.reduce((w, b) => (b.unattendedSeconds > w.unattendedSeconds ? b : w), zone.bags[0]);

  return (
    <Tile icon={Luggage} label="Baggage" zone={zone?.zoneLabel ?? 'Zone A'} live={live}>
      {zone && worst ? (
        <>
          <span className="text-xl font-bold text-white">
            {zone.bagCount === 1 ? capitalizeFirst(worst.label) : `${zone.bagCount} bags`}
          </span>
          <span className="text-text-muted"> detected · in view {formatUnattended(worst.unattendedSeconds)} · {ago(zone.receivedAt, now)}</span>
        </>
      ) : zone ? (
        <span className="text-text-muted">No bag detected</span>
      ) : (
        <Waiting />
      )}
    </Tile>
  );
};

const LiveZonesCard: React.FC = () => {
  const connected = usePantherlakeStore((s) => s.connected);
  const now = useNow();
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Live Zones</h3>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            connected ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' : 'bg-primary-600/30 border-primary-500/40 text-text-muted'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent-teal animate-pulse' : 'bg-text-muted'}`} />
          Pantherlake {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QueueTile now={now} />
        <BagTile now={now} />
      </div>
    </div>
  );
};

export default LiveZonesCard;
