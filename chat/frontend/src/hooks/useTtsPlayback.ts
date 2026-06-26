import { useCallback } from 'react'

import {
  startTtsQueue,
  stopTtsPlayback,
  type TtsSentenceQueue,
} from '../lib/ttsPlayback'

export function useTtsPlayback() {
  const stopPlayback = useCallback(() => {
    stopTtsPlayback()
  }, [])

  const createQueue = useCallback(
    (voiceId?: string, onError?: (error: Error) => void): TtsSentenceQueue => {
      return startTtsQueue(voiceId, onError)
    },
    [],
  )

  return { createQueue, stopPlayback }
}
