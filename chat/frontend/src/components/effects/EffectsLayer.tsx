import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../state/store'
import { spawnConfetti } from './confetti'
import { LevelUpModal } from './LevelUpModal'
import { SkillUnlockModal } from './SkillUnlockModal'
import { playUnlockSound } from './unlockSound'

export function EffectsLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const celebrations = useAppStore((s) => s.celebrations)
  const activeCelebration = celebrations[0] ?? null
  const clearCelebration = useAppStore((s) => s.clearCelebration)
  const clearRecentlyUnlockedTool = useAppStore((s) => s.clearRecentlyUnlockedTool)
  const lastCelebrationId = useRef<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (!activeCelebration) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearCelebration()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeCelebration, clearCelebration])

  useEffect(() => {
    if (!activeCelebration || activeCelebration.id === lastCelebrationId.current) return
    lastCelebrationId.current = activeCelebration.id

    const canvas = canvasRef.current
    let stopConfetti: (() => void) | undefined
    if (canvas) {
      stopConfetti = spawnConfetti(canvas, canvas.width * 0.5, canvas.height * 0.42)
    }
    playUnlockSound(activeCelebration.kind === 'level')

    let highlightTimer: number | undefined
    if (activeCelebration.kind === 'skill') {
      highlightTimer = window.setTimeout(() => clearRecentlyUnlockedTool(), 6000)
    }

    return () => {
      stopConfetti?.()
      if (highlightTimer !== undefined) {
        window.clearTimeout(highlightTimer)
      }
    }
  }, [activeCelebration, clearRecentlyUnlockedTool])

  return (
    <>
      <canvas ref={canvasRef} className="effects-canvas" aria-hidden="true" />
      <AnimatePresence>
        {activeCelebration?.kind === 'level' ? (
          <LevelUpModal
            key={activeCelebration.id}
            event={activeCelebration}
            onDismiss={clearCelebration}
          />
        ) : null}
        {activeCelebration?.kind === 'skill' ? (
          <SkillUnlockModal
            key={activeCelebration.id}
            event={activeCelebration}
            onDismiss={clearCelebration}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
