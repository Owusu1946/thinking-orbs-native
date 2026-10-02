# thinking-orbs-native

React Native implementation of the [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) indicator family.

The native renderer supports all nine states from the web package plus the native package's Focusing state. Reanimated builds and records each frame on the UI thread, and React Native Skia draws the resulting picture without per-frame React renders. The renderer reuses two paints and one picture recorder, preserving each dot's radius, grayscale, opacity, and depth order without creating a React component per dot.

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

Supported states are `working`, `searching`, `solving`, `listening`, `connecting`, `weaving`, `composing`, `breathing`, `shaping`, and `focusing`. Supported props are `state`, `size={64 | 20}`, `theme`, `speed`, `paused`, `style`, `accessibilityLabel`, and `testID`.

Use `focusing` when an AI is synthesizing gathered information into an answer:

```tsx
<ThinkingOrb state="focusing" size={64} />;
```

Dotted trails drift, align into a halo around a bright center, and gently separate over a six-second loop at the default speed. Alignment represents organized thought, not completion or measured progress. The 20px preset uses fewer trails and omits background particles to stay readable. Both sizes support the existing themes, speed, pause, and reduced-motion behavior.

The animation stops scheduling frames while paused, while the app is inactive, or when reduced motion is enabled. Changes to the system's reduced-motion setting take effect while the app is running. Pausing preserves elapsed time, and resuming continues from that position. A zero, negative, or non-finite `speed` also stops the clock.

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

## Developing

```bash
pnpm install
pnpm --filter @mhaadi/thinking-orbs-native-docs dev
```

The docs gallery and playground use the same geometry engine as the native component. Run `pnpm test` for engine checks, `pnpm typecheck` for the library, and `pnpm --filter @mhaadi/thinking-orbs-native-docs typecheck` for the docs. Run `pnpm pack:check` and the docs build before submitting changes. Native rendering and accessibility should also be checked in a consuming React Native app; the web playground does not verify native runtime behavior.
