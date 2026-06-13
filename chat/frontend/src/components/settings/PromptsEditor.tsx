import { useCallback, useEffect, useRef, useState } from 'react'
import { resetPrompts, savePrompts } from '../../api/client'
import { isPromptsConfigEmpty, loadPromptsIntoStore } from '../../hooks/usePromptsLoader'
import { useAppStore } from '../../state/store'
import type { PromptsConfig } from '../../types/events'
import { PROMPT_GROUPS } from '../toolbar/promptSections'

export function PromptsEditor() {
  const prompts = useAppStore((s) => s.prompts)
  const effectivePrompts = useAppStore((s) => s.effectivePrompts)
  const promptsSaveState = useAppStore((s) => s.promptsSaveState)
  const setPrompts = useAppStore((s) => s.setPrompts)
  const setPromptsSaveState = useAppStore((s) => s.setPromptsSaveState)

  const [activeGroup, setActiveGroup] = useState(PROMPT_GROUPS[0]?.id ?? 'scout')
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const saveTimerRef = useRef<number | null>(null)
  const latestPromptsRef = useRef(prompts)
  const canSaveRef = useRef(false)

  useEffect(() => {
    latestPromptsRef.current = prompts
  }, [prompts])

  const fetchPrompts = useCallback(async () => {
    setLoadState('loading')
    setLoadError('')
    try {
      await loadPromptsIntoStore()
      canSaveRef.current = true
      setLoadState('ready')
    } catch (error) {
      canSaveRef.current = false
      setLoadState('error')
      setLoadError((error as Error).message)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const current = useAppStore.getState().prompts
      if (!isPromptsConfigEmpty(current)) {
        canSaveRef.current = true
        setLoadState('ready')
        return
      }

      setLoadState('loading')
      setLoadError('')
      try {
        await loadPromptsIntoStore()
        if (!cancelled) {
          canSaveRef.current = true
          setLoadState('ready')
        }
      } catch (error) {
        if (!cancelled) {
          canSaveRef.current = false
          setLoadState('error')
          setLoadError((error as Error).message)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [fetchPrompts])

  const scheduleSave = (next: PromptsConfig) => {
    if (!canSaveRef.current) return
    latestPromptsRef.current = next
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }
    setPromptsSaveState('saving')
    saveTimerRef.current = window.setTimeout(() => {
      void savePrompts(next)
        .then((saved) => {
          setPrompts(saved.prompts, saved.effective)
          setPromptsSaveState('saved')
        })
        .catch((error: Error) => {
          setPromptsSaveState('error', error.message)
        })
    }, 600)
  }

  const updatePrompt = (key: keyof PromptsConfig, value: string) => {
    const next = { ...latestPromptsRef.current, [key]: value }
    setPrompts(next, effectivePrompts)
    scheduleSave(next)
  }

  const handleReset = () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setPromptsSaveState('saving')
    void resetPrompts()
      .then((saved) => {
        setPrompts(saved.prompts, saved.effective)
        setPromptsSaveState('saved')
        canSaveRef.current = true
        setLoadState('ready')
      })
      .catch((error: Error) => {
        setPromptsSaveState('error', error.message)
      })
  }

  const saveLabel =
    promptsSaveState.status === 'saving'
      ? 'Saving…'
      : promptsSaveState.status === 'saved'
        ? 'Saved'
        : promptsSaveState.status === 'error'
          ? `Save failed: ${promptsSaveState.message}`
          : ''

  const currentGroup = PROMPT_GROUPS.find((group) => group.id === activeGroup) ?? PROMPT_GROUPS[0]

  if (loadState === 'loading') {
    return (
      <div className="prompts-editor">
        <p className="settings-section-desc">Loading prompts from server…</p>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="prompts-editor">
        <p className="settings-load-error">Could not load prompts: {loadError}</p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => void fetchPrompts()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="prompts-editor">
      <div className="settings-section-header">
        <div>
          <h3>Model prompts &amp; rules</h3>
          <p className="settings-section-desc">
            System instructions for the Scout agent and Forge master. Edits save to the server and
            apply to the next chat message or skill build.
          </p>
        </div>
        <div className="forger-guidance-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => void fetchPrompts()}>
            Reload
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={handleReset}>
            Reset to defaults
          </button>
          {saveLabel ? (
            <span
              className={`forger-guidance-save${promptsSaveState.status === 'error' ? ' error' : ''}`}
            >
              {saveLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="prompts-tabs" role="tablist" aria-label="Prompt groups">
        {PROMPT_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={group.id === activeGroup}
            className={`prompts-tab${group.id === activeGroup ? ' active' : ''}`}
            onClick={() => setActiveGroup(group.id)}
          >
            {group.title}
          </button>
        ))}
      </div>

      {currentGroup ? (
        <div className="prompts-group">
          <h4 className="prompts-group-title">{currentGroup.title}</h4>
          <p className="forger-guidance-hint">{currentGroup.description}</p>

          {currentGroup.sections.map((section) => (
            <div key={section.key} className="forger-guidance-section">
              <label htmlFor={`prompt-${section.key}`}>{section.label}</label>
              <p className="forger-guidance-hint">{section.hint}</p>
              <textarea
                id={`prompt-${section.key}`}
                rows={section.rows}
                value={prompts[section.key] ?? ''}
                onChange={(e) => updatePrompt(section.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
