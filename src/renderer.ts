import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';
import type { OrbFrame } from './engine/types';

interface OrbPaints {
  fill: SkPaint;
  stroke: SkPaint;
  rgba: Float32Array;
}

function setInk(paint: SkPaint, rgba: Float32Array, white: number, alpha: number, dark: boolean) {
  'worklet';
  const clampedWhite = Math.min(1, Math.max(0, white));
  const gray = Math.round((dark ? 1 - clampedWhite : clampedWhite) * 255) / 255;
  rgba[0] = gray;
  rgba[1] = gray;
  rgba[2] = gray;
  rgba[3] = alpha;
  paint.setColor(rgba);
}

/** Draw a finalized frame with the original opacity and far-to-near dot order. */
export function drawOrbFrame(canvas: SkCanvas, frame: OrbFrame, dark: boolean, paints: OrbPaints) {
  'worklet';
  const { fill, stroke, rgba } = paints;
  for (let index = 0; index < frame.lines.length; index++) {
    const line = frame.lines[index];
    setInk(stroke, rgba, line.white, line.a, dark);
    stroke.setStrokeWidth(line.w);
    canvas.drawLine(line.x1, line.y1, line.x2, line.y2, stroke);
  }
  for (let index = 0; index < frame.dots.length; index++) {
    const dot = frame.dots[index];
    setInk(fill, rgba, dot.white, dot.a ?? 1, dark);
    canvas.drawCircle(dot.x, dot.y, dot.r, fill);
  }
}
