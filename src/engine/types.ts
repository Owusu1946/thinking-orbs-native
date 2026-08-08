export interface Dot {
  x: number;
  y: number;
  z: number;
  r: number;
  white: number;
  a?: number;
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
