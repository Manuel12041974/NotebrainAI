from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, chat, generation, live, notebooks, research, sources
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="NotebrainAI",
    description="AI-powered document intelligence platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(notebooks.router, prefix="/api/notebooks", tags=["notebooks"])
app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(research.router, prefix="/api/research", tags=["research"])
app.include_router(live.router, prefix="/api/live", tags=["live-assistant"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
