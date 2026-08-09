# thinking-orbs-native

React Native implementation of the [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) indicator family.

The native renderer supports all nine states from the web package. It uses React Native Skia for drawing and Reanimated for a UI-thread animation clock, avoiding per-frame React renders. Dots are grouped into a small set of persistent Skia paths so the renderer preserves the web version's radius, grayscale, opacity, and depth treatment without creating a React component per dot.

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

Supported states are `working`, `searching`, `solving`, `listening`, `connecting`, `weaving`, `composing`, `breathing`, and `shaping`. Supported props are `state`, `size={64 | 20}`, `theme`, `speed`, `paused`, `style`, `accessibilityLabel`, and `testID`.

This package is MIT licensed.

## Development

This repository is a pnpm workspace managed with Turborepo.

```bash
pnpm install
pnpm turbo run typecheck build
pnpm run release:check
```

`release:check` builds the package, validates its export map with Publint, and
prints the exact npm tarball contents without publishing it.

## Publishing

Publishing requires npm authentication for the `thinking-orbs-native` package.
After updating the version and changelog, run:

```bash
pnpm run release:check
pnpm publish
```

The package publishes compiled JavaScript and TypeScript declarations from
`dist/`, with npm provenance enabled by default.
