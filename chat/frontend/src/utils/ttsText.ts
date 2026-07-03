import { extractCompletedSentences, extractTrailingSentence } from './sentenceSplit'

const MIN_TTS_LENGTH = 3

/** Strip markdown and other non-speakable markup before sending text to TTS. */
export function sanitizeTextForTts(raw: string): string {
  let text = raw
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  text = text.replace(/https?:\/\/\S+/g, '')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/(\*\*|__|\*|_|~~)/g, '')
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/\s+/g, ' ')
  return text.trim()
}

function cleanSentence(sentence: string): string | null {
  const cleaned = sanitizeTextForTts(sentence)
  return cleaned.length >= MIN_TTS_LENGTH ? cleaned : null
}

export function appendTtsDelta(
  buffer: string,
  cursor: number,
  delta: string,
): { buffer: string; cursor: number; sentences: string[] } {
  const newBuffer = buffer + delta
  const { sentences, cursor: newCursor } = extractCompletedSentences(newBuffer, cursor)
  const cleaned = sentences
    .map((sentence) => cleanSentence(sentence))
    .filter((sentence): sentence is string => sentence !== null)
  return { buffer: newBuffer, cursor: newCursor, sentences: cleaned }
}

export function flushTtsTail(buffer: string, cursor: number): string | null {
  const tail = extractTrailingSentence(buffer, cursor)
  if (!tail) return null
  return cleanSentence(tail)
}
