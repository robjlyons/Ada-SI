"""Tests for sentence splitting used by streaming TTS (mirrors sentenceSplit.ts)."""

from __future__ import annotations

import unittest

MIN_SENTENCE_LENGTH = 3


def extract_completed_sentences(buffer: str, cursor: int) -> tuple[list[str], int]:
    sentences: list[str] = []
    next_cursor = cursor
    i = cursor
    while i < len(buffer):
        char = buffer[i]
        at_end = i + 1 >= len(buffer)
        followed_by_space = not at_end and buffer[i + 1].isspace()
        if char in ".!?" and (at_end or followed_by_space):
            sentence = buffer[next_cursor : i + 1].strip()
            if len(sentence) >= MIN_SENTENCE_LENGTH:
                sentences.append(sentence)
            next_cursor = i + 1
            while next_cursor < len(buffer) and buffer[next_cursor].isspace():
                next_cursor += 1
            i = next_cursor
            continue
        i += 1
    return sentences, next_cursor


def extract_trailing_sentence(buffer: str, cursor: int) -> str | None:
    tail = buffer[cursor:].strip()
    if len(tail) >= MIN_SENTENCE_LENGTH:
        return tail
    return None


class SentenceSplitTests(unittest.TestCase):
    def test_extracts_single_sentence(self) -> None:
        buffer = "Hello world."
        sentences, cursor = extract_completed_sentences(buffer, 0)
        self.assertEqual(sentences, ["Hello world."])
        self.assertEqual(cursor, len(buffer))

    def test_extracts_multiple_sentences_incrementally(self) -> None:
        buffer = "First sentence. Second one here!"
        sentences, cursor = extract_completed_sentences(buffer, 0)
        self.assertEqual(sentences, ["First sentence.", "Second one here!"])
        self.assertEqual(cursor, len(buffer))

        partial = "First sentence. Second"
        sentences, cursor = extract_completed_sentences(partial, 0)
        self.assertEqual(sentences, ["First sentence."])
        self.assertEqual(cursor, len("First sentence. "))

    def test_skips_short_fragments(self) -> None:
        buffer = "I. This is long enough."
        sentences, cursor = extract_completed_sentences(buffer, 0)
        self.assertEqual(sentences, ["This is long enough."])
        self.assertEqual(cursor, len(buffer))

    def test_trailing_sentence_without_punctuation(self) -> None:
        buffer = "Hello there."
        _, cursor = extract_completed_sentences(buffer, 0)
        tail = extract_trailing_sentence("Hello there. Goodbye friend", cursor)
        self.assertEqual(tail, "Goodbye friend")

    def test_question_and_exclamation(self) -> None:
        buffer = "Are you ready? Yes I am!"
        sentences, _ = extract_completed_sentences(buffer, 0)
        self.assertEqual(sentences, ["Are you ready?", "Yes I am!"])


if __name__ == "__main__":
    unittest.main()
