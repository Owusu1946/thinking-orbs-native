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
