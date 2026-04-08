"use client";

import { useCallback, useRef } from "react";

import { askQuestion, type ChatStreamEvent } from "@/lib/api";
import type { Citation } from "@/stores/chat";
import { useChatStore } from "@/stores/chat";

export function useChat(notebookId: string) {
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (query: string, sourceIds?: string[]) => {
      if (isStreaming) return;
      setStreaming(true);

      // Add user message
      const userMsgId = crypto.randomUUID();
      addMessage({
        id: userMsgId,
        role: "user",
        content: query,
        savedAsNote: false,
        createdAt: new Date(),
      });

      // Add empty assistant message
      const assistantMsgId = crypto.randomUUID();
      addMessage({
        id: assistantMsgId,
        role: "assistant",
        content: "",
        savedAsNote: false,
        createdAt: new Date(),
      });

      let fullContent = "";
      let citations: Citation[] = [];

      try {
        for await (const event of askQuestion(notebookId, query, sourceIds)) {
          if (event.type === "text" && event.content) {
            fullContent += event.content;
            updateMessage(assistantMsgId, { content: fullContent });
          } else if (event.type === "citations" && event.citations) {
            citations = Object.values(event.citations).map((c) => ({
              sourceId: c.sourceId,
              sourceFilename: c.sourceFilename,
              text: c.text,
            }));
            updateMessage(assistantMsgId, { citations });
          } else if (event.type === "error") {
            updateMessage(assistantMsgId, {
              content: fullContent || `Erro: ${event.error}`,
            });
          }
        }
      } catch (err) {
        updateMessage(assistantMsgId, {
          content: fullContent || "Erro de ligação ao servidor.",
        });
      } finally {
        setStreaming(false);
      }
    },
    [notebookId, isStreaming, addMessage, updateMessage, setStreaming]
  );

  return { sendMessage, isStreaming };
}
