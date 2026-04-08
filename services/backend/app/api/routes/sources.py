"""Source management endpoints — upload, list, delete."""

import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.rag.pipeline import ingest_document, remove_source

router = APIRouter()

# In-memory store (will be replaced with PostgreSQL in Phase 3)
_sources: dict[str, dict] = {}

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


class SourceResponse(BaseModel):
    id: str
    notebook_id: str
    type: str
    filename: str | None = None
    status: str
    chunk_count: int = 0
    summary: str | None = None


@router.get("/{notebook_id}")
async def list_sources(notebook_id: str) -> dict:
    sources = [
        s for s in _sources.values() if s.get("notebook_id") == notebook_id
    ]
    return {"sources": sources, "count": len(sources)}


@router.post("/{notebook_id}/upload")
async def upload_source(notebook_id: str, file: UploadFile) -> SourceResponse:
    """Upload a file, parse it, chunk it, embed it, and store in Qdrant."""
    source_id = str(uuid.uuid4())
    filename = file.filename or "unknown"

    # Determine type from extension
    ext = Path(filename).suffix.lower()
    type_map = {
        ".pdf": "pdf",
        ".docx": "docx",
        ".doc": "docx",
        ".txt": "text",
        ".md": "text",
        ".csv": "text",
    }
    source_type = type_map.get(ext, "text")

    # Save file to disk
    file_path = UPLOAD_DIR / f"{source_id}{ext}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Register source as "processing"
    source_data = {
        "id": source_id,
        "notebook_id": notebook_id,
        "type": source_type,
        "filename": filename,
        "file_path": str(file_path),
        "status": "processing",
        "chunk_count": 0,
        "summary": None,
    }
    _sources[source_id] = source_data

    # Run ingest pipeline
    try:
        result = await ingest_document(str(file_path), source_id)
        source_data["status"] = "ready"
        source_data["chunk_count"] = result["chunk_count"]
        source_data["summary"] = result.get("text_preview", "")[:300]
    except Exception as e:
        source_data["status"] = "error"
        source_data["summary"] = f"Erro: {str(e)[:200]}"

    return SourceResponse(**source_data)


@router.delete("/{source_id}")
async def delete_source(source_id: str) -> dict:
    if source_id not in _sources:
        raise HTTPException(status_code=404, detail="Source not found")

    source = _sources.pop(source_id)

    # Delete file from disk
    file_path = source.get("file_path")
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Delete chunks from Qdrant
    try:
        await remove_source(source_id)
    except Exception:
        pass  # Qdrant may not be running

    return {"message": "deleted", "id": source_id}


@router.get("/store/all")
async def get_all_sources() -> dict:
    """Debug endpoint: get all sources across all notebooks."""
    return {"sources": list(_sources.values()), "count": len(_sources)}


def get_source_map(notebook_id: str) -> dict[str, str]:
    """Helper: get {source_id: filename} map for a notebook."""
    return {
        s["id"]: s["filename"]
        for s in _sources.values()
        if s.get("notebook_id") == notebook_id and s.get("status") == "ready"
    }


def get_source_ids(notebook_id: str) -> list[str]:
    """Helper: get list of ready source IDs for a notebook."""
    return [
        s["id"]
        for s in _sources.values()
        if s.get("notebook_id") == notebook_id and s.get("status") == "ready"
    ]
