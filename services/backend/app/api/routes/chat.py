"""Chat endpoints — RAG-powered Q&A with streaming SSE and citations."""

import json
import uuid

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.api.routes.sources import get_source_ids, get_source_map
from app.services.llm.provider import chat_with_sources
from app.services.rag.pipeline import query_sources

router = APIRouter()

# In-memory message store (will be replaced with PostgreSQL)
_messages: dict[str, list[dict]] = {}


class AskRequest(BaseModel):
    query: str
    source_ids: list[str] | None = None  # If None, use all selected sources


@router.get("/{notebook_id}/messages")
async def list_messages(notebook_id: str) -> dict:
    messages = _messages.get(notebook_id, [])
    return {"messages": messages}


@router.post("/{notebook_id}/ask")
async def ask_question(notebook_id: str, request: AskRequest):
    """Chat with sources using RAG. Returns streaming SSE response with citations."""

    query = request.query
    source_ids = request.source_ids or get_source_ids(notebook_id)
    source_map = get_source_map(notebook_id)

    if not source_ids:
        return EventSourceResponse(
            _no_sources_stream(query),
            media_type="text/event-stream",
        )

    # Store user message
    if notebook_id not in _messages:
        _messages[notebook_id] = []

    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": query,
        "citations": None,
    }
    _messages[notebook_id].append(user_msg)

    return EventSourceResponse(
        _rag_stream(query, notebook_id, source_ids, source_map),
        media_type="text/event-stream",
    )


async def _rag_stream(
    query: str,
    notebook_id: str,
    source_ids: list[str],
    source_map: dict[str, str],
):
    """Stream RAG response: retrieve → generate → emit SSE events."""

    # 1. Retrieve relevant chunks
    try:
        chunks = await query_sources(query, notebook_id, source_ids, source_map)
    except Exception as e:
        yield {"event": "error", "data": json.dumps({"error": f"Retrieval failed: {e}"})}
        return

    # 2. Send retrieved sources info
    yield {
        "event": "sources",
        "data": json.dumps({
            "chunks_retrieved": len(chunks),
            "sources_used": list({c["source_id"] for c in chunks}),
        }),
    }

    # 3. Stream LLM response with citations
    assistant_content = ""
    citations = {}

    async for event in chat_with_sources(query, chunks, source_map):
        if event["type"] == "text":
            assistant_content += event["content"]
            yield {"event": "text", "data": json.dumps({"content": event["content"]})}
        elif event["type"] == "citations":
            citations = event["citations"]
            yield {"event": "citations", "data": json.dumps({"citations": citations})}
        elif event["type"] == "done":
            # Store assistant message
            assistant_msg = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": assistant_content,
                "citations": citations,
            }
            _messages.setdefault(notebook_id, []).append(assistant_msg)

            yield {"event": "done", "data": json.dumps({"message_id": assistant_msg["id"]})}


async def _no_sources_stream(query: str):
    """Response when no sources are available."""
    yield {
        "event": "text",
        "data": json.dumps({
            "content": "Nenhuma fonte disponível. Por favor, faça upload de documentos primeiro."
        }),
    }
    yield {"event": "done", "data": json.dumps({})}
