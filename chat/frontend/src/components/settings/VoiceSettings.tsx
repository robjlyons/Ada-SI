import { useCallback, useEffect, useState } from 'react'

import { fetchSecrets, fetchTtsVoices } from '../../api/client'
import { DEFAULT_TTS_VOICE_ID, ELEVENLABS_TTS_MODEL_ID } from '../../constants'
import { useAppStore } from '../../state/store'
import { resolveTtsVoiceId } from '../../utils/ttsVoice'

export function VoiceSettings() {
  const ttsEnabled = useAppStore((s) => s.ttsEnabled)
  const ttsVoiceId = useAppStore((s) => s.ttsVoiceId)
  const setTtsEnabled = useAppStore((s) => s.setTtsEnabled)
  const setTtsVoiceId = useAppStore((s) => s.setTtsVoiceId)

  const [elevenLabsConfigured, setElevenLabsConfigured] = useState(false)
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceError, setVoiceError] = useState('')

  const effectiveVoiceId = resolveTtsVoiceId(ttsVoiceId)
  const usingDefaultVoice = !ttsVoiceId.trim()

  const refreshKeyStatus = useCallback(async () => {
    try {
      const secrets = await fetchSecrets()
      setElevenLabsConfigured(secrets.ELEVENLABS_API_KEY?.configured ?? false)
    } catch {
      setElevenLabsConfigured(false)
    }
  }, [])

  const loadVoices = useCallback(async () => {
    setLoadingVoices(true)
    setVoiceError('')
    try {
      const list = await fetchTtsVoices()
      setVoices(list)
    } catch (error) {
      setVoiceError((error as Error).message)
      setVoices([])
    } finally {
      setLoadingVoices(false)
    }
  }, [])

  useEffect(() => {
    void refreshKeyStatus()
  }, [refreshKeyStatus])

  useEffect(() => {
    if (elevenLabsConfigured) {
      void loadVoices()
    }
  }, [elevenLabsConfigured, loadVoices])

  return (
    <div className="voice-settings">
      <div className="settings-section-header">
        <div>
          <h3>Voice output</h3>
          <p className="settings-section-desc">
            When enabled, assistant replies are read aloud with ElevenLabs Turbo v2.5 (
            {ELEVENLABS_TTS_MODEL_ID}). Markdown and code are stripped before synthesis, and
            Scout is told to write in a speakable style.
          </p>
        </div>
      </div>

      <div className="settings-fields">
        <div className="settings-field">
          <label className="settings-checkbox-label" htmlFor="settings-tts-enabled">
            <input
              id="settings-tts-enabled"
              type="checkbox"
              checked={ttsEnabled}
              disabled={!elevenLabsConfigured}
              onChange={(event) => setTtsEnabled(event.target.checked)}
            />
            Read replies aloud (ElevenLabs)
          </label>
          <p className="forger-guidance-hint">
            {elevenLabsConfigured
              ? 'Scout receives a voice-output flag and replies are synthesized after each answer.'
              : 'Add an ElevenLabs API key in the API Keys section first.'}
          </p>
        </div>

        {elevenLabsConfigured ? (
          <>
            <div className="settings-field">
              <label htmlFor="settings-tts-voice-id">Voice ID</label>
              <p className="forger-guidance-hint">
                Default voice: <code>{DEFAULT_TTS_VOICE_ID}</code>. Enter any ElevenLabs voice ID
                to override.
              </p>
              <input
                id="settings-tts-voice-id"
                type="text"
                spellCheck={false}
                autoComplete="off"
                placeholder={DEFAULT_TTS_VOICE_ID}
                value={ttsVoiceId}
                onChange={(event) => setTtsVoiceId(event.target.value)}
              />
              <div className="settings-inline-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setTtsVoiceId('')}
                >
                  Use default voice
                </button>
              </div>
              <p className="forger-guidance-hint">
                {usingDefaultVoice
                  ? `Using default voice ID ${DEFAULT_TTS_VOICE_ID}.`
                  : `Using custom voice ID ${effectiveVoiceId}.`}
              </p>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-tts-voice-pick">Pick from your ElevenLabs account</label>
              <select
                id="settings-tts-voice-pick"
                value=""
                disabled={loadingVoices || voices.length === 0}
                onChange={(event) => {
                  if (event.target.value) {
                    setTtsVoiceId(event.target.value)
                  }
                }}
              >
                <option value="">
                  {loadingVoices
                    ? 'Loading voices...'
                    : voices.length === 0
                      ? 'No voices loaded'
                      : 'Select a voice to fill the ID field'}
                </option>
                {voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.voice_id})
                  </option>
                ))}
              </select>
              {voiceError ? <p className="forger-guidance-hint">{voiceError}</p> : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
