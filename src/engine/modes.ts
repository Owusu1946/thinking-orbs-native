import { imagine } from './imagine';
import type { ModeKey } from './all-presets';
import { fibDir, finalizeFrame, makeProj, radiusScale } from './core';
import type { Dot, FrameLine, OrbFrame } from './types';
import type { ModeOptions } from './profiles';

export type { FrameLine, OrbFrame } from './types';

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
  const radius = size * 0.4;
  const project = makeProj(t * 0.12, 0.32, size / 2, size / 2, radius);
  const scale = radiusScale(size, o.rsPow ?? 0.6);
  const nodeCount = o.nodeN ?? 30;
  const nodes: [number, number, number][] = [];
  const projected: [number, number, number][] = [];
  const dots: Dot[] = [];
  const lines: FrameLine[] = [];
  for (let index = 0; index < nodeCount; index++) {
    const direction = fibDir(index, nodeCount);
    const x = direction[0] + 0.3 * (vnoise(index * 0.31 + 9, t * 0.24) - 0.5) * 2;
    const y = direction[1] + 0.3 * (vnoise(index * 0.53 + 27, t * 0.21) - 0.5) * 2;
    const z = direction[2] + 0.3 * (vnoise(index * 0.77 + 55, t * 0.27) - 0.5) * 2;
    const length = Math.sqrt(x * x + y * y + z * z);
    const node: [number, number, number] = [x / length, y / length, z / length];
    nodes.push(node);
    projected.push(project(...node));
  }

  const threshold = o.thr ?? 0.72;
  const thresholdSquared = threshold * threshold;
  const lineWidth = Math.max(0.6, (o.lineW ?? 0.8) * scale);
  for (let index = 0; index < nodeCount; index++) {
    for (let neighbor = index + 1; neighbor < nodeCount; neighbor++) {
      const dx = nodes[index][0] - nodes[neighbor][0];
      const dy = nodes[index][1] - nodes[neighbor][1];
      const dz = nodes[index][2] - nodes[neighbor][2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      if (threshold <= 0 || distanceSquared >= thresholdSquared) continue;
      const distance = Math.sqrt(distanceSquared);
      const a = projected[index];
      const b = projected[neighbor];
      const depth = ((a[2] + b[2]) / 2 + 1) / 2;
      lines.push({
        x1: a[0], y1: a[1], x2: b[0], y2: b[1], white: 0.42,
        a: (1 - distance / threshold) * (0.3 + 0.55 * depth), w: lineWidth,
      });
    }
  }
  for (let index = 0; index < nodeCount; index++) {
    const point = projected[index];
    const depth = (point[2] + 1) / 2;
    const pulse = 1 + 0.25 * Math.sin(t * 1.4 + index * 2.7);
    dots.push({
      x: point[0], y: point[1], z: point[2],
      r: ((o.nodeR ?? 1.4) + (o.nodeRDepth ?? 1.8) * depth) * pulse * scale,
      white: 0.55 - 0.45 * depth,
    });
  }
  const signals = o.signals ?? 5;
  for (let signal = 0; signal < signals; signal++) {
    const segment = Math.floor(t * 0.55 + signal * 7.31);
    const a = Math.floor(hashD(segment, signal * 3.1 + 1.7) * nodeCount);
    const b = Math.floor(hashD(segment, signal * 5.7 + 4.2) * nodeCount);
    if (a === b) continue;
    const fraction = frac(t * 0.55 + signal * 7.31);
    const x = lerp(nodes[a][0], nodes[b][0], fraction);
    const y = lerp(nodes[a][1], nodes[b][1], fraction);
    const z = lerp(nodes[a][2], nodes[b][2], fraction);
    const length = Math.max(1e-6, Math.sqrt(x * x + y * y + z * z));
    const point = project(x / length, y / length, z / length);
    const depth = (point[2] + 1) / 2;
    dots.push({
      x: point[0], y: point[1], z: point[2],
      r: ((o.nodeR ?? 1.4) * 1.5 + (o.nodeRDepth ?? 1.8) * depth) * scale,
      white: 0.05, a: 0.5 + 0.5 * depth,
    });
  }
  return { dots, lines };
}

const MORPH_SAMPLES = 160;
type OutlinePoint = readonly [number, number];

function samplePolygon(vertices: readonly OutlinePoint[]): OutlinePoint[] {
  const lengths = vertices.map((a, index) => {
    const b = vertices[(index + 1) % vertices.length];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  });
  const perimeter = lengths.reduce((sum, length) => sum + length, 0);
  return Array.from({ length: MORPH_SAMPLES }, (_, index): OutlinePoint => {
    let target = index / MORPH_SAMPLES * perimeter;
    let segment = 0;
    while (target > lengths[segment] && segment < vertices.length - 1) {
      target -= lengths[segment++];
    }
    const a = vertices[segment];
    const b = vertices[(segment + 1) % vertices.length];
    const fraction = lengths[segment] ? Math.min(1, target / lengths[segment]) : 0;
    return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
  });
}

// Sample the fixed outlines once; UI worklets only blend these numeric points.
const MORPH_OUTLINES: readonly (readonly OutlinePoint[])[] = [
  Array.from({ length: MORPH_SAMPLES }, (_, index): OutlinePoint => {
    const angle = -Math.PI / 2 + index / MORPH_SAMPLES * TAU;
    return [Math.cos(angle) * 0.24, Math.sin(angle) * 0.24];
  }),
  samplePolygon([[0, -0.26], [0.24, 0.16], [-0.24, 0.16]]),
  samplePolygon([[0, -0.2], [0.2, -0.2], [0.2, 0.2], [-0.2, 0.2], [-0.2, -0.2]]),
];

function morph(size: number, t: number, o: ModeOptions): OrbFrame {
  'worklet';
  const cycle = 2.3 * 3;
  const phase = t % cycle;
  // Wrap reverse playback into the cycle before indexing the cached outlines.
  const cycleTime = phase < 0 ? (phase + cycle) % cycle : phase;
  const shape = Math.floor(cycleTime / 2.3);
  const local = cycleTime - shape * 2.3;
  const progress = local > 1.4 ? (local - 1.4) / 0.9 : 0;
  const blend = progress * progress * (3 - 2 * progress);
  const spread = o.spread ?? 1.45;
  const count = Math.max(6, Math.round(34 * (o.iconD ?? 1)));
  const from = MORPH_OUTLINES[shape];
  const to = MORPH_OUTLINES[(shape + 1) % 3];
  const points: [number, number][] = [];
  for (let index = 0; index < MORPH_SAMPLES; index++) {
    const a = from[index];
    const b = to[index];
    points.push([(a[0] + (b[0] - a[0]) * blend) * spread, (a[1] + (b[1] - a[1]) * blend) * spread]);
  }

  const lengths: number[] = [];
  let perimeter = 0;
  for (let index = 0; index < MORPH_SAMPLES; index++) {
    const a = points[index];
    const b = points[(index + 1) % MORPH_SAMPLES];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lengths.push(length);
    perimeter += length;
  }

  const pulse = 1 + 0.02 * Math.sin(local * 3.1);
  const radius = Math.max(0.35, (o.rDot ?? 0.021) * 1.35 * spread * size);
  const dots: Dot[] = [];
  let segment = 0;
  let distance = 0;
  for (let index = 0; index < count; index++) {
    const target = index / count * perimeter;
    while (distance + lengths[segment] < target && segment < MORPH_SAMPLES - 1) {
      distance += lengths[segment++];
    }
    const a = points[segment];
    const b = points[(segment + 1) % MORPH_SAMPLES];
    const fraction = lengths[segment] ? Math.min(1, (target - distance) / lengths[segment]) : 0;
    dots.push({
      x: size / 2 + (a[0] + (b[0] - a[0]) * fraction) * size * pulse,
      y: size / 2 + (a[1] + (b[1] - a[1]) * fraction) * size * pulse,
      z: 0, r: radius, white: 0.1,
    });
  }
  return { dots, lines: emptyLines };
}

export function generateFrame(mode: ModeKey, size: number, time: number, options: ModeOptions): OrbFrame {
  'worklet';
  let frame: OrbFrame;
  switch (mode) {
    case 'imagine': frame = imagine(size, time, options); break;
    case 'orbits': frame = orbits(size, time, options); break;
    case 'globe': frame = globe(size, time, options); break;
    case 'rubik': frame = rubik(size, time, options); break;
    case 'wave': frame = wave(size, time, options); break;
    case 'web': frame = web(size, time, options); break;
    case 'braid': frame = braid(size, time, options); break;
    case 'ribbon': frame = ribbon(size, time, options); break;
    case 'morph': frame = morph(size, time, options); break;
    case 'ring': frame = ribbon(size, time, options, true); break;
  }
  return finalizeFrame(frame, options.rMin);
}
