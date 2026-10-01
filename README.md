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

## Publishing

Set the repository's `NPM_TOKEN` Actions secret to an npm token with permission to publish `@mhaadi/thinking-orbs-native` and bypass publishing 2FA.

Update `package.json` to the release version, commit it, and push a matching tag such as `v0.1.2`. The `release.yml` workflow checks the version, installs dependencies, typechecks, and publishes the root package with provenance. The existing `prepublishOnly` script builds and validates the package before upload. Prerelease versions publish under the `next` npm tag; stable versions use `latest`.

This package is MIT licensed.
