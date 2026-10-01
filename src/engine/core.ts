import type { OrbFrame } from './types';

export type Projector = (x: number, y: number, z: number) => [number, number, number];

export function fibDir(i: number, n: number): [number, number, number] {
  'worklet';
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * (i + 0.5)) / n;
  const rad = Math.sqrt(1 - y * y);
  const a = i * golden;
  return [rad * Math.cos(a), y, rad * Math.sin(a)];
}

export function makeProj(yaw: number, tilt: number, cx: number, cy: number, scale: number): Projector {
  'worklet';
  const st = Math.sin(tilt);
  const ct = Math.cos(tilt);
  const sy = Math.sin(yaw);
  const cyw = Math.cos(yaw);
  return (x, y, z) => {
    const x1 = x * cyw + z * sy;
    const z1 = -x * sy + z * cyw;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    return [cx + x1 * scale, cy - y1 * scale, z2];
  };
}

export function radiusScale(size: number, pow = 0.6): number {
  'worklet';
  return (size / 300) ** pow;
}

/** Match the web engine's visibility cutoff, radius floor, and far-to-near draw order. */
export function finalizeFrame(frame: OrbFrame, rMin = 0.3): OrbFrame {
  'worklet';
  const { dots, lines } = frame;
  let visibleDots = 0;
  for (let index = 0; index < dots.length; index++) {
    const dot = dots[index];
    if ((dot.a ?? 1) < 0.02) continue;
    dot.r = Math.max(rMin, dot.r);
    dots[visibleDots++] = dot;
  }
  dots.length = visibleDots;
  dots.sort((a, b) => a.z - b.z);

  let visibleLines = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.a < 0.02) continue;
    lines[visibleLines++] = line;
  }
  lines.length = visibleLines;
  return frame;
}
