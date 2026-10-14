/**
 * Apron Management System console.
 *
 * Six stands across the top with their Safedock displays, the simulator
 * underneath, apron status on the right and the shared alarm strip below.
 *
 * The docking clock runs in this screen and drives the store, so an approach
 * started here keeps progressing and the whole console — graphics, VDGS
 * numbers, equipment status and alarms — moves together.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ParkingSquare } from 'lucide-react';
import StandBay from './components/StandBay';
import ApronRail from './components/ApronRail';
import ApronSimulator from './components/ApronSimulator';
import AlarmStrip from '../agl/components/AlarmStrip';
import { useApronStore } from './store';

const ApronScreen: React.FC = () => {
  const stands = useApronStore((s) => s.stands);
  const selectedStandId = useApronStore((s) => s.selectedStandId);
  const select = useApronStore((s) => s.select);
  const alarms = useApronStore((s) => s.alarms);
  const now = useApronStore((s) => s.now);
  const ackAlarm = useApronStore((s) => s.ackAlarm);
  const ackAll = useApronStore((s) => s.ackAll);
  const tick = useApronStore((s) => s.tick);

  const [alarmsCollapsed, setAlarmsCollapsed] = useState(false);
  const frame = useRef<number>();
  const last = useRef<number>(performance.now());

  // Docking clock. Runs continuously rather than only while a docking is
  // active, so a docking started from any panel keeps advancing.
  useEffect(() => {
    const step = (t: number) => {
      const dt = Math.min(0.1, (t - last.current) / 1000);
      last.current = t;
      tick(dt);
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [tick]);

  const docking = stands.filter(
    (s) => s.docking !== 'idle' && s.docking !== 'docked'
  ).length;
  const occupied = stands.filter((s) => s.occupied).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <ParkingSquare className="w-5 h-5 text-accent-gold" />
          <div>
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              Apron Management System
            </h2>
            <p className="text-[11px] text-text-muted">
              {stands.length} stands · ADB SAFEGATE Safedock VDGS · PBB / GPU / PCA / Fuel Pit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Occupied</div>
            <div className="text-xl font-bold font-mono text-accent-teal">
              {occupied}/{stands.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Docking</div>
            <div
              className={`text-xl font-bold font-mono ${
                docking > 0 ? 'text-amber-300' : 'text-text-muted'
              }`}
            >
              {docking}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 gap-2 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-6 gap-2 shrink-0">
            {stands.map((s) => (
              <StandBay
                key={s.id}
                stand={s}
                selected={selectedStandId === s.id}
                onSelect={() => select(selectedStandId === s.id ? null : s.id)}
              />
            ))}
          </div>
          <div className="shrink-0">
            <ApronSimulator />
          </div>
        </div>

        <div className="w-[320px] shrink-0 overflow-y-auto no-scrollbar">
          <ApronRail />
        </div>
      </div>

      {/* Alarm strip, fed from the apron store */}
      <div className="shrink-0 mt-3 -mx-6 -mb-6">
        <AlarmStrip
          collapsed={alarmsCollapsed}
          onToggle={() => setAlarmsCollapsed((c) => !c)}
          alarms={alarms}
          now={now}
          node="TAMS_APRON"
          onAck={ackAlarm}
          onAckAll={ackAll}
          onEscalate={() => undefined}
          onSelect={(tag) => {
            const stand = stands.find((s) => tag.startsWith(s.id.replace('-', '')));
            if (stand) select(stand.id);
          }}
        />
      </div>
    </div>
  );
};

export default ApronScreen;
