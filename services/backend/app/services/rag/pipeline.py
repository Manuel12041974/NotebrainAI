"""RAG Pipeline — orchestrates the full ingest and retrieval flow.

Ingest: Upload → Parse → Chunk → Embed → Store (Qdrant)
Query: Question → Embed → Retrieve → Rerank → Generate (LLM) → Citations
"""

from app.services.parsing.parser import parse_document
from app.services.rag.chunker import chunk_text
from app.services.rag.embedder import embed_texts
from app.services.rag.retriever import delete_source_chunks, retrieve, store_chunks


async def ingest_document(file_path: str, source_id: str) -> dict:
    """Full ingest pipeline: parse → chunk → embed → store.

    Returns:
        dict with: chunk_count, text_preview, pages, parser
    """
    # 1. Parse document
    parsed = await parse_document(file_path)
    text = parsed["text"]

    if not text.strip():
        return {"chunk_count": 0, "text_preview": "", "error": "No text extracted"}

    # 2. Chunk text
    chunks = chunk_text(text, source_id)

    if not chunks:
        return {"chunk_count": 0, "text_preview": text[:200]}

    # 3. Embed chunks
    chunk_texts = [c["text"] for c in chunks]
    embeddings = await embed_texts(chunk_texts)

    # 4. Store in Qdrant
    await store_chunks(chunks, embeddings)

    return {
        "chunk_count": len(chunks),
        "text_preview": text[:500],
        "pages": parsed.get("pages", 1),
        "parser": parsed.get("metadata", {}).get("parser", "unknown"),
    }


async def query_sources(
    query: str,
    notebook_id: str,
    source_ids: list[str],
    source_map: dict[str, str],
    top_k: int = 8,
) -> list[dict]:
    """Retrieve relevant chunks for a query.

    Args:
        query: User's question
        notebook_id: Notebook context
        source_ids: Selected source IDs
        source_map: {source_id: filename}
        top_k: Number of chunks to retrieve

    Returns:
        List of retrieved chunks with source info
    """
    chunks = await retrieve(query, notebook_id, source_ids, top_k=top_k)

    # Enrich with source filenames
    for chunk in chunks:
        chunk["source_filename"] = source_map.get(
            chunk["source_id"], "Fonte desconhecida"
        )

    return chunks


async def remove_source(source_id: str):
    """Remove all chunks for a source from Qdrant."""
    await delete_source_chunks(source_id)
