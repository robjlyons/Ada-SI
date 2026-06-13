import { toPng } from 'html-to-image'

import { useAppStore } from '../state/store'

export const SKILL_APP_CAPTURE_SELECTOR = '.skill-app-window'

const CAPTURE_RENDER_DELAY_MS = 450

export async function captureSkillAppScreenshot(): Promise<string | null> {
  const node = document.querySelector(SKILL_APP_CAPTURE_SELECTOR) as HTMLElement | null
  if (!node) return null

  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    })
  } catch {
    return null
  }
}

export async function captureSkillAppForTool(toolName: string): Promise<string | null> {
  const store = useAppStore.getState()
  if (store.activeSkillApp !== toolName) {
    store.openSkillApp(toolName)
    await new Promise((resolve) => window.setTimeout(resolve, CAPTURE_RENDER_DELAY_MS))
  }
  return captureSkillAppScreenshot()
}
