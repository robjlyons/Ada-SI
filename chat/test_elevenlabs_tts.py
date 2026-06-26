"""Tests for elevenlabs_tts."""



from __future__ import annotations



import unittest

from unittest.mock import AsyncMock, MagicMock, patch



import elevenlabs_tts as tts





def _mock_stream_client(chunks: list[bytes], *, status_code: int = 200) -> AsyncMock:

    async def aiter_bytes():

        for chunk in chunks:

            yield chunk



    mock_response = MagicMock()

    mock_response.status_code = status_code

    mock_response.aiter_bytes = aiter_bytes

    mock_response.aread = AsyncMock(return_value=b"error detail")



    mock_stream_ctx = AsyncMock()

    mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_response)

    mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)



    mock_client = AsyncMock()

    mock_client.stream = MagicMock(return_value=mock_stream_ctx)

    mock_client.__aenter__ = AsyncMock(return_value=mock_client)

    mock_client.__aexit__ = AsyncMock(return_value=False)

    return mock_client





class ElevenLabsTtsTests(unittest.TestCase):

    def test_missing_api_key_raises(self) -> None:

        with patch("elevenlabs_tts.get_elevenlabs_api_key", return_value=""):

            with self.assertRaises(ValueError) as ctx:

                tts._auth_headers()

            self.assertIn("not configured", str(ctx.exception))



    def test_stream_speech_uses_stream_endpoint(self) -> None:

        async def run() -> None:

            mock_client = _mock_stream_client([b"chunk-a", b"chunk-b"])



            with patch("elevenlabs_tts.get_elevenlabs_api_key", return_value="test-key"):

                with patch("elevenlabs_tts.httpx.AsyncClient", return_value=mock_client):

                    chunks = [chunk async for chunk in tts.stream_speech("Hello there")]



            self.assertEqual(chunks, [b"chunk-a", b"chunk-b"])

            url = mock_client.stream.call_args.args[1]

            self.assertIn("/stream", url)

            self.assertIn(f"output_format={tts.DEFAULT_OUTPUT_FORMAT}", url)

            self.assertIn(tts.DEFAULT_VOICE_ID, url)

            call_kwargs = mock_client.stream.call_args.kwargs

            self.assertEqual(call_kwargs["headers"]["xi-api-key"], "test-key")

            self.assertEqual(call_kwargs["json"]["text"], "Hello there")

            self.assertEqual(call_kwargs["json"]["model_id"], tts.DEFAULT_MODEL_ID)



        import asyncio



        asyncio.run(run())



    def test_stream_speech_uses_custom_voice_id(self) -> None:

        async def run() -> None:

            mock_client = _mock_stream_client([b"audio-bytes"])



            with patch("elevenlabs_tts.get_elevenlabs_api_key", return_value="test-key"):

                with patch("elevenlabs_tts.httpx.AsyncClient", return_value=mock_client):

                    await tts.stream_speech("Hi", voice_id="custom-voice-123").__anext__()



            url = mock_client.stream.call_args.args[1]

            self.assertIn("custom-voice-123", url)



        import asyncio



        asyncio.run(run())



    def test_synthesize_speech_consumes_stream(self) -> None:

        async def run() -> None:

            mock_client = _mock_stream_client([b"chunk-a", b"chunk-b"])



            with patch("elevenlabs_tts.get_elevenlabs_api_key", return_value="test-key"):

                with patch("elevenlabs_tts.httpx.AsyncClient", return_value=mock_client):

                    result = await tts.synthesize_speech("Hello there")



            self.assertEqual(result, b"chunk-a" + b"chunk-b")

            self.assertIn("/stream", mock_client.stream.call_args.args[1])



        import asyncio



        asyncio.run(run())



    def test_list_voices_parses_response(self) -> None:

        async def run() -> None:

            mock_response = MagicMock()

            mock_response.status_code = 200

            mock_response.json.return_value = {

                "voices": [{"voice_id": "v1", "name": "Alice"}],

            }



            mock_client = AsyncMock()

            mock_client.get = AsyncMock(return_value=mock_response)

            mock_client.__aenter__ = AsyncMock(return_value=mock_client)

            mock_client.__aexit__ = AsyncMock(return_value=False)



            with patch("elevenlabs_tts.get_elevenlabs_api_key", return_value="test-key"):

                with patch("elevenlabs_tts.httpx.AsyncClient", return_value=mock_client):

                    voices = await tts.list_voices()

            self.assertEqual(voices, [{"voice_id": "v1", "name": "Alice"}])



        import asyncio



        asyncio.run(run())





if __name__ == "__main__":

    unittest.main()

