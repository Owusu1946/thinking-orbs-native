import React, { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { Canvas, Path, usePathValue } from '@shopify/react-native-skia';
import { runOnUI, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { resolvePreset } from './engine/all-presets';
import { radiusScale } from './engine/core';
import { createBucketFrame, DOT_STRIDE, generateBucketFrame, LINE_STRIDE } from './engine/modes';
import type { OrbBucketFrame } from './engine/modes';
import type { ThinkingOrbProps } from './types';

const LABELS = {
  working: 'Working…', searching: 'Searching…', solving: 'Solving…', listening: 'Listening…',
  connecting: 'Connecting…', weaving: 'Weaving…', composing: 'Composing…', breathing: 'Thinking…', shaping: 'Shaping…',
} as const;
const DOT_BUCKETS = 6;
const LINE_BUCKETS = 3;

function DotBucket({ bucket, frame, revision }: { bucket: number; frame: SharedValue<OrbBucketFrame>; revision: SharedValue<number> }) {
  const path = usePathValue((nextPath) => {
    'worklet';
    revision.value;
    const dots = frame.value.dots[bucket];
    for (let index = 0; index < dots.length; index += DOT_STRIDE) {
      nextPath.addCircle(dots[index], dots[index + 1], dots[index + 2]);
    }
  });
  const gray = Math.round(((bucket + 0.5) / DOT_BUCKETS) * 255);
  return <Path path={path} color={`rgb(${gray}, ${gray}, ${gray})`} style="fill" />;
}

function LineBucket({ bucket, frame, revision, strokeWidth }: { bucket: number; frame: SharedValue<OrbBucketFrame>; revision: SharedValue<number>; strokeWidth: number }) {
  const path = usePathValue((nextPath) => {
    'worklet';
    revision.value;
    const lines = frame.value.lines[bucket];
    for (let index = 0; index < lines.length; index += LINE_STRIDE) {
      nextPath.moveTo(lines[index], lines[index + 1]);
      nextPath.lineTo(lines[index + 2], lines[index + 3]);
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
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
  const animationTime = useSharedValue(0.6);
  const bucketFrame = useSharedValue(createBucketFrame(DOT_BUCKETS, LINE_BUCKETS));
  const revision = useSharedValue(0);
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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => setAppIsActive(next === 'active'));
    return () => subscription.remove();
  }, []);
  const frameCallback = useFrameCallback((frameInfo) => {
    'worklet';
    // Avoid turning a background stall or dropped frame into a visible jump.
    const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 16, 48) / 1000;
    animationTime.value += delta * preset.speed * speed;
    generateBucketFrame(bucketFrame.value, preset.mode, size, animationTime.value, preset.options, dark);
    revision.value += 1;
  }, false);
  const running = !paused && !reducedMotion && appIsActive;
  const { setActive } = frameCallback;
  useEffect(() => {
    setActive(running);
    if (running) return () => setActive(false);
    runOnUI(() => {
      'worklet';
      generateBucketFrame(bucketFrame.value, preset.mode, size, reducedMotion ? 0.6 : animationTime.value, preset.options, dark);
      revision.value += 1;
    })();
    return () => setActive(false);
  }, [animationTime, bucketFrame, dark, preset, reducedMotion, revision, running, setActive, size]);

  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? LABELS[state]} style={[styles.container, { width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        {lineBuckets.map((bucket) => <LineBucket key={`line-${bucket}`} bucket={bucket} frame={bucketFrame} revision={revision} strokeWidth={lineWidth} />)}
        {dotBuckets.map((bucket) => <DotBucket key={`dot-${bucket}`} bucket={bucket} frame={bucketFrame} revision={revision} />)}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ container: { display: 'flex' } });
