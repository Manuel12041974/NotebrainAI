"""Hybrid retriever — vector search + reranking.

Primary: Qdrant (when Docker is running)
Fallback: ChromaDB (local, no Docker needed)

References:
- Full Cascade (vector + reranker): 91% accuracy @ 75ms
"""

import logging

from app.core.config import settings
from app.services.rag.embedder import EMBEDDING_DIM, embed_query, embed_texts

logger = logging.getLogger(__name__)

COLLECTION_NAME = "notebrainai_chunks"

# ─── Backend detection ───

_use_chroma: bool | None = None


def _should_use_chroma() -> bool:
    global _use_chroma
    if _use_chroma is not None:
        return _use_chroma
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(url=settings.qdrant_url, timeout=2)
        client.get_collections()
        _use_chroma = False
        logger.info("Using Qdrant as vector store")
    except Exception:
        _use_chroma = True
        logger.info("Qdrant unavailable, falling back to ChromaDB (local)")
    return _use_chroma


# ─── ChromaDB fallback ───

_chroma_collection = None


def _get_chroma_collection():
    global _chroma_collection
    if _chroma_collection is None:
        import chromadb
        client = chromadb.PersistentClient(path="./data/chroma")
        _chroma_collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _chroma_collection


async def store_chunks(chunks: list[dict], embeddings: list[list[float]]):
    """Store chunks with embeddings in the vector store."""
    if _should_use_chroma():
        await _store_chroma(chunks, embeddings)
    else:
        await _store_qdrant(chunks, embeddings)


async def retrieve(
    query: str,
    notebook_id: str,
    source_ids: list[str],
    top_k: int = 10,
) -> list[dict]:
    """Retrieve relevant chunks for a query."""
    if _should_use_chroma():
        return await _retrieve_chroma(query, source_ids, top_k)
    else:
        return await _retrieve_qdrant(query, source_ids, top_k)


async def delete_source_chunks(source_id: str):
    """Delete all chunks for a source."""
    if _should_use_chroma():
        col = _get_chroma_collection()
        col.delete(where={"source_id": source_id})
    else:
        await _delete_qdrant(source_id)


# ─── ChromaDB implementation ───

async def _store_chroma(chunks: list[dict], embeddings: list[list[float]]):
    col = _get_chroma_collection()
    col.add(
        ids=[c["id"] for c in chunks],
        embeddings=embeddings,
        documents=[c["text"] for c in chunks],
        metadatas=[
            {"source_id": c["source_id"], "position": c["position"]}
            for c in chunks
        ],
    )
    logger.info(f"Stored {len(chunks)} chunks in ChromaDB")


async def _retrieve_chroma(
    query: str, source_ids: list[str], top_k: int
) -> list[dict]:
    col = _get_chroma_collection()
    query_embedding = await embed_query(query)

    where_filter = None
    if source_ids:
        if len(source_ids) == 1:
            where_filter = {"source_id": source_ids[0]}
        else:
            where_filter = {"source_id": {"$in": source_ids}}

    results = col.query(
        query_embeddings=[query_embedding],
        n_results=top_k * 2,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    candidates = []
    if results["documents"] and results["documents"][0]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            candidates.append({
                "text": doc,
                "source_id": meta["source_id"],
                "position": meta.get("position", 0),
                "score": 1 - dist,  # ChromaDB returns distance, not similarity
            })

    # Rerank with Cohere if available
    if settings.cohere_api_key and candidates:
        candidates = await _rerank_cohere(query, candidates, top_k)
    else:
        candidates = candidates[:top_k]

    return candidates


# ─── Qdrant implementation ───

async def _store_qdrant(chunks: list[dict], embeddings: list[list[float]]):
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams

    client = AsyncQdrantClient(url=settings.qdrant_url)

    # Ensure collection exists
    collections = await client.get_collections()
    if COLLECTION_NAME not in [c.name for c in collections.collections]:
        await client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )

    points = [
        PointStruct(
            id=chunk["id"],
            vector=embedding,
            payload={
                "text": chunk["text"],
                "source_id": chunk["source_id"],
                "position": chunk["position"],
            },
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]

    for i in range(0, len(points), 100):
        await client.upsert(collection_name=COLLECTION_NAME, points=points[i:i + 100])


async def _retrieve_qdrant(
    query: str, source_ids: list[str], top_k: int
) -> list[dict]:
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import FieldCondition, Filter, MatchValue, SearchParams

    client = AsyncQdrantClient(url=settings.qdrant_url)
    query_vector = await embed_query(query)

    search_filter = None
    if source_ids:
        search_filter = Filter(
            should=[
                FieldCondition(key="source_id", match=MatchValue(value=sid))
                for sid in source_ids
            ]
        )

    results = await client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=top_k * 2,
        search_params=SearchParams(hnsw_ef=128, exact=False),
    )

    candidates = [
        {
            "text": hit.payload["text"],
            "source_id": hit.payload["source_id"],
            "position": hit.payload.get("position", 0),
            "score": hit.score,
        }
        for hit in results
    ]

    if settings.cohere_api_key and candidates:
        candidates = await _rerank_cohere(query, candidates, top_k)
    else:
        candidates = candidates[:top_k]

    return candidates


async def _delete_qdrant(source_id: str):
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import FieldCondition, Filter, MatchValue

    client = AsyncQdrantClient(url=settings.qdrant_url)
    await client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[FieldCondition(key="source_id", match=MatchValue(value=source_id))]
        ),
    )


# ─── Reranking ───

async def _rerank_cohere(
    query: str, candidates: list[dict], top_k: int
) -> list[dict]:
    """Rerank with Cohere Rerank (ELO 1629)."""
    try:
        import cohere
        client = cohere.AsyncClientV2(api_key=settings.cohere_api_key)
        response = await client.rerank(
            model="rerank-v3.5",
            query=query,
            documents=[c["text"] for c in candidates],
            top_n=top_k,
        )
        reranked = []
        for result in response.results:
            candidate = candidates[result.index]
            candidate["score"] = result.relevance_score
            reranked.append(candidate)
        return reranked
    except Exception:
        return candidates[:top_k]
