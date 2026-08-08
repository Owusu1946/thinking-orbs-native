import React, { useEffect, useMemo } from 'react';
import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { Atlas, Canvas, Skia, useRSXformBuffer, useColorBuffer, useClock } from '@shopify/react-native-skia';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';
import type { SkColor, SkImage, SkRect, SkRSXform } from '@shopify/react-native-skia';
import { generateRingDot } from './engine/ring';
import { RING_PRESETS } from './engine/presets';
import type { ThinkingOrbProps } from './types';

const LABEL = 'Thinking…';

function createDotImage(): SkImage {
  const surface = Skia.Surface.MakeOffscreen(64, 64);
  if (!surface) throw new Error('Unable to create the thinking orb dot texture.');
  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setColor(Skia.Color('white'));
  canvas.drawCircle(32, 32, 32, paint);
  const image = surface.makeImageSnapshot();
  surface.dispose();
  return image;
}

function useDotTexture() {
  return useMemo(createDotImage, []);
}

export function ThinkingOrb({
  state = 'breathing',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  style,
  accessibilityLabel,
  testID,
}: ThinkingOrbProps) {
  void state;
  const scheme = useColorScheme();
  const reducedMotion = useReducedMotion();
  const appState = useSharedValue(AppState.currentState === 'active' ? 1 : 0);
  const pauseValue = useSharedValue(paused ? 1 : 0);
  const frozenTime = useSharedValue(0.6);
  const clock = useClock();
  const texture = useDotTexture();
  const preset = RING_PRESETS[size];
  const options = preset.options;
  const dotCount = Math.max(1, Math.round(options.lanes * options.bandMul) * options.segs);
  const sprites = useMemo<SkRect[]>(() => Array.from({ length: dotCount }, () => Skia.XYWHRect(0, 0, 64, 64)), [dotCount]);

  useEffect(() => {
    if (paused && pauseValue.value === 0) {
      frozenTime.value = reducedMotion ? 0.6 : (clock.value / 1000) * preset.speed * speed;
    }
    pauseValue.value = paused ? 1 : 0;
  }, [clock, frozenTime, pauseValue, paused, preset.speed, reducedMotion, speed]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && appState.value === 1) {
        frozenTime.value = reducedMotion ? 0.6 : (clock.value / 1000) * preset.speed * speed;
      }
      appState.value = next === 'active' ? 1 : 0;
    });
    return () => sub.remove();
  }, [appState, clock, frozenTime, preset.speed, reducedMotion, speed]);

  const dark = theme === 'dark' || (theme === 'auto' && scheme !== 'light');
  const transforms = useRSXformBuffer(dotCount, (transform: SkRSXform, index) => {
    'worklet';
    const time = reducedMotion ? 0.6 : (clock.value / 1000) * preset.speed * speed;
    const running = appState.value === 1 && pauseValue.value === 0;
    const dot = generateRingDot(size, running ? time : frozenTime.value, index, options);
    const scale = (dot.r * 2) / 64;
    transform.set(scale, 0, dot.x - 32 * scale, dot.y - 32 * scale);
  });
  const colors = useColorBuffer(dotCount, (color: SkColor, index) => {
    'worklet';
    const time = reducedMotion ? 0.6 : (clock.value / 1000) * preset.speed * speed;
    const running = appState.value === 1 && pauseValue.value === 0;
    const dot = generateRingDot(size, running ? time : frozenTime.value, index, options);
    const value = dark ? 1 - dot.white : dot.white;
    color[0] = value;
    color[1] = value;
    color[2] = value;
    color[3] = dot.a ?? 1;
  });

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? LABEL}
      style={[styles.container, { width: size, height: size }, style]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Atlas image={texture} sprites={sprites} transforms={transforms} colors={colors} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { display: 'flex' },
});
