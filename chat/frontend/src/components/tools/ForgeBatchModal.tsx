import { useAppStore } from '../../state/store'
import { useForgeBatchStream } from '../../hooks/useForgeBatchStream'
import { MiniForgeColumn } from './MiniForgeColumn'

export function ForgeBatchDock() {
  const forgeBatch = useAppStore((s) => s.forgeBatch)
  const setForgeBatchModalMode = useAppStore((s) => s.setForgeBatchModalMode)

  if (!forgeBatch || forgeBatch.modalMode !== 'minimized') return null

  const done = forgeBatch.tools.filter((t) => t.status === 'done').length
  const total = forgeBatch.tools.length
  const needsAttention = forgeBatch.tools.some(
    (t) => t.status === 'pip_pending' || t.status === 'ui_preview_pending' || t.status === 'plan_ready',
  )

  return (
    <button
      type="button"
      className={`forge-batch-dock${needsAttention ? ' forge-batch-dock-attention' : ''}`}
      onClick={() => setForgeBatchModalMode('expanded')}
    >
      <span className="forge-batch-dock-label">Multi-tool forge</span>
      <span className="forge-batch-dock-progress">
        {done}/{total} complete
      </span>
    </button>
  )
}

export function ForgeBatchModal() {
  const forgeBatch = useAppStore((s) => s.forgeBatch)
  const setForgeBatchModalMode = useAppStore((s) => s.setForgeBatchModalMode)
  const closeForgeBatch = useAppStore((s) => s.closeForgeBatch)
  const {
    confirmBatch,
    declineBatch,
    approveAllPlans,
    startBuild,
    cancelBatchRun,
    allPlansDrafted,
    countApproved,
  } = useForgeBatchStream()

  if (!forgeBatch || forgeBatch.modalMode === 'closed' || forgeBatch.modalMode === 'minimized') {
    return null
  }

  const isConfirming = forgeBatch.modalMode === 'confirming'
  const plansDrafted = allPlansDrafted()
  const approvedCount = countApproved()

  return (
    <div className="forge-batch-overlay" role="dialog" aria-modal="true">
      <div className="forge-batch-modal glass-panel">
        <header className="forge-batch-modal-header">
          <div>
            <h2 className="forge-batch-modal-title">
              {isConfirming ? 'Multi-tool forge proposal' : 'Multi-tool forge'}
            </h2>
            <p className="forge-batch-modal-summary">{forgeBatch.summary}</p>
          </div>
          <div className="forge-batch-modal-header-actions">
            {!isConfirming && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setForgeBatchModalMode('minimized')}
              >
                Minimize
              </button>
            )}
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => void declineBatch().then(() => closeForgeBatch())}
            >
              Cancel
            </button>
          </div>
        </header>

        {isConfirming ? (
          <div className="forge-batch-confirm-body">
            <p className="forge-batch-confirm-lead">
              The agent wants to create {forgeBatch.proposedTools.length} tools. Start the
              multi-tool forging agent?
            </p>
            <ul className="forge-batch-confirm-list">
              {forgeBatch.proposedTools.map((tool) => (
                <li key={tool.plan_id}>
                  <strong>{tool.tool_name}</strong>
                  <span>{tool.description}</span>
                </li>
              ))}
            </ul>
            <div className="forge-batch-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => void declineBatch()}>
                Decline
              </button>
              <button type="button" className="btn-primary" onClick={() => void confirmBatch()}>
                Start multi-tool agent
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="forge-batch-columns scroll-area">
              {forgeBatch.tools.map((col) => (
                <MiniForgeColumn key={col.planId} column={col} />
              ))}
            </div>
            <footer className="forge-batch-modal-footer">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => void cancelBatchRun()}
              >
                Stop run
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!plansDrafted}
                onClick={() => void approveAllPlans()}
              >
                Approve all plans
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={approvedCount === 0}
                onClick={() => void startBuild()}
              >
                Forge all approved ({approvedCount})
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
