import type { Dot, RingOptions } from './types';
import { fibDir, makeProj, radiusScale } from './core';

/** Generates the exact breathing/ring geometry used by the web package. */
export function generateRingDots(size: number, t: number, options: RingOptions): Dot[] {
  'worklet';
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.78;
  const spin = options.spin;
  const cameraTilt = 0.3;
  const project = makeProj(t * 0.1 * spin, cameraTilt, cx, cy, 1);
  const scale = radiusScale(size, options.rsPow);
  const dots: Dot[] = [];

  const ghostCount = 0;
  for (let i = 0; i < ghostCount; i++) {
    const d = fibDir(i, ghostCount);
    const [x, y, z] = project(d[0] * radius, d[1] * radius, d[2] * radius);
    const depth = (z / radius + 1) / 2;
    dots.push({ x, y, z, r: 0.8 * scale, white: 0.78, a: 0.1 + 0.22 * depth });
  }

  const yaw = t * 0.24 * spin;
  const tilt = options.faceOn ? -cameraTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
  const ux = Math.cos(yaw);
  const uy = 0;
  const uz = Math.sin(yaw);
  const vx = -uz * Math.sin(tilt);
  const vy = Math.cos(tilt);
  const vz = ux * Math.sin(tilt);
  const nx = -uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy;

  const wobbleAmplitude = 0.23 * options.wobMul;
  const baseRadius = options.faceOn ? radius / (1 + 0.85 * wobbleAmplitude) : radius;
  const lanes = Math.max(1, Math.round(options.lanes * options.bandMul));

  for (let lane = 0; lane < lanes; lane++) {
    const laneOffset = (lane - (lanes - 1) / 2) * 0.075;
    const edge = Math.abs(lane - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
    for (let segment = 0; segment < options.segs; segment++) {
      const angle = (segment / options.segs) * 2 * Math.PI;
      const wobble =
        (0.16 * Math.sin(angle * 3 - t * 1.7 + lane * 0.22) + 0.07 * Math.sin(angle * 5 + t * 1.1)) * options.wobMul;
      const radial = options.faceOn ? 1 + wobble : 1;
      const offset = options.faceOn ? laneOffset : laneOffset + wobble;
      const x = ux * Math.cos(angle) + vx * Math.sin(angle) + nx * offset;
      const y = vy * Math.sin(angle) + ny * offset;
      const z = uz * Math.cos(angle) + vz * Math.sin(angle) + nz * offset;
      const length = Math.sqrt(x * x + y * y + z * z);
      const rr = baseRadius * radial;
      const [px, py, projectedZ] = project((x / length) * rr, (y / length) * rr, (z / length) * rr);
      const depth = (projectedZ / radius + 1) / 2;
      dots.push({
        x: px,
        y: py,
        z: projectedZ,
        r: Math.max(options.rMin, (options.rBase + options.rDepth * depth) * (1 - 0.25 * edge) * scale),
        white: 0.52 - 0.44 * depth + 0.18 * edge,
        a: 0.4 + 0.6 * depth,
      });
    }
  }
  dots.sort((a, b) => a.z - b.z);
  return dots;
}

/** O(1)-allocation variant used by the batched native renderer. */
export function generateRingDot(size: number, t: number, index: number, options: RingOptions): Dot {
  'worklet';
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.78;
  const spin = options.spin;
  const cameraTilt = 0.3;
  const project = makeProj(t * 0.1 * spin, cameraTilt, cx, cy, 1);
  const scale = radiusScale(size, options.rsPow);
  const lanes = Math.max(1, Math.round(options.lanes * options.bandMul));
  const lane = Math.floor(index / options.segs);
  const segment = index - lane * options.segs;
  const laneOffset = (lane - (lanes - 1) / 2) * 0.075;
  const edge = Math.abs(lane - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
  const angle = (segment / options.segs) * 2 * Math.PI;
  const wobble =
    (0.16 * Math.sin(angle * 3 - t * 1.7 + lane * 0.22) + 0.07 * Math.sin(angle * 5 + t * 1.1)) * options.wobMul;
  const yaw = t * 0.24 * spin;
  const tilt = options.faceOn ? -cameraTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
  const ux = Math.cos(yaw);
  const uy = 0;
  const uz = Math.sin(yaw);
  const vx = -uz * Math.sin(tilt);
  const vy = Math.cos(tilt);
  const vz = ux * Math.sin(tilt);
  const nx = -uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const wobbleAmplitude = 0.23 * options.wobMul;
  const baseRadius = options.faceOn ? radius / (1 + 0.85 * wobbleAmplitude) : radius;
  const radial = options.faceOn ? 1 + wobble : 1;
  const offset = options.faceOn ? laneOffset : laneOffset + wobble;
  const x = ux * Math.cos(angle) + vx * Math.sin(angle) + nx * offset;
  const y = vy * Math.sin(angle) + ny * offset;
  const z = uz * Math.cos(angle) + vz * Math.sin(angle) + nz * offset;
  const length = Math.sqrt(x * x + y * y + z * z);
  const rr = baseRadius * radial;
  const [px, py, projectedZ] = project((x / length) * rr, (y / length) * rr, (z / length) * rr);
  const depth = (projectedZ / radius + 1) / 2;
  return {
    x: px,
    y: py,
    z: projectedZ,
    r: Math.max(options.rMin, (options.rBase + options.rDepth * depth) * (1 - 0.25 * edge) * scale),
    white: 0.52 - 0.44 * depth + 0.18 * edge,
    a: 0.4 + 0.6 * depth,
  };
}
