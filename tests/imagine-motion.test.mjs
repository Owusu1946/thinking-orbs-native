import assert from 'node:assert/strict';
import { test } from 'node:test';
import { imaginePhase, sheetOpenness, IMAGINE_STILL_TIME } from '../dist/engine/imagine-phase.js';
import { imaginePoint } from '../dist/engine/imagine-surface.js';

test('imagining staggers unfolding and folding, then rests closed', () => {
  const openings = [0, 1, 2].map(sheet => sheetOpenness(2, sheet));
  assert.ok(openings[0] > openings[1] && openings[1] > openings[2]);
  const closings = [0, 1, 2].map(sheet => sheetOpenness(5.8, sheet));
  assert.ok(closings[0] < closings[1] && closings[1] < closings[2]);
  for (let sheet = 0; sheet < 3; sheet++) {
    assert.equal(sheetOpenness(0, sheet), 0);
    assert.equal(sheetOpenness(7.5, sheet), 0);
    assert.equal(sheetOpenness(IMAGINE_STILL_TIME, sheet), 1);
  }
});

test('imagining wraps time consistently, including reverse and long playback', () => {
  for (const time of [-80, -8, 0, 8, 800]) assert.equal(imaginePhase(time), 0);
  assert.equal(imaginePhase(-0.5), 7.5);
  assert.equal(imaginePhase(800.5), 0.5);
});

test('sheet easing settles smoothly at every transition', () => {
  const epsilon = 0.0001;
  for (let sheet = 0; sheet < 3; sheet++) {
    for (const boundary of [1.2 + sheet * 0.16, 2.9 + sheet * 0.16, 4.8 + sheet * 0.1, 6.8 + sheet * 0.1]) {
      const before = sheetOpenness(boundary - epsilon, sheet);
      const after = sheetOpenness(boundary + epsilon, sheet);
      assert.ok(Math.abs(after - before) < 0.000001);
    }
  }
});

test('surface samples retain a central opening in the unfolded pose', () => {
  for (const [lanes, segments] of [[4, 26], [1, 10]]) {
    for (let sheet = 0; sheet < 3; sheet++) {
      for (let lane = 0; lane < lanes; lane++) {
        for (let segment = 0; segment < segments; segment++) {
          const [x, y, z] = imaginePoint(sheet, lane, lanes, segment, segments, 1);
          assert.ok(Math.hypot(x, y) > 0.3);
          assert.ok(Math.hypot(x, y, z) < 1);
        }
      }
    }
  }
});
