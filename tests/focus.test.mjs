import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePreset } from '../dist/engine/all-presets.js';
import { generateFrame } from '../dist/engine/modes.js';

function frame(size, time) {
  const preset = resolvePreset('focusing', size);
  return generateFrame(preset.mode, size, time, preset.options);
}

for (const size of [20, 64]) {
  test(`focusing ${size}px stays visible, finite, bounded, and depth sorted`, () => {
    for (let step = 0; step <= 360; step++) {
      const result = frame(size, step / 60);
      assert.equal(result.dots.length, size === 64 ? 103 : 25);
      assert.equal(result.lines.length, 0);
      let previousDepth = -Infinity;
      for (const dot of result.dots) {
        for (const value of Object.values(dot)) assert.ok(Number.isFinite(value));
        assert.ok(dot.r >= 0.3);
        assert.ok(dot.a >= 0.02 && dot.a <= 1);
        assert.ok(dot.white >= 0 && dot.white <= 1);
        assert.ok(dot.x - dot.r >= 0 && dot.x + dot.r <= size);
        assert.ok(dot.y - dot.r >= 0 && dot.y + dot.r <= size);
        assert.ok(dot.z >= previousDepth);
        previousDepth = dot.z;
      }
    }
  });

  test(`focusing ${size}px is deterministic and repeats seamlessly`, () => {
    for (const time of [0, 0.6, 1, 2, 3, 4, 5, 6, 600]) {
      assert.deepEqual(frame(size, time), frame(size, time));
    }
    assert.deepEqual(frame(size, 0), frame(size, 6));
    assert.deepEqual(frame(size, 0), frame(size, -6));
    // Compare nearby particles spatially, independent of depth-sort tie changes.
    const before = frame(size, 6 - 0.00001).dots;
    const after = frame(size, 0.00001).dots;
    for (const dot of before) {
      const distance = Math.min(...after.map(next => Math.hypot(dot.x - next.x, dot.y - next.y, dot.z - next.z)));
      assert.ok(distance < 0.002, `Loop seam moved a dot by ${distance}`);
    }
  });

  test(`focusing ${size}px brightens on alignment and keeps a static reduced-motion frame`, () => {
    const core = time => frame(size, time).dots.find(dot => dot.x === size / 2 && dot.y === size / 2);
    assert.ok(core(3.5).a > core(0.6).a);
    assert.ok(core(3.5).white < core(0.6).white);
    assert.ok(frame(size, 0.6).dots.length > 0);
    assert.notDeepEqual(frame(size, 0.6), frame(size, 2));
    assert.equal(resolvePreset('focusing', size).speed, 1);
  });
}
