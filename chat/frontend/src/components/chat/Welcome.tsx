import { motion } from 'framer-motion'

export function Welcome() {
  const chips = ['Ask a question', 'Request a new tool', 'Run an installed tool']

  return (
    <div className="welcome">
      <div className="welcome-mark" aria-hidden="true">
        A
      </div>
      <h2>What would you like to build?</h2>
      <p>Chat with the lite model or request new tools for the agent to create.</p>
      <div className="welcome-chips">
        {chips.map((chip, index) => (
          <motion.span
            key={chip}
            className="welcome-chip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25 }}
          >
            {chip}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
