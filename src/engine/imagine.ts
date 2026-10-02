import { makeProj, radiusScale } from './core';
import { IMAGINE_CYCLE, imaginePhase, sheetOpenness } from './imagine-phase';
import { imaginePoint } from './imagine-surface';
import type { ModeOptions } from './profiles';
import type { Dot, OrbFrame } from './types';

const TAU = Math.PI * 2;

/** Three particle sheets unfold around a quiet central opening and return to a sphere. */
export function imagine(size: number, time: number, options: ModeOptions): OrbFrame {
  'worklet';
  const phase = imaginePhase(time);
  const rotation = phase / IMAGINE_CYCLE * TAU;
  const radius = size * 0.38;
  const scale = radiusScale(size, options.rsPow ?? 0.6);
  const lanes = options.lanes ?? 4;
  const segments = options.segs ?? 26;
  const project = makeProj(0.2, 0.22, size / 2, size / 2, radius);
  const cosRotation = Math.cos(rotation), sinRotation = Math.sin(rotation);
  const dots: Dot[] = [];

  for (let sheet = 0; sheet < 3; sheet++) {
    const openness = sheetOpenness(phase, sheet);
    const volume = 1 + 0.025 * Math.sin(rotation) * (1 - openness);
    for (let lane = 0; lane < lanes; lane++) {
      const edge = lanes === 1 ? 1 : Math.abs(lane / (lanes - 1) - 0.5) * 2;
      for (let segment = 0; segment < segments; segment++) {
        const [x, y, z] = imaginePoint(sheet, lane, lanes, segment, segments, openness);
        const point = project(
          (x * cosRotation - y * sinRotation) * volume,
          (x * sinRotation + y * cosRotation) * volume,
          z * volume,
        );
        const depth = Math.max(0, Math.min(1, (point[2] + 1) / 2));
        dots.push({
          x: point[0], y: point[1], z: point[2],
          r: ((options.rBase ?? 0.75) + (options.rDepth ?? 1.4) * depth + 0.2 * edge * openness) * scale,
          white: 0.64 - 0.5 * depth - 0.08 * edge * openness,
          a: 0.3 + 0.5 * depth + 0.15 * edge * openness,
        });
      }
    }
  }
  return { dots, lines: [] };
}
