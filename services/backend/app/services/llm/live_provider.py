"""Live Assistant provider — Multimodal real-time AI with model routing.

Routing priority:
  1. Ollama (localhost) → offline mode, text-only
  2. Gemini 3.1 Flash Live → primary online, native audio + video
  3. Gemini text streaming → fallback when Live API unavailable

Architecture:
  - Ollama: HTTP chat API at /api/chat (streaming JSON)
  - Gemini Live: google-genai SDK async live session (bidirectional audio/video)
  - Gemini text: google-genai SDK generate_content_stream (text-only fallback)
"""

from __future__ import annotations

import asyncio
import base64
import logging
from enum import Enum
from typing import TYPE_CHECKING

import httpx

from app.core.config import settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

logger = logging.getLogger(__name__)


class LiveBackend(str, Enum):
    OLLAMA = "ollama"
    GEMINI_LIVE = "gemini-live"
    GEMINI_TEXT = "gemini-text"


async def detect_backend() -> LiveBackend:
    """Detect the best available backend for the live assistant.

    Priority: Ollama (offline) → Gemini Live (online) → Gemini text (fallback).
    """
    # 1. Try Ollama
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{settings.ollama_url}/api/tags")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                names = [m.get("name", "") for m in models]
                # Check if our configured model is available
                if any(settings.ollama_live_model.split(":")[0] in n for n in names):
                    logger.info("Live backend: Ollama (%s)", settings.ollama_live_model)
                    return LiveBackend.OLLAMA
                if names:
                    logger.info("Live backend: Ollama (using first available: %s)", names[0])
                    return LiveBackend.OLLAMA
    except Exception:
        pass

    # 2. Try Gemini Live
    if settings.gemini_api_key:
        try:
            from google import genai  # noqa: F401

            logger.info("Live backend: Gemini Live (%s)", settings.gemini_live_model)
            return LiveBackend.GEMINI_LIVE
        except ImportError:
            logger.info("Live backend: Gemini text (google-genai not installed)")
            return LiveBackend.GEMINI_TEXT

    logger.warning("Live backend: none available")
    raise RuntimeError("Nenhum backend disponível. Configure Ollama ou GEMINI_API_KEY.")


# ── Ollama backend ──────────────────────────────────────────────────────


async def ollama_chat_stream(
    system_context: str,
    messages: list[dict],
) -> AsyncGenerator[dict, None]:
    """Stream text responses from Ollama chat API."""
    payload = {
        "model": settings.ollama_live_model,
        "messages": [
            {"role": "system", "content": system_context},
            *messages,
        ],
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_url}/api/chat",
            json=payload,
        ) as resp:
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                import json

                data = json.loads(line)
                if msg := data.get("message", {}).get("content"):
                    yield {"type": "text", "content": msg}
                if data.get("done"):
                    break


# ── Gemini Live backend ─────────────────────────────────────────────────


class GeminiLiveSession:
    """Manages a bidirectional Gemini Live API session."""

    def __init__(self, system_context: str):
        self.system_context = system_context
        self._session = None
        self._client = None
        self._receive_task: asyncio.Task | None = None
        self._output_queue: asyncio.Queue[dict] = asyncio.Queue()

    async def connect(self) -> None:
        from google import genai
        from google.genai import types

        self._client = genai.Client(api_key=settings.gemini_api_key)

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO", "TEXT"],
            system_instruction=types.Content(
                parts=[types.Part(text=self.system_context)]
            ),
        )

        self._session = await self._client.aio.live.connect(
            model=settings.gemini_live_model,
            config=config,
        ).__aenter__()

        # Start background receiver
        self._receive_task = asyncio.create_task(self._receive_loop())

    async def _receive_loop(self) -> None:
        """Background loop reading Gemini Live responses."""
        try:
            async for response in self._session.receive():
                server = response.server_content
                if server is None:
                    continue

                # Text parts
                if server.model_turn and server.model_turn.parts:
                    for part in server.model_turn.parts:
                        if part.text:
                            await self._output_queue.put(
                                {"type": "text", "content": part.text}
                            )
                        if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                            audio_b64 = base64.b64encode(part.inline_data.data).decode()
                            await self._output_queue.put(
                                {"type": "audio", "data": audio_b64}
                            )

                # Turn complete signal
                if server.turn_complete:
                    await self._output_queue.put({"type": "turn_complete"})

        except Exception as e:
            logger.error("Gemini Live receive error: %s", e)
            await self._output_queue.put({"type": "error", "error": str(e)})

    async def send_audio(self, pcm_base64: str) -> None:
        """Send PCM audio chunk to Gemini Live session."""
        from google.genai import types

        audio_bytes = base64.b64decode(pcm_base64)
        await self._session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000"),
        )

    async def send_frame(self, jpeg_base64: str) -> None:
        """Send video/screen frame to Gemini Live session."""
        from google.genai import types

        frame_bytes = base64.b64decode(jpeg_base64)
        await self._session.send_realtime_input(
            video=types.Blob(data=frame_bytes, mime_type="image/jpeg"),
        )

    async def send_text(self, text: str) -> None:
        """Send text message to Gemini Live session."""
        await self._session.send_client_content(
            turns=text,
            turn_complete=True,
        )

    async def receive(self) -> dict:
        """Get next output from Gemini Live session."""
        return await self._output_queue.get()

    async def close(self) -> None:
        """Clean up the session."""
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
        if self._session:
            await self._session.__aexit__(None, None, None)


# ── Gemini text fallback ─────────────────────────────────────────────────


async def gemini_text_stream(
    system_context: str,
    user_message: str,
) -> AsyncGenerator[dict, None]:
    """Fallback: stream text from Gemini (non-live, no audio)."""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.gemini_api_key)

        response = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_context,
                max_output_tokens=2048,
            ),
        )

        for chunk in response:
            if chunk.text:
                yield {"type": "text", "content": chunk.text}
    except ImportError:
        yield {
            "type": "text",
            "content": "google-genai não instalado. Execute: pip install google-genai",
        }
