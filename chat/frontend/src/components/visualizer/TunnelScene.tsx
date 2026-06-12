import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import {
  createBokehTexture,
  createRuneRingTexture,
  createSoftGlowTexture,
  disposeTexture,
} from './glowTexture'
import { getPortalData } from './tunnelGeometry'
import { VISUALIZER_COLORS } from './visualizerTheme'
import type { VisualizerActivity } from './useVisualizerActivity'

type TunnelSceneProps = {
  activity: VisualizerActivity
  mouse: { x: number; y: number }
  reducedMotion: boolean
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getPulseSpeed(mode: VisualizerActivity['mode']): number {
  switch (mode) {
    case 'thinking':
      return 1.1
    case 'streaming':
      return 1.35
    case 'building':
      return 0.95
    case 'celebrating':
      return 1.55
    default:
      return 0.6
  }
}

function getPulseAmount(mode: VisualizerActivity['mode']): number {
  switch (mode) {
    case 'thinking':
      return 0.022
    case 'streaming':
      return 0.028
    case 'building':
      return 0.02
    case 'celebrating':
      return 0.035
    default:
      return 0
  }
}

export function TunnelScene({ activity, mouse, reducedMotion }: TunnelSceneProps) {
  const portal = useMemo(() => getPortalData(), [])
  const ringsRef = useRef<THREE.Group>(null)
  const portalGroupRef = useRef<THREE.Group>(null)
  const runeRingRef = useRef<THREE.Mesh>(null)
  const raysRef = useRef<THREE.LineSegments>(null)
  const plexusRef = useRef<THREE.LineSegments>(null)
  const shardsRef = useRef<THREE.InstancedMesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const coreLightRef = useRef<THREE.PointLight>(null)

  const textures = useMemo(
    () => ({
      softGlow: createSoftGlowTexture(),
      bokeh: createBokehTexture(),
      rune: createRuneRingTexture(),
    }),
    [],
  )

  const materials = useMemo(() => {
    const rayMat = new THREE.LineBasicMaterial({
      color: VISUALIZER_COLORS.goldBright,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const plexusMat = new THREE.LineBasicMaterial({
      color: VISUALIZER_COLORS.line,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const nodeMat = new THREE.PointsMaterial({
      map: textures.softGlow,
      color: VISUALIZER_COLORS.tealBright,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const bokehSmallMat = new THREE.PointsMaterial({
      map: textures.bokeh,
      color: VISUALIZER_COLORS.particle,
      size: 0.22,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const bokehLargeMat = new THREE.PointsMaterial({
      map: textures.bokeh,
      color: VISUALIZER_COLORS.gold,
      size: 0.45,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const shardMat = new THREE.MeshBasicMaterial({
      color: VISUALIZER_COLORS.ringCool,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const runeMat = new THREE.MeshBasicMaterial({
      map: textures.rune,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const haloMat = new THREE.MeshBasicMaterial({
      map: textures.softGlow,
      color: VISUALIZER_COLORS.goldBright,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const coreMat = new THREE.MeshBasicMaterial({
      color: VISUALIZER_COLORS.core,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const coreHaloMat = new THREE.MeshBasicMaterial({
      color: VISUALIZER_COLORS.teal,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return {
      rayMat,
      plexusMat,
      nodeMat,
      bokehSmallMat,
      bokehLargeMat,
      shardMat,
      runeMat,
      haloMat,
      coreMat,
      coreHaloMat,
    }
  }, [textures])

  const shardGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const runeGeo = useMemo(() => new THREE.PlaneGeometry(5.2, 5.2), [])
  const haloGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const coreGeo = useMemo(() => new THREE.SphereGeometry(0.18, 32, 32), [])
  const coreHaloGeo = useMemo(() => new THREE.SphereGeometry(0.32, 24, 24), [])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose())
      shardGeo.dispose()
      runeGeo.dispose()
      haloGeo.dispose()
      coreGeo.dispose()
      coreHaloGeo.dispose()
      disposeTexture(textures.softGlow)
      disposeTexture(textures.bokeh)
      disposeTexture(textures.rune)
    }
  }, [materials, textures, shardGeo, runeGeo, haloGeo, coreGeo, coreHaloGeo])

  const smooth = useRef({
    intensity: activity.intensity,
    coreScale: 1,
    pulseWeight: 0,
    pulseSpeed: 0.6,
    pulseAmount: 0,
  })
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const rayGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(portal.rayPositions, 3))
    return geo
  }, [portal.rayPositions])

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(portal.linePositions, 3))
    return geo
  }, [portal.linePositions])

  const nodeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(portal.nodePositions, 3))
    return geo
  }, [portal.nodePositions])

  const bokehSmallGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(portal.bokehSmall, 3))
    return geo
  }, [portal.bokehSmall])

  const bokehLargeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(portal.bokehLarge, 3))
    return geo
  }, [portal.bokehLarge])

  useFrame((state, delta) => {
    if (reducedMotion) return

    const t = state.clock.getElapsedTime()
    smooth.current.intensity = lerp(smooth.current.intensity, activity.intensity, delta * 2)

    const isActive = activity.mode !== 'idle'
    const targetWeight = isActive ? 1 : 0
    smooth.current.pulseWeight = lerp(smooth.current.pulseWeight, targetWeight, delta * 1.2)
    smooth.current.pulseSpeed = lerp(
      smooth.current.pulseSpeed,
      getPulseSpeed(activity.mode),
      delta * 1.2,
    )
    smooth.current.pulseAmount = lerp(
      smooth.current.pulseAmount,
      getPulseAmount(activity.mode),
      delta * 1.2,
    )

    const wave = Math.sin(t * smooth.current.pulseSpeed)
    const pulse = 1 + wave * smooth.current.pulseAmount * smooth.current.pulseWeight
    const pulseFactor = pulse

    smooth.current.coreScale = lerp(
      smooth.current.coreScale,
      (0.85 + smooth.current.intensity * 0.55) * (1 + (pulse - 1) * 0.65),
      delta * 3,
    )

    if (portalGroupRef.current) {
      const portalScale = 1 + (pulse - 1) * smooth.current.pulseWeight * 0.75
      portalGroupRef.current.scale.setScalar(portalScale)
    }

    const spinSpeed =
      activity.mode === 'celebrating'
        ? 0.35
        : activity.mode === 'streaming'
          ? 0.22
          : activity.mode === 'building'
            ? 0.16
            : activity.mode === 'thinking'
              ? 0.12
              : 0.05

    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        mesh.rotation.z = t * spinSpeed * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.08)
        const mat = mesh.material as THREE.MeshBasicMaterial
        const highlight =
          activity.mode === 'building' && i === activity.activePhaseIndex % portal.rings.length
        mat.opacity = highlight ? 1 : (0.45 + smooth.current.intensity * 0.45) * pulseFactor
      })
    }

    if (runeRingRef.current) {
      runeRingRef.current.rotation.z = -t * spinSpeed * 0.6
      materials.runeMat.opacity = (0.35 + smooth.current.intensity * 0.45) * pulseFactor
    }

    if (raysRef.current) {
      materials.rayMat.opacity = (0.12 + smooth.current.intensity * 0.35) * pulseFactor
      raysRef.current.rotation.z = t * 0.03
    }

    if (plexusRef.current) {
      materials.plexusMat.opacity = (0.18 + smooth.current.intensity * 0.42) * pulseFactor
      plexusRef.current.rotation.z = t * spinSpeed * 0.25
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar(smooth.current.coreScale)
      materials.coreMat.opacity = 0.75 + smooth.current.intensity * 0.25
    }

    if (haloRef.current) {
      const haloWave = 1 + Math.sin(t * 1.4) * 0.06 * smooth.current.pulseWeight
      const s = smooth.current.coreScale * 2.2 * haloWave
      haloRef.current.scale.set(s, s, 1)
      materials.haloMat.opacity =
        (0.08 + smooth.current.intensity * 0.12) * pulseFactor
    }

    if (coreLightRef.current) {
      coreLightRef.current.intensity =
        (2 + smooth.current.intensity * 6) * (1 + (pulse - 1) * 0.7 * smooth.current.pulseWeight)
    }

    const shards = shardsRef.current
    if (shards) {
      for (let i = 0; i < portal.shardCount; i += 1) {
        const base = portal.shardPositions[i]!
        dummy.position.set(
          base.x + Math.sin(t * 0.4 + i) * 0.08,
          base.y + Math.cos(t * 0.35 + i * 0.7) * 0.08,
          base.z,
        )
        dummy.rotation.set(t * 0.15 + i, t * 0.1 + i, i)
        dummy.scale.set(0.06, 0.04, 1)
        dummy.updateMatrix()
        shards.setMatrixAt(i, dummy.matrix)
      }
      shards.instanceMatrix.needsUpdate = true
    }

    const cam = state.camera
    cam.position.x = lerp(cam.position.x, mouse.x * 0.22, delta * 3)
    cam.position.y = lerp(cam.position.y, mouse.y * 0.16, delta * 3)
    cam.lookAt(mouse.x * 0.08, mouse.y * 0.06, 0)
  })

  const bloomIntensity = reducedMotion ? 0.8 : 2.8

  return (
    <>
      <color attach="background" args={[VISUALIZER_COLORS.bg]} />
      <fog attach="fog" args={[VISUALIZER_COLORS.bg, 5, 16]} />

      <group ref={portalGroupRef}>
        <ambientLight intensity={0.08} />
        <pointLight
          ref={coreLightRef}
          position={[0, 0, 0.6]}
          color={VISUALIZER_COLORS.goldBright}
          intensity={3}
          distance={12}
        />
        <pointLight
          position={[0, 0, -1]}
          color={VISUALIZER_COLORS.teal}
          intensity={1.2}
          distance={10}
        />

        <lineSegments
          ref={raysRef}
          geometry={rayGeometry}
          material={materials.rayMat}
        />

        <lineSegments
          ref={plexusRef}
          geometry={lineGeometry}
          material={materials.plexusMat}
        />

        <points geometry={nodeGeometry} material={materials.nodeMat} />
        <points geometry={bokehSmallGeo} material={materials.bokehSmallMat} />
        <points geometry={bokehLargeGeo} material={materials.bokehLargeMat} />

        <instancedMesh
          ref={shardsRef}
          args={[shardGeo, materials.shardMat, portal.shardCount]}
        />

        <group ref={ringsRef}>
          {portal.rings.map((ring, i) => (
            <mesh key={`ring-${i}`} position={[0, 0, ring.z]}>
              <torusGeometry args={[ring.radius, ring.tube, 12, 96]} />
              <meshBasicMaterial
                color={ring.warm ? VISUALIZER_COLORS.ringWarm : VISUALIZER_COLORS.tealBright}
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>

        <mesh
          ref={runeRingRef}
          position={[0, 0, 0.18]}
          geometry={runeGeo}
          material={materials.runeMat}
        />

        <mesh
          ref={haloRef}
          position={[0, 0, 0.32]}
          geometry={haloGeo}
          material={materials.haloMat}
        />

        <mesh
          ref={coreRef}
          position={[0, 0, 0.38]}
          geometry={coreGeo}
          material={materials.coreMat}
        />

        <mesh position={[0, 0, 0.2]} geometry={coreHaloGeo} material={materials.coreHaloMat} />
      </group>

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          luminanceThreshold={0.05}
          luminanceSmoothing={0.65}
          intensity={bloomIntensity}
          mipmapBlur
          radius={0.75}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
      </EffectComposer>
    </>
  )
}
