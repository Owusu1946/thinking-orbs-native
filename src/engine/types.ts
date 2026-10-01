export interface Dot {
  x: number;
  y: number;
  z: number;
  r: number;
  white: number;
  a?: number;
}

export interface FrameLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  white: number;
  a: number;
  w: number;
}

export interface OrbFrame {
  dots: Dot[];
  lines: FrameLine[];
}

export type RingOptions = {
  lanes: number;
  segs: number;
  rBase: number;
  rDepth: number;
  rsPow: number;
  rMin: number;
  spin: number;
  bandMul: number;
  wobMul: number;
  faceOn: number;
  rSizeMul: number;
};
