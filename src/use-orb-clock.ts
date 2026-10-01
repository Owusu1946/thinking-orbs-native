import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import type { FrameInfo } from 'react-native-reanimated';

/** Stop scheduling idle frames while preserving the animation's elapsed time. */
export function useOrbClock(speed: number, paused: boolean) {
  const startupReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(startupReducedMotion);
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');
  const time = useSharedValue(0.6);
  const rate = Number.isFinite(speed) && speed > 0 ? speed : 0;
  const frameCallback = useFrameCallback(useCallback((frameInfo: FrameInfo) => {
    'worklet';
    // The first frame after activation has no delta. Resume without advancing the phase.
    const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, 48) / 1000;
    time.value += delta * rate;
  }, [rate, time]), false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    setAppActive(AppState.currentState === 'active');
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (next) => {
      preferenceChanged = true;
      setReducedMotion(next);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((next) => {
      if (mounted && !preferenceChanged) setReducedMotion(next);
    }, () => {
      // Keep Reanimated's startup preference if the platform query fails.
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    frameCallback.setActive(appActive && !paused && !reducedMotion && rate > 0);
  }, [appActive, frameCallback, paused, rate, reducedMotion]);

  return { time, reducedMotion };
}
