import { useMemo } from 'react'
import { VIEWER_PHASES } from '../../constants'
import { useAppStore } from '../../state/store'
import { MODE_INTENSITY } from './visualizerTheme'

export type VisualizerMode =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'building'
  | 'celebrating'

export type VisualizerActivity = {
  mode: VisualizerMode
  intensity: number
  activePhaseIndex: number
  statusLabel: string
}

export function useVisualizerActivity(): VisualizerActivity {
  const isSending = useAppStore((s) => s.isSending)
  const feed = useAppStore((s) => s.feed)
  const celebrations = useAppStore((s) => s.celebrations)
  const activeCelebration = celebrations[0]

  return useMemo(() => {
    if (activeCelebration) {
      return {
        mode: 'celebrating' as const,
        intensity: MODE_INTENSITY.celebrating,
        activePhaseIndex: VIEWER_PHASES.length - 1,
        statusLabel: activeCelebration.kind === 'level' ? 'Level up' : 'Skill unlocked',
      }
    }

    const buildingCard = feed.find(
      (item) => item.type === 'tool-plan' && item.card.mode === 'building',
    )

    if (buildingCard && buildingCard.type === 'tool-plan') {
      const phases = buildingCard.card.viewerPhases
      let activePhaseIndex = 0
      for (let i = VIEWER_PHASES.length - 1; i >= 0; i -= 1) {
        const phase = VIEWER_PHASES[i]!
        const status = phases[phase.id]
        if (status === 'active' || status === 'done') {
          activePhaseIndex = i
          if (status === 'active') break
        }
      }
      return {
        mode: 'building' as const,
        intensity: MODE_INTENSITY.building,
        activePhaseIndex,
        statusLabel: 'Forging',
      }
    }

    const streamingAssistant = [...feed]
      .reverse()
      .find((item) => item.type === 'assistant' && item.streaming)

    if (streamingAssistant && streamingAssistant.type === 'assistant') {
      const hasContent = Boolean(streamingAssistant.content.trim())
      const isThinking =
        !hasContent ||
        Boolean(streamingAssistant.reasoningText.trim() && !hasContent)

      if (isThinking || (!hasContent && streamingAssistant.reasoningText)) {
        return {
          mode: 'thinking' as const,
          intensity: MODE_INTENSITY.thinking,
          activePhaseIndex: 0,
          statusLabel: 'Analyzing',
        }
      }

      return {
        mode: 'streaming' as const,
        intensity: MODE_INTENSITY.streaming,
        activePhaseIndex: 0,
        statusLabel: 'Transmitting',
      }
    }

    if (isSending) {
      return {
        mode: 'thinking' as const,
        intensity: MODE_INTENSITY.thinking,
        activePhaseIndex: 0,
        statusLabel: 'Analyzing',
      }
    }

    return {
      mode: 'idle' as const,
      intensity: MODE_INTENSITY.idle,
      activePhaseIndex: 0,
      statusLabel: 'Standby',
    }
  }, [isSending, feed, activeCelebration])
}
