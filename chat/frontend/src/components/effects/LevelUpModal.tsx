import { motion } from 'framer-motion'
import { getXpProgressPercent } from '../../state/progression'
import type { CelebrationEvent } from '../../state/store'

type LevelUpModalProps = {
  event: Extract<CelebrationEvent, { kind: 'level' }>
  onDismiss: () => void
}

const XP_SOURCE_LABELS = {
  chat: 'Quest complete',
  skill: 'Skill unlocked',
} as const

export function LevelUpModal({ event, onDismiss }: LevelUpModalProps) {
  const { progression, xpGained, previousLevel, source } = event
  const progressPct = getXpProgressPercent(progression)
  const levelLabel = progression.isMaxLevel ? 'Lv. 50 MAX' : `Lv. ${progression.level}`

  return (
    <motion.div
      className="level-up-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.button
        type="button"
        className="level-up-backdrop"
        aria-label="Dismiss level up"
        onClick={onDismiss}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="level-up-modal"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="level-up-modal-rays" aria-hidden="true" />
        <div className="level-up-modal-glow" aria-hidden="true" />

        <motion.div
          className="level-up-modal-badge"
          aria-hidden="true"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
        >
          {progression.level}
        </motion.div>

        <motion.p
          className="level-up-modal-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          Rank advanced
        </motion.p>

        <motion.h2
          id="level-up-title"
          className="level-up-modal-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        >
          Level Up!
        </motion.h2>

        <motion.p
          className="level-up-modal-rank"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
        >
          {progression.rankTitle}
        </motion.p>

        <motion.p
          className="level-up-modal-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          ADA grows stronger with every quest and skill forged.
        </motion.p>

        <motion.p
          className="level-up-modal-xp-source"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.44, duration: 0.35 }}
        >
          +{xpGained} XP · {XP_SOURCE_LABELS[source]} · {progression.rankTitle}
        </motion.p>

        <motion.div
          className="level-up-modal-stats"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.35 }}
        >
          <div className="level-up-modal-stat">
            <span className="level-up-modal-stat-label">XP gained</span>
            <span className="level-up-modal-stat-value level-up-xp">+{xpGained}</span>
          </div>
          <div className="level-up-modal-stat">
            <span className="level-up-modal-stat-label">Level</span>
            <span className="level-up-modal-stat-value">
              {previousLevel < progression.level
                ? `Lv. ${previousLevel} → ${levelLabel}`
                : levelLabel}
            </span>
          </div>
        </motion.div>

        <div className="level-up-progress level-up-modal-progress" aria-hidden="true">
          <motion.span
            className="level-up-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ delay: 0.55, duration: 0.75, ease: 'easeOut' }}
          />
        </div>

        <motion.button
          type="button"
          className="btn-primary level-up-modal-continue"
          onClick={onDismiss}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.3 }}
          autoFocus
        >
          Continue quest
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
