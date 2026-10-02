const TAU = Math.PI * 2;

/** A stable surface sample moves from a spherical wedge to an open curved sheet. */
export function imaginePoint(
  sheet: number, lane: number, lanes: number, segment: number, segments: number, openness: number,
): [number, number, number] {
  'worklet';
  const u = (segment + 0.5) / segments;
  const width = lanes === 1 ? 0 : lane / (lanes - 1) - 0.5;
  const sector = sheet / 3 * TAU;
  const latitude = (u - 0.5) * Math.PI;
  const longitude = sector + width * TAU / 3 * 0.88;
  const latitudeRadius = Math.cos(latitude);
  const sphereX = latitudeRadius * Math.cos(longitude);
  const sphereY = Math.sin(latitude);
  const sphereZ = latitudeRadius * Math.sin(longitude);

  const angle = sector - 0.85 + u * 1.7 + width * (0.28 + 0.28 * Math.sin(u * Math.PI));
  const radius = 0.38 + 0.5 * Math.sin(u * Math.PI) + 0.12 * width;
  const openX = Math.cos(angle) * radius;
  const openY = Math.sin(angle) * radius;
  const openZ = 0.22 * Math.sin(u * TAU + sector) + width * 0.16;

  return [
    sphereX + (openX - sphereX) * openness,
    sphereY + (openY - sphereY) * openness,
    sphereZ + (openZ - sphereZ) * openness,
  ];
}
