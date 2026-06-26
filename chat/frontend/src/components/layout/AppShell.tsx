import { useAppStore } from '../../state/store'
import { ProcessPanel } from '../process/ProcessPanel'
import { SidePanel } from '../sidebar/SidePanel'
import { ModelToolbar } from '../toolbar/ModelToolbar'
import { Messages } from '../chat/Messages'
import { Composer } from '../composer/Composer'
import { EffectsLayer } from '../effects/EffectsLayer'
import { SettingsModal } from '../settings/SettingsModal'
import { SkillAppShell } from '../skillapps/SkillAppShell'
import { ForgeBatchDock, ForgeBatchModal } from '../tools/ForgeBatchModal'

export function AppShell() {
  const feed = useAppStore((s) => s.feed)

  return (
    <div className="app-shell">
      <div className="app-shell-content">
        <ProcessPanel />
        <div className="main-column">
          <ModelToolbar />
          <div className="chat-surface glass-panel">
            <Messages feed={feed} />
            <Composer />
          </div>
        </div>
        <SidePanel />
      </div>
      <EffectsLayer />
      <SkillAppShell />
      <SettingsModal />
      <ForgeBatchModal />
      <ForgeBatchDock />
    </div>
  )
}
