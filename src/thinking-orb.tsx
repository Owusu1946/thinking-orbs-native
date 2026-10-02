import React, { useMemo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Canvas, PaintStyle, Picture, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { resolvePreset } from './engine/all-presets';
import { generateFrame } from './engine/modes';
import { drawOrbFrame } from './renderer';
import { useOrbClock } from './use-orb-clock';
import type { ThinkingOrbProps } from './types';

const LABELS = {
  imagining: 'Imagining…',
  working: 'Working…', searching: 'Searching…', solving: 'Solving…', listening: 'Listening…',
  connecting: 'Connecting…', weaving: 'Weaving…', composing: 'Composing…', breathing: 'Thinking…', shaping: 'Shaping…',
} as const;

export function ThinkingOrb({
  state = 'working', size = 64, theme = 'auto', speed = 1, paused = false, style, accessibilityLabel, testID,
}: ThinkingOrbProps) {
  const scheme = useColorScheme();
  const preset = useMemo(() => resolvePreset(state, size), [size, state]);
  const { time, reducedMotion } = useOrbClock(preset.speed * speed, paused);
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

  const picture = useDerivedValue(() => {
    'worklet';
    const frame = generateFrame(preset.mode, size, reducedMotion ? preset.stillTime : time.value, preset.options);
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
