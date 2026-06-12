import { motion } from 'framer-motion'
import { getXpProgressPercent } from '../../state/progression'
import type { CelebrationEvent } from '../../state/store'

type SkillUnlockModalProps = {
  event: CelebrationEvent
  onDismiss: () => void
}

export function SkillUnlockModal({ event, onDismiss }: SkillUnlockModalProps) {
  const { toolName, progression, leveledUp, xpGained } = event
  const progressPct = getXpProgressPercent(progression)

  return (
    <motion.div
      className="skill-unlock-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-unlock-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.button
        type="button"
        className="skill-unlock-backdrop"
        aria-label="Dismiss skill unlock"
        onClick={onDismiss}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="skill-unlock-modal"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="skill-unlock-modal-rays" aria-hidden="true" />
        <div className="skill-unlock-modal-glow" aria-hidden="true" />

        <motion.div
          className="skill-unlock-modal-badge"
          aria-hidden="true"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
        >
          {leveledUp ? '⬆' : '✦'}
        </motion.div>

        <motion.p
          className="skill-unlock-modal-kicker"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {leveledUp ? 'Level up!' : 'Achievement unlocked'}
        </motion.p>

        <motion.h2
          id="skill-unlock-title"
          className="skill-unlock-modal-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        >
          Skill Unlocked
        </motion.h2>

        <motion.p
          className="skill-unlock-modal-name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
        >
          {toolName}
        </motion.p>

        <motion.p
          className="skill-unlock-modal-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          {leveledUp
            ? 'ADA leveled up with a new capability.'
            : 'This skill is now available in your sidebar and ready to use.'}
        </motion.p>

        <motion.p
          className="skill-unlock-modal-xp-source"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.44, duration: 0.35 }}
        >
          +{xpGained} XP · Skill unlocked · {progression.rankTitle}
        </motion.p>

        <motion.div
          className="skill-unlock-modal-stats"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.35 }}
        >
          <div className="skill-unlock-modal-stat">
            <span className="skill-unlock-modal-stat-label">XP gained</span>
            <span className="skill-unlock-modal-stat-value skill-unlock-xp">
              +{xpGained}
            </span>
          </div>
          <div className="skill-unlock-modal-stat">
            <span className="skill-unlock-modal-stat-label">Level</span>
            <span className="skill-unlock-modal-stat-value">
              {progression.isMaxLevel ? 'Lv. 50 MAX' : `Lv. ${progression.level}`}
            </span>
          </div>
        </motion.div>

        <div className="skill-unlock-progress skill-unlock-modal-progress" aria-hidden="true">
          <motion.span
            className="skill-unlock-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ delay: 0.55, duration: 0.75, ease: 'easeOut' }}
          />
        </div>

        <motion.button
          type="button"
          className="btn-primary skill-unlock-modal-continue"
          onClick={onDismiss}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.3 }}
          autoFocus
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
