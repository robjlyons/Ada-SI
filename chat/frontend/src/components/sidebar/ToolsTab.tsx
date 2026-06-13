import { deleteTool } from '../../api/client'
import { IconSkill, IconSparkle, IconTrash } from '../icons/GamifiedIcons'
import { useToolBuildStream } from '../../hooks/useToolBuildStream'
import { useAppStore } from '../../state/store'
import type { ToolSummary } from '../../types/events'

function ToolsEmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <IconSparkle size={24} />
      </div>
      <p className="empty-state-title">No skills unlocked yet</p>
      <p className="empty-state-text">Forge a skill in chat and it will appear in your loadout.</p>
    </div>
  )
}

type ToolsTabProps = {
  tools: ToolSummary[]
}

export function ToolsTab({ tools }: ToolsTabProps) {
  const setStatus = useAppStore((s) => s.setStatus)
  const recentlyUnlockedTool = useAppStore((s) => s.recentlyUnlockedTool)
  const openSkillApp = useAppStore((s) => s.openSkillApp)
  const { refreshTools, refreshPackages } = useToolBuildStream()

  const handleDelete = async (toolName: string) => {
    if (!confirm(`Remove skill "${toolName}" from your loadout? This cannot be undone.`)) return
    try {
      await deleteTool(toolName)
      await refreshTools()
      await refreshPackages()
      setStatus(`Skill "${toolName}" removed from loadout.`)
    } catch (error) {
      setStatus(`Remove failed: ${(error as Error).message}`, true)
    }
  }

  if (tools.length === 0) {
    return <ToolsEmptyState />
  }

  return (
    <>
      {tools.map((tool) => {
        const isInteractive = tool.kind === 'interactive'
        const label = tool.display_name || tool.name
        return (
          <div
            key={tool.name}
            className={`tool-card${recentlyUnlockedTool === tool.name ? ' tool-card-unlocked' : ''}${isInteractive ? ' tool-card-interactive' : ''}`}
            data-tool-name={tool.name}
          >
            <button
              type="button"
              className="tool-delete-btn"
              title="Remove skill"
              aria-label={`Remove skill ${tool.name}`}
              onClick={() => void handleDelete(tool.name)}
            >
              <IconTrash />
            </button>
            <div className="tool-card-header">
              <span className="tool-card-icon">
                <IconSkill />
              </span>
              <h3 className="tool-card-name">{label}</h3>
              {isInteractive && <span className="tool-card-app-badge">App</span>}
              {recentlyUnlockedTool === tool.name && (
                <span className="tool-card-new-badge">New unlock</span>
              )}
            </div>
            <p className="tool-card-desc">{tool.description || 'No skill description yet.'}</p>
            {isInteractive && (
              <button
                type="button"
                className="btn-primary btn-sm tool-card-open-btn"
                onClick={() => openSkillApp(tool.name)}
              >
                Open app
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
