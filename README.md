# NotebrainAI

AI-powered document intelligence platform that surpasses Google NotebookLM.

## Features

- **Smart Sources**: Upload PDFs, DOCX, URLs, YouTube — up to 500 sources per notebook
- **RAG Chat**: Hybrid search (BM25 + vector + reranking) with inline citations
- **Deep Research**: Autonomous multi-step agent for web investigation
- **9 Generation Types**: Audio podcasts, slides, video, mind maps, reports, flashcards, quizzes, infographics, data tables
- **Live Assistant**: Real-time voice/video/screenshare AI interaction (Gemini 3.1 Flash Live)
- **Progress Tracking**: Visual progress bars with step descriptions and time estimates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + shadcn/ui + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + Celery + Redis |
| Embeddings | Cohere embed-v4 (MTEB 65.2) |
| LLM | Claude Opus 4.6 + DeepSeek V3.2 + Gemini 3.1 Flash |
| Reranking | Cohere Rerank 4 Pro |
| Vector DB | Qdrant (hybrid BM25 + vector search) |
| RAG | LlamaIndex + LangGraph |
| Doc Parsing | Docling (97.9% accuracy) + Marker |
| TTS | Fish Audio S2 Pro |
| Monorepo | Turborepo + pnpm |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Qdrant, Redis)
docker compose -f docker/docker-compose.yml up -d

# Start frontend (port 3002)
pnpm --filter web dev

# Start backend (port 8000)
cd services/backend && uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
NotebrainAI/
├── apps/web/          # Next.js 16 frontend
├── apps/desktop/      # Tauri 2.0 desktop app
├── packages/          # Shared UI, types, configs
├── services/backend/  # FastAPI + RAG pipeline
└── docker/            # Dev infrastructure
```

## License

MIT
