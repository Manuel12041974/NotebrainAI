"""Multi-LLM provider — routes to the best model for each task.

Models (April 2026 benchmarks):
- Claude Opus 4.6: Best reasoning quality, 200K context
- Gemini 3.1 Flash: 1M context, fast, cost-effective
- DeepSeek V3.2: 1/50 cost of GPT, 90% quality
"""

from collections.abc import AsyncGenerator

from app.core.config import settings

SYSTEM_PROMPT_RAG = """Você é o NotebrainAI, um assistente de inteligência documental.
Responda APENAS com base nos trechos fornecidos das fontes do utilizador.
Para cada afirmação, inclua citações no formato [N] referenciando o número da fonte.
Se não encontrar informação relevante nas fontes, diga claramente.
Responda em português (Portugal), de forma clara e estruturada."""


async def chat_with_sources(
    query: str,
    context_chunks: list[dict],
    source_map: dict[str, str],
) -> AsyncGenerator[dict, None]:
    """Stream a RAG response with inline citations.

    Args:
        query: User's question
        context_chunks: Retrieved chunks with source_id and text
        source_map: {source_id: filename} mapping for citations

    Yields:
        dicts with: type ("text"/"citation"/"done"), content, source info
    """
    # Build context with numbered sources
    context_parts = []
    citation_map: dict[int, dict] = {}

    for i, chunk in enumerate(context_chunks, 1):
        source_id = chunk["source_id"]
        filename = source_map.get(source_id, "Fonte desconhecida")
        context_parts.append(f"[{i}] (Fonte: {filename})\n{chunk['text']}")
        citation_map[i] = {
            "sourceId": source_id,
            "sourceFilename": filename,
            "text": chunk["text"][:200],
        }

    context = "\n\n---\n\n".join(context_parts)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_RAG},
        {
            "role": "user",
            "content": f"Fontes disponíveis:\n\n{context}\n\n---\n\nPergunta: {query}",
        },
    ]

    # Route to best available LLM
    if settings.anthropic_api_key:
        async for chunk in _stream_anthropic(messages):
            yield chunk
    elif settings.gemini_api_key:
        async for chunk in _stream_gemini(messages):
            yield chunk
    else:
        yield {
            "type": "text",
            "content": "Nenhuma API key de LLM configurada. Configure ANTHROPIC_API_KEY ou GEMINI_API_KEY no .env.",
        }

    # Send citation map at the end
    yield {"type": "citations", "citations": citation_map}
    yield {"type": "done"}


async def _stream_anthropic(messages: list[dict]) -> AsyncGenerator[dict, None]:
    """Stream from Claude API."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    system = messages[0]["content"]
    user_messages = [{"role": m["role"], "content": m["content"]} for m in messages[1:]]

    async with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system,
        messages=user_messages,
    ) as stream:
        async for text in stream.text_stream:
            yield {"type": "text", "content": text}


async def _stream_gemini(messages: list[dict]) -> AsyncGenerator[dict, None]:
    """Stream from Gemini API."""
    try:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)

        system = messages[0]["content"]
        user_msg = messages[1]["content"]

        response = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=user_msg,
            config=genai.types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=4096,
            ),
        )

        for chunk in response:
            if chunk.text:
                yield {"type": "text", "content": chunk.text}
    except ImportError:
        yield {
            "type": "text",
            "content": "google-genai não instalado. Execute: pip install google-genai",
        }
