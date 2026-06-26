import { useEffect } from 'react'
import { useAgentBootstrap } from '../../hooks/useAgentBootstrap'
import { useAppStore } from '../../state/store'
import { PlayerStatsBar } from './PlayerStatsBar'

export function ModelToolbar() {
  const openSettings = useAppStore((s) => s.openSettings)
  const startNewChat = useAppStore((s) => s.startNewChat)
  const models = useAppStore((s) => s.models)
  const { loadAgents } = useAgentBootstrap()

  useEffect(() => {
    void loadAgents()
  }, [])

  return (
    <header className="header glass-panel">
      <PlayerStatsBar />

      <div className="toolbar toolbar-compact">
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn-secondary btn-sm toolbar-api-keys-btn"
            title="Configure LLM and ElevenLabs API keys"
            onClick={() => openSettings('api-keys')}
          >
            API keys
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Settings"
            aria-label="Open settings"
            onClick={() => openSettings('agents')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Reload agents"
            aria-label="Reload agents"
            onClick={() => void loadAgents()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={startNewChat}>
            New quest
          </button>
          {models.length === 0 ? (
            <span className="toolbar-hint">No models — add keys via API keys</span>
          ) : null}
        </div>
      </div>
    </header>
  )
}
