const MIN_SENTENCE_LENGTH = 3

export function extractCompletedSentences(
  buffer: string,
  cursor: number,
): { sentences: string[]; cursor: number } {
  const sentences: string[] = []
  let nextCursor = cursor
  let i = cursor

  while (i < buffer.length) {
    const char = buffer[i]
    const atEnd = i + 1 >= buffer.length
    const followedBySpace = !atEnd && /\s/.test(buffer[i + 1]!)
    if ((char === '.' || char === '?' || char === '!') && (atEnd || followedBySpace)) {
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
