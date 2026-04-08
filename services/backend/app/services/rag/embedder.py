"""Embedding service — converts text to vector representations.

Supports multiple providers with Cohere embed-v4 as default (MTEB 65.2).
Falls back to local sentence-transformers if no API key is configured.

References:
- MTEB Benchmark Leaderboard (April 2026)
- Cohere embed-v4: 65.2 MTEB score, 100+ languages
"""

import hashlib
from functools import lru_cache

from app.core.config import settings

EMBEDDING_DIM = 1024  # Cohere embed-v4 default


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts. Returns list of float vectors."""
    if settings.cohere_api_key:
        return await _embed_cohere(texts)
    else:
        return _embed_local(texts)


async def embed_query(query: str) -> list[float]:
    """Embed a single query (uses search_query input type for Cohere)."""
    if settings.cohere_api_key:
        return (await _embed_cohere([query], input_type="search_query"))[0]
    else:
        return _embed_local([query])[0]


async def _embed_cohere(
    texts: list[str], input_type: str = "search_document"
) -> list[list[float]]:
    """Embed using Cohere embed-v4 API."""
    import cohere

    client = cohere.AsyncClientV2(api_key=settings.cohere_api_key)

    # Cohere has a batch limit of 96 texts
    all_embeddings = []
    for i in range(0, len(texts), 96):
        batch = texts[i : i + 96]
        response = await client.embed(
            texts=batch,
            model="embed-v4.0",
            input_type=input_type,
            embedding_types=["float"],
        )
        all_embeddings.extend(response.embeddings.float_)

    return all_embeddings


def _embed_local(texts: list[str]) -> list[list[float]]:
    """Fallback: embed using sentence-transformers locally."""
    try:
        from sentence_transformers import SentenceTransformer

        model = _get_local_model()
        embeddings = model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()
    except ImportError:
        # Ultimate fallback: deterministic hash-based pseudo-embeddings (for dev only)
        return [_hash_embed(t) for t in texts]


@lru_cache(maxsize=1)
def _get_local_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("all-MiniLM-L6-v2")


def _hash_embed(text: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """Dev-only: deterministic pseudo-embedding from text hash."""
    h = hashlib.sha512(text.encode()).digest()
    # Expand hash to fill dimension
    extended = h * (dim // len(h) + 1)
    values = [b / 255.0 * 2 - 1 for b in extended[:dim]]
    # Normalize
    norm = sum(v * v for v in values) ** 0.5
    return [v / norm for v in values] if norm > 0 else values
