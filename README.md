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

## Publishing

In the npm settings for `@mhaadi/thinking-orbs-native`, add a [trusted publisher](https://docs.npmjs.com/trusted-publishers/) for GitHub Actions with these values:

- Organization or user: `mhaadiabu`
- Repository: `thinking-orbs-native`
- Workflow filename: `release.yml`
- Environment name: leave blank
- Allowed actions: enable direct publishing with `npm publish`

The workflow authenticates through GitHub OIDC. No `NPM_TOKEN` secret is needed.

Update `package.json` to the release version, commit it, and push a matching tag such as `v0.1.2`. The `release.yml` workflow checks the version, installs dependencies, typechecks, and publishes the root package with provenance. The existing `prepublishOnly` script builds and validates the package before upload. Prerelease versions publish under the `next` npm tag; stable versions use `latest`.

This package is MIT licensed.
