import { useAppStore } from '../../state/store'
import { ProcessPanel } from '../process/ProcessPanel'
import { SidePanel } from '../sidebar/SidePanel'
import { ModelToolbar } from '../toolbar/ModelToolbar'
import { Messages } from '../chat/Messages'
import { Composer } from '../composer/Composer'
import { EffectsLayer } from '../effects/EffectsLayer'
import { SettingsModal } from '../settings/SettingsModal'

export function AppShell() {
  const feed = useAppStore((s) => s.feed)
  const showScrollBottom = useAppStore((s) => s.showScrollBottom)
  const setShowScrollBottom = useAppStore((s) => s.setShowScrollBottom)

  return (
    <div className="app-shell">
      <div className="app-shell-content">
        <ProcessPanel />
        <div className="main-column">
          <ModelToolbar />
          <div className="chat-surface glass-panel">
            <div className="messages-wrap">
              <Messages feed={feed} />
              <button
                type="button"
                className={`scroll-bottom${showScrollBottom ? '' : ' hidden'}`}
                title="Scroll to latest"
                onClick={() => setShowScrollBottom(false)}
              >
                ↓ New intel
              </button>
            </div>
            <Composer />
          </div>
        </div>
        <SidePanel />
      </div>
      <EffectsLayer />
      <SettingsModal />
    </div>
  )
}
