from enum import Enum

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ResearchMode(str, Enum):
    quick = "quick"
    deep = "deep"


class ResearchRequest(BaseModel):
    notebook_id: str
    query: str
    mode: ResearchMode = ResearchMode.quick
    source_type: str = "web"  # web, youtube


@router.post("/start")
async def start_research(request: ResearchRequest):
    """Start a research job. Deep research uses multi-step agent."""
    return {
        "job_id": "TODO",
        "mode": request.mode,
        "status": "planning",
    }


@router.get("/{job_id}/progress")
async def research_progress(job_id: str):
    """SSE endpoint for research progress (steps 1/5, etc.)."""
    return {"job_id": job_id, "status": "TODO: implement SSE progress"}
