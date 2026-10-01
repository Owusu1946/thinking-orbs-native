# Changelog

## 0.1.2 - 2026-10-01

### Fixed

- Match upstream orb geometry with the correct radius floor, opacity cutoff, depth order, and 160-point shaping outline. [#5](https://github.com/mhaadiabu/thinking-orbs-native/pull/5)
- Preserve each mark's opacity, grayscale, and overlap order with Skia pictures. Update the docs preview to use the same transparent ink and line caps. [#6](https://github.com/mhaadiabu/thinking-orbs-native/pull/6)

### Performance

- Stop scheduling animation frames while paused, inactive, or using reduced motion. Respond to reduced-motion changes while the app is running and preserve elapsed time on resume. Zero, negative, and non-finite speeds stop the clock. [#7](https://github.com/mhaadiabu/thinking-orbs-native/pull/7)
- Reuse projected nodes and cached shaping outlines to reduce geometry computation. Wrap negative shaping time before selecting cached outlines. [#8](https://github.com/mhaadiabu/thinking-orbs-native/pull/8)

The public API is unchanged.

[Compare with 0.1.1](https://github.com/mhaadiabu/thinking-orbs-native/compare/0.1.1...v0.1.2)

## 0.1.1 - 2026-08-09

First tagged release of the React Native package, with nine orb states rendered using React Native Skia and Reanimated.

[Release history](https://github.com/mhaadiabu/thinking-orbs-native/commits/0.1.1)
