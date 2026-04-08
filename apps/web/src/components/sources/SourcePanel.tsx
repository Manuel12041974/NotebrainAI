"use client";

import {
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Globe,
  Loader2,
  PlayCircle,
  Plus,
  Search,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ResearchJob, Source } from "@/stores/sources";
import { useSourcesStore } from "@/stores/sources";

const sourceIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  url: Globe,
  youtube: PlayCircle,
  text: FileText,
  image: FileText,
  audio: FileText,
};

function SourceCard({ source }: { source: Source }) {
  const toggleSource = useSourcesStore((s) => s.toggleSource);
  const Icon = sourceIcons[source.type] || FileText;

  return (
    <button
      onClick={() => toggleSource(source.id)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
    >
      <Icon className="h-4 w-4 shrink-0 text-red-500" />
      <span className="min-w-0 flex-1 truncate">
        {source.filename || source.url || "Texto sem título"}
      </span>
      {source.status === "processing" ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <div
          className={`h-4 w-4 shrink-0 rounded-sm border transition-colors ${
            source.selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30"
          }`}
        >
          {source.selected && (
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <path
                d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}

function DeepResearchProgress({ job }: { job: ResearchJob }) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Deep Research em progresso
      </div>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
        &quot;{job.query}&quot;
      </p>
      <div className="mt-3 space-y-1.5">
        {job.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {step.status === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : step.status === "active" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
            <span
              className={
                step.status === "completed"
                  ? "text-muted-foreground line-through"
                  : step.status === "active"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/60"
              }
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
        ⚠️ Não saia desta página
      </p>
    </div>
  );
}

export function SourcePanel() {
  const sources = useSourcesStore((s) => s.sources);
  const selectAll = useSourcesStore((s) => s.selectAll);
  const toggleSelectAll = useSourcesStore((s) => s.toggleSelectAll);
  const researchJob = useSourcesStore((s) => s.researchJob);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Fontes</h2>
      </div>

      {/* Add sources button */}
      <div className="px-3 pt-3">
        <Button variant="outline" className="w-full justify-center gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Adicionar fontes
        </Button>
      </div>

      {/* Web search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquise novas fontes na Web"
            className="pl-9 text-sm"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <Badge variant="outline" className="gap-1 text-xs cursor-pointer hover:bg-muted/50">
            <Globe className="h-3 w-3" /> Web <ChevronDown className="h-3 w-3" />
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs cursor-pointer hover:bg-muted/50">
            ⚡ Investigação rápida <ChevronDown className="h-3 w-3" />
          </Badge>
        </div>
      </div>

      {/* Deep Research Progress */}
      {researchJob && (
        <div className="px-3 pt-3">
          <DeepResearchProgress job={researchJob} />
        </div>
      )}

      <Separator className="mt-3" />

      {/* Select all */}
      <div className="px-3 pt-2">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <div
            className={`h-3.5 w-3.5 rounded-sm border transition-colors ${
              selectAll
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30"
            }`}
          >
            {selectAll && (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                <path
                  d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          Selecionar todas as fontes
        </button>
      </div>

      {/* Source list */}
      <ScrollArea className="flex-1 px-1 pt-1">
        <div className="px-2 pb-3">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Adicione fontes para começar
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                PDF, documentos, websites, YouTube
              </p>
            </div>
          ) : (
            sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
