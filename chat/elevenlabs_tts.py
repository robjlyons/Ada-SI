"""ElevenLabs text-to-speech client."""

from __future__ import annotations

from collections.abc import AsyncIterator

import httpx

from secrets_config import get_effective_secret

ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"
DEFAULT_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"
DEFAULT_MODEL_ID = "eleven_turbo_v2_5"
DEFAULT_OUTPUT_FORMAT = "mp3_44100_128"
DEFAULT_VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}


def get_elevenlabs_api_key() -> str:
    return get_effective_secret("ELEVENLABS_API_KEY")


def _auth_headers() -> dict[str, str]:
    api_key = get_elevenlabs_api_key()
    if not api_key:
        raise ValueError("ElevenLabs API key is not configured.")
    return {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }


async def stream_speech(
    text: str,
    *,
    voice_id: str | None = None,
    timeout: float = 60.0,
) -> AsyncIterator[bytes]:
    trimmed = text.strip()
    if not trimmed:
        raise ValueError("Text is required for text-to-speech.")
    vid = (voice_id or DEFAULT_VOICE_ID).strip() or DEFAULT_VOICE_ID
    url = (
        f"{ELEVENLABS_API_BASE}/text-to-speech/{vid}/stream"
        f"?output_format={DEFAULT_OUTPUT_FORMAT}"
    )
    payload = {
        "text": trimmed,
        "model_id": DEFAULT_MODEL_ID,
        "voice_settings": DEFAULT_VOICE_SETTINGS,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream("POST", url, headers=_auth_headers(), json=payload) as response:
            if response.status_code >= 400:
                body = await response.aread()
                detail = body.decode(errors="replace").strip() or response.reason_phrase
                raise ValueError(f"ElevenLabs TTS failed ({response.status_code}): {detail}")
            async for chunk in response.aiter_bytes():
                if chunk:
                    yield chunk


async def synthesize_speech(
    text: str,
    *,
    voice_id: str | None = None,
    timeout: float = 60.0,
) -> bytes:
    chunks: list[bytes] = []
    async for chunk in stream_speech(text, voice_id=voice_id, timeout=timeout):
        chunks.append(chunk)
    return b"".join(chunks)


async def list_voices(*, timeout: float = 30.0) -> list[dict]:
    url = f"{ELEVENLABS_API_BASE}/voices"
    headers = _auth_headers()
    headers["Accept"] = "application/json"
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, headers=headers)
        if response.status_code >= 400:
            detail = response.text.strip() or response.reason_phrase
            raise ValueError(f"ElevenLabs voices failed ({response.status_code}): {detail}")
        data = response.json()
    voices = data.get("voices", []) if isinstance(data, dict) else []
    result: list[dict] = []
    for voice in voices:
        if not isinstance(voice, dict):
            continue
        voice_id = voice.get("voice_id") or voice.get("id")
        name = voice.get("name")
        if voice_id and name:
            result.append({"voice_id": voice_id, "name": name})
    return result
