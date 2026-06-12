import { useMemo } from 'react'
import { useAppStore } from '../../state/store'
import {
  getProgression,
  getXpProgressPercent,
  XP_PER_LEVEL,
} from '../../state/progression'
import { AiVisualizerAvatar } from '../visualizer/AiVisualizerAvatar'
import { useVisualizerActivity } from '../visualizer/useVisualizerActivity'

export function PlayerStatsBar() {
  const tools = useAppStore((s) => s.tools)
  const activity = useVisualizerActivity()

  const progression = useMemo(() => getProgression(tools.length), [tools.length])
  const progressPct = getXpProgressPercent(progression)

  return (
    <div className="player-stats-bar" title="Ada-SI · Powered by LiteLLM">
      <AiVisualizerAvatar />

      <div className="player-stats-body">
        <div className="player-stats-top">
          <div className="player-stats-identity">
            <span className="player-stats-name">Ada-SI</span>
            <span className="player-stats-subtitle">Agent core</span>
          </div>

          <div className="player-stats-badges">
            <span className="player-level-badge">Lv. {progression.level}</span>
            <span className="player-skill-count">
              {tools.length} skill{tools.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="player-xp-row">
          <div
            className="player-xp-bar"
            role="progressbar"
            aria-valuenow={progression.xpInLevel}
            aria-valuemin={0}
            aria-valuemax={XP_PER_LEVEL}
            aria-label={`Level ${progression.level} progress`}
          >
            <span
              className="player-xp-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="player-xp-label">
            {progression.xpInLevel} / {XP_PER_LEVEL} XP
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
