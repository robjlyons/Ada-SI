import { AVATAR_PALETTE } from '../../theme/avatarPalette'

export const VISUALIZER_COLORS = {
  bg: AVATAR_PALETTE.bg,
  accent: AVATAR_PALETTE.accent,
  accentBright: AVATAR_PALETTE.accentBright,
  teal: AVATAR_PALETTE.teal,
  tealBright: AVATAR_PALETTE.tealBright,
  gold: AVATAR_PALETTE.gold,
  goldBright: AVATAR_PALETTE.goldBright,
  goldDeep: AVATAR_PALETTE.goldDeep,
  core: AVATAR_PALETTE.core,
  ringCool: AVATAR_PALETTE.ringCool,
  ringWarm: AVATAR_PALETTE.ringWarm,
  line: AVATAR_PALETTE.line,
  particle: AVATAR_PALETTE.particle,
} as const

export const MODE_INTENSITY = {
  idle: 0.2,
  thinking: 0.55,
  streaming: 0.88,
  building: 0.78,
  celebrating: 1,
} as const

export const MODE_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking',
  streaming: 'Streaming',
  building: 'Building',
  celebrating: 'Unlocked',
} as const
