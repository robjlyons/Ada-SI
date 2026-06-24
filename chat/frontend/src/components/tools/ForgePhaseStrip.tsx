import { VIEWER_PHASES } from '../../constants'
import type { PhaseStatus } from '../../types/events'

type ForgePhaseStripProps = {
  viewerPhases: Record<string, PhaseStatus>
  compact?: boolean
}

export function ForgePhaseStrip({ viewerPhases, compact }: ForgePhaseStripProps) {
  return (
    <div className={`tool-viewer-phases${compact ? ' tool-viewer-phases-compact' : ''}`}>
      {VIEWER_PHASES.map((phase) => (
        <span
          key={phase.id}
          className={`tool-viewer-phase step-${viewerPhases[phase.id] || 'pending'}`}
          data-phase-id={phase.id}
          title={phase.label}
        >
          {compact ? phase.label.slice(0, 3) : phase.label}
        </span>
      ))}
    </div>
  )
}
