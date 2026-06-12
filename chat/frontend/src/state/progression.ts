export const MAX_LEVEL = 50

export const XP_CHAT_COMPLETE = 30
export const XP_SKILL_UNLOCK = 180

export type XpSource = 'chat' | 'skill'

export type ProgressionSnapshot = {
  level: number
  totalXp: number
  xpInLevel: number
  xpToNextLevel: number
  xpGained: number
  xpProgressPercent: number
  isMaxLevel: boolean
  rankTitle: string
}

function xpForLevelUp(level: number): number {
  return Math.floor(100 + (level - 1) * 18)
}

function buildLevelThresholds(): number[] {
  const thresholds = [0]
  let cumulative = 0
  for (let level = 1; level < MAX_LEVEL; level += 1) {
    cumulative += xpForLevelUp(level)
    thresholds.push(cumulative)
  }
  return thresholds
}

export const LEVEL_THRESHOLDS = buildLevelThresholds()

export function getMaxTotalXp(): number {
  return LEVEL_THRESHOLDS[MAX_LEVEL - 1] ?? 0
}

const RANK_TITLES = [
  { minLevel: 1, title: 'Initiate' },
  { minLevel: 11, title: 'Operator' },
  { minLevel: 21, title: 'Architect' },
  { minLevel: 31, title: 'Synthesist' },
  { minLevel: 41, title: 'Apex' },
] as const

export function getRankTitle(level: number): string {
  let title: string = RANK_TITLES[0].title
  for (const rank of RANK_TITLES) {
    if (level >= rank.minLevel) title = rank.title
  }
  return title
}

export function getProgression(totalXp: number, xpGained = 0): ProgressionSnapshot {
  const cappedXp = Math.min(Math.max(0, totalXp), getMaxTotalXp())
  let level = 1

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (cappedXp >= LEVEL_THRESHOLDS[i]!) {
      level = i + 1
      break
    }
  }

  const isMaxLevel = level >= MAX_LEVEL
  const levelFloor = LEVEL_THRESHOLDS[level - 1] ?? 0
  const xpInLevel = cappedXp - levelFloor
  const xpToNextLevel = isMaxLevel ? 0 : xpForLevelUp(level)

  const xpProgressPercent = isMaxLevel
    ? 100
    : xpToNextLevel > 0
      ? Math.round((xpInLevel / xpToNextLevel) * 100)
      : 0

  return {
    level,
    totalXp: cappedXp,
    xpInLevel,
    xpToNextLevel,
    xpGained,
    xpProgressPercent,
    isMaxLevel,
    rankTitle: getRankTitle(level),
  }
}

export function getXpProgressPercent(progression: ProgressionSnapshot): number {
  return progression.xpProgressPercent
}

export function didLevelUp(beforeXp: number, afterXp: number): boolean {
  if (afterXp <= beforeXp) return false
  const before = getProgression(beforeXp)
  const after = getProgression(afterXp)
  return after.level > before.level
}

export function xpGrantAmount(source: XpSource): number {
  return source === 'chat' ? XP_CHAT_COMPLETE : XP_SKILL_UNLOCK
}
