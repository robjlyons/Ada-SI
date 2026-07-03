const MIN_SENTENCE_LENGTH = 3

const ABBREVIATIONS = new Set([
  'mr.',
  'mrs.',
  'ms.',
  'dr.',
  'prof.',
  'sr.',
  'jr.',
  'etc.',
  'e.g.',
  'i.e.',
  'vs.',
  'st.',
])

function isAbbreviationPeriod(buffer: string, index: number): boolean {
  const wordStart = buffer.lastIndexOf(' ', index - 1) + 1
  const word = buffer.slice(wordStart, index + 1).toLowerCase()
  return ABBREVIATIONS.has(word)
}

function isDecimalOrVersionPeriod(buffer: string, index: number): boolean {
  const prev = buffer[index - 1]
  const next = buffer[index + 1]
  if (!prev || !next) return false
  if (/\d/.test(prev) && /\d/.test(next)) return true
  if (/[a-zA-Z0-9]/.test(prev) && /\d/.test(next)) return true
  return false
}

function isSentenceEnd(buffer: string, index: number): boolean {
  const char = buffer[index]
  if (char !== '.' && char !== '?' && char !== '!') return false

  const atEnd = index + 1 >= buffer.length
  const followedBySpace = !atEnd && /\s/.test(buffer[index + 1]!)
  if (!atEnd && !followedBySpace) return false

  if (char === '.') {
    if (isDecimalOrVersionPeriod(buffer, index)) return false
    if (isAbbreviationPeriod(buffer, index)) return false
  }

  return true
}

export function extractCompletedSentences(
  buffer: string,
  cursor: number,
): { sentences: string[]; cursor: number } {
  const sentences: string[] = []
  let nextCursor = cursor
  let i = cursor

  while (i < buffer.length) {
    if (isSentenceEnd(buffer, i)) {
      const sentence = buffer.slice(nextCursor, i + 1).trim()
      if (sentence.length >= MIN_SENTENCE_LENGTH) {
        sentences.push(sentence)
      }
      nextCursor = i + 1
      while (nextCursor < buffer.length && /\s/.test(buffer[nextCursor]!)) {
        nextCursor++
      }
      i = nextCursor
      continue
    }
    i++
  }

  return { sentences, cursor: nextCursor }
}

export function extractTrailingSentence(buffer: string, cursor: number): string | null {
  const tail = buffer.slice(cursor).trim()
  if (tail.length >= MIN_SENTENCE_LENGTH) {
    return tail
  }
  return null
}
