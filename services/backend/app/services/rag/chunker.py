"""Text chunker — splits documents into retrieval-optimized chunks.

Strategy: Recursive character splitting with 512 tokens, 10-20% overlap.
This achieves 69% baseline accuracy per 2026 benchmarks (Vecta, 50 papers).

References:
- "RAG Chunking Strategies: The 2026 Benchmark Guide" (PremAI)
- Recursive splitting outperforms semantic chunking (54%) in end-to-end accuracy
"""

import re
import uuid


def chunk_text(
    text: str,
    source_id: str,
    chunk_size: int = 512,
    chunk_overlap: int = 64,
) -> list[dict]:
    """Split text into overlapping chunks optimized for RAG retrieval.

    Args:
        text: Full document text
        source_id: UUID of the source document
        chunk_size: Target chunk size in words (~512 tokens ≈ 384 words)
        chunk_overlap: Overlap between chunks in words

    Returns:
        List of chunk dicts with: id, text, source_id, position, metadata
    """
    if not text.strip():
        return []

    # Split by paragraphs first, then by sentences
    paragraphs = re.split(r"\n\s*\n", text)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    chunks = []
    current_chunk: list[str] = []
    current_size = 0
    position = 0

    for para in paragraphs:
        para_words = len(para.split())

        # If single paragraph exceeds chunk_size, split by sentences
        if para_words > chunk_size:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            for sentence in sentences:
                sent_words = len(sentence.split())
                if current_size + sent_words > chunk_size and current_chunk:
                    chunks.append(_make_chunk(current_chunk, source_id, position))
                    position += 1
                    # Keep overlap
                    overlap_text = " ".join(current_chunk)[-chunk_overlap * 5 :]
                    current_chunk = [overlap_text] if overlap_text else []
                    current_size = len(overlap_text.split()) if overlap_text else 0
                current_chunk.append(sentence)
                current_size += sent_words
        elif current_size + para_words > chunk_size and current_chunk:
            chunks.append(_make_chunk(current_chunk, source_id, position))
            position += 1
            # Keep overlap from end of previous chunk
            overlap_text = " ".join(current_chunk)[-chunk_overlap * 5 :]
            current_chunk = [overlap_text, para] if overlap_text else [para]
            current_size = len(overlap_text.split()) + para_words if overlap_text else para_words
        else:
            current_chunk.append(para)
            current_size += para_words

    # Final chunk
    if current_chunk:
        chunks.append(_make_chunk(current_chunk, source_id, position))

    return chunks


def _make_chunk(paragraphs: list[str], source_id: str, position: int) -> dict:
    text = "\n\n".join(paragraphs)
    return {
        "id": str(uuid.uuid4()),
        "text": text,
        "source_id": source_id,
        "position": position,
        "metadata": {
            "word_count": len(text.split()),
            "char_count": len(text),
        },
    }
