import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePreset, STATE_TO_MODE } from '../dist/engine/all-presets.js';
import { generateFrame } from '../dist/engine/modes.js';

function frame(size, time) {
  const preset = resolvePreset('imagining', size);
  return generateFrame(preset.mode, size, time, preset.options);
}

for (const size of [20, 64]) {
  test(`imagining ${size}px remains finite, bounded, and depth sorted throughout its loop`, () => {
    for (let step = 0; step <= 480; step++) {
      const result = frame(size, step / 60);
      assert.equal(result.dots.length, size === 64 ? 312 : 30);
      assert.equal(result.lines.length, 0);
      let previousDepth = -Infinity;
      for (const dot of result.dots) {
        assert.ok(Object.values(dot).every(Number.isFinite));
        assert.ok(dot.r >= 0.3);
        assert.ok(dot.white >= 0 && dot.white <= 1);
        assert.ok(dot.a >= 0.02 && dot.a <= 1);
        assert.ok(dot.x - dot.r >= 0 && dot.x + dot.r <= size);
        assert.ok(dot.y - dot.r >= 0 && dot.y + dot.r <= size);
        assert.ok(dot.z >= previousDepth);
        previousDepth = dot.z;
      }
    }
  });

  test(`imagining ${size}px repeats without a seam or particle jump`, () => {
    assert.deepEqual(frame(size, 0), frame(size, 8));
    assert.deepEqual(frame(size, 0), frame(size, -8));
    assert.deepEqual(frame(size, 0.6), frame(size, 0.6));
    for (const time of [0, 1.2, 1.36, 1.52, 2.9, 3.06, 3.22, 4.8, 4.9, 5, 6.8, 6.9, 7]) {
      const before = frame(size, time - 0.00001).dots;
      const after = frame(size, time + 0.00001).dots;
      for (const dot of before) {
        assert.ok(after.some(next => Math.hypot(dot.x - next.x, dot.y - next.y, dot.z - next.z) < 0.002));
      }
    }
  });

  test(`imagining ${size}px reduced-motion pose has a visible central gap`, () => {
    const preset = resolvePreset('imagining', size);
    assert.equal(preset.stillTime, 3.7);
    assert.equal(preset.speed, 1);
    for (const dot of frame(size, preset.stillTime).dots) {
      assert.ok(Math.hypot(dot.x - size / 2, dot.y - size / 2) - dot.r > size * 0.07);
    }
    assert.notDeepEqual(frame(size, 0.6), frame(size, preset.stillTime));
  });
}

test('existing states retain their reduced-motion pose and generate frames at both sizes', () => {
  for (const state of Object.keys(STATE_TO_MODE)) {
    for (const size of [20, 64]) {
      const preset = resolvePreset(state, size);
      if (state !== 'imagining') assert.equal(preset.stillTime, 0.6);
      assert.ok(generateFrame(preset.mode, size, preset.stillTime, preset.options).dots.length > 0);
    }
  }
});
