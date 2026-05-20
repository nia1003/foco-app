export type BlurTint = 'light' | 'dark';

export interface ThemeSurfaces {
  blurTint: BlurTint;
  shadowColor: string;

  frostOverlay: string;
  frostSheen: string;
  frostBorder: string;

  pillBg: string;
  pillBorder: string;
  pillActiveBg: string;
  pillActiveBorder: string;

  panelBg: string;
  panelBorder: string;
  rowActive: string;
  divider: string;
  dividerStrong: string;

  inputBg: string;
  emojiCellBg: string;
  emojiCellActive: string;

  barBtnBg: string;
  barBtnBorder: string;
  avatarBadge: string;

  chartTrack: string;
  chartGrid: string;
  sessionDot: string;

  ctaBg: string;
  ctaText: string;

  /** Opaque modal scrim + sheet (avoids see-through text behind) */
  modalBackdrop: string;
  modalSheetBg: string;
  modalInsetBg: string;
}

export const lightSurfaces: ThemeSurfaces = {
  blurTint: 'light',
  shadowColor: 'rgb(60,40,80)',

  frostOverlay: 'rgba(255,255,255,0.48)',
  frostSheen: 'rgba(255,255,255,0.32)',
  frostBorder: 'rgba(255,255,255,0.75)',

  pillBg: 'rgba(255,255,255,0.78)',
  pillBorder: 'rgba(255,255,255,0.60)',
  pillActiveBg: 'rgba(242,206,220,0.55)',
  pillActiveBorder: 'rgba(181,96,122,0.20)',

  panelBg: 'rgba(255,255,255,0.55)',
  panelBorder: 'rgba(255,255,255,0.65)',
  rowActive: 'rgba(242,206,220,0.25)',
  divider: 'rgba(20,16,28,0.06)',
  dividerStrong: 'rgba(20,16,28,0.08)',

  inputBg: 'transparent',
  emojiCellBg: 'rgba(20,16,28,0.04)',
  emojiCellActive: 'rgba(242,206,220,0.5)',

  barBtnBg: 'rgba(255,255,255,0.7)',
  barBtnBorder: 'rgba(20,16,28,0.08)',
  avatarBadge: '#c4b5d6',

  chartTrack: 'rgba(20,16,28,0.08)',
  chartGrid: 'rgba(20,16,28,0.06)',
  sessionDot: 'rgba(20,16,28,0.18)',

  ctaBg: '#111111',
  ctaText: '#ffffff',

  modalBackdrop: 'rgba(0,0,0,0.62)',
  modalSheetBg: '#ffffff',
  modalInsetBg: '#f0eeec',
};

export const darkSurfaces: ThemeSurfaces = {
  blurTint: 'dark',
  shadowColor: '#000000',

  frostOverlay: 'rgba(36,30,48,0.82)',
  frostSheen: 'rgba(255,255,255,0.06)',
  frostBorder: 'rgba(255,255,255,0.14)',

  pillBg: 'rgba(32,26,44,0.92)',
  pillBorder: 'rgba(255,255,255,0.12)',
  pillActiveBg: 'rgba(201,143,168,0.28)',
  pillActiveBorder: 'rgba(232,180,200,0.22)',

  panelBg: 'rgba(32,26,44,0.72)',
  panelBorder: 'rgba(255,255,255,0.10)',
  rowActive: 'rgba(201,143,168,0.18)',
  divider: 'rgba(255,255,255,0.08)',
  dividerStrong: 'rgba(255,255,255,0.12)',

  inputBg: 'rgba(255,255,255,0.04)',
  emojiCellBg: 'rgba(255,255,255,0.06)',
  emojiCellActive: 'rgba(201,143,168,0.35)',

  barBtnBg: 'rgba(255,255,255,0.10)',
  barBtnBorder: 'rgba(255,255,255,0.14)',
  avatarBadge: '#6a5880',

  chartTrack: 'rgba(255,255,255,0.10)',
  chartGrid: 'rgba(255,255,255,0.08)',
  sessionDot: 'rgba(255,255,255,0.35)',

  ctaBg: '#f5f2f8',
  ctaText: '#121018',

  modalBackdrop: 'rgba(0,0,0,0.78)',
  modalSheetBg: '#1c1626',
  modalInsetBg: '#262034',
};
