import { useState } from 'react'
import { deletePipPackage, deleteTool } from '../../api/client'
import { useToolBuildStream } from '../../hooks/useToolBuildStream'
import { getProgression } from '../../state/progression'
import { useAppStore } from '../../state/store'

export function ProgressSettings() {
  const playerProgress = useAppStore((s) => s.playerProgress)
  const tools = useAppStore((s) => s.tools)
  const packages = useAppStore((s) => s.packages)
  const resetPlayerProgress = useAppStore((s) => s.resetPlayerProgress)
  const startNewChat = useAppStore((s) => s.startNewChat)
  const bumpSkillDataRevision = useAppStore((s) => s.bumpSkillDataRevision)
  const setStatus = useAppStore((s) => s.setStatus)
  const { refreshTools, refreshPackages } = useToolBuildStream()
  const [resetting, setResetting] = useState(false)

  const progression = getProgression(playerProgress.totalXp)

  const handleReset = async () => {
    const skillLabel = tools.length === 1 ? '1 skill' : `${tools.length} skills`
    const supplyLabel =
      packages.length === 1 ? '1 supply package' : `${packages.length} supply packages`
    const parts = ['your level and XP']
    if (tools.length > 0) parts.push(skillLabel)
    if (packages.length > 0) parts.push(supplyLabel)

    const message = `Reset all progress? This will clear ${parts.join(', ')}. This cannot be undone.`
    if (!window.confirm(message)) return

    setResetting(true)
    try {
      await Promise.all([
        ...tools.map((tool) => deleteTool(tool.name)),
        ...packages.map((pkg) => deletePipPackage(pkg.name)),
      ])
      resetPlayerProgress()
      startNewChat()
      bumpSkillDataRevision()
      await refreshTools()
      await refreshPackages()
      setStatus('Progress reset. Level, skills, and supplies cleared.')
    } catch (error) {
      setStatus(`Reset failed: ${(error as Error).message}`, true)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="progress-settings">
      <div className="settings-section-header">
        <div>
          <h3>Progress &amp; loadout</h3>
          <p className="settings-section-desc">
            Your level, XP, unlocked skills, and supply cache. Resetting starts you over from
            level 1 with an empty loadout.
          </p>
        </div>
      </div>

      <div className="progress-settings-summary">
        <div className="progress-settings-stat">
          <span className="progress-settings-stat-label">Level</span>
          <span className="progress-settings-stat-value">
            {progression.isMaxLevel ? '50 MAX' : progression.level}
          </span>
        </div>
        <div className="progress-settings-stat">
          <span className="progress-settings-stat-label">Total XP</span>
          <span className="progress-settings-stat-value">{progression.totalXp}</span>
        </div>
        <div className="progress-settings-stat">
          <span className="progress-settings-stat-label">Skills</span>
          <span className="progress-settings-stat-value">{tools.length}</span>
        </div>
        <div className="progress-settings-stat">
          <span className="progress-settings-stat-label">Quests</span>
          <span className="progress-settings-stat-value">{playerProgress.chatsCompleted}</span>
        </div>
        <div className="progress-settings-stat">
          <span className="progress-settings-stat-label">Supplies</span>
          <span className="progress-settings-stat-value">{packages.length}</span>
        </div>
      </div>

      <div className="progress-settings-reset">
        <p className="forger-guidance-hint">
          Permanently delete all unlocked skills, cached supply packages, and local progression
          data.
        </p>
        <button
          type="button"
          className="btn-danger btn-sm"
          disabled={resetting}
          onClick={() => void handleReset()}
        >
          {resetting ? 'Resetting…' : 'Reset progress'}
        </button>
      </div>
    </div>
  )
}
