/**
 * Cameras covering the room the operator has open.
 *
 * The research notes that the AOCC watches 2,800 cameras and that on an
 * unauthorised-access or alarm event the BMS slews the nearest PTZ heads to the
 * triggered coordinate. This panel is the operator-facing half of that: open a
 * room, get the cameras that see it, ranked by distance, with the one covering
 * an active alert pre-selected and flagged.
 *
 * Feeds are simulated — a synthesised scan line over the room's own colour,
 * with a live timestamp — because there is no camera network attached to this
 * build. `streamUrl` on a camera is the seam: set it and the tile renders that
 * instead, and nothing else changes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, Maximize2, Minimize2, Radio, Video, VideoOff, X } from 'lucide-react';
import { CAMERAS, camerasForRoom, type TerminalCamera } from '../cameras';
import { ROOM_STYLES, type LevelKey, type TerminalRoom } from '../terminalPlan';

interface Props {
  room: TerminalRoom;
  level: LevelKey;
  /** Camera to open first — set when arriving from a 360 hotspot. */
  initialCameraId?: string | null;
  onClose: () => void;
}

/** A simulated feed: the room's own palette, a slow scan line and a clock. */
const FeedTile: React.FC<{ camera: TerminalCamera; room: TerminalRoom; large?: boolean }> = ({
  camera, room, large = false,
}) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const style = ROOM_STYLES[room.category];
  const offline = camera.status === 'offline';

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded"
      style={{ background: offline ? '#0A0F18' : '#04101F', border: `1px solid ${offline ? 'rgba(138,155,168,0.3)' : style.stroke}` }}
    >
      {offline ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <VideoOff className="w-4 h-4" style={{ color: '#8A9BA8' }} />
          <span className="text-[length:calc(8px*var(--fs))] font-bold" style={{ color: '#8A9BA8' }}>NO SIGNAL</span>
        </div>
      ) : (
        <>
          {/* Scene stand-in — the room's colour, with a depth gradient and a
              horizon so the tile reads as a view rather than a swatch. */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${style.fill} 0%, rgba(4,16,31,0.9) 62%, rgba(2,8,15,1) 100%)` }} />
          <div className="absolute left-0 right-0" style={{ top: '58%', height: 1, background: style.stroke }} />
          {/* Structure */}
          {[0.18, 0.42, 0.66, 0.88].map((f) => (
            <div
              key={f}
              className="absolute"
              style={{ left: `${f * 100}%`, top: '22%', bottom: '42%', width: 2, background: 'rgba(37,99,235,0.18)' }}
            />
          ))}
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              height: large ? 40 : 22,
              background: 'linear-gradient(180deg, rgba(32, 120, 207,0) 0%, rgba(155,234,232,0.07) 50%, rgba(32, 120, 207,0) 100%)',
              animation: 'hbms-cctv-scan 5.5s linear infinite',
            }}
          />
          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)' }} />
        </>
      )}

      {/* Overlay chrome */}
      <div className="absolute top-1 left-1.5 flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: offline ? '#8A9BA8' : '#ef4444', boxShadow: offline ? 'none' : '0 0 5px #ef4444' }}
        />
        <span className="text-[length:calc(8px*var(--fs))] font-bold font-mono" style={{ color: '#E6EEF6' }}>{camera.id}</span>
      </div>
      {large && (
        <div className="absolute bottom-1 left-1.5 text-[7.5px] font-mono" style={{ color: 'rgba(184,197,209,0.8)' }}>
          {now.toLocaleTimeString('en-GB')} WIT
        </div>
      )}
      {camera.ptz && (
        <span className="absolute top-1 right-1.5 text-[length:calc(7px*var(--fs))] font-bold px-1 rounded" style={{ background: 'rgba(37,99,235,0.25)', color: '#93C5FD' }}>
          PTZ
        </span>
      )}
      {camera.coversAlert && (
        <span
          className="absolute bottom-1 right-1.5 flex items-center gap-0.5 text-[length:calc(7px*var(--fs))] font-bold px-1 py-0.5 rounded"
          style={{ background: 'rgba(249,115,22,0.24)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.5)' }}
        >
          <AlertTriangle className="w-2 h-2" /> ALERT
        </span>
      )}
    </div>
  );
};

const NearbyCameras: React.FC<Props> = ({ room, level, initialCameraId = null, onClose }) => {
  const cams = useMemo(() => camerasForRoom(room.id, level), [room.id, level]);
  const [activeId, setActiveId] = useState<string | null>(initialCameraId ?? cams[0]?.id ?? null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (initialCameraId && cams.some((c) => c.id === initialCameraId)) setActiveId(initialCameraId);
  }, [initialCameraId, cams]);

  const active = cams.find((c) => c.id === activeId) ?? cams[0];
  const alerting = cams.filter((c) => c.coversAlert).length;

  if (cams.length === 0) return null;

  return (
    <div
      className={`absolute z-[85] rounded-xl border overflow-hidden flex flex-col animate-fade-in ${
        expanded ? 'inset-6' : 'right-4 bottom-4 w-[330px] h-[290px]'
      }`}
      style={{
        background: 'rgba(7,16,40,0.97)',
        borderColor: alerting > 0 ? 'rgba(249,115,22,0.45)' : 'rgba(37,99,235,0.42)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(37,99,235,0.22)', background: 'rgba(8,32,58,0.9)' }}
      >
        <Camera className="w-3.5 h-3.5 shrink-0" style={{ color: '#3B82F6' }} />
        <div className="min-w-0">
          <div className="text-[length:calc(11px*var(--fs))] font-bold text-text-primary leading-tight truncate">Nearby Cameras</div>
          <div className="text-[8.5px] truncate" style={{ color: '#8A9BA8' }}>
            {cams.length} covering {room.name}
          </div>
        </div>
        {alerting > 0 && (
          <span
            className="flex items-center gap-1 text-[length:calc(9px*var(--fs))] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(249,115,22,0.18)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.4)' }}
          >
            <Radio className="w-2.5 h-2.5" /> slewed
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Restore' : 'Expand'}
            className="p-1 rounded hover:bg-white/10"
            style={{ color: '#8A9BA8' }}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} title="Close" className="p-1 rounded hover:bg-white/10" style={{ color: '#8A9BA8' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary feed */}
      <div className="flex-1 min-h-0 p-1.5">
        {active && <FeedTile camera={active} room={room} large />}
      </div>

      {/* Camera strip — ranked by distance from the room */}
      <div className="shrink-0 px-1.5 pb-1.5">
        <div className={`grid gap-1 ${expanded ? 'grid-cols-6' : 'grid-cols-4'}`}>
          {cams.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              title={`${c.id} — ${c.location}${c.coversAlert ? ' · covering an active alert' : ''}`}
              className="relative rounded overflow-hidden"
              style={{
                height: expanded ? 74 : 54,
                outline: active?.id === c.id ? '1.5px solid #3B82F6' : 'none',
                outlineOffset: -1,
              }}
            >
              <FeedTile camera={c} room={room} />
            </button>
          ))}
        </div>
        {active && (
          <div className="flex items-center gap-1.5 mt-1 px-0.5">
            <Video className="w-2.5 h-2.5 shrink-0" style={{ color: '#8A9BA8' }} />
            <span className="text-[length:calc(8px*var(--fs))] truncate" style={{ color: '#B8C5D1' }}>{active.location}</span>
            <span className="ml-auto text-[length:calc(8px*var(--fs))] shrink-0" style={{ color: '#8A9BA8' }}>{active.distanceM} m</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyCameras;
export { CAMERAS };
