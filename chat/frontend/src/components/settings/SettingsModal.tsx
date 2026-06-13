import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAppStore } from '../../state/store'
import { AgentsSettings } from './AgentsSettings'
import { PromptsEditor } from './PromptsEditor'

type SettingsSection = 'agents' | 'prompts'

const SETTINGS_SECTIONS: Array<{ id: SettingsSection; label: string; description: string }> = [
  {
    id: 'agents',
    label: 'Agents',
    description: 'Scout, Forge master & analysis depth',
  },
  {
    id: 'prompts',
    label: 'Model prompts',
    description: 'Scout agent & Forge master instructions',
  },
]

export function SettingsModal() {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const [activeSection, setActiveSection] = useState<SettingsSection>('agents')

  useEffect(() => {
    if (!settingsOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen, setSettingsOpen])

  return (
    <AnimatePresence>
      {settingsOpen ? (
        <motion.div
          className="settings-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="settings-backdrop"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="settings-modal glass-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <header className="settings-header">
              <div>
                <p className="settings-kicker">Command config</p>
                <h2 id="settings-title">Settings</h2>
              </div>
              <button
                type="button"
                className="btn-icon settings-close"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="settings-body">
              <nav className="settings-nav" aria-label="Settings sections">
                {SETTINGS_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`settings-nav-item${activeSection === section.id ? ' active' : ''}`}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className="settings-nav-label">{section.label}</span>
                    <span className="settings-nav-desc">{section.description}</span>
                  </button>
                ))}
              </nav>

              <div className="settings-content scroll-area">
                {activeSection === 'agents' ? <AgentsSettings /> : null}
                {activeSection === 'prompts' ? <PromptsEditor /> : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
