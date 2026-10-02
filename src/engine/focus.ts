import { fibDir, radiusScale } from './core';
import type { ModeOptions } from './profiles';
import type { Dot, OrbFrame } from './types';

const TAU = Math.PI * 2;
const CYCLE = 6;

function smoothstep(value: number): number {
  'worklet';
  return value * value * (3 - 2 * value);
}

/** Scattered trails organize into a halo, then release without implying completion. */
export function focus(size: number, time: number, options: ModeOptions): OrbFrame {
  'worklet';
  const phase = ((time % CYCLE) + CYCLE) % CYCLE;
  const alignment = phase < 1 ? 0 : phase < 3
    ? smoothstep((phase - 1) / 2) : phase < 4 ? 1
    : 1 - smoothstep((phase - 4) / 2);
  const drift = 1 - alignment;
  const rotation = phase / CYCLE * TAU;
  const center = size / 2;
  const radius = size * 0.34;
  const scale = radiusScale(size, options.rsPow ?? 0.6);
  const trails = options.trails ?? 3;
  const segments = options.segs ?? 28;
  const ghosts = options.ghostN ?? 18;
  const dots: Dot[] = [];

  for (let index = 0; index < ghosts; index++) {
    const direction = fibDir(index, ghosts);
    dots.push({
      x: center + direction[0] * radius,
      y: center + direction[1] * radius,
      z: direction[2] * radius,
      r: 0.65 * scale, white: 0.72, a: 0.12 + 0.08 * drift,
    });
  }

  for (let trail = 0; trail < trails; trail++) {
    const offset = trail / trails * TAU;
    const tilt = 0.28 + drift * (trail - (trails - 1) / 2) * 0.95;
    const yaw = drift * Math.sin(rotation + offset) * 0.65;
    // Slightly spaced lanes preserve individual dots as the trails align.
    const laneRadius = radius * (1 + (trail - (trails - 1) / 2) * 0.055);
    const dx = drift * Math.cos(rotation + offset) * size * 0.035;
    const dy = drift * Math.sin(rotation + offset) * size * 0.035;
    const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt);
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);

    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * TAU + rotation + offset;
      const x = Math.cos(angle) * laneRadius;
      const y = Math.sin(angle) * laneRadius * cosTilt;
      const z = Math.sin(angle) * laneRadius * sinTilt;
      const projectedX = x * cosYaw + z * sinYaw;
      const projectedZ = -x * sinYaw + z * cosYaw;
      const depth = (projectedZ / laneRadius + 1) / 2;
      const highlight = (1 + Math.cos(segment / segments * TAU - offset)) / 2;
      dots.push({
        x: center + projectedX + dx, y: center - y + dy, z: projectedZ,
        r: ((options.rBase ?? 0.9) + (options.rDepth ?? 1.1) * depth) * scale,
        white: 0.58 - 0.38 * depth - 0.1 * alignment,
        a: (0.35 + 0.4 * depth + 0.2 * highlight) * (0.8 + 0.2 * alignment),
      });
    }
  }

  dots.push({
    x: center, y: center, z: radius,
    r: (options.coreR ?? 1) * (1 + 0.25 * alignment),
    white: 0.16 - 0.1 * alignment, a: 0.65 + 0.3 * alignment,
  });
  return { dots, lines: [] };
}
