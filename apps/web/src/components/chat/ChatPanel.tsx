"use client";

import { ArrowUp, Bookmark, Copy, Pin, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatMessage } from "@/stores/chat";
import { useChatStore } from "@/stores/chat";

function CitationBadge({
  index,
  sourceFilename,
  text,
}: {
  index: number;
  sourceFilename: string;
  text: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors mx-0.5">
          {index}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p className="text-xs font-medium mb-1">{sourceFilename}</p>
        <p className="text-xs text-muted-foreground line-clamp-3">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5"
            : "px-1"
        }`}
      >
        {/* Message content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {/* Inline citations */}
          {message.citations?.map((citation, i) => (
            <CitationBadge
              key={i}
              index={i + 1}
              sourceFilename={citation.sourceFilename}
              text={citation.text}
            />
          ))}
        </div>

        {/* Assistant actions */}
        {!isUser && (
          <div className="mt-2 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Pin className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Guardar na nota</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Boa resposta</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Má resposta</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  notebookName,
  sourceCount,
}: {
  notebookName: string;
  sourceCount: number;
}) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    // TODO: Send to API
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h2 className="text-sm font-semibold">Chat</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        {messages.length === 0 ? (
          /* Empty state - notebook info */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 rounded-lg bg-muted/50 p-3">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">{notebookName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {sourceCount} origens
            </p>
            <p className="mt-4 max-w-md text-center text-sm text-muted-foreground leading-relaxed">
              Faça perguntas sobre as suas fontes. O NotebrainAI irá analisar
              todos os documentos e responder com citações precisas.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-6 py-3">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Comece a escrever..."
            className="min-h-[44px] max-h-[120px] resize-none pr-20 text-sm"
            rows={1}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {sourceCount} origens
            </span>
            <Button
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
