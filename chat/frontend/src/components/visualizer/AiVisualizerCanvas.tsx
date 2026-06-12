import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { TunnelScene } from './TunnelScene'
import type { VisualizerActivity } from './useVisualizerActivity'
import { VISUALIZER_COLORS } from './visualizerTheme'

type AiVisualizerCanvasProps = {
  activity: VisualizerActivity
  mouse: { x: number; y: number }
  reducedMotion: boolean
}

export function AiVisualizerCanvas({
  activity,
  mouse,
  reducedMotion,
}: AiVisualizerCanvasProps) {
  const [tabVisible, setTabVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true,
  )

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const frameloop = tabVisible && !reducedMotion ? 'always' : 'demand'

  return (
    <Canvas
      className="ai-visualizer-canvas"
      aria-hidden="true"
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 5.2], fov: 58, near: 0.1, far: 30 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      style={{ background: VISUALIZER_COLORS.bg }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement
        canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
        })
      }}
    >
      <Suspense fallback={null}>
        <TunnelScene activity={activity} mouse={mouse} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
