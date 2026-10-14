const fs = require('fs');
const d = require('./b.json');
const M_LAT = 110574, M_LNG = 111320 * Math.cos(8.744 * Math.PI / 180);
const get = id => d.elements.find(e => e.id === id);
const pts = ids => ids.flatMap(id => (get(id).geometry || []).map(p => [p.lon, p.lat]));

// Andrew monotone chain hull, in metres-normalised space so it is not skewed by latitude.
const toM = ([lng, lat]) => [lng * M_LNG, lat * M_LAT];
function hull(points) {
  const P = points.map(p => ({ p, m: toM(p) })).sort((a, b) => a.m[0] - b.m[0] || a.m[1] - b.m[1]);
  const cross = (o, a, b) => (a.m[0]-o.m[0])*(b.m[1]-o.m[1]) - (a.m[1]-o.m[1])*(b.m[0]-o.m[0]);
  const lo = [], up = [];
  for (const q of P) { while (lo.length >= 2 && cross(lo[lo.length-2], lo[lo.length-1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = P.length-1; i >= 0; i--) { const q = P[i]; while (up.length >= 2 && cross(up[up.length-2], up[up.length-1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up).map(q => q.p);
}

// Min-area oriented bounding box over the hull, by rotating calipers on each edge.
function obb(ring) {
  const M = ring.map(toM);
  let best = null;
  for (let i = 0; i < M.length; i++) {
    const a = M[i], b = M[(i + 1) % M.length];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const c = Math.cos(-ang), s = Math.sin(-ang);
    const xs = M.map(p => p[0]*c - p[1]*s), ys = M.map(p => p[0]*s + p[1]*c);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    if (!best || w * h < best.area) best = { area: w*h, ang, w, h, x0: Math.min(...xs), y0: Math.min(...ys) };
  }
  return best;
}
// OBB local (u,v) in metres -> [lng,lat]
const fromLocal = (o, u, v) => {
  const c = Math.cos(o.ang), s = Math.sin(o.ang);
  const x = (o.x0 + u), y = (o.y0 + v);
  return [(x*c - y*s) / M_LNG, (x*s + y*c) / M_LAT];
};
function inside(ring, pt) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi) + xi) hit = !hit;
  }
  return hit;
}
const r6 = n => Number(n.toFixed(6));

function buildArea(id, name, short, ids, cols, rows, zoneNames) {
  const ring = hull(pts(ids));
  const o = obb(ring);
  const zones = [];
  let n = 0;
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const u0 = (cx / cols) * o.w, u1 = ((cx + 1) / cols) * o.w;
      const v0 = (ry / rows) * o.h, v1 = ((ry + 1) / rows) * o.h;
      const cell = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(([u,v]) => fromLocal(o, u, v));
      const centre = fromLocal(o, (u0+u1)/2, (v0+v1)/2);
      // Inset slightly so adjacent zones read as separate rooms, not one grid.
      const pad = 0.12;
      const padded = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(([u,v]) => {
        const cu = (u0+u1)/2, cv = (v0+v1)/2;
        return fromLocal(o, cu + (u-cu)*(1-pad), cv + (v-cv)*(1-pad));
      });
      if (!inside(ring, centre)) continue;
      n++;
      zones.push({
        id: `${short}-Z${n}`,
        short: `Z${n}`,
        name: zoneNames[n - 1] || `${short} Zone ${n}`,
        centre: centre.map(r6),
        ring: padded.map(p => p.map(r6)),
        _cell: cell,
      });
    }
  }
  const cLng = ring.reduce((s,p)=>s+p[0],0)/ring.length, cLat = ring.reduce((s,p)=>s+p[1],0)/ring.length;
  return {
    id, name, short,
    outline: ring.map(p => p.map(r6)),
    centre: [r6(cLng), r6(cLat)],
    bearingDeg: r6(((90 - o.ang * 180 / Math.PI) % 360 + 360) % 360),
    widthM: Math.round(o.w), depthM: Math.round(o.h),
    zones: zones.map(({ _cell, ...z }) => z),
  };
}

const T1 = buildArea('t1', 'Terminal 1 — Domestic', 'T1', [25127927, 260668865], 4, 2, [
  'Check-in Hall West', 'Check-in Hall East', 'Departure Concourse', 'Baggage Reclaim',
  'Security Screening', 'Departure Lounge', 'Arrivals Hall', 'Landside Kerb',
]);
const T2 = buildArea('t2', 'Terminal 2 — International', 'T2', [1503206443, 703233349], 2, 3, [
  'Intl Check-in', 'Intl Departures', 'Immigration', 'Duty Free Concourse',
  'Intl Arrivals', 'Intl Baggage Reclaim',
]);

fs.writeFileSync('./areas.json', JSON.stringify([T1, T2], null, 1));
for (const a of [T1, T2]) console.log(a.short, a.name, '|', a.widthM + 'x' + a.depthM, 'm | bearing', a.bearingDeg.toFixed(1), '| outline', a.outline.length, 'pts | zones', a.zones.length);
