export interface AppBackgroundStyle {
  baseFill: string;
  glowCenter: string;
  glowMid: string;
  glowOuter: string;
  glowEdge: string;
}

export const DEFAULT_LIGHT_BACKGROUND: AppBackgroundStyle = {
  baseFill: '#f6f4f4',
  glowCenter: '#f0a8be',
  glowMid: '#f5c8d8',
  glowOuter: '#faf0f3',
  glowEdge: '#f5f4f4',
};

export const DEFAULT_DARK_BACKGROUND: AppBackgroundStyle = {
  baseFill: '#121018',
  glowCenter: '#5a3d52',
  glowMid: '#2a2234',
  glowOuter: '#121018',
  glowEdge: '#121018',
};
