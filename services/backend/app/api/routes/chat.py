from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter()


@router.get("/{notebook_id}/messages")
async def list_messages(notebook_id: str):
    return {"messages": []}


@router.post("/{notebook_id}/ask")
async def ask_question(notebook_id: str):
    """Chat with sources using RAG. Returns streaming SSE response."""
    return {"message": "TODO: implement RAG chat with SSE streaming"}
