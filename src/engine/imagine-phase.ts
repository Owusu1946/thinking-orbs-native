export const IMAGINE_CYCLE = 8;
export const IMAGINE_STILL_TIME = 3.7;

/** Periodic phase also handles negative times without changing particle identity. */
export function imaginePhase(time: number): number {
  'worklet';
  return ((time % IMAGINE_CYCLE) + IMAGINE_CYCLE) % IMAGINE_CYCLE;
}

function ease(value: number): number {
  'worklet';
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Each sheet unfolds and returns with a small, deliberate delay. */
export function sheetOpenness(phase: number, sheet: number): number {
  'worklet';
  const unfolding = ease((phase - 1.2 - sheet * 0.16) / 1.7);
  const folding = ease((phase - 4.8 - sheet * 0.1) / 2);
  return unfolding * (1 - folding);
}
