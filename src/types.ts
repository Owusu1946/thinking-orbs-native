export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping';
export type OrbSize = 64 | 20;
export type OrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
  style?: object;
  accessibilityLabel?: string;
  testID?: string;
}
