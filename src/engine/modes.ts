import type { ModeKey } from './all-presets';
import { fibDir, makeProj, radiusScale } from './core';
import type { Dot } from './types';
import type { ModeOptions } from './profiles';

export interface FrameLine { x1: number; y1: number; x2: number; y2: number; white: number; a: number; w: number }
export interface OrbFrame { dots: Dot[]; lines: FrameLine[] }
export interface OrbBucketFrame { dots: number[][]; lines: number[][] }

const DOT_STRIDE = 3;
const LINE_STRIDE = 4;

export function createBucketFrame(dotBuckets: number, lineBuckets: number): OrbBucketFrame {
  return {
    dots: Array.from({ length: dotBuckets }, () => []),
    lines: Array.from({ length: lineBuckets }, () => []),
  };
}

export function generateBucketFrame(
  target: OrbBucketFrame,
  mode: ModeKey,
  size: number,
  time: number,
  options: ModeOptions,
  dark: boolean
): OrbBucketFrame {
  'worklet';
  for (let bucket = 0; bucket < target.dots.length; bucket++) target.dots[bucket].length = 0;
  for (let bucket = 0; bucket < target.lines.length; bucket++) target.lines[bucket].length = 0;

  const frame = generateFrame(mode, size, time, options);
  for (let index = 0; index < frame.dots.length; index++) {
    const dot = frame.dots[index];
    const alpha = Math.min(1, Math.max(0, dot.a ?? 1));
    const white = Math.min(1, Math.max(0, dot.white));
    const ink = dark ? alpha * (1 - white) : 1 - alpha * (1 - white);
    const bucket = Math.min(target.dots.length - 1, Math.max(0, Math.floor(ink * target.dots.length)));
    const output = target.dots[bucket];
    output.push(dot.x, dot.y, dot.r);
  }
  for (let index = 0; index < frame.lines.length; index++) {
    const line = frame.lines[index];
    const alpha = Math.min(1, Math.max(0, line.a));
    const white = Math.min(1, Math.max(0, line.white));
    const ink = dark ? alpha * (1 - white) : 1 - alpha * (1 - white);
    const bucket = Math.min(target.lines.length - 1, Math.max(0, Math.floor(ink * target.lines.length)));
    const output = target.lines[bucket];
    output.push(line.x1, line.y1, line.x2, line.y2);
  }
  return target;
}

export { DOT_STRIDE, LINE_STRIDE };

const TAU = Math.PI * 2;
const emptyLines: FrameLine[] = [];
const frac = (x: number) => { 'worklet'; return x - Math.floor(x); };
const lerp = (a: number, b: number, f: number) => { 'worklet'; return a + (b - a) * f; };
const hashD = (a: number, b: number) => { 'worklet'; const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); };
const angleDelta = (a: number, b: number) => { 'worklet'; return Math.atan2(Math.sin(a - b), Math.cos(a - b)); };
const vnoise = (x: number, y: number) => {
  'worklet';
  const xi = Math.floor(x), yi = Math.floor(y);
  let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hashD(xi, yi), b = hashD(xi + 1, yi), c = hashD(xi, yi + 1), d = hashD(xi + 1, yi + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

function globe(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const radius = size * 0.41, pt = makeProj(t * 0.5, 0.4 + 0.06 * Math.sin(t * 0.35), size / 2, size / 2, radius);
  const scan = t * (0.5 + 1.2 * (o.scanMul ?? 1)), rs = radiusScale(size, o.rsPow ?? 0.6), dots: Dot[] = [];
  const rings = o.latRings ?? 17, density = o.lonDensity ?? 44;
  for (let li = 0; li <= rings; li++) {
    const lat = -Math.PI / 2 + li / rings * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat), count = Math.max(1, Math.round(Math.abs(cl) * density));
    for (let j = 0; j < count; j++) {
      const lon = j / count * TAU, p = pt(cl * Math.cos(lon), sl, cl * Math.sin(lon)), depth = (p[2] + 1) / 2;
      const d = angleDelta(lon + t * 0.5, scan), boost = Math.exp(-(d * d) / 0.18) * Math.max(0, p[2]);
      dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rBoost ?? 1) * boost) * rs, white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth, a: (o.dimBase ?? 1) + (1 - (o.dimBase ?? 1)) * Math.min(1, boost) });
    }
  }
  return { dots, lines: emptyLines };
}

function wave(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const R = size * 0.437, pt = makeProj(t * 0.18, 0.38, size / 2, size / 2, 1), rs = radiusScale(size, o.rsPow ?? 0.6), dots: Dot[] = [];
  const rings = o.rings ?? 15, density = o.lonDensity ?? 40;
  for (let ri = 0; ri <= rings; ri++) {
    const lat = -Math.PI / 2 + ri / rings * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83), rr = R * (0.88 + 0.105 * w), count = Math.max(1, Math.round(Math.abs(cl) * density));
    for (let j = 0; j < count; j++) {
      const lon = j / count * TAU, p = pt(cl * Math.cos(lon) * rr, sl * rr, cl * Math.sin(lon) * rr), depth = (p[2] / R + 1) / 2, crest = Math.max(0, w);
      dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * rs, white: 0.66 - 0.56 * depth - 0.1 * crest });
    }
  }
  return { dots, lines: emptyLines };
}

function orbits(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const R = size * 0.41, pt = makeProj(t * 0.12, 0.3, size / 2, size / 2, 1), rs = radiusScale(size, o.rsPow ?? 0.6), dots: Dot[] = [];
  const orbitN = o.orbitN ?? 12, ghostN = o.ghostN ?? 40, particles = o.particles ?? 3;
  for (let orb = 0; orb < orbitN; orb++) {
    const h1 = hashD(orb, 1.7), h2 = hashD(orb, 5.2), h3 = hashD(orb, 8.9), ro = R * (0.45 + 0.52 * h1), th = h1 * TAU, phi = Math.acos(2 * h2 - 1);
    const nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
    let ux = -ny, uy = nx; const ul = Math.max(1e-6, Math.hypot(ux, uy)); ux /= ul; uy /= ul;
    const vx = -nz * uy, vy = nz * ux, vz = nx * uy - ny * ux, orbitSpeed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1);
    for (let k = 0; k < ghostN; k++) {
      const a = k / ghostN * TAU, p = pt((ux * Math.cos(a) + vx * Math.sin(a)) * ro, (uy * Math.cos(a) + vy * Math.sin(a)) * ro, vz * Math.sin(a) * ro), depth = (p[2] / ro + 1) / 2;
      dots.push({ x: p[0], y: p[1], z: p[2], r: (o.ghostR ?? 0.9) * rs, white: 0.72, a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth) });
    }
    for (let m = 0; m < particles; m++) {
      const a = t * orbitSpeed + m / particles * TAU + h2 * 6, p = pt((ux * Math.cos(a) + vx * Math.sin(a)) * ro, (uy * Math.cos(a) + vy * Math.sin(a)) * ro, vz * Math.sin(a) * ro), depth = (p[2] / ro + 1) / 2;
      dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * rs, white: 0.3 - 0.22 * depth });
    }
  }
  return { dots, lines: emptyLines };
}

interface Move { axis: number; lo: number; hi: number; ang: number }
function rubik(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const R = size * 0.41, pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), size / 2, size / 2, R), rs = radiusScale(size, o.rsPow ?? 0.6), dots: Dot[] = [];
  const moveCount = o.moveCount ?? 14, moves: Move[] = [];
  for (let i = 0; i < moveCount; i++) moves.push({ axis: Math.min(2, Math.floor(hashD(i, 2.3) * 3)), lo: -1 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4)), hi: 0, ang: (hashD(i, 7.7) < 0.5 ? 1 : -1) * Math.PI / 2 });
  for (const move of moves) move.hi = move.lo + 0.5;
  const slotDur = 0.42, rest = 1.2, tc = t % (2 * moveCount * slotDur + rest), amounts = new Array<number>(moveCount).fill(0); let active = -1;
  if (tc < 2 * moveCount * slotDur) { const slot = Math.floor(tc / slotDur), p = (tc - slot * slotDur) / slotDur, ep = 1 - (1 - Math.min(1, p / 0.7)) ** 3; if (slot < moveCount) { for (let i = 0; i < slot; i++) amounts[i] = 1; amounts[slot] = ep; active = slot; } else { const u = 2 * moveCount - 1 - slot; for (let i = 0; i < u; i++) amounts[i] = 1; amounts[u] = 1 - ep; active = u; } }
  const rings = o.latRings ?? 15, density = o.lonDensity ?? 40;
  for (let li = 0; li <= rings; li++) {
    const lat = -Math.PI / 2 + li / rings * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat), count = Math.max(1, Math.round(Math.abs(cl) * density));
    for (let j = 0; j < count; j++) {
      const lon = j / count * TAU; let x = cl * Math.cos(lon), y = sl, z = cl * Math.sin(lon), inActive = false;
      for (let i = 0; i < moveCount; i++) { if (amounts[i] <= 0) continue; const mv = moves[i], coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z; if (coord < mv.lo || coord >= mv.hi) continue; if (i === active) inActive = true; const a = mv.ang * amounts[i], ca = Math.cos(a), sa = Math.sin(a); if (mv.axis === 0) { const y2 = y * ca - z * sa; z = y * sa + z * ca; y = y2; } else if (mv.axis === 1) { const x2 = x * ca + z * sa; z = -x * sa + z * ca; x = x2; } else { const x2 = x * ca - y * sa; y = x * sa + y * ca; x = x2; } }
      const p = pt(x, y, z), depth = (p[2] + 1) / 2;
      dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (inActive ? (o.rActive ?? 0.3) : 0)) * rs, white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (inActive ? 0.14 : 0) });
    }
  }
  return { dots, lines: emptyLines };
}

function ribbon(size: number, t: number, o: ModeOptions, faceOn = false): OrbFrame {
  'worklet';
  const R = size * 0.39, cx = size / 2, cy = size / 2, spin = o.spin ?? 1, tilt = faceOn ? -0.3 : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
  const project = makeProj(t * 0.1 * spin, 0.3, cx, cy, 1);
  const yaw = t * 0.24 * spin, ux = Math.cos(yaw), uz = Math.sin(yaw), vx = -uz * Math.sin(tilt), vy = Math.cos(tilt), vz = ux * Math.sin(tilt), nx = -uz * vy, ny = uz * vx - ux * vz, nz = ux * vy;
  const rs = radiusScale(size, o.rsPow ?? 0.6), lanes = Math.max(1, Math.round((o.lanes ?? 5) * (o.bandMul ?? 1))), segs = o.segs ?? 88, dots: Dot[] = [];
  const ghostN = o.ghostN ?? 150;
  for (let index = 0; index < ghostN; index++) {
    const direction = fibDir(index, ghostN);
    const point = project(direction[0] * R, direction[1] * R, direction[2] * R);
    const depth = (point[2] / R + 1) / 2;
    dots.push({ x: point[0], y: point[1], z: point[2], r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
  }
  const baseR = faceOn ? R / (1 + 0.85 * 0.23 * (o.wobMul ?? 1)) : R;
  for (let lane = 0; lane < lanes; lane++) {
    const off = (lane - (lanes - 1) / 2) * 0.075, edge = Math.abs(lane - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
    for (let seg = 0; seg < segs; seg++) {
      const a = seg / segs * TAU, wob = (0.16 * Math.sin(a * 3 - t * 1.7 + lane * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) * (o.wobMul ?? 1), radial = faceOn ? 1 + wob : 1, laneDepth = faceOn ? off : off + wob;
      const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * laneDepth, y = vy * Math.sin(a) + ny * laneDepth, z = uz * Math.cos(a) + vz * Math.sin(a) + nz * laneDepth, len = Math.sqrt(x * x + y * y + z * z), rr = baseR * radial;
      const point = project((x / len) * rr, (y / len) * rr, (z / len) * rr), depth = (point[2] / R + 1) / 2;
      dots.push({ x: point[0], y: point[1], z: point[2], r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs, white: 0.52 - 0.44 * depth + 0.18 * edge, a: 0.4 + 0.6 * depth });
    }
  }
  return { dots, lines: emptyLines };
}

function braid(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const R = size * 0.38, pt = makeProj(t * 0.4, 0.3, size / 2, size / 2, 1), rs = radiusScale(size, o.rsPow ?? 0.6), dots: Dot[] = [];
  const ghostN = o.ghostN ?? 150;
  for (let index = 0; index < ghostN; index++) {
    const direction = fibDir(index, ghostN), point = pt(direction[0] * R, direction[1] * R, direction[2] * R), depth = (point[2] / R + 1) / 2;
    dots.push({ x: point[0], y: point[1], z: point[2], r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
  }
  const strandN = o.strandN ?? 52, turns = o.turns ?? 3;
  for (let s = 0; s < 3; s++) for (let i = 0; i < strandN; i++) {
    const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96, surf = Math.sqrt(Math.max(0, 1 - u * u)), fade = Math.min(1, (1 - Math.abs(u)) / 0.1), phase = s / 3 * TAU, a = u * Math.PI * turns + phase, weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8), rr = surf * R * weave, p = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr), depth = (p[2] / R + 1) / 2;
    dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * rs, white: 0.55 - 0.45 * depth, a: fade * (0.45 + 0.55 * depth) });
  }
  return { dots, lines: emptyLines };
}

function web(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const R = size * 0.4, pt = makeProj(t * 0.12, 0.32, size / 2, size / 2, R), rs = radiusScale(size, o.rsPow ?? 0.6), n = o.nodeN ?? 30, nodes: [number, number, number][] = [], dots: Dot[] = [], lines: FrameLine[] = [];
  for (let i = 0; i < n; i++) { const d = fibDir(i, n), x = d[0] + 0.3 * (vnoise(i * 0.31 + 9, t * 0.24) - 0.5) * 2, y = d[1] + 0.3 * (vnoise(i * 0.53 + 27, t * 0.21) - 0.5) * 2, z = d[2] + 0.3 * (vnoise(i * 0.77 + 55, t * 0.27) - 0.5) * 2, l = Math.sqrt(x * x + y * y + z * z); nodes.push([x / l, y / l, z / l]); }
  const threshold = o.thr ?? 0.72;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2], dist = Math.sqrt(dx * dx + dy * dy + dz * dz); if (dist >= threshold) continue; const a = pt(...nodes[i]), b = pt(...nodes[j]), depth = ((a[2] + b[2]) / 2 + 1) / 2; lines.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], white: 0.42, a: (1 - dist / threshold) * (0.3 + 0.55 * depth), w: Math.max(0.6, (o.lineW ?? 0.8) * rs) }); }
  for (let i = 0; i < n; i++) { const p = pt(...nodes[i]), depth = (p[2] + 1) / 2, pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7); dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.nodeR ?? 1.4) + (o.nodeRDepth ?? 1.8) * depth) * pulse * rs, white: 0.55 - 0.45 * depth }); }
  const signals = o.signals ?? 5; for (let s = 0; s < signals; s++) { const seg = Math.floor(t * 0.55 + s * 7.31), a = Math.floor(hashD(seg, s * 3.1 + 1.7) * n), b = Math.floor(hashD(seg, s * 5.7 + 4.2) * n); if (a === b) continue; const f = frac(t * 0.55 + s * 7.31), x = lerp(nodes[a][0], nodes[b][0], f), y = lerp(nodes[a][1], nodes[b][1], f), z = lerp(nodes[a][2], nodes[b][2], f), l = Math.max(1e-6, Math.sqrt(x * x + y * y + z * z)), p = pt(x / l, y / l, z / l), depth = (p[2] + 1) / 2; dots.push({ x: p[0], y: p[1], z: p[2], r: ((o.nodeR ?? 1.4) * 1.5 + (o.nodeRDepth ?? 1.8) * depth) * rs, white: 0.05, a: 0.5 + 0.5 * depth }); }
  return { dots, lines };
}

function morph(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const cycle = 2.3 * 3, tc = t % cycle, k = Math.floor(tc / 2.3), local = tc - k * 2.3, m = local > 1.4 ? ((local - 1.4) / 0.9) ** 2 * (3 - 2 * ((local - 1.4) / 0.9)) : 0, spread = o.spread ?? 1.45, n = Math.max(6, Math.round(34 * (o.iconD ?? 1))), dots: Dot[] = [];
  const shape = (kind: number, f: number): [number, number] => { const a = -Math.PI / 2 + f * TAU; if (kind === 0) return [Math.cos(a) * 0.24, Math.sin(a) * 0.24]; const v = kind === 1 ? [[0, -0.26], [0.24, 0.16], [-0.24, 0.16]] : [[0, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2], [-0.2, -0.2]]; let total = 0; for (let i = 0; i < v.length; i++) { const a1 = v[i], b = v[(i + 1) % v.length]; total += Math.hypot(b[0] - a1[0], b[1] - a1[1]); } let target = f * total; for (let i = 0; i < v.length; i++) { const a1 = v[i], b = v[(i + 1) % v.length], len = Math.hypot(b[0] - a1[0], b[1] - a1[1]); if (target <= len) return [a1[0] + (b[0] - a1[0]) * target / len, a1[1] + (b[1] - a1[1]) * target / len]; target -= len; } return v[0] as [number, number]; };
  const pA = k, pB = (k + 1) % 3, pts: [number, number][] = []; let total = 0; for (let i = 0; i < 80; i++) { const f = i / 80, a = shape(pA, f), b = shape(pB, f), p: [number, number] = [(a[0] + (b[0] - a[0]) * m) * spread, (a[1] + (b[1] - a[1]) * m) * spread]; pts.push(p); const q = pts[(i + 79) % 80]; if (i > 0) total += Math.hypot(p[0] - q[0], p[1] - q[1]); }
  const pathLength = Math.max(0.0001, pts.reduce((sum, p, i) => { const q = pts[(i + 1) % pts.length]; return sum + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0));
  for (let i = 0; i < n; i++) { const target = i / n * pathLength; let acc = 0; for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + len >= target) { const f = len ? (target - acc) / len : 0, pulse = 1 + 0.02 * Math.sin(local * 3.1); dots.push({ x: size / 2 + (a[0] + (b[0] - a[0]) * f) * size * pulse, y: size / 2 + (a[1] + (b[1] - a[1]) * f) * size * pulse, z: 0, r: Math.max(0.35, (o.rDot ?? 0.021) * 1.35 * spread * size), white: 0.1 }); break; } acc += len; } }
  return { dots, lines: emptyLines };
}

export function generateFrame(mode: ModeKey, size: number, time: number, options: ModeOptions): OrbFrame {
  'worklet';
  if (mode === 'orbits') return orbits(size, time, options);
  if (mode === 'globe') return globe(size, time, options);
  if (mode === 'rubik') return rubik(size, time, options);
  if (mode === 'wave') return wave(size, time, options);
  if (mode === 'web') return web(size, time, options);
  if (mode === 'braid') return braid(size, time, options);
  if (mode === 'ribbon') return ribbon(size, time, options);
  if (mode === 'morph') return morph(size, time, options);
  return ribbon(size, time, options, true);
}
