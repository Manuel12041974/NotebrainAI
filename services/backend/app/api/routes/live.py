"""Live Assistant — Real-time voice/video/screenshare AI interaction.

Routing: Ollama (offline) → Gemini 3.1 Flash Live (online) → Gemini text (fallback)

Protocol:
  Client → Server:
    {"type": "start", "mode": "voice|video|screenshare"}
    {"type": "audio", "data": "<base64 PCM 16-bit 16kHz>"}
    {"type": "frame", "data": "<base64 JPEG>"}
    {"type": "text", "content": "user message"}
    {"type": "stop"}

  Server → Client:
    {"type": "status", "status": "connected|disconnected", "provider": "..."}
    {"type": "audio", "data": "<base64 PCM 24kHz>"}
    {"type": "text", "content": "...", "citations": [...]}
    {"type": "turn_complete"}
    {"type": "error", "error": "..."}
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.llm.live_provider import (
    GeminiLiveSession,
    LiveBackend,
    detect_backend,
    gemini_text_stream,
    ollama_chat_stream,
)

logger = logging.getLogger(__name__)

router = APIRouter()

SYSTEM_PROMPT_LIVE = """Você é o NotebrainAI Live, um assistente de inteligência documental em tempo real.
Responda de forma conversacional, clara e concisa em português (Portugal).
Quando relevante, cite as fontes com [N].
Se o utilizador partilhar o ecrã ou vídeo, descreva e analise o que observa.
Mantenha as respostas curtas para manter o fluxo de conversação natural."""


def _build_context(rag_chunks: list[dict], source_map: dict[str, str]) -> str:
    """Build system instruction with RAG context for the live session."""
    if not rag_chunks:
        return SYSTEM_PROMPT_LIVE

    parts = [SYSTEM_PROMPT_LIVE, "\n\nFontes disponíveis:"]
    for i, chunk in enumerate(rag_chunks, 1):
        filename = source_map.get(chunk.get("source_id", ""), "Fonte")
        parts.append(f"\n[{i}] ({filename}): {chunk['text'][:500]}")

    return "\n".join(parts)


async def _get_rag_context(notebook_id: str) -> tuple[list[dict], dict[str, str]]:
    """Retrieve source chunks for the notebook to use as live context."""
    try:
        from app.api.routes.sources import get_source_ids, get_source_map
        from app.services.rag.retriever import retrieve

        source_ids = get_source_ids(notebook_id)
        source_map = get_source_map(notebook_id)

        if not source_ids:
            return [], {}

        # Get a broad summary of sources (no specific query yet)
        chunks = await retrieve(
            query="resumo geral das fontes disponíveis",
            source_ids=source_ids,
            top_k=5,
        )
        return chunks, source_map
    except Exception as e:
        logger.warning("Could not load RAG context: %s", e)
        return [], {}


@router.websocket("/{notebook_id}/session")
async def live_session(websocket: WebSocket, notebook_id: str):
    """WebSocket endpoint for real-time AI assistant session."""
    await websocket.accept()
    logger.info("Live session started for notebook %s", notebook_id)

    gemini_session: GeminiLiveSession | None = None

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # ── START SESSION ────────────────────────────────────────
            if msg_type == "start":
                mode = data.get("mode", "voice")

                try:
                    backend = await detect_backend()
                except RuntimeError as e:
                    await websocket.send_json({
                        "type": "error",
                        "error": str(e),
                    })
                    continue

                # Load RAG context
                rag_chunks, source_map = await _get_rag_context(notebook_id)
                system_context = _build_context(rag_chunks, source_map)

                await websocket.send_json({
                    "type": "status",
                    "status": "connected",
                    "provider": backend.value,
                    "mode": mode,
                    "sourceCount": len(rag_chunks),
                })

                # ── Gemini Live: start bidirectional session
                if backend == LiveBackend.GEMINI_LIVE:
                    gemini_session = GeminiLiveSession(system_context)
                    await gemini_session.connect()

                    # Start forwarding Gemini responses to client
                    async def forward_gemini():
                        try:
                            while True:
                                msg = await gemini_session.receive()
                                await websocket.send_json(msg)
                        except Exception:
                            pass

                    asyncio.create_task(forward_gemini())

            # ── AUDIO DATA ───────────────────────────────────────────
            elif msg_type == "audio":
                audio_b64 = data.get("data", "")

                if gemini_session:
                    await gemini_session.send_audio(audio_b64)

                # Ollama doesn't support native audio — ignore audio in that mode

            # ── VIDEO/SCREEN FRAME ───────────────────────────────────
            elif msg_type == "frame":
                frame_b64 = data.get("data", "")

                if gemini_session:
                    await gemini_session.send_frame(frame_b64)

            # ── TEXT MESSAGE ─────────────────────────────────────────
            elif msg_type == "text":
                content = data.get("content", "")

                if gemini_session:
                    await gemini_session.send_text(content)
                else:
                    # Ollama or Gemini text fallback
                    try:
                        backend = await detect_backend()
                    except RuntimeError:
                        backend = LiveBackend.GEMINI_TEXT

                    rag_chunks, source_map = await _get_rag_context(notebook_id)
                    system_context = _build_context(rag_chunks, source_map)

                    if backend == LiveBackend.OLLAMA:
                        messages = [{"role": "user", "content": content}]
                        full_text = ""
                        async for chunk in ollama_chat_stream(system_context, messages):
                            full_text += chunk.get("content", "")
                            await websocket.send_json(chunk)
                        await websocket.send_json({"type": "turn_complete"})
                    else:
                        async for chunk in gemini_text_stream(system_context, content):
                            await websocket.send_json(chunk)
                        await websocket.send_json({"type": "turn_complete"})

            # ── STOP SESSION ─────────────────────────────────────────
            elif msg_type == "stop":
                if gemini_session:
                    await gemini_session.close()
                    gemini_session = None
                await websocket.send_json({"type": "status", "status": "disconnected"})
                break

    except WebSocketDisconnect:
        logger.info("Live session disconnected for notebook %s", notebook_id)
    except Exception as e:
        logger.error("Live session error: %s", e)
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
    finally:
        if gemini_session:
            await gemini_session.close()
