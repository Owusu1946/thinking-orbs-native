# thinking-orbs-native

React Native implementation of the [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) indicator family.

The native renderer supports all nine states from the web package. It uses React Native Skia for drawing and Reanimated for a UI-thread animation clock, avoiding per-frame React renders. Dots are grouped into a small set of persistent Skia paths so the renderer preserves the web version's radius, grayscale, opacity, and depth treatment without creating a React component per dot.

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

This package is MIT licensed.
