import React, { useEffect, useMemo } from 'react';
import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { Canvas, Path, usePathValue } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { resolvePreset } from './engine/all-presets';
import { radiusScale } from './engine/core';
import { generateFrame } from './engine/modes';
import type { OrbFrame } from './engine/modes';
import type { ThinkingOrbProps } from './types';

const LABELS = {
  working: 'Working…', searching: 'Searching…', solving: 'Solving…', listening: 'Listening…',
  connecting: 'Connecting…', weaving: 'Weaving…', composing: 'Composing…', breathing: 'Thinking…', shaping: 'Shaping…',
} as const;
const DOT_BUCKETS = 6;
const LINE_BUCKETS = 3;

function compositeInk(white: number, alpha: number, dark: boolean) {
  'worklet';
  const clampedWhite = Math.min(1, Math.max(0, white));
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return dark ? clampedAlpha * (1 - clampedWhite) : 1 - clampedAlpha * (1 - clampedWhite);
}

function DotBucket({ bucket, dark, frame }: { bucket: number; dark: boolean; frame: SharedValue<OrbFrame> }) {
  const path = usePathValue((nextPath) => {
    'worklet';
    const dots = frame.value.dots;
    for (let index = 0; index < dots.length; index++) {
      const dot = dots[index];
      const ink = compositeInk(dot.white, dot.a ?? 1, dark);
      const dotBucket = Math.min(DOT_BUCKETS - 1, Math.floor(ink * DOT_BUCKETS));
      if (dotBucket === bucket) nextPath.addCircle(dot.x, dot.y, dot.r);
    }
  });
  const gray = Math.round(((bucket + 0.5) / DOT_BUCKETS) * 255);
  return <Path path={path} color={`rgb(${gray}, ${gray}, ${gray})`} style="fill" />;
}

function LineBucket({ bucket, dark, frame, strokeWidth }: { bucket: number; dark: boolean; frame: SharedValue<OrbFrame>; strokeWidth: number }) {
  const path = usePathValue((nextPath) => {
    'worklet';
    const lines = frame.value.lines;
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const ink = compositeInk(line.white, line.a, dark);
      const lineBucket = Math.min(LINE_BUCKETS - 1, Math.floor(ink * LINE_BUCKETS));
      if (lineBucket === bucket) {
        nextPath.moveTo(line.x1, line.y1);
        nextPath.lineTo(line.x2, line.y2);
      }
    }
  });
  const gray = Math.round(((bucket + 0.5) / LINE_BUCKETS) * 255);
  return <Path path={path} color={`rgb(${gray}, ${gray}, ${gray})`} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />;
}

export function ThinkingOrb({
  state = 'working', size = 64, theme = 'auto', speed = 1, paused = false, style, accessibilityLabel, testID,
}: ThinkingOrbProps) {
  const scheme = useColorScheme();
  const reducedMotion = useReducedMotion();
  const appState = useSharedValue(AppState.currentState === 'active' ? 1 : 0);
  const pauseValue = useSharedValue(paused ? 1 : 0);
  const animationTime = useSharedValue(0.6);
  const preset = useMemo(() => resolvePreset(state, size), [size, state]);
  const dark = theme === 'dark' || (theme === 'auto' && scheme !== 'light');
  const dotBuckets = useMemo(
    () => Array.from({ length: DOT_BUCKETS }, (_, bucket) => dark ? bucket : DOT_BUCKETS - 1 - bucket),
    [dark]
  );
  const lineBuckets = useMemo(
    () => Array.from({ length: LINE_BUCKETS }, (_, bucket) => dark ? bucket : LINE_BUCKETS - 1 - bucket),
    [dark]
  );
  const lineWidth = Math.max(0.6, (preset.options.lineW ?? 0.8) * radiusScale(size, preset.options.rsPow ?? 0.6));

  useEffect(() => { pauseValue.value = paused ? 1 : 0; }, [pauseValue, paused]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => { appState.value = next === 'active' ? 1 : 0; });
    return () => subscription.remove();
  }, [appState]);
  useFrameCallback((frameInfo) => {
    'worklet';
    if (reducedMotion || appState.value === 0 || pauseValue.value === 1) return;
    // Avoid turning a background stall or dropped frame into a visible jump.
    const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 16, 48) / 1000;
    animationTime.value += delta * preset.speed * speed;
  });

  const frame = useDerivedValue(() => {
    'worklet';
    return generateFrame(preset.mode, size, reducedMotion ? 0.6 : animationTime.value, preset.options);
  });

  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? LABELS[state]} style={[styles.container, { width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        {lineBuckets.map((bucket) => <LineBucket key={`line-${bucket}`} bucket={bucket} dark={dark} frame={frame} strokeWidth={lineWidth} />)}
        {dotBuckets.map((bucket) => <DotBucket key={`dot-${bucket}`} bucket={bucket} dark={dark} frame={frame} />)}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ container: { display: 'flex' } });
