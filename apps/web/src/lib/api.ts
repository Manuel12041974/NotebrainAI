/**
 * API client for NotebrainAI backend.
 * All endpoints proxy through Next.js API routes or connect directly to FastAPI.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ─── Sources ─── */

export async function uploadSource(notebookId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/sources/${notebookId}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function listSources(notebookId: string) {
  const res = await fetch(`${API_BASE}/sources/${notebookId}`);
  if (!res.ok) throw new Error(`Failed to list sources: ${res.statusText}`);
  return res.json();
}

export async function deleteSource(sourceId: string) {
  const res = await fetch(`${API_BASE}/sources/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete source: ${res.statusText}`);
  return res.json();
}

/* ─── Chat (SSE Streaming) ─── */

export interface ChatStreamEvent {
  type: "text" | "citations" | "sources" | "done" | "error";
  content?: string;
  citations?: Record<string, { sourceId: string; sourceFilename: string; text: string }>;
  chunksRetrieved?: number;
  sourcesUsed?: string[];
  error?: string;
}

export async function* askQuestion(
  notebookId: string,
  query: string,
  sourceIds?: string[]
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${API_BASE}/chat/${notebookId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, source_ids: sourceIds }),
  });

  if (!res.ok) {
    yield { type: "error", error: `Chat failed: ${res.statusText}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        try {
          const parsed = JSON.parse(data);
          if (currentEvent === "text") {
            yield { type: "text", content: parsed.content };
          } else if (currentEvent === "citations") {
            yield { type: "citations", citations: parsed.citations };
          } else if (currentEvent === "sources") {
            yield {
              type: "sources",
              chunksRetrieved: parsed.chunks_retrieved,
              sourcesUsed: parsed.sources_used,
            };
          } else if (currentEvent === "done") {
            yield { type: "done" };
          } else if (currentEvent === "error") {
            yield { type: "error", error: parsed.error };
          }
        } catch {
          // Ignore malformed JSON
        }
        currentEvent = "";
      }
    }
  }
}

/* ─── Health ─── */

export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
