"use client";

import {
  FileText,
  Headphones,
  Image,
  Monitor,
  Network,
  Presentation,
  Table,
  Trophy,
  Video,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGenerationStore } from "@/stores/generation";
import type { GenerationType } from "@/stores/generation";

import { GenerationCard } from "./GenerationCard";

interface StudioAction {
  type: GenerationType;
  label: string;
  icon: React.ElementType;
}

const studioActions: [StudioAction, StudioAction][] = [
  [
    { type: "audio", label: "Resumo de áudio", icon: Headphones },
    { type: "slides", label: "Apresentação de...", icon: Presentation },
  ],
  [
    { type: "video", label: "Resumo de vídeo", icon: Video },
    { type: "mindmap", label: "Mapa mental", icon: Network },
  ],
  [
    { type: "report", label: "Relatórios", icon: FileText },
    { type: "studycards", label: "Cartões de estudo", icon: Trophy },
  ],
  [
    { type: "quiz", label: "Questionário", icon: Monitor },
    { type: "infographic", label: "Infografia", icon: Image },
  ],
  [
    { type: "datatable", label: "Tabela de dados", icon: Table },
  ],
];

function StudioActionButton({
  action,
  onClick,
}: {
  action: StudioAction;
  onClick: (type: GenerationType) => void;
}) {
  const Icon = action.icon;
  return (
    <button
      onClick={() => onClick(action.type)}
      className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 hover:border-border"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{action.label}</span>
      <span className="ml-auto text-muted-foreground">›</span>
    </button>
  );
}

export function StudioPanel() {
  const jobs = useGenerationStore((s) => s.jobs);
  const activeJobs = jobs.filter(
    (j) => j.status === "queued" || j.status === "processing"
  );
  const completedJobs = jobs.filter(
    (j) => j.status === "completed" || j.status === "failed"
  );

  const handleStartGeneration = (type: GenerationType) => {
    // TODO: Open config dialog for this generation type
    console.log("Start generation:", type);
  };

  const handleCancel = (id: string) => {
    // TODO: Cancel via API
    console.log("Cancel:", id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Studio</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Generation Action Buttons (2-column grid like NotebookLM) */}
          {studioActions.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              {row.map((action) => (
                <StudioActionButton
                  key={action.type}
                  action={action}
                  onClick={handleStartGeneration}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Active Generations with Progress */}
        {activeJobs.length > 0 && (
          <div className="px-3 pb-3">
            <Separator className="mb-3" />
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <GenerationCard
                  key={job.id}
                  job={job}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Generations */}
        {completedJobs.length > 0 && (
          <div className="px-3 pb-3">
            <Separator className="mb-3" />
            <div className="space-y-2">
              {completedJobs.map((job) => (
                <GenerationCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Bottom action */}
      <div className="border-t p-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:border-border">
          + Adicionar nota
        </button>
      </div>
    </div>
  );
}
