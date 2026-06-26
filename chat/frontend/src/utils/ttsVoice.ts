import { DEFAULT_TTS_VOICE_ID } from '../constants'

export function resolveTtsVoiceId(storedVoiceId: string): string {
  const trimmed = storedVoiceId.trim()
  return trimmed || DEFAULT_TTS_VOICE_ID
}
