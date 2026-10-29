import React from 'react';
import { iso, isoBox, isoMatrix, isoShadow } from './iso';
import { useJourney } from './motion';

interface IsoSecuritySceneProps {
  /** True once an SOP run has started. */
  sopActive: boolean;
  /** Index of the SOP step currently executing; -1 when idle. */
  currentStep: number;
  /** Total steps, used for the progress ribbon. */
  totalSteps: number;
  /** Human-readable incident location, shown on the marker. */
  incidentLocation: string;
  onElementClick: (elementType: string, elementData: any, event: React.MouseEvent) => void;
}

const TEAL = '#01A3A4';
const GOLD = '#E6B85C';
const RED = '#EF4444';
const GREEN = '#10B981';

/** The unattended bag sits at Gate 13 in the middle of the concourse. */
const BAG = { x: 402, y: 296 };
/** Security post the response team is dispatched from. */
const POST = { x: 118, y: 470 };

const CAMERAS = [
  { id: 'CAM-13-A', at: { x: 150, y: 120 }, idleAim: { x: 300, y: 220 } },
  { id: 'CAM-13-B', at: { x: 640, y: 120 }, idleAim: { x: 520, y: 230 } },
  { id: 'CAM-P-01', at: { x: 150, y: 452 }, idleAim: { x: 300, y: 380 } },
  { id: 'CAM-P-02', at: { x: 640, y: 452 }, idleAim: { x: 520, y: 380 } },
];

const ACCESS_DOORS = [
  { id: 'AP-01', at: { x: 62, y: 214 }, label: 'AIRSIDE' },
  { id: 'AP-02', at: { x: 62, y: 372 }, label: 'STAFF' },
  { id: 'AP-03', at: { x: 742, y: 292 }, label: 'JETBRIDGE' },
];

const SEAT_ROWS = [
  { x: 300, y: 176 },
  { x: 300, y: 214 },
  { x: 508, y: 176 },
  { x: 508, y: 214 },
];

const IsoSecurityScene: React.FC<IsoSecuritySceneProps> = ({
  sopActive,
  currentStep,
  totalSteps,
  incidentLocation,
  onElementClick,
}) => {
  // Each SOP step switches on the next layer of the response, so the scene
  // reads as the procedure actually executing rather than as static art.
  const alerted = sopActive && currentStep >= 0;
  const camerasFocused = sopActive && currentStep >= 1;
  const paActive = sopActive && currentStep >= 2;
  const lockdown = sopActive && currentStep >= 3;
  const emergencyLighting = sopActive && currentStep >= 4;
  const teamDispatched = sopActive && currentStep >= 5;

  // Response team walks from the security post to the cordon edge.
  const team = useJourney({
    active: teamDispatched,
    from: POST,
    legs: [
      { phase: 'moving', to: { x: 250, y: 420 }, ms: 1600 },
      { phase: 'moving', to: { x: 340, y: 340 }, ms: 1400 },
      { phase: 'onscene', to: { x: BAG.x - 46, y: BAG.y + 20 }, ms: 1400 },
    ],
  });

  const teamPos = teamDispatched ? team.position : POST;
  const bagScreen = iso(BAG.x, BAG.y);
  const cordonRadius = teamDispatched ? 74 : alerted ? 52 : 0;

  const structures: Array<{ y: number; key: string; node: React.ReactNode }> = [];

  // ------------------------------------------------------------ gate desk
  {
    const box = isoBox(628, 150, 96, 40, 26);
    structures.push({
      y: 150,
      key: 'gate-desk',
      node: (
        <g className="cursor-pointer" onClick={(e) => onElementClick('gate-desk', { id: 'Gate 13' }, e)}>
          <polygon points={box.ground} fill="#000" opacity="0.4" filter="url(#sc-blur)" />
          <polygon points={box.right} fill="#06202C" />
          <polygon points={box.front} fill="#0C3546" />
          <polygon points={box.top} fill="#0E556A" stroke={TEAL} strokeOpacity="0.6" strokeWidth="1.3" />
          <text
            x={box.topCenter.x}
            y={box.topCenter.y + 3}
            textAnchor="middle"
            fill="#E6EEF6"
            fontSize="10"
            fontWeight="800"
            letterSpacing="1.2"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="3"
          >
            GATE 13
          </text>
        </g>
      ),
    });
  }

  // -------------------------------------------------------------- seating
  SEAT_ROWS.forEach((row, i) => {
    structures.push({
      y: row.y,
      key: `seat-${i}`,
      node: (
        <g>
          {Array.from({ length: 5 }, (_, k) => {
            const b = isoBox(row.x + k * 26, row.y, 18, 16, 10);
            return (
              <g key={k}>
                <polygon points={b.right} fill="#062231" />
                <polygon points={b.front} fill="#0A3346" />
                <polygon points={b.top} fill="#12495E" stroke={TEAL} strokeOpacity="0.3" strokeWidth="0.8" />
              </g>
            );
          })}
        </g>
      ),
    });
  });

  // --------------------------------------------------------------- cameras
  CAMERAS.forEach((cam) => {
    const aim = camerasFocused ? BAG : cam.idleAim;
    const mast = isoBox(cam.at.x, cam.at.y, 10, 10, 46);
    const head = iso(cam.at.x, cam.at.y);
    const target = iso(aim.x, aim.y);
    const headY = head.y - 46;

    // Build a view cone from the camera head toward its aim point.
    const dx = target.x - head.x;
    const dy = target.y - headY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const spread = camerasFocused ? 16 : 26;
    const cone = `${head.x},${headY} ${head.x + ux * len + px * spread},${headY + uy * len + py * spread} ${
      head.x + ux * len - px * spread
    },${headY + uy * len - py * spread}`;

    structures.push({
      y: cam.at.y,
      key: `cam-${cam.id}`,
      node: (
        <g className="cursor-pointer" onClick={(e) => onElementClick('camera', cam, e)}>
          <polygon
            points={cone}
            fill={camerasFocused ? RED : TEAL}
            opacity={camerasFocused ? 0.16 : 0.07}
            style={{ transition: 'opacity 0.6s ease' }}
          />
          <polygon points={mast.right} fill="#06202C" />
          <polygon points={mast.front} fill="#0A2E3E" />
          <rect x={head.x - 7} y={headY - 6} width="14" height="9" rx="2" fill="#0E556A" stroke={camerasFocused ? RED : TEAL} strokeWidth="1.2" />
          <circle cx={head.x + ux * 9} cy={headY + uy * 9 - 1} r="2" fill={camerasFocused ? RED : TEAL} filter="url(#sc-glow)">
            {camerasFocused && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </circle>
          <text x={head.x} y={headY - 12} textAnchor="middle" fill="#8A9BA8" fontSize="7" fontWeight="700" style={{ pointerEvents: 'none' }}>
            {cam.id}
          </text>
        </g>
      ),
    });
  });

  // --------------------------------------------------------- access doors
  ACCESS_DOORS.forEach((d) => {
    const box = isoBox(d.at.x, d.at.y, 16, 54, 34);
    const c = lockdown ? RED : GREEN;
    structures.push({
      y: d.at.y,
      key: `door-${d.id}`,
      node: (
        <g className="cursor-pointer" onClick={(e) => onElementClick('access-point', { ...d, locked: lockdown }, e)}>
          <polygon points={box.right} fill="#062231" />
          <polygon points={box.front} fill="#0A3346" />
          <polygon points={box.top} fill="#0E556A" stroke={c} strokeOpacity="0.85" strokeWidth="1.4" />
          <circle cx={box.topCenter.x} cy={box.topCenter.y - 6} r="3" fill={c} filter="url(#sc-glow)">
            {lockdown && <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />}
          </circle>
          <text
            x={box.topCenter.x}
            y={box.topCenter.y + 12}
            textAnchor="middle"
            fill={c}
            fontSize="7"
            fontWeight="700"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="2.5"
          >
            {lockdown ? 'LOCKED' : d.label}
          </text>
        </g>
      ),
    });
  });

  // ------------------------------------------------------- unattended bag
  structures.push({
    y: BAG.y,
    key: 'bag',
    node: (
      <g className="cursor-pointer" onClick={(e) => onElementClick('unattended-bag', { location: incidentLocation }, e)}>
        {cordonRadius > 0 && (
          <>
            <ellipse
              cx={bagScreen.x}
              cy={bagScreen.y}
              rx={cordonRadius}
              ry={cordonRadius * 0.6}
              fill={RED}
              opacity="0.09"
              style={{ transition: 'all 0.8s ease' }}
            />
            <ellipse
              cx={bagScreen.x}
              cy={bagScreen.y}
              rx={cordonRadius}
              ry={cordonRadius * 0.6}
              fill="none"
              stroke={RED}
              strokeWidth="1.6"
              strokeDasharray="8,7"
              opacity="0.75"
              style={{ transition: 'all 0.8s ease' }}
            />
          </>
        )}
        {(() => {
          const b = isoBox(BAG.x, BAG.y, 17, 13, 13);
          const sh = isoShadow(BAG.x, BAG.y, 11, 8);
          return (
            <g filter={alerted ? 'url(#sc-glow-strong)' : undefined}>
              <ellipse cx={sh.cx} cy={sh.cy} rx={sh.rx} ry={sh.ry} fill="#000" opacity="0.5" />
              <polygon points={b.right} fill={alerted ? '#7F1D1D' : '#4A360F'} />
              <polygon points={b.front} fill={alerted ? '#B91C1C' : '#96701D'} />
              <polygon points={b.top} fill={alerted ? RED : GOLD} stroke="#04101F" strokeWidth="1" />
              {alerted && (
                <circle cx={bagScreen.x} cy={bagScreen.y - 22} r="9" fill="none" stroke={RED} strokeWidth="2" className="animate-ping" />
              )}
            </g>
          );
        })()}
        <g transform={`translate(${bagScreen.x}, ${bagScreen.y - 52})`} style={{ pointerEvents: 'none' }}>
          <line x1="0" y1="6" x2="0" y2="20" stroke={alerted ? RED : GOLD} strokeOpacity="0.7" strokeWidth="1" />
          <rect x="-62" y="-13" width="124" height="19" rx="4" fill="#04101F" opacity="0.92" stroke={alerted ? RED : GOLD} strokeOpacity="0.7" />
          <text x="0" y="0" textAnchor="middle" fill={alerted ? '#FCA5A5' : GOLD} fontSize="9" fontWeight="800" letterSpacing="0.4">
            UNATTENDED BAG
          </text>
        </g>
      </g>
    ),
  });

  // -------------------------------------------------------- response team
  if (teamDispatched || sopActive) {
    const officers = [
      { dx: 0, dy: 0 },
      { dx: -13, dy: 9 },
    ];
    structures.push({
      y: teamPos.y + 0.5,
      key: 'team',
      node: (
        <g>
          {officers.map((o, i) => {
            const b = isoBox(teamPos.x + o.dx, teamPos.y + o.dy, 11, 11, 24);
            const sh = isoShadow(teamPos.x + o.dx, teamPos.y + o.dy, 8, 6);
            return (
              <g key={i}>
                <ellipse cx={sh.cx} cy={sh.cy} rx={sh.rx} ry={sh.ry} fill="#000" opacity="0.45" />
                <polygon points={b.right} fill="#0B3D52" />
                <polygon points={b.front} fill="#12607A" />
                <polygon points={b.top} fill={TEAL} opacity="0.9" />
                <circle cx={b.topCenter.x} cy={b.topCenter.y - 4} r="2.4" fill={GOLD} filter="url(#sc-glow)">
                  {teamDispatched && (
                    <animate attributeName="opacity" values="1;0.25;1" dur="0.7s" repeatCount="indefinite" />
                  )}
                </circle>
              </g>
            );
          })}
          {teamDispatched && (
            <text
              x={iso(teamPos.x, teamPos.y).x}
              y={iso(teamPos.x, teamPos.y).y - 36}
              textAnchor="middle"
              fill={TEAL}
              fontSize="8"
              fontWeight="700"
              style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
              stroke="#04101F"
              strokeWidth="2.5"
            >
              RESPONSE TEAM
            </text>
          )}
        </g>
      ),
    });
  }

  structures.sort((a, b) => a.y - b.y);

  return (
    <svg viewBox="0 0 1040 430" className="w-full h-full" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071028" />
          <stop offset="100%" stopColor="#04101F" />
        </linearGradient>
        <linearGradient id="sc-floor" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#0B2F42" />
          <stop offset="100%" stopColor="#061B28" />
        </linearGradient>
        <radialGradient id="sc-alert" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={RED} stopOpacity="0.3" />
          <stop offset="100%" stopColor={RED} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sc-vignette" cx="50%" cy="45%" r="72%">
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>
        <filter id="sc-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sc-glow-strong" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sc-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1040" height="430" fill="url(#sc-sky)" />

      {/* emergency lighting wash over the whole hall */}
      {emergencyLighting && (
        <rect x="0" y="0" width="1040" height="430" fill={RED} opacity="0.07">
          <animate attributeName="opacity" values="0.04;0.12;0.04" dur="2.2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* ===================== concourse floor ===================== */}
      <g transform={isoMatrix}>
        <polygon
          points="40,70 770,70 770,500 40,500"
          fill="url(#sc-floor)"
          stroke="#0E556A"
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <g stroke={TEAL} strokeOpacity="0.06" strokeWidth="1">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`cv-${i}`} x1={40 + i * 49} y1="70" x2={40 + i * 49} y2="500" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`ch-${i}`} x1="40" y1={70 + i * 48} x2="770" y2={70 + i * 48} />
          ))}
        </g>

        {/* walkway markings down the middle of the concourse */}
        <rect x="60" y="286" width="690" height="4" fill={GOLD} opacity="0.12" />
        <rect x="60" y="306" width="690" height="4" fill={GOLD} opacity="0.12" />

        {/* gate hold-room boundary */}
        <rect
          x="270"
          y="140"
          width="300"
          height="120"
          fill={TEAL}
          fillOpacity="0.05"
          stroke={TEAL}
          strokeOpacity="0.3"
          strokeWidth="1.4"
          strokeDasharray="8,6"
        />
      </g>

      {/* alert wash around the incident */}
      {alerted && (
        <ellipse cx={bagScreen.x} cy={bagScreen.y} rx="200" ry="112" fill="url(#sc-alert)">
          <animate attributeName="opacity" values="0.55;1;0.55" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* ===================== depth-sorted props ===================== */}
      {structures.map((s) => (
        <g key={s.key}>{s.node}</g>
      ))}

      {/* ===================== PA indicator ===================== */}
      {paActive && (
        <g style={{ pointerEvents: 'none' }} transform="translate(520, 46)">
          <rect x="-74" y="-14" width="148" height="24" rx="12" fill="#04101F" opacity="0.9" stroke={GOLD} strokeOpacity="0.6" />
          <circle cx="-56" cy="-2" r="4" fill={GOLD}>
            <animate attributeName="opacity" values="1;0.2;1" dur="1.1s" repeatCount="indefinite" />
          </circle>
          <text x="6" y="2" textAnchor="middle" fill={GOLD} fontSize="10" fontWeight="700" letterSpacing="0.8">
            PA BROADCAST LIVE
          </text>
        </g>
      )}

      {/* ===================== status ribbon ===================== */}
      <g style={{ pointerEvents: 'none' }}>
        <rect
          x="18"
          y="392"
          width="300"
          height="24"
          rx="12"
          fill="#04101F"
          opacity="0.86"
          stroke={alerted ? RED : TEAL}
          strokeOpacity="0.45"
        />
        <circle cx="36" cy="404" r="4" fill={alerted ? RED : GREEN} className={alerted ? 'animate-pulse' : ''} />
        <text x="50" y="408" fill="#B8C5D1" fontSize="10.5" fontWeight="600" letterSpacing="0.6">
          {alerted
            ? `SOP RUNNING · STEP ${Math.min(currentStep + 1, totalSteps)}/${totalSteps} · ${incidentLocation}`
            : 'CONCOURSE NORMAL · AI SURVEILLANCE ACTIVE'}
        </text>
      </g>

      <rect x="0" y="0" width="1040" height="430" fill="url(#sc-vignette)" style={{ pointerEvents: 'none' }} />
    </svg>
  );
};

export default IsoSecurityScene;
