import type { OrbSize } from '../types';
import type { RingOptions } from './types';

export const RING_PRESETS: Record<OrbSize, { speed: number; options: RingOptions }> = {
  64: {
    speed: 3.24,
    options: { lanes: Math.max(2, Math.round(5 * Math.sqrt(0.25))), segs: Math.max(2, Math.round(88 * Math.sqrt(0.25))), rBase: 1.1 * 0.956, rDepth: 1.7 * 0.956, rsPow: 0.6, rMin: 0.3, spin: 0, bandMul: 3.627, wobMul: 0.368, faceOn: 1, rSizeMul: 0.956 },
  },
  20: {
    speed: 3.78,
    options: { lanes: Math.max(2, Math.round(5 * Math.sqrt(0.028))), segs: Math.max(2, Math.round(88 * Math.sqrt(0.028))), rBase: 1.1 * 1.622, rDepth: 1.7 * 1.622, rsPow: 0.6, rMin: 0.3, spin: 0, bandMul: 3.968, wobMul: 0.565, faceOn: 1, rSizeMul: 1.622 },
  },
};
