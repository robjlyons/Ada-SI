import type { ForgeBatchToolColumn } from '../../types/events'
import { useForgeBatchStream } from '../../hooks/useForgeBatchStream'
import { useAppStore } from '../../state/store'
import { Markdown } from '../chat/Markdown'
import { ReasoningBlock } from '../chat/ReasoningBlock'
import { ForgePhaseStrip } from './ForgePhaseStrip'

type MiniForgeColumnProps = {
  column: ForgeBatchToolColumn
}

function statusLabel(status: ForgeBatchToolColumn['status']): string {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'drafting':
      return 'Drafting plan'
    case 'plan_ready':
      return 'Plan ready'
    case 'plan_approved':
      return 'Plan approved'
    case 'building':
      return 'Forging'
    case 'pip_pending':
      return 'Pip review'
    case 'ui_preview_pending':
      return 'App preview'
    case 'done':
      return 'Done'
    case 'failed':
      return 'Failed'
    case 'skipped':
      return 'Skipped'
    default:
      return status
  }
}

export function MiniForgeColumn({ column }: MiniForgeColumnProps) {
  const updateForgeBatchColumn = useAppStore((s) => s.updateForgeBatchColumn)
  const {
    approvePlan,
    rejectPlan,
    revisePlan,
    startBuild,
    approvePipForColumn,
    approvePreviewForColumn,
    revisePreviewForColumn,
  } = useForgeBatchStream()

  const isDrafting = column.status === 'drafting'
  const isBuilding = column.status === 'building' || column.status === 'pip_pending' || column.status === 'ui_preview_pending'
  const showPlan = column.status === 'plan_ready' || column.status === 'plan_approved' || isDrafting

  return (
    <article className={`mini-forge-column status-${column.status}`}>
      <header className="mini-forge-column-header">
        <h4 className="mini-forge-column-title">{column.toolName}</h4>
        <span className="mini-forge-column-badge">{statusLabel(column.status)}</span>
      </header>

      {isBuilding && <ForgePhaseStrip viewerPhases={column.viewerPhases} compact />}

      <div className="mini-forge-column-body scroll-area">
        {isDrafting && column.draftThinking && (
          <ReasoningBlock
            text={column.draftThinking}
            streaming={!column.planMarkdown}
            open={!column.draftPlanText}
            className="thinking-block tool-plan-draft-thinking"
          />
        )}
        {showPlan && (
          <div className="mini-forge-column-plan">
            {isDrafting && !column.planMarkdown ? (
              column.draftPlanText
            ) : (
              <Markdown content={column.planMarkdown || column.draftPlanText} />
            )}
          </div>
        )}
        {column.resultError && (
          <p className="mini-forge-column-error">{column.resultError}</p>
        )}
        {column.viewerOutput.length > 0 && (
          <pre className="mini-forge-column-log">{column.viewerOutput.slice(-6).join('\n')}</pre>
        )}
      </div>

      {column.status === 'pip_pending' && column.pipInstall && (
        <div className="mini-forge-column-gate">
          <p>Pip: {(column.pipInstall.packages || []).join(', ')}</p>
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={column.pipInstall.busy}
            onClick={() => void approvePipForColumn(column.planId)}
          >
            Approve pip
          </button>
        </div>
      )}

      {column.status === 'ui_preview_pending' && column.uiPreview && (
        <div className="mini-forge-column-gate">
          <textarea
            rows={2}
            placeholder="Preview feedback"
            value={column.uiPreview.feedback || ''}
            onChange={(e) =>
              updateForgeBatchColumn(column.planId, {
                uiPreview: { ...column.uiPreview!, feedback: e.target.value },
              })
            }
          />
          <div className="mini-forge-column-gate-actions">
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={column.uiPreview.busy}
              onClick={() => void approvePreviewForColumn(column.planId)}
            >
              Approve app
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={column.uiPreview.busy}
              onClick={() => void revisePreviewForColumn(column.planId)}
            >
              Revise
            </button>
          </div>
        </div>
      )}

      <footer className="mini-forge-column-actions">
        {column.status === 'plan_ready' && (
          <>
            <textarea
              rows={2}
              className="mini-forge-feedback"
              placeholder="Request blueprint changes"
              value={column.feedback}
              disabled={column.busy}
              onChange={(e) =>
                updateForgeBatchColumn(column.planId, { feedback: e.target.value })
              }
            />
            <div className="mini-forge-column-btn-row">
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={column.busy}
                onClick={() => void approvePlan(column.planId)}
              >
                Approve plan
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={column.busy || !column.feedback.trim()}
                onClick={() => void revisePlan(column.planId, column.feedback)}
              >
                Revise
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                disabled={column.busy}
                onClick={() => void rejectPlan(column.planId)}
              >
                Skip
              </button>
            </div>
          </>
        )}
        {column.status === 'plan_approved' && (
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={column.busy}
            onClick={() => void startBuild(column.planId)}
          >
            Start forge
          </button>
        )}
      </footer>
    </article>
  )
}
