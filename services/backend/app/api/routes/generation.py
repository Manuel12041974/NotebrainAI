from enum import Enum

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

router = APIRouter()


class GenerationType(str, Enum):
    audio = "audio"
    slides = "slides"
    video = "video"
    mindmap = "mindmap"
    report = "report"
    studycards = "studycards"
    quiz = "quiz"
    infographic = "infographic"
    datatable = "datatable"


class GenerationRequest(BaseModel):
    notebook_id: str
    type: GenerationType
    config: dict = {}


@router.post("/start")
async def start_generation(request: GenerationRequest):
    """Start an async generation job. Returns job_id for progress tracking."""
    return {
        "job_id": "TODO",
        "type": request.type,
        "status": "queued",
    }


@router.get("/{job_id}/progress")
async def generation_progress(job_id: str):
    """SSE endpoint for real-time generation progress updates."""
    return {"job_id": job_id, "status": "TODO: implement SSE progress"}


@router.get("/{job_id}/result")
async def generation_result(job_id: str):
    """Get the result of a completed generation."""
    return {"job_id": job_id, "status": "TODO"}


@router.delete("/{job_id}")
async def cancel_generation(job_id: str):
    """Cancel a running generation job."""
    return {"message": f"cancelled {job_id}"}
