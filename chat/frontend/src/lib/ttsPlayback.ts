import { synthesizeSpeech, synthesizeSpeechStream } from '../api/client'
import { sanitizeTextForTts } from '../utils/ttsText'

let activeQueue: TtsSentenceQueue | null = null

export class TtsSentenceQueue {
  private readonly queue: string[] = []
  private running = false
  private cancelled = false
  private abortController: AbortController | null = null
  private audioRef: HTMLAudioElement | null = null
  private objectUrlRef: string | null = null
  private readonly voiceId?: string
  private readonly onError?: (error: Error) => void

  constructor(voiceId?: string, onError?: (error: Error) => void) {
    this.voiceId = voiceId
    this.onError = onError
  }

  enqueue(sentence: string): void {
    const trimmed = sanitizeTextForTts(sentence)
    if (!trimmed || this.cancelled) return
    this.queue.push(trimmed)
    void this.runWorker()
  }

  flush(tail: string): void {
    const trimmed = sanitizeTextForTts(tail)
    if (trimmed) {
      this.enqueue(trimmed)
    }
  }

  cancel(): void {
    this.cancelled = true
    this.queue.length = 0
    this.abortController?.abort()
    this.abortController = null
    this.cleanupAudio()
  }

  private cleanupAudio(): void {
    if (this.audioRef) {
      this.audioRef.pause()
      this.audioRef = null
    }
    if (this.objectUrlRef) {
      URL.revokeObjectURL(this.objectUrlRef)
      this.objectUrlRef = null
    }
  }

  private async runWorker(): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.queue.length > 0 && !this.cancelled) {
      const sentence = this.queue.shift()
      if (!sentence) continue

      try {
        this.abortController = new AbortController()
        const blob = await synthesizeSpeechStream(
          sentence,
          this.voiceId,
          this.abortController.signal,
        )
        if (this.cancelled) break
        await this.playBlob(blob)
      } catch (error) {
        if (this.cancelled || (error as Error).name === 'AbortError') {
          break
        }
        this.onError?.(error as Error)
      } finally {
        this.abortController = null
      }
    }

    this.running = false
  }

  private playBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cancelled) {
        resolve()
        return
      }

      this.cleanupAudio()
      const url = URL.createObjectURL(blob)
      this.objectUrlRef = url
      const audio = new Audio(url)
      this.audioRef = audio
      audio.onended = () => {
        this.cleanupAudio()
        resolve()
      }
      audio.onerror = () => {
        this.cleanupAudio()
        reject(new Error('Audio playback failed.'))
      }
      void audio.play().catch(reject)
    })
  }
}

export function startTtsQueue(
  voiceId?: string,
  onError?: (error: Error) => void,
): TtsSentenceQueue {
  stopTtsPlayback()
  activeQueue = new TtsSentenceQueue(voiceId, onError)
  return activeQueue
}

export function getTtsQueue(): TtsSentenceQueue | null {
  return activeQueue
}

export function stopTtsPlayback(): void {
  activeQueue?.cancel()
  activeQueue = null
}

export async function playTtsText(text: string, voiceId?: string): Promise<void> {
  const trimmed = sanitizeTextForTts(text)
  if (!trimmed) return

  stopTtsPlayback()
  const blob = await synthesizeSpeech(trimmed, voiceId)
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.onended = () => {
    URL.revokeObjectURL(url)
  }
  await audio.play()
}
