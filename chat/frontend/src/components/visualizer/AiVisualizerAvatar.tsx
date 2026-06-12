import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useVisualizerActivity } from './useVisualizerActivity'

const AiVisualizerCanvas = lazy(() =>
  import('./AiVisualizerCanvas').then((m) => ({ default: m.AiVisualizerCanvas })),
)

function VisualizerFallback() {
  return (
    <div className="ai-visualizer-fallback" aria-hidden="true">
      <span className="ai-visualizer-fallback-pulse" />
    </div>
  )
}

function ReducedMotionFallback() {
  return (
    <div className="ai-visualizer-static" aria-hidden="true">
      <div className="ai-visualizer-static-core" />
      <div className="ai-visualizer-static-ring ai-visualizer-static-ring-1" />
      <div className="ai-visualizer-static-ring ai-visualizer-static-ring-2" />
    </div>
  )
}

export function AiVisualizerAvatar() {
  const activity = useVisualizerActivity()
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => setCanvasReady(true))
    return () => {
      cancelAnimationFrame(id)
      setCanvasReady(false)
    }
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    setMouse({ x: nx, y: ny })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={containerRef}
      className={`ai-visualizer-avatar mode-${activity.mode}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      title={activity.statusLabel}
    >
      <span className="sr-only" role="status">
        {activity.statusLabel}
      </span>
      {reducedMotion ? (
        <ReducedMotionFallback />
      ) : canvasReady ? (
        <Suspense fallback={<VisualizerFallback />}>
          <AiVisualizerCanvas
            activity={activity}
            mouse={mouse}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      ) : (
        <VisualizerFallback />
      )}
    </div>
  )
}
