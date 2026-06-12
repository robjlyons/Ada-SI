import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../state/store'
import { getProgression, getXpProgressPercent } from '../../state/progression'
import { AiVisualizerAvatar } from '../visualizer/AiVisualizerAvatar'
import { useVisualizerActivity } from '../visualizer/useVisualizerActivity'

export function PlayerStatsBar() {
  const playerProgress = useAppStore((s) => s.playerProgress)
  const lastXpGainAt = useAppStore((s) => s.lastXpGainAt)
  const tools = useAppStore((s) => s.tools)
  const activity = useVisualizerActivity()
  const [xpPulse, setXpPulse] = useState(false)

  const progression = useMemo(
    () => getProgression(playerProgress.totalXp),
    [playerProgress.totalXp],
  )
  const progressPct = getXpProgressPercent(progression)

  useEffect(() => {
    if (!lastXpGainAt) return
    setXpPulse(true)
    const timer = window.setTimeout(() => setXpPulse(false), 900)
    return () => window.clearTimeout(timer)
  }, [lastXpGainAt])

  return (
    <div className="player-stats-bar" title="ADA · Powered by LiteLLM">
      <AiVisualizerAvatar />

      <div className="player-stats-body">
        <div className="player-stats-top">
          <div className="player-stats-identity">
            <span className="player-stats-name">ADA</span>
            <span className="player-stats-subtitle">{progression.rankTitle}</span>
          </div>

          <div className="player-stats-badges">
            <span className="player-level-badge">
              {progression.isMaxLevel ? 'Lv. 50 MAX' : `Lv. ${progression.level}`}
            </span>
            <span className="player-skill-count">
              {tools.length} skill{tools.length === 1 ? '' : 's'}
            </span>
            <span className="player-chat-count">
              {playerProgress.chatsCompleted} chat{playerProgress.chatsCompleted === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="player-xp-row">
          <div
            className={`player-xp-bar${xpPulse ? ' xp-pulse' : ''}`}
            role="progressbar"
            aria-valuenow={progression.xpInLevel}
            aria-valuemin={0}
            aria-valuemax={progression.isMaxLevel ? progression.xpInLevel : progression.xpToNextLevel}
            aria-label={`Level ${progression.level} progress`}
          >
            <span
              className="player-xp-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="player-xp-label">
            {progression.isMaxLevel
              ? 'MAX LEVEL'
              : `${progression.xpInLevel} / ${progression.xpToNextLevel} XP`}
          </span>
        </div>

        <div className="player-stats-footer">
          <span className={`player-status-pill status-${activity.mode}`}>
            {activity.statusLabel}
          </span>
          <span className="player-stats-total-xp">{progression.totalXp} total XP</span>
        </div>
      </div>
    </div>
  )
}
