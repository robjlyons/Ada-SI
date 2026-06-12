import * as THREE from 'three'

function createRadialCanvas(
  inner: string,
  mid: string,
  outer: string,
  size = 128,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, mid)
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}

export function createSoftGlowTexture(): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(
    createRadialCanvas('rgba(255,255,255,1)', 'rgba(180,230,255,0.55)', 'rgba(255,255,255,0)'),
  )
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createBokehTexture(): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(
    createRadialCanvas('rgba(255,240,200,1)', 'rgba(255,200,100,0.45)', 'rgba(255,180,80,0)'),
  )
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createRuneRingTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const glyphs = '◈◇◆✦⟡⌁∞⟨⟩⌬◉'

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 22px ui-monospace, monospace'

  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle + Math.PI / 2)
    const alpha = 0.35 + (i % 3) * 0.15
    ctx.fillStyle = `rgba(255, 210, 120, ${alpha})`
    ctx.shadowColor = 'rgba(255, 200, 80, 0.8)'
    ctx.shadowBlur = 12
    ctx.fillText(glyphs[i % glyphs.length]!, 0, 0)
    ctx.restore()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function disposeTexture(tex: THREE.Texture | null | undefined) {
  tex?.dispose()
}
