import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchPersona,
  fetchPrompts,
  resetPersona,
  savePersonaConfig,
  savePersonaFile,
  startPersonaBootstrap,
} from '../../api/client'
import { useChatStream } from '../../hooks/useChatStream'
import { useAppStore } from '../../state/store'
import type { PersonaFileKey, PersonaResponse } from '../../types/events'

const PERSONA_TABS: Array<{ id: PersonaFileKey; label: string; hint: string }> = [
  {
    id: 'agents',
    label: 'AGENTS',
    hint: 'Operating rules, safety, memory workflow.',
  },
  {
    id: 'soul',
    label: 'SOUL',
    hint: 'Personality, tone, boundaries.',
  },
  {
    id: 'identity',
    label: 'IDENTITY',
    hint: 'Name, role, emoji, introduction style.',
  },
  {
    id: 'user',
    label: 'USER',
    hint: 'Profile of the human you assist.',
  },
  {
    id: 'tools',
    label: 'TOOLS',
    hint: 'Reference for Scout meta-tools and persona tools.',
  },
  {
    id: 'memory',
    label: 'MEMORY',
    hint: 'Curated long-term facts (Scout may update via memory_replace).',
  },
  {
    id: 'heartbeat',
    label: 'HEARTBEAT',
    hint: 'Instructions for periodic memory maintenance passes.',
  },
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function PersonaSettings() {
  const effectivePrompts = useAppStore((s) => s.effectivePrompts)
  const setPrompts = useAppStore((s) => s.setPrompts)
  const startNewChat = useAppStore((s) => s.startNewChat)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const setPersonaBootstrapActive = useAppStore((s) => s.setPersonaBootstrapActive)
  const setScoutDisplayName = useAppStore((s) => s.setScoutDisplayName)
  const { sendBootstrapOpening } = useChatStream()

  const [persona, setPersona] = useState<PersonaResponse | null>(null)
  const [activeTab, setActiveTab] = useState<PersonaFileKey>('soul')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [bootstrapBusy, setBootstrapBusy] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const latestFilesRef = useRef<Record<PersonaFileKey, string> | null>(null)

  const loadPersona = useCallback(async () => {
    setLoadState('loading')
    setLoadError('')
    try {
      const [data, promptsData] = await Promise.all([fetchPersona(), fetchPrompts()])
      setPersona(data)
      latestFilesRef.current = data.files
      setPrompts(promptsData.prompts, promptsData.effective)
      if (data.display_name) {
        useAppStore.getState().setScoutDisplayName(data.display_name)
      }
      setLoadState('ready')
    } catch (error) {
      setLoadState('error')
      setLoadError((error as Error).message)
    }
  }, [setPrompts])

  useEffect(() => {
    void loadPersona()
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [loadPersona])

  const scheduleSave = (file: PersonaFileKey, content: string) => {
    if (!latestFilesRef.current) return
    latestFilesRef.current = { ...latestFilesRef.current, [file]: content }
    setPersona((prev) =>
      prev ? { ...prev, files: { ...prev.files, [file]: content } } : prev,
    )
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }
    setSaveState('saving')
    saveTimerRef.current = window.setTimeout(() => {
      void savePersonaFile(file, content)
        .then((saved) => {
          setPersona(saved)
          latestFilesRef.current = saved.files
          if (saved.display_name) {
            useAppStore.getState().setScoutDisplayName(saved.display_name)
          }
          setSaveState('saved')
        })
        .catch((error: Error) => {
          setSaveState('error')
          setSaveError(error.message)
        })
    }, 600)
  }

  const updateFile = (file: PersonaFileKey, value: string) => {
    scheduleSave(file, value)
  }

  const handleReset = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setSaveState('saving')
    void resetPersona()
      .then((saved) => {
        setPersona(saved)
        latestFilesRef.current = saved.files
        setSaveState('saved')
      })
      .catch((error: Error) => {
        setSaveState('error')
        setSaveError(error.message)
      })
  }

  const handleBootstrap = async () => {
    if (
      !window.confirm(
        'Give Scout a soul? This resets persona files, clears daily logs, and starts a bootstrap conversation in chat.',
      )
    ) {
      return
    }
    setBootstrapBusy(true)
    try {
      const result = await startPersonaBootstrap()
      setPersona(result)
      latestFilesRef.current = result.files
      startNewChat()
      setPersonaBootstrapActive(true)
      setSettingsOpen(false)
      setScoutDisplayName(result.display_name || 'Ada')
      await sendBootstrapOpening()
    } catch (error) {
      setSaveState('error')
      setSaveError((error as Error).message)
    } finally {
      setBootstrapBusy(false)
    }
  }

  const handleConfigChange = (patch: {
    heartbeat_enabled?: boolean
    heartbeat_interval_minutes?: number
  }) => {
    void savePersonaConfig(patch)
      .then((saved) => {
        setPersona(saved)
        latestFilesRef.current = saved.files
      })
      .catch((error: Error) => {
        setSaveState('error')
        setSaveError(error.message)
      })
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? `Save failed: ${saveError}`
          : ''

  const currentTab = PERSONA_TABS.find((tab) => tab.id === activeTab) ?? PERSONA_TABS[0]

  if (loadState === 'loading') {
    return (
      <div className="prompts-editor">
        <p className="settings-section-desc">Loading persona files…</p>
      </div>
    )
  }

  if (loadState === 'error' || !persona) {
    return (
      <div className="prompts-editor">
        <p className="settings-load-error">Could not load persona: {loadError}</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => void loadPersona()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="prompts-editor">
      <div className="settings-section-header">
        <div>
          <h3>Scout persona</h3>
          <p className="settings-section-desc">
            OpenClaw-style identity files injected into every Scout turn. Edit SOUL, IDENTITY,
            USER, and memory here. Tool routing stays under Model prompts.
          </p>
        </div>
        <div className="settings-header-actions">
          {saveLabel ? <span className="prompts-save-status">{saveLabel}</span> : null}
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={bootstrapBusy}
            onClick={() => void handleBootstrap()}
          >
            {bootstrapBusy ? 'Starting…' : 'Give Scout a soul'}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={handleReset}>
            Reset to defaults
          </button>
        </div>
      </div>

      {persona.bootstrap_present ? (
        <p className="settings-section-desc persona-bootstrap-notice">
          Bootstrap ritual active — complete the conversation in chat, then Scout will call{' '}
          <code>bootstrap_complete</code>.
        </p>
      ) : null}

      <div className="persona-config-row">
        <label className="persona-config-label">
          <input
            type="checkbox"
            checked={persona.config.heartbeat_enabled}
            onChange={(event) =>
              handleConfigChange({ heartbeat_enabled: event.target.checked })
            }
          />
          Heartbeat maintenance
        </label>
        <label className="persona-config-label">
          Interval (minutes)
          <input
            type="number"
            min={1}
            max={1440}
            className="persona-interval-input"
            value={persona.config.heartbeat_interval_minutes}
            onChange={(event) =>
              handleConfigChange({
                heartbeat_interval_minutes: Math.max(1, Number(event.target.value) || 30),
              })
            }
          />
        </label>
      </div>

      <div className="prompts-group-tabs">
        {PERSONA_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`prompts-group-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="settings-section-desc">{currentTab.hint}</p>

      <textarea
        className="prompts-textarea"
        rows={16}
        value={persona.files[activeTab] ?? ''}
        onChange={(event) => updateFile(activeTab, event.target.value)}
        spellCheck={false}
      />

      <details className="persona-composed-preview">
        <summary>Composed Scout system prompt (preview)</summary>
        <pre className="persona-composed-pre">
          {effectivePrompts.scout_composed_system || '(reload prompts to preview)'}
        </pre>
      </details>
    </div>
  )
}
