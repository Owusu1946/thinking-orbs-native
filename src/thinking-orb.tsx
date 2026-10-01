import React, { useEffect, useMemo } from 'react';
import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { Canvas, PaintStyle, Picture, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { resolvePreset } from './engine/all-presets';
import { generateFrame } from './engine/modes';
import { drawOrbFrame } from './renderer';
import type { ThinkingOrbProps } from './types';

const LABELS = {
  working: 'Working…', searching: 'Searching…', solving: 'Solving…', listening: 'Listening…',
  connecting: 'Connecting…', weaving: 'Weaving…', composing: 'Composing…', breathing: 'Thinking…', shaping: 'Shaping…',
} as const;

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
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const bounds = useMemo(() => Skia.XYWHRect(0, 0, size, size), [size]);
  const paints = useMemo(() => {
    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    const stroke = Skia.Paint();
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);
    return { fill, stroke, rgba: new Float32Array(4) };
  }, []);

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

  const picture = useDerivedValue(() => {
    'worklet';
    const frame = generateFrame(preset.mode, size, reducedMotion ? 0.6 : animationTime.value, preset.options);
    const canvas = recorder.beginRecording(bounds);
    drawOrbFrame(canvas, frame, dark, paints);
    return recorder.finishRecordingAsPicture();
  });

  return (
    <View testID={testID} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? LABELS[state]} style={[styles.container, { width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ container: { display: 'flex' } });
