import React from 'react';
import { AIRPORT_LAYOUT, getStandLeadIns, getTerminals, TAXI_LANE_X } from './airportLayout';
import { ISO, iso, isoBox, isoMatrix, isoShadow } from './iso';
import { screenHeading } from './route';

interface IsoAirportSceneProps {
  aircraftPosition: { x: number; y: number };
  /** Ground-space direction of travel, projected here into a screen angle. */
  aircraftTangent?: { x: number; y: number };
  /** The arrival route, drawn as the cleared taxi path while a run is active. */
  arrivalRoutePath?: string;
  currentPhase: string;
  isLanding: boolean;
  selectedGate: string;
  selectedRunway: string;
  selectedAircraft: string;
  activeLights: number[];
  onElementClick: (elementType: string, elementData: any, event: React.MouseEvent) => void;
}

const TEAL = '#01A3A4';
const GOLD = '#E6B85C';
const BLD_H = 34; // building height in screen px - low enough that the three
                  // concourses read as one complex instead of occluding each other

/** Runway thresholds get "piano key" bars at each end. */
const pianoKeys = (cx: number, cy: number, len: number, w: number) => {
  const bars: Array<{ x: number; y: number; w: number; h: number }> = [];
  const barW = 9;
  const barH = w / 9;
  for (let i = 0; i < 4; i++) {
    const oy = cy - w / 2 + barH * (i * 2) + barH / 2;
    bars.push({ x: cx - len / 2 + 5, y: oy, w: barW, h: barH });
    bars.push({ x: cx + len / 2 - 5 - barW, y: oy, w: barW, h: barH });
  }
  return bars;
};

const IsoAirportScene: React.FC<IsoAirportSceneProps> = ({
  aircraftPosition,
  aircraftTangent = { x: 1, y: 0 },
  arrivalRoutePath,
  currentPhase,
  isLanding,
  selectedGate,
  selectedRunway,
  selectedAircraft,
  activeLights,
  onElementClick,
}) => {
  const runway = selectedRunway === '09/27' ? AIRPORT_LAYOUT.runway1 : AIRPORT_LAYOUT.runway2;
  const terminals = getTerminals();

  /**
   * Everything that stands up off the floor goes into one list and is painted
   * back-to-front by its ground y, so nearer objects correctly overlap farther
   * ones instead of depending on JSX order.
   */
  const structures: Array<{ y: number; key: string; node: React.ReactNode }> = [];

  // ---------------------------------------------------------------- terminals
  terminals.forEach((term) => {
    const box = isoBox(term.position.x, term.position.y, term.width, term.height, BLD_H);
    structures.push({
      y: term.position.y,
      key: `term-${term.key}`,
      node: (
        <g className="cursor-pointer" onClick={(e) => onElementClick('terminal', term, e)}>
          <polygon points={box.ground} fill="#000000" opacity="0.45" filter="url(#ao-blur-soft)" />
          <polygon points={box.right} fill="url(#ao-wall-right)" />
          <polygon points={box.front} fill="url(#ao-wall-front)" />
          <polygon points={box.front} fill="url(#ao-glass)" opacity="0.45" />
          <polygon points={box.top} fill="url(#ao-roof)" stroke={TEAL} strokeOpacity="0.6" strokeWidth="1.4" />
          {/* roof ribs */}
          <polygon
            points={isoBox(term.position.x, term.position.y, term.width - 26, term.height - 22, BLD_H + 5).top}
            fill="#0F4A61"
            opacity="0.75"
          />
          <text
            x={box.topCenter.x}
            y={box.topCenter.y + 4}
            textAnchor="middle"
            fill="#E6EEF6"
            fontSize="12"
            fontWeight="800"
            letterSpacing="2"
            style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
            stroke="#04101F"
            strokeWidth="3.5"
          >
            {term.key}
          </text>
          <circle cx={box.topCenter.x + 40} cy={box.topCenter.y - 6} r="2.6" fill="#10B981" filter="url(#ao-glow)">
            <animate attributeName="opacity" values="1;0.25;1" dur="2.6s" repeatCount="indefinite" />
          </circle>
        </g>
      ),
    });
  });

  // ------------------------------------------------------- gates + jetbridges
  terminals.forEach((term) => {
    term.gates.forEach((gate) => {
      const p = iso(gate.position.x, gate.position.y);
      // Stand circles are pitched 30 units apart, which projects to ~18px, so
      // the marking has to stay inside that or the three stands on a concourse
      // merge into one smear.
      const sh = isoShadow(gate.position.x, gate.position.y, 15);
      const bridgeEnd = iso(term.position.x - term.width / 2, gate.position.y);
      const isSel = gate.id === selectedGate;

      structures.push({
        y: gate.position.y,
        key: `gate-${gate.id}`,
        node: (
          <g>
            {/* jetbridge - a short gangway now the stand is against the pier */}
            <line
              x1={p.x + 10}
              y1={p.y - 8}
              x2={bridgeEnd.x}
              y2={bridgeEnd.y - BLD_H / 2 - 3}
              stroke="#0B3D52"
              strokeWidth="7"
              strokeLinecap="round"
              className="cursor-pointer"
              onClick={(e) =>
                onElementClick('jetbridge', { gate: gate.id, terminal: `Terminal ${term.key}` }, e)
              }
            />
            <line
              x1={p.x + 10}
              y1={p.y - 8}
              x2={bridgeEnd.x}
              y2={bridgeEnd.y - BLD_H / 2 - 3}
              stroke={isSel ? GOLD : TEAL}
              strokeOpacity={isSel ? 0.9 : 0.45}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* stand marking */}
            <ellipse
              cx={sh.cx}
              cy={sh.cy}
              rx={sh.rx}
              ry={sh.ry}
              fill={isSel ? GOLD : '#0A2130'}
              fillOpacity={isSel ? 0.16 : 0.5}
              stroke={isSel ? GOLD : '#8A9BA8'}
              strokeOpacity={isSel ? 0.95 : 0.45}
              strokeWidth={isSel ? 1.8 : 1}
              strokeDasharray={isSel ? '0' : '4,4'}
              className="cursor-pointer"
              onClick={(e) => onElementClick('gate', gate, e)}
            />
            {/* nose-wheel stop bar, so the circle reads as a parking position */}
            <line
              x1={p.x - 5}
              y1={p.y - 4}
              x2={p.x + 5}
              y2={p.y - 4}
              stroke={isSel ? GOLD : '#8A9BA8'}
              strokeOpacity={isSel ? 0.9 : 0.4}
              strokeWidth="1.4"
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={p.x - 20}
              y={p.y + 3}
              textAnchor="end"
              fill={isSel ? GOLD : '#8A9BA8'}
              fontSize="8.5"
              fontWeight="700"
              style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
              stroke="#04101F"
              strokeWidth="2.5"
            >
              {gate.id}
            </text>
          </g>
        ),
      });
    });
  });

  // ------------------------------------------------------------ control tower
  {
    const t = AIRPORT_LAYOUT.tower;
    const shaft = isoBox(t.position.x, t.position.y, 18, 18, t.height);
    const cab = isoBox(t.position.x, t.position.y, 32, 32, t.height + 16);
    const base = isoShadow(t.position.x, t.position.y, 22);
    structures.push({
      y: t.position.y,
      key: 'tower',
      node: (
        <g>
          <ellipse cx={base.cx} cy={base.cy} rx={base.rx} ry={base.ry} fill="#000" opacity="0.45" filter="url(#ao-blur-soft)" />
          <polygon points={shaft.right} fill="#06202C" />
          <polygon points={shaft.front} fill="#0A2E3E" />
          <polygon points={cab.right} fill="#0A3A52" />
          <polygon points={cab.front} fill="url(#ao-glass)" stroke={TEAL} strokeOpacity="0.65" />
          <polygon points={cab.top} fill="#0E556A" stroke={TEAL} strokeOpacity="0.7" />
          <circle cx={cab.topCenter.x} cy={cab.topCenter.y - 7} r="3" fill={GOLD} filter="url(#ao-glow-strong)">
            <animate attributeName="opacity" values="1;0.15;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <text
            x={cab.topCenter.x}
            y={cab.topCenter.y - 18}
            textAnchor="middle"
            fill="#8A9BA8"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="1.5"
            style={{ pointerEvents: 'none' }}
          >
            ATC
          </text>
        </g>
      ),
    });
  }

  // ----------------------------------------------------------------- aircraft
  {
    const p = iso(aircraftPosition.x, aircraftPosition.y);
    // The sprite is drawn nose-right, so the projected tangent angle rotates it
    // to face its actual direction of travel through every turn.
    const heading = screenHeading(aircraftTangent, ISO.skew, ISO.squash);
    const sh = isoShadow(aircraftPosition.x, aircraftPosition.y + 5, 19, 11);
    structures.push({
      y: aircraftPosition.y + 0.5, // tie-break in front of a gate at the same y
      key: 'aircraft',
      node: (
        <g>
          <ellipse cx={sh.cx} cy={sh.cy} rx={sh.rx} ry={sh.ry} fill="#000000" opacity="0.5" filter="url(#ao-blur-soft)" />
          {isLanding && (
            <circle cx={p.x} cy={p.y - 11} r="24" fill="none" stroke={TEAL} strokeWidth="2" opacity="0.35" className="animate-ping" />
          )}
          <g
            transform={`translate(${p.x}, ${p.y - 11}) rotate(${heading})`}
            className="cursor-pointer"
            onClick={(e) => onElementClick('aircraft', { phase: currentPhase }, e)}
            filter="url(#ao-drop)"
          >
            <path d="M-2,0 L-15,10 L-8,11 L4,3 Z" fill="#0E7C7E" />
            <path d="M-2,0 L-15,-10 L-8,-11 L4,-3 Z" fill="#12979A" />
            <path d="M-14,0 L-21,5 L-17,6 L-11,2 Z" fill="#0B6567" />
            <path d="M-14,0 L-21,-5 L-17,-6 L-11,-2 Z" fill="#0E7C7E" />
            <path d="M-19,-3 L11,-3 Q18,0 11,3 L-19,3 Q-22,0 -19,-3 Z" fill="#D6E2EC" />
            <path d="M-19,-3 L11,-3 Q18,0 11,3 L-19,3 Q-22,0 -19,-3 Z" fill="url(#ao-glass)" opacity="0.3" />
            <path d="M-19,0 L-23,-8 L-18,-8 L-13,0 Z" fill={TEAL} />
            <circle cx="16" cy="0" r="1.8" fill="#EF4444" className={isLanding ? 'animate-pulse' : ''} />
            <circle cx="-8" cy="-11" r="1.4" fill="#10B981" className={isLanding ? 'animate-pulse' : ''} />
            <circle cx="-8" cy="11" r="1.4" fill="#EF4444" className={isLanding ? 'animate-pulse' : ''} />
          </g>
          <g transform={`translate(${p.x}, ${p.y - 40})`} style={{ pointerEvents: 'none' }}>
            <line x1="0" y1="4" x2="0" y2="16" stroke={TEAL} strokeOpacity="0.55" strokeWidth="1" />
            <rect x="-29" y="-11" width="58" height="16" rx="3" fill="#04101F" opacity="0.9" stroke={TEAL} strokeOpacity="0.55" />
            <text x="0" y="1" textAnchor="middle" fill="#5FDCDA" fontSize="9.5" fontWeight="700">
              {selectedAircraft}
            </text>
          </g>
        </g>
      ),
    });
  }

  structures.sort((a, b) => a.y - b.y);

  return (
    <svg viewBox="0 0 1040 430" className="w-full h-full" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ao-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071028" />
          <stop offset="55%" stopColor="#061A2C" />
          <stop offset="100%" stopColor="#04101F" />
        </linearGradient>
        <linearGradient id="ao-ground" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#0B2F42" />
          <stop offset="55%" stopColor="#082434" />
          <stop offset="100%" stopColor="#061B28" />
        </linearGradient>
        <linearGradient id="ao-runway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16303F" />
          <stop offset="45%" stopColor="#1B3B4C" />
          <stop offset="100%" stopColor="#102532" />
        </linearGradient>
        <linearGradient id="ao-apron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12333F" />
          <stop offset="100%" stopColor="#0B2331" />
        </linearGradient>
        <linearGradient id="ao-taxi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#14384A" />
          <stop offset="100%" stopColor="#0E2B3A" />
        </linearGradient>
        <linearGradient id="ao-roof" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#14607A" />
          <stop offset="100%" stopColor="#0B3D52" />
        </linearGradient>
        <linearGradient id="ao-wall-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0C3546" />
          <stop offset="100%" stopColor="#061C28" />
        </linearGradient>
        <linearGradient id="ao-wall-right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#082735" />
          <stop offset="100%" stopColor="#04141D" />
        </linearGradient>
        <linearGradient id="ao-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.5" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0.1" />
        </linearGradient>

        <radialGradient id="ao-flood" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.2" />
          <stop offset="60%" stopColor={GOLD} stopOpacity="0.06" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ao-horizon" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.15" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ao-vignette" cx="50%" cy="45%" r="72%">
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>

        <filter id="ao-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ao-glow-strong" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ao-drop" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.55" />
        </filter>
        <filter id="ao-blur-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* ============================ backdrop ============================ */}
      <rect x="0" y="0" width="1040" height="430" fill="url(#ao-sky)" />
      <ellipse cx="520" cy="340" rx="640" ry="210" fill="url(#ao-horizon)" />

      {/* ====================== flat ground geometry ====================== */}
      <g transform={isoMatrix}>
        <polygon
          points="10,45 830,45 830,515 10,515"
          fill="url(#ao-ground)"
          stroke="#0E556A"
          strokeOpacity="0.45"
          strokeWidth="2"
        />

        {/* survey grid */}
        <g stroke={TEAL} strokeOpacity="0.06" strokeWidth="1">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`gv-${i}`} x1={10 + i * 51} y1="45" x2={10 + i * 51} y2="515" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`gh-${i}`} x1="10" y1={45 + i * 47} x2="830" y2={45 + i * 47} />
          ))}
        </g>

        {/* perimeter service road */}
        <rect
          x="24"
          y="59"
          width="792"
          height="442"
          fill="none"
          stroke="#0E556A"
          strokeOpacity="0.35"
          strokeWidth="6"
        />
        <rect
          x="24"
          y="59"
          width="792"
          height="442"
          fill="none"
          stroke={GOLD}
          strokeOpacity="0.13"
          strokeWidth="1"
          strokeDasharray="14,12"
        />

        {/* apron slab */}
        <polygon points="466,102 792,102 792,432 466,432" fill="url(#ao-apron)" opacity="0.9" />
        <g stroke={GOLD} strokeOpacity="0.16" strokeWidth="1.4" strokeDasharray="6,8">
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`ap-${i}`} x1="470" y1={132 + i * 52} x2="788" y2={140 + i * 50} />
          ))}
        </g>

        {/* approach lighting piers - fills the left apron and reads as real ALS */}
        {[AIRPORT_LAYOUT.runway1, AIRPORT_LAYOUT.runway2].map((rw) => (
          <g key={`als-${rw.id}`}>
            <line
              x1="60"
              y1={rw.centerline.y}
              x2={rw.centerline.x - rw.length / 2}
              y2={rw.centerline.y}
              stroke={GOLD}
              strokeOpacity="0.2"
              strokeWidth="1.4"
              strokeDasharray="7,7"
            />
            {Array.from({ length: 7 }, (_, i) => (
              <line
                key={`alsbar-${rw.id}-${i}`}
                x1={70 + i * 18}
                y1={rw.centerline.y - 9}
                x2={70 + i * 18}
                y2={rw.centerline.y + 9}
                stroke={GOLD}
                strokeOpacity="0.28"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}

        {/* taxiways */}
        {AIRPORT_LAYOUT.taxiways.map((t) => (
          <g key={`tx-${t.id}`}>
            <path d={t.path} fill="none" stroke="#081F2B" strokeWidth={t.width + 6} strokeLinecap="round" />
            <path d={t.path} fill="none" stroke="url(#ao-taxi)" strokeWidth={t.width} strokeLinecap="round" />
            <path
              d={t.path}
              fill="none"
              stroke={GOLD}
              strokeOpacity="0.7"
              strokeWidth="1.5"
              strokeDasharray="10,9"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* stand lead-in lines from the parallel taxiway into each parking
            position, so a stand is visibly served rather than free-floating */}
        {getStandLeadIns().map((l) => {
          const on = l.id === selectedGate;
          return (
            <g key={`lead-${l.id}`}>
              <path d={l.path} fill="none" stroke="#0B2836" strokeWidth="15" strokeLinecap="round" />
              <path
                d={l.path}
                fill="none"
                stroke={on ? GOLD : '#8A9BA8'}
                strokeOpacity={on ? 0.85 : 0.3}
                strokeWidth="1.6"
                strokeDasharray={on ? '0' : '7,7'}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* runways */}
        {[AIRPORT_LAYOUT.runway1, AIRPORT_LAYOUT.runway2].map((rw) => {
          const active = rw.id === selectedRunway;
          return (
            <g key={`rw-${rw.id}`}>
              <rect
                x={rw.centerline.x - rw.length / 2 - 8}
                y={rw.centerline.y - rw.width / 2 - 7}
                width={rw.length + 16}
                height={rw.width + 14}
                fill="#0A2130"
                rx="4"
              />
              <rect
                x={rw.centerline.x - rw.length / 2}
                y={rw.centerline.y - rw.width / 2}
                width={rw.length}
                height={rw.width}
                fill="url(#ao-runway)"
                stroke={active ? TEAL : '#2A4A5C'}
                strokeWidth={active ? 2.5 : 1.5}
                strokeOpacity={active ? 0.95 : 0.6}
                rx="2"
                className="cursor-pointer"
                onClick={(e) => onElementClick('runway', rw, e)}
              />
              <line
                x1={rw.centerline.x - rw.length / 2}
                y1={rw.centerline.y - rw.width / 2 + 3}
                x2={rw.centerline.x + rw.length / 2}
                y2={rw.centerline.y - rw.width / 2 + 3}
                stroke="#D6E2EC"
                strokeOpacity="0.45"
                strokeWidth="1.3"
              />
              <line
                x1={rw.centerline.x - rw.length / 2}
                y1={rw.centerline.y + rw.width / 2 - 3}
                x2={rw.centerline.x + rw.length / 2}
                y2={rw.centerline.y + rw.width / 2 - 3}
                stroke="#D6E2EC"
                strokeOpacity="0.45"
                strokeWidth="1.3"
              />
              <line
                x1={rw.centerline.x - rw.length / 2 + 78}
                y1={rw.centerline.y}
                x2={rw.centerline.x + rw.length / 2 - 78}
                y2={rw.centerline.y}
                stroke="#F2F7FB"
                strokeOpacity="0.7"
                strokeWidth="2"
                strokeDasharray="17,14"
              />
              {pianoKeys(rw.centerline.x, rw.centerline.y, rw.length, rw.width).map((b, i) => (
                <rect key={`pk-${rw.id}-${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill="#D6E2EC" opacity="0.6" />
              ))}
              {active && (
                <rect
                  x={rw.centerline.x - rw.length / 2}
                  y={rw.centerline.y - rw.width / 2}
                  width={rw.length}
                  height={rw.width}
                  fill={TEAL}
                  opacity="0.09"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}

        {/* the cleared route this arrival is tracking */}
        {isLanding && arrivalRoutePath && (
          <g>
            <path
              d={arrivalRoutePath}
              fill="none"
              stroke={TEAL}
              strokeOpacity="0.35"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={arrivalRoutePath}
              fill="none"
              stroke={GOLD}
              strokeOpacity="0.9"
              strokeWidth="2"
              strokeDasharray="9,9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.9s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* approach corridor while an arrival is running */}
        {isLanding && (
          <g>
            <polygon
              points={`60,${runway.centerline.y - 30} ${runway.centerline.x - 40},${runway.centerline.y - 6} ${runway.centerline.x - 40},${runway.centerline.y + 6} 60,${runway.centerline.y + 30}`}
              fill={TEAL}
              opacity="0.09"
            />
            <path
              d={`M60,${runway.centerline.y} L${runway.centerline.x - 40},${runway.centerline.y}`}
              stroke={TEAL}
              strokeWidth="2.5"
              strokeDasharray="16,10"
              opacity="0.7"
              className="animate-pulse"
              fill="none"
            />
          </g>
        )}
      </g>

      {/* ===================== floodlight pools ===================== */}
      {[
        [230, 140],
        [230, 430],
        [620, 150],
        [620, 380],
      ].map(([x, y], i) => {
        const p = iso(x, y);
        return <ellipse key={`fl-${i}`} cx={p.x} cy={p.y} rx="125" ry="70" fill="url(#ao-flood)" />;
      })}

      {/* ===================== runway lighting ===================== */}
      {activeLights.map((lightId) => {
        let gx = 0;
        let gy = 0;
        let color = GOLD;

        if (lightId < 5) {
          gx = 70 + lightId * 22;
          gy = runway.centerline.y;
        } else if (lightId < 13) {
          const i = lightId - 5;
          gx = runway.centerline.x - runway.length / 2 + i * 35;
          gy = runway.centerline.y + (i % 2 === 0 ? -19 : 19);
          color = '#F2F7FB';
        } else {
          // Taxi guidance: green centreline lights up the parallel taxiway
          // toward the stands, following the route the aircraft actually takes.
          const i = lightId - 13;
          gx = TAXI_LANE_X;
          gy = runway.centerline.y + (runway.centerline.y < 260 ? 1 : -1) * (36 + i * 42);
          color = TEAL;
        }

        const p = iso(gx, gy);
        return (
          <g key={`lt-${lightId}`}>
            <circle cx={p.x} cy={p.y} r="7" fill={color} opacity="0.2" filter="url(#ao-blur-soft)" />
            <circle cx={p.x} cy={p.y} r="2.4" fill={color} filter="url(#ao-glow)" className="animate-pulse" />
          </g>
        );
      })}

      {/* ===================== depth-sorted structures ===================== */}
      {structures.map((s) => (
        <g key={s.key}>{s.node}</g>
      ))}

      {/* ===================== runway designators ===================== */}
      {[AIRPORT_LAYOUT.runway1, AIRPORT_LAYOUT.runway2].map((rw) => {
        const [lo, hi] = rw.id.split('/');
        const on = rw.id === selectedRunway;
        const l = iso(rw.centerline.x - rw.length / 2 + 44, rw.centerline.y);
        const r = iso(rw.centerline.x + rw.length / 2 - 44, rw.centerline.y);
        return (
          <g key={`rwl-${rw.id}`} style={{ pointerEvents: 'none' }}>
            {[
              { p: l, txt: lo },
              { p: r, txt: hi },
            ].map((it, i) => (
              <g key={i}>
                <rect x={it.p.x - 15} y={it.p.y - 9} width="30" height="18" rx="3" fill="#04101F" opacity="0.72" />
                <text
                  x={it.p.x}
                  y={it.p.y + 5}
                  textAnchor="middle"
                  fill={on ? TEAL : '#B8C5D1'}
                  fontSize="13"
                  fontWeight="800"
                  letterSpacing="1"
                >
                  {it.txt}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {/* ===================== taxiway designators ===================== */}
      {[
        { id: 'A', at: [350, 258] },
        { id: 'M', at: [460, 196] },
        { id: 'B', at: [432, 142] },
        { id: 'D', at: [432, 378] },
      ].map((t) => {
        const p = iso(t.at[0], t.at[1]);
        return (
          <g key={`txl-${t.id}`} style={{ pointerEvents: 'none' }}>
            <rect x={p.x - 8} y={p.y - 8} width="16" height="14" rx="2" fill="#123D1F" stroke={GOLD} strokeOpacity="0.55" />
            <text x={p.x} y={p.y + 2.5} textAnchor="middle" fill={GOLD} fontSize="9" fontWeight="700">
              {t.id}
            </text>
          </g>
        );
      })}

      {/* ===================== phase ribbon ===================== */}
      <g style={{ pointerEvents: 'none' }}>
        <rect x="18" y="392" width="212" height="24" rx="12" fill="#04101F" opacity="0.82" stroke={TEAL} strokeOpacity="0.35" />
        <circle cx="36" cy="404" r="4" fill={isLanding ? GOLD : '#10B981'} className={isLanding ? 'animate-pulse' : ''} />
        <text x="50" y="408" fill="#B8C5D1" fontSize="10.5" fontWeight="600" letterSpacing="0.8">
          PHASE: {String(currentPhase).toUpperCase().replace(/-/g, ' ')}
        </text>
      </g>

      <rect x="0" y="0" width="1040" height="430" fill="url(#ao-vignette)" style={{ pointerEvents: 'none' }} />
    </svg>
  );
};

export default IsoAirportScene;
