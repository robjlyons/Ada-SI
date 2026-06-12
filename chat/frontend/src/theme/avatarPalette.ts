export const AVATAR_PALETTE = {
  bg: '#060810',
  accent: '#5b8cff',
  accentBright: '#9ec5ff',
  accentUi: '#4ecdc4',
  accentUiHover: '#7dffd4',
  teal: '#2dd4a8',
  tealBright: '#7dffd4',
  gold: '#ffd166',
  goldBright: '#ffe8a8',
  goldDeep: '#c9922e',
  core: '#ffffff',
  ringCool: '#b8d4ff',
  ringWarm: '#ffcc66',
  line: '#6ecfff',
  particle: '#fff4d6',
} as const

export type AvatarPalette = typeof AVATAR_PALETTE
