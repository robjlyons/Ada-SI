export const XP_PER_TOOL = 100
export const XP_PER_LEVEL = 300

export type ProgressionSnapshot = {
  level: number
  totalXp: number
  xpInLevel: number
  xpToNextLevel: number
  xpGained: number
}

export function getProgression(toolCount: number, xpGained = XP_PER_TOOL): ProgressionSnapshot {
  const totalXp = toolCount * XP_PER_TOOL
  const level = Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1)
  const xpInLevel = totalXp % XP_PER_LEVEL
  const xpToNextLevel = XP_PER_LEVEL - xpInLevel

  return {
    level,
    totalXp,
    xpInLevel,
    xpToNextLevel: xpInLevel === 0 && totalXp > 0 ? XP_PER_LEVEL : xpToNextLevel,
    xpGained,
  }
}

export function getXpProgressPercent(progression: ProgressionSnapshot): number {
  if (progression.totalXp > 0 && progression.xpInLevel === 0) return 100
  return Math.round((progression.xpInLevel / XP_PER_LEVEL) * 100)
}

export function didLevelUp(beforeCount: number, afterCount: number): boolean {
  if (afterCount <= beforeCount) return false
  const before = getProgression(beforeCount)
  const after = getProgression(afterCount)
  return after.level > before.level
}
