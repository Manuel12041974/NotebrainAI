"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  Globe,
  GripVertical,
  Loader2,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

/* ─── Sortable Source Card ─── */

function SortableSourceCard({ source }: { source: Source }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: source.id });

  const toggleSource = useSourcesStore((s) => s.toggleSource);
  const removeSource = useSourcesStore((s) => s.removeSource);
  const renameSource = useSourcesStore((s) => s.renameSource);
  const setExpandedSource = useSourcesStore((s) => s.setExpandedSource);
  const expandedSourceId = useSourcesStore((s) => s.expandedSourceId);
  const isExpanded = expandedSourceId === source.id;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(source.filename || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = sourceIcons[source.type] || FileText;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    setDraftName(source.filename || "");
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const submitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== source.filename) renameSource(source.id, trimmed);
    setIsRenaming(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className={`flex w-full items-center gap-1 rounded-md px-1 py-1 text-sm transition-colors hover:bg-muted/50 ${
          isDragging ? "bg-muted/50 shadow-sm" : ""
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <Icon className="h-4 w-4 shrink-0 text-red-500" />

        {/* Name (or rename input) */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            className="min-w-0 flex-1 bg-transparent border border-primary/30 rounded px-1 text-sm outline-none focus:border-primary"
          />
        ) : (
          <button
            onClick={() => setExpandedSource(source.id)}
            className="min-w-0 flex-1 truncate text-left"
          >
            {source.filename || source.url || "Texto sem título"}
          </button>
        )}

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleRename} className="gap-2">
              <Pencil className="h-4 w-4" /> Mudar nome da fonte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => removeSource(source.id)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Remover fonte
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Checkbox */}
        {source.status === "processing" ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <button onClick={() => toggleSource(source.id)} className="shrink-0">
            <div
              className={`h-4 w-4 rounded-sm border transition-colors ${
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
          </button>
        )}
      </div>

      {/* Expanded source preview (Guia de fontes) */}
      {isExpanded && (
        <div className="ml-6 mr-1 mt-1 mb-2 rounded-lg border bg-card p-3 text-xs">
          <button
            onClick={() => setExpandedSource(null)}
            className="flex w-full items-center justify-between mb-2"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Guia de fontes
            </span>
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <p className="text-muted-foreground leading-relaxed">
            {source.summary ||
              "Este documento contém informações relevantes para o projeto. Clique para ver o conteúdo completo e a análise AI da fonte."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Deep Research Progress ─── */

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

/* ─── Source Panel ─── */

export function SourcePanel({ onAddSources }: { onAddSources?: () => void } = {}) {
  const sources = useSourcesStore((s) => s.sources);
  const selectAll = useSourcesStore((s) => s.selectAll);
  const toggleSelectAll = useSourcesStore((s) => s.toggleSelectAll);
  const reorderSources = useSourcesStore((s) => s.reorderSources);
  const researchJob = useSourcesStore((s) => s.researchJob);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sources.findIndex((s) => s.id === active.id);
    const newIndex = sources.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...sources];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    reorderSources(newOrder.map((s) => s.id));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Fontes</h2>
      </div>

      {/* Add sources */}
      <div className="px-3 pt-3">
        <Button variant="outline" className="w-full justify-center gap-2" size="sm" onClick={onAddSources}>
          <Plus className="h-4 w-4" />
          Adicionar fontes
        </Button>
      </div>

      {/* Web search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquise novas fontes na Web" className="pl-9 text-sm" />
        </div>
        <div className="mt-2 flex gap-2">
          <span className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs cursor-pointer hover:bg-muted/50">
            <Globe className="h-3 w-3" /> Web <ChevronDown className="h-3 w-3" />
          </span>
          <span className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs cursor-pointer hover:bg-muted/50">
            ⚡ Investigação rápida <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Deep Research */}
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

      {/* Source list with drag-and-drop */}
      <ScrollArea className="flex-1 px-1 pt-1">
        <div className="px-2 pb-3">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Adicione fontes para começar</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                PDF, documentos, websites, YouTube
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sources.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sources.map((source) => (
                  <SortableSourceCard key={source.id} source={source} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
