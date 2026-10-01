# thinking-orbs-native

React Native implementation of the [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) indicator family.

The native renderer supports all nine states from the web package. Reanimated builds and records each frame on the UI thread, and React Native Skia draws the resulting picture without per-frame React renders. The renderer reuses two paints and one picture recorder, preserving each dot's radius, grayscale, opacity, and depth order without creating a React component per dot.

## Requirements

- React Native Skia
- React Native Reanimated
- React Native Worklets when required by your Reanimated version

Install versions compatible with your React Native or Expo SDK. For a current bare React Native app:

```bash
npm install @mhaadi/thinking-orbs-native @shopify/react-native-skia react-native-reanimated react-native-worklets
```

```tsx
import { ThinkingOrb } from "@mhaadi/thinking-orbs-native";

<ThinkingOrb state="breathing" size={64} theme="dark" />;
```

Supported states are `working`, `searching`, `solving`, `listening`, `connecting`, `weaving`, `composing`, `breathing`, and `shaping`. Supported props are `state`, `size={64 | 20}`, `theme`, `speed`, `paused`, `style`, `accessibilityLabel`, and `testID`.

The animation stops scheduling frames while paused, while the app is inactive, or when reduced motion is enabled. Changes to the system's reduced-motion setting take effect while the app is running. Pausing preserves elapsed time, and resuming continues from that position. A zero, negative, or non-finite `speed` also stops the clock.

This package is MIT licensed.
