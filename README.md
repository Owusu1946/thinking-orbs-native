# thinking-orbs-native

React Native implementation of the [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) indicator family.

The first native renderer is the `breathing` / “thinking” variant. It uses React Native Skia for drawing and Reanimated for a UI-thread animation clock, avoiding per-frame React renders. Every orb is submitted as one batched Skia atlas draw.

## Requirements

- React Native Skia
- React Native Reanimated
- React Native Worklets when required by your Reanimated version

Install versions compatible with your React Native or Expo SDK. For a current bare React Native app:

```bash
npm install thinking-orbs-native @shopify/react-native-skia react-native-reanimated react-native-worklets
```

```tsx
import { ThinkingOrb } from 'thinking-orbs-native';

<ThinkingOrb state="breathing" size={64} theme="dark" />
```

Supported props in the first milestone are `state="breathing"`, `size={64 | 20}`, `theme`, `speed`, `paused`, `style`, `accessibilityLabel`, and `testID`.

This package is MIT licensed.
