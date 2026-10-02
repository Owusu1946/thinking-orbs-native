export interface ModeOptions {
  [key: string]: number | undefined;
}

const COUNT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['latRings', 'lonDensity'],
  ['rings', 'lonDensity'],
  ['lanes', 'segs'],
];
const COUNT_KEYS = ['orbitN', 'ghostN', 'nodeN', 'strandN', 'signals'] as const;
const RADIUS_KEYS = [
  'rBase', 'rDepth', 'rActive', 'rDot', 'ghostR', 'partR', 'partRDepth', 'nodeR', 'nodeRDepth',
] as const;

export function scaleCounts(options: ModeOptions, scale: number): ModeOptions {
  const next = { ...options };
  const paired = new Set<string>();
  const root = Math.sqrt(scale);
  for (const [a, b] of COUNT_PAIRS) {
    const av = next[a];
    const bv = next[b];
    if (av != null && bv != null) {
      next[a] = Math.max(2, Math.round(av * root));
      next[b] = Math.max(2, Math.round(bv * root));
      paired.add(a);
      paired.add(b);
    }
  }
  for (const key of COUNT_KEYS) {
    const value = next[key];
    if (value != null && value !== 0 && !paired.has(key)) next[key] = Math.max(1, Math.round(value * scale));
  }
  if (next.iconD != null) next.iconD = Math.max(0.02, next.iconD * scale);
  return next;
}

export function scaleRadii(options: ModeOptions, scale: number): ModeOptions {
  const next = { ...options };
  for (const key of RADIUS_KEYS) if (next[key] != null) next[key] = next[key]! * scale;
  next.rSizeMul = (next.rSizeMul ?? 1) * scale;
  return next;
}

export const BASE_PROFILES: Record<string, ModeOptions> = {
  globe: { latRings: 17, lonDensity: 44, rBase: 0.6, rDepth: 1.7, rBoost: 1, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  orbits: { orbitN: 12, ghostN: 40, ghostR: 0.9, ghostA: 0.5, particles: 3, partR: 1.2, partRDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  rubik: { latRings: 15, lonDensity: 40, moveCount: 14, rBase: 0.6, rDepth: 1.7, rActive: 0.3, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  wave: { rings: 15, lonDensity: 40, rBase: 0.6, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  web: { nodeN: 30, thr: 0.72, signals: 5, nodeR: 1.4, nodeRDepth: 1.8, lineW: 0.8, rsPow: 0.6, rMin: 0.3 },
  braid: { strandN: 52, turns: 3, ghostN: 150, rBase: 1.2, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  ribbon: { lanes: 5, segs: 88, ghostN: 150, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  ring: { lanes: 5, segs: 88, ghostN: 0, faceOn: 1, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
  focus: { trails: 3, segs: 28, ghostN: 18, rBase: 0.9, rDepth: 1.1, coreR: 1, rsPow: 0.6, rMin: 0.3 },
  morph: { rDot: 0.021, iconD: 1, rMin: 0.25 },
};
