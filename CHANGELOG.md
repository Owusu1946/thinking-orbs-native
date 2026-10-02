# Changelog

## Unreleased

Added `state="imagining"` for generating ideas and exploring possibilities. A dotted sphere unfolds into three curved sheets and returns in an eight-second loop, with a simplified 20px preset and an open static pose for reduced motion. Imagining is available in the docs gallery and playground.

The exported `resolvePreset` result now includes `stillTime`. Existing states keep their previous reduced-motion pose.

## 0.1.2 - October 1, 2026

### More accurate visuals

Dots and connections now keep their transparency, grayscale, and overlap order. Faint marks no longer become opaque blocks, and shape transitions follow the original Thinking Orbs engine more closely.

### Less work while idle

Orbs stop scheduling animation frames when paused, when the app is inactive, or when reduced motion is enabled. Changes to the system's reduced-motion setting take effect while the app is running. Resuming continues from the saved animation position.

A zero, negative, or non-finite speed also stops the animation clock.

### Faster animation calculations

Connecting reuses node positions, and shaping reuses precomputed outlines. Both states do less computation each frame without changing their appearance.

The public API is unchanged. Update the package to use these fixes.

[View release](https://github.com/mhaadiabu/thinking-orbs-native/releases/tag/v0.1.2)

## 0.1.1 - August 9, 2026

All nine Thinking Orbs states are available in React Native, using Skia and Reanimated to render animations on the UI thread.

Choose a state, size, and theme. Adjust the animation speed or pause it, and provide an accessibility label when needed.

[View release](https://github.com/mhaadiabu/thinking-orbs-native/releases/tag/0.1.1)
